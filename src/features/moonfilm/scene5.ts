/**
 * Scene 5 — «طَق!» — the picnic that cannot be eaten: five shots, about 24 seconds.
 *
 *  1  0.0  wide                    the blanket unrolls in one go and lies dead flat; a full second of nobody moving;
 *                                  Amir fans it with his hand — nothing stirs (no wind); Sari floats down to sit
 *  2  5.4  low on Amir             the Sun is shining… and the sky is black
 *  3  8.4  medium-wide, tilting    the orange goes up, and up, hangs, and comes back to Sari's hands on its own time
 *  4 14.0  slow push-in on Sari    he lifts his sandwich to eat… طَق! — flat against the glass, eyes crossed. Hold.
 *  5 19.2  wide (the picture)      everybody laughs; the teacher points at the rocket: we will eat there
 */
import { E, Painter, clamp01, lerp, paperGrain, ramp, track, type Cam } from './kit/core'
import { A3, A4, A5, B5, D3, D4, D5, D6, E5, E6, Fs3, Fs5, bell, mallet, pad, thud } from './kit/notes'
import { drawBasket, drawPerson, handAt, headAt, rest, type Pose } from './kit/people'
import { addHops, blinkAt, cuePhrases, frameRange, jointsOf, laugh, litWorld, personShadow, phraseCaption, smoothBends, type Note, type SceneDef } from './kit/stage'
import { drawBlanket, drawBursts, drawEarth, drawGround, drawOrange, drawPrints, drawRocket, drawSandwich, drawSky, type Burst, type Ground, type Print } from './kit/world'

const DURATION = 24
const SHOTS = [0, 5.4, 8.4, 14.0, 19.2]

// ── the set ───────────────────────────────────────────────────────────────────
const BLANKET = { x: 0, y: 796, w: 330, d: 50 }
const GROUND: Ground = {
  horizon: 646,
  cx: 100,
  curve: 6000,
  hills: [[-1200, 220, 36], [-620, 140, 22], [260, 200, 32], [900, 150, 24], [1500, 220, 34]],
  craters: [[-820, 716, 60], [-560, 900, 70], [560, 716, 50], [760, 930, 84], [-1100, 900, 60]],
  pebbles: [[-700, 800, 6], [-300, 880, 5], [480, 860, 6], [820, 780, 5], [150, 930, 6], [-940, 760, 5]],
}
const ROCKET = { x: 985, y: 744, s: 0.55 }

// ── beats ─────────────────────────────────────────────────────────────────────
const UNROLL = 0.8
const FLAT = 1.9 // from here on it does not move
const SIT = 3.7 // Sari hops and floats down to sit
const TOSS = 9.1
const AIR = 3.366
const CAUGHT = TOSS + AIR
const TAK = 17.2

/** Where the orange is: in Sari's hands, on its long slow way up and down, then resting on the blanket. */
function orange(t: number): { x: number; y: number; show: boolean } {
  if (t < SHOTS[2]) return { x: 0, y: 0, show: false }
  if (t >= SHOTS[3]) return { x: 92, y: 786, show: true }
  const s = t - TOSS
  let y = 716
  if (t < TOSS) y = lerp(lerp(716, 736, E.io(ramp(t, 8.72, 8.98))), 690, E.in(ramp(t, 8.98, TOSS)))
  else if (s < AIR) y = 690 - (502 * s - 150 * s * s)
  else y = lerp(lerp(700, 724, E.out(ramp(t, CAUGHT, CAUGHT + 0.2))), 714, E.io(ramp(t, CAUGHT + 0.2, CAUGHT + 0.7)))
  return { x: 6 * Math.sin(clamp01(s / AIR) * Math.PI), y, show: true }
}

const HANG = { ax: -9, ay: 70, bx: 9, by: 70 }
const LAP = { ax: -16, ay: 44, bx: 16, by: 44 }

const sariTrack = track<Pose>({ ...rest('sari', -150, 786), turn: 0.6, lookX: 0.8, lookY: 0.3, mOpen: 0.3, mWide: 0.8 }, [
  // 1 ─ he watches the blanket… then floats down onto it
  [FLAT, 0.3, { lookY: 0.9, turn: 0.4, mOpen: 0, wide: 0.4 }],
  [3.2, 0.4, { mOpen: 0.7, mWide: 1, mCurve: 1, wide: 0, lookY: 0.4 }],
  [SIT, 0.3, { turn: 0.2, ax: -44, ay: -20, bx: 44, by: -20, fax: -30, fay: 18, fbx: 30, fby: 18 }, 'out'],
  [SIT + 0.45, 0.45, { sit: 1, ...LAP, turn: 0, lookX: 0, lookY: 0, fax: -24, fay: 0, fbx: 24, fby: 0 }, 'soft'],
  // 3 ─ the orange
  [8.4, 0, { sit: 1, aw: 1, bw: 1, lookY: 0.5, mOpen: 0.5, mWide: 1, mCurve: 1, turn: 0, lookX: 0 }],
  [TOSS + 0.02, 0.26, { aw: 0, bw: 0 }, 'soft'],
  [TOSS - 0.05, 0.4, { ax: -12, ay: -52, bx: 12, by: -52, lookY: -0.6, tilt: -0.1, wide: 0.6, brow: 1, mWide: 0.2 }, 'back'],
  [TOSS + 0.8, 1.0, { ax: -18, ay: 26, bx: 18, by: 26, lookY: -1, tilt: -0.24 }, 'soft'],
  [TOSS + 2.0, 0.9, { tilt: -0.14, lookY: -0.8 }, 'soft'],
  [CAUGHT - 0.9, 0.7, { aw: 1, bw: 1, tilt: -0.04, lookY: -0.2 }, 'soft'],
  [CAUGHT + 0.05, 0.3, { lookY: 0.5, tilt: 0, wide: 0, happy: 1, mOpen: 0.9, mWide: 1 }],
  // 4 ─ the sandwich
  [14.0, 0, { aw: 0, bw: 0, ax: -14, ay: 40, bx: 26, by: 22, lookX: 0.5, lookY: 0.7, happy: 0, mOpen: 0, mCurve: 1, mWide: 0.7, brow: 0.3, wide: 0 }],
  [14.8, 0.4, { brow: 0.9, mOpen: 0.3, wide: 0.3 }],
  [15.7, 0.5, { mOpen: 1, mWide: 0.9, happy: 1, lookY: 0.2, lookX: 0, tilt: -0.05 }],
  [16.6, 0.6, { bx: -18, by: -26 }, 'in'],
  [TAK, 0.07, { lean: -0.1, happy: 0, cross: 1, wide: 0.8, brow: 1, mOpen: 0.25, mWide: 0.15, mCurve: 0, tilt: 0 }, 'out'],
  [TAK + 0.07, 0.5, { lean: 0 }, 'spring'],
  // 5 ─ he looks at it… and laughs with them
  [19.5, 0.6, { bx: 26, by: 20, cross: 0, wide: 0.3, lookX: 0.5, lookY: 0.7, brow: 0.4 }],
  [20.5, 0.3, { happy: 1, mOpen: 1, mWide: 1, mCurve: 1, lookX: 0, lookY: 0, wide: 0 }],
  [22.4, 0.4, { happy: 0, turn: 0.7, lookX: 1, mOpen: 0.5 }],
])
const sariX = (t: number) => lerp(-150, 0, ramp(t, SIT, SIT + 1.0))

const amirTrack = track<Pose>({ ...rest('amir', -430, 800), turn: 0.6, lookX: 0.8, lookY: 0.4, toe: 0.5, mOpen: 0.2, mWide: 0.6 }, [
  // 1 ─ not one edge moves. He fans it with his hand: still nothing.
  [FLAT + 0.1, 0.3, { lookY: 0.9, wide: 0.5, brow: 0.8, mOpen: 0 }],
  [2.2, 0.3, { lean: 0.26, crouch: 0.3, bx: 64, by: 40 }],
  [3.05, 0.4, { lean: 0, crouch: 0, bx: 46, by: -4, ax: -46, ay: -4, turn: 0.2, lookY: 0, brow: 1, mOpen: 0.4, mWide: 0.2 }, 'back'],
  [3.9, 0.4, HANG],
  [4.4, 0.6, { turn: 0.5, lookX: 0.8, lookY: -0.6, tilt: -0.14 }],
  // 2 ─ the Sun is shining… and the sky is black
  [5.4, 0, { turn: 0.7, lookX: 1, lookY: -0.3, blink: 0.6, tilt: -0.06, ax: -50, ay: 12, bx: 50, by: 12, mOpen: 0.3, mWide: 0.8, wide: 0, brow: 0.2 }],
  [6.3, 0.7, { turn: -0.1, lookX: 0, lookY: -1, tilt: -0.24, blink: 0, wide: 0.6, brow: 1, mOpen: 0.5, mWide: 0.2 }, 'soft'],
  [7.4, 0.5, { turn: -0.5, lookX: -0.6, ax: -58, ay: -6, bx: 58, by: -4 }, 'soft'],
  // 3 ─ he follows the orange up, and down
  [8.4, 0, { turn: 0.6, lookX: 0.8, lookY: 0.2, tilt: 0, ...HANG, wide: 0, mOpen: 0.3, mWide: 0.8 }],
  [TOSS + 0.1, 1.2, { lookY: -1, tilt: -0.24, wide: 0.6, mOpen: 0.5, mWide: 0.2 }, 'soft'],
  [TOSS + 1.0, 0.4, { bx: 50, by: -52, bPoint: 1 }, 'back'],
  [TOSS + 2.0, 1.2, { lookY: 0.1, tilt: -0.04, bPoint: 0, bx: 9, by: 70 }, 'soft'],
  [CAUGHT + 0.1, 0.3, { happy: 1, mOpen: 0.9, mWide: 1, mCurve: 1, wide: 0, ax: -40, ay: -50, bx: 40, by: -52 }, 'back'],
  // 5 ─ doubled up with laughing
  [19.2, 0, { happy: 1, mOpen: 1, mWide: 1, mCurve: 1, lean: 0.36, crouch: 0.3, ax: 26, ay: 44, bx: -22, by: 46, turn: 0.6, lookX: 0.8, lookY: 0.3, tilt: 0 }],
  [21.4, 0.5, { lean: 0.1, crouch: 0.05, ...HANG }],
  [22.5, 0.4, { happy: 0, turn: 0.8, lookX: 1, lookY: -0.1 }],
])

const laylaTrack = track<Pose>({ ...rest('layla', 440, 782), turn: -0.55, toe: -1, lookX: -0.8, lookY: 0.5, mOpen: 0, mWide: 0.7, mCurve: 0.8, bx: 12, by: 116, ax: -12, ay: 112 }, [
  // 1 ─ one push and it rolls itself out
  [0.3, 0.4, { crouch: 0.55, lean: -0.3, ax: -64, ay: 70 }],
  [0.74, 0.14, { ax: -92, ay: 52 }, 'out'],
  [1.25, 0.5, { crouch: 0, lean: 0, ax: -12, ay: 112, mOpen: 0.3, mWide: 1 }],
  [3.0, 0.6, { sit: 1, lean: -0.08 }, 'soft'],
  [3.55, 0.35, { bx: -50, by: 70, lean: -0.2 }],
  [4.1, 0.4, { bx: 12, by: 96, lean: -0.06, ax: -70, ay: 92 }],
  // 3
  [8.4, 0, { sit: 1, lean: -0.06, ax: -70, ay: 92, bx: 12, by: 96, lookY: 0.2 }],
  [TOSS + 0.2, 1.2, { lookY: -1, tilt: -0.2, mOpen: 0.4, mWide: 0.3 }, 'soft'],
  [TOSS + 2.0, 1.2, { lookY: 0.2, tilt: 0, mOpen: 0.3, mWide: 1 }, 'soft'],
  // 5 ─ laughing, a hand on the blanket's edge; then: we will eat in the rocket
  [19.2, 0, { happy: 1, mOpen: 0.8, mWide: 1, mCurve: 1, tilt: -0.06, lookY: 0.2 }],
  [21.6, 0.5, { happy: 0, turn: 0.5, lookX: 0.8, bx: 72, by: -6, bPoint: 1, mOpen: 0.5, tilt: 0 }, 'back'],
  [23.0, 0.4, { turn: -0.5, lookX: -0.8, mOpen: 0.3, happy: 1 }],
])
const laylaX = (t: number) => lerp(440, 396, E.io(ramp(t, 3.0, 3.6)))

type Cast = { sari: Pose; amir: Pose; layla: Pose }
const BLINKS = { sari: [2.6, 5.0, 8.6, 14.4, 21.9], amir: [1.4, 3.6, 8.9, 13.2, 22.9], layla: [2.0, 4.8, 9.6, 13.0, 22.0] }

function castRaw(t: number): Cast {
  const sari = sariTrack(t)
  const amir = amirTrack(t)
  const layla = laylaTrack(t)
  sari.x = sariX(t)
  sari.y = lerp(786, 802, ramp(t, SIT, SIT + 1.0))
  layla.x = laylaX(t)
  addHops(sari, t, [[SIT, 1.0, 46, 0.24]])
  // Amir fans the blanket: three quick waves of the hand
  const fan = ramp(t, 2.4, 2.5) * (1 - ramp(t, 2.95, 3.05))
  amir.by += 30 * fan * Math.sin((t - 2.4) * 21)
  amir.bx += 14 * fan * Math.cos((t - 2.4) * 21)
  // hands on the orange
  const o = orange(t)
  sari.awx = o.x - 15
  sari.awy = o.y + 8
  sari.bwx = o.x + 15
  sari.bwy = o.y + 8
  sari.sq *= laugh(t, 20.5, 22.4)
  amir.sq *= laugh(t, 19.2, 21.6, 21)
  layla.sq *= laugh(t, 19.2, 21.6, 19)
  sari.blink = Math.max(sari.blink, blinkAt(BLINKS.sari, t))
  amir.blink = Math.max(amir.blink, blinkAt(BLINKS.amir, t))
  layla.blink = Math.max(layla.blink, blinkAt(BLINKS.layla, t))
  return { sari, amir, layla }
}
const cast = (t: number) => smoothBends(castRaw, t)

function camera(t: number): Cam {
  const k = SHOTS.filter((s) => t >= s).length
  const u = (a: number, b: number) => E.soft(ramp(t, a, b))
  switch (k) {
    case 1:
      return { x: lerp(30, 10, u(0, 5.4)), y: 540, zoom: lerp(0.9, 0.94, u(0, 5.4)) }
    case 2:
      return { x: lerp(-560, -575, u(5.4, 8.4)), y: lerp(486, 462, u(5.4, 8.4)), zoom: lerp(2.0, 2.12, u(5.4, 8.4)) }
    case 3: {
      const up = u(TOSS, TOSS + 1.5) * (1 - u(TOSS + 1.9, CAUGHT))
      return { x: -20, y: lerp(520, 440, up), zoom: 0.84 }
    }
    case 4:
      // arrives at his helmet exactly on the bump, and stays
      return { x: lerp(0, 8, u(14.0, TAK)), y: lerp(650, 596, u(14.0, TAK)), zoom: lerp(1.5, 2.7, u(14.0, TAK)) }
    default:
      return { x: lerp(70, 60, u(19.2, 24)), y: 556, zoom: lerp(0.98, 1.02, u(19.2, 24)) }
  }
}

const BURSTS: Burst[] = [
  { t: SIT, x: -150, y: 786, seed: 501, n: 8, power: 90 },
  { t: TAK, x: 0, y: 630, seed: 502, n: 7, power: 70, spread: 2.4 },
]
const PRINTS: Print[] = [
  ...Array.from({ length: 12 }, (_, i): Print => ({ t: 0, x: 900 - i * 44 + (i % 2) * 14, y: 752 + i * 3 + (i % 2) * 8, who: i % 3 === 2 ? 'layla' : i % 3 ? 'amir' : 'sari' })),
  { t: 0, x: -172, y: 788, who: 'sari' }, { t: 0, x: -128, y: 784, who: 'sari' }, { t: 0, x: -452, y: 802, who: 'amir' }, { t: 0, x: -408, y: 798, who: 'amir' },
  { t: 0, x: -300, y: 846, who: 'amir' }, { t: 0, x: -40, y: 850, who: 'sari' }, { t: 0, x: 200, y: 852, who: 'layla' },
]

function render(P: Painter, t: number) {
  const { sari, amir, layla } = cast(t)
  P.cam = camera(t)
  drawSky(P)
  P.screen()
  if (P.cam.zoom < 1.3) drawEarth(P, 330, 180 - (P.cam.y - 540) * 0.5, 56, t + 18)
  P.world()
  const [x0, x1] = frameRange(P)
  const unroll = ramp(t, UNROLL, FLAT)
  const basketDown = t >= 3.85
  const o = orange(t)
  litWorld(P, {
    x0,
    x1,
    set: () => {
      drawGround(P, GROUND, x0, x1)
      drawPrints(P, PRINTS, t)
    },
    shadows: () => {
      P.shadow(ROCKET.x, ROCKET.y, () => drawRocket(P, 0, 0, ROCKET.s), 0, 3, 0.13)
      personShadow(P, 'layla', layla, { basket: !basketDown, basketOn: 'b' })
      personShadow(P, 'amir', amir)
      personShadow(P, 'sari', sari)
    },
    figures: () => {
      drawRocket(P, ROCKET.x, ROCKET.y, ROCKET.s)
      drawBlanket(P, BLANKET.x, BLANKET.y, BLANKET.w, BLANKET.d, Math.max(0.001, E.out(unroll)))
      if (basketDown) {
        P.ctx.save()
        P.ctx.translate(262, 706)
        drawBasket(P)
        P.ctx.restore()
      }
      if (o.show && t >= SHOTS[3]) drawOrange(P, o.x, o.y - 17, 17, 0.6)
      drawPerson(P, 'layla', layla, { basket: !basketDown, basketOn: 'b' })
      drawPerson(P, 'amir', amir)
      drawPerson(P, 'sari', sari, { pass: 'body' })
      if (o.show && t < SHOTS[3]) drawOrange(P, o.x, o.y - 12, 17, t * 1.1)
      drawPerson(P, 'sari', sari, { pass: 'arms' })
      if (t >= SHOTS[3]) {
        // the sandwich in his hand; on the bump it is flat against the glass
        const h = handAt('sari', sari, 'b')
        const m = headAt('sari', sari)
        const hit = ramp(t, TAK - 0.02, TAK + 0.04) * (1 - ramp(t, 19.5, 19.9))
        drawSandwich(P, lerp(h.x - 16, m.x, hit), lerp(h.y - 10, m.y + 34, hit), lerp(-0.25, 0, hit), hit)
        // three short ticks round the bump
        const tick = ramp(t, TAK, TAK + 0.05) * (1 - ramp(t, TAK + 0.7, TAK + 1.0))
        if (tick > 0 && P.light === 'day') {
          const c = P.ctx
          c.strokeStyle = `rgba(243,236,223,${tick})`
          c.lineWidth = 5
          c.lineCap = 'round'
          c.beginPath()
          for (const a of [-2.5, -1.57, -0.64]) {
            c.moveTo(m.x + Math.cos(a) * 46, m.y + 34 + Math.sin(a) * 34)
            c.lineTo(m.x + Math.cos(a) * 62, m.y + 34 + Math.sin(a) * 48)
          }
          c.stroke()
        }
      }
    },
    front: () => drawBursts(P, BURSTS, t),
  })
  paperGrain(P)
}

const CUE = cuePhrases(5, [4, 1])
const caption = (t: number) => phraseCaption('cue', CUE, [15.75, TAK, TAK + 0.9], t, 21.6)

const SCORE: Note[] = [
  pad(0, 24.4, D3, 0.045), pad(0, 24.4, A3, 0.03), pad(0.8, 24.4, Fs3, 0.022),
  // the blanket runs out, then: nothing
  ...[D6, B5, A5, Fs5, E5, D5].map((f, i) => mallet(UNROLL + i * 0.17, f, 0.08, 0.4)), thud(FLAT, 0.1),
  mallet(SIT, D5, 0.1), thud(SIT + 1.0, 0.1),
  bell(6.3, A5, 0.06, 2.0), bell(6.35, D6, 0.05, 2.0),
  // the orange: up, and up… and back in its own time
  ...[A4, D5, Fs5, A5, D6].map((f, i) => mallet(TOSS + i * 0.32, f, 0.09, 0.8)), bell(TOSS + 1.68, D6, 0.07, 1.8),
  ...[A5, Fs5, D5].map((f, i) => mallet(TOSS + 2.3 + i * 0.36, f, 0.07, 0.7)), mallet(CAUGHT, D4, 0.13),
  mallet(15.75, D4, 0.09), mallet(16.6, E5, 0.07, 0.4),
  // طَق!
  { t: TAK, f: E6, d: 0.09, v: 0.2, wave: 'triangle' }, thud(TAK, 0.22),
  ...[D5, Fs5, A5, Fs5, A5, D6].map((f, i) => mallet(19.4 + i * 0.2, f, 0.07, 0.4)),
  mallet(21.7, D4, 0.13, 2.2), mallet(21.7, A4, 0.09, 2.2), bell(21.74, Fs5, 0.06, 2.2),
]

export const scene5: SceneDef = { n: 5, duration: DURATION, shots: SHOTS, render, caption, joints: (t) => jointsOf(cast(t)), score: SCORE }
