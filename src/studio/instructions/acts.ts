/**
 * The two example activities as acting: who stands where, what each hand does and where the thing is, for every
 * step and at every moment of a loop. It is written once, in the little stage's own floor plan (1200 wide, the
 * floor at about y = 790), and two directions film it: "the little stage" shows it whole, "hands first" moves
 * the camera in close. ("From above" needs its own staging: `above.ts`.)
 *
 * An act returns the actors (far ones first), what to draw between bodies and arms (the thing being held), and
 * the named points a direction hangs its signs on (heads for speech bubbles, the thing, the path of a move).
 *
 * Safe and calm by design: grown-ups kneel or sit at the child's height, things are offered low and with both
 * hands, the stick stays upright in the lap and never points at anybody.
 */
import { guide } from '@/cast/instruction-cast'
import { FACES, type Pose } from '../figure/pose'
import { lerp, type Painter, type Pt } from '../kit/core'
import { between, headOf, reach, seated, standing, type Actor } from './actors'
import { cushion, ease, stick, tumbler } from './kit'
import type { CardKey } from './types'

export type Act = { actors: Actor[]; things: () => void; at: Record<string, Pt> }

/** Facing screen right / screen left, turned a little toward us so the face still shows. */
export const RIGHT = 0.82
export const LEFT = -0.82
/** A grown-up down on both knees, at a child's height. */
export const kneeling = (x: number, y: number, over: Partial<Pose> = {}): Pose => standing(x, y, { rKneel: 1, lKneel: 1, ...over })

// ── A · here you are, thank you ───────────────────────────────────────────────
const SA = 1.5
const FLOOR = 788
const MUM = { x: 892, y: FLOOR + 4 }

export function hereYouAreAct(P: Painter, key: CardKey, t = 0): Act {
  const lia = guide('lia')
  const mum = guide('mother')
  if (key === 's1') {
    // Lia walks over with the cushion in both arms; a pale Lia shows where she came from; Mum waits with open hands
    const walk = (k: number): Partial<Pose> => ({ spin: RIGHT, lookY: -0.2, lean: 0.05, rfz: 0.3 * k, lfz: -0.3 * k, rfa: k < 0 ? 0.5 : 0, lfa: k > 0 ? 0.5 : 0, ...FACES.delight, open: 0.3 })
    const l: Actor = { s: lia, sc: SA, p: standing(500, FLOOR, walk(1)) }
    const g: Actor = { s: lia, sc: SA, ghost: 0.26, p: standing(262, FLOOR, walk(-1)) }
    const m: Actor = { s: mum, sc: SA, p: kneeling(MUM.x, MUM.y, { spin: LEFT, lookY: 0.2, rx: 0.2, ry: 0.5, rz: 0.7, lx: 0.2, ly: 0.56, lz: 0.6, rHand: 7, lHand: 7, ...FACES.delight, open: 0.35 }) }
    const carry = (a: Actor, alpha?: number) => {
      const c = { x: a.p.x + 62, y: a.p.y - 196 }
      reach(a.p, 'r', { x: c.x - 20, y: c.y + 62 }, 6)
      reach(a.p, 'l', { x: c.x + 30, y: c.y + 20 }, 6)
      return { c, draw: () => (alpha ? P.layer(() => cushion(P, c.x, c.y, 190), alpha) : cushion(P, c.x, c.y, 190)) }
    }
    const cg = carry(g, 0.26)
    const cl = carry(l)
    return {
      actors: [g, m, l],
      things: () => {
        cg.draw()
        cl.draw()
      },
      at: { lia: headOf(P, l), mum: headOf(P, m), thing: cl.c, from: { x: 350, y: FLOOR + 26 }, to: { x: 700, y: FLOOR + 26 }, hands: { x: 760, y: 600 } },
    }
  }
  if (key === 's2') {
    // Lia holds the cushion out with both hands, Mum's open hands come to it; then both ease back (the loop)
    const out = ease(t, 0.25, 1.0) * (1 - ease(t, 2.4, 2.95))
    const take = ease(t, 0.9, 1.5) * (1 - ease(t, 2.3, 2.8))
    const pop = ease(t, 0.95, 1.25) * (1 - ease(t, 2.35, 2.6))
    const l: Actor = { s: lia, sc: SA, p: standing(408, FLOOR, { spin: RIGHT, lookY: -0.3, lean: 0.03 + 0.1 * out, tip: 0.4 * out, ...FACES.delight, open: 0.3 + 0.4 * pop }) }
    const m: Actor = { s: mum, sc: SA, p: kneeling(MUM.x, MUM.y, { spin: LEFT, lookY: 0.2, lean: -0.05 * take, rx: 0.2, ry: 0.7, rz: 0.4, lx: 0.2, ly: 0.74, lz: 0.4, ...FACES.smile, cheek: 0.5 + 0.4 * take }) }
    const cx = lerp(530, 610, out)
    const cy = lerp(602, 566, out)
    reach(l.p, 'r', { x: cx - 76, y: cy + 54 }, 6)
    reach(l.p, 'l', { x: cx - 80, y: cy - 30 }, 6)
    reach(m.p, 'r', { x: cx + 100, y: cy + 56 }, 7, take)
    reach(m.p, 'l', { x: cx + 104, y: cy - 34 }, 7, take)
    return { actors: [m, l], things: () => cushion(P, cx, cy, 206, { rot: -0.06 * out }), at: { lia: headOf(P, l), mum: headOf(P, m), thing: { x: cx, y: cy }, pop: { x: pop, y: 0 } } }
  }
  if (key === 's3') {
    // the cushion is Mum's now; she holds it to her and says thank you; Lia is delighted
    const m: Actor = { s: mum, sc: SA, p: kneeling(MUM.x - 20, MUM.y, { spin: LEFT + 0.2, lookY: 0.2, tilt: -0.06, ...FACES.delight, open: 0.45 }) }
    const l: Actor = { s: lia, sc: SA, p: standing(408, FLOOR, { spin: RIGHT - 0.2, lookY: -0.3, rx: 0.5, ry: 0.5, lx: 0.5, ly: 0.46, rHand: 5, lHand: 5, ...FACES.laugh, tip: 0.3 }) }
    const cx = 760
    const cy = 596
    reach(m.p, 'r', { x: cx - 88, y: cy + 30 }, 6)
    reach(m.p, 'l', { x: cx + 60, y: cy + 58 }, 6)
    return { actors: [m, l], things: () => cushion(P, cx, cy, 214, { rot: 0.05 }), at: { lia: headOf(P, l), mum: headOf(P, m), thing: { x: cx, y: cy } } }
  }
  // s4: the other way round, with the cup: Mum offers, Lia takes with both hands and says thank you
  const m: Actor = { s: mum, sc: SA, p: kneeling(MUM.x, MUM.y, { spin: LEFT, lookY: 0.2, lean: -0.06, lx: 0.2, ly: 0.8, ...FACES.delight, open: 0.3 }) }
  const l: Actor = { s: lia, sc: SA, p: standing(420, FLOOR, { spin: RIGHT, lookY: -0.2, lean: 0.05, ...FACES.laugh }) }
  const cup = { x: 628, y: 656 }
  reach(m.p, 'r', { x: cup.x + 52, y: cup.y - 80 }, 6)
  reach(l.p, 'r', { x: cup.x - 78, y: cup.y - 50 }, 7)
  reach(l.p, 'l', { x: cup.x - 70, y: cup.y - 104 }, 7)
  return { actors: [m, l], things: () => tumbler(P, cup.x, cup.y, 166), at: { lia: headOf(P, l), mum: headOf(P, m), thing: { x: cup.x, y: cup.y - 80 } } }
}

// ── B · the talking stick ─────────────────────────────────────────────────────
const SB = 1.2
export type Who = 'mona' | 'sara' | 'jonah' | 'tom' | 'dad'
const SEATS: Record<Who, Pt> = { mona: { x: 232, y: 792 }, sara: { x: 470, y: 724 }, jonah: { x: 790, y: 724 }, tom: { x: 996, y: 796 }, dad: { x: 630, y: 1004 } }
const STICK = 176
/** Both hands low in front of the body, one above the other: how the talking stick is held. */
const HOLD: Partial<Pose> = { rB: 1, rBx: -0.1, rBy: 0.78, lB: 1, lBx: -0.1, lBy: 1.02, rHand: 6, lHand: 6 }
/** One hand cupped behind the ear: "I am listening". */
const EAR_R: Partial<Pose> = { rH: 1, rHx: 1.12, rHy: 0.1, rHand: 5, rB: 0 }
const EAR_L: Partial<Pose> = { lH: 1, lHx: 1.12, lHy: 0.1, lHand: 5, lB: 0 }

function circleOf(over: Partial<Record<Who, Partial<Pose>>> = {}): Record<Who, Actor> {
  return {
    mona: { s: guide('teacher'), sc: SB, p: seated(SEATS.mona.x, SEATS.mona.y, { spin: 0.7, ...over.mona }) },
    sara: { s: guide('sara'), sc: SB, p: seated(SEATS.sara.x, SEATS.sara.y, { spin: 0.2, ...over.sara }) },
    jonah: { s: guide('jonah'), sc: SB, p: seated(SEATS.jonah.x, SEATS.jonah.y, { spin: -0.25, ...over.jonah }) },
    tom: { s: guide('tom'), sc: SB, p: seated(SEATS.tom.x, SEATS.tom.y, { spin: -0.75, ...over.tom }) },
    // Dad closes the circle with his back to us, at the front
    dad: { s: guide('father'), sc: SB, shadow: 0, p: seated(SEATS.dad.x, SEATS.dad.y, { spin: Math.PI, ...over.dad }) },
  }
}
const heads = (P: Painter, c: Record<Who, Actor>) => ({ mona: headOf(P, c.mona), sara: headOf(P, c.sara), jonah: headOf(P, c.jonah), tom: headOf(P, c.tom) })
const order = (c: Record<Who, Actor>, dad: boolean) => (dad ? [c.sara, c.jonah, c.mona, c.tom, c.dad] : [c.sara, c.jonah, c.mona, c.tom])

export function talkingStickAct(P: Painter, key: CardKey, t = 0, dad = true): Act {
  if (key === 's1') {
    const c = circleOf({ mona: { ...FACES.delight, open: 0.3 }, sara: FACES.smile, jonah: { ...FACES.delight, open: 0.25 }, tom: { ...FACES.laugh } })
    return { actors: order(c, dad), things: () => {}, at: heads(P, c) }
  }
  if (key === 's2') {
    // Mona has the stick and speaks; the others turn to her, two with a hand behind the ear
    const c = circleOf({
      mona: { ...FACES.delight, open: 0.6, mWide: 0.6, ...HOLD },
      sara: { spin: 0.5, turn: -0.9, lookX: -0.6, tilt: -0.08, ...FACES.curious, smile: 0.5, ...EAR_R },
      jonah: { spin: -0.5, lookX: -0.5, tilt: -0.06, ...FACES.smile },
      tom: { lookX: -0.4, tilt: -0.05, ...FACES.curious, smile: 0.4, ...EAR_L },
    })
    const b = between(P, c.mona)
    return { actors: order(c, dad), things: () => stick(P, b.x, b.y - 30, STICK, { rot: -Math.PI / 2 + 0.05 }), at: { ...heads(P, c), stick: { x: b.x, y: b.y - 30 } } }
  }
  if (key === 's3') {
    // Mona holds the stick out, Sara takes it and draws it in
    const give = ease(t, 0.5, 1.4)
    const take = ease(t, 1.0, 1.7)
    const pull = ease(t, 1.9, 2.8)
    const c = circleOf({
      mona: { lean: 0.08 * give * (1 - pull), ...FACES.smile, ...HOLD },
      sara: { spin: lerp(0.2, -0.5, take * (1 - pull)), tilt: -0.05 * take, lean: -0.08 * take * (1 - pull), ...FACES.smile, cheek: 0.5 + 0.4 * pull },
      jonah: { spin: -0.5, lookX: -0.5, ...FACES.smile },
      tom: { lookX: -0.4, ...FACES.smile },
    })
    // where the stick rests in Mona's hands, where the two meet, where it rests in Sara's
    const a0 = between(P, c.mona)
    const a = { x: a0.x, y: a0.y - 30 }
    const b0 = between(P, { ...c.sara, p: { ...c.sara.p, spin: 0.2, lean: 0, ...HOLD } })
    const b = { x: b0.x, y: b0.y - 30 }
    const mid = { x: (a.x + b.x) / 2 + 6, y: Math.min(a.y, b.y) - 40 }
    const sx = lerp(lerp(a.x, mid.x, give), b.x, pull)
    const sy = lerp(lerp(a.y, mid.y, give), b.y, pull)
    const rot = -Math.PI / 2 + lerp(lerp(0.05, 0.34, give), 0, pull)
    const ux = Math.cos(rot)
    const uy = Math.sin(rot)
    // Mona's hands follow the stick's lower half until Sara has it; Sara's take the upper half, then hold it as Mona did
    reach(c.mona.p, 'l', { x: sx - ux * 46, y: sy - uy * 46 }, 6, give * (1 - pull))
    reach(c.mona.p, 'r', { x: sx - ux * 14, y: sy - uy * 14 }, 6, give * (1 - pull))
    if (pull > 0.5) Object.assign(c.mona.p, { rHand: 0, lHand: 0 })
    reach(c.sara.p, 'r', { x: sx + ux * 30, y: sy + uy * 30 }, 6, take)
    reach(c.sara.p, 'l', { x: sx + ux * 2, y: sy + uy * 2 }, 6, ease(t, 1.9, 2.5))
    return { actors: order(c, dad), things: () => stick(P, sx, sy, STICK, { rot }), at: { ...heads(P, c), stick: { x: sx, y: sy }, a, b, mid, k: { x: give, y: pull } } }
  }
  // s4: Sara has the stick and speaks: first what she heard, then her own
  const c = circleOf({
    mona: { lookX: 0.4, tilt: 0.05, ...FACES.smile, cheek: 0.7 },
    sara: { spin: 0.1, ...FACES.delight, open: 0.55, mWide: 0.6, ...HOLD },
    jonah: { spin: -0.6, lookX: -0.5, tilt: -0.05, ...FACES.curious, smile: 0.5, ...EAR_R },
    tom: { lookX: -0.4, ...FACES.smile },
  })
  const b = between(P, c.sara)
  return { actors: order(c, dad), things: () => stick(P, b.x, b.y - 30, STICK, { rot: -Math.PI / 2 }), at: { ...heads(P, c), stick: { x: b.x, y: b.y - 30 } } }
}
