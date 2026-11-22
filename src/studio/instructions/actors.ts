/**
 * Putting the instruction cast into a picture with the character builder (through its public functions only):
 * a few stock poses, two-handed holding, and the drawing order that lets a thing sit between a body and its arms.
 */
import type { Sheet } from '@/cast/sheet'
import { drawFigure, handAt, headAt } from '../figure/draw'
import { FACES, rest, type Pose } from '../figure/pose'
import type { Painter, Pt } from '../kit/core'

export type Actor = { s: Sheet; p: Pose; sc: number; /** 0…1: drawn pale (where somebody was a moment ago). */ ghost?: number; /** Soft shadow on the floor: half-width as a fraction of the default (0 = none). */ shadow?: number }

/** Sitting cross-legged on the floor, hands in the lap, a smile. */
export const seated = (x: number, y: number, over: Partial<Pose> = {}): Pose => ({
  ...rest(x, y), sit: 1, seat: 0, rB: 1, rBx: 0.62, rBy: 1.0, lB: 1, lBx: 0.62, lBy: 1.0, ...FACES.smile, ...over, x, y,
})
/** Standing at ease. */
export const standing = (x: number, y: number, over: Partial<Pose> = {}): Pose => ({ ...rest(x, y), ...FACES.smile, ...over, x, y })

/** Send a hand to a point in the picture (it overrides wherever the pose had it). */
export function reach(p: Pose, side: 'r' | 'l', pt: Pt, hand = 6, k = 1): Pose {
  if (side === 'r') Object.assign(p, { rW: k, rWx: pt.x, rWy: pt.y, rHand: hand })
  else Object.assign(p, { lW: k, lWx: pt.x, lWy: pt.y, lHand: hand })
  return p
}

export const handOf = (P: Painter, a: Actor, side: 'r' | 'l'): Pt => handAt(P, a.s, a.p, side, a.sc)
export const headOf = (P: Painter, a: Actor): Pt => headAt(P, a.s, a.p, a.sc)
/** The point half-way between an actor's two hands (where a thing carried in both hands is). */
export const between = (P: Painter, a: Actor): Pt => {
  const r = handOf(P, a, 'r')
  const l = handOf(P, a, 'l')
  return { x: (r.x + l.x) / 2, y: (r.y + l.y) / 2 }
}

/**
 * Draw the actors: every body first (in the order given: far ones first), then `things` (whatever is held or
 * passed), then every pair of arms, so hands close over what they hold.
 */
export function play(P: Painter, actors: Actor[], things?: () => void) {
  const body = (a: Actor, pass: 'body' | 'arms') => {
    if (a.ghost !== undefined) {
      // a ghost is one pale picture of the whole figure, so its arms do not print twice over its body
      if (pass === 'body') P.layer(() => drawFigure(P, a.s, a.p, { scale: a.sc, cane: false }), a.ghost)
      return
    }
    drawFigure(P, a.s, a.p, { scale: a.sc, pass, cane: false })
  }
  for (const a of actors) {
    if (a.shadow !== 0 && a.ghost === undefined) {
      const w = (a.p.sit > 0.5 ? 150 : 74) * a.sc * (a.shadow ?? 1) * (a.s.stage === 'adult' || a.s.stage === 'elder' ? 1 : 0.62)
      P.groundShadow(a.p.x, a.p.y + 2, w, w * 0.16)
    }
    body(a, 'body')
  }
  things?.()
  for (const a of actors) body(a, 'arms')
}
