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
/** Light at the top of a cluster, deep at the bottom: the sun is low, so foliage reads as a lit volume. */
const SMALL = ['#fad566', '#f6c548', '#f4ad30', '#ee922a', '#e4751f', '#d9541e', '#c4411d']
const BACK = ['#c9772a', '#b85a1c', '#a8451a', '#93381a']

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
function taper(p0: P, p1: P, p2: P, p3: P, w0: number, w1: number, steps = 14, width?: (t: number) => number): string {
  const left: P[] = []
  const right: P[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const { p, n } = cubic(p0, p1, p2, p3, t)
    const w = (width ? width(t) : w0 + (w1 - w0) * Math.pow(t, 0.85)) / 2
    left.push([p[0] + n[0] * w, p[1] + n[1] * w])
    right.push([p[0] - n[0] * w, p[1] - n[1] * w])
  }
  const a = left.map((q) => `${f(q[0])},${f(q[1])}`).join(' L')
  const b = right.reverse().map((q) => `${f(q[0])},${f(q[1])}`).join(' L')
  return `M${a} L${b} Z`
}

export interface SmallLeaf {
  /** Leaves at the back are darker and drawn first. */
  back: boolean
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
  /** Leaves lying against the foot of the trunk. */
  foot: { x: number; y: number; r: number; s: number; c: string }[]
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
  const w1 = depth === 0 ? 2.6 : w * 0.5
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
  // the trunk and its flare are one outline (no seam where they meet); a shallow curve rounds the foot
  wood.push(taper(base, [308, 530], [290, 460], top, 62, 40, 30, (t) => 40 + 22 * (1 - t) + 84 * Math.pow(1 - t, 7)))
  wood.push('M228,605 Q300,628 372,605 Z')
  wood.push('M277.5,392 a19.5,19.5 0 1,0 39,0 a19.5,19.5 0 1,0 -39,0 Z') // closes the hairline where trunk and middle limb meet
  // three limbs, physical left → top → right; the reading side is decided by the page direction
  const defs: { p: [P, P, P, P]; side: number; hang: P }[] = [
    { p: [[304, 446], [214, 402], [134, 344], [112, 252]], side: -1, hang: [-4, -30] },
    // the middle limb is the trunk carrying on: same width, same heading, so the outline has no shoulder
    { p: [[297, 392], [305, 314], [326, 206], [312, 110]], side: 1, hang: [2, -30] },
    { p: [[294, 450], [386, 404], [468, 344], [490, 252]], side: 1, hang: [4, -30] },
  ]
  const limbs: Limb[] = defs.map((d, li) => {
    const c: Ctx = { rnd, wood, light, marks: [] }
    dress(c, d.p[0], d.p[1], d.p[2], d.p[3], li === 1 ? 40 : 32, d.side)
    const spot: P = [d.p[3][0] + d.hang[0], d.p[3][1] + d.hang[1]]
    // a few leaves gather round the big one, so it sits in foliage rather than beside it
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + rnd()
      const r = 56 + rnd() * 52
      c.marks.push({ x: spot[0] + Math.cos(a) * r, y: spot[1] + Math.sin(a) * r * 0.9 + 14, a })
    }
    const kept = c.marks.filter((m) => {
      const fromSpot = Math.hypot(m.x - spot[0], m.y - spot[1])
      const fromFork = Math.hypot(m.x - 300, m.y - 430)
      if (fromSpot < 52 || fromFork < 138 || m.y > 404 || m.x < 30 || m.x > 570 || m.y < 26) return false
      // foliage thins toward the trunk and gathers at the ends of the limb
      return fromSpot < 112 || rnd() < 0.4 + Math.min(0.36, fromFork / 560)
    })
    const ys = kept.map((m) => m.y)
    const y0 = Math.min(...ys)
    const y1 = Math.max(...ys)
    const leaves: SmallLeaf[] = kept
      .map((m, i) => {
        const back = rnd() < 0.34
        const h = (m.y - y0) / Math.max(1, y1 - y0) // 0 at the top of the cluster
        const pick = Math.min(SMALL.length - 1, Math.max(0, Math.round(h * (SMALL.length - 1) + (rnd() - 0.5) * 2.4)))
        return {
          back,
          x: m.x,
          y: m.y,
          r: (m.a * 180) / Math.PI + 90 + (rnd() - 0.5) * 90,
          s: back ? 0.44 + rnd() * 0.16 : 0.34 + rnd() * 0.2,
          c: back ? BACK[Math.floor(rnd() * BACK.length)] : SMALL[pick],
          i,
        }
      })
      .sort((p, q) => Number(q.back) - Number(p.back))
    return { kind: KINDS[li], spot, leaves }
  })
  const tones = ['#c9772a', '#d48a2e', '#b9601f', '#e0992f', '#a8451a']
  const foot = Array.from({ length: 11 }, (_, i) => {
    const u = i / 10
    return { x: 224 + u * 152 + (rnd() - 0.5) * 16, y: 607 + Math.sin(u * Math.PI) * 7 + (rnd() - 0.5) * 5, r: rnd() * 360, s: 0.2 + rnd() * 0.14, c: tones[Math.floor(rnd() * tones.length)] }
  })
  return { foot, wood, light, limbs }
}

/** A flock in the V the teacher points at: lead bird first, then pairs falling back on both sides, the far ones smaller and paler. */
export function flock(n = 7): { x: number; y: number; s: number; o: number; d: number }[] {
  const out = [{ x: 0, y: 0, s: 1, o: 0.92, d: 0 }]
  for (let i = 1; out.length < n; i++) {
    out.push({ x: -i * 40, y: -i * 19, s: 1 - i * 0.11, o: 0.9 - i * 0.1, d: i * 0.13 })
    if (out.length < n) out.push({ x: -i * 37, y: i * 21, s: 1 - i * 0.07, o: 0.92 - i * 0.07, d: i * 0.13 + 0.07 })
  }
  return out
}

/** The hill's top edge (y, in the ground's own 0–20 scale) at x (0–100): the same curve the ground is drawn with. */
export const GROUND = 'M0,8 Q22,1 50,3.5 T100,6'
function hillTop(x: number): number {
  const q = (a: number, b: number, c: number, t: number) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c
  const [x0, cx, x1, y0, cy, y1] = x <= 50 ? [0, 22, 50, 8, 1, 3.5] : [50, 78, 100, 3.5, 6, 6]
  let lo = 0
  let hi = 1
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2
    if (q(x0, cx, x1, mid) < x) lo = mid
    else hi = mid
  }
  return q(y0, cy, y1, (lo + hi) / 2)
}

/** Fallen leaves lying on the hill (percent of the ground band), as in every outdoor scene of the film. */
export function carpet(n = 44, seed = 771): { x: number; y: number; r: number; s: number; c: string }[] {
  const rnd = mulberry32(seed)
  const tones = ['#c9772a', '#b9601f', '#d48a2e', '#a8451a', '#c15a1e', '#8f3a18']
  return Array.from({ length: n }, () => {
    const x = 2 + rnd() * 96
    const top = (hillTop(x) / 20) * 100
    const depth = Math.pow(rnd(), 1.5) // most leaves lie near the crest, where the light is
    return { x, y: top + 6 + depth * (86 - top), r: rnd() * 360, s: 0.6 + depth * 0.9 + rnd() * 0.5, c: tones[Math.floor(rnd() * tones.length)] }
  })
}
