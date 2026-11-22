/**
 * The character builder: `drawFigure` draws any character sheet in any pose, from any side.
 *
 * Nothing here knows a particular character. Proportions come from the sheet's life stage and build, colours and
 * clothes from the sheet, the look (line, shading, exaggeration) from the Painter's style profile. The skeleton
 * (`rig.ts`) is solved in depth, so the same clothes, hair and hands are drawn facing us, in three-quarter view,
 * in profile or from behind: the body is built from cross-sections that are as wide as they look from that side,
 * and everything that lies on it (a collar, an apron, a row of buttons) is placed round it and slides out of
 * sight as the figure turns. What is nearer is drawn over what is farther.
 */
import type { Sheet } from '@/cast/sheet'
import { Painter, Pen, blob, circle, clamp01, curve, ellipse, lerp, limbPath, rrect, through, type Pt } from '../kit/core'
import { mixHex } from '../style/color'
import { drawHairHang, drawHead, hairBehindBody } from './face'
import type { Pose } from './pose'
import { axes, rigOf, solve, type P3, type Rig, type Skeleton } from './rig'

/** Draws whatever a hand holds. Called with the origin in the palm, upright; `angle` is the way the hand points. */
export type Held = (P: Painter, info: { angle: number; r: number; side: 'r' | 'l' }) => void

export type FigureOpts = {
  /** Size: 1 draws an adult of height 1.0 at 540 stage units. */
  scale?: number
  /** Things in the hands (the fingers close over them when the hand shape is a grip). */
  hold?: { r?: Held; l?: Held }
  /** 'body' leaves out the arms that pass in front, 'arms' draws only them (to put something, or someone, between body and arms). */
  pass?: 'all' | 'body' | 'arms'
  /** false = a character whose sheet has a walking stick has put it down. */
  cane?: boolean
  /** Where the tip of the walking stick stands on the ground, stage units (a walk plants it; default: straight down from the hand). */
  caneTip?: Pt
}

const sleeveEnd = (s: Sheet) => (s.top.style === 'tee' || s.top.style === 'dress' ? 0.3 : 0.95)
const underTop = (s: Sheet) => s.top.trim ?? mixHex(s.top.color, '#fff6e6', 0.62)
const sleeveColor = (s: Sheet) => (s.top.style === 'apron' ? underTop(s) : s.top.color)

function pattern(P: Painter, s: Sheet, x0: number, y0: number, x1: number, y1: number, k: number) {
  const pat = s.top.pattern
  if (!pat || pat === 'plain' || P.sil) return
  const col = s.top.trim ?? mixHex(s.top.color, '#fff6e6', 0.5)
  const step = k * 0.3
  if (pat === 'stripes') {
    for (let y = y0 + step * 0.6; y < y1; y += step) P.flat(rrect(x0, y, x1 - x0, step * 0.42, 0), col)
  } else if (pat === 'dots') {
    let row = 0
    for (let y = y0 + step * 0.5; y < y1; y += step * 0.8, row++) for (let x = x0 + (row % 2) * step * 0.5; x < x1; x += step) P.flat(circle(x, y, step * 0.17), col)
  } else {
    for (let y = y0 + step * 0.5; y < y1; y += step) P.flat(rrect(x0, y, x1 - x0, step * 0.26, 0), col, 0.75)
    for (let x = x0 + step * 0.5; x < x1; x += step) P.flat(rrect(x, y0, step * 0.26, y1 - y0, 0), col, 0.75)
  }
}

/**
 * A hand at the wrist `w`, pointing along `ang`. `thumb` says which side the thumb is on (+1 or −1) and how much
 * of it shows (0…1). The hand is a palm, a thumb with its own joint, and four fingers of four lengths that curl:
 * softly when the hand rests, round a thing when it holds, straight when it points, counts or opens.
 */
function drawHand(P: Painter, s: Sheet, g: Rig, w: Pt, ang: number, code: number, thumb: number, side: 'r' | 'l', held?: Held) {
  const c = P.ctx
  const r = g.hand
  const skin = s.skin
  const n = Math.round(code)
  const ts = thumb < 0 ? -1 : 1
  const tk = Math.min(1, Math.abs(thumb))
  if (P.sil) {
    P.flat(ellipse(w.x + Math.cos(ang) * r * 0.9, w.y + Math.sin(ang) * r * 0.9, r * 1.2, r * 0.7, ang), skin)
    held?.(P, { angle: ang, r, side })
    return
  }
  c.save()
  c.translate(w.x, w.y)
  c.rotate(ang)
  const fw = r * 0.34
  // knuckles across the hand, from the thumb side: index, middle, ring, little
  const KY = [0.45, 0.15, -0.15, -0.45].map((v) => v * ts * r)
  const LEN = [0.98, 1.1, 1.02, 0.8]
  /** One finger: `a` its direction, `len` its length (in hand units), `curl` how far its tip bends toward the little-finger side. */
  const finger = (i: number, a: number, len: number, curl: number): Pen => {
    const bx = r * 0.92
    const by = KY[i]
    const l = r * len * LEN[i]
    const mx = bx + Math.cos(a) * l * 0.52
    const my = by + Math.sin(a) * l * 0.52
    const a2 = a - ts * curl
    return limbPath({ x: bx - r * 0.2, y: by }, { x: mx, y: my }, { x: mx + Math.cos(a2) * l * 0.48, y: my + Math.sin(a2) * l * 0.48 }, fw * 1.04, fw, fw * 0.82, 0.4)
  }
  const thumbShape = (out: number, len = 1) => {
    if (tk < 0.15) return
    const bx = r * 0.18
    const by = ts * r * 0.42
    const a = ts * (0.5 + out)
    const l = r * 0.92 * len * (0.55 + 0.45 * tk)
    const mx = bx + Math.cos(a) * l * 0.55
    const my = by + Math.sin(a) * l * 0.55
    const a2 = a - ts * 0.45
    P.shape(limbPath({ x: bx, y: by }, { x: mx, y: my }, { x: mx + Math.cos(a2) * l * 0.5, y: my + Math.sin(a2) * l * 0.5 }, r * 0.46, r * 0.4, r * 0.3, 0.5), skin, { shade: 0.3, hi: 0 })
  }
  const palm = (len: number) => blob([-r * 0.28, -r * 0.5, len * 0.5, -r * 0.7, len, -r * 0.62, len + r * 0.1, 0, len, r * 0.62, len * 0.5, r * 0.7, -r * 0.28, r * 0.5])
  const fingers = (list: Pen[]) => P.group(list, skin, { shade: 0.34, hi: 0 })

  if (n === 6) {
    // a grip: the palm, the thing held, then the fingers closed over it
    P.shape(palm(r * 1.0), skin, { shade: 0.6 })
    c.restore()
    if (held) {
      c.save()
      c.translate(w.x + Math.cos(ang) * r * 0.74, w.y + Math.sin(ang) * r * 0.74)
      held(P, { angle: ang, r, side })
      c.restore()
    }
    c.save()
    c.translate(w.x, w.y)
    c.rotate(ang)
    const curled: Pen[] = []
    for (let i = 0; i < 4; i++) curled.push(ellipse(r * 0.98, KY[i], r * 0.44, fw * 0.62, 0))
    fingers(curled)
    for (let i = 0; i < 4; i++) P.detail(curve([r * 0.66, KY[i], r * 1.26, KY[i]]), skin, 0.5)
    thumbShape(-0.2, 0.9)
    c.restore()
    return
  }
  if (n <= 0) {
    // at rest: the fingers lie together and curl a little, each a different length; the thumb lies along the first
    thumbShape(-0.12, 0.92)
    const list: Pen[] = []
    for (let i = 0; i < 4; i++) list.push(finger(i, -ts * (0.02 + i * 0.05), 0.86, 0.42 + i * 0.09))
    fingers(list)
    P.shape(palm(r * 1.02), skin, { shade: 0.6 })
  } else if (n === 7) {
    // an open palm held flat: fingers together and straight, the thumb out
    thumbShape(0.5)
    const list: Pen[] = []
    for (let i = 0; i < 4; i++) list.push(finger(i, -ts * (i - 1.5) * 0.045, 1, 0.06))
    fingers(list)
    P.shape(palm(r * 1.04), skin, { shade: 0.6 })
  } else {
    // fingers out: one points, more are a count, five is an open hand
    const count = n === 5 ? 4 : Math.min(4, n)
    const list: Pen[] = []
    for (let i = 0; i < 4; i++) {
      const up = i < count
      if (up) list.push(finger(i, -ts * (i - (count - 1) / 2) * (n === 5 ? 0.24 : n === 1 ? 0 : 0.2), n === 1 ? 1.12 : 1, 0.04))
    }
    if (list.length) fingers(list)
    thumbShape(n === 5 ? 0.62 : -0.3, n === 5 ? 1 : 0.8)
    P.shape(palm(r * 1.04), skin, { shade: 0.6 })
    // the fingers that stay folded: knuckles on the palm
    const folded: Pen[] = []
    for (let i = count; i < 4; i++) folded.push(ellipse(r * 0.86, KY[i], r * 0.3, fw * 0.6, 0))
    if (folded.length) fingers(folded)
  }
  c.restore()
  if (held) {
    c.save()
    c.translate(w.x + Math.cos(ang) * r * 0.9, w.y + Math.sin(ang) * r * 0.9)
    held(P, { angle: ang, r, side })
    c.restore()
  }
}

function drawArm(P: Painter, s: Sheet, g: Rig, k: Skeleton, sh: P3, el: P3, ha: P3, code: number, wrist: number, side: 'r' | 'l', held?: Held) {
  const end = sleeveEnd(s)
  const col = sleeveColor(s)
  if (end < 0.9 || P.sil) P.shape(limbPath(sh, el, ha, g.armW0 * 0.9, g.armWj * 0.92, g.armW1, 0.5, 1, 0.06), end < 0.9 ? s.skin : col, { shade: 0.8 })
  if (!P.sil) {
    P.shape(limbPath(sh, el, ha, g.armW0 * 1.12, g.armWj * (end < 0.9 ? 1.2 : 1.08), g.armW1 * 1.08, 0.5, end, 0.09), col, { shade: 0.8, over: () => pattern(P, s, Math.min(sh.x, el.x, ha.x) - g.armW0, Math.min(sh.y, el.y, ha.y) - g.armW0, Math.max(sh.x, el.x, ha.x) + g.armW0, Math.max(sh.y, el.y, ha.y) + g.armW0, g.shW) })
    if (end >= 0.9) {
      // the fold of the sleeve inside the elbow
      const bx = el.x - sh.x
      const by = el.y - sh.y
      const cx = ha.x - el.x
      const cy = ha.y - el.y
      const cross = bx * cy - by * cx
      const bend = Math.abs(cross) / ((Math.hypot(bx, by) || 1) * (Math.hypot(cx, cy) || 1))
      if (bend > 0.3) {
        const sgn = cross > 0 ? 1 : -1
        const nx = (-by / (Math.hypot(bx, by) || 1)) * sgn
        const ny = (bx / (Math.hypot(bx, by) || 1)) * sgn
        P.detail(curve([el.x + nx * g.armWj * 0.5, el.y + ny * g.armWj * 0.5, el.x + nx * g.armWj * 0.1, el.y + ny * g.armWj * 0.1]), col, 0.6)
      }
    }
    if (end >= 0.9 && (s.top.style === 'jumper' || s.top.style === 'shirt' || s.top.style === 'coat')) {
      // a cuff
      const dx = ha.x - el.x
      const dy = ha.y - el.y
      const d = Math.hypot(dx, dy) || 1
      const cx = ha.x - (dx / d) * g.armW1 * 0.32
      const cy = ha.y - (dy / d) * g.armW1 * 0.32
      P.shape(ellipse(cx, cy, g.armW1 * 0.26, g.armW1 * 0.6, Math.atan2(dy, dx)), s.top.style === 'shirt' ? col : (s.top.trim ?? mixHex(col, '#2a1830', 0.2)), { shade: 0.3, line: 0.8 })
    }
  }
  const ang = Math.atan2(ha.y - el.y, ha.x - el.x) + wrist
  // the thumb is on the side of the hand that is toward the front of the body and its middle line, or up
  const C = axes(k.yawChest)
  const sd = side === 'r' ? -1 : 1
  const tdx = C.z.x * 0.8 - C.x.x * sd * 0.6
  const dot = -Math.sin(ang) * tdx - Math.cos(ang) * 0.5
  drawHand(P, s, g, ha, ang, code, clamp01(Math.abs(dot) * 3) * (dot < 0 ? -1 : 1), side, held)
}

function drawFoot(P: Painter, s: Sheet, g: Rig, ft: Pt, side: number, yaw: number, air: number, tip = 0, pitch = 0) {
  const c = P.ctx
  const L = g.footL
  const h = g.footH * 2
  const sn = Math.sin(yaw)
  const k = clamp01(Math.abs(sn) * 1.3)
  const d = sn < 0 ? -1 : 1
  const away = Math.cos(yaw) < -0.2
  const style = s.shoes.style
  const bare = style === 'bare' || style === 'sandals'
  const col = bare ? s.skin : s.shoes.color
  const w = L * 0.62
  const front = [-w / 2, 0, -w / 2, -h * 0.8, -w * 0.16, -h * 1.02, w * 0.16, -h * 1.02, w / 2, -h * 0.8, w / 2, 0]
  const sideV = [-0.34 * L, 0, -0.36 * L, -h * 0.86, -0.08 * L, -h * 1.04, 0.3 * L, -h * 0.7, 0.66 * L, -h * 0.4, 0.66 * L, 0]
  // a foot pointing left is the same profile mirrored (and walked round the other way, so the outline never crosses itself)
  const prof = d > 0 ? sideV : [-sideV[10], sideV[11], -sideV[8], sideV[9], -sideV[6], sideV[7], -sideV[4], sideV[5], -sideV[2], sideV[3], -sideV[0], sideV[1]]
  const pts = front.map((v, i) => lerp(v, prof[i], k))
  c.save()
  c.translate(ft.x + side * L * 0.05 * (1 - k) * Math.cos(yaw), ft.y + g.footH)
  // toes hang when the foot is off the ground; the heel comes up on tiptoe and as a step pushes off; a kneeling foot lies back
  const turn = Math.max(air * 0.5, tip * 0.6) + pitch
  if (Math.abs(pitch) > 1) {
    c.translate(0, -g.footH * 0.8)
    c.rotate(d * pitch * (k > 0.3 ? 1 : 0.2))
    c.translate(0, g.footH * 0.8)
  } else if (k > 0.3) c.rotate(d * turn)
  else {
    c.rotate(side * air * 0.2)
    if (tip + Math.max(0, pitch) > 0) c.scale(1 - 0.12 * tip, 1 + 0.5 * (tip + Math.max(0, pitch) * 0.5))
  }
  P.shape(blob(pts), col, { shade: 0.6 })
  if (!P.sil && !away) {
    const x0 = pts[0]
    const x1 = pts[10]
    if (style === 'shoes' || style === 'boots') {
      P.flat(rrect(x0 + 1, -h * 0.2, x1 - x0 - 2, h * 0.2, h * 0.1), mixHex(s.shoes.color, '#fff4e0', 0.72))
      P.detail(curve([lerp(-w * 0.2, 0.1 * L * d, k), -h * 0.62, lerp(w * 0.2, 0.34 * L * d, k), -h * 0.56]), s.shoes.color, 0.6)
    } else if (style === 'sandals') {
      P.flat(rrect(x0 - 1, -h * 0.16, x1 - x0 + 2, h * 0.2, h * 0.1), s.shoes.color)
      P.line(curve([lerp(-w * 0.46, 0.02 * L * d, k), -h * 0.7, lerp(0, 0.2 * L * d, k), -h * 0.86, lerp(w * 0.46, 0.4 * L * d, k), -h * 0.58]), s.shoes.color, h * 0.2)
      P.line(curve([lerp(-w * 0.5, 0.3 * L * d, k), -h * 0.34, lerp(w * 0.5, 0.62 * L * d, k), -h * 0.3]), s.shoes.color, h * 0.18)
    } else {
      // bare toes
      for (const u of [0.25, 0.5, 0.75]) P.detail(curve([lerp(x0 + (x1 - x0) * u, (0.36 + u * 0.3) * L * d, k), -h * lerp(0.3, 0.36, k), lerp(x0 + (x1 - x0) * u, (0.38 + u * 0.3) * L * d, k), -h * 0.06]), s.skin, 0.5)
    }
  } else if (!P.sil && (style === 'shoes' || style === 'boots')) {
    P.flat(rrect(pts[0] + 1, -h * 0.2, pts[10] - pts[0] - 2, h * 0.2, h * 0.1), mixHex(s.shoes.color, '#fff4e0', 0.72))
  }
  c.restore()
}

/** How far down the legs a top or a skirt reaches, in leg lengths. */
function hemOf(s: Sheet, g: Rig): number {
  const grown = g.stage === 'adult' || g.stage === 'elder' || g.stage === 'teen'
  switch (s.top.style) {
    case 'dress': return grown ? 0.62 : 0.46
    case 'tunic': return grown ? 0.5 : 0.36
    case 'coat': return grown ? 0.56 : 0.42
    default: return 0
  }
}

/**
 * The trunk as it looks from where we stand: a curved spine with a cross-section at every height. `at(s)` is the
 * spine (0 at the hips, 1 at the shoulder line), `on(s, phi)` a place on the body's surface (`phi` 0 = the middle
 * of the front, + toward the character's left), kept on the side we can see.
 */
function trunk(g: Rig, k: Skeleton, p: Pose) {
  const cx = 2 * k.mid.x - (k.hip.x + k.chest.x) / 2
  const cy = 2 * k.mid.y - (k.hip.y + k.chest.y) / 2
  const at = (s: number): Pt => {
    const u = 1 - s
    return { x: u * u * k.hip.x + 2 * u * s * cx + s * s * k.chest.x, y: u * u * k.hip.y + 2 * u * s * cy + s * s * k.chest.y }
  }
  const tan = (s: number): Pt => {
    const u = 1 - s
    let x = 2 * u * (cx - k.hip.x) + 2 * s * (k.chest.x - cx)
    let y = 2 * u * (cy - k.hip.y) + 2 * s * (k.chest.y - cy) - k.T * 0.12
    const n = Math.hypot(x, y) || 1
    x /= n
    y /= n
    return { x, y }
  }
  const yawAt = (s: number) => k.yawHip + (k.yawChest - k.yawHip) * clamp01(s)
  const tiltAt = (s: number) => lerp(k.hipRoll * Math.abs(Math.cos(k.yawHip)), (k.shRoll - p.lean) * Math.abs(Math.cos(k.yawChest)), clamp01(s))
  /** The level direction across the body at height s (toward screen right). */
  const across = (s: number): Pt => {
    const t = tan(clamp01(s))
    const a = tiltAt(s)
    const ex = -t.y
    const ey = t.x
    return { x: ex * Math.cos(a) - ey * Math.sin(a), y: ex * Math.sin(a) + ey * Math.cos(a) }
  }
  // half width, half depth and forward shift of the body at four heights
  const ST: [number, number, number, number][] = [
    [0.04, Math.max(g.hipW, g.waistW) * 1.0, g.hipD, g.belly * 0.4 - g.hipD * 0.08],
    [0.36, g.waistW * 1.03, g.waistD, g.belly],
    [0.72, lerp(g.shW, g.waistW, 0.4) * 1.04, g.chestD, g.belly * 0.2 + g.chestD * 0.06],
    [1.0, g.shW * 1.0, g.chestD * 0.86, -g.chestD * 0.06],
  ]
  const dims = (s: number): [number, number, number] => {
    if (s <= ST[0][0]) return [ST[0][1], ST[0][2], ST[0][3]]
    for (let i = 1; i < ST.length; i++) if (s <= ST[i][0]) {
      const u = (s - ST[i - 1][0]) / (ST[i][0] - ST[i - 1][0])
      return [lerp(ST[i - 1][1], ST[i][1], u), lerp(ST[i - 1][2], ST[i][2], u), lerp(ST[i - 1][3], ST[i][3], u)]
    }
    return [ST[3][1], ST[3][2], ST[3][3]]
  }
  const half = (a: number, b: number, s: number) => Math.hypot(a * Math.cos(yawAt(s)), b * Math.sin(yawAt(s)))
  /** The edge of the body at height s on screen side `sd` (+1 right, −1 left). */
  const edge = (s: number, sd: number, grow = 1): Pt => {
    const [a, b, cz] = dims(s)
    const c = at(s)
    const e = across(s)
    const l = Math.sin(yawAt(s)) * cz + sd * half(a, b, s) * grow
    return { x: c.x + e.x * l, y: c.y + e.y * l }
  }
  /** A place on the surface: `phi` round the body from the middle of the front. Returns its depth too (`d` > 0 = on our side). */
  const on = (s: number, phi: number, keep = true): Pt & { d: number } => {
    const [a, b, cz] = dims(s)
    const psi = yawAt(s)
    if (keep) {
      const pc = Math.atan2(-a * Math.sin(psi), b * Math.cos(psi))
      let dphi = phi - pc
      while (dphi > Math.PI) dphi -= Math.PI * 2
      while (dphi < -Math.PI) dphi += Math.PI * 2
      phi = pc + Math.max(-1.5, Math.min(1.5, dphi))
    }
    const X = a * Math.sin(phi)
    const Z = b * Math.cos(phi) + cz
    const c = at(s)
    const e = across(s)
    const l = X * Math.cos(psi) + Z * Math.sin(psi)
    return { x: c.x + e.x * l, y: c.y + e.y * l, d: -X * Math.sin(psi) + Z * Math.cos(psi) }
  }
  return { at, tan, across, yawAt, dims, half, edge, on }
}

export function drawFigure(P: Painter, sheet: Sheet, pose: Pose, o: FigureOpts = {}) {
  const c = P.ctx
  const sc = o.scale ?? 1
  const g = rigOf(sheet, P.style)
  const k = solve(g, pose, sc)
  const pass = o.pass ?? 'all'
  const sil = !!P.sil
  const s = sheet
  const legLen = g.legU + g.legL
  const hold = { ...o.hold }
  let rCode = pose.rHand
  if (s.extras?.includes('cane') && !hold.r && o.cane !== false) {
    hold.r = cane(s, g, o.caneTip ? k.local(o.caneTip.x, o.caneTip.y) : undefined, k.haR)
    if (rCode < 0.5) rCode = 6
  }
  const yaw = k.yaw
  const cy = Math.cos(k.yawChest)
  const sy = Math.sin(k.yawChest)
  const facing = cy > -0.15
  const tr = trunk(g, k, pose)
  const T = k.T
  const style = s.top.style
  const long = hemOf(s, g)
  const topCol = style === 'apron' ? underTop(s) : s.top.color
  const sw = pose.swing * g.hipW * 0.5
  const ground = -k.hip.y
  const sitting = pose.sit > 0.5
  const hemMax = sitting ? (pose.seat > 0.02 ? g.legW0 * 1.3 : ground * 0.9) : ground * 0.8

  const oldUnit = P.unit
  c.save()
  c.translate(pose.x, pose.y)
  c.scale(sc, sc)
  P.unit = oldUnit * sc
  c.translate(0, -pose.lift * g.H)
  if (pose.rot) {
    c.translate(0, k.hip.y)
    c.rotate(pose.rot)
    c.translate(0, -k.hip.y)
  }
  const air = clamp01(pose.lift * 6)

  // ── the parts ──
  const armOf = (sd: 'r' | 'l') => {
    const [sh, el, ha, code, wr, h] = sd === 'r' ? [k.shR, k.elR, k.haR, rCode, pose.rWrist, hold.r] as const : [k.shL, k.elL, k.haL, pose.lHand, pose.lWrist, hold.l] as const
    // a limb on the far side of the body is in the body's shade
    const far = sh.d < -g.shJ * 0.3
    const draw = () => drawArm(P, s, g, k, sh, el, ha, code, wr, sd, h)
    if (far && !sil) P.near(0.2, draw)
    else draw()
  }
  const trousers = s.bottom.style === 'trousers'
  const legCol = trousers ? s.bottom.color : s.skin
  const legOf = (sd: 'r' | 'l') => {
    const [hj, kn, ft, side, fy, fyaw, fpitch] = sd === 'r' ? [k.hjR, k.knR, k.ftR, -1, pose.rfy, k.footYawR, k.footPitchR] as const : [k.hjL, k.knL, k.ftL, 1, pose.lfy, k.footYawL, k.footPitchL] as const
    const far = hj.d < -g.hipJ * 0.3
    const draw = () => {
      const hemW = trousers ? g.legW1 * 1.22 : g.legW1
      const end = { x: ft.x, y: ft.y + (trousers ? g.footH * 0.2 : g.footH * 0.4) }
      P.shape(limbPath(hj, kn, end, g.legW0, g.legWj * (trousers ? 1.06 : 1), hemW, 0.45, 1, trousers ? 0.05 : 0.09), legCol, { shade: 0.9 })
      if (s.bottom.style === 'shorts' && !sil) P.shape(limbPath(hj, kn, ft, g.legW0 * 1.14, g.legWj * 1.24, g.legW1, 0.45, 0.42), s.bottom.color, { shade: 0.8 })
      if (trousers && !sil) {
        // the crease behind a bent knee
        const bx = kn.x - hj.x
        const by = kn.y - hj.y
        const qx = ft.x - kn.x
        const qy = ft.y - kn.y
        const cross = bx * qy - by * qx
        const bend = Math.abs(cross) / ((Math.hypot(bx, by) || 1) * (Math.hypot(qx, qy) || 1))
        if (bend > 0.35) {
          const sgn = cross > 0 ? 1 : -1
          const nx = (-by / (Math.hypot(bx, by) || 1)) * sgn
          const ny = (bx / (Math.hypot(bx, by) || 1)) * sgn
          P.detail(curve([kn.x + nx * g.legWj * 0.52, kn.y + ny * g.legWj * 0.52, kn.x + nx * g.legWj * 0.08, kn.y + ny * g.legWj * 0.08]), legCol, 0.6)
        }
      }
      if (s.shoes.style === 'boots' && !sil) P.shape(limbPath({ x: lerp(kn.x, ft.x, 0.42), y: lerp(kn.y, ft.y, 0.42) }, { x: lerp(kn.x, ft.x, 0.7), y: lerp(kn.y, ft.y, 0.7) }, { x: ft.x, y: ft.y + g.footH * 0.3 }, g.legW1 * 1.34, g.legW1 * 1.3, g.legW1 * 1.26, 0.2, 0.96), s.shoes.color, { shade: 0.6 })
      drawFoot(P, s, g, ft, side, fyaw, clamp01(air + fy * 5) * (1 - pose.sit), pose.tip, fpitch)
    }
    if (far && !sil) P.near(0.2, draw)
    else draw()
  }

  // the top as one outline, from the neck round the shoulders, down the sides to the hem
  const hem = long > 0 ? Math.min(hemMax, legLen * long) : g.legW0 * 0.3
  const hemW = style === 'dress' ? g.hipW * (1.36 + 0.5 * long) : long > 0 ? g.hipW * 1.16 : g.hipW * 1.04
  const hemHalf = long > 0 ? Math.hypot(hemW * Math.cos(k.yawHip), hemW * (style === 'dress' ? 0.96 : 0.8) * Math.sin(k.yawHip)) : tr.half(hemW, g.hipD * 1.04, 0)
  const hip0 = tr.at(0.04)
  const hemC = { x: hip0.x + Math.sin(k.yawHip) * (g.belly * 0.3 - g.hipD * 0.06) + (long > 0 ? sw : 0), y: k.hip.y + hem }
  const chestTop = tr.at(1)
  const eTop = tr.across(1)
  const tTop = tr.tan(1)
  const shoulder = (sd: number): [Pt, Pt] => {
    // the shoulder on this side of the picture: where its joint is, so it rises and reaches with the arm
    let best = -1e9
    let lift = 0
    for (const j of [k.shR, k.shL]) {
      const l = sd * ((j.x - chestTop.x) * eTop.x + (j.y - chestTop.y) * eTop.y)
      if (l > best) {
        best = l
        lift = (j.x - chestTop.x) * tTop.x + (j.y - chestTop.y) * tTop.y + g.shDrop
      }
    }
    const L = Math.max(tr.half(g.shW, g.chestD * 0.9, 1), best + g.armW0 * 0.42)
    const fw = Math.sin(k.yawChest) * -g.chestD * 0.06
    return [
      { x: chestTop.x + eTop.x * (fw + sd * L * 0.86) + tTop.x * (lift * 0.9 + g.shDrop * 0.36), y: chestTop.y + eTop.y * (fw + sd * L * 0.86) + tTop.y * (lift * 0.9 + g.shDrop * 0.36) },
      { x: chestTop.x + eTop.x * (fw + sd * L * 1.04) + tTop.x * (lift * 0.8 - g.shDrop * 0.8), y: chestTop.y + eTop.y * (fw + sd * L * 1.04) + tTop.y * (lift * 0.8 - g.shDrop * 0.8) },
    ]
  }
  const neckHalf = tr.half(g.shW * 0.46, g.chestD * 0.52, 1)
  const neckPt = (sd: number): Pt => ({ x: chestTop.x + eTop.x * sd * neckHalf + tTop.x * g.shDrop * 0.55, y: chestTop.y + eTop.y * sd * neckHalf + tTop.y * g.shDrop * 0.55 })
  const side = (sd: number): number[] => {
    const [a, b] = shoulder(sd)
    const q: Pt[] = [neckPt(sd), a, b, tr.edge(0.72, sd), tr.edge(0.36, sd), tr.edge(0.06, sd)]
    const out: number[] = []
    for (const v of q) out.push(v.x, v.y)
    out.push(hemC.x + sd * hemHalf, hemC.y)
    return out
  }
  const right = side(1)
  const left = side(-1)
  const leftUp: number[] = []
  for (let i = left.length - 2; i >= 0; i -= 2) leftUp.push(left[i], left[i + 1])
  const top = through(right.concat([hemC.x, hemC.y + (long > 0 ? g.hipW * 0.2 : g.hipW * 0.08)], leftUp), 0.5)

  const drawPelvis = () => {
    if (s.bottom.style !== 'skirt') {
      // the seat of trousers or shorts (or of whatever is under a long top)
      const col = s.bottom.style === 'none' ? (long > 0 ? s.skin : s.top.color) : s.bottom.color
      const w = tr.half(g.hipW, g.hipD, 0)
      const bx = k.hip.x - Math.sin(k.yawHip) * g.hipD * 0.1
      const by = k.hip.y
      const cyy = g.legW0 * 0.62
      const jx = Math.max(w * 0.7, Math.abs(k.hjL.x - k.hjR.x) / 2 + g.legW0 * 0.46)
      P.shape(blob([bx - w, by - T * 0.2, bx - w * 1.02, by + cyy * 0.5, bx - jx, by + cyy, bx, by + cyy * (0.7 + 0.3 * Math.abs(Math.sin(k.yawHip))), bx + jx, by + cyy, bx + w * 1.02, by + cyy * 0.5, bx + w, by - T * 0.2]), col, { shade: 0.6 })
    } else {
      const grown = g.stage !== 'toddler' && g.stage !== 'child'
      const h2 = Math.min(hemMax, legLen * (grown ? 0.66 : 0.44))
      const hw = g.hipW * (grown ? 1.42 : 1.6) * (0.9 + 0.1 * Math.abs(Math.cos(k.yawHip)))
      const wl = tr.edge(0.18, -1, 0.94)
      const wr = tr.edge(0.18, 1, 0.94)
      const hx = hemC.x - (long > 0 ? sw : 0) + sw
      const hy = k.hip.y + h2
      const sk = through([wl.x, wl.y, wr.x, wr.y, lerp(wr.x, hx + hw, 0.62), lerp(wr.y, hy, 0.5), hx + hw, hy, hx, hy + g.hipW * 0.2, hx - hw, hy, lerp(wl.x, hx - hw, 0.62), lerp(wl.y, hy, 0.5)], 0.4)
      P.shape(sk, s.bottom.color)
      P.detail(curve([lerp(wl.x, wr.x, 0.3), wl.y + h2 * 0.3, hx - hw * 0.5, hy - h2 * 0.04]), s.bottom.color, 0.7)
      P.detail(curve([lerp(wl.x, wr.x, 0.68), wl.y + h2 * 0.36, hx + hw * 0.44, hy - h2 * 0.02]), s.bottom.color, 0.7)
    }
  }

  /** A place on the garment: on the body above the hips, hanging straight down below them (`s` < 0, in torso lengths). */
  const on = (sv: number, phi: number): Pt => {
    if (sv >= 0.04) return tr.on(sv, phi)
    const b = tr.on(0.04, phi)
    const drop = (0.04 - sv) * T
    const u = clamp01(drop / Math.max(1, hem))
    return { x: lerp(b.x, hemC.x + ((b.x - hip0.x) / Math.max(1, tr.half(g.hipW, g.hipD, 0))) * hemHalf, u), y: b.y + drop }
  }
  const poly = (list: [number, number][]) => {
    const q: number[] = []
    for (const [sv, phi] of list) {
      const v = on(sv, phi)
      q.push(v.x, v.y)
    }
    return q
  }
  const neckW = g.headRx * 0.34
  const fk = 0.3 + 0.7 * Math.max(0, cy) // how wide something on the front is drawn

  const drawTorso = () => {
    P.shape(top, topCol, { shade: 1.25, over: () => pattern(P, s, k.hip.x - hemW - g.shW, k.chest.y - g.shW, k.hip.x + hemW + g.shW, k.hip.y + hem + 30, g.shW) })
    if (sil) return
    const trim = s.top.trim ?? mixHex(topCol, '#2a1830', 0.22)
    const hemS = -hem / T
    P.clip(top, () => {
      if (facing) {
        const nk = on(1.03, 0)
        if (style === 'tee' || style === 'dress' || style === 'tunic') {
          // a scooped neck showing skin, edged
          P.shape(ellipse(nk.x, nk.y - neckW * 0.2, neckW * 1.5 * fk, neckW * 1.05, Math.atan2(eTop.y, eTop.x)), s.skin, { shade: 0, ink: trim, line: 1.3 })
          if (style === 'tunic') {
            P.detail(curve(poly([[0.96, 0], [0.72, 0], [0.5, 0]])), topCol, 0.8)
            for (const u of [0.86, 0.68]) {
              const b = on(u, 0.1)
              P.flat(circle(b.x, b.y, g.shW * 0.045), trim)
            }
          }
          if (style === 'dress') {
            const a = tr.edge(0.2, -1)
            const b = tr.edge(0.2, 1)
            P.detail(curve([a.x, a.y, (a.x + b.x) / 2, (a.y + b.y) / 2 + T * 0.05, b.x, b.y]), topCol, 0.7)
          }
        } else if (style === 'shirt') {
          P.detail(curve(poly([[0.98, 0], [0.5, 0], [0.04, 0], [hemS, 0]])), topCol, 0.7)
          for (const u of [0.7, 0.48, 0.26]) {
            const b = on(u, 0)
            P.flat(circle(b.x, b.y, g.shW * 0.045), mixHex(topCol, '#2a1830', 0.5))
          }
          for (const sd of [-1, 1]) P.shape(blob(poly([[1.06, sd * 0.86], [1.05, sd * 0.06], [0.95, sd * 0.03], [0.9, sd * 0.56]])), s.top.trim ?? topCol, { shade: 0.3, line: 0.8 })
        } else if (style === 'jumper' || style === 'apron') {
          P.shape(ellipse(nk.x, nk.y - neckW * 0.5, neckW * 1.5 * fk, neckW * 0.62, Math.atan2(eTop.y, eTop.x)), style === 'apron' ? topCol : trim, { shade: 0.3, line: 0.8 })
        } else if (style === 'coat') {
          // open over what is under it: a strip of the under-top, two lapels, buttons
          P.flat(blob(poly([[1.08, -0.34], [1.08, 0.34], [0.5, 0.2], [0.04, 0.16], [hemS * 1.1, 0.16], [hemS * 1.1, -0.16], [0.04, -0.16], [0.5, -0.2]])), underTop(s))
          for (const sd of [-1, 1]) {
            P.shape(blob(poly([[1.06, sd * 0.5], [0.66, sd * 0.1], [0.56, sd * 0.2], [0.9, sd * 0.7]])), topCol, { shade: 0.4, line: 0.8 })
            P.detail(curve(poly([[0.56, sd * 0.19], [0.04, sd * 0.17], [hemS, sd * 0.17]])), topCol, 0.8)
          }
          for (const u of [0.44, 0.22]) {
            const b = on(u, 0.4)
            P.flat(circle(b.x, b.y, g.shW * 0.055), mixHex(topCol, '#2a1830', 0.5))
          }
        }
      }
      if (style === 'jumper') {
        // the ribbed band at the hem
        const a = { x: hemC.x - hemHalf, y: hemC.y - g.shW * 0.1 }
        const b = { x: hemC.x + hemHalf, y: hemC.y - g.shW * 0.1 }
        P.line(curve([a.x, a.y, hemC.x, hemC.y, b.x, b.y]), trim, g.shW * 0.26)
      }
    })
    if (style === 'apron') {
      // the bib and skirt of the apron over the jumper, a pocket, the neck strap; from behind, its ties
      const ah = Math.min(hemMax, legLen * 0.4)
      const aS = -ah / T
      if (facing) {
        for (const sd of [-1, 1]) P.line(curve(poly([[0.86, sd * 0.5], [1.03, sd * 0.28]])), s.top.color, g.shW * 0.11)
        const bib: [number, number][] = [[0.86, -0.56], [0.86, 0.56], [0.52, 0.66], [0.34, 1.18], [0.04, 1.32]]
        const ap = poly(bib)
        const hw = Math.hypot(g.hipW * 1.12 * cy, g.hipW * 0.7 * sy)
        const ax = hip0.x + Math.sin(k.yawHip) * (g.hipD + g.belly * 0.4) + sw
        const lowR = tr.on(0.04, 1.32)
        const lowL = tr.on(0.04, -1.32)
        const xr = Math.max(lowR.x, lowL.x)
        const xl = Math.min(lowR.x, lowL.x)
        const hy = k.hip.y + ah
        ap.push(lerp(xr, ax + hw, 0.7), hy - ah * 0.4, Math.min(ax + hw, xr + hw), hy, (xl + xr) / 2 + sw, hy + g.hipW * 0.12, Math.max(ax - hw, xl - hw), hy, lerp(xl, ax - hw, 0.7), hy - ah * 0.4)
        const back: [number, number][] = [[0.04, -1.32], [0.34, -1.18], [0.52, -0.66]]
        ap.push(...poly(back))
        const apron = through(ap, 0.36)
        P.shape(apron, s.top.color, { shade: 0.9, over: () => pattern(P, s, k.hip.x - g.hipW * 1.6, k.chest.y, k.hip.x + g.hipW * 1.6, hy + 20, g.shW) })
        P.clip(apron, () => P.shape(blob(poly([[0.2, -0.4], [0.2, 0.4], [aS * 0.42, 0.42], [aS * 0.42, -0.42]])), s.top.color, { shade: 0.4, line: 0.8 }))
      } else {
        const a = tr.edge(0.34, -1)
        const b = tr.edge(0.34, 1)
        P.line(curve([a.x, a.y, (a.x + b.x) / 2, (a.y + b.y) / 2 + T * 0.03, b.x, b.y]), s.top.color, g.shW * 0.1)
        const m = on(0.33, Math.PI)
        P.shape(blob([m.x - g.shW * 0.26, m.y - g.shW * 0.1, m.x, m.y, m.x + g.shW * 0.26, m.y - g.shW * 0.1, m.x + g.shW * 0.2, m.y + g.shW * 0.34, m.x, m.y + g.shW * 0.06, m.x - g.shW * 0.2, m.y + g.shW * 0.34]), s.top.color, { shade: 0.3, line: 0.7 })
      }
    }
    if (s.extras?.includes('bag')) {
      const bag = s.extraColors?.bag ?? '#a9683c'
      // the strap from the left shoulder across to the right hip, the bag at the hip
      const hipPt = tr.on(0.05, -1.5, false)
      P.clip(top, () => P.line(curve(poly(facing ? [[1.02, 0.9], [0.5, -0.1], [0.08, -1.35]] : [[1.02, 2.2], [0.5, 3.1], [0.08, -1.8]])), bag, g.shW * 0.12))
      if (hipPt.d > -g.hipD * 0.5) drawBag(hipPt)
    }
  }
  const drawBag = (at: Pt) => {
    const bag = s.extraColors?.bag ?? '#a9683c'
    c.save()
    c.translate(at.x, at.y + T * 0.02)
    c.rotate(pose.swing * 0.6 - pose.lean)
    const bw = g.shW * (0.5 + 0.34 * Math.abs(Math.sin(k.yawHip)) * 0.6)
    P.shape(rrect(-bw * 0.5, 0, bw, g.shW * 0.7, g.shW * 0.14), bag, { shade: 0.7 })
    P.shape(blob([-bw * 0.52, -2, bw * 0.52, -2, bw * 0.48, g.shW * 0.34, 0, g.shW * 0.44, -bw * 0.48, g.shW * 0.34]), mixHex(bag, '#2a1830', 0.16), { shade: 0.3, line: 0.8 })
    P.flat(circle(0, g.shW * 0.34, g.shW * 0.05), '#f3d9a0')
    c.restore()
  }

  const nw = g.headRx * (g.stage === 'toddler' ? 0.5 : 0.42)
  const drawNeck = () => {
    if (!sil && s.hair.style !== 'covered') {
      const base = { x: chestTop.x + Math.sin(k.yawChest) * g.chestD * 0.08, y: chestTop.y + nw * 0.1 }
      const nb = { x: lerp(base.x, k.head.x, 0.5), y: lerp(base.y, k.head.y, 0.5) }
      P.shape(limbPath(base, nb, k.head, nw, nw, nw, 0.2), s.skin, { shade: 0.7, line: 0.8 })
    }
    if (s.extras?.includes('scarf') && !sil) {
      const sc2 = s.extraColors?.scarf ?? s.top.trim ?? '#d9573f'
      const y = chestTop.y - g.shDrop * 0.4
      const x = chestTop.x
      const w = Math.hypot(nw * 1.5 * cy, nw * 1.7 * sy)
      P.shape(blob([x - w, y - nw * 0.5, x, y - nw * 0.8, x + w, y - nw * 0.5, x + w * 1.06, y + nw * 0.5, x, y + nw * 0.9, x - w * 1.06, y + nw * 0.5]), sc2, { shade: 0.6 })
      if (facing) {
        const e = on(0.98, 0.5)
        c.save()
        c.translate(e.x, y + nw * 0.4)
        c.rotate(pose.swing * 0.9 + 0.1)
        P.shape(blob([-nw * 0.5, 0, nw * 0.5, 0, nw * 0.62, T * 0.5, 0, T * 0.56, -nw * 0.62, T * 0.5]), sc2, { shade: 0.6 })
        for (const u of [-0.3, 0, 0.3]) P.detail(curve([nw * u, T * 0.44, nw * u * 1.2, T * 0.54]), sc2, 0.6)
        c.restore()
      }
    }
  }
  const headFrame = (fn: () => void) => {
    c.save()
    c.translate(k.head.x, k.head.y)
    c.rotate(k.headAngle)
    fn()
    c.restore()
  }
  const drawHeadAll = () => {
    // first, the shadow the head throws on the chest and shoulders
    if (!sil && P.style.shade.model !== 'flat') {
      c.save()
      c.clip(top)
      c.globalAlpha = 0.85
      c.fillStyle = P.shadeOf(topCol)
      c.fill(ellipse(k.head.x - P.light.x * g.headRx * 0.36, k.head.y - P.light.y * g.headRy * 0.5, g.headRx * 0.96, g.headRy * 0.94, k.headAngle))
      c.restore()
    }
    headFrame(() => {
      if (sil) {
        P.flat(ellipse(0, -g.headRy * 0.04, g.headRx * 1.1, g.headRy * 1.08), s.skin)
        if (s.hair.style === 'long' || s.hair.style === 'covered') P.flat(ellipse(0, g.headRy * 0.6, g.headRx * 1.2, g.headRy * 1.2), s.skin)
        if (s.hair.style === 'bun') P.flat(circle(0, -g.headRy * 1.18, g.headRx * 0.44), s.skin)
        if (s.extras?.includes('hat')) P.flat(ellipse(0, -g.headRy * 0.56, g.headRx * 1.62, g.headRy * 0.25), s.skin)
      } else drawHead(P, s, g, pose, k.yawHead)
    })
  }
  const hangs = s.hair.style === 'long' || s.hair.style === 'bob' || s.hair.style === 'covered'

  // ── what is in front of what ──
  type Part = { z: number; arm?: boolean; draw: () => void }
  const parts: Part[] = []
  const tall = long > 0 || s.bottom.style === 'skirt'
  for (const sd of ['r', 'l'] as const) {
    const [hj, kn] = sd === 'r' ? [k.hjR, k.knR] : [k.hjL, k.knL]
    // a thigh that comes toward us (sitting, kneeling) lies over the body, unless a skirt covers it
    const forward = kn.d - hj.d > g.hipD * 1.1 && !tall
    parts.push({ z: (forward ? 0.5 : -2) + hj.d * 0.001 + kn.d * 0.0004, draw: () => legOf(sd) })
  }
  parts.push({ z: -1, draw: drawPelvis })
  parts.push({ z: 0, draw: drawTorso })
  if (hangs && !sil) {
    const behind = hairBehindBody(k.yawHead)
    const overHead = Math.cos(k.yawHead) < -0.2 && s.hair.style !== 'covered'
    parts.push({ z: behind ? -4 : overHead ? 1.5 : 0.6, draw: () => headFrame(() => drawHairHang(P, s, g, pose, k.yawHead)) })
  }
  parts.push({ z: 0.8, draw: drawNeck })
  parts.push({ z: 1, draw: drawHeadAll })
  for (const sd of ['r', 'l'] as const) {
    const [sh, el, ha, backFlag] = sd === 'r' ? [k.shR, k.elR, k.haR, pose.rBack] : [k.shL, k.elL, k.haL, pose.lBack]
    const zA = (sh.d * 1.2 + el.d + ha.d) / 3
    const front = backFlag < 0.5 && zA > -g.chestD * 0.62
    parts.push({ z: front ? 2 + zA * 0.001 : -3 + zA * 0.001, arm: front, draw: () => {
      if (front && !sil && P.style.shade.model !== 'flat') {
        // the shadow an arm in front throws on the body
        c.save()
        c.clip(top)
        c.translate(-P.light.x * g.armW0 * 0.3, -P.light.y * g.armW0 * 0.3)
        c.globalAlpha = 0.55
        c.fillStyle = P.shadeOf(topCol)
        c.fill(limbPath(sh, el, ha, g.armW0 * 1.1, g.armWj * 1.1, g.armW1 * 1.1, 0.5))
        c.restore()
      }
      armOf(sd)
    } })
  }
  parts.sort((a, b) => a.z - b.z)
  for (const part of parts) {
    if (pass === 'body' && part.arm) continue
    if (pass === 'arms' && !part.arm) continue
    part.draw()
  }
  c.restore()
  P.unit = oldUnit
}

/** A walking stick, held in the right hand: straight down from the hand, or leaning to where its tip stands. */
function cane(s: Sheet, g: Rig, tip: Pt | undefined, hand: Pt): Held {
  const col = s.extraColors?.cane ?? '#8a5a3a'
  const len = g.footH + (g.legU + g.legL) * 0.86
  return (P, info) => {
    const w = g.armW1 * 0.36
    // the held point is a little beyond the wrist
    const tx = tip ? tip.x - hand.x - Math.cos(info.angle) * info.r * 0.74 : 0
    const ty = tip ? tip.y - hand.y - Math.sin(info.angle) * info.r * 0.74 : len
    const a = Math.atan2(tx, ty)
    const l = tip ? Math.hypot(tx, ty) : len
    const c = P.ctx
    c.save()
    c.rotate(-a)
    const path = curve([-g.hand * 1.2, -g.hand * 0.5, -g.hand * 0.9, -g.hand * 1.5, 0, -g.hand * 1.5, 0, 0, 0, l])
    P.line(path, mixHex(col, '#2a1830', 0.5), w + P.lineW() * 1.6)
    P.line(path, col, w)
    c.restore()
  }
}

/** The shadow a figure throws on the ground. Draw it before the figure. */
export function drawFigureShadow(P: Painter, sheet: Sheet, pose: Pose, o: FigureOpts = {}, len = 1) {
  const g = rigOf(sheet, P.style)
  const sc = o.scale ?? 1
  const tip = o.caneTip ? { x: o.caneTip.x - pose.x, y: o.caneTip.y - pose.y } : undefined
  // world targets are kept: the figure is only moved to the origin, so they are moved with it
  P.castShadow(pose.x, pose.y, () => drawFigure(P, sheet, { ...pose, x: 0, y: 0, lift: 0, rWx: pose.rWx - pose.x, rWy: pose.rWy - pose.y, lWx: pose.lWx - pose.x, lWy: pose.lWy - pose.y }, { ...o, hold: undefined, caneTip: tip, pass: 'all' }), pose.lift * g.H * sc, len)
}

/** Where a hand is in the world (to put something in it or beside it). */
export function handAt(P: Painter, sheet: Sheet, pose: Pose, side: 'r' | 'l', scale = 1): Pt {
  const k = solve(rigOf(sheet, P.style), pose, scale)
  return k.world(side === 'r' ? k.haR : k.haL)
}
/** Where the centre of the head is in the world. */
export function headAt(P: Painter, sheet: Sheet, pose: Pose, scale = 1): Pt {
  const k = solve(rigOf(sheet, P.style), pose, scale)
  return k.world(k.head)
}
/** Where any joint of the skeleton is in the world (shoulders, hips, knees, feet): to tie one figure to another. */
export function jointAt(P: Painter, sheet: Sheet, pose: Pose, joint: 'hip' | 'chest' | 'head' | 'shR' | 'shL' | 'elR' | 'elL' | 'haR' | 'haL' | 'knR' | 'knL' | 'ftR' | 'ftL', scale = 1): Pt {
  const k = solve(rigOf(sheet, P.style), pose, scale)
  return k.world(k[joint])
}
/** Standing height in stage units at this scale. */
export const heightOf = (P: Painter, sheet: Sheet, scale = 1) => rigOf(sheet, P.style).H * scale

export type { Skeleton }
void Pen
