/**
 * Model sheets: the whole cast side by side, every gesture on three very different characters, and the range of
 * the face. They are the proof that one builder draws every sheet, and the first thing to re-render when the
 * style profile changes.
 */
import { GESTURES, type Sheet } from '@/cast/sheet'
import { CAST, castById } from '@/cast/cast'
import { drawAnimal, restAnimal, type AnimalKind } from '../animals'
import { drawFigure, drawFigureShadow, type Held } from '../figure/draw'
import { GESTURE_SECONDS, gesturePose } from '../figure/gestures'
import { FACES, rest, type FaceName, type Pose } from '../figure/pose'
import { ADULT, rigOf } from '../figure/rig'
import { Painter, blob, circle, cutRect, wobble } from '../kit/core'
import type { Scene } from '../scene'

const INK = '#3a2238'
function label(P: Painter, text: string, x: number, y: number, size = 26, align: CanvasTextAlign = 'center', alpha = 0.8) {
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
function floor(P: Painter, x0: number, x1: number, y: number, h: number, color: string, seed: number) {
  const pts = wobble([x0, y - h * 0.34, (x0 + x1) / 2, y - h * 0.5, x1, y - h * 0.34, x1 + 14, y + h * 0.5, (x0 + x1) / 2, y + h * 0.62, x0 - 14, y + h * 0.5], 7, seed)
  const b = blob(pts)
  P.flat(b, color)
  P.speckle(b, color, seed, [x0, y - h * 0.6, x1 - x0, h * 1.3], 0.8)
}

/** A different living pose for each character of the line-up, so the sheet shows people, not mannequins. */
const LINEUP: Record<string, (p: Pose) => Partial<Pose>> = {
  sami: () => ({ ...FACES.surprise, rx: 0.5, ry: 0.5, lx: 0.5, ly: 0.5, rHand: 5, lHand: 5, turn: 0.3, lookX: 0.8 }),
  lulu: () => ({ ...FACES.laugh, rB: 1, rBx: 0.2, rBy: 0.4, lB: 1, lBx: 0.2, lBy: 0.4, tilt: 0.1 }),
  noor: () => ({ ...FACES.delight, lx: 0.5, ly: -0.6, lHand: 5, tilt: 0.1, hipx: -0.15, lean: -0.04, turn: 0.15 }),
  adam: () => ({ ...FACES.think, rH: 1, rHx: 0.5, rHy: 1.7, rHand: 6, lB: 1, lBx: 0.9, lBy: 0.94, tilt: -0.1, turn: -0.15, hipx: 0.12 }),
  maya: () => ({ ...FACES.smile, rx: 0.62, ry: -0.3, rHand: 3, rWrist: 0.4, lx: 0.3, ly: 0.7, hipx: 0.1, turn: -0.1 }),
  yousef: () => ({ ...FACES.laugh, rx: 0.44, ry: -0.86, lx: 0.44, ly: -0.86, rHand: 5, lHand: 5, lift: 0.06, rfy: 0.06, lfy: 0.04, rfx: -0.08, lfx: 0.08 }),
  dana: () => ({ ...FACES.smile, hipx: 0.3, lean: -0.05, lx: 0.3, ly: 0.56, lB: 0.7, lBx: 0.9, lBy: 0.86, tilt: 0.08, lids: 0.2, turn: 0.2, lookX: 0.6 }),
  omar: () => ({ ...FACES.shy, rH: 1, rHx: 0.5, rHy: 0.3, rBack: 1, tilt: -0.1, turn: -0.2, hipx: -0.1 }),
  salma: () => ({ ...FACES.smile, rx: 0.62, ry: 0.2, rHand: 5, lB: 1, lBx: 0.2, lBy: 0.5, turn: -0.25, lookX: -0.6, tilt: -0.05 }),
  hala: () => ({ ...FACES.calm, smile: 0.7, rB: 1, rBx: 0.3, rBy: 0.94, lB: 1, lBx: 0.3, lBy: 0.94, hipx: -0.2, tilt: 0.07, turn: 0.2, lookX: 0.5 }),
  karim: () => ({ ...FACES.laugh, rB: 1, rBx: 1.0, rBy: 0.9, lB: 1, lBx: 1.0, lBy: 0.9, lean: 0.03, nod: -0.3 }),
  widad: () => ({ ...FACES.delight, open: 0.4, rB: 1, rBx: 0.06, rBy: 0.42, lB: 1, lBx: 0.06, lBy: 0.42, tilt: 0.12, turn: -0.2, lookX: -0.5 }),
  nabil: () => ({ ...FACES.smile, lx: 0.3, ly: -0.2, lHand: 1, turn: 0.25, lookX: 0.6, brow: 0.6 }),
}

function standing(P: Painter, s: Sheet, x: number, y: number, sc: number, over: Partial<Pose>) {
  const p = { ...rest(x, y), ...over, x, y }
  drawFigureShadow(P, s, p, { scale: sc }, 0.6)
  drawFigure(P, s, p, { scale: sc })
}

const ROW1 = ['sami', 'lulu', 'noor', 'adam', 'maya', 'yousef', 'dana']
const ROW2 = ['omar', 'salma', 'hala', 'karim', 'widad', 'nabil']
const STAGES = { toddler: 'toddler', child: 'child', teen: 'teen', adult: 'adult', elder: 'elder' } as const

export const castSheet: Scene = {
  id: 'cast-sheet',
  title: 'Cast sheet: thirteen characters across five life stages, and the animals',
  W: 2200,
  H: 1640,
  duration: 0,
  render(P) {
    P.screen()
    label(P, 'StoryTime · cast sheet · every figure is drawn by one builder from a character sheet', 70, 64, 30, 'left', 0.7)
    const sc = 1.02
    const rows: [string[], number, number, number][] = [
      [ROW1, 760, 130, 2070],
      [ROW2, 1520, 600, 2100],
    ]
    floor(P, 60, 2140, 772, 110, '#f0d9a8', 3)
    floor(P, 60, 2140, 1532, 110, '#cfe0d2', 4)
    for (const [ids, y, x0, x1] of rows) {
      const widths = ids.map((id) => rigOf(castById(id), P.style).shW * 2 + 150)
      const total = widths.reduce((a, b) => a + b, 0)
      let x = x0 + (x1 - x0 - total) / 2
      ids.forEach((id, i) => {
        const s = castById(id)
        const cx = x + widths[i] / 2
        standing(P, s, cx, y, sc, LINEUP[id]?.(rest()) ?? {})
        label(P, s.name.en, cx, y + 76, 25)
        label(P, STAGES[s.stage], cx, y + 104, 19, 'center', 0.5)
        x += widths[i]
      })
    }
    // the animals, at the feet of the people so their size is clear
    const animals: [AnimalKind, number, number, number, number, Partial<ReturnType<typeof restAnimal>>][] = [
      ['cat', 150, 1520, 1, 1, { sit: 1, tail: 0.5 }],
      ['dog', 400, 1520, 1, 1, { tail: 0.6, open: 0.7, happy: 1 }],
      ['sheep', 150, 772, 1, 1, {}],
      ['bird', 1940, 660, 1, -1, { open: 0.4 }],
      ['fish', 520, 1250, 1, 1, {}],
    ]
    for (const [kind, x, y, s2, flip, over] of animals) {
      const a = { ...restAnimal(x, y), ...over, scale: s2, flip }
      if (kind !== 'fish' && kind !== 'bird') P.groundShadow(x, y, 80, 14)
      drawAnimal(P, kind, a)
    }
    label(P, 'cat', 150, 1596, 22, 'center', 0.6)
    label(P, 'dog', 400, 1596, 22, 'center', 0.6)
    label(P, 'sheep', 150, 836, 22, 'center', 0.6)
    label(P, 'bird', 1940, 700, 22, 'center', 0.6)
    label(P, 'fish', 520, 1320, 22, 'center', 0.6)
    void ADULT
    void cutRect
  },
}

const TRIO = ['lulu', 'maya', 'nabil']
export const gestureSheet: Scene = {
  id: 'gesture-sheet',
  title: 'Gesture sheet: every shared gesture on a toddler, a child and a grandfather',
  W: 2200,
  H: 3330,
  duration: 4,
  loop: true,
  render(P, t) {
    P.screen()
    label(P, 'StoryTime · the shared gestures · each is written once and plays on any character sheet', 70, 60, 30, 'left', 0.7)
    const cols = 3
    const cw = 2200 / cols
    const rh = 800
    // a still sheet shows each gesture at its most telling moment; in motion every cell plays its gesture
    const KEY: Record<string, number> = { idle: 2.1, wave: 1.02, dance: 0.4, jump: 0.9, clap: 0.78, spin: 0.78, bow: 1.2, cheer: 0.74, think: 1.2, peek: 1.6, hug: 1.6 }
    const TINTS = ['#f0d9a8', '#cfe0d2', '#f1cfc4', '#d7d3ea']
    GESTURES.forEach((name, i) => {
      const cx = (i % cols) * cw + cw / 2
      const gy = 110 + Math.floor(i / cols) * rh + 640
      floor(P, cx - cw / 2 + 40, cx + cw / 2 - 40, gy + 10, 96, TINTS[(i + Math.floor(i / cols)) % 4], 10 + i)
      const d = GESTURE_SECONDS[name]
      const tt = t === 0 ? KEY[name] : P.held((t / 4) * d)
      TRIO.forEach((id, j) => {
        const s = castById(id)
        const p = gesturePose(name, tt, cx + [-230, -30, 200][j], gy)
        drawFigureShadow(P, s, p, { scale: 0.9, cane: false }, 0.6)
        drawFigure(P, s, p, { scale: 0.9, cane: false })
      })
      label(P, name, cx, gy + 100, 36)
    })
    // the last cell: hands that hold, count and point
    const cx = 2 * cw + cw / 2
    const gy = 110 + 3 * rh + 640
    floor(P, cx - cw / 2 + 40, cx + cw / 2 - 40, gy + 10, 96, TINTS[1], 30)
    const flag: Held = (Q, h) => {
      Q.ctx.rotate(0.14)
      Q.shape(cutRect(-h.r * 0.3, -h.r * 7.4, h.r * 0.6, h.r * 9.2, 4, 3), '#8a5a3a', { shade: 0.4 })
      Q.shape(blob([h.r * 0.3, -h.r * 7.3, h.r * 5.6, -h.r * 6.2, h.r * 4.4, -h.r * 5.2, h.r * 5.4, -h.r * 4.0, h.r * 0.3, -h.r * 4.3]), '#e2674a', { shade: 0.8, over: () => Q.flat(circle(h.r * 2.3, -h.r * 5.7, h.r * 0.8), '#f2c94c') })
    }
    const who: [string, number, Partial<Pose>, Held | undefined][] = [
      ['maya', -250, { ...FACES.smile, rx: 0.6, ry: -0.44, rHand: 3, rWrist: 0.5, lx: 0.2, ly: 0.9, tilt: -0.06, turn: 0.1 }, undefined],
      ['yousef', -10, { ...FACES.delight, open: 0.5, lx: 0.46, ly: -0.3, lHand: 6, rB: 1, rBx: 0.9, rBy: 0.9, turn: 0.15 }, flag],
      ['noor', 290, { ...FACES.curious, rx: 0.7, ry: -0.56, rHand: 1, lx: 0.2, ly: 0.9, turn: -0.45, lookX: -0.9, lookY: -0.6, nod: -0.3 }, undefined],
    ]
    for (const [id, dx, over, held] of who) {
      const s = castById(id)
      const p = { ...rest(cx + dx, gy), ...over }
      drawFigureShadow(P, s, p, { scale: 0.98 }, 0.6)
      drawFigure(P, s, p, { scale: 0.98, hold: held ? { l: held } : undefined })
    }
    label(P, 'hold · count · point', cx, gy + 100, 36)
  },
}

const FACE_ORDER: FaceName[] = ['delight', 'laugh', 'smile', 'calm', 'curious', 'surprise', 'think', 'shy', 'worry', 'sad', 'cross', 'sleepy', 'yawn', 'asleep']
export const faceSheet: Scene = {
  id: 'face-sheet',
  title: 'Face sheet: from delight to worry to sleep, on a child, a toddler and a grandmother',
  W: 2200,
  H: 1330,
  duration: 0,
  render(P) {
    P.screen()
    label(P, 'StoryTime · the acting face · the same expressions on any character', 70, 60, 30, 'left', 0.7)
    const who = ['noor', 'sami', 'widad']
    const cw = 2200 / 7
    FACE_ORDER.forEach((name, i) => {
      const col = i % 7
      const row = Math.floor(i / 7)
      const cx = col * cw + cw / 2
      const cy = 120 + row * 600
      const s = castById(who[(i + row) % 3])
      const tint = ['#f0d9a8', '#cfe0d2', '#f1cfc4', '#d7d3ea'][(col + row) % 4]
      P.flat(cutRect(cx - cw / 2 + 16, cy, cw - 32, 470, 30, 40 + i, 5), tint)
      const g = rigOf(s, P.style)
      // a bust: the figure is drawn large and cut off below the chest
      const sc = 210 / (g.headRy * 2)
      const y = cy + 470 + (g.H - g.headRy * 2 - g.neck * 0.2 - g.torso * 0.5) * sc
      P.clip(cutRect(cx - cw / 2 + 16, cy, cw - 32, 470, 30, 40 + i, 5), () => {
        const tiltBy: Partial<Record<FaceName, Partial<Pose>>> = { sad: { tilt: 0.12, nod: 0.5 }, shy: { tilt: -0.14, turn: -0.3, nod: 0.3 }, think: { tilt: -0.1, turn: 0.2 }, sleepy: { tilt: 0.14, nod: 0.3 }, asleep: { tilt: 0.3, nod: 0.5 }, delight: { tilt: -0.05, nod: -0.2 }, laugh: { tilt: 0.08, nod: -0.4 }, curious: { tilt: 0.12, turn: 0.3 }, worry: { tilt: -0.06 }, yawn: { nod: -0.3 } }
        drawFigure(P, s, { ...rest(cx, y), ...FACES[name], ...tiltBy[name] }, { scale: sc })
      })
      label(P, name, cx, cy + 520, 34)
    })
  },
}
