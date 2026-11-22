/**
 * Acting helpers every scene shares: blinks, hops, laughter, walking, the smoothing of elbows, and the words of a
 * narrator's line cut into phrases. Carried from the old build's film kit and rewritten for the character builder
 * (any sheet, poses in the figure's own proportions); the Moon film's day-and-night lighting was left behind.
 */
import type { Sheet } from '@/cast/sheet'
import type { Pose } from '../figure/pose'
import { rigOf, solve } from '../figure/rig'
import type { StyleProfile } from '../style/profile'
import { Painter, hopArc, ramp } from './core'

/** Words on screen at one moment: how visible the line is, and each of its phrases (0…1), all from the time alone. */
export type Caption = { id: string; words: string[]; alpha: number; alphas: number[] }
/** One note of a score, in scene time. */
export type Note = { t: number; f: number; d: number; v: number; wave?: OscillatorType; to?: number; attack?: number }

// ── words ─────────────────────────────────────────────────────────────────────
/** A narrator's line (verbatim from the story), cut into phrases of the given word counts. */
export function cuePhrases(line: string, counts: number[]): string[] {
  const words = line.split(' ')
  const out: string[] = []
  let i = 0
  for (const c of counts) {
    out.push(words.slice(i, i + c).join(' '))
    i += c
  }
  if (i < words.length) out.push(words.slice(i).join(' '))
  return out
}

/** The phrases come in one after another at the given times and stay; `until` fades the whole line out. */
export function phraseCaption(id: string, phrases: string[], at: number[], t: number, until = Infinity): Caption | null {
  if (t < at[0] - 0.1 || t > until) return null
  const out = until === Infinity ? 1 : 1 - ramp(t, until - 0.35, until)
  return { id, words: phrases, alpha: ramp(t, at[0] - 0.1, at[0] + 0.2) * out, alphas: at.map((a) => ramp(t, a, a + 0.3)) }
}

// ── acting ────────────────────────────────────────────────────────────────────
/** 0 → open, 1 → shut: a quick blink at each of the given times. */
export const blinkAt = (times: number[], t: number) => {
  for (const b of times) if (t >= b && t < b + 0.17) return 1
  return 0
}

/**
 * Add hops to a pose: each is [take-off time, seconds in the air, height in body heights, anticipation].
 * `give` scales the crouch and squash that go with them (a grown-up bends far less than a child).
 */
export function addHops(p: Pose, t: number, hops: [number, number, number, number?][], give = 1) {
  for (const [t0, air, h, ant] of hops) {
    const a = hopArc(t, t0, air, h, ant ?? 0.3)
    p.lift += a.lift
    p.crouch = Math.min(1, p.crouch + a.crouch * give)
    p.sq *= 1 + (a.sq - 1) * give
  }
}

/** Shoulders shaking with laughter between t0 and t1 (multiply a pose's `sq` by this). */
export const laugh = (t: number, t0: number, t1: number, f = 23) => 1 + 0.03 * ramp(t, t0, t0 + 0.2) * (1 - ramp(t, t1 - 0.3, t1)) * Math.sin((t - t0) * f)

/**
 * Walking: lays one step cycle over a pose. `phase` counts steps (it rises by 1 for each stride), `dir` is +1
 * toward screen right or −1; `stride` is the reach of a step in leg lengths. The feet swap, the arms swing against
 * them, the body dips a little at each footfall.
 */
export function addWalk(p: Pose, phase: number, dir: number, stride = 0.26, amount = 1) {
  const a = phase * Math.PI * 2
  const s = Math.sin(a)
  const c = Math.cos(a)
  p.toe = dir * amount
  p.rfx += s * stride * dir * amount
  p.lfx += -s * stride * dir * amount
  p.rfy += Math.max(0, c) * 0.12 * amount
  p.lfy += Math.max(0, -c) * 0.12 * amount
  p.crouch += 0.05 * (0.5 - 0.5 * Math.cos(a * 2)) * amount
  p.rx += -s * 0.16 * dir * amount * -1
  p.lx += -s * 0.16 * dir * amount
  p.lean += dir * 0.04 * amount
  p.turn += dir * 0.45 * amount
  p.swing += s * 0.25 * amount
}

const NEAR = [-0.1, -0.05, 0, 0.05, 0.1]
/**
 * A pose at time t with each elbow bent the way the rig would choose averaged over a fifth of a second around t:
 * when a moving arm makes the choice switch sides, the elbow glides across instead of flipping.
 */
export function smoothBends(st: StyleProfile, sheet: Sheet, raw: (t: number) => Pose, t: number, scale = 1): Pose {
  const p = raw(t)
  const g = rigOf(sheet, st)
  const sum = [0, 0]
  for (const d of NEAR) solve(g, d === 0 ? p : raw(t + d), scale).choice.forEach((v, i) => (sum[i] += v / NEAR.length))
  p.rBend = sum[0]
  p.lBend = sum[1]
  return p
}

/** The world's left and right edge inside the frame (with a margin), for drawing only what can be seen. */
export function frameRange(P: Painter): [number, number] {
  const half = P.W / 2 / P.cam.zoom + 80
  return [P.cam.x - half, P.cam.x + half]
}
