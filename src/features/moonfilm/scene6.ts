/**
 * Scene 6 — «خطوة.. ليل!» — the line between day and night: five shots, about 25 seconds.
 *
 *  1  0.0  very wide               "where is its other half?" — Sari shrugs at the whole Moon; Amir points at the dark
 *  2  3.6  side-on tracking shot   three long bounds right-to-left, their shadows racing ahead of them, to a teetering stop
 *  3 10.2  extreme wide (picture)  the ground cut in two; two small boys at the line: from here day, from there night
 *  4 13.6  medium, at the line     the game: foot in — night! foot out — day! Amir crouches to watch the colours flip
 *  5 19.4  wide                    both hop to and fro across it; Sari lands, throws his arms up: found it!
 *
 * Night is to the left, so the walk to the line goes right-to-left (forward in an Arabic book).
 */
import { moon } from '@/content/stories/moon'
import { E, Painter, lerp, paperGrain, ramp, track, type Cam } from './kit/core'
import { A3, A4, A5, D3, D4, D5, D6, E4, F3, Fs3, Fs4, Fs5, bell, mallet, pad, thud } from './kit/notes'
import { drawPerson, rest, type Pose } from './kit/people'
import { addHops, blinkAt, cuePhrases, frameRange, jointsOf, laugh, litWorld, personShadow, phraseCaption, smoothBends, type Note, type SceneDef } from './kit/stage'
import { drawBursts, drawEarth, drawGround, drawPrints, drawRocket, drawSky, type Burst, type Ground, type Print, type Terminator } from './kit/world'

const DURATION = 25.6
const SHOTS = [0, 3.6, 10.2, 13.6, 19.4]

// ── the set ───────────────────────────────────────────────────────────────────
const LINE: Terminator = { x: 0, y: 1000, slope: 0.5 }
const SY = 985
const AY = 1030
const LY = 972
const GROUND: Ground = {
  horizon: 870,
  cx: 700,
  curve: 9000,
  hills: [[-640, 240, 40], [-60, 130, 24], [760, 250, 44], [1240, 120, 22], [1700, 200, 34], [2300, 260, 40], [2800, 160, 26]],
  craters: [[-520, 1010, 86], [-300, 918, 48], [560, 925, 60], [980, 1090, 100], [1420, 940, 56], [330, 1130, 70], [1900, 1100, 90], [2300, 960, 60], [2700, 1050, 80]],
  pebbles: [[-200, 1080, 7], [420, 1060, 6], [760, 960, 6], [1150, 1000, 7], [1500, 1090, 8], [220, 950, 5], [1800, 980, 6], [2150, 1060, 7], [2500, 990, 6]],
}

// ── beats ─────────────────────────────────────────────────────────────────────
const T1 = 4.0 // three bounds toward the dark: take-off times (1.6 s in the air each)
const T2 = 5.85
const T3 = 7.7
const STOP = T3 + 1.6
const IN1 = 14.45 // the foot goes in… and out
const OUT1 = 15.75
const IN2 = 16.8
const OUT2 = 17.8
const S_OVER = 19.8 // Sari hops into the night, and back
const S_BACK = 21.5
const A_OVER = 20.45
const A_BACK = 22.3
const FOUND = 23.3

const HERE = 44 // where Sari stops, a step from the line
const GAP = 240 // Amir runs this far behind him
/** Sari's place along the ground on the run to the line (Amir is the same curve a moment later and behind). */
function runX(t: number): number {
  if (t < T1) return 1400
  if (t < T1 + 1.6) return lerp(1400, 970, (t - T1) / 1.6)
  if (t < T2) return lerp(970, 960, (t - T1 - 1.6) / 0.25)
  if (t < T2 + 1.6) return lerp(960, 530, (t - T2) / 1.6)
  if (t < T3) return lerp(530, 520, (t - T2 - 1.6) / 0.25)
  if (t < STOP) return lerp(520, 58, (t - T3) / 1.6)
  return lerp(58, HERE, E.out(ramp(t, STOP, STOP + 0.4)))
}
const sariX = (t: number) => (t < S_OVER ? runX(t) : t < S_BACK ? lerp(HERE, -170, ramp(t, S_OVER, S_OVER + 1.0)) : lerp(-170, HERE, ramp(t, S_BACK, S_BACK + 1.0)))
const amirX = (t: number) => (t < A_OVER ? runX(t - 0.12) + GAP : t < A_BACK ? lerp(HERE + GAP, -60, ramp(t, A_OVER, A_OVER + 1.1)) : lerp(-60, HERE + GAP, ramp(t, A_BACK, A_BACK + 1.1)))
const LHOPS = [4.3, 5.6, 6.9, 8.2, 9.5]
const laylaX = (t: number) => 1900 - LHOPS.reduce((a, h) => a + 216 * E.soft(ramp(t, h, h + 1.0)), 0)

const FEET = { fax: -24, fay: 0, fbx: 24, fby: 0 }
const STRIDE = { fax: -54, fay: 34, fbx: 64, fby: 30 } // bounding to the left
const REACH = { fax: -58, fay: 10, fbx: 30, fby: 4 }
const HANG = { ax: -9, ay: 70, bx: 9, by: 70 }

const bound = (T: number, more: Partial<Pose> = {}): [number, number, Partial<Pose>, 'out' | 'soft' | 'io'][] => [
  [T, 0.3, { ...STRIDE, lean: -0.34, rot: -0.1, ax: -46, ay: -12, bx: 52, by: 8, ...more }, 'out'],
  [T + 0.85, 0.5, { ...REACH, rot: 0.06, ax: -30, ay: 38, bx: 30, by: 40 }, 'soft'],
  [T + 1.5, 0.14, { ...FEET, rot: 0 }, 'io'],
]

const sariTrack = track<Pose>({ ...rest('sari', 1400, SY), turn: 0 }, [
  // 1 ─ the whole Moon under his feet… so where is the other half?
  [0.3, 0.4, { lookY: 1, tilt: 0.1, turn: -0.1 }],
  [1.0, 0.35, { lookY: 0, tilt: 0, turn: 0.6, lookX: 0.8, brow: 0.8 }],
  [1.55, 0.35, { turn: -0.6, lookX: -0.8 }],
  [2.0, 0.4, { turn: 0.1, lookX: 0, ax: -52, ay: 4, bx: 52, by: 4, mOpen: 0.5, mWide: 0.3, brow: 1 }, 'back'],
  [2.9, 0.35, { turn: -0.8, lookX: -1, wide: 0.8, ...HANG, mOpen: 0.7, mWide: 1, mCurve: 1, toe: -1 }],
  // 2 ─ three bounds
  ...bound(T1, { mOpen: 0.9 }),
  ...bound(T2),
  ...bound(T3),
  // the line! — a teetering stop
  [STOP, 0.2, { lean: -0.3, ax: -58, ay: -20, bx: 56, by: -26, wide: 1, mOpen: 0.6, mWide: 0.2, crouch: 0.2, brow: 1 }, 'out'],
  [STOP + 0.3, 0.3, { lean: 0.14, ax: -40, ay: -50, bx: 50, by: 10 }],
  [STOP + 0.7, 0.36, { lean: 0, ...HANG, crouch: 0, wide: 0.3 }, 'back'],
  // 3 ─ from here day… from there night
  [10.6, 0.4, { bx: 62, by: -6, bPoint: 1, turn: 0.5, lookX: 0.8, mOpen: 0.5 }, 'back'],
  [11.6, 0.5, { bPoint: 0, bx: 9, by: 70, ax: -64, ay: -4, aPoint: 1, turn: -0.7, lookX: -1 }],
  [12.8, 0.4, { aPoint: 0, ax: -9, ay: 70, lookY: 0.8, mOpen: 0.2 }],
  // 4 ─ the game
  [13.9, 0.3, { lookY: 1, tilt: 0.08, lean: 0.1, hipx: 8, ax: -40, ay: 30, bx: 54, by: 8, fax: -50, fay: 26 }],
  [IN1, 0.16, { fax: -84, fay: 3, crouch: 0.46, hipx: -6, mOpen: 0.9, mWide: 1, mCurve: 1, brow: 0.8 }, 'out'],
  [15.2, 0.26, { fax: -56, fay: 26, crouch: 0, hipx: 8 }],
  [OUT1, 0.16, { fax: -24, fay: 0 }, 'out'],
  [OUT1 + 0.05, 0.22, { lookY: 0, turn: 0.5, lookX: 0.8, happy: 1 }],
  [16.4, 0.2, { fax: -50, fay: 24, happy: 0, lookY: 1, turn: -0.6, lookX: -0.6 }],
  [IN2, 0.14, { fax: -84, fay: 3, crouch: 0.46, hipx: -6 }, 'out'],
  [17.4, 0.2, { fax: -56, fay: 24, crouch: 0, hipx: 8 }],
  [OUT2, 0.14, { fax: -24, fay: 0, hipx: 0, lean: 0 }, 'out'],
  [18.3, 0.34, { turn: 0.6, lookX: 1, lookY: 0, tilt: 0, mOpen: 1, happy: 1, ax: -40, ay: -50, bx: 44, by: -54 }, 'back'],
  // 5 ─ over into the night, and back
  [S_OVER, 0.3, { happy: 0, turn: -0.6, lookX: -0.8, fax: -40, fay: 20, fbx: 40, fby: 16, ax: -54, ay: -12, bx: 54, by: -16, mOpen: 0.8 }, 'out'],
  [S_OVER + 0.86, 0.14, FEET],
  [S_OVER + 1.1, 0.35, { turn: 0.7, lookX: 1, toe: 1, ax: -9, ay: 70, bx: 46, by: -40 }],
  [S_BACK, 0.3, { fax: -40, fay: 20, fbx: 40, fby: 16, ax: -54, ay: -12, bx: 54, by: -16 }, 'out'],
  [S_BACK + 0.86, 0.14, FEET],
  // back in the daylight, one leg over the line
  [22.7, 0.36, { hipx: -6, lean: 0.14, turn: -0.75, toe: -1, tilt: 0.08, lookX: -0.8, lookY: 1, fax: -84, fay: 3, fbx: 30, crouch: 0.46, ax: -40, ay: 30, bx: 56, by: 6 }],
  // found it!
  [FOUND, 0.4, { ax: -56, ay: -48, bx: 56, by: -52, lookY: -0.2, lookX: 0, turn: 0.2, tilt: -0.1, mOpen: 1, mWide: 1, mCurve: 1, happy: 1 }, 'back'],
  [24.3, 0.4, { ax: -66, ay: -6, aPoint: 1, turn: -0.6, happy: 0, lookX: -1, tilt: 0 }, 'back'],
])

const amirTrack = track<Pose>({ ...rest('amir', 1400 + GAP, AY), turn: -0.5, toe: -1 }, [
  // 1 ─ a hand over his eyes… there!
  [0.4, 0.4, { ax: -30, ay: -58, turn: -0.7, lookX: -1 }],
  [1.9, 0.36, { ax: -68, ay: -12, aPoint: 1, mOpen: 0.6, mWide: 0.8, brow: 0.8 }, 'back'],
  [2.5, 0.2, { tilt: 0.1 }],
  [2.7, 0.24, { tilt: 0 }, 'back'],
  [3.2, 0.3, { aPoint: 0, ...HANG }],
  // 2
  ...bound(T1 + 0.12, { fby: 38, bx: 46, by: -4 }),
  ...bound(T2 + 0.12, { fby: 38, bx: 46, by: -4, mOpen: 0.8, mWide: 1 }),
  ...bound(T3 + 0.12, { fby: 38, bx: 46, by: -4 }),
  [STOP + 0.14, 0.25, { lean: -0.2, crouch: 0.2, ax: -50, ay: -10, bx: 50, by: -10, wide: 0.8 }, 'out'],
  [STOP + 0.5, 0.4, { lean: 0, crouch: 0, ...HANG }, 'back'],
  // 3
  [10.8, 0.5, { wide: 0.6, mOpen: 0.4, mWide: 0.2, lookX: -1, turn: -0.75 }],
  // 4 ─ he crouches to watch the foot change colour
  [13.8, 0.4, { crouch: 0.5, lean: -0.3, lookY: 1, ax: -10, ay: 56, bx: 10, by: 56 }],
  [IN1 + 0.05, 0.25, { wide: 1, brow: 1, mOpen: 0.8, mWide: 0.3 }, 'back'],
  [OUT1 + 0.05, 0.3, { happy: 1, mOpen: 1, mWide: 1, mCurve: 1, lookY: 0.3, wide: 0 }],
  [16.5, 0.3, { happy: 0, lookY: 1, ax: -58, ay: 22, aPoint: 1 }],
  [OUT2 + 0.1, 0.34, { aPoint: 0, crouch: 0, lean: 0, ...HANG, mOpen: 0.8, happy: 1, lookY: 0 }, 'back'],
  // 5
  [A_OVER, 0.3, { happy: 0, wide: 0.4, fax: -44, fay: 16, fbx: 36, fby: 22, ax: -56, ay: -18, bx: 56, by: -10, mOpen: 0.9 }, 'out'],
  [A_OVER + 0.96, 0.14, FEET],
  [A_OVER + 1.2, 0.3, { turn: 0.6, lookX: 1, toe: 1, ...HANG, wide: 0 }],
  [A_BACK, 0.3, { fax: -36, fay: 22, fbx: 44, fby: 16, ax: -56, ay: -10, bx: 56, by: -18 }, 'out'],
  [A_BACK + 0.96, 0.14, FEET],
  [A_BACK + 1.2, 0.3, { turn: -0.5, lookX: -1, lookY: 0.6, toe: -1, ...HANG }],
  // one more happy hop while Sari shouts
  [24.2, 0.3, { tilt: -0.08, rot: 0.08, ax: -62, ay: -8, bx: 62, by: -16, fax: -36, fay: 22, fbx: 32, fby: 8, happy: 1, mOpen: 0.9 }, 'out'],
])

const laylaTrack = track<Pose>({ ...rest('layla', 1900, LY), turn: -0.55, toe: -1, lookX: -1, lookY: 0.2, mOpen: 0.2, mWide: 1, mCurve: 1, bx: 12, by: 116, ax: -12, ay: 112 }, [
  ...LHOPS.flatMap((h, i): [number, number, Partial<Pose>][] => (i % 2 ? [[h, 0.25, { fax: -52, fay: 12 }], [h + 0.8, 0.2, { fax: -22, fay: 0 }]] : [[h, 0.25, { fbx: -4, fby: 12 }], [h + 0.8, 0.2, { fbx: 24, fby: 0 }]])),
  [20.2, 0.5, { ax: -56, ay: 4, mOpen: 0.5, happy: 1 }, 'back'],
  [22.0, 0.5, { ax: -12, ay: 112 }],
])

type Cast = { sari: Pose; amir: Pose; layla: Pose }
const BLINKS = { sari: [0.8, 3.3, 9.9, 12.4, 18.9, 22.3], amir: [1.2, 3.4, 10.4, 13.2, 19.6, 23.6], layla: [2.2, 7.4, 11.8, 16.0, 21.4] }

function castRaw(t: number): Cast {
  const sari = sariTrack(t)
  const amir = amirTrack(t)
  const layla = laylaTrack(t)
  sari.x = sariX(t)
  amir.x = amirX(t)
  layla.x = laylaX(t)
  addHops(sari, t, [[T1, 1.6, 96], [T2, 1.6, 96, 0.22], [T3, 1.6, 96, 0.22], [S_OVER, 1.0, 44, 0.2], [S_BACK, 1.0, 44, 0.2]])
  addHops(amir, t, [[T1 + 0.12, 1.6, 104], [T2 + 0.12, 1.6, 104, 0.22], [T3 + 0.12, 1.6, 104, 0.22], [A_OVER, 1.1, 54, 0.2], [A_BACK, 1.1, 54, 0.2], [24.2, 1.3, 78, 0.2]])
  addHops(layla, t, LHOPS.map((h) => [h, 1.0, 30, 0.14]), 0.3)
  sari.sq *= laugh(t, OUT1 + 0.1, 16.4) * laugh(t, FOUND + 0.2, 24.3)
  amir.sq *= laugh(t, OUT1 + 0.2, 16.5, 21) * laugh(t, OUT2 + 0.2, 19.4, 21)
  sari.blink = Math.max(sari.blink, blinkAt(BLINKS.sari, t))
  amir.blink = Math.max(amir.blink, blinkAt(BLINKS.amir, t))
  layla.blink = Math.max(layla.blink, blinkAt(BLINKS.layla, t))
  sari.swing = (sariX(t - 0.1) - sari.x) * 0.004
  layla.swing = (laylaX(t - 0.15) - layla.x) * 0.012
  return { sari, amir, layla }
}
const cast = (t: number) => smoothBends(castRaw, t)

function camera(t: number): Cam {
  const k = SHOTS.filter((s) => t >= s).length
  const u = (a: number, b: number) => E.soft(ramp(t, a, b))
  switch (k) {
    case 1:
      // starts on the two friends, then pulls back and left as Amir points: the far darkness comes into frame
      return { x: lerp(1520, 1010, u(1.5, 3.4)), y: lerp(770, 640, u(1.5, 3.4)), zoom: lerp(1.12, 0.6, u(1.5, 3.4)) }
    case 2:
      // tracks right-to-left with the boys' bounds and stops when the line reaches its place
      return { x: lerp(1260, 330, u(3.6, 9.7)), y: 716, zoom: 1 }
    case 3:
      return { x: 480, y: 664, zoom: lerp(0.72, 0.75, u(10.2, 13.6)) }
    case 4:
      return { x: lerp(150, 130, u(13.6, 19.4)), y: 792, zoom: lerp(1.46, 1.56, u(13.6, 19.4)) }
    default:
      return { x: lerp(340, 300, u(19.4, 25.6)), y: 692, zoom: lerp(0.9, 0.96, u(19.4, 25.6)) }
  }
}

const land = (t: number, x: number, y: number, seed: number, dir = -1, n = 10): Burst => ({ t, x, y, seed, n, dir, power: 120 })
const BURSTS: Burst[] = [
  land(T1, 1400, SY, 601, 1, 8), land(T1 + 0.12, 1400 + GAP, AY, 602, 1, 8),
  land(T1 + 1.6, 970, SY, 603), land(T1 + 1.72, 970 + GAP, AY, 604),
  land(T2 + 1.6, 530, SY, 605), land(T2 + 1.72, 530 + GAP, AY, 606),
  land(STOP, 58, SY, 607, -1, 14), land(STOP + 0.12, 58 + GAP, AY, 608, -1, 12),
  land(S_OVER + 1.0, -170, SY, 609, 0, 9), land(S_BACK + 1.0, HERE, SY, 610, 0, 9),
  land(A_OVER + 1.1, -60, AY, 611, 0, 9), land(A_BACK + 1.1, HERE + GAP, AY, 612, 0, 9),
]
const pair = (t: number, x: number, y: number, who: 'sari' | 'amir' | 'layla'): Print[] => [{ t, x: x - 20, y: y + 2, who }, { t, x: x + 20, y: y - 2, who }]
const PRINTS: Print[] = [
  // the way they came, from the rocket
  ...Array.from({ length: 22 }, (_, i): Print => ({ t: 0, x: 2240 - i * 34 + (i % 2) * 14, y: 902 + Math.pow(i / 21, 1.5) * 96 + (i % 2) * 8, who: i % 3 === 2 ? 'layla' : i % 3 ? 'amir' : 'sari' })),
  ...pair(0, 1400, SY, 'sari'), ...pair(0, 1400 + GAP, AY, 'amir'), ...pair(0, 1900, LY, 'layla'),
  ...pair(T1 + 1.62, 970, SY, 'sari'), ...pair(T1 + 1.74, 970 + GAP, AY, 'amir'),
  ...pair(T2 + 1.62, 530, SY, 'sari'), ...pair(T2 + 1.74, 530 + GAP, AY, 'amir'),
  ...pair(STOP + 0.4, HERE, SY, 'sari'), ...pair(STOP + 0.5, HERE + GAP, AY, 'amir'),
  ...LHOPS.flatMap((h, i) => pair(h + 1.0, 1900 - 216 * (i + 1), LY, 'layla')),
  ...pair(A_BACK + 1.12, HERE + GAP, AY, 'amir'),
]

function render(P: Painter, t: number) {
  const { sari, amir, layla } = cast(t)
  P.cam = camera(t)
  drawSky(P)
  P.screen()
  if (P.cam.zoom < 1.2) drawEarth(P, 300, 190, 56, t + 26)
  P.world()
  const [x0, x1] = frameRange(P)
  const far = (fn: () => void) => {
    // the rocket they came from, tiny on the right horizon
    if (x1 > 2100) fn()
  }
  litWorld(P, {
    x0,
    x1,
    line: LINE,
    set: () => {
      drawGround(P, GROUND, x0, x1)
      drawPrints(P, PRINTS, t)
    },
    shadows: (ok) => {
      far(() => P.shadow(2290, 892, () => drawRocket(P, 0, 0, 0.15), 0, 3.4, 0.13))
      if (ok(layla.x, 130, layla.y - 480, layla.y)) personShadow(P, 'layla', layla, { basket: true, basketOn: 'b' })
      if (ok(sari.x, 130, sari.y - sari.lift - 340, sari.y)) personShadow(P, 'sari', sari)
      if (ok(amir.x, 130, amir.y - amir.lift - 340, amir.y)) personShadow(P, 'amir', amir)
    },
    figures: (ok) => {
      if (P.light === 'day') far(() => drawRocket(P, 2290, 892, 0.15))
      if (ok(layla.x, 130, layla.y - layla.lift - 480, layla.y + 8)) drawPerson(P, 'layla', layla, { basket: true, basketOn: 'b' })
      if (ok(sari.x, 150, sari.y - sari.lift - 340, sari.y + 8)) drawPerson(P, 'sari', sari)
      if (ok(amir.x, 130, amir.y - amir.lift - 340, amir.y + 8)) drawPerson(P, 'amir', amir)
    },
    front: () => drawBursts(P, BURSTS, t),
  })
  paperGrain(P)
}

/** The narrator's cue line, and the chant from the scene's own text: «خطوة.. ليل! خطوة.. نهار!» */
const CUE = cuePhrases(6, [4, 3])
const CHANT = (moon.scenes[5].ar[4].match(/"([^"]+)"/)?.[1] ?? '').split(' ')
const caption = (t: number) => phraseCaption('cue', CUE, [10.5, 11.5, 12.5], t, 13.55) ?? phraseCaption('chant', CHANT, [13.95, IN1, 15.25, OUT1], t, 19.3)

const SCORE: Note[] = [
  pad(0, 26, D3, 0.045), pad(0, 26, A3, 0.03), pad(0.8, 13.4, Fs3, 0.02),
  bell(1.9, A5, 0.05, 1.0),
  mallet(T1, D4, 0.13), thud(T1 + 1.6, 0.15), mallet(T2, Fs4, 0.13), thud(T2 + 1.6, 0.15), mallet(T3, A4, 0.13), thud(STOP, 0.2),
  // the line itself: one dark note and one bright note, side by side
  mallet(10.5, D4, 0.12, 1.4), mallet(11.5, A4, 0.12, 1.2), bell(11.5, D5, 0.06, 1.2), mallet(12.5, D4, 0.12, 1.6), pad(12.5, 14.2, F3, 0.03),
  // the game: night is low, day is high
  mallet(13.95, E4, 0.09, 0.3), mallet(IN1, D4, 0.16), mallet(15.25, E4, 0.09, 0.3), mallet(OUT1, A4, 0.15), bell(OUT1, D5, 0.06),
  mallet(16.45, E4, 0.09, 0.3), mallet(IN2, D4, 0.16), mallet(17.45, E4, 0.09, 0.3), mallet(OUT2, A4, 0.15), bell(OUT2, D5, 0.06),
  mallet(S_OVER, Fs4, 0.1), mallet(S_OVER + 1.0, D4, 0.14), mallet(A_OVER, Fs4, 0.1), mallet(A_OVER + 1.1, D4, 0.14),
  mallet(S_BACK, Fs4, 0.1), mallet(S_BACK + 1.0, A4, 0.14), mallet(A_BACK, Fs4, 0.1), mallet(A_BACK + 1.1, A4, 0.14),
  bell(FOUND, D6, 0.08, 1.6), bell(FOUND, A5, 0.07, 1.6), mallet(FOUND, D5, 0.14, 2.0), mallet(24.3, D4, 0.13, 1.4), bell(24.34, Fs5, 0.06, 1.4),
]

export const scene6: SceneDef = { n: 6, duration: DURATION, shots: SHOTS, render, caption, joints: (t) => jointsOf(cast(t)), score: SCORE }
