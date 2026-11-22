/**
 * The character builder: `drawFigure` draws any character sheet in any pose.
 *
 * Nothing here knows a particular character. Proportions come from the sheet's life stage and build, colours and
 * clothes from the sheet, the look (line, shading, exaggeration) from the Painter's style profile.
 */
import type { Sheet } from '@/cast/sheet'
import { Painter, blob, circle, clamp01, curve, ellipse, lerp, limbPath, rrect, type Pt } from '../kit/core'
import { mixHex } from '../style/color'
import { drawHairBack, drawHairFront, drawHead } from './face'
import type { Pose } from './pose'
import { rigOf, solve, type Rig, type Skeleton } from './rig'

/** Draws whatever a hand holds. Called with the origin in the palm, upright; `angle` is the way the hand points. */
export type Held = (P: Painter, info: { angle: number; r: number; side: 'r' | 'l' }) => void

export type FigureOpts = {
  /** Size: 1 draws an adult of height 1.0 at 540 stage units. */
  scale?: number
  /** Things in the hands (the fingers close over them when the hand shape is a grip). */
  hold?: { r?: Held; l?: Held }
  /** 'body' leaves the front arms out, 'arms' draws only them (to pass something between body and arms). */
  pass?: 'all' | 'body' | 'arms'
  /** false = a character whose sheet has a walking stick has put it down. */
  cane?: boolean
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

/** A hand at the wrist `w`, pointing along `ang`. `thumb` is +1 or −1: which side of the hand the thumb is on (0…1 sized). */
function drawHand(P: Painter, s: Sheet, g: Rig, w: Pt, ang: number, code: number, thumb: number, side: 'r' | 'l', held?: Held) {
  const c = P.ctx
  const r = g.hand
  const skin = s.skin
  const n = Math.round(code)
  const ts = thumb < 0 ? -1 : 1
  const tk = Math.min(1, Math.abs(thumb))
  if (P.sil) {
    P.flat(ellipse(w.x + Math.cos(ang) * r * 0.8, w.y + Math.sin(ang) * r * 0.8, r * 1.15, r * 0.9, ang), skin)
    held?.(P, { angle: ang, r, side })
    return
  }
  c.save()
  c.translate(w.x, w.y)
  c.rotate(ang)
  const finger = (y: number, a: number, len: number, wd = 0.46) => {
    c.save()
    c.translate(r * 0.86, y)
    c.rotate(a)
    P.shape(rrect(-r * 0.2, (-r * wd) / 2, len + r * 0.2, r * wd, r * wd * 0.5), skin, { shade: 0.32, hi: 0 })
    c.restore()
  }
  const thumbShape = (out: number) => {
    if (tk < 0.15) return
    c.save()
    c.translate(r * 0.42, ts * r * 0.62)
    c.rotate(ts * (0.75 + out))
    P.shape(rrect(-r * 0.1, -r * 0.24, r * (0.74 + 0.3 * out) * tk + r * 0.1, r * 0.48, r * 0.24), skin, { shade: 0.3, hi: 0 })
    c.restore()
  }
  const palm = (len: number) => blob([-r * 0.3, -r * 0.7, len * 0.5, -r * 0.84, len, -r * 0.62, len + r * 0.14, 0, len, r * 0.62, len * 0.5, r * 0.84, -r * 0.3, r * 0.7])
  if (n <= 0) {
    // relaxed: fingers together, a soft mitten with the finger tips marked
    thumbShape(0)
    P.shape(palm(r * 1.72), skin, { shade: 0.6 })
    P.detail(curve([r * 1.38, -r * 0.2, r * 1.78, -r * 0.16]), skin, 0.6)
    P.detail(curve([r * 1.38, r * 0.2, r * 1.78, r * 0.16]), skin, 0.6)
  } else if (n === 6) {
    // a grip: the palm, the thing held, then the fingers closed over it
    P.shape(palm(r * 1.1), skin, { shade: 0.6 })
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
    P.shape(rrect(r * 0.4, -r * 0.82, r * 0.92, r * 1.64, r * 0.42), skin, { shade: 0.5 })
    for (const y of [-0.4, 0, 0.4]) P.detail(curve([r * 0.52, y * r, r * 1.2, y * r]), skin, 0.6)
    thumbShape(-0.3)
    c.restore()
    return
  } else {
    // fingers out: one points, more are a count, five is an open hand
    const count = Math.min(4, n === 5 ? 4 : n)
    const spread = n === 5 ? 0.3 : 0.26
    for (let i = 0; i < count; i++) {
      const u = count === 1 ? 0 : i / (count - 1) - 0.5
      // counting starts from the thumb side
      const pos = n === 5 ? u : -ts * (0.5 - i / 3) * 0.999
      const lenK = 1.2 - Math.abs(pos) * 0.5
      finger(pos * r * 1.02, pos * spread * 2, r * (n === 1 ? 1.5 : 1.36) * lenK, n === 1 ? 0.5 : 0.44)
    }
    thumbShape(n === 5 ? 0.5 : -0.2)
    P.shape(palm(r * 1.08), skin, { shade: 0.6 })
    if (n < 4) {
      // the fingers that stay folded
      for (let i = count; i < 4; i++) {
        const pos = -ts * (0.5 - i / 3)
        P.detail(curve([r * 0.7, pos * r * 1.0 - r * 0.14, r * 1.06, pos * r * 1.0, r * 0.7, pos * r * 1.0 + r * 0.14]), skin, 0.6)
      }
    }
  }
  c.restore()
  if (held && n !== 6) {
    c.save()
    c.translate(w.x + Math.cos(ang) * r * 0.9, w.y + Math.sin(ang) * r * 0.9)
    held(P, { angle: ang, r, side })
    c.restore()
  }
}

function drawArm(P: Painter, s: Sheet, g: Rig, sh: Pt, el: Pt, ha: Pt, code: number, wrist: number, side: 'r' | 'l', held?: Held) {
  const end = sleeveEnd(s)
  const col = sleeveColor(s)
  if (end < 0.9 || P.sil) P.shape(limbPath(sh, el, ha, g.armW0 * 0.9, g.armWj * 0.92, g.armW1, 0.5), end < 0.9 ? s.skin : col, { shade: 0.8 })
  if (!P.sil) {
    P.shape(limbPath(sh, el, ha, g.armW0 * 1.12, g.armWj * (end < 0.9 ? 1.2 : 1.08), g.armW1 * 1.08, 0.5, end), col, { shade: 0.8, over: () => pattern(P, s, Math.min(sh.x, el.x, ha.x) - g.armW0, Math.min(sh.y, el.y, ha.y) - g.armW0, Math.max(sh.x, el.x, ha.x) + g.armW0, Math.max(sh.y, el.y, ha.y) + g.armW0, g.shW) })
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
  // the thumb is on the side of the hand that faces the body, or up when the arm is out sideways
  const m = P.ctx.getTransform()
  const flip = m.a * m.d - m.b * m.c < 0 ? -1 : 1
  const vx = -Math.sin(ang)
  const vy = Math.cos(ang)
  const inward = side === 'r' ? 1 : -1
  const dot = vx * inward - vy * 0.6
  drawHand(P, s, g, ha, ang, code, clamp01(Math.abs(dot) * 3) * (dot < 0 ? -1 : 1) * flip * flip, side, held)
}

function drawFoot(P: Painter, s: Sheet, g: Rig, ft: Pt, side: number, toe: number, air: number, tip = 0) {
  const c = P.ctx
  const L = g.footL
  const h = g.footH * 2
  const k = clamp01(Math.abs(toe) * 1.5)
  const d = toe < 0 ? -1 : 1
  const style = s.shoes.style
  const bare = style === 'bare' || style === 'sandals'
  const col = bare ? s.skin : s.shoes.color
  const w = L * 0.62
  const front = [-w / 2, 0, -w / 2, -h * 0.8, -w * 0.16, -h * 1.02, w * 0.16, -h * 1.02, w / 2, -h * 0.8, w / 2, 0]
  const sideV = [-0.34 * L, 0, -0.36 * L, -h * 0.86, -0.08 * L, -h * 1.04, 0.3 * L, -h * 0.7, 0.66 * L, -h * 0.4, 0.66 * L, 0]
  const pts = front.map((v, i) => lerp(v, i % 2 ? sideV[i] : sideV[i] * d, k))
  c.save()
  c.translate(ft.x + side * L * 0.07 * (1 - k), ft.y + g.footH)
  // toes hang when the foot is off the ground; on tiptoe the heel comes up and the foot stands on its front
  c.rotate(k > 0.3 ? d * Math.max(air * 0.5, tip * 0.6) : side * air * 0.2)
  if (tip > 0 && k <= 0.3) c.scale(1 - 0.12 * tip, 1 + 0.5 * tip)
  P.shape(blob(pts), col, { shade: 0.6 })
  if (!P.sil) {
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

export function drawFigure(P: Painter, sheet: Sheet, pose: Pose, o: FigureOpts = {}) {
  const c = P.ctx
  const sc = o.scale ?? 1
  const g = rigOf(sheet, P.style)
  const k = solve(g, pose, sc)
  const pass = o.pass ?? 'all'
  const body = pass !== 'arms'
  const cs = Math.cos(pose.spin)
  const back = cs < 0
  const sil = !!P.sil
  const s = sheet
  const legLen = g.legU + g.legL
  const hold = { ...o.hold }
  let rCode = pose.rHand
  if (s.extras?.includes('cane') && !hold.r && o.cane !== false) {
    hold.r = cane(s, g)
    if (rCode < 0.5) rCode = 6
  }

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
  if (pose.spin) c.scale(Math.max(0.16, Math.abs(cs)), 1)

  const air = clamp01(pose.lift * 6)
  // seen from behind, the character's right is on screen right: swap what each side draws
  const armR = () => drawArm(P, s, g, k.shR, k.elR, k.haR, rCode, pose.rWrist, 'r', hold.r)
  const armL = () => drawArm(P, s, g, k.shL, k.elL, k.haL, pose.lHand, pose.lWrist, 'l', hold.l)

  if (body) {
    // 1 ─ what hangs behind: long hair, the back of a headscarf
    c.save()
    c.translate(k.head.x, k.head.y)
    c.rotate(k.headAngle)
    drawHairBack(P, s, g, pose, back)
    c.restore()
    if (pose.rBack >= 0.5) armR()
    if (pose.lBack >= 0.5) armL()

    // 2 ─ legs and feet
    const trousers = s.bottom.style === 'trousers'
    const legCol = trousers ? s.bottom.color : s.skin
    const sitGround = pose.sit > 0.5 && pose.seat <= 0.02
    if (sitGround) {
      // cross-legged on the ground: each shin lies across in front, a foot showing at either side
      for (const side of [1, -1]) {
        const hx = k.hip.x + side * g.hipJ
        const kn = { x: k.hip.x + side * (g.hipJ + g.legU * 0.92), y: -g.legW0 * 0.46 }
        const an = { x: k.hip.x - side * g.hipJ * 0.5, y: -g.legW1 * 0.5 }
        P.shape(limbPath({ x: hx, y: k.hip.y }, kn, an, g.legW0, g.legWj, g.legW1, 0.4), legCol, { shade: 0.8 })
        if (s.bottom.style === 'shorts') P.shape(limbPath({ x: hx, y: k.hip.y }, kn, an, g.legW0 * 1.1, g.legWj * 1.1, g.legW1, 0.4, 0.44), s.bottom.color, { shade: 0.8 })
        drawFoot(P, s, g, { x: an.x - side * g.footL * 0.3, y: -g.footH }, -side, -side, 0)
      }
    } else {
      for (const [hj, kn, ft, side, fy] of [[k.hjR, k.knR, k.ftR, -1, pose.rfy], [k.hjL, k.knL, k.ftL, 1, pose.lfy]] as const) {
        const hemW = trousers ? g.legW1 * 1.22 : g.legW1
        // on a seat the thigh comes toward us: short, and as wide at the knee as at the hip
        const seatK = pose.sit > 0.5 ? 1.3 : 1
        P.shape(limbPath(hj, kn, { x: ft.x, y: ft.y + (trousers ? g.footH * 0.2 : g.footH * 0.4) }, g.legW0 * (seatK > 1 ? 1.1 : 1), g.legWj * (trousers ? 1.06 : 1) * seatK, hemW, seatK > 1 ? 0.25 : 0.45), legCol, { shade: 0.9 })
        if (s.bottom.style === 'shorts' && !sil) P.shape(limbPath(hj, kn, ft, g.legW0 * 1.14, g.legWj * 1.24, g.legW1, 0.45, 0.42), s.bottom.color, { shade: 0.8 })
        if (s.shoes.style === 'boots' && !sil) P.shape(limbPath({ x: lerp(kn.x, ft.x, 0.42), y: lerp(kn.y, ft.y, 0.42) }, { x: lerp(kn.x, ft.x, 0.7), y: lerp(kn.y, ft.y, 0.7) }, { x: ft.x, y: ft.y + g.footH * 0.3 }, g.legW1 * 1.34, g.legW1 * 1.3, g.legW1 * 1.26, 0.2, 0.96), s.shoes.color, { shade: 0.6 })
        drawFoot(P, s, g, ft, side, pose.toe, clamp01(air + fy * 5), pose.tip)
      }
    }

    // 3 ─ hips, skirt, torso: in the torso's own leaning, squashing frame
    c.save()
    c.translate(k.hip.x, k.hip.y)
    c.rotate(pose.lean)
    c.scale(1 / Math.sqrt(pose.sq), 1)
    const T = k.T
    const ground = -k.hip.y
    const hemMax = pose.sit > 0.5 ? (pose.seat > 0.02 ? g.legW0 * 1.05 : ground * 0.9) : ground * 0.8
    const sw = pose.swing * g.hipW * 0.5
    const tx = back ? 0 : pose.turn * g.shW * 0.14
    if (s.bottom.style !== 'skirt') {
      // the seat of trousers or shorts (or of whatever is under a long top)
      const col = s.bottom.style === 'none' ? (hemOf(s, g) > 0 ? s.skin : s.top.color) : s.bottom.color
      const cy = g.legW0 * 0.62
      P.shape(blob([-g.hipW, -T * 0.2, -g.hipW * 1.02, cy * 0.5, -g.hipJ - g.legW0 * 0.46, cy, 0, cy * 0.7, g.hipJ + g.legW0 * 0.46, cy, g.hipW * 1.02, cy * 0.5, g.hipW, -T * 0.2]), col, { shade: 0.6 })
    } else {
      const grown = g.stage !== 'toddler' && g.stage !== 'child'
      const hem = Math.min(hemMax, legLen * (grown ? 0.66 : 0.44))
      const hw = g.hipW * (grown ? 1.42 : 1.6)
      const sk = new Path2D()
      sk.moveTo(-g.waistW * 0.94, -T * 0.16)
      sk.lineTo(g.waistW * 0.94, -T * 0.16)
      sk.quadraticCurveTo(g.hipW * 1.16, hem * 0.4, hw + sw, hem)
      sk.quadraticCurveTo(sw, hem + g.hipW * 0.2, -hw + sw, hem)
      sk.quadraticCurveTo(-g.hipW * 1.16, hem * 0.4, -g.waistW * 0.94, -T * 0.16)
      P.shape(sk, s.bottom.color)
      P.detail(curve([-g.hipW * 0.4, hem * 0.3, -hw * 0.5 + sw, hem * 0.96]), s.bottom.color, 0.7)
      P.detail(curve([g.hipW * 0.36, hem * 0.36, hw * 0.44 + sw, hem * 0.98]), s.bottom.color, 0.7)
    }

    const style = s.top.style
    const long = hemOf(s, g)
    const topCol = style === 'apron' ? underTop(s) : s.top.color
    const hem = long > 0 ? Math.min(hemMax, legLen * long) : g.legW0 * 0.3
    const hemW = style === 'dress' ? g.hipW * (1.36 + 0.5 * long) : long > 0 ? g.hipW * 1.16 : g.hipW * 1.04
    const sx = g.shW
    const top = new Path2D()
    top.moveTo(-sx * 0.46, -T - g.shDrop * 0.5)
    top.quadraticCurveTo(-sx * 0.98, -T - g.shDrop * 0.3, -sx * 1.02, -T + g.shDrop * 1.1)
    top.bezierCurveTo(-g.waistW * 1.04, -T * 0.6, -g.waistW * 1.02, -T * 0.2, -hemW + (long > 0 ? sw : 0), hem)
    top.quadraticCurveTo((long > 0 ? sw : 0), hem + (long > 0 ? g.hipW * 0.22 : g.hipW * 0.1), hemW + (long > 0 ? sw : 0), hem)
    top.bezierCurveTo(g.waistW * 1.02, -T * 0.2, g.waistW * 1.04, -T * 0.6, sx * 1.02, -T + g.shDrop * 1.1)
    top.quadraticCurveTo(sx * 0.98, -T - g.shDrop * 0.3, sx * 0.46, -T - g.shDrop * 0.5)
    top.closePath()
    P.shape(top, topCol, { shade: 1.25, over: () => pattern(P, s, -hemW - 20, -T - 10, hemW + 20, hem + 20, g.shW) })
    const topM = c.getTransform()

    if (!sil) {
      const trim = s.top.trim ?? mixHex(topCol, '#2a1830', 0.22)
      const neckW = g.headRx * 0.34
      if (!back) {
        if (style === 'tee' || style === 'dress' || style === 'tunic') {
          // a scooped neck showing skin, edged
          const nk = blob([tx - neckW * 1.5, -T - g.shDrop * 0.7, tx - neckW * 1.3, -T + neckW * 0.5, tx, -T + neckW * 0.9, tx + neckW * 1.3, -T + neckW * 0.5, tx + neckW * 1.5, -T - g.shDrop * 0.7])
          P.shape(nk, s.skin, { shade: 0, ink: trim, line: 1.3 })
          if (style === 'tunic') {
            P.detail(curve([tx, -T + neckW * 0.9, tx, -T * 0.52]), topCol, 0.8)
            for (const u of [0.12, 0.3]) P.flat(circle(tx + neckW * 0.3, -T + neckW * 0.9 + T * u, g.shW * 0.045), trim)
          }
          if (style === 'dress') P.detail(curve([-g.waistW * 0.98, -T * 0.22, 0, -T * 0.17, g.waistW * 0.98, -T * 0.22]), topCol, 0.7)
        } else if (style === 'shirt') {
          const cw = neckW * 1.7
          P.detail(curve([tx, -T + neckW * 0.5, tx, hem - 2]), topCol, 0.7)
          for (const u of [0.3, 0.52, 0.74]) P.flat(circle(tx, -T + T * u, g.shW * 0.045), mixHex(topCol, '#2a1830', 0.5))
          for (const sd of [-1, 1]) P.shape(blob([tx + sd * cw, -T - g.shDrop * 0.6, tx + sd * 2, -T - g.shDrop * 0.5, tx + sd * 1, -T + neckW * 0.4, tx + sd * cw * 0.72, -T + neckW * 1.3]), s.top.trim ?? topCol, { shade: 0.3, line: 0.8 })
        } else if (style === 'jumper' || style === 'apron') {
          P.shape(ellipse(tx, -T - g.shDrop * 0.2, neckW * 1.5, neckW * 0.62), style === 'apron' ? topCol : trim, { shade: 0.3, line: 0.8 })
          if (style === 'jumper') P.shape(rrect(-hemW, hem - g.shW * 0.2, hemW * 2, g.shW * 0.22, g.shW * 0.1), trim, { shade: 0.3, line: 0.8 })
        } else if (style === 'coat') {
          // open over what is under it: a strip of the under-top, two lapels, buttons
          const under = underTop(s)
          P.clip(top, () => P.flat(blob([tx - neckW * 1.2, -T - 8, tx + neckW * 1.2, -T - 8, tx + neckW * 0.5, hem + 10, tx - neckW * 0.5, hem + 10]), under))
          for (const sd of [-1, 1]) {
            P.shape(blob([tx + sd * neckW * 1.7, -T - g.shDrop * 0.6, tx + sd * neckW * 0.3, -T + T * 0.34, tx + sd * neckW * 0.6, -T + T * 0.44, tx + sd * neckW * 2.3, -T + T * 0.1]), topCol, { shade: 0.4, line: 0.8 })
            P.detail(curve([tx + sd * neckW * 0.56, -T + T * 0.44, tx + sd * neckW * 0.54, hem]), topCol, 0.8)
          }
          for (const u of [0.56, 0.78]) P.flat(circle(tx + neckW * 1.2, -T + T * u, g.shW * 0.055), mixHex(topCol, '#2a1830', 0.5))
        }
        if (style === 'apron') {
          // the bib and skirt of the apron over the jumper, a pocket, the neck strap
          const ah = Math.min(hemMax, legLen * 0.4)
          const bw = g.shW * 0.56
          const ap = new Path2D()
          ap.moveTo(-bw, -T * 0.86)
          ap.lineTo(bw, -T * 0.86)
          ap.quadraticCurveTo(bw * 1.1, -T * 0.4, g.waistW * 1.0, -T * 0.34)
          ap.quadraticCurveTo(g.hipW * 1.2, ah * 0.3, g.hipW * 1.12 + sw, ah)
          ap.quadraticCurveTo(sw, ah + g.hipW * 0.16, -g.hipW * 1.12 + sw, ah)
          ap.quadraticCurveTo(-g.hipW * 1.2, ah * 0.3, -g.waistW * 1.0, -T * 0.34)
          ap.quadraticCurveTo(-bw * 1.1, -T * 0.4, -bw, -T * 0.86)
          for (const sd of [-1, 1]) P.line(curve([sd * bw * 0.8, -T * 0.86, sd * neckW * 1.3, -T - g.shDrop * 0.4]), s.top.color, g.shW * 0.11)
          P.shape(ap, s.top.color, { shade: 0.9, over: () => pattern(P, s, -g.hipW * 1.4, -T, g.hipW * 1.4, ah + 20, g.shW) })
          P.shape(rrect(-bw * 0.62, -T * 0.16, bw * 1.24, T * 0.28, g.shW * 0.08), s.top.color, { shade: 0.4, line: 0.8 })
        }
      } else if (style === 'apron') {
        P.line(curve([-g.waistW, -T * 0.34, 0, -T * 0.3, g.waistW, -T * 0.34]), s.top.color, g.shW * 0.1)
      }
      if (s.extras?.includes('bag')) {
        const bag = s.extraColors?.bag ?? '#a9683c'
        const d = back ? -1 : 1
        P.line(curve([d * sx * 0.7, -T - g.shDrop * 0.2, -d * g.hipW * 0.9, -T * 0.06]), bag, g.shW * 0.12)
        c.save()
        c.translate(-d * g.hipW * 0.94, -T * 0.08)
        c.rotate(pose.swing * 0.6 - pose.lean)
        P.shape(rrect(-g.shW * 0.42, 0, g.shW * 0.84, g.shW * 0.7, g.shW * 0.14), bag, { shade: 0.7 })
        P.shape(blob([-g.shW * 0.44, -2, g.shW * 0.44, -2, g.shW * 0.4, g.shW * 0.34, 0, g.shW * 0.44, -g.shW * 0.4, g.shW * 0.34]), mixHex(bag, '#2a1830', 0.16), { shade: 0.3, line: 0.8 })
        P.flat(circle(0, g.shW * 0.34, g.shW * 0.05), '#f3d9a0')
        c.restore()
      }
    }
    c.restore()

    // 4 ─ neck, scarf
    const nw = g.headRx * (g.stage === 'toddler' ? 0.5 : 0.42)
    if (!sil && s.hair.style !== 'covered') {
      const nb = { x: lerp(k.chest.x, k.head.x, 0.5), y: lerp(k.chest.y, k.head.y, 0.5) }
      P.shape(limbPath({ x: k.chest.x, y: k.chest.y + nw * 0.1 }, nb, k.head, nw, nw, nw, 0.2), s.skin, { shade: 0.7, line: 0.8 })
    }
    if (s.extras?.includes('scarf') && !sil) {
      const sc2 = s.extraColors?.scarf ?? s.top.trim ?? '#d9573f'
      const y = k.chest.y - g.shDrop * 0.4
      P.shape(blob([k.chest.x - nw * 1.5, y - nw * 0.5, k.chest.x, y - nw * 0.8, k.chest.x + nw * 1.5, y - nw * 0.5, k.chest.x + nw * 1.6, y + nw * 0.5, k.chest.x, y + nw * 0.9, k.chest.x - nw * 1.6, y + nw * 0.5]), sc2, { shade: 0.6 })
      if (!back) {
        c.save()
        c.translate(k.chest.x + nw * 0.7, y + nw * 0.4)
        c.rotate(pose.swing * 0.9 + 0.1)
        P.shape(blob([-nw * 0.5, 0, nw * 0.5, 0, nw * 0.62, k.T * 0.5, 0, k.T * 0.56, -nw * 0.62, k.T * 0.5]), sc2, { shade: 0.6 })
        for (const u of [-0.3, 0, 0.3]) P.detail(curve([nw * u, k.T * 0.44, nw * u * 1.2, k.T * 0.54]), sc2, 0.6)
        c.restore()
      }
    }

    // 5 ─ head (first, the shadow it throws on the chest and shoulders)
    if (!sil && P.style.shade.model !== 'flat') {
      const cur = c.getTransform()
      c.save()
      c.setTransform(topM)
      c.clip(top)
      c.setTransform(cur)
      c.globalAlpha = 0.85
      c.fillStyle = P.shadeOf(style === 'apron' ? underTop(s) : s.top.color)
      c.fill(ellipse(k.head.x - P.style.light.x * g.headRx * 0.36, k.head.y - P.style.light.y * g.headRy * 0.5, g.headRx * 0.96, g.headRy * 0.94, k.headAngle))
      c.restore()
    }
    c.save()
    c.translate(k.head.x, k.head.y)
    c.rotate(k.headAngle)
    if (sil) {
      P.flat(ellipse(0, -g.headRy * 0.04, g.headRx * 1.1, g.headRy * 1.08), s.skin)
      if (s.hair.style === 'long' || s.hair.style === 'covered') P.flat(ellipse(0, g.headRy * 0.6, g.headRx * 1.2, g.headRy * 1.2), s.skin)
      if (s.hair.style === 'bun') P.flat(circle(0, -g.headRy * 1.18, g.headRx * 0.44), s.skin)
      if (s.extras?.includes('hat')) P.flat(ellipse(0, -g.headRy * 0.56, g.headRx * 1.62, g.headRy * 0.25), s.skin)
    } else {
      drawHead(P, s, g, pose, back)
      drawHairFront(P, s, g, pose, back)
    }
    c.restore()
  }

  // 6 ─ arms in front
  if (pass !== 'body') {
    if (pose.rBack < 0.5) armR()
    if (pose.lBack < 0.5) armL()
  }
  c.restore()
  P.unit = oldUnit
}

/** A walking stick, held in the right hand. */
function cane(s: Sheet, g: Rig): Held {
  const col = s.extraColors?.cane ?? '#8a5a3a'
  const len = g.footH + (g.legU + g.legL) * 0.86
  return (P) => {
    const w = g.armW1 * 0.36
    P.line(curve([-g.hand * 1.2, -g.hand * 0.5, -g.hand * 0.9, -g.hand * 1.5, 0, -g.hand * 1.5, 0, 0, 0, len]), mixHex(col, '#2a1830', 0.5), w + P.lineW() * 1.6)
    P.line(curve([-g.hand * 1.2, -g.hand * 0.5, -g.hand * 0.9, -g.hand * 1.5, 0, -g.hand * 1.5, 0, 0, 0, len]), col, w)
  }
}

/** The shadow a figure throws on the ground. Draw it before the figure. */
export function drawFigureShadow(P: Painter, sheet: Sheet, pose: Pose, o: FigureOpts = {}, len = 1) {
  const g = rigOf(sheet, P.style)
  const sc = o.scale ?? 1
  P.castShadow(pose.x, pose.y, () => drawFigure(P, sheet, { ...pose, x: 0, y: 0, lift: 0, rW: 0, lW: 0 }, { ...o, hold: undefined }), pose.lift * g.H * sc, len)
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
/** Standing height in stage units at this scale. */
export const heightOf = (P: Painter, sheet: Sheet, scale = 1) => rigOf(sheet, P.style).H * scale

export type { Skeleton }
