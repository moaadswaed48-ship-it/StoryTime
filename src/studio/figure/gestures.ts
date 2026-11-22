/**
 * The shared gestures: every name in `GESTURES` (src/cast/sheet.ts), written once as a pose track.
 * A gesture is a pure function of time that returns a whole pose in the figure's own proportions, so it plays
 * unchanged on any character sheet. Each one starts and ends at rest, so gestures chain and loop.
 */
import type { Gesture } from '@/cast/sheet'
import { E, hopArc, ramp, track, type Key } from '../kit/core'
import { FACES, rest, type Pose } from './pose'

/** How long each gesture takes, seconds. */
export const GESTURE_SECONDS: Record<Gesture, number> = { idle: 4, wave: 2.6, dance: 3.2, jump: 1.9, clap: 2.6, spin: 2.2, bow: 2.8, cheer: 2.6, think: 3.4, peek: 3.2, hug: 3 }

const R = rest()
const keys = (k: Key<Pose>[]) => track<Pose>(R, k)
const blinks = (t: number, at: number[]) => {
  for (const b of at) if (t >= b && t < b + 0.16) return 1
  return 0
}
const hop = (p: Pose, t: number, t0: number, air: number, h: number, give = 1) => {
  const a = hopArc(t, t0, air, h, 0.26)
  p.lift += a.lift
  p.crouch = Math.min(1, p.crouch + a.crouch * give)
  p.sq *= 1 + (a.sq - 1) * give
  return a
}
const wave = (t: number, t0: number, t1: number, edge = 0.2) => ramp(t, t0, t0 + edge) * (1 - ramp(t, t1 - edge, t1))

const TRACKS: Record<Gesture, (t: number) => Pose> = {
  idle: (t) => {
    const p = { ...R }
    const b = Math.sin((t / 4) * Math.PI * 2)
    p.sq = 1 + 0.012 * b
    p.hipx = 0.07 * Math.sin((t / 4) * Math.PI * 2 + 1)
    p.lean = -0.012 * Math.sin((t / 4) * Math.PI * 2 + 1)
    p.tilt = 0.035 * Math.sin((t / 4) * Math.PI * 2 + 0.4)
    p.ry = 0.97 - 0.006 * b
    p.ly = 0.97 - 0.006 * b
    p.lookX = 0.6 * wave(t, 1.5, 2.7, 0.25)
    p.turn = 0.12 * wave(t, 1.6, 2.8, 0.3)
    p.blink = blinks(t, [0.9, 3.1])
    return p
  },

  wave: (() => {
    const k = keys([
      [0.1, 0.42, { lx: 0.5, ly: -0.62, tilt: 0.1, lean: -0.05, turn: 0.1, hipx: -0.12, ...FACES.delight, open: 0.5 }, 'back'],
      [0.1, 0, { lHand: 5 }],
      [1.9, 0.5, { lx: R.lx, ly: R.ly, tilt: 0, lean: 0, turn: 0, hipx: 0, ...FACES.calm }],
      [2.3, 0, { lHand: 0 }],
    ])
    return (t) => {
      const p = k(t)
      const w = wave(t, 0.45, 1.95)
      const s = Math.sin((t - 0.45) * Math.PI * 2 * 2.2)
      p.lx += w * 0.16 * s
      p.lWrist = w * 0.42 * s
      p.tilt += w * 0.03 * s
      p.blink = blinks(t, [2.2])
      return p
    }
  })(),

  dance: (t) => {
    const p = { ...R, ...FACES.delight, open: 0.45 }
    const ph = (t / 1.6) * Math.PI * 2
    const sway = Math.sin(ph)
    const beat = 0.5 - 0.5 * Math.cos(ph * 2)
    const io = wave(t, 0, 3.2, 0.3)
    p.hipx = 0.34 * sway * io
    p.lean = -0.1 * sway * io
    p.tilt = 0.12 * sway * io
    p.crouch = 0.2 * (1 - beat) * io
    p.sq = 1 + 0.03 * beat * io
    p.rx = R.rx + (0.5 + 0.1 * sway - R.rx) * io
    p.ry = R.ry + (-0.34 * sway + 0.1 - R.ry) * io
    p.lx = R.lx + (0.5 - 0.1 * sway - R.lx) * io
    p.ly = R.ly + (0.34 * sway + 0.1 - R.ly) * io
    p.rHand = p.lHand = io > 0.5 ? 5 : 0
    p.rfy = 0.1 * Math.max(0, sway) * io
    p.lfy = 0.1 * Math.max(0, -sway) * io
    p.swing = 0.3 * Math.cos(ph) * io
    p.smile = R.smile + (1 - R.smile) * io
    p.open = 0.45 * io
    p.cheek = R.cheek + (1 - R.cheek) * io
    return p
  },

  jump: (() => {
    const k = keys([
      [0.2, 0.36, { rx: -0.1, ry: 0.9, lx: -0.1, ly: 0.9, ...FACES.curious, lookY: -0.6, nod: -0.3 }],
      [0.58, 0.2, { rx: 0.42, ry: -0.86, lx: 0.42, ly: -0.86, rfx: -0.16, lfx: 0.16, rfy: 0.12, lfy: 0.12, ...FACES.delight, nod: -0.4 }, 'out'],
      [0.58, 0, { rHand: 5, lHand: 5 }],
      [1.08, 0.16, { rfx: 0, lfx: 0, rfy: 0, lfy: 0 }, 'in'],
      [1.2, 0.5, { rx: R.rx, ry: R.ry, lx: R.lx, ly: R.ly, nod: 0, lookY: 0, ...FACES.smile }],
      [1.5, 0, { rHand: 0, lHand: 0 }],
      [1.5, 0.36, { ...FACES.calm }],
    ])
    return (t) => {
      const p = k(t)
      hop(p, t, 0.62, 0.56, 0.3)
      return p
    }
  })(),

  clap: (() => {
    const k = keys([
      [0.1, 0.36, { rB: 1, lB: 1, rBx: 0.5, lBx: 0.5, rBy: 0.36, lBy: 0.36, ...FACES.delight, open: 0.4, tilt: -0.05 }, 'out'],
      [0.1, 0, { rHand: 5, lHand: 5 }],
      [2.0, 0.46, { rB: 0, lB: 0, tilt: 0, ...FACES.calm }],
      [2.3, 0, { rHand: 0, lHand: 0 }],
    ])
    return (t) => {
      const p = k(t)
      const w = wave(t, 0.4, 2.05, 0.12)
      const c = 0.5 - 0.5 * Math.cos((t - 0.4) * Math.PI * 2 * 2.7) // 0 apart … 1 together
      p.rBx = p.lBx = 0.5 - (0.5 - 0.08) * (w > 0 ? E.in(c) * w + (1 - w) * 0 : 0)
      p.sq = 1 + 0.02 * c * w
      p.tilt += 0.05 * Math.sin((t - 0.4) * Math.PI * 2 * 1.35) * w
      p.crouch = 0.06 * c * w
      return p
    }
  })(),

  spin: (() => {
    const k = keys([
      [0.1, 0.3, { rx: 0.2, ry: 0.9, lx: 0.2, ly: 0.9, ...FACES.smile }],
      [0.4, 1.2, { spin: Math.PI * 2 }, 'io'],
      [0.4, 0.4, { rx: 0.62, ry: 0.6, lx: 0.62, ly: 0.6, ...FACES.delight, open: 0.5 }, 'out'],
      [1.3, 0.5, { rx: R.rx, ry: R.ry, lx: R.lx, ly: R.ly }],
      [1.7, 0.4, { ...FACES.calm }],
    ])
    return (t) => {
      const p = k(t)
      const v = Math.sin(ramp(t, 0.4, 1.6) * Math.PI)
      p.swing = 0.6 * v
      hop(p, t, 0.55, 0.9, 0.07, 0.4)
      p.rfy += 0.04 * v
      p.lfy += 0.04 * v
      return p
    }
  })(),

  bow: (() => {
    const k = keys([
      [0.15, 0.4, { rB: 1, rBx: 0.2, rBy: 0.7, lx: -0.12, ly: 0.82, ...FACES.smile }],
      [0.15, 0, { lBack: 1 }],
      [0.5, 0.55, { pitch: 1, nod: 1, blink: 1, crouch: 0.08 }, 'io'],
      [1.5, 0.5, { pitch: 0, nod: 0, blink: 0, crouch: 0 }, 'io'],
      [2.05, 0.5, { rB: 0, lx: R.lx, ly: R.ly, ...FACES.calm }],
      [2.5, 0, { lBack: 0 }],
    ])
    return (t) => k(t)
  })(),

  cheer: (() => {
    const k = keys([
      [0.12, 0.34, { rx: 0.42, ry: -0.88, lx: 0.42, ly: -0.88, ...FACES.laugh, nod: -0.35 }, 'back'],
      [0.12, 0, { rHand: 5, lHand: 5 }],
      [1.85, 0.5, { rx: R.rx, ry: R.ry, lx: R.lx, ly: R.ly, nod: 0, ...FACES.smile }],
      [2.2, 0, { rHand: 0, lHand: 0 }],
      [2.2, 0.36, { ...FACES.calm }],
    ])
    return (t) => {
      const p = k(t)
      const w = wave(t, 0.4, 1.9)
      const s = Math.sin((t - 0.4) * Math.PI * 2 * 2.4)
      p.rx += 0.06 * s * w
      p.lx -= 0.06 * s * w
      p.rWrist = 0.25 * s * w
      p.lWrist = -0.25 * s * w
      hop(p, t, 0.5, 0.38, 0.12, 0.7)
      hop(p, t, 1.2, 0.38, 0.12, 0.7)
      return p
    }
  })(),

  think: (() => {
    const k = keys([
      [0.15, 0.5, { rH: 1, rHx: 0.3, rHy: 1.62, lB: 1, lBx: -0.42, lBy: 0.6, tilt: -0.11, turn: -0.15, hipx: 0.14, ...FACES.think }],
      [0.4, 0, { rHand: 6 }],
      [2.0, 0.3, { brow: 0.9, browTilt: 0, lookX: 0, lookY: -0.2, smile: 0.6, wob: 0, lids: 0, wide: 0.5, tilt: 0 }, 'back'],
      [2.55, 0.55, { rH: 0, lB: 0, tilt: 0, turn: 0, hipx: 0, ...FACES.calm, lookX: 0, lookY: 0 }],
      [2.7, 0, { rHand: 0 }],
    ])
    return (t) => {
      const p = k(t)
      const w = wave(t, 0.7, 2.0)
      p.rWrist = 0.12 * Math.sin((t - 0.7) * Math.PI * 2 * 1.2) * w
      p.blink = blinks(t, [1.2])
      return p
    }
  })(),

  peek: (() => {
    const k = keys([
      [0.1, 0.4, { rH: 1, lH: 1, rHx: 0.42, lHx: 0.42, rHy: 0.92, lHy: 0.92, blink: 1, smile: 0.8, crouch: 0.1, nod: 0.3 }, 'out'],
      [1.25, 0.24, { rHx: 1.5, lHx: 1.5, rHy: 0.5, lHy: 0.5, blink: 0, crouch: 0, nod: -0.1, ...FACES.delight, wide: 0.5 }, 'back'],
      [1.25, 0, { rHand: 5, lHand: 5 }],
      [2.35, 0.55, { rH: 0, lH: 0, nod: 0, ...FACES.calm }],
      [2.6, 0, { rHand: 0, lHand: 0 }],
    ])
    return (t) => {
      const p = k(t)
      const w = wave(t, 0.5, 1.2, 0.15)
      p.tilt = 0.06 * Math.sin((t - 0.5) * Math.PI * 2 * 1.4) * w
      return p
    }
  })(),

  hug: (() => {
    const k = keys([
      [0.1, 0.45, { rx: 0.88, ry: 0.06, lx: 0.88, ly: 0.06, ...FACES.delight, open: 0.5 }, 'back'],
      [0.1, 0, { rHand: 5, lHand: 5 }],
      [0.85, 0.4, { rB: 1, lB: 1, rBx: -0.62, lBx: -0.62, rBy: 0.3, lBy: 0.46, sq: 0.96, tilt: 0.14, ...FACES.smile, cheek: 1, smile: 1, flush: 0.6 }, 'io'],
      [0.95, 0, { rHand: 0, lHand: 0 }],
      [2.2, 0.55, { rB: 0, lB: 0, rx: R.rx, ry: R.ry, lx: R.lx, ly: R.ly, sq: 1, tilt: 0, ...FACES.calm }],
    ])
    return (t) => {
      const p = k(t)
      const w = wave(t, 1.2, 2.2, 0.25)
      p.hipx = 0.16 * Math.sin((t - 1.2) * Math.PI * 2) * w
      p.lean = -0.04 * Math.sin((t - 1.2) * Math.PI * 2) * w
      return p
    }
  })(),
}

/**
 * The pose of gesture `name` at `t` seconds, standing at (x, y). Time wraps, so a gesture loops.
 * Lay a different face or a held prop over the result if the scene needs one.
 */
export function gesturePose(name: Gesture, t: number, x = 0, y = 0): Pose {
  const d = GESTURE_SECONDS[name]
  const p = TRACKS[name](((t % d) + d) % d)
  p.x = x
  p.y = y
  return p
}
