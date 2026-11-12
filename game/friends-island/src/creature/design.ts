// Editor designs: a body built by hand (spine points + parts placed on the surface), compiled into the same Plan
// the genome builder produces, so the mesher, the procedural animation and the Lab work on any build.
//
// Rules that keep every build valid ("you can't build something broken"):
//  - every part is placed by casting from its segment's centre to the skin, then sunk into it;
//  - legs are lengthened until the belly clears the ground; a leg can't be shorter than its hip height needs;
//  - feet, eyes and part sizes are clamped to sane ranges, thin parts to the mesher's voxel size;
//  - the spine keeps neighbouring segments overlapping, so the body is always one piece.
import { mixRGB, oklch, type Palette, type RGB } from './color.ts';
import type { ArmPlan, BodyKind, Bone, ChainPlan, EyePlan, GaitPlan, LegPlan, LegStyle, MouthPlan, Plan } from './build.ts';
import { GENES, type Genes, hashSeed, nameFor, Prng } from './genome.ts';
import { add, basisRows, cross, exitPoint, field, len, norm, type Part, prepare, scale, sub, type V3 } from './sdf.ts';

export type PartType = 'leg' | 'arm' | 'mouth' | 'eye' | 'stalk' | 'tail' | 'horn' | 'frill' | 'wing' | 'spike' | 'foot' | 'hand' | 'throat';

export interface DPart {
	t: PartType;
	/** segment index */
	s: number;
	/** direction on the segment, in its local frame: yaw a (0 = forward, + = left side), pitch b (+ = up) */
	a: number;
	b: number;
	/** size multiplier (1 = default) */
	k: number;
	/** tilt / curl / splay (radians) */
	r: number;
	/** mirrored copy on the other side */
	m: boolean;
	/** variant: leg straight|digi|insect, mouth herb|carn|omni, tail plain|ball|fluff|spade, horn straight|curl, foot paw|hoof|claw, throat song|spit */
	v: string;
}

export interface DSpine {
	z: number;
	y: number;
	r: number;
}

export interface Design {
	v: 1;
	name: string;
	/** overall size (0.3..2.6, like the genome's) */
	size: number;
	fat: number;
	spine: DSpine[];
	parts: DPart[];
	paint: { base: number; accent: number; pattern: number; kind: 'none' | 'spots' | 'stripes' | 'gradient' | 'patches'; scale: number };
	personality: { speed: number; bounce: number; googly: number; shy: number; social: number; curious: number };
}

export const CODE_D = 'D1';
export const BASE_HUES = [15, 40, 70, 125, 160, 190, 215, 245, 275, 305, 335, 0];
export const baseColor = (i: number): RGB => (i === 11 ? oklch(0.84, 0.035, 80) : oklch(0.67, 0.15, BASE_HUES[i % 11]));
export const accentColor = (i: number): RGB => (i === 11 ? oklch(0.45, 0.04, 260) : oklch(0.68, 0.16, BASE_HUES[i % 11]));
export const patternColor = (i: number): RGB => (i === 11 ? oklch(0.97, 0.01, 90) : oklch(0.56, 0.15, BASE_HUES[i % 11]));

// ------------------------------------------------------------------ codes (exact share strings)

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
function toB64(bytes: number[]) {
	let s = '';
	for (let i = 0; i < bytes.length; i += 3) {
		const n = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
		s += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + B64[(n >> 6) & 63] + B64[n & 63];
	}
	return s;
}
function fromB64(s: string) {
	const out: number[] = [];
	for (let i = 0; i < s.length; i += 4) {
		const n = (B64.indexOf(s[i]) << 18) | (B64.indexOf(s[i + 1]) << 12) | (B64.indexOf(s[i + 2]) << 6) | B64.indexOf(s[i + 3]);
		out.push((n >> 16) & 255, (n >> 8) & 255, n & 255);
	}
	return out;
}
// new types and variants are appended, so every older share code still decodes the same
const TYPES: PartType[] = ['leg', 'arm', 'mouth', 'eye', 'stalk', 'tail', 'horn', 'frill', 'wing', 'spike', 'foot', 'hand', 'throat'];
const VARIANTS = ['', 'straight', 'digi', 'insect', 'herb', 'carn', 'omni', 'plain', 'ball', 'fluff', 'spade', 'curl', 'paw', 'hoof', 'claw', 'eye', 'song', 'spit'];
const PATTERNS = ['none', 'spots', 'stripes', 'gradient', 'patches'] as const;
const q8 = (v: number, lo: number, hi: number) => Math.max(0, Math.min(255, Math.round(((v - lo) / (hi - lo)) * 255)));
const d8 = (b: number, lo: number, hi: number) => lo + (b / 255) * (hi - lo);

/** Binary-packed, base64url: "D1" + data. Quantised, so re-decoding gives exactly the same body. */
export function encodeDesign(d: Design): string {
	const b: number[] = [];
	b.push(q8(d.size, 0.2, 2.8), q8(d.fat, 0.6, 1.5), d.spine.length, d.parts.length);
	b.push(d.paint.base, d.paint.accent, d.paint.pattern, PATTERNS.indexOf(d.paint.kind), q8(d.paint.scale, 0.15, 1));
	const p = d.personality;
	b.push(q8(p.speed, 0.6, 1.4), q8(p.bounce, 0.4, 1.6), q8(p.googly, 0, 1), q8(p.shy, 0, 1), q8(p.social, 0, 1), q8(p.curious, 0, 1));
	for (const s of d.spine) b.push(q8(s.z, -6, 6), q8(s.y, -3, 5), q8(s.r, 0.25, 2.2));
	for (const pt of d.parts) b.push(TYPES.indexOf(pt.t) | (pt.m ? 128 : 0), pt.s, q8(pt.a, -Math.PI, Math.PI), q8(pt.b, -Math.PI / 2, Math.PI / 2), q8(pt.k, 0.3, 3), q8(pt.r, -1.6, 1.6), Math.max(0, VARIANTS.indexOf(pt.v)));
	const name = [...d.name.slice(0, 18)].map((c) => Math.min(255, c.charCodeAt(0)));
	b.push(name.length, ...name);
	return CODE_D + toB64(b);
}

export function isDesignCode(s: string) {
	return s.trim().startsWith(CODE_D) && /^[A-Za-z0-9_-]+$/.test(s.trim().slice(2));
}

export function decodeDesign(code: string): Design {
	const b = fromB64(code.trim().slice(2));
	let i = 0;
	const n = () => b[i++] ?? 0;
	const size = d8(n(), 0.2, 2.8),
		fat = d8(n(), 0.6, 1.5);
	const ns = n(),
		np = n();
	const paint = { base: n(), accent: n(), pattern: n(), kind: PATTERNS[n()] ?? 'none', scale: d8(n(), 0.15, 1) };
	const personality = { speed: d8(n(), 0.6, 1.4), bounce: d8(n(), 0.4, 1.6), googly: d8(n(), 0, 1), shy: d8(n(), 0, 1), social: d8(n(), 0, 1), curious: d8(n(), 0, 1) };
	const spine: DSpine[] = [];
	for (let k = 0; k < ns; k++) spine.push({ z: d8(n(), -6, 6), y: d8(n(), -3, 5), r: d8(n(), 0.25, 2.2) });
	const parts: DPart[] = [];
	for (let k = 0; k < np; k++) {
		const tb = n();
		parts.push({ t: TYPES[tb & 127], m: !!(tb & 128), s: n(), a: d8(n(), -Math.PI, Math.PI), b: d8(n(), -Math.PI / 2, Math.PI / 2), k: d8(n(), 0.3, 3), r: d8(n(), -1.6, 1.6), v: VARIANTS[n()] ?? '' });
	}
	const nl = n();
	let name = '';
	for (let k = 0; k < nl; k++) name += String.fromCharCode(n());
	return { v: 1, name, size, fat, spine, parts, paint, personality };
}

/** Round-trip through the code, so what you edit is exactly what you share. */
export const normalise = (d: Design) => decodeDesign(encodeDesign(d));

// ------------------------------------------------------------------ starting points

export function blankDesign(): Design {
	return normalise({
		v: 1,
		name: 'Blank',
		size: 1,
		fat: 1,
		spine: [
			{ z: -1.1, y: 0, r: 1.0 },
			{ z: 0, y: 0.05, r: 1.08 },
			{ z: 1.15, y: 0.35, r: 0.92 },
		],
		parts: [],
		paint: { base: 6, accent: 1, pattern: 7, kind: 'none', scale: 0.5 },
		personality: { speed: 1, bounce: 1, googly: 0.6, shy: 0.3, social: 0.6, curious: 0.6 },
	});
}

/** A random build, made the way the editor makes them (used by Randomise and by the fuzz harness). */
export function randomDesign(seed: number | string): Design {
	const r = new Prng(hashSeed(String(seed)) ^ 0xde5);
	const ns = 1 + Math.floor(r.next() * 5);
	const spine: DSpine[] = [];
	const bend = r.range(-0.5, 0.5);
	const upright = r.next() < 0.25;
	for (let i = 0; i < ns; i++) {
		const t = ns === 1 ? 0 : i / (ns - 1) - 0.5;
		const rr = r.range(0.7, 1.3) * (i === ns - 1 ? r.range(0.75, 1.15) : 1);
		spine.push(upright ? { z: t * 0.6, y: (i * 1.25 * rr), r: rr } : { z: t * (ns - 1) * r.range(0.95, 1.35), y: bend * t * t * 4 + (i === ns - 1 ? r.range(0, 0.7) : 0), r: rr });
	}
	const parts: DPart[] = [];
	const head = ns - 1;
	const P = (t: PartType, s: number, a: number, b: number, k: number, m: boolean, v = '', rr = 0) => parts.push({ t, s, a, b, k, r: rr, m, v });
	// eyes and a mouth on the head
	const eyes = r.pick([1, 2, 2, 2, 3, 4]);
	if (r.next() < 0.12) P('stalk', head, r.range(0.25, 0.6), r.range(0.9, 1.3), r.range(0.8, 1.4), true);
	else if (eyes === 1) P('eye', head, 0, r.range(0.1, 0.5), r.range(1, 1.6), false);
	else for (let e = 0; e < Math.ceil(eyes / 2); e++) P('eye', head, r.range(0.25, 0.75), r.range(0.05, 0.7) + e * 0.35, r.range(0.6, 1.3), true);
	P('mouth', head, 0, r.range(-0.6, -0.15), r.range(0.7, 1.4), false, r.pick(['herb', 'carn', 'omni']));
	// legs: 0 to 8
	const legPairs = upright ? r.pick([0, 1, 1, 1]) : r.pick([0, 1, 1, 2, 2, 2, 3, 3, 4]);
	const mono = legPairs === 0 && r.next() < 0.3;
	const style = r.pick(['straight', 'straight', 'digi', 'insect']);
	const legLen = r.range(0.6, 1.8);
	for (let j = 0; j < legPairs; j++) {
		const seg = upright ? 0 : ns === 1 ? 0 : Math.round((j / Math.max(1, legPairs - 1)) * Math.max(0, ns - 2));
		// pairs sharing a segment sit at different yaws (front and back of it)
		const sharing = ns <= 2 ? legPairs : Math.ceil(legPairs / Math.max(1, ns - 1));
		const yaw = sharing > 1 ? 0.9 + (j % sharing) * (1.4 / Math.max(1, sharing - 1)) : r.range(1.0, 1.7);
		P('leg', seg, yaw, r.range(-1.2, -0.6), legLen * r.range(0.9, 1.1), true, style);
	}
	if (mono) P('leg', 0, 0, -1.4, legLen, false, 'straight');
	if (legPairs && r.next() < 0.3) P('foot', 0, 0, 0, r.range(0.8, 1.5), false, r.pick(['paw', 'hoof', 'claw']));
	if (upright && r.next() < 0.6) P('arm', ns - 1 > 0 ? ns - 2 : 0, r.range(1.3, 1.7), r.range(0, 0.4), r.range(0.6, 1.4), true);
	if (r.next() < 0.6) P('tail', 0, Math.PI, r.range(-0.2, 0.6), r.range(0.6, 1.8), false, r.pick(['plain', 'ball', 'fluff', 'spade']));
	if (r.next() < 0.45) P('horn', head, r.range(0, 0.6), r.range(0.8, 1.3), r.range(0.6, 1.5), r.next() < 0.8, r.pick(['straight', 'curl']), r.range(-0.4, 0.4));
	if (r.next() < 0.25) P('frill', head, 0, r.range(0.4, 1.0), r.range(0.7, 1.4), false);
	if (r.next() < 0.3) P('spike', Math.floor(r.next() * ns), 0, r.range(1.0, 1.5), r.range(0.6, 1.5), false);
	if (r.next() < 0.2) P('wing', Math.max(0, ns - 2), r.range(1.2, 1.6), r.range(0.4, 0.9), r.range(0.8, 1.6), true);
	// throats come from their own random stream, so the rest of every random build is unchanged
	const r2 = new Prng(hashSeed(`throat:${seed}`));
	if (r2.next() < 0.3) P('throat', head, 0, r2.range(-1.1, -0.7), r2.range(0.7, 1.3), false, r2.next() < 0.6 ? 'song' : 'spit');
	return normalise({
		v: 1,
		name: nameFor(`design:${seed}`),
		size: Math.exp(r.range(Math.log(0.35), Math.log(2.2))),
		fat: r.range(0.75, 1.35),
		spine,
		parts,
		paint: { base: Math.floor(r.next() * 12), accent: Math.floor(r.next() * 12), pattern: Math.floor(r.next() * 12), kind: r.pick(['none', 'spots', 'stripes', 'gradient', 'patches'] as const), scale: r.range(0.3, 0.9) },
		personality: { speed: r.range(0.75, 1.25), bounce: r.range(0.5, 1.5), googly: r.next(), shy: r.next(), social: r.next(), curious: r.next() },
	});
}

/** A visible mutation of a design: move, resize or swap one to three things. */
export function mutateDesign(d: Design, seed: number): { design: Design; changes: string[] } {
	const r = new Prng(seed ^ 0xa11e);
	const o: Design = JSON.parse(JSON.stringify(d));
	const changes: string[] = [];
	const n = 1 + Math.floor(r.next() * 3);
	for (let i = 0; i < n; i++) {
		const what = r.next();
		if (what < 0.2 && o.parts.length) {
			const p = r.pick(o.parts);
			const k = p.k;
			p.k = Math.max(0.4, Math.min(2.6, p.k * (r.next() < 0.5 ? 0.6 : 1.6)));
			changes.push(`${p.k > k ? 'bigger' : 'smaller'} ${p.t}${p.t === 'leg' ? 's' : ''}`);
		} else if (what < 0.35 && o.spine.length < 6) {
			const last = o.spine[0];
			o.spine.unshift({ z: last.z - last.r * 1.05, y: last.y, r: last.r * r.range(0.8, 1.05) });
			for (const p of o.parts) p.s++;
			changes.push('longer body');
		} else if (what < 0.45 && o.spine.length > 1) {
			o.spine.shift();
			o.parts = o.parts.filter((p) => p.s > 0).map((p) => ({ ...p, s: p.s - 1 }));
			changes.push('shorter body');
		} else if (what < 0.6) {
			o.paint.base = (o.paint.base + 1 + Math.floor(r.next() * 10)) % 12;
			changes.push('new colours');
		} else if (what < 0.7) {
			const kinds = ['none', 'spots', 'stripes', 'gradient', 'patches'] as const;
			const k = kinds[(kinds.indexOf(o.paint.kind) + 1 + Math.floor(r.next() * 4)) % 5];
			changes.push(`${o.paint.kind === 'none' ? 'plain' : o.paint.kind} → ${k === 'none' ? 'plain' : k}`);
			o.paint.kind = k;
		} else {
			const add = r.pick(['horn', 'tail', 'spike', 'frill', 'eye'] as PartType[]);
			const head = o.spine.length - 1;
			o.parts.push({ t: add, s: add === 'tail' ? 0 : head, a: add === 'tail' ? Math.PI : add === 'eye' ? 0.4 : 0.3, b: add === 'tail' ? 0.2 : 0.9, k: r.range(0.7, 1.3), r: 0, m: add !== 'tail' && add !== 'frill', v: add === 'tail' ? 'plain' : add === 'horn' ? 'curl' : '' });
			changes.push(`added ${add === 'eye' ? 'eyes' : add === 'horn' ? 'horns' : add}`);
		}
	}
	return { design: normalise(o), changes };
}

// ------------------------------------------------------------------ compile: design -> Plan

const UP: V3 = [0, 1, 0];
const rotAxis = (v: V3, k: V3, a: number): V3 => {
	const c = Math.cos(a),
		s = Math.sin(a);
	const kv = cross(k, v);
	const kd = k[0] * v[0] + k[1] * v[1] + k[2] * v[2];
	return [v[0] * c + kv[0] * s + k[0] * kd * (1 - c), v[1] * c + kv[1] * s + k[1] * kd * (1 - c), v[2] * c + kv[2] * s + k[2] * kd * (1 - c)];
};

export interface CompileInfo {
	/** world-space (rest, standing) surface point and normal of every placed part instance, by part index */
	anchors: Array<Array<{ p: V3; n: V3 }>>;
	/** segment centres and radii (rest, standing) */
	segs: Array<{ c: V3; r: V3; frame: number[] }>;
	warnings: string[];
}

export function compileDesign(dIn: Design, info?: CompileInfo): Plan {
	const d = dIn;
	const S = Math.max(0.25, Math.min(2.8, d.size));
	const R = 0.3 * S;
	const minR = Math.max(0.011, R * 0.075);
	const parts: Part[] = [];
	const bones: Bone[] = [];
	const addBone = (name: string, rest: V3, parent: number) => {
		bones.push({ name, rest, parent });
		return bones.length - 1;
	};
	const base = baseColor(d.paint.base),
		accent = accentColor(d.paint.accent),
		patC = patternColor(d.paint.pattern);
	const belly: RGB = [Math.min(1, base[0] * 0.72 + 0.25), Math.min(1, base[1] * 0.72 + 0.25), Math.min(1, base[2] * 0.72 + 0.24)];
	const pal: Palette = { body: base, belly, accent, pattern: patC, horn: oklch(0.92, 0.035, 85), foot: [base[0] * 0.75, base[1] * 0.75, base[2] * 0.75], mouth: oklch(0.24, 0.075, 15), tongue: oklch(0.68, 0.15, 8), blush: oklch(0.82, 0.12, 5), beak: oklch(0.8, 0.15, 75), nose: oklch(0.32, 0.04, 260), hue: BASE_HUES[d.paint.base % 11] };
	// spine segments (keep neighbours overlapping: one piece)
	const sp = d.spine.length ? d.spine : blankDesign().spine;
	const pts: V3[] = [];
	for (let i = 0; i < sp.length; i++) {
		let p: V3 = [0, sp[i].y * R, sp[i].z * R];
		if (i > 0) {
			const q = pts[i - 1];
			const maxGap = (sp[i - 1].r + sp[i].r) * R * 0.78;
			const dv = sub(p, q);
			const l = len(dv);
			if (l > maxGap) p = add(q, scale(dv, maxGap / l));
		}
		pts.push(p);
	}
	const segs: Array<{ c: V3; r: V3; frame: number[]; bone: number }> = [];
	for (let i = 0; i < sp.length; i++) {
		const prev = pts[Math.max(0, i - 1)],
			next = pts[Math.min(sp.length - 1, i + 1)];
		let tan = sub(next, prev);
		if (len(tan) < 1e-4) tan = [0, 0, 1];
		const frame = basisRows(norm(tan), UP);
		const rr = sp[i].r * R;
		const isHead = i === sp.length - 1 && sp.length > 1;
		const radii: V3 = isHead ? [rr * 0.98, rr * 0.95, rr * 0.98] : [rr * d.fat, rr * 0.92, rr * 1.05];
		segs.push({ c: pts[i], r: radii, frame, bone: -1 });
	}
	const nSeg = segs.length;
	for (let i = 0; i < nSeg; i++) {
		const isHead = i === nSeg - 1 && nSeg > 1;
		segs[i].bone = addBone(isHead ? 'head' : `seg${i}`, segs[i].c, i === 0 ? -1 : i - 1);
		parts.push({ kind: 'ell', op: 'add', c: segs[i].c, r: segs[i].r, m: segs[i].frame, bone: segs[i].bone, color: base, k: R * 0.45, pat: 1, tag: isHead ? 'head' : `seg${i}` });
	}
	const headIdx = nSeg - 1;
	const headBone = nSeg > 1 ? segs[headIdx].bone : addBone('head', segs[0].c, segs[0].bone);
	const segBones = (nSeg > 1 ? segs.slice(0, -1) : segs).map((s) => s.bone);
	const hornBone = addBone('horns', add(segs[headIdx].c, [0, segs[headIdx].r[1] * 0.6, 0]), headBone);
	const earBones: number[] = [];

	// surface placement: cast from the segment centre along the part's direction (in the segment frame)
	const body = parts.slice();
	prepare(body);
	const localDir = (seg: number, a: number, b: number): V3 => {
		const f = segs[seg].frame; // rows: x, y, z (world->local); world dir = x*l.x + y*l.y + z*l.z
		const l: V3 = [Math.sin(a) * Math.cos(b), Math.sin(b), Math.cos(a) * Math.cos(b)];
		return norm([f[0] * l[0] + f[3] * l[1] + f[6] * l[2], f[1] * l[0] + f[4] * l[1] + f[7] * l[2], f[2] * l[0] + f[5] * l[1] + f[8] * l[2]]);
	};
	const cast = (seg: number, a: number, b: number) => exitPoint(body, segs[seg].c, localDir(seg, a, b), R * 6);

	const legs: LegPlan[] = [];
	const arms: ArmPlan[] = [];
	const eyes: EyePlan[] = [];
	const chains: ChainPlan[] = [];
	const traits: string[] = [];
	const anchors: CompileInfo['anchors'] = d.parts.map(() => []);
	const footMod = { size: 1, style: 'paw' };
	let mouth: MouthPlan | null = null;
	let mouthSrc: { seg: number; a: number; b: number; w: number } | null = null;
	const throats: Array<{ part: Part; bone: number; seg: number; a: number; b: number; tr: number }> = [];
	const handMod = { size: 1 };
	for (const p of d.parts) {
		if (p.t === 'foot') {
			footMod.size = p.k;
			footMod.style = p.v || 'paw';
		}
		if (p.t === 'hand') handMod.size = p.k;
	}
	const legRaw: Array<{ hip: V3; n: V3; L: number; style: LegStyle; side: 1 | -1; pair: number; seg: number; thick: number }> = [];
	let pairCounter = 0;
	d.parts.forEach((p, pi) => {
		const seg = Math.max(0, Math.min(nSeg - 1, p.s));
		const sR = Math.min(segs[seg].r[0], segs[seg].r[1]);
		const k = Math.max(0.3, Math.min(3, p.k));
		const inst = p.m && Math.abs(Math.sin(p.a)) > 0.08 ? [p.a, -p.a] : [p.a];
		const pair = pairCounter++;
		for (const a of inst) {
			const side: 1 | -1 = Math.sin(a) >= 0 ? 1 : -1;
			const ex = cast(seg, a, p.b);
			anchors[pi].push(ex);
			const n = ex.n;
			const bone = segs[seg].bone;
			switch (p.t) {
				case 'eye': {
					const r = Math.max(minR * 1.2, sR * 0.3 * k);
					eyes.push({ bone, pos: add(ex.p, scale(n, r * 0.28)), n, r, pupil: 0.5, stalk: -1 });
					break;
				}
				case 'stalk': {
					const sr = Math.max(minR, sR * 0.07);
					const ci = chains.length;
					chains.push({ kind: 'stalk', bone, anchor: add(ex.p, scale(n, -sr * 1.5)), dir: norm(add(n, [0, 0.6, 0])), length: sR * 1.1 * k, segments: 5, r0: sr * 1.2, r1: sr, stiffness: 0.65, tip: 'eye', tipR: sR * 0.3, color: base, tipColor: base, curl: -0.05 });
					eyes.push({ bone, pos: ex.p, n, r: Math.max(minR * 1.2, sR * 0.3 * Math.min(1.4, k)), pupil: 0.52, stalk: ci });
					break;
				}
				case 'mouth': {
					// a clean overlay mouth (drawn by the creature): smile with buck teeth, smile with fangs, or open
					const w = sR * Math.max(0.36, 0.42 * k);
					const t = len(cross(UP, n)) > 1e-3 ? norm(cross(n, UP)) : ([1, 0, 0] as V3);
					void t;
					const up = norm(sub(UP, scale(n, n[1])));
					if (!mouth) {
						mouthSrc = { seg, a: p.a, b: p.b, w };
						mouth = {
							bone,
							p: ex.p,
							n,
							up,
							w: p.v === 'omni' ? w * 0.85 : w,
							style: p.v === 'omni' ? 'open' : 'smile',
							teeth: p.v === 'herb' ? 'buck' : p.v === 'carn' ? 'fangs' : 'none',
							tongue: true,
							inside: pal.mouth,
							lip: mixRGB(base, pal.mouth, 0.25),
							tooth: [0.97, 0.96, 0.92],
							tongueColor: pal.tongue,
						};
					}
					break;
				}
				case 'horn': {
					const hl = sR * 0.9 * k;
					const r0 = Math.max(minR * 1.6, sR * 0.15 * Math.sqrt(k)),
						r1 = Math.max(minR * 1.05, r0 * 0.3);
					const sideAxis = len(cross(n, UP)) > 1e-3 ? norm(cross(n, UP)) : ([1, 0, 0] as V3);
					let dir = norm(rotAxis(add(n, [0, 0.5, 0]), sideAxis, p.r * 0.6));
					let q0 = add(ex.p, scale(n, -r0 * 0.9));
					const curl = p.v === 'curl' ? 0.55 : 0.05;
					for (let i = 0; i < 3; i++) {
						const q1 = add(q0, scale(dir, hl / 3 + (i === 0 ? r0 * 0.9 : 0)));
						parts.push({ kind: 'cone', op: 'add', a: q0, b: q1, ra: Math.max(minR * 1.05, r0 + (r1 - r0) * (i / 3)), rb: Math.max(minR * 1.05, r0 + (r1 - r0) * ((i + 1) / 3)), bone: hornBone, color: pal.horn, k: i === 0 ? r0 * 0.6 : r1 * 0.3, pat: 0, tag: 'horn' });
						dir = rotAxis(dir, sideAxis, -curl * side);
						q0 = q1;
					}
					break;
				}
				case 'spike': {
					const sl = sR * 0.55 * k;
					const ra = Math.max(minR * 1.6, sl * 0.3);
					for (let i = -1; i <= 1; i++) {
						const e2 = cast(seg, p.a + i * 0.35, p.b);
						parts.push({ kind: 'cone', op: 'add', a: add(e2.p, scale(e2.n, -ra * 0.8)), b: add(e2.p, scale(e2.n, sl * (1 - Math.abs(i) * 0.25))), ra, rb: Math.max(minR * 1.05, ra * 0.22), bone, color: accent, k: ra * 0.5, pat: 0, tag: 'spike' });
					}
					break;
				}
				case 'throat': {
					// a round sac under the chin: a song sac (inflates when it sings) or a spit gland
					const tb = addBone('throat', ex.p, bone);
					earBones.push(tb);
					const tr = Math.max(minR * 2, sR * 0.36 * k);
					const col: RGB = p.v === 'spit' ? oklch(0.74, 0.15, 135) : belly;
					parts.push({ kind: 'ell', op: 'add', c: add(ex.p, scale(n, tr * 0.2)), r: [tr * 1.05, tr * 0.85, tr], m: basisRows(n, UP), bone: tb, color: col, k: tr * 0.5, pat: 0, tag: 'throat' });
					throats.push({ part: parts[parts.length - 1], bone: tb, seg, a: p.a, b: p.b, tr });
					break;
				}
				case 'frill': {
					const fb = addBone('frill', ex.p, headBone === bone ? headBone : bone);
					earBones.push(fb);
					const fl = sR * 0.8 * k;
					const t = len(cross(n, UP)) > 1e-3 ? norm(cross(n, UP)) : ([1, 0, 0] as V3);
					for (let i = -2; i <= 2; i++) {
						const dir = norm(add(add(n, scale(t, i * 0.45)), [0, 0.35, 0]));
						const c = add(ex.p, scale(dir, fl * 0.45));
						parts.push({ kind: 'ell', op: 'add', c, r: [Math.max(minR * 1.4, fl * 0.07), fl * 0.16, fl * 0.5], m: basisRows(dir, t), bone: fb, color: accent, k: sR * 0.12, pat: 0, tag: 'frill' });
					}
					break;
				}
				case 'wing': {
					const wb = addBone(side > 0 ? 'wingL' : 'wingR', ex.p, bone);
					earBones.push(wb);
					const wl = sR * 1.4 * k;
					const out = norm([side, 0.35, -0.2]);
					// three overlapping feathers fanning backward, each reaching from inside the body outward
					for (let i = 0; i < 3; i++) {
						const dir = norm(add(out, [0, -0.1 * i, -0.45 * i]));
						const c = add(add(ex.p, scale(n, -wl * 0.04)), scale(dir, wl * (0.36 - i * 0.04)));
						parts.push({ kind: 'ell', op: 'add', c, r: [wl * (0.2 - i * 0.03), Math.max(minR * 1.5, wl * 0.05), wl * (0.42 - i * 0.06)], m: basisRows(dir, UP), bone: wb, color: i === 0 ? accent : pal.belly, k: sR * 0.18, pat: 0, tag: 'wing' });
					}
					break;
				}
				case 'tail': {
					const r0 = Math.max(minR * 1.3, sR * 0.28);
					const length = R * 2.0 * k;
					const tip = (['plain', 'ball', 'fluff', 'spade'].includes(p.v) ? p.v : 'plain') as 'plain' | 'ball' | 'fluff' | 'spade';
					const t2 = tip === 'plain' ? 'none' : tip;
					chains.push({ kind: 'tail', bone, anchor: add(ex.p, scale(n, -r0 * 1.1)), dir: norm(add(n, [0, 0.3 + p.r * 0.5, 0])), length, segments: Math.max(6, Math.min(12, Math.round(length / (r0 * 1.4)))), r0, r1: Math.max(minR * 0.9, r0 * (t2 === 'none' ? 0.18 : 0.45)), stiffness: 0.45, tip: t2, tipR: t2 === 'fluff' ? r0 * 1.9 : t2 === 'ball' ? r0 * 1.45 : t2 === 'spade' ? r0 * 1.3 : 0, color: base, tipColor: t2 === 'fluff' ? belly : accent, curl: 0.08 });
					break;
				}
				case 'leg': {
					const L = Math.max(R * 0.8, R * 2.2 * k);
					const thick = Math.max(minR * 1.15, Math.min(R * 0.42, L * 0.1));
					const style: LegStyle = p.v === 'digi' ? 'digi' : p.v === 'insect' ? 'insect' : 'straight';
					legRaw.push({ hip: add(ex.p, scale(n, -thick * 0.85)), n, L, style, side, pair, seg, thick });
					break;
				}
				case 'arm': {
					const armL = R * 1.4 * k;
					const t = Math.max(minR * 1.1, Math.min(R * 0.3, armL * 0.09));
					arms.push({ side, bone, shoulder: add(ex.p, scale(n, -t * 1.1)), upper: armL * 0.5, lower: armL * 0.5, thick: t, handR: t * 1.55 * handMod.size });
					break;
				}
			}
		}
	});

	// a mouth always sits below the eyes, low enough on the face that it never reads as a nose or a nostril
	{
		const m = mouth as MouthPlan | null;
		const src = mouthSrc as { seg: number; a: number; b: number; w: number } | null;
		if (m && src) {
			const faceEyes = eyes.filter((e) => e.bone === m.bone && e.stalk < 0);
			const eyeLow = faceEyes.length ? Math.min(...faceEyes.map((e) => e.pos[1] - e.r)) : Infinity;
			const want = eyeLow - src.w * 0.35;
			// and on the front of the face: below the middle of the head, facing forward (an upright head's local
			// "forward" can point at the sky)
			const head = segs[src.seg];
			const bad = () => m.p[1] > want || m.p[1] > head.c[1] + head.r[1] * 0.1 || m.n[1] > 0.35;
			for (let b = src.b; bad() && b > -1.35; b -= 0.08) {
				const ex = cast(src.seg, src.a, b - 0.08);
				m.p = ex.p;
				m.n = ex.n;
				m.up = norm(sub(UP, scale(ex.n, ex.n[1])));
			}
		}
	}

	// a throat sac hangs under the mouth (above it, it would read as a nose)
	{
		const m = mouth as MouthPlan | null;
		for (const t of throats) {
			if (!m) break;
			const below = () => t.part.c![1] < m.p[1] - m.w * 0.4 - t.tr * 0.95;
			for (let b = t.b; !below() && b > -1.5; b -= 0.08) {
				const ex = cast(t.seg, t.a, b - 0.08);
				t.part.c = add(ex.p, scale(ex.n, t.tr * 0.2));
				t.part.m = basisRows(ex.n, UP);
				bones[t.bone].rest = ex.p;
			}
		}
	}

	// legs crowded onto one spot are spread along the body (so feet never fight over the same ground)
	for (let it = 0; it < 6; it++) {
		for (let i = 0; i < legRaw.length; i++)
			for (let j = i + 1; j < legRaw.length; j++) {
				const a = legRaw[i],
					b = legRaw[j];
				if (a.side !== b.side) continue;
				const minD = (a.thick + b.thick) * 1.6;
				const dz = b.hip[2] - a.hip[2],
					dx = b.hip[0] - a.hip[0];
				const dd = Math.hypot(dx, dz);
				if (dd >= minD) continue;
				const push = (minD - dd) / 2 + 1e-4;
				const dir = dz >= 0 ? 1 : -1;
				const tryMove = (l: typeof a, delta: number) => {
					const moved: V3 = [l.hip[0], l.hip[1], l.hip[2] + delta];
					if (field(body, moved[0], moved[1], moved[2]) < 0) l.hip = moved;
				};
				tryMove(a, -dir * push);
				tryMove(b, dir * push);
			}
	}

	// body height from the legs: every leg rests at most at 82% extension, and the belly clears the ground
	let height = 0;
	let lowestRel = 1e9;
	for (const s of segs) lowestRel = Math.min(lowestRel, s.c[1] - s.r[1]);
	let L = 0;
	if (legRaw.length) {
		const clearance = (Lx: number) => Math.max(0.025, 0.16 * R + 0.08 * Lx);
		const meanL = legRaw.reduce((m, l) => m + l.L, 0) / legRaw.length;
		// H that puts the lowest hip at 0.8 of its leg (vertical), bumped up for belly clearance
		let H = Math.min(...legRaw.map((l) => 0.8 * l.L * Math.cos(l.style === 'insect' ? 0.75 : 0.08) - l.hip[1]));
		H = Math.max(H, clearance(meanL) - lowestRel);
		height = H;
		for (const l of legRaw) {
			const splay = l.style === 'insect' ? 0.75 : 0.08;
			const hipH = l.hip[1] + H;
			// a leg too short to reach the ground at this height is lengthened ("you can't build it broken")
			const need = hipH / (0.86 * Math.cos(splay));
			// and never so long that it folds up under a low hip (knees in the dirt): rest extension stays 0.6..0.86
			const Li = Math.min(Math.max(l.L, need), Math.max(need, hipH / (0.6 * Math.cos(splay))));
			const lat = Math.max(0.8 * Li * Math.sin(splay), l.thick * 1.6);
			const meta = l.style === 'digi' ? Li * 0.24 : 0;
			const upper = l.style === 'insect' ? (Li - meta) * 0.46 : (Li - meta) * 0.5;
			const front = l.hip[2] > (segs[0].c[2] + segs[nSeg - 1].c[2]) / 2;
			const pole: V3 = l.style === 'insect' ? norm([l.side * 0.6, 1, 0]) : legRaw.length <= 2 || l.style === 'digi' ? norm([l.side * 0.12, 0, 1]) : norm([l.side * 0.12, 0, front ? -1 : -0.6]);
			legs.push({ pair: l.pair, side: l.side, bone: segs[l.seg].bone, hip: [l.hip[0], hipH, l.hip[2]], foot: [l.hip[0] + l.side * lat, 0, l.hip[2]], upper, lower: Li - meta - upper, meta, thick: l.thick, footR: Math.max(minR * 1.3, l.thick * 1.2 * footMod.size), pole, style: l.style });
		}
		L = legs.reduce((m, l) => m + l.upper + l.lower + l.meta, 0) / legs.length;
	} else height = -lowestRel;
	// pairs: renumber by front-to-back order of their hips
	const pairZ = new Map<number, number>();
	for (const l of legs) pairZ.set(l.pair, Math.max(pairZ.get(l.pair) ?? -1e9, l.hip[2]));
	const order = [...pairZ.entries()].sort((a, b) => b[1] - a[1]).map(([p]) => p);
	for (const l of legs) l.pair = order.indexOf(l.pair);
	const pairs = order.length;

	// lift everything to standing height
	const lift = (p: V3): V3 => [p[0], p[1] + height, p[2]];
	for (const p of parts) {
		if (p.c) p.c = lift(p.c);
		if (p.a) p.a = lift(p.a);
		if (p.b) p.b = lift(p.b);
	}
	for (const b of bones) b.rest = lift(b.rest);
	for (const e of eyes) e.pos = lift(e.pos);
	const mm = mouth as MouthPlan | null;
	if (mm) mm.p = lift(mm.p);
	for (const c of chains) c.anchor = lift(c.anchor);
	for (const a of arms) a.shoulder = lift(a.shoulder);
	for (const s of segs) s.c = lift(s.c);
	if (info) {
		info.anchors = anchors.map((list) => list.map((x) => ({ p: lift(x.p), n: x.n })));
		info.segs = segs.map((s) => ({ c: s.c, r: s.r, frame: s.frame }));
		info.warnings = [];
	}
	prepare(parts);

	// gait (as the genome builder does)
	const kind: BodyKind = legs.length === 0 ? 'blob' : legs.length === 1 ? 'mono' : legs.length === 2 ? 'biped' : legs.length <= 4 ? 'quad' : legs.length <= 6 ? 'hexa' : 'octo';
	const off = (w: number) => legs.map((l) => (((-l.pair * w + (l.side > 0 ? 0 : 0.5)) % 1) + 1) % 1);
	let gait: GaitPlan;
	const insect = legs[0]?.style === 'insect';
	if (kind === 'mono' || kind === 'blob') gait = { slow: legs.map(() => 0), fast: legs.map(() => 0), dutySlow: 0.5, dutyFast: 0.38, hop: true, gallop: null };
	else if (kind === 'biped') gait = { slow: off(0), fast: off(0), dutySlow: 0.62, dutyFast: 0.4, hop: false, gallop: null };
	else {
		const P = Math.max(1, pairs);
		gait = { slow: off(1 / (2 * P)), fast: off(0.5), dutySlow: Math.max(0.55, 1 - 1.6 / (2 * P)), dutyFast: insect ? 0.5 : 0.42, hop: false, gallop: null };
	}

	// bounds and labels
	let rad = 0,
		top = 0,
		fx = 0,
		fz = 0,
		minFeature = 1e9;
	for (const p of parts) {
		if (p.op === 'paint') continue;
		if (p.kind === 'cone') minFeature = Math.min(minFeature, p.ra!, p.rb!);
		else minFeature = Math.min(minFeature, ...p.r!);
		if (p.op !== 'add') continue;
		rad = Math.max(rad, Math.hypot(p.bc![0], p.bc![1] - height, p.bc![2]) + p.br!);
		top = Math.max(top, p.bc![1] + p.br!);
		fx = Math.max(fx, Math.abs(p.bc![0]) + p.br!);
		fz = Math.max(fz, Math.abs(p.bc![2]) + p.br!);
	}
	for (const l of legs) {
		fx = Math.max(fx, Math.abs(l.foot[0]) + l.footR);
		fz = Math.max(fz, Math.abs(l.foot[2]) + l.footR);
	}
	const count = (t: PartType) => d.parts.filter((p) => p.t === t).reduce((m, p) => m + (p.m && Math.abs(Math.sin(p.a)) > 0.08 ? 2 : 1), 0);
	traits.push(`${legs.length} leg${legs.length === 1 ? '' : 's'}`);
	if (eyes.length) traits.push(`${eyes.length} eye${eyes.length === 1 ? '' : 's'}`);
	const mouthPart = d.parts.find((p) => p.t === 'mouth');
	if (mouthPart) traits.push({ herb: 'herbivore', carn: 'carnivore', omni: 'omnivore' }[mouthPart.v] ?? 'mouth');
	for (const [t, w] of [
		['horn', 'horns'],
		['frill', 'frill'],
		['wing', 'wings'],
		['spike', 'spiky'],
		['tail', 'tail'],
		['arm', 'arms'],
		['stalk', 'eye stalks'],
	] as const)
		if (count(t)) traits.push(w);
	const genes = {} as Genes;
	for (const k of GENES) genes[k] = 0.5;
	Object.assign(genes, { googly: d.personality.googly, shy: d.personality.shy, social: d.personality.social, curious: d.personality.curious, bounce: (d.personality.bounce - 0.5), speed: (d.personality.speed - 0.75) / 0.5, earLen: 0.5, size: Math.min(0.99, Math.log(S / 0.3) / Math.log(2.6 / 0.3)), legs: legs.length / 9, hue: pal.hue / 360 });
	const walkSpeed = L > 0 ? Math.sqrt(0.16 * 9.81 * L) * d.personality.speed : Math.sqrt(0.12 * 9.81 * R * 2);
	const runSpeed = L > 0 ? Math.sqrt((insect ? 1.1 : 1.3) * 9.81 * L) * d.personality.speed : walkSpeed * 2.4;
	const code = encodeDesign(d);
	const word = { blob: 'Blob', mono: 'Pogo', biped: 'Biped', quad: 'Quadruped', hexa: 'Hexapod', octo: 'Octopod' }[kind];
	return {
		code,
		name: d.name || nameFor(code),
		species: `Hand-built ${word}`,
		traits,
		genes,
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
		pattern: { kind: d.paint.kind, scale: R * (0.25 + d.paint.scale * 0.6), seed: d.paint.pattern * 97 + 13 },
		height,
		legLength: L,
		radius: Math.max(rad, height),
		top,
		footprint: [fx, fz],
		minFeature,
		personality: { speed: d.personality.speed, bounce: d.personality.bounce, googly: d.personality.googly, shy: d.personality.shy, social: d.personality.social, curious: d.personality.curious },
		walkSpeed,
		runSpeed,
		wings: count('wing') > 0,
		mouth,
	};
}

