/**
 * From a character sheet to a skeleton: how big every part is (the rig) and where every joint is in a pose.
 * Pure arithmetic, no drawing, so it is tested in Node. Lengths are in the figure's local units, where an adult
 * of height 1.0 stands `ADULT` units tall; a scene scales the whole figure when it draws it.
 *
 * The skeleton is worked out in three dimensions and then looked at from the side the pose says (`spin`: 0 faces
 * us, a quarter turn is a side view, a half turn shows the back). So one pose can be seen from the front, in
 * three-quarter view or in profile, a turn passes through every view in between without a jump, and limbs that
 * point toward us are drawn short as they should be. Every joint keeps its depth (`d`, + = toward the viewer),
 * which is what decides what is drawn in front of what.
 */
import { BUILDS, type Sheet, type Stage } from '@/cast/sheet'
import type { Pt } from '../kit/core'
import type { StyleProfile } from '../style/profile'
import type { Pose } from './pose'

export const ADULT = 540

/** A point on the picture with its depth: x right, y down, d toward the viewer. */
export type P3 = { x: number; y: number; d: number }

type StageShape = { headW: number; neck: number; torso: number; arm: number; chub: number; hand: number; foot: number; eyeY: number; jaw: number; deep: number; belly: number; stoop: number; nose: number }
/** What a life stage does to the shape, beyond the sheet's own `build` numbers. */
const SHAPE: Record<Stage, StageShape> = {
  toddler: { headW: 1.05, neck: 0.012, torso: 0.57, arm: 0.41, chub: 1.5, hand: 0.078, foot: 0.2, eyeY: 0.2, jaw: 0, deep: 0.76, belly: 0.3, stoop: 0, nose: 0.5 },
  child: { headW: 0.99, neck: 0.03, torso: 0.5, arm: 0.44, chub: 1.2, hand: 0.066, foot: 0.185, eyeY: 0.15, jaw: 0.15, deep: 0.66, belly: 0.16, stoop: 0, nose: 0.62 },
  teen: { headW: 0.91, neck: 0.05, torso: 0.45, arm: 0.455, chub: 1.02, hand: 0.056, foot: 0.165, eyeY: 0.09, jaw: 0.4, deep: 0.58, belly: 0.06, stoop: 0, nose: 0.86 },
  adult: { headW: 0.87, neck: 0.06, torso: 0.44, arm: 0.46, chub: 1, hand: 0.051, foot: 0.155, eyeY: 0.06, jaw: 0.6, deep: 0.58, belly: 0.08, stoop: 0, nose: 1 },
  elder: { headW: 0.89, neck: 0.05, torso: 0.46, arm: 0.455, chub: 1, hand: 0.051, foot: 0.155, eyeY: 0.07, jaw: 0.5, deep: 0.62, belly: 0.16, stoop: 0.12, nose: 1.1 },
}

export type Rig = {
  stage: Stage
  /** Standing height, ground to crown. */
  H: number
  headRx: number
  headRy: number
  /** Half the head's depth, front to back. */
  headRz: number
  /** Where the eyes sit below the head's centre, and how square the jaw is (0 round … 1). */
  eyeY: number
  jaw: number
  /** How far the nose stands out in profile, 0 a baby's … 1 a grown-up's. */
  nose: number
  /** Shoulder line to the head's centre. */
  neck: number
  /** Shoulder line to hip line. */
  torso: number
  /** Half widths: shoulders, waist, hips. */
  shW: number
  waistW: number
  hipW: number
  /** Half depths (front to back) of the chest, the waist and the hips, and how far the tummy stands forward. */
  chestD: number
  waistD: number
  hipD: number
  belly: number
  /** The forward bend a body of this age stands with, radians. */
  stoop: number
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
  const chestD = shW * k.deep * (0.84 + 0.36 * g)
  return {
    stage: sheet.stage,
    H: B + headRy * 2,
    headRx,
    headRy,
    headRz: headRx * (sheet.stage === 'toddler' || sheet.stage === 'child' ? 1.03 : 1.08),
    eyeY: k.eyeY,
    jaw: k.jaw,
    nose: k.nose,
    neck: neckGap + headRy * 0.9,
    torso,
    shW,
    waistW: ((shW + hipW) / 2) * (0.86 + 0.36 * g),
    hipW,
    chestD,
    waistD: chestD * (0.84 + 0.5 * g),
    hipD: Math.max(hipW * (k.deep + 0.1), legW0 * 0.62),
    belly: chestD * k.belly * (0.5 + g),
    stoop: k.stoop,
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

/** The two level directions of something turned by `yaw`: `x` to its own left (screen right when it faces us), `z` the way it faces. */
export type Axes = { x: P3; z: P3 }
export const axes = (yaw: number): Axes => {
  const c = Math.cos(yaw)
  const s = Math.sin(yaw)
  return { x: { x: c, y: 0, d: -s }, z: { x: s, y: 0, d: c } }
}
const V = (x: number, y: number, d: number): P3 => ({ x, y, d })
const add = (a: P3, b: P3, k = 1): P3 => ({ x: a.x + b.x * k, y: a.y + b.y * k, d: a.d + b.d * k })
const sub = (a: P3, b: P3): P3 => ({ x: a.x - b.x, y: a.y - b.y, d: a.d - b.d })
const mul = (a: P3, k: number): P3 => ({ x: a.x * k, y: a.y * k, d: a.d * k })
const dot = (a: P3, b: P3) => a.x * b.x + a.y * b.y + a.d * b.d
const len = (a: P3) => Math.hypot(a.x, a.y, a.d)
const mix3 = (a: P3, b: P3, k: number): P3 => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, d: a.d + (b.d - a.d) * k })
/** Turn a vector in the plane of the picture (a tilt of the head or the shoulders). */
const roll = (v: P3, a: number): P3 => ({ x: v.x * Math.cos(a) - v.y * Math.sin(a), y: v.x * Math.sin(a) + v.y * Math.cos(a), d: v.d })
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const DOWN = V(0, 1, 0)

export type Skeleton = {
  /** Everything is local to the figure's ground point (x right, y down, the ground at 0), before lift and tumble. */
  hip: P3
  /** The middle of the spine (the spine is a curve from `hip` through `mid` to `chest`). */
  mid: P3
  chest: P3
  head: P3
  /** Tilt of the head in the picture, radians. */
  headAngle: number
  /** Which way the body, the hips, the chest and the head face: 0 toward us, + toward screen right. */
  yaw: number
  yawHip: number
  yawChest: number
  yawHead: number
  /** Tilt of the hip line and of the shoulder line in the picture, radians (they counter each other when the weight is on one leg). */
  hipRoll: number
  shRoll: number
  /** Unit vector up the spine. */
  up: P3
  /** Torso length in this pose. */
  T: number
  shR: P3
  shL: P3
  elR: P3
  elL: P3
  haR: P3
  haL: P3
  hjR: P3
  hjL: P3
  knR: P3
  knL: P3
  ftR: P3
  ftL: P3
  /** Which way each foot points (as `yaw`), and how far its heel is lifted (radians, + = heel up). */
  footYawR: number
  footYawL: number
  footPitchR: number
  footPitchL: number
  /** Local point → world (stage units). */
  world: (p: Pt) => Pt
  /** World point (stage units) → local. */
  local: (x: number, y: number) => Pt
  /** Kept for older callers: the elbows no longer have two solutions to choose between. */
  choice: [number, number]
}

/** Two bones from `s` reaching for `t`: the joint between them bends toward `pole`. Never flips: it is one solution. */
function ik3(s: P3, t: P3, l1: number, l2: number, pole: P3): { j: P3; e: P3 } {
  let dv = sub(t, s)
  let d = len(dv)
  if (d < 1e-6) {
    dv = DOWN
    d = 1
  }
  const n = mul(dv, 1 / d)
  const max = (l1 + l2) * 0.995
  const min = Math.abs(l1 - l2) + (l1 + l2) * 0.08
  const dd = d > max ? max : d < min ? min : d
  const a = (l1 * l1 - l2 * l2 + dd * dd) / (2 * dd)
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a))
  let pp = sub(pole, mul(n, dot(pole, n)))
  let pl = len(pp)
  if (pl < 1e-3) {
    pp = Math.abs(n.y) < 0.9 ? sub(DOWN, mul(n, n.y)) : sub(V(0, 0, -1), mul(n, -n.d))
    pl = len(pp) || 1
  }
  return { j: add(add(s, n, a), pp, h / pl), e: add(s, n, dd) }
}

/** Where every joint is. `sc` is the scale the figure is drawn at (needed to bring world targets into local units). */
export function solve(g: Rig, p: Pose, sc = 1): Skeleton {
  const yaw = p.spin
  const tw = p.twist ?? 0
  const yawChest = yaw + tw * 0.5
  const yawHip = yaw - tw * 0.5
  const B = axes(yaw)
  const C = axes(yawChest)
  const HP = axes(yawHip)
  const legLen = g.legU + g.legL
  const heel = p.tip * g.footL * 0.36
  const rK = p.rKneel ?? 0
  const lK = p.lKneel ?? 0
  const kneel = Math.max(rK, lK)
  const stand = g.footH + heel + legLen * (1 - 0.42 * p.crouch)
  const seated = p.seat > 0.02 ? g.footH + p.seat * legLen + g.legW0 * 0.3 : g.legW0 * 0.52
  const kneelH = g.legWj * 0.5 + g.legU * 0.98
  let hipH = stand + (seated - stand) * p.sit
  hipH += (kneelH - hipH) * kneel
  const pitchA = p.pitch * 0.95 + g.stoop * (1 - 0.6 * p.sit)
  // a body that bends forward puts its hips back to stay over its feet
  const hipZ = -Math.sin(pitchA) * g.torso * 0.34 * (1 - p.sit)
  const hip = add(add(V(0, -hipH, 0), B.x, p.hipx * g.shW), B.z, hipZ)

  const sl = Math.sin(p.lean)
  const cl = Math.cos(p.lean)
  const cp = Math.cos(pitchA)
  const up = add(add(mul(B.x, sl * cp), V(0, -cl * cp, 0)), B.z, Math.sin(pitchA))
  const T = g.torso * p.sq
  const chest = add(hip, up, T)
  // the spine is a curve: it bows toward the leg that carries the weight, and rounds when the body bends or slumps
  const arc = (p.arc ?? 0) + 0.55 * p.pitch + g.stoop * 1.6
  const mid = add(add(add(hip, up, T * 0.5), B.x, g.shW * 0.14 * p.hipx), B.z, -T * 0.11 * arc)

  const hipRoll = -0.17 * p.hipx + (p.hipTilt ?? 0)
  const shRoll = p.lean + 0.13 * p.hipx + (p.shTilt ?? 0)
  const latC = roll(C.x, shRoll * Math.abs(Math.cos(yawChest)))
  const sh0R = add(add(chest, latC, -g.shJ), up, -g.shDrop)
  const sh0L = add(add(chest, latC, g.shJ), up, -g.shDrop)

  const headAngle = p.lean * 0.5 + p.tilt
  const yawHead = yawChest + p.turn * 0.95
  const nd0 = add(mul(up, 0.62), V(0, -0.38, 0))
  const nd = mul(nd0, 1 / (len(nd0) || 1))
  const head = add(add(chest, nd, g.neck * (1 - 0.12 * p.pitch)), C.z, g.headRx * (0.9 * g.stoop + 0.1 * p.pitch))
  const HD = axes(yawHead)
  const latH = roll(HD.x, headAngle)
  const downH = roll(DOWN, headAngle)

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
  const arm = (s0: P3, side: number, ox: number, oy: number, oz: number, Bw: number, Bx: number, By: number, Hw: number, Hx: number, Hy: number, W: number, Wx: number, Wy: number, Wd: number, back: number, bend: number) => {
    let t = add(add(add(s0, C.x, side * ox * armLen), DOWN, oy * armLen), C.z, oz * armLen)
    if (Bw > 0) {
      const front = g.chestD + (g.waistD + g.belly - g.chestD) * clamp01(By) + g.hand * 0.7
      t = mix3(t, add(add(add(chest, latC, side * Bx * g.shW), up, -By * T), C.z, front), Bw)
    }
    if (Hw > 0) {
      const q = (Hx / 1.15) * (Hx / 1.15) + (Hy / 1.25) * (Hy / 1.25)
      const zf = q < 1 ? Math.sqrt(1 - q) : 0
      t = mix3(t, add(add(add(head, latH, side * Hx * g.headRx), downH, Hy * g.headRy), HD.z, g.headRz * zf + g.hand * 0.6), Hw)
    }
    if (W > 0) {
      const q = local(Wx, Wy)
      t = mix3(t, V(q.x, q.y, s0.d + armLen * (0.12 + Wd)), W)
    }
    if (back >= 0.5) {
      // the hand goes behind the body: the same place, the other side of the chest
      const z = dot(sub(t, chest), C.z)
      t = add(t, C.z, z > 0 ? -2 * z - g.hand * 0.5 : -g.chestD * 0.9)
    }
    // the shoulder goes with the arm: up when the hand is raised, out and forward when it reaches
    const dv = sub(t, s0)
    const dist = len(dv) || 1
    const reach = clamp01(dist / armLen)
    const raise = clamp01(((s0.y - t.y) / armLen) * 1.1 + 0.08)
    const s = add(add(s0, dv, (g.shW * 0.11 * reach) / dist), DOWN, -g.shW * 0.24 * raise * reach)
    // elbows bend back, down and a little out; `bend` (0…1) swings the elbow round the arm when a pose asks
    let pole = add(add(mul(C.x, side * 0.5), DOWN, 0.55), C.z, -0.7)
    if (bend >= 0) pole = add(add(mul(C.x, side * (0.5 + (bend - 0.5) * 1.6)), DOWN, 0.55 - (bend - 0.5) * 1.2), C.z, -0.7 + Math.abs(bend - 0.5) * 0.6)
    const r = ik3(s, t, g.armU, g.armL, pole)
    return { s, j: r.j, e: r.e }
  }
  const R = arm(sh0R, -1, p.rx, p.ry, p.rz ?? 0, p.rB, p.rBx, p.rBy, p.rH, p.rHx, p.rHy, p.rW, p.rWx, p.rWy, p.rWd ?? 0, p.rBack, p.rBend)
  const L = arm(sh0L, 1, p.lx, p.ly, p.lz ?? 0, p.lB, p.lBx, p.lBy, p.lH, p.lHx, p.lHy, p.lW, p.lWx, p.lWy, p.lWd ?? 0, p.lBack, p.lBend)

  const latP = roll(HP.x, hipRoll * Math.abs(Math.cos(yawHip)))
  const hjR = add(hip, latP, -g.hipJ)
  const hjL = add(hip, latP, g.hipJ)
  const LA = axes(yaw + p.toe * 1.2)
  const hx = p.hipx * g.shW
  const leg = (hj: P3, side: number, fx: number, fy: number, fz: number, kn: number, other: number) => {
    // standing: the foot stays where the ground is, whatever the hips do
    let t = add(add(V(0, -g.footH - heel - fy * legLen, 0), B.x, side * g.stance + fx * legLen), B.z, fz * legLen)
    let pole = add(LA.z, LA.x, side * 0.3)
    if (p.sit > 0) {
      let ts: P3
      let ps: P3
      if (p.seat > 0.02) {
        // on a seat: thighs level and forward, shins hanging; feet dangle if they do not reach
        ts = add(add(V(0, Math.min(-g.footH, -hipH + g.legW0 * 0.2 + g.legL * 0.99) - fy * legLen, 0), B.x, hx + side * g.stance * 0.86 + fx * legLen), B.z, hipZ + g.legU * 0.95 + fz * legLen)
        ps = add(mul(LA.z, 0.5), DOWN, -1)
      } else {
        // on the ground: legs crossed, or stretched out in front when the pose pushes the feet forward
        const out = clamp01(fz / 0.3)
        const cross = add(add(V(0, -g.footH * 0.7 - fy * legLen, 0), B.x, hx - side * g.hipJ * 0.5 + fx * legLen), B.z, hipZ + g.legU * 0.66)
        const flat = add(add(V(0, -g.footH * 0.9 - fy * legLen, 0), B.x, hx + side * g.stance * 0.8 + fx * legLen), B.z, hipZ + legLen * 0.96)
        ts = mix3(cross, flat, out)
        ps = mix3(add(add(mul(B.x, side), B.z, 0.3), DOWN, -0.14), add(mul(B.x, side * 0.2), DOWN, -1), out)
      }
      t = mix3(t, ts, p.sit)
      pole = mix3(pole, ps, p.sit)
    }
    if (kn > 0) {
      // this knee is on the ground: the shin lies back along it
      t = mix3(t, add(add(V(0, -g.legW1 * 0.55, 0), B.x, hx + side * g.stance * 0.9), B.z, hipZ - g.legL * 0.99), kn)
      pole = mix3(pole, add(DOWN, LA.z, 0.3), kn)
    } else if (other > 0) {
      // the other knee is down: this foot stands flat in front, knee up
      t = mix3(t, add(add(V(0, -g.footH, 0), B.x, hx + side * g.stance), B.z, hipZ + g.legU * 0.92), other)
      pole = mix3(pole, add(LA.z, DOWN, -0.7), other)
    }
    return ik3(hj, t, g.legU * 1.03, g.legL * 1.03, pole)
  }
  const LR = leg(hjR, -1, p.rfx, p.rfy, p.rfz ?? 0, rK, lK)
  const LL = leg(hjL, 1, p.lfx, p.lfy, p.lfz ?? 0, lK, rK)
  const splay = 0.2 * (1 - p.sit)

  return {
    hip, mid, chest, head, headAngle, yaw, yawHip, yawChest, yawHead, hipRoll, shRoll, up, T,
    shR: R.s, shL: L.s, elR: R.j, elL: L.j, haR: R.e, haL: L.e,
    hjR, hjL, knR: LR.j, knL: LL.j, ftR: LR.e, ftL: LL.e,
    footYawR: yaw + p.toe * 1.2 - splay, footYawL: yaw + p.toe * 1.2 + splay,
    footPitchR: (p.rfa ?? 0) + rK * 1.3, footPitchL: (p.lfa ?? 0) + lK * 1.3,
    world, local, choice: [0.5, 0.5],
  }
}

/** The scale a figure is drawn at when an adult of height 1.0 should stand `adultPx` stage units tall. */
export const scaleFor = (adultPx: number) => adultPx / ADULT
