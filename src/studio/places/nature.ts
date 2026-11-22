/**
 * Sky, weather, ground and plants: the outdoor half of the places-and-props library.
 * Everything is parametric (position, size, colours, a seed for its hand-cut edges) and drawn through the Painter,
 * so it takes the style profile's line, shading, texture and palette rules like the figures do.
 * Distance is made with overlap and air: draw far things inside `P.far(depth, …)`.
 */
import { Painter, TAU, blob, circle, curve, ellipse, limbPath, seededList, wobble } from '../kit/core'
import { mixHex } from '../style/color'

/** A sky of flat bands laid one over the other like washes of gouache: `colors` from the top down. Fixed to the screen. */
export function sky(P: Painter, colors: string[], horizon: number, seed = 5) {
  P.screen()
  const c = P.ctx
  const n = colors.length
  const r = seededList(seed, n * 12)
  for (let i = 0; i < n; i++) {
    const y0 = i === 0 ? -20 : (horizon * i) / n
    const pts = [-40, y0]
    for (let k = 0; k <= 8; k++) pts.push(-40 + ((P.W + 80) * k) / 8, y0 + (i === 0 ? 0 : (r[i * 12 + k] - 0.5) * 22))
    pts.push(P.W + 40, horizon + 60, -40, horizon + 60)
    const p = new Path2D()
    p.moveTo(pts[0], pts[1])
    for (let k = 2; k < pts.length; k += 2) p.lineTo(pts[k], pts[k + 1])
    p.closePath()
    c.fillStyle = P.col(colors[i])
    c.fill(curveBand(pts))
    P.speckle(p, colors[i], seed + i, [0, y0 - 20, P.W, horizon / n + 60], 0.35, 1.6)
  }
}
function curveBand(pts: number[]): Path2D {
  // a band whose top edge is a soft curve through the points and whose other sides are straight
  const n = pts.length / 2
  const p = new Path2D()
  p.moveTo(pts[0], pts[1])
  for (let i = 1; i < n - 3; i++) p.quadraticCurveTo(pts[i * 2], pts[i * 2 + 1], (pts[i * 2] + pts[i * 2 + 2]) / 2, (pts[i * 2 + 1] + pts[i * 2 + 3]) / 2)
  p.lineTo(pts[(n - 3) * 2], pts[(n - 3) * 2 + 1])
  p.lineTo(pts[(n - 2) * 2], pts[(n - 2) * 2 + 1])
  p.lineTo(pts[(n - 1) * 2], pts[(n - 1) * 2 + 1])
  p.closePath()
  return p
}

/** The sun as a painted disc with one paler ring: no glow. */
export function sun(P: Painter, x: number, y: number, r: number, color = '#ffd87a') {
  const rays = new Path2D()
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU + 0.2
    rays.moveTo(x + Math.cos(a) * r * 1.3, y + Math.sin(a) * r * 1.3)
    rays.lineTo(x + Math.cos(a) * r * (i % 2 ? 1.62 : 1.8), y + Math.sin(a) * r * (i % 2 ? 1.62 : 1.8))
  }
  P.line(rays, color, r * 0.13, 0.9)
  P.flat(circle(x, y, r), color)
  P.flat(circle(x - r * 0.2, y - r * 0.2, r * 0.62), mixHex(color, '#fff8e0', 0.5), 0.6)
}
export function moon(P: Painter, x: number, y: number, r: number, color = '#fdf3d0') {
  P.flat(circle(x, y, r), color)
  P.flat(circle(x + r * 0.42, y - r * 0.16, r * 0.86), P.mood.haze ?? '#39457a', 1)
}
export function stars(P: Painter, seed: number, n: number, bottom: number, color = '#fdf3d0') {
  const r = seededList(seed, n * 3)
  for (let i = 0; i < n; i++) P.flat(circle(r[i * 3] * P.W, r[i * 3 + 1] * bottom, 1.6 + r[i * 3 + 2] * 2.6), color, 0.5 + r[i * 3 + 2] * 0.5)
}

/** A cloud: a few rounded lumps on a flat base, cut from one piece. */
export function cloud(P: Painter, x: number, y: number, w: number, seed = 1, color = '#fffaf0') {
  const r = seededList(seed, 12)
  const parts: Path2D[] = []
  const n = 4 + Math.floor(r[0] * 2)
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1)
    const rr = w * (0.16 + 0.1 * Math.sin(u * Math.PI) + r[i + 1] * 0.04)
    parts.push(circle(x - w / 2 + u * w, y - rr * 0.7, rr))
  }
  parts.push(blob([x - w * 0.62, y, x - w * 0.5, y - w * 0.12, x + w * 0.5, y - w * 0.12, x + w * 0.62, y, x, y + w * 0.05]))
  P.group(parts, color, { line: 0.5, shade: 0.9, hi: 0 })
}

/** Rain: short slanted strokes that fall and wrap, the same on every run. `amount` 0…1. */
export function rain(P: Painter, t: number, amount = 1, wind = 0.18, color = '#9fc3d8') {
  P.screen()
  const n = Math.round(260 * amount)
  const r = seededList(77, n * 3)
  const p = new Path2D()
  for (let i = 0; i < n; i++) {
    const sp = 900 + r[i * 3 + 2] * 500
    const y = ((r[i * 3 + 1] * (P.H + 200) + t * sp) % (P.H + 200)) - 100
    const x = ((r[i * 3] * (P.W + 300) + y * wind) % (P.W + 300)) - 150
    p.moveTo(x, y)
    p.lineTo(x + 30 * wind, y + 30)
  }
  P.line(p, color, 2.6, 0.7)
}

/** A line of hills: one hand-cut ridge filled down to `bottom`. `amp` is how high the humps rise. */
export function hills(P: Painter, y: number, amp: number, seed: number, color: string, o: { x0?: number; x1?: number; bottom?: number; humps?: number; texture?: number } = {}) {
  const x0 = o.x0 ?? -200
  const x1 = o.x1 ?? P.W + 200
  const n = o.humps ?? 5
  const r = seededList(seed, n * 2 + 4)
  const pts: number[] = [x0, y + amp]
  for (let i = 0; i <= n * 2; i++) pts.push(x0 + ((x1 - x0) * i) / (n * 2), y + (i % 2 ? -amp * (0.5 + r[i] * 0.6) : amp * (0.1 + r[i] * 0.5)))
  const bottom = o.bottom ?? P.H + 100
  pts.push(x1, bottom, x0, bottom)
  const p = curveBand(pts)
  P.shape(p, color, { line: 0.7, shade: 0, tex: true })
  P.speckle(p, color, seed, [x0, y - amp, x1 - x0, Math.min(bottom - y + amp, amp * 4)], o.texture ?? 0.7, 1.4)
  return p
}

/** Level ground from `y` down: a nearly straight hand-cut edge and dry-brush texture. */
export function ground(P: Painter, y: number, color: string, o: { bottom?: number; seed?: number; x0?: number; x1?: number; texture?: number; bow?: number } = {}) {
  const x0 = o.x0 ?? -300
  const x1 = o.x1 ?? P.W + 300
  const bottom = o.bottom ?? P.H + 200
  const r = seededList(o.seed ?? 9, 12)
  const pts: number[] = [x0, y]
  for (let i = 0; i <= 8; i++) pts.push(x0 + ((x1 - x0) * i) / 8, y + (r[i] - 0.5) * (o.bow ?? 10))
  pts.push(x1, bottom, x0, bottom)
  const p = curveBand(pts)
  P.shape(p, color, { line: 0.6, shade: 0 })
  P.speckle(p, color, (o.seed ?? 9) + 1, [x0, y, x1 - x0, bottom - y], o.texture ?? 1, 1.5)
  return p
}

/** Tufts of grass along a line. */
export function grass(P: Painter, x0: number, x1: number, y: number, seed: number, color: string, n = 14, h = 26) {
  const r = seededList(seed, n * 4)
  for (let i = 0; i < n; i++) {
    const x = x0 + r[i * 4] * (x1 - x0)
    const yy = y + (r[i * 4 + 1] - 0.5) * 16
    const k = h * (0.6 + r[i * 4 + 2] * 0.7)
    P.shape(blob([x - k * 0.5, yy, x - k * 0.44, yy - k * 0.7, x - k * 0.2, yy - k * 0.2, x, yy - k, x + k * 0.2, yy - k * 0.24, x + k * 0.5, yy - k * 0.66, x + k * 0.5, yy]), color, { shade: 0.3, line: 0.7 })
  }
}

/** A footpath that narrows as it goes away: `pts` are x, y, half-width triples from near to far. */
export function pathway(P: Painter, pts: number[], color: string, seed = 3) {
  const L: number[] = []
  const R: number[] = []
  for (let i = 0; i < pts.length; i += 3) {
    L.push(pts[i] - pts[i + 2], pts[i + 1])
    R.unshift(pts[i] + pts[i + 2], pts[i + 1])
  }
  const all = wobble(L.concat(R), 5, seed)
  const p = blob(all)
  P.shape(p, color, { line: 0.6, shade: 0 })
  const xs = all.filter((_, i) => i % 2 === 0)
  const ys = all.filter((_, i) => i % 2 === 1)
  P.speckle(p, color, seed, [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)], 1.2)
}

/** The sea: bands of water from the horizon `y0` down to the shore `y1`, with moving wave edges and a line of foam. */
export function sea(P: Painter, y0: number, y1: number, t: number, colors = ['#3f8fa8', '#4fa6b8', '#6fc0c4', '#a5dcd4']) {
  const n = colors.length
  for (let i = 0; i < n; i++) {
    const y = y0 + ((y1 - y0) * i * i) / (n * n) + (i === 0 ? 0 : 0)
    const pts: number[] = [-200, y]
    for (let k = 0; k <= 12; k++) {
      const x = -200 + ((P.W + 400) * k) / 12
      pts.push(x, y + (i === 0 ? 0 : Math.sin(k * 1.7 + i * 2 + t * (0.8 + i * 0.3)) * (4 + i * 4)))
    }
    pts.push(P.W + 200, y1 + 60, -200, y1 + 60)
    const p = curveBand(pts)
    P.far(Math.max(0, 0.5 - i * 0.2), () => P.shape(p, colors[i], { line: i === 0 ? 0.5 : 0, shade: 0 }))
    if (i > 0) {
      // white caps riding each band's edge
      const cap = new Path2D()
      const r = seededList(40 + i, 24)
      for (let k = 0; k < 8; k++) {
        const x = ((r[k * 3] * (P.W + 400) + t * (14 + i * 10)) % (P.W + 400)) - 200
        const w = 30 + r[k * 3 + 1] * 60
        cap.moveTo(x, y + 5 + i * 3)
        cap.quadraticCurveTo(x + w / 2, y - 2 + i * 3, x + w, y + 5 + i * 3)
      }
      P.line(cap, '#fffaf0', 2 + i * 1.2, 0.8)
    }
  }
}
/** The wet edge where the last wave meets the sand: foam that slides in and out with `t`. */
export function surf(P: Painter, y: number, t: number, color = '#fffaf0') {
  const s = Math.sin(t * 0.9) * 16
  const pts: number[] = [-200, y + s]
  for (let k = 0; k <= 10; k++) pts.push(-200 + ((P.W + 400) * k) / 10, y + s + Math.sin(k * 2.1 + t * 0.6) * 9)
  pts.push(P.W + 200, y + s + 30, -200, y + s + 30)
  P.flat(curveBand(pts), color, 0.9)
  const p2 = pts.map((v, i) => (i % 2 ? v + 16 : v))
  P.flat(curveBand(p2), '#e9d7a8', 1)
}

export type TreeOpts = { trunk?: string; leaf?: string; fruit?: string; seed?: number; sway?: number; spread?: number; fruits?: number }
/** A tree with a rounded crown: trunk and two boughs, then leaf masses cut from one piece, lighter clumps on the lit side, fruit. */
export function tree(P: Painter, x: number, y: number, h: number, o: TreeOpts = {}) {
  const trunk = o.trunk ?? '#8a5a44'
  const leaf = o.leaf ?? '#5f9a52'
  const seed = o.seed ?? 1
  const sw = (o.sway ?? 0) * h * 0.02
  const w = h * (o.spread ?? 0.62)
  const r = seededList(seed, 60)
  const tw = h * 0.085
  const top = y - h * 0.56
  P.shape(blob([x - tw * 1.3, y, x - tw * 0.7, y - h * 0.2, x - tw * 0.62 + sw * 0.3, top, x + tw * 0.62 + sw * 0.3, top, x + tw * 0.7, y - h * 0.2, x + tw * 1.3, y, x, y + tw * 0.2]), trunk, { shade: 1.2 })
  P.detail(curve([x - tw * 0.1, y - h * 0.06, x - tw * 0.2, y - h * 0.3, x + sw * 0.3, y - h * 0.48]), trunk, 0.7)
  P.shape(limbPath({ x: x + sw * 0.3, y: top + h * 0.1 }, { x: x - w * 0.22 + sw * 0.5, y: top - h * 0.02 }, { x: x - w * 0.42 + sw, y: top - h * 0.14 }, tw * 0.9, tw * 0.7, tw * 0.4, 0.5), trunk, { shade: 0.7 })
  P.shape(limbPath({ x: x + sw * 0.3, y: top + h * 0.06 }, { x: x + w * 0.2 + sw * 0.5, y: top - h * 0.06 }, { x: x + w * 0.44 + sw, y: top - h * 0.12 }, tw * 0.9, tw * 0.7, tw * 0.4, 0.5), trunk, { shade: 0.7 })
  // the crown: one hand-cut shape with a lumpy edge, so it takes one form shadow like everything else
  const cy = y - h * 0.71
  const rx = w * 0.58
  const ry = h * 0.31
  const n = 26
  const pts: number[] = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU - Math.PI / 2
    const k = (i % 2 ? 1.06 : 0.9) + (r[i] - 0.5) * 0.1
    // flatter underneath, fuller on top
    const fy = Math.sin(a) > 0 ? 0.74 : 1
    pts.push(x + Math.cos(a) * rx * k + sw * (1.2 - Math.sin(a)), cy + Math.sin(a) * ry * k * fy)
  }
  const crown = blob(pts)
  P.shape(crown, leaf, { shade: 2.6, hi: 0.5 })
  if (!P.sil) {
    const lit = mixHex(leaf, '#f4e79a', 0.36)
    const dark = mixHex(leaf, '#243a52', 0.34)
    P.clip(crown, () => {
      // leaves: light dabs toward the sun, dark ones in the crown's own shade, and the drawn edges of a few clumps
      for (let i = 0; i < 90; i++) {
        const u = r[i % 60]
        const v = r[(i * 7 + 13) % 60]
        const a = u * TAU
        const d = Math.sqrt(v)
        const px = x + Math.cos(a) * rx * d * 0.92 + sw
        const py = cy + Math.sin(a) * ry * d * 0.9
        const side = (px - x) / rx + (py - cy) / ry
        P.flat(ellipse(px, py, h * 0.021, h * 0.01, -0.7 + r[(i * 3 + 5) % 60] * 1.0), side < 0.15 ? lit : dark, side < 0.15 ? 0.85 : 0.5)
      }
      const arcs = new Path2D()
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * TAU + r[i + 20] * 0.5
        const px = x + Math.cos(a) * rx * 0.52 + sw
        const py = cy + Math.sin(a) * ry * 0.5
        const q = h * (0.05 + r[i + 30] * 0.035)
        arcs.moveTo(px - q, py)
        arcs.quadraticCurveTo(px - q * 0.2, py + q * 0.9, px + q, py + q * 0.3)
      }
      P.detail(arcs, leaf, 0.8)
    })
    if (o.fruit) {
      const m = o.fruits ?? 9
      for (let i = 0; i < m; i++) {
        const a = (i / m) * TAU + r[i + 40]
        const d = 0.3 + r[i + 50] * 0.52
        fruitShape(P, x + Math.cos(a) * rx * d + sw, cy + Math.sin(a) * ry * d * 0.9 + h * 0.03, h * 0.027, o.fruit)
      }
    }
  }
}
function fruitShape(P: Painter, x: number, y: number, r: number, color: string) {
  P.shape(circle(x, y, r), color, { shade: 0.5, tex: false })
  P.flat(circle(x - r * 0.3, y - r * 0.34, r * 0.26), '#fff6dc', 0.6)
}

/** A bush: leaf masses on the ground, with or without flowers. */
export function bush(P: Painter, x: number, y: number, w: number, color = '#6a9a56', seed = 2, flowers?: string) {
  const r = seededList(seed, 40)
  const parts: Path2D[] = []
  const n = 5
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1)
    const rr = w * (0.16 + 0.12 * Math.sin(u * Math.PI) + r[i] * 0.04)
    parts.push(circle(x - w * 0.36 + u * w * 0.72, y - rr * 0.84, rr))
  }
  P.group(parts, color, { shade: 1.2 })
  if (P.sil) return
  const lit = mixHex(color, '#f4e79a', 0.34)
  for (let i = 0; i < 9; i++) P.flat(ellipse(x - w * 0.36 + r[i + 6] * w * 0.6, y - w * 0.16 - r[i + 16] * w * 0.3, w * 0.045, w * 0.026, -0.5 + r[i]), lit, 0.75)
  if (flowers) for (let i = 0; i < 7; i++) blossom(P, x - w * 0.36 + r[i + 26] * w * 0.72, y - w * 0.1 - r[i + 33] * w * 0.34, w * 0.045, flowers)
}
function blossom(P: Painter, x: number, y: number, r: number, color: string) {
  for (let i = 0; i < 5; i++) P.flat(circle(x + Math.cos((i / 5) * TAU) * r * 0.7, y + Math.sin((i / 5) * TAU) * r * 0.7, r * 0.56), color)
  P.flat(circle(x, y, r * 0.42), '#ffd76a')
}

/** A flower on a stem, `h` tall; `sway` leans it (radians). */
export function flower(P: Painter, x: number, y: number, h: number, color = '#e2674a', sway = 0, stem = '#5f9a52') {
  const tx = x + Math.sin(sway) * h
  const ty = y - Math.cos(sway) * h
  P.line(curve([x, y, x + Math.sin(sway) * h * 0.3, y - h * 0.5, tx, ty]), mixHex(stem, '#2a1830', 0.3), h * 0.07)
  P.shape(blob([x, y - h * 0.3, x + h * 0.22, y - h * 0.5, x + h * 0.3, y - h * 0.36, x + h * 0.1, y - h * 0.26]), stem, { shade: 0.3, line: 0.7 })
  const r = h * 0.16
  const petals: Path2D[] = []
  for (let i = 0; i < 6; i++) petals.push(ellipse(tx + Math.cos((i / 6) * TAU) * r * 0.8, ty + Math.sin((i / 6) * TAU) * r * 0.8, r * 0.62, r * 0.42, (i / 6) * TAU))
  P.group(petals, color, { shade: 0.3, line: 0.7 })
  P.shape(circle(tx, ty, r * 0.48), '#ffd76a', { shade: 0.3, line: 0.6, tex: false })
}

/** A spray of big leaves for the front of a picture, growing from (x, y) toward `rot`: it overlaps what is behind and gives the near plane. */
export function leafSpray(P: Painter, x: number, y: number, size: number, rot: number, color = '#3f7a5a', seed = 4, n = 5) {
  const c = P.ctx
  const r = seededList(seed, n * 3)
  for (let i = 0; i < n; i++) {
    const a = rot + (i / (n - 1) - 0.5) * 1.5 + (r[i * 3] - 0.5) * 0.2
    const L = size * (0.7 + r[i * 3 + 1] * 0.4)
    c.save()
    c.translate(x, y)
    c.rotate(a)
    P.shape(blob([0, 0, L * 0.3, -L * 0.2, L * 0.7, -L * 0.16, L, 0, L * 0.7, L * 0.16, L * 0.3, L * 0.2]), i % 2 ? color : mixHex(color, '#1f3a4a', 0.2), { shade: 1.2 })
    P.detail(curve([L * 0.06, 0, L * 0.9, 0]), color, 0.8)
    c.restore()
  }
}

/** A plant in a pot. */
export function potPlant(P: Painter, x: number, y: number, s: number, o: { pot?: string; leaf?: string; seed?: number } = {}) {
  const pot = o.pot ?? '#c96a4a'
  leafSpray(P, x, y - s * 0.5, s * 0.9, -Math.PI / 2, o.leaf ?? '#5f9a52', o.seed ?? 6, 5)
  P.shape(blob([x - s * 0.34, y - s * 0.56, x + s * 0.34, y - s * 0.56, x + s * 0.26, y, x - s * 0.26, y]), pot, { shade: 1 })
  P.shape(blob([x - s * 0.4, y - s * 0.64, x + s * 0.4, y - s * 0.64, x + s * 0.38, y - s * 0.48, x - s * 0.38, y - s * 0.48]), pot, { shade: 0.5 })
}
