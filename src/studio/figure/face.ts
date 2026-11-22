/**
 * The head of a figure, seen from any side: skull, ears, the acting face, every hair style in the sheet contract,
 * and what is worn on the head. Drawn in the head's own frame: origin at the head's centre, already tilted.
 *
 * The head is turned by `yaw` (0 faces us, +π/2 is a profile facing screen right, π is the back). Nothing is
 * drawn twice for different views: every feature has a place on the head, and where it lands on the picture,
 * how narrow it becomes and whether it is hidden all follow from the turn. So a head can turn smoothly from the
 * front through three-quarter view to profile and on to the back.
 */
import type { Sheet } from '@/cast/sheet'
import { Painter, Pen, blob, circle, clamp01, curve, ellipse, seededList, through } from '../kit/core'
import { mixHex } from '../style/color'
import type { Pose } from './pose'
import type { Rig } from './rig'

const WHITE = '#fffaf0'
const MOUTH = '#6e2733'
const TONGUE = '#ee8f86'

export const blushOf = (s: Sheet) => s.blush ?? mixHex(s.skin, '#e9624e', 0.42)
const browOf = (s: Sheet) => s.brows?.color ?? mixHex(s.hair.style === 'none' || s.hair.style === 'covered' ? mixHex(s.skin, '#3a2420', 0.7) : s.hair.color, '#2a1a1c', 0.25)
const smooth = (a: number, b: number, v: number) => {
  const u = clamp01((v - a) / (b - a))
  return u * u * (3 - 2 * u)
}

/** The head as it is turned: where a place on it lands, and how much of it we see. */
type View = {
  yaw: number
  s: number
  c: number
  /** +1 when the head faces screen right, −1 when it faces left. */
  f: number
  R: number
  Ry: number
  Rz: number
  /** Half-width of the skull on the picture. */
  W: number
  /** Where a place on the head (X to the character's left, Z forward, in head radii) lands sideways, and its depth. */
  x: (X: number, Z: number) => number
  d: (X: number, Z: number) => number
  /** How wide something lying on the head's surface at that place is drawn, 0 (turned away) … 1 (facing us). */
  w: (X: number, Z: number) => number
}
function viewOf(g: Rig, yaw: number): View {
  const s = Math.sin(yaw)
  const c = Math.cos(yaw)
  const R = g.headRx
  const Rz = g.headRz
  return {
    yaw, s, c, f: s < 0 ? -1 : 1, R, Ry: g.headRy, Rz,
    W: Math.hypot(R * c, Rz * s),
    x: (X, Z) => X * R * c + Z * Rz * s,
    d: (X, Z) => -X * R * s + Z * Rz * c,
    w: (X, Z) => {
      const cv = Math.cos(yaw + Math.atan2(X * R, Z * Rz))
      return smooth(-0.14, 0.3, cv) * (0.36 + 0.64 * Math.max(0, cv))
    },
  }
}

/** The outline of the head as x, y pairs: a round skull over cheeks that are fuller the younger the character is; in profile a brow, a nose and a chin. */
function skullPoints(g: Rig, v: View, grow = 1, n = 44): number[] {
  const { R, Ry, W, s } = v
  const k = Math.abs(s)
  const f = v.f
  const j = g.jaw
  const p = 0.6 + 0.3 * j
  const yEye = g.eyeY * Ry
  const yNose = yEye + R * (0.3 + 0.1 * j)
  const pts: number[] = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    const sa = Math.sin(a)
    const ca = Math.cos(a)
    let x: number
    let y: number
    if (ca >= 0) {
      x = W * sa
      y = -Ry * ca
    } else {
      // the lower half: cheeks and jaw
      x = W * Math.sign(sa) * Math.pow(Math.abs(sa), p)
      y = -Ry * ca
    }
    if (k > 0.01) {
      const front = sa * f // + on the side the face is turned to
      if (front > 0) {
        // the face in profile: forehead, the dip at the eyes, the nose, the lips, the chin
        const kk = Math.pow(k, 1.4) * Math.min(1, front * 2.2)
        x += f * kk * R * (0.07 + 0.13 * g.nose) * Math.exp(-Math.pow((y - yNose) / (Ry * 0.13), 2))
        x -= f * kk * R * 0.05 * Math.exp(-Math.pow((y - yEye + Ry * 0.06) / (Ry * 0.14), 2))
        x += f * kk * R * 0.045 * Math.exp(-Math.pow((y - Ry * 0.62) / (Ry * 0.1), 2))
        x += f * kk * R * (0.03 + 0.05 * j) * Math.exp(-Math.pow((y - Ry * 0.9) / (Ry * 0.12), 2))
        if (y > Ry * 0.3) x -= f * kk * R * 0.1 * Math.pow((y - Ry * 0.3) / (Ry * 0.7), 2)
      } else {
        // the back of the head: fuller above, tucked in toward the neck below
        const kk = k * Math.min(1, -front * 2.2)
        x -= f * kk * R * 0.1 * Math.exp(-Math.pow((y + Ry * 0.2) / (Ry * 0.55), 2))
        if (y > Ry * 0.2) x += f * kk * R * 0.34 * Math.pow((y - Ry * 0.2) / (Ry * 0.8), 1.6)
      }
    }
    pts.push(x * grow - s * R * 0.05, y * grow)
  }
  return pts
}
/** The outline of the head as a path (`grow` > 1 for what is worn over it). */
export function headPath(g: Rig, yaw = 0, grow = 1): Pen {
  return through(skullPoints(g, viewOf(g, yaw), grow))
}

type HairCtx = { P: Painter; s: Sheet; g: Rig; p: Pose; v: View; hc: string; tie: string }
function hairCtx(P: Painter, s: Sheet, g: Rig, p: Pose, yaw: number): HairCtx {
  return { P, s, g, p, v: viewOf(g, yaw), hc: s.hair.color, tie: s.top.trim ?? mixHex(s.top.color, '#ffffff', 0.3) }
}

/**
 * Where the skin of the face ends and the hair begins: the two temples, as they land in this view. A temple that
 * has turned out of sight leaves the face running to the edge of the head on that side (`openL` / `openR` → 1).
 */
function temples(v: View, tx = 0.86, tz = 0.3): { xl: number; xr: number; open: boolean; openL: number; openR: number } {
  const vis = (side: number) => smooth(-0.14 * v.R, 0.16 * v.R, v.d(side * tx, tz))
  // facing right, the character's right temple is the near one and stays on the left of the picture
  const near = v.f > 0 ? -1 : 1
  const vn = vis(near)
  const vf = vis(-near)
  const xn = v.x(near * tx, tz)
  const xf = v.x(-near * tx, tz)
  if (vn < 0.02 && vf < 0.02) return { xl: 0, xr: 0, open: false, openL: 0, openR: 0 }
  const edge = v.f * v.R * 3
  // the near temple slides round to the front edge as the head turns away, closing the face
  const a = xn + (v.f * v.W * 1.1 - xn) * (1 - vn)
  const b = xf + (edge - xf) * (1 - vf)
  return v.f > 0 ? { xl: a, xr: b, open: true, openL: 0, openR: 1 - vf } : { xl: b, xr: a, open: true, openL: 1 - vf, openR: 0 }
}

type CapOpts = {
  /** How much bigger than the skull the hair is. */
  lift: number
  /** How low the hair comes beside the face, and at the back of the head (in head half-heights from the centre). */
  temple: number
  nape: number
  /** Height of the hairline at the middle of the forehead, and its shape across (x −1…1 → extra y, in half-heights). */
  line: number
  fringe: (u: number) => number
  /** Temples: how far round the head and how far forward the hair starts. */
  tx?: number
  tz?: number
  /** How squarely the hair hangs beside the face: 2.4 = a hairline that slopes to the temples, 8 = a curtain that falls straight down each cheek. */
  hang?: number
}
/** A cap of hair over the skull, cut away where the face shows. In back views it covers the whole head. */
function cap(h: HairCtx, o: CapOpts): Pen {
  const { v } = h
  const { R, Ry } = v
  const pts = skullPoints(h.g, v, o.lift, 40)
  const n = pts.length / 2
  const t = temples(v, o.tx, o.tz)
  const backness = (k: number) => Math.max(clamp01(-k * v.s), clamp01(-v.c * 1.4))
  // beside the face the hair comes down to the temple (or the cheek); round the back to the nape; and on the side
  // the face is turned to, where there is no temple to be seen, it stops at the forehead
  const low = (k: number) => {
    const side = Ry * (o.temple + (o.nape - o.temple) * Math.pow(backness(k), 0.7))
    const openK = t.open ? (k < 0 ? t.openL : t.openR) : 0
    return side + (Ry * (o.line + 0.06) - side) * openK
  }
  const yl = low(-1)
  const yr = low(1)
  // the outer edge: over the crown from the left side to the right side
  const out: number[] = []
  let iTop = 0
  for (let i = 1; i < n; i++) if (pts[i * 2 + 1] < pts[iTop * 2 + 1]) iTop = i
  const leftSide: number[] = []
  for (let k = 0; k < n / 2 + 2; k++) {
    const i = (iTop - k + n) % n
    if (pts[i * 2 + 1] > yl) break
    leftSide.unshift(pts[i * 2], pts[i * 2 + 1])
  }
  out.push(...leftSide)
  for (let k = 1; k < n / 2 + 2; k++) {
    const i = (iTop + k) % n
    if (pts[i * 2 + 1] > yr) break
    out.push(pts[i * 2], pts[i * 2 + 1])
  }
  const ax = out[0]
  const fx = out[out.length - 2]
  const inner: number[] = []
  if (!t.open) {
    // seen from behind: the lower edge runs straight round the nape
    inner.push(fx * 0.7, yr + Ry * 0.07, (ax + fx) / 2, (yl + yr) / 2 + Ry * 0.1, ax * 0.7, yl + Ry * 0.07)
  } else {
    const xr = Math.min(t.xr, fx)
    const xl = Math.max(t.xl, ax)
    const yLine = Ry * o.line
    if (t.xr < fx - R * 0.04) inner.push(xr + (fx - xr) * 0.5, yr + Ry * 0.05, xr, yr)
    const m = 7
    const wide = Math.min(t.xr, v.W * 1.02) - Math.max(t.xl, -v.W * 1.02)
    const mid = (Math.min(t.xr, v.W * 1.02) + Math.max(t.xl, -v.W * 1.02)) / 2
    for (let i = 0; i <= m; i++) {
      const u = 1 - (i / m) * 2 // +1 at screen right … −1 at screen left
      const x = mid + (u * wide) / 2
      // the hairline drops toward the temples
      const y = yLine + Ry * o.fringe(u) + Math.pow(Math.abs(u), o.hang ?? 2.4) * (Math.min(u > 0 ? yr : yl, Ry * o.temple) - yLine) * (1 - (u > 0 ? t.openR : t.openL))
      if (x >= xl - 1e-3 && x <= xr + 1e-3) inner.push(x, y)
    }
    if (t.xl > ax + R * 0.04) inner.push(xl, yl, xl + (ax - xl) * 0.5, yl + Ry * 0.05)
  }
  return through(out.concat(inner), 0.42)
}

/** A braid or tail: a tapering chain of lozenges from (x0, y0), hanging by `ang` from straight down. */
function braid(h: HairCtx, x0: number, y0: number, len: number, w: number, ang: number, n: number, tie?: string) {
  const { P } = h
  const c = P.ctx
  c.save()
  c.translate(x0, y0)
  c.rotate(ang)
  const step = len / n
  const parts: Pen[] = []
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

/** Is the long hair (or the cloth of a headscarf) hanging behind the body in this view, or down over the back? */
export const hairBehindBody = (yaw: number) => Math.cos(yaw) > 0.3

/**
 * Hair or cloth that hangs below the head: long hair, the back of a bob, the drape of a headscarf.
 * Facing us it is drawn before the body; from the side or from behind it is drawn over the back (see `hairBehindBody`).
 */
export function drawHairHang(P: Painter, s: Sheet, g: Rig, p: Pose, yaw: number) {
  const h = hairCtx(P, s, g, p, yaw)
  const { R, Ry, s: sn, c: cs } = h.v
  const sw = p.swing * R * 0.5
  const style = s.hair.style
  const back = -sn * R // where the back of the head is on the picture
  if (style === 'long') {
    const b = Ry * 2.25
    const w = R * (1.2 - 0.36 * Math.abs(sn))
    const cx = back * 0.42
    P.shape(blob([cx - w, -Ry * 0.5, cx - w * 1.1, Ry * 0.9, cx - w + sw, b, cx - w * 0.25 + sw, b + Ry * 0.14, cx + w * 0.25 + sw, b + Ry * 0.14, cx + w + sw, b, cx + w * 1.1, Ry * 0.9, cx + w, -Ry * 0.5, cx, -Ry * 1.16]), h.hc)
    if (cs < 0.3) {
      P.detail(curve([cx - w * 0.3, Ry * 0.2, cx - w * 0.36 + sw * 0.5, b * 0.6, cx - w * 0.3 + sw, b * 0.96]), h.hc, 0.7)
      P.detail(curve([cx + w * 0.34, Ry * 0.3, cx + w * 0.4 + sw * 0.5, b * 0.6, cx + w * 0.32 + sw, b * 0.96]), h.hc, 0.7)
    }
  } else if (style === 'bob') {
    const w = R * (1.22 - 0.2 * Math.abs(sn))
    const cx = back * 0.3
    P.shape(blob([cx - w, -Ry * 0.6, cx - w * 1.1, Ry * 0.5, cx - w * 0.88 + sw * 0.4, Ry * 1.02, cx, Ry * 0.92, cx + w * 0.88 + sw * 0.4, Ry * 1.02, cx + w * 1.1, Ry * 0.5, cx + w, -Ry * 0.6, cx, -Ry * 1.22]), h.hc)
  } else if (style === 'covered') {
    // the cloth falls from the head over the neck to the shoulders
    const cc = s.hair.cover ?? s.hair.color
    const b = Ry * 1.2 + g.neck * 0.9
    const w = Math.hypot(g.shW * 1.02 * cs, g.chestD * 1.12 * sn)
    const wt = Math.hypot(R * 1.16 * cs, g.headRz * 1.1 * sn)
    const cx = back * 0.02
    P.shape(blob([cx - wt, -Ry * 0.4, cx - wt * 1.1, Ry * 0.8, cx - w, b, cx, b + Ry * 0.3, cx + w, b, cx + wt * 1.1, Ry * 0.8, cx + wt, -Ry * 0.4, cx, -Ry * 1.2]), cc)
  }
}

/** What sits behind the skull in this view (drawn before it): a ponytail, a bun, the far braid, the fluff of curls. */
function hairUnder(h: HairCtx) {
  const { P, s, p, v } = h
  const { R, Ry } = v
  const style = s.hair.style
  if (style === 'ponytail' && v.d(0.3, -0.9) < 0) tail(h)
  if (style === 'bun' && v.d(0, -0.45) < 0) P.shape(circle(v.x(0, -0.45), -Ry * 1.12, R * 0.44), h.hc)
  if (style === 'curls') {
    const r = seededList(31, 24)
    const parts: Pen[] = []
    for (let i = 0; i < 12; i++) {
      const a = Math.PI * (0.92 + (i / 11) * 1.16)
      parts.push(circle(Math.cos(a) * v.W * 1.03 - v.s * R * 0.08, Math.sin(a) * Ry * 0.98 + Ry * 0.02, R * (0.3 + r[i] * 0.1)))
    }
    P.group(parts, h.hc, { shade: 0.6 })
  }
  void p
}
function tail(h: HairCtx) {
  const { P, p, v } = h
  const { R, Ry } = v
  const c = P.ctx
  // the tail springs from high on the back of the head and falls away from the face
  const ax = v.x(0.3, -0.9)
  const dir = v.c > 0.5 ? 1 : -v.f
  c.save()
  c.translate(ax, -Ry * 0.74)
  c.scale(dir, 1)
  c.rotate(-0.5 + (p.swing * 0.8 - p.turn * 0.2) * dir)
  P.shape(blob([-R * 0.2, -R * 0.1, R * 0.5, -R * 0.42, R * 1.2, -R * 0.12, R * 1.36, R * 0.6, R * 1.0, R * 1.24, R * 0.62, R * 0.74, R * 0.2, R * 0.3]), h.hc)
  P.detail(curve([R * 0.3, -R * 0.06, R * 0.9, R * 0.1, R * 1.02, R * 0.84]), h.hc, 0.7)
  P.shape(ellipse(R * 0.1, R * 0.02, R * 0.16, R * 0.11, -0.4), h.tie, { shade: 0.3 })
  c.restore()
}

/** Hair that lies over the skull and round the face, and what is worn: hat, glasses. Drawn after the face. */
function hairOver(h: HairCtx) {
  const { P, s, g, p, v } = h
  const { R, Ry } = v
  const style = s.hair.style
  const line = g.eyeY - 0.62 // hairline height on the forehead, in half-heights
  const t = temples(v)
  const back = !t.open
  // the middle of the forehead, as it lands in this view
  const fx = v.x(0, 0.9)

  switch (style) {
    case 'none':
    case 'covered':
      break
    case 'tuft': {
      // thin baby hair and one curl standing up
      P.shape(cap(h, { lift: 1.03, temple: line - 0.24, nape: 0.3, line: line - 0.5, fringe: () => 0 }), h.hc, { shade: 0.5 })
      P.shape(blob([-R * 0.16, -Ry * 0.98, -R * 0.2, -Ry * 1.3, R * 0.12, -Ry * 1.42, R * 0.4, -Ry * 1.22, R * 0.18, -Ry * 1.1, R * 0.2, -Ry * 0.98]), h.hc, { shade: 0.4 })
      break
    }
    case 'short': {
      P.shape(cap(h, { lift: 1.07, temple: line + 0.3, nape: 0.5, line: line - 0.1, fringe: (u) => 0.08 * Math.sin(u * 4.2 + 0.6) + 0.06 * u }), h.hc)
      if (!back && Math.abs(v.s) < 0.6) P.detail(curve([fx - R * 0.3, Ry * (line - 0.04), fx * 0.6 + R * 0.1, -Ry * 0.86, fx * 0.3 + R * 0.6, -Ry * 0.74]), h.hc, 0.7)
      break
    }
    case 'curls': {
      P.shape(cap(h, { lift: 1.05, temple: line + 0.2, nape: 0.6, line: line - 0.12, fringe: () => 0 }), h.hc, { shade: 0.6 })
      const r = seededList(33, 60)
      const parts: Pen[] = []
      // curls sit all over the hair: each has its own place on the head, so they turn with it
      for (let i = 0; i < 26; i++) {
        const lon = (r[i] - 0.5) * Math.PI * 2
        const lat = 0.12 + r[i + 26] * 1.05 // from the crown down
        const X = Math.sin(lat) * Math.sin(lon)
        const Z = Math.sin(lat) * Math.cos(lon)
        const y = -Math.cos(lat) * Ry * 1.02
        // not on the face
        if (Z > 0.5 && y > Ry * (line - 0.1)) continue
        if (v.d(X, Z) < -R * 0.25) continue
        parts.push(circle(v.x(X * 1.04, Z * 1.04), y, R * (0.25 + r[(i * 7) % 60] * 0.08)))
      }
      if (!back) for (let i = 0; i < 7; i++) {
        const u = i / 6 - 0.5
        const x = Math.max(t.xl, -v.W) + (u + 0.5) * (Math.min(t.xr, v.W) - Math.max(t.xl, -v.W))
        parts.push(circle(x, Ry * (line - 0.2) - Math.cos(u * Math.PI) * Ry * 0.16, R * (0.25 + r[i + 40] * 0.06)))
      }
      P.group(parts, h.hc, { shade: 0.6 })
      break
    }
    case 'bob': {
      // a straight fringe, and hair down both cheeks to the jaw
      P.shape(cap(h, { lift: 1.07, temple: 0.9, nape: 0.98, line: line + 0.12, fringe: (u) => 0.03 * Math.cos(u * 9), tx: 0.8, tz: 0.5, hang: 9 }), h.hc)
      if (!back && Math.abs(v.s) < 0.5) for (const k of [-0.3, 0.32]) P.detail(curve([fx * 0.4 + k * R * 0.7, -Ry * 0.95, fx + k * R, Ry * (line - 0.3), fx + k * R * 0.9, Ry * (line + 0.08)]), h.hc, 0.7)
      break
    }
    case 'long': {
      // a side parting, one sweep across the forehead, a lock down each cheek
      P.shape(cap(h, { lift: 1.07, temple: 0.98, nape: 1.0, line: line + 0.04, fringe: (u) => -0.22 * Math.exp(-Math.pow((u + 0.45) / 0.3, 2)) + 0.08 * u, tx: 0.82, tz: 0.46, hang: 8 }), h.hc)
      if (!back && Math.abs(v.s) < 0.5) P.detail(curve([fx - R * 0.38, Ry * (line - 0.24), fx + R * 0.3, Ry * (line - 0.14), fx + R * 0.66, Ry * (line + 0.06)]), h.hc, 0.7)
      break
    }
    case 'braids': {
      // a centre parting, then a braid over each shoulder
      P.shape(cap(h, { lift: 1.07, temple: line + 0.5, nape: 0.62, line: line + 0.04, fringe: (u) => -0.3 * Math.exp(-Math.pow(u / 0.22, 2)) }), h.hc)
      if (!back) P.detail(curve([fx, Ry * (line - 0.26), fx * 0.5, -Ry * 1.02]), h.hc, 0.7)
      for (const side of [-1, 1]) {
        const d = v.d(side * 0.94, 0.05)
        if (d < -R * 0.5) continue
        braid(h, v.x(side * 0.96, 0.05), Ry * 0.3, Ry * 1.9, R * 0.44, -side * 0.1 * v.c + p.swing, 5, h.tie)
      }
      break
    }
    case 'ponytail':
    case 'bun': {
      // pulled back smooth off the forehead
      P.shape(cap(h, { lift: 1.06, temple: line + 0.34, nape: 0.5, line: line - 0.16, fringe: (u) => -0.04 * Math.cos(u * 3) }), h.hc)
      if (!back && Math.abs(v.s) < 0.6) P.detail(curve([fx - R * 0.5, Ry * (line - 0.1), fx * 0.6 - R * 0.2, -Ry * 0.9, fx * 0.2 + R * 0.3, -Ry * 1.0]), h.hc, 0.7)
      else P.detail(curve([-R * 0.4, Ry * 0.2, 0, -Ry * 0.5, R * 0.4, Ry * 0.2]), h.hc, 0.7)
      if (style === 'ponytail' && v.d(0.3, -0.9) >= 0) tail(h)
      if (style === 'bun' && v.d(0, -0.45) >= 0) P.shape(circle(v.x(0, -0.45), -Ry * 0.8, R * 0.46), h.hc)
      break
    }
  }
  if (back && (style === 'short' || style === 'bob' || style === 'long' || style === 'braids')) {
    P.detail(curve([-R * 0.3, -Ry * 0.8, -R * 0.4, -Ry * 0.1, -R * 0.24, Ry * 0.4]), h.hc, 0.7)
    P.detail(curve([R * 0.34, -Ry * 0.76, R * 0.46, -Ry * 0.1, R * 0.3, Ry * 0.4]), h.hc, 0.7)
  }

  if (s.extras?.includes('hat')) {
    const hat = s.extraColors?.hat ?? '#e7c583'
    const y = -Ry * 0.56
    const w = v.W
    const cx = -v.s * R * 0.05
    P.shape(blob([cx - w * 0.98, y, cx - w * 0.94, -Ry * 1.12, cx - w * 0.5, -Ry * 1.42, cx + w * 0.5, -Ry * 1.42, cx + w * 0.94, -Ry * 1.12, cx + w * 0.98, y]), hat)
    P.shape(blob([cx - w * 0.99, y - Ry * 0.02, cx - w * 0.97, y - Ry * 0.22, cx, y - Ry * 0.3, cx + w * 0.97, y - Ry * 0.22, cx + w * 0.99, y - Ry * 0.02, cx, y - Ry * 0.08]), s.top.trim ?? mixHex(hat, '#8a4a3a', 0.6), { shade: 0.4, line: 0.6 })
    // the brim is a ring: the same from every side, a little forward of the head
    P.shape(ellipse(cx + v.s * R * 0.16, y + Ry * 0.02, R * 1.62, Ry * 0.25, v.s * 0.05), hat)
  }
}

/** Ears, skull, face and hair: the whole head in its own frame. `yaw`: which way it faces. */
export function drawHead(P: Painter, s: Sheet, g: Rig, p: Pose, yaw: number) {
  const h = hairCtx(P, s, g, p, yaw)
  const v = h.v
  const { R, Ry } = v
  const covered = s.hair.style === 'covered'
  const ey0 = g.eyeY * Ry
  const earY = ey0 + R * 0.1
  const hidesEars = covered || s.hair.style === 'bob' || s.hair.style === 'long'
  const facing = temples(v).open
  const ear = (side: number) => {
    const ex = v.x(side * 0.99, -0.12)
    const k = 0.45 + 0.55 * Math.abs(v.s)
    P.shape(ellipse(ex, earY, R * 0.17 * k + R * 0.02, R * 0.21), s.skin, { shade: 0.4 })
    if (facing) P.flat(ellipse(ex - side * v.c * R * 0.02, earY + R * 0.02, R * 0.08 * k, R * 0.11), mixHex(s.skin, blushOf(s), 0.5), 0.8)
  }
  hairUnder(h)
  // an ear on the far side shows past the edge of the head only while the head is nearly facing us (or away)
  if (!hidesEars) for (const side of [-1, 1]) if (v.d(side * 0.99, -0.12) <= R * 0.35 && Math.abs(v.s) < 0.6) ear(side)

  const skull = through(skullPoints(g, v))
  if (covered) {
    // the headscarf wraps the whole head; the face shows through its opening
    const cc = s.hair.cover ?? s.hair.color
    const hood = through(skullPoints(g, v, 1.13).map((q, i) => (i % 2 ? q + Ry * 0.06 : q)))
    P.shape(hood, cc)
    const t = temples(v, 0.8, 0.42)
    if (t.open) {
      const xl = Math.max(t.xl, -R * 2)
      const xr = Math.min(t.xr, R * 2)
      const open = new Pen()
      open.moveTo((xl + xr) / 2, -Ry * 0.72)
      open.bezierCurveTo(xr - (xr - xl) * 0.1, -Ry * 0.72, xr, -Ry * 0.3, xr, Ry * 0.16)
      open.bezierCurveTo(xr, Ry * 0.66, xr - (xr - xl) * 0.2, Ry * 0.99, (xl + xr) / 2, Ry * 0.99)
      open.bezierCurveTo(xl + (xr - xl) * 0.2, Ry * 0.99, xl, Ry * 0.66, xl, Ry * 0.16)
      open.bezierCurveTo(xl, -Ry * 0.3, xl + (xr - xl) * 0.1, -Ry * 0.72, (xl + xr) / 2, -Ry * 0.72)
      open.closePath()
      P.clip(open, () => {
        P.shape(skull, s.skin, { ink: mixHex(cc, '#2a1a2a', 0.5), shade: 1 })
        P.clip(skull, () => drawFace(P, s, g, p, v, 0.92))
      })
      // the edge of the cloth round the face, and one fold over the brow
      P.clip(hood, () => {
        P.detail(open, cc, 0.9)
        P.detail(curve([xl + (Math.min(xr, v.W) - xl) * 0.16, -Ry * 0.84, (xl + Math.min(xr, v.W)) / 2, -Ry * 0.98, Math.min(xr, v.W) - (Math.min(xr, v.W) - xl) * 0.14, -Ry * 0.86]), cc, 0.7)
      })
    } else {
      P.detail(curve([-R * 0.5, -Ry * 0.5, -R * 0.2, Ry * 0.5, -R * 0.4, Ry * 1.0]), cc, 0.7)
      P.detail(curve([R * 0.4, -Ry * 0.6, R * 0.3, Ry * 0.3, R * 0.5, Ry * 1.0]), cc, 0.7)
    }
  } else {
    P.shape(skull, s.skin, { shade: 1.2 })
    if (facing) P.clip(skull, () => drawFace(P, s, g, p, v, 1))
  }
  hairOver(h)
  // the near ear lies over the hair when the head is turned to the side
  if (!hidesEars) for (const side of [-1, 1]) if (v.d(side * 0.99, -0.12) > R * 0.35 || (Math.abs(v.s) >= 0.6 && v.d(side * 0.99, -0.12) > 0)) ear(side)
  if (facing && s.extras?.includes('glasses')) glasses(P, s, g, p, v)
}

function glasses(P: Painter, s: Sheet, g: Rig, p: Pose, v: View) {
  const { R, Ry } = v
  const px = P.style.proportions
  const frame = s.extraColors?.glasses ?? '#4b3040'
  const nod = p.nod * Ry * 0.13 + p.pitch * Ry * 0.2
  const ey = g.eyeY * Ry + nod
  const eh = R * (0.155 + 0.075 * s.eyes.size) * px.eyes
  const r = Math.max(eh * 1.72, R * 0.3)
  const gw = Math.max(1.4, R * 0.045)
  const xs: number[] = []
  for (const side of [-1, 1]) {
    const w = v.w(side * 0.44, 0.7)
    if (w < 0.08) continue
    const x = v.x(side * 0.44, 0.72)
    xs.push(x)
    const lw = r * Math.max(0.42, w)
    const lens = ellipse(x, ey + eh * 0.08, lw, r)
    P.flat(lens, '#ffffff', 0.16)
    P.line(lens, frame, gw)
    // the arm of the glasses runs back to the ear
    const ex = v.x(side * 0.99, -0.1)
    if (v.d(side * 0.99, -0.1) > -R * 0.2 && Math.abs(ex - x) > lw) P.line(curve([x + (ex > x ? lw : -lw), ey, ex, ey - R * 0.02]), frame, gw * 0.9)
  }
  if (xs.length === 2) P.line(curve([Math.min(xs[0], xs[1]) + r * 0.8, ey - eh * 0.1, (xs[0] + xs[1]) / 2, ey - eh * 0.36, Math.max(xs[0], xs[1]) - r * 0.8, ey - eh * 0.1]), frame, gw)
}

function drawFace(P: Painter, s: Sheet, g: Rig, p: Pose, v: View, fit: number) {
  const c = P.ctx
  const R = g.headRx * fit
  const Ry = g.headRy
  const px = P.style.proportions
  const young = g.stage === 'toddler' || g.stage === 'child'
  const nod = p.nod * Ry * 0.13 + p.pitch * Ry * 0.2
  const ey = g.eyeY * Ry + nod
  const eh = R * (0.155 + 0.075 * s.eyes.size) * px.eyes * (1 + 0.2 * p.wide)
  const ew0 = eh * 0.9
  const skinInk = mixHex(s.skin, '#7a3b30', 0.55)
  const lid = mixHex(s.skin, skinInk, 0.2)
  const lash = mixHex(browOf(s), '#24161a', 0.6)
  const smile = Math.max(0, p.smile)
  const lw = Math.max(1.1, R * 0.05)
  const prof = Math.abs(v.s)
  const f = v.f
  // the middle line of the face, as it lands in this view
  const fx = v.x(0, 0.9) * fit

  // cheeks: colour that lifts with a smile
  const blush = blushOf(s)
  const chY = ey + eh + R * 0.2 - (p.cheek * 0.5 + smile * 0.3) * R * 0.09
  for (const side of [-1, 1]) {
    const w = v.w(side * 0.66, 0.6)
    if (w < 0.05) continue
    const cx = v.x(side * 0.68, 0.62) * fit
    P.flat(ellipse(cx, chY, R * 0.21 * px.cheeks * Math.max(0.45, w), R * 0.15 * px.cheeks), blush, Math.min(0.9, 0.42 + 0.4 * p.flush + 0.12 * smile))
    if (s.extras?.includes('freckles')) for (const [dx, dy] of [[-0.14, -0.06], [0, 0.0], [-0.07, 0.06], [0.08, -0.07]]) P.flat(circle(cx + R * dx * w, chY - R * 0.08 + R * dy, R * 0.022), skinInk, 0.7)
  }

  // eyes
  const arcs = p.blink > 0.82 || (p.cheek > 0.9 && p.smile > 0.5 && p.wide < 0.3)
  for (const side of [-1, 1]) {
    const w = v.w(side * 0.44, 0.7)
    if (w < 0.06) continue
    const cx = v.x(side * 0.44, 0.7) * fit
    const ew = ew0 * w
    if (arcs) {
      const q = new Pen()
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
    const ir = Math.min(eh * 0.76, ew * 0.95)
    // in a turned head the eyes look the way it faces
    const ix = cx + clamp01(1 - prof * 0.4) * p.lookX * (ew - ir * 0.72) + v.s * (ew - ir * 0.6) * 0.7
    const iy = ey + p.lookY * eh * 0.3 + (upper - lower) * eh * 0.18
    c.save()
    c.clip(eye)
    P.flat(ellipse(ix, iy, ir * (0.6 + 0.4 * w), ir), mixHex(s.eyes.color, '#20130f', 0.38))
    P.flat(ellipse(ix, iy, ir * 0.56 * (0.6 + 0.4 * w), ir * 0.56), '#1c1210')
    P.flat(circle(ix - ir * 0.36 * w, iy - ir * 0.4, ir * 0.3), '#ffffff')
    P.flat(circle(ix + ir * 0.34 * w, iy + ir * 0.36, ir * 0.13), '#ffffff', 0.7)
    // lids are skin closing over the eye
    const ly = ey - eh + 2 * eh * upper
    if (upper > 0.02) {
      const q = new Pen()
      q.moveTo(cx - ew * 1.2, ey - eh * 1.3)
      q.lineTo(cx + ew * 1.2, ey - eh * 1.3)
      q.lineTo(cx + ew * 1.2, ly - eh * 0.1)
      q.quadraticCurveTo(cx, ly + eh * 0.22, cx - ew * 1.2, ly - eh * 0.1)
      q.closePath()
      P.flat(q, lid)
    }
    if (lower > 0.02) {
      const by = ey + eh - 2 * eh * lower
      const q = new Pen()
      q.moveTo(cx - ew * 1.2, ey + eh * 1.3)
      q.lineTo(cx + ew * 1.2, ey + eh * 1.3)
      q.lineTo(cx + ew * 1.2, by + eh * 0.2)
      q.quadraticCurveTo(cx, by - eh * 0.34, cx - ew * 1.2, by + eh * 0.2)
      q.closePath()
      P.flat(q, s.skin)
      const e2 = new Pen()
      e2.moveTo(cx - ew, by + eh * 0.14)
      e2.quadraticCurveTo(cx, by - eh * 0.3, cx + ew, by + eh * 0.14)
      P.line(e2, skinInk, lw * 0.7)
    }
    if (upper > 0.02) {
      const e2 = new Pen()
      e2.moveTo(cx - ew * 1.1, ly - eh * 0.08)
      e2.quadraticCurveTo(cx, ly + eh * 0.2, cx + ew * 1.1, ly - eh * 0.08)
      P.line(e2, lash, lw * 1.5)
    }
    c.restore()
    // the drawn upper lash line, and a faint lower rim
    const top = new Pen()
    top.ellipse(cx, ey, ew, eh, 0, Math.PI * 1.06, Math.PI * 1.94)
    P.line(top, lash, lw * 1.3)
    const bot = new Pen()
    bot.ellipse(cx, ey, ew, eh, 0, Math.PI * 0.14, Math.PI * 0.86)
    P.line(bot, skinInk, lw * 0.5, 0.7)
  }

  // brows: the strongest signal of feeling after the mouth
  const bw = R * (0.042 + 0.036 * (s.brows?.weight ?? 0.5))
  for (const side of [-1, 1]) {
    const w = v.w(side * 0.44, 0.74)
    if (w < 0.1) continue
    const cx = v.x(side * 0.44, 0.76) * fit
    const by = ey - eh * (arcs ? 0.8 : 1) - R * 0.13 - p.brow * R * 0.11
    const half = R * 0.21 * w
    // `inner` is the end toward the nose
    const inner = side * v.c >= 0 ? -side : f
    const sd = prof > 0.7 ? -f : side
    void inner
    const q = new Pen()
    q.moveTo(cx - sd * half * 0.95, by - p.browTilt * R * 0.1)
    q.quadraticCurveTo(cx + sd * half * 0.1, by - R * 0.06 - Math.max(0, p.brow) * R * 0.04 - Math.max(0, p.browTilt) * R * 0.02, cx + sd * half * 1.1, by + p.browTilt * R * 0.07 + R * 0.025)
    P.line(q, browOf(s), bw)
  }

  // nose: a small drawn mark facing us; in profile the outline of the head carries it
  const noseK = clamp01(1.25 - prof * 1.5)
  const ny = ey + eh * 0.55 + R * (young ? 0.17 : 0.24)
  if (noseK > 0.05) {
    const nx = fx + v.s * R * 0.14
    const d = v.s < -0.02 ? -1 : 1
    const nose = new Pen()
    if (young) {
      const k = R * 0.065
      nose.moveTo(nx - k, ny - k * 0.5)
      nose.quadraticCurveTo(nx + d * prof * k, ny + k * 0.9, nx + k, ny - k * 0.5)
    } else {
      nose.moveTo(nx - d * R * 0.02, ny - R * 0.2)
      nose.quadraticCurveTo(nx + d * R * 0.13, ny + R * 0.02, nx + d * R * 0.01, ny + R * 0.035)
      nose.quadraticCurveTo(nx - d * R * 0.05, ny + R * 0.04, nx - d * R * 0.07, ny + R * 0.01)
    }
    P.line(nose, skinInk, lw * 0.95, noseK)
  } else {
    // the nostril
    P.line(curve([fx + f * R * 0.02, ny + R * 0.04, fx + f * R * 0.07, ny + R * 0.06]), skinInk, lw * 0.8, 0.8)
  }

  // an elder's lines: by the eyes and beside the mouth
  if (g.stage === 'elder') {
    for (const side of [-1, 1]) {
      const w = v.w(side * 0.66, 0.5)
      if (w < 0.3) continue
      const ox = v.x(side * 0.66, 0.5) * fit
      const sd = prof > 0.6 ? -f : side
      P.line(curve([ox, ey - eh * 0.3, ox + sd * R * 0.08, ey - eh * 0.5]), skinInk, lw * 0.6, 0.75)
      P.line(curve([ox, ey + eh * 0.2, ox + sd * R * 0.09, ey + eh * 0.3]), skinInk, lw * 0.6, 0.75)
      const mxs = v.x(side * 0.3, 0.86) * fit
      P.line(curve([mxs, ny, mxs + sd * R * 0.1 * w, ny + R * 0.14, mxs + sd * R * 0.06 * w, ny + R * 0.26]), skinInk, lw * 0.6, 0.6)
    }
  }

  // mouth: it narrows as the head turns and runs off the edge of the face in profile
  const mK = 0.46 + 0.54 * Math.abs(v.c)
  const mx = fx - v.s * R * 0.16 * prof
  const my = Math.min(Ry * 0.74, ey + eh * 0.55 + R * (young ? 0.42 : 0.5)) + nod * 0.2
  const hairC = s.hair.style === 'none' || s.hair.style === 'covered' ? mixHex(s.skin, '#3a2420', 0.75) : s.hair.color
  if (s.extras?.includes('beard') && v.c > -0.12) {
    // from ear to ear round the chin; turned, it follows the jaw
    const t = temples(v, 0.9, 0.2)
    const xl = Math.max(t.xl, -v.W * 1.1) * fit
    const xr = Math.min(t.xr, v.W * 1.1) * fit
    const b = new Pen()
    b.moveTo(xl, ey + R * 0.2)
    b.bezierCurveTo(xl - R * 0.04, Ry * 0.9, mx - (mx - xl) * 0.5, Ry * 1.24, mx, Ry * 1.26)
    b.bezierCurveTo(mx + (xr - mx) * 0.5, Ry * 1.24, xr + R * 0.04, Ry * 0.9, xr, ey + R * 0.2)
    b.quadraticCurveTo(mx + (xr - mx) * 0.7, my - R * 0.22, mx + (xr - mx) * 0.36, my - R * 0.14)
    b.quadraticCurveTo(mx, my - R * 0.24, mx - (mx - xl) * 0.36, my - R * 0.14)
    b.quadraticCurveTo(mx - (mx - xl) * 0.7, my - R * 0.22, xl, ey + R * 0.2)
    c.restore() // the beard hangs below the chin: it is not cut to the outline of the head
    c.save()
    P.shape(b, hairC, { shade: 0.8 })
    c.restore()
    c.save()
    c.clip(through(skullPoints(g, v, 1.3)))
  }
  const w = R * (0.13 + 0.17 * p.mWide) * (1 + 0.16 * smile) * mK
  const s2 = p.smile
  const mouthInk = mixHex(MOUTH, skinInk, 0.25)
  if (p.open < 0.06) {
    const up = s2 * w * 0.42
    const q = p.wob > 0.05
      ? curve([mx - w, my - up, mx - w * 0.5, my + s2 * w * 0.3 + p.wob * R * 0.05, mx, my + s2 * w * 0.5 - p.wob * R * 0.03, mx + w * 0.5, my + s2 * w * 0.3 + p.wob * R * 0.05, mx + w, my - up])
      : curve([mx - w, my - up, mx, my + s2 * w * 0.78, mx + w, my - up])
    P.line(q, mouthInk, lw * 1.25)
    if (s2 > 0.6) {
      for (const side of [-1, 1]) if (prof < 0.6 || side !== f) P.line(curve([mx + side * (w + R * 0.015), my - up - R * 0.045, mx + side * (w + R * 0.05), my - up + R * 0.01]), mouthInk, lw * 0.8)
    }
  } else {
    const hgt = R * (0.07 + 0.34 * p.open)
    let q: Pen
    if (p.mWide < 0.26) q = ellipse(mx, my + hgt * 0.36, w * (0.9 + 0.5 * p.open), hgt * 0.62)
    else {
      const up = s2 * R * 0.07
      q = new Pen()
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
      const teeth = new Pen()
      teeth.rect(mx - w * (young && g.stage === 'toddler' ? 0.3 : 0.74), my - R * 0.1, w * (g.stage === 'toddler' ? 0.6 : 1.48), R * 0.1 + hgt * 0.26)
      P.flat(teeth, WHITE)
    }
    c.restore()
    P.line(q, mouthInk, lw * 1.05)
  }
  if (s.extras?.includes('moustache')) {
    const y = my - R * 0.13
    const k = mK
    P.shape(blob([mx, y - R * 0.07, mx + R * 0.22 * k, y - R * 0.1, mx + R * 0.44 * k, y + R * 0.06, mx + R * 0.2 * k, y + R * 0.07, mx, y + R * 0.02, mx - R * 0.2 * k, y + R * 0.07, mx - R * 0.44 * k, y + R * 0.06, mx - R * 0.22 * k, y - R * 0.1]), hairC, { shade: 0.3, line: 0.7 })
  }
}
