/**
 * What the three instruction directions share: the things of the two example activities (cushion, cup, stick,
 * wooden spoon), the wordless signs (speech bubbles with a picture inside, arrows, drawn numerals, step pips) and
 * soft shadows. Everything is drawn through the Painter, so each direction's style profile decides how it looks.
 *
 * Safety is drawn in: the cushion has no buttons, tassels or cords; the cup is a big empty tumbler with no lid;
 * the stick is short, thick and round at both ends.
 */
import { Painter, TAU, blob, circle, curve, ellipse, limbPath, rrect, seededList } from '../kit/core'
import { mixHex } from '../style/color'

export const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v)
/** 0→1 between a and b, eased. */
export const ease = (t: number, a: number, b: number) => {
  const u = clamp((t - a) / (b - a))
  return u * u * (3 - 2 * u)
}
/** Time inside a loop of `period` seconds. */
export const wrap = (t: number, period: number) => ((t % period) + period) % period

// ── soft shadow ───────────────────────────────────────────────────────────────
/**
 * The soft shadow of a thing lying a little above a surface (seen from above), or of a paper label: the path's
 * shape, blurred and slid by (dx, dy) picture units. Drawn before the thing itself.
 */
export function softShadow(P: Painter, path: Path2D, dx: number, dy: number, blur: number, alpha = 0.3, color = '#3a2848') {
  if (P.sil) return
  const c = P.ctx
  const m = c.getTransform()
  const sc = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c))
  // the shape is drawn far off the canvas and only its shadow lands on it
  const OFF = c.canvas.width * 3 + 4000
  const [r, g, b] = [parseInt(color.slice(1, 3), 16), parseInt(color.slice(3, 5), 16), parseInt(color.slice(5, 7), 16)]
  c.save()
  c.setTransform(m.a, m.b, m.c, m.d, m.e - OFF, m.f)
  c.shadowColor = `rgba(${r},${g},${b},${alpha})`
  c.shadowBlur = blur * sc
  c.shadowOffsetX = OFF + dx * sc
  c.shadowOffsetY = dy * sc
  c.fillStyle = '#000'
  c.fill(path)
  c.restore()
}

// ── the things ────────────────────────────────────────────────────────────────
export type CushionOpts = { rot?: number; color?: string; trim?: string; /** Height as a fraction of the width (1 = seen from above). */ ratio?: number; shadow?: number }
/** A plump cushion centred on (x, y). No buttons, no tassels, no cords. */
export function cushion(P: Painter, x: number, y: number, w: number, o: CushionOpts = {}) {
  const c = P.ctx
  const color = o.color ?? '#4f9a8f'
  const trim = o.trim ?? '#f6e7c4'
  const h = w * (o.ratio ?? 0.8)
  const a = w / 2
  const b = h / 2
  const p = new Path2D()
  p.moveTo(-a, -b)
  p.quadraticCurveTo(0, -b + h * 0.1, a, -b)
  p.quadraticCurveTo(a - w * 0.085, 0, a, b)
  p.quadraticCurveTo(0, b - h * 0.1, -a, b)
  p.quadraticCurveTo(-a + w * 0.085, 0, -a, -b)
  p.closePath()
  c.save()
  c.translate(x, y)
  c.rotate(o.rot ?? 0)
  if (o.shadow) softShadow(P, p, o.shadow * 0.5, o.shadow, o.shadow * 1.4, 0.34)
  P.shape(p, color, {
    shade: 1.3,
    over: () => {
      // two woven bands and a row of leaves: a pattern, nothing sewn on
      P.flat(rrect(-a, -h * 0.16, w, h * 0.07, 0), trim, 0.95)
      P.flat(rrect(-a, h * 0.09, w, h * 0.07, 0), trim, 0.95)
      for (let i = -2; i <= 2; i++) P.flat(ellipse(i * w * 0.17, 0, w * 0.05, h * 0.045, 0.5), mixHex(color, trim, 0.55), 0.95)
    },
  })
  // the seam: a line just inside the edge
  const s = new Path2D()
  s.moveTo(-a * 0.86, -b * 0.8)
  s.quadraticCurveTo(0, -b * 0.66, a * 0.86, -b * 0.8)
  s.moveTo(-a * 0.86, b * 0.8)
  s.quadraticCurveTo(0, b * 0.66, a * 0.86, b * 0.8)
  P.detail(s, color, 0.7)
  c.restore()
}

/** A big plastic tumbler standing on (x, y), `s` tall, seen a little from above so its empty inside shows. */
export function tumbler(P: Painter, x: number, y: number, s: number, o: { color?: string; rot?: number; shadow?: number } = {}) {
  const c = P.ctx
  const color = o.color ?? '#f2c94c'
  const rw = s * 0.4
  const bw = s * 0.29
  const ry = s * 0.115
  c.save()
  c.translate(x, y)
  c.rotate(o.rot ?? 0)
  const body = new Path2D()
  body.moveTo(-rw, -s)
  body.lineTo(-bw, -s * 0.06)
  body.quadraticCurveTo(0, s * 0.06, bw, -s * 0.06)
  body.lineTo(rw, -s)
  body.closePath()
  if (o.shadow) softShadow(P, body, o.shadow * 0.5, o.shadow, o.shadow * 1.4, 0.3)
  P.shape(body, color, { shade: 1, over: () => P.flat(rrect(-rw, -s * 0.62, rw * 2, s * 0.09, 0), mixHex(color, '#ffffff', 0.5), 0.9) })
  // the mouth: we look down into it and it is empty
  P.shape(ellipse(0, -s, rw, ry), mixHex(color, '#ffffff', 0.25), { shade: 0 })
  P.flat(ellipse(0, -s + ry * 0.12, rw * 0.84, ry * 0.74), mixHex(color, '#5a3a2a', 0.34))
  P.flat(ellipse(0, -s + ry * 0.5, rw * 0.5, ry * 0.3), mixHex(color, '#5a3a2a', 0.18))
  c.restore()
}

/** The same tumbler seen from straight above: rim, the empty inside, the smaller bottom. Centred on (x, y). */
export function tumblerTop(P: Painter, x: number, y: number, r: number, o: { color?: string; shadow?: number } = {}) {
  const color = o.color ?? '#f2c94c'
  if (o.shadow) softShadow(P, circle(x, y, r), o.shadow * 0.6, o.shadow, o.shadow * 1.3, 0.36)
  P.shape(circle(x, y, r), mixHex(color, '#ffffff', 0.18), { shade: 0.6 })
  P.flat(circle(x, y, r * 0.86), mixHex(color, '#5a3a2a', 0.3))
  P.flat(circle(x - r * 0.05, y - r * 0.06, r * 0.62), mixHex(color, '#5a3a2a', 0.14))
  P.line(curve([x - r * 0.5, y + r * 0.2, x - r * 0.3, y + r * 0.45, x, y + r * 0.52]), mixHex(color, '#ffffff', 0.6), r * 0.06, 0.8)
}

/** A short garden stick, thick and round at both ends, centred on (x, y), `len` long, lying along `rot`. */
export function stick(P: Painter, x: number, y: number, len: number, o: { rot?: number; color?: string; shadow?: number } = {}) {
  const c = P.ctx
  const color = o.color ?? '#a8744a'
  const w = len * 0.085
  const a = { x: -len / 2, y: 0 }
  const j = { x: len * 0.06, y: -len * 0.035 }
  const b = { x: len / 2, y: len * 0.01 }
  c.save()
  c.translate(x, y)
  c.rotate(o.rot ?? 0)
  const body = limbPath(a, j, b, w * 1.1, w, w * 0.92, 0.7)
  const stub = limbPath({ x: len * 0.12, y: -len * 0.03 }, { x: len * 0.17, y: -len * 0.075 }, { x: len * 0.2, y: -len * 0.1 }, w * 0.62, w * 0.56, w * 0.5, 0.5)
  if (o.shadow) softShadow(P, body, o.shadow * 0.6, o.shadow, o.shadow * 1.2, 0.36)
  P.shape(stub, color, { shade: 0.5 })
  P.shape(body, color, { shade: 0.7 })
  // bark: a few short marks and the pale cut ends
  const r = seededList(41, 12)
  for (let i = 0; i < 5; i++) {
    const px = -len * 0.36 + i * len * 0.17 + r[i] * len * 0.04
    P.detail(curve([px, -w * 0.18 + r[i + 5] * w * 0.3, px + len * 0.05, -w * 0.12 + r[i + 5] * w * 0.3]), color, 0.6)
  }
  P.flat(ellipse(-len / 2 - w * 0.12, 0, w * 0.2, w * 0.36), mixHex(color, '#f6e2bc', 0.6))
  P.flat(ellipse(len / 2 + w * 0.1, len * 0.01, w * 0.17, w * 0.3), mixHex(color, '#f6e2bc', 0.6))
  c.restore()
}

/** A wooden cooking spoon centred on (x, y), `len` long, lying along `rot` (the bowl of the spoon at the far end). */
export function spoon(P: Painter, x: number, y: number, len: number, o: { rot?: number; color?: string; shadow?: number } = {}) {
  const c = P.ctx
  const color = o.color ?? '#e0b077'
  const w = len * 0.062
  c.save()
  c.translate(x, y)
  c.rotate(o.rot ?? 0)
  const handle = limbPath({ x: -len / 2, y: 0 }, { x: 0, y: 0 }, { x: len * 0.3, y: 0 }, w * 1.15, w, w * 0.8, 0.5)
  const head = ellipse(len * 0.37, 0, len * 0.14, len * 0.1)
  if (o.shadow) {
    softShadow(P, handle, o.shadow * 0.6, o.shadow, o.shadow * 1.2, 0.36)
    softShadow(P, head, o.shadow * 0.6, o.shadow, o.shadow * 1.2, 0.36)
  }
  P.group([handle, head], color, { shade: 0.7 })
  P.flat(ellipse(len * 0.375, len * 0.004, len * 0.1, len * 0.066), mixHex(color, '#7a4a2a', 0.22))
  P.flat(ellipse(len * 0.36, -len * 0.012, len * 0.07, len * 0.04), mixHex(color, '#fff3d6', 0.2))
  c.restore()
}

// ── wordless signs ────────────────────────────────────────────────────────────
/** A heart centred on (x, y), `s` wide. */
export function heartPath(x: number, y: number, s: number): Path2D {
  const p = new Path2D()
  const h = s * 0.5
  p.moveTo(x, y + h * 0.82)
  p.bezierCurveTo(x - h * 1.5, y - h * 0.1, x - h * 0.9, y - h * 1.2, x, y - h * 0.36)
  p.bezierCurveTo(x + h * 0.9, y - h * 1.2, x + h * 1.5, y - h * 0.1, x, y + h * 0.82)
  p.closePath()
  return p
}

export type Icon = 'heart' | 'sun' | 'fish' | 'cushion' | 'cup' | 'ear'
/** The picture inside a speech bubble, centred on (0, 0), about `s` across. `ghost`: what somebody else said, repeated (pale, with a dashed edge). */
export function icon(P: Painter, kind: Icon, s: number, ghost = false) {
  const c = P.ctx
  c.save()
  if (ghost) c.globalAlpha *= 0.55
  if (kind === 'heart') P.shape(heartPath(0, 0, s), '#e4572e', { shade: 0.5, line: 0.9, tex: false })
  else if (kind === 'sun') {
    const rays = new Path2D()
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU
      rays.moveTo(Math.cos(a) * s * 0.36, Math.sin(a) * s * 0.36)
      rays.lineTo(Math.cos(a) * s * 0.5, Math.sin(a) * s * 0.5)
    }
    P.line(rays, '#f0a020', s * 0.08)
    P.shape(circle(0, 0, s * 0.27), '#f7c531', { shade: 0.5, line: 0.9, tex: false })
  } else if (kind === 'fish') {
    P.shape(blob([-s * 0.5, -s * 0.22, -s * 0.24, 0, -s * 0.5, s * 0.22, -s * 0.34, 0]), '#3f8fc4', { shade: 0.4, line: 0.9, tex: false })
    P.shape(ellipse(s * 0.06, 0, s * 0.36, s * 0.22), '#4aa3d8', { shade: 0.5, line: 0.9, tex: false })
    P.flat(circle(s * 0.24, -s * 0.05, s * 0.04), '#1f2a44')
  } else if (kind === 'cushion') cushion(P, 0, 0, s * 0.86, { ratio: 0.8 })
  else if (kind === 'cup') tumbler(P, 0, s * 0.36, s * 0.74)
  else {
    // an ear with two sound arcs: "listen"
    P.shape(blob([-s * 0.1, -s * 0.34, s * 0.18, -s * 0.3, s * 0.24, 0, s * 0.06, s * 0.2, s * 0.02, s * 0.36, -s * 0.14, s * 0.32, -s * 0.06, s * 0.08, -s * 0.2, -s * 0.1]), '#e9b98e', { shade: 0.4, line: 0.9, tex: false })
    P.line(curve([-s * 0.34, -s * 0.16, -s * 0.42, 0, -s * 0.34, s * 0.16]), '#3a2a44', s * 0.05, 0.8)
  }
  c.restore()
}

export type BubbleOpts = {
  /** Where the tail points (the speaker's mouth). */
  to: { x: number; y: number }
  fill?: string
  edge?: string
  /** Edge width in picture units. */
  lw?: number
  shadow?: number
  /** A repeated saying: a dashed edge. */
  dashed?: boolean
  /** 0…1: the bubble pops in (scale) as this rises. */
  pop?: number
}
/** A speech bubble centred on (x, y) with a picture inside, drawn by `inside` around (0, 0). */
export function bubble(P: Painter, x: number, y: number, w: number, h: number, o: BubbleOpts, inside: () => void) {
  const c = P.ctx
  const pop = o.pop ?? 1
  if (pop <= 0.02) return
  const k = pop < 1 ? 0.6 + 0.4 * (1 + 1.7 * Math.pow(pop - 1, 3) + 0.7 * Math.pow(pop - 1, 2)) : 1
  const fill = o.fill ?? '#fffaf0'
  const edge = o.edge ?? '#3a2a44'
  const lw = o.lw ?? 5
  const body = rrect(-w / 2, -h / 2, w, h, Math.min(w, h) * 0.42)
  // the tail: a small wedge from the bubble's edge toward the speaker
  const dx = o.to.x - x
  const dy = o.to.y - y
  const d = Math.hypot(dx, dy) || 1
  const ux = dx / d
  const uy = dy / d
  const bx = ux * (w / 2) * 0.62
  const by = uy * (h / 2) * 0.62
  const tl = Math.min(d * 0.7, Math.max(w, h) * 0.5)
  const tx = ux * (Math.abs(ux) * w * 0.5 + Math.abs(uy) * h * 0.5) + ux * tl * 0.5
  const ty = uy * (Math.abs(ux) * w * 0.5 + Math.abs(uy) * h * 0.5) + uy * tl * 0.5
  const tw = Math.min(w, h) * 0.2
  const tail = new Path2D()
  tail.moveTo(bx - uy * tw, by + ux * tw)
  tail.lineTo(tx, ty)
  tail.lineTo(bx + uy * tw, by - ux * tw)
  tail.closePath()
  c.save()
  c.translate(x, y)
  c.scale(k, k)
  c.globalAlpha *= Math.min(1, pop * 2)
  if (o.shadow) {
    softShadow(P, body, o.shadow * 0.5, o.shadow, o.shadow * 1.4, 0.3)
  }
  c.lineJoin = 'round'
  c.lineWidth = lw * 2
  c.strokeStyle = edge
  if (o.dashed) c.setLineDash([lw * 3.2, lw * 3])
  if (lw > 0) {
    c.stroke(body)
    c.stroke(tail)
  }
  c.setLineDash([])
  c.fillStyle = fill
  c.fill(body)
  c.fill(tail)
  inside()
  c.restore()
}

export type ArrowOpts = { color?: string; edge?: string; width?: number; dash?: number[]; head?: number; alpha?: number; /** 0…1: how much of the arrow has been drawn (loops). */ grow?: number }
/** A curved arrow through the given points (x, y pairs), with a head at the end. The edge colour makes it read on any ground. */
export function arrow(P: Painter, pts: number[], o: ArrowOpts = {}) {
  if (P.sil) return
  const c = P.ctx
  const w = o.width ?? 12
  const color = o.color ?? '#fffaf0'
  const edge = o.edge ?? '#3a2a44'
  const head = o.head ?? w * 2.6
  const n = pts.length
  const ex = pts[n - 2]
  const ey = pts[n - 1]
  const a = Math.atan2(ey - pts[n - 3], ex - pts[n - 4])
  // the shaft stops inside the head
  const sh = pts.slice()
  sh[n - 2] = ex - Math.cos(a) * head * 0.7
  sh[n - 1] = ey - Math.sin(a) * head * 0.7
  const shaft = curve(sh)
  const hp = new Path2D()
  hp.moveTo(ex, ey)
  hp.lineTo(ex - Math.cos(a - 0.5) * head * 1.25, ey - Math.sin(a - 0.5) * head * 1.25)
  hp.lineTo(ex - Math.cos(a) * head * 0.66, ey - Math.sin(a) * head * 0.66)
  hp.lineTo(ex - Math.cos(a + 0.5) * head * 1.25, ey - Math.sin(a + 0.5) * head * 1.25)
  hp.closePath()
  c.save()
  c.globalAlpha *= o.alpha ?? 1
  c.lineCap = 'round'
  c.lineJoin = 'round'
  const ew = Math.max(2, w * 0.3)
  if (o.dash) c.setLineDash(o.dash)
  c.strokeStyle = edge
  c.lineWidth = w + ew * 2
  c.stroke(shaft)
  c.setLineDash([])
  c.lineWidth = ew * 2
  c.stroke(hp)
  c.fillStyle = edge
  c.fill(hp)
  if (o.dash) c.setLineDash(o.dash)
  c.strokeStyle = color
  c.lineWidth = w
  c.stroke(shaft)
  c.setLineDash([])
  c.fillStyle = color
  c.fill(hp)
  c.restore()
}

const DIGITS: Record<number, (p: Path2D) => void> = {
  1: (p) => {
    p.moveTo(-0.14, -0.3)
    p.lineTo(0.06, -0.5)
    p.lineTo(0.06, 0.5)
  },
  2: (p) => {
    p.moveTo(-0.27, -0.25)
    p.bezierCurveTo(-0.27, -0.58, 0.28, -0.58, 0.28, -0.24)
    p.bezierCurveTo(0.28, 0.02, -0.1, 0.2, -0.29, 0.5)
    p.lineTo(0.3, 0.5)
  },
  3: (p) => {
    p.moveTo(-0.27, -0.36)
    p.bezierCurveTo(-0.1, -0.58, 0.29, -0.54, 0.26, -0.26)
    p.bezierCurveTo(0.25, -0.1, 0.1, -0.03, -0.06, -0.03)
    p.bezierCurveTo(0.16, -0.03, 0.32, 0.08, 0.3, 0.25)
    p.bezierCurveTo(0.28, 0.58, -0.18, 0.58, -0.31, 0.33)
  },
  4: (p) => {
    p.moveTo(0.13, 0.5)
    p.lineTo(0.13, -0.5)
    p.lineTo(-0.33, 0.2)
    p.lineTo(0.34, 0.2)
  },
  5: (p) => {
    p.moveTo(0.26, -0.5)
    p.lineTo(-0.2, -0.5)
    p.lineTo(-0.26, -0.06)
    p.bezierCurveTo(-0.1, -0.2, 0.3, -0.17, 0.3, 0.18)
    p.bezierCurveTo(0.3, 0.57, -0.16, 0.59, -0.31, 0.34)
  },
  6: (p) => {
    p.moveTo(0.2, -0.5)
    p.bezierCurveTo(-0.14, -0.4, -0.3, -0.06, -0.3, 0.2)
    p.bezierCurveTo(-0.3, 0.6, 0.3, 0.6, 0.3, 0.2)
    p.bezierCurveTo(0.3, -0.14, -0.2, -0.14, -0.29, 0.16)
  },
}
/**
 * A numeral drawn as a round brush stroke (not type: it looks the same on every device and in every language's
 * page), centred on (x, y), `size` tall.
 */
export function numeral(P: Painter, n: number, x: number, y: number, size: number, color: string, o: { edge?: string; edgeW?: number; weight?: number } = {}) {
  const c = P.ctx
  const make = DIGITS[n]
  if (!make) return
  const p = new Path2D()
  make(p)
  c.save()
  c.translate(x, y)
  c.scale(size, size)
  c.lineCap = 'round'
  c.lineJoin = 'round'
  const w = o.weight ?? 0.2
  if (o.edge) {
    c.strokeStyle = o.edge
    c.lineWidth = w + (o.edgeW ?? 0.08) * 2
    c.stroke(p)
  }
  c.strokeStyle = color
  c.lineWidth = w
  c.stroke(p)
  c.restore()
}

/** Step pips: `total` dots in a row starting at (x, y), the first `n` filled. In a right-to-left page the row runs leftward. */
export function pips(P: Painter, x: number, y: number, n: number, total: number, r: number, on: string, off: string, rtl: boolean, gap = 3.1) {
  for (let i = 0; i < total; i++) {
    const px = x + (rtl ? -1 : 1) * i * r * gap
    P.flat(circle(px, y, r), i < n ? on : off)
  }
}
