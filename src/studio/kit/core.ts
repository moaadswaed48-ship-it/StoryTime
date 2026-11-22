/**
 * The Studio's drawing kit: easing, key-framed tracks, path helpers and the Painter.
 *
 * Everything here is a pure function of time: no state is carried from one frame to the next, so any frame can be
 * drawn on its own (scrubbing, frame-by-frame capture to video). The default stage is 1920×1080 "units"; a Painter
 * can be made for any other page size (a book spread, a model sheet).
 *
 * The Painter knows the style profile (line, shading, texture, palette rules) and the scene's mood (light colour,
 * air). Drawings hand it plain shapes and sheet colours; it decides how they look.
 */
import { mulberry32 } from '@/lib/seeded'
import { luma, mixHex, mulHex, tone } from '../style/color'
import { GOUACHE, MOODS, tune, type Mood, type StyleProfile } from '../style/profile'

export { mixHex }
export const STAGE_W = 1920
export const STAGE_H = 1080

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k
/** 0 before a, 1 after b, linear between. */
export const ramp = (t: number, a: number, b: number) => clamp01((t - a) / (b - a))
export const TAU = Math.PI * 2

export const E = {
  lin: (u: number) => u,
  io: (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2),
  soft: (u: number) => 0.5 - 0.5 * Math.cos(Math.PI * u),
  in: (u: number) => u * u * u,
  out: (u: number) => 1 - Math.pow(1 - u, 3),
  snap: (u: number) => 1 - Math.pow(1 - u, 5),
  /** Overshoots the target a little and settles (ease-out-back). */
  back: (u: number) => 1 + 2.70158 * Math.pow(u - 1, 3) + 1.70158 * Math.pow(u - 1, 2),
  /** A bigger overshoot with one small counter-swing: for things that arrive with weight. */
  spring: (u: number) => 1 - Math.exp(-6.5 * u) * Math.cos(9.5 * u) * (1 - u),
} as const
export type Ease = keyof typeof E

/** One move: "starting at `t`, over `d` seconds, go to these values" — values hold before and after. */
export type Key<T> = [t: number, d: number, v: Partial<T>, ease?: Ease]

/** Builds a pure `time → values` function from a rest pose and a list of moves (pose-to-pose animation). */
export function track<T extends Record<string, number>>(base: T, keys: Key<T>[]): (t: number) => T {
  type Seg = { t: number; d: number; v: number; e: Ease }
  const props = new Map<string, Seg[]>()
  for (const [t, d, vals, e = 'io'] of keys) {
    for (const k in vals) {
      let list = props.get(k)
      if (!list) props.set(k, (list = []))
      list.push({ t, d, v: vals[k] as number, e })
    }
  }
  for (const list of props.values()) list.sort((a, b) => a.t - b.t)
  return (time: number) => {
    const out: Record<string, number> = { ...base }
    for (const [k, list] of props) {
      let v = base[k]
      for (let i = 0; i < list.length; i++) {
        const s = list[i]
        if (time < s.t) break
        const next = list[i + 1]
        const at = next && time >= next.t ? next.t : time
        const u = s.d <= 0 ? 1 : clamp01((at - s.t) / s.d)
        v += (s.v - v) * E[s.e](u)
      }
      out[k] = v
    }
    return out as T
  }
}

/** A low-gravity hop as closed-form curves: anticipation, a clean arc with hang-time, a soft landing. */
export function hopArc(t: number, t0: number, air: number, height: number, ant = 0.3) {
  let lift = 0
  let crouch = 0
  let sq = 1
  const a = (t - (t0 - ant)) / ant
  const u = (t - t0) / air
  if (a > 0 && u < 0) {
    crouch = 0.42 * E.io(clamp01(a))
    sq = 1 - 0.1 * E.io(clamp01(a))
  } else if (u >= 0 && u <= 1) {
    lift = 4 * height * u * (1 - u)
    crouch = 0.42 * Math.max(0, 1 - u / 0.08)
    // long stretch off the ground, round at the top, reaching for the floor again at the end
    sq = 1 + 0.13 * Math.pow(1 - u, 3) + 0.05 * Math.pow(u, 4)
  } else if (u > 1) {
    const s = t - (t0 + air)
    crouch = 0.3 * Math.exp(-s * 5) * (1 - Math.exp(-s * 40))
    sq = 1 - 0.13 * Math.exp(-s * 7) * Math.cos(s * 11)
  }
  return { lift, crouch, sq, air: u >= 0 && u <= 1 ? 1 : 0 }
}

// ── paths ─────────────────────────────────────────────────────────────────────
const hash01 = (i: number, seed: number) => {
  let h = Math.imul((i | 0) ^ Math.imul(seed | 0, 0x9e3779b1), 0x85ebca6b)
  h ^= h >>> 13
  h = Math.imul(h, 0xc2b2ae35)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}
/** Smooth noise along a line, −1…1. `period` > 0 makes it repeat, so a closed outline has no seam. */
function noise1(u: number, seed: number, period = 0): number {
  const i = Math.floor(u)
  const f = u - i
  const k = f * f * (3 - 2 * f)
  const a = period > 0 ? ((i % period) + period) % period : i
  const b = period > 0 ? (a + 1) % period : i + 1
  return (hash01(a, seed) * (1 - k) + hash01(b, seed) * k) * 2 - 1
}

const SEG = 9
const HAS_PATH = typeof Path2D !== 'undefined'
type Sub = { p: number[]; closed: boolean }
export type PenStats = { cx: number; cy: number; angle: number; long: number; len: number }

/**
 * A path that remembers its own points. It is built with the same calls as a canvas path (and keeps an exact
 * canvas path in `raw`), but because the points are known the Painter can redraw the outline by hand: slightly
 * uneven, the same unevenness in every frame (it is counted along the outline, not across the screen, so a shape
 * that moves or bends keeps its own line and a film does not boil).
 */
export class Pen {
  raw: Path2D
  subs: Sub[] = []
  private cur: number[] | null = null
  private sx = 0
  private sy = 0
  private cache: Map<string, Path2D> | null = null
  private st: PenStats | null = null

  constructor() {
    this.raw = HAS_PATH ? new Path2D() : (null as unknown as Path2D)
  }
  private begin(x: number, y: number) {
    this.cur = [x, y]
    this.subs.push({ p: this.cur, closed: false })
    this.sx = x
    this.sy = y
  }
  private put(x: number, y: number) {
    const c = this.cur
    if (!c) return this.begin(x, y)
    const n = c.length
    if (Math.abs(c[n - 2] - x) + Math.abs(c[n - 1] - y) < 1e-3) return
    c.push(x, y)
  }
  private last(): [number, number] {
    const c = this.cur
    return c ? [c[c.length - 2], c[c.length - 1]] : [this.sx, this.sy]
  }
  private seg(x: number, y: number) {
    if (!this.cur) return this.begin(x, y)
    const [x0, y0] = this.last()
    const n = Math.max(1, Math.ceil(Math.hypot(x - x0, y - y0) / (SEG * 2.4)))
    for (let i = 1; i <= n; i++) this.put(x0 + ((x - x0) * i) / n, y0 + ((y - y0) * i) / n)
  }
  moveTo(x: number, y: number) {
    this.raw?.moveTo(x, y)
    this.begin(x, y)
  }
  lineTo(x: number, y: number) {
    this.raw?.lineTo(x, y)
    if (!this.cur) this.begin(this.sx, this.sy)
    this.seg(x, y)
  }
  quadraticCurveTo(cx: number, cy: number, x: number, y: number) {
    this.raw?.quadraticCurveTo(cx, cy, x, y)
    if (!this.cur) this.begin(this.sx, this.sy)
    const [x0, y0] = this.last()
    const n = Math.max(4, Math.min(36, Math.ceil((Math.hypot(cx - x0, cy - y0) + Math.hypot(x - cx, y - cy)) / SEG)))
    for (let i = 1; i <= n; i++) {
      const u = i / n
      const v = 1 - u
      this.put(v * v * x0 + 2 * v * u * cx + u * u * x, v * v * y0 + 2 * v * u * cy + u * u * y)
    }
  }
  bezierCurveTo(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number) {
    this.raw?.bezierCurveTo(c1x, c1y, c2x, c2y, x, y)
    if (!this.cur) this.begin(this.sx, this.sy)
    const [x0, y0] = this.last()
    const n = Math.max(5, Math.min(44, Math.ceil((Math.hypot(c1x - x0, c1y - y0) + Math.hypot(c2x - c1x, c2y - c1y) + Math.hypot(x - c2x, y - c2y)) / SEG)))
    for (let i = 1; i <= n; i++) {
      const u = i / n
      const v = 1 - u
      this.put(v * v * v * x0 + 3 * v * v * u * c1x + 3 * v * u * u * c2x + u * u * u * x, v * v * v * y0 + 3 * v * v * u * c1y + 3 * v * u * u * c2y + u * u * u * y)
    }
  }
  ellipse(x: number, y: number, rx: number, ry: number, rot: number, a0: number, a1: number, ccw = false) {
    this.raw?.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot, a0, a1, ccw)
    let sweep: number
    if (!ccw) sweep = a1 - a0 >= TAU - 1e-9 ? TAU : (((a1 - a0) % TAU) + TAU) % TAU
    else sweep = a0 - a1 >= TAU - 1e-9 ? -TAU : -((((a0 - a1) % TAU) + TAU) % TAU)
    const r = Math.max(Math.abs(rx), Math.abs(ry))
    const n = Math.max(Math.ceil(Math.abs(sweep) / 0.42), Math.min(56, Math.ceil((r * Math.abs(sweep)) / SEG)))
    const cr = Math.cos(rot)
    const sr = Math.sin(rot)
    const full = Math.abs(Math.abs(sweep) - TAU) < 1e-9
    for (let i = 0; i <= (full ? n - 1 : n); i++) {
      const a = a0 + (sweep * i) / n
      const ex = Math.cos(a) * rx
      const ey = Math.sin(a) * ry
      const px = x + ex * cr - ey * sr
      const py = y + ex * sr + ey * cr
      if (i === 0 && this.cur) this.seg(px, py)
      else this.put(px, py)
    }
    if (full && this.cur) {
      // a whole circle is a closed outline of its own
      const s = this.subs[this.subs.length - 1]
      if (s.p === this.cur && s.p.length >= 6 && Math.abs(s.p[0] - (x + rx * Math.cos(a0) * cr - ry * Math.sin(a0) * sr)) < 1e-6) {
        s.closed = true
        this.cur = null
      }
    }
  }
  arc(x: number, y: number, r: number, a0: number, a1: number, ccw = false) {
    // (the exact path gets the same arc through ellipse)
    this.ellipse(x, y, r, r, 0, a0, a1, ccw)
  }
  rect(x: number, y: number, w: number, h: number) {
    this.moveTo(x, y)
    this.lineTo(x + w, y)
    this.lineTo(x + w, y + h)
    this.lineTo(x, y + h)
    this.closePath()
  }
  closePath() {
    this.raw?.closePath()
    const c = this.cur
    if (!c) return
    this.seg(c[0], c[1])
    const n = c.length
    if (n >= 4 && Math.abs(c[n - 2] - c[0]) + Math.abs(c[n - 1] - c[1]) < 1e-3) c.length = n - 2
    this.subs[this.subs.length - 1].closed = true
    this.sx = c[0]
    this.sy = c[1]
    this.cur = null
  }
  addPath(o: Pen) {
    this.raw?.addPath(o.raw)
    for (const s of o.subs) this.subs.push(s)
    this.cur = null
    this.cache = null
    this.st = null
  }

  /** Where the shape is and which way it runs (its middle, the angle of its long axis, how long it is compared with its width). */
  stats(): PenStats {
    if (this.st) return this.st
    let n = 0
    let sx = 0
    let sy = 0
    let len = 0
    for (const s of this.subs) {
      const p = s.p
      for (let i = 0; i < p.length; i += 2) {
        sx += p[i]
        sy += p[i + 1]
        n++
        if (i > 0) len += Math.hypot(p[i] - p[i - 2], p[i + 1] - p[i - 1])
      }
    }
    const cx = n ? sx / n : 0
    const cy = n ? sy / n : 0
    let xx = 0
    let yy = 0
    let xy = 0
    for (const s of this.subs) {
      const p = s.p
      for (let i = 0; i < p.length; i += 2) {
        const dx = p[i] - cx
        const dy = p[i + 1] - cy
        xx += dx * dx
        yy += dy * dy
        xy += dx * dy
      }
    }
    const angle = 0.5 * Math.atan2(2 * xy, xx - yy)
    const d = Math.sqrt((xx - yy) * (xx - yy) + 4 * xy * xy)
    const big = (xx + yy + d) / 2
    const small = Math.max(1e-6, (xx + yy - d) / 2)
    return (this.st = { cx, cy, angle, long: Math.sqrt(big / small), len })
  }

  /**
   * The outline as a hand would draw it: every point pushed a little off the true line, by an amount that is fixed
   * for each place along the outline. `amp` is the push, `wave` the distance between its swells (both in the
   * path's own units), `seed` picks a different hand (the line and the paint under it use two).
   */
  wob(amp: number, wave: number, seed: number): Path2D {
    if (!(amp > 0.02) || !HAS_PATH) return this.raw
    const key = `${Math.round(amp * 20)}|${Math.round(wave)}|${seed}`
    const hit = this.cache?.get(key)
    if (hit) return hit
    const out = new Path2D()
    for (const s of this.subs) {
      const p = s.p
      const n = p.length / 2
      if (n < 2) continue
      const closed = s.closed && n >= 3
      // length along the outline
      const acc = new Float64Array(n + 1)
      for (let i = 1; i <= n; i++) {
        const a = (i - 1) * 2
        const b = (i % n) * 2
        acc[i] = acc[i - 1] + (i === n && !closed ? 0 : Math.hypot(p[b] - p[a], p[b + 1] - p[a + 1]))
      }
      const total = acc[n]
      if (total < 1e-6) continue
      const a = Math.min(amp, total * 0.011)
      const period = closed ? Math.max(3, Math.round(total / wave)) : 0
      const D = new Float64Array(n * 2)
      const sharp = new Uint8Array(n)
      for (let i = 0; i < n; i++) {
        const ip = closed ? (i + n - 1) % n : Math.max(0, i - 1)
        const iq = closed ? (i + 1) % n : Math.min(n - 1, i + 1)
        const tx = p[iq * 2] - p[ip * 2]
        const ty = p[iq * 2 + 1] - p[ip * 2 + 1]
        const tl = Math.hypot(tx, ty) || 1
        const u = closed ? (acc[i] / total) * period : acc[i] / wave
        const k = a * (noise1(u, seed, period) * 0.72 + noise1(u * 2 + 31, seed + 7, period * 2) * 0.28)
        D[i * 2] = p[i * 2] - (ty / tl) * k
        D[i * 2 + 1] = p[i * 2 + 1] + (tx / tl) * k
        if (!closed && (i === 0 || i === n - 1)) sharp[i] = 1
        else {
          const ax = p[i * 2] - p[ip * 2]
          const ay = p[i * 2 + 1] - p[ip * 2 + 1]
          const bx = p[iq * 2] - p[i * 2]
          const by = p[iq * 2 + 1] - p[i * 2 + 1]
          const dot = ax * bx + ay * by
          const cr = ax * by - ay * bx
          if (Math.abs(Math.atan2(cr, dot)) > 0.66) sharp[i] = 1
        }
      }
      let first = 0
      if (closed) {
        first = -1
        for (let i = 0; i < n; i++) if (sharp[i]) { first = i; break }
      }
      if (closed && first < 0) {
        // no corner anywhere: start between two points and round every one of them
        out.moveTo((D[(n - 1) * 2] + D[0]) / 2, (D[(n - 1) * 2 + 1] + D[1]) / 2)
        for (let i = 0; i < n; i++) {
          const j = (i + 1) % n
          out.quadraticCurveTo(D[i * 2], D[i * 2 + 1], (D[i * 2] + D[j * 2]) / 2, (D[i * 2 + 1] + D[j * 2 + 1]) / 2)
        }
        out.closePath()
        continue
      }
      const count = closed ? n : n - 1
      out.moveTo(D[first * 2], D[first * 2 + 1])
      let reached = false
      for (let s2 = 1; s2 <= count; s2++) {
        const i = (first + s2) % n
        if (sharp[i]) {
          if (!reached) out.lineTo(D[i * 2], D[i * 2 + 1])
          reached = false
          continue
        }
        const j = (i + 1) % n
        if (sharp[j]) {
          out.quadraticCurveTo(D[i * 2], D[i * 2 + 1], D[j * 2], D[j * 2 + 1])
          reached = true
        } else {
          out.quadraticCurveTo(D[i * 2], D[i * 2 + 1], (D[i * 2] + D[j * 2]) / 2, (D[i * 2 + 1] + D[j * 2 + 1]) / 2)
          reached = false
        }
      }
      if (closed) out.closePath()
    }
    ;(this.cache ??= new Map()).set(key, out)
    return out
  }
}

export function circle(x: number, y: number, r: number): Pen {
  const p = new Pen()
  p.arc(x, y, r, 0, TAU)
  return p
}
export function ellipse(x: number, y: number, rx: number, ry: number, rot = 0): Pen {
  const p = new Pen()
  p.ellipse(x, y, rx, ry, rot, 0, TAU)
  return p
}
export function rrect(x: number, y: number, w: number, h: number, r: number): Pen {
  const p = new Pen()
  const k = Math.min(r, w / 2, h / 2)
  if (k < 0.5) {
    p.rect(x, y, w, h)
    return p
  }
  p.moveTo(x + k, y)
  p.lineTo(x + w - k, y)
  p.quadraticCurveTo(x + w, y, x + w, y + k)
  p.lineTo(x + w, y + h - k)
  p.quadraticCurveTo(x + w, y + h, x + w - k, y + h)
  p.lineTo(x + k, y + h)
  p.quadraticCurveTo(x, y + h, x, y + h - k)
  p.lineTo(x, y + k)
  p.quadraticCurveTo(x, y, x + k, y)
  p.closePath()
  return p
}
export function poly(pts: number[]): Pen {
  const p = new Pen()
  p.moveTo(pts[0], pts[1])
  for (let i = 2; i < pts.length; i += 2) p.lineTo(pts[i], pts[i + 1])
  p.closePath()
  return p
}
/** A closed soft shape through the given points (each point is a gentle corner). */
export function blob(pts: number[]): Pen {
  const p = new Pen()
  const n = pts.length / 2
  const mx = (i: number) => (pts[(i % n) * 2] + pts[((i + 1) % n) * 2]) / 2
  const my = (i: number) => (pts[(i % n) * 2 + 1] + pts[((i + 1) % n) * 2 + 1]) / 2
  p.moveTo(mx(n - 1), my(n - 1))
  for (let i = 0; i < n; i++) p.quadraticCurveTo(pts[i * 2], pts[i * 2 + 1], mx(i), my(i))
  p.closePath()
  return p
}

export type Pt = { x: number; y: number }

/** A smooth open curve through points (for strokes). */
export function curve(pts: number[]): Pen {
  const p = new Pen()
  p.moveTo(pts[0], pts[1])
  const n = pts.length / 2
  if (n === 2) p.lineTo(pts[2], pts[3])
  for (let i = 1; i < n - 1; i++) {
    const last = i === n - 2
    const ex = last ? pts[i * 2 + 2] : (pts[i * 2] + pts[i * 2 + 2]) / 2
    const ey = last ? pts[i * 2 + 3] : (pts[i * 2 + 1] + pts[i * 2 + 3]) / 2
    p.quadraticCurveTo(pts[i * 2], pts[i * 2 + 1], ex, ey)
  }
  return p
}
/** A closed smooth shape that passes THROUGH every point (Catmull-Rom): for outlines worked out point by point. */
export function through(pts: number[], tension = 0.5): Pen {
  const p = new Pen()
  const n = pts.length / 2
  const X = (i: number) => pts[(((i % n) + n) % n) * 2]
  const Y = (i: number) => pts[(((i % n) + n) % n) * 2 + 1]
  p.moveTo(X(0), Y(0))
  const k = tension / 3
  for (let i = 0; i < n; i++) p.bezierCurveTo(X(i) + (X(i + 1) - X(i - 1)) * k, Y(i) + (Y(i + 1) - Y(i - 1)) * k, X(i + 1) - (X(i + 2) - X(i)) * k, Y(i + 1) - (Y(i + 2) - Y(i)) * k, X(i + 1), Y(i + 1))
  p.closePath()
  return p
}

/** The same points, each pushed a little by a fixed seed: a hand-cut edge instead of a ruled one (never changes between frames). */
export function wobble(pts: number[], amp: number, seed: number): number[] {
  const r = seededList(seed, pts.length)
  return pts.map((v, i) => v + (r[i] - 0.5) * 2 * amp)
}

/** A rectangle cut by hand: corners rounded, edges very slightly bowed. */
export function cutRect(x: number, y: number, w: number, h: number, r = 6, seed = 1, amp = 1.6): Pen {
  const k = Math.min(r, w / 2, h / 2)
  const j = seededList(seed, 8).map((v) => (v - 0.5) * 2 * amp)
  const p = new Pen()
  p.moveTo(x + k, y + j[0])
  p.quadraticCurveTo(x + w / 2, y + j[1], x + w - k, y + j[2])
  p.quadraticCurveTo(x + w, y, x + w + j[3], y + k)
  p.quadraticCurveTo(x + w + j[4], y + h / 2, x + w + j[5], y + h - k)
  p.quadraticCurveTo(x + w, y + h, x + w - k, y + h + j[6])
  p.quadraticCurveTo(x + w / 2, y + h + j[7], x + k, y + h + j[0])
  p.quadraticCurveTo(x, y + h, x + j[1], y + h - k)
  p.quadraticCurveTo(x + j[2], y + h / 2, x + j[3], y + k)
  p.quadraticCurveTo(x, y, x + k, y + j[0])
  p.closePath()
  return p
}

/**
 * A tapered limb through one joint, as a single closed outline: width `w0` at `a`, `wj` at the joint, `w1` at `b`.
 * The joint is rounded (`round` 0…1 of each bone), so an arm reads as a soft sleeve, not two sticks.
 * `until` (0…1 along the limb) cuts it short (a short sleeve, a trouser leg that stops at the knee).
 * `bulge` (0…0.3) swells each bone a little past its middle, as muscle and cloth do: a limb is not a pipe.
 */
export function limbPath(a: Pt, j: Pt, b: Pt, w0: number, wj: number, w1: number, round = 0.5, until = 1, bulge = 0): Pen {
  const pts: Pt[] = []
  const ws: number[] = []
  const l1 = Math.hypot(j.x - a.x, j.y - a.y) || 1
  const l2 = Math.hypot(b.x - j.x, b.y - j.y) || 1
  const total = l1 + l2
  const stop = until * total
  const r1 = Math.min(l1 * round, l1 * 0.9)
  const r2 = Math.min(l2 * round, l2 * 0.9)
  const p1 = { x: j.x + ((a.x - j.x) * r1) / l1, y: j.y + ((a.y - j.y) * r1) / l1 }
  const p2 = { x: j.x + ((b.x - j.x) * r2) / l2, y: j.y + ((b.y - j.y) * r2) / l2 }
  const widthAt = (d: number) => {
    if (d <= l1) {
      const u = d / l1
      return (w0 + (wj - w0) * u) * (1 + bulge * Math.sin(Math.PI * Math.pow(u, 0.8)))
    }
    const u = (d - l1) / l2
    return (wj + (w1 - wj) * u) * (1 + bulge * 0.9 * Math.sin(Math.PI * Math.pow(u, 0.62)))
  }
  let dist = 0
  let done = false
  const push = (x: number, y: number) => {
    if (done) return
    const last = pts[pts.length - 1]
    if (last) {
      const seg = Math.hypot(x - last.x, y - last.y)
      if (seg < 1e-4) return
      if (dist + seg >= stop && until < 1) {
        const k = seg > 0 ? (stop - dist) / seg : 0
        pts.push({ x: last.x + (x - last.x) * k, y: last.y + (y - last.y) * k })
        ws.push(widthAt(stop))
        done = true
        return
      }
      dist += seg
    }
    pts.push({ x, y })
    ws.push(widthAt(Math.min(dist, total)))
  }
  push(a.x, a.y)
  for (const u of [0.25, 0.5, 0.75]) push(a.x + (p1.x - a.x) * u, a.y + (p1.y - a.y) * u)
  for (let i = 0; i <= 8; i++) {
    const u = i / 8
    const v = 1 - u
    push(v * v * p1.x + 2 * v * u * j.x + u * u * p2.x, v * v * p1.y + 2 * v * u * j.y + u * u * p2.y)
  }
  for (const u of [0.25, 0.5, 0.75]) push(p2.x + (b.x - p2.x) * u, p2.y + (b.y - p2.y) * u)
  push(b.x, b.y)
  const n = pts.length
  const out = new Pen()
  if (n < 2) {
    out.arc(a.x, a.y, Math.max(0.5, w0 / 2), 0, TAU)
    return out
  }
  const L: number[] = []
  const R: number[] = []
  for (let i = 0; i < n; i++) {
    const p = pts[Math.max(0, i - 1)]
    const q = pts[Math.min(n - 1, i + 1)]
    const d = Math.hypot(q.x - p.x, q.y - p.y) || 1
    const nx = -(q.y - p.y) / d
    const ny = (q.x - p.x) / d
    const h = ws[i] / 2
    L.push(pts[i].x + nx * h, pts[i].y + ny * h)
    R.push(pts[i].x - nx * h, pts[i].y - ny * h)
  }
  // at a sharp bend the inner edge would double back on itself and leave a loop: any point that goes backwards
  // along the limb is pulled onto the last good one, so the inside of an elbow is a clean corner
  for (const side of [L, R]) {
    let kx = side[0]
    let ky = side[1]
    for (let i = 1; i < n; i++) {
      const p = pts[Math.max(0, i - 1)]
      const q = pts[Math.min(n - 1, i + 1)]
      if ((side[i * 2] - kx) * (q.x - p.x) + (side[i * 2 + 1] - ky) * (q.y - p.y) <= 0) {
        side[i * 2] = kx
        side[i * 2 + 1] = ky
      } else {
        kx = side[i * 2]
        ky = side[i * 2 + 1]
      }
    }
  }
  out.moveTo(L[0], L[1])
  for (let i = 1; i < n; i++) out.lineTo(L[i * 2], L[i * 2 + 1])
  // round end at b (or a flat cut when the limb was stopped short), then back along the other side
  const e = pts[n - 1]
  const ea = Math.atan2(L[(n - 1) * 2 + 1] - e.y, L[(n - 1) * 2] - e.x)
  if (until >= 1) out.arc(e.x, e.y, ws[n - 1] / 2, ea, ea - Math.PI, true)
  for (let i = n - 1; i >= 0; i--) out.lineTo(R[i * 2], R[i * 2 + 1])
  const sa = Math.atan2(R[1] - a.y, R[0] - a.x)
  out.arc(a.x, a.y, ws[0] / 2, sa, sa - Math.PI, true)
  out.closePath()
  return out
}

// ── the painter ───────────────────────────────────────────────────────────────
export type Cam = { x: number; y: number; zoom: number }
export type ShapeOpts = {
  /** Contour weight as a multiple of the profile's (0 or false = none). */
  line?: number | false
  /** Form-shadow width as a multiple of the profile's (0 = none). */
  shade?: number
  /** Lit-edge strength as a multiple of the profile's (0 = none). */
  hi?: number
  /** A contour colour other than the one the profile derives. */
  ink?: string
  /** false = no paint texture (tiny things, eyes). */
  tex?: boolean
  /** Drawn inside the shape, over the fill and under the shadow (patterns, markings). */
  over?: () => void
  /** Hand wobble of the outline as a multiple of the profile's (0 = ruled). */
  wob?: number
}
/** A light that stands in the scene (a lamp, a candle, a lit window): things near it are lit by it and from its side. */
export type Lamp = { x: number; y: number; /** How far its light reaches, stage units. */ r: number; color: string; /** 0…1 strength. */ k: number; /** The floor under it (where shadows start from). */ gy?: number }

const LIT = new Map<string, string>()
const LAYERS: HTMLCanvasElement[] = []

export class Painter {
  ctx: CanvasRenderingContext2D
  /** Canvas pixels per stage unit (before camera zoom). */
  s = 1
  W: number
  H: number
  cam: Cam
  style: StyleProfile = GOUACHE
  mood: Mood = MOODS.day
  /** 0 near … 1 far: how much air lies between the viewer and what is being drawn. Below 0: the dark near plane. */
  depth = 0
  /** When set, everything is drawn as one flat colour (cast shadows, far silhouettes). */
  sil: string | null = null
  /** Stage units per local unit of whatever is being drawn (a figure drawn at half size sets 0.5). */
  unit = 1
  /** Character drawings per second (animation "on twos" at 24 frames a second). The camera ignores this. */
  holdFps = 12
  /** Lights standing in the scene, in world units. */
  lamps: Lamp[] = []
  /** How much of a standing light falls on what is being drawn (set by the Painter for each shape). */
  private lit = 0
  private litCol = '#ffd9a0'
  private k = 1
  private nest = 0

  constructor(ctx: CanvasRenderingContext2D, pxWidth: number, W = STAGE_W, H = STAGE_H) {
    this.ctx = ctx
    this.W = W
    this.H = H
    this.s = pxWidth / W
    this.cam = { x: W / 2, y: H / 2, zoom: 1 }
  }

  /** The time a character is drawn at: held so that it changes `holdFps` times a second. */
  held(t: number): number {
    return this.holdFps > 0 ? Math.floor(t * this.holdFps + 1e-6) / this.holdFps : t
  }

  /** Stage units → canvas, through the camera. */
  world() {
    this.k = this.s * this.cam.zoom
    this.ctx.setTransform(this.k, 0, 0, this.k, (this.W / 2 - this.cam.x * this.cam.zoom) * this.s, (this.H / 2 - this.cam.y * this.cam.zoom) * this.s)
  }
  /** Stage units → canvas, ignoring the camera (sky, overlays). */
  screen() {
    this.k = this.s
    this.ctx.setTransform(this.s, 0, 0, this.s, 0, 0)
  }
  /** A layer that moves less than the world as the camera moves (`f` 0 = fixed like the sky, 1 = the world; above 1 = nearer than the cast). */
  parallax(f: number) {
    const z = 1 + (this.cam.zoom - 1) * f
    this.k = this.s * z
    this.ctx.setTransform(this.k, 0, 0, this.k, (this.W / 2 - (this.W / 2 + (this.cam.x - this.W / 2) * f) * z) * this.s, (this.H / 2 - (this.H / 2 + (this.cam.y - this.H / 2) * f) * z) * this.s)
  }
  /** Where a world point lands on the screen, in stage units. */
  toScreen(x: number, y: number): [number, number] {
    return [(x - this.cam.x) * this.cam.zoom + this.W / 2, (y - this.cam.y) * this.cam.zoom + this.H / 2]
  }
  /** Unit vector from a thing toward the scene's main light (the mood's, or the profile's). */
  get light(): { x: number; y: number } {
    return this.mood.dir ?? this.style.light
  }

  /**
   * Works out how a shape is lit before it is drawn: how much of a standing light reaches it, and from which
   * side the light comes (the main light, bent toward a lamp when one is near).
   */
  private aim(path: Pen | null): { x: number; y: number } {
    const base = this.light
    if (!this.lamps.length || !path) {
      this.lit = 0
      return base
    }
    const s = path.stats()
    const m = this.ctx.getTransform()
    const px = m.a * s.cx + m.c * s.cy + m.e
    const py = m.b * s.cx + m.d * s.cy + m.f
    const z = this.s * this.cam.zoom
    let best = 0
    let bx = 0
    let by = 0
    for (const l of this.lamps) {
      const lx = ((l.x - this.cam.x) * this.cam.zoom + this.W / 2) * this.s
      const ly = ((l.y - this.cam.y) * this.cam.zoom + this.H / 2) * this.s
      const d = Math.hypot(lx - px, ly - py) / z
      let f = clamp01(1 - d / l.r)
      f = f * f * (3 - 2 * f) * l.k
      if (f > best) {
        best = f
        bx = lx - px
        by = ly - py
        this.litCol = l.color
      }
    }
    this.lit = Math.round(best * 10) / 10
    if (best <= 0.02) return base
    const n = Math.hypot(bx, by) || 1
    const w = Math.min(1, best * 2.2)
    const x = base.x * (1 - w) + (bx / n) * w
    const y = base.y * (1 - w) + (by / n) * w
    const k = Math.hypot(x, y) || 1
    return { x: x / k, y: y / k }
  }
  /** How strongly the standing lights reach a world point (0…1) and which one. */
  lampAt(x: number, y: number): { f: number; lamp: Lamp | null } {
    let f = 0
    let lamp: Lamp | null = null
    for (const l of this.lamps) {
      let k = clamp01(1 - Math.hypot(l.x - x, (l.gy ?? l.y) - y) / (l.r * 1.25))
      k = k * k * (3 - 2 * k) * l.k
      if (k > f) {
        f = k
        lamp = l
      }
    }
    return { f, lamp }
  }

  /** A sheet or prop colour as it looks here: palette rules, then the scene's light, then the air in between. */
  col(c: string): string {
    if (this.sil) return this.sil
    const d = Math.round(this.depth * 20)
    const key = `${this.style.id}|${this.mood.id}|${d}|${this.lit}${this.lit ? this.litCol : ''}|${c}`
    let out = LIT.get(key)
    if (!out) {
      const m = this.mood
      let base = tune(c, this.style)
      if (m.sat !== undefined && m.sat !== 1) base = tone(base, 0, m.sat)
      out = m.k > 0 ? mulHex(mixHex(base, m.light, m.k * 0.35), m.light, m.k) : base
      if (this.lit > 0) out = mixHex(out, mulHex(mixHex(base, this.litCol, 0.14), this.litCol, 0.3), this.lit)
      if (d > 0) out = mixHex(out, m.haze ?? this.style.palette.haze, (d / 20) * this.style.palette.hazeK)
      else if (d < 0) out = mulHex(out, m.shadow ?? this.style.shade.tint, Math.min(1, -d / 20) * 0.75)
      LIT.set(key, out)
    }
    return out
  }
  /** The contour colour that belongs to a fill. */
  ink(c: string): string {
    const L = this.style.line
    return mixHex(mulHex(this.col(c), L.ink, L.mix), L.ink, L.mix * 0.35 * (1 - Math.max(0, this.depth) * 0.7))
  }
  /** The form-shadow colour that belongs to a fill. */
  shadeOf(c: string): string {
    return mulHex(this.col(c), this.mood.shadow ?? this.style.shade.tint, Math.min(1, this.style.shade.depth * (this.mood.shadeDepth ?? 1)))
  }
  /** Contour half-width in local units, thinned with distance and (partly) with the size of the thing. */
  lineW(mult = 1): number {
    const L = this.style.line
    return (mult * L.weight * (1 - 0.45 * Math.max(0, this.depth))) / Math.pow(this.unit, 1 - L.scaling)
  }
  /** How far the hand strays from the true outline, in local units. */
  private wobAmp(mult = 1): number {
    return (mult * this.style.hand.wobble * (1 - 0.4 * Math.max(0, this.depth))) / Math.pow(this.unit, 0.5)
  }
  private wave(): number {
    return this.style.hand.wave / Math.pow(this.unit, 0.6)
  }

  /** Shift the next drawing by (dx, dy) local units along the screen axes. Follow with ctx.restore(). */
  private nudge(dx: number, dy: number) {
    const c = this.ctx
    c.save()
    const m = c.getTransform()
    const k = this.k * this.unit
    c.setTransform(m.a, m.b, m.c, m.d, m.e + dx * k, m.f + dy * k)
  }

  /**
   * The one way a solid thing is drawn. In order: the drawn contour (thick and thin, a little off the paint like a
   * print that is not quite in register), the paint, whatever sits on it, a pale half-tone and a darker core shadow
   * on the side away from the light, a lit edge (and a rim of coloured light at night or by a lamp), and last the
   * dry-brush texture, which runs the way the shape runs.
   */
  shape(path: Pen, color: string, o: ShapeOpts = {}) {
    const c = this.ctx
    if (this.sil) {
      c.fillStyle = this.sil
      c.fill(path.raw)
      return
    }
    const st = this.style
    const L = this.aim(path)
    const amp = this.wobAmp(o.wob ?? 1)
    const wave = this.wave()
    const body = path.wob(amp, wave, 23)
    const lw = o.line === false ? 0 : this.lineW(o.line ?? 1)
    if (lw > 0) {
      const edge = path.wob(amp * st.hand.line, wave * 0.8, 11)
      const rx = st.hand.register.x / Math.pow(this.unit, 0.5)
      const ry = st.hand.register.y / Math.pow(this.unit, 0.5)
      c.lineJoin = 'round'
      c.lineCap = 'round'
      c.strokeStyle = o.ink ? this.col(o.ink) : this.ink(color)
      c.lineWidth = lw * 2
      if (st.line.heavy > 0) {
        this.nudge(rx - L.x * lw * st.line.heavy, ry - L.y * lw * st.line.heavy)
        c.stroke(edge)
        c.restore()
      }
      this.nudge(rx, ry)
      c.stroke(edge)
      c.restore()
    }
    c.fillStyle = this.col(color)
    c.fill(body)
    const soft = this.mood.soft ?? 0
    const d = st.shade.model === 'crescent' ? (o.shade ?? 1) * st.shade.offset * (1 - 0.5 * Math.max(0, this.depth)) * (1 - 0.35 * soft) : 0
    const hi = d > 0 ? (o.hi ?? 1) * st.shade.hi : 0
    const tex = st.texture.speckle > 0 && o.tex !== false
    if (!o.over && d <= 0 && !tex) return
    c.save()
    c.clip(body)
    o.over?.()
    if (d > 0) {
      const hole = new Path2D()
      hole.rect(-1e5, -1e5, 2e5, 2e5)
      hole.addPath(path.wob(amp * st.hand.shade, wave * 1.6, 37))
      const dark = this.shadeOf(color)
      // inside the shape but outside a copy of it slid toward the light = the side turned away
      if (st.shade.half > 0) {
        this.nudge(L.x * d * st.shade.half, L.y * d * st.shade.half)
        c.globalAlpha = st.shade.halfDepth * (1 - 0.3 * soft)
        c.fillStyle = dark
        c.fill(hole, 'evenodd')
        c.restore()
      }
      this.nudge(L.x * d, L.y * d)
      c.globalAlpha = 1 - 0.45 * soft
      c.fillStyle = dark
      c.fill(hole, 'evenodd')
      c.restore()
      if (hi > 0) {
        this.nudge(-L.x * d * hi, -L.y * d * hi)
        c.fillStyle = mixHex(this.col(color), this.col(st.shade.light), st.shade.lift)
        c.fill(hole, 'evenodd')
        c.restore()
      }
      const rim = this.mood.rim
      if (rim && (o.hi ?? 1) > 0) {
        const k = rim.lampOnly ? this.lit : Math.max(rim.k, this.lit)
        if (k > 0.03) {
          this.nudge(-L.x * d * rim.w, -L.y * d * rim.w)
          c.globalAlpha = Math.min(1, k)
          c.fillStyle = mixHex(this.col(color), this.lit > 0.05 ? this.litCol : rim.color, 0.62)
          c.fill(hole, 'evenodd')
          c.restore()
        }
      }
    }
    if (tex) {
      // the paint itself: dry-brush streaks that belong to the shape, move with it and run along it
      const s = path.stats()
      const pat = brushPattern(c, s.long > 1.35 ? s.angle : -0.2, st.texture.follow)
      if (pat) {
        c.globalAlpha = st.texture.speckle * (1 - 0.5 * Math.max(0, this.depth)) * (0.3 + 0.7 * luma(c.fillStyle as string))
        c.fillStyle = pat
        c.fill(body)
      }
    }
    c.restore()
    c.globalAlpha = 1
  }
  /** Several overlapping pieces of one thing (a curl of hair, a cloud): one contour round the lot. */
  group(paths: Pen[], color: string, o: ShapeOpts = {}) {
    const c = this.ctx
    if (this.sil) {
      c.fillStyle = this.sil
      for (const p of paths) c.fill(p.raw)
      return
    }
    const lw = o.line === false ? 0 : this.lineW(o.line ?? 1)
    if (lw > 0) {
      const amp = this.wobAmp(o.wob ?? 1)
      const wave = this.wave()
      const L = this.aim(paths[0] ?? null)
      c.lineJoin = 'round'
      c.strokeStyle = o.ink ? this.col(o.ink) : this.ink(color)
      c.lineWidth = lw * 2
      const h = this.style.line.heavy
      if (h > 0) {
        this.nudge(-L.x * lw * h, -L.y * lw * h)
        for (const p of paths) c.stroke(p.wob(amp, wave, 23))
        c.restore()
      }
      for (const p of paths) c.stroke(p.wob(amp, wave, 23))
    }
    for (const p of paths) this.shape(p, color, { ...o, line: false })
  }
  /** A flat fill with no contour and no shadow (a detail lying on another shape). */
  flat(path: Pen, color: string, alpha = 1) {
    const c = this.ctx
    if (this.sil) {
      if (alpha > 0.6) {
        c.fillStyle = this.sil
        c.fill(path.raw)
      }
      return
    }
    this.aim(path)
    c.globalAlpha = alpha
    c.fillStyle = this.col(color)
    c.fill(path.wob(this.wobAmp(0.7), this.wave(), 23))
    c.globalAlpha = 1
  }
  /** A stroke in exactly this colour. */
  line(path: Pen, color: string, width: number, alpha = 1) {
    const c = this.ctx
    if (this.sil && alpha < 0.6) return
    if (!this.sil) this.aim(path)
    c.lineCap = 'round'
    c.lineJoin = 'round'
    c.lineWidth = width
    c.globalAlpha = alpha
    c.strokeStyle = this.col(color)
    c.stroke(this.sil ? path.raw : path.wob(this.wobAmp(0.8), this.wave(), 41))
    c.globalAlpha = 1
  }
  /** An inner drawn line (a fold, a seam, a strand) in the contour colour of `color`. Skipped in silhouettes. */
  detail(path: Pen, color: string, mult = 1) {
    if (this.sil) return
    const c = this.ctx
    this.aim(path)
    c.lineCap = 'round'
    c.lineJoin = 'round'
    c.lineWidth = Math.max(0.4, this.lineW(mult) * this.style.line.detail * 1.5)
    c.strokeStyle = this.ink(color)
    c.stroke(path.wob(this.wobAmp(1), this.wave(), 41))
  }
  /** Draw `fn` only inside `region`. */
  clip(region: Pen, fn: () => void) {
    const c = this.ctx
    c.save()
    c.clip(this.sil ? region.raw : region.wob(this.wobAmp(1), this.wave(), 23))
    fn()
    c.restore()
  }
  /** Draw `fn` as if `d` of air lay in front of it, then put the air back. */
  far(d: number, fn: () => void) {
    const old = this.depth
    this.depth = d
    fn()
    this.depth = old
  }
  /** Draw `fn` as the near plane: darker and heavier, so it frames the picture and pushes the cast back (`k` 0…1). */
  near(k: number, fn: () => void) {
    this.far(-k, fn)
  }
  /** Draw `fn` at local scale `sc` about (x, y); line weights and shadows are told. */
  at(x: number, y: number, sc: number, fn: () => void, flip = 1) {
    const c = this.ctx
    const old = this.unit
    c.save()
    c.translate(x, y)
    c.scale(sc * flip, sc)
    this.unit = old * sc
    fn()
    this.unit = old
    c.restore()
  }
  /** Draw `fn` on its own sheet, then lay that sheet over the picture (so overlapping parts do not double up). */
  layer(fn: () => void, alpha = 1, op: GlobalCompositeOperation = 'source-over', blur = 0) {
    const main = this.ctx
    const cv = (LAYERS[this.nest] ??= document.createElement('canvas'))
    if (cv.width !== main.canvas.width || cv.height !== main.canvas.height) {
      cv.width = main.canvas.width
      cv.height = main.canvas.height
    }
    const lc = cv.getContext('2d')!
    lc.setTransform(1, 0, 0, 1, 0, 0)
    lc.clearRect(0, 0, cv.width, cv.height)
    lc.setTransform(main.getTransform())
    this.ctx = lc
    this.nest++
    try {
      fn()
    } finally {
      this.nest--
      this.ctx = main
    }
    main.save()
    main.setTransform(1, 0, 0, 1, 0, 0)
    main.globalAlpha = alpha
    main.globalCompositeOperation = op
    if (blur > 0) main.filter = `blur(${(blur * this.s).toFixed(1)}px)`
    main.drawImage(cv, 0, 0)
    main.restore()
  }
  /**
   * The shadow a standing thing throws on the ground at (gx, gy): `fn` draws the thing with its feet at (0, 0);
   * here it is laid flat, slid away from the light and multiplied over whatever the ground is. The light decides
   * the rest: under the sun the shadow lies to one side; by a lamp it points away from the lamp and grows with
   * distance; under cloud there is only a soft dark patch at the feet.
   * `lift`: how far the thing is off the ground (stage units): the shadow slides out and shrinks a little.
   */
  castShadow(gx: number, gy: number, fn: () => void, lift = 0, len = 1) {
    const st = this.style.cast
    const m = this.mood
    const soft = m.soft ?? 0
    let ux = (this.light.x < 0 ? 1 : -1) * st.skew * len * (m.castLen ?? 1)
    let uy = -st.flat * len * (0.7 + 0.3 * (m.castLen ?? 1))
    let alpha = m.shadowAlpha ?? st.alpha
    let blur = m.castBlur ?? 0
    const { f, lamp } = this.lampAt(gx, gy)
    if (lamp && f > 0.04) {
      const dx = gx - lamp.x
      const dy = (gy - (lamp.gy ?? lamp.y)) * 2.4
      const n = Math.hypot(dx, dy) || 1
      const reach = st.skew * len * (0.7 + (1.5 * n) / lamp.r)
      const w = Math.min(1, f * 3)
      ux = ux * (1 - w) + (dx / n) * reach * w
      uy = uy * (1 - w) + (dy / n) * reach * 0.42 * w
      alpha *= 0.75 + 0.5 * f
      blur = Math.max(blur, 1.5)
    }
    if (soft > 0) {
      ux *= 1 - soft
      uy = uy * (1 - soft) - st.flat * 0.55 * soft
      blur = Math.max(blur, 9 * soft)
      alpha *= 1 - 0.3 * soft
    }
    this.layer(
      () => {
        const c = this.ctx
        const old = this.sil
        this.sil = m.shadow ?? st.tint
        c.save()
        const sh = 1 - Math.min(0.35, lift / 900)
        c.transform(sh, 0, -ux * sh, -uy * sh, gx + ux * lift, gy + uy * lift * 0.3)
        fn()
        c.restore()
        this.sil = old
      },
      alpha,
      'multiply',
      blur,
    )
  }
  /** A soft pool of shadow lying on the ground (under a table, a ball, a sitting cat). */
  groundShadow(x: number, y: number, rx: number, ry: number, alpha = 1) {
    const st = this.style.cast
    const c = this.ctx
    const soft = this.mood.soft ?? 0
    c.save()
    c.globalCompositeOperation = 'multiply'
    c.globalAlpha = (this.mood.shadowAlpha ?? st.alpha) * alpha * (1 - 0.25 * soft)
    c.fillStyle = this.mood.shadow ?? st.tint
    const { f, lamp } = this.lampAt(x, y)
    const dir = lamp && f > 0.04 ? Math.sign(x - lamp.x) || 1 : this.light.x < 0 ? 1 : -1
    if (soft > 0.3) c.filter = `blur(${(5 * soft * this.s).toFixed(1)}px)`
    c.fill(ellipse(x + rx * 0.16 * dir * (1 - soft), y, rx, ry).raw)
    c.restore()
  }
  /**
   * A pool of light lying on a wall or a floor: a flat warm shape in rings, brightest in the middle, cut to
   * `region` when one is given. It is paint, not a glow: three hard-edged steps.
   */
  pool(x: number, y: number, rx: number, ry: number, color: string, alpha = 0.5, region?: Pen) {
    if (this.sil) return
    const c = this.ctx
    c.save()
    if (region) c.clip(region.raw)
    for (const [k, a, seed] of [[1, 0.34, 3], [0.72, 0.4, 5], [0.44, 0.5, 9]] as const) {
      c.globalCompositeOperation = 'soft-light'
      c.globalAlpha = alpha * a * 1.6
      c.fillStyle = color
      const ring = ellipse(x, y, rx * k, ry * k).wob(Math.min(rx, ry) * 0.05, Math.min(rx, ry) * 0.5, seed)
      c.fill(ring)
      c.globalCompositeOperation = 'source-over'
      c.globalAlpha = alpha * a * 0.4
      c.fill(ring)
    }
    c.restore()
  }
  /** Dry-brush speckle inside `region`: short dabs of a lighter and a darker paint, fixed by `seed`. */
  speckle(region: Pen, color: string, seed: number, box: [number, number, number, number], density = 1, size = 1) {
    const k = this.style.texture.speckle
    if (this.sil || k <= 0) return
    const c = this.ctx
    const [x, y, w, h] = box
    const n = Math.min(900, Math.round(((w * h) / 5200) * density * k))
    const r = seededList(seed, n * 4)
    this.lit = 0
    const dark = this.shadeOf(color)
    const light = mixHex(this.col(color), this.col(this.style.shade.light), 0.34)
    c.save()
    c.clip(region.raw)
    c.lineCap = 'round'
    for (let i = 0; i < n; i++) {
      const px = x + r[i * 4] * w
      const py = y + r[i * 4 + 1] * h
      const len = (5 + r[i * 4 + 2] * 16) * size
      c.globalAlpha = 0.08 + 0.13 * r[i * 4 + 3]
      c.strokeStyle = r[i * 4 + 3] > 0.5 ? light : dark
      c.lineWidth = (1.6 + r[i * 4 + 2] * 2.4) * size
      c.beginPath()
      c.moveTo(px, py)
      c.lineTo(px + len, py - len * 0.12)
      c.stroke()
    }
    c.restore()
  }
}

let brushTile: HTMLCanvasElement | null = null
const PATTERNS = new WeakMap<CanvasRenderingContext2D, CanvasPattern>()
const TURN = typeof DOMMatrix !== 'undefined' ? new DOMMatrix() : ({} as DOMMatrix)
/**
 * A tile of dry-brush streaks (lighter and darker dabs, mostly along one direction), used inside every painted
 * shape. `angle` turns the streaks to run along the shape (`follow` 0…1 says how far the profile lets them turn).
 */
function brushPattern(c: CanvasRenderingContext2D, angle = -0.2, follow = 1): CanvasPattern | null {
  let pat = PATTERNS.get(c)
  if (!pat) {
    if (!brushTile) {
      const n = 320
      brushTile = document.createElement('canvas')
      brushTile.width = brushTile.height = n
      const g = brushTile.getContext('2d')!
      const r = mulberry32(9041)
      g.lineCap = 'round'
      for (let i = 0; i < 560; i++) {
        const x = r() * n
        const y = r() * n
        const len = 16 + r() * 54
        const a = -0.2 + (r() - 0.5) * 0.8
        const light = r() > 0.5
        g.strokeStyle = light ? `rgba(255,246,222,${0.05 + r() * 0.11})` : `rgba(70,40,90,${0.04 + r() * 0.085})`
        g.lineWidth = 1.5 + r() * 5
        // drawn nine times round the tile so streaks cross its edges and the tile repeats without a seam
        for (const ox of [-n, 0, n]) for (const oy of [-n, 0, n]) {
          g.beginPath()
          g.moveTo(x + ox, y + oy)
          g.lineTo(x + ox + Math.cos(a) * len, y + oy + Math.sin(a) * len)
          g.stroke()
        }
      }
    }
    pat = c.createPattern(brushTile, 'repeat') ?? undefined
    if (pat) PATTERNS.set(c, pat)
  }
  if (!pat) return null
  // the streaks in the tile lean by −0.2: turn them onto the shape's own direction, so they swing with a limb
  TURN.a = TURN.d = Math.cos((angle + 0.2) * follow)
  TURN.b = Math.sin((angle + 0.2) * follow)
  TURN.c = -TURN.b
  pat.setTransform(TURN)
  return pat
}

// ── paper ─────────────────────────────────────────────────────────────────────
let grainTile: HTMLCanvasElement | null = null
let mottleTile: HTMLCanvasElement | null = null
/**
 * The paper and the paint on it, laid over a finished frame: a fine tooth and a slow uneven wash.
 * Both are fixed (the same in every frame: it is the paper, not film noise) and both are set by the style profile.
 */
export function paperGrain(P: Painter) {
  const tx = P.style.texture
  const c = P.ctx
  if (!grainTile) {
    const n = 256
    grainTile = document.createElement('canvas')
    grainTile.width = grainTile.height = n
    const g = grainTile.getContext('2d')!
    const img = g.createImageData(n, n)
    const rnd = mulberry32(20261112)
    for (let i = 0; i < n * n; i++) {
      const v = rnd()
      const light = v > 0.5
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = light ? 255 : 0
      img.data[i * 4 + 3] = Math.pow(Math.abs(v - 0.5) * 2, 3) * (light ? 16 : 30)
    }
    g.putImageData(img, 0, 0)
  }
  if (!mottleTile) {
    // value noise, three octaves, on a small tile that is stretched: slow blotches, as a wash dries
    const n = 96
    mottleTile = document.createElement('canvas')
    mottleTile.width = mottleTile.height = n
    const g = mottleTile.getContext('2d')!
    const img = g.createImageData(n, n)
    const rnd = mulberry32(77)
    const grid = (m: number) => Array.from({ length: m * m }, () => rnd())
    const octs = [grid(4), grid(8), grid(16)]
    const sample = (o: number[], m: number, u: number, v: number) => {
      const x = u * m
      const y = v * m
      const x0 = Math.floor(x) % m
      const y0 = Math.floor(y) % m
      const x1 = (x0 + 1) % m
      const y1 = (y0 + 1) % m
      const fx = E.soft(x - Math.floor(x))
      const fy = E.soft(y - Math.floor(y))
      return lerp(lerp(o[y0 * m + x0], o[y0 * m + x1], fx), lerp(o[y1 * m + x0], o[y1 * m + x1], fx), fy)
    }
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        const v = 0.55 * sample(octs[0], 4, x / n, y / n) + 0.3 * sample(octs[1], 8, x / n, y / n) + 0.15 * sample(octs[2], 16, x / n, y / n)
        const i = (y * n + x) * 4
        const dark = v < 0.5
        img.data[i] = dark ? 96 : 255
        img.data[i + 1] = dark ? 70 : 246
        img.data[i + 2] = dark ? 110 : 214
        img.data[i + 3] = Math.pow(Math.abs(v - 0.5) * 2, 1.5) * (dark ? 46 : 34)
      }
    g.putImageData(img, 0, 0)
  }
  c.save()
  c.setTransform(1, 0, 0, 1, 0, 0)
  if (tx.mottle > 0) {
    c.globalAlpha = tx.mottle
    c.imageSmoothingEnabled = true
    c.imageSmoothingQuality = 'high'
    const size = 760 * P.s
    for (let y = 0; y < c.canvas.height; y += size) for (let x = 0; x < c.canvas.width; x += size) c.drawImage(mottleTile, x, y, size, size)
  }
  if (tx.grain > 0) {
    c.globalAlpha = tx.grain
    const pat = c.createPattern(grainTile, 'repeat')
    if (pat) {
      c.fillStyle = pat
      c.fillRect(0, 0, c.canvas.width, c.canvas.height)
    }
  }
  c.restore()
}

const TABLES = new Map<string, number[]>()
/** Seeded random numbers in a fixed table, so scattered things are the same on every run (made once, then kept). */
export function seededList(seed: number, n: number): number[] {
  const key = `${seed}:${n}`
  let list = TABLES.get(key)
  if (!list) {
    const r = mulberry32(seed)
    list = Array.from({ length: n }, () => r())
    TABLES.set(key, list)
  }
  return list
}
