// Signed distance field of a creature body: ellipsoids and round cones joined with smooth unions (and a few
// smooth subtractions for mouths). Inigo Quilez's formulas: round cone (exact), ellipsoid (bound), polynomial smin
// that also returns the blend factor, which mixes the part colours across each seam.
// Pure TypeScript so the mesher can run in a worker and in Node.
import type { RGB } from './color.ts';

export type V3 = [number, number, number];

export interface Part {
	kind: 'ell' | 'cone';
	op: 'add' | 'sub' | 'paint';
	/** smooth-union / subtraction blend width (m) */
	k: number;
	bone: number;
	color: RGB;
	/** 1 = body skin that takes patterns and belly shading, 0 = horn, mouth, teeth... */
	pat: number;
	tag: string;
	// ellipsoid
	c?: V3;
	r?: V3;
	/** rows of the world->local rotation (identity when absent) */
	m?: number[];
	// round cone
	a?: V3;
	b?: V3;
	ra?: number;
	rb?: number;
	// derived (prepare())
	bc?: V3;
	br?: number;
	_cone?: { ba: V3; l2: number; rr: number; a2: number; il2: number; sphere: boolean };
}

export const v3 = (x: number, y: number, z: number): V3 => [x, y, z];
export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scale = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const len = (a: V3) => Math.sqrt(dot(a, a));
export const norm = (a: V3): V3 => {
	const l = len(a) || 1;
	return [a[0] / l, a[1] / l, a[2] / l];
};
export const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const lerp3 = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** Rotation rows (world->local) whose local Z axis points along `fwd` and local Y roughly along `up`. */
export function basisRows(fwd: V3, up: V3 = [0, 1, 0]): number[] {
	const z = norm(fwd);
	let x = cross(up, z);
	if (len(x) < 1e-4) x = cross([1, 0, 0], z);
	x = norm(x);
	const y = cross(z, x);
	return [x[0], x[1], x[2], y[0], y[1], y[2], z[0], z[1], z[2]];
}

export function prepare(parts: Part[]) {
	for (const p of parts) {
		if (p.kind === 'ell') {
			const r = p.r!;
			p.bc = p.c!;
			p.br = Math.max(r[0], r[1], r[2]);
		} else {
			const a = p.a!,
				b = p.b!;
			const ba = sub(b, a);
			const l2 = dot(ba, ba);
			const rr = p.ra! - p.rb!;
			const a2 = l2 - rr * rr;
			const sphere = a2 <= 1e-9 || l2 < 1e-10;
			p._cone = { ba, l2, rr, a2, il2: 1 / Math.max(l2, 1e-10), sphere };
			p.bc = lerp3(a, b, 0.5);
			p.br = Math.sqrt(l2) / 2 + Math.max(p.ra!, p.rb!);
		}
	}
}

export function partDist(p: Part, x: number, y: number, z: number): number {
	if (p.kind === 'ell') {
		let px = x - p.c![0],
			py = y - p.c![1],
			pz = z - p.c![2];
		const m = p.m;
		if (m) {
			const lx = m[0] * px + m[1] * py + m[2] * pz;
			const ly = m[3] * px + m[4] * py + m[5] * pz;
			const lz = m[6] * px + m[7] * py + m[8] * pz;
			px = lx;
			py = ly;
			pz = lz;
		}
		const r = p.r!;
		const ax = px / r[0],
			ay = py / r[1],
			az = pz / r[2];
		const k0 = Math.sqrt(ax * ax + ay * ay + az * az);
		const bx = ax / r[0],
			by = ay / r[1],
			bz = az / r[2];
		const k1 = Math.sqrt(bx * bx + by * by + bz * bz);
		return k1 < 1e-9 ? -Math.min(r[0], r[1], r[2]) : (k0 * (k0 - 1)) / k1;
	}
	const c = p._cone!;
	const a = p.a!;
	const pax = x - a[0],
		pay = y - a[1],
		paz = z - a[2];
	if (c.sphere) {
		const big = p.ra! >= p.rb! ? a : p.b!;
		return Math.hypot(x - big[0], y - big[1], z - big[2]) - Math.max(p.ra!, p.rb!);
	}
	const ba = c.ba;
	const yy = pax * ba[0] + pay * ba[1] + paz * ba[2];
	const zz = yy - c.l2;
	const qx = pax * c.l2 - ba[0] * yy,
		qy = pay * c.l2 - ba[1] * yy,
		qz = paz * c.l2 - ba[2] * yy;
	const x2 = qx * qx + qy * qy + qz * qz;
	const y2 = yy * yy * c.l2;
	const z2 = zz * zz * c.l2;
	const k = Math.sign(c.rr) * c.rr * c.rr * x2;
	if (Math.sign(zz) * c.a2 * z2 > k) return Math.sqrt(x2 + z2) * c.il2 - p.rb!;
	if (Math.sign(yy) * c.a2 * y2 < k) return Math.sqrt(x2 + y2) * c.il2 - p.ra!;
	return (Math.sqrt(x2 * c.a2 * c.il2) + yy * c.rr) * c.il2 - p.ra!;
}

export interface Sample {
	d: number;
	col: RGB;
	pat: number;
}

/**
 * Field value at a point. Parts whose bounding sphere is further than the current distance plus their blend
 * width cannot change the result and are skipped, which makes a 60^3 grid cheap.
 */
export function field(parts: Part[], x: number, y: number, z: number): number {
	let d = 1e9;
	for (let i = 0; i < parts.length; i++) {
		const p = parts[i];
		const bc = p.bc!;
		if (p.op === 'paint') continue;
		const lb = Math.hypot(x - bc[0], y - bc[1], z - bc[2]) - p.br!;
		if (p.op === 'add') {
			if (lb > d + p.k) continue;
			const di = partDist(p, x, y, z);
			const h = Math.min(1, Math.max(0, 0.5 + (0.5 * (d - di)) / p.k));
			d = d + (di - d) * h - p.k * h * (1 - h);
		} else {
			if (lb > p.k - d && lb > p.k) continue;
			const di = partDist(p, x, y, z);
			const h = Math.min(1, Math.max(0, 0.5 - (0.5 * (d + di)) / p.k));
			d = d + (-di - d) * h + p.k * h * (1 - h);
		}
	}
	return d;
}

/** Field value plus the blended colour and pattern weight. */
export function sample(parts: Part[], x: number, y: number, z: number, out: Sample): Sample {
	let d = 1e9;
	let r = 0,
		g = 0,
		b = 0,
		pat = 0;
	let first = true;
	for (let i = 0; i < parts.length; i++) {
		const p = parts[i];
		if (p.op === 'paint') {
			const c = p.c!;
			const q = Math.hypot(x - c[0], y - c[1], z - c[2]) / p.r![0];
			if (q < 1) {
				const w = Math.pow(1 - q * q, 1.5) * 0.9;
				r += (p.color[0] - r) * w;
				g += (p.color[1] - g) * w;
				b += (p.color[2] - b) * w;
				pat *= 1 - w;
			}
			continue;
		}
		const di = partDist(p, x, y, z);
		if (p.op === 'add') {
			if (first) {
				d = di;
				[r, g, b] = p.color;
				pat = p.pat;
				first = false;
				continue;
			}
			const h = Math.min(1, Math.max(0, 0.5 + (0.5 * (d - di)) / p.k));
			// shape blends softly, but a differently coloured part (horn, spike, frill, beak, sac) keeps a crisp
			// colour edge where it meets the skin instead of a muddy smear
			const hc = p.pat > 0.5 ? h : Math.min(1, Math.max(0, 0.5 + (0.5 * (d - di)) / (p.k * 0.22)));
			d = d + (di - d) * h - p.k * h * (1 - h);
			r += (p.color[0] - r) * hc;
			g += (p.color[1] - g) * hc;
			b += (p.color[2] - b) * hc;
			pat += (p.pat - pat) * hc;
		} else {
			const h = Math.min(1, Math.max(0, 0.5 - (0.5 * (d + di)) / p.k));
			d = d + (-di - d) * h + p.k * h * (1 - h);
			// colour the carved surface: where the cutter's surface is the one we see (di ~ 0), take its colour
			const w = Math.min(1, Math.max(0, 1 - Math.abs(di) / (p.k * 0.9 + 1e-6))) * Math.min(1, h * 2.2);
			r += (p.color[0] - r) * w;
			g += (p.color[1] - g) * w;
			b += (p.color[2] - b) * w;
			pat *= 1 - w;
		}
	}
	out.d = d;
	out.col = [r, g, b];
	out.pat = pat;
	return out;
}

export function gradient(parts: Part[], x: number, y: number, z: number, e: number): V3 {
	const dx = field(parts, x + e, y, z) - field(parts, x - e, y, z);
	const dy = field(parts, x, y + e, z) - field(parts, x, y - e, z);
	const dz = field(parts, x, y, z + e) - field(parts, x, y, z - e);
	return norm([dx, dy, dz]);
}

/** March from `from` along `dir` to the first surface crossing (sphere tracing, then bisection). */
export function castToSurface(parts: Part[], from: V3, dir: V3, maxDist: number): V3 | null {
	const d0 = norm(dir);
	let t = 0;
	let prevT = 0;
	let prevInside = field(parts, from[0], from[1], from[2]) < 0;
	for (let i = 0; i < 160 && t <= maxDist; i++) {
		const p = add(from, scale(d0, t));
		const f = field(parts, p[0], p[1], p[2]);
		const inside = f < 0;
		if (inside !== prevInside) {
			let lo = prevT,
				hi = t;
			for (let j = 0; j < 24; j++) {
				const mid = (lo + hi) / 2;
				const pm = add(from, scale(d0, mid));
				if (field(parts, pm[0], pm[1], pm[2]) < 0 === prevInside) lo = mid;
				else hi = mid;
			}
			return add(from, scale(d0, (lo + hi) / 2));
		}
		prevInside = inside;
		prevT = t;
		t += Math.max(Math.abs(f) * 0.8, maxDist / 400);
	}
	return null;
}

/**
 * Starting inside the body at `from`, find where a ray along `dir` exits the surface.
 * Used to put eyes, horns, ears, hips and tails exactly on the skin, so nothing floats.
 */
export function exitPoint(parts: Part[], from: V3, dir: V3, maxDist: number): { p: V3; n: V3 } {
	const hit = castToSurface(parts, from, dir, maxDist);
	const p = hit ?? add(from, scale(norm(dir), maxDist * 0.5));
	return { p, n: gradient(parts, p[0], p[1], p[2], 0.002) };
}
