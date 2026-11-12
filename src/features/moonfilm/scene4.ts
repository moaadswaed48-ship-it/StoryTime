/**
 * Scene 4 — «قفزة عالية» — the first jump: five shots, about 24 seconds.
 *
 *  1  0.0  extreme wide            the rocket alone on the empty plain; the door swings open; a small face looks out
 *  2  4.2  medium, the doorway     Sari looks at the new world, at the ground far below… decides, crouches, jumps
 *  3  7.6  very wide (the picture) the long rise, the hang with his shadow far below, the slow fall, the first prints
 *  4 13.6  medium, on Sari         «أنا خفيف!» — arms wide, two happy hops
 *  5 16.6  wide                    Amir's "small" hop carries him right over Sari's head; he lands beyond, laughing
 *
 * Geography as everywhere on the Moon: Sun low to the right (shadows fall left), rocket right of centre, Earth upper left.
 */
import { E, Painter, lerp, paperGrain, ramp, track, type Cam } from './kit/core'
import { A3, A4, A5, B5, D3, D4, D5, D6, E5, Fs3, Fs5, bell, mallet, pad, thud } from './kit/notes'
import { drawPerson, rest, type Pose } from './kit/people'
import { addHops, blinkAt, cuePhrases, frameRange, jointsOf, laugh, litWorld, personShadow, phraseCaption, smoothBends, type Note, type SceneDef } from './kit/stage'
import { drawBursts, drawEarth, drawGround, drawPrints, drawRocket, drawSky, type Burst, type Ground, type Print } from './kit/world'

const DURATION = 23.8
const SHOTS = [0, 4.2, 7.6, 13.6, 16.6]

// ── the set ───────────────────────────────────────────────────────────────────
const RX = 620 // the rocket
const RY = 960
const RS = 1.12
const SILL = RY - 134 // the door's sill
const SY = 1044 // Sari's ground row (a little nearer the camera than the rocket's shadow)
const AY = 1010 // Amir's
const GROUND: Ground = {
  horizon: 846,
  cx: 100,
  curve: 9000,
  hills: [[-1500, 240, 40], [-720, 170, 28], [-90, 120, 18], [1320, 230, 40], [1900, 180, 30]],
  craters: [[-1180, 928, 96], [-470, 902, 54], [150, 918, 46], [1180, 1020, 110], [1760, 930, 70], [-1480, 1130, 84]],
  pebbles: [[-860, 1000, 7], [-300, 1090, 6], [330, 1000, 6], [930, 1070, 8], [-1240, 1040, 6], [1500, 1010, 7]],
}

// ── beats ─────────────────────────────────────────────────────────────────────
const JUMP = 7.0 // Sari leaves the sill
const AIR = 4.335
const LAND = JUMP + AIR
const HOP1 = 14.2
const HOP2 = 15.3
const AJUMP = 17.6 // Amir's "small" hop
const AAIR = 3.74
const ALAND = AJUMP + AAIR

/** How far above his ground row Sari is: on the sill, then one clean slow arc, then the dust. */
const sariLift = (t: number) => (t < JUMP ? SY - SILL : t < LAND ? Math.max(0, SY - SILL + 600 * (t - JUMP) - 150 * (t - JUMP) * (t - JUMP)) : 0)
const sariX = (t: number) => (t < JUMP ? lerp(712, RX, E.io(ramp(t, 2.0, 2.9))) : lerp(RX, -60, ramp(t, JUMP, LAND)))
const amirLift = (t: number) => (t < AJUMP ? AY - (RY - 18) : t < ALAND ? Math.max(0, AY - (RY - 18) + 543 * (t - AJUMP) - 150 * (t - AJUMP) * (t - AJUMP)) : 0)
const amirX = (t: number) => lerp(596, -340, ramp(t, AJUMP, ALAND))

const FEET = { fax: -24, fay: 0, fbx: 24, fby: 0 }

const sariTrack = track<Pose>({ ...rest('sari', 0, SY), turn: -0.4, toe: -1, lookX: -0.6 }, [
  // 1, 2 ─ in the doorway
  [2.9, 0.4, { wide: 0.8, brow: 1, mOpen: 0.4, mWide: 0.2, lookX: -1, lookY: -0.2, turn: -0.7 }, 'back'],
  [4.6, 0.5, { tilt: -0.08, lookY: -0.7 }],
  [5.3, 0.45, { lookY: 0.95, tilt: 0.1, turn: -0.5, mOpen: 0.25 }],
  [6.0, 0.3, { mOpen: 0.7, mWide: 1, mCurve: 1, brow: 0.6, wide: 0.3, lookY: 0, tilt: 0, turn: -0.7 }],
  [6.35, 0.5, { crouch: 0.9, lean: -0.3, ax: 30, ay: 42, bx: 44, by: 32, mOpen: 0.2 }],
  [JUMP - 0.06, 0.2, { crouch: 0, lean: -0.18, sq: 1.12, mOpen: 1 }, 'snap'],
  [JUMP - 0.02, 0.4, { ax: -50, ay: -54, bx: -8, by: -74 }, 'back'],
  // 3 ─ the rise: opening into a star, laughing at the top, then reaching for the ground
  [JUMP + 0.45, 0.9, { sq: 1.03, rot: -0.12, lean: 0, ax: -64, ay: -42, bx: 66, by: -36, fax: -66, fay: 34, fbx: 64, fby: 12, turn: -0.15, wide: 0.6, brow: 1, lookX: 0, lookY: 0.2 }, 'soft'],
  [JUMP + 1.85, 0.8, { rot: 0.07, happy: 1, wide: 0 }, 'soft'],
  [JUMP + 2.75, 0.9, { rot: 0.02, happy: 0, lookY: 1, wide: 0.5, mOpen: 0.6, mWide: 0.3, ax: -58, ay: -10, bx: 60, by: -8, fax: -34, fay: 10, fbx: 36, fby: 2, tilt: 0.08, sq: 1 }, 'soft'],
  [LAND - 0.3, 0.3, { ...FEET, rot: 0 }],
  [LAND, 0.18, { crouch: 0.62, sq: 0.9, ax: -40, ay: 30, bx: 42, by: 30, lean: -0.05 }, 'out'],
  [LAND + 0.25, 0.8, { crouch: 0, sq: 1, tilt: 0, lean: 0 }, 'back'],
  [LAND + 0.9, 0.5, { lookY: 1, turn: -0.2, mOpen: 0.3, ax: -30, ay: 52, bx: 30, by: 52, brow: 0.6 }],
  // 4 ─ "I'm light!"
  [13.7, 0.36, { turn: 0.3, lookY: -0.3, lookX: 0.5, ax: -62, ay: -30, bx: 62, by: -34, mOpen: 1, mWide: 1, mCurve: 1, happy: 1, brow: 0.5 }, 'back'],
  [HOP1, 0.25, { fax: -34, fay: 14, fbx: 34, fby: 14 }],
  [HOP1 + 0.72, 0.16, FEET],
  [HOP2, 0.3, { fax: -36, fay: 18, fbx: 36, fby: 18, turn: 0.7, lookX: 1, ax: -40, ay: -60, bx: 40, by: -62 }],
  [HOP2 + 0.8, 0.16, FEET],
  // 5 ─ he watches Amir sail over his head
  [16.7, 0.4, { happy: 0, turn: 0.8, lookX: 1, lookY: -0.1, ax: -9, ay: 70, bx: 58, by: -22, mOpen: 0.6, toe: 1 }],
  [AJUMP + 0.15, 0.3, { wide: 0.8, brow: 1, mOpen: 0.5, mWide: 0.2, bx: 22, by: 58 }, 'back'],
  [AJUMP + 0.9, 0.9, { tilt: -0.2, lookY: -1, turn: 0.5 }, 'soft'],
  [AJUMP + 2.25, 0.5, { turn: 0, crouch: 0.24, tilt: -0.26, bx: 26, by: -62, bPoint: 1 }],
  [AJUMP + 2.85, 0.6, { turn: -0.75, tilt: -0.12, lookX: -1, lookY: -0.4, toe: -1, crouch: 0, bPoint: 0, bx: 9, by: 70, ax: -52, ay: -38, aPoint: 1 }, 'soft'],
  [ALAND - 0.2, 0.4, { tilt: 0, lookY: 0.2, aPoint: 0, ax: -9, ay: 70, wide: 0 }],
  [ALAND + 0.3, 0.3, { happy: 1, mOpen: 1, mWide: 1, mCurve: 1 }],
])

const amirTrack = track<Pose>({ ...rest('amir', 596, AY), turn: -0.7, toe: -1, lookX: -1, lookY: 0.1, mOpen: 0.3, mWide: 0.8, ax: -4, ay: 66, bx: 12, by: 66 }, [
  // in the doorway, watching Sari go up… and come down
  [7.8, 0.8, { tilt: -0.2, lookY: -1, wide: 0.8, brow: 1, mOpen: 0.6, mWide: 0.2 }, 'soft'],
  [9.6, 1.4, { tilt: 0, lookY: 0.3 }, 'soft'],
  [LAND + 0.2, 0.3, { happy: 1, mOpen: 1, mWide: 1, mCurve: 1, wide: 0, ax: -34, ay: -52, bx: 36, by: -56 }, 'back'],
  [12.8, 0.4, { happy: 0, ax: -4, ay: 66, bx: 12, by: 66, mOpen: 0.4 }],
  // 5 ─ on the last rung: a small hop…
  [16.6, 0, { crouch: 0.12, lean: -0.1, lookY: 0.2, wide: 0.3, brow: 0.5, mOpen: 0.6, mWide: 1, mCurve: 1, tilt: 0 }],
  [17.2, 0.34, { crouch: 0.4 }],
  [AJUMP - 0.04, 0.16, { crouch: 0, sq: 1.08, lean: 0 }, 'snap'],
  // …and far more flight than he asked for
  [AJUMP + 0.12, 0.3, { wide: 1, brow: 1, mOpen: 0.85, mWide: 0.2, sq: 1 }, 'back'],
  [AJUMP + 0.2, 0.5, { fax: -30, fay: 24, fbx: 40, fby: 6 }],
  [AJUMP + 0.3, 1.2, { rot: 0.2 }, 'soft'],
  [AJUMP + 1.2, 0.6, { fax: -44, fay: 6, fbx: 26, fby: 26 }, 'soft'],
  [AJUMP + 1.5, 1.2, { rot: -0.14 }, 'soft'],
  [AJUMP + 1.6, 0.5, { mOpen: 1, mWide: 1, mCurve: 1, wide: 0.4, lookY: 0.9, lookX: -0.3 }],
  [AJUMP + 2.2, 0.6, { fax: -30, fay: 14, fbx: 38, fby: 4 }, 'soft'],
  [AJUMP + 2.8, 0.7, { rot: 0, ax: -56, ay: -8, bx: 54, by: -12 }, 'soft'],
  [ALAND - 0.3, 0.3, FEET],
  [ALAND, 0.2, { crouch: 0.66, sq: 0.9, lean: -0.22 }, 'out'],
  [ALAND + 0.25, 0.8, { crouch: 0, sq: 1, lean: 0 }, 'back'],
  [ALAND + 0.9, 0.5, { turn: 0.7, toe: 1, lookX: 1, lookY: 0, happy: 1, ax: -40, ay: -56, bx: 44, by: -50 }, 'back'],
])

const laylaTrack = track<Pose>({ ...rest('layla', 0, 22), turn: -0.6, lookX: -1, lookY: -0.2, tilt: -0.04, mOpen: 0.4, mWide: 1, mCurve: 1, ax: -12, ay: 100, bx: 14, by: 70, lean: -0.06 }, [
  [AJUMP + 0.3, 0.5, { lookY: -1, tilt: -0.16, wide: 0.7, brow: 1, mOpen: 0.6, mWide: 0.3 }, 'back'],
  [AJUMP + 2.4, 0.9, { lookY: 0, tilt: -0.04, wide: 0 }, 'soft'],
  [ALAND + 0.2, 0.3, { happy: 1, mOpen: 0.8, mWide: 1 }],
  [ALAND + 0.6, 0.5, { ax: -44, ay: -44 }, 'back'],
])

type Cast = { sari: Pose; amir: Pose; layla: Pose }
const BLINKS = { sari: [3.6, 5.0, 12.6, 16.9, 22.6], amir: [9.0, 12.2, 17.0, 22.9], layla: [17.3, 20.6, 23.0] }

function castRaw(t: number): Cast {
  const sari = sariTrack(t)
  const amir = amirTrack(t)
  const layla = laylaTrack(t)
  sari.x = sariX(t)
  sari.lift = sariLift(t)
  amir.x = amirX(t)
  amir.lift = amirLift(t)
  addHops(sari, t, [[HOP1, 0.9, 36, 0.22], [HOP2, 1.0, 48, 0.24]])
  // Amir's arms wheel as he goes: round and round, then out wide
  const s = t - AJUMP
  const w = ramp(s, 0.2, 0.6) * (1 - ramp(s, 2.2, 2.9))
  if (w > 0) {
    const f = s * 5.4
    amir.ax = lerp(amir.ax, -12 - 46 * Math.cos(f), w)
    amir.ay = lerp(amir.ay, -14 + 46 * Math.sin(f), w)
    amir.bx = lerp(amir.bx, 12 + 46 * Math.cos(f + 2.3), w)
    amir.by = lerp(amir.by, -14 + 46 * Math.sin(f + 2.3), w)
  }
  sari.sq *= laugh(t, JUMP + 1.9, JUMP + 2.8) * laugh(t, ALAND + 0.3, DURATION + 1)
  amir.sq *= laugh(t, ALAND + 1.0, DURATION + 1, 21)
  sari.blink = Math.max(sari.blink, blinkAt(BLINKS.sari, t))
  amir.blink = Math.max(amir.blink, blinkAt(BLINKS.amir, t))
  layla.blink = Math.max(layla.blink, blinkAt(BLINKS.layla, t))
  sari.swing = (sariX(t - 0.1) - sari.x) * 0.004 + (sariLift(t - 0.1) - sari.lift) * 0.004
  return { sari, amir, layla }
}
const cast = (t: number) => smoothBends(castRaw, t)

function camera(t: number): Cam {
  const k = SHOTS.filter((s) => t >= s).length
  const u = (a: number, b: number) => E.soft(ramp(t, a, b))
  switch (k) {
    case 1:
      return { x: lerp(330, 300, u(0, 4.2)), y: lerp(600, 590, u(0, 4.2)), zoom: lerp(0.52, 0.56, u(0, 4.2)) }
    case 2:
      return { x: lerp(560, 548, u(4.2, 7.6)), y: lerp(652, 640, u(4.2, 7.6)), zoom: lerp(1.6, 1.72, u(4.2, 7.6)) }
    case 3: {
      // a small tilt up with him, and back down
      const up = u(7.6, 9.2) * (1 - u(9.8, 11.4))
      return { x: 210, y: lerp(584, 548, up), zoom: 0.62 }
    }
    case 4:
      return { x: -140, y: 800, zoom: lerp(1.46, 1.54, u(13.6, 16.6)) }
    default:
      return { x: lerp(170, 130, u(16.6, 23.8)), y: lerp(612, 620, u(16.6, 23.8)), zoom: lerp(0.76, 0.8, u(16.6, 23.8)) }
  }
}

const BURSTS: Burst[] = [
  { t: LAND, x: -60, y: SY, seed: 401, n: 14, power: 150, spread: 2.6 },
  { t: HOP1, x: -60, y: SY, seed: 402, n: 8, power: 90 },
  { t: HOP1 + 0.9, x: -60, y: SY, seed: 403, n: 9, power: 100 },
  { t: HOP2, x: -60, y: SY, seed: 404, n: 8, power: 90 },
  { t: HOP2 + 1.0, x: -60, y: SY, seed: 405, n: 10, power: 110 },
  { t: ALAND, x: -340, y: AY, seed: 406, n: 14, power: 150, spread: 2.6 },
]
const PRINTS: Print[] = [
  // the very first footprints on this Moon
  { t: LAND + 0.05, x: -82, y: SY + 2, who: 'sari' }, { t: LAND + 0.05, x: -38, y: SY - 3, who: 'sari' },
  { t: HOP1 + 0.95, x: -88, y: SY + 8, who: 'sari' }, { t: HOP2 + 1.05, x: -30, y: SY + 9, who: 'sari' },
  { t: ALAND + 0.05, x: -362, y: AY + 2, who: 'amir' }, { t: ALAND + 0.05, x: -318, y: AY - 2, who: 'amir' },
]

function render(P: Painter, t: number) {
  const { sari, amir, layla } = cast(t)
  P.cam = camera(t)
  drawSky(P)
  P.screen()
  if (P.cam.zoom < 1.2) drawEarth(P, 330, 196 - (P.cam.y - 584) * 0.5, 56, t + 12)
  P.world()
  const [x0, x1] = frameRange(P)
  const open = E.back(ramp(t, 1.0, 1.9))
  const sariOut = t >= JUMP - 0.7 // he stands in the doorway until he crouches to jump
  const amirOut = t >= SHOTS[4] // Amir watches from the doorway, then is on the ladder
  litWorld(P, {
    x0,
    x1,
    set: () => {
      drawGround(P, GROUND, x0, x1)
      drawPrints(P, PRINTS, t)
    },
    shadows: () => {
      P.shadow(RX, RY, () => drawRocket(P, 0, 0, RS, undefined, open), 0, 3, 0.13)
      if (amirOut) personShadow(P, 'amir', amir)
      if (t >= JUMP) personShadow(P, 'sari', sari)
    },
    figures: () => {
      drawRocket(
        P,
        RX,
        RY,
        RS,
        () => {
          // whoever is in the doorway, in the rocket's own frame
          P.ctx.scale(1 / RS, 1 / RS)
          if (open < 0.3) return
          if (amirOut) drawPerson(P, 'layla', layla, { basket: true, basketOn: 'b' })
          else if (t > JUMP + 0.5) drawPerson(P, 'amir', { ...amir, x: -6, y: SILL - RY, lift: 0 })
          if (!sariOut) drawPerson(P, 'sari', { ...sari, x: sari.x - RX, y: SILL - RY, lift: 0 })
        },
        open,
      )
      if (amirOut) drawPerson(P, 'amir', amir)
      if (sariOut) drawPerson(P, 'sari', sari)
    },
    front: () => drawBursts(P, BURSTS, t),
  })
  paperGrain(P)
}

const CUE = cuePhrases(4, [4, 4])
const caption = (t: number) => phraseCaption('cue', CUE, [JUMP - 0.3, JUMP + 1.2, JUMP + 2.9], t, 13.4)

const SCORE: Note[] = [
  pad(0, 24.2, D3, 0.045), pad(0, 24.2, A3, 0.03), pad(0.8, 24.2, Fs3, 0.022),
  bell(1.2, A5, 0.05, 1.2), bell(2.9, E5, 0.05, 1.0),
  mallet(6.4, D4, 0.12), { t: JUMP, f: A4, to: D6, d: 2.0, v: 0.1, wave: 'sine' }, mallet(JUMP, A4, 0.16),
  bell(JUMP + 2.0, D6, 0.08, 2.0), bell(JUMP + 2.9, B5, 0.05), bell(JUMP + 3.4, A5, 0.05), bell(JUMP + 3.9, Fs5, 0.05), thud(LAND, 0.2), mallet(LAND + 0.02, D4, 0.12),
  mallet(13.75, D5, 0.12), mallet(HOP1, Fs5, 0.1), thud(HOP1 + 0.9, 0.12), mallet(HOP2, A5, 0.1), thud(HOP2 + 1.0, 0.13),
  mallet(AJUMP, E5, 0.1), { t: AJUMP + 0.05, f: A4, to: D6, d: 1.7, v: 0.09, wave: 'sine' }, bell(AJUMP + 1.8, D6, 0.07, 1.8),
  bell(AJUMP + 2.7, A5, 0.05), thud(ALAND, 0.2), mallet(ALAND + 0.9, D4, 0.13, 2.2), mallet(ALAND + 0.9, A4, 0.09, 2.2), bell(ALAND + 0.94, Fs5, 0.07, 2.2), bell(ALAND + 0.98, D5, 0.06, 2.2),
]

export const scene4: SceneDef = { n: 4, duration: DURATION, shots: SHOTS, render, caption, joints: (t) => jointsOf(cast(t)), score: SCORE }
