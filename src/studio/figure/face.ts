/**
 * The head of a figure: skull, ears, the acting face, every hair style in the sheet contract, and what is worn on
 * the head. Drawn in the head's own frame: origin at the head's centre, already rotated by the head angle.
 */
import type { Sheet } from '@/cast/sheet'
import { Painter, TAU, blob, circle, clamp01, curve, ellipse, seededList } from '../kit/core'
import { mixHex } from '../style/color'
import type { Pose } from './pose'
import type { Rig } from './rig'

const WHITE = '#fffaf0'
const MOUTH = '#6e2733'
const TONGUE = '#ee8f86'

export const blushOf = (s: Sheet) => s.blush ?? mixHex(s.skin, '#e9624e', 0.42)
const browOf = (s: Sheet) => s.brows?.color ?? mixHex(s.hair.style === 'none' || s.hair.style === 'covered' ? mixHex(s.skin, '#3a2420', 0.7) : s.hair.color, '#2a1a1c', 0.25)

/** The outline of the head: a round skull over cheeks that are fuller the younger the character is. */
export function headPath(g: Rig, turn = 0): Path2D {
  const R = g.headRx
  const Ry = g.headRy
  const j = g.jaw
  const p = new Path2D()
  const cx = turn * R * 0.06
  p.moveTo(0, -Ry)
  p.bezierCurveTo(R * 0.64, -Ry, R, -Ry * 0.62, R, -Ry * 0.06)
  p.bezierCurveTo(R * (1.02 - 0.03 * j), Ry * (0.56 - 0.14 * j), R * (0.68 - 0.2 * j) + cx, Ry, cx, Ry)
  p.bezierCurveTo(-R * (0.68 - 0.2 * j) + cx, Ry, -R * (1.02 - 0.03 * j), Ry * (0.56 - 0.14 * j), -R, -Ry * 0.06)
  p.bezierCurveTo(-R, -Ry * 0.62, -R * 0.64, -Ry, 0, -Ry)
  p.closePath()
  return p
}

type HairCtx = { P: Painter; s: Sheet; g: Rig; p: Pose; R: number; Ry: number; fx: number; hc: string; hl: string }

/** A cap of hair over the skull: from temple to temple over the crown, closed along `line` (the hairline, left to right as x,y pairs). */
function cap(h: HairCtx, side: number, line: number[], lift = 1.07): Path2D {
  const { R, Ry } = h
  const p = new Path2D()
  p.moveTo(-R * 1.05, side)
  p.bezierCurveTo(-R * 1.16, -Ry * 0.66, -R * 0.66, -Ry * lift, 0, -Ry * lift)
  p.bezierCurveTo(R * 0.66, -Ry * lift, R * 1.16, -Ry * 0.66, R * 1.05, side)
  for (let i = 0; i < line.length; i += 4) p.quadraticCurveTo(line[i], line[i + 1], line[i + 2], line[i + 3])
  p.closePath()
  return p
}

/** A braid or tail: a tapering chain of lozenges from (x0, y0), hanging by `ang` from straight down. */
function braid(h: HairCtx, x0: number, y0: number, len: number, w: number, ang: number, n: number, tie?: string) {
  const { P } = h
  const c = P.ctx
  c.save()
  c.translate(x0, y0)
  c.rotate(ang)
  const step = len / n
  const parts: Path2D[] = []
  for (let i = 0; i < n; i++) {
    const k = 1 - (i / n) * 0.4
    parts.push(ellipse(((i % 2) - 0.5) * w * 0.18, step * (i + 0.5), (w / 2) * k, step * 0.66, ((i % 2) - 0.5) * 0.5))
  }
  P.group(parts, h.hc, { shade: 0.5 })
  if (tie) {
    P.shape(ellipse(0, len - step * 0.12, w * 0.32, step * 0.2), tie, { shade: 0.3 })
    P.shape(blob([-w * 0.24, len, w * 0.24, len, w * 0.34, len + step * 0.62, 0, len + step * 0.8, -w * 0.34, len + step * 0.62]), h.hc, { shade: 0.4 })
  }
  c.restore()
}

function hairCtx(P: Painter, s: Sheet, g: Rig, p: Pose): HairCtx {
  return { P, s, g, p, R: g.headRx, Ry: g.headRy, fx: p.turn * g.headRx * 0.34, hc: s.hair.color, hl: mixHex(s.hair.color, '#fff1d8', 0.26) }
}

/** Hair (or cloth) that hangs behind the head and shoulders. Drawn before the body. */
export function drawHairBack(P: Painter, s: Sheet, g: Rig, p: Pose, back: boolean) {
  const h = hairCtx(P, s, g, p)
  const { R, Ry } = h
  const sw = p.swing * R * 0.5
  const style = s.hair.style
  if (style === 'long') {
    const b = Ry * 2.25
    P.shape(blob([-R * 1.2, -Ry * 0.5, -R * 1.34, Ry * 0.9, -R * 1.2 + sw, b, -R * 0.3 + sw, b + Ry * 0.14, R * 0.3 + sw, b + Ry * 0.14, R * 1.2 + sw, b, R * 1.34, Ry * 0.9, R * 1.2, -Ry * 0.5, 0, -Ry * 1.2]), h.hc)
  } else if (style === 'bob') {
    P.shape(blob([-R * 1.22, -Ry * 0.6, -R * 1.34, Ry * 0.5, -R * 1.08 + sw * 0.4, Ry * 1.02, 0, Ry * 0.9, R * 1.08 + sw * 0.4, Ry * 1.02, R * 1.34, Ry * 0.5, R * 1.22, -Ry * 0.6, 0, -Ry * 1.24]), h.hc)
  } else if (style === 'covered') {
    const cc = s.hair.cover ?? s.hair.color
    const b = Ry * 1.2 + g.neck * 0.9
    P.shape(blob([-R * 1.16, -Ry * 0.4, -R * 1.3, Ry * 0.8, -g.shW * 1.02, b, 0, b + Ry * 0.3, g.shW * 1.02, b, R * 1.3, Ry * 0.8, R * 1.16, -Ry * 0.4, 0, -Ry * 1.24]), cc)
  } else if (style === 'ponytail' && !back) {
    const c = P.ctx
    c.save()
    c.translate(R * 0.62, -Ry * 0.86)
    c.rotate(-0.5 + p.swing * 0.8 - p.turn * 0.2)
    P.shape(blob([-R * 0.2, -R * 0.1, R * 0.5, -R * 0.42, R * 1.2, -R * 0.12, R * 1.36, R * 0.6, R * 1.0, R * 1.24, R * 0.62, R * 0.74, R * 0.2, R * 0.3]), h.hc)
    P.detail(curve([R * 0.3, -R * 0.06, R * 0.9, R * 0.1, R * 1.02, R * 0.84]), h.hc, 0.7)
    c.restore()
  } else if (style === 'bun' && !back) {
    P.shape(circle(p.turn * -R * 0.1, -Ry * 1.18, R * 0.44), h.hc)
  } else if (style === 'curls') {
    const r = seededList(31, 24)
    const parts: Path2D[] = []
    for (let i = 0; i < 11; i++) {
      const a = Math.PI * (0.94 + (i / 10) * 1.12)
      parts.push(circle(Math.cos(a) * R * 1.02, Math.sin(a) * Ry * 0.98 + Ry * 0.02, R * (0.3 + r[i] * 0.1)))
    }
    P.group(parts, h.hc, { shade: 0.6 })
  } else if (style === 'braids' && !back) {
    P.shape(blob([-R * 1.12, -Ry * 0.5, -R * 1.16, Ry * 0.5, -R * 0.7, Ry * 0.86, R * 0.7, Ry * 0.86, R * 1.16, Ry * 0.5, R * 1.12, -Ry * 0.5, 0, -Ry * 1.2]), h.hc)
  } else if (style === 'short' || style === 'tuft') {
    if (!back) P.shape(cap(h, -Ry * 0.02, [R * 0.6, Ry * 0.3, 0, Ry * 0.3, -R * 0.6, Ry * 0.3, -R * 1.05, -Ry * 0.02], style === 'tuft' ? 1.03 : 1.08), h.hc)
  }
}

/** Hair that lies over the forehead and in front of the ears; hat and headscarf. Drawn after the face. */
export function drawHairFront(P: Painter, s: Sheet, g: Rig, p: Pose, back: boolean) {
  const h = hairCtx(P, s, g, p)
  const { R, Ry, fx } = h
  const c = P.ctx
  const style = s.hair.style
  const t = p.turn
  const line = Ry * (g.eyeY - 0.62) // hairline height on the forehead
  const tie = s.top.trim ?? mixHex(s.top.color, '#ffffff', 0.3)

  if (back) {
    // seen from behind: hair (or cloth) covers the whole head
    if (style === 'none' || style === 'tuft') {
      if (style === 'tuft') P.shape(blob([-R * 0.2, -Ry * 0.98, 0, -Ry * 1.34, R * 0.26, -Ry * 1.0]), h.hc, { shade: 0.4 })
      return
    }
    const cc = style === 'covered' ? (s.hair.cover ?? h.hc) : h.hc
    const low = style === 'short' ? Ry * 0.5 : Ry * 0.96
    P.shape(cap(h, low * 0.6, [R * 0.8, low * 1.06, 0, low * 1.1, -R * 0.8, low * 1.06, -R * 1.05, low * 0.6]), cc)
    if (style === 'covered') return
    P.detail(curve([-R * 0.3, -Ry * 0.8, -R * 0.4, -Ry * 0.1, -R * 0.24, low * 0.8]), h.hc, 0.7)
    P.detail(curve([R * 0.34, -Ry * 0.76, R * 0.46, -Ry * 0.1, R * 0.3, low * 0.8]), h.hc, 0.7)
    if (style === 'braids') {
      braid(h, -R * 0.5, Ry * 0.6, Ry * 1.7, R * 0.42, 0.08 + p.swing, 4, tie)
      braid(h, R * 0.5, Ry * 0.6, Ry * 1.7, R * 0.42, -0.08 + p.swing, 4, tie)
    } else if (style === 'ponytail') {
      P.shape(ellipse(0, -Ry * 0.3, R * 0.2, Ry * 0.12), tie, { shade: 0.3 })
      braid(h, 0, -Ry * 0.3, Ry * 1.9, R * 0.62, p.swing * 1.4, 3)
    } else if (style === 'bun') {
      P.shape(circle(0, -Ry * 0.72, R * 0.46), h.hc)
    } else if (style === 'curls') {
      const r = seededList(32, 20)
      const parts: Path2D[] = []
      for (let i = 0; i < 9; i++) parts.push(circle((r[i] - 0.5) * R * 1.5, -Ry * 0.5 + r[i + 9] * Ry * 1.1, R * 0.3))
      P.group(parts, h.hc, { shade: 0.5 })
    }
    return
  }

  switch (style) {
    case 'none':
      break
    case 'tuft': {
      // thin baby hair and one curl standing up
      P.shape(cap(h, line - Ry * 0.24, [R * 0.7, line - Ry * 0.44, fx * 0.4, line - Ry * 0.5, -R * 0.7, line - Ry * 0.44, -R * 1.05, line - Ry * 0.24], 1.03), h.hc, { shade: 0.5 })
      P.shape(blob([-R * 0.16 + fx * 0.3, -Ry * 0.98, -R * 0.2, -Ry * 1.3, R * 0.12, -Ry * 1.42, R * 0.4, -Ry * 1.22, R * 0.18, -Ry * 1.1, R * 0.2 + fx * 0.3, -Ry * 0.98]), h.hc, { shade: 0.4 })
      break
    }
    case 'short': {
      P.shape(cap(h, line + Ry * 0.3, [R * 0.96, line + Ry * 0.06, R * 0.8, line + Ry * 0.02, R * 0.3 + fx * 0.5, line - Ry * 0.2, -R * 0.34 + fx * 0.5, line + Ry * 0.04, -R * 0.74, line + Ry * 0.14, -R * 0.86, line + Ry * 0.02, -R * 0.98, line + Ry * 0.08, -R * 1.05, line + Ry * 0.3]), h.hc)
      P.detail(curve([-R * 0.3 + fx * 0.5, line - Ry * 0.02, R * 0.1, -Ry * 0.86, R * 0.66, -Ry * 0.74]), h.hc, 0.7)
      break
    }
    case 'curls': {
      const r = seededList(33, 24)
      const parts: Path2D[] = []
      for (let i = 0; i < 7; i++) parts.push(circle(-R * 0.84 + (i / 6) * R * 1.68 + fx * 0.3, line - Ry * 0.16 - Math.sin((i / 6) * Math.PI) * Ry * 0.2 + (r[i] - 0.5) * R * 0.1, R * (0.27 + r[i + 7] * 0.07)))
      for (let i = 0; i < 5; i++) parts.push(circle(-R * 0.56 + (i / 4) * R * 1.12, -Ry * 0.86 + (r[i + 14] - 0.5) * R * 0.1, R * 0.3))
      P.group(parts, h.hc, { shade: 0.6 })
      break
    }
    case 'bob': {
      // a straight fringe, and hair down both cheeks to the jaw
      P.shape(cap(h, Ry * 0.62, [R * 1.0, Ry * 0.9, R * 0.74, Ry * 0.66, R * 0.8, line + Ry * 0.3, R * 0.74, line + Ry * 0.1, R * 0.4 + fx * 0.4, line + Ry * 0.16, fx * 0.4, line + Ry * 0.1, -R * 0.4 + fx * 0.4, line + Ry * 0.16, -R * 0.74, line + Ry * 0.1, -R * 0.8, line + Ry * 0.3, -R * 0.74, Ry * 0.66, -R * 1.0, Ry * 0.9, -R * 1.05, Ry * 0.62]), h.hc)
      P.detail(curve([-R * 0.2, -Ry * 0.96, -R * 0.36 + fx * 0.4, line - Ry * 0.3, -R * 0.3 + fx * 0.4, line + Ry * 0.08]), h.hc, 0.7)
      P.detail(curve([R * 0.24, -Ry * 0.94, R * 0.4 + fx * 0.4, line - Ry * 0.3, R * 0.32 + fx * 0.4, line + Ry * 0.08]), h.hc, 0.7)
      break
    }
    case 'long': {
      // a side parting, one sweep across the forehead, a lock down each cheek
      P.shape(cap(h, Ry * 0.7, [R * 1.0, Ry * 0.98, R * 0.8, Ry * 0.7, R * 0.84, line + Ry * 0.3, R * 0.7, line + Ry * 0.06, R * 0.2 + fx * 0.4, line + Ry * 0.14, -R * 0.4 + fx * 0.4, line - Ry * 0.3, -R * 0.66, line + Ry * 0.06, -R * 0.84, line + Ry * 0.3, -R * 0.8, Ry * 0.7, -R * 1.0, Ry * 0.98, -R * 1.05, Ry * 0.7]), h.hc)
      P.detail(curve([-R * 0.4 + fx * 0.4, line - Ry * 0.28, R * 0.3, line - Ry * 0.16, R * 0.7, line + Ry * 0.04]), h.hc, 0.7)
      break
    }
    case 'braids': {
      // a centre parting, then a braid over each shoulder
      P.shape(cap(h, line + Ry * 0.5, [R * 0.9, line + Ry * 0.3, R * 0.7, line + Ry * 0.14, R * 0.3 + fx * 0.3, line + Ry * 0.02, fx * 0.5, line - Ry * 0.3, -R * 0.3 + fx * 0.3, line + Ry * 0.02, -R * 0.7, line + Ry * 0.14, -R * 0.9, line + Ry * 0.3, -R * 1.05, line + Ry * 0.5]), h.hc)
      P.detail(curve([fx * 0.5, line - Ry * 0.28, fx * 0.2, -Ry * 1.02]), h.hc, 0.7)
      braid(h, -R * 0.98, Ry * 0.3, Ry * 1.9, R * 0.44, 0.1 + p.swing, 5, tie)
      braid(h, R * 0.98, Ry * 0.3, Ry * 1.9, R * 0.44, -0.1 + p.swing, 5, tie)
      break
    }
    case 'ponytail':
    case 'bun': {
      // pulled back smooth off the forehead
      P.shape(cap(h, line + Ry * 0.34, [R * 0.9, line + Ry * 0.1, R * 0.62, line - Ry * 0.02, R * 0.3 + fx * 0.3, line - Ry * 0.16, fx * 0.3, line - Ry * 0.2, -R * 0.3 + fx * 0.3, line - Ry * 0.16, -R * 0.62, line - Ry * 0.02, -R * 0.9, line + Ry * 0.1, -R * 1.05, line + Ry * 0.34]), h.hc)
      P.detail(curve([-R * 0.5, line - Ry * 0.1, -R * 0.2, -Ry * 0.9, R * 0.3, -Ry * 1.0]), h.hc, 0.7)
      if (style === 'ponytail') P.shape(ellipse(R * 0.6, -Ry * 0.88, R * 0.16, R * 0.1, -0.6), tie, { shade: 0.3 })
      break
    }
    case 'covered': {
      // the wrap round the face: its shadowed inner edge and one fold
      const cc = s.hair.cover ?? h.hc
      P.detail(curve([-R * 0.62 + fx * 0.3, -Ry * 0.62, -R * 0.2 + fx * 0.3, -Ry * 0.84, R * 0.5 + fx * 0.3, -Ry * 0.66]), cc, 0.8)
      P.detail(curve([-R * 0.9, Ry * 0.5, -R * 0.5, Ry * 1.06, R * 0.2, Ry * 1.2]), cc, 0.8)
      break
    }
  }

  if (s.extras?.includes('hat')) {
    const hat = s.extraColors?.hat ?? '#e7c583'
    const y = -Ry * 0.56
    P.shape(blob([-R * 0.98, y, -R * 0.94, -Ry * 1.12, -R * 0.5, -Ry * 1.42, R * 0.5, -Ry * 1.42, R * 0.94, -Ry * 1.12, R * 0.98, y]), hat)
    P.shape(blob([-R * 0.99, y - Ry * 0.02, -R * 0.97, y - Ry * 0.22, 0, y - Ry * 0.3, R * 0.97, y - Ry * 0.22, R * 0.99, y - Ry * 0.02, 0, y - Ry * 0.08]), s.top.trim ?? mixHex(hat, '#8a4a3a', 0.6), { shade: 0.4, line: 0.6 })
    P.shape(ellipse(t * R * 0.1, y + Ry * 0.02, R * 1.62, Ry * 0.25, t * 0.04), hat)
    void c
  }
}

/** Ears, skull and the whole face. `back`: seen from behind (no face). */
export function drawHead(P: Painter, s: Sheet, g: Rig, p: Pose, back: boolean) {
  const R = g.headRx
  const Ry = g.headRy
  const covered = s.hair.style === 'covered'
  const ey0 = g.eyeY * Ry
  const earY = ey0 + R * 0.1
  const hidesEars = covered || s.hair.style === 'bob' || s.hair.style === 'long'
  if (!hidesEars || back) {
    for (const side of [-1, 1]) {
      if (!back && side * p.turn > 0.55) continue
      const ex = side * R * (1.0 - Math.max(0, side * p.turn) * 0.2)
      P.shape(ellipse(ex, earY, R * 0.17, R * 0.21), s.skin, { shade: 0.4 })
      if (!back) P.flat(ellipse(ex - side * R * 0.02, earY + R * 0.02, R * 0.08, R * 0.11), mixHex(s.skin, blushOf(s), 0.5), 0.8)
    }
  }
  if (covered && !back) {
    // the headscarf, then the face showing through its opening
    const cc = s.hair.cover ?? s.hair.color
    const hood = new Path2D()
    hood.moveTo(0, -Ry * 1.12)
    hood.bezierCurveTo(R * 0.8, -Ry * 1.12, R * 1.2, -Ry * 0.6, R * 1.16, 0)
    hood.bezierCurveTo(R * 1.14, Ry * 0.7, R * 0.7, Ry * 1.24, 0, Ry * 1.28)
    hood.bezierCurveTo(-R * 0.7, Ry * 1.24, -R * 1.14, Ry * 0.7, -R * 1.16, 0)
    hood.bezierCurveTo(-R * 1.2, -Ry * 0.6, -R * 0.8, -Ry * 1.12, 0, -Ry * 1.12)
    P.shape(hood, cc)
    const fx = p.turn * R * 0.2
    const face = new Path2D()
    face.moveTo(fx, -Ry * 0.7)
    face.bezierCurveTo(R * 0.7 + fx, -Ry * 0.7, R * 0.88 + fx, -Ry * 0.2, R * 0.86 + fx, Ry * 0.2)
    face.bezierCurveTo(R * 0.84 + fx, Ry * 0.7, R * 0.4 + fx, Ry * 0.96, fx, Ry * 0.96)
    face.bezierCurveTo(-R * 0.4 + fx, Ry * 0.96, -R * 0.84 + fx, Ry * 0.7, -R * 0.86 + fx, Ry * 0.2)
    face.bezierCurveTo(-R * 0.88 + fx, -Ry * 0.2, -R * 0.7 + fx, -Ry * 0.7, fx, -Ry * 0.7)
    P.shape(face, s.skin, { ink: mixHex(cc, '#2a1a2a', 0.5), shade: 0.8 })
    drawFace(P, s, g, p, 0.86)
    return
  }
  P.shape(headPath(g, back ? 0 : p.turn), s.skin, { shade: 1.2 })
  if (!back) drawFace(P, s, g, p, 1)
}

function drawFace(P: Painter, s: Sheet, g: Rig, p: Pose, fit: number) {
  const c = P.ctx
  const R = g.headRx * fit
  const Ry = g.headRy
  const px = P.style.proportions
  const young = g.stage === 'toddler' || g.stage === 'child'
  const fx = p.turn * g.headRx * 0.34 * fit
  const nod = p.nod * Ry * 0.13 + p.pitch * Ry * 0.26
  const ey = g.eyeY * Ry + nod
  const gap = R * 0.44 * (1 - 0.1 * Math.abs(p.turn))
  const eh = R * (0.155 + 0.075 * s.eyes.size) * px.eyes * (1 + 0.2 * p.wide)
  const ew = eh * 0.9
  const skinInk = mixHex(s.skin, '#7a3b30', 0.55)
  const lid = mixHex(s.skin, skinInk, 0.2)
  const lash = mixHex(browOf(s), '#24161a', 0.6)
  const smile = Math.max(0, p.smile)
  const lw = Math.max(1.1, R * 0.05)

  // cheeks: colour that lifts with a smile
  const blush = blushOf(s)
  const chY = ey + eh + R * 0.2 - (p.cheek * 0.5 + smile * 0.3) * R * 0.09
  for (const side of [-1, 1]) P.flat(ellipse(fx + side * (gap + R * 0.24), chY, R * 0.21 * px.cheeks, R * 0.15 * px.cheeks), blush, Math.min(0.9, 0.42 + 0.4 * p.flush + 0.12 * smile))
  if (s.extras?.includes('freckles')) {
    for (const side of [-1, 1]) for (const [dx, dy] of [[0.1, -0.06], [0.24, 0.0], [0.17, 0.06], [0.32, -0.07]]) P.flat(circle(fx + side * (gap * 0.6 + R * dx), chY - R * 0.08 + R * dy, R * 0.022), skinInk, 0.7)
  }

  // eyes
  const arcs = p.blink > 0.82 || (p.cheek > 0.9 && p.smile > 0.5 && p.wide < 0.3)
  for (const side of [-1, 1]) {
    const cx = fx + side * gap
    if (arcs) {
      const q = new Path2D()
      if (p.blink > 0.82) {
        q.moveTo(cx - ew * 1.05, ey + eh * 0.05)
        q.quadraticCurveTo(cx, ey + eh * 0.95, cx + ew * 1.05, ey + eh * 0.05)
      } else {
        q.moveTo(cx - ew * 1.05, ey + eh * 0.4)
        q.quadraticCurveTo(cx, ey - eh * 1.0, cx + ew * 1.05, ey + eh * 0.4)
      }
      P.line(q, lash, lw * 1.35)
      continue
    }
    const eye = ellipse(cx, ey, ew, eh)
    P.flat(eye, WHITE)
    const upper = clamp01(p.lids * 0.62 + p.blink)
    const lower = clamp01(p.cheek * 0.42)
    const ir = eh * 0.76
    const ix = cx + p.lookX * (ew - ir * 0.72) + p.turn * ew * 0.12
    const iy = ey + p.lookY * eh * 0.3 + (upper - lower) * eh * 0.18
    c.save()
    c.clip(eye)
    P.flat(circle(ix, iy, ir), mixHex(s.eyes.color, '#20130f', 0.38))
    P.flat(circle(ix, iy, ir * 0.56), '#1c1210')
    P.flat(circle(ix - ir * 0.36, iy - ir * 0.4, ir * 0.3), '#ffffff')
    P.flat(circle(ix + ir * 0.34, iy + ir * 0.36, ir * 0.13), '#ffffff', 0.7)
    // lids are skin closing over the eye
    const ly = ey - eh + 2 * eh * upper
    if (upper > 0.02) {
      const q = new Path2D()
      q.moveTo(cx - ew * 1.2, ey - eh * 1.3)
      q.lineTo(cx + ew * 1.2, ey - eh * 1.3)
      q.lineTo(cx + ew * 1.2, ly - eh * 0.1)
      q.quadraticCurveTo(cx, ly + eh * 0.22, cx - ew * 1.2, ly - eh * 0.1)
      q.closePath()
      P.flat(q, lid)
    }
    if (lower > 0.02) {
      const by = ey + eh - 2 * eh * lower
      const q = new Path2D()
      q.moveTo(cx - ew * 1.2, ey + eh * 1.3)
      q.lineTo(cx + ew * 1.2, ey + eh * 1.3)
      q.lineTo(cx + ew * 1.2, by + eh * 0.2)
      q.quadraticCurveTo(cx, by - eh * 0.34, cx - ew * 1.2, by + eh * 0.2)
      q.closePath()
      P.flat(q, s.skin)
      const e2 = new Path2D()
      e2.moveTo(cx - ew, by + eh * 0.14)
      e2.quadraticCurveTo(cx, by - eh * 0.3, cx + ew, by + eh * 0.14)
      P.line(e2, skinInk, lw * 0.7)
    }
    if (upper > 0.02) {
      const e2 = new Path2D()
      e2.moveTo(cx - ew * 1.1, ly - eh * 0.08)
      e2.quadraticCurveTo(cx, ly + eh * 0.2, cx + ew * 1.1, ly - eh * 0.08)
      P.line(e2, lash, lw * 1.5)
    }
    c.restore()
    // the drawn upper lash line, and a faint lower rim
    const top = new Path2D()
    top.ellipse(cx, ey, ew, eh, 0, Math.PI * 1.06, Math.PI * 1.94)
    P.line(top, lash, lw * 1.3)
    const bot = new Path2D()
    bot.ellipse(cx, ey, ew, eh, 0, Math.PI * 0.14, Math.PI * 0.86)
    P.line(bot, skinInk, lw * 0.5, 0.7)
  }

  // brows: the strongest signal of feeling after the mouth
  const bw = R * (0.042 + 0.036 * (s.brows?.weight ?? 0.5))
  for (const side of [-1, 1]) {
    const cx = fx + side * gap
    const by = ey - eh * (arcs ? 0.8 : 1) - R * 0.13 - p.brow * R * 0.11
    const half = R * 0.21
    const q = new Path2D()
    q.moveTo(cx - side * half * 0.95, by - p.browTilt * R * 0.1)
    q.quadraticCurveTo(cx + side * half * 0.1, by - R * 0.06 - Math.max(0, p.brow) * R * 0.04 - Math.max(0, p.browTilt) * R * 0.02, cx + side * half * 1.1, by + p.browTilt * R * 0.07 + R * 0.025)
    P.line(q, browOf(s), bw)
  }

  // nose
  const nx = fx + p.turn * R * 0.12
  const ny = ey + eh * 0.55 + R * (young ? 0.17 : 0.24)
  const d = p.turn < 0 ? -1 : 1
  const nose = new Path2D()
  if (young) {
    const k = R * 0.065
    nose.moveTo(nx - k, ny - k * 0.5)
    nose.quadraticCurveTo(nx, ny + k * 0.9, nx + k, ny - k * 0.5)
  } else {
    nose.moveTo(nx - d * R * 0.02, ny - R * 0.2)
    nose.quadraticCurveTo(nx + d * R * 0.13, ny + R * 0.02, nx + d * R * 0.01, ny + R * 0.035)
    nose.quadraticCurveTo(nx - d * R * 0.05, ny + R * 0.04, nx - d * R * 0.07, ny + R * 0.01)
  }
  P.line(nose, skinInk, lw * 0.95)

  // an elder's lines: by the eyes and beside the mouth
  if (g.stage === 'elder') {
    for (const side of [-1, 1]) {
      const ox = fx + side * (gap + ew * 1.25)
      P.line(curve([ox, ey - eh * 0.3, ox + side * R * 0.08, ey - eh * 0.5]), skinInk, lw * 0.6, 0.75)
      P.line(curve([ox, ey + eh * 0.2, ox + side * R * 0.09, ey + eh * 0.3]), skinInk, lw * 0.6, 0.75)
      P.line(curve([fx + side * R * 0.3, ny, fx + side * R * 0.4, ny + R * 0.14, fx + side * R * 0.36, ny + R * 0.26]), skinInk, lw * 0.6, 0.6)
    }
  }

  // mouth
  const mx = fx + p.turn * R * 0.08
  const my = Math.min(Ry * 0.74, ey + eh * 0.55 + R * (young ? 0.42 : 0.5)) + nod * 0.2
  const hairC = s.hair.style === 'none' || s.hair.style === 'covered' ? mixHex(s.skin, '#3a2420', 0.75) : s.hair.color
  if (s.extras?.includes('beard')) {
    const b = new Path2D()
    b.moveTo(fx - R * 0.86, ey + R * 0.2)
    b.bezierCurveTo(fx - R * 0.9, Ry * 0.9, fx - R * 0.4, Ry * 1.24, mx, Ry * 1.26)
    b.bezierCurveTo(fx + R * 0.4, Ry * 1.24, fx + R * 0.9, Ry * 0.9, fx + R * 0.86, ey + R * 0.2)
    b.quadraticCurveTo(fx + R * 0.62, my - R * 0.22, mx + R * 0.3, my - R * 0.14)
    b.quadraticCurveTo(mx, my - R * 0.24, mx - R * 0.3, my - R * 0.14)
    b.quadraticCurveTo(fx - R * 0.62, my - R * 0.22, fx - R * 0.86, ey + R * 0.2)
    P.shape(b, hairC, { shade: 0.8 })
  }
  const w = R * (0.13 + 0.17 * p.mWide) * (1 + 0.16 * smile)
  const s2 = p.smile
  const mouthInk = mixHex(MOUTH, skinInk, 0.25)
  if (p.open < 0.06) {
    const up = s2 * w * 0.42
    const q = p.wob > 0.05
      ? curve([mx - w, my - up, mx - w * 0.5, my + s2 * w * 0.3 + p.wob * R * 0.05, mx, my + s2 * w * 0.5 - p.wob * R * 0.03, mx + w * 0.5, my + s2 * w * 0.3 + p.wob * R * 0.05, mx + w, my - up])
      : curve([mx - w, my - up, mx, my + s2 * w * 0.78, mx + w, my - up])
    P.line(q, mouthInk, lw * 1.25)
    if (s2 > 0.6) {
      for (const side of [-1, 1]) P.line(curve([mx + side * (w + R * 0.015), my - up - R * 0.045, mx + side * (w + R * 0.05), my - up + R * 0.01]), mouthInk, lw * 0.8)
    }
  } else {
    const hgt = R * (0.07 + 0.34 * p.open)
    let q: Path2D
    if (p.mWide < 0.26) q = ellipse(mx, my + hgt * 0.36, w * (0.9 + 0.5 * p.open), hgt * 0.62)
    else {
      const up = s2 * R * 0.07
      q = new Path2D()
      q.moveTo(mx - w, my - up)
      q.quadraticCurveTo(mx, my + s2 * R * 0.045, mx + w, my - up)
      q.bezierCurveTo(mx + w * 0.96, my + hgt * 1.2, mx + w * 0.2, my + hgt * 1.26, mx, my + hgt * 1.26)
      q.bezierCurveTo(mx - w * 0.2, my + hgt * 1.26, mx - w * 0.96, my + hgt * 1.2, mx - w, my - up)
      q.closePath()
    }
    P.flat(q, MOUTH)
    c.save()
    c.clip(q)
    P.flat(ellipse(mx, my + hgt * (p.mWide < 0.26 ? 0.9 : 1.2), w * 0.62, hgt * 0.5), TONGUE)
    if (p.mWide >= 0.26 && s2 > 0.25 && p.open > 0.3) {
      const teeth = new Path2D()
      teeth.rect(mx - w * (young && g.stage === 'toddler' ? 0.3 : 0.74), my - R * 0.1, w * (g.stage === 'toddler' ? 0.6 : 1.48), R * 0.1 + hgt * 0.26)
      P.flat(teeth, WHITE)
    }
    c.restore()
    P.line(q, mouthInk, lw * 1.05)
  }
  if (s.extras?.includes('moustache')) {
    const y = my - R * 0.13
    P.shape(blob([mx, y - R * 0.07, mx + R * 0.22, y - R * 0.1, mx + R * 0.44, y + R * 0.06, mx + R * 0.2, y + R * 0.07, mx, y + R * 0.02, mx - R * 0.2, y + R * 0.07, mx - R * 0.44, y + R * 0.06, mx - R * 0.22, y - R * 0.1]), hairC, { shade: 0.3, line: 0.7 })
  }

  if (s.extras?.includes('glasses')) {
    const frame = s.extraColors?.glasses ?? '#4b3040'
    const r = Math.max(eh * 1.72, R * 0.3)
    const gw = Math.max(1.4, R * 0.045)
    for (const side of [-1, 1]) {
      const lens = circle(fx + side * gap, ey + eh * 0.08, r)
      P.flat(lens, '#ffffff', 0.16)
      P.line(lens, frame, gw)
      P.line(curve([fx + side * (gap + r), ey, side * R * 0.98, ey - R * 0.04]), frame, gw * 0.9)
    }
    P.line(curve([fx - gap + r, ey - eh * 0.1, fx, ey - eh * 0.36, fx + gap - r, ey - eh * 0.1]), frame, gw)
  }
  void TAU
}
