// Visible mutation and breeding with provenance.
//
// A mutation picks 1 (subtle) or 3 (wild) meaningful genes from the feature list (body plan, limbs, proportions,
// head features, colour pattern), moves each by a clearly visible amount, adds a small drift on the rest, and then
// checks the result by decoding both bodies: it retries until the diff shows enough visible change, at least one
// change in the silhouette. The diff is also the text the player sees ("legs 4 → 6, longer neck, spots → stripes").
import { hueName } from './color.ts';
import { buildPlan, type Plan } from './build.ts';
import { GENES, type GeneName, type Genes, Prng, quantize } from './genome.ts';
import { field, prepare } from './sdf.ts';

export type Strength = 'subtle' | 'wild';

const SHAPE: GeneName[] = ['legs', 'segs', 'legLen', 'neck', 'headSize', 'headShape', 'snout', 'fat', 'tall', 'horns', 'hornLen', 'ears', 'earLen', 'tail', 'tailLen', 'spikes', 'antennae', 'stalks', 'eyes', 'eyeSize', 'arms', 'size', 'mouth', 'legStyle', 'segLen'];
const COLOUR: GeneName[] = ['pattern', 'hue', 'scheme', 'patternScale'];
const DISCRETE = new Set<GeneName>(['segs', 'legs', 'legStyle', 'hopper', 'arms', 'headShape', 'eyes', 'eyeLayout', 'stalks', 'horns', 'ears', 'spikes', 'mouth', 'teeth', 'blush', 'tail', 'tailTip', 'antennae', 'scheme', 'pattern']);
const MEANINGFUL = new Set<GeneName>([...SHAPE, ...COLOUR]);

const reflect = (v: number) => {
	let x = v;
	while (x < 0 || x >= 1) x = x < 0 ? -x : 1.998 - x;
	return Math.min(0.999, Math.max(0, x));
};

const ARROW = '→';

/** What visibly differs between two bodies, in words. shape = silhouette-level changes. */
export function describeDiff(a: Plan, b: Plan): { shape: string[]; colour: string[] } {
	const shape: string[] = [];
	const colour: string[] = [];
	const word: Record<string, string> = { blob: 'blob', mono: 'pogo', biped: 'biped', quad: 'quadruped', hexa: 'hexapod', octo: 'octopod' };
	if (a.legs.length !== b.legs.length) shape.push(`legs ${a.legs.length} ${ARROW} ${b.legs.length}`);
	else if (a.kind !== b.kind) shape.push(`${word[a.kind]} ${ARROW} ${word[b.kind]}`);
	const rel = (x: number, y: number) => (y - x) / Math.max(1e-3, Math.abs(x));
	if (a.legs.length && b.legs.length && a.legs.length === b.legs.length) {
		const d = rel(a.legLength / a.R, b.legLength / b.R);
		if (Math.abs(d) > 0.15) shape.push(d > 0 ? 'longer legs' : 'shorter legs');
		if (a.legs[0].style !== b.legs[0].style) shape.push({ straight: 'straight legs', digi: 'springy legs', insect: 'bug legs' }[b.legs[0].style]);
	}
	const ds = rel(a.size, b.size);
	if (Math.abs(ds) > 0.18) shape.push(ds > 0 ? 'bigger' : 'smaller');
	const seg = (p: Plan) => p.segBones.length;
	if (seg(a) !== seg(b)) shape.push(seg(b) > seg(a) ? 'longer body' : 'shorter body');
	if (Math.abs(a.genes.fat - b.genes.fat) > 0.22) shape.push(b.genes.fat > a.genes.fat ? 'chubbier' : 'slimmer');
	const neck = (p: Plan) => p.genes.neck * p.genes.neck;
	if (Math.abs(neck(a) - neck(b)) > 0.2) shape.push(neck(b) > neck(a) ? 'longer neck' : 'shorter neck');
	if (Math.floor(a.genes.headShape * 4) !== Math.floor(b.genes.headShape * 4)) shape.push(['round head', 'wide head', 'tall head', 'long head'][Math.floor(b.genes.headShape * 4)]);
	if (a.genes.snout > 0.45 !== b.genes.snout > 0.45) shape.push(b.genes.snout > 0.45 ? 'snout' : 'no snout');
	if (a.eyes.length !== b.eyes.length) shape.push(`eyes ${a.eyes.length} ${ARROW} ${b.eyes.length}`);
	else if (Math.abs(a.genes.eyeSize - b.genes.eyeSize) > 0.3) shape.push(b.genes.eyeSize > a.genes.eyeSize ? 'bigger eyes' : 'smaller eyes');
	const has = (p: Plan, t: string) => p.traits.some((x) => x.includes(t));
	for (const [t, on, off] of [
		['horn', 'horns', 'no horns'],
		['crown', 'a crown', 'no crown'],
		['fins', 'fins', 'no fins'],
		['spiky', 'spikes', 'no spikes'],
		['antennae', 'antennae', 'no antennae'],
		['stalks', 'eye stalks', 'no eye stalks'],
		['arms', 'arms', 'no arms'],
		['tusks', 'tusks', 'no tusks'],
		['beak', 'a beak', 'no beak'],
		['teeth', 'buck teeth', 'no buck teeth'],
	] as const) {
		if (has(a, t) !== has(b, t)) shape.push(has(b, t) ? on : off);
	}
	const ear = (p: Plan) => p.traits.find((x) => x.endsWith('ears')) ?? 'no ears';
	if (ear(a) !== ear(b)) shape.push(ear(b));
	const tail = (p: Plan) => p.chains.find((c) => c.kind === 'tail');
	const ta = tail(a),
		tb = tail(b);
	if (!!ta !== !!tb) shape.push(tb ? 'a tail' : 'no tail');
	else if (ta && tb) {
		if (ta.tip !== tb.tip) shape.push(tb.tip === 'none' ? 'plain tail' : `${tb.tip} tail`);
		else if (Math.abs(rel(ta.length / a.R, tb.length / b.R)) > 0.25) shape.push(tb.length / b.R > ta.length / a.R ? 'longer tail' : 'shorter tail');
	}
	const pn = (k: string) => (k === 'none' ? 'plain' : k);
	if (a.pattern.kind !== b.pattern.kind) colour.push(`${pn(a.pattern.kind)} ${ARROW} ${pn(b.pattern.kind)}`);
	const ha = hueName(a.palette.hue),
		hb = hueName(b.palette.hue);
	if (ha !== hb) colour.push(`${ha.toLowerCase()} ${ARROW} ${hb.toLowerCase()}`);
	else if (Math.floor(a.genes.scheme * 5) !== Math.floor(b.genes.scheme * 5)) colour.push('new accent colours');
	return { shape, colour };
}

/**
 * Rest-pose silhouettes (side and front) on a G x G grid: body SDF, legs, arms, tails and antennae as thick lines,
 * eyes as discs. Returns 1 - IoU averaged over both views (0 = identical outline).
 */
export function silhouetteDiff(a: Plan, b: Plan, G = 32): number {
	const ext = Math.max(a.radius, b.radius, a.top, b.top, ...a.footprint, ...b.footprint) * 2.4;
	const sa = silhouettes(a, ext, G),
		sb = silhouettes(b, ext, G);
	let tot = 0;
	for (let v = 0; v < 2; v++) {
		let inter = 0,
			uni = 0;
		for (let i = 0; i < G * G; i++) {
			if (sa[v][i] && sb[v][i]) inter++;
			if (sa[v][i] || sb[v][i]) uni++;
		}
		tot += 1 - inter / Math.max(1, uni);
	}
	return tot / 2;
}

export function silhouettes(p: Plan, ext: number, G: number): [Uint8Array, Uint8Array] {
	const solid = p.parts.filter((q) => q.op !== 'paint');
	prepare(solid);
	const cell = ext / G;
	const side = new Uint8Array(G * G);
	const front = new Uint8Array(G * G);
	const ix = (v: number) => Math.floor(v / cell + G / 2);
	const iy = (v: number) => Math.floor(v / cell);
	const put = (x: number, y: number, z: number, rr: number) => {
		for (let dy = -rr; dy <= rr; dy++)
			for (let dx = -rr; dx <= rr; dx++) {
				const yy = iy(y) + dy;
				if (yy < 0 || yy >= G) continue;
				const zz = ix(z) + dx,
					xx = ix(x) + dx;
				if (zz >= 0 && zz < G) side[zz + yy * G] = 1;
				if (xx >= 0 && xx < G) front[xx + yy * G] = 1;
			}
	};
	for (let k = 0; k < G; k++)
		for (let j = 0; j < G; j++)
			for (let i = 0; i < G; i++) {
				const x = (i - G / 2 + 0.5) * cell,
					y = (j + 0.5) * cell,
					z = (k - G / 2 + 0.5) * cell;
				if (field(solid, x, y, z) < 0) {
					side[k + j * G] = 1;
					front[i + j * G] = 1;
				}
			}
	const line = (a: readonly number[], b: readonly number[], r: number) => {
		const steps = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / (cell * 0.5)) + 1;
		const rr = Math.max(0, Math.round(r / cell));
		for (let s = 0; s <= steps; s++) {
			const t = s / steps;
			put(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, rr);
		}
	};
	for (const l of p.legs) {
		const knee = [(l.hip[0] + l.foot[0]) / 2, (l.hip[1] + l.footR) / 2, (l.hip[2] + l.foot[2]) / 2];
		line(l.hip, knee, l.thick);
		line(knee, [l.foot[0], l.footR, l.foot[2]], l.thick * 0.7);
		put(l.foot[0], l.footR * 0.6, l.foot[2], Math.max(0, Math.round(l.footR / cell)));
	}
	for (const a of p.arms) line(a.shoulder, [a.shoulder[0] + a.side * (a.upper + a.lower) * 0.3, a.shoulder[1] - (a.upper + a.lower) * 0.8, a.shoulder[2]], a.thick);
	for (const c of p.chains) line(c.anchor, [c.anchor[0] + c.dir[0] * c.length, c.anchor[1] + c.dir[1] * c.length, c.anchor[2] + c.dir[2] * c.length], (c.r0 + c.r1) / 2);
	for (const e of p.eyes) if (e.stalk < 0) put(e.pos[0], e.pos[1], e.pos[2], Math.max(0, Math.round(e.r / cell)));
	return [side, front];
}

/** How much each kind of change reads at a glance (silhouette weight). */
export function visibleWeight(change: string): number {
	if (change.startsWith('legs ') || /biped|quadruped|hexapod|octopod|pogo|blob/.test(change)) return 1;
	if (/bigger|smaller|longer body|shorter body/.test(change)) return 0.7;
	if (/legs|neck|chubbier|slimmer|head|snout|tail/.test(change)) return 0.5;
	if (/eyes|stalks|arms|fins|ears|crown/.test(change)) return 0.35;
	if (/horns|spikes|antennae|beak|tusks|teeth/.test(change)) return 0.3;
	return 0.25; // colour and pattern
}

export interface MutationResult {
	genes: Genes;
	changes: string[];
	shapeChanges: number;
	touched: GeneName[];
}

export function mutateVisible(g: Genes, seed: number, strength: Strength = 'subtle'): MutationResult {
	const r = new Prng(seed ^ 0x77aa11);
	const parent = buildPlan(g);
	const want = strength === 'wild' ? 3 : 1;
	let best: MutationResult | null = null;
	let bestScore = -1;
	for (let attempt = 0; attempt < 30; attempt++) {
		const o = { ...g };
		const touched: GeneName[] = [];
		const n = strength === 'wild' ? 3 + (r.next() < 0.35 ? 1 : 0) : 1 + (r.next() < 0.3 ? 1 : 0);
		while (touched.length < n) {
			// the first pick is always a silhouette gene
			const src = touched.length === 0 || r.next() < 0.75 ? SHAPE : COLOUR;
			const k = r.pick(src);
			if (!touched.includes(k)) touched.push(k);
		}
		for (const k of touched) {
			if (DISCRETE.has(k)) {
				// jump to a clearly different position on the gene (a different trait)
				let v = r.next();
				for (let t = 0; t < 8 && Math.abs(v - o[k]) < 0.22; t++) v = r.next();
				o[k] = v;
			} else {
				const lo = strength === 'wild' ? 0.35 : 0.24,
					hi = strength === 'wild' ? 0.6 : 0.4;
				const dir = o[k] > 0.7 ? -1 : o[k] < 0.3 ? 1 : r.next() < 0.5 ? -1 : 1;
				o[k] = reflect(o[k] + dir * r.range(lo, hi));
			}
		}
		// small drift on everything else that is continuous (personality included)
		const drift = strength === 'wild' ? 0.05 : 0.025;
		for (const k of GENES) if (!touched.includes(k) && !DISCRETE.has(k) && !MEANINGFUL.has(k)) o[k] = reflect(o[k] + r.gauss() * drift);
		const q = quantize(o);
		const d = describeDiff(parent, buildPlan(q));
		const changes = [...d.shape, ...d.colour];
		const res: MutationResult = { genes: q, changes, shapeChanges: d.shape.length, touched };
		const weight = d.shape.reduce((m, c) => m + visibleWeight(c), 0);
		let ok = d.shape.length >= 1 && changes.length >= want && weight >= (strength === 'wild' ? 1.3 : 0.5) && (strength === 'subtle' ? changes.length <= 3 : true);
		// and the outline must really change (a coarse silhouette, a few ms)
		const sil = ok || attempt > 20 ? silhouetteDiff(parent, buildPlan(q), 28) : 0;
		if (ok && sil < (strength === 'wild' ? 0.2 : 0.08)) ok = false;
		if (ok) return res;
		const score = weight + sil * 3 + changes.length * 0.01;
		if (score > bestScore) {
			bestScore = score;
			best = res;
		}
	}
	return best!;
}

/** Gene groups, named for the Lab's gene cards. */
export const GROUP_NAMES: Array<[string, GeneName[]]> = [
	['Size', ['size']],
	['Body', ['segs', 'segLen', 'fat', 'tall', 'taper', 'arch']],
	['Legs', ['legs', 'legLen', 'legThick', 'legStyle', 'footSize', 'hopper']],
	['Arms', ['arms', 'armLen']],
	['Head', ['neck', 'headSize', 'headShape', 'snout']],
	['Eyes', ['eyes', 'eyeSize', 'eyeLayout', 'stalks']],
	['Horns', ['horns', 'hornLen', 'hornCurl']],
	['Ears', ['ears', 'earLen']],
	['Spikes', ['spikes', 'spikeSize']],
	['Mouth', ['mouth', 'teeth', 'blush']],
	['Tail', ['tail', 'tailLen', 'tailThick', 'tailTip']],
	['Antennae', ['antennae']],
	['Colour', ['hue', 'scheme', 'chroma', 'light']],
	['Pattern', ['pattern', 'patternScale']],
	['Personality', ['speed', 'bounce', 'googly', 'shy', 'social', 'curious']],
];

export type Origin = 'A' | 'B' | 'mix' | 'new';

/** Two parents give a child: whole groups from one parent, some continuous groups blended, sometimes a surprise. */
export function breedTracked(a: Genes, b: Genes, seed: number): { genes: Genes; from: Record<string, Origin> } {
	const r = new Prng(seed ^ 0xb7eed);
	const o = {} as Genes;
	const from: Record<string, Origin> = {};
	for (const [name, group] of GROUP_NAMES) {
		const pickA = r.next() < 0.5;
		const blend = r.next() < 0.3 && group.some((k) => !DISCRETE.has(k));
		const t = r.range(0.3, 0.7);
		for (const k of group) o[k] = blend && !DISCRETE.has(k) ? a[k] * (1 - t) + b[k] * t : pickA ? a[k] : b[k];
		from[name] = blend ? 'mix' : pickA ? 'A' : 'B';
	}
	if (r.next() < 0.5) {
		const k = r.pick(SHAPE.filter((x) => !DISCRETE.has(x)));
		o[k] = reflect(o[k] + (r.next() < 0.5 ? -1 : 1) * r.range(0.12, 0.25));
		const g = GROUP_NAMES.find(([, ks]) => ks.includes(k));
		if (g) from[g[0]] = 'new';
	}
	return { genes: quantize(o), from };
}

/** For a mutant: every group the mutation touched is "new", the rest came from its one parent. */
export function mutationOrigins(touched: GeneName[]): Record<string, Origin> {
	const from: Record<string, Origin> = {};
	for (const [name, ks] of GROUP_NAMES) from[name] = ks.some((k) => touched.includes(k)) ? 'new' : 'A';
	return from;
}
