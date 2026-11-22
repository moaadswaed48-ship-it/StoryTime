/**
 * Walking. A walk is one cycle of two steps laid over any pose, written so that a foot on the ground stays where
 * it is: while a foot carries the weight it moves back under the body exactly as fast as the body moves forward,
 * so if the scene moves the figure by `strideOf(...)` for every cycle, no foot slides.
 *
 * Three ways of walking are given (an everyday walk, an elder's slow walk on a stick, a toddler's waddle); a new
 * one is a new row of numbers. Everything is in the figure's own proportions, so one walk fits every sheet.
 */
import type { Sheet } from '@/cast/sheet'
import type { Painter, Pt } from '../kit/core'
import type { Pose } from './pose'
import { rigOf, type Rig } from './rig'

export type Gait = {
  /** Ground covered in one cycle (two steps), in leg lengths. */
  stride: number
  /** Share of the cycle each foot spends on the ground (above 0.5 = both feet down for a moment at each step). */
  duty: number
  /** How high the swinging foot is lifted, in leg lengths. */
  lift: number
  /** Side-to-side shift of the hips onto the carrying leg (half shoulder widths), and how far the body rocks with it (radians). */
  sway: number
  rock: number
  /** Counter-turn of hips against shoulders, radians. */
  twist: number
  /** Arm swing forward and back, in arm lengths; `out` holds the arms away from the body (a toddler's balance). */
  arms: number
  out: number
  /** Forward lean of the whole body, 0…1 as `Pose.pitch`. */
  pitch: number
  /** Feet apart: extra width of the stance, in leg lengths. */
  wide: number
  /** How much the heel leads at each landing and trails at each push-off, radians. */
  roll: number
  /** Up-and-down of the head with each step, as a share of what the hips do (below 1: the neck takes it up). */
  bounce: number
}
export const GAITS = {
  /** An everyday walk: unhurried, arms swinging. */
  walk: { stride: 0.92, duty: 0.6, lift: 0.1, sway: 0.1, rock: 0.012, twist: 0.3, arms: 0.2, out: 0, pitch: 0.05, wide: 0, roll: 0.5, bounce: 1 },
  /** A child's quick, light step. */
  trot: { stride: 0.98, duty: 0.56, lift: 0.14, sway: 0.1, rock: 0.02, twist: 0.36, arms: 0.3, out: 0.04, pitch: 0.08, wide: 0, roll: 0.55, bounce: 1.2 },
  /** An elder's slow walk: short careful steps, both feet down for longer, the body bent a little over a stick. */
  elder: { stride: 0.5, duty: 0.7, lift: 0.045, sway: 0.16, rock: 0.02, twist: 0.1, arms: 0.07, out: 0, pitch: 0.1, wide: 0.02, roll: 0.22, bounce: 0.6 },
  /** A toddler's waddle: feet wide, knees stiff, the whole body rocking from foot to foot, arms out for balance. */
  toddler: { stride: 0.56, duty: 0.6, lift: 0.1, sway: 0.42, rock: 0.11, twist: 0.12, arms: 0.1, out: 0.34, pitch: 0.02, wide: 0.14, roll: 0.16, bounce: 1.3 },
} satisfies Record<string, Gait>

const frac = (v: number) => v - Math.floor(v)
const smooth = (u: number) => u * u * (3 - 2 * u)

/** One foot at `u` (0…1 through its own cycle, 0 = it lands): how far ahead of the hips it is, how high, and how its heel is turned. */
function foot(u: number, g: Gait) {
  const a = (g.stride * g.duty) / 2
  if (u < g.duty) {
    const v = u / g.duty
    // on the ground: it lands on the heel, lies flat, then the heel peels off as the body passes over it
    const land = Math.max(0, 1 - v / 0.14)
    const push = Math.max(0, (v - 0.62) / 0.38)
    return { z: a - 2 * a * v, y: 0.02 * push * push * g.roll, a: -0.42 * g.roll * land + 1.05 * g.roll * push * push, down: 1 }
  }
  const v = (u - g.duty) / (1 - g.duty)
  // in the air: swung forward, lifted most a little before the middle, toes coming up to land on the heel
  return { z: -a + 2 * a * smooth(v), y: g.lift * Math.pow(Math.sin(Math.PI * Math.pow(v, 0.8)), 0.9) + 0.02 * g.roll * (1 - v), a: 1.05 * g.roll * (1 - v) * (1 - v) - 0.42 * g.roll * v * v, down: 0 }
}

/**
 * Lays a walk over a pose. `phase` counts cycles (it rises by 1 for every two steps; 0 = the right foot lands).
 * The pose keeps its place and its facing (`spin`): move it by `strideOf(...)` per cycle along the way it faces.
 * `amount` 0…1 fades the walk in and out (starting and stopping).
 */
export function walkPose(base: Pose, phase: number, g: Gait = GAITS.walk, amount = 1): Pose {
  const p = { ...base }
  const k = amount
  const r = foot(frac(phase), g)
  const l = foot(frac(phase + 0.5), g)
  const a = phase * Math.PI * 2
  p.rfz += r.z * k
  p.lfz += l.z * k
  p.rfy += r.y * k
  p.lfy += l.y * k
  p.rfa += r.a * k
  p.lfa += l.a * k
  p.rfx -= g.wide * k
  p.lfx += g.wide * k
  // the hips sink when both legs are stretched apart, and rise as the body passes over the carrying leg
  const reach = (g.stride * g.duty) / 2
  const drop = (1 - Math.sqrt(Math.max(0, 1 - reach * reach * 1.1))) / 0.42
  p.crouch += (0.02 + drop * (0.5 + 0.5 * Math.cos(a * 2))) * k
  // weight onto the carrying leg: the right carries around a quarter of the cycle, the left around three quarters
  const side = Math.sin(a + 0.35)
  p.hipx += -g.sway * side * k
  p.lean += g.rock * side * k
  p.tilt += -g.rock * 0.7 * side * k
  p.twist += -g.twist * Math.cos(a) * k
  p.pitch += g.pitch * k
  p.sq *= 1 + 0.012 * g.bounce * Math.cos(a * 2) * k
  // arms swing against the legs; the arm coming forward bends a little more
  const sw = Math.cos(a)
  p.lz += g.arms * sw * k
  p.rz += -g.arms * sw * k
  p.ly -= (0.05 + 0.1 * Math.max(0, sw)) * g.arms * 3 * k
  p.ry -= (0.05 + 0.1 * Math.max(0, -sw)) * g.arms * 3 * k
  p.lx += g.out * k
  p.rx += g.out * k
  p.ly -= g.out * 0.5 * k
  p.ry -= g.out * 0.5 * k
  p.swing += 0.22 * Math.sin(a * 2 + 0.6) * k
  return p
}

/** How far a figure travels in one cycle of this walk, in stage units: move it by this much for each whole `phase`. */
export function strideOf(P: Painter, sheet: Sheet, scale: number, g: Gait = GAITS.walk): number {
  const r = rigOf(sheet, P.style)
  return g.stride * (r.legU + r.legL) * scale
}

/**
 * A walking stick that is planted, not dragged: it goes forward with the left foot (the stick is in the right hand)
 * and stands still on the ground while that foot carries. Returns the pose with the right hand on the stick and
 * the place of its tip (hand this to `drawFigure` as `caneTip`).
 */
export function withCane(P: Painter, sheet: Sheet, pose: Pose, phase: number, g: Gait, scale: number, amount = 1): { pose: Pose; tip: Pt } {
  const r: Rig = rigOf(sheet, P.style)
  const legLen = (r.legU + r.legL) * scale
  const f = foot(frac(phase + 0.5), g)
  const sn = Math.sin(pose.spin)
  const cs = Math.cos(pose.spin)
  // the tip: beside the right foot, a little ahead of where the left foot is
  const ahead = (f.z * amount + 0.16) * legLen
  const beside = -(r.stance + r.shW * 0.5) * scale
  const tip = { x: pose.x + ahead * sn + beside * cs, y: pose.y + (1 - f.down) * -0.03 * legLen * amount }
  const len = (r.footH + (r.legU + r.legL) * 0.86) * scale
  // the hand rides above the tip, a little behind it, as high as the stick is long
  const hx = pose.x + (0.1 * legLen + (ahead - 0.1 * legLen) * 0.35) * sn + beside * 0.9 * cs
  const dx = hx - tip.x
  const hy = tip.y - Math.sqrt(Math.max(len * len * 0.5, len * len - dx * dx)) + r.hand * scale * 0.6
  return { pose: { ...pose, rW: 1, rWx: hx, rWy: hy, rWd: sn === 0 ? 0 : 0.02, rHand: 6 }, tip }
}
