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
import { mixHex, mulHex } from '../style/color'
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
export function circle(x: number, y: number, r: number): Path2D {
  const p = new Path2D()
  p.arc(x, y, r, 0, TAU)
  return p
}
export function ellipse(x: number, y: number, rx: number, ry: number, rot = 0): Path2D {
  const p = new Path2D()
  p.ellipse(x, y, rx, ry, rot, 0, TAU)
  return p
}
export function rrect(x: number, y: number, w: number, h: number, r: number): Path2D {
  const p = new Path2D()
  const k = Math.min(r, w / 2, h / 2)
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
export function poly(pts: number[]): Path2D {
  const p = new Path2D()
  p.moveTo(pts[0], pts[1])
  for (let i = 2; i < pts.length; i += 2) p.lineTo(pts[i], pts[i + 1])
  p.closePath()
  return p
}
/** A closed soft shape through the given points (each point is a gentle corner). */
export function blob(pts: number[]): Path2D {
  const p = new Path2D()
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
export function curve(pts: number[]): Path2D {
  const p = new Path2D()
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

/** The same points, each pushed a little by a fixed seed: a hand-cut edge instead of a ruled one (never changes between frames). */
export function wobble(pts: number[], amp: number, seed: number): number[] {
  const r = seededList(seed, pts.length)
  return pts.map((v, i) => v + (r[i] - 0.5) * 2 * amp)
}

/** A rectangle cut by hand: corners rounded, edges very slightly bowed. */
export function cutRect(x: number, y: number, w: number, h: number, r = 6, seed = 1, amp = 1.6): Path2D {
  const k = Math.min(r, w / 2, h / 2)
  const j = seededList(seed, 8).map((v) => (v - 0.5) * 2 * amp)
  const p = new Path2D()
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
 */
export function limbPath(a: Pt, j: Pt, b: Pt, w0: number, wj: number, w1: number, round = 0.5, until = 1): Path2D {
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
  const widthAt = (d: number) => (d <= l1 ? w0 + (wj - w0) * (d / l1) : wj + (w1 - wj) * ((d - l1) / l2))
  let dist = 0
  let done = false
  const push = (x: number, y: number) => {
    if (done) return
    const last = pts[pts.length - 1]
    if (last) {
      const seg = Math.hypot(x - last.x, y - last.y)
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
  push((a.x + p1.x) / 2, (a.y + p1.y) / 2)
  for (let i = 0; i <= 6; i++) {
    const u = i / 6
    const v = 1 - u
    push(v * v * p1.x + 2 * v * u * j.x + u * u * p2.x, v * v * p1.y + 2 * v * u * j.y + u * u * p2.y)
  }
  push((p2.x + b.x) / 2, (p2.y + b.y) / 2)
  push(b.x, b.y)
  const n = pts.length
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
  const out = new Path2D()
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
  /** Drawn inside the shape, over the fill and under the shadow (patterns, markings). */
  over?: () => void
}

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
  /** 0 near … 1 far: how much air lies between the viewer and what is being drawn. */
  depth = 0
  /** When set, everything is drawn as one flat colour (cast shadows, far silhouettes). */
  sil: string | null = null
  /** Stage units per local unit of whatever is being drawn (a figure drawn at half size sets 0.5). */
  unit = 1
  /** Character drawings per second (animation "on twos" at 24 frames a second). The camera ignores this. */
  holdFps = 12
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
  /** A layer that moves less than the world as the camera moves (`f` 0 = fixed like the sky, 1 = the world). */
  parallax(f: number) {
    const z = 1 + (this.cam.zoom - 1) * f
    this.k = this.s * z
    this.ctx.setTransform(this.k, 0, 0, this.k, (this.W / 2 - (this.W / 2 + (this.cam.x - this.W / 2) * f) * z) * this.s, (this.H / 2 - (this.H / 2 + (this.cam.y - this.H / 2) * f) * z) * this.s)
  }
  /** Where a world point lands on the screen, in stage units. */
  toScreen(x: number, y: number): [number, number] {
    return [(x - this.cam.x) * this.cam.zoom + this.W / 2, (y - this.cam.y) * this.cam.zoom + this.H / 2]
  }

  /** A sheet or prop colour as it looks here: palette rules, then the scene's light, then the air in between. */
  col(c: string): string {
    if (this.sil) return this.sil
    const d = Math.round(this.depth * 20)
    const key = `${this.style.id}|${this.mood.id}|${d}|${c}`
    let out = LIT.get(key)
    if (!out) {
      out = tune(c, this.style)
      if (this.mood.k > 0) out = mulHex(mixHex(out, this.mood.light, this.mood.k * 0.35), this.mood.light, this.mood.k)
      if (d > 0) out = mixHex(out, this.mood.haze ?? this.style.palette.haze, (d / 20) * this.style.palette.hazeK)
      LIT.set(key, out)
    }
    return out
  }
  /** The contour colour that belongs to a fill. */
  ink(c: string): string {
    const L = this.style.line
    return mixHex(mulHex(this.col(c), L.ink, L.mix), L.ink, L.mix * 0.35 * (1 - this.depth * 0.7))
  }
  /** The form-shadow colour that belongs to a fill. */
  shadeOf(c: string): string {
    return mulHex(this.col(c), this.mood.shadow ?? this.style.shade.tint, this.style.shade.depth)
  }
  /** Contour half-width in local units, thinned with distance and (partly) with the size of the thing. */
  lineW(mult = 1): number {
    const L = this.style.line
    return (mult * L.weight * (1 - 0.45 * this.depth)) / Math.pow(this.unit, 1 - L.scaling)
  }

  /** Shift the next drawing by (dx, dy) local units along the screen axes. Follow with ctx.restore(). */
  private nudge(dx: number, dy: number) {
    const c = this.ctx
    c.save()
    const m = c.getTransform()
    const k = this.k * this.unit
    c.setTransform(m.a, m.b, m.c, m.d, m.e + dx * k, m.f + dy * k)
  }

  /** The one way a solid thing is drawn: contour, fill, whatever sits on it, form shadow, lit edge. */
  shape(path: Path2D, color: string, o: ShapeOpts = {}) {
    const c = this.ctx
    if (this.sil) {
      c.fillStyle = this.sil
      c.fill(path)
      return
    }
    const st = this.style
    const lw = o.line === false ? 0 : this.lineW(o.line ?? 1)
    if (lw > 0) {
      c.lineJoin = 'round'
      c.lineCap = 'round'
      c.strokeStyle = o.ink ? this.col(o.ink) : this.ink(color)
      c.lineWidth = lw * 2
      if (st.line.heavy > 0) {
        this.nudge(-st.light.x * lw * st.line.heavy, -st.light.y * lw * st.line.heavy)
        c.stroke(path)
        c.restore()
      }
      c.stroke(path)
    }
    c.fillStyle = this.col(color)
    c.fill(path)
    const d = st.shade.model === 'crescent' ? (o.shade ?? 1) * st.shade.offset * (1 - 0.5 * this.depth) : 0
    const hi = d > 0 ? (o.hi ?? 1) * st.shade.hi : 0
    if (!o.over && d <= 0) return
    c.save()
    c.clip(path)
    o.over?.()
    if (d > 0) {
      const hole = new Path2D()
      hole.rect(-1e5, -1e5, 2e5, 2e5)
      hole.addPath(path)
      // inside the shape but outside a copy of it slid toward the light = the side turned away
      this.nudge(st.light.x * d, st.light.y * d)
      c.fillStyle = this.shadeOf(color)
      c.fill(hole, 'evenodd')
      c.restore()
      if (hi > 0) {
        this.nudge(-st.light.x * d * hi, -st.light.y * d * hi)
        c.fillStyle = mixHex(this.col(color), this.col(st.shade.light), st.shade.lift)
        c.fill(hole, 'evenodd')
        c.restore()
      }
    }
    c.restore()
  }
  /** Several overlapping pieces of one thing (a curl of hair, a cloud): one contour round the lot. */
  group(paths: Path2D[], color: string, o: ShapeOpts = {}) {
    const c = this.ctx
    if (this.sil) {
      c.fillStyle = this.sil
      for (const p of paths) c.fill(p)
      return
    }
    const lw = o.line === false ? 0 : this.lineW(o.line ?? 1)
    if (lw > 0) {
      c.lineJoin = 'round'
      c.strokeStyle = o.ink ? this.col(o.ink) : this.ink(color)
      c.lineWidth = lw * 2
      const h = this.style.line.heavy
      if (h > 0) {
        this.nudge(-this.style.light.x * lw * h, -this.style.light.y * lw * h)
        for (const p of paths) c.stroke(p)
        c.restore()
      }
      for (const p of paths) c.stroke(p)
    }
    for (const p of paths) this.shape(p, color, { ...o, line: false })
  }
  /** A flat fill with no contour and no shadow (a detail lying on another shape). */
  flat(path: Path2D, color: string, alpha = 1) {
    const c = this.ctx
    if (this.sil) {
      if (alpha > 0.6) {
        c.fillStyle = this.sil
        c.fill(path)
      }
      return
    }
    c.globalAlpha = alpha
    c.fillStyle = this.col(color)
    c.fill(path)
    c.globalAlpha = 1
  }
  /** A stroke in exactly this colour. */
  line(path: Path2D, color: string, width: number, alpha = 1) {
    const c = this.ctx
    if (this.sil && alpha < 0.6) return
    c.lineCap = 'round'
    c.lineJoin = 'round'
    c.lineWidth = width
    c.globalAlpha = alpha
    c.strokeStyle = this.col(color)
    c.stroke(path)
    c.globalAlpha = 1
  }
  /** An inner drawn line (a fold, a seam, a strand) in the contour colour of `color`. Skipped in silhouettes. */
  detail(path: Path2D, color: string, mult = 1) {
    if (this.sil) return
    const c = this.ctx
    c.lineCap = 'round'
    c.lineJoin = 'round'
    c.lineWidth = Math.max(0.4, this.lineW(mult) * this.style.line.detail * 1.5)
    c.strokeStyle = this.ink(color)
    c.stroke(path)
  }
  /** Draw `fn` only inside `region`. */
  clip(region: Path2D, fn: () => void) {
    const c = this.ctx
    c.save()
    c.clip(region)
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
  layer(fn: () => void, alpha = 1, op: GlobalCompositeOperation = 'source-over') {
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
    main.drawImage(cv, 0, 0)
    main.restore()
  }
  /**
   * The shadow a standing thing throws on the ground at (gx, gy): `fn` draws the thing with its feet at (0, 0);
   * here it is laid flat, slid away from the light and multiplied over whatever the ground is.
   * `lift`: how far the thing is off the ground (stage units): the shadow slides out and shrinks a little.
   */
  castShadow(gx: number, gy: number, fn: () => void, lift = 0, len = 1) {
    const st = this.style.cast
    const dir = this.style.light.x < 0 ? 1 : -1
    this.layer(
      () => {
        const c = this.ctx
        const old = this.sil
        this.sil = mixHex(this.mood.shadow ?? st.tint, '#ffffff', 0)
        c.save()
        const sh = 1 - Math.min(0.35, lift / 900)
        c.transform(sh, 0, -dir * st.skew * len * sh, st.flat * len * sh, gx + dir * lift * st.skew, gy - lift * 0.04)
        fn()
        c.restore()
        this.sil = old
      },
      this.mood.shadowAlpha ?? st.alpha,
      'multiply',
    )
  }
  /** A soft pool of shadow lying on the ground (under a table, a ball, a sitting cat). */
  groundShadow(x: number, y: number, rx: number, ry: number, alpha = 1) {
    const st = this.style.cast
    const c = this.ctx
    c.save()
    c.globalCompositeOperation = 'multiply'
    c.globalAlpha = (this.mood.shadowAlpha ?? st.alpha) * alpha
    c.fillStyle = this.mood.shadow ?? st.tint
    c.fill(ellipse(x + rx * 0.16 * (this.style.light.x < 0 ? 1 : -1), y, rx, ry))
    c.restore()
  }
  /** Dry-brush speckle inside `region`: short dabs of a lighter and a darker paint, fixed by `seed`. */
  speckle(region: Path2D, color: string, seed: number, box: [number, number, number, number], density = 1, size = 1) {
    const k = this.style.texture.speckle
    if (this.sil || k <= 0) return
    const c = this.ctx
    const [x, y, w, h] = box
    const n = Math.min(900, Math.round(((w * h) / 5200) * density * k))
    const r = seededList(seed, n * 4)
    const dark = this.shadeOf(color)
    const light = mixHex(this.col(color), this.col(this.style.shade.light), 0.34)
    c.save()
    c.clip(region)
    c.lineCap = 'round'
    for (let i = 0; i < n; i++) {
      const px = x + r[i * 4] * w
      const py = y + r[i * 4 + 1] * h
      const len = (5 + r[i * 4 + 2] * 16) * size
      c.globalAlpha = 0.16 + 0.2 * r[i * 4 + 3]
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
