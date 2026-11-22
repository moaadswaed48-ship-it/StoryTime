/**
 * Proof sheet "light": one small scene (a bedtime story) painted four times, in morning sun, under cloud, by the
 * bedside lamp and by moonlight. Nothing in the scene changes but the light: where it comes from, what it colours,
 * which side of everything is in shade, where the shadows fall and what kind of shadows they are.
 */
import { castById } from '@/cast/cast'
import { drawAnimal, drawAnimalShadow, restAnimal } from '../animals'
import { drawFigure, drawFigureShadow } from '../figure/draw'
import { FACES, rest, type Pose } from '../figure/pose'
import { rigOf } from '../figure/rig'
import type { Painter } from '../kit/core'
import { bedroom, bedroomFront, bedroomPlan } from '../places/places'
import { openBook, type DayTime } from '../places/things'
import type { Scene } from '../scene'
import { panel } from './panel'
import { label, stool } from './views'

const GY = 930
const SC = 1.3
const hala = castById('hala')
const adam = castById('adam')

/** The scene itself: a mother reads to her son, who sits on the edge of his bed; the cat sleeps on the rug. */
export function bedtime(Q: Painter, t: number, time: DayTime) {
  const c = Q.ctx
  bedroom(Q, t, { gy: GY, time })
  const L = bedroomPlan(Q, GY)
  const ta = Q.held(t)
  const blink = (at: number) => (t > 0 && (ta + at) % 3.1 < 0.14 ? 1 : 0)

  // the cat, asleep on the rug
  const cat = { ...restAnimal(L.rug.x - 190, GY + 52), scale: 1.25, sleep: 1, tail: ta, flip: -1 }
  drawAnimalShadow(Q, 'cat', cat)
  drawAnimal(Q, 'cat', cat)

  // mother on a low stool by the bed, the book open in her hands
  const gm = rigOf(hala, Q.style)
  const mx = L.bed.x - L.bed.w / 2 - 190
  const my = GY + 18
  const seatH = (gm.footH + 0.44 * (gm.legU + gm.legL) - gm.legW0 * 0.2) * SC
  stool(Q, mx - 6, my - 4, seatH, seatH * 0.86, '#c98f5c')
  const breath = Math.sin(ta * 1.4) * 0.008
  const mp: Pose = { ...rest(mx, my), ...FACES.smile, spin: 1.12, sit: 1, seat: 0.44, pitch: 0.1, arc: 0.3, nod: 0.5, lookY: 0.7, turn: 0.1, sq: 1 + breath, rx: 0.16, ry: 0.5, rz: 0.52, lx: 0.1, ly: 0.52, lz: 0.5, rHand: 6, lHand: 6, blink: blink(0), open: t > 0 && ta % 1.2 < 0.5 ? 0.2 : 0, lfz: 0.04 }
  drawFigureShadow(Q, hala, mp, { scale: SC }, 0.9)
  drawFigure(Q, hala, mp, { scale: SC, hold: { l: (H) => { H.ctx.rotate(-0.16); openBook(H, 62, '#e2674a') } } })

  // the boy on the edge of the bed, leaning in to see the pictures
  const ga = rigOf(adam, Q.style)
  const ax = L.bed.x - L.bed.w / 2 + 150
  const seat = (L.bed.top - ga.footH * SC + ga.legW0 * SC * 0.2) / ((ga.legU + ga.legL) * SC)
  const ap: Pose = { ...rest(ax, L.bed.y), ...FACES.curious, smile: 0.6, spin: -0.95, sit: 1, seat, pitch: 0.16, arc: 0.3, turn: -0.25, nod: 0.3, lookX: -0.5, lookY: 0.6, lB: 1, lBx: 0.3, lBy: 1.06, rB: 1, rBx: 0.5, rBy: 1.05, rfy: 0.02 + 0.02 * Math.sin(ta * 2.2), lfy: 0.03 - 0.02 * Math.sin(ta * 2.2), blink: blink(1.3) }
  drawFigureShadow(Q, adam, ap, { scale: SC }, 0.5)
  drawFigure(Q, adam, ap, { scale: SC })

  bedroomFront(Q, t, GY)
  void c
}

const TIMES: [DayTime, string][] = [
  ['morning', 'morning · low sun through the window: warm light, long cool shadows'],
  ['overcast', 'overcast · rain on the glass: flat grey light, soft patches instead of shadows'],
  ['lamp', 'evening · the bedside lamp: warm where it reaches, dusk-blue where it does not'],
  ['night', 'night · the lamp is out: moonlight on the floor, a pale rim on everything'],
]
const PW = 1200
const PH = 675
export const lightSheet: Scene = {
  id: 'light-sheet',
  title: 'Light: the same bedtime scene in morning sun, under cloud, by lamp light and by moonlight',
  W: 1280,
  H: 110 + 4 * (PH + 78),
  duration: 4,
  loop: true,
  render(P, t) {
    P.screen()
    label(P, 'StoryTime · light · one scene, four kinds of light', 40, 60, 30, 'left', 0.7)
    TIMES.forEach(([time, text], i) => {
      const y = 96 + i * (PH + 78)
      panel(P, i, 40, y, PW, PH, 1920, 1080, (Q) => bedtime(Q, t, time))
      label(P, text, 46, y + PH + 40, 24, 'left', 0.78)
    })
  },
}
/** The same scene, one light at a time, full size: one second each (for looking closely at a single light). */
export const lightScene: Scene = {
  id: 'light-scene',
  title: 'The bedtime scene at full size: morning, overcast, lamp, night (one second each)',
  W: 1920,
  H: 1080,
  duration: 4,
  shots: [0, 1, 2, 3],
  render(P, t) {
    bedtime(P, t, TIMES[Math.min(3, Math.floor(t))][0])
  },
}
