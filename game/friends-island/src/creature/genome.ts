// The genome: a flat list of named genes in 0..1. Everything a creature is comes from these numbers plus the
// body-plan rules in build.ts. Genes are stored, mutated and bred in this uniform space; the rules turn them into
// coherent bodies, so any gene vector is a valid creature.
//
// A genome is written as a short code: "C1" + one base64url character per gene (6 bits each). A seed (any word or
// number) is hashed into a random genome; mutated and bred creatures keep their code, which re-hatches them exactly.

export const GENES = [
	// body
	'size',
	'segs',
	'segLen',
	'fat',
	'tall',
	'taper',
	'arch',
	// legs and arms
	'legs',
	'legLen',
	'legThick',
	'legStyle',
	'footSize',
	'hopper',
	'arms',
	'armLen',
	// head
	'neck',
	'headSize',
	'headShape',
	'snout',
	'eyes',
	'eyeSize',
	'eyeLayout',
	'stalks',
	'horns',
	'hornLen',
	'hornCurl',
	'ears',
	'earLen',
	'spikes',
	'spikeSize',
	'mouth',
	'teeth',
	'blush',
	// tail and antennae
	'tail',
	'tailLen',
	'tailThick',
	'tailTip',
	'antennae',
	// colour
	'hue',
	'scheme',
	'pattern',
	'patternScale',
	'chroma',
	'light',
	// personality
	'speed',
	'bounce',
	'googly',
	'shy',
	'social',
	'curious',
] as const;

export type GeneName = (typeof GENES)[number];
export type Genes = Record<GeneName, number>;

/** Genes that pick a discrete trait. Mutation touches them less often, so mutants stay recognisable. */
const DISCRETE = new Set<GeneName>(['segs', 'legs', 'legStyle', 'hopper', 'arms', 'headShape', 'eyes', 'eyeLayout', 'stalks', 'horns', 'ears', 'spikes', 'mouth', 'teeth', 'blush', 'tail', 'tailTip', 'antennae', 'scheme', 'pattern']);

/** Gene groups inherited together when breeding, so a child gets a parent's whole head, not half a horn. */
const GROUPS: GeneName[][] = [
	['size'],
	['segs', 'segLen', 'fat', 'tall', 'taper', 'arch'],
	['legs', 'legLen', 'legThick', 'legStyle', 'footSize', 'hopper'],
	['arms', 'armLen'],
	['neck', 'headSize', 'headShape', 'snout'],
	['eyes', 'eyeSize', 'eyeLayout', 'stalks'],
	['horns', 'hornLen', 'hornCurl'],
	['ears', 'earLen'],
	['spikes', 'spikeSize'],
	['mouth', 'teeth', 'blush'],
	['tail', 'tailLen', 'tailThick', 'tailTip'],
	['antennae'],
	['hue', 'scheme', 'chroma', 'light'],
	['pattern', 'patternScale'],
	['speed', 'bounce', 'googly', 'shy', 'social', 'curious'],
];

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
export const CODE_PREFIX = 'C1';

/** mulberry32: small, fast, good enough for gameplay. */
export class Prng {
	s: number;
	constructor(seed: number) {
		this.s = seed >>> 0;
	}
	next(): number {
		this.s = (this.s + 0x6d2b79f5) >>> 0;
		let t = this.s;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	}
	range(a: number, b: number) {
		return a + (b - a) * this.next();
	}
	gauss() {
		const u = 1 - this.next(),
			v = this.next();
		return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
	}
	pick<T>(a: readonly T[]): T {
		return a[Math.floor(this.next() * a.length)];
	}
}

/** FNV-1a string hash. Plain integers hash to themselves so "4417" is seed 4417. */
export function hashSeed(s: string | number): number {
	const str = String(s).trim();
	if (/^\d{1,9}$/.test(str)) return Number(str) >>> 0;
	let h = 0x811c9dc5;
	for (let i = 0; i < str.length; i++) {
		h ^= str.charCodeAt(i);
		h = Math.imul(h, 0x01000193);
	}
	return h >>> 0;
}

const q = (v: number) => Math.max(0, Math.min(63, Math.floor(v * 64)));
const dq = (i: number) => (i + 0.5) / 64;

export function quantize(g: Genes): Genes {
	const o = {} as Genes;
	for (const k of GENES) o[k] = dq(q(g[k]));
	return o;
}

export function encode(g: Genes): string {
	let s = CODE_PREFIX;
	for (const k of GENES) s += B64[q(g[k])];
	return s;
}

export function isCode(s: string): boolean {
	const t = s.trim();
	return t.startsWith(CODE_PREFIX) && t.length === CODE_PREFIX.length + GENES.length && [...t.slice(2)].every((c) => B64.includes(c));
}

export function decode(code: string): Genes {
	const t = code.trim();
	const o = {} as Genes;
	GENES.forEach((k, i) => {
		o[k] = dq(Math.max(0, B64.indexOf(t[CODE_PREFIX.length + i])));
	});
	return o;
}

export function fromSeed(seed: string | number): Genes {
	const r = new Prng(hashSeed(seed) ^ 0x5eed);
	r.next();
	const o = {} as Genes;
	for (const k of GENES) o[k] = r.next();
	return quantize(o);
}

/** Any input: a genome code, or a seed word or number. */
export function fromInput(s: string): Genes {
	return isCode(s) ? decode(s) : fromSeed(s);
}

const clamp01 = (v: number) => Math.min(0.999, Math.max(0, v));

/**
 * Small changes: about a quarter of the continuous genes nudge by ~0.07, and now and then one discrete trait flips.
 * Always changes something visible (at least two genes move a full code step).
 */
export function mutate(g: Genes, seed: number, strength = 1): Genes {
	const r = new Prng(seed ^ 0x77aa11);
	const o = { ...g };
	let changed = 0;
	for (const k of GENES) {
		const disc = DISCRETE.has(k);
		const p = (disc ? 0.07 : 0.28) * strength;
		if (r.next() < p) {
			const before = q(o[k]);
			o[k] = disc ? (r.next() < 0.5 ? r.next() : clamp01(o[k] + r.gauss() * 0.18)) : clamp01(o[k] + r.gauss() * 0.075 * strength);
			if (q(o[k]) !== before) changed++;
		}
	}
	// guarantee a visible change
	const visible: GeneName[] = ['hue', 'pattern', 'legLen', 'headSize', 'eyes', 'horns', 'ears', 'tailLen', 'fat', 'snout'];
	while (changed < 2) {
		const k = r.pick(visible);
		o[k] = clamp01(o[k] + (r.next() < 0.5 ? -1 : 1) * (0.06 + r.next() * 0.08));
		changed++;
	}
	return quantize(o);
}

/** Two parents give a child: whole gene groups come from one parent, continuous genes sometimes blend, then a light mutation. */
export function breed(a: Genes, b: Genes, seed: number): Genes {
	const r = new Prng(seed ^ 0xb7eed);
	const o = {} as Genes;
	for (const group of GROUPS) {
		const from = r.next() < 0.5 ? a : b;
		const blend = r.next() < 0.35;
		const t = r.range(0.3, 0.7);
		for (const k of group) o[k] = blend && !DISCRETE.has(k) ? a[k] * (1 - t) + b[k] * t : from[k];
	}
	return mutate(o, seed ^ 0x51, 0.45);
}

/** Distance between genomes (0 identical .. ~1 unrelated); flocking groups creatures by it. */
export function kinship(a: Genes, b: Genes): number {
	let s = 0;
	const keys: GeneName[] = ['legs', 'segs', 'hue', 'size', 'headShape', 'horns', 'ears', 'pattern', 'eyes', 'tail'];
	for (const k of keys) s += Math.abs(a[k] - b[k]);
	return s / keys.length;
}

// ---- names ----
const START = ['bl', 'sn', 'w', 'gl', 'fl', 'p', 'm', 'z', 'squ', 'b', 'gr', 'n', 'pl', 'br', 'sk', 'd', 'f', 'tw', 'ch', 'l', 'g', 'h', 'sm', 'cr'];
const VOW = ['o', 'u', 'oo', 'i', 'a', 'ee', 'ui', 'e', 'ou', 'oi'];
const MID = ['b', 'mp', 'gg', 'z', 'ff', 'ck', 'm', 'p', 'nk', 'zz', 'bb', 'dd', 'll', 'n', 'rb', 'sh'];
const END = ['le', 'y', 'o', 'et', 'snoot', 'kin', 'bert', 'loo', 'nub', 'ums', 'ix', 'ble', 'wump', 'ster', 'ling', 'ette', 'muffin', 'bean'];

export function nameFor(code: string): string {
	const r = new Prng(hashSeed(code) ^ 0x4e414d45);
	const syl = r.next() < 0.45 ? 1 : 2;
	let n = r.pick(START) + r.pick(VOW);
	if (syl === 2) n += r.pick(MID) + r.pick(VOW);
	n += r.next() < 0.6 ? r.pick(END) : r.pick(MID);
	n = n.replace(/(.)\1\1+/g, '$1$1');
	return n.charAt(0).toUpperCase() + n.slice(1);
}
