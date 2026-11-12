/**
 * What every scene of the film is made with, beyond the puppets and the set: the shape of a scene, its words on
 * screen, blinks, the smoothing of elbows and knees, and the one routine that draws a world under the Moon's hard
 * lights (day and night either side of the line, with warm pools of lamp- or eye-light inside the night).
 */
import { moon } from '@/content/stories/moon'
import { Painter, STAGE_W, ellipse, hopArc, ramp, type Light } from './core'
import { drawPerson, skeleton, type PersonOpts, type Pose, type Who } from './people'
import { drawRover, roverEye, type Rover } from './wameed'
import { dayRegion, lineX, nightRegion, type Terminator } from './world'

/** Words on screen at one moment: how visible the line is, and each of its phrases (0…1), all from the time alone. */
export type Caption = { id: string; words: string[]; alpha: number; alphas: number[] }
/** One note of the score, in scene time. */
export type Note = { t: number; f: number; d: number; v: number; wave?: OscillatorType; to?: number; attack?: number }
export type Joints = Record<string, { x: number; y: number }>

/** A scene: a pure function of its own time (seconds from its first frame). */
export type SceneDef = {
  /** Scene number in the story (1…12). */
  n: number
  duration: number
  /** Where each shot starts (the first is 0). */
  shots: number[]
  render: (P: Painter, t: number) => void
  caption: (t: number) => Caption | null
  /** Where every joint is, for the pop check. */
  joints: (t: number) => Joints
  score: Note[]
  /** true = the next scene carries straight on from this one's last frame: a plain cut, no dip to black. */
  joins?: boolean
}

// ── words ─────────────────────────────────────────────────────────────────────
/** A scene's cue line (the narrator's line, verbatim from the story), cut into phrases of the given word counts. */
export function cuePhrases(n: number, counts: number[]): string[] {
  const words = moon.scenes[n - 1].cue.ar.split(' ')
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

// ── acting helpers ────────────────────────────────────────────────────────────
/** 0 → open, 1 → shut: a quick blink at each of the given times. */
export const blinkAt = (times: number[], t: number) => {
  for (const b of times) if (t >= b && t < b + 0.15) return 1 - Math.abs(((t - b) / 0.15) * 2 - 1) > 0.3 ? 1 : 0.5
  return 0
}

/**
 * Add low-gravity hops to a pose: each is [take-off time, seconds in the air, height, anticipation]. `give` scales
 * the crouch and squash that go with them (the teacher, twice the children's height, bends far less).
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
export const laugh = (t: number, t0: number, t1: number, f = 23) => 1 + 0.032 * ramp(t, t0, t0 + 0.2) * (1 - ramp(t, t1 - 0.3, t1)) * Math.sin((t - t0) * f)

const NEAR = [-0.1, -0.05, 0, 0.05, 0.1]
/**
 * Everyone's pose at time t, with each elbow and knee bent the way the rig would choose averaged over a fifth of a
 * second around t: when a moving arm makes the choice switch sides, the joint glides across instead of flipping.
 */
export function smoothBends<C extends Partial<Record<Who, Pose>>>(raw: (t: number) => C, t: number): C {
  const c = raw(t)
  const near = NEAR.map((d) => (d === 0 ? c : raw(t + d)))
  for (const who of ['sari', 'amir', 'layla'] as const) {
    const p = c[who]
    if (!p) continue
    const sum = [0, 0, 0, 0]
    for (const n of near) skeleton(who, n[who] as Pose).choice.forEach((v, i) => (sum[i] += v / near.length))
    p.bendA = sum[0]
    p.bendB = sum[1]
    p.kneeA = sum[2]
    p.kneeB = sum[3]
  }
  return c
}

/** Joint positions of a cast, for the pop check. */
export function jointsOf(c: Partial<Record<Who, Pose>> & { rover?: Rover }): Joints {
  const out: Joints = {}
  for (const who of ['sari', 'amir', 'layla'] as const) {
    const p = c[who]
    if (!p) continue
    const s = skeleton(who, p)
    for (const j of ['head', 'elA', 'elB', 'haA', 'haB', 'knA', 'knB', 'ftA', 'ftB'] as const) out[`${who}.${j}`] = s.world(s[j])
  }
  if (c.rover) {
    out.rover = { x: c.rover.x, y: c.rover.y - c.rover.lift }
    out['rover.eye'] = roverEye(c.rover)
  }
  return out
}

/** The long shadow of a person standing in the Sun (`len`: how many times their height it is). */
export function personShadow(P: Painter, who: Who, p: Pose, opts: PersonOpts = {}, len = 4.2) {
  P.shadow(p.x, p.y, () => drawPerson(P, who, { ...p, x: 0, y: 0, lift: 0, aw: 0, bw: 0 }, { basket: opts.basket, basketOn: opts.basketOn, helmet: opts.helmet }), p.lift, len)
}
export function roverShadow(P: Painter, r: Rover, len = 4.2) {
  P.shadow(r.x, r.y, () => drawRover(P, { ...r, x: 0, y: 0, lift: 0 }), r.lift, len)
}

/** The world's left and right edge inside the frame (with a margin), for drawing only what can be seen. */
export function frameRange(P: Painter): [number, number] {
  const half = STAGE_W / 2 / P.cam.zoom + 80
  return [P.cam.x - half, P.cam.x + half]
}

// ── light ─────────────────────────────────────────────────────────────────────
/** A warm pool of light inside the night: an ellipse and the light it gives. */
export type Pool = { x: number; y: number; rx: number; ry: number; light: 'lamp' | 'glow' }
/** "Is a thing standing at x (half-width w, from `top` down to `bottom`) touched by the light being drawn?" */
export type Ok = (x: number, w: number, top: number, bottom: number) => boolean

/**
 * Draws a world under the Moon's hard lights. `set` paints the ground and everything fixed, `figures` the cast,
 * `front` whatever lies nearest the camera; each is called once per light that can be seen (`P.light` is set).
 *  - no `line`: all daylight, or all night with `dark`
 *  - with a `line`: daylight to its right, night to its left, each clipped hard along it
 *  - `pools`: lamp- or eye-light inside the night
 */
export function litWorld(
  P: Painter,
  o: { x0: number; x1: number; line?: Terminator | null; dark?: boolean; pools?: Pool[]; set: () => void; shadows?: (ok: Ok) => void; figures: (ok: Ok) => void; front?: () => void },
) {
  const L = o.line ?? null
  const pools = (o.pools ?? []).filter((p) => p.rx > 1 && p.ry > 1)
  const inDay: Ok = L ? (x, w, a, b) => x + w > Math.min(lineX(L, a), lineX(L, b)) : () => !o.dark
  const inNight: Ok = L ? (x, w, a, b) => x - w < Math.max(lineX(L, a), lineX(L, b)) : () => !!o.dark
  const touches = (e: Pool, x: number, w: number, a: number, b: number) => {
    const dx = Math.max(x - w - e.x, 0, e.x - (x + w)) / e.rx
    const dy = Math.max(a - e.y, 0, e.y - b) / e.ry
    return dx * dx + dy * dy < 1
  }
  const within = (e: Pool, x: number, w: number, a: number, b: number) => {
    const dx = Math.max(Math.abs(x - w - e.x), Math.abs(x + w - e.x)) / e.rx
    const dy = Math.max(Math.abs(a - e.y), Math.abs(b - e.y)) / e.ry
    return dx * dx + dy * dy < 1
  }
  const pass = (light: Light, ok: Ok) => {
    P.light = light
    o.set()
    if (light === 'day') o.shadows?.(ok)
    o.figures(ok)
    o.front?.()
  }
  if (!o.dark && (!L || o.x1 > lineX(L, -600))) {
    if (L) P.clip(dayRegion(L), () => pass('day', inDay))
    else pass('day', inDay)
  }
  if (o.dark || (L && o.x0 < lineX(L, 2600))) {
    const night = () => {
      // plain night is not needed where a warm pool covers the whole figure
      pass('night', (x, w, a, b) => inNight(x, w, a, b) && !pools.some((p) => within(p, x, w, a, b)))
      for (const pool of pools) P.clip(ellipse(pool.x, pool.y, pool.rx, pool.ry), () => pass(pool.light, (x, w, a, b) => inNight(x, w, a, b) && touches(pool, x, w, a, b)))
    }
    if (L) P.clip(nightRegion(L), night)
    else night()
  }
  P.light = 'day'
  P.world()
}
