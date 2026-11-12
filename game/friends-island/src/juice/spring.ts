// Damped springs and frame-rate-independent smoothing. Hand-written (no maath needed):
//   damp(x, target, lambda, dt)      exponential smoothing, x += (target-x)*(1-exp(-lambda*dt))
//   Spring / Spring3                 under-damped springs for recoil, sway, squash, FOV kicks
import { Vector3 } from 'three';

export const damp = (x: number, target: number, lambda: number, dt: number) => x + (target - x) * (1 - Math.exp(-lambda * dt));

export function dampV3(v: Vector3, target: Vector3, lambda: number, dt: number): Vector3 {
	const k = 1 - Math.exp(-lambda * dt);
	v.x += (target.x - v.x) * k;
	v.y += (target.y - v.y) * k;
	v.z += (target.z - v.z) * k;
	return v;
}

/** Shortest-path angle smoothing. */
export function dampAngle(a: number, b: number, lambda: number, dt: number) {
	let d = b - a;
	d = Math.atan2(Math.sin(d), Math.cos(d));
	return a + d * (1 - Math.exp(-lambda * dt));
}

/**
 * Scalar spring. `frequency` in Hz, `damping` ratio (1 = critical, <1 bouncy).
 * Kick it with `impulse(v)` (adds velocity) or move `target`.
 */
export class Spring {
	value: number;
	velocity = 0;
	target: number;
	constructor(
		value = 0,
		public frequency = 6,
		public damping = 0.5,
	) {
		this.value = value;
		this.target = value;
	}
	impulse(v: number) {
		this.velocity += v;
		return this;
	}
	update(dt: number): number {
		const w = 2 * Math.PI * this.frequency;
		// semi-implicit Euler, sub-stepped so stiff springs stay stable at low frame rates
		const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
		const h = dt / steps;
		for (let i = 0; i < steps; i++) {
			const a = -w * w * (this.value - this.target) - 2 * this.damping * w * this.velocity;
			this.velocity += a * h;
			this.value += this.velocity * h;
		}
		return this.value;
	}
	reset(v = this.target) {
		this.value = v;
		this.target = v;
		this.velocity = 0;
	}
}

export class Spring3 {
	readonly value = new Vector3();
	readonly velocity = new Vector3();
	readonly target = new Vector3();
	constructor(
		public frequency = 6,
		public damping = 0.5,
	) {}
	impulse(x: number, y: number, z: number) {
		this.velocity.x += x;
		this.velocity.y += y;
		this.velocity.z += z;
		return this;
	}
	update(dt: number): Vector3 {
		const w = 2 * Math.PI * this.frequency;
		const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
		const h = dt / steps;
		const v = this.value,
			vel = this.velocity,
			t = this.target;
		for (let i = 0; i < steps; i++) {
			vel.x += (-w * w * (v.x - t.x) - 2 * this.damping * w * vel.x) * h;
			vel.y += (-w * w * (v.y - t.y) - 2 * this.damping * w * vel.y) * h;
			vel.z += (-w * w * (v.z - t.z) - 2 * this.damping * w * vel.z) * h;
			v.x += vel.x * h;
			v.y += vel.y * h;
			v.z += vel.z * h;
		}
		return v;
	}
	reset() {
		this.value.copy(this.target);
		this.velocity.set(0, 0, 0);
	}
}

// ---- easing ----
export const ease = {
	linear: (t: number) => t,
	inQuad: (t: number) => t * t,
	outQuad: (t: number) => 1 - (1 - t) * (1 - t),
	inOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2),
	outCubic: (t: number) => 1 - (1 - t) ** 3,
	inOutCubic: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
	outBack: (t: number) => {
		const c1 = 1.70158,
			c3 = c1 + 1;
		return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
	},
	outElastic: (t: number) => (t === 0 || t === 1 ? t : 2 ** (-10 * t) * Math.sin(((t * 10 - 0.75) * 2 * Math.PI) / 3) + 1),
};

export const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);
/** 0..1 progress of t inside [a,b], eased. */
export const seg = (t: number, a: number, b: number, fn: (t: number) => number = ease.inOutQuad) => fn(clamp01((t - a) / (b - a)));
