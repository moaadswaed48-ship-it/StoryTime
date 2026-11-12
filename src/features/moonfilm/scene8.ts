/**
 * Scene 8 — «هوب!» — as a short film: eight shots, about 35 seconds.
 *
 * One continuous performance in world space (every character has a single time-line across the whole scene); the
 * shots only decide where the camera stands. Everything is a pure function of the time `T` in seconds.
 *
 * Geography (fixed): night and Teacher Layla to screen left, the Sun low off-frame to the right, travel left→right.
 *
 *  1  0.0  wide, in the night      the robot asleep in the lamp's circle; Sari gets the idea and points at the day
 *  2  5.0  medium two-shot         the count: three heaves, a look between friends, then «هوب!»
 *  3  8.4  wide, tilting up        he is far too light — he sails over their heads, hangs, and they catch him
 *  4 13.4  side-on tracking shot   three long bounds; the daylight wipes across them as they cross the line
 *  5 18.8  close-up, the wing      a beat of nothing… then the fan opens petal by petal and shakes off its dust
 *  6 23.8  extreme close-up, eye   blink… blink…
 *  7 26.2  two-shot, the friends   the third blink stays lit; its light reaches Sari's face in the dark
 *  8 29.6  the picture             Amir leaps, Sari points at the wing, Layla smiles from the dark: the key pose
 */
import { moon } from '@/content/stories/moon'
import { E, Painter, STAGE_W, clamp01, ellipse, hopArc, lerp, paperGrain, ramp, track, type Cam, type Key, type Light } from './kit/core'
import { drawPerson, rest, skeleton, type Pose, type Who } from './kit/people'
import { drawEyeHalo, drawRover, petalTip, roverEye, roverRest, type Rover } from './kit/wameed'
import { dayRegion, drawBursts, drawEarth, drawGround, drawPrints, drawRock, drawSky, lineX, nightRegion, type Burst, type Ground, type Print, type Terminator } from './kit/world'

export const DURATION = 35.2
export const SHOTS = [0, 5.0, 8.4, 13.4, 18.8, 23.8, 26.2, 29.6]

// ── the set ───────────────────────────────────────────────────────────────────
const LINE: Terminator = { x: 0, y: 790, slope: 0.45 }
const DAY = dayRegion(LINE)
const NIGHT = nightRegion(LINE)
const GROUND: Ground = {
  horizon: 640,
  cx: -260,
  curve: 5600,
  hills: [[-1750, 230, 46], [-1260, 150, 30], [-930, 90, 22], [-330, 210, 40], [150, 120, 26], [640, 260, 52], [1180, 140, 30], [1500, 200, 44]],
  craters: [[-1240, 742, 74], [-1010, 905, 92], [-330, 716, 58], [-150, 930, 64], [470, 724, 76], [330, 935, 70], [820, 880, 110], [980, 706, 44]],
  pebbles: [[-1120, 820, 6], [-860, 866, 5], [-420, 850, 7], [-250, 780, 4], [200, 868, 6], [560, 800, 5], [640, 950, 8], [-610, 930, 6], [900, 760, 4], [60, 720, 4]],
}
const SY = 790 // Sari's ground row
const AY = 812 // Amir stands a little nearer the camera
const WY = 798 // Wameed
const LY = 778 // Layla, a little further away

// ── beats ─────────────────────────────────────────────────────────────────────
const HOP = 7.9 // «هوب!»
const CATCH = 10.94
const B1 = 13.0 // three bounds toward the light: take-off times
const B2 = 14.75
const B3 = 16.5
const DOWN = 17.7 // they set him down in the Sun
const WING = 20.2 // the wing stirs
const PETAL = (i: number) => 20.9 + i * 0.36 // petal i (1…6) swings open
const BLINK1 = 24.3
const BLINK2 = 25.1
const BLINK3 = 26.8
const LEAP = 30.3 // Amir's leap

// ── Wameed ────────────────────────────────────────────────────────────────────
const WX = 126 // where he is set down, in the Sun
/** Where he is along the ground (carried from his rocks into the daylight). */
function roverX(T: number): number {
  if (T < B1) return -640
  if (T < B1 + 1.5) return lerp(-640, -400, (T - B1) / 1.5)
  if (T < B2) return lerp(-400, -392, (T - B1 - 1.5) / 0.25)
  if (T < B2 + 1.5) return lerp(-392, -130, (T - B2) / 1.5)
  if (T < B3) return lerp(-130, -122, (T - B2 - 1.5) / 0.25)
  if (T < B3 + 1.0) return lerp(-122, 98, (T - B3) / 1.0)
  return lerp(98, WX, E.out(ramp(T, B3 + 1.0, B3 + 1.45)))
}
const carryHop = (T: number) => hopArc(T, B1, 1.5, 86, 0.3).lift + hopArc(T, B2, 1.5, 86, 0.22).lift + hopArc(T, B3, 1.0, 40, 0.2).lift

const roverTrack = track<Rover>({ ...roverRest, y: WY }, [
  // the toss
  [HOP, 1.5, { rot: -0.24 }, 'out'],
  [HOP + 1.5, 1.4, { rot: 0.14 }, 'soft'],
  [CATCH - 0.15, 0.4, { rot: 0 }, 'out'],
  [HOP, 0.3, { dust: 0.86 }],
  [CATCH - 0.01, 0, { lift: 100 }],
  [CATCH, 0.25, { lift: 72, sq: 0.94, dust: 0.78 }, 'out'],
  [CATCH + 0.25, 0.6, { lift: 104, sq: 1 }, 'back'],
  // carried, with a little nose-up tilt on each bound
  [B1 - 0.1, 0.4, { rot: -0.09 }, 'out'],
  [B1 + 1.2, 0.4, { rot: 0.05 }],
  [B2, 0.4, { rot: -0.09 }, 'out'],
  [B2 + 1.2, 0.4, { rot: 0.05 }],
  [B3, 0.3, { rot: -0.07 }, 'out'],
  [B3 + 0.8, 0.5, { rot: 0 }],
  [DOWN, 0.42, { lift: 0 }, 'io'],
  [DOWN + 0.42, 0.12, { sq: 0.93 }, 'out'],
  [DOWN + 0.54, 0.35, { sq: 1 }, 'back'],
  // the wing: a tremor, an unfolding, then six petals one after another
  [WING, 0.12, { sweep: 0.03 }, 'out'],
  [WING + 0.16, 0.14, { sweep: 0.012 }],
  [WING + 0.38, 0.4, { sweep: 0.1 }, 'back'],
  ...[1, 2, 3, 4, 5, 6].map((i): Key<Rover> => [PETAL(i), 0.3, { sweep: 0.1 + i * 0.15 }, 'back']),
  [WING, 3.2, { dust: 0.0 }, 'lin'],
  // the eye
  [BLINK1 - 0.1, 0.14, { lid: 0.5 }, 'out'],
  [BLINK1, 0.07, { glow: 0.85 }],
  [BLINK1 + 0.2, 0.22, { glow: 0 }],
  [BLINK1 + 0.1, 0.4, { neck: 0.22 }, 'back'],
  [BLINK2 - 0.08, 0.12, { lid: 0.24 }, 'out'],
  [BLINK2, 0.07, { glow: 0.95 }],
  [BLINK2 + 0.28, 0.25, { glow: 0 }],
  [BLINK2 + 0.1, 0.4, { neck: 0.5 }, 'back'],
  [BLINK3 - 0.08, 0.12, { lid: 0 }, 'out'],
  [BLINK3, 0.09, { glow: 1 }],
  [BLINK3 + 0.12, 0.5, { neck: 1 }, 'back'],
  // he looks at the one, then at the other
  [BLINK3 + 0.75, 0.3, { lookX: -1, lookY: -0.5 }, 'back'],
  [BLINK3 + 1.75, 0.3, { lookX: 1, lookY: -0.6 }, 'back'],
  [LEAP + 0.1, 0.5, { lookX: 0.9, lookY: -1 }, 'out'],
  [LEAP + 1.5, 0.45, { lookX: -1, lookY: -0.3 }],
  [LEAP + 2.5, 0.4, { lookX: 0.6, lookY: -0.6 }],
  // a happy double blink near the end
  [33.3, 0.06, { glow: 0.12, lid: 0.9 }],
  [33.4, 0.1, { glow: 1, lid: 0 }],
  [33.62, 0.06, { glow: 0.12, lid: 0.9 }],
  [33.72, 0.1, { glow: 1, lid: 0 }],
])

function rover(T: number): Rover {
  const r = roverTrack(T)
  r.x = roverX(T)
  if (T >= HOP - 0.06 && T < CATCH) {
    // tossed: one clean slow arc
    const s = Math.max(0, T - HOP)
    r.lift = Math.max(0, 398 * s - 120 * s * s) + 6 * ramp(T, HOP - 0.06, HOP)
  } else if (T >= CATCH) {
    if (T < DOWN + 0.42) r.lift += carryHop(T - 0.05)
  }
  // wheel wiggle: he is pleased
  const w = ramp(T, 32.3, 32.5) * (1 - ramp(T, 33.0, 33.25))
  if (w > 0) {
    const s = Math.sin((T - 32.3) * 19)
    r.roll = s * 1.1 * w
    r.x += s * 5 * w
    r.rot += s * 0.035 * w
  }
  return r
}

// ── the friends ───────────────────────────────────────────────────────────────
const DOWNFEET = { fax: -22, fay: 0, fbx: 24, fby: 0 }
const STRIDE = { fax: -64, fay: 30, fbx: 54, fby: 34 }
const REACH = { fax: -30, fay: 4, fbx: 58, fby: 10 } // legs reaching for the ground before a landing

const sariTrack = track<Pose>(
  { ...rest('sari', -775, SY), crouch: 0.78, lean: 0.32, turn: 0.6, lookX: 0.4, lookY: 0.7, toe: 1, ax: -2, ay: 54, bw: 1, mOpen: 0.3, mWide: 0.1, brow: 0.3 },
  [
    // 1 ─ the idea
    [1.25, 0.32, { turn: 0.85, lookX: 1, lookY: -0.35, wide: 1, brow: 1, mOpen: 0.55, mWide: 0.2, lean: 0.16, bw: 0, bx: 22, by: 46 }, 'back'],
    [1.95, 0.3, { crouch: 0.96, lean: 0.3 }],
    [2.25, 0.38, { crouch: 0, lean: -0.08, bx: 68, by: -14, bPoint: 1, ax: -36, ay: 36, mOpen: 0.95, mWide: 1, wide: 0.5, tilt: -0.08, fax: -34, fay: 18, fbx: 22, fby: 6 }, 'back'],
    [3.3, 0.22, DOWNFEET],
    [3.75, 0.45, { turn: 0.6, lookX: 0.9, lookY: 0.1, mOpen: 0.6, wide: 0.1, brow: 0.5, tilt: 0, lean: 0 }],
    [4.3, 0.5, { bPoint: 0, bx: 34, by: 58, ax: -4, ay: 56, lookY: 0.7, crouch: 0.4, lean: 0.3, mOpen: 0.2 }],
    // 2 ─ the count
    [4.75, 0.4, { crouch: 0.66, lean: 0.26, aw: 1, bw: 1, turn: 0.5, lookX: 0.3, lookY: 0.8, mOpen: 0, mCurve: 0.5, brow: 0.2 }],
    [5.5, 0.2, { crouch: 0.76 }],
    [5.72, 0.26, { crouch: 0.6 }, 'back'],
    [6.35, 0.2, { crouch: 0.8 }],
    [6.58, 0.26, { crouch: 0.6 }, 'back'],
    [6.72, 0.2, { turn: 0.85, lookX: 1, lookY: -0.1, mOpen: 0.6, mWide: 1, mCurve: 1, brow: 0.6 }],
    [7.12, 0.2, { turn: 0.55, lookX: 0.3, lookY: 0.8, mOpen: 0, mWide: 0.4, brow: -0.5 }],
    [7.2, 0.3, { crouch: 0.9, lean: 0.34 }],
    [HOP - 0.08, 0.14, { crouch: 0, lean: 0.06 }, 'snap'],
    [HOP + 0.05, 0.36, { aw: 0, bw: 0 }, 'soft'],
    [HOP + 0.04, 0.5, { ax: -12, ay: -68, bx: 30, by: -72 }, 'back'],
    [HOP + 0.1, 0.2, { wide: 1, brow: 1, mOpen: 0.75, mWide: 0.15, tilt: -0.24, lookY: -1, lookX: 0.5 }],
    // 3 ─ too light
    [8.9, 0.6, { ax: -34, ay: -18, bx: 46, by: -28, lean: 0 }],
    [9.9, 0.7, { ax: -14, ay: -62, bx: 34, by: -66, tilt: -0.2 }],
    [CATCH - 0.6, 0.6, { aw: 1, bw: 1 }, 'soft'],
    [CATCH, 0.25, { crouch: 0.3, tilt: 0, lookY: 0.4, wide: 0.2 }, 'out'],
    [CATCH + 0.25, 0.55, { crouch: 0.04 }, 'back'],
    [CATCH + 0.4, 0.2, { happy: 1, mOpen: 0.95, mWide: 1, mCurve: 1, brow: 0.4, tilt: -0.1, wide: 0 }],
    [12.5, 0.3, { happy: 0, turn: 0.85, lookX: 1, lookY: -0.2, mOpen: 0.5, tilt: 0, aw: 0, ax: -36, ay: 34 }],
    // 4 ─ into the light (Sari pushes from behind)
    [B1, 0.3, { ...STRIDE, lean: 0.34, rot: 0.1, ax: -52, ay: 6, mOpen: 0.8, mWide: 1 }, 'out'],
    [B1 + 0.8, 0.5, { ...REACH, rot: -0.06, ax: -30, ay: 40 }, 'soft'],
    [B1 + 1.44, 0.14, { ...DOWNFEET, rot: 0 }],
    [B2, 0.3, { ...STRIDE, rot: 0.1, ax: -52, ay: 6 }, 'out'],
    [B2 + 0.8, 0.5, { ...REACH, rot: -0.06, ax: -30, ay: 40 }, 'soft'],
    [B2 + 1.44, 0.14, { ...DOWNFEET, rot: 0 }],
    [B3, 0.25, { fax: -52, fay: 20, fbx: 46, fby: 22, rot: 0.07 }, 'out'],
    [B3 + 0.5, 0.4, { ...REACH, rot: -0.04 }, 'soft'],
    [B3 + 0.94, 0.12, { ...DOWNFEET, rot: 0 }],
    [B3 + 0.9, 0.3, { lean: 0.1, mOpen: 0.3 }],
    [DOWN, 0.42, { crouch: 0.62, lean: 0.46, lookY: 0.8, turn: 0.6, aw: 1 }],
    [DOWN + 0.44, 0.34, { aw: 0, bw: 0 }, 'soft'],
    [DOWN + 0.5, 0.36, { crouch: 0.1, lean: 0.05, ax: -9, ay: 70, bx: 9, by: 70 }],
    // 5, 6 ─ watching, hands on knees
    [19.2, 0.45, { crouch: 0.44, lean: 0.3, ax: 4, ay: 60, bx: -4, by: 60, turn: 0.75, lookX: 0.9, lookY: 0.5, mOpen: 0, mCurve: 0.2, mWide: 0.3, brow: 0.5 }],
    [WING + 0.5, 0.3, { brow: 1, wide: 0.6, mOpen: 0.45, mWide: 0.15 }],
    [22.0, 0.8, { lean: 0.38, crouch: 0.5 }],
    [BLINK1 + 0.1, 0.2, { wide: 1, tilt: -0.06 }, 'back'],
    // 7 ─ the third blink
    [26.0, 0.3, { mOpen: 0, mWide: 0.2, mCurve: 0, wide: 0.8, brow: 1, lean: 0.46 }],
    [BLINK3 + 0.18, 0.3, { mOpen: 1, mWide: 1, mCurve: 1, wide: 1, tilt: -0.1, lean: 0.3 }, 'back'],
    [BLINK3 + 1.1, 0.25, { happy: 1, wide: 0, tilt: -0.14 }],
    [BLINK3 + 2.2, 0.3, { happy: 0, lookX: 1, lookY: -0.4, tilt: -0.05 }],
    // 8 ─ he steps up to the line and points at the wing
    [30.3, 0.28, { crouch: 0.52, lean: 0.2 }],
    [30.6, 0.5, { crouch: 0, lean: 0.1, bx: 70, by: 14, bPoint: 1, ax: -30, ay: 44, turn: 0.8, lookX: 1, lookY: 0.4, mOpen: 0.85, mWide: 0.9, brow: 0.7, fax: -30, fay: 10, fbx: 30, fby: 16 }, 'back'],
    [31.25, 0.18, DOWNFEET],
    [32.5, 0.4, { lookY: -0.5, tilt: -0.1, turn: 0.88 }],
    [33.5, 0.35, { lookY: 0.35, tilt: 0, turn: 0.8, mOpen: 0.6 }],
    [34.0, 0.14, { tilt: 0.12 }],
    [34.14, 0.24, { tilt: 0 }, 'back'],
  ],
)
const sariX = track({ x: -775 }, [
  [4.6, 0.4, { x: -780 }],
  [18.2, 0, { x: WX - 140 }],
  [18.3, 0.9, { x: -250 }, 'lin'],
  [30.6, 0.8, { x: -46 }, 'lin'],
])

const amirTrack = track<Pose>(
  { ...rest('amir', -505, AY), crouch: 0.12, lean: -0.14, turn: -0.6, lookX: -0.5, lookY: 0.6, toe: -1, ax: 26, ay: 30, bx: -26, by: 30, mOpen: 0, mCurve: 0.1, mWide: 0.25, brow: 0.6 },
  [
    // 1
    [2.36, 0.3, { turn: -0.5, lookY: -0.5, brow: 1, wide: 0.8, mOpen: 0.5, mWide: 0.15, lean: -0.02, crouch: 0 }, 'back'],
    [3.3, 0.45, { turn: 0.75, lookX: 1, lookY: -0.1, wide: 0.3 }],
    [4.0, 0.4, { turn: -0.5, lookX: -0.6, lookY: 0.5, mOpen: 0.6, mWide: 1, mCurve: 1, brow: 0.6, wide: 0, ax: -9, ay: 72, bx: 9, by: 72 }],
    [4.36, 0.14, { tilt: 0.14 }],
    [4.5, 0.22, { tilt: 0 }, 'back'],
    // 2
    [4.7, 0.45, { crouch: 0.64, lean: -0.26, aw: 1, bw: 1, lookY: 0.8, lookX: -0.3, mOpen: 0, mCurve: 0.5 }],
    [5.56, 0.2, { crouch: 0.73 }],
    [5.78, 0.26, { crouch: 0.58 }, 'back'],
    [6.41, 0.2, { crouch: 0.78 }],
    [6.64, 0.26, { crouch: 0.58 }, 'back'],
    [6.8, 0.2, { turn: -0.85, lookX: -1, lookY: -0.1, mOpen: 0.7, mWide: 1, mCurve: 1 }],
    [7.18, 0.2, { turn: -0.55, lookX: -0.3, lookY: 0.8, mOpen: 0, mWide: 0.4, brow: -0.5 }],
    [7.26, 0.3, { crouch: 0.87, lean: -0.34 }],
    [HOP - 0.06, 0.14, { crouch: 0, lean: -0.05 }, 'snap'],
    [HOP + 0.07, 0.36, { aw: 0, bw: 0 }, 'soft'],
    [HOP + 0.06, 0.5, { ax: -32, ay: -70, bx: 12, by: -64 }, 'back'],
    [HOP + 0.12, 0.2, { wide: 1, brow: 1, mOpen: 0.85, mWide: 0.15, tilt: 0.24, lookY: -1, lookX: -0.5 }],
    // 3
    [8.95, 0.6, { ax: -48, ay: -24, bx: 30, by: -14, lean: 0 }],
    [9.8, 0.6, { ax: -36, ay: -64, bx: 12, by: -60, tilt: 0.2 }],
    [CATCH - 0.6, 0.6, { aw: 1, bw: 1 }, 'soft'],
    [CATCH + 0.02, 0.25, { crouch: 0.32, tilt: 0, lookY: 0.4, wide: 0.2 }, 'out'],
    [CATCH + 0.27, 0.55, { crouch: 0.05 }, 'back'],
    [CATCH + 0.5, 0.2, { happy: 1, mOpen: 1, mWide: 1, mCurve: 1, tilt: 0.12, wide: 0, brow: 0.4 }],
    // he turns to lead the way: one hand keeps the robot, the other swings
    [12.55, 0.35, { happy: 0, turn: 0.7, lookX: 0.8, lookY: 0, toe: 1, bw: 0, bx: 30, by: 44, lean: 0.2, mOpen: 0.6, tilt: 0 }],
    // 4
    [B1 + 0.05, 0.3, { fax: -58, fay: 22, fbx: 60, fby: 40, lean: 0.3, rot: 0.08, bx: 46, by: -12 }, 'out'],
    [B1 + 0.85, 0.5, { fax: -26, fay: 2, fbx: 60, fby: 12, rot: -0.07, bx: 30, by: 36 }, 'soft'],
    [B1 + 1.49, 0.14, { ...DOWNFEET, rot: 0 }],
    [B2 + 0.05, 0.3, { fax: -58, fay: 22, fbx: 60, fby: 40, rot: 0.08, bx: 46, by: -12 }, 'out'],
    [B2 + 0.85, 0.5, { fax: -26, fay: 2, fbx: 60, fby: 12, rot: -0.07, bx: 30, by: 36 }, 'soft'],
    [B2 + 0.5, 0.3, { turn: -0.3, lookX: -1, lookY: 0.3 }],
    [B2 + 1.05, 0.3, { turn: 0.7, lookX: 0.6, lookY: 0 }],
    [B2 + 1.49, 0.14, { ...DOWNFEET, rot: 0 }],
    // the Sun in his face as he crosses
    [16.25, 0.2, { blink: 0.8, mOpen: 1, mWide: 1 }],
    [16.9, 0.3, { blink: 0 }],
    [B3 + 0.04, 0.25, { fax: -50, fay: 16, fbx: 50, fby: 26, rot: 0.06 }, 'out'],
    [B3 + 0.5, 0.4, { fax: -26, fay: 2, fbx: 56, fby: 8, rot: -0.04 }, 'soft'],
    [B3 + 0.98, 0.12, { ...DOWNFEET, rot: 0 }],
    [DOWN - 0.1, 0.45, { crouch: 0.6, lean: -0.3, turn: -0.55, lookX: -0.4, lookY: 0.8, toe: -1, bw: 1, mOpen: 0.3 }],
    [DOWN + 0.44, 0.34, { aw: 0, bw: 0 }, 'soft'],
    [DOWN + 0.52, 0.36, { crouch: 0.1, lean: -0.05, ax: -9, ay: 70, bx: 9, by: 70 }],
    // 5, 6
    [19.26, 0.45, { crouch: 0.4, lean: -0.3, ax: 4, ay: 60, bx: -4, by: 60, turn: -0.75, lookX: -0.9, lookY: 0.5, mOpen: 0, mCurve: 0.2, mWide: 0.3, brow: 0.5 }],
    [WING + 0.62, 0.3, { brow: 1, wide: 0.7, mOpen: 0.5, mWide: 0.15 }],
    [22.3, 0.8, { lean: -0.4 }],
    // 7 ─ hands on the glass, holding his breath… then joy
    [25.6, 0.5, { ax: 34, ay: -12, bx: -34, by: -12, wide: 0.8, brow: 1, mOpen: 0, mWide: 0.2, mCurve: 0, lean: -0.46 }],
    [BLINK3 + 0.26, 0.4, { mOpen: 1, mWide: 1, mCurve: 1, wide: 1, ax: -26, ay: -40, bx: 26, by: -40, crouch: 0.2, lean: -0.18, tilt: 0.08 }, 'back'],
    [BLINK3 + 1.2, 0.25, { happy: 1, wide: 0 }],
    [BLINK3 + 2.3, 0.3, { happy: 0, lookX: -1, lookY: 0.4, ax: -14, ay: 30, bx: 14, by: 30, crouch: 0.3 }],
    // 8 ─ the leap
    [LEAP - 0.3, 0.3, { crouch: 0.62, lean: -0.08, ax: -24, ay: 44, bx: 24, by: 44, tilt: 0 }],
    [LEAP, 0.46, { crouch: 0, lean: 0, ax: -46, ay: -64, bx: 46, by: -64, turn: -0.3, tilt: -0.12, mOpen: 1, mWide: 1, mCurve: 1, happy: 1, fax: -40, fay: 26, fbx: 40, fby: 26, toe: 0 }, 'back'],
    [LEAP + 0.3, 0.9, { rot: -0.12 }, 'soft'],
    [LEAP + 1.2, 0.8, { rot: 0.03, fax: -30, fay: 6, fbx: 30, fby: 6 }, 'soft'],
    [LEAP + 2.0, 0.2, { rot: 0, fax: -24, fay: 0, fbx: 24, fby: 0 }],
    [LEAP + 2.3, 0.4, { happy: 0, wide: 0.4, turn: -0.65, lookX: -1, lookY: 0.5, mOpen: 0.8, tilt: 0, ax: -40, ay: -50, bx: 36, by: -56 }],
    [33.2, 0.4, { ax: -52, ay: -58, bx: 46, by: -66, tilt: -0.1, mOpen: 1, turn: -0.4, lookY: -0.1, happy: 1 }, 'back'],
  ],
)
const amirX = track({ x: -505 }, [
  [4.6, 0.4, { x: -500 }],
  [18.2, 0, { x: WX + 140 }],
  [18.36, 0.9, { x: 480 }, 'lin'],
  [LEAP, 2.1, { x: 372 }, 'lin'],
])

const laylaTrack = track<Pose>(
  { ...rest('layla', -960, LY), turn: 0.55, lookX: 0.7, lookY: 0.3, toe: 0.6, bx: 60, by: 4, ax: -12, ay: 112, mOpen: 0, mCurve: 0.8, mWide: 0.4 },
  [
    // she explains: the robot eats sunlight
    [0.25, 0.12, { mOpen: 0.5 }], [0.42, 0.12, { mOpen: 0.1 }], [0.62, 0.12, { mOpen: 0.6 }], [0.84, 0.12, { mOpen: 0.15 }], [1.02, 0.12, { mOpen: 0.5 }], [1.26, 0.16, { mOpen: 0 }],
    [0.3, 0.3, { tilt: 0.08 }], [0.95, 0.3, { tilt: 0 }],
    [2.45, 0.4, { lookY: -0.4, mOpen: 0.45, mWide: 1, brow: 0.6 }],
    [3.7, 0.4, { lookY: 0.3, mOpen: 0, mCurve: 1, brow: 0.2 }],
    [HOP + 0.2, 0.4, { tilt: -0.18, lookY: -1, mOpen: 0.5, mWide: 0.2, brow: 1, wide: 0.6 }],
    [CATCH - 0.4, 0.5, { tilt: 0, lookY: 0.2 }],
    [CATCH + 0.45, 0.3, { happy: 1, mOpen: 0.7, mWide: 1, wide: 0 }],
    [12.6, 0.3, { happy: 0, mOpen: 0, brow: 0.2 }],
    // she follows them with four slow steps
    [13.3, 0.25, { fbx: 44, fby: 12, lean: 0.06 }], [14.1, 0.2, { fbx: 24, fby: 0 }],
    [14.4, 0.25, { fax: 6, fay: 12 }], [15.2, 0.2, { fax: -22, fay: 0 }],
    [15.5, 0.25, { fbx: 44, fby: 12 }], [16.3, 0.2, { fbx: 24, fby: 0 }],
    [16.6, 0.25, { fax: 6, fay: 12 }], [17.4, 0.2, { fax: -22, fay: 0, lean: 0 }],
    // the lamp comes down: the Sun does the rest
    [17.2, 0.9, { bx: 16, by: 116 }],
    [18.4, 0.5, { mCurve: 1, lookX: 0.9, lookY: 0.2 }],
    [BLINK3 + 0.5, 0.4, { mOpen: 0.4, mWide: 1, brow: 0.6, tilt: 0.08 }],
    [31.2, 0.5, { tilt: 0.12, happy: 1, mOpen: 0.3 }],
  ],
)
const laylaX = track({ x: -960 }, [
  [13.3, 0.9, { x: -838 }, 'soft'], [14.4, 0.9, { x: -700 }, 'soft'], [15.5, 0.9, { x: -604 }, 'soft'], [16.6, 0.9, { x: -500 }, 'soft'],
])
const laylaHop = (T: number) => [13.3, 14.4, 15.5, 16.6].reduce((a, t0) => a + hopArc(T, t0, 0.85, 24, 0.12).lift, 0)

type Cast = { sari: Pose; amir: Pose; layla: Pose; rover: Rover }

/** Eyes blink now and then, each child in their own rhythm (fixed times: the same on every run). */
const BLINKS = {
  sari: [0.7, 4.05, 6.1, 9.2, 12.9, 15.4, 19.6, 21.9, 23.6, 25.6, 29.2, 31.9, 33.2],
  amir: [1.5, 5.2, 8.7, 11.2, 14.1, 17.6, 20.4, 22.8, 24.9, 29.4, 33.0],
  layla: [1.9, 5.9, 9.9, 13.8, 19.0, 22.2, 26.1, 30.4, 33.8],
}
const blinkAt = (times: number[], T: number) => {
  for (const t of times) if (T >= t && T < t + 0.15) return 1 - Math.abs(((T - t) / 0.15) * 2 - 1) > 0.3 ? 1 : 0.5
  return 0
}

/** Everyone's pose at time T, before the bends of elbows and knees are smoothed (see `cast`). */
function castRaw(T: number): Cast {
  const r = rover(T)
  const sari = sariTrack(T)
  const amir = amirTrack(T)
  const layla = laylaTrack(T)
  sari.x = sariX(T).x
  amir.x = amirX(T).x
  layla.x = laylaX(T).x
  if (T >= B1 - 0.4 && T < DOWN + 0.5) {
    sari.x = r.x - 140
    amir.x = r.x + 140
  }
  const add = (p: Pose, h: { lift: number; crouch: number; sq: number }) => {
    p.lift += h.lift
    p.crouch = Math.min(1, p.crouch + h.crouch)
    p.sq *= h.sq
  }
  // Sari
  add(sari, hopArc(T, 2.25, 1.25, 58, 0.01))
  add(sari, hopArc(T, HOP, 0.9, 30, 0.01))
  add(sari, hopArc(T, B1, 1.5, 86, 0.3))
  add(sari, hopArc(T, B2, 1.5, 86, 0.22))
  add(sari, hopArc(T, B3, 1.0, 40, 0.2))
  add(sari, hopArc(T, 18.3, 0.9, 34, 0.12))
  add(sari, hopArc(T, 30.6, 0.8, 30, 0.01))
  // Amir: never quite in step with Sari
  add(amir, hopArc(T, HOP + 0.03, 1.0, 38, 0.01))
  add(amir, hopArc(T, 10.15, 0.8, 26, 0.2))
  add(amir, hopArc(T, B1 + 0.05, 1.5, 92, 0.3))
  add(amir, hopArc(T, B2 + 0.05, 1.5, 92, 0.22))
  add(amir, hopArc(T, B3 + 0.04, 1.0, 44, 0.2))
  add(amir, hopArc(T, 18.36, 0.9, 36, 0.12))
  add(amir, hopArc(T, LEAP, 2.1, 168, 0.01))
  layla.lift += laylaHop(T)

  sari.blink = Math.max(sari.blink, blinkAt(BLINKS.sari, T))
  amir.blink = Math.max(amir.blink, blinkAt(BLINKS.amir, T))
  layla.blink = Math.max(layla.blink, blinkAt(BLINKS.layla, T))

  // laughter: the shoulders shake
  const laugh = (t0: number, t1: number, f: number) => ramp(T, t0, t0 + 0.2) * (1 - ramp(T, t1 - 0.3, t1)) * Math.sin((T - t0) * f)
  sari.sq *= 1 + 0.03 * laugh(CATCH + 0.4, 12.5, 24)
  amir.sq *= 1 + 0.035 * laugh(CATCH + 0.5, 12.5, 21)
  sari.sq *= 1 + 0.03 * laugh(BLINK3 + 1.1, BLINK3 + 2.3, 24)
  amir.sq *= 1 + 0.03 * laugh(BLINK3 + 1.2, BLINK3 + 2.4, 21)

  // hands on the robot: Sari holds the back end, Amir the front
  const cr = Math.cos(r.rot)
  const sr = Math.sin(r.rot)
  const grip = (lx: number, ly: number) => ({ x: r.x + lx * cr - (ly + 40) * sr, y: r.y - r.lift - 40 + lx * sr + (ly + 40) * cr })
  const carried = T > CATCH - 0.4
  const sa = grip(-80, carried ? -30 : -70)
  const sb = grip(-70, carried ? -26 : -44)
  const aa = grip(72, carried ? -28 : -46)
  const ab = grip(82, carried ? -32 : -70)
  sari.awx = sa.x; sari.awy = sa.y; sari.bwx = sb.x; sari.bwy = sb.y
  amir.awx = aa.x; amir.awy = aa.y; amir.bwx = ab.x; amir.bwy = ab.y
  if (T < 1.6) {
    // Sari's first touch: a hand on the dusty wing
    sari.bwx = r.x - 64
    sari.bwy = r.y - 96
  }

  // things that hang swing only because the body moved (sampled a moment ago), then stop dead
  const d = 0.09
  sari.swing = clamp01(Math.abs(sariTrack(T - d).lean - sari.lean) * 3) * Math.sign(sariTrack(T - d).lean - sari.lean) * 0.5 + (sariX(T - d).x - sari.x) * 0.004
  layla.swing = (laylaX(T - 0.15).x - layla.x) * 0.012
  return { sari, amir, layla, rover: r }
}

const NEAR = [-0.1, -0.05, 0, 0.05, 0.1]
/**
 * Everyone's pose at time T. Each elbow and knee takes the bend the rig would choose, averaged over a fifth of a
 * second around T: when a moving arm makes the choice switch sides, the joint glides across instead of flipping.
 */
function cast(T: number): Cast {
  const c = castRaw(T)
  const near = NEAR.map((d) => (d === 0 ? c : castRaw(T + d)))
  for (const who of ['sari', 'amir', 'layla'] as const) {
    const sum = [0, 0, 0, 0]
    for (const n of near) skeleton(who, n[who]).choice.forEach((v, i) => (sum[i] += v / near.length))
    const p = c[who]
    p.bendA = sum[0]
    p.bendB = sum[1]
    p.kneeA = sum[2]
    p.kneeB = sum[3]
  }
  return c
}

// ── light ─────────────────────────────────────────────────────────────────────
/** The lamp's circle of light in the night (centre and radii), or null once the lamp is lowered. */
function lampPool(T: number, c: Cast): { x: number; y: number; rx: number; ry: number } {
  const follow = lerp(-640, rover(T - 0.3).x, ramp(T, B1 - 0.3, B1 + 0.6))
  const low = E.io(ramp(T, 17.2, 18.4))
  return { x: lerp(follow, c.layla.x + 56, low), y: lerp(676, 786, low), rx: lerp(350, 104, low), ry: lerp(312, 38, low) }
}

// ── cameras ───────────────────────────────────────────────────────────────────
function camera(T: number): Cam {
  const k = SHOTS.filter((s) => T >= s).length
  const u = (a: number, b: number) => E.soft(ramp(T, a, b))
  switch (k) {
    case 1:
      return { x: lerp(-520, -600, u(0, 5)), y: lerp(545, 572, u(0, 5)), zoom: lerp(1.05, 1.3, u(0, 5)) }
    case 2:
      return { x: -640, y: 612, zoom: 1.62 }
    case 3: {
      // a lower, closer angle; the camera tilts up after him and comes back down with him
      const up = u(8.4, 9.6) * (1 - u(10.1, 11.5))
      return { x: -650, y: lerp(lerp(560, 592, u(8.4, 13.4)), 452, up), zoom: 1.42 }
    }
    case 4:
      return { x: lerp(-470, 120, u(13.4, 18.3)), y: 560, zoom: 1.22 }
    case 5:
      return { x: lerp(116, 120, u(18.8, 23.8)), y: lerp(676, 668, u(18.8, 23.8)), zoom: lerp(3.9, 4.3, u(18.8, 23.8)) }
    case 6:
      return { x: 186, y: 688, zoom: lerp(5.4, 5.7, u(23.8, 26.2)) }
    case 7:
      return { x: 112, y: 660, zoom: lerp(2.12, 2.22, u(26.2, 29.6)) }
    default:
      return { x: lerp(56, 84, u(29.6, 34.6)), y: lerp(545, 584, u(29.6, 34.6)), zoom: lerp(1.2, 1.42, u(29.6, 34.6)) }
  }
}

// ── dust and prints, derived from the same beats ──────────────────────────────
const BURSTS: Burst[] = [
  { t: 2.25, x: -775, y: SY, seed: 11, n: 9, power: 110 },
  { t: 3.5, x: -775, y: SY, seed: 12, n: 9, power: 90 },
  { t: HOP, x: -640, y: WY - 70, seed: 13, n: 14, power: 150, spread: 2.6 },
  { t: HOP + 0.9, x: -768, y: SY, seed: 14, n: 7, power: 80 },
  { t: HOP + 1.03, x: -512, y: AY, seed: 15, n: 7, power: 80 },
  { t: CATCH + 0.05, x: -640, y: WY - 150, seed: 16, n: 8, power: 70, spread: 3 },
  { t: B1, x: -768, y: SY, seed: 21, n: 10, dir: -1 }, { t: B1 + 0.05, x: -512, y: AY, seed: 22, n: 10, dir: -1 },
  { t: B1 + 1.5, x: -528, y: SY, seed: 23, n: 11, dir: 1 }, { t: B1 + 1.55, x: -272, y: AY, seed: 24, n: 11, dir: 1 },
  { t: B2, x: -520, y: SY, seed: 25, n: 9, dir: -1 }, { t: B2 + 0.05, x: -264, y: AY, seed: 26, n: 9, dir: -1 },
  { t: B2 + 1.5, x: -258, y: SY, seed: 27, n: 11, dir: 1 }, { t: B2 + 1.55, x: -2, y: AY, seed: 28, n: 12, dir: 1 },
  { t: B3, x: -250, y: SY, seed: 29, n: 8, dir: -1 }, { t: B3 + 0.04, x: 6, y: AY, seed: 30, n: 9, dir: -1 },
  { t: B3 + 1.0, x: -44, y: SY, seed: 31, n: 9, dir: 1 }, { t: B3 + 1.04, x: 212, y: AY, seed: 32, n: 10, dir: 1 },
  { t: DOWN + 0.42, x: WX, y: WY, seed: 33, n: 10, power: 70, spread: 3 },
  { t: 19.2, x: -250, y: SY, seed: 34, n: 6, power: 70 }, { t: 19.26, x: 480, y: AY, seed: 35, n: 7, power: 70 },
  { t: WING, x: WX - 50, y: WY - 96, seed: 40, n: 6, power: 60, spread: 2.4 },
  { t: WING + 0.4, x: WX - 80, y: WY - 100, seed: 41, n: 10, power: 95, spread: 2.6 },
  ...[1, 2, 3, 4, 5, 6].map((i): Burst => {
    const tip = petalTip({ ...roverRest, x: WX, y: WY }, i)
    return { t: PETAL(i) + 0.12, x: tip.x, y: tip.y, seed: 50 + i, n: 7, power: 85, spread: 1.7, dir: 0.5 - i * 0.2 }
  }),
  { t: 30.6, x: -250, y: SY, seed: 60, n: 7, power: 80 }, { t: 31.4, x: -46, y: SY, seed: 61, n: 8, power: 80 },
  { t: LEAP, x: 480, y: AY, seed: 62, n: 13, power: 150 }, { t: LEAP + 2.1, x: 372, y: AY, seed: 63, n: 13, power: 120 },
]
const PRINTS: Print[] = [
  { t: B2 + 1.56, x: -14, y: AY, who: 'amir' }, { t: B2 + 1.56, x: 20, y: AY + 3, who: 'amir' },
  { t: B3 + 1.05, x: 220, y: AY, who: 'amir' }, { t: B3 + 1.05, x: 256, y: AY + 3, who: 'amir' },
  { t: DOWN + 0.2, x: 250, y: AY + 2, who: 'amir' }, { t: DOWN + 0.2, x: 284, y: AY - 2, who: 'amir' },
  { t: 19.28, x: 460, y: AY, who: 'amir' }, { t: 19.28, x: 502, y: AY + 3, who: 'amir' },
  { t: LEAP + 2.14, x: 351, y: AY + 2, who: 'amir' }, { t: LEAP + 2.14, x: 393, y: AY - 1, who: 'amir' },
]

// ── the frame ─────────────────────────────────────────────────────────────────
export function renderScene8(P: Painter, T: number) {
  const all = cast(T)
  const { sari, amir, layla, rover: r } = all
  const cam = camera(T)
  P.cam = cam

  drawSky(P)
  // the Earth hangs in one place, upper left, over the dark side; only the lens makes it larger
  P.screen()
  const shot = SHOTS.filter((s) => T >= s).length
  if (shot !== 2 && cam.zoom < 2) drawEarth(P, shot === 8 ? 480 : 372, (shot === 8 ? 124 : 168) - (cam.y - 545) * 0.5, 54 * Math.sqrt(cam.zoom), T + 40)

  P.world()
  const x0 = cam.x - STAGE_W / 2 / cam.zoom - 60
  const x1 = cam.x + STAGE_W / 2 / cam.zoom + 60
  const lamp = lampPool(T, all)
  const eye = roverEye(r)
  const eyeR = clamp01(r.glow)

  // which lights a thing standing at x (half-width w, from y0 down to y1) can be touched by
  const inDay = (x: number, w: number, y0: number, y1: number) => x + w > Math.min(lineX(LINE, y0), lineX(LINE, y1))
  const inNight = (x: number, w: number, y0: number, y1: number) => x - w < Math.max(lineX(LINE, y0), lineX(LINE, y1))

  const people: [Who, Pose, number][] = [['layla', layla, 480], ['sari', sari, 340], ['amir', amir, 340]]
  const drawOne = (who: Who, p: Pose, pass: 'all' | 'body' | 'arms') => {
    const glow = who === 'layla' ? 0 : eyeR * (who === 'sari' ? 1 : 0.6) * clamp01(1.5 - Math.hypot(p.x - eye.x, 0) / 500)
    drawPerson(P, who, p, { pass, basket: who === 'layla', lamp: who === 'layla', lampAim: lamp, glow: P.light === 'night' ? 0 : glow })
  }
  // warm pools inside the night: [centre x, y, radius x, y]
  const lampPoolE: [number, number, number, number] = [lamp.x, lamp.y, lamp.rx, lamp.ry]
  const reach = (T < SHOTS[7] ? 1 : 0.3) * Math.sqrt(eyeR)
  const glowE: [number, number, number, number] = [eye.x - 40, eye.y + (T < SHOTS[7] ? -50 : 34), 540 * reach, (T < SHOTS[7] ? 300 : 330) * reach]
  const touches = (e: number[], x: number, w: number, y0: number, y1: number) => {
    const dx = Math.max(x - w - e[0], 0, e[0] - (x + w)) / e[2]
    const dy = Math.max(y0 - e[1], 0, e[1] - y1) / e[3]
    return dx * dx + dy * dy < 1
  }
  const within = (e: number[], x: number, w: number, y0: number, y1: number) => {
    const dx = Math.max(Math.abs(x - w - e[0]), Math.abs(x + w - e[0])) / e[2]
    const dy = Math.max(Math.abs(y0 - e[1]), Math.abs(y1 - e[1])) / e[3]
    return dx * dx + dy * dy < 1
  }
  const figures = (light: Light) => {
    const ok = (x: number, w: number, y0: number, y1: number) => {
      if (light === 'day') return inDay(x, w, y0, y1)
      if (!inNight(x, w, y0, y1)) return false
      if (light === 'lamp') return touches(lampPoolE, x, w, y0, y1)
      if (light === 'glow') return touches(glowE, x, w, y0, y1)
      // plain night: not needed where a warm pool covers the whole figure
      return !within(lampPoolE, x, w, y0, y1) && !(eyeR > 0.02 && within(glowE, x, w, y0, y1))
    }
    for (const [who, p, h] of people) {
      if (who === 'amir') continue
      if (!ok(p.x, 130, p.y - p.lift - h, p.y + 8)) continue
      drawOne(who, p, who === 'sari' ? 'body' : 'all')
    }
    if (ok(r.x, 150, r.y - r.lift - 240, r.y + 8)) drawRover(P, r)
    if (ok(sari.x, 130, sari.y - sari.lift - 340, sari.y + 8)) drawOne('sari', sari, 'arms')
    if (ok(amir.x, 130, amir.y - amir.lift - 340, amir.y + 8)) drawOne('amir', amir, 'all')
  }
  const set = () => {
    drawGround(P, GROUND, x0, x1)
    drawPrints(P, PRINTS, T)
    drawRock(P, -806, 770, 74, 66, -8)
    drawRock(P, -486, 764, 44, 38, 6)
  }
  const front = () => {
    drawRock(P, -712, 846, 30, 20, 0)
    drawBursts(P, BURSTS, T)
  }

  // daylight: ground, long shadows to the left, then everyone
  if (x1 > lineX(LINE, 1200)) {
    P.clip(DAY, () => {
      P.light = 'day'
      set()
      for (const [who, p, h] of people) {
        if (!inDay(p.x, 170, p.y - p.lift - h, p.y)) continue
        P.shadow(p.x, p.y, () => drawPerson(P, who, { ...p, x: 0, y: 0, lift: 0 }, { basket: who === 'layla' }), p.lift)
      }
      if (inDay(r.x, 190, r.y - r.lift - 240, r.y)) P.shadow(r.x, r.y, () => drawRover(P, { ...r, x: 0, y: 0, lift: 0 }), r.lift)
      figures('day')
      front()
    })
  }
  // night: flat navy, a thin gold rim on the sunward edge
  if (x0 < lineX(LINE, 300)) {
    P.clip(NIGHT, () => {
      P.light = 'night'
      set()
      figures('night')
      front()
      // …and inside it, the two warm lights: the lamp's circle, then Wameed's eye
      P.light = 'lamp'
      P.clip(ellipse(lamp.x, lamp.y, lamp.rx, lamp.ry), () => {
        set()
        figures('lamp')
        front()
      })
      if (eyeR > 0.02) {
        // his first light blooms wide, then (after the cut) settles to a small steady pool
        P.light = 'glow'
        P.clip(ellipse(glowE[0], glowE[1], glowE[2], glowE[3]), () => {
          set()
          figures('glow')
          front()
        })
      }
    })
  }
  P.light = 'day'
  P.world()
  drawEyeHalo(P, r)
  paperGrain(P)
}

// ── the words on screen ───────────────────────────────────────────────────────
/** Words on screen at one moment: how visible the line is, and each of its words (0…1), all from the time alone. */
export type Caption = { id: string; words: string[]; alpha: number; alphas: number[] }

const scene = moon.scenes[7]
/** The count, taken verbatim from the scene's own text: «واحد.. اثنان.. ثلاثة.. هوب!» */
const COUNT = (scene.ar[2].match(/"([^"]+)"/)?.[1] ?? '').split(' ')
/** The narrator's cue line, in its two sentences. */
const CUE = (scene.cue.ar.match(/[^!]+!?/g) ?? [scene.cue.ar]).map((s) => s.trim())
const COUNT_AT = [5.5, 6.35, 7.2, HOP - 0.05]
const CUE_AT = [BLINK3 + 1.3, 32.7]

const FADE = 0.3

export function captionAt(T: number): Caption | null {
  if (T >= COUNT_AT[0] - 0.1 && T < 8.9) return { id: 'count', words: COUNT, alpha: ramp(T, COUNT_AT[0] - 0.1, COUNT_AT[0] + 0.15) * (1 - ramp(T, 8.6, 8.9)), alphas: COUNT_AT.map((t) => ramp(T, t, t + FADE)) }
  if (T >= CUE_AT[0] - 0.1) return { id: 'cue', words: CUE, alpha: ramp(T, CUE_AT[0] - 0.1, CUE_AT[0] + 0.25), alphas: CUE_AT.map((t) => ramp(T, t, t + FADE)) }
  return null
}

// ── QA ────────────────────────────────────────────────────────────────────────
/**
 * Steps through the whole scene at `fps` and lists every moment a joint jumps further in one frame than anything
 * should (a pop the eye would read as a glitch: an elbow flipping sides, a position that is not continuous).
 */
export function auditMotion(fps = 30, limit = 30) {
  const out: { t: number; joint: string; jump: number }[] = []
  let prev: Record<string, { x: number; y: number }> | null = null
  for (let i = 0; i <= DURATION * fps; i++) {
    const T = i / fps
    const c = cast(T)
    const now: Record<string, { x: number; y: number }> = { rover: { x: c.rover.x, y: c.rover.y - c.rover.lift }, 'rover.eye': roverEye(c.rover) }
    for (const who of ['sari', 'amir', 'layla'] as const) {
      const s = skeleton(who, c[who])
      for (const j of ['head', 'elA', 'elB', 'haA', 'haB', 'knA', 'knB', 'ftA', 'ftB'] as const) now[`${who}.${j}`] = s.world(s[j])
    }
    if (prev) {
      for (const k in now) {
        const d = Math.hypot(now[k].x - prev[k].x, now[k].y - prev[k].y)
        if (d > limit) out.push({ t: +T.toFixed(3), joint: k, jump: Math.round(d) })
      }
    }
    prev = now
  }
  return out
}
