/**
 * Scene 7 — «ومضة في الظلام» — a blink in the dark: five shots, about 25 seconds.
 *
 *  1  0.0  wide, at the line       the game goes on… a single faint gold blink far off in the night; Amir stops dead
 *  2  4.2  medium, the three       the teacher's lamp comes on; Amir hesitates, then takes Sari's hand
 *  3  8.0  tracking, in the night  they go in: stars, navy, the lamp's circle sweeping the ground ahead — it slides over
 *                                  something between the rocks; Amir points; the lamp swings back and finds him
 *  4 14.0  medium, low             a small robot, grey with dust, asleep; Sari comes round to his side and crouches
 *  5 18.4  close                   one hand on the folded wing: a little dust slides off and falls straight down.
 *                                  "Is he asleep?"
 *
 * The scene ends exactly where scene 8 begins: same place, same poses, same circle of lamp-light.
 */
import { E, Painter, circle, clamp01, lerp, paperGrain, ramp, seededList, track, type Cam } from './kit/core'
import { A3, A4, A5, D3, D4, D5, E5, F3, Fs4, bell, mallet, pad } from './kit/notes'
import { drawPerson, handAt, rest, type Pose } from './kit/people'
import { addHops, blinkAt, cuePhrases, frameRange, jointsOf, litWorld, personShadow, phraseCaption, smoothBends, type Note, type Pool, type SceneDef } from './kit/stage'
import { drawRover, roverRest, type Rover } from './kit/wameed'
import { drawBursts, drawEarth, drawGround, drawPrints, drawRock, drawSky, drawStars, lineX, type Burst, type Print } from './kit/world'
import { GROUND, LINE } from './scene8'

const DURATION = 24.8
const SHOTS = [0, 4.2, 8.0, 14.0, 18.6]

const SY = 790
const AY = 812
const LY = 778
const WAMEED: Rover = { ...roverRest, x: -640, y: 798 }

// ── beats ─────────────────────────────────────────────────────────────────────
const BLINK = 1.0 // the light in the dark
const LAMP = 4.6 // the lamp comes on
const HANDS = 6.3 // Amir takes Sari's hand
const SEEN = 10.9 // "there!"
const TOUCH = 19.3 // a hand on the wing

const S_STEPS = [8.15, 9.05, 9.95]
const L_STEPS = [8.1, 8.95, 9.8, 10.65, 11.5]
const S_ROUND = [14.1, 15.0, 15.9] // Sari goes round to the sleeper's far side
const A_ROUND = [14.4, 15.3, 16.2]
/** Where each of them is along the ground. */
function sariX(t: number): number {
  if (t < SHOTS[2]) return lerp(110, 44, E.io(ramp(t, 7.0, 7.8)))
  if (t < SHOTS[3]) return 60 - S_STEPS.reduce((a, s) => a + 113 * ramp(t, s, s + 0.8), 0)
  return -279 - S_ROUND.reduce((a, s) => a + (496 / 3) * ramp(t, s, s + 0.8), 0)
}
function amirX(t: number): number {
  if (t < SHOTS[2]) return lerp(300, 214, E.io(ramp(t, 7.1, 7.9)))
  if (t < SHOTS[3]) return 210 - S_STEPS.reduce((a, s) => a + 113 * ramp(t, s + 0.1, s + 0.9), 0)
  return -129 - A_ROUND.reduce((a, s) => a + (376 / 3) * ramp(t, s, s + 0.8), 0)
}
function laylaX(t: number): number {
  if (t < SHOTS[2]) return lerp(520, 420, E.io(ramp(t, 5.0, 5.8)))
  return -60 - L_STEPS.reduce((a, s) => a + 180 * ramp(t, s, s + 0.8), 0)
}

/** The lamp's circle of light: off, then ahead of her as she walks, then swung back to rest on the sleeper. */
function pool(t: number): Pool {
  const on = E.out(ramp(t, LAMP, LAMP + 0.14))
  if (t < SHOTS[2]) return { x: -210, y: 726, rx: 250 * on, ry: 210 * on, light: 'lamp' }
  const back = E.io(ramp(t, 11.5, 12.9))
  return { x: lerp(laylaX(t) - 190, -640, back), y: lerp(724, 676, back), rx: lerp(180, 350, back), ry: lerp(160, 312, back), light: 'lamp' }
}

const HANG = { ax: -9, ay: 70, bx: 9, by: 70 }
const FEET = { fax: -24, fay: 0, fbx: 24, fby: 0 }
const step = (s: number, lead: 'a' | 'b'): [number, number, Partial<Pose>][] =>
  lead === 'a' ? [[s, 0.25, { fax: -56, fay: 14 }], [s + 0.62, 0.2, { fax: -24, fay: 0 }]] : [[s, 0.25, { fbx: -6, fby: 14 }], [s + 0.62, 0.2, { fbx: 24, fby: 0 }]]

const sariTrack = track<Pose>({ ...rest('sari', 110, SY), turn: -0.5, toe: -1, lookX: -0.6, happy: 1, mOpen: 0.8, mWide: 1, mCurve: 1, ax: -50, ay: -10, bx: 50, by: -14 }, [
  // 1 ─ still playing… until he sees Amir's face
  [2.1, 0.3, { happy: 0, turn: 0.6, lookX: 1, mOpen: 0.3, mWide: 0.3, brow: 0.6, ...HANG, toe: 0 }],
  [3.0, 0.4, { turn: -0.7, lookX: -1, wide: 0.5, mOpen: 0 }],
  // 2 ─ "come on": he holds out his hand
  [4.2, 0, { turn: -0.4, lookX: -0.8, wide: 0.3, brow: 0.4, mOpen: 0, mCurve: 0.4, ...HANG, toe: -1 }],
  [5.4, 0.4, { turn: 0.6, lookX: 1, bx: 56, by: 24, mOpen: 0.4, mWide: 0.8, mCurve: 1, wide: 0 }],
  [HANDS + 0.3, 0.3, { tilt: 0.1 }],
  [HANDS + 0.6, 0.3, { tilt: 0, turn: -0.6, lookX: -1, mOpen: 0 }, 'back'],
  // 3 ─ into the night, hand in hand
  [8.0, 0, { turn: -0.6, lookX: -1, lookY: 0.1, bx: 54, by: 26, ax: -9, ay: 70, wide: 0.3, brow: 0.5, lean: -0.06 }],
  ...S_STEPS.flatMap((s, i) => step(s, i % 2 ? 'b' : 'a')),
  [SEEN + 0.3, 0.3, { turn: -0.8, lookY: 0.5, wide: 0.8, brow: 1, mOpen: 0.4, mWide: 0.2 }, 'back'],
  // 4 ─ he lets go, goes round behind the sleeper, and crouches by him
  [14.0, 0, { turn: -0.7, lookX: -1, lookY: 0.6, wide: 0.5, brow: 0.8, mOpen: 0.2, mWide: 0.2, bx: 54, by: 26, lean: -0.06 }],
  [14.3, 0.4, { bx: 9, by: 70 }],
  ...S_ROUND.flatMap((s, i) => step(s, i % 2 ? 'b' : 'a')),
  [16.6, 0.5, { turn: 0.6, lookX: 0.4, lookY: 0.7, toe: 1, lean: 0 }],
  [17.1, 0.6, { crouch: 0.78, lean: 0.32, ax: -2, ay: 54, bx: 22, by: 46, wide: 0.3 }],
  // 5 ─ the touch, and the whisper
  [18.6, 0, { crouch: 0.78, lean: 0.32, turn: 0.6, lookX: 0.4, lookY: 0.7, toe: 1, ax: -2, ay: 54, bx: 22, by: 46, wide: 0.3, brow: 0.5, mOpen: 0, mWide: 0.2, mCurve: 0.3 }],
  [TOUCH - 0.5, 0.5, { bw: 1 }, 'soft'],
  [TOUCH + 0.5, 0.3, { wide: 0.6, brow: 0.9 }],
  [21.2, 0.45, { turn: -0.2, lookX: -0.6, lookY: -0.6, tilt: -0.08, mOpen: 0.3, mWide: 0.1 }],
  [21.7, 0.12, { mOpen: 0.1 }], [21.86, 0.12, { mOpen: 0.35 }], [22.04, 0.12, { mOpen: 0.1 }], [22.2, 0.12, { mOpen: 0.3 }],
  [22.9, 0.5, { turn: 0.6, lookX: 0.4, lookY: 0.7, tilt: 0, mOpen: 0.3, wide: 0, brow: 0.3 }],
])

const amirTrack = track<Pose>({ ...rest('amir', 300, AY), turn: -0.6, toe: -1, lookX: -1, lookY: 0.1, happy: 1, mOpen: 0.7, mWide: 1, mCurve: 1, ax: -52, ay: -12, bx: 52, by: -8, fax: -34, fay: 16, fbx: 32, fby: 12 }, [
  // 1 ─ he lands from a hop… and does not move again
  [0.45, 0.15, FEET],
  [BLINK + 0.12, 0.2, { happy: 0, wide: 1, brow: 1, mOpen: 0.3, mWide: 0.15, mCurve: 0, ax: -20, ay: 36, bx: 20, by: 36, lean: 0.08 }, 'out'],
  [2.2, 0.4, { ax: -66, ay: -6, aPoint: 1, mOpen: 0.5, lean: -0.06 }, 'back'],
  [3.2, 0.3, { turn: 0.5, lookX: 0.8 }],
  [3.8, 0.3, { turn: -0.6, lookX: -1, aPoint: 0, ax: -20, ay: 36 }],
  // 2 ─ brave and wary at once
  [4.2, 0, { turn: -0.6, lookX: -1, lookY: 0.1, wide: 0.6, brow: 1, mOpen: 0, mWide: 0.2, mCurve: -0.2, ax: 24, ay: 30, bx: -24, by: 30, lean: 0.1, happy: 0, aPoint: 0 }],
  [5.6, 0.4, { turn: -0.2, lookX: -0.9, lookY: 0.4 }],
  [HANDS - 0.4, 0.45, { aw: 1, bx: 9, by: 70, lean: 0, wide: 0.3, mCurve: 0.5 }, 'soft'],
  [HANDS + 0.3, 0.3, { tilt: 0.1 }],
  [HANDS + 0.6, 0.3, { tilt: 0, turn: -0.6, lookX: -1 }, 'back'],
  // 3 ─ a step behind, looking about him
  [8.0, 0, { turn: -0.5, lookX: -1, lookY: 0.2, aw: 1, bx: 9, by: 70, wide: 0.5, brow: 0.9, lean: -0.04, mOpen: 0 }],
  ...S_STEPS.flatMap((s, i) => step(s + 0.1, i % 2 ? 'a' : 'b')),
  [8.9, 0.4, { turn: 0.3, lookX: 0.6, lookY: -0.3 }],
  [9.6, 0.4, { turn: -0.6, lookX: -1, lookY: 0.4 }],
  [10.35, 0.2, { wide: 1, mOpen: 0.5, mWide: 0.15 }, 'back'],
  [SEEN, 0.36, { bx: -56, by: 24, bPoint: 1, lean: -0.1 }, 'back'],
  [12.9, 0.5, { bPoint: 0, bx: 9, by: 70 }],
  // 4 ─ he comes up on the other side, hands together
  [14.0, 0, { turn: -0.6, lookX: -0.6, lookY: 0.6, aw: 1, bx: 9, by: 70, wide: 0.5, brow: 0.8, bPoint: 0, lean: -0.04 }],
  [14.3, 0.4, { aw: 0, ax: -9, ay: 70 }],
  ...A_ROUND.flatMap((s, i) => step(s, i % 2 ? 'b' : 'a')),
  [17.0, 0.5, { crouch: 0.12, lean: -0.14, lookX: -0.5, ax: 26, ay: 30, bx: -26, by: 30, wide: 0.2, brow: 0.6, mCurve: 0.1, mWide: 0.25 }],
])

const laylaTrack = track<Pose>({ ...rest('layla', 520, LY), turn: -0.5, toe: -1, lookX: -0.8, lookY: 0.2, mOpen: 0.3, mWide: 1, mCurve: 1, bx: 12, by: 110, ax: -12, ay: 112 }, [
  [BLINK + 0.6, 0.5, { mOpen: 0, mCurve: 0.5, brow: 0.5 }],
  // 2 ─ she lifts the lamp and switches it on
  [4.2, 0, { mOpen: 0, mCurve: 0.6, brow: 0.3, bx: 12, by: 110 }],
  [4.3, 0.3, { bx: -30, by: 30 }, 'back'],
  [5.2, 0.4, { turn: -0.2, lookX: 0.4, lookY: 0.4, mOpen: 0.3, mCurve: 1 }],
  [6.6, 0.4, { turn: -0.55, lookX: -1, lookY: 0.2, mOpen: 0 }],
  // 3 ─ ahead of them, sweeping the ground
  [8.0, 0, { turn: -0.55, lookX: -1, lookY: 0.4, bx: -44, by: 22 }],
  ...L_STEPS.flatMap((s, i) => step(s, i % 2 ? 'b' : 'a')),
  [11.2, 0.4, { turn: 0.5, lookX: 0.8 }],
  [11.5, 1.3, { bx: 60, by: 4 }, 'io'],
  [12.4, 0.5, { toe: 0.6, turn: 0.55, lookX: 0.7, lookY: 0.3, mCurve: 0.8, mWide: 0.4 }],
])

type Cast = { sari: Pose; amir: Pose; layla: Pose }
const BLINKS = { sari: [3.6, 6.0, 17.2, 20.2, 23.6], amir: [5.0, 7.2, 16.9, 20.8], layla: [2.6, 6.0, 15.0, 21.4] }

function castRaw(t: number): Cast {
  const sari = sariTrack(t)
  const amir = amirTrack(t)
  const layla = laylaTrack(t)
  sari.x = sariX(t)
  amir.x = amirX(t)
  layla.x = laylaX(t)
  addHops(sari, t, [[0.25, 0.9, 40, 0.01], [1.35, 0.9, 40, 0.2], ...[...S_STEPS, ...S_ROUND].map((s): [number, number, number, number] => [s, 0.8, 22, 0.14])])
  addHops(amir, t, [[-0.45, 0.9, 44, 0.01], ...S_STEPS.map((s): [number, number, number, number] => [s + 0.1, 0.8, 20, 0.14]), ...A_ROUND.map((s): [number, number, number, number] => [s, 0.8, 22, 0.14])])
  addHops(layla, t, L_STEPS.map((s) => [s, 0.8, 20, 0.12]), 0.3)
  // hand in hand
  const h = handAt('sari', sari, 'b')
  amir.awx = h.x + 8
  amir.awy = h.y
  // a hand on the dusty wing
  sari.bwx = WAMEED.x - 64
  sari.bwy = WAMEED.y - 96
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
      return { x: lerp(-230, -270, u(0, 4.2)), y: 560, zoom: lerp(1, 1.05, u(0, 4.2)) }
    case 2:
      return { x: lerp(250, 230, u(4.2, 8)), y: 604, zoom: lerp(1.42, 1.52, u(4.2, 8)) }
    case 3:
      return { x: lerp(-150, -620, u(8, 13.2)), y: 560, zoom: 1.05 }
    case 4:
      return { x: lerp(-620, -660, u(14, 18.6)), y: lerp(628, 640, u(14, 18.6)), zoom: lerp(1.42, 1.62, u(14, 18.6)) }
    default:
      // a slow push-in along the beam toward the sleeper
      return { x: lerp(-700, -680, u(18.6, 24.8)), y: lerp(652, 664, u(18.6, 24.8)), zoom: lerp(2.3, 2.75, u(18.6, 24.8)) }
  }
}

const BURSTS: Burst[] = [
  { t: 0.45, x: 300, y: AY, seed: 701, n: 8, power: 90 },
  { t: 1.15, x: 110, y: SY, seed: 702, n: 8, power: 90 }, { t: 2.25, x: 110, y: SY, seed: 703, n: 8, power: 90 },
  ...S_STEPS.map((s, i): Burst => ({ t: s + 0.8, x: 60 - 113 * (i + 1), y: SY, seed: 710 + i, n: 5, power: 60 })),
]
const PRINTS: Print[] = [
  { t: 0, x: 90, y: SY + 2, who: 'sari' }, { t: 0, x: 132, y: SY - 2, who: 'sari' }, { t: 0, x: 280, y: AY + 2, who: 'amir' }, { t: 0, x: 322, y: AY - 2, who: 'amir' },
  { t: 0, x: 500, y: LY + 2, who: 'layla' }, { t: 0, x: 540, y: LY - 2, who: 'layla' }, { t: 0, x: 700, y: 800, who: 'sari' }, { t: 0, x: 760, y: 826, who: 'amir' }, { t: 0, x: 860, y: 790, who: 'layla' },
]
/** The dust that slides off the wing under Sari's hand: each grain drops straight down (nothing to carry it). */
const GRAINS = seededList(77, 36)

function render(P: Painter, t: number) {
  const { sari, amir, layla } = cast(t)
  const shot = SHOTS.filter((s) => t >= s).length
  P.cam = camera(t)
  drawSky(P)
  // stars only over the night: they stop short of the line where the daylight begins
  if (shot >= 3) drawStars(P, (P.cam.x + 640) * 0.05, P.toScreen(lineX(LINE, 640), 640)[0] - 60)
  P.screen()
  if (shot === 1 || shot === 3) drawEarth(P, 372, 168, 54, t + 33)
  P.world()
  const [x0, x1] = frameRange(P)
  const lamp = pool(t)
  const lit = t >= LAMP
  litWorld(P, {
    x0,
    x1,
    line: LINE,
    pools: [lamp],
    set: () => {
      drawGround(P, GROUND, x0, x1)
      drawPrints(P, PRINTS, t)
      drawRock(P, -806, 770, 74, 66, -8)
      drawRock(P, -486, 764, 44, 38, 6)
    },
    shadows: (ok) => {
      if (ok(layla.x, 130, layla.y - 480, layla.y)) personShadow(P, 'layla', layla, { basket: true })
      if (ok(sari.x, 130, sari.y - 340, sari.y)) personShadow(P, 'sari', sari)
      if (ok(amir.x, 130, amir.y - 340, amir.y)) personShadow(P, 'amir', amir)
    },
    figures: (ok) => {
      if (ok(layla.x, 150, layla.y - layla.lift - 480, layla.y + 8)) drawPerson(P, 'layla', layla, { basket: true, lamp: true, lampAim: lit ? lamp : undefined, lampLit: lit })
      if (ok(sari.x, 130, sari.y - sari.lift - 340, sari.y + 8)) drawPerson(P, 'sari', sari, { pass: 'body' })
      // (in the first shot he is only a blink in the dark: nobody has seen him yet)
      if (shot > 1 && ok(WAMEED.x, 150, WAMEED.y - 240, WAMEED.y + 8)) {
        // outside the lamp's circle he is one more dark shape among the rocks
        if (P.light === 'night') {
          P.silColor = '#272e58'
          P.lit('sil', () => drawRover(P, WAMEED))
          P.silColor = '#1d2447'
        } else drawRover(P, WAMEED)
      }
      if (ok(sari.x, 130, sari.y - sari.lift - 340, sari.y + 8)) drawPerson(P, 'sari', sari, { pass: 'arms' })
      if (ok(amir.x, 130, amir.y - amir.lift - 340, amir.y + 8)) drawPerson(P, 'amir', amir)
    },
    front: () => {
      drawRock(P, -712, 846, 30, 20, 0)
      drawBursts(P, BURSTS, t)
      if (P.light === 'lamp') {
        const c = P.ctx
        c.fillStyle = '#efe0a8'
        for (let i = 0; i < 12; i++) {
          const s = t - (TOUCH + 0.1 + GRAINS[i * 3] * 0.7)
          const y = WAMEED.y - 90 + GRAINS[i * 3 + 1] * 8 + 150 * s * s
          if (s > 0 && y < WAMEED.y) c.fill(circle(WAMEED.x - 118 + GRAINS[i * 3 + 2] * 100, y, 2.2 + GRAINS[i * 3 + 1] * 2))
        }
      }
    },
  })
  // the light that started it all: one faint gold blink, far off, where his eye is
  const b = clamp01(1 - Math.abs(t - BLINK - 0.14) / 0.16)
  if (b > 0) {
    const c = P.ctx
    c.fillStyle = `rgba(233,213,138,${0.16 * b})`
    c.fill(circle(WAMEED.x + 71, WAMEED.y - 94, 34))
    c.fillStyle = `rgba(255,243,196,${b})`
    c.fill(circle(WAMEED.x + 71, WAMEED.y - 94, 7))
  }
  paperGrain(P)
}

const CUE = cuePhrases(7, [5, 1])
const caption = (t: number) => phraseCaption('cue', CUE, [2.3, 3.2, 3.8], t, 7.7)

const SCORE: Note[] = [
  // the game's last notes, cut off
  mallet(0.25, A4, 0.12), mallet(0.45, D4, 0.12), mallet(1.35, A4, 0.1),
  bell(BLINK + 0.1, E5, 0.06, 1.4),
  pad(1.6, 25, D3, 0.05), pad(1.6, 25, A3, 0.03), pad(2.4, 25, F3, 0.026),
  mallet(LAMP, D5, 0.1, 0.5), mallet(HANDS, Fs4, 0.08, 1.2), mallet(HANDS, D4, 0.08, 1.2),
  // careful steps
  ...S_STEPS.flatMap((s) => [mallet(s, D4, 0.07, 0.5), mallet(s + 0.45, F3 * 2, 0.06, 0.5)]),
  bell(SEEN, A5, 0.07, 1.2), mallet(12.9, D4, 0.1, 2.4), bell(12.94, A4, 0.06, 2.4),
  bell(TOUCH + 0.2, E5, 0.035, 0.5), bell(TOUCH + 0.5, D5, 0.035, 0.5), bell(TOUCH + 0.8, A4, 0.035, 0.6),
  mallet(23.0, D4, 0.09, 2.2), bell(23.04, F3 * 2, 0.05, 2.2),
]

export const scene7: SceneDef = { n: 7, duration: DURATION, shots: SHOTS, render, caption, joints: (t) => jointsOf(cast(t)), score: SCORE, joins: true }
