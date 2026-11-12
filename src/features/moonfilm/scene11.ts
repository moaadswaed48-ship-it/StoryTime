/**
 * Scene 11 — «آثار أقدامنا» — footprints: four shots, about 27 seconds.
 *
 *  1  0.0  high and wide           the ground as a drawing: every step of the trip is written on it; Amir hops and adds
 *                                  two more; the teacher: they will stay a very long time
 *  2  4.6  close, on the dust      Sari's finger draws a smiling face, stroke by stroke: "this is for you, Wameed"
 *  3 11.0  medium, the ladder      three fingers… two… one… — and a wave
 *  4 15.4  one long pull-back      paper flame, a neat ring of dust; the rocket rises and shrinks to a dot while Wameed
 *                                  blinks steadily after it; then the still, empty Moon: prints, the face, one small rover
 *
 * "High angle" here means the horizon is almost out of the top of the frame: the dust is the page the figures stand on.
 */
import { moon } from '@/content/stories/moon'
import { E, Painter, TAU, lerp, paperGrain, poly, ramp, track, type Cam } from './kit/core'
import { A3, A4, A5, D3, D4, D5, D6, E5, Fs3, Fs4, Fs5, bell, mallet, pad, thud } from './kit/notes'
import { drawPerson, rest, type Pose } from './kit/people'
import { addHops, blinkAt, cuePhrases, frameRange, jointsOf, litWorld, personShadow, phraseCaption, roverShadow, smoothBends, type Note, type SceneDef } from './kit/stage'
import { drawEyeHalo, drawRover, roverRest, type Rover } from './kit/wameed'
import { drawBursts, drawEarth, drawFlame, drawGround, drawPrints, drawRocket, drawSky, drawTracks, type Burst, type Ground, type Print } from './kit/world'

const DURATION = 27
const SHOTS = [0, 4.6, 11.0, 15.4]

// ── the set ───────────────────────────────────────────────────────────────────
const GROUND: Ground = {
  horizon: 236,
  cx: 200,
  curve: 14000,
  hills: [[-1900, 300, 40], [-900, 220, 30], [-100, 160, 22], [900, 260, 36], [1900, 220, 30], [2800, 280, 38]],
  craters: [[-1500, 620, 90], [-560, 560, 60], [380, 640, 70], [1500, 700, 110], [-1100, 1360, 100], [900, 1420, 120], [-240, 760, 44], [2100, 1100, 90], [-2000, 1150, 110]],
  pebbles: [[-800, 760, 7], [-300, 1300, 6], [420, 1240, 6], [1200, 1180, 8], [-1400, 980, 6], [1700, 860, 7], [60, 520, 5], [-1900, 760, 6]],
}
const RX = 700
const RY = 990
const RS = 1.12
const FACE = { x: -40, y: 1104, rx: 54, ry: 36 } // the face in the dust
const RING = { x: -1180, y: 1210, rx: 430, ry: 74 }
const MAT = { x: -780, y: 884, w: 330, d: 50 } // where the blanket lay

// ── beats ─────────────────────────────────────────────────────────────────────
const AHOP = 1.4
const DRAW0 = 5.3 // the circle
const DOT1 = 7.3
const DOT2 = 7.75
const SMILE0 = 8.1
const SMILE1 = 9.0
const COUNT = [11.8, 12.8, 13.8, 14.7]
const FIRE = 15.9
const LIFT = 16.5

/** The tip of the stroke being drawn (where Sari's finger is). */
function tip(t: number): { x: number; y: number } {
  if (t < DOT1 - 0.2) {
    const a = -Math.PI / 2 + TAU * E.soft(ramp(t, DRAW0, 7.0))
    return { x: FACE.x + Math.cos(a) * FACE.rx, y: FACE.y + Math.sin(a) * FACE.ry }
  }
  if (t < DOT2 - 0.2) return { x: FACE.x - 18, y: FACE.y - 8 }
  if (t < SMILE0 - 0.15) return { x: FACE.x + 18, y: FACE.y - 8 }
  const a = Math.PI * (0.82 - 0.64 * E.soft(ramp(t, SMILE0, SMILE1)))
  return { x: FACE.x + Math.cos(a) * FACE.rx * 0.56, y: FACE.y + 2 + Math.sin(a) * FACE.ry * 0.56 }
}

/** How high the rocket has risen, how far it has drifted, and how small it has become. */
function flight(t: number) {
  const s = Math.max(0, t - LIFT)
  const shiver = ramp(t, FIRE, FIRE + 0.3) * (1 - ramp(t, LIFT + 0.4, LIFT + 1.2)) * Math.sin(t * 46) * 3.5
  return { x: RX + shiver + 16 * s * s, h: 44 * s * s, scale: RS * lerp(1, 0.03, E.in(ramp(t, LIFT + 0.6, 23.4))), power: ramp(t, FIRE, FIRE + 0.5) }
}

const HANG = { ax: -9, ay: 70, bx: 9, by: 70 }
const FEET = { fax: -24, fay: 0, fbx: 24, fby: 0 }

const sariTrack = track<Pose>({ ...rest('sari', -60, 1040), turn: 0.4, lookX: 0.6, lookY: 0.8 }, [
  [1.0, 0.4, { turn: -0.5, lookX: -0.8 }],
  [2.6, 0.4, { turn: 0.7, lookX: 1, lookY: 0 }],
  [3.6, 0.7, { crouch: 0.82, lean: 0.3, turn: 0.2, lookX: 0.2, lookY: 1, toe: 0.6, ax: -4, ay: 54 }],
  // 2 ─ drawing, the tip of his tongue out
  [4.6, 0, { crouch: 0.82, lean: 0.3, turn: 0.2, lookX: 0.2, lookY: 1, toe: 0.6, ax: -4, ay: 54, mOpen: 0.36, mWide: 0.3, mCurve: 0.6, brow: -0.3 }],
  [4.9, 0.4, { bw: 1 }, 'soft'],
  [SMILE1 + 0.1, 0.4, { bw: 0, bx: 20, by: 50, lean: 0.14, brow: 0.5, mOpen: 0.8, mWide: 1, mCurve: 1, lookY: 0.8 }, 'soft'],
  [9.7, 0.4, { turn: -0.75, lookX: -1, lookY: 0.5, ax: -56, ay: 26 }, 'back'],
  [10.3, 0.3, { happy: 1 }],
  // 3 ─ on the ground by the ladder, counting
  [11.0, 0, { ...HANG, crouch: 0, lean: 0, turn: -0.5, lookX: -0.8, lookY: 0.2, toe: 0, happy: 0, mOpen: 0.5, mWide: 1, mCurve: 1, brow: 0.3, bw: 0, bx: 9, by: 70 }],
  // the count is held up in front of the chest, where the fingers show against his clothes
  [COUNT[0] - 0.3, 0.3, { ax: 36, ay: 8, aPoint: 3 }, 'back'],
  [COUNT[1] - 0.1, 0.1, { aPoint: 2 }],
  [COUNT[2] - 0.1, 0.1, { aPoint: 1 }],
  [COUNT[3] - 0.1, 0.3, { aPoint: 0, ax: -54, ay: -44, bx: 52, by: -48, mOpen: 1, happy: 1 }, 'back'],
])
const sariX = (t: number) => (t < SHOTS[2] ? -60 : 580)

const amirTrack = track<Pose>({ ...rest('amir', 190, 1030), turn: -0.5, lookX: -0.6, lookY: 0.9, mOpen: 0.5, mWide: 1, mCurve: 1, brow: 0.6, ax: -62, ay: 26, aPoint: 1 }, [
  // 1 ─ look! our footprints, everywhere
  [0.6, 0.4, { turn: 0.5, lookX: 0.6, aPoint: 0, ax: -9, ay: 70, bx: 62, by: 26, bPoint: 1 }],
  [AHOP - 0.1, 0.3, { bPoint: 0, bx: 44, by: -30, ax: -44, ay: -30, fax: -34, fay: 16, fbx: 34, fby: 16, lookY: 0.3 }, 'out'],
  [AHOP + 0.84, 0.14, FEET],
  [AHOP + 1.1, 0.4, { ...HANG, lookY: 1, turn: 0, lookX: 0, happy: 1 }],
  [3.4, 0.4, { happy: 0, turn: -0.6, lookX: -0.8, lookY: 0.6 }],
  // 2 ─ he crouches to watch the face appear
  [4.6, 0, { crouch: 0.6, lean: -0.3, turn: -0.7, lookX: -0.8, lookY: 0.9, ax: -6, ay: 58, bx: 8, by: 58, mOpen: 0, mCurve: 0.6, toe: -0.6, happy: 0, aPoint: 0, bPoint: 0 }],
  [SMILE1 + 0.2, 0.3, { mOpen: 0.9, mWide: 1, mCurve: 1, happy: 1, ax: -30, ay: -30, bx: 30, by: -32, crouch: 0.3, lean: -0.1 }, 'back'],
  // 3 ─ on the ladder
  [11.0, 0, { ...HANG, crouch: 0, lean: 0, turn: -0.5, lookX: -0.8, lookY: 0.3, toe: 0, happy: 0, mOpen: 0.6, mWide: 1, mCurve: 1 }],
  [COUNT[0] - 0.24, 0.3, { bx: -36, by: 8, bPoint: 3 }, 'back'],
  [COUNT[1] - 0.06, 0.1, { bPoint: 2 }],
  [COUNT[2] - 0.06, 0.1, { bPoint: 1 }],
  [COUNT[3] - 0.06, 0.3, { bPoint: 0, ax: -50, ay: -48, bx: 54, by: -44, mOpen: 1, happy: 1 }, 'back'],
])
const amirX = (t: number) => (t < SHOTS[2] ? 190 : 838)

const laylaTrack = track<Pose>({ ...rest('layla', 520, 1004), turn: -0.55, toe: -0.6, lookX: -0.8, lookY: 0.5, mOpen: 0.2, mWide: 1, mCurve: 1, bx: 12, by: 110, ax: -12, ay: 112 }, [
  // "they will stay here a very long time"
  [2.5, 0.5, { ax: -66, ay: 30, mOpen: 0.5, lookY: 0.7 }, 'back'],
  [2.9, 0.14, { mOpen: 0.2 }], [3.1, 0.14, { mOpen: 0.55 }], [3.3, 0.14, { mOpen: 0.2 }], [3.5, 0.14, { mOpen: 0.5 }], [3.75, 0.2, { mOpen: 0.2 }],
  [3.9, 0.5, { ax: -12, ay: 112, tilt: 0.08 }],
  // 3 ─ in the doorway
  [11.0, 0, { turn: -0.5, lookX: -0.8, lookY: 0.4, tilt: 0, ax: -12, ay: 100, mOpen: 0.4 }],
  [COUNT[0] - 0.2, 0.3, { ax: -34, ay: -40, aPoint: 3 }, 'back'],
  [COUNT[1] - 0.02, 0.1, { aPoint: 2 }],
  [COUNT[2] - 0.02, 0.1, { aPoint: 1 }],
  [COUNT[3] - 0.02, 0.3, { aPoint: 0, ax: -46, ay: -44, happy: 1, mOpen: 0.7 }, 'back'],
])

const roverTrack = track<Rover>({ ...roverRest, x: -270, y: 1082, neck: 0.8, glow: 1, lid: 0, sweep: 1, dust: 0, lookX: 0.8, lookY: 0.4 }, [
  [1.6, 0.4, { lookX: -0.8 }],
  [3.0, 0.4, { lookX: 0.9, lookY: 0.2 }],
  // he rolls closer to see what the finger is making
  [8.6, 0.9, { x: -190, lookY: 0.8, lookX: 1 }, 'soft'],
  [9.5, 0.06, { glow: 0.15, lid: 0.9 }], [9.6, 0.1, { glow: 1, lid: 0 }], [9.82, 0.06, { glow: 0.15, lid: 0.9 }], [9.92, 0.1, { glow: 1, lid: 0 }],
  [10.3, 0.4, { lookY: -0.4, lookX: 0.6, neck: 1 }, 'back'],
  // he watches them go
  [15.4, 0, { x: -190, lookX: 1, lookY: -0.3, neck: 1 }],
  [LIFT + 0.6, 4.5, { lookY: -1, rot: -0.1 }, 'soft'],
  [25.2, 0.8, { lookY: 0.7, lookX: 0.9, rot: 0 }, 'soft'],
])

type Cast = { sari: Pose; amir: Pose; layla: Pose; rover: Rover }
const BLINKS = { sari: [0.7, 3.2, 6.4, 10.0, 12.3], amir: [2.9, 6.9, 12.0], layla: [1.2, 4.2, 12.5] }

function castRaw(t: number): Cast {
  const sari = sariTrack(t)
  const amir = amirTrack(t)
  const layla = laylaTrack(t)
  const rover = roverTrack(t)
  sari.x = sariX(t)
  amir.x = amirX(t)
  if (t >= SHOTS[2]) {
    sari.y = 1012
    amir.y = 1016
  }
  addHops(amir, t, [[AHOP, 1.0, 46, 0.24]])
  const p = tip(t)
  sari.bwx = p.x
  sari.bwy = p.y - 8
  sari.blink = Math.max(sari.blink, blinkAt(BLINKS.sari, t))
  amir.blink = Math.max(amir.blink, blinkAt(BLINKS.amir, t))
  layla.blink = Math.max(layla.blink, blinkAt(BLINKS.layla, t))
  // the wheels turn as he rolls up; then he blinks steadily after the rocket, once a second
  rover.roll = (rover.x + 270) * 0.06
  const s = t - (LIFT + 0.4)
  if (s > 0 && t < 24.6 && s % 1 < 0.13) {
    rover.glow = 0.15
    rover.lid = 0.9
  }
  return { sari, amir, layla, rover }
}
const cast = (t: number) => smoothBends(castRaw, t)

function camera(t: number): Cam {
  const k = SHOTS.filter((s) => t >= s).length
  const u = (a: number, b: number) => E.soft(ramp(t, a, b))
  switch (k) {
    case 1:
      return { x: lerp(90, 60, u(0, 4.6)), y: lerp(968, 960, u(0, 4.6)), zoom: lerp(0.78, 0.82, u(0, 4.6)) }
    case 2:
      return { x: lerp(-60, -90, u(4.6, 11)), y: lerp(1000, 1016, u(4.6, 11)), zoom: lerp(1.84, 2.06, u(4.6, 11)) }
    case 3:
      return { x: lerp(706, 700, u(11, 15.4)), y: lerp(716, 706, u(11, 15.4)), zoom: lerp(1.68, 1.8, u(11, 15.4)) }
    default: {
      // one long pull-back and rise with the rocket, ending on the empty ground
      const out = u(16.2, 23.6)
      return { x: lerp(330, 300, out), y: lerp(880, 620, out), zoom: lerp(1.0, 0.46, out) }
    }
  }
}

// ── the trip, written on the ground ───────────────────────────────────────────
const trail = (x0: number, y0: number, x1: number, y1: number, n: number, seed = 0): Print[] =>
  Array.from({ length: n }, (_, i) => {
    const k = i / (n - 1)
    return { t: 0, x: lerp(x0, x1, k) + ((i + seed) % 2) * 16, y: lerp(y0, y1, k) + ((i + seed) % 2 ? 9 : -5) + Math.sin(i * 1.7 + seed) * 5, who: (['sari', 'amir', 'layla'] as const)[(i + seed) % 3] }
  })
const PRINTS: Print[] = [
  ...trail(660, 1012, -420, 906, 26), // rocket → picnic
  ...trail(-1130, 884, -2300, 800, 26, 1), // picnic → the line
  ...trail(-2300, 846, -1150, 936, 26, 2), // …and back
  ...trail(-420, 950, 560, 1040, 22, 1), // back to the rocket
  ...trail(-1500, 1010, -300, 1070, 24, 2), // from Wameed's place
  ...trail(-420, 830, 300, 760, 14), ...trail(200, 1180, 700, 1090, 10, 1),
  ...trail(-1100, 1290, 760, 1250, 34, 2), ...trail(900, 1330, -500, 1420, 28), ...trail(-900, 1130, -200, 1210, 14, 1), ...trail(1250, 1150, 800, 1050, 10, 2),
  { t: 0, x: -82, y: 1042, who: 'sari' }, { t: 0, x: -38, y: 1038, who: 'sari' }, { t: 0, x: 168, y: 1032, who: 'amir' }, { t: 0, x: 212, y: 1028, who: 'amir' },
  { t: AHOP + 1.02, x: 170, y: 1040, who: 'amir' }, { t: AHOP + 1.02, x: 214, y: 1036, who: 'amir' },
  { t: 0, x: 500, y: 1006, who: 'layla' }, { t: 0, x: 540, y: 1002, who: 'layla' },
]
const BURSTS: Burst[] = [
  { t: AHOP + 1.0, x: 190, y: 1030, seed: 1101, n: 10, power: 110 },
  // the paper flame pushes a neat ring of dust outward; it lands and stops
  { t: FIRE + 0.15, x: RX - 60, y: RY + 6, seed: 1102, n: 16, dir: -2.1, power: 300, spread: 0.5 },
  { t: FIRE + 0.15, x: RX + 60, y: RY + 6, seed: 1103, n: 16, dir: 2.1, power: 300, spread: 0.5 },
  { t: FIRE + 0.6, x: RX - 60, y: RY + 6, seed: 1104, n: 12, dir: -2.1, power: 240, spread: 0.6 },
  { t: FIRE + 0.6, x: RX + 60, y: RY + 6, seed: 1105, n: 12, dir: 2.1, power: 240, spread: 0.6 },
]

/** Marks pressed into the dust: where the blanket lay, and the face Sari draws (a circle, two dots and a curve). */
function drawMarks(P: Painter, t: number) {
  if (P.light !== 'day') return
  const c = P.ctx
  const sk = MAT.d * 0.32
  c.fillStyle = '#cfcabd'
  c.fill(poly([MAT.x - MAT.w - sk, MAT.y + MAT.d, MAT.x + MAT.w - sk, MAT.y + MAT.d, MAT.x + MAT.w + sk, MAT.y - MAT.d, MAT.x - MAT.w + sk, MAT.y - MAT.d]))
  if (t < DRAW0) return
  c.strokeStyle = '#8e897e'
  c.fillStyle = '#8e897e'
  c.lineWidth = 8
  c.lineCap = 'round'
  c.beginPath()
  c.ellipse(FACE.x, FACE.y, FACE.rx, FACE.ry, 0, -Math.PI / 2, -Math.PI / 2 + TAU * E.soft(ramp(t, DRAW0, 7.0)))
  c.stroke()
  for (const [at, dx] of [[DOT1, -18], [DOT2, 18]] as const) {
    const k = E.back(ramp(t, at, at + 0.16))
    if (k > 0) {
      c.beginPath()
      c.ellipse(FACE.x + dx, FACE.y - 8, 6.5 * k, 5 * k, 0, 0, TAU)
      c.fill()
    }
  }
  const sm = E.soft(ramp(t, SMILE0, SMILE1))
  if (sm > 0) {
    c.beginPath()
    c.ellipse(FACE.x, FACE.y + 2, FACE.rx * 0.56, FACE.ry * 0.56, 0, Math.PI * 0.82, Math.PI * (0.82 - 0.64 * sm), true)
    c.stroke()
  }
}

function render(P: Painter, t: number) {
  const { sari, amir, layla, rover } = cast(t)
  const shot = SHOTS.filter((s) => t >= s).length
  P.cam = camera(t)
  drawSky(P)
  P.screen()
  if (shot === 4) drawEarth(P, 330, lerp(-400, 130, E.soft(ramp(t, 17.5, 23.6))), 56, t + 50)
  P.world()
  const [x0, x1] = frameRange(P)
  const f = flight(t)
  const gone = t >= SHOTS[3] // everyone is aboard and the door is shut
  const rocket = (inside?: () => void) => drawRocket(P, f.x, RY - f.h, f.scale, inside, gone ? 0 : 1)
  const seen = PRINTS.filter((p) => p.x > x0 && p.x < x1)
  litWorld(P, {
    x0,
    x1,
    set: () => {
      drawGround(P, GROUND, x0, x1)
      drawMarks(P, t)
      drawTracks(P, RING.x, RING.y, RING.rx, RING.ry)
      drawPrints(P, seen, t)
    },
    shadows: () => {
      // seen from higher up, the shadows lie shorter on the page
      if (f.h < 2600) P.shadow(f.x, RY, () => drawRocket(P, 0, 0, f.scale, undefined, gone ? 0 : 1), f.h, 1.9, 0.13)
      roverShadow(P, rover, 2.4)
      if (!gone) {
        if (shot < 3) personShadow(P, 'layla', layla, { basket: true, basketOn: 'b' }, 2.4)
        personShadow(P, 'amir', amir, {}, 2.4)
        personShadow(P, 'sari', sari, {}, 2.4)
      }
    },
    figures: () => {
      drawFlame(P, f.x, RY - f.h - 20 * f.scale, f.scale, f.power, t)
      rocket(
        shot === 3
          ? () => {
              P.ctx.scale(1 / RS, 1 / RS)
              drawPerson(P, 'layla', { ...layla, x: 6, y: 22, lift: 0 }, { basket: true, basketOn: 'b' })
            }
          : undefined,
      )
      if (!gone) {
        if (shot < 3) drawPerson(P, 'layla', layla, { basket: true, basketOn: 'b' })
        drawPerson(P, 'amir', amir)
        drawPerson(P, 'sari', sari)
      }
      drawRover(P, rover)
    },
    front: () => drawBursts(P, BURSTS, t),
  })
  drawEyeHalo(P, rover, 0.7)
  paperGrain(P)
}

/** The narrator's cue line, and the count from the scene's own text: «ثلاثة.. اثنان.. واحد.. انطلق!» */
const CUE = cuePhrases(11, [7])
const COUNT_WORDS = (moon.scenes[10].ar[3].match(/"([^"]+)"/)?.[1] ?? '').split(' ')
const caption = (t: number) => phraseCaption('cue', CUE, [2.6], t, 9.8) ?? phraseCaption('count', COUNT_WORDS, COUNT, t, 16.6)

const SCORE: Note[] = [
  pad(0, 27.4, D3, 0.045), pad(0, 27.4, A3, 0.03), pad(0.8, 16, Fs3, 0.022),
  mallet(AHOP, D5, 0.1), thud(AHOP + 1.0, 0.12), mallet(2.6, D4, 0.1, 1.6), mallet(2.6, A4, 0.07, 1.6),
  // the face: a long line, two dots, a curve
  { t: DRAW0, f: D5, to: A5, d: 1.7, v: 0.05, wave: 'sine' }, mallet(DOT1, Fs5, 0.1, 0.4), mallet(DOT2, Fs5, 0.1, 0.4),
  { t: SMILE0, f: A5, to: D6, d: 0.9, v: 0.05, wave: 'sine' }, bell(9.55, E5, 0.06, 0.3), bell(9.87, E5, 0.06, 0.3),
  mallet(COUNT[0], A4, 0.16), mallet(COUNT[1], Fs4, 0.16), mallet(COUNT[2], D4, 0.16), mallet(COUNT[3], D5, 0.16),
  { t: LIFT, f: D4, to: D6, d: 6.5, v: 0.06, wave: 'sine' }, thud(FIRE, 0.18),
  // Wameed blinks after them, once a second, fainter each time
  ...Array.from({ length: 8 }, (_, i) => bell(LIFT + 0.4 + i, A5, 0.06 - i * 0.005, 0.5)),
  mallet(24.8, D4, 0.1, 2.4), bell(24.84, A4, 0.05, 2.4),
]

export const scene11: SceneDef = { n: 11, duration: DURATION, shots: SHOTS, render, caption, joints: (t) => jointsOf(cast(t)), score: SCORE }
