// A small Web Audio mixer: master / sfx / music / ui buses, music ducking, pitch randomisation,
// positional (HRTF) one-shots, and unlock on the first gesture (with iOS audioSession + resume on focus).
//
//   mixer.unlock()                         call from the Play click (also auto-hooks pointerdown/keydown)
//   mixer.play('shot', { pitchVar: 0.06 }) one-shot on the sfx bus
//   mixer.play('hit', { at: worldPos })    positional one-shot
//   mixer.duck(0.5, 0.4)                   pull the music down for big moments
//   await mixer.load('shot', new URL('../assets/shot.ogg', import.meta.url).href)
import type * as THREE from 'three';
import { Rng } from '../core/rng';

// Separate stream: whether sound is unlocked must not change gameplay randomness (?seed= replays).
const rng = new Rng(0x5eed);
/** Sound names the game asks for, mapped to the recorded files (variants are picked at random). */
const ALIASES: Record<string, string[]> = {
	step: ['step0', 'step1', 'step2', 'step3', 'step4'],
	pop: ['pop1'],
	popSmall: ['pop2'],
	squeak: ['squeak'],
	quack: ['quack1', 'quack2'],
	croak: ['croak'],
	chime: ['chime'],
	flap: ['flap'],
	thump: ['thump'],
	ui: ['click'],
	uiSoft: ['select'],
	confirm: ['confirm'],
	// play: food, saying hello, friends
	munch: ['munch'],
	tick: ['tick'],
	good: ['good'],
	great: ['great'],
	friend: ['friend'],
};

export interface SoundInfo {
	name: string;
	file: string;
	fallback: string;
	kind: 'oneshot' | 'loop';
	lufsIntegrated: number;
	lufsMomentaryMax: number;
	truePeak: number;
}

export type Bus = 'sfx' | 'music' | 'ui';

export interface PlayOptions {
	bus?: Bus;
	volume?: number;
	pitch?: number;
	/** ± fraction, e.g. 0.06 = ±6%. Default 0.06 for sfx, 0 for ui. */
	pitchVar?: number;
	at?: THREE.Vector3;
	refDistance?: number;
	/** Duck the music bus by this amount (0..1). */
	duck?: number;
}

const loadVol = (k: string, d: number) => {
	try {
		const v = localStorage.getItem(`friends-island:vol.${k}`);
		return v === null ? d : Math.max(0, Math.min(1, Number(v)));
	} catch {
		return d;
	}
};

export class Mixer {
	ctx: AudioContext | null = null;
	readonly buffers = new Map<string, AudioBuffer>();
	manifest: SoundInfo[] = [];
	loaded = 0;
	private ambience: AudioBufferSourceNode[] = [];
	master!: GainNode;
	readonly buses = {} as Record<Bus, GainNode>;
	private duckGain!: GainNode;
	private musicSrc: AudioBufferSourceNode | null = null;
	volumes: Record<'master' | Bus, number> = { master: loadVol('master', 0.8), sfx: loadVol('sfx', 0.9), music: loadVol('music', 0.45), ui: loadVol('ui', 0.7) };
	played = 0;
	private unlocking = false;

	constructor() {
		const once = () => this.unlock();
		for (const ev of ['pointerdown', 'keydown', 'touchend'] as const) addEventListener(ev, once, { capture: true, passive: true });
		document.addEventListener('visibilitychange', () => {
			if (document.visibilityState === 'visible') this.ctx?.resume().catch(() => {});
		});
		addEventListener('pageshow', () => this.ctx?.resume().catch(() => {}));
	}

	get state(): string {
		return this.ctx ? this.ctx.state : 'locked';
	}

	/** Real CC0 recordings (public/audio, see manifest.json), fetched and decoded after the first gesture. */
	private loading: Promise<void> | null = null;
	/** Fetch and decode every recording (works before the first gesture: decoding needs no running context). */
	preload(): Promise<void> {
		if (!this.loading) {
			// a browser without Web Audio (or with only the old prefixed kind) still gets the game, just without sound
			const w = window as unknown as { OfflineAudioContext?: typeof OfflineAudioContext; webkitOfflineAudioContext?: typeof OfflineAudioContext };
			const OAC = w.OfflineAudioContext ?? w.webkitOfflineAudioContext;
			try {
				this.loading = OAC ? this.loadAll(new OAC(1, 1, 44100)) : Promise.resolve();
			} catch {
				this.loading = Promise.resolve();
			}
		}
		return this.loading;
	}

	private async loadAll(ctx: BaseAudioContext) {
		try {
			const res = await fetch('audio/manifest.json');
			this.manifest = await res.json();
		} catch {
			return;
		}
		const canOgg = new Audio().canPlayType('audio/ogg; codecs="vorbis"') !== '';
		await Promise.all(
			this.manifest.map(async (m) => {
				try {
					const r = await fetch(canOgg ? m.file : m.fallback);
					const buf = await ctx.decodeAudioData(await r.arrayBuffer());
					if (buf) {
						this.buffers.set(m.name, buf);
						this.loaded++;
					}
				} catch {}
			}),
		);
		if (this.ctx) this.startAmbience();
	}

	private bedGains = new Map<string, GainNode>();
	private startAmbience() {
		const ctx = this.ctx;
		if (!ctx) return;
		for (const name of ['amb_meadow', 'amb_wind']) {
			const buf = this.buffers.get(name);
			if (!buf) continue;
			const src = ctx.createBufferSource();
			src.buffer = buf;
			src.loop = true;
			const g = ctx.createGain();
			g.gain.setValueAtTime(0, ctx.currentTime);
			g.gain.linearRampToValueAtTime(this.bedLevel(name), ctx.currentTime + 3);
			src.connect(g).connect(this.buses.music);
			src.start(ctx.currentTime, Math.random() * buf.duration * 0.5);
			this.ambience.push(src);
			this.bedGains.set(name, g);
		}
	}
	private bedLevel(_name: string) {
		return 1;
	}

	/** Peak level of every decoded sound (the self-check asserts none is silent). */
	levels(): Record<string, number> {
		const out: Record<string, number> = {};
		for (const [k, b] of this.buffers) {
			const d = b.getChannelData(0);
			let m = 0;
			for (let i = 0; i < d.length; i += 7) m = Math.max(m, Math.abs(d[i]));
			out[k] = m;
		}
		return out;
	}

	unlock() {
		if (this.ctx) {
			if (this.ctx.state !== 'running') this.ctx.resume().catch(() => {});
			return;
		}
		if (this.unlocking) return;
		this.unlocking = true;
		try {
			const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
			const ctx = new AC({ latencyHint: 'interactive' });
			this.ctx = ctx;
			try {
				const nav = navigator as Navigator & { audioSession?: { type: string } };
				if (nav.audioSession) nav.audioSession.type = 'playback';
			} catch {}
			ctx.resume().catch(() => {});
			// 1-sample silent buffer: the classic iOS unlock
			const s = ctx.createBufferSource();
			s.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
			s.connect(ctx.destination);
			s.start();
			const comp = ctx.createDynamicsCompressor();
			comp.threshold.value = -10;
			comp.knee.value = 8;
			comp.ratio.value = 6;
			comp.attack.value = 0.003;
			comp.release.value = 0.15;
			this.master = ctx.createGain();
			this.master.connect(comp).connect(ctx.destination);
			this.duckGain = ctx.createGain();
			for (const b of ['sfx', 'music', 'ui'] as Bus[]) {
				const g = ctx.createGain();
				this.buses[b] = g;
				if (b === 'music') g.connect(this.duckGain).connect(this.master);
				else g.connect(this.master);
			}
			this.applyVolumes();
			void this.preload().then(() => {
				if (!this.ambience.length) this.startAmbience();
			});
		} catch {
			this.ctx = null;
		} finally {
			this.unlocking = false;
		}
	}

	applyVolumes() {
		if (!this.ctx) return;
		this.master.gain.value = this.volumes.master;
		for (const b of ['sfx', 'music', 'ui'] as Bus[]) this.buses[b].gain.value = this.volumes[b];
	}

	setVolume(bus: 'master' | Bus, v: number) {
		this.volumes[bus] = Math.max(0, Math.min(1, v));
		try {
			localStorage.setItem(`friends-island:vol.${bus}`, String(this.volumes[bus]));
		} catch {}
		this.applyVolumes();
	}

	/** Replace or add a sound from a same-origin file (vendored into the build). */
	async load(name: string, url: string) {
		const res = await fetch(url);
		const data = await res.arrayBuffer();
		const ctx = this.ctx ?? new OfflineAudioContext(1, 1, 44100);
		this.buffers.set(name, await ctx.decodeAudioData(data));
	}

	startMusic(name: string, fade = 2) {
		const ctx = this.ctx;
		const buf = this.buffers.get(name);
		if (!ctx || !buf) return;
		this.musicSrc?.stop();
		const src = ctx.createBufferSource();
		src.buffer = buf;
		src.loop = true;
		const g = ctx.createGain();
		g.gain.setValueAtTime(0, ctx.currentTime);
		g.gain.linearRampToValueAtTime(1, ctx.currentTime + fade);
		src.connect(g).connect(this.buses.music);
		src.start();
		this.musicSrc = src;
	}

	/** Duck the music: down by `amount` quickly, hold, then release. */
	duck(amount = 0.5, hold = 0.25, release = 0.8) {
		const ctx = this.ctx;
		if (!ctx) return;
		const g = this.duckGain.gain;
		const t = ctx.currentTime;
		g.cancelScheduledValues(t);
		g.setValueAtTime(g.value, t);
		g.linearRampToValueAtTime(1 - amount, t + 0.03);
		g.setValueAtTime(1 - amount, t + 0.03 + hold);
		g.linearRampToValueAtTime(1, t + 0.03 + hold + release);
	}

	play(name: string, o: PlayOptions = {}): AudioBufferSourceNode | null {
		const ctx = this.ctx;
		if (!ctx || ctx.state !== 'running') return null;
		const alias = ALIASES[name];
		const real = alias ? alias[Math.floor(Math.random() * alias.length)] : name;
		const buf = this.buffers.get(real);
		if (!buf) return null;
		const bus = o.bus ?? 'sfx';
		const src = ctx.createBufferSource();
		src.buffer = buf;
		const pv = o.pitchVar ?? (bus === 'ui' ? 0 : 0.06);
		src.playbackRate.value = (o.pitch ?? 1) * (1 + rng.spread(pv));
		const g = ctx.createGain();
		g.gain.value = o.volume ?? 1;
		let node: AudioNode = src.connect(g);
		if (o.at) {
			const p = ctx.createPanner();
			p.panningModel = 'HRTF';
			p.distanceModel = 'inverse';
			p.refDistance = o.refDistance ?? 2;
			p.maxDistance = 80;
			p.rolloffFactor = 1;
			if (p.positionX) {
				p.positionX.value = o.at.x;
				p.positionY.value = o.at.y;
				p.positionZ.value = o.at.z;
			} else p.setPosition(o.at.x, o.at.y, o.at.z);
			node = node.connect(p);
		}
		node.connect(this.buses[bus]);
		src.start();
		this.played++;
		if (o.duck) this.duck(o.duck, 0.12, 0.5);
		return src;
	}

	/** Move the listener with the camera (once per frame). */
	updateListener(camera: THREE.Camera) {
		const ctx = this.ctx;
		if (!ctx) return;
		const l = ctx.listener;
		const e = camera.matrixWorld.elements;
		const px = e[12],
			py = e[13],
			pz = e[14];
		const fx = -e[8],
			fy = -e[9],
			fz = -e[10];
		const ux = e[4],
			uy = e[5],
			uz = e[6];
		if (l.positionX) {
			const t = ctx.currentTime;
			l.positionX.setValueAtTime(px, t);
			l.positionY.setValueAtTime(py, t);
			l.positionZ.setValueAtTime(pz, t);
			l.forwardX.setValueAtTime(fx, t);
			l.forwardY.setValueAtTime(fy, t);
			l.forwardZ.setValueAtTime(fz, t);
			l.upX.setValueAtTime(ux, t);
			l.upY.setValueAtTime(uy, t);
			l.upZ.setValueAtTime(uz, t);
		} else {
			l.setPosition(px, py, pz);
			l.setOrientation(fx, fy, fz, ux, uy, uz);
		}
	}
}
