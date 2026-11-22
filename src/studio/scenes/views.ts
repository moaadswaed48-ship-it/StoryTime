/**
 * Proof sheet "views and actions": one child, one adult and one elder, each drawn by the same builder from the
 * front, in three-quarter view and from the side, then walking, sitting, kneeling to someone smaller, handing
 * something over and hugging. In motion (the sheet is also a four-second loop) the walkers walk on the spot with
 * the ground sliding under them, which shows that planted feet do not slide.
 */
import { castById } from '@/cast/cast'
import type { Sheet } from '@/cast/sheet'
import { drawFigure, drawFigureShadow, jointAt, type FigureOpts, type Held } from '../figure/draw'
import { FACES, rest, type Pose } from '../figure/pose'
import { rigOf } from '../figure/rig'
import { GAITS, strideOf, walkPose, withCane, type Gait } from '../figure/walk'
import { Painter, blob, circle, curve, cutRect, ellipse, rrect, wobble } from '../kit/core'
import { fruit } from '../places/things'
import { flower } from '../places/nature'
import type { Scene } from '../scene'

const INK = '#3a2238'
export function label(P: Painter, text: string, x: number, y: number, size = 26, align: CanvasTextAlign = 'center', alpha = 0.8) {
  const c = P.ctx
  c.save()
  c.globalAlpha = alpha
  c.fillStyle = INK
  c.font = `600 ${size}px 'Inter', system-ui, sans-serif`
  c.textAlign = align
  c.fillText(text, x, y)
  c.restore()
}
/** A strip of floor for a row of figures to stand on: a hand-cut band of colour, slightly uneven. */
export function floor(P: Painter, x0: number, x1: number, y: number, h: number, color: string, seed: number) {
  const pts = wobble([x0, y - h * 0.34, (x0 + x1) / 2, y - h * 0.5, x1, y - h * 0.34, x1 + 14, y + h * 0.5, (x0 + x1) / 2, y + h * 0.62, x0 - 14, y + h * 0.5], 7, seed)
  const b = blob(pts)
  P.flat(b, color)
  P.speckle(b, color, seed, [x0, y - h * 0.6, x1 - x0, h * 1.3], 0.8)
}
/** A plain wooden stool, `h` high, seen a little from above: it reads from any side. */
export function stool(P: Painter, x: number, y: number, h: number, w: number, color = '#c98f5c') {
  P.groundShadow(x, y, w * 0.62, h * 0.1)
  const leg = '#a9744a'
  for (const k of [-0.34, 0.34]) P.shape(rrect(x + k * w - w * 0.06, y - h * 0.94, w * 0.12, h * 0.94, 4), leg, { shade: 0.5 })
  P.shape(cutRect(x - w * 0.42, y - h * 0.5, w * 0.84, h * 0.09, 3, 5, 1), leg, { shade: 0.3 })
  P.shape(ellipse(x, y - h * 0.94, w * 0.56, h * 0.13), color, { shade: 0.7 })
  P.shape(ellipse(x, y - h, w * 0.56, h * 0.13), mixPale(color), { shade: 0.5 })
}
const mixPale = (c: string) => c.replace('#c98f5c', '#dba872')

let SC = 0.82
const S = (id: string) => castById(id)
function fig(P: Painter, s: Sheet, p: Pose, o: FigureOpts = {}, shadow = 0.7) {
  const opts = { scale: SC, ...o }
  if (opts.pass !== 'arms') drawFigureShadow(P, s, p, opts, shadow)
  drawFigure(P, s, p, opts)
}
const seatH = (P: Painter, s: Sheet, seat: number) => {
  const g = rigOf(s, P.style)
  return (g.footH + seat * (g.legU + g.legL) - g.legW0 * 0.2) * SC
}

type Who = { id: string; small: string; gait: Gait; cane?: boolean; give: 'orange' | 'flower' | 'book' }
const WHO: Who[] = [
  { id: 'noor', small: 'lulu', gait: GAITS.trot, give: 'flower' },
  { id: 'karim', small: 'maya', gait: GAITS.walk, give: 'orange' },
  { id: 'nabil', small: 'sami', gait: GAITS.elder, cane: true, give: 'book' },
]
const TINTS = ['#f0d9a8', '#cfe0d2', '#f1cfc4', '#d7d3ea']
const CW = 600
const RH = 640

const gift = (kind: Who['give']): Held => (Q, h) => {
  if (kind === 'orange') fruit(Q, 0, -h.r * 0.2, h.r * 1.1, '#f59a2c', true)
  else if (kind === 'flower') {
    Q.ctx.rotate(0.2)
    flower(Q, 0, h.r * 0.9, h.r * 4.2, '#e2674a', 0.12)
  } else {
    Q.ctx.rotate(-0.1)
    Q.shape(cutRect(-h.r * 1.5, -h.r * 2.2, h.r * 3, h.r * 2.6, 3, 4, 1), '#3f8f8a', { shade: 0.5 })
    Q.flat(rrect(-h.r * 1.2, -h.r * 2.0, h.r * 0.3, h.r * 2.2, 1), '#cfe9e2')
  }
}

function block(P: Painter, t: number, w: Who, y0: number, row: number) {
  const s = S(w.id)
  // each row is drawn as large as its cells allow: a child's row is enlarged so it can be read as well as a grown-up's
  SC = Math.min(1.16, 450 / rigOf(s, P.style).H)
  const small = S(w.small)
  const g = rigOf(s, P.style)
  const gs = rigOf(small, P.style)
  const y1 = y0 + 500
  const y2 = y0 + RH + 500
  const cx = (i: number) => i * CW + CW / 2
  const shortOne = g.H < 400
  for (let i = 0; i < 4; i++) {
    floor(P, i * CW + 30, (i + 1) * CW - 30, y1 + 8, 80, TINTS[(i + row) % 4], 10 + i + row * 7)
    floor(P, i * CW + 30, (i + 1) * CW - 30, y2 + 8, 80, TINTS[(i + row + 2) % 4], 30 + i + row * 7)
  }
  const blinkNow = t > 0 && t % 2.2 < 0.14 ? 1 : 0
  const cane = w.cane ? undefined : false

  // ── the three views ──
  const breath = Math.sin(t * 1.6) * 0.008
  fig(P, s, { ...rest(cx(0), y1), ...FACES.smile, hipx: 0.24, lean: -0.035, tilt: 0.04, sq: 1 + breath, blink: blinkNow, lx: 0.1, ly: 0.95, rB: w.cane ? 0 : 0.85, rBx: 1.0, rBy: 0.92 }, { cane })
  label(P, 'front', cx(0), y1 + 86, 28)
  fig(P, s, { ...rest(cx(1), y1), ...FACES.smile, spin: 0.66, turn: -0.25, hipx: 0.12, lookX: -0.4, sq: 1 + breath, blink: blinkNow, lz: 0.04 }, { cane })
  label(P, 'three-quarter', cx(1), y1 + 86, 28)
  fig(P, s, { ...rest(cx(2), y1), ...FACES.calm, smile: 0.6, spin: Math.PI / 2, sq: 1 + breath, blink: blinkNow, arc: -0.1 }, { cane })
  label(P, 'side', cx(2), y1 + 86, 28)

  // ── walking: on the spot when the sheet plays, with marks on the ground sliding back at the walker's own speed ──
  const stride = strideOf(P, s, SC, w.gait)
  const period = w.cane ? 2.4 : w.gait === GAITS.trot ? 0.86 : 1.1
  const phase = t === 0 ? (w.cane ? 0.1 : 0.06) : t / period
  const wx = cx(3) - 20
  for (let i = -3; i <= 3; i++) {
    const mx = wx + (((i * 130 - phase * stride) % 780) + 780 + 390) % 780 - 390
    if (Math.abs(mx - wx) < 250) P.flat(ellipse(mx, y1 + 30, 16, 4), '#b89a6a', 0.55)
  }
  let wp = walkPose({ ...rest(wx, y1), ...FACES.smile, spin: Math.PI / 2, lookX: 0.3, blink: blinkNow }, phase, w.gait)
  let tip
  if (w.cane) {
    const c2 = withCane(P, s, wp, phase, w.gait, SC)
    wp = c2.pose
    tip = c2.tip
  }
  fig(P, s, wp, { caneTip: tip, cane })
  label(P, w.cane ? 'a slow walk with a stick' : 'walking', cx(3), y1 + 86, 28)

  // ── sitting: on a stool and on the ground ──
  const sx = cx(0)
  const sh = seatH(P, s, 0.5)
  stool(P, sx - 120, y2 - 6, sh, sh * 0.9)
  fig(P, s, { ...rest(sx - 120, y2 - 2), ...FACES.smile, spin: 0.72, sit: 1, seat: 0.5, turn: -0.2, rB: 1, rBx: 0.5, rBy: 1.05, lB: 1, lBx: 0.6, lBy: 1.02, arc: 0.2, blink: blinkNow }, { cane: false }, 0.3)
  if (shortOne) fig(P, s, { ...rest(sx + 150, y2 + 10), ...FACES.delight, open: 0.3, sit: 1, seat: 0, rB: 1, rBx: 0.7, rBy: 1.0, lx: 0.5, ly: -0.4, lHand: 5, tilt: 0.08, blink: blinkNow }, { cane: false }, 0.25)
  else fig(P, s, { ...rest(sx + 150, y2 + 10), ...FACES.smile, spin: -Math.PI / 2, sit: 1, seat: 0, rfz: 0.4, lfz: 0.32, lfy: 0.02, pitch: -0.12, rx: 0.1, ry: 0.86, rz: -0.34, lx: 0.1, ly: 0.86, lz: -0.3, rHand: 7, lHand: 7, arc: 0.3, turn: 0.3, blink: blinkNow }, { cane: false }, 0.25)
  label(P, 'sitting', cx(0), y2 + 86, 28)

  // ── kneeling to someone smaller ──
  const kx = cx(1) - 70
  const cxs = kx + (g.legU * 0.9 + g.chestD * 1.5 + gs.shW) * SC
  const cp: Pose = { ...rest(cxs, y2 + 4), ...FACES.delight, open: 0.3, spin: -Math.PI / 2, turn: 0.1, lookY: shortOne ? -0.2 : 0.1, lz: 0.3, ly: 0.7, lHand: 5, blink: blinkNow }
  const kneel: Pose = { ...rest(kx, y2), ...FACES.smile, spin: Math.PI / 2, rKneel: 1, pitch: 0.16, arc: 0.2, nod: 0.2, lookY: 0.3, blink: blinkNow }
  const shC = jointAt(P, small, cp, 'shL', SC)
  const shC2 = jointAt(P, small, cp, 'shR', SC)
  kneel.rW = 1
  kneel.rWx = shC.x - gs.armW0 * SC * 0.5
  kneel.rWy = shC.y + gs.armU * SC * 0.5
  kneel.rWd = 0.3
  kneel.rHand = 7
  kneel.lW = 1
  kneel.lWx = shC2.x - gs.armW0 * SC * 0.5
  kneel.lWy = shC2.y + gs.armU * SC * 0.6
  kneel.lWd = -0.3
  fig(P, s, kneel, { cane: false, pass: 'body' }, 0.5)
  fig(P, small, cp)
  fig(P, s, kneel, { cane: false, pass: 'arms' })
  label(P, w.id === 'noor' ? 'kneeling to a little one' : 'kneeling to a child', cx(1), y2 + 86, 28)

  // ── handing something over ──
  const gx = cx(2) - 96
  const rxp = cx(2) + 96 + (shortOne ? -10 : 0)
  const giveY = y2 - Math.min(g.H * 0.56, gs.H * 0.74) * SC
  const midX = (gx + rxp) / 2
  const giver: Pose = { ...rest(gx, y2), ...FACES.smile, spin: Math.PI / 2, pitch: shortOne ? 0 : 0.1, lookY: shortOne ? -0.3 : 0.4, nod: shortOne ? -0.2 : 0.2, rW: 1, rWx: midX - 12, rWy: giveY, rWd: 0.2, rHand: 6, lz: -0.1, hipx: 0, blink: blinkNow, rfz: 0.1, lfz: -0.08 }
  const taker: Pose = { ...rest(rxp, y2), ...FACES.delight, open: 0.35, spin: -Math.PI / 2, lookY: shortOne ? 0.2 : -0.5, nod: shortOne ? 0.1 : -0.3, lW: 1, lWx: midX + 30, lWy: giveY + 26, lWd: 0.25, lHand: 7, lWrist: -0.5, rW: 1, rWx: midX + 40, rWy: giveY + 34, rWd: -0.2, rHand: 7, blink: blinkNow, tip: shortOne ? 0 : 0.5 }
  fig(P, s, giver, { cane: false, hold: { r: gift(w.give) } })
  fig(P, small, taker)
  label(P, 'handing over', cx(2), y2 + 86, 28)

  // ── a hug ──
  const hx = cx(3) - 56
  const bigKneels = !shortOne && !w.cane
  const hugBig: Pose = bigKneels
    ? { ...rest(hx, y2), ...FACES.smile, cheek: 1, smile: 1, blink: 1, spin: Math.PI / 2, rKneel: 1, pitch: 0.2, arc: 0.35, tilt: 0, nod: 0.2 }
    : { ...rest(hx, y2), ...FACES.smile, cheek: 1, smile: 1, blink: 1, spin: Math.PI / 2, pitch: shortOne ? 0.08 : 0.34, crouch: shortOne ? 0 : 0.22, arc: 0.4, nod: 0.3, rfz: 0.12, lfz: -0.1 }
  const gap = (g.chestD + gs.chestD) * SC * 1.05 + (bigKneels ? g.legU * SC * 0.1 : 0)
  const hugSmall: Pose = { ...rest(hx + gap + (bigKneels ? g.chestD * SC * 0.5 : shortOne ? 0 : g.torso * SC * 0.34), y2 + 4), ...FACES.smile, cheek: 1, smile: 1, blink: 1, flush: 0.5, spin: -Math.PI / 2, tip: bigKneels || shortOne ? 0 : 0.6, nod: -0.1 }
  const chB = jointAt(P, s, hugBig, 'chest', SC)
  const chS = jointAt(P, small, hugSmall, 'chest', SC)
  // each one's arms go round the other's back
  hugBig.rW = 1
  hugBig.rWx = chS.x + gs.chestD * SC * 0.9
  hugBig.rWy = chS.y + gs.torso * SC * 0.3
  hugBig.rWd = 0.5
  hugBig.rHand = 7
  hugBig.lW = 1
  hugBig.lWx = chS.x + gs.chestD * SC * 0.7
  hugBig.lWy = chS.y + gs.torso * SC * 0.55
  hugBig.lWd = -0.4
  hugSmall.lW = 1
  hugSmall.lWx = chB.x - g.chestD * SC * 0.7
  hugSmall.lWy = Math.max(chB.y + g.torso * SC * 0.25, chS.y - gs.armU * SC * 0.6)
  hugSmall.lWd = 0.5
  hugSmall.lHand = 7
  hugSmall.rW = 1
  hugSmall.rWx = chB.x - g.chestD * SC * 0.5
  hugSmall.rWy = hugSmall.lWy + gs.hand * SC
  hugSmall.rWd = -0.4
  fig(P, s, hugBig, { cane: false, pass: 'body' }, 0.5)
  fig(P, small, hugSmall, { pass: 'body' })
  fig(P, s, hugBig, { cane: false, pass: 'arms' })
  fig(P, small, hugSmall, { pass: 'arms' })
  label(P, 'a hug', cx(3), y2 + 86, 28)
  void circle
  void curve
}

export const viewsSheet: Scene = {
  id: 'views-sheet',
  title: 'Views and actions: a child, an adult and an elder from the front, three-quarter and side; walking, sitting, kneeling, handing over, hugging',
  W: 2400,
  H: 120 + 3 * 2 * RH,
  duration: 4.4,
  loop: true,
  render(P, t) {
    P.screen()
    label(P, 'StoryTime · views and actions · the same character sheets, seen from any side and doing things together', 60, 62, 30, 'left', 0.7)
    const tt = t === 0 ? 0 : P.held(t)
    WHO.forEach((w, i) => block(P, tt, w, 100 + i * 2 * RH, i))
  },
}
