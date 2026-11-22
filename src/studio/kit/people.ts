/**
 * The three paper-cut puppets: Sari, Amir and Teacher Layla.
 *
 * A figure is posed with plain numbers (a `Pose`): where it stands, how far it crouches or leans, where each hand and
 * foot goes (arms and legs are solved with two-bone IK), and the face (turn, look, blink, brows, mouth). Poses are
 * animated with `track()` from core.ts. Screen-left limb is "a", screen-right limb is "b".
 */
import { C, Painter, TAU, blob, circle, clamp01, ellipse, poly, rrect } from './core'

export type Who = 'sari' | 'amir' | 'layla'

export type Pose = {
  /** Ground point between the feet (stage units) and height above it (a jump). */
  x: number
  y: number
  lift: number
  /** Hips: sideways shift, 0…1 crouch, torso lean (radians, + = toward screen right), squash (<1) / stretch (>1). */
  hipx: number
  crouch: number
  lean: number
  sq: number
  /** Whole-body rotation about the hips (tumbling in the air). */
  rot: number
  /** Head: −1…1 turn (− looks screen left), tilt (radians), 1 = seen from behind. */
  turn: number
  tilt: number
  back: number
  /** Face. */
  lookX: number
  lookY: number
  blink: number
  wide: number
  happy: number
  brow: number
  mOpen: number
  mWide: number
  mCurve: number
  /** Hands: offset from their own shoulder (x right, y down)… */
  ax: number
  ay: number
  bx: number
  by: number
  /** …or, weighted by `aw` / `bw` (0…1), a point in the world (gripping something). */
  aw: number
  awx: number
  awy: number
  bw: number
  bwx: number
  bwy: number
  /** Fingers held out: 1 points, 2 or 3 are a count. */
  aPoint: number
  bPoint: number
  /** 1 = that arm passes behind the body. */
  aBack: number
  bBack: number
  /** Feet: offset from the ground point (x right, y up). `toe`: −1…1, which way the shoes point. */
  fax: number
  fay: number
  fbx: number
  fby: number
  toe: number
  /** Swing of the things that hang (drawstrings, basket), radians. */
  swing: number
  /** 1 = sitting on the ground (the children cross-legged, the teacher kneeling on her skirt). */
  sit: number
  /** 1 = eyes crossed. */
  cross: number
  /**
   * Which way each elbow and knee bends, 0…1 between the two IK solutions, or −1 to let the rig choose. A film sets
   * these to the choice averaged over a few neighbouring moments, so a joint glides across instead of flipping.
   */
  bendA: number
  bendB: number
  kneeA: number
  kneeB: number
}

type Build = {
  leg: number
  ankle: number
  hipW: number
  legW: number
  torso: number
  sh: number
  shDrop: number
  armU: number
  armL: number
  armW: number
  hand: number
  headR: number
  neck: number
  helmetR: number
}

const BUILD: Record<Who, Build> = {
  sari: { leg: 76, ankle: 12, hipW: 21, legW: 31, torso: 94, sh: 41, shDrop: 15, armU: 40, armL: 38, armW: 27, hand: 13.5, headR: 56, neck: 46, helmetR: 90 },
  amir: { leg: 76, ankle: 12, hipW: 21, legW: 31, torso: 94, sh: 41, shDrop: 15, armU: 40, armL: 38, armW: 27, hand: 13.5, headR: 57, neck: 46, helmetR: 90 },
  layla: { leg: 168, ankle: 12, hipW: 20, legW: 17, torso: 152, sh: 43, shDrop: 17, armU: 64, armL: 60, armW: 25, hand: 13, headR: 50, neck: 44, helmetR: 84 },
}

/** Standing height from the ground to the top of the bubble helmet. */
export function heightOf(who: Who): number {
  const b = BUILD[who]
  return b.leg + b.ankle + b.torso + b.neck + b.helmetR + 6
}

export function rest(who: Who, x = 0, y = 0): Pose {
  const b = BUILD[who]
  const hang = b.armU + b.armL - 6
  return {
    x, y, lift: 0, hipx: 0, crouch: 0, lean: 0, sq: 1, rot: 0,
    turn: 0, tilt: 0, back: 0,
    lookX: 0, lookY: 0, blink: 0, wide: 0, happy: 0, brow: 0, mOpen: 0, mWide: 0.5, mCurve: 0.7,
    ax: -9, ay: hang, bx: 9, by: hang,
    aw: 0, awx: 0, awy: 0, bw: 0, bwx: 0, bwy: 0,
    aPoint: 0, bPoint: 0, aBack: 0, bBack: 0,
    fax: -23, fay: 0, fbx: 23, fby: 0, toe: 0,
    swing: 0, sit: 0, cross: 0,
    bendA: -1, bendB: -1, kneeA: -1, kneeB: -1,
  }
}

// ── skeleton ──────────────────────────────────────────────────────────────────
type Pt = { x: number; y: number }
export type Skeleton = {
  /** Everything is local to the figure's ground point (x right, y down, the ground at 0). */
  hip: Pt
  neck: Pt
  head: Pt
  headAngle: number
  shA: Pt
  shB: Pt
  elA: Pt
  elB: Pt
  haA: Pt
  haB: Pt
  hjA: Pt
  hjB: Pt
  knA: Pt
  knB: Pt
  ftA: Pt
  ftB: Pt
  hipH: number
  /** Local point → world. */
  world: (p: Pt) => Pt
  /** The rig's own choice of bend for [elbow a, elbow b, knee a, knee b]. */
  choice: [number, number, number, number]
}

function ik(sx: number, sy: number, tx: number, ty: number, l1: number, l2: number, force: number, pick: (jx: number, jy: number, mx: number, my: number) => number) {
  let dx = tx - sx
  let dy = ty - sy
  let d = Math.hypot(dx, dy)
  const max = l1 + l2 - 0.6
  if (d > max) {
    dx *= max / d
    dy *= max / d
    d = max
  }
  if (d < 1) {
    d = 1
    dy = 1
    dx = 0
  }
  const a = Math.atan2(dy, dx)
  const off = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))))
  const mx = sx + dx / 2
  const my = sy + dy / 2
  const j1 = { x: sx + Math.cos(a + off) * l1, y: sy + Math.sin(a + off) * l1 }
  const j2 = { x: sx + Math.cos(a - off) * l1, y: sy + Math.sin(a - off) * l1 }
  // the joint bends to whichever side scores better; near a tie it slides across instead of flipping (no pops)
  const own = Math.max(0, Math.min(1, 0.5 + (pick(j1.x, j1.y, mx, my) - pick(j2.x, j2.y, mx, my)) / 64))
  const w = force >= 0 ? force : own
  return { j: { x: j2.x + (j1.x - j2.x) * w, y: j2.y + (j1.y - j2.y) * w }, e: { x: sx + dx, y: sy + dy }, own }
}

export function skeleton(who: Who, p: Pose): Skeleton {
  const b = BUILD[who]
  const stand = (b.leg + b.ankle) * (1 - 0.48 * p.crouch)
  const hipH = stand + ((who === 'layla' ? 64 : 30) - stand) * p.sit
  const hip = { x: p.hipx, y: -hipH }
  const sl = Math.sin(p.lean)
  const cl = Math.cos(p.lean)
  const T = b.torso * p.sq
  const neck = { x: hip.x + sl * T, y: hip.y - cl * T }
  const shA = { x: neck.x - cl * b.sh - sl * b.shDrop, y: neck.y - sl * b.sh + cl * b.shDrop }
  const shB = { x: neck.x + cl * b.sh - sl * b.shDrop, y: neck.y + sl * b.sh + cl * b.shDrop }
  const headAngle = p.lean * 0.55 + p.tilt
  const head = { x: neck.x + Math.sin(headAngle) * b.neck, y: neck.y - Math.cos(headAngle) * b.neck }

  // world → local (undo the figure's place and its tumble about the hips)
  const cr = Math.cos(p.rot)
  const sr = Math.sin(p.rot)
  const local = (wx: number, wy: number): Pt => {
    const x = wx - p.x
    const y = wy - (p.y - p.lift) - hip.y
    return { x: x * cr + y * sr, y: -x * sr + y * cr + hip.y }
  }
  const world = (q: Pt): Pt => {
    const y = q.y - hip.y
    return { x: p.x + q.x * cr - y * sr, y: p.y - p.lift + hip.y + q.x * sr + y * cr }
  }

  const arm = (sh: Pt, ox: number, oy: number, w: number, wx: number, wy: number, side: number, force: number) => {
    let tx = sh.x + ox
    let ty = sh.y + oy
    if (w > 0) {
      const t = local(wx, wy)
      tx += (t.x - tx) * w
      ty += (t.y - ty) * w
    }
    const ddx = Math.abs(tx - sh.x)
    const ddy = Math.abs(ty - sh.y)
    const k = ddy / (ddx + ddy + 0.001)
    // hanging or raised arm: elbow out to its own side; arm reaching sideways: elbow low
    return ik(sh.x, sh.y, tx, ty, b.armU, b.armL, force, (jx, jy, mx, my) => k * side * (jx - mx) + (1 - k) * (jy - my))
  }
  const A = arm(shA, p.ax, p.ay, p.aw, p.awx, p.awy, -1, p.bendA)
  const B = arm(shB, p.bx, p.by, p.bw, p.bwx, p.bwy, 1, p.bendB)

  const hjA = { x: hip.x - b.hipW, y: hip.y }
  const hjB = { x: hip.x + b.hipW, y: hip.y }
  const half = (b.leg / 2) * 1.04
  const leg = (hj: Pt, fx: number, fy: number, side: number, force: number) => {
    // knees point the way the shoes do; facing the camera, each knee goes out to its own side
    const d = Math.max(-1, Math.min(1, p.toe * 3.3))
    const dir = d + side * (1 - Math.abs(d))
    return ik(hj.x, hj.y, fx, -fy - b.ankle, half, half, force, (jx, _jy, mx) => dir * (jx - mx))
  }
  const LA = leg(hjA, p.fax, p.fay, -1, p.kneeA)
  const LB = leg(hjB, p.fbx, p.fby, 1, p.kneeB)

  return { hip, neck, head, headAngle, shA, shB, elA: A.j, elB: B.j, haA: A.e, haB: B.e, hjA, hjB, knA: LA.j, knB: LB.j, ftA: LA.e, ftB: LB.e, hipH, world, choice: [A.own, B.own, LA.own, LB.own] }
}

/** Where a hand is in the world (to put something in it). */
export function handAt(who: Who, p: Pose, side: 'a' | 'b'): Pt {
  const s = skeleton(who, p)
  return s.world(side === 'a' ? s.haA : s.haB)
}
/** Where the centre of the head is in the world. */
export function headAt(who: Who, p: Pose): Pt {
  const s = skeleton(who, p)
  return s.world(s.head)
}

// ── drawing ───────────────────────────────────────────────────────────────────
export type PersonOpts = {
  helmet?: boolean
  /** 'body' leaves the front arms out, 'arms' draws only them (so hands can close over something). */
  pass?: 'all' | 'body' | 'arms'
  basket?: boolean
  /** Which arm the basket hangs on (default 'a'). */
  basketOn?: 'a' | 'b'
  /** Layla's hand lamp, drawn in hand b, aimed at this point in the world (or along her forearm). */
  lamp?: boolean
  lampAim?: { x: number; y: number }
  /** false = the lamp is still switched off. */
  lampLit?: boolean
  /** Extra warm light on the face from below (0…1) — Wameed's eye. */
  glow?: number
}

const COSTUME = {
  sari: { top: C.hoodie, topDark: C.hoodieDark, leg: C.jeans, cuff: C.jeansCuff, shoe: C.sneaker, sole: C.cream, hair: C.hairSari },
  amir: { top: C.jumper, topDark: C.jumperDark, leg: C.trousers, cuff: C.trousersCuff, shoe: C.shoe, sole: C.cream, hair: C.hairAmir },
  layla: { top: C.cardigan, topDark: C.cardiganDark, leg: C.cream, cuff: C.cream, shoe: C.shoe, sole: C.shoe, hair: C.hairLayla },
} as const

export function drawPerson(P: Painter, who: Who, p: Pose, o: PersonOpts = {}) {
  const c = P.ctx
  const b = BUILD[who]
  const k = COSTUME[who]
  const s = skeleton(who, p)
  const pass = o.pass ?? 'all'
  const body = pass !== 'arms'
  const helmet = o.helmet ?? true
  const back = p.back >= 0.5
  // a cast shadow only needs the outline: every inner detail is skipped
  const sil = P.light === 'sil'

  c.save()
  c.translate(p.x, p.y - p.lift)
  if (p.rot) {
    c.translate(0, s.hip.y)
    c.rotate(p.rot)
    c.translate(0, -s.hip.y)
  }

  const drawArm = (sh: Pt, el: Pt, ha: Pt, point: number, side: number) => {
    // sleeve, cuff, then the hand
    P.limb([sh.x, sh.y, el.x, el.y, ha.x, ha.y], b.armW, k.top)
    if (sil) {
      P.flat(circle(ha.x, ha.y, b.hand + 2), C.skin)
      return
    }
    const dx = ha.x - el.x
    const dy = ha.y - el.y
    const d = Math.hypot(dx, dy) || 1
    const ux = dx / d
    const uy = dy / d
    if (who !== 'layla') P.limb([ha.x - ux * 9, ha.y - uy * 9, ha.x - ux * 2, ha.y - uy * 2], b.armW + 1.5, k.topDark, 0)
    else P.limb([ha.x - ux * 7, ha.y - uy * 7, ha.x - ux * 2, ha.y - uy * 2], b.armW + 1, k.topDark, 0)
    const hx = ha.x + ux * (b.hand * 0.65)
    const hy = ha.y + uy * (b.hand * 0.65)
    // fingers out: one points; two or three are a count held up
    const n = Math.min(3, Math.round(point))
    for (let i = 0; i < n; i++) {
      const fa = Math.atan2(uy, ux) + (i - (n - 1) / 2) * 0.56
      const len = b.hand + (n > 1 ? 18 : 9)
      P.limb([hx, hy, hx + Math.cos(fa) * len, hy + Math.sin(fa) * len], 7.5, C.skin, 0)
    }
    P.fill(circle(hx, hy, b.hand), C.skin, 2)
    // a thumb, so the hand is a hand
    P.flat(circle(hx - uy * side * b.hand * 0.62 + ux * 2, hy + ux * side * b.hand * 0.62 + uy * 2, b.hand * 0.42), C.skin)
  }

  // 1 ─ arms that pass behind the body
  if (body) {
    if (p.aBack >= 0.5) drawArm(s.shA, s.elA, s.haA, p.aPoint, -1)
    if (p.bBack >= 0.5) drawArm(s.shB, s.elB, s.haB, p.bPoint, 1)
  }

  if (body) {
    const foot = (f: Pt, side: number, footLift: number) => {
      const d = Math.abs(p.toe) > 0.2 ? Math.sign(p.toe) : 0
      c.save()
      c.translate(f.x, f.y + b.ankle)
      // toes hang when the foot is off the ground
      const droop = clamp01((p.lift + footLift) / 26) * 0.5
      c.rotate(d === 0 ? side * droop * 0.35 : d * droop)
      if (sil) {
        P.flat(rrect(-22, -26, 46, 27, 9), k.shoe)
        c.restore()
        return
      }
      if (who === 'layla') {
        const dd = d === 0 ? side * 0.4 : d
        P.fill(blob([-15 + dd * 4, -15, 17 + dd * 8, -13, 22 + dd * 10, -1, -17 + dd * 2, 0]), k.shoe, 2)
        P.flat(rrect(-9 + dd * 5, -17, 15, 5, 2), C.cream)
      } else if (d === 0) {
        P.fill(rrect(-21, -9, 42, 10, 5), k.sole, 2)
        P.fill(blob([-21, -5, -20, -25, 0, -30, 20, -25, 21, -5]), k.shoe, 2)
        P.flat(blob([-13, -7, -12, -16, 0, -19, 12, -16, 13, -7]), who === 'sari' ? C.cream : C.trousersCuff)
      } else {
        c.scale(d, 1)
        P.fill(rrect(-22, -9, 50, 10, 5), k.sole, 2)
        P.fill(blob([-22, -5, -22, -27, -4, -30, 12, -24, 29, -16, 28, -5]), k.shoe, 2)
        P.flat(blob([13, -7, 14, -17, 26, -13, 27, -7]), who === 'sari' ? C.cream : C.trousersCuff)
        if (who === 'sari') P.limb([-2, -24, 8, -20], 3, C.cream, 0)
      }
      c.restore()
    }

    if (who === 'layla') {
      // socks and strap shoes, then the long skirt over them
      const kneel = p.sit
      if (kneel < 0.6) {
        for (const [kn, ft, side, fl] of [[s.knA, s.ftA, -1, p.fay], [s.knB, s.ftB, 1, p.fby]] as const) {
          P.limb([kn.x, kn.y, ft.x, ft.y], b.legW, C.cream, 2)
          foot(ft, side, fl)
        }
      }
      // kneeling, the skirt pools on the ground round her
      const hem = (-Math.max(18, 62 * (1 - p.crouch * 0.9)) - Math.min(p.fay, p.fby) * 0.5) * (1 - kneel) - 2 * kneel
      const lx = Math.min(s.ftA.x, s.hip.x - 30) - 40 - 44 * kneel
      const rx = Math.max(s.ftB.x, s.hip.x + 30) + 40 + 44 * kneel
      const wy = s.hip.y - 26
      const sk = new Path2D()
      sk.moveTo(s.hip.x - 37, wy)
      sk.lineTo(s.hip.x + 37, wy)
      sk.quadraticCurveTo(s.hip.x + 50, wy + 60, rx, hem)
      sk.quadraticCurveTo((lx + rx) / 2, hem + 16, lx, hem)
      sk.quadraticCurveTo(s.hip.x - 50, wy + 60, s.hip.x - 37, wy)
      P.fill(sk, C.skirt)
      // two quiet folds
      const f = new Path2D()
      if (sil) f.moveTo(0, 0)
      else {
      f.moveTo(s.hip.x - 10, wy + 40)
      f.quadraticCurveTo(s.hip.x - 16, wy + 100, lx + (rx - lx) * 0.3, hem + 5)
      f.moveTo(s.hip.x + 16, wy + 50)
      f.quadraticCurveTo(s.hip.x + 24, wy + 100, lx + (rx - lx) * 0.72, hem + 6)
      P.line(f, C.skirtDark, 4)
      }
    } else if (p.sit > 0.5) {
      // cross-legged on the ground: each shin lies across in front, a shoe showing at either side
      const hx = s.hip.x
      const hy = s.hip.y
      for (const side of [1, -1]) {
        const kx = hx + side * 60
        const ax = hx - side * 18
        P.limb([hx + side * 20, hy, kx, hy + 10, ax, hy + 20], b.legW - 3, k.leg)
        if (!sil) P.limb([ax + side * 9, hy + 18, ax, hy + 20], b.legW + 1, k.cuff, 0)
        c.save()
        c.translate(ax - side * 22, hy + 28)
        c.scale(-side, 1)
        P.fill(blob([-18, -4, -16, -22, 2, -24, 20, -16, 20, -2]), k.shoe, 2)
        if (!sil) P.flat(rrect(-18, -6, 40, 7, 3), k.sole)
        c.restore()
      }
    } else {
      for (const [hj, kn, ft, side, fl] of [[s.hjA, s.knA, s.ftA, -1, p.fay], [s.hjB, s.knB, s.ftB, 1, p.fby]] as const) {
        P.limb([hj.x, hj.y, kn.x, kn.y, ft.x, ft.y - 2], b.legW, k.leg)
        // rolled cuff
        const dx = ft.x - kn.x
        const dy = ft.y - kn.y
        const d = Math.hypot(dx, dy) || 1
        if (!sil) P.limb([ft.x - (dx / d) * 9, ft.y - (dy / d) * 9, ft.x, ft.y], b.legW + 4, k.cuff, 0)
        foot(ft, side, fl)
      }
    }

    // 3 ─ torso, in its own leaning, squashing frame
    c.save()
    c.translate(s.hip.x, s.hip.y)
    c.rotate(p.lean)
    const wsc = 1 / Math.sqrt(p.sq)
    c.scale(wsc, 1)
    const T = b.torso * p.sq
    if (who === 'sari') {
      if (!back) P.fill(rrect(-61, -T + 16, 122, T * 0.7, 18), C.backpack)
      P.fill(ellipse(0, -T + 6, 47, 21), C.hoodieDark) // the hood, lying on his shoulders
    }
    const w0 = who === 'layla' ? 45 : 49
    const w1 = who === 'layla' ? 50 : 55
    const hemY = who === 'layla' ? 4 : 13
    const top = new Path2D()
    top.moveTo(-w0 + 8, -T + 5)
    top.quadraticCurveTo(0, -T - 5, w0 - 8, -T + 5)
    top.quadraticCurveTo(w0 + 3, -T + 12, w0 + 4, -T + 40)
    top.lineTo(w1, hemY - 10)
    top.quadraticCurveTo(w1, hemY, w1 - 10, hemY)
    top.lineTo(-w1 + 10, hemY)
    top.quadraticCurveTo(-w1, hemY, -w1, hemY - 10)
    top.lineTo(-w0 - 4, -T + 40)
    top.quadraticCurveTo(-w0 - 3, -T + 12, -w0 + 8, -T + 5)
    P.fill(top, k.top)
    const fx = back ? 0 : p.turn * 7
    if (sil) {
      // outline only
    } else if (who === 'sari') {
      P.flat(rrect(-w1 + 1, hemY - 13, w1 * 2 - 2, 13, 6), C.hoodieDark)
      if (back) {
        P.flat(rrect(-40, -T + 20, 80, T * 0.72, 18), C.backpack)
        P.flat(rrect(-24, -T + 52, 48, 22, 8), '#84402c')
        P.flat(rrect(-40, -T + 20, 80, 16, 8), '#84402c')
      } else {
        P.flat(blob([fx - 30, -T * 0.42, fx + 30, -T * 0.42, fx + 34, -T * 0.1, fx - 34, -T * 0.1]), C.hoodieDark)
        P.limb([-31, -T + 2, -37, -T + 50], 8, C.backpack, 0)
        P.limb([31, -T + 2, 37, -T + 50], 8, C.backpack, 0)
      }
    } else if (who === 'amir') {
      P.flat(rrect(-w1 + 1, hemY - 13, w1 * 2 - 2, 13, 6), C.jumperDark)
      // a few knitted stitches
      const st = new Path2D()
      for (let r = 0; r < 3; r++) for (let q = -3; q <= 3; q++) {
        const x = q * 14 + (r % 2) * 7
        const y = -T * 0.62 + r * 17
        st.moveTo(x - 3, y)
        st.lineTo(x, y + 5)
        st.lineTo(x + 3, y)
      }
      P.line(st, C.jumperDark, 2.4)
      if (!back) {
        P.flat(poly([fx - 27, -T + 4, fx - 1, -T + 9, fx - 15, -T + 31]), C.collar)
        P.flat(poly([fx + 27, -T + 4, fx + 1, -T + 9, fx + 15, -T + 31]), C.collar)
      }
    } else {
      P.flat(rrect(-w1 + 1, hemY - 11, w1 * 2 - 2, 11, 5), C.cardiganDark)
      if (!back) {
        // cream blouse in the open front, collar, buttons, pockets
        P.flat(poly([fx - 12, -T, fx + 12, -T, fx + 17, hemY, fx - 17, hemY]), C.cream)
        P.flat(blob([fx - 25, -T + 3, fx - 2, -T + 5, fx - 9, -T + 26, fx - 24, -T + 20]), C.cream)
        P.flat(blob([fx + 25, -T + 3, fx + 2, -T + 5, fx + 9, -T + 26, fx + 24, -T + 20]), C.cream)
        for (let i = 0; i < 3; i++) P.flat(circle(fx + 21, -T * 0.62 + i * 30, 3.6), C.shoe)
        P.flat(rrect(-w1 + 7, -T * 0.3, 25, 24, 4), C.cardiganDark)
        P.flat(rrect(w1 - 32, -T * 0.3, 25, 24, 4), C.cardiganDark)
        const seam = new Path2D()
        seam.moveTo(fx - 14, -T + 26)
        seam.lineTo(fx - 18, hemY - 12)
        seam.moveTo(fx + 14, -T + 26)
        seam.lineTo(fx + 18, hemY - 12)
        P.line(seam, C.cardiganDark, 2.2)
      }
    }
    if (who === 'sari' && !back && !sil) {
      // drawstrings hang, and swing only when he moves
      for (const side of [-1, 1]) {
        c.save()
        c.translate(fx + side * 10, -T + 16)
        c.rotate(p.swing - p.lean)
        P.limb([0, 0, 0, 27], 3.4, C.cream, 0)
        P.flat(circle(0, 30, 3.6), C.cream)
        c.restore()
      }
    }
    // the helmet's collar ring sits on the shoulders
    if (helmet) {
      P.fill(ellipse(0, -T + 3, 51, 13), C.cream, 2)
      if (!sil) {
        P.flat(ellipse(0, -T + 1, 43, 8.5), C.dustNear)
        c.fillStyle = P.light === 'night' ? '#cdb46a' : C.gold
        c.fill(circle(back ? -38 : 38, -T + 5, 4.6))
      }
    } else {
      P.flat(rrect(-11, -T - 8, 22, 18, 6), C.skinShade)
    }
    c.restore()

    // 4 ─ head, then the bubble helmet (fixed to the shoulders: the head moves inside it)
    c.save()
    c.translate(s.head.x, s.head.y)
    c.rotate(s.headAngle)
    drawHead(P, who, p, b.headR, back, o.glow ?? 0)
    c.restore()
    if (helmet) {
      const d = b.helmetR - 9
      c.save()
      c.translate(s.neck.x + Math.sin(p.lean) * d, s.neck.y - Math.cos(p.lean) * d)
      drawHelmet(P, b.helmetR)
      c.restore()
    }
  }

  // 5 ─ arms in front
  if (pass !== 'body') {
    if (o.basket) {
      const onB = o.basketOn === 'b'
      const el = onB ? s.elB : s.elA
      const ha = onB ? s.haB : s.haA
      const h = { x: (el.x + ha.x * 2) / 3, y: (el.y + ha.y * 2) / 3 }
      c.save()
      c.translate(h.x, h.y)
      c.rotate(p.swing)
      drawBasket(P)
      c.restore()
    }
    if (p.aBack < 0.5) drawArm(s.shA, s.elA, s.haA, p.aPoint, -1)
    if (o.lamp) {
      const f = Math.atan2(s.haB.y - s.elB.y, s.haB.x - s.elB.x)
      const hw = s.world(s.haB)
      const a = o.lampAim ? Math.atan2(o.lampAim.y - hw.y, o.lampAim.x - hw.x) - p.rot : f
      c.save()
      c.translate(s.haB.x + Math.cos(f) * 10, s.haB.y + Math.sin(f) * 10)
      c.rotate(a)
      drawLamp(P, o.lampLit ?? true)
      c.restore()
    }
    if (p.bBack < 0.5) drawArm(s.shB, s.elB, s.haB, p.bPoint, 1)
  }
  c.restore()
}

function drawHelmet(P: Painter, r: number) {
  const c = P.ctx
  const cy = 0
  if (P.light === 'sil') {
    c.strokeStyle = P.silColor
    c.lineWidth = 7
    c.stroke(circle(0, cy, r))
    return
  }
  c.fillStyle = P.light === 'night' ? 'rgba(160,175,230,0.05)' : 'rgba(243,236,223,0.075)'
  c.fill(circle(0, cy, r))
  c.lineCap = 'round'
  c.lineWidth = 3.6
  c.strokeStyle = P.col(C.cream)
  c.stroke(circle(0, cy, r))
  // the Sun on the glass: undo the head's tilt so the shine always faces screen right
  const m = c.getTransform()
  const rot = Math.atan2(m.b, m.a)
  c.save()
  c.translate(0, cy)
  c.rotate(-rot)
  const night = P.light === 'night'
  c.strokeStyle = night ? '#b9a66a' : C.goldHot
  c.lineWidth = night ? 2.6 : 3.4
  c.beginPath()
  c.arc(0, 0, r + 1.2, -1.15, 1.05)
  c.stroke()
  if (!night) {
    c.strokeStyle = '#ffffff'
    c.lineWidth = 5.5
    c.beginPath()
    c.arc(0, 0, r - 10, -1.02, -0.3)
    c.stroke()
    c.beginPath()
    c.arc(0, 0, r - 10, -1.32, -1.2)
    c.stroke()
  }
  c.restore()
}

function drawHead(P: Painter, who: Who, p: Pose, R: number, back: boolean, glow: number) {
  const c = P.ctx
  const k = COSTUME[who]
  const sil = P.light === 'sil'
  const t = back ? 0 : p.turn
  const fx = t * R * 0.36
  if (sil) {
    // a cast shadow: one round head with its hair
    P.flat(circle(0, who === 'sari' ? -6 : -2, R + (who === 'sari' ? 20 : 7)), C.ink)
    return
  }

  // hair that sits behind the head
  if (who === 'sari') {
    for (let i = 0; i < 13; i++) {
      const a = (150 + i * 20) * (Math.PI / 180)
      const r = [22, 26, 20, 25, 23, 27, 22, 26, 21, 25, 23, 26, 21][i]
      P.fill(circle(Math.cos(a) * (R + 2) - t * 5, Math.sin(a) * (R + 2) - 2, r), k.hair, 0)
    }
  } else if (who === 'amir') {
    P.fill(blob([-R - 5, 12, -R - 6, -R * 0.7, -R * 0.55, -R - 7, R * 0.55, -R - 7, R + 6, -R * 0.7, R + 5, 12, R - 6, 20, -R + 6, 20].map((v, i) => (i % 2 ? v : v - t * 5))), k.hair, 2)
    for (const [x, y, w] of [[-16, -R - 3, 8], [2, -R - 6, 9], [19, -R - 1, 8]]) P.fill(poly([x - w - t * 5, y + 5, x + 4 - t * 5, y - 14, x + w - t * 5, y + 6]), k.hair, 0)
  } else {
    P.fill(blob([-R - 8, 26, -R - 10, -R * 0.6, -R * 0.5, -R - 9, R * 0.5, -R - 9, R + 10, -R * 0.6, R + 9, 20, R - 4, 40, -R + 6, 44].map((v, i) => (i % 2 ? v : v - t * 4))), k.hair, 2)
    // the low side ponytail, tucked inside the glass
    const side = back ? -1 : 1
    P.fill(blob([side * (R - 8), 6, side * (R + 13), 4, side * (R + 17), 22, side * (R + 4), 36, side * (R - 12), 28]), k.hair, 2)
    P.flat(ellipse(side * (R + 1), 10, 5, 8, side * 0.5), C.cardigan)
  }

  // head, ears
  P.fill(ellipse(0, 0, R * 1.03, R * 0.98), C.skin, 2)
  if (!sil) {
    const earY = 9
    if (back || t < 0.5) P.flat(circle(-R * 0.99 + Math.max(0, t) * 10, earY, 10.5), C.skin)
    if (back || t > -0.5) P.flat(circle(R * 0.99 + Math.min(0, t) * 10, earY, 10.5), C.skin)
  }

  if (back) {
    // seen from behind: hair covers the whole head
    if (who === 'sari') {
      P.flat(circle(0, -4, R + 3), k.hair)
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * TAU + 0.4
        const q = new Path2D()
        q.arc(Math.cos(a) * R * 0.52, Math.sin(a) * R * 0.5 - 4, 11, a, a + 3.6)
        P.line(q, C.hairSariLight, 3.4)
      }
      for (let i = 0; i < 5; i++) P.flat(circle(-R * 0.72 + i * R * 0.36, R * 0.72 - Math.abs(i - 2) * 9, 17), k.hair)
    } else if (who === 'amir') {
      P.flat(blob([-R - 4, 20, -R - 5, -R * 0.7, -R * 0.5, -R - 6, R * 0.5, -R - 6, R + 5, -R * 0.7, R + 4, 20, R * 0.6, R * 0.72, -R * 0.6, R * 0.72]), k.hair)
      const q = new Path2D()
      q.arc(0, -8, R * 0.6, -2.4, -0.9)
      P.line(q, C.hairAmirLight, 4)
    } else {
      P.flat(circle(0, -2, R + 6), k.hair)
      P.flat(blob([-R * 0.8, 10, R * 0.8, 10, R * 0.7, R + 16, 0, R + 26, -R * 0.7, R + 16]), k.hair)
      const q = new Path2D()
      q.moveTo(-14, -R * 0.6)
      q.quadraticCurveTo(-26, 0, -12, R * 0.9)
      q.moveTo(12, -R * 0.6)
      q.quadraticCurveTo(26, 0, 14, R * 0.9)
      P.line(q, C.hairLaylaLight, 3.2)
    }
    return
  }

  if (!sil) {
    // warm light from Wameed's eye, on the lower face
    if (glow > 0.02) {
      c.save()
      c.clip(ellipse(0, 0, R * 1.03, R * 0.98))
      c.globalAlpha = 0.55 * glow
      c.fillStyle = C.gold
      c.fill(ellipse(R * 0.1, R * 1.05, R * 1.2, R * 0.8))
      c.restore()
    }
    drawFace(P, who, p, fx)
  }

  // hair in front
  if (who === 'sari') {
    const a0 = Math.asin(20 / (R + 1))
    const cap = new Path2D()
    cap.arc(-t * 3, 0, R + 1, Math.PI + a0, TAU - a0)
    cap.closePath()
    P.flat(cap, k.hair)
    for (let i = 0; i < 5; i++) P.flat(circle(-40 + i * 20 + t * 5, -22 + (i % 2) * 3, [15, 17, 16, 18, 15][i]), k.hair)
    if (!sil) {
      for (const [x, y, a] of [[-34, -44, 0.3], [-6, -58, 1.2], [24, -50, 2.2], [46, -30, 3.1], [-52, -22, 5.4], [6, -28, 4.2], [-22, -22, 0.9], [40, -66, 1.7], [-44, -66, 4.9]]) {
        const q = new Path2D()
        q.arc(x - t * 3, y, 8.5, a, a + 3.5)
        P.line(q, C.hairSariLight, 3.2)
      }
    }
  } else if (who === 'amir') {
    const pts = [-R - 2, -R * 0.2, -R * 0.96, -R * 0.62, -R * 0.5, -R - 3, R * 0.5, -R - 3, R * 0.96, -R * 0.62, R + 2, -R * 0.2]
    // straight-cut fringe with a few notches
    const fr = [R + 2, -4, R * 0.74, -2, R * 0.6, -13, R * 0.42, 0, R * 0.2, -1, R * 0.06, -12, -R * 0.1, 0, -R * 0.36, -1, -R * 0.5, -11, -R * 0.66, -1, -R - 2, -5]
    const all = pts.concat(fr).map((v, i) => (i % 2 ? v : v + (i >= pts.length ? t * 6 : -t * 3)))
    P.flat(poly(all), k.hair)
    if (!sil) {
      const q = new Path2D()
      q.arc(-t * 3, -6, R * 0.74, -1.25, -0.5)
      P.line(q, C.hairAmirLight, 4.5)
    }
  } else {
    // side-parted wavy fringe and two soft locks by the cheeks
    const fr = new Path2D()
    fr.moveTo(-R - 2, 6)
    fr.quadraticCurveTo(-R - 4, -R * 0.9, -R * 0.3, -R - 2)
    fr.quadraticCurveTo(R * 0.6, -R - 6, R + 2, -R * 0.3)
    fr.quadraticCurveTo(R + 4, -4, R - 2, 10)
    fr.quadraticCurveTo(R * 0.86 + t * 4, -R * 0.52, R * 0.2 + t * 6, -R * 0.62)
    fr.quadraticCurveTo(-R * 0.5 + t * 6, -R * 0.56, -R * 0.84 + t * 4, -6)
    fr.quadraticCurveTo(-R * 0.9, 14, -R - 2, 6)
    P.flat(fr, k.hair)
    P.flat(blob([-R - 3, 0, -R * 0.82, 4, -R * 0.8, 30, -R - 5, 34]), k.hair)
    if (!sil) {
      const q = new Path2D()
      q.moveTo(-R * 0.2 + t * 5, -R * 0.94)
      q.quadraticCurveTo(-R * 0.72, -R * 0.74, -R * 0.9, -R * 0.24)
      q.moveTo(R * 0.1 + t * 5, -R * 0.92)
      q.quadraticCurveTo(R * 0.7, -R * 0.8, R * 0.92, -R * 0.3)
      P.line(q, C.hairLaylaLight, 3)
    }
  }
}

function drawFace(P: Painter, who: Who, p: Pose, fx: number) {
  const c = P.ctx
  const k = COSTUME[who]
  const sc = who === 'layla' ? 0.86 : 1
  const gap = (who === 'layla' ? 19 : 23) * (1 - 0.1 * Math.abs(p.turn))
  // looking up or down slides the whole face a little (the head pitches), and the eyes a little more
  const pitch = p.lookY * 5
  const ey = (who === 'layla' ? 4 : 5) + pitch
  const lx = p.lookX * 5
  const ly = p.lookY * 2.6
  const wide = 1 + 0.3 * p.wide

  // cheeks
  c.save()
  c.globalAlpha = 0.78
  P.flat(circle(fx - gap - 13, ey + 19, 13.5 * sc), C.cheek)
  P.flat(circle(fx + gap + 13, ey + 19, 13.5 * sc), C.cheek)
  c.restore()

  for (const side of [-1, 1]) {
    const x = fx + side * gap + lx - side * p.cross * 5.5
    if (p.happy > 0.5) {
      const q = new Path2D()
      q.arc(x - lx * 0.5, ey + 4, 8.5 * sc, Math.PI * 1.12, Math.PI * 1.88)
      P.line(q, C.ink, 4 * sc)
    } else {
      const open = Math.max(0.08, 1 - p.blink)
      P.flat(ellipse(x, ey + ly, 6.4 * sc * wide, 8.6 * sc * wide * open), C.ink)
      if (open > 0.5 && P.light !== 'night') P.flat(circle(x + 2.2, ey + ly - 3.2, 2.1 * sc), '#fff8ec')
    }
    // brow
    const by = ey - 17 * sc - p.brow * 7 - (wide - 1) * 8
    const q = new Path2D()
    q.moveTo(x - 8 * sc, by + (p.brow < 0 ? side * p.brow * 4 : 1.5))
    q.quadraticCurveTo(x, by - 3.5, x + 8 * sc, by + (p.brow < 0 ? -side * p.brow * 4 : 1.5))
    P.line(q, k.hair === C.hairAmir ? '#2c2c36' : k.hair, 3 * sc)
  }
  // nose: one small hook
  const n = new Path2D()
  const nx = fx + p.turn * 6
  n.moveTo(nx - 2, ey + 9)
  n.quadraticCurveTo(nx + (p.turn < 0 ? -7 : 7), ey + 13, nx - 1, ey + 16)
  P.line(n, '#d99a70', 2.6)

  // mouth
  const mx = fx + p.turn * 3
  const my = ey + 27 * sc
  const w = (7.5 + 9.5 * p.mWide) * sc
  if (p.mOpen < 0.07) {
    const q = new Path2D()
    q.moveTo(mx - w, my - p.mCurve * 3)
    q.quadraticCurveTo(mx, my + p.mCurve * 9, mx + w, my - p.mCurve * 3)
    P.line(q, C.ink, 3.2 * sc)
  } else {
    const h = (3 + 17 * p.mOpen) * sc
    let q: Path2D
    if (p.mWide < 0.25) q = ellipse(mx, my + h * 0.3, w * 0.8, h * 0.62)
    else {
      q = new Path2D()
      q.moveTo(mx - w, my - p.mCurve * 2.5)
      q.quadraticCurveTo(mx, my + 2 - p.mCurve, mx + w, my - p.mCurve * 2.5)
      q.quadraticCurveTo(mx + w * 0.9, my + h * 1.25, mx, my + h * 1.22)
      q.quadraticCurveTo(mx - w * 0.9, my + h * 1.25, mx - w, my - p.mCurve * 2.5)
    }
    P.flat(q, C.mouth)
    if (p.mOpen > 0.3) P.flat(ellipse(mx, my + h * (p.mWide < 0.25 ? 0.62 : 0.86), w * 0.5, h * 0.3), C.tongue)
  }
}

/** Layla's wicker basket, hanging from the point (0,0). */
export function drawBasket(P: Painter) {
  const h = new Path2D()
  h.moveTo(-27, 34)
  h.quadraticCurveTo(-30, -4, 0, -4)
  h.quadraticCurveTo(30, -4, 27, 34)
  P.line(h, C.wickerDark, 6.5, 1.5)
  P.fill(blob([-39, 30, 39, 30, 34, 76, -34, 76]), C.wicker, 2.5)
  P.flat(rrect(-41, 27, 82, 11, 5), C.wickerDark)
  const w = new Path2D()
  for (let i = -2; i <= 2; i++) {
    w.moveTo(i * 13, 42)
    w.lineTo(i * 12, 72)
  }
  w.moveTo(-35, 55)
  w.lineTo(35, 55)
  P.line(w, C.wickerDark, 2.4)
  // a corner of the picnic cloth
  P.flat(poly([-20, 27, -4, 27, -14, 41]), C.cream)
}

/** Layla's hand lamp, pointing along +x from the hand at (0,0). */
export function drawLamp(P: Painter, lit = true) {
  P.fill(rrect(-12, -8, 26, 16, 5), C.cream, 1.5)
  P.fill(poly([12, -9, 27, -15, 27, 15, 12, 9]), C.dustMid, 1.5)
  if (P.light !== 'sil' && !lit) P.flat(ellipse(27, 0, 4.5, 13), C.dustFar)
  if (P.light !== 'sil' && lit) {
    P.ctx.fillStyle = C.goldHot
    P.ctx.fill(ellipse(27, 0, 4.5, 13))
    // three short rays: it is on
    const r = new Path2D()
    for (const a of [-0.5, 0, 0.5]) {
      r.moveTo(36 + Math.cos(a) * 2, Math.sin(a) * 18)
      r.lineTo(36 + Math.cos(a) * 15, Math.sin(a) * 30)
    }
    P.ctx.strokeStyle = C.gold
    P.ctx.lineWidth = 3
    P.ctx.lineCap = 'round'
    P.ctx.stroke(r)
  }
}
