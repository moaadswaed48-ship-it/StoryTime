/**
 * The shared gestures. Each one is written once, as a pose over time in body-relative units (see pose.ts), and
 * plays unchanged on every character. Every gesture starts from the rest pose and comes back to it, with an
 * anticipation before the main move, an overshoot and a settle after it.
 */
import type { Gesture } from '../cast/sheet.ts'
import { REST, both, copyPose, key, win, type Pose } from './pose.ts'

export type Act = Exclude<Gesture, 'idle'>
export type GestureDef = {
  /** Seconds. */
  duration: number
  /** The moment that shows the gesture best (still pictures and button pictograms use it). */
  apex: number
  /** Writes the pose at time t into p (p arrives as the rest pose). */
  pose: (t: number, p: Pose) => void
}

type S = 'L' | 'R'
const mix = (a: number, b: number, t: number) => a + (b - a) * t
/** Moves a hand toward a point given from its own shoulder (arm lengths: x outward, y up, z forward). */
const reach = (p: Pose, s: S, w: number, x: number, y: number, z: number) => {
  p[`ax${s}`] = mix(p[`ax${s}`], x, w)
  p[`ay${s}`] = mix(p[`ay${s}`], y, w)
  p[`az${s}`] = mix(p[`az${s}`], z, w)
}
/** Points the elbow (x outward, y up, z forward). */
const elbow = (p: Pose, s: S, w: number, x: number, y: number, z: number) => {
  p[`ex${s}`] = mix(p[`ex${s}`], x, w)
  p[`ey${s}`] = mix(p[`ey${s}`], y, w)
  p[`ez${s}`] = mix(p[`ez${s}`], z, w)
}
/** Brings a hand to a point measured from the chest midline (arm lengths; x toward its own side). */
const toMid = (p: Pose, s: S, w: number, x: number, y: number, z: number) => {
  p[`am${s}`] = w
  p[`amx${s}`] = x
  p[`amy${s}`] = y
  p[`amz${s}`] = z
}
/** Brings a hand to a point measured from the head centre (head heights; x toward its own side). */
const toHead = (p: Pose, s: S, w: number, x: number, y: number, z: number) => {
  p[`ah${s}`] = w
  p[`ahx${s}`] = x
  p[`ahy${s}`] = y
  p[`ahz${s}`] = z
}
const TAU = Math.PI * 2
const arc = (t: number, a: number, b: number) => {
  const u = (t - a) / (b - a)
  return u <= 0 || u >= 1 ? 0 : 4 * u * (1 - u)
}

export const GESTURE_DEFS: Record<Act, GestureDef> = {
  /* A big friendly hello with the right hand. */
  wave: {
    duration: 2.8,
    apex: 1.18,
    pose(t, p) {
      const u = key(t, [[0, 0], [0.18, -0.16], [0.62, 1.1, 'out'], [0.86, 1], [2.05, 1], [2.45, -0.07], [2.8, 0]])
      const w = win(t, 0.72, 2.1, 0.16, 0.22)
      const osc = Math.sin((t - 0.72) * TAU * 2.25)
      reach(p, 'R', u, 0.56, 0.66, 0.22)
      elbow(p, 'R', Math.max(0, u), 0.7, -1, -0.15)
      p.axR += w * 0.19 * osc
      p.ayR += w * 0.03 * Math.abs(osc)
      p.wsR = w * 0.5 * osc
      p.twR = -1.2 * Math.max(0, u)
      p.wrR = mix(p.wrR, -0.1, Math.max(0, u))
      reach(p, 'L', Math.max(0, u) * 0.6, 0.2, -0.93, -0.04)
      p.hipY = key(t, [[0, 0], [0.18, -0.04], [0.6, 0.012, 'out'], [1, 0], [2.4, -0.012], [2.8, 0]])
      p.hipX = 0.03 * u
      p.spineRz = -0.07 * u
      p.chestRz = -0.04 * u
      p.headRz = 0.13 * u + 0.035 * w * osc
      p.headRy = -0.08 * u
      p.fpR = 0.14 * Math.max(0, u)
      p.smile = mix(p.smile, 1, Math.max(0, u))
      p.open = 0.55 * w
      p.happy = 0.25 * Math.max(0, u)
      p.browL = p.browR = 0.6 * Math.max(0, u)
    },
  },

  /* A side-to-side groove with pumping arms and tapping heels. */
  dance: {
    duration: 3.7,
    apex: 1.55,
    pose(t, p) {
      const w = key(t, [[0, 0], [0.12, -0.08], [0.5, 1, 'out'], [3.0, 1], [3.35, -0.05], [3.7, 0]])
      const g = Math.max(0, w)
      const b = (t - 0.3) / 0.5
      const sx = Math.sin(Math.PI * b)
      const bob = 0.5 - 0.5 * Math.cos(TAU * b)
      p.hipX = 0.13 * sx * g
      p.hipRz = -0.1 * sx * g
      p.hipRy = 0.12 * sx * g
      p.hipY = (-0.03 - 0.07 * bob) * g
      p.spineRz = 0.11 * sx * g
      p.chestRy = -0.24 * sx * g
      p.chestRz = 0.05 * sx * g
      p.headRz = -0.1 * sx * g
      p.headRy = 0.1 * sx * g
      p.headRx = 0.07 * bob * g
      const uR = 0.5 + 0.5 * sx
      const uL = 1 - uR
      reach(p, 'R', g, mix(0.34, 0.5, uR), mix(-0.22, 0.6, uR), mix(0.5, 0.26, uR))
      reach(p, 'L', g, mix(0.34, 0.5, uL), mix(-0.22, 0.6, uL), mix(0.5, 0.26, uL))
      elbow(p, 'R', g, 1, -0.5, -0.3)
      elbow(p, 'L', g, 1, -0.5, -0.3)
      p.twR = -0.9 * g * uR
      p.twL = -0.9 * g * uL
      p.shR = 0.1 * g * uR
      p.shL = 0.1 * g * uL
      // the foot that carries no weight taps its heel
      p.fpR = 0.5 * Math.max(0, sx) * g
      p.fpL = 0.5 * Math.max(0, -sx) * g
      p.fyR = 0.03 * Math.max(0, sx) * g
      p.fyL = 0.03 * Math.max(0, -sx) * g
      p.squash = -0.04 * bob * g + 0.02 * g
      p.smile = mix(p.smile, 1, g)
      p.open = (0.3 + 0.25 * bob) * g
      p.happy = 0.55 * g
      p.browL = p.browR = 0.4 * g
      p.attend = 1 - 0.5 * g
    },
  },

  /* Crouch, spring up with arms high, tuck, land soft and settle. */
  jump: {
    duration: 2.3,
    apex: 0.98,
    pose(t, p) {
      const c = key(t, [[0, 0], [0.42, 1], [0.58, 0, 'in']])
      const l = key(t, [[1.34, 0], [1.46, 1, 'out'], [1.78, -0.12], [2.08, 0.02], [2.3, 0]])
      const air = arc(t, 0.55, 1.37)
      const up = win(t, 0.5, 1.34, 0.16, 0.14)
      p.lift = 0.5 * air
      p.hipY = -0.3 * c - 0.2 * l
      p.spineRx = 0.3 * c + 0.2 * Math.max(0, l) - 0.08 * up
      p.hipRx = 0.14 * c + 0.1 * Math.max(0, l)
      p.headRx = -0.12 * c - 0.2 * up + 0.1 * Math.max(0, l)
      p.squash = -0.09 * c + 0.1 * win(t, 0.52, 0.95, 0.08, 0.3) - 0.1 * Math.max(0, l)
      for (const s of ['L', 'R'] as const) {
        reach(p, s, c, 0.22, -0.72, -0.5)
        reach(p, s, up, 0.42, 0.9, 0.08)
        reach(p, s, Math.max(0, l), 0.66, -0.5, 0.22)
        elbow(p, s, up, 1, -0.2, -0.4)
        p[`sh${s}`] = 0.12 * up
        p[`tw${s}`] = -1.2 * up
        const tuck = win(t, 0.72, 1.3, 0.2, 0.12)
        p[`fy${s}`] = 0.2 * tuck
        p[`fx${s}`] = 0.1 * tuck + 0.05 * Math.max(0, l)
        p[`fp${s}`] = 0.75 * win(t, 0.55, 1.34, 0.07, 0.1)
        p[`kx${s}`] = 0.18 + 0.4 * tuck
      }
      p.open = 0.9 * up + 0.3 * Math.max(0, l)
      p.smile = mix(p.smile, 1, Math.min(1, c + up + Math.abs(l)))
      p.browL = p.browR = 0.9 * up - 0.3 * c
      p.happy = 0.6 * Math.max(0, l)
      p.attend = 1 - 0.6 * up
    },
  },

  /* Open the arms wide, then clap along with a bouncing body. */
  clap: {
    duration: 2.9,
    apex: 1.02,
    pose(t, p) {
      const w = Math.min(key(t, [[0, 0], [0.12, -0.1], [0.5, 1, 'out']]), key(t, [[2.2, 1], [2.55, -0.06], [2.9, 0]]))
      const g = Math.max(0, w)
      const ph = (t - 0.54) / 0.32
      const live = t > 0.54 && t < 2.14 ? 1 : 0
      const gap = live ? Math.pow(Math.abs(Math.sin(Math.PI * ph)), 0.75) : 1
      const hit = live ? 1 - gap : 0
      const side = live ? Math.sin(Math.PI * ph * 0.5) : 0
      const open = key(t, [[0.1, 0.1], [0.42, 0.62, 'out'], [0.54, 0], [2.14, 0], [2.3, 0.3, 'out'], [2.9, 0.1]])
      for (const s of ['L', 'R'] as const) {
        toMid(p, s, g, 0.01 + 0.25 * gap * live + open, -0.2 + 0.05 * side * (s === 'L' ? 1 : -1), 0.6 - 0.25 * open)
        elbow(p, s, g, 0.9, -0.75, 0.15)
        p[`tw${s}`] = -1.45 * g
        p[`wr${s}`] = mix(p[`wr${s}`], -0.25, g)
        p[`fp${s}`] = 0.16 * gap * live * g
      }
      p.hipY = -0.025 * hit * g - 0.01 * g
      p.spineRx = 0.07 * g + 0.03 * hit
      p.chestRy = 0.07 * side * g
      p.headRz = 0.11 * side * g
      p.headRx = -0.05 * g + 0.04 * hit
      p.squash = -0.025 * hit * g
      p.smile = mix(p.smile, 1, g)
      p.happy = 0.7 * g
      p.open = 0.35 * g + 0.2 * hit
      p.browL = p.browR = 0.5 * g
    },
  },

  /* Wind up, hop and twirl all the way round, land a little dizzy. */
  spin: {
    duration: 2.5,
    apex: 1.0,
    pose(t, p) {
      const a = key(t, [[0, 0], [0.4, 1], [0.58, 0.5, 'in'], [0.8, 0]])
      const tau = Math.min(1, Math.max(0, (t - 0.56) / 0.86))
      const air = arc(t, 0.56, 1.42)
      const fly = win(t, 0.56, 1.42, 0.14, 0.14)
      const l = key(t, [[1.4, 0], [1.52, 1, 'out'], [1.86, -0.1], [2.2, 0]])
      const dizzy = t > 1.5 ? Math.exp(-2.6 * (t - 1.5)) * Math.sin((t - 1.5) * 9) : 0
      p.yaw = TAU * (tau * tau * (3 - 2 * tau))
      p.lift = 0.3 * air
      p.hipY = -0.15 * a - 0.16 * l
      p.hipRy = -0.14 * a
      p.spineRy = -0.26 * a + 0.12 * Math.sin(Math.PI * tau)
      p.chestRy = -0.44 * a + 0.2 * Math.sin(Math.PI * tau)
      p.spineRx = 0.12 * a + 0.1 * Math.max(0, l)
      p.squash = -0.05 * a + 0.07 * fly - 0.07 * Math.max(0, l)
      // arms: swing against the turn, fling out, settle wide
      reach(p, 'R', a, 0.35, -0.6, -0.55)
      reach(p, 'L', a, 0.1, -0.5, 0.6)
      for (const s of ['L', 'R'] as const) {
        reach(p, s, fly, 0.88, 0.12, 0.02)
        reach(p, s, Math.max(0, l), 0.62, -0.55, 0.16)
        elbow(p, s, fly, 0.2, -0.6, -1)
        p[`fp${s}`] = 0.6 * fly
        p[`fx${s}`] = -0.04 * fly + 0.05 * Math.max(0, l)
        p[`fy${s}`] = 0.05 * fly
      }
      p.headRz = 0.12 * dizzy
      p.hipRz = 0.05 * dizzy
      p.hipX = 0.03 * dizzy
      p.headRy = -0.2 * a + 0.3 * Math.sin(Math.PI * tau)
      p.open = 0.75 * fly + 0.25 * Math.max(0, l)
      p.smile = mix(p.smile, 1, Math.min(1, a + fly + Math.abs(l) * 2))
      p.happy = 0.8 * Math.max(0, l) + 0.3 * fly
      p.browL = p.browR = 0.7 * fly
      p.attend = 1 - Math.min(1, a + fly)
    },
  },

  /* A deep stage bow: one arm across the waist, the other swept out behind. */
  bow: {
    duration: 3.0,
    apex: 1.4,
    pose(t, p) {
      const r = key(t, [[0, 0], [0.26, 1], [0.55, 0]])
      const b = key(t, [[0.3, 0], [1.0, 1.06], [1.22, 1], [1.8, 1], [2.38, -0.08], [2.72, 0.01], [3, 0]])
      const g = Math.max(0, b)
      p.hipRx = 0.52 * b
      p.spineRx = -0.09 * r + 0.3 * b
      p.chestRx = -0.05 * r + 0.2 * b
      p.neckRx = 0.06 * b
      p.headRx = -0.06 * r + 0.1 * b
      p.hipZ = -0.11 * g
      p.hipY = 0.012 * r - 0.03 * g
      toMid(p, 'R', g, -0.06, -0.6, 0.3)
      elbow(p, 'R', g, 0.9, -0.5, 0.2)
      reach(p, 'L', r, 0.4, -0.8, 0.1)
      reach(p, 'L', g, 0.72, -0.42, -0.4)
      elbow(p, 'L', g, 0.5, 0.4, -1)
      p.twL = 0.6 * g
      p.blink = 0.95 * win(t, 0.7, 2.0, 0.2, 0.2)
      p.smile = mix(p.smile, 0.8, Math.min(1, r + g))
      p.browL = p.browR = 0.5 * r + 0.5 * win(t, 2.2, 2.8, 0.15, 0.2)
      p.attend = 1 - g
    },
  },

  /* A burst of joy: crouch, then arms flung high on tiptoe with two little hops. */
  cheer: {
    duration: 2.7,
    apex: 0.98,
    pose(t, p) {
      const c = key(t, [[0, 0], [0.28, 1], [0.48, 0, 'in']])
      const u = key(t, [[0.3, 0], [0.62, 1.1, 'out'], [0.82, 1], [2.0, 1], [2.38, -0.06], [2.7, 0]])
      const g = Math.max(0, u)
      const hw = win(t, 0.95, 1.9, 0.05, 0.1)
      const hop = Math.max(0, Math.sin((t - 0.95) * TAU * 2.1)) * hw
      p.lift = 0.1 * hop
      p.hipY = -0.17 * c + 0.015 * g - 0.03 * (1 - hop) * hw
      p.spineRx = 0.2 * c - 0.1 * g
      p.chestRx = -0.08 * g
      p.headRx = 0.08 * c - 0.2 * g
      p.squash = -0.06 * c + 0.05 * g
      for (const s of ['L', 'R'] as const) {
        reach(p, s, c, 0.24, -0.34, 0.46)
        reach(p, s, u, 0.5, 0.86 + 0.05 * hop, 0.04)
        elbow(p, s, Math.max(c, g), 1, -0.3, -0.2)
        p[`sh${s}`] = 0.14 * g
        p[`tw${s}`] = -1.3 * g
        p[`fp${s}`] = 0.5 * g + 0.25 * hop
        p[`fy${s}`] = 0.02 * hop
      }
      p.headRz = 0.06 * Math.sin((t - 0.95) * TAU * 1.05) * hw
      p.open = g
      p.smile = mix(p.smile, 1.1, Math.min(1, c + g))
      p.happy = 0.85 * g
      p.browL = p.browR = 0.8 * g
      p.attend = 1 - 0.5 * g
    },
  },

  /* Hand to the chin, eyes up, a tapping foot … then a bright idea. */
  think: {
    duration: 3.5,
    apex: 1.35,
    pose(t, p) {
      const w = key(t, [[0, 0], [0.2, -0.05], [0.78, 1], [2.1, 1], [2.28, 0, 'in']])
      const g = Math.max(0, w)
      const a = key(t, [[2.12, 0], [2.42, 1.1, 'out'], [2.6, 1], [3.0, 1], [3.5, 0]])
      toHead(p, 'R', g, 0.05, -0.58, 0.4)
      elbow(p, 'R', g, 0.25, -1, 0.3)
      p.wrR = mix(p.wrR, 0.5, g)
      p.twR = 0.5 * g
      toMid(p, 'L', g, -0.14, -0.52, 0.32)
      elbow(p, 'L', g, 0.7, -0.6, -0.3)
      p.twL = -0.6 * g
      p.hipX = 0.05 * g
      p.hipRz = -0.05 * g
      p.spineRz = 0.05 * g
      p.headRz = -0.14 * g + 0.03 * Math.sin(t * 2.2) * g
      p.headRy = 0.16 * g
      p.headRx = -0.06 * g - 0.1 * a
      p.lookX = 0.75 * g
      p.lookY = 0.8 * g
      p.browL = 0.9 * g + a
      p.browR = -0.35 * g + a
      p.smile = mix(p.smile, -0.2, g) + 1.2 * a
      p.round = 0.3 * g
      p.fpR = 0.28 * Math.pow(Math.abs(Math.sin(t * TAU * 0.9)), 3) * g + 0.3 * a
      p.fpL = 0.3 * a
      // the idea: the hand shoots up, the whole body lifts
      reach(p, 'R', a, 0.3, 0.86, 0.26)
      elbow(p, 'R', a, 0.8, -0.8, -0.2)
      p.twR += -1.6 * a
      p.hipY = 0.02 * a
      p.squash = 0.04 * a
      p.open = 0.85 * a
      p.attend = 1 - g
    },
  },

  /* Peek-a-boo: hide behind both hands, steal one look, then "boo!". */
  peek: {
    duration: 3.1,
    apex: 0.95,
    pose(t, p) {
      const c = key(t, [[0, 0], [0.15, -0.08], [0.6, 1], [1.5, 1], [1.66, 0, 'in']])
      const g = Math.max(0, c)
      const bo = key(t, [[1.52, 0], [1.74, 1.14, 'out'], [1.98, 1], [2.5, 1], [3.1, 0]])
      const look = win(t, 0.98, 1.32, 0.1, 0.1)
      for (const s of ['L', 'R'] as const) {
        toHead(p, s, g, 0.2 + (s === 'L' ? 0.2 * look : 0), -0.06, 0.6)
        elbow(p, s, g, 0.45, -1, 0.35)
        p[`tw${s}`] = 1.35 * g - 1.4 * Math.max(0, bo)
        p[`wr${s}`] = mix(p[`wr${s}`], 0.25, g)
        p[`sh${s}`] = 0.12 * g
        reach(p, s, bo, 0.52 + 0.03 * Math.sin(t * 20) * win(t, 1.75, 2.4, 0.1, 0.2), 0.44, 0.4)
        elbow(p, s, Math.max(0, bo), 1, -0.7, -0.1)
        p[`fp${s}`] = 0.32 * Math.max(0, bo)
      }
      p.hipY = -0.1 * g + 0.02 * Math.max(0, bo)
      p.spineRx = 0.16 * g - 0.1 * bo
      p.headRx = 0.14 * g - 0.1 * bo
      p.headRy = 0.05 * Math.sin(t * 9) * g * (1 - look)
      p.headRz = -0.1 * look
      p.squash = -0.04 * g + 0.06 * win(t, 1.6, 2.1, 0.1, 0.3)
      p.blink = g * (1 - look)
      p.lookX = 0.5 * look
      p.open = Math.max(0, bo)
      p.round = 0.25 * Math.max(0, bo) + 0.2 * look
      p.smile = mix(p.smile, 1, Math.min(1, g + Math.max(0, bo)))
      p.browL = p.browR = Math.max(0, bo) + 0.6 * look
      p.attend = 1 - g
    },
  },

  /* Arms thrown wide, then a big squeezing hug with a happy rock from side to side. */
  hug: {
    duration: 3.1,
    apex: 1.4,
    pose(t, p) {
      const o = key(t, [[0, 0], [0.45, 1], [0.78, 0, 'in']])
      const h = key(t, [[0.6, 0], [1.0, 1.08, 'out'], [1.22, 1], [2.2, 1], [2.62, -0.06], [3.1, 0]])
      const g = Math.max(0, h)
      const rock = Math.sin((t - 1.0) * TAU * 0.85) * win(t, 1.0, 2.25, 0.2, 0.25)
      for (const s of ['L', 'R'] as const) {
        reach(p, s, o, 0.86, 0.08, -0.12)
        elbow(p, s, o, 0.2, -0.5, -1)
        elbow(p, s, g, 0.8, -0.75, 0.45)
        p[`sh${s}`] = 0.2 * g
        p[`tw${s}`] = -0.7 * o + 0.4 * g
      }
      toMid(p, 'R', g, -0.34, -0.1, 0.32)
      toMid(p, 'L', g, -0.3, -0.24, 0.42)
      p.chestRx = -0.12 * o + 0.05 * g
      p.spineRx = -0.05 * o + 0.1 * g
      p.headRx = -0.1 * o + 0.1 * g
      p.headRz = 0.2 * g + 0.05 * rock
      p.chestRy = 0.15 * rock
      p.hipX = 0.035 * rock
      p.hipRz = -0.04 * rock
      p.hipY = 0.012 * o - 0.02 * g
      p.squash = 0.03 * o - 0.045 * g
      p.happy = g
      p.open = 0.5 * o
      p.smile = mix(p.smile, 1, Math.min(1, o + g))
      p.browL = p.browR = 0.6 * o + 0.3 * g
      p.attend = 1 - g
    },
  },
}

export const ACTS = Object.keys(GESTURE_DEFS) as Act[]

/** Pose of a gesture at time t. */
export function gesturePose(act: Act, t: number, out: Pose): Pose {
  copyPose(REST, out)
  GESTURE_DEFS[act].pose(t, out)
  return out
}

/** One full idle loop, seconds (two breaths, one sway). */
export const IDLE_LOOP = 7.2

/** The living rest: breathing, a slow shift of weight, a little life in the arms and head. Loops every IDLE_LOOP. */
export function idlePose(t: number, out: Pose): Pose {
  copyPose(REST, out)
  const br = Math.sin((t / (IDLE_LOOP / 2)) * TAU)
  const sw = Math.sin((t / IDLE_LOOP) * TAU)
  const sw2 = Math.sin((t / IDLE_LOOP) * TAU - 0.9)
  out.hipY = 0.004 * br
  out.spineRx = -0.012 * br
  out.chestRx = -0.016 * br
  out.neckRx = 0.012 * br
  both(out, 'sh', 0.035 * (0.5 + 0.5 * br))
  out.hipX = 0.035 * sw
  out.hipRz = -0.03 * sw
  out.spineRz = 0.022 * sw
  out.chestRz = 0.012 * sw
  out.headRz = -0.03 * sw2
  out.headRy = 0.03 * sw2
  out.axL += 0.012 * br + 0.02 * sw2
  out.axR += 0.012 * br - 0.02 * sw2
  out.azL += 0.02 * sw2
  out.azR -= 0.02 * sw2
  return out
}
