// The living island's furniture: the light of the day, nests, fruit on the bushes, and the hidden stars.
import * as THREE from 'three';
import type { Batches } from '../creature/batches';
import { toonMaterial, U } from '../look/materials';
import type { RenderPath } from '../render/types';
import type { World } from '../world/world';

const clamp = (x: number, a: number, b: number) => (x < a ? a : x > b ? b : x);
const smooth = (a: number, b: number, x: number) => {
	const t = clamp((x - a) / (b - a), 0, 1);
	return t * t * (3 - 2 * t);
};

// ------------------------------------------------------------------ the day

/** The island's light. It drifts slowly from morning through noon to a golden late afternoon and back: it never
 * gets dark, so there is no night for a small child to be lost in. */
export class DayNight {
	/** seconds from morning to late afternoon */
	static SWING = 300;
	/** 0..1 through the day; 0.25 morning, 0.5 noon, 0.7 late afternoon */
	t = 0.3;
	night = 0;
	private clock = 0;
	private day: { sun: THREE.Color; si: number; sky: THREE.Color; rim: THREE.Color; fog: THREE.Color; exp: number; tint: THREE.Color; bounce: THREE.Color } | null = null;
	frozen = false;

	constructor(
		readonly scene: THREE.Scene,
		readonly path: RenderPath,
	) {}

	/** how far into dusk a time of day is (0 by day) */
	static nightAt(t: number) {
		const x = t < 0.2 ? t + 1 : t;
		return smooth(0.72, 0.84, x) * (1 - smooth(0.98, 1.08, x));
	}

	update(dt: number) {
		if (!this.day) {
			const fog = this.scene.fog as THREE.Fog;
			this.day = { sun: U.uSunColor.value.clone(), si: U.uSunIntensity.value, sky: U.uSkyColor.value.clone(), rim: U.uRimColor.value.clone(), fog: fog.color.clone(), exp: this.path.grade.exposure, tint: U.uShadowTint.value.clone(), bounce: U.uBounceColor.value.clone() };
		}
		if (!this.frozen) {
			this.clock += dt;
			// a slow swing between morning (0.28) and a warm late afternoon (0.75), never further
			const k = 0.5 - 0.5 * Math.cos((this.clock / DayNight.SWING) * Math.PI);
			this.t = 0.28 + 0.47 * k;
		}
		this.apply();
	}

	apply() {
		const D = this.day;
		if (!D) return;
		const n = DayNight.nightAt(this.t);
		this.night = n;
		const dusk = n * (1 - n) * 4;
		U.uNight.value = n;
		U.uSunColor.value.copy(D.sun).lerp(new THREE.Color(1.0, 0.62, 0.38), dusk * 0.7).lerp(new THREE.Color(0.55, 0.66, 1.0), smooth(0.5, 1, n));
		U.uSunIntensity.value = D.si * (1 - 0.62 * n);
		U.uSkyColor.value.copy(D.sky).lerp(new THREE.Color(0.18, 0.25, 0.55), n);
		U.uRimColor.value.copy(D.rim).lerp(new THREE.Color(0.55, 0.65, 1.0), n);
		U.uShadowTint.value.copy(D.tint).lerp(new THREE.Color(0.32, 0.36, 0.7), n);
		U.uBounceColor.value.copy(D.bounce).multiplyScalar(1 - 0.6 * n);
		(this.scene.fog as THREE.Fog).color.copy(D.fog).lerp(new THREE.Color(0.95, 0.66, 0.5), dusk * 0.45).lerp(new THREE.Color(0.08, 0.11, 0.24), smooth(0.4, 1, n));
		this.path.grade.exposure = D.exp * (1 - 0.18 * n);
	}
}

// ------------------------------------------------------------------ nests

export interface Nest {
	id: string;
	x: number;
	z: number;
	y: number;
	r: number;
	color: [number, number, number];
	mesh: THREE.Mesh;
}

let nestMat: THREE.Material | null = null;

/** A woven ring of twigs with a soft lining and a few speckled eggs. */
export function makeNest(world: World, id: string, x: number, z: number, r: number, egg: [number, number, number], eggs = 3): Nest {
	nestMat ??= toonMaterial({ vertexColors: true, side: THREE.DoubleSide }, { key: 'nest', contact: true, edge: [-0.2, 0.3], rim: 0.25 });
	const geos: THREE.BufferGeometry[] = [];
	const rnd = mulberry(Math.floor(x * 131 + z * 71));
	const twig = new THREE.CylinderGeometry(1, 1, 1, 5, 1);
	const col = new THREE.Color();
	const put = (g: THREE.BufferGeometry, m: THREE.Matrix4, c: THREE.Color) => {
		const gg = g.clone().applyMatrix4(m);
		const n = gg.attributes.position.count;
		const cols = new Float32Array(n * 3);
		for (let i = 0; i < n; i++) {
			cols[i * 3] = c.r;
			cols[i * 3 + 1] = c.g;
			cols[i * 3 + 2] = c.b;
		}
		gg.setAttribute('color', new THREE.BufferAttribute(cols, 3));
		geos.push(gg.index ? gg.toNonIndexed() : gg);
	};
	const gy = (px: number, pz: number) => world.ground(x + px, z + pz);
	const y0 = gy(0, 0);
	// twigs: three loose layers around the rim, tilted along the ring
	for (let layer = 0; layer < 3; layer++) {
		const n = Math.round(22 + r * 16);
		for (let i = 0; i < n; i++) {
			const a = (i / n) * Math.PI * 2 + layer * 0.37 + rnd() * 0.2;
			const rr = r * (0.82 + rnd() * 0.18);
			const px = Math.cos(a) * rr,
				pz = Math.sin(a) * rr;
			const len = r * (0.5 + rnd() * 0.35);
			const th = r * 0.028 * (0.8 + rnd() * 0.5);
			const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2 + (rnd() - 0.5) * 0.5, 0, 0));
			const yawQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -a + (rnd() - 0.5) * 0.5);
			const tilt = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(Math.cos(a), 0, Math.sin(a)).cross(new THREE.Vector3(0, 1, 0)).normalize(), 0.35 + layer * 0.12);
			const m = new THREE.Matrix4().compose(new THREE.Vector3(px, gy(px, pz) - y0 + r * (0.06 + layer * 0.09), pz), tilt.multiply(yawQ).multiply(q), new THREE.Vector3(th, len, th));
			col.setHSL(0.08 + rnd() * 0.03, 0.42 + rnd() * 0.15, 0.32 + rnd() * 0.12 + layer * 0.03);
			put(twig, m, col);
		}
	}
	// lining: a flattened soft bowl
	const bowl = new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.45);
	put(bowl, new THREE.Matrix4().compose(new THREE.Vector3(0, r * 0.32, 0), new THREE.Quaternion(), new THREE.Vector3(r * 0.85, r * 0.3, r * 0.85)), new THREE.Color(0.86, 0.74, 0.52));
	// eggs: cream with the species' colour as speckle-coloured eggs
	const eggG = new THREE.SphereGeometry(1, 14, 10);
	for (let i = 0; i < eggs; i++) {
		const a = (i / Math.max(1, eggs)) * Math.PI * 2 + 0.6;
		const d = eggs === 1 ? 0 : r * 0.32;
		const er = r * 0.17;
		const m = new THREE.Matrix4().compose(new THREE.Vector3(Math.cos(a) * d, r * 0.1 + er * 1.1, Math.sin(a) * d), new THREE.Quaternion().setFromEuler(new THREE.Euler((rnd() - 0.5) * 0.5, 0, (rnd() - 0.5) * 0.5)), new THREE.Vector3(er * 0.85, er * 1.15, er * 0.85));
		put(eggG, m, new THREE.Color(egg[0] * 0.35 + 0.62, egg[1] * 0.35 + 0.6, egg[2] * 0.35 + 0.55));
	}
	const merged = mergeGeos(geos);
	merged.computeVertexNormals();
	const mesh = new THREE.Mesh(merged, nestMat);
	mesh.position.set(x, y0, z);
	mesh.castShadow = true;
	mesh.receiveShadow = true;
	mesh.name = `nest-${id}`;
	return { id, x, z, y: y0, r, color: egg, mesh };
}

function mergeGeos(gs: THREE.BufferGeometry[]) {
	let n = 0;
	for (const g of gs) n += g.attributes.position.count;
	const pos = new Float32Array(n * 3),
		col = new Float32Array(n * 3);
	let o = 0;
	for (const g of gs) {
		pos.set(g.attributes.position.array as Float32Array, o * 3);
		col.set(g.attributes.color.array as Float32Array, o * 3);
		o += g.attributes.position.count;
	}
	const out = new THREE.BufferGeometry();
	out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
	out.setAttribute('color', new THREE.BufferAttribute(col, 3));
	return out;
}

function mulberry(seed: number) {
	let s = seed >>> 0;
	return () => {
		s = (s + 0x6d2b79f5) >>> 0;
		let t = s;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** Find open, gentle ground near a preferred spot. */
export function findSpot(world: World, x: number, z: number, margin: number, rand: () => number): THREE.Vector3 {
	const n = new THREE.Vector3();
	for (let i = 0; i < 400; i++) {
		const r = i === 0 ? 0 : 1 + (i / 400) * 18;
		const a = rand() * Math.PI * 2;
		const px = x + Math.cos(a) * r,
			pz = z + Math.sin(a) * r;
		if (!world.isOpen(px, pz, margin)) continue;
		world.ground(px, pz, n);
		if (n.y < 0.93) continue;
		let ok = true;
		for (const o of world.scenery.obstacles) if (Math.hypot(o.x - px, o.z - pz) < o.r + margin) ok = false;
		if (ok) return new THREE.Vector3(px, world.ground(px, pz), pz);
	}
	return new THREE.Vector3(x, world.ground(x, z), z);
}

// ------------------------------------------------------------------ fruit

export interface Food {
	id: number;
	pos: THREE.Vector3;
	alive: boolean;
	/** it grows back on its bush a while after being eaten */
	regrow: number;
	color: [number, number, number];
	size: number;
	/** pop-in scale */
	k: number;
}

const FRUIT_COLORS: Array<[number, number, number]> = [
	[0.95, 0.18, 0.2],
	[1.0, 0.5, 0.1],
	[0.62, 0.22, 0.85],
	[1.0, 0.78, 0.12],
];

export class Pantry {
	readonly items: Food[] = [];
	private nextId = 1;
	private q = new THREE.Quaternion();
	private s = new THREE.Vector3();
	private p = new THREE.Vector3();
	constructor(readonly world: World) {
		// fruit around the bushes, sitting low on the leaves and in the grass under them
		let bi = 0;
		for (const o of world.scenery.obstacles) {
			if (o.kind !== 'bush') continue;
			bi++;
			if (bi % 3 === 2) continue;
			const n = 2 + (bi % 3);
			const col = FRUIT_COLORS[bi % FRUIT_COLORS.length];
			for (let i = 0; i < n; i++) {
				const a = bi * 2.3 + i * ((Math.PI * 2) / n) + (i % 2) * 0.3;
				const rr = o.r * (0.95 + (i % 2) * 0.25);
				const x = o.x + Math.cos(a) * rr,
					z = o.z + Math.sin(a) * rr;
				const y = world.ground(x, z) + (i % 2 === 0 ? o.top * 0.35 : 0.08);
				this.items.push({ id: this.nextId++, pos: new THREE.Vector3(x, y, z), alive: true, regrow: 0, color: col, size: 0.085 + (i % 3) * 0.012, k: 1 });
			}
		}
	}

	/** a few fruits on the grass (by the nest of the child's creature, so the first ones are a few steps away) */
	scatter(x: number, z: number, n: number, r: number) {
		for (let i = 0; i < n; i++) {
			const a = 0.9 + i * ((Math.PI * 2) / n);
			const px = x + Math.cos(a) * r,
				pz = z + Math.sin(a) * r;
			if (!this.world.isOpen(px, pz, 0.3)) continue;
			this.items.push({ id: this.nextId++, pos: new THREE.Vector3(px, this.world.ground(px, pz) + 0.05, pz), alive: true, regrow: 0, color: FRUIT_COLORS[i % FRUIT_COLORS.length], size: 0.1, k: 1 });
		}
	}

	/** nearest fruit within reach */
	nearest(at: THREE.Vector3, reach: number): Food | null {
		let best: Food | null = null,
			bd = reach;
		for (const f of this.items) {
			if (!f.alive) continue;
			const d = Math.hypot(f.pos.x - at.x, f.pos.z - at.z);
			if (d < bd) {
				bd = d;
				best = f;
			}
		}
		return best;
	}

	eat(f: Food) {
		f.alive = false;
		f.regrow = 50 + Math.random() * 30;
		f.k = 0;
	}

	update(dt: number) {
		for (const f of this.items) {
			if (!f.alive) {
				f.regrow -= dt;
				if (f.regrow <= 0) f.alive = true;
			}
			if (f.alive) f.k = Math.min(1, f.k + dt * 3);
		}
	}

	draw(B: Batches, cam: THREE.Camera) {
		for (const f of this.items) {
			if (!f.alive) continue;
			if (f.pos.distanceToSquared(cam.position) > 90 * 90) continue;
			const k = f.k < 1 ? 1 + 2.70158 * (f.k - 1) ** 3 + 1.70158 * (f.k - 1) ** 2 : 1;
			const r = f.size * k;
			this.q.setFromAxisAngle(this.s.set(0, 1, 0), f.id);
			B.blobs.add(this.p.copy(f.pos).setY(f.pos.y + r * 0.9), this.q, this.s.set(r, r * 0.92, r), f.color);
			// a little leaf
			B.blobs.add(this.p.set(f.pos.x + r * 0.3, f.pos.y + r * 1.85, f.pos.z), this.q, this.s.set(r * 0.42, r * 0.12, r * 0.22), [0.3, 0.65, 0.18]);
		}
	}

	contacts(world: World) {
		for (const f of this.items) if (f.alive && f.pos.y - world.ground(f.pos.x, f.pos.z) < 0.15) world.contact(f.pos.x, f.pos.y, f.pos.z, f.size * 2.2, 0.5);
	}
}

// ------------------------------------------------------------------ hidden stars

export interface Star {
	id: number;
	pos: THREE.Vector3;
	found: boolean;
}

/** Golden stars tucked away in far corners of the island: a bobbing, slowly turning gold shape that twinkles. */
export class Stars {
	readonly items: Star[] = [];
	private q = new THREE.Quaternion();
	private s = new THREE.Vector3();
	private p = new THREE.Vector3();
	private axis = new THREE.Vector3(0, 1, 0);
	constructor(world: World, spots: Array<[number, number]>, found: number[], rand: () => number) {
		spots.forEach(([x, z], id) => {
			const at = findSpot(world, x, z, 1.2, rand);
			this.items.push({ id, pos: new THREE.Vector3(at.x, at.y + 0.55, at.z), found: found.includes(id) });
		});
	}

	nearest(at: THREE.Vector3, reach = Infinity): Star | null {
		let best: Star | null = null,
			bd = reach;
		for (const st of this.items) {
			if (st.found) continue;
			const d = Math.hypot(st.pos.x - at.x, st.pos.z - at.z);
			if (d < bd) {
				bd = d;
				best = st;
			}
		}
		return best;
	}

	draw(B: Batches, t: number) {
		for (const st of this.items) {
			if (st.found) continue;
			const y = st.pos.y + Math.sin(t * 2 + st.id) * 0.08;
			const turn = t * 1.2 + st.id;
			const c = Math.cos(turn),
				sn = Math.sin(turn);
			// five points around a round middle, turning about the upright axis
			this.q.setFromAxisAngle(this.axis, turn);
			B.blobs.add(this.p.set(st.pos.x, y, st.pos.z), this.q, this.s.set(0.2, 0.2, 0.12), [1.0, 0.8, 0.12]);
			for (let i = 0; i < 5; i++) {
				const a = (i / 5) * Math.PI * 2;
				const lx = Math.sin(a) * 0.24,
					ly = Math.cos(a) * 0.24;
				B.blobs.add(this.p.set(st.pos.x + lx * c, y + ly, st.pos.z - lx * sn), this.q, this.s.set(0.11, 0.11, 0.08), [1.0, 0.86, 0.25]);
			}
		}
	}
}
