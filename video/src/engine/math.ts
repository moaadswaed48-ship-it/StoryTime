// Small deterministic maths used by every shot. Nothing here reads a clock or Math.random.

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const invLerp = (a: number, b: number, v: number) => clamp((v - a) / (b - a))
/** 0 → 1 as `v` goes from a to b, eased. */
export const ramp = (v: number, a: number, b: number, ease: (x: number) => number = smooth) => ease(invLerp(a, b, v))
export const smooth = (x: number) => x * x * (3 - 2 * x)
export const smoother = (x: number) => x * x * x * (x * (x * 6 - 15) + 10)
export const easeOutCubic = (x: number) => 1 - (1 - x) ** 3
export const easeOutQuart = (x: number) => 1 - (1 - x) ** 4
export const easeOutExpo = (x: number) => (x >= 1 ? 1 : 1 - 2 ** (-10 * x))
export const easeInCubic = (x: number) => x ** 3
export const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2)
export const easeInOutSine = (x: number) => -(Math.cos(Math.PI * x) - 1) / 2
/** Overshoots a little and settles: for things that land. */
export const easeOutBack = (x: number, s = 1.4) => 1 + (s + 1) * (x - 1) ** 3 + s * (x - 1) ** 2
/** Damped spring from 0 to 1 (closed form), for flips and landings. */
export const spring = (x: number, freq = 2.2, damp = 5.5) => (x <= 0 ? 0 : 1 - Math.exp(-damp * x) * Math.cos(freq * Math.PI * 2 * x * 0.5))
/** A bump: 0 → 1 → 0 across [a, d], flat between b and c. */
export const window4 = (v: number, a: number, b: number, c: number, d: number) => Math.min(ramp(v, a, b), 1 - ramp(v, c, d))

export function mulberry32(seed: number) {
  let a = seed | 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
/** Stable hash of (i, k) → [0, 1). */
export function hash(i: number, k = 0) {
  let h = (Math.imul(i | 0, 374761393) + Math.imul(k | 0, 668265263)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

/** Smooth 1-D value noise in [-1, 1]. */
export function noise1(x: number, seed = 0) {
  const i = Math.floor(x)
  const f = x - i
  const a = hash(i, seed) * 2 - 1
  const b = hash(i + 1, seed) * 2 - 1
  return lerp(a, b, smoother(f))
}
/** Two octaves: organic drift for cameras and wind. */
export const drift = (t: number, seed = 0) => noise1(t, seed) * 0.67 + noise1(t * 2.13 + 7.1, seed + 17) * 0.33
