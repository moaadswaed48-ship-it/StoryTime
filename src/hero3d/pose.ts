/**
 * A pose is plain numbers in body-relative units, so one pose fits every character whatever its proportions:
 * hands are placed relative to the shoulder (in arm lengths), the chest midline or the head (in head heights);
 * feet relative to where they stand (in leg lengths); the trunk by joint turns. The solver turns it into bones.
 *
 * Arm and leg channels end in L or R (the figure's own left and right); x always means "outward from the body".
 */

const BODY = {
  /** Whole-body turn about the vertical (radians) and lift off the ground (leg lengths). */
  yaw: 0,
  lift: 0,
  /** Hips: shift in leg lengths (x toward the figure's left, y up, z forward), then pitch / twist / roll. */
  hipX: 0,
  hipY: 0,
  hipZ: 0,
  hipRx: 0,
  hipRy: 0,
  hipRz: 0,
  /** Squash (below 0) and stretch (above 0) of the whole body. */
  squash: 0,
  spineRx: 0,
  spineRy: 0,
  spineRz: 0,
  chestRx: 0,
  chestRy: 0,
  chestRz: 0,
  neckRx: 0,
  neckRy: 0,
  neckRz: 0,
  headRx: 0,
  headRy: 0,
  headRz: 0,
  /** Face: lids, smile-squint, mouth corner lift, mouth open, rounded "oh", brows, gaze. */
  blink: 0,
  happy: 0,
  smile: 0.35,
  open: 0,
  round: 0,
  browL: 0,
  browR: 0,
  lookX: 0,
  lookY: 0,
  /** 0 … 1: how much the pointer may steer the head and eyes during this pose. */
  attend: 1,
}

const SIDE = {
  /** Hand target from the own shoulder, in arm lengths (x outward, y up, z forward). */
  ax: 0.13,
  ay: -0.95,
  az: 0.07,
  /** Weight and target relative to the chest midline at shoulder height, in arm lengths (x toward the own side). */
  am: 0,
  amx: 0,
  amy: 0,
  amz: 0,
  /** Weight and target relative to the head centre, in head heights (x toward the own side). */
  ah: 0,
  ahx: 0,
  ahy: 0,
  ahz: 0,
  /** Which way the elbow points (x outward, y up, z forward). */
  ex: 0.35,
  ey: -0.25,
  ez: -1,
  /** Forearm roll, wrist bend toward the palm, wrist tilt toward the thumb. */
  tw: 0,
  wr: 0.12,
  ws: 0,
  /** Shoulder shrug. */
  sh: 0,
  /** Foot: offset from where it stands (leg lengths; x outward, y up, z forward), heel raise, toe-out, knee-out. */
  fx: 0,
  fy: 0,
  fz: 0,
  fp: 0,
  fyaw: 0.12,
  kx: 0.18,
}

type BodyKey = keyof typeof BODY
type SideKey = `${keyof typeof SIDE}${'L' | 'R'}`
export type Channel = BodyKey | SideKey
export type Pose = Record<Channel, number>

function restPose(): Pose {
  const p = { ...BODY } as Pose
  for (const k of Object.keys(SIDE) as (keyof typeof SIDE)[]) {
    p[`${k}L`] = SIDE[k]
    p[`${k}R`] = SIDE[k]
  }
  return p
}

/** The neutral stand every gesture starts from and returns to. */
export const REST: Readonly<Pose> = Object.freeze(restPose())
export const CHANNELS = Object.keys(REST) as Channel[]

export const copyPose = (from: Readonly<Pose>, to: Pose = {} as Pose): Pose => {
  for (const k of CHANNELS) to[k] = from[k]
  return to
}

/** out = a + (b − a) · t, channel by channel. */
export function lerpPose(a: Readonly<Pose>, b: Readonly<Pose>, t: number, out: Pose): Pose {
  for (const k of CHANNELS) out[k] = a[k] + (b[k] - a[k]) * t
  return out
}

export const wrapAngle = (a: number) => a - Math.round(a / (Math.PI * 2)) * Math.PI * 2

/* ───── timing ───── */

export type Ease = 'lin' | 'io' | 'in' | 'out' | 'back' | 'spring' | 'hold'
const EASE: Record<Ease, (t: number) => number> = {
  lin: (t) => t,
  io: (t) => t * t * (3 - 2 * t),
  in: (t) => t * t * t,
  out: (t) => 1 - (1 - t) ** 3,
  /** Shoots past the target and comes back (overshoot). */
  back: (t) => 1 + 2.4 * (t - 1) ** 3 + 1.4 * (t - 1) ** 2,
  /** Arrives fast and wobbles to rest (settle). */
  spring: (t) => 1 - Math.exp(-6 * t) * Math.cos(t * 11) * (1 - t),
  hold: (t) => (t < 1 ? 0 : 1),
}

/** One key: [time, value, ease into this key]. */
export type Key = [number, number, Ease?]

/** Value of a keyed track at time `t`. Before the first key and after the last it holds. */
export function key(t: number, keys: Key[]): number {
  if (t <= keys[0][0]) return keys[0][1]
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i]
    if (t <= k[0]) {
      const p = keys[i - 1]
      const u = (t - p[0]) / (k[0] - p[0] || 1)
      return p[1] + (k[1] - p[1]) * EASE[k[2] ?? 'io'](u)
    }
  }
  return keys[keys.length - 1][1]
}

/** 0 → 1 → 0 window: rises over `rise` from `a`, falls over `fall` to `b`. */
export function win(t: number, a: number, b: number, rise = 0.2, fall = rise): number {
  const up = Math.min(1, Math.max(0, (t - a) / rise))
  const dn = Math.min(1, Math.max(0, (b - t) / fall))
  return EASE.io(up) * EASE.io(dn)
}

/** Sets the same channel on both sides. */
export function both(p: Pose, k: keyof typeof SIDE, v: number) {
  p[`${k}L`] = v
  p[`${k}R`] = v
}
