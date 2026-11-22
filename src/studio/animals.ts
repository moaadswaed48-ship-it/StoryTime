/**
 * The small animal builder: cat, dog, bird, sheep and fish, drawn with the same Painter (and so the same line,
 * shading and palette rules) as the people. Each is posed with a few plain numbers and re-coloured with a coat.
 * Animals are drawn in side view facing screen right; `flip: -1` turns them round.
 */
import { Painter, Pen, blob, circle, curve, ellipse, limbPath, poly, type Pt } from './kit/core'
import { mixHex } from './style/color'

export type AnimalKind = 'cat' | 'dog' | 'bird' | 'sheep' | 'fish'

export type AnimalPose = {
  /** Ground point under the body (for the fish: its centre), stage units. */
  x: number
  y: number
  /** 1 = about knee-high to an adult drawn at scale 1. */
  scale: number
  /** 1 faces screen right, −1 screen left. */
  flip: number
  /** 0 standing … 1 sitting (cat, dog). */
  sit: number
  /** Walk cycle, 0…1 (repeats). */
  walk: number
  /** −1…1 tail wag, or the fish's tail beat. */
  tail: number
  /** Head tilt, radians. */
  head: number
  lookX: number
  blink: number
  /** 0…1 mouth or beak open. */
  open: number
  /** 0…1: eyes become happy arcs. */
  happy: number
  /** Height above the ground, in body heights (a hop; the bird flying). */
  lift: number
  /** 0…1 wings raised (bird). */
  flap: number
}

export type Coat = { body: string; belly: string; mark: string; extra: string }
export const COATS: Record<AnimalKind, Coat> = {
  cat: { body: '#e99a4c', belly: '#fbe9cd', mark: '#c46f2f', extra: '#f2a6a0' },
  dog: { body: '#c08c62', belly: '#f6e2c8', mark: '#80513a', extra: '#3f9a8f' },
  bird: { body: '#5d9fc9', belly: '#f8dca6', mark: '#3f6f9c', extra: '#f2a53a' },
  sheep: { body: '#f7eedd', belly: '#f7eedd', mark: '#5b4857', extra: '#f2a6a0' },
  fish: { body: '#f28d3e', belly: '#fff1d8', mark: '#e2674a', extra: '#fff1d8' },
}

export function restAnimal(x = 0, y = 0): AnimalPose {
  return { x, y, scale: 1, flip: 1, sit: 0, walk: 0, tail: 0, head: 0, lookX: 0, blink: 0, open: 0, happy: 0, lift: 0, flap: 0 }
}

function eye(P: Painter, x: number, y: number, r: number, a: AnimalPose, white = false) {
  if (P.sil) return
  if (a.blink > 0.6 || a.happy > 0.6) {
    const up = a.happy > 0.6 && a.blink <= 0.6
    P.line(curve([x - r, y + (up ? r * 0.3 : 0), x, y + (up ? -r * 0.8 : r * 0.7), x + r, y + (up ? r * 0.3 : 0)]), '#2a1a1c', r * 0.5)
    return
  }
  if (white) P.flat(ellipse(x, y, r * 1.25, r * 1.35), '#fffaf0')
  P.flat(ellipse(x + a.lookX * r * 0.3, y, r * 0.86, r), '#241615')
  P.flat(circle(x + a.lookX * r * 0.3 - r * 0.28, y - r * 0.36, r * 0.3), '#ffffff')
}

const leg = (P: Painter, top: Pt, foot: Pt, w: number, col: string, bend = 0) => P.shape(limbPath(top, { x: (top.x + foot.x) / 2 + bend, y: (top.y + foot.y) / 2 }, foot, w, w * 0.84, w * 0.86, 0.5), col, { shade: 0.5 })

function cat(P: Painter, a: AnimalPose, k: Coat) {
  const c = P.ctx
  const far = mixHex(k.body, '#5b3a5e', 0.26)
  const sw = Math.sin(a.walk * Math.PI * 2) * 12
  const stripes = (pts: number[][]) => pts.forEach((q) => P.line(curve(q), k.mark, 5, 0.9))
  const head = (hx: number, hy: number) => {
    c.save()
    c.translate(hx, hy)
    c.rotate(a.head)
    for (const s of [-1, 1]) {
      P.shape(blob([s * 9, -18, s * 20, -46, s * 30, -12]), k.body, { shade: 0.5 })
      P.flat(blob([s * 14, -20, s * 20, -37, s * 25, -17]), k.extra, 0.9)
    }
    P.shape(blob([-31, -4, -24, -26, 0, -30, 24, -26, 31, -4, 24, 18, 0, 24, -24, 18]), k.body, { shade: 0.9 })
    P.flat(ellipse(4, 12, 15, 10), k.belly)
    stripes([[-6, -27, -5, -17], [3, -28, 3, -18], [12, -27, 11, -17]])
    eye(P, -8, -3, 5, a)
    eye(P, 15, -3, 5, a)
    P.flat(poly([1, 6, 8, 6, 4.5, 10]), k.extra)
    if (!P.sil) {
      if (a.open > 0.3) P.flat(ellipse(4.5, 16, 4, 2 + a.open * 4), '#6e2733')
      else P.line(curve([-2, 14, 1.5, 16, 4.5, 11, 7.5, 16, 11, 14]), '#5a3340', 1.6)
      for (const s of [-1, 1]) for (const dy of [-2, 3]) P.line(curve([4 + s * 14, 11 + dy * 0.6, 4 + s * 34, 9 + dy * 1.6]), '#5a3340', 1, 0.6)
    }
    c.restore()
  }
  if (a.sit > 0.5) {
    // sitting upright, tail curled round the feet
    P.shape(limbPath({ x: -30, y: -12 }, { x: -52, y: -2 }, { x: -8 + a.tail * 8, y: -6 }, 14, 12, 9, 0.6), k.body, { shade: 0.5 })
    P.shape(blob([-36, 0, -44, -44, -24, -92, 14, -96, 32, -52, 36, 0]), k.body, { shade: 1 })
    P.flat(blob([4, -6, 2, -50, 14, -80, 26, -50, 30, -6]), k.belly)
    stripes([[-38, -44, -26, -48], [-34, -60, -22, -62], [-28, -76, -17, -76]])
    P.shape(ellipse(-16, -20, 26, 22), k.body, { shade: 0.6 })
    leg(P, { x: 10, y: -52 }, { x: 12, y: -4 }, 14, k.body)
    leg(P, { x: 26, y: -52 }, { x: 28, y: -4 }, 14, k.body)
    head(14, -112)
    return
  }
  P.shape(limbPath({ x: -54, y: -62 }, { x: -86, y: -84 }, { x: -72 + a.tail * 22, y: -132 }, 14, 12, 9, 0.7), k.body, { shade: 0.5 })
  leg(P, { x: -30, y: -40 }, { x: -28 - sw, y: -3 }, 15, far)
  leg(P, { x: 40, y: -40 }, { x: 42 + sw, y: -3 }, 14, far)
  P.shape(blob([-62, -58, -44, -84, 20, -84, 60, -70, 58, -38, 20, -28, -34, -28, -62, -40]), k.body, { shade: 1 })
  P.clip(blob([-62, -58, -44, -84, 20, -84, 60, -70, 58, -38, 20, -28, -34, -28, -62, -40]), () => P.flat(ellipse(0, -24, 50, 12), k.belly))
  stripes([[-30, -84, -28, -66], [-12, -85, -11, -68], [6, -85, 6, -70]])
  leg(P, { x: -42, y: -42 }, { x: -44 + sw, y: -3 }, 17, k.body)
  leg(P, { x: 30, y: -42 }, { x: 30 - sw, y: -3 }, 15, k.body)
  head(62, -90)
}

function dog(P: Painter, a: AnimalPose, k: Coat) {
  const c = P.ctx
  const far = mixHex(k.body, '#5b3a5e', 0.26)
  const sw = Math.sin(a.walk * Math.PI * 2) * 14
  const head = (hx: number, hy: number) => {
    c.save()
    c.translate(hx, hy)
    c.rotate(a.head)
    P.shape(blob([-28, -8, -22, -30, 2, -34, 26, -26, 30, -4, 22, 20, -6, 24, -26, 14]), k.body, { shade: 0.9 })
    // the muzzle, the nose, the mouth
    P.shape(blob([10, -8, 34, -10, 50, 0, 48, 14, 28, 20, 10, 16]), k.belly, { shade: 0.6 })
    P.shape(ellipse(48, -1, 7, 5.5), '#3a2630', { shade: 0.3, line: 0.6 })
    if (!P.sil) {
      if (a.open > 0.25) {
        P.flat(blob([16, 16, 44, 14, 40, 18 + a.open * 12, 22, 20 + a.open * 12]), '#6e2733')
        P.shape(blob([24, 20, 36, 20, 36, 24 + a.open * 16, 30, 28 + a.open * 16, 24, 24 + a.open * 16]), '#ee8f86', { shade: 0.3, line: 0.6 })
      } else P.line(curve([18, 15, 32, 19, 44, 13]), '#5a3340', 1.8)
    }
    eye(P, 8, -10, 5.2, a)
    P.flat(ellipse(-4, 6, 8, 6), '#f2a6a0', 0.5)
    // a soft ear that hangs and swings
    c.save()
    c.translate(-14, -24)
    c.rotate(0.2 - a.tail * 0.12)
    P.shape(blob([-10, -4, 8, -8, 14, 14, 6, 40, -8, 36, -14, 14]), k.mark, { shade: 0.7 })
    c.restore()
    c.restore()
  }
  const tail = (x: number, y: number) => {
    c.save()
    c.translate(x, y)
    c.rotate(-0.5 + a.tail * 0.7)
    P.shape(limbPath({ x: 0, y: 0 }, { x: -14, y: -24 }, { x: -10, y: -52 }, 15, 12, 7, 0.7), k.body, { shade: 0.5 })
    c.restore()
  }
  if (a.sit > 0.5) {
    tail(-34, -14)
    P.shape(blob([-40, 0, -46, -46, -22, -100, 20, -102, 36, -54, 38, 0]), k.body, { shade: 1 })
    P.flat(blob([6, -6, 4, -56, 16, -86, 30, -54, 32, -6]), k.belly)
    P.shape(ellipse(-18, -22, 28, 24), k.body, { shade: 0.6 })
    leg(P, { x: 10, y: -56 }, { x: 12, y: -4 }, 16, k.body)
    leg(P, { x: 28, y: -56 }, { x: 30, y: -4 }, 16, k.body)
    P.shape(ellipse(18, -92, 20, 6, 0.1), k.extra, { shade: 0.3, line: 0.7 })
    head(20, -122)
    return
  }
  tail(-64, -74)
  leg(P, { x: -40, y: -46 }, { x: -38 - sw, y: -3 }, 17, far)
  leg(P, { x: 46, y: -46 }, { x: 48 + sw, y: -3 }, 16, far)
  const body = blob([-72, -64, -52, -94, 24, -94, 66, -80, 64, -44, 24, -34, -40, -34, -72, -46])
  P.shape(body, k.body, { shade: 1 })
  P.clip(body, () => {
    P.flat(ellipse(0, -30, 56, 12), k.belly)
    P.flat(ellipse(-30, -90, 28, 16), k.mark, 0.9)
  })
  leg(P, { x: -52, y: -48 }, { x: -54 + sw, y: -3 }, 19, k.body)
  leg(P, { x: 34, y: -48 }, { x: 34 - sw, y: -3 }, 17, k.body)
  P.shape(ellipse(58, -86, 7, 20, -0.5), k.extra, { shade: 0.3, line: 0.7 })
  head(70, -106)
}

function sheep(P: Painter, a: AnimalPose, k: Coat) {
  const c = P.ctx
  const sw = Math.sin(a.walk * Math.PI * 2) * 10
  for (const [x, f] of [[-34, -1], [38, 1]] as const) leg(P, { x, y: -40 }, { x: x + f * sw, y: -3 }, 10, mixHex(k.mark, '#2a1830', 0.3))
  const wool: Pen[] = []
  const n = 13
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2
    wool.push(circle(Math.cos(t) * 50, -70 + Math.sin(t) * 28, 21 + (i % 3) * 2))
  }
  wool.push(ellipse(0, -70, 52, 32))
  P.shape(circle(-70, -78, 12), k.body, { shade: 0.4 })
  P.group(wool, k.body, { shade: 0.7 })
  for (const [x, f] of [[-44, 1], [26, -1]] as const) leg(P, { x, y: -42 }, { x: x + f * sw, y: -3 }, 11, k.mark)
  c.save()
  c.translate(66, -88)
  c.rotate(a.head + 0.1)
  for (const s of [-1, 1]) P.shape(ellipse(s * 21 - 3, -8, 12, 6, s * 0.5), k.mark, { shade: 0.3 })
  P.shape(blob([-17, -14, 0, -22, 17, -14, 16, 14, 6, 30, -6, 30, -16, 14]), k.mark, { shade: 0.8 })
  P.group([circle(-10, -20, 10), circle(2, -24, 11), circle(13, -19, 9)], k.body, { shade: 0.4 })
  eye(P, -7, -2, 4.4, a, true)
  eye(P, 8, -2, 4.4, a, true)
  if (!P.sil) {
    P.flat(ellipse(0, 19, 6, 3.4), k.extra)
    if (a.open > 0.3) P.flat(ellipse(0, 26, 4, 3), '#3a1a22')
  }
  c.restore()
}

function bird(P: Painter, a: AnimalPose, k: Coat) {
  const c = P.ctx
  const fly = a.lift > 0.05
  if (!fly) {
    for (const x of [-5, 8]) {
      P.line(curve([x, -14, x + 2, -1]), k.extra, 3)
      P.line(curve([x - 5, 0, x + 2, -1, x + 9, 0]), k.extra, 2.6)
    }
  }
  c.save()
  c.translate(0, -34)
  c.rotate(-0.16)
  c.save()
  c.translate(-22, 2)
  c.rotate(0.2 + a.tail * 0.3)
  P.shape(blob([4, -8, -36, -14, -40, 0, -34, 10, 4, 8]), k.mark, { shade: 0.5 })
  c.restore()
  const body = ellipse(0, 0, 30, 23)
  P.shape(body, k.body, { shade: 1 })
  P.clip(body, () => P.flat(ellipse(8, 14, 26, 15), k.belly))
  c.restore()
  // head
  c.save()
  c.translate(21, -60)
  c.rotate(a.head)
  const o = a.open * 7
  P.shape(blob([12, -6 - o * 0.4, 34, -2 - o, 13, 2 - o * 0.2]), k.extra, { shade: 0.3, line: 0.8 })
  P.shape(blob([12, 1 + o * 0.2, 30, 2 + o, 13, 7 + o * 0.5]), mixHex(k.extra, '#8a3a1a', 0.25), { shade: 0.3, line: 0.8 })
  P.shape(circle(0, 0, 17), k.body, { shade: 0.8 })
  P.flat(ellipse(5, 7, 9, 6), '#f2a6a0', 0.45)
  eye(P, 5, -3, 4.2, a)
  P.shape(blob([-8, -14, -4, -27, 2, -15]), k.mark, { shade: 0.3, line: 0.8 })
  c.restore()
  // wing
  c.save()
  c.translate(-4, -40)
  c.rotate(-0.16 - a.flap * 1.5)
  P.shape(blob([10, -6, -8, -12, -34, -2, -30, 12, -8, 14, 10, 8]), k.mark, { shade: 0.7 })
  P.detail(curve([-24, 4, -8, 6, 4, 2]), k.mark, 0.6)
  c.restore()
}

function fish(P: Painter, a: AnimalPose, k: Coat) {
  const c = P.ctx
  c.save()
  c.translate(-40, 0)
  c.rotate(a.tail * 0.5)
  P.shape(blob([6, -6, -30, -30, -24, 0, -30, 30, 6, 6]), k.mark, { shade: 0.6 })
  c.restore()
  P.shape(blob([-14, -20, 6, -44, 26, -22]), k.mark, { shade: 0.4 })
  const body = blob([-46, 0, -22, -28, 24, -27, 54, -4, 26, 25, -20, 26])
  P.shape(body, k.body, { shade: 1 })
  P.clip(body, () => {
    P.flat(ellipse(6, 24, 46, 14), k.belly)
    for (const x of [-16, 4]) P.flat(blob([x - 6, -34, x + 6, -34, x + 9, 30, x - 3, 30]), k.extra, 0.9)
  })
  c.save()
  c.translate(8, 8)
  c.rotate(0.3 + a.tail * 0.3)
  P.shape(blob([0, -6, -22, -2, -18, 12, 0, 6]), k.mark, { shade: 0.3, line: 0.8 })
  c.restore()
  eye(P, 32, -6, 6, a, true)
  if (!P.sil) {
    if (a.open > 0.3) P.flat(ellipse(50, 6, 3, 2 + a.open * 3), '#6e2733')
    else P.line(curve([42, 8, 47, 10, 51, 6]), '#5a3340', 1.8)
    P.flat(ellipse(36, 8, 7, 4.5), '#f2a6a0', 0.5)
  }
}

const HEIGHT: Record<AnimalKind, number> = { cat: 130, dog: 140, sheep: 115, bird: 80, fish: 0 }

/** Draws an animal. `coat` overrides any of the default colours. */
export function drawAnimal(P: Painter, kind: AnimalKind, a: AnimalPose, coat: Partial<Coat> = {}) {
  const k = { ...COATS[kind], ...coat }
  P.at(a.x, a.y - a.lift * HEIGHT[kind] * a.scale, a.scale, () => (kind === 'cat' ? cat : kind === 'dog' ? dog : kind === 'sheep' ? sheep : kind === 'bird' ? bird : fish)(P, a, k), a.flip)
}

/** The shadow an animal throws on the ground. Draw it first. */
export function drawAnimalShadow(P: Painter, kind: AnimalKind, a: AnimalPose) {
  P.castShadow(a.x, a.y, () => drawAnimal(P, kind, { ...a, x: 0, y: 0, lift: 0 }), a.lift * HEIGHT[kind] * a.scale, 0.8)
}
