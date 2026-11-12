// Deterministic 2D value noise and fBm for the island.
export function hash2(x: number, y: number, s = 0) {
	let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0;
	h = Math.imul(h ^ (h >>> 13), 1274126177);
	return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export function noise2(x: number, y: number, s = 0) {
	const xi = Math.floor(x),
		yi = Math.floor(y);
	const fx = x - xi,
		fy = y - yi;
	const u = fx * fx * fx * (fx * (fx * 6 - 15) + 10),
		v = fy * fy * fy * (fy * (fy * 6 - 15) + 10);
	const a = hash2(xi, yi, s),
		b = hash2(xi + 1, yi, s),
		c = hash2(xi, yi + 1, s),
		d = hash2(xi + 1, yi + 1, s);
	return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

export function fbm(x: number, y: number, oct = 4, s = 0) {
	let a = 0.5,
		f = 1,
		sum = 0,
		norm = 0;
	for (let i = 0; i < oct; i++) {
		sum += a * noise2(x * f, y * f, s + i * 17);
		norm += a;
		a *= 0.5;
		f *= 2.03;
	}
	return sum / norm;
}

export class Rand {
	constructor(public s: number) {}
	next() {
		this.s = (this.s + 0x6d2b79f5) >>> 0;
		let t = this.s;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	}
	range(a: number, b: number) {
		return a + (b - a) * this.next();
	}
}
