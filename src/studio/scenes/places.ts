/**
 * The six places of the library, each with a few of the cast standing in it: one second per place, so
 * `export.mjs sheet places --times=0,1,2,3,4,5` gives a contact sheet of the whole places library.
 */
import { castById } from '@/cast/cast'
import { drawAnimal, drawAnimalShadow, restAnimal, type AnimalKind, type AnimalPose } from '../animals'
import { drawFigure, drawFigureShadow } from '../figure/draw'
import { gesturePose } from '../figure/gestures'
import { FACES, rest, type Pose } from '../figure/pose'
import type { Painter } from '../kit/core'
import { bedroom, garden, gardenFront, kindergarten, kindergartenFront, meadow, shore, street } from '../places/places'
import type { Scene } from '../scene'
import { MOODS } from '../style/profile'

const GY = 930
type Who = [id: string, x: number, y: number, over: Partial<Pose>, scale?: number]
function people(P: Painter, list: Who[], adult = 600) {
  for (const [id, x, y, over, k] of [...list].sort((a, b) => a[2] - b[2])) {
    const s = castById(id)
    const sc = ((k ?? 1) * adult) / 540
    const p = { ...rest(x, y), ...over, x, y }
    drawFigureShadow(P, s, p, { scale: sc })
    drawFigure(P, s, p, { scale: sc })
  }
}
function animal(P: Painter, kind: AnimalKind, x: number, y: number, over: Partial<AnimalPose>) {
  const a = { ...restAnimal(x, y), scale: 1.2, ...over }
  if (kind !== 'bird' || a.lift === 0) drawAnimalShadow(P, kind, a)
  drawAnimal(P, kind, a)
}

export const places: Scene = {
  id: 'places',
  title: 'The places library: garden, kindergarten corner, bedroom at night, market street, sea shore, hills',
  W: 1920,
  H: 1080,
  duration: 6,
  shots: [0, 1, 2, 3, 4, 5],
  render(P, t) {
    const i = Math.min(5, Math.floor(t))
    const tt = P.held(t)
    P.mood = i === 2 ? MOODS.night : i === 3 ? MOODS.golden : i === 0 ? MOODS.morning : MOODS.day
    if (i === 0) {
      garden(P, t, { gy: GY, treeX: 520, treeH: 640 })
      people(P, [['noor', 1050, GY, { ...gesturePose('wave', 1 + (tt % 1)), turn: 0.3 }], ['nabil', 1420, GY + 20, { ...FACES.smile, turn: -0.3, lookX: -0.7 }]])
      animal(P, 'cat', 800, GY + 50, { sit: 1, tail: Math.sin(tt * 4) })
      gardenFront(P, t, GY)
    } else if (i === 1) {
      kindergarten(P, t, { gy: GY })
      people(P, [['salma', 1040, GY, { ...FACES.smile, rx: 0.6, ry: 0.3, rHand: 5, turn: -0.35, lookX: -0.7, tilt: -0.06 }], ['sami', 640, GY + 30, { ...FACES.delight, rx: 0.5, ry: -0.5, lx: 0.5, ly: -0.5, rHand: 5, lHand: 5, turn: 0.3 }], ['lulu', 420, GY + 10, { ...FACES.laugh, sit: 1, turn: 0.4, rB: 1, rBx: 0.3, rBy: 0.5, lB: 1, lBx: 0.3, lBy: 0.5 }]])
      kindergartenFront(P, t, GY)
    } else if (i === 2) {
      bedroom(P, t, { gy: GY })
      people(P, [['hala', 500, GY, { ...FACES.smile, turn: 0.4, lookX: 0.7, lB: 1, lBx: 0.4, lBy: 0.3, tilt: 0.08 }], ['adam', 760, GY + 20, { ...FACES.yawn, lH: 1, lHx: 0.2, lHy: 0.75, lHand: 5, tilt: -0.1, turn: -0.2 }]])
    } else if (i === 3) {
      street(P, t, { gy: GY })
      people(P, [['karim', 900, GY, { ...FACES.smile, turn: 0.3, lookX: 0.6, rx: 0.2, ry: 0.9 }], ['maya', 1180, GY + 10, { ...FACES.curious, rx: 0.86, ry: -0.24, rHand: 1, turn: -0.5, lookX: -0.9 }]])
      animal(P, 'dog', 1420, GY + 40, { flip: -1, tail: Math.sin(tt * 9), open: 0.7 })
    } else if (i === 4) {
      shore(P, t, { gy: GY })
      people(P, [['yousef', 620, GY, { ...gesturePose('cheer', 0.9 + (tt % 1) * 0.3) }], ['dana', 980, GY + 16, { ...FACES.smile, hipx: 0.25, turn: -0.3, lookX: -0.6, lB: 1, lBx: 0.9, lBy: 0.86 }]])
      animal(P, 'bird', 1250, GY + 40, { flip: -1, open: 0.4 })
    } else {
      meadow(P, t, { gy: GY })
      people(P, [['widad', 1100, GY, { ...FACES.delight, open: 0.4, lx: 0.7, ly: -0.3, lHand: 1, turn: 0.3, lookX: 0.7 }], ['omar', 820, GY + 16, { ...FACES.curious, turn: 0.5, lookX: 0.8, rB: 1, rBx: 0.9, rBy: 0.9 }]])
      animal(P, 'sheep', 1470, GY + 30, { flip: -1, scale: 1.5 })
    }
  },
}
