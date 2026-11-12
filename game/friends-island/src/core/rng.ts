// Seeded RNG (mulberry32). Use `rng` for everything gameplay-visible so `?seed=` replays a run.

export class Rng {
	private s: number;
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
	/** Symmetric: -a..a */
	spread(a: number) {
		return (this.next() * 2 - 1) * a;
	}
	int(a: number, b: number) {
		return Math.floor(this.range(a, b + 1));
	}
	pick<T>(arr: readonly T[]): T {
		return arr[Math.floor(this.next() * arr.length)];
	}
	chance(p: number) {
		return this.next() < p;
	}
}

export let rng = new Rng(1);

/** Called once at boot. With an explicit ?seed=, Math.random also becomes seeded (separate stream). */
export function seedAll(seed: number, replaceMathRandom: boolean) {
	rng = new Rng(seed);
	if (replaceMathRandom) {
		const r = new Rng(seed ^ 0x9e3779b9);
		Math.random = () => r.next();
	}
}
