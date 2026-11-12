// Body-plan rules: genes -> a coherent creature. This is where "always charming, never broken" lives:
//  - every part is placed by casting from inside the body to its surface (eyes, horns, ears, hips, tail, arms),
//    so nothing floats and nothing is buried;
//  - legs are long enough that the belly clears the ground, and short enough to stay under the body;
//  - thin parts never go below the mesher's voxel size;
//  - gaits come from the leg count (Hecker et al., SIGGRAPH 2008, motion retargeting to varied morphologies: legs grouped into pairs with phase offsets).
// Output is plain data (no three.js), shared by the mesher worker, the runtime and the Node tests.
import { hueName, makePalette, mixRGB, type Palette, type RGB } from './color.ts';
import { encode, type Genes, nameFor, Prng } from './genome.ts';
import { add, basisRows, exitPoint, field, len, lerp3, norm, type Part, partDist, prepare, scale, sub, type V3 } from './sdf.ts';

export type LegStyle = 'straight' | 'digi' | 'insect';
export type BodyKind = 'blob' | 'mono' | 'biped' | 'quad' | 'hexa' | 'octo';

export interface Bone {
	name: string;
	/** rest position in creature space (ground at y = 0, forward +Z) */
	rest: V3;
	parent: number;
}

export interface LegPlan {
	pair: number;
	side: 1 | -1;
	bone: number;
	/** hip anchor, rest creature space (inside the body) */
	hip: V3;
	/** rest foot centre on the ground (y = 0 plane), creature space */
	foot: V3;
	upper: number;
	lower: number;
	/** digitigrade metatarsal length (0 for two-segment legs) */
	meta: number;
	thick: number;
	footR: number;
	/** knee direction in creature space */
	pole: V3;
	style: LegStyle;
}

export interface ArmPlan {
	side: 1 | -1;
	bone: number;
	shoulder: V3;
	upper: number;
	lower: number;
	thick: number;
	handR: number;
}

export interface EyePlan {
	bone: number;
	/** centre and outward normal, rest creature space */
	pos: V3;
	n: V3;
	r: number;
	pupil: number;
	/** index into stalks when the eye sits on a stalk tip */
	stalk: number;
}

export interface ChainPlan {
	kind: 'tail' | 'antenna' | 'stalk';
	bone: number;
	anchor: V3;
	/** rest direction (unit), creature space */
	dir: V3;
	length: number;
	segments: number;
	r0: number;
	r1: number;
	/** 0 floppy .. 1 stiff */
	stiffness: number;
	tip: 'none' | 'ball' | 'fluff' | 'spade' | 'eye';
	tipR: number;
	color: RGB;
	tipColor: RGB;
	/** curl of the rest shape (radians per segment, around the side axis) */
	curl: number;
}

export interface GaitPlan {
	/** slow and fast phase offsets per leg (same order as legs) */
	slow: number[];
	fast: number[];
	dutySlow: number;
	dutyFast: number;
	hop: boolean;
	/** extra offsets for a gallop at full speed (quadrupeds), or null */
	gallop: number[] | null;
}

export interface Plan {
	code: string;
	name: string;
	species: string;
	traits: string[];
	genes: Genes;
	kind: BodyKind;
	size: number;
	/** main torso radius (m) */
	R: number;
	parts: Part[];
	bones: Bone[];
	segBones: number[];
	headBone: number;
	hornBone: number;
	earBones: number[];
	legs: LegPlan[];
	arms: ArmPlan[];
	eyes: EyePlan[];
	chains: ChainPlan[];
	gait: GaitPlan;
	palette: Palette;
	pattern: { kind: 'none' | 'spots' | 'stripes' | 'patches' | 'gradient'; scale: number; seed: number };
	/** body origin height above ground at rest */
	height: number;
	/** rest leg length used for speeds and step sizes (m); 0 for legless */
	legLength: number;
	/** bounding radius around the body origin (culling, separation, contact shadow) */
	radius: number;
	/** top of the head (labels, camera framing) */
	top: number;
	/** half extents of the body footprint (x side, z forward) */
	footprint: [number, number];
	/** smallest feature radius, sets the mesher's voxel size */
	minFeature: number;
	personality: { speed: number; bounce: number; googly: number; shy: number; social: number; curious: number };
	walkSpeed: number;
	runSpeed: number;
	wings: boolean;
	/** the mouth, drawn as clean overlay shapes (dark interior, lip edge, teeth, tongue) that open and close */
	mouth: MouthPlan | null;
}

export interface MouthPlan {
	bone: number;
	/** rest-space point on the skin, its outward normal, up and lateral axes */
	p: V3;
	n: V3;
	up: V3;
	/** half width (m) */
	w: number;
	style: 'smile' | 'open' | 'beak';
	teeth: 'none' | 'buck' | 'fangs' | 'tusks';
	tongue: boolean;
	inside: RGB;
	lip: RGB;
	tooth: RGB;
	tongueColor: RGB;
}

const UP: V3 = [0, 1, 0];
const pickIdx = (g: number, cuts: number[]) => {
	for (let i = 0; i < cuts.length; i++) if (g < cuts[i]) return i;
	return cuts.length;
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const rotY = (v: V3, a: number): V3 => [v[0] * Math.cos(a) + v[2] * Math.sin(a), v[1], -v[0] * Math.sin(a) + v[2] * Math.cos(a)];
/** direction from yaw (around Y, 0 = +Z) and pitch (up positive) */
const dirYP = (yaw: number, pitch: number): V3 => [Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)];
/** rotate v around unit axis k by angle a (Rodrigues) */
function rotAxis(v: V3, k: V3, a: number): V3 {
	const c = Math.cos(a),
		s = Math.sin(a);
	const kv: V3 = [k[1] * v[2] - k[2] * v[1], k[2] * v[0] - k[0] * v[2], k[0] * v[1] - k[1] * v[0]];
	const kd = k[0] * v[0] + k[1] * v[1] + k[2] * v[2];
	return [v[0] * c + kv[0] * s + k[0] * kd * (1 - c), v[1] * c + kv[1] * s + k[1] * kd * (1 - c), v[2] * c + kv[2] * s + k[2] * kd * (1 - c)];
}

export function buildPlan(genes: Genes, extra: { name?: string } = {}): Plan {
	const g = genes;
	const code = encode(g);
	const rnd = new Prng(Math.floor(g.hue * 9973 + g.size * 7919 + g.eyes * 104729 + g.pattern * 31337));
	const pal = makePalette(g.hue, g.scheme, g.chroma, g.light);

	// ---- size: log-spread from tiny (0.3) to huge (2.6), extremes rarer ----
	const u = 0.5 + 0.5 * Math.sign(g.size - 0.5) * Math.pow(Math.abs(2 * g.size - 1), 1.35);
	const S = 0.3 * Math.exp(Math.log(2.6 / 0.3) * u);
	const R = 0.3 * S;
	const minR = Math.max(0.011, R * 0.075);

	// ---- body kind ----
	const kinds: BodyKind[] = ['blob', 'mono', 'biped', 'quad', 'hexa', 'octo'];
	const kind = kinds[pickIdx(g.legs, [0.06, 0.1, 0.4, 0.72, 0.88])];
	const pairs = { blob: 0, mono: 0, biped: 1, quad: 2, hexa: 3, octo: 4 }[kind];
	const upright = kind === 'biped' || kind === 'mono' || (kind === 'blob' && g.tall > 0.5);
	const segChoices: Record<BodyKind, number[]> = { blob: [1, 1, 2], mono: [1], biped: [1, 1, 2], quad: [1, 1, 2, 3], hexa: [1, 2, 3], octo: [2, 3, 4] };
	const segOpts = segChoices[kind];
	const nSeg = segOpts[Math.min(segOpts.length - 1, Math.floor(g.segs * segOpts.length))];

	const parts: Part[] = [];
	const bones: Bone[] = [];
	const addBone = (name: string, rest: V3, parent: number) => {
		bones.push({ name, rest, parent });
		return bones.length - 1;
	};
	const skin = pal.body;
	const ell = (c: V3, r: V3, bone: number, color: RGB, k: number, tag: string, pat = 1, m?: number[]): Part => ({ kind: 'ell', op: 'add', c, r, m, bone, color, k, pat, tag });
	const cone = (a: V3, b: V3, ra: number, rb: number, bone: number, color: RGB, k: number, tag: string, pat = 1): Part => ({ kind: 'cone', op: 'add', a, b, ra, rb, bone, color, k, pat, tag });

	// ---- torso segments (body origin at 0,0,0; shifted to standing height at the end) ----
	const fat = mix(0.82, 1.3, g.fat);
	const tall = mix(0.78, 1.22, g.tall);
	const taper = (g.taper - 0.5) * 0.55;
	const segs: Array<{ c: V3; r: V3; bone: number }> = [];
	if (upright) {
		// stacked: pelvis/belly at the bottom, chest above, leaning forward a little
		const lean = mix(0.08, 0.42, g.arch);
		const spineDir: V3 = [0, Math.cos(lean), Math.sin(lean)];
		let y = 0;
		for (let i = 0; i < nSeg; i++) {
			const s = 1 + taper * (nSeg === 1 ? 0 : i === 0 ? -1 : 1);
			const r: V3 = [R * fat * s, R * mix(1.05, 1.35, g.tall) * s * (nSeg === 1 ? 1.08 : 0.82), R * mix(0.85, 1.05, g.segLen) * s];
			if (i > 0) y += segs[i - 1].r[1] * 0.75 + r[1] * 0.6;
			const c = scale(spineDir, y);
			segs.push({ c, r, bone: -1 });
		}
	} else {
		const elong = nSeg === 1 ? mix(1.0, 1.65, g.segLen) : mix(0.78, 1.02, g.segLen);
		const spacing = R * mix(0.95, 1.35, g.segLen);
		const arch = (g.arch - 0.5) * 0.5 * R;
		for (let i = 0; i < nSeg; i++) {
			const t = nSeg === 1 ? 0 : i / (nSeg - 1) - 0.5; // -0.5 back .. 0.5 front
			const s = 1 + taper * t * 2;
			const r: V3 = [R * fat * s, R * tall * s * 0.9, R * elong * s];
			const z = (i - (nSeg - 1) / 2) * spacing;
			const y = nSeg > 2 ? -arch * (4 * t * t - 1) : 0;
			segs.push({ c: [0, y, z], r, bone: -1 });
		}
	}
	for (let i = 0; i < segs.length; i++) {
		segs[i].bone = addBone(`seg${i}`, segs[i].c, i === 0 ? -1 : i - 1);
		parts.push(ell(segs[i].c, segs[i].r, segs[i].bone, skin, R * 0.45, `seg${i}`));
	}
	const front = upright ? segs[segs.length - 1] : segs[segs.length - 1];
	const back = segs[0];
	const segBones = segs.map((s) => s.bone);

	// ---- head ----
	const headless = (kind === 'blob' || kind === 'mono') && g.headShape < 0.45;
	const headR = headless ? 0 : R * mix(0.55, 1.0, g.headSize) * (upright ? 1.0 : 0.95);
	let headC: V3;
	let headBone: number;
	let muzzleC: V3 | null = null;
	const headShape = Math.floor(g.headShape * 4);
	if (headless) {
		headC = front.c;
		headBone = addBone('head', front.c, front.bone);
	} else {
		const neckLen = R * mix(-0.15, 1.1, g.neck * g.neck);
		const neckPitch = upright ? 1.35 : mix(0.15, 0.8, g.neck);
		const nd: V3 = upright ? norm([0, 1, 0.25]) : dirYP(0, neckPitch);
		const fr = front.r;
		const reach = upright ? fr[1] * 0.85 : fr[2] * 0.8;
		headC = add(front.c, scale(nd, reach + Math.max(0, neckLen) + headR * 0.55));
		headBone = addBone('head', headC, front.bone);
		if (neckLen > R * 0.2) {
			const a = add(front.c, scale(nd, reach * 0.5));
			const mid = lerp3(a, headC, 0.5);
			const nr = Math.max(minR * 1.6, Math.min(headR, fr[0]) * 0.5);
			parts.push(cone(a, mid, nr * 1.15, nr, front.bone, skin, R * 0.3, 'neck0'));
			parts.push(cone(mid, headC, nr, nr * 0.95, headBone, skin, R * 0.3, 'neck1'));
		}
		const hr: V3 = headShape === 1 ? [headR * 1.22, headR * 0.92, headR] : headShape === 2 ? [headR * 0.92, headR * 1.2, headR * 0.92] : headShape === 3 ? [headR * 0.95, headR * 0.92, headR * 1.25] : [headR, headR, headR];
		parts.push(ell(headC, hr, headBone, skin, R * 0.38, 'head'));
		if (g.snout > 0.45) {
			const sl = headR * mix(0.35, 0.95, (g.snout - 0.45) / 0.55);
			muzzleC = add(headC, [0, -headR * 0.18, headR * 0.55 + sl * 0.5]);
			parts.push(ell(muzzleC, [headR * 0.55, headR * 0.45, sl * 0.75 + headR * 0.25], headBone, mixRGB(skin, pal.belly, 0.35), headR * 0.3, 'muzzle'));
		}
	}

	// shared surface caster on the parts so far
	const castFrom = (from: V3, dir: V3, maxD: number) => {
		prepare(parts);
		return exitPoint(parts, from, dir, maxD);
	};

	// ---- legs ----
	const legs: LegPlan[] = [];
	let style: LegStyle = 'straight';
	if (pairs > 0) {
		const sg = g.legStyle;
		style = kind === 'biped' ? (sg < 0.55 ? 'straight' : 'digi') : kind === 'quad' ? (sg < 0.6 ? 'straight' : sg < 0.85 ? 'digi' : 'insect') : sg < 0.8 ? 'insect' : 'straight';
	}
	if (kind === 'mono') style = 'straight';
	let L = 0;
	let height = 0;
	const thick0 = mix(0.065, 0.15, g.legThick);
	if (pairs > 0 || kind === 'mono') {
		const lengthScale = kind === 'biped' ? mix(1.1, 3.0, g.legLen) : style === 'insect' ? mix(1.4, 3.4, g.legLen) : mix(0.75, 2.8, g.legLen);
		L = R * lengthScale;
		const splay = style === 'insect' ? mix(0.62, 0.95, g.legLen) : kind === 'biped' ? 0.06 : 0.1;
		const ext = style === 'insect' ? 0.74 : style === 'digi' ? 0.8 : 0.78;
		// hip anchors: cast from points along the spine (front pair first) out through the lower side of the body
		const hipList: Array<{ pair: number; side: 1 | -1; seg: number; from: V3 }> = [];
		if (kind === 'mono') hipList.push({ pair: 0, side: 1, seg: 0, from: back.c });
		for (let j = 0; j < pairs; j++) {
			let from: V3;
			let segI: number;
			if (upright) {
				segI = 0;
				from = back.c;
			} else {
				const frontZ = front.c[2] + front.r[2] * (nSeg === 1 ? 0.52 : 0.25);
				const backZ = back.c[2] - back.r[2] * (nSeg === 1 ? 0.52 : 0.25);
				const t = pairs === 1 ? 0.5 : j / (pairs - 1);
				const z = mix(frontZ, backZ, t);
				segI = 0;
				let best = 1e9;
				segs.forEach((s, i) => {
					const d = Math.abs(s.c[2] - z);
					if (d < best) {
						best = d;
						segI = i;
					}
				});
				from = [0, segs[segI].c[1], z];
			}
			for (const side of [1, -1] as const) hipList.push({ pair: j, side, seg: segI, from });
		}
		const theta = style === 'insect' ? 1.15 : kind === 'biped' ? 0.62 : 0.7;
		const thickFor = (Lx: number) => Math.max(minR * 1.15, Math.min(R * 0.42, Lx * thick0));
		const footSize = mix(0.9, 1.3, g.footSize);
		// lengthen legs until the belly clears the ground
		for (let attempt = 0; attempt < 12; attempt++) {
			const t = thickFor(L);
			const hipsLocal = hipList.map((h) => {
				const dir: V3 = kind === 'mono' ? [0, -1, 0] : [h.side * Math.sin(theta), -Math.cos(theta), 0];
				const ex = castFrom(h.from, dir, R * 4);
				return add(ex.p, scale(ex.n, -t * 0.85));
			});
			const hipY = hipsLocal.reduce((m, p) => m + p[1], 0) / hipsLocal.length;
			const hipH = ext * L * Math.cos(splay);
			const H = hipH - hipY;
			let lowest = 1e9;
			for (const s of segs) lowest = Math.min(lowest, H + s.c[1] - s.r[1]);
			if (!headless) lowest = Math.min(lowest, H + headC[1] - headR * 0.9);
			const clearance = Math.max(0.025, 0.16 * R + 0.1 * L);
			if (lowest >= clearance || attempt === 11) {
				height = H;
				hipList.forEach((h, i) => {
					const hip = hipsLocal[i];
					const lat = ext * Math.min(L * 1.6, Math.max(L * 0.65, (hip[1] + H) / (ext * Math.cos(splay)))) * Math.sin(splay);
					const footX = kind === 'mono' ? 0 : hip[0] + h.side * lat;
					const foot: V3 = [footX, 0, hip[2] + (kind === 'biped' ? R * 0.08 : 0)];
					const front = hip[2] > (segs[0].c[2] + segs[segs.length - 1].c[2]) / 2;
					let pole: V3;
					if (style === 'insect') pole = norm([h.side * 0.6, 1, (h.pair - (pairs - 1) / 2) * -0.25]);
					else if (kind === 'biped' || kind === 'mono') pole = norm([h.side * 0.12, 0, 1]);
					else if (style === 'digi') pole = norm([h.side * 0.1, 0, 1]);
					else pole = norm([h.side * 0.12, 0, front ? -1 : -0.6]);
					// each leg is sized to its own hip height so every leg rests at the same bend
					// (a tapered body gets longer back legs, like a grasshopper, instead of straight ones)
					const hipAbove = hip[1] + H;
					const Li = Math.min(L * 1.6, Math.max(L * 0.65, hipAbove / (ext * Math.cos(splay))));
					const meta = style === 'digi' ? Li * 0.24 : 0;
					const upper = style === 'insect' ? (Li - meta) * 0.46 : (Li - meta) * 0.5;
					legs.push({
						pair: h.pair,
						side: h.side,
						bone: segs[h.seg].bone,
						hip: [hip[0], hip[1] + H, hip[2]],
						foot,
						upper,
						lower: Li - meta - upper,
						meta,
						thick: t,
						footR: Math.max(minR * 1.3, t * 1.2 * footSize),
						pole,
						style,
					});
				});
				break;
			}
			L *= 1.12;
		}
	} else {
		// legless: sits on its belly
		let lowest = 1e9;
		for (const s of segs) lowest = Math.min(lowest, s.c[1] - s.r[1]);
		height = -lowest;
	}
	// move everything to standing height
	const lift = (p: V3): V3 => [p[0], p[1] + height, p[2]];
	for (const p of parts) {
		if (p.c) p.c = lift(p.c);
		if (p.a) p.a = lift(p.a);
		if (p.b) p.b = lift(p.b);
	}
	for (const b of bones) b.rest = lift(b.rest);
	for (const s of segs) s.c = lift(s.c);
	headC = lift(headC);
	if (muzzleC) muzzleC = lift(muzzleC);

	// ---- head details (placed on the surface) ----
	const traits: string[] = [];
	const eyes: EyePlan[] = [];
	const chains: ChainPlan[] = [];
	const eyeHost = headless ? front : null;
	const hc = headless ? front.c : headC;
	const hR = headless ? Math.min(front.r[0], front.r[1]) : headR;
	// every attachment is cast against the bare torso + head, so a later horn or spike can't capture it
	const base = parts.slice();
	prepare(base);
	const castBase = (from: V3, dir: V3, maxD: number) => exitPoint(base, from, dir, maxD);
	let mouthP: V3 | null = null;
	let mouth: MouthPlan | null = null;
	let mouthW = 0;
	const dist3 = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
	const clearOfEyes = (p: V3, r: number) => eyes.every((e) => e.stalk >= 0 || dist3(p, e.pos) > e.r * 1.05 + r);

	// mouth, nose, cheeks
	const mouthKind = headless ? 0 : pickIdx(g.mouth, [0.36, 0.55, 0.7, 0.86]);
	{
		const mc = muzzleC ?? hc;
		const mR = muzzleC ? hR * 0.55 : hR;
		const ex = castBase(mc, norm([0, muzzleC ? -0.25 : -0.42, 1]), mR * 4);
		const n = ex.n;
		const t = norm([n[2], 0, -n[0]]); // lateral
		const up = norm(sub(UP, scale(n, n[1])));
		const w = mR * mix(0.32, 0.55, g.teeth);
		mouthP = ex.p;
		mouthW = w * 1.25;
		const cr = Math.max(minR * 1.15, mR * 0.07);
		void cr;
		const lip = mixRGB(skin, pal.mouth, 0.25);
		if (mouthKind === 2) {
			// beak (a clean cone), with its mouth line drawn along the base
			const bl = mR * mix(0.45, 0.9, g.teeth);
			const dir = norm(add(n, [0, -0.35, 0]));
			parts.push(cone(add(ex.p, scale(n, -bl * 0.35)), add(ex.p, scale(dir, bl * 0.75)), Math.max(minR * 1.6, bl * 0.42), Math.max(minR * 1.05, bl * 0.08), headBone, pal.beak, mR * 0.08, 'beak', 0));
			traits.push('beak');
			mouth = { bone: headBone, p: add(add(ex.p, scale(n, bl * 0.32)), scale(up, -bl * 0.3)), n, up, w: Math.max(minR * 2, bl * 0.42), style: 'beak', teeth: 'none', tongue: true, inside: pal.mouth, lip: mixRGB(pal.beak, pal.mouth, 0.35), tooth: [0.97, 0.95, 0.9], tongueColor: pal.tongue };
		} else if (mouthKind === 1) {
			mouth = { bone: headBone, p: ex.p, n, up, w: w * 1.05, style: 'open', teeth: 'none', tongue: true, inside: pal.mouth, lip, tooth: [0.97, 0.95, 0.9], tongueColor: pal.tongue };
		} else if (!headless || g.mouth > 0.2) {
			const teeth = mouthKind === 3 ? 'buck' : mouthKind === 4 ? 'tusks' : 'none';
			if (mouthKind === 3) traits.push('buck teeth');
			if (mouthKind === 4) traits.push('tusks');
			mouth = { bone: headBone, p: ex.p, n, up, w: w * 1.3, style: 'smile', teeth, tongue: true, inside: pal.mouth, lip, tooth: mouthKind === 4 ? pal.horn : [0.97, 0.95, 0.9], tongueColor: pal.tongue };
		}
		if (muzzleC) {
			const nx = castBase(muzzleC, norm([0, 0.45, 1]), mR * 4);
			parts.push(ell(add(nx.p, scale(nx.n, -mR * 0.05)), [mR * 0.26, mR * 0.17, mR * 0.17], headBone, pal.nose, mR * 0.06, 'nose', 0));
		}
		if (g.blush > 0.55 && !headless) {
			for (const s of [1, -1]) {
				const cx = castBase(headC, dirYP(s * 0.85, -0.05), hR * 3);
				parts.push({ kind: 'ell', op: 'paint', c: cx.p, r: [hR * 0.24, hR * 0.24, hR * 0.24], bone: headBone, color: pal.blush, k: 0, pat: 0, tag: 'blush' });
			}
		}
	}

	// eyes
	const eyeCounts = [1, 2, 3, 4, 6, 10, 22];
	const nEyes = eyeCounts[pickIdx(g.eyes, [0.08, 0.64, 0.73, 0.83, 0.9, 0.96])];
	const onStalks = g.stalks > 0.86 && nEyes <= 2 && !headless;
	const eyeR0 = hR * mix(0.24, 0.42, g.eyeSize) / Math.sqrt(Math.max(1, nEyes / 2));
	const eyeR = Math.max(minR * 1.2, eyeR0);
	if (onStalks) {
		traits.push('eye stalks');
		for (let i = 0; i < nEyes; i++) {
			const side = nEyes === 1 ? 0 : i === 0 ? 1 : -1;
			const ex = castBase(hc, norm([side * 0.35, 1, 0.25]), hR * 3);
			const stalkR = Math.max(minR, hR * 0.07);
			const ci = chains.length;
			chains.push({ kind: 'stalk', bone: headBone, anchor: add(ex.p, scale(ex.n, -stalkR * 1.5)), dir: norm([side * 0.35, 1, 0.3]), length: hR * mix(0.7, 1.5, g.stalks), segments: 5, r0: stalkR * 1.2, r1: stalkR, stiffness: 0.65, tip: 'eye', tipR: eyeR * 1.1, color: skin, tipColor: skin, curl: -0.05 });
			eyes.push({ bone: headBone, pos: ex.p, n: ex.n, r: eyeR * 1.1, pupil: 0.52, stalk: ci });
		}
	} else {
		const dirs: V3[] = [];
		const spreadYaw = mix(0.32, 0.8, g.eyeLayout);
		const pitch0 = mix(0.12, 0.55, g.eyeLayout * 0.6 + g.headShape * 0.4);
		if (nEyes === 1) dirs.push(dirYP(0, pitch0 * 0.8));
		else if (nEyes === 2) dirs.push(dirYP(spreadYaw, pitch0), dirYP(-spreadYaw, pitch0));
		else if (nEyes === 3) dirs.push(dirYP(spreadYaw, pitch0 * 0.8), dirYP(-spreadYaw, pitch0 * 0.8), dirYP(0, pitch0 + 0.42));
		else if (nEyes === 4) dirs.push(dirYP(spreadYaw * 0.8, pitch0 + 0.32), dirYP(-spreadYaw * 0.8, pitch0 + 0.32), dirYP(spreadYaw * 1.05, pitch0 - 0.12), dirYP(-spreadYaw * 1.05, pitch0 - 0.12));
		else {
			// scatter over the front and top with a minimum spacing (Poisson-style rejection)
			const minAng = (eyeR / hR) * 2.05;
			let tries = 0;
			while (dirs.length < nEyes && tries++ < 4000) {
				const yaw = rnd.range(-1.25, 1.25);
				const pitch = rnd.range(-0.15, 1.2);
				const d = dirYP(yaw, pitch);
				if (mouthP) {
					const pe = castBase(hc, d, hR * 3).p;
					if (dist3(pe, mouthP) < mouthW + eyeR) continue;
				}
				if (dirs.every((o) => Math.acos(Math.min(1, o[0] * d[0] + o[1] * d[1] + o[2] * d[2])) > minAng)) dirs.push(d);
			}
			if (nEyes >= 10) traits.push(nEyes >= 20 ? 'a hundred eyes' : 'many eyes');
		}
		for (const d of dirs) {
			const ex = castBase(muzzleC && d[1] < 0.25 ? hc : hc, d, hR * 3);
			eyes.push({ bone: headBone, pos: add(ex.p, scale(ex.n, eyeR * 0.28)), n: ex.n, r: eyeR, pupil: mix(0.42, 0.62, g.googly), stalk: -1 });
		}
	}
	if (nEyes === 1) traits.push('cyclops');
	if (nEyes >= 3 && nEyes <= 6) traits.push(`${nEyes} eyes`);
	void eyeHost;

	// horns (own bone so they can wobble)
	const hornKind = pickIdx(g.horns, [0.5, 0.62, 0.86, 0.94]);
	const hornBone = addBone('horns', lift([0, 0, 0]), headBone);
	bones[hornBone].rest = [hc[0], hc[1] + hR * 0.6, hc[2]];
	if (hornKind > 0) {
		const hornLen = hR * mix(0.55, 1.45, g.hornLen);
		const r0 = Math.max(minR * 1.6, hR * 0.17);
		const r1 = Math.max(minR * 1.05, r0 * 0.32);
		const curl = mix(-0.2, 0.75, g.hornCurl);
		const bases: Array<{ yaw: number; pitch: number }> = [];
		if (hornKind === 1) bases.push({ yaw: 0, pitch: 0.95 });
		else if (hornKind === 2) bases.push({ yaw: 0.55, pitch: 0.85 }, { yaw: -0.55, pitch: 0.85 });
		else if (hornKind === 3) bases.push({ yaw: 0.45, pitch: 1.0 }, { yaw: -0.45, pitch: 1.0 }, { yaw: 0.95, pitch: 0.45 }, { yaw: -0.95, pitch: 0.45 });
		else bases.push({ yaw: 0, pitch: 1.2 }, { yaw: 0.5, pitch: 1.05 }, { yaw: -0.5, pitch: 1.05 });
		const hornCol = pal.horn;
		let lift2 = -1;
		for (const adj of [0, 0.2, 0.4, 0.6]) {
			if (bases.every((b) => clearOfEyes(castBase(hc, dirYP(b.yaw * (1 - adj * 0.5), Math.min(1.5, b.pitch + adj)), hR * 3).p, r0 * 1.2))) {
				lift2 = adj;
				break;
			}
		}
		if (lift2 < 0) bases.length = 0;
		for (const b0 of bases) {
			const b = { yaw: b0.yaw * (1 - lift2 * 0.5), pitch: Math.min(1.5, b0.pitch + lift2) };
			const ex = castBase(hc, dirYP(b.yaw, b.pitch), hR * 3);
			const sideAxis = norm([Math.cos(b.yaw), 0, -Math.sin(b.yaw)]);
			let dir = norm(add(ex.n, [0, 0.6, 0]));
			let p = add(ex.p, scale(ex.n, -r0 * 0.9));
			const nS = 3;
			const sc = hornKind === 3 && Math.abs(b.pitch) < 0.6 ? 0.6 : 1;
			for (let i = 0; i < nS; i++) {
				const ra = mix(r0, r1, i / nS) * sc,
					rb = mix(r0, r1, (i + 1) / nS) * sc;
				const q = add(p, scale(dir, (hornLen * sc) / nS + (i === 0 ? r0 * 0.9 : 0)));
				parts.push(cone(p, q, Math.max(ra, minR * 1.05), Math.max(rb, minR * 1.05), hornBone, hornCol, i === 0 ? r0 * 0.6 : r1 * 0.3, 'horn', 0));
				dir = rotAxis(dir, sideAxis, -curl);
				p = q;
			}
		}
		if (bases.length) traits.push(hornKind === 1 ? 'unihorn' : hornKind === 4 ? 'crown' : 'horns');
	}

	// ears (own bones: they jiggle)
	const earKind = pickIdx(g.ears, [0.36, 0.55, 0.74, 0.9]);
	const earBones: number[] = [];
	if (earKind > 0 && !headless) {
		const el = hR * mix(0.45, 1.25, g.earLen);
		let ea = { yaw: earKind === 4 ? 1.45 : 1.05, pitch: earKind === 4 ? 0.1 : 0.8 };
		for (const cand of [ea, { yaw: ea.yaw + 0.25, pitch: ea.pitch + 0.2 }, { yaw: ea.yaw + 0.35, pitch: ea.pitch - 0.25 }, { yaw: ea.yaw - 0.2, pitch: ea.pitch + 0.45 }, { yaw: 1.7, pitch: 0.2 }]) {
			if (clearOfEyes(castBase(headC, dirYP(cand.yaw, cand.pitch), hR * 3).p, el * 0.6)) {
				ea = cand;
				break;
			}
		}
		for (const side of [1, -1] as const) {
			const yaw = side * ea.yaw;
			const pitch = ea.pitch;
			const ex = castBase(headC, dirYP(yaw, pitch), hR * 3);
			const eb = addBone(side > 0 ? 'earL' : 'earR', ex.p, headBone);
			earBones.push(eb);
			const out = ex.n;
			const earBase = add(ex.p, scale(out, -hR * 0.08));
			if (earKind === 1) {
				// round, facing forward
				const c = add(ex.p, scale(norm(add(out, [0, 0.6, 0])), el * 0.32));
				parts.push(ell(c, [el * 0.34, el * 0.34, Math.max(minR * 1.3, el * 0.1)], eb, skin, hR * 0.12, 'ear', 1, basisRows([0, 0, 1])));
				parts.push({ kind: 'ell', op: 'paint', c: add(c, [0, 0, el * 0.08]), r: [el * 0.22, el * 0.22, el * 0.22], bone: eb, color: pal.blush, k: 0, pat: 0, tag: 'earpaint' });
			} else if (earKind === 2) {
				const tipDir = norm(add(out, [0, 1.2, -0.1]));
				parts.push(cone(earBase, add(earBase, scale(tipDir, el)), Math.max(minR * 2, el * 0.28), Math.max(minR * 1.05, el * 0.04), eb, skin, hR * 0.1, 'ear'));
			} else if (earKind === 3) {
				// long and floppy, hanging back and out
				const tipDir = norm(add(out, [0, 0.9, -0.9]));
				const c = add(earBase, scale(tipDir, el * 0.5));
				parts.push(ell(c, [Math.max(minR * 1.5, el * 0.13), el * 0.22, el * 0.62], eb, skin, hR * 0.18, 'ear', 1, basisRows(tipDir, [side, 0, 0])));
			} else {
				// fins
				const tipDir = norm(add(out, [0, 0.4, -0.8]));
				const c = add(earBase, scale(tipDir, el * 0.3));
				parts.push(ell(c, [Math.max(minR * 1.6, el * 0.1), el * 0.32, el * 0.46], eb, pal.accent, hR * 0.2, 'ear', 0, basisRows(tipDir, [side, 0, 0])));
			}
		}
		traits.push(['', 'round ears', 'pointy ears', 'floppy ears', 'fins'][earKind]);
	}

	// dorsal spikes
	if (g.spikes > 0.62) {
		const n = 3 + Math.floor((g.spikes - 0.62) / 0.38 * 6);
		const sl = R * mix(0.28, 0.75, g.spikeSize);
		const ra = Math.max(minR * 1.6, sl * 0.32);
		for (let i = 0; i < n; i++) {
			const t = n === 1 ? 0.5 : i / (n - 1);
			let from: V3, dir: V3, bone: number;
			if (upright) {
				const s = segs[segs.length - 1];
				from = s.c;
				dir = norm([0, mix(-0.5, 0.7, t), -1]);
				bone = s.bone;
			} else {
				const z = mix(back.c[2] - back.r[2] * 0.5, front.c[2] + front.r[2] * 0.2, t);
				let si = 0;
				segs.forEach((s, k) => {
					if (Math.abs(s.c[2] - z) < Math.abs(segs[si].c[2] - z)) si = k;
				});
				from = [0, segs[si].c[1], z];
				dir = norm([0, 1, -0.25]);
				bone = segs[si].bone;
			}
			const ex = castBase(from, dir, R * 4);
			const l = sl * (0.65 + 0.35 * Math.sin(t * Math.PI));
			const tipDir = norm(add(ex.n, [0, 0, -0.45]));
			parts.push(cone(add(ex.p, scale(ex.n, -ra * 0.8)), add(ex.p, scale(tipDir, l)), ra, Math.max(minR * 1.05, ra * 0.22), bone, pal.accent, ra * 0.5, 'spike', 0));
		}
		traits.push('spiky');
	}

	// tail
	const tailKind = pickIdx(g.tail, [0.3, 0.55, 0.72, 0.87]);
	if (tailKind > 0) {
		const r0 = Math.max(minR * 1.3, R * mix(0.16, 0.36, g.tailThick));
		const length = R * mix(0.9, 3.2, g.tailLen) * (kind === 'biped' ? 1.0 : 1);
		const fromDir: V3 = upright ? norm([0, -0.35, -1]) : norm([0, 0.3, -1]);
		const ex = castBase(back.c, fromDir, R * 4);
		const perky = mix(-0.35, 0.85, g.tailThick * 0.4 + g.bounce * 0.6);
		const tip = (['none', 'none', 'ball', 'fluff', 'spade'] as const)[tailKind];
		chains.push({
			kind: 'tail',
			bone: back.bone,
			anchor: add(ex.p, scale(ex.n, -r0 * 1.1)),
			dir: norm([0, perky, -1]),
			length,
			segments: Math.max(6, Math.min(12, Math.round(length / (r0 * 1.4)))),
			r0,
			r1: Math.max(minR * 0.9, r0 * (tip === 'none' ? 0.18 : 0.45)),
			stiffness: mix(0.25, 0.7, g.tailThick),
			tip,
			tipR: tip === 'fluff' ? r0 * 1.9 : tip === 'ball' ? r0 * 1.45 : tip === 'spade' ? r0 * 1.3 : 0,
			color: skin,
			tipColor: tip === 'fluff' ? pal.belly : pal.accent,
			curl: mix(-0.1, 0.18, g.tailLen),
		});
		traits.push(tip === 'fluff' ? 'fluffy tail' : tip === 'ball' ? 'club tail' : length > R * 2.4 ? 'long tail' : 'tail');
	}

	// antennae
	if (g.antennae > 0.78 && !onStalks) {
		const ar = Math.max(minR * 0.8, hR * 0.05);
		const aOk = [1, -1].every((s) => clearOfEyes(castBase(hc, norm([s * 0.3, 1, 0.45]), hR * 3).p, ar * 3));
		for (const s of aOk ? [1, -1] : []) {
			const ex = castBase(hc, norm([s * 0.3, 1, 0.45]), hR * 3);
			chains.push({ kind: 'antenna', bone: headBone, anchor: add(ex.p, scale(ex.n, -ar * 2)), dir: norm([s * 0.35, 1, 0.55]), length: hR * mix(0.8, 1.8, g.antennae), segments: 6, r0: ar * 1.2, r1: ar, stiffness: 0.35, tip: 'ball', tipR: ar * 2.6, color: pal.foot, tipColor: pal.accent, curl: 0.12 });
		}
		traits.push('antennae');
	}

	// arms (bipeds, sometimes)
	const arms: ArmPlan[] = [];
	if (kind === 'biped' && g.arms > 0.3) {
		const top = segs[segs.length - 1];
		const armL = L * mix(0.35, 0.95, g.armLen);
		const t = Math.max(minR * 1.1, Math.min(R * 0.3, armL * thick0 * 0.8));
		for (const side of [1, -1] as const) {
			const ex = castBase(top.c, norm([side, 0.35, 0.25]), R * 4);
			arms.push({ side, bone: top.bone, shoulder: add(ex.p, scale(ex.n, -t * 1.1)), upper: armL * 0.5, lower: armL * 0.5, thick: t, handR: t * 1.55 });
		}
		traits.push(armL < L * 0.5 ? 'tiny arms' : 'arms');
	}

	prepare(parts);

	// ---- gait ----
	const nLegs = legs.length;
	const off = (w: number) => legs.map((l) => (((-l.pair * w + (l.side > 0 ? 0 : 0.5)) % 1) + 1) % 1);
	const hop = kind === 'mono' || kind === 'blob' || (kind === 'biped' && g.hopper > 0.78);
	let gait: GaitPlan;
	if (kind === 'mono') gait = { slow: [0], fast: [0], dutySlow: 0.5, dutyFast: 0.38, hop: true, gallop: null };
	else if (kind === 'biped') gait = { slow: hop ? [0, 0.04] : off(0), fast: hop ? [0, 0.04] : off(0), dutySlow: hop ? 0.5 : 0.62, dutyFast: hop ? 0.36 : 0.4, hop, gallop: null };
	else if (nLegs > 0) {
		const P = pairs;
		const slowW = 1 / (2 * P);
		gait = {
			slow: off(slowW),
			fast: off(0.5),
			dutySlow: 1 - 1.6 / (2 * P),
			dutyFast: style === 'insect' ? 0.5 : 0.42,
			hop: false,
			gallop: kind === 'quad' && style !== 'insect' ? legs.map((l) => (l.pair === 1 ? 0 : 0.5) + (l.side > 0 ? 0 : 0.12)) : null,
		};
	} else gait = { slow: [0], fast: [0], dutySlow: 0.5, dutyFast: 0.4, hop: true, gallop: null };
	if (hop && kind === 'biped') traits.push('hopper');

	// ---- names and labels ----
	const kindWord = { blob: 'Blob', mono: 'Pogo', biped: 'Biped', quad: 'Quadruped', hexa: 'Hexapod', octo: 'Octopod' }[kind];
	const sizeWord = S < 0.48 ? 'Tiny' : S < 0.8 ? 'Small' : S < 1.35 ? '' : S < 1.9 ? 'Big' : 'Huge';
	const patKind = (['none', 'spots', 'stripes', 'patches', 'gradient'] as const)[pickIdx(g.pattern, [0.26, 0.5, 0.7, 0.8])];
	const patWord = { none: '', spots: 'Spotted', stripes: 'Striped', patches: 'Patchy', gradient: '' }[patKind];
	const species = [sizeWord, patWord, hueName(pal.hue), kindWord].filter(Boolean).join(' ');
	const ftr = [`${nLegs} legs`, ...traits];
	if (S < 0.48) ftr.unshift('tiny');
	else if (S > 1.9) ftr.unshift('huge');

	// ---- footprint and bounds ----
	let rad = 0;
	let top = 0;
	let fx = 0,
		fz = 0;
	for (const p of parts) {
		if (p.op !== 'add') continue;
		const bc = p.bc!;
		rad = Math.max(rad, Math.hypot(bc[0], bc[1] - height, bc[2]) + p.br!);
		top = Math.max(top, bc[1] + p.br!);
		fx = Math.max(fx, Math.abs(bc[0]) + p.br!);
		fz = Math.max(fz, Math.abs(bc[2]) + p.br!);
	}
	for (const l of legs) {
		fx = Math.max(fx, Math.abs(l.foot[0]) + l.footR);
		fz = Math.max(fz, Math.abs(l.foot[2]) + l.footR);
	}
	let minFeature = 1e9;
	for (const p of parts) {
		if (p.op === 'paint') continue;
		if (p.kind === 'cone') minFeature = Math.min(minFeature, p.ra!, p.rb!);
		else minFeature = Math.min(minFeature, ...p.r!);
	}

	const walkSpeed = L > 0 ? Math.sqrt(0.16 * 9.81 * L) * mix(0.75, 1.25, g.speed) : Math.sqrt(0.12 * 9.81 * R * 2);
	const runSpeed = L > 0 ? Math.sqrt((style === 'insect' ? 1.1 : 1.3) * 9.81 * L) * mix(0.8, 1.2, g.speed) : walkSpeed * 2.4;

	return {
		code,
		name: extra.name ?? nameFor(code),
		species,
		traits: ftr,
		genes: g,
		kind,
		size: S,
		R,
		parts,
		bones,
		segBones,
		headBone,
		hornBone,
		earBones,
		legs,
		arms,
		eyes,
		chains,
		gait,
		palette: pal,
		pattern: { kind: patKind, scale: R * mix(0.28, 0.75, g.patternScale), seed: Math.floor(g.patternScale * 1000 + g.hue * 777) },
		height,
		legLength: L,
		radius: Math.max(rad, height),
		top,
		footprint: [fx, fz],
		minFeature,
		personality: { speed: mix(0.75, 1.25, g.speed), bounce: mix(0.5, 1.5, g.bounce), googly: g.googly, shy: g.shy, social: g.social, curious: g.curious },
		walkSpeed,
		runSpeed,
		wings: false,
		mouth,
	};
}

/**
 * Skin weights at a rest-space point: soft-min over part distances, summed per bone, top four.
 * The mesher weights vertices with exactly this, so anchors weighted the same way move with the skin.
 */
export function weightsAt(plan: Plan, p: readonly number[], blend = plan.R * 0.12): Array<[number, number]> {
	const parts = plan.parts.filter((q) => q.op === 'add');
	const ds = parts.map((q) => partDist(q, p[0], p[1], p[2]));
	const dmin = Math.min(...ds);
	const bw = new Map<number, number>();
	parts.forEach((q, i) => {
		const w = Math.exp(-(ds[i] - dmin) / blend);
		if (w > 1e-3) bw.set(q.bone, (bw.get(q.bone) ?? 0) + w);
	});
	const top = [...bw.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
	const sum = top.reduce((m, [, w]) => m + w, 0);
	return top.map(([b, w]) => [b, w / sum]);
}

/** The body's field (for tests): negative inside. */
export const bodyField = (plan: Plan, p: V3) => field(plan.parts, p[0], p[1], p[2]);
export { len };
