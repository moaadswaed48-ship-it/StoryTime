import { mulberry32 } from '@/lib/seeded'
import type { Activity } from '@/store/useProfileStore'

/**
 * The reward tree is drawn in code so it can grow: one trunk, three limbs (one per activity),
 * each limb with its own twigs and its own cloud of small leaves that appears when the limb's big leaf is earned.
 * Everything is deterministic (seeded) so the tree is the same tree on every visit and every device.
 */
export const VIEW = { w: 600, h: 620 }
export const KINDS: Activity[] = ['read', 'watched', 'played']

/** Film leaf colours (the same family the falling leaves use). Each activity owns one. */
export const LEAF_TONE: Record<Activity, { a: string; b: string }> = {
  read: { a: '#f7c24a', b: '#e08a1c' },
  watched: { a: '#f08a2c', b: '#d9541e' },
  played: { a: '#e4582a', b: '#a8321a' },
}
const SMALL = ['#f2c14e', '#f4a72c', '#e2711d', '#d9541e', '#c8421f', '#eeb23a']

/** A maple leaf in a −50…50 box, stem down. Soft lobes: tips joined through shallow notches. */
export const MAPLE =
  'M0,-48 Q13,-34 11,-14 Q24,-28 44,-22 Q40,-6 27,2 Q38,8 36,24 Q20,27 4,18 L3,44 Q0,47 -3,44 L-4,18 Q-20,27 -36,24 Q-38,8 -27,2 Q-40,-6 -44,-22 Q-24,-28 -11,-14 Q-13,-34 0,-48 Z'
/** Its veins (stroke only). */
export const MAPLE_VEINS = 'M0,30 L0,-36 M0,12 L-33,-17 M0,12 L33,-17 M0,20 L-26,19 M0,20 L26,19'

type P = [number, number]
const dir = (a: number): P => [Math.cos(a), Math.sin(a)]
const f = (n: number) => n.toFixed(1)

function cubic(p0: P, p1: P, p2: P, p3: P, t: number): { p: P; n: P } {
  const u = 1 - t
  const x = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0]
  const y = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]
  const dx = 3 * u * u * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0])
  const dy = 3 * u * u * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1])
  const l = Math.hypot(dx, dy) || 1
  return { p: [x, y], n: [-dy / l, dx / l] }
}

/** A tapered limb as a closed outline (wide at the base, a rounded point at the tip). */
function taper(p0: P, p1: P, p2: P, p3: P, w0: number, w1: number, steps = 14): string {
  const left: P[] = []
  const right: P[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const { p, n } = cubic(p0, p1, p2, p3, t)
    const w = (w0 + (w1 - w0) * Math.pow(t, 0.85)) / 2
    left.push([p[0] + n[0] * w, p[1] + n[1] * w])
    right.push([p[0] - n[0] * w, p[1] - n[1] * w])
  }
  const a = left.map((q) => `${f(q[0])},${f(q[1])}`).join(' L')
  const b = right.reverse().map((q) => `${f(q[0])},${f(q[1])}`).join(' L')
  return `M${a} L${b} Z`
}

export interface SmallLeaf {
  x: number
  y: number
  r: number
  s: number
  c: string
  /** Order in which the leaf opens after its limb's big leaf lands. */
  i: number
}
export interface Limb {
  kind: Activity
  /** Where the big leaf hangs, in view-box units. */
  spot: P
  leaves: SmallLeaf[]
}
export interface TreeArt {
  wood: string[]
  /** Thin strokes on the sunny side of the wood. */
  light: string[]
  limbs: Limb[]
}

interface Ctx {
  rnd: () => number
  wood: string[]
  light: string[]
  marks: { x: number; y: number; a: number }[]
}

function grow(c: Ctx, x: number, y: number, ang: number, len: number, w: number, depth: number, side: number) {
  const { rnd } = c
  // limbs bend back toward the sky, like a real crown
  const up = -Math.PI / 2
  const bend = (up - ang) * (0.22 + rnd() * 0.16) + (rnd() - 0.5) * 0.2
  const p0: P = [x, y]
  const d0 = dir(ang)
  const d1 = dir(ang + bend)
  const p3: P = [x + d1[0] * len, y + d1[1] * len]
  const d2 = dir(ang + bend * 2)
  const p1: P = [x + d0[0] * len * 0.38, y + d0[1] * len * 0.38]
  const p2: P = [p3[0] - d2[0] * len * 0.34, p3[1] - d2[1] * len * 0.34]
  const w1 = depth === 0 ? 2.2 : w * 0.5
  c.wood.push(taper(p0, p1, p2, p3, w, w1))
  // leaf marks along the outer half and at the tip
  const marks = depth === 0 ? 3 : depth === 1 ? 2 : 1
  for (let i = 0; i < marks; i++) {
    const t = depth === 0 ? 0.45 + (i / marks) * 0.55 : 0.55 + rnd() * 0.4
    const { p, n } = cubic(p0, p1, p2, p3, Math.min(1, t))
    const off = (rnd() - 0.5) * 22
    c.marks.push({ x: p[0] + n[0] * off, y: p[1] + n[1] * off, a: ang })
  }
  if (depth === 0) return
  const kids = depth >= 2 ? 3 : 2
  for (let i = 0; i < kids; i++) {
    const t = 0.38 + (i / kids) * 0.5 + rnd() * 0.08
    const { p } = cubic(p0, p1, p2, p3, t)
    const s = (i % 2 === 0 ? 1 : -1) * side
    const a = ang + bend * 2 * t + s * (0.5 + rnd() * 0.45)
    grow(c, p[0], p[1], a, len * (0.5 + rnd() * 0.16), Math.max(3, w * (0.62 - t * 0.28)), depth - 1, -s)
  }
  // the limb carries on past its end
  grow(c, p3[0], p3[1], ang + bend * 2 + (rnd() - 0.5) * 0.3, len * 0.56, w1, depth - 1, -side)
}

/** Twigs and their leaf marks along one art-directed main limb. */
function dress(c: Ctx, p0: P, p1: P, p2: P, p3: P, w0: number, firstSide: number) {
  const { rnd } = c
  const w1 = 5
  c.wood.push(taper(p0, p1, p2, p3, w0, w1, 20))
  const ts = [0.26, 0.42, 0.58, 0.72, 0.86]
  ts.forEach((t, i) => {
    const { p, n } = cubic(p0, p1, p2, p3, t)
    const tang = Math.atan2(-n[0], n[1]) // the limb's heading here
    const s = (i % 2 === 0 ? 1 : -1) * firstSide
    const a = tang + s * (0.55 + rnd() * 0.35)
    const w = (w0 + (w1 - w0) * Math.pow(t, 0.85)) * 0.62
    grow(c, p[0], p[1], a, 96 - t * 44 + rnd() * 14, Math.max(4, w), t < 0.6 ? 2 : 1, -s)
  })
  // the last stretch: a fine tip, and leaf marks along the outer half of the limb itself
  for (const t of [0.5, 0.64, 0.78, 0.9, 1]) {
    const { p, n } = cubic(p0, p1, p2, p3, t)
    const off = (rnd() - 0.5) * 30
    c.marks.push({ x: p[0] + n[0] * off, y: p[1] + n[1] * off, a: Math.atan2(-n[0], n[1]) })
  }
}

export function buildTree(seed = 20241): TreeArt {
  const rnd = mulberry32(seed)
  const wood: string[] = []
  const light: string[] = []
  const base: P = [300, 606]
  const top: P = [297, 392]
  // trunk with a flare where it meets the ground
  wood.push(taper(base, [308, 530], [290, 460], top, 62, 40, 16))
  wood.push('M222,614 Q262,604 271,548 Q275,520 277,496 L325,496 Q327,520 331,548 Q340,604 380,614 Q340,620 300,618 Q260,620 222,614 Z')
  // three limbs, physical left → top → right; the reading side is decided by the page direction
  const defs: { p: [P, P, P, P]; side: number; hang: P }[] = [
    { p: [[304, 446], [214, 402], [128, 344], [100, 250]], side: -1, hang: [-8, -28] },
    { p: [[297, 392], [284, 304], [326, 206], [312, 110]], side: 1, hang: [2, -30] },
    { p: [[294, 450], [386, 404], [474, 344], [502, 250]], side: 1, hang: [8, -28] },
  ]
  const limbs: Limb[] = defs.map((d, li) => {
    const c: Ctx = { rnd, wood, light, marks: [] }
    dress(c, d.p[0], d.p[1], d.p[2], d.p[3], li === 1 ? 40 : 32, d.side)
    const spot: P = [d.p[3][0] + d.hang[0], d.p[3][1] + d.hang[1]]
    // a few leaves gather round the big one, so it sits in foliage rather than beside it
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + rnd()
      const r = 58 + rnd() * 22
      c.marks.push({ x: spot[0] + Math.cos(a) * r, y: spot[1] + Math.sin(a) * r * 0.9 + 14, a })
    }
    const leaves: SmallLeaf[] = c.marks
      .filter((m) => Math.hypot(m.x - spot[0], m.y - spot[1]) > 50 && m.y < 430 && m.x > 16 && m.x < 584 && m.y > 16)
      .map((m, i) => ({
        x: m.x,
        y: m.y,
        r: (m.a * 180) / Math.PI + 90 + (rnd() - 0.5) * 80,
        s: 0.28 + rnd() * 0.22,
        c: SMALL[Math.floor(rnd() * SMALL.length)],
        i,
      }))
    return { kind: KINDS[li], spot, leaves }
  })
  return { wood, light, limbs }
}

/** A flock in the V the teacher points at: lead bird first, then pairs falling back on both sides. */
export function flock(n = 9): { x: number; y: number; s: number; d: number }[] {
  const out = [{ x: 0, y: 0, s: 1, d: 0 }]
  for (let i = 1; out.length < n; i++) {
    out.push({ x: -i * 30, y: -i * 15, s: 1 - i * 0.045, d: i * 0.13 })
    if (out.length < n) out.push({ x: -i * 27, y: i * 17, s: 1 - i * 0.05, d: i * 0.13 + 0.07 })
  }
  return out
}
