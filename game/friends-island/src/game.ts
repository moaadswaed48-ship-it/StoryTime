// Friends Island: the game object. Owns the scene, render path, world, herd, title camera, audio and FX, and runs
// one frame. Creatures are grown from designs (src/creature), the island lives in src/world, playing in src/play.
import * as THREE from 'three';
import { Mixer } from './audio/mixer';
import { config, type QualityName } from './config';
import { time } from './core/time';
import { Batches } from './creature/batches';
import { Creature as CreatureClass, type Creature } from './creature/creature';
import { type Entry, Herd } from './creature/herd';
import { MeshPool } from './creature/mesh-pool';
import { FX } from './fx';
import { GAME } from './game.config';
import { t } from './i18n';
import { SKIN } from './look/creature-skin';
import { CREATURE_FINISH, toonMaterial, U } from './look/materials';
import { missions, PLAYABLE } from './missions';
import { Play } from './play/play';
import { createRenderPath } from './render';
import type { RenderPath } from './render/types';
import { save, storeThumb, thumbs } from './save';
import { World } from './world/world';

export type Phase = 'loading' | 'title' | 'playing';
const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
const $ = (id: string) => document.getElementById(id) as HTMLElement;

export interface GameEvent {
	t: number;
	type: string;
	[k: string]: unknown;
}

/** The slow orbit behind the title, and the point the sun's shadow box follows in play. */
class CameraRig {
	target = new THREE.Vector3(2, 3, 4);
	yaw = 0.6;
	pitch = 0.42;
	dist = 14;
	constructor(
		readonly camera: THREE.PerspectiveCamera,
		readonly world: World,
	) {}
	update() {
		const cp = Math.cos(this.pitch);
		const cam = this.camera;
		cam.position.set(this.target.x + Math.sin(this.yaw) * cp * this.dist, this.target.y + Math.sin(this.pitch) * this.dist, this.target.z + Math.cos(this.yaw) * cp * this.dist);
		const g = this.world.ground(cam.position.x, cam.position.z) + 0.35;
		if (cam.position.y < g) cam.position.y = g;
		cam.lookAt(this.target);
		cam.updateMatrixWorld();
	}
}

export class Game {
	phase: Phase = 'loading';
	readonly scene = new THREE.Scene();
	readonly camera = new THREE.PerspectiveCamera(GAME.fov, innerWidth / innerHeight, 0.1, 1500);
	readonly time = time;
	readonly mixer = new Mixer();
	readonly events: GameEvent[] = [];
	readonly marks: Record<string, number> = {};
	path!: RenderPath;
	world!: World;
	batches!: Batches;
	pool!: MeshPool;
	herd!: Herd;
	fx!: FX;
	rig!: CameraRig;
	play!: Play;
	bodyMat!: THREE.Material;
	quality: QualityName = 'high';
	frameTimes = new Float32Array(600);
	cpuTimes = new Float32Array(600);
	frameCursor = 0;
	frames = 0;
	errors: string[] = [];
	stepSounds = 0;
	private titleT = 0;
	private autoQ = { samples: [] as number[], acc: 0, grace: 4 };
	private portraitQueue: Array<{ e: Entry; id: string }> = [];
	private portraitRT: THREE.WebGLRenderTarget | null = null;
	private veil = $('veil');
	/** pixels the picture is slid by, so the creature stays in view beside the "make your creature" sheet */
	private shift = { x: 0, y: 0 };

	constructor(readonly canvas: HTMLCanvasElement) {}

	mark(name: string) {
		this.marks[name] = Math.round(performance.now());
	}

	/** the loading bar on the title card */
	progress(p: number, text = t.loading) {
		$('veil-status').textContent = text;
		$('veil-bar').style.transform = `scaleX(${p})`;
	}

	async boot() {
		this.mark('boot');
		this.progress(0.08);
		this.path = await createRenderPath(this.canvas, this.scene, this.camera);
		this.mark('renderer');
		this.resize();
		new ResizeObserver(() => this.resize()).observe(this.canvas);
		// a bright, sunny grade: near-neutral white balance, gentle S-curve, warm halation
		Object.assign(this.path.grade, {
			exposure: 1.02,
			whiteBalance: [1.02, 1.0, 0.98],
			saturation: 1.12,
			splitHighlights: [0.025, 0.018, -0.01],
			splitShadows: [-0.012, 0.004, 0.03],
			curve: 0.22,
			vignette: 0.16,
			aberration: 0.0005,
		});
		Object.assign(this.path.grade.bloom, { enabled: true, strength: 0.14, radius: 0.6, threshold: 0.88, tint: [1, 0.9, 0.75] });

		this.progress(0.25);
		await nextFrame();
		this.world = new World();
		this.scene.add(this.world.root);
		this.scene.fog = new THREE.Fog(new THREE.Color(0.7, 0.86, 0.98), 70, 260);
		this.mark('world');

		this.batches = new Batches();
		this.scene.add(this.batches.root);
		this.bodyMat = toonMaterial({ vertexColors: true }, { key: 'body', ...CREATURE_FINISH, ...SKIN });
		this.pool = new MeshPool();
		this.herd = new Herd(this.world, this.pool, this.batches, this.bodyMat, config.seed);
		this.scene.add(this.herd.root);
		this.fx = new FX(this.path);
		this.scene.add(this.fx.root);
		this.rig = new CameraRig(this.camera, this.world);
		this.herd.onHatch = (e) => {
			const c = e.c;
			const at = e.eggPos.clone().setY(e.eggPos.y + c.plan.R);
			this.fx.hatch(at, c.plan.size, '#ffe9a8');
			this.mixer.play('pop', { at, volume: 0.8, pitch: 1.2 / Math.sqrt(c.plan.size) });
			this.events.push({ t: time.elapsed, type: 'hatched' });
		};

		// the island's creatures
		this.progress(0.4);
		this.play = new Play(this);
		const first = this.play.setup();
		let done = 0;
		await Promise.all(first.map((p) => p.then(() => this.progress(0.4 + (0.35 * ++done) / Math.max(1, first.length)))));
		this.mark('herd');
		// settle a frame so meshes are attached and legs are planted
		this.herd.update(1 / 60, this.rig.target, this.camera.position);

		// phones and tablets start on the light tier (the picture only ever steps down from where it starts)
		this.setQuality(config.quality === 'auto' ? (config.touch ? 'low' : 'high') : config.quality);

		this.progress(0.82);
		void this.mixer.preload();
		this.placeTitleCamera(0);
		await this.warmup();
		this.mark('compiled');

		this.phase = 'title';
		this.veil.classList.add('ready');
		this.wireInput();
		if (config.debug) document.body.classList.add('debug');
	}

	/** Compile every material behind the title: draw the effects and batches once from several views. */
	private async warmup() {
		const at = new THREE.Vector3(2, this.world.ground(2, 4) + 1, 4);
		this.fx.hatch(at, 1, '#ffd23f');
		this.fx.love(at);
		this.batches.begin();
		this.herd.draw(this.camera);
		this.batches.end();
		this.world.beginContacts(at);
		this.herd.contacts();
		this.world.renderContacts(this.path.renderer);
		this.fx.update(0.016, this.camera);
		await this.path.compile(this.scene, this.camera);
		const saved: THREE.Object3D[] = [];
		this.scene.traverse((o) => {
			if (o.frustumCulled) {
				o.frustumCulled = false;
				saved.push(o);
			}
		});
		for (let i = 0; i < 4; i++) {
			this.camera.position.set(2 + Math.sin(i * 1.7) * 18, 8, 4 + Math.cos(i * 1.7) * 18);
			this.camera.lookAt(2, 2, 4);
			this.camera.updateMatrixWorld();
			this.path.render(0.016);
			await nextFrame();
		}
		for (const o of saved) o.frustumCulled = true;
		this.fx.update(5, this.camera);
	}

	setQuality(q: QualityName) {
		this.quality = q;
		const size = { low: 1024, medium: 2048, high: 4096 }[q];
		if (this.world.sun.shadow.mapSize.x !== size) {
			this.world.sun.shadow.mapSize.setScalar(size);
			this.world.sun.shadow.map?.dispose();
			(this.world.sun.shadow as unknown as { map: null }).map = null;
		}
		this.path.setQuality(q);
		this.world.grass.mesh.geometry.setDrawRange(0, q === 'low' ? 60000 * 3 : Number.POSITIVE_INFINITY);
		this.resize();
		this.events.push({ t: time.elapsed, type: 'quality', q });
	}

	resize() {
		if (!this.path) return;
		const w = this.canvas.clientWidth || innerWidth,
			h = this.canvas.clientHeight || innerHeight;
		const tier = { low: 1, medium: 1.25, high: 1.5 }[this.quality];
		this.path.setSize(w, h, Math.min(devicePixelRatio || 1, tier));
		this.camera.aspect = w / h;
		if (this.shift.x || this.shift.y) this.camera.setViewOffset(w, h, this.shift.x, this.shift.y, w, h);
		else this.camera.clearViewOffset();
		this.camera.updateProjectionMatrix();
	}

	/** slide the picture (x to the left, y upward, in pixels); 0, 0 puts it back */
	viewShift(x: number, y: number) {
		this.shift.x = x;
		this.shift.y = y;
		this.resize();
	}

	start() {
		if (this.phase !== 'title') return;
		this.mixer.unlock();
		this.applySound();
		this.mixer.play('pop', { bus: 'ui', volume: 0.6 });
		this.canvas.focus();
		this.phase = 'playing';
		this.veil.classList.add('gone');
		time.resync();
		this.mark('play');
		this.events.push({ t: time.elapsed, type: 'start' });
		this.play.start();
	}

	/** the sound switch in the menu */
	applySound() {
		this.mixer.volumes.master = save.sound ? 0.8 : 0;
		this.mixer.applyVolumes();
	}

	/** Tell the page the game sits in (the StoryTime site) how far the child is. Same origin only. */
	report() {
		if (!config.embed || parent === window) return;
		try {
			parent.postMessage({ source: 'friends-island', type: 'progress', done: missions.count(), total: PLAYABLE.length, friends: save.friends.length }, location.origin);
		} catch {}
	}

	/** "Leave the game" in the menu: the site closes the game */
	leave() {
		if (parent === window) return;
		try {
			parent.postMessage({ source: 'friends-island', type: 'exit' }, location.origin);
		} catch {}
	}

	/** A creature's voice: squeaks for small ones, quacks for medium, croaks for big, pitched by size. */
	voice(c: Creature, volume = 0.7) {
		const S = c.plan.size;
		const name = S < 0.8 ? 'squeak' : S < 1.6 ? 'quack' : 'croak';
		const base = name === 'squeak' ? 0.85 / Math.sqrt(S) : name === 'quack' ? 1.25 / Math.sqrt(S) : 1.3 / Math.sqrt(S);
		this.mixer.play(name, { at: c.headPos, volume, pitch: Math.min(2.2, Math.max(0.55, base)) });
	}

	onStep(c: Creature, p: THREE.Vector3, s: number) {
		// soft taps for close creatures (bounded voices), dust for big feet and hops
		if (this.phase !== 'playing') return;
		if (c.plan.size > 1.4 || c.plan.gait.hop) this.fx.dust(p, Math.min(1, s * c.plan.size * 0.6), c.plan.size);
		if (this.stepSounds < 6 && p.distanceTo(this.camera.position) < 12) {
			this.stepSounds++;
			this.mixer.play('step', { at: p, volume: Math.min(0.5, 0.1 + c.plan.size * 0.18), pitch: 1.3 / Math.sqrt(c.plan.size), pitchVar: 0.12 });
		}
	}

	// ------------------------------------------------------------------ input

	private wireInput() {
		const cv = this.canvas;
		// the whole title card is the button: any tap on it begins
		this.veil.addEventListener('click', () => this.start());
		addEventListener('keydown', (e) => {
			if (this.phase === 'title' && (e.code === 'Enter' || e.code === 'Space' || e.code === 'NumpadEnter')) {
				e.preventDefault();
				this.start();
			}
			if (e.code === 'F2') this.cycleQuality();
		});
		cv.addEventListener(
			'wheel',
			(e) => {
				e.preventDefault();
				if (this.phase === 'playing') this.play.cam.zoom = Math.max(0.55, Math.min(2.4, this.play.cam.zoom * Math.exp(e.deltaY * 0.0012)));
			},
			{ passive: false },
		);
		// a tab left in the background comes back without a jump in time
		document.addEventListener('visibilitychange', () => time.resync());
	}

	cycleQuality() {
		this.autoQ.grace = 1e9;
		const order: QualityName[] = ['high', 'medium', 'low'];
		this.setQuality(order[(order.indexOf(this.quality) + 1) % 3]);
	}

	// ------------------------------------------------------------------ frame

	frame() {
		const t0 = performance.now();
		time.tick();
		const realDt = time.realDt;
		const dt = Math.min(1 / 20, time.dt);
		this.stepSounds = Math.max(0, this.stepSounds - realDt * 12);
		U.uTime.value += dt;

		if (this.phase === 'title') {
			this.titleT += realDt;
			this.placeTitleCamera(this.titleT);
		} else if (this.phase === 'playing') this.play.update(dt, realDt);
		// the island holds still while a panel is open
		if (!(this.phase === 'playing' && this.play.paused)) this.herd.update(dt, this.rig.target, this.camera.position);

		this.renderView(dt);
		this.portraits();
		this.autoQuality(realDt);
		this.frames++;
		const ms = performance.now() - t0;
		this.cpuTimes[this.frameCursor % this.cpuTimes.length] = ms;
		this.frameTimes[this.frameCursor++ % this.frameTimes.length] = realDt * 1000;
		if (config.debug && this.frames % 15 === 0) this.debugText(ms);
	}

	/** Contacts, sun box, batches, effects and the render (no simulation). */
	renderView(dt: number) {
		// contact map and the sun's shadow box follow the focus
		const focus = this.phase === 'title' ? new THREE.Vector3(2, 0, 4) : this.rig.target;
		this.world.fitSun(focus, Math.max(26, Math.min(60, this.rig.dist * 1.6)));
		// draw first (it decides which creatures are visible), then only drawn creatures write contacts
		this.batches.begin();
		this.herd.draw(this.camera);
		this.play.pantry.draw(this.batches, this.camera);
		this.play.stars.draw(this.batches, U.uTime.value);
		this.batches.end();
		this.world.beginContacts(focus);
		this.herd.contacts();
		this.play.contacts();
		this.world.renderContacts(this.path.renderer);
		U.uFocus.value.set(this.camera.position.x * 0.5 + focus.x * 0.5, this.camera.position.z * 0.5 + focus.z * 0.5);
		this.fx.update(dt, this.camera);
		this.mixer.updateListener(this.camera);
		this.path.render(dt);
	}

	private placeTitleCamera(tt: number) {
		this.rig.target.set(2, this.world.ground(2, 4) + 0.8, 4);
		this.rig.yaw = 0.9 + tt * 0.06;
		this.rig.pitch = 0.32;
		this.rig.dist = 15;
		this.rig.update();
	}

	private autoQuality(realDt: number) {
		const q = this.autoQ;
		if (config.quality !== 'auto' || this.phase !== 'playing') return;
		if (q.grace > 0) {
			q.grace -= realDt;
			return;
		}
		q.samples.push(realDt * 1000);
		q.acc += realDt;
		if (q.acc < 2) return;
		const s = q.samples.sort((a, b) => a - b);
		const p90 = s[Math.floor(s.length * 0.9)];
		q.samples = [];
		q.acc = 0;
		if (p90 > 19 && this.quality !== 'low') {
			this.setQuality(this.quality === 'high' ? 'medium' : 'low');
			q.grace = 3;
		}
	}

	/** ask for a small picture of a creature for the friends book (once per kind) */
	portrait(e: Entry, id: string) {
		if (thumbs[id] || this.portraitQueue.some((p) => p.id === id)) return;
		this.portraitQueue.push({ e, id });
	}

	/** Friends-book pictures: render the live scene from a portrait camera into a small target, once per kind. */
	private portraits() {
		if (!this.portraitQueue.length) return;
		const { e, id } = this.portraitQueue[0];
		if (!this.herd.entries.includes(e)) {
			this.portraitQueue.shift();
			return;
		}
		const c = e.c;
		if (c.scaleIn < 1 || !c.mesh) return;
		this.portraitQueue.shift();
		// rendered at 2x without MSAA (reading back a multisampled target returns the previous resolve), then halved
		const S = 256;
		if (!this.portraitRT) {
			this.portraitRT = new THREE.WebGLRenderTarget(S, S);
			this.portraitRT.texture.colorSpace = THREE.SRGBColorSpace;
		}
		const cam = new THREE.PerspectiveCamera(35, 1, 0.02, 400);
		const fwd = new THREE.Vector3(Math.sin(c.yaw), 0, Math.cos(c.yaw));
		const side = new THREE.Vector3(fwd.z, 0, -fwd.x);
		const r = Math.max(c.plan.radius, c.plan.top - c.pos.y + 0.1, 0.25);
		const center = c.bodyPos.clone();
		center.y = c.pos.y + c.plan.top * 0.5;
		cam.position.copy(center).addScaledVector(fwd, r * 2.5).addScaledVector(side, r * 1.3).add(new THREE.Vector3(0, r * 1.3 + 0.15, 0));
		cam.lookAt(center);
		cam.updateMatrixWorld();
		const R = this.path.renderer as THREE.WebGLRenderer;
		// push the fog away rather than removing it (removing it would recompile every material: a 0.5 s hitch)
		const fog = this.scene.fog as THREE.Fog;
		const [fn, ff] = [fog.near, fog.far];
		fog.near = 1e4;
		fog.far = 2e4;
		this.world.grass.mesh.visible = false;
		// only the subject: other bodies hidden, the shared batches rebuilt with just this creature
		const hidden: THREE.Object3D[] = [];
		for (const m of this.herd.root.children)
			if (m !== c.mesh && m.visible) {
				m.visible = false;
				hidden.push(m);
			}
		this.fx.root.visible = false;
		CreatureClass.view.copy(cam.position);
		this.batches.begin();
		c.draw(this.batches);
		this.batches.end();
		R.setRenderTarget(this.portraitRT);
		// the post chain turns autoClear off; clear colour and depth ourselves or every portrait shows the first
		R.clear(true, true, true);
		R.render(this.scene, cam);
		const px = new Uint8Array(S * S * 4);
		R.readRenderTargetPixels(this.portraitRT, 0, 0, S, S, px);
		R.setRenderTarget(null);
		fog.near = fn;
		fog.far = ff;
		this.world.grass.mesh.visible = true;
		for (const m of hidden) m.visible = true;
		this.fx.root.visible = true;
		this.batches.begin();
		this.herd.draw(this.camera);
		this.batches.end();
		const cv = document.createElement('canvas');
		cv.width = cv.height = S;
		const g = cv.getContext('2d')!;
		const img = g.createImageData(S, S);
		for (let y = 0; y < S; y++) img.data.set(px.subarray((S - 1 - y) * S * 4, (S - y) * S * 4), y * S * 4);
		g.putImageData(img, 0, 0);
		const half = document.createElement('canvas');
		half.width = half.height = S / 2;
		const hg = half.getContext('2d')!;
		hg.imageSmoothingQuality = 'high';
		hg.drawImage(cv, 0, 0, S / 2, S / 2);
		try {
			storeThumb(id, half.toDataURL('image/jpeg', 0.82));
		} catch {}
	}

	private debugText(cpuMs: number) {
		const s = this.path.stats();
		const ft = this.perf();
		$('debug').textContent = `${this.path.backend}\nquality ${this.quality}\nfps ${ft.fps.toFixed(0)}  p95 ${ft.p95.toFixed(1)} ms\ncpu ${cpuMs.toFixed(2)} ms\ncalls ${s.calls}  tris ${s.triangles}\ncreatures ${this.herd.entries.length}`;
	}

	perf() {
		const n = Math.min(this.frames, this.frameTimes.length);
		const arr = Array.from(this.frameTimes.subarray(0, n)).sort((a, b) => a - b);
		const avg = arr.reduce((a, b) => a + b, 0) / Math.max(1, n);
		return { fps: avg > 0 ? 1000 / avg : 0, p50: arr[Math.floor(n * 0.5)] ?? 0, p95: arr[Math.floor(n * 0.95)] ?? 0 };
	}

	/** what tests read */
	state() {
		return {
			phase: this.phase,
			frame: this.frames,
			time: +time.elapsed.toFixed(3),
			renderer: this.path?.backend,
			quality: this.quality,
			creatures: this.herd?.entries.length ?? 0,
			audio: { state: this.mixer.state, played: this.mixer.played },
			perf: this.perf(),
			marks: this.marks,
			errors: this.errors.length,
			play: this.play?.active ? this.play.snapshot() : null,
		};
	}
}
