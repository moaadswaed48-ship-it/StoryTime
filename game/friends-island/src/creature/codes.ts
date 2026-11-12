// One entry point for every creature code: "C1..." genomes (seeded / mutated / bred) and "D1..." editor designs.
import { BASE_HUES, compileDesign, decodeDesign, type Design, type DPart, isDesignCode, mutateDesign, normalise } from './design.ts';
import { buildPlan, type Plan } from './build.ts';
import { decode, fromInput, hashSeed, isCode, Prng } from './genome.ts';
import { len, norm, sub, type V3 } from './sdf.ts';

export function planFromCode(code: string): Plan {
	if (isDesignCode(code)) return compileDesign(decodeDesign(code));
	return buildPlan(decode(code));
}

/** Any text: a design code, a genome code, or a seed word. */
export function planFromInput(s: string): Plan {
	if (isDesignCode(s)) return compileDesign(decodeDesign(s));
	if (isCode(s)) return buildPlan(decode(s));
	return buildPlan(fromInput(s));
}

/** Turn any creature into an editable design (close, not exact: the editor's own parts stand in for the genome's). */
export function designFromPlan(P: Plan): Design {
	if (isDesignCode(P.code)) return decodeDesign(P.code);
	const R = P.R;
	const H = P.height;
	const segParts = P.parts.filter((p) => p.kind === 'ell' && p.op === 'add' && (p.tag.startsWith('seg') || p.tag === 'head'));
	const spine = segParts.map((p) => ({ z: p.c![2] / R, y: (p.c![1] - H) / R, r: Math.max(p.r![0], p.r![1], p.r![2] * 0.85) / R }));
	spine.sort((a, b) => a.z - b.z || a.y - b.y);
	const segC: V3[] = spine.map((s) => [0, s.y * R + H, s.z * R]);
	const nearest = (p: readonly number[]) => {
		let best = 0,
			bd = Infinity;
		segC.forEach((c, i) => {
			const d = Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]) / (spine[i].r * R);
			if (d < bd) {
				bd = d;
				best = i;
			}
		});
		return best;
	};
	// direction in the segment frame (approximation: world axes; spines are mostly along +z)
	const ab = (seg: number, p: readonly number[]) => {
		const v = norm(sub(p as V3, segC[seg]));
		return { a: Math.atan2(v[0], v[2]), b: Math.asin(Math.max(-1, Math.min(1, v[1]))) };
	};
	const parts: DPart[] = [];
	const push = (t: DPart['t'], at: readonly number[], k: number, m: boolean, v = '') => {
		const s = nearest(at);
		const { a, b } = ab(s, at);
		parts.push({ t, s, a: m ? Math.abs(a) : a, b, k, r: 0, m, v });
	};
	const pairs = new Map<number, typeof P.legs>();
	for (const l of P.legs) pairs.set(l.pair, [...(pairs.get(l.pair) ?? []), l]);
	for (const [, ls] of pairs) {
		const l = ls.find((x) => x.side > 0) ?? ls[0];
		push('leg', l.hip, (l.upper + l.lower + l.meta) / (R * 2.2), ls.length === 2, l.style);
	}
	const leftEyes = P.eyes.filter((e) => e.stalk < 0 && e.pos[0] >= -1e-3);
	for (const e of leftEyes.slice(0, 6)) push('eye', e.pos, e.r / (Math.min(spine[nearest(e.pos)].r * R, 1e9) * 0.3), Math.abs(e.pos[0]) > R * 0.05);
	if (P.eyes.some((e) => e.stalk >= 0)) {
		const st = P.chains.find((c) => c.kind === 'stalk');
		if (st) push('stalk', st.anchor, 1, true);
	}
	const t = P.traits.join(' ');
	const headSeg = spine.length - 1;
	parts.push({ t: 'mouth', s: headSeg, a: 0, b: -0.35, k: 1, r: 0, m: false, v: t.includes('tusks') ? 'carn' : t.includes('teeth') || t.includes('beak') ? 'herb' : 'omni' });
	const horns = P.parts.filter((p) => p.tag === 'horn');
	if (horns.length) push('horn', horns[0].a!, 1, Math.abs(horns[0].a![0]) > R * 0.05, P.genes.hornCurl > 0.5 ? 'curl' : 'straight');
	const tail = P.chains.find((c) => c.kind === 'tail');
	if (tail) push('tail', tail.anchor, tail.length / (R * 2), false, tail.tip === 'none' ? 'plain' : tail.tip);
	const spikes = P.parts.filter((p) => p.tag === 'spike');
	if (spikes.length) push('spike', spikes[Math.floor(spikes.length / 2)].a!, 1, false);
	for (const a of P.arms.filter((x) => x.side > 0)) push('arm', a.shoulder, (a.upper + a.lower) / (R * 1.4), true);
	// paint: the nearest base hue
	let bi = 0,
		bd = 999;
	BASE_HUES.slice(0, 11).forEach((h, i) => {
		const dd = Math.min(Math.abs(h - P.palette.hue), 360 - Math.abs(h - P.palette.hue));
		if (dd < bd) {
			bd = dd;
			bi = i;
		}
	});
	const kind = P.pattern.kind;
	void len;
	return normalise({
		v: 1,
		name: P.name,
		size: P.size,
		fat: Math.max(0.7, Math.min(1.4, (segParts[0]?.r?.[0] ?? R) / R)),
		spine,
		parts,
		paint: { base: bi, accent: (bi + 5) % 11, pattern: (bi + 8) % 11, kind, scale: 0.5 },
		personality: { ...P.personality },
	});
}

/** Mutation for any code: genomes in the worker (see evolve.ts), designs here (cheap). */
export function mutateDesignCode(code: string, seed: number) {
	const r = mutateDesign(decodeDesign(code), seed);
	return { code: compileDesign(r.design).code, changes: r.changes };
}

/** Breeding where at least one parent is a design: spine from one, parts from both halves. */
export function breedDesigns(a: Plan, b: Plan, seed: number) {
	const r = new Prng(hashSeed(`${a.code}+${b.code}`) ^ seed);
	const da = designFromPlan(a),
		db = designFromPlan(b);
	const base = r.next() < 0.5 ? da : db;
	const other = base === da ? db : da;
	const parts = [...base.parts.filter(() => r.next() < 0.6), ...other.parts.filter(() => r.next() < 0.45).map((p) => ({ ...p, s: Math.min(base.spine.length - 1, Math.round((p.s / Math.max(1, other.spine.length - 1)) * (base.spine.length - 1))) }))];
	if (!parts.some((p) => p.t === 'eye' || p.t === 'stalk')) parts.push(...other.parts.filter((p) => p.t === 'eye').slice(0, 1));
	if (!parts.some((p) => p.t === 'mouth')) parts.push({ t: 'mouth', s: base.spine.length - 1, a: 0, b: -0.35, k: 1, r: 0, m: false, v: 'omni' });
	const child = normalise({ ...base, name: '', size: (da.size + db.size) / 2, parts, paint: { ...base.paint, accent: other.paint.base, kind: r.next() < 0.5 ? da.paint.kind : db.paint.kind } });
	return compileDesign(child).code;
}
