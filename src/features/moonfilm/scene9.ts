/**
 * Scene 9 — «نصف أرض» — half an Earth: five shots, about 24 seconds.
 *
 *  1  0.0  wide, from the front    Wameed drives a happy circle round the three, stops, and lifts his eye to the sky
 *  2  5.0  close on Wameed → sky   the camera follows his look up through the black… to the Earth: only half of it
 *  3  8.6  from behind and below   all four looking up; "where is its other half?" — "in the night, of course":
 *                                  one by one, small gold towns come on in the dark half
 *  4 13.4  two-shot, the faces     Sari thinks… and understands
 *  5 17.6  from behind (picture)   his slow jump, pointing at the Earth; the teacher's hand on Amir's shoulder
 */
import { E, Painter, TAU, clamp01, lerp, paperGrain, ramp, track, type Cam } from './kit/core'
import { A3, A4, A5, B5, D3, D4, D5, D6, E5, Fs3, Fs4, Fs5, bell, mallet, pad, thud } from './kit/notes'
import { drawPerson, rest, skeleton, type Pose, type Who } from './kit/people'
import { addHops, blinkAt, cuePhrases, frameRange, jointsOf, laugh, litWorld, personShadow, phraseCaption, roverShadow, smoothBends, type Note, type SceneDef } from './kit/stage'
import { drawEyeHalo, drawRover, roverRest, type Rover } from './kit/wameed'
import { drawBursts, drawEarth, drawGround, drawPrints, drawSky, drawTracks, type Burst, type Ground, type Print } from './kit/world'

const DURATION = 24
const SHOTS = [0, 5.0, 8.6, 13.4, 17.6]

// ── the set ───────────────────────────────────────────────────────────────────
const G = 790
const GROUND: Ground = {
  horizon: 742,
  cx: 0,
  curve: 5200,
  hills: [[-1100, 180, 26], [-640, 150, 20], [-120, 90, 12], [470, 170, 22], [1050, 200, 28]],
  craters: [[-900, 830, 60], [-560, 880, 40], [760, 826, 52], [1040, 900, 70]],
  pebbles: [[-300, 880, 6], [140, 935, 5], [560, 950, 6], [-740, 940, 6], [900, 800, 5]],
}
/** Wameed's happy circle on the ground: once round the three of them. */
const RING = { x: 20, y: G + 62, rx: 640, ry: 62 }
const LOOP0 = 0.2
const LOOP1 = 4.3
const ringAngle = (t: number) => Math.PI + (TAU + 0.35) * E.soft(ramp(t, LOOP0, LOOP1))
/** When he reaches the right end of the circle, and the left end again (found once, by halving). */
const whenAngle = (target: number) => {
  let lo = LOOP0
  let hi = LOOP1
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2
    if (ringAngle(mid) < target) lo = mid
    else hi = mid
  }
  return lo
}
const TURN_R = whenAngle(TAU)
const TURN_L = whenAngle(TAU + Math.PI)
/** The Earth as the tilt-up of shot 2 finds it (in the world, high above the plain). */
const SKY_EARTH = { x: -90, y: -360, r: 280 }

// ── beats ─────────────────────────────────────────────────────────────────────
const LOOK = 4.45 // he lifts his eye
const TOWNS = 10.3 // the gold towns begin to come on
const GOTIT = 15.6 // "I understand!"
const JUMP = 17.75

const HANG = { ax: -9, ay: 70, bx: 9, by: 70 }
const FEET = { fax: -24, fay: 0, fbx: 24, fby: 0 }

const sariTrack = track<Pose>({ ...rest('sari', 40, G - 4), happy: 1, mOpen: 0.8, mWide: 1, mCurve: 1 }, [
  // 1 ─ delighted by the little rover's circle
  [1.2, 0.35, { ax: -50, ay: -50, bx: 50, by: -50 }, 'back'],
  [3.5, 0.5, HANG],
  [4.4, 0.25, { lookX: -1, happy: 0, mOpen: 0.3, lookY: 0.2 }],
  [4.7, 0.3, { lookY: -1, tilt: -0.16, wide: 0.6, brow: 1, mOpen: 0.5, mWide: 0.2 }],
  // 3 ─ from behind: he laughs and points at the dark half
  [8.6, 0, { back: 1, tilt: -0.1, ...HANG, turn: 0, happy: 0, lookX: 0, lookY: 0 }],
  [10.0, 0.5, { ax: -62, ay: -48, aPoint: 1 }, 'back'],
  [12.5, 0.5, { aPoint: 0, ax: -9, ay: 70 }],
  // 4 ─ the thought
  [13.4, 0, { back: 0, turn: -0.25, tilt: -0.14, lookY: -1, lookX: -0.4, brow: -0.5, mOpen: 0, mWide: 0.3, mCurve: 0, wide: 0, ax: -9, ay: 70, bx: -30, by: -18 }],
  [14.3, 0.4, { lookY: 0.4, lookX: 0.4, tilt: -0.04 }],
  [15.0, 0.5, { lookY: -1, lookX: -0.4, tilt: -0.14, wide: 0.5, brow: 0.6, mOpen: 0.3, mWide: 0.2 }],
  [GOTIT, 0.34, { wide: 1, brow: 1, mOpen: 0.95, mWide: 1, mCurve: 1, bx: 30, by: -60, ax: -40, ay: -50 }, 'back'],
  [16.25, 0.3, { turn: 0.7, lookX: 1, lookY: 0, tilt: 0 }],
  [16.9, 0.4, { crouch: 0.6, turn: -0.2, lookX: -0.3, lookY: -1, tilt: -0.12, ax: -20, ay: 50, bx: 20, by: 50 }],
  // 5 ─ the slow jump
  [17.6, 0, { back: 1, turn: 0, mOpen: 0, wide: 0, brow: 0, tilt: -0.1, lookX: 0, lookY: 0 }],
  [JUMP, 0.4, { crouch: 0, ax: -62, ay: -48, aPoint: 1, bx: 30, by: 44, sq: 1.04, rot: -0.05, fax: -26, fay: 8, fbx: 28, fby: 2 }, 'back'],
  [JUMP + 1.9, 0.26, { ...FEET, rot: 0, sq: 1 }],
  [22.2, 0.6, { aPoint: 0, ax: -9, ay: 70, bx: 9, by: 70 }],
])

const amirTrack = track<Pose>({ ...rest('amir', 300, G + 8), happy: 1, mOpen: 0.7, mWide: 1, mCurve: 1 }, [
  [2.0, 0.35, { ax: -44, ay: -54, bx: 46, by: -50 }, 'back'],
  [3.7, 0.5, HANG],
  [4.45, 0.25, { lookX: -1, happy: 0, mOpen: 0.3 }],
  [4.76, 0.3, { lookY: -1, tilt: -0.16, ax: -30, ay: -58, wide: 0.4, brow: 0.8 }],
  // 3 ─ "and where is its other half?"
  [8.6, 0, { back: 1, tilt: -0.16, ax: -30, ay: -58, bx: 12, by: 72, turn: 0, lookX: 0, lookY: 0, happy: 0 }],
  [9.0, 0.4, { bx: 46, by: -20 }, 'back'],
  [9.9, 0.4, { bx: 12, by: 72 }],
  // 4
  [13.4, 0, { back: 0, turn: -0.3, tilt: -0.14, lookY: -1, lookX: -0.3, ax: -30, ay: -58, bx: 12, by: 72, mOpen: 0.3, mWide: 0.2, wide: 0.3, brow: 0.4 }],
  [GOTIT + 0.3, 0.3, { turn: -0.7, lookX: -1, lookY: 0, tilt: 0, wide: 1, brow: 1, ...HANG }, 'back'],
  [16.6, 0.4, { mOpen: 0.8, mWide: 1, mCurve: 1, wide: 0.3 }],
  // 5
  [17.6, 0, { back: 1, tilt: -0.1, turn: 0, lookX: 0, lookY: 0, ...HANG, bx: 12, by: 72 }],
  [18.1, 0.5, { tilt: -0.18, ax: -30, ay: -58 }],
])

const laylaTrack = track<Pose>({ ...rest('layla', 520, G), mOpen: 0.4, mWide: 1, mCurve: 1, bx: 8, by: 104, ax: -12, ay: 112 }, [
  [4.5, 0.25, { lookX: -1 }],
  [4.8, 0.3, { lookY: -1, tilt: -0.14 }],
  [8.6, 0, { back: 1, tilt: -0.14, lean: -0.05, turn: 0, lookX: 0, lookY: 0 }],
  [13.4, 0, { back: 0, turn: -0.3, lookY: -1, lookX: -0.3, tilt: -0.12, lean: 0 }],
  [GOTIT + 0.5, 0.4, { lookY: 0.2, lookX: -1, turn: -0.6, tilt: 0, happy: 1, mOpen: 0.5 }],
  [17.6, 0, { back: 1, tilt: -0.14, lean: -0.05, turn: 0, lookX: 0, lookY: 0, happy: 0 }],
  // "well done, both of you": a hand on Amir's shoulder
  [19.0, 0.7, { aw: 1 }, 'soft'],
  [21.5, 0.2, { tilt: -0.04 }],
  [21.7, 0.34, { tilt: -0.14 }, 'back'],
])

const roverTrack = track<Rover>({ ...roverRest, y: G + 6, neck: 0.7, glow: 1, lid: 0, sweep: 1, dust: 0, lookX: 0.6 }, [
  [LOOP1 + 0.1, 0.3, { lookX: 0, lookY: 0 }],
  [LOOK, 0.5, { neck: 1, lookX: 0.4, lookY: -1, rot: -0.1 }, 'back'],
  // a blink up at it, as if in greeting
  [6.2, 0.07, { glow: 0.15, lid: 0.9 }], [6.3, 0.1, { glow: 1, lid: 0 }],
  [19.2, 0.07, { glow: 0.15, lid: 0.9 }], [19.3, 0.1, { glow: 1, lid: 0 }], [19.55, 0.07, { glow: 0.15, lid: 0.9 }], [19.65, 0.1, { glow: 1, lid: 0 }],
])

type Cast = { sari: Pose; amir: Pose; layla: Pose; rover: Rover }
const BLINKS = { sari: [0.9, 3.0, 14.0, 16.6], amir: [1.6, 3.4, 14.6, 17.0], layla: [2.4, 15.2] }

function castRaw(t: number): Cast {
  const sari = sariTrack(t)
  const amir = amirTrack(t)
  const layla = laylaTrack(t)
  const rover = roverTrack(t)
  // Wameed on his circle: behind them going right, in front of them coming back
  const a = ringAngle(t)
  rover.x = RING.x + RING.rx * Math.cos(a)
  rover.y = RING.y + RING.ry * Math.sin(a) - 4
  // at each end of the circle he whips round like a paper cut-out: a quick turn, a few frames long
  const f = 1 - 2 * E.io(ramp(t, TURN_R - 0.07, TURN_R + 0.07)) + 2 * E.io(ramp(t, TURN_L - 0.07, TURN_L + 0.07))
  rover.flip = Math.abs(f) < 0.14 ? (f < 0 ? -0.14 : 0.14) : f
  rover.roll = a * 9
  const moving = ramp(t, LOOP0, LOOP0 + 0.4) * (1 - ramp(t, LOOP1 - 0.5, LOOP1))
  rover.rot += -0.05 * moving
  // heads follow him round
  if (t < LOOK) {
    const follow = (p: Pose) => {
      p.turn = Math.max(-0.85, Math.min(0.85, (rover.x - p.x) / 380))
      p.lookX = p.turn
      p.lookY = rover.y > RING.y ? 0.6 : 0.1
    }
    follow(sari)
    follow(amir)
    follow(layla)
  }
  addHops(sari, t, [[JUMP, 2.2, 181, 0.01]])
  sari.sq *= laugh(t, 0.6, 3.6) * laugh(t, 10.2, 11.6)
  amir.sq *= laugh(t, 0.8, 3.8, 21)
  const front = t < SHOTS[2] || (t >= SHOTS[3] && t < SHOTS[4])
  if (front) {
    sari.blink = Math.max(sari.blink, blinkAt(BLINKS.sari, t))
    amir.blink = Math.max(amir.blink, blinkAt(BLINKS.amir, t))
    layla.blink = Math.max(layla.blink, blinkAt(BLINKS.layla, t))
  }
  // the teacher's hand comes to rest on Amir's shoulder
  const sk = skeleton('amir', amir)
  const sh = sk.world(sk.shB)
  layla.awx = sh.x + 2
  layla.awy = sh.y - 16
  // his eye pulses gently while they look
  if (t > SHOTS[2]) rover.glow *= 0.86 + 0.14 * Math.sin(t * 2.4)
  return { sari, amir, layla, rover }
}
const cast = (t: number) => smoothBends(castRaw, t)

function camera(t: number): Cam {
  const k = SHOTS.filter((s) => t >= s).length
  const u = (a: number, b: number) => E.soft(ramp(t, a, b))
  switch (k) {
    case 1:
      return { x: lerp(40, 0, u(0, 5)), y: 568, zoom: lerp(1, 1.06, u(0, 5)) }
    case 2: {
      // one move: from his lifted eye, up through the black, to what he is looking at
      const up = u(5.9, 7.9)
      return { x: lerp(-560, SKY_EARTH.x, up), y: lerp(696, SKY_EARTH.y + 20, up), zoom: lerp(2.3, 1.5, up) }
    }
    case 3:
      return { x: 0, y: 566, zoom: lerp(1.27, 1.31, u(8.6, 13.4)) }
    case 4:
      return { x: lerp(180, 170, u(13.4, 17.6)), y: lerp(606, 598, u(13.4, 17.6)), zoom: lerp(1.84, 1.98, u(13.4, 17.6)) }
    default:
      return { x: 0, y: lerp(566, 558, u(17.6, 24)), zoom: lerp(1.3, 1.34, u(17.6, 24)) }
  }
}

const BURSTS: Burst[] = [
  { t: JUMP, x: 40, y: G - 4, seed: 901, n: 9, power: 100 },
  { t: JUMP + 2.2, x: 40, y: G - 4, seed: 902, n: 11, power: 110 },
]
const PRINTS: Print[] = [
  { t: 0, x: -150, y: 838, who: 'sari' }, { t: 0, x: -96, y: 846, who: 'sari' }, { t: 0, x: 170, y: 856, who: 'amir' }, { t: 0, x: 226, y: 850, who: 'amir' },
  { t: 0, x: 420, y: 842, who: 'layla' }, { t: 0, x: 470, y: 850, who: 'layla' }, { t: 0, x: 18, y: G - 2, who: 'sari' }, { t: 0, x: 62, y: G - 6, who: 'sari' },
  { t: 0, x: 640, y: 812, who: 'layla' }, { t: 0, x: 690, y: 822, who: 'amir' }, { t: 0, x: 280, y: G + 10, who: 'amir' }, { t: 0, x: 322, y: G + 6, who: 'amir' },
]

function render(P: Painter, t: number) {
  const c = cast(t)
  const { sari, amir, layla, rover } = c
  const shot = SHOTS.filter((s) => t >= s).length
  P.cam = camera(t)
  drawSky(P)
  // how many of the towns on the night half are lit
  const towns = clamp01((t - TOWNS) / 2.6)
  if (shot === 2) {
    P.world()
    drawEarth(P, SKY_EARTH.x, SKY_EARTH.y, SKY_EARTH.r, t + 4, 0)
  } else if (shot === 3 || shot === 5) {
    // larger than in any other shot: the camera is low and tilted up
    P.screen()
    drawEarth(P, 690, 262, 196, t + 4, shot === 5 ? 1 : towns)
  }
  // (shot 1 keeps the Earth out of frame, so that shot 2's tilt up is the first sight of it)
  P.world()
  const [x0, x1] = frameRange(P)
  const people: [Who, Pose][] = [['layla', layla], ['sari', sari], ['amir', amir]]
  const a = ringAngle(t)
  const behind = rover.y < RING.y - 6 && t < LOOP1
  litWorld(P, {
    x0,
    x1,
    set: () => {
      drawGround(P, GROUND, x0, x1)
      drawTracks(P, RING.x, RING.y, RING.rx, RING.ry, Math.PI, a)
      drawPrints(P, PRINTS, t)
    },
    shadows: () => {
      roverShadow(P, rover)
      for (const [who, p] of people) personShadow(P, who, p, { basket: who === 'layla', basketOn: 'b' })
    },
    figures: () => {
      if (behind) drawRover(P, rover)
      for (const [who, p] of people) drawPerson(P, who, p, { basket: who === 'layla', basketOn: 'b' })
      if (!behind) drawRover(P, rover)
    },
    front: () => drawBursts(P, BURSTS, t),
  })
  drawEyeHalo(P, rover, 0.7)
  paperGrain(P)
}

const CUE = cuePhrases(9, [6])
const caption = (t: number) => phraseCaption('cue', CUE, [JUMP + 0.3, JUMP + 2.5], t)

const SCORE: Note[] = [
  pad(0, 24.4, D3, 0.045), pad(0, 24.4, A3, 0.03), pad(0.8, 24.4, Fs3, 0.022),
  // the circle: a little run of notes round and back
  ...[D5, E5, Fs5, A5, B5, A5, Fs5, E5, D5].map((f, i) => mallet(0.4 + i * 0.42, f, 0.08, 0.5)),
  bell(LOOK, A5, 0.07, 1.4),
  // the Earth
  bell(7.2, D5, 0.07, 3), bell(7.25, A5, 0.06, 3), bell(7.3, Fs5, 0.05, 3), mallet(7.2, D4, 0.1, 3),
  mallet(9.0, Fs4, 0.08), mallet(10.0, A4, 0.09),
  // the towns come on
  ...[D6, B5, A5, D6, Fs5, B5].map((f, i) => bell(TOWNS + i * 0.42, f, 0.045, 0.9)),
  bell(GOTIT, D6, 0.09, 1.6), mallet(GOTIT, D5, 0.14, 1.4), mallet(GOTIT, A4, 0.1, 1.4),
  { t: JUMP, f: A4, to: A5, d: 1.1, v: 0.09, wave: 'sine' }, mallet(JUMP, D5, 0.13), thud(JUMP + 2.2, 0.14),
  mallet(21.6, D4, 0.13, 2.6), mallet(21.6, A4, 0.09, 2.6), bell(21.64, D5, 0.07, 2.6), bell(21.68, Fs5, 0.06, 2.6),
]

export const scene9: SceneDef = { n: 9, duration: DURATION, shots: SHOTS, render, caption, joints: (t) => jointsOf(cast(t)), score: SCORE }
