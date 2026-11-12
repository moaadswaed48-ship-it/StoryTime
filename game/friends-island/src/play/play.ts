// Play: you are the creature. Owns the island's life (the kinds at their nests, the gentle giant, fruit, hidden
// stars, the light of the day), your creature (walking, jumping, the four hello moves), the friends walking with
// you, saying hello, the missions, and the HUD. Nothing here can be lost, hurt or failed.
import * as THREE from 'three';
import { time } from '../core/time';
import { planFromCode } from '../creature/codes';
import { linearToHex } from '../creature/color';
import type { Game } from '../game';
import { fill, t } from '../i18n';
import { FRUIT_GOAL, KINDS, missions } from '../missions';
import { save, store } from '../save';
import { SOCIAL, type SocialId } from './abilities';
import { Actor } from './actors';
import { think } from './ai';
import { ThirdPersonCamera } from './camera';
import { EncounterRun } from './encounter';
import { Hud } from './hud';
import { PlayInput } from './input';
import { DayNight, findSpot, type Food, makeNest, type Nest, Pantry, Stars } from './island';
import { ALL_SPECIES, GIANT, lookCode, memberCode, type Species } from './species';

const flat = (a: THREE.Vector3, b: THREE.Vector3) => Math.hypot(a.x - b.x, a.z - b.z);
/** where the three hidden stars are tucked away: one not far from home, two in far corners */
const STAR_SPOTS: Array<[number, number]> = [
	[14, 30],
	[-36, -4],
	[7, -36],
];
const PACK_MAX = 2;

export interface Prompt {
	text: string;
	what: 'greet' | 'join';
	act: () => void;
}

export class Play {
	readonly input: PlayInput;
	readonly cam: ThirdPersonCamera;
	readonly hud: Hud;
	readonly day: DayNight;
	readonly pantry: Pantry;
	stars!: Stars;
	readonly actors: Actor[] = [];
	readonly nests = new Map<string, Nest>();
	/** species ids that are friends */
	readonly allied = new Set<string>();
	readonly pack: Actor[] = [];
	readonly encounter: { active: EncounterRun | null } = { active: null };
	player!: Actor;
	giant: Actor | null = null;
	playerNest!: Nest;
	active = false;
	paused = false;
	lastMove: { move: SocialId; at: number } | null = null;
	/** where a tap asked the creature to go (and whom to say hello to on arrival) */
	private goal: { x: number; z: number; actor: Actor | null; t: number } | null = null;
	/** the first minutes: the egg waits for a tap, then the creature gets its name */
	private stage: 'egg' | 'hatching' | 'naming' | 'free' = 'egg';
	private eggT = 0;
	private eatCd = 0;
	private meetT = 0;
	private leaveT = 0;
	private coachT = 0;
	private moved = 0;
	private rand: () => number;
	private tmp = new THREE.Vector3();
	private caster = new THREE.Raycaster();
	stats = { eaten: 0, befriended: 0, encounters: 0, stars: 0, taps: 0 };

	constructor(readonly game: Game) {
		this.input = new PlayInput(game.canvas);
		this.cam = new ThirdPersonCamera(game.camera, game.world, game.camera.fov);
		this.day = new DayNight(game.scene, game.path);
		this.pantry = new Pantry(game.world);
		this.hud = new Hud(this);
		let s = 20261027;
		this.rand = () => {
			s = (s * 1664525 + 1013904223) >>> 0;
			return s / 4294967296;
		};
	}

	/** hatched, named and free to walk about */
	get ready() {
		return this.stage === 'free';
	}
	get herd() {
		return this.game.herd;
	}
	get world() {
		return this.game.world;
	}

	/** Lay out the island: nests, the kinds, the giant, the stars and your egg. Returns the mesh promises to wait on. */
	setup(): Promise<unknown>[] {
		const g = this.game;
		this.herd.ownMaterials = true;
		const waits: Promise<unknown>[] = [];
		const nestAt = (id: string, x: number, z: number, r: number, color: [number, number, number], eggs: number) => {
			const p = findSpot(this.world, x, z, r + 1.5, this.rand);
			const n = makeNest(this.world, id, p.x, p.z, r, color, eggs);
			this.world.root.add(n.mesh);
			this.nests.set(id, n);
			return n;
		};
		this.playerNest = nestAt('player', 4, 9, 0.9, [1, 0.9, 0.6], 0);
		for (const sp of ALL_SPECIES) {
			const plan = planFromCode(memberCode(sp));
			const nest = nestAt(sp.id, sp.nest[0], sp.nest[1], Math.max(0.6, plan.R * 2.2), plan.palette.accent, sp === GIANT ? 2 : 3);
			for (let i = 0; i < sp.count; i++) {
				const young = sp !== GIANT && i === sp.count - 1;
				const a = this.spawnMember(sp, nest, young);
				waits.push(g.pool.geometry(a.c.plan.code));
			}
		}
		for (const id of save.friends) this.allied.add(id);
		this.stars = new Stars(this.world, STAR_SPOTS, save.stars, this.rand);
		// the first fruit is a few steps from the nest
		this.pantry.scatter(this.playerNest.x, this.playerNest.z, 4, 3.4);
		this.spawnPlayer(lookCode(save.look), true);
		waits.push(g.pool.geometry(this.player.c.plan.code));
		return waits;
	}

	spawnMember(sp: Species, nest: Nest, young: boolean) {
		const code = memberCode(sp, young ? 0.72 : 1);
		const p = this.world.randomLand(this.rand, new THREE.Vector3(nest.x, 0, nest.z), 3 + nest.r * 2 + sp.range * 0.25);
		const e = this.herd.spawn(planFromCode(code), p.x, p.z, { instant: true });
		e.brain.state = 'scripted';
		const a = new Actor(e, sp, nest, 'wild');
		a.young = young;
		this.actors.push(a);
		this.wire(a);
		if (sp === GIANT) this.giant = a;
		return a;
	}

	private wire(a: Actor) {
		a.c.onStep = (c, p, s) => {
			if (a.sp === GIANT) {
				// the giant's steps are felt, softly, when it walks by
				const d = p.distanceTo(this.player.c.pos);
				if (d < 22) this.cam.shake(0.035 * (1 - d / 22));
				if (d < 26 && Math.random() < 0.5) this.game.mixer.play('thump', { at: p, volume: 0.3 * (1 - d / 26), pitch: 0.55 });
				this.game.fx.dust(p, 0.7, c.plan.size);
			} else this.game.onStep(c, p, s);
		};
	}

	spawnPlayer(code: string, egg: boolean) {
		const n = this.playerNest;
		const old = this.player;
		const yaw = old ? old.c.yaw : Math.PI * 0.9;
		const x = old && !egg ? old.c.pos.x : n.x + 0.9 + n.r,
			z = old && !egg ? old.c.pos.z : n.z;
		if (old) {
			this.herd.remove(old.c);
			this.actors.splice(this.actors.indexOf(old), 1);
		}
		const e = this.herd.spawn(planFromCode(code), x, z, { instant: false, yaw });
		// the egg waits (in the nest the first time, on the spot when the creature is remade)
		e.egg = 1e9;
		if (egg) {
			e.eggPos.set(n.x, this.world.ground(n.x, n.z) + n.r * 0.15, n.z);
			e.c.place(n.x, n.z, yaw);
		}
		e.brain.state = 'scripted';
		const a = new Actor(e, null, n, 'player');
		a.state = 'player';
		this.actors.push(a);
		this.player = a;
		this.wire(a);
		// quick on two legs; many-legged bodies turn at their own pace (fast spins fold their knees)
		const P0 = a.c.plan;
		a.c.turnBoost = P0.legs.length <= 2 ? 1.4 : P0.legs.length <= 4 ? 1.1 : 1;
		if (this.active) this.cam.snap(a.c);
		return a;
	}

	/** the creature was changed in "make your creature": the new body pops out where the old one stood */
	relook() {
		const yaw = this.player.c.yaw;
		this.spawnPlayer(lookCode(save.look), false);
		this.player.e.egg = 0.5;
		this.player.c.yaw = yaw;
		this.goal = null;
		this.faceCamera();
		this.emit('relook', {});
	}

	/** turn the view to the creature's face (while it is being named or remade) */
	faceCamera() {
		this.cam.yaw = this.player.c.yaw + 0.55;
		this.cam.pitch = 0.28;
		this.cam.zoom = 0.85;
	}

	start() {
		this.active = true;
		this.input.enabled = true;
		const back = save.hatched && !!save.name;
		this.stage = back ? 'hatching' : 'egg';
		this.player.e.egg = back ? 0.9 : 1.2;
		this.cam.snap(this.player.c);
		this.cam.yaw = Math.PI * 0.15;
		this.cam.pitch = 0.42;
		this.hud.show(true);
		this.game.applySound();
		if (!back) this.hud.coach(t.coach.egg);
		this.progress(false);
	}

	// ------------------------------------------------------------------ helpers for brains and the HUD

	emit(type: string, extra: Record<string, unknown>) {
		this.game.events.push({ t: time.elapsed, type, ...extra });
	}

	/** put a friend who fell behind just out of view, from where it runs back to you */
	catchUp(a: Actor) {
		const cam = this.game.camera.position;
		const me = this.player.c.pos;
		const dx = cam.x - me.x,
			dz = cam.z - me.z;
		const l = Math.hypot(dx, dz) || 1;
		for (const k of [1.6, 1.3, 1.0, 0.7]) {
			const x = me.x + (dx / l) * (l * k + 1),
				z = me.z + (dz / l) * (l * k + 1);
			if (this.world.isOpen(x, z, 0.5)) {
				a.c.place(x, z, Math.atan2(-dx, -dz));
				return;
			}
		}
	}

	/** a sound at an actor (or the UI bus), with size-scaled pitch for creature voices */
	sound(name: string, a: Actor | null, volume = 0.7, pitch?: number) {
		const m = this.game.mixer;
		if (!a) {
			m.play(name, { bus: 'ui', volume, pitch: pitch ?? 1 });
			return;
		}
		if (name === 'voice') {
			this.game.voice(a.c, volume);
			return;
		}
		const p = pitch ?? (name === 'croak' ? Math.min(1.8, Math.max(0.45, 1 / Math.sqrt(a.size))) : 1);
		m.play(name, { at: a.c.headPos, volume, pitch: p, pitchVar: 0.06 });
	}

	/** the sound of a move: notes for singing, thumps for dancing, a chirp and hearts for smiling, a chime for posing */
	moveSound(m: SocialId, a: Actor, k: number) {
		const scale = [1, 1.122, 1.26, 1.335, 1.498, 1.682];
		const base = Math.min(1.6, Math.max(0.6, 1 / Math.sqrt(a.size)));
		if (m === 'sing') {
			this.game.mixer.play('chime', { at: a.c.headPos, volume: 0.6, pitch: base * scale[(k * 2) % scale.length] });
			this.game.fx.note(this.tmp.copy(a.c.headPos).setY(a.c.headPos.y + a.c.plan.R));
		} else if (m === 'dance') {
			this.game.mixer.play('thump', { at: a.c.pos, volume: 0.7, pitch: base });
			this.game.fx.dust(a.c.pos, 0.6, a.size);
		} else if (m === 'charm') {
			this.game.voice(a.c, 0.6);
			this.game.fx.love(a.c.headPos, a.size * 0.6);
		} else if (m === 'pose') {
			this.game.mixer.play('confirm', { at: a.c.headPos, volume: 0.5, pitch: base * 0.9 });
			this.game.fx.sparkle(a.c.headPos, a.size * 0.6, '#ffd23f');
		}
	}

	/** the name a creature is called on screen */
	nameOf(a: Actor) {
		return a.sp ? t.species[a.sp.id].n : save.name || t.name.fallback;
	}

	/** check the missions, save, cheer for any that just finished, and tell the page the game sits in */
	progress(cheer = true) {
		const fin = missions.settle();
		this.hud.mission(fin.length === 0 && cheer);
		if (fin.length && cheer) this.hud.celebrate(fin);
		for (const id of fin) this.emit('mission', { id });
		this.game.report();
	}

	// ------------------------------------------------------------------ friendship

	/** a kind was seen up close: it goes in the friends book */
	meet(a: Actor) {
		if (!a.sp) return;
		this.game.portrait(a.e, a.sp.id);
		if (save.met.includes(a.sp.id)) return;
		save.met.push(a.sp.id);
		store();
		this.emit('met', { species: a.sp.id });
	}

	befriend(partner: Actor) {
		const sp = partner.sp!;
		const first = !this.allied.has(sp.id);
		this.allied.add(sp.id);
		if (!save.friends.includes(sp.id)) save.friends.push(sp.id);
		store();
		this.stats.befriended++;
		const c = partner.c;
		this.game.fx.love(c.headPos, c.plan.size * 1.4);
		this.game.fx.sparkle(c.headPos, c.plan.size, '#ffd23f');
		this.sound('friend', null, 0.8);
		setTimeout(() => this.game.mixer.play('chime', { bus: 'ui', volume: 0.6, pitch: 1.5 }), 160);
		setTimeout(() => this.game.mixer.play('chime', { bus: 'ui', volume: 0.6, pitch: 2 }), 320);
		for (const m of this.actors)
			if (m.sp === sp) {
				m.state = 'idle';
				m.greetCd = 3 + Math.random() * 4;
			}
		this.emit('befriend', { species: sp.id, first });
		// a new friend walks with you (the giant is far too big for that)
		if (sp !== GIANT) this.join(partner, true);
	}

	join(a: Actor, quiet = false) {
		if (a.ally) return;
		// two friends walk with you; when a third comes along, the one who has walked longest goes back to its nest
		if (this.pack.length >= PACK_MAX) this.sendHome(this.pack[0], quiet);
		a.ally = true;
		a.slot = [0, 1].find((s) => !this.pack.some((p) => p.slot === s)) ?? 0;
		a.state = 'follow';
		this.pack.push(a);
		if (!quiet) this.hud.say(fill(t.say.joined, { name: this.nameOf(a) }), 'var(--teal)');
		this.sound('voice', a, 0.6);
		this.emit('join', { species: a.sp?.id, id: a.id });
	}

	private sendHome(a: Actor, quiet = false) {
		const i = this.pack.indexOf(a);
		if (i < 0) return;
		this.pack.splice(i, 1);
		a.ally = false;
		a.state = 'home';
		a.timer = 40;
		a.greetCd = 30;
		if (!quiet) this.hud.say(fill(t.say.home, { name: this.nameOf(a) }), 'var(--paper)');
		this.emit('home', { species: a.sp?.id, id: a.id });
	}

	/** a pat for a friend (a tap on it): a happy hop and a heart, nothing else changes */
	private pat(a: Actor) {
		const c = a.c;
		if (!c.airborne && !c.action) c.jump(Math.min(0.3, Math.max(0.08, (c.plan.legLength || c.plan.R) * 0.3)));
		this.sound('voice', a, 0.6);
		this.game.fx.love(c.headPos, c.plan.size * 0.7);
		this.emit('pat', { species: a.sp?.id, id: a.id });
	}

	startEncounter(a: Actor) {
		if (this.encounter.active || !a.sp || this.allied.has(a.sp.id)) return;
		this.meet(a);
		const run = new EncounterRun(this, a, this.nameOf(a));
		this.encounter.active = run;
		a.state = 'encounter';
		a.c.intentSpeed = 0;
		this.cam.pair = a.c;
		this.goal = null;
		this.leaveT = 0;
		this.stats.encounters++;
		this.hud.encounter(true);
		this.hud.coach(null);
		this.sound('confirm', null, 0.6);
		this.emit('encounter', { species: a.sp.id, id: a.id });
	}

	endEncounter(won: boolean) {
		const run = this.encounter.active;
		if (!run) return;
		this.encounter.active = null;
		this.cam.pair = null;
		this.hud.encounter(false);
		const a = run.partner;
		if (a.state === 'encounter') {
			a.state = a.ally ? 'follow' : 'idle';
			a.timer = 1;
		}
		this.player.c.faceTarget = null;
		this.emit('encounter-end', { won, species: a.sp?.id });
		if (won) this.progress();
	}

	// ------------------------------------------------------------------ the frame

	update(dt: number, realDt: number) {
		if (!this.active) return;
		const me = this.player;
		const inp = this.input;
		inp.poll(realDt);
		if (inp.pressed('menu')) this.hud.open(this.hud.panel ? null : 'menu');
		if (inp.pressed('missions') && !this.hud.busy) this.hud.open('missions');
		if (inp.pressed('interact') || inp.pressed('jump')) this.hud.dismissCheer();
		if (this.paused) {
			this.hud.update(realDt);
			inp.endFrame();
			return;
		}
		this.day.update(dt);
		this.firstSteps(dt);
		this.controlPlayer(dt);
		for (const a of this.actors) if (a !== me) think(this, a, dt);
		if (this.encounter.active) this.encounter.active.update(dt);
		this.pantry.update(dt);
		this.around(dt);
		const manual = performance.now() - inp.lookedAt < 1500 || this.hud.makerOpen;
		this.cam.update(me.c, realDt, { lookYaw: inp.look.yaw, lookPitch: inp.look.pitch, manual, running: inp.run && me.c.speed > me.c.plan.walkSpeed });
		this.game.rig.target.copy(me.c.pos);
		this.hud.update(realDt);
		inp.endFrame();
	}

	/** the egg, the name, and the first pointers on how to walk */
	private firstSteps(dt: number) {
		const me = this.player;
		const inp = this.input;
		if (this.stage === 'egg') {
			// the egg rocks in the nest until it is tapped (or a little while passes: nobody gets stuck on an egg)
			this.eggT += dt;
			me.e.egg = 1.15 + 0.22 * Math.sin(this.eggT * 2.4) + dt;
			if (inp.taps.length || inp.pressed('jump') || inp.pressed('interact') || this.eggT > 12) {
				me.e.egg = 0.35;
				this.stage = 'hatching';
				this.hud.coach(null);
				inp.taps.length = 0;
			}
		} else if (this.stage === 'hatching') {
			if (me.e.egg <= 0 && me.c.scaleIn >= 1) {
				if (save.hatched && save.name) this.stage = 'free';
				else {
					this.stage = 'naming';
					this.hud.openMaker(true, () => {
						save.hatched = true;
						store();
						this.stage = 'free';
						this.coachT = 0;
						this.progress();
					});
				}
			}
		} else if (this.stage === 'free' && !missions.done('fruit')) {
			// how to walk, until the creature has gone a few steps
			this.coachT += dt;
			if (this.moved < 2.5 && this.coachT > 1.5 && !this.hud.busy && !this.encounter.active) this.hud.coach(this.input.touch || document.body.classList.contains('touch') ? t.coach.touch : t.coach.keys);
			else this.hud.coach(null);
		}
	}

	private controlPlayer(dt: number) {
		const me = this.player;
		const c = me.c;
		const P = c.plan;
		const inp = this.input;
		if (me.e.egg > 0 || this.stage === 'egg') {
			c.intentSpeed = 0;
			// remaking the creature: its new egg pops as soon as the body is ready
			if (this.stage !== 'egg' && this.stage !== 'hatching' && me.e.egg > 1e8) me.e.egg = 0.5;
			return;
		}
		if (this.hud.busy || this.stage === 'naming') {
			c.intentSpeed = 0;
			this.goal = null;
			return;
		}
		const enc = this.encounter.active;
		// a tap: walk there; on a creature, walk up to it and say hello
		if (!enc) for (const tap of inp.taps) this.tap(tap.x, tap.y);
		// movement relative to the camera
		const f = this.cam.forward();
		const rx = -f.z,
			rz = f.x;
		let mx = inp.move.x,
			my = inp.move.y;
		const mag = Math.min(1, Math.hypot(mx, my));
		if (enc) {
			// walking away ends a hello, with nothing lost
			if (mag > 0.5 && enc.phase !== 'won') this.leaveT += dt;
			else this.leaveT = 0;
			if (this.leaveT > 0.7) this.endEncounter(false);
			mx = my = 0;
		}
		let dx = f.x * my + rx * mx,
			dz = f.z * my + rz * mx;
		let speed = 0;
		const jog = Math.min(c.maxSpeed, Math.max(P.walkSpeed * 1.35, c.maxSpeed * 0.7));
		if (mag > 0.05) {
			this.goal = null;
			speed = (inp.run ? c.maxSpeed : jog) * mag;
		} else if (this.goal && !enc) {
			const g = this.goal;
			g.t += dt;
			if (g.actor) {
				g.x = g.actor.c.pos.x;
				g.z = g.actor.c.pos.z;
			}
			const d = Math.hypot(g.x - c.pos.x, g.z - c.pos.z);
			const stop = g.actor ? g.actor.bodyR + me.bodyR + 0.9 : 0.35;
			if (d < stop || g.t > 14) {
				const who = g.actor;
				this.goal = null;
				// arrived at a creature: the same as pressing the action button beside it
				if (who && d < stop) this.promptFor(who)?.act();
			} else {
				dx = g.x - c.pos.x;
				dz = g.z - c.pos.z;
				if (d > stop + 2.5) {
					// on the way there, walk around trees, big rocks and water like the island's own creatures do
					const v = this.tmp.set(dx, 0, dz).normalize();
					this.herd.avoid(c, v);
					dx = v.x;
					dz = v.z;
				}
				speed = d < stop + 1.2 ? jog * 0.6 : jog;
			}
		}
		if (speed > 0) {
			const l = Math.hypot(dx, dz) || 1;
			dx /= l;
			dz /= l;
			// the sea is for paddling at the edge, not for walking out into
			const ax = c.pos.x + dx * 0.9,
				az = c.pos.z + dz * 0.9;
			if (this.world.water(ax, az) > 0.22 || Math.hypot(ax, az) > this.world.terrain.islandRadius * 0.93) {
				speed = 0;
				this.goal = null;
			} else c.intentDir.set(dx, dz);
		}
		if (enc) speed = 0;
		c.intentSpeed = speed;
		this.moved += c.speed * dt;
		if (!enc) {
			c.faceTarget = null;
			c.lookTarget = null;
		}
		// jump (and glide while held)
		c.glideHeld = inp.isHeld('jump');
		if (inp.pressed('jump') && !enc && c.action !== 'jump' && !c.airborne) {
			const L = P.legLength || P.R * 1.4;
			c.jump(Math.max(0.12, L * (0.3 + 0.13 * me.abil.level.jump)));
			this.game.mixer.play('popSmall', { at: c.pos, volume: 0.35, pitch: 1.4 });
			if (P.wings) this.game.mixer.play('flap', { at: c.pos, volume: 0.5 });
			this.emit('jump', {});
		}
		if (c.gliding && Math.random() < dt * 3) this.game.mixer.play('flap', { at: c.pos, volume: 0.25, pitch: 0.8 });
		// the four moves: answers while saying hello; anywhere else, a little show (curious ones copy you)
		for (const m of SOCIAL) {
			if (!inp.pressed(m)) continue;
			if (enc) enc.input(m);
			else if (!c.action || c.action === 'eat') {
				c.act(m);
				this.moveSound(m, me, Math.floor(Math.random() * 4));
				this.lastMove = { move: m, at: performance.now() };
				this.goal = null;
				for (const a of this.pack) if (!a.c.action) setTimeout(() => a.c.act(m), 250 + a.slot * 150);
			}
		}
		if (inp.pressed('interact') && !enc) this.prompt()?.act();
	}

	/** a tap on the world: on a creature, go to it; on the ground, go there */
	private tap(x: number, y: number) {
		const r = this.game.canvas.getBoundingClientRect();
		this.caster.setFromCamera(new THREE.Vector2(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1), this.game.camera);
		const ray = this.caster.ray;
		this.stats.taps++;
		const hit = this.herd.pick(ray);
		const who = hit ? this.actors.find((a) => a.c === hit) : null;
		if (who === this.player) {
			// a tap on yourself: a happy hop
			if (!this.player.c.airborne) this.player.c.jump(Math.max(0.1, (this.player.c.plan.legLength || this.player.c.plan.R) * 0.3));
			this.sound('voice', this.player, 0.6);
			return;
		}
		if (who && (who.ally || (who.sp === GIANT && this.allied.has('giant')))) {
			this.pat(who);
			return;
		}
		if (who) {
			this.goal = { x: who.c.pos.x, z: who.c.pos.z, actor: who, t: 0 };
			this.emit('tap', { actor: who.id });
			return;
		}
		// the ground: step along the ray until it dips under the land
		const p = this.tmp;
		let prev = 0;
		for (let d = 1; d < 120; d += 0.75) {
			p.copy(ray.origin).addScaledVector(ray.direction, d);
			if (p.y <= this.world.ground(p.x, p.z)) {
				// halve the last step a few times for a clean landing point
				let a = prev,
					b = d;
				for (let i = 0; i < 6; i++) {
					const m = (a + b) / 2;
					p.copy(ray.origin).addScaledVector(ray.direction, m);
					if (p.y <= this.world.ground(p.x, p.z)) b = m;
					else a = m;
				}
				p.copy(ray.origin).addScaledVector(ray.direction, b);
				if (this.world.water(p.x, p.z) > 0.22) return;
				this.goal = { x: p.x, z: p.z, actor: null, t: 0 };
				this.game.fx.dust(p.setY(this.world.ground(p.x, p.z) + 0.05), 0.8, 0.8);
				this.game.mixer.play('ui', { bus: 'ui', volume: 0.25, pitch: 1.4 });
				this.emit('tap', { x: +p.x.toFixed(1), z: +p.z.toFixed(1) });
				return;
			}
			prev = d;
		}
	}

	/** what can be done with this creature right now */
	private promptFor(o: Actor): Prompt | null {
		if (!o.sp || !o.alive || o.ally) return null;
		if (this.allied.has(o.sp.id)) return o.sp === GIANT ? null : { text: t.act.join, what: 'join', act: () => this.join(o) };
		return { text: t.act.greet, what: 'greet', act: () => this.startEncounter(o) };
	}

	/** what the big action button (and Enter) would do here */
	prompt(): Prompt | null {
		const me = this.player;
		if (!me.alive || this.encounter.active || this.stage !== 'free') return null;
		const c = me.c;
		let best: Actor | null = null,
			bd = 1e9;
		for (const o of this.actors) {
			// (a friend already walking with you has no button: tap it to ask it to wait)
			if (o === me || !o.sp || o.ally) continue;
			const d = flat(o.c.pos, c.pos) - o.bodyR - me.bodyR;
			// someone new comes before a kind that is already a friend
			const score = d + (this.allied.has(o.sp.id) ? 1.5 : 0);
			if (d < 2.4 && score < bd && this.promptFor(o)) {
				bd = score;
				best = o;
			}
		}
		return best ? this.promptFor(best) : null;
	}

	private eat(f: Food) {
		const me = this.player;
		const c = me.c;
		if (!c.action) c.act('eat', 0.9);
		this.pantry.eat(f);
		this.stats.eaten++;
		this.sound('munch', me, 0.7);
		this.game.fx.bits.emit({ count: 8, at: f.pos.clone().setY(f.pos.y + 0.1), cone: 1, dir: new THREE.Vector3(0, 1, 0), speed: [0.6, 1.4], life: [0.4, 0.7], size: [0.025, 0.05], color: linearToHex(f.color), alpha: 1, gravity: 7, drag: 0.6 });
		this.game.fx.sparkle(c.headPos, me.size * 0.5, '#ffe27a');
		if (save.fruit < FRUIT_GOAL) {
			save.fruit++;
			store();
		}
		this.emit('eat', {});
		this.progress();
	}

	/** things that happen by walking: fruit is eaten, stars are picked up, kinds seen up close are remembered */
	private around(dt: number) {
		const me = this.player;
		if (!me.alive || this.stage !== 'free' || this.encounter.active) return;
		const c = me.c;
		this.eatCd -= dt;
		if (this.eatCd <= 0) {
			const f = this.pantry.nearest(c.pos, me.bodyR + 0.55);
			if (f) {
				this.eatCd = 0.7;
				this.eat(f);
			}
		}
		const st = this.stars.nearest(c.pos, me.bodyR + 0.9);
		if (st) {
			st.found = true;
			if (!save.stars.includes(st.id)) save.stars.push(st.id);
			store();
			this.stats.stars++;
			this.game.fx.sparkle(st.pos, 1.6, '#ffd23f');
			this.game.fx.hatch(st.pos, 1, '#ffd23f');
			this.sound('friend', null, 0.7, 1.3);
			this.hud.say(t.say.star, 'var(--yellow)');
			this.emit('star', { id: st.id });
			this.progress();
		}
		this.meetT -= dt;
		if (this.meetT <= 0) {
			this.meetT = 0.6;
			for (const a of this.actors) if (a.sp && a.c.visible && flat(a.c.pos, c.pos) < 5 + a.bodyR) this.meet(a);
		}
	}

	/** nests press the grass flat (and cast a soft contact shadow) */
	contacts() {
		const W = this.world;
		for (const n of this.nests.values()) W.contact(n.x, n.y, n.z, n.r * 1.35, 0.9);
		this.pantry.contacts(W);
	}

	private nearestOf(ok: (a: Actor) => boolean): Actor | null {
		const me = this.player.c;
		let best: Actor | null = null,
			bd = 1e9;
		for (const a of this.actors) {
			if (!a.sp || a.ally || !ok(a)) continue;
			const d = flat(a.c.pos, me.pos);
			if (d < bd) {
				bd = d;
				best = a;
			}
		}
		return best;
	}

	/** where the mission pin points */
	objectivePos(): THREE.Vector3 | null {
		if (this.stage !== 'free') return null;
		const me = this.player.c;
		switch (missions.current()) {
			case 'fruit':
				return this.pantry.nearest(me.pos, 90)?.pos ?? null;
			case 'friend':
				return this.nearestOf((a) => a.sp !== GIANT && !this.allied.has(a.sp!.id))?.c.headPos ?? null;
			case 'stars':
				return this.stars.nearest(me.pos)?.pos ?? null;
			case 'kinds':
				return this.nearestOf((a) => KINDS.includes(a.sp!.id) && !this.allied.has(a.sp!.id))?.c.headPos ?? null;
			case 'giant':
				return this.giant ? this.giant.c.headPos : null;
		}
		return null;
	}

	/** state for tests and the debug overlay */
	snapshot() {
		const me = this.player;
		const run = this.encounter.active;
		return {
			stage: this.stage,
			mission: missions.current(),
			done: [...save.done],
			name: save.name,
			egg: me.e.egg > 0,
			pos: { x: +me.c.pos.x.toFixed(2), y: +me.c.pos.y.toFixed(2), z: +me.c.pos.z.toFixed(2) },
			yaw: +me.c.yaw.toFixed(3),
			camYaw: +this.cam.yaw.toFixed(3),
			speed: +me.c.speed.toFixed(2),
			airborne: me.c.airborne,
			code: me.c.plan.code,
			allied: [...this.allied],
			pack: this.pack.map((a) => ({ id: a.id, species: a.sp?.id })),
			fruit: save.fruit,
			stars: [...save.stars],
			prompt: this.prompt()?.what ?? null,
			goal: this.goal ? { x: +this.goal.x.toFixed(1), z: +this.goal.z.toFixed(1), actor: this.goal.actor?.id ?? null } : null,
			busy: this.hud.busy,
			panel: this.hud.panel,
			paused: this.paused,
			encounter: run ? { phase: run.phase, round: run.round, seq: run.seq, idx: run.idx, hearts: run.hearts, need: run.need, hint: run.hint, wait: +run.wait.toFixed(2), beat: run.beat, partner: run.partner.id, species: run.partner.sp?.id } : null,
			objective: this.objectivePos()?.toArray().map((v) => +v.toFixed(2)) ?? null,
			stats: this.stats,
			actors: this.actors.filter((a) => a !== me).map((a) => ({ id: a.id, species: a.sp?.id, x: +a.c.pos.x.toFixed(2), z: +a.c.pos.z.toFixed(2), state: a.state, ally: a.ally, young: a.young })),
			starSpots: this.stars.items.map((s) => ({ id: s.id, x: +s.pos.x.toFixed(1), z: +s.pos.z.toFixed(1), found: s.found })),
			fruitNear: (() => {
				const f = this.pantry.nearest(me.c.pos, 90);
				return f ? { x: +f.pos.x.toFixed(2), z: +f.pos.z.toFixed(2) } : null;
			})(),
		};
	}
}
