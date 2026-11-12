/**
 * Shelf maths — pure functions, no DOM.
 *
 * The shelf is a row of real boxes (cover W × height H × thickness T) standing on a ledge with their
 * spines toward the viewer. A continuous position `u` (in "visible rank" units) says which book is at
 * the centre: that book slides forward and turns from 90° (spine) to OPEN_DEG (cover), and because
 * every book is given exactly the floor width its turned box needs, neighbours part to make room and
 * no two books ever intersect — at any `u`, so the whole thing can be scrubbed by a finger.
 */
import { clamp, lerp } from '@/lib/clamp'
import { hashString, mulberry32 } from '@/lib/seeded'
import type { ShelfBook } from '@/content/library'

export const OPEN_DEG = 15
export const DETAIL_DEG = -27
const RAD = Math.PI / 180

export const smooth = (t: number) => {
  const x = clamp(t, 0, 1)
  return x * x * (3 - 2 * x)
}
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp(t, 0, 1), 3)

/** Sizes of the scene, derived from the stage box. */
export interface Metrics {
  stageW: number
  stageH: number
  /** Height of the tallest book (px). Everything else scales from it. */
  S: number
  /** y of the ledge surface, from the top of the stage. */
  floorY: number
  persp: number
  /** y of the eye (perspective origin): a little above the books, so their top edges show. */
  eyeY: number
  /** Ledge: depth in front of the spines, depth behind them, total width, front lip height. */
  plankFront: number
  plankBack: number
  plankW: number
  lip: number
  /** Belly band ("coming soon"), measured from the foot of every book so the bands line up along the shelf. */
  bandB: number
  bandH: number
  gap: number
  /**
   * Books are laid out K× larger than they stand on the shelf and scaled down by 1/K. Browsers rasterise
   * layers inside a perspective scene at layout size, so this keeps the cover crisp when it is opened large.
   */
  K: number
  phone: boolean
}

export function computeMetrics(stageW: number, stageH: number, viewH = stageH / 0.6): Metrics {
  const phone = stageW < 640
  const S = Math.round(Math.min(stageH * 0.7, stageW * (phone ? 0.69 : 0.92), 470))
  const floorY = Math.round(stageH * 0.855)
  // Height of the detail slot (same numbers as library.css → .lib-detail-slot).
  const slotH = stageW >= 900 ? Math.min(viewH * 0.66, 600) : Math.min(viewH * 0.4, 330)
  return {
    K: Math.round(clamp(slotH / S, 1, 1.5) * 100) / 100,
    stageW,
    stageH,
    S,
    floorY,
    persp: phone ? 1250 : 1900,
    eyeY: Math.round(floorY - S * 1.15),
    plankFront: Math.round(S * 0.5),
    plankBack: 14,
    plankW: Math.round(Math.max(stageW * 1.5, S * 4.4)),
    lip: Math.max(14, Math.round(S * 0.05)),
    bandB: Math.round(S * 0.1),
    bandH: Math.round(S * 0.108),
    gap: 1,
    phone,
  }
}

/** One book's box. Seeded from its id, so the shelf looks hand-arranged but is the same on every device. */
export interface Geom {
  W: number
  H: number
  T: number
  /** How far the spine sits back from the front line of the row. */
  recess: number
  /** Entrance only: how crooked the book lands (deg) and how much extra air it lands with (px). */
  jitter: number
  air: number
  /** Entrance only: drop height (px) and tilt in the air (deg). */
  dropFrom: number
  dropTilt: number
}

const even = (v: number) => Math.max(2, Math.round(v / 2) * 2)

export function computeGeoms(books: ShelfBook[], m: Metrics): Geom[] {
  return books.map((b) => {
    const r = mulberry32(hashString(b.id) ^ 0x9e3779b9)
    const [r1, r2, r3, r4, r5, r6, r7] = [r(), r(), r(), r(), r(), r(), r()]
    const H = Math.round(m.S * (b.ready ? 1 : 0.9 + 0.085 * r1))
    const W = even(m.S * 0.753 * (b.ready ? 1 : 0.93 + 0.07 * r2))
    const T = even(m.S * (b.ready ? 0.134 : (m.phone ? 0.118 : 0.122) + 0.046 * r3))
    return {
      W,
      H,
      T,
      recess: b.ready ? 0 : Math.round(r4 * m.S * 0.02),
      jitter: (r5 - 0.5) * 13,
      air: 3 + r6 * 13,
      dropFrom: m.S * (0.42 + 0.3 * r7),
      dropTilt: (r5 > 0.5 ? 1 : -1) * (4 + r6 * 6),
    }
  })
}

/** Per-book values that change over time (tweened or eased by the view). */
export interface Live {
  /** Presence: 1 on the shelf, 0 filtered out (sunk, and taking no room). */
  p: number
  dropY: number
  tilt: number
  alpha: number
  /** Sideways nudge from a neighbour landing (px). */
  nudge: number
  hover: number
}
export const newLive = (): Live => ({ p: 1, dropY: 0, tilt: 0, alpha: 1, nudge: 0, hover: 0 })

export interface Pose {
  x: number
  y: number
  z: number
  /** Yaw in degrees (signed by reading direction). */
  ry: number
  rz: number
  o: number
  /** 0 on the shelf … 1 fully pulled out and turned. */
  f: number
}
export const newPose = (): Pose => ({ x: 0, y: 0, z: 0, ry: 0, rz: 0, o: 1, f: 0 })

export interface LayoutInput {
  geoms: Geom[]
  live: Live[]
  /** Centre of the shelf in rank units (see `ranks`). */
  u: number
  /** +1 left→right, −1 right→left. */
  dir: number
  gap: number
  /** 0 → nobody pulls out (during the landing), 1 → normal. */
  focusGain: number
  /** 1 → books stand loose and crooked (just landed), 0 → packed and straight. */
  spread: number
  /** Pixels the row travels per rank (for the rubber band past the ends). */
  step: number
}

/** Rank of each book among the visible ones: prefix sums of presence, so ranks glide while a filter animates. */
export function ranks(live: Live[], out: number[] = []): number[] {
  let acc = 0
  for (let i = 0; i < live.length; i++) {
    out[i] = acc
    acc += live[i].p
  }
  out.length = live.length
  return out
}

const _c: number[] = []
const _raw: number[] = []
const _deg: number[] = []
const _rank: number[] = []

export function layout(inp: LayoutInput, out: Pose[]): Pose[] {
  const { geoms, live, dir, gap, focusGain, spread } = inp
  const n = geoms.length
  ranks(live, _rank)
  let total = 0
  for (let i = 0; i < n; i++) total += live[i].p
  const maxU = Math.max(0, total - 1)
  const uc = clamp(inp.u, 0, maxU)

  let cursor = 0
  let wsum = 0
  let anchor = 0
  for (let i = 0; i < n; i++) {
    const g = geoms[i]
    const l = live[i]
    const raw = l.p * clamp(1 - Math.abs(_rank[i] - uc), 0, 1) * focusGain
    // Rotation lags the pull-out a little (power 1.4): two half-open neighbours then take about as much
    // floor as one open + one closed, so the row does not "breathe" while it is dragged.
    const turn = Math.pow(smooth(raw), 1.4)
    const deg = 90 - (90 - OPEN_DEG) * turn + g.jitter * spread * (1 - turn) - 5 * l.hover * turn
    const foot = Math.abs(Math.cos(deg * RAD)) * g.W + Math.abs(Math.sin(deg * RAD)) * g.T
    const allot = l.p * (foot + gap + g.air * spread + 22 * turn)
    _c[i] = cursor + allot / 2
    cursor += allot
    _raw[i] = raw
    _deg[i] = deg
    wsum += raw
    anchor += raw * _c[i]
  }
  anchor = wsum > 1e-4 ? anchor / wsum : cursor / 2
  if (focusGain < 1) anchor = lerp(cursor / 2, anchor, focusGain) // before anyone is pulled out, centre the whole row
  anchor += (inp.u - uc) * inp.step * 0.35 // rubber band past the ends

  for (let i = 0; i < n; i++) {
    const g = geoms[i]
    const l = live[i]
    const o = out[i]
    const f = smooth(_raw[i])
    const gone = 1 - l.p
    o.f = f
    o.x = dir * (_c[i] - anchor + l.nudge)
    o.y = l.dropY + gone * g.H * 0.12
    o.z = lerp(-(g.W / 2 + g.recess), g.W * 0.36 + g.T * 0.5, easeOut(_raw[i])) - gone * 34 + l.hover * (1 - f) * 16 + l.hover * f * 10
    o.ry = dir * _deg[i]
    o.rz = l.tilt
    o.o = l.alpha * clamp(l.p * 1.6 - 0.1, 0, 1)
  }
  return out
}

/** Average distance (px) the row travels for one step — used to turn a drag distance into rank units. */
export function stepSize(geoms: Geom[], live: Live[], gap: number): number {
  let sum = 0
  let k = 0
  for (let i = 0; i < geoms.length; i++) {
    if (live[i].p < 0.5) continue
    sum += geoms[i].T + gap
    k++
  }
  return k ? sum / k : 60
}

/** Index of the visible book whose rank is nearest to `u`. */
export function nearest(live: Live[], visible: boolean[], u: number): number {
  ranks(live, _rank)
  let best = -1
  let bd = Infinity
  for (let i = 0; i < live.length; i++) {
    if (!visible[i]) continue
    const d = Math.abs(_rank[i] - u)
    if (d < bd) {
      bd = d
      best = i
    }
  }
  return best
}

/* ── Colour helpers for foil and cloth ──────────────────────────────────────── */
const hex = (c: string) => {
  const v = c.replace('#', '')
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)]
}
export function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hex(a)
  const [br, bg, bb] = hex(b)
  const ch = (x: number, y: number) => Math.round(lerp(x, y, t)).toString(16).padStart(2, '0')
  return `#${ch(ar, br)}${ch(ag, bg)}${ch(ab, bb)}`
}
export function luminance(c: string): number {
  const [r, g, b] = hex(c).map((v) => v / 255)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
