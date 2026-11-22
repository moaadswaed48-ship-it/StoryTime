/**
 * From a character sheet to a skeleton: how big every part is (the rig) and where every joint is in a pose.
 * Pure arithmetic, no drawing, so it is tested in Node. Lengths are in the figure's local units, where an adult
 * of height 1.0 stands `ADULT` units tall; a scene scales the whole figure when it draws it.
 */
import { BUILDS, type Sheet, type Stage } from '@/cast/sheet'
import type { Pt } from '../kit/core'
import type { StyleProfile } from '../style/profile'
import type { Pose } from './pose'

export const ADULT = 540

type StageShape = { headW: number; neck: number; torso: number; arm: number; chub: number; hand: number; foot: number; eyeY: number; jaw: number }
/** What a life stage does to the shape, beyond the sheet's own `build` numbers. */
const SHAPE: Record<Stage, StageShape> = {
  toddler: { headW: 1.05, neck: 0.012, torso: 0.57, arm: 0.41, chub: 1.5, hand: 0.105, foot: 0.2, eyeY: 0.2, jaw: 0 },
  child: { headW: 0.99, neck: 0.03, torso: 0.5, arm: 0.44, chub: 1.2, hand: 0.086, foot: 0.185, eyeY: 0.15, jaw: 0.15 },
  teen: { headW: 0.91, neck: 0.05, torso: 0.45, arm: 0.455, chub: 1.02, hand: 0.067, foot: 0.165, eyeY: 0.09, jaw: 0.4 },
  adult: { headW: 0.87, neck: 0.06, torso: 0.44, arm: 0.46, chub: 1, hand: 0.059, foot: 0.155, eyeY: 0.06, jaw: 0.6 },
  elder: { headW: 0.89, neck: 0.05, torso: 0.46, arm: 0.455, chub: 1, hand: 0.059, foot: 0.155, eyeY: 0.07, jaw: 0.5 },
}

export type Rig = {
  stage: Stage
  /** Standing height, ground to crown. */
  H: number
  headRx: number
  headRy: number
  /** Where the eyes sit below the head's centre, and how square the jaw is (0 round … 1). */
  eyeY: number
  jaw: number
  /** Shoulder line to the head's centre. */
  neck: number
  /** Shoulder line to hip line. */
  torso: number
  /** Half widths: shoulders, waist, hips. */
  shW: number
  waistW: number
  hipW: number
  /** Shoulder joints: half the distance between them, and how far they sit below the shoulder line. */
  shJ: number
  shDrop: number
  armU: number
  armL: number
  /** Limb widths at the root, the joint and the end. */
  armW0: number
  armWj: number
  armW1: number
  hand: number
  hipJ: number
  legU: number
  legL: number
  legW0: number
  legWj: number
  legW1: number
  footH: number
  footL: number
  /** How far each ankle rests from the centre line. */
  stance: number
  girth: number
}

const RIGS = new WeakMap<Sheet, Map<string, Rig>>()
/** The rig of a sheet under a style profile (worked out once per sheet and profile). */
export function rigOf(sheet: Sheet, st: StyleProfile): Rig {
  let m = RIGS.get(sheet)
  if (!m) RIGS.set(sheet, (m = new Map()))
  let g = m.get(st.id)
  if (!g) m.set(st.id, (g = makeRig(sheet, st)))
  return g
}

function makeRig(sheet: Sheet, st: StyleProfile): Rig {
  const b = { ...BUILDS[sheet.stage], ...sheet.build }
  const k = SHAPE[sheet.stage]
  const px = st.proportions
  const H0 = b.height * ADULT
  const head0 = H0 / b.heads
  const headRy = (head0 * px.head) / 2
  const headRx = headRy * k.headW
  const B = H0 - head0
  const neckGap = B * k.neck
  const footH = B * 0.045
  const trunk = B - neckGap - footH
  const torso = trunk * k.torso
  const leg = trunk - torso
  const g = b.girth
  const shW = (b.shoulders * head0 * k.headW) / 2
  const armW0 = B * 0.082 * k.chub * (0.85 + 0.4 * g) * px.limb
  const legW0 = B * 0.118 * k.chub * (0.8 + 0.5 * g) * px.limb
  const hipW = Math.max(shW * (0.74 + 0.34 * g), legW0 * 1.02)
  const arm = B * k.arm
  return {
    stage: sheet.stage,
    H: B + headRy * 2,
    headRx,
    headRy,
    eyeY: k.eyeY,
    jaw: k.jaw,
    neck: neckGap + headRy * 0.9,
    torso,
    shW,
    waistW: ((shW + hipW) / 2) * (0.86 + 0.36 * g),
    hipW,
    shJ: shW - armW0 * 0.4,
    shDrop: armW0 * 0.42,
    armU: arm * 0.5,
    armL: arm * 0.5,
    armW0,
    armWj: armW0 * 0.86,
    armW1: armW0 * 0.7,
    hand: B * k.hand * px.hands,
    hipJ: hipW * 0.5,
    legU: leg * 0.5,
    legL: leg * 0.5,
    legW0,
    legWj: legW0 * 0.8,
    legW1: legW0 * 0.64,
    footH,
    footL: B * k.foot * px.feet,
    stance: hipW * 0.56,
    girth: g,
  }
}

export type Skeleton = {
  /** Everything is local to the figure's ground point (x right, y down, the ground at 0), before lift and tumble. */
  hip: Pt
  chest: Pt
  head: Pt
  headAngle: number
  /** Torso length in this pose. */
  T: number
  shR: Pt
  shL: Pt
  elR: Pt
  elL: Pt
  haR: Pt
  haL: Pt
  hjR: Pt
  hjL: Pt
  knR: Pt
  knL: Pt
  ftR: Pt
  ftL: Pt
  /** Local point → world (stage units). */
  world: (p: Pt) => Pt
  /** The rig's own choice of bend for [right elbow, left elbow]. */
  choice: [number, number]
}

function ik(sx: number, sy: number, tx: number, ty: number, l1: number, l2: number, force: number, soft: number, pick: (jx: number, jy: number, mx: number, my: number) => number) {
  let dx = tx - sx
  let dy = ty - sy
  let d = Math.hypot(dx, dy)
  const max = (l1 + l2) * 0.995
  if (d > max) {
    dx *= max / d
    dy *= max / d
    d = max
  }
  const min = Math.abs(l1 - l2) + (l1 + l2) * 0.08
  if (d < min) {
    if (d < 1e-6) {
      dx = 0
      dy = 1
      d = 1
    }
    dx *= min / d
    dy *= min / d
    d = min
  }
  const a = Math.atan2(dy, dx)
  const off = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))))
  const mx = sx + dx / 2
  const my = sy + dy / 2
  const j1 = { x: sx + Math.cos(a + off) * l1, y: sy + Math.sin(a + off) * l1 }
  const j2 = { x: sx + Math.cos(a - off) * l1, y: sy + Math.sin(a - off) * l1 }
  // the joint bends to whichever side scores better; near a tie it slides across instead of flipping (no pops)
  const own = Math.max(0, Math.min(1, 0.5 + (pick(j1.x, j1.y, mx, my) - pick(j2.x, j2.y, mx, my)) / soft))
  const w = force >= 0 ? force : own
  return { j: { x: j2.x + (j1.x - j2.x) * w, y: j2.y + (j1.y - j2.y) * w }, e: { x: sx + dx, y: sy + dy }, own }
}

/** Where every joint is. `sc` is the scale the figure is drawn at (needed to bring world targets into local units). */
export function solve(g: Rig, p: Pose, sc = 1): Skeleton {
  const legLen = g.legU + g.legL
  const stand = g.footH + legLen * (1 - 0.42 * p.crouch)
  const seated = p.seat > 0.02 ? p.seat * legLen + g.legW0 * 0.25 : g.legW0 * 0.52
  const hipH = stand + (seated - stand) * p.sit
  const hip = { x: p.hipx * g.shW, y: -hipH }
  const sl = Math.sin(p.lean)
  const cl = Math.cos(p.lean)
  const T = g.torso * p.sq * (1 - 0.34 * p.pitch)
  const chest = { x: hip.x + sl * T, y: hip.y - cl * T }
  const shR = { x: chest.x - cl * g.shJ - sl * g.shDrop, y: chest.y - sl * g.shJ + cl * g.shDrop }
  const shL = { x: chest.x + cl * g.shJ - sl * g.shDrop, y: chest.y + sl * g.shJ + cl * g.shDrop }
  const headAngle = p.lean * 0.5 + p.tilt
  const nk = g.neck * (1 - 0.5 * p.pitch)
  const head = { x: chest.x + Math.sin(headAngle) * nk, y: chest.y - Math.cos(headAngle) * nk + p.pitch * g.headRy * 0.7 }
  const ch = Math.cos(headAngle)
  const sh = Math.sin(headAngle)

  const cr = Math.cos(p.rot)
  const sr = Math.sin(p.rot)
  const liftY = p.lift * g.H
  const local = (wx: number, wy: number): Pt => {
    const x = (wx - p.x) / sc
    const y = (wy - p.y) / sc + liftY - hip.y
    return { x: x * cr + y * sr, y: -x * sr + y * cr + hip.y }
  }
  const world = (q: Pt): Pt => {
    const y = q.y - hip.y
    return { x: p.x + (q.x * cr - y * sr) * sc, y: p.y + (hip.y - liftY + q.x * sr + y * cr) * sc }
  }

  const armLen = g.armU + g.armL
  const arm = (s: Pt, side: number, ox: number, oy: number, B: number, Bx: number, By: number, Hw: number, Hx: number, Hy: number, W: number, Wx: number, Wy: number, force: number) => {
    let tx = s.x + side * ox * armLen
    let ty = s.y + oy * armLen
    if (B > 0) {
      const u = side * Bx * g.shW
      const v = By * T
      tx += (chest.x + u * cl - v * sl - tx) * B
      ty += (chest.y + u * sl + v * cl - ty) * B
    }
    if (Hw > 0) {
      const u = side * Hx * g.headRx
      const v = Hy * g.headRy
      tx += (head.x + u * ch - v * sh - tx) * Hw
      ty += (head.y + u * sh + v * ch - ty) * Hw
    }
    if (W > 0) {
      const t = local(Wx, Wy)
      tx += (t.x - tx) * W
      ty += (t.y - ty) * W
    }
    const ddx = Math.abs(tx - s.x)
    const ddy = Math.abs(ty - s.y)
    const k = ddy / (ddx + ddy + 0.001)
    // hanging or raised arm: elbow out to its own side; arm reaching sideways: elbow low
    return ik(s.x, s.y, tx, ty, g.armU, g.armL, force, armLen * 0.34, (jx, jy, mx, my) => k * side * (jx - mx) + (1 - k) * (jy - my))
  }
  const R = arm(shR, -1, p.rx, p.ry, p.rB, p.rBx, p.rBy, p.rH, p.rHx, p.rHy, p.rW, p.rWx, p.rWy, p.rBend)
  const L = arm(shL, 1, p.lx, p.ly, p.lB, p.lBx, p.lBy, p.lH, p.lHx, p.lHy, p.lW, p.lWx, p.lWy, p.lBend)

  const hjR = { x: hip.x - g.hipJ, y: hip.y }
  const hjL = { x: hip.x + g.hipJ, y: hip.y }
  const leg = (hj: Pt, side: number, fx: number, fy: number) => {
    if (p.sit > 0.5) {
      // on a seat: the thigh comes toward the viewer (short), the shin hangs from the knee; feet dangle if they do not reach
      const kn = { x: hj.x + side * g.legW0 * 0.3, y: hj.y + g.legU * 0.26 }
      return { j: kn, e: { x: kn.x + fx * legLen, y: Math.min(-g.footH, kn.y + g.legL) - fy * legLen } }
    }
    // knees point the way the shoes do; facing us, each knee goes out to its own side
    const d = Math.max(-1, Math.min(1, p.toe * 3.3))
    const dir = d + side * (1 - Math.abs(d))
    return ik(hj.x, hj.y, side * g.stance + fx * legLen, -g.footH - fy * legLen, g.legU * 1.03, g.legL * 1.03, -1, legLen * 0.3, (jx, _jy, mx) => dir * (jx - mx))
  }
  const LR = leg(hjR, -1, p.rfx, p.rfy)
  const LL = leg(hjL, 1, p.lfx, p.lfy)

  return { hip, chest, head, headAngle, T, shR, shL, elR: R.j, elL: L.j, haR: R.e, haL: L.e, hjR, hjL, knR: LR.j, knL: LL.j, ftR: LR.e, ftL: LL.e, world, choice: [R.own, L.own] }
}

/** The scale a figure is drawn at when an adult of height 1.0 should stand `adultPx` stage units tall. */
export const scaleFor = (adultPx: number) => adultPx / ADULT
