/**
 * Style test (b): one ten-second film shot. A boy sets the last block on his tower, it wobbles, it holds, and the
 * room celebrates. Acting on three characters, a camera that pushes in as the tension rises and eases back for
 * the cheer, and three short caption lines. The characters are drawn "on twos" (12 drawings a second, `P.held`);
 * the camera and the bunting move on every frame. No words are in the picture: captions are laid over it.
 */
import { castById } from '@/cast/cast'
import { drawFigure, drawFigureShadow } from '../figure/draw'
import { gesturePose } from '../figure/gestures'
import { FACES, mixPose, rest, type Pose } from '../figure/pose'
import { rigOf } from '../figure/rig'
import { E, clamp01, ramp, track, type Cam } from '../kit/core'
import { addHops, blinkAt, smoothBends } from '../kit/stage'
import { kindergarten, kindergartenFront } from '../places/places'
import { block, chair, openBook, table, tableTop } from '../places/things'
import type { Scene } from '../scene'

const GY = 940
const SC = 660 / 540
const TABLE = { x: 830, y: GY + 16, w: 380, h: 196 }
const TOP = TABLE.y - tableTop(TABLE.h)
const BW = 74
const BH = 50
const COLORS = ['#e2674a', '#f2c94c', '#3f8f8a', '#7a4f9a', '#5f9a52', '#e98a3a']
const MARKS = ['dot', 'bar', 'star', 'dot', 'bar', 'star'] as const
const OFFS = [0, 7, -5, 6, -3, 3]
const N = 6
const TX = TABLE.x + 10
const RELEASE = 2.55

/** How far the tower leans at time t (radians at its top). It is pushed as the hand lets go, sways, and settles. */
const sway = (t: number) => (t < RELEASE ? 0 : 0.23 * Math.exp(-(t - RELEASE) * 0.42) * Math.sin((t - RELEASE) * 5.1) * (1 - ramp(t, 5.0, 5.9)))

/** Where block `i` is: each block leans a little more than the one under it. */
function blockAt(i: number, t: number) {
  const s = sway(t)
  let x = TX
  let y = TOP
  let rot = 0
  for (let k = 0; k <= i; k++) {
    rot = s * Math.pow((k + 1) / N, 1.4)
    if (k < i) {
      x += -Math.sin(rot) * -BH + (OFFS[k + 1] - OFFS[k])
      y -= Math.cos(rot) * BH
    }
  }
  return { x: x + OFFS[0], y, rot }
}

const yousef = castById('yousef')
const lulu = castById('lulu')
const salma = castById('salma')

const topRest = blockAt(N - 1, 0)
const concentrate: Partial<Pose> = { smile: -0.15, open: 0.16, mWide: 0.2, cheek: 0, brow: -0.25, browTilt: -0.3, lids: 0.16, wide: 0, wob: 0 }
const Y0: Pose = { ...rest(548, GY + 4), ...concentrate, turn: 0.6, lookX: 0.85, lookY: -0.55, nod: -0.3, lean: 0.07, hipx: 0.2, lW: 1, lWx: 690, lWy: topRest.y - 210, lHand: 6, rx: 0.3, ry: 0.78, rHand: 5, toe: 0.4 }
const yKeys = track<Pose>(Y0, [
  [0.25, 2.0, { lWx: topRest.x - 44, lWy: topRest.y - BH / 2 - 4, lean: 0.13, hipx: 0.34, lift: 0.014, lookY: -0.7 }, 'io'],
  [RELEASE - 0.05, 0, { lHand: 5 }],
  [RELEASE, 0.5, { lWx: topRest.x - 120, lWy: topRest.y - 30, lean: 0.03, hipx: 0.05, lift: 0 }, 'out'],
  [3.0, 0.3, { ...FACES.worry, wide: 0.7, lW: 0, lx: 0.66, ly: 0.1, rB: 1, rBx: 0.4, rBy: 0.46, lean: -0.06, hipx: -0.2, crouch: 0.1, lookY: -0.5, tilt: -0.05 }, 'out'],
  [4.2, 0.4, { lx: 0.6, ly: -0.04, rBx: 0.56, rBy: 0.36, crouch: 0.16, open: 0.25, mWide: 0.2 }],
  [5.5, 0.35, { ...FACES.surprise, open: 0.3, crouch: 0.05, lean: 0, lookY: -0.6 }],
])
const L0: Pose = { ...rest(1130, GY + 56), ...FACES.curious, sit: 1, turn: -0.55, lookX: -0.85, lookY: -0.8, nod: -0.5, tilt: 0.08, rB: 1, rBx: 0.5, rBy: 0.9, lB: 1, lBx: 0.5, lBy: 0.9 }
const lKeys = track<Pose>(L0, [
  [3.0, 0.25, { ...FACES.surprise, rB: 0, lB: 0, rH: 1, rHx: 1.3, rHy: 1.25, lH: 1, lHx: 1.3, lHy: 1.25, tilt: -0.05, lean: 0.05 }, 'out'],
  [3.0, 0, { rHand: 5, lHand: 5 }],
  [5.6, 0.4, { open: 0.3, wide: 0.6 }],
  [6.25, 0.3, { rH: 0, lH: 0, lean: 0, ...FACES.laugh }],
])
const S0: Pose = { ...rest(1420, GY - 4), ...FACES.calm, sit: 1, seat: 0.5, smile: 0.5, turn: -0.2, lookY: 0.8, nod: 0.45, rB: 1, rBx: 1.0, rBy: 0.98, lB: 1, lBx: 1.0, lBy: 0.98, rHand: 6, lHand: 6, lfx: -0.03, rfx: -0.03, toe: -0.5 }
const sKeys = track<Pose>(S0, [
  [1.3, 0.5, { turn: -0.6, lookX: -0.85, lookY: -0.15, nod: 0, ...FACES.smile, tilt: -0.06 }],
  [3.05, 0.3, { ...FACES.curious, brow: 1, wide: 0.6, lean: -0.07, open: 0.2, tilt: 0 }, 'out'],
  [5.6, 0.4, { open: 0.1, lean: -0.04 }],
  [6.3, 0.4, { ...FACES.delight, open: 0.5, lean: 0.02, tilt: 0.1, nod: -0.2 }, 'back'],
  [8.6, 0.6, { ...FACES.smile, tilt: 0.04 }],
])

function yousefAt(t: number): Pose {
  let p = yKeys(t)
  if (t > 3 && t < 5.9) {
    // his eyes and his hovering hands follow the tower
    const s = sway(t) / 0.1
    p.lookX = 0.85 - s * 0.3
    p.lx += s * 0.05
    p.hipx += s * 0.08
  }
  if (t >= 6.15) {
    const g = gesturePose('cheer', t - 6.15, p.x, p.y)
    p = mixPose(p, g, E.out(ramp(t, 6.15, 6.4)))
    p.turn = 0.6 - 0.25 * ramp(t, 6.15, 6.6) + 0.5 * ramp(t, 8.7, 9.3)
    p.lookX = 0.6 * ramp(t, 8.7, 9.3)
    p.toe = 0.4 * (1 - ramp(t, 6.15, 6.5))
    if (t > 8.75) Object.assign(p, mixPose(p, { ...p, ...FACES.delight, open: 0.3, rx: 0.5, ry: 0.4, rHand: 0, lx: 0.2, ly: 0.9 }, ramp(t, 8.75, 9.2)))
  }
  p.blink = Math.max(p.blink, blinkAt([1.1, 5.95, 9.4], t))
  return p
}
function luluAt(t: number): Pose {
  let p = lKeys(t)
  if (t >= 6.3) {
    const g = gesturePose('clap', t - 6.3 + 0.1, p.x, p.y)
    p = mixPose(p, { ...g, sit: 1, turn: -0.4, lookX: -0.6, lookY: -0.6, nod: -0.4 }, E.out(ramp(t, 6.3, 6.6)))
    p.sit = 1
    if (t > 8.9) p = mixPose(p, { ...L0, ...FACES.smile, x: p.x, y: p.y }, ramp(t, 8.9, 9.5))
    p.sit = 1
  }
  p.blink = Math.max(p.blink, blinkAt([0.7, 2.2, 7.9], t))
  return p
}
function salmaAt(t: number): Pose {
  const p = sKeys(t)
  if (t > 6.6 && t < 8.6) p.nod += 0.3 * Math.sin((t - 6.6) * 6) * (1 - ramp(t, 8.0, 8.6))
  p.blink = Math.max(p.blink, blinkAt([0.5, 2.6, 4.6, 7.2, 9.1], t))
  return p
}

const cam = track<Cam>({ x: 960, y: 566, zoom: 1.04 }, [
  [0.0, 5.6, { x: 800, y: 606, zoom: 1.44 }, 'io'],
  [6.1, 2.4, { x: 900, y: 560, zoom: 1.16 }, 'io'],
])

export const shotTower: Scene = {
  id: 'shot-tower',
  title: 'The last block: the tower wobbles, holds, and everyone cheers',
  W: 1920,
  H: 1080,
  duration: 10,
  shots: [0],
  captions: [
    { from: 0.5, to: 2.7, text: { en: 'One more block. The very last one.', ar: 'مكعب آخر. المكعب الأخير.', he: 'עוד קובייה אחת. האחרונה.', da: 'Én klods til. Den allersidste.' } },
    { from: 3.1, to: 5.7, text: { en: 'The tower wobbled…', ar: 'تمايل البرج…', he: 'המגדל התנדנד…', da: 'Tårnet vaklede…' } },
    { from: 6.3, to: 9.7, text: { en: '…and then it stood still!', ar: '…ثم ثبت في مكانه!', he: '…ואז נעמד יציב!', da: '…og så stod det stille!' } },
  ],
  render(P, t) {
    const c = P.ctx
    const ta = P.held(t)
    const k = cam(t)
    // a breath of hand-held life, and a tiny shake as the tower sways
    P.cam = { x: k.x + Math.sin(t * 0.7) * 4, y: k.y + Math.sin(t * 0.9 + 1) * 3 + sway(t) * 14, zoom: k.zoom }
    kindergarten(P, t, { gy: GY, shelfX: 1640, windowX: 520 })

    // the teacher on her chair, a book open on her knees
    const sp = salmaAt(ta)
    chair(P, sp.x + 30, GY - 6, 128, '#5f8fa8', -1)
    drawFigure(P, salma, sp, { scale: SC })
    const g = rigOf(salma, P.style)
    c.save()
    c.translate(sp.x - 4 + sp.lean * 160, sp.y - (g.footH + sp.seat * (g.legU + g.legL) + g.legW0 * 0.5) * SC)
    c.rotate(-0.05 + sp.lean)
    openBook(P, 84, '#e2674a')
    c.restore()

    // the table and the tower
    table(P, TABLE.x, TABLE.y, TABLE.w, TABLE.h, '#d69a62', 4)
    const placed = ta >= RELEASE
    for (let i = 0; i < (placed ? N : N - 1); i++) {
      const b = blockAt(i, ta)
      block(P, b.x - BW / 2, b.y, BW, BH, COLORS[i], b.rot, MARKS[i])
    }

    // Yousef, the last block in his hand until he lets go
    const yp = smoothBends(P.style, yousef, yousefAt, ta, SC)
    drawFigureShadow(P, yousef, yp, { scale: SC })
    drawFigure(P, yousef, yp, { scale: SC, hold: placed ? undefined : { l: (Q) => block(Q, -BW / 2 + 12, BH / 2 + 6, BW, BH, COLORS[N - 1], 0.03, MARKS[N - 1]) } })

    // Lulu on the rug at the front
    const lp = luluAt(ta)
    P.groundShadow(lp.x, lp.y, 90, 16)
    drawFigure(P, lulu, lp, { scale: SC })

    kindergartenFront(P, t, GY)
    void clamp01
    void addHops
  },
}
