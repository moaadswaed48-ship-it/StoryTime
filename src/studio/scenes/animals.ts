/**
 * Proof sheet "animals": every animal of the builder from the side and in three-quarter view, walking, sitting
 * or resting, asleep, and startled. In motion the walkers walk on the spot over ground marks that slide back at
 * their own speed.
 */
import { ANIMALS, animalHeight, animalStride, drawAnimal, drawAnimalShadow, restAnimal, type AnimalKind, type AnimalPose } from '../animals'
import { ellipse, type Painter } from '../kit/core'
import type { Scene } from '../scene'
import { floor, label } from './views'

const CW = 430
const RH = 330
const TINTS = ['#f0d9a8', '#cfe0d2', '#f1cfc4', '#d7d3ea']
type Cell = [name: string, pose: (t: number, k: AnimalKind) => Partial<AnimalPose>, walks?: boolean]
const still = (t: number) => (t === 0 ? 0 : t)
const LAND: Cell[] = [
  ['side', (t) => ({ tail: Math.sin(t * 3) * 0.4, blink: t % 2.6 > 2.46 ? 1 : 0 })],
  ['three-quarter', (t) => ({ view: 0.72, turn: 0.3, tail: Math.sin(t * 3 + 1) * 0.4 })],
  ['walking', (t) => ({ pace: 1, walk: t === 0 ? 0.14 : t / 0.9, tail: Math.sin(t * 5) * 0.3, head: Math.sin(t * 7) * 0.03 }), true],
  ['sitting', (t) => ({ sit: 1, view: 0.9, turn: 0.4, tail: Math.sin(t * 2) * 0.5 })],
  ['asleep', (t) => ({ sleep: 1, tail: t })],
  ['startled', (t) => ({ alert: 1, open: 0.8, lift: 0.06 + 0.05 * Math.abs(Math.sin(t * 6)), view: 1.2, turn: -0.2, tail: 1 })],
]
const AIR: Partial<Record<AnimalKind, Cell[]>> = {
  bird: [
    ['side', (t) => ({ tail: Math.sin(t * 3) * 0.4 })],
    ['three-quarter', () => ({ view: 0.72, turn: 0.3 })],
    ['hopping', (t) => ({ pace: 1, walk: t === 0 ? 0.2 : t / 0.5, lift: 0.05 * Math.abs(Math.sin(t * 6.3)) }), true],
    ['flying', (t) => ({ lift: 0.9, flap: t === 0 ? 0.6 : 0.5 + 0.5 * Math.sin(t * 16), view: 1.2 })],
    ['asleep', () => ({ sleep: 1, sit: 1 })],
    ['singing', (t) => ({ alert: 0.6, open: t === 0 ? 1 : 0.5 + 0.5 * Math.sin(t * 12), head: -0.3 })],
  ],
  hen: [
    ['side', (t) => ({ tail: Math.sin(t * 3) * 0.2 })],
    ['three-quarter', () => ({ view: 0.72, turn: 0.3 })],
    ['walking', (t) => ({ pace: 1, walk: t === 0 ? 0.14 : t / 0.8, head: Math.sin(t * 15.7) * 0.06 }), true],
    ['settled', () => ({ sit: 1, view: 0.9, turn: 0.3 })],
    ['asleep', () => ({ sleep: 1, sit: 1 })],
    ['startled', (t) => ({ alert: 1, open: 1, flap: 0.7 + 0.3 * Math.sin(t * 20), lift: 0.12 })],
  ],
  fish: [
    ['side', (t) => ({ tail: Math.sin(t * 5) })],
    ['three-quarter', (t) => ({ view: 0.8, tail: Math.sin(t * 5) })],
    ['swimming', (t) => ({ tail: Math.sin(t * 9), lift: 0, head: 0 })],
    ['resting', (t) => ({ tail: Math.sin(t * 1.5) * 0.3, blink: 0 })],
    ['asleep', () => ({ sleep: 1, tail: 0.1 })],
    ['startled', (t) => ({ alert: 1, open: 1, tail: Math.sin(t * 14) })],
  ],
  butterfly: [
    ['side', () => ({ sit: 1 })],
    ['three-quarter', () => ({ view: 0.6, flap: 0.2 })],
    ['wings spread', () => ({ view: 0, flap: 0 })],
    ['flying', (t) => ({ view: 0.9, flap: t === 0 ? 0.12 : t * 5, lift: 0.5 + 0.2 * Math.sin(t * 5) })],
    ['resting', () => ({ sit: 1, view: 1.2 })],
    ['from behind', () => ({ view: 2.4, flap: 0.1 })],
  ],
  ladybird: [
    ['side', () => ({})],
    ['three-quarter', () => ({ view: 0.72 })],
    ['walking', (t) => ({ pace: 1, walk: t === 0 ? 0.1 : t / 0.7 }), true],
    ['from the front', () => ({ view: 0.1 })],
    ['from behind', () => ({ view: 2.5 })],
    ['flying', (t) => ({ flap: t === 0 ? 0.7 : 0.5 + 0.5 * Math.sin(t * 9), lift: 0.8, view: 1.0 })],
  ],
  bee: [
    ['side', (t) => ({ flap: still(t), lift: 0.5 })],
    ['three-quarter', (t) => ({ view: 0.72, flap: still(t) + 0.03, lift: 0.5 })],
    ['flying', (t) => ({ flap: t === 0 ? 0.05 : t, lift: 0.7 + 0.25 * Math.sin(t * 4), head: 0.1 })],
    ['on a flower', () => ({ sit: 1, view: 1.2 })],
    ['from the front', (t) => ({ view: 0.1, flap: still(t), lift: 0.5 })],
    ['startled', (t) => ({ alert: 1, flap: t === 0 ? 0.05 : t * 1.4, lift: 0.9, view: 1.3 })],
  ],
}

export const animalsSheet: Scene = {
  id: 'animals-sheet',
  title: 'Animals: thirteen animals from the side and three-quarter, walking, sitting, asleep and startled',
  W: CW * 6 + 20,
  H: 110 + ANIMALS.length * RH,
  duration: 3.6,
  loop: true,
  render(P: Painter, t: number) {
    P.screen()
    label(P, 'StoryTime · the animals · one builder, turned and posed with a few numbers each', 50, 60, 30, 'left', 0.7)
    const tt = t === 0 ? 0 : P.held(t)
    ANIMALS.forEach((kind, row) => {
      const gy = 110 + row * RH + 250
      const small = kind === 'butterfly' || kind === 'ladybird' || kind === 'bee'
      const sc = small ? 2.3 : Math.min(1.25, 205 / Math.max(90, animalHeight(kind)))
      const cells = AIR[kind] ?? LAND
      const sitless = kind === 'sheep' || kind === 'goat' || kind === 'donkey' || kind === 'camel'
      cells.forEach(([name, pose, walks], i) => {
        const cx = 10 + i * CW + CW / 2
        floor(P, cx - CW / 2 + 22, cx + CW / 2 - 22, gy + 6, 56, TINTS[(i + row) % 4], row * 6 + i)
        let nm = name
        const over = pose(tt, kind)
        if (sitless && name === 'sitting') {
          // these do not sit like a cat: they graze, head down
          nm = 'grazing'
          over.sit = 0
          over.view = 1.2
          over.turn = 0
          over.down = 1
          over.open = tt === 0 ? 0.3 : 0.3 + 0.3 * Math.sin(tt * 9)
        }
        if (kind === 'tortoise' && name === 'sitting') nm = 'inside its shell'
        const a: AnimalPose = { ...restAnimal(cx, gy), scale: sc, ...over }
        const stride = animalStride(kind, sc)
        if (walks && stride > 0) for (let m = -3; m <= 3; m++) {
          const mx = cx + ((((m * 110 - a.walk * stride) % 660) + 660 + 330) % 660) - 330
          if (Math.abs(mx - cx) < CW / 2 - 50) P.flat(ellipse(mx, gy + 22, 12, 3.2), '#b89a6a', 0.55)
        }
        const flying = a.lift > 0.3 || kind === 'fish'
        if (kind === 'fish') a.y = gy - 120
        if (small && !flying) a.y = gy - 8
        if (!flying) drawAnimalShadow(P, kind, a)
        else P.groundShadow(cx, gy + 4, 34, 6, 0.6)
        drawAnimal(P, kind, a)
        label(P, i === 0 ? `${kind} · ${nm}` : nm, cx, gy + 62, 21, 'center', i === 0 ? 0.85 : 0.6)
      })
    })
  },
}
