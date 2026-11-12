/**
 * The hand-made cartoon kit for «نزهة على القمر»: palette, easing, key-framed tracks and the Painter.
 *
 * Everything here is a pure function of time: no state is carried from one frame to the next, so any frame can be
 * drawn on its own (scrubbing, frame-by-frame capture to video). The stage is designed at 1920×1080 "units".
 */
import { mulberry32 } from '@/lib/seeded'

export const STAGE_W = 1920
export const STAGE_H = 1080

/** Palette from docs/stories/moon-art.md §2, plus the few darker "second papers" each costume needs. */
export const C = {
  space: '#0b0f24',
  navy: '#1d2447',
  nightFar: '#161b3a',
  nightMid: '#1a2042',
  dustNear: '#d9d4c7',
  dustMid: '#b3aea4',
  dustFar: '#918e8b',
  cream: '#f3ecdf',
  gold: '#e9d58a',
  goldHot: '#fff3c4',
  sea: '#3b78c2',
  land: '#6fae7a',
  earthNight: '#141a3a',
  skin: '#f6cfa8',
  skinShade: '#e9b98f',
  cheek: '#f0977a',
  ink: '#2a1c1a',
  mouth: '#7a2a22',
  tongue: '#ea7a63',
  hoodie: '#e0a526',
  hoodieDark: '#c68c17',
  jeans: '#2f6f7e',
  jeansCuff: '#86b3ba',
  sneaker: '#c8442f',
  backpack: '#9a4a33',
  hairSari: '#5a3320',
  hairSariLight: '#7d4a2c',
  jumper: '#6f7f3c',
  jumperDark: '#5c6b30',
  collar: '#c8612e',
  trousers: '#7a4a26',
  trousersCuff: '#a06c42',
  shoe: '#4a2b1e',
  hairAmir: '#1c1c22',
  hairAmirLight: '#3a3a48',
  cardigan: '#b5522d',
  cardiganDark: '#9b4423',
  skirt: '#27305c',
  skirtDark: '#1f274d',
  hairLayla: '#4a2b1e',
  hairLaylaLight: '#6a4130',
  wicker: '#c79a5b',
  wickerDark: '#a17840',
  petal: '#2c376e',
  petalDark: '#222b59',
  wheel: '#23263a',
  orange: '#f08a24',
} as const

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

// ── colour ────────────────────────────────────────────────────────────────────
const rgbCache = new Map<string, [number, number, number]>()
function rgb(hex: string): [number, number, number] {
  let c = rgbCache.get(hex)
  if (!c) {
    const n = parseInt(hex.slice(1), 16)
    c = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
    rgbCache.set(hex, c)
  }
  return c
}
export function mixHex(a: string, b: string, k: number): string {
  const A = rgb(a)
  const B = rgb(b)
  const h = (i: number) => Math.round(A[i] + (B[i] - A[i]) * k).toString(16).padStart(2, '0')
  return `#${h(0)}${h(1)}${h(2)}`
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

// ── the painter ───────────────────────────────────────────────────────────────
/** How a thing is lit. `sil` is a flat one-colour silhouette (cast shadows). */
export type Light = 'day' | 'night' | 'lamp' | 'glow' | 'sil'
export type Cam = { x: number; y: number; zoom: number }

export class Painter {
  ctx: CanvasRenderingContext2D
  /** Canvas pixels per stage unit (before camera zoom). */
  s = 1
  cam: Cam = { x: STAGE_W / 2, y: STAGE_H / 2, zoom: 1 }
  light: Light = 'day'
  silColor: string = C.navy
  /** Rim-light thickness on the sunward (screen-right) edge, in stage units. 0 switches it off. */
  rim = 3
  private cache = new Map<string, string>()

  constructor(ctx: CanvasRenderingContext2D, pxWidth: number) {
    this.ctx = ctx
    this.s = pxWidth / STAGE_W
  }

  /** Stage units → canvas, through the camera. */
  world() {
    const k = this.s * this.cam.zoom
    this.ctx.setTransform(k, 0, 0, k, (STAGE_W / 2 - this.cam.x * this.cam.zoom) * this.s, (STAGE_H / 2 - this.cam.y * this.cam.zoom) * this.s)
  }
  /** Stage units → canvas, ignoring the camera (sky, overlays). */
  screen() {
    this.ctx.setTransform(this.s, 0, 0, this.s, 0, 0)
  }
  /** Where a world point lands on the 1920×1080 screen. */
  toScreen(x: number, y: number): [number, number] {
    return [(x - this.cam.x) * this.cam.zoom + STAGE_W / 2, (y - this.cam.y) * this.cam.zoom + STAGE_H / 2]
  }

  /** A palette colour as it looks under the current light. */
  col(hex: string): string {
    const L = this.light
    if (L === 'day') return hex
    if (L === 'sil') return this.silColor
    const key = L + hex
    let c = this.cache.get(key)
    if (!c) {
      const lamp = mixHex(mixHex(hex, '#5a3f2e', 0.2), C.gold, 0.1)
      c = L === 'night' ? mixHex(hex, '#222b58', 0.74) : L === 'glow' ? mixHex(lamp, '#2a2f58', 0.2) : lamp
      this.cache.set(key, c)
    }
    return c
  }
  get rimColor(): string {
    return this.light === 'night' ? '#b9a66a' : this.light === 'day' ? '#fff1bf' : '#f6e3a0'
  }
  private rimWidth(rim: number | undefined): number {
    if (this.light === 'sil') return 0
    const w = rim ?? this.rim
    return this.light === 'night' ? w * 0.6 : w
  }
  /** Shift the next drawing toward the Sun by (dx, dy) screen-space stage units. Call ctx.restore() after. */
  private nudge(dx: number, dy: number) {
    const c = this.ctx
    c.save()
    const m = c.getTransform()
    const k = this.s * this.cam.zoom
    c.setTransform(m.a, m.b, m.c, m.d, m.e + dx * k, m.f + dy * k)
  }

  fill(path: Path2D, color: string, rim?: number) {
    const c = this.ctx
    const w = this.rimWidth(rim)
    if (w > 0) {
      this.nudge(w, -w * 0.35)
      c.fillStyle = this.rimColor
      c.fill(path)
      c.restore()
    }
    c.fillStyle = this.col(color)
    c.fill(path)
  }
  /** Fill with no rim-light (details that sit inside another shape). */
  flat(path: Path2D, color: string) {
    this.ctx.fillStyle = this.col(color)
    this.ctx.fill(path)
  }
  line(path: Path2D, color: string, width: number, rim = 0) {
    const c = this.ctx
    c.lineCap = 'round'
    c.lineJoin = 'round'
    c.lineWidth = width
    const w = this.rimWidth(rim)
    if (w > 0) {
      this.nudge(w, -w * 0.35)
      c.strokeStyle = this.rimColor
      c.stroke(path)
      c.restore()
    }
    c.strokeStyle = this.col(color)
    c.stroke(path)
  }
  /** A thick round-ended limb through the given points. */
  limb(pts: number[], width: number, color: string, rim?: number) {
    const p = new Path2D()
    p.moveTo(pts[0], pts[1])
    for (let i = 2; i < pts.length; i += 2) p.lineTo(pts[i], pts[i + 1])
    this.line(p, color, width, rim ?? this.rim)
  }
  /** Draw `fn` with a different light, then put the old one back. */
  lit(light: Light, fn: () => void) {
    const old = this.light
    this.light = light
    fn()
    this.light = old
  }
  /** Draw `fn` only inside `region` (a path in world units). */
  clip(region: Path2D, fn: () => void) {
    const c = this.ctx
    c.save()
    c.clip(region)
    fn()
    c.restore()
  }
  /**
   * The long hard shadow the low Sun (screen right) throws to the left: `fn` is drawn as a flat silhouette laid down
   * on the ground at (gx, gy). `lift` is how far the thing is off the ground (the shadow slides away from it).
   */
  shadow(gx: number, gy: number, fn: () => void, lift = 0, len = 4.2, depth = 0.24) {
    const c = this.ctx
    const old = this.light
    this.light = 'sil'
    c.save()
    // local x (figure width) → depth on the ground; local y (height, negative up) → distance to the left
    c.transform(0.001, depth, len, 0.035, gx - lift * 0.9, gy)
    fn()
    c.restore()
    this.light = old
  }
}

// ── paper grain ───────────────────────────────────────────────────────────────
let grainTile: HTMLCanvasElement | null = null
/** A fixed speckle of paper fibre over the whole frame (the same in every frame: it is the paper, not film noise). */
export function paperGrain(P: Painter) {
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
      img.data[i * 4 + 3] = Math.pow(Math.abs(v - 0.5) * 2, 3) * (light ? 16 : 24)
    }
    g.putImageData(img, 0, 0)
  }
  const c = P.ctx
  c.save()
  c.setTransform(1, 0, 0, 1, 0, 0)
  const pat = c.createPattern(grainTile, 'repeat')
  if (pat) {
    c.fillStyle = pat
    c.fillRect(0, 0, c.canvas.width, c.canvas.height)
  }
  c.restore()
}

/** Seeded random numbers in a fixed table, so particles are the same on every run. */
export function seededList(seed: number, n: number): number[] {
  const r = mulberry32(seed)
  return Array.from({ length: n }, () => r())
}
