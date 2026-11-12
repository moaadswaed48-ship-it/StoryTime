// Surface nets (Gibson 1998; Lysenko's 0fps write-up): one vertex per sign-changing cell, a quad per
// sign-changing grid edge. Fewer, better-shaped triangles than marching cubes, ideal for smooth blobs.
// Then each vertex is pulled exactly onto the surface with a Newton step along the SDF gradient, gets an SDF normal,
// a blended part colour plus pattern, and up to four bone weights from part proximity (procedural skinning).
import { mixRGB, type RGB } from './color.ts';
import type { Plan } from './build.ts';
import { field, partDist, type Part, prepare, sample, type Sample } from './sdf.ts';

export interface MeshData {
	positions: Float32Array;
	normals: Float32Array;
	colors: Float32Array;
	skinIndex: Uint16Array;
	skinWeight: Float32Array;
	/** per vertex: pattern mask (where the pattern may show), baked occlusion, pattern kind, pattern scale */
	pat: Float32Array;
	/** per vertex: pattern colour (rgb) and pattern seed */
	patColor: Float32Array;
	index: Uint32Array;
	/** grid stats for the harness */
	stats: { nx: number; ny: number; nz: number; cell: number; ms: number; components: number; verts: number; tris: number; compInfo: Array<{ n: number; c: number[] }>; crumbs: number };
}

// ---- tiny value noise for patterns (deterministic) ----
function hash3(x: number, y: number, z: number, s: number) {
	let h = (x * 374761393 + y * 668265263 + z * 2147483647 + s * 1274126177) | 0;
	h = Math.imul(h ^ (h >>> 13), 1274126177);
	return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
/** distance to the nearest jittered cell point (Worley F1), in cell units */
function worley(x: number, y: number, z: number, s: number) {
	const xi = Math.floor(x),
		yi = Math.floor(y),
		zi = Math.floor(z);
	let best = 9;
	for (let i = -1; i <= 1; i++)
		for (let j = -1; j <= 1; j++)
			for (let k = -1; k <= 1; k++) {
				const cx = xi + i,
					cy = yi + j,
					cz = zi + k;
				const px = cx + hash3(cx, cy, cz, s),
					py = cy + hash3(cx, cy, cz, s + 1),
					pz = cz + hash3(cx, cy, cz, s + 2);
				const d = Math.hypot(px - x, py - y, pz - z);
				if (d < best) best = d;
			}
	return best;
}
function vnoise(x: number, y: number, z: number, s: number) {
	const xi = Math.floor(x),
		yi = Math.floor(y),
		zi = Math.floor(z);
	const fx = x - xi,
		fy = y - yi,
		fz = z - zi;
	const u = fx * fx * (3 - 2 * fx),
		v = fy * fy * (3 - 2 * fy),
		w = fz * fz * (3 - 2 * fz);
	const c = (i: number, j: number, k: number) => hash3(xi + i, yi + j, zi + k, s);
	const l = (a: number, b: number, t: number) => a + (b - a) * t;
	return l(l(l(c(0, 0, 0), c(1, 0, 0), u), l(c(0, 1, 0), c(1, 1, 0), u), v), l(l(c(0, 0, 1), c(1, 0, 1), u), l(c(0, 1, 1), c(1, 1, 1), u), v), w);
}
const smooth = (a: number, b: number, x: number) => {
	const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
	return t * t * (3 - 2 * t);
};

/** shader pattern kinds (src/look/materials.ts draws them per pixel, crisp at any distance) */
export const PATTERN_KIND: Record<string, number> = { none: 0, spots: 1, stripes: 2, patches: 3, gradient: 0 };

/**
 * Colour of the skin at a rest-space point: part colour, then belly, a soft dorsal gradient; spots, stripes and
 * patches are only masked here (mask.v) and drawn per pixel by the body shader, so their edges stay crisp.
 */
function skinColor(plan: Plan, s: Sample, x: number, y: number, z: number, ny: number, mask: { v: number }): RGB {
	let c = s.col;
	const pat = s.pat;
	mask.v = 0;
	if (pat > 0.01) {
		const P = plan.palette;
		const belly = smooth(0.15, -0.55, ny) * (plan.kind === 'biped' ? 0.85 : 1);
		const kind = plan.pattern.kind;
		let skin = c;
		// a dorsal gradient darkens toward a deeper shade of the body (a complementary blend would go muddy)
		if (kind === 'gradient') skin = mixRGB(c, mixRGB([c[0] * 0.62, c[1] * 0.62, c[2] * 0.62], P.pattern, 0.3), smooth(0.0, 0.9, ny) * 0.8 * pat);
		skin = mixRGB(skin, P.belly, belly * pat * (kind === 'patches' ? 0.35 : 0.6));
		c = mixRGB(c, skin, pat);
		// where the shader may draw the marks: not on the belly, spots and stripes only on the upper body
		const gate = kind === 'spots' ? smooth(-0.3, 0.2, ny) : kind === 'stripes' ? smooth(-0.25, 0.25, ny) : 1;
		mask.v = pat * gate * (1 - belly * (kind === 'patches' ? 0.35 : 0.6));
	}
	void x;
	void y;
	void z;
	return c;
}

/**
 * Meshes a plan's SDF. `cellTarget` is the voxel size wish (m); the grid is clamped to `maxDim` cells per axis
 * and refined so the thinnest part spans at least ~2.4 voxels.
 */
export function meshPlan(plan: Plan, maxDim = 72): MeshData {
	const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
	const parts: Part[] = plan.parts;
	prepare(parts);
	const solid = parts.filter((p) => p.op !== 'paint');
	// bounds
	let lo = [1e9, 1e9, 1e9],
		hi = [-1e9, -1e9, -1e9];
	for (const p of solid) {
		if (p.op !== 'add') continue;
		for (let a = 0; a < 3; a++) {
			lo[a] = Math.min(lo[a], p.bc![a] - p.br! - p.k);
			hi[a] = Math.max(hi[a], p.bc![a] + p.br! + p.k);
		}
	}
	const ext = Math.max(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]);
	// resolution ext / maxDim; thin parts are fattened to 1.6 voxels below
	const cell = ext / maxDim;
	// nothing thinner than ~1.6 voxels across, or sampling breaks thin tips into floating crumbs
	const minRad = cell * 0.8;
	for (const p of solid) {
		if (p.kind === 'cone') {
			p.ra = Math.max(p.ra!, minRad);
			p.rb = Math.max(p.rb!, minRad);
		} else p.r = p.r!.map((v) => Math.max(v, minRad)) as [number, number, number];
	}
	prepare(solid);
	const pad = cell * 1.5;
	lo = lo.map((v) => v - pad);
	hi = hi.map((v) => v + pad);
	const nx = Math.ceil((hi[0] - lo[0]) / cell) + 1;
	const ny = Math.ceil((hi[1] - lo[1]) / cell) + 1;
	const nz = Math.ceil((hi[2] - lo[2]) / cell) + 1;
	const N = nx * ny * nz;
	const F = new Float32Array(N);
	const idx = (i: number, j: number, k: number) => i + nx * (j + ny * k);
	// narrow band: a coarse grid (every 4th sample) first; fine samples far from the surface take the coarse
	// value's sign (the field is a distance bound, so a coarse |d| well above the coarse cell size is safe)
	const ST = 4;
	const cx = Math.ceil((nx - 1) / ST) + 1,
		cy = Math.ceil((ny - 1) / ST) + 1,
		cz = Math.ceil((nz - 1) / ST) + 1;
	const Cf = new Float32Array(cx * cy * cz);
	for (let k = 0; k < cz; k++)
		for (let j = 0; j < cy; j++)
			for (let i = 0; i < cx; i++) Cf[i + cx * (j + cy * k)] = field(solid, lo[0] + i * ST * cell, lo[1] + j * ST * cell, lo[2] + k * ST * cell);
	// per coarse cell: only the parts that can change the field inside it (order preserved: smin is ordered)
	const cDiag = ST * cell * Math.sqrt(3);
	const lists: Array<Part[] | undefined> = new Array((cx - 1) * (cy - 1) * (cz - 1));
	const listAt = (x: number, y: number, z: number): Part[] => {
		const i0 = Math.min(cx - 2, Math.max(0, Math.floor((x - lo[0]) / (ST * cell))));
		const j0 = Math.min(cy - 2, Math.max(0, Math.floor((y - lo[1]) / (ST * cell))));
		const k0 = Math.min(cz - 2, Math.max(0, Math.floor((z - lo[2]) / (ST * cell))));
		const ci = i0 + (cx - 1) * (j0 + (cy - 1) * k0);
		let l = lists[ci];
		if (l) return l;
		let dmax = -1e9;
		for (let c = 0; c < 8; c++) dmax = Math.max(dmax, Cf[i0 + (c & 1) + cx * (j0 + ((c >> 1) & 1) + cy * (k0 + ((c >> 2) & 1)))]);
		dmax += cDiag;
		const mx = lo[0] + (i0 + 0.5) * ST * cell,
			my = lo[1] + (j0 + 0.5) * ST * cell,
			mz = lo[2] + (k0 + 0.5) * ST * cell;
		l = solid.filter((p) => {
			const lb = Math.hypot(mx - p.bc![0], my - p.bc![1], mz - p.bc![2]) - p.br! - cDiag;
			return p.op === 'add' ? lb <= dmax + p.k + cDiag : lb <= p.k + 2 * cDiag + Math.max(0, -dmax);
		});
		if (!l.some((p) => p.op === 'add')) l = solid;
		lists[ci] = l;
		return l;
	};
	const fieldAt = (x: number, y: number, z: number) => field(listAt(x, y, z), x, y, z);
	const band = ST * cell * 1.9;
	let exact = 0;
	for (let k = 0; k < nz; k++) {
		const z = lo[2] + k * cell;
		const k0 = Math.min(cz - 2, Math.floor(k / ST)),
			tz = k / ST - k0;
		for (let j = 0; j < ny; j++) {
			const y = lo[1] + j * cell;
			const j0 = Math.min(cy - 2, Math.floor(j / ST)),
				ty = j / ST - j0;
			for (let i = 0; i < nx; i++) {
				const i0 = Math.min(cx - 2, Math.floor(i / ST)),
					tx = i / ST - i0;
				const b0 = i0 + cx * (j0 + cy * k0);
				const sy = cx,
					sz = cx * cy;
				const x00 = Cf[b0] + (Cf[b0 + 1] - Cf[b0]) * tx;
				const x10 = Cf[b0 + sy] + (Cf[b0 + sy + 1] - Cf[b0 + sy]) * tx;
				const x01 = Cf[b0 + sz] + (Cf[b0 + sz + 1] - Cf[b0 + sz]) * tx;
				const x11 = Cf[b0 + sy + sz] + (Cf[b0 + sy + sz + 1] - Cf[b0 + sy + sz]) * tx;
				const v = (x00 + (x10 - x00) * ty) * (1 - tz) + (x01 + (x11 - x01) * ty) * tz;
				if (Math.abs(v) > band) F[idx(i, j, k)] = v;
				else {
					F[idx(i, j, k)] = fieldAt(lo[0] + i * cell, y, z);
					exact++;
				}
			}
		}
	}

	// connected components of the inside voxels (6-connectivity): a coherent body is exactly one piece
	const comp = new Int32Array(N).fill(-1);
	let components = 0;
	const stack: number[] = [];
	for (let s = 0; s < N; s++) {
		if (F[s] >= 0 || comp[s] >= 0) continue;
		comp[s] = components;
		stack.push(s);
		while (stack.length) {
			const c = stack.pop()!;
			const i = c % nx,
				j = Math.floor(c / nx) % ny,
				k = Math.floor(c / (nx * ny));
			const nb = [i > 0 ? c - 1 : -1, i < nx - 1 ? c + 1 : -1, j > 0 ? c - nx : -1, j < ny - 1 ? c + nx : -1, k > 0 ? c - nx * ny : -1, k < nz - 1 ? c + nx * ny : -1];
			for (const n of nb) if (n >= 0 && F[n] < 0 && comp[n] < 0) {
				comp[n] = components;
				stack.push(n);
			}
		}
		components++;
	}
	const compSize = new Array(components).fill(0);
	const compSum = Array.from({ length: components }, () => [0, 0, 0]);
	for (let c = 0; c < N; c++)
		if (comp[c] >= 0) {
			compSize[comp[c]]++;
			const i = c % nx,
				j = Math.floor(c / nx) % ny,
				k = Math.floor(c / (nx * ny));
			compSum[comp[c]][0] += lo[0] + i * cell;
			compSum[comp[c]][1] += lo[1] + j * cell;
			compSum[comp[c]][2] += lo[2] + k * cell;
		}
	const compInfo = compSize.map((n, i) => ({ n, c: compSum[i].map((v) => +(v / n).toFixed(3)) }));
	// sampling crumbs (a few voxels at the very tip of a thin fin) are not parts: clear them before meshing
	const biggest = Math.max(1, ...compSize);
	let crumbs = 0;
	for (let ci = 0; ci < components; ci++) if (compSize[ci] < Math.min(64, biggest * 0.01)) crumbs++;
	if (crumbs) {
		for (let c = 0; c < N; c++) if (comp[c] >= 0 && compSize[comp[c]] < Math.min(64, biggest * 0.01)) F[c] = cell * 0.5;
		components -= crumbs;
	}

	// vertices: one per sign-changing cell
	const cellVert = new Int32Array((nx - 1) * (ny - 1) * (nz - 1)).fill(-1);
	const cidx = (i: number, j: number, k: number) => i + (nx - 1) * (j + (ny - 1) * k);
	const pos: number[] = [];
	const corners = [
		[0, 0, 0],
		[1, 0, 0],
		[0, 1, 0],
		[1, 1, 0],
		[0, 0, 1],
		[1, 0, 1],
		[0, 1, 1],
		[1, 1, 1],
	];
	const edges = [
		[0, 1],
		[2, 3],
		[4, 5],
		[6, 7],
		[0, 2],
		[1, 3],
		[4, 6],
		[5, 7],
		[0, 4],
		[1, 5],
		[2, 6],
		[3, 7],
	];
	const cv = new Float32Array(8);
	for (let k = 0; k < nz - 1; k++)
		for (let j = 0; j < ny - 1; j++)
			for (let i = 0; i < nx - 1; i++) {
				let mask = 0;
				for (let c = 0; c < 8; c++) {
					const [a, b, d] = corners[c];
					cv[c] = F[idx(i + a, j + b, k + d)];
					if (cv[c] < 0) mask |= 1 << c;
				}
				if (mask === 0 || mask === 255) continue;
				let sx = 0,
					sy = 0,
					sz = 0,
					n = 0;
				for (const [e0, e1] of edges) {
					const a = cv[e0],
						b = cv[e1];
					if (a < 0 === b < 0) continue;
					const t = a / (a - b);
					const p0 = corners[e0],
						p1 = corners[e1];
					sx += p0[0] + (p1[0] - p0[0]) * t;
					sy += p0[1] + (p1[1] - p0[1]) * t;
					sz += p0[2] + (p1[2] - p0[2]) * t;
					n++;
				}
				cellVert[cidx(i, j, k)] = pos.length / 3;
				pos.push(lo[0] + (i + sx / n) * cell, lo[1] + (j + sy / n) * cell, lo[2] + (k + sz / n) * cell);
			}

	// faces: a quad around every sign-changing edge
	const tris: number[] = [];
	const quad = (a: number, b: number, c: number, d: number, flip: boolean) => {
		if (a < 0 || b < 0 || c < 0 || d < 0) return;
		// split along the shorter diagonal
		const dac = (pos[a * 3] - pos[c * 3]) ** 2 + (pos[a * 3 + 1] - pos[c * 3 + 1]) ** 2 + (pos[a * 3 + 2] - pos[c * 3 + 2]) ** 2;
		const dbd = (pos[b * 3] - pos[d * 3]) ** 2 + (pos[b * 3 + 1] - pos[d * 3 + 1]) ** 2 + (pos[b * 3 + 2] - pos[d * 3 + 2]) ** 2;
		if (flip) {
			if (dac <= dbd) tris.push(a, c, b, a, d, c);
			else tris.push(a, d, b, b, d, c);
		} else if (dac <= dbd) tris.push(a, b, c, a, c, d);
		else tris.push(a, b, d, b, c, d);
	};
	for (let k = 1; k < nz - 1; k++)
		for (let j = 1; j < ny - 1; j++)
			for (let i = 1; i < nx - 1; i++) {
				const inside = F[idx(i, j, k)] < 0;
				// x edge (i,j,k)-(i+1,j,k): cells around it vary in j,k
				if (i < nx - 1 && inside !== F[idx(i + 1, j, k)] < 0)
					quad(cellVert[cidx(i, j - 1, k - 1)], cellVert[cidx(i, j, k - 1)], cellVert[cidx(i, j, k)], cellVert[cidx(i, j - 1, k)], !inside);
				if (j < ny - 1 && inside !== F[idx(i, j + 1, k)] < 0)
					quad(cellVert[cidx(i - 1, j, k - 1)], cellVert[cidx(i - 1, j, k)], cellVert[cidx(i, j, k)], cellVert[cidx(i, j, k - 1)], !inside);
				if (k < nz - 1 && inside !== F[idx(i, j, k + 1)] < 0)
					quad(cellVert[cidx(i - 1, j - 1, k)], cellVert[cidx(i, j - 1, k)], cellVert[cidx(i, j, k)], cellVert[cidx(i - 1, j, k)], !inside);
			}

	// project onto the surface, normals, colours, weights
	const V = pos.length / 3;
	const P = new Float32Array(pos);
	const Nn = new Float32Array(V * 3);
	const C = new Float32Array(V * 3);
	const SI = new Uint16Array(V * 4);
	const SW = new Float32Array(V * 4);
	const PT = new Float32Array(V * 4);
	const PC = new Float32Array(V * 4);
	const mask = { v: 0 };
	const pk = PATTERN_KIND[plan.pattern.kind] ?? 0;
	const aoH = Math.max(cell * 1.2, plan.R * 0.07);
	const e = cell * 0.35;
	const smp: Sample = { d: 0, col: [0, 0, 0], pat: 0 };
	const addParts = solid.filter((p) => p.op === 'add');
	const nb = plan.bones.length;
	const boneW = new Float32Array(nb);
	const blendS = plan.R * 0.12;
	for (let v = 0; v < V; v++) {
		let x = P[v * 3],
			y = P[v * 3 + 1],
			z = P[v * 3 + 2];
		// one Newton step onto the surface (surface-net vertices start within a cell of it), then the normal
		const L = listAt(x, y, z);
		{
			const f = field(L, x, y, z);
			const ax = field(L, x + e, y, z) - field(L, x - e, y, z);
			const ay = field(L, x, y + e, z) - field(L, x, y - e, z);
			const az = field(L, x, y, z + e) - field(L, x, y, z - e);
			const g2 = Math.hypot(ax, ay, az) / (2 * e) || 1;
			let step = f / g2;
			const maxStep = cell * 0.45;
			if (step > maxStep) step = maxStep;
			if (step < -maxStep) step = -maxStep;
			const inv = 1 / (g2 * 2 * e);
			x -= ax * inv * step;
			y -= ay * inv * step;
			z -= az * inv * step;
		}
		const gx = field(L, x + e, y, z) - field(L, x - e, y, z);
		const gy = field(L, x, y + e, z) - field(L, x, y - e, z);
		const gz = field(L, x, y, z + e) - field(L, x, y, z - e);
		const gl = Math.hypot(gx, gy, gz) || 1;
		P[v * 3] = x;
		P[v * 3 + 1] = y;
		P[v * 3 + 2] = z;
		Nn[v * 3] = gx / gl;
		Nn[v * 3 + 1] = gy / gl;
		Nn[v * 3 + 2] = gz / gl;
		sample(parts, x, y, z, smp);
		const col = skinColor(plan, smp, x, y, z, gy / gl, mask);
		C[v * 3] = col[0];
		C[v * 3 + 1] = col[1];
		C[v * 3 + 2] = col[2];
		// occlusion from the field itself: how quickly the body closes in along the normal (creases, chins, armpits)
		let occ = 0;
		for (let k = 1, wk = 1; k <= 4; k++, wk *= 0.5) {
			const h = aoH * k;
			const qx = x + (gx / gl) * h,
				qy = y + (gy / gl) * h,
				qz = z + (gz / gl) * h;
			occ += Math.max(0, h - field(listAt(qx, qy, qz), qx, qy, qz)) * wk;
		}
		PT[v * 4] = mask.v;
		PT[v * 4 + 1] = Math.max(0, Math.min(1, 1 - occ / (aoH * 1.5)));
		PT[v * 4 + 2] = pk;
		PT[v * 4 + 3] = plan.pattern.scale;
		PC[v * 4] = plan.palette.pattern[0];
		PC[v * 4 + 1] = plan.palette.pattern[1];
		PC[v * 4 + 2] = plan.palette.pattern[2];
		PC[v * 4 + 3] = (plan.pattern.seed % 997) / 997;
		// bone weights: soft-min over part distances, accumulated per bone, top 4
		boneW.fill(0);
		let dmin = 1e9;
		const ds: number[] = [];
		for (const p of addParts) {
			const d = partDist(p, x, y, z);
			ds.push(d);
			if (d < dmin) dmin = d;
		}
		addParts.forEach((p, i) => {
			const w = Math.exp(-(ds[i] - dmin) / blendS);
			if (w > 1e-3) boneW[p.bone] += w;
		});
		const order = Array.from(boneW.keys())
			.sort((a, b) => boneW[b] - boneW[a])
			.slice(0, 4);
		let sum = 0;
		for (const b of order) sum += boneW[b];
		order.forEach((b, i) => {
			SI[v * 4 + i] = b;
			SW[v * 4 + i] = sum > 0 ? boneW[b] / sum : i === 0 ? 1 : 0;
		});
	}
	const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
	return {
		positions: P,
		normals: Nn,
		colors: C,
		skinIndex: SI,
		skinWeight: SW,
		pat: PT,
		patColor: PC,
		index: new Uint32Array(tris),
		stats: { nx, ny, nz, cell, ms: Math.round(t1 - t0), components, verts: V, tris: tris.length / 3, compInfo, crumbs },
	};
}
