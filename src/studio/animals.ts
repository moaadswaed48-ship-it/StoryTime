/**
 * The animal builder: cat, dog, sheep, goat, donkey, camel, tortoise, bird, hen, fish, butterfly, ladybird and bee,
 * drawn with the same Painter (and so the same line, shading and palette rules) as the people.
 *
 * Like the people, an animal is built in depth and then looked at from the side its pose says (`view`): a side
 * view by default, a three-quarter view at about 0.7, the front at 0. Its body is a few rounded masses with a
 * place each (rump, chest, head, muzzle), its legs stand at its four corners, and what is nearer is drawn over
 * what is farther, so one animal can turn, walk, sit, sleep and start in surprise without a second drawing.
 * Each is posed with a few plain numbers and re-coloured with a coat.
 */
import { Painter, Pen, blob, circle, clamp01, curve, ellipse, lerp, limbPath, poly, type Pt } from './kit/core'
import { mixHex } from './style/color'

export const ANIMALS = ['cat', 'dog', 'sheep', 'goat', 'donkey', 'camel', 'tortoise', 'bird', 'hen', 'fish', 'butterfly', 'ladybird', 'bee'] as const
export type AnimalKind = (typeof ANIMALS)[number]

export type AnimalPose = {
  /** Ground point under the body (for the fish and the flying insects: the centre), stage units. */
  x: number
  y: number
  /** 1 = a cat about knee-high to an adult drawn at scale 1. */
  scale: number
  /** 1 faces screen right, −1 screen left (the whole drawing is mirrored). */
  flip: number
  /** Which side we see: π/2 = side view (the default), about 0.7 = three-quarter, 0 = from the front, π = from behind. */
  view: number
  /** 0 standing … 1 sitting (cat, dog; a hen settles; a butterfly or ladybird folds its wings). */
  sit: number
  /** 0 awake … 1 lying down asleep. */
  sleep: number
  /** 0 calm … 1 startled or keen: ears up, eyes wide, up on its toes. */
  alert: number
  /** Walk cycle, counted in cycles (repeats every 1). Move the animal by `animalStride(kind, scale)` per cycle and no foot slides. */
  walk: number
  /** 0 standing still … 1 walking: how much of the walk cycle the legs take up (fade it to start and stop). */
  pace: number
  /** 0…1 head lowered to the ground: grazing, drinking, sniffing. */
  down: number
  /** −1…1 tail wag, or the fish's tail beat. */
  tail: number
  /** Head tilt, radians (in the picture), and −1…1 head turned toward us (+) or away (−). */
  head: number
  turn: number
  lookX: number
  blink: number
  /** 0…1 mouth or beak open. */
  open: number
  /** 0…1: eyes become happy arcs. */
  happy: number
  /** Height above the ground, in body heights (a hop; the bird flying). */
  lift: number
  /** 0…1 wings raised (bird, hen, butterfly, bee, ladybird). */
  flap: number
}

export type Coat = { body: string; belly: string; mark: string; extra: string }
export const COATS: Record<AnimalKind, Coat> = {
  cat: { body: '#e99a4c', belly: '#fbe9cd', mark: '#c46f2f', extra: '#f2a6a0' },
  dog: { body: '#c08c62', belly: '#f6e2c8', mark: '#80513a', extra: '#3f9a8f' },
  sheep: { body: '#f7eedd', belly: '#f7eedd', mark: '#5b4857', extra: '#f2a6a0' },
  goat: { body: '#c79a6c', belly: '#f6e6cc', mark: '#6b4a3a', extra: '#e6d3b0' },
  donkey: { body: '#9c8f8a', belly: '#f1e7da', mark: '#5c504f', extra: '#f2a6a0' },
  camel: { body: '#d9a968', belly: '#edc88f', mark: '#a9763f', extra: '#8a5a34' },
  tortoise: { body: '#8fa86a', belly: '#d9c98a', mark: '#6b7a4a', extra: '#c9a85a' },
  bird: { body: '#5d9fc9', belly: '#f8dca6', mark: '#3f6f9c', extra: '#f2a53a' },
  hen: { body: '#b5683a', belly: '#e9b684', mark: '#7a3f24', extra: '#e2543f' },
  fish: { body: '#f28d3e', belly: '#fff1d8', mark: '#e2674a', extra: '#fff1d8' },
  butterfly: { body: '#5b4857', belly: '#f2a53a', mark: '#e2674a', extra: '#fff1d8' },
  ladybird: { body: '#e2543f', belly: '#3a2630', mark: '#3a2630', extra: '#fff1d8' },
  bee: { body: '#f2c53a', belly: '#fff1d8', mark: '#3a2630', extra: '#cfe6ee' },
}

export function restAnimal(x = 0, y = 0): AnimalPose {
  return { x, y, scale: 1, flip: 1, view: Math.PI / 2, sit: 0, sleep: 0, alert: 0, walk: 0, pace: 0, down: 0, tail: 0, head: 0, turn: 0, lookX: 0, blink: 0, open: 0, happy: 0, lift: 0, flap: 0 }
}

type V = { sn: number; cs: number; X: (x: number, z: number) => number; D: (x: number, z: number) => number; W: (a: number, c: number) => number }
const viewOf = (psi: number): V => {
  const sn = Math.sin(psi)
  const cs = Math.cos(psi)
  return { sn, cs, X: (x, z) => x * cs + z * sn, D: (x, z) => -x * sn + z * cs, W: (a, c) => Math.hypot(a * cs, c * sn) }
}
const smooth = (a: number, b: number, v: number) => {
  const u = clamp01((v - a) / (b - a))
  return u * u * (3 - 2 * u)
}
const DARK = '#2a1a1c'
const far = (c: string) => mixHex(c, '#5b3a5e', 0.26)

/** An eye at (x, y): `w` 0…1 is how much of it we see (it narrows as the head turns away). */
function eye(P: Painter, x: number, y: number, r: number, a: AnimalPose, white = false, w = 1) {
  if (P.sil || w < 0.08) return
  const rx = r * (0.45 + 0.55 * w)
  if (a.blink > 0.6 || a.happy > 0.6 || a.sleep > 0.6) {
    const up = a.happy > 0.6 && a.blink <= 0.6 && a.sleep <= 0.6
    P.line(curve([x - rx, y + (up ? r * 0.3 : 0), x, y + (up ? -r * 0.8 : r * 0.7), x + rx, y + (up ? r * 0.3 : 0)]), DARK, r * 0.5)
    return
  }
  const big = 1 + 0.3 * a.alert
  if (white || a.alert > 0.5) P.flat(ellipse(x, y, rx * 1.25 * big, r * 1.35 * big), '#fffaf0')
  P.flat(ellipse(x + a.lookX * rx * 0.3, y, rx * 0.86, r), '#241615')
  P.flat(circle(x + a.lookX * rx * 0.3 - rx * 0.28, y - r * 0.36, r * 0.3), '#ffffff')
}

// ── four-legged animals ───────────────────────────────────────────────────────
type Quad = {
  /** Half the distance between rump and chest; half the body's width; the height of the back. */
  len: number
  wid: number
  top: number
  /** Rump and chest as rounded masses: their radii. */
  rr: number
  rc: number
  legW: number
  /** The head's centre from the chest's centre: forward and up. Neck width (0 = the head sits on the chest). */
  neckF: number
  neckUp: number
  neckW: number
  /** The head: half width, half height, half length. The muzzle: how far it stands out, its size, how far below the head's centre. */
  hw: number
  hh: number
  hl: number
  snout: number
  snoutR: number
  snoutY: number
  ear: 'point' | 'flop' | 'long' | 'side' | 'round'
  tail: 'long' | 'curl' | 'puff' | 'short' | 'tuft'
  hoof?: boolean
  canSit?: boolean
  /** Ground covered in one walk cycle, in body lengths. */
  stride: number
}
const QUADS: Record<'cat' | 'dog' | 'sheep' | 'goat' | 'donkey' | 'camel', Quad> = {
  cat: { len: 38, wid: 21, top: 82, rr: 24, rc: 22, legW: 13, neckF: 20, neckUp: 26, neckW: 0, hw: 29, hh: 25, hl: 27, snout: 5, snoutR: 12, snoutY: 9, ear: 'point', tail: 'long', canSit: true, stride: 1.1 },
  dog: { len: 46, wid: 24, top: 94, rr: 25, rc: 28, legW: 16, neckF: 24, neckUp: 30, neckW: 28, hw: 27, hh: 26, hl: 28, snout: 22, snoutR: 15, snoutY: 8, ear: 'flop', tail: 'curl', canSit: true, stride: 1.1 },
  sheep: { len: 36, wid: 30, top: 100, rr: 31, rc: 31, legW: 10, neckF: 28, neckUp: 12, neckW: 0, hw: 17, hh: 22, hl: 20, snout: 9, snoutR: 11, snoutY: 12, ear: 'side', tail: 'puff', hoof: true, stride: 0.9 },
  goat: { len: 42, wid: 22, top: 104, rr: 25, rc: 27, legW: 10, neckF: 24, neckUp: 42, neckW: 20, hw: 17, hh: 21, hl: 21, snout: 15, snoutR: 10, snoutY: 10, ear: 'side', tail: 'short', hoof: true, stride: 1 },
  donkey: { len: 62, wid: 28, top: 150, rr: 33, rc: 35, legW: 14, neckF: 38, neckUp: 60, neckW: 32, hw: 22, hh: 27, hl: 28, snout: 30, snoutR: 17, snoutY: 16, ear: 'long', tail: 'tuft', hoof: true, stride: 1 },
  camel: { len: 78, wid: 32, top: 205, rr: 37, rc: 39, legW: 15, neckF: 58, neckUp: 112, neckW: 27, hw: 21, hh: 23, hl: 28, snout: 26, snoutR: 15, snoutY: 11, ear: 'round', tail: 'tuft', hoof: true, stride: 0.9 },
}

/** One leg through a cycle: how far ahead of its shoulder the foot is (in strides) and how high (0…1). No sliding: on the ground it moves back at body speed. */
function step(u: number, duty = 0.62) {
  u -= Math.floor(u)
  if (u < duty) return { z: 0.5 * duty - u, y: 0 }
  const v = (u - duty) / (1 - duty)
  return { z: -0.5 * duty + duty * (v * v * (3 - 2 * v)), y: Math.sin(Math.PI * v) }
}

function quad(P: Painter, a: AnimalPose, k: Coat, q: Quad, kind: 'cat' | 'dog' | 'sheep' | 'goat' | 'donkey' | 'camel') {
  const c = P.ctx
  const v = viewOf(a.view)
  const sit = q.canSit ? clamp01(a.sit) * (1 - clamp01(a.sleep)) : 0
  const slp = clamp01(a.sleep)
  const up = a.alert * q.top * 0.05
  // where the two masses of the body are: standing, sitting upright, or lying down
  const mix3 = (s: number, t: number, l: number) => s * (1 - sit) * (1 - slp) + t * sit + l * slp
  const rump = { z: mix3(-q.len, -q.len * 0.45, -q.len * 0.9), y: -mix3(q.top - q.rr + up * 0.4, q.rr * 0.92, q.rr * 0.84) }
  const chest = { z: mix3(q.len, q.len * 0.4, q.len * 0.8), y: -mix3(q.top - q.rc + up, q.top * 0.98 + q.rc * 0.1, q.rc * 0.8) }
  const breath = 1 + 0.02 * Math.sin(a.walk * Math.PI * 4) + (slp > 0.5 ? 0.03 * Math.sin(a.tail * 3) : 0)
  const R = (x: number, z: number, y: number): Pt & { d: number } => ({ x: v.X(x, z), y, d: v.D(x, z) })
  const rumpP = R(0, rump.z, rump.y)
  const chestP = R(0, chest.z, chest.y)
  const rumpE = ellipse(rumpP.x, rumpP.y, v.W(q.wid, q.rr) * breath, q.rr * breath)
  const chestE = ellipse(chestP.x, chestP.y, v.W(q.wid * 0.94, q.rc), q.rc)
  const hull = limbPath(rumpP, { x: (rumpP.x + chestP.x) / 2, y: (rumpP.y + chestP.y) / 2 - (kind === 'cat' ? q.rr * 0.06 : 0) }, chestP, q.rr * 1.96 * breath, (q.rr + q.rc) * (kind === 'camel' ? 1.02 : 0.96), q.rc * 1.96, 0.3)

  // legs: four corners; diagonal pairs step together
  type Leg = { top: Pt; mid: Pt; foot: Pt; d: number; w: number; fore: boolean; haunch?: Pt }
  const legs: Leg[] = []
  const L = q.len * 2 * q.stride
  for (const fore of [true, false]) for (const side of [-1, 1]) {
    const base = fore ? chest : rump
    const lx = side * q.wid * 0.62
    const lz = base.z + (fore ? -q.rc * 0.1 : q.rr * 0.1)
    const st = step(a.walk + (fore === (side > 0) ? 0 : 0.5) + (fore ? 0 : 0.06))
    const walking = (1 - sit) * (1 - slp) * a.pace
    let fz = lz + st.z * L * walking
    let fy = -st.y * q.top * 0.1 * walking
    let topY = base.y + (fore ? q.rc : q.rr) * 0.3
    let haunch: Pt | undefined
    if (sit > 0 && !fore) {
      // the hind legs fold: a haunch beside the rump and a paw forward on the ground
      fz = lerp(fz, rump.z + q.rr * 1.5, sit)
      topY = lerp(topY, -q.rr * 0.9, sit)
      const hp = R(side * q.wid * 0.9, rump.z + q.rr * 0.5, -q.rr * 0.86)
      haunch = hp
    }
    if (sit > 0 && fore) fz = lerp(fz, chest.z + q.rc * 0.36, sit)
    if (slp > 0) {
      // lying down: forelegs stretched out in front, hind legs tucked under
      fz = lerp(fz, fore ? chest.z + q.rc * 1.5 : rump.z + q.rr * 1.1, slp)
      fy = lerp(fy, -q.legW * 0.4, slp)
      topY = lerp(topY, -q.legW * 0.9, slp)
    }
    const top = R(lx, lz, topY)
    const foot = R(lx, fz, fy - q.legW * 0.3)
    // a hind leg bends back at the hock, a foreleg a little forward at the knee
    const bend = (fore ? 0.06 : -0.16) * (-topY) * (1 - slp) * (1 - (fore ? 0 : sit))
    const mid = R(lx, (lz + fz) / 2 + bend, (topY + fy) / 2 - (fore ? 0 : q.top * 0.02))
    legs.push({ top, mid, foot, d: top.d, w: q.legW * (fore ? 1 : 1.08), fore, haunch })
  }
  const legCol = kind === 'sheep' ? k.mark : k.body
  const drawLeg = (l: Leg, dim: boolean) => {
    const col = dim ? far(legCol) : legCol
    if (l.haunch && !dim) P.shape(ellipse(l.haunch.x, l.haunch.y, v.W(q.rr * 0.5, q.rr * 0.9), q.rr * 0.86), k.body, { shade: 0.6 })
    P.shape(limbPath(l.top, l.mid, l.foot, l.w * (l.fore ? 1.1 : 1.3), l.w * 0.9, l.w * 0.86, 0.5), col, { shade: 0.5 })
    if (q.hoof) P.shape(ellipse(l.foot.x, l.foot.y + q.legW * 0.1, l.w * 0.52, l.w * 0.34), mixHex(k.mark, DARK, 0.4), { shade: 0.3, line: 0.7 })
    else if (!P.sil) P.shape(ellipse(l.foot.x + v.sn * l.w * 0.2, l.foot.y + q.legW * 0.16, l.w * 0.62, l.w * 0.36), dim ? far(k.belly) : kind === 'cat' ? k.belly : col, { shade: 0.3, line: 0.8 })
  }

  // the tail, at the rump's far end
  const tz = rump.z - q.rr * 0.7
  const tailP = R(0, tz, rump.y - q.rr * 0.35)
  const wag = a.tail
  const drawTail = () => {
    const back = (z: number, x = 0) => v.X(x, z) // a point behind the rump
    const tcol = kind === 'sheep' ? k.body : k.body
    if (q.tail === 'long') {
      // a cat's tail: up in a soft hook, or curled round the feet when it sits or sleeps
      const curl = Math.max(sit, slp)
      const e = { x: tailP.x + back(-30 + curl * 62, wag * 16) , y: tailP.y - 58 * (1 - curl) + curl * (-rump.y - q.rr * 0.32) - a.alert * 14 }
      const m = { x: tailP.x + back(-34 + curl * 10, wag * 8), y: tailP.y - 16 * (1 - curl) + curl * (-rump.y - q.rr * 0.5) * 0.9 }
      P.shape(limbPath(tailP, m, e, 14, 12, 9 + a.alert * 5, 0.7), tcol, { shade: 0.5 })
    } else if (q.tail === 'curl') {
      const e = { x: tailP.x + back(-8, wag * 22), y: tailP.y - 48 - a.alert * 6 }
      const m = { x: tailP.x + back(-20, wag * 10), y: tailP.y - 22 }
      P.shape(limbPath(tailP, m, e, 15, 12, 7, 0.7), tcol, { shade: 0.5 })
    } else if (q.tail === 'puff') {
      P.shape(circle(tailP.x + back(-8), tailP.y + 6, 12), tcol, { shade: 0.4 })
    } else if (q.tail === 'short') {
      const e = { x: tailP.x + back(-10, wag * 6), y: tailP.y - 20 }
      P.shape(limbPath(tailP, { x: (tailP.x + e.x) / 2, y: tailP.y - 8 }, e, 11, 9, 6, 0.6), tcol, { shade: 0.4 })
    } else {
      // a thin tail with a tuft at its end
      const e = { x: tailP.x + back(-12, wag * 14), y: tailP.y + q.top * 0.34 }
      const m = { x: tailP.x + back(-16, wag * 6), y: tailP.y + q.top * 0.12 }
      P.shape(limbPath(tailP, m, e, 9, 7, 6, 0.6), tcol, { shade: 0.4 })
      P.shape(ellipse(e.x, e.y + 8, 7, 13, wag * 0.3), k.mark, { shade: 0.3 })
    }
  }

  // the head: carried forward and up; low when asleep
  const down = clamp01(a.down) * (1 - slp) * (1 - sit)
  const hz = chest.z + q.neckF * (1 - 0.3 * sit) * (1 - 0.1 * slp) + (slp > 0 ? q.rc * 0.5 * slp : 0) + down * (q.neckF * 0.3 + q.neckUp * 0.25)
  const hy0 = chest.y - q.neckUp * (1 - slp) * (1 + 0.1 * a.alert) + slp * (q.rc * 0.8 - q.hh * 0.78)
  const hy = hy0 + (-q.hh * 0.86 - q.snoutY - hy0) * down
  const headP = R(0, hz, hy)
  const psiH = a.view - a.turn * 0.95
  const hv = viewOf(psiH)

  const drawHead = () => {
    if (q.neckW > 0 && slp < 0.7) {
      const nb = { x: chestP.x + v.sn * q.rc * 0.3, y: chestP.y - q.rc * 0.4 }
      const nm = { x: lerp(nb.x, headP.x, 0.5) - v.sn * q.neckUp * 0.08, y: lerp(nb.y, headP.y, 0.5) }
      P.shape(limbPath(nb, nm, headP, q.neckW * 1.3, q.neckW, q.neckW * 0.9, 0.5), k.body, { shade: 0.8 })
      if (kind === 'donkey' && !P.sil) {
        // a short stiff mane along the top of the neck
        const mane: Pen[] = []
        for (let i = 0; i < 6; i++) {
          const u = 0.12 + i * 0.15
          mane.push(ellipse(lerp(nb.x, headP.x, u) - v.sn * q.neckW * 0.5, lerp(nb.y, headP.y, u) - q.neckW * 0.2, 6, 10, -0.4 * v.sn))
        }
        P.group(mane, k.mark, { shade: 0.3, line: 0.8 })
      }
      if (kind === 'dog' && !P.sil) P.shape(ellipse(lerp(nb.x, headP.x, 0.42), lerp(nb.y, headP.y, 0.42), q.neckW * 0.62, 6, v.sn * 0.5 - 0.2), k.extra, { shade: 0.3, line: 0.7 })
    }
    c.save()
    c.translate(headP.x, headP.y)
    c.rotate((a.head + down * 0.75) * v.sn + slp * 0.12 * v.sn)
    const HX = (x: number, z: number) => hv.X(x, z)
    const HD = (x: number, z: number) => hv.D(x, z)
    const HW = (x: number, z: number) => {
      const cv = Math.cos(psiH + Math.atan2(x, z))
      return smooth(-0.14, 0.3, cv) * (0.36 + 0.64 * Math.max(0, cv))
    }
    const skullW = hv.W(q.hw, q.hl)
    const perk = a.alert * (1 - slp)
    const ear = (side: number) => {
      const ex = HX(side * q.hw * 0.62, -q.hl * 0.1)
      const dim = HD(side * q.hw, 0) < -q.hw * 0.3
      const col = dim ? far(k.body) : k.body
      c.save()
      if (q.ear === 'point') {
        c.translate(ex, -q.hh * 0.62)
        c.rotate(side * hv.cs * 0.26 * (1 - perk))
        P.shape(blob([-11, 4, 0, -24 - perk * 4, 11, 4]), col, { shade: 0.5 })
        if (!dim) P.flat(blob([-5, 2, 0, -15, 5, 2]), k.extra, 0.9)
      } else if (q.ear === 'flop') {
        c.translate(ex, -q.hh * 0.56)
        c.rotate(side * hv.cs * (0.5 - perk * 0.5) - hv.sn * (0.2 - perk * 0.7) - wag * 0.1)
        P.shape(blob([-10, -4, 8, -8, 14, 14, 6, 40, -8, 36, -14, 14]), dim ? far(k.mark) : k.mark, { shade: 0.7 })
      } else if (q.ear === 'long') {
        c.translate(ex, -q.hh * 0.7)
        c.rotate(side * hv.cs * (0.34 - perk * 0.2) - hv.sn * (0.3 - perk * 0.3) + wag * 0.06 * side)
        P.shape(blob([-8, 4, -9, -30, 0, -54, 9, -30, 8, 4]), col, { shade: 0.6 })
        if (!dim) P.flat(blob([-4, 0, -4, -28, 0, -44, 4, -28, 4, 0]), k.extra, 0.6)
      } else if (q.ear === 'side') {
        c.translate(HX(side * q.hw * 0.9, -q.hl * 0.2), -q.hh * 0.36)
        c.rotate(side * hv.cs * (0.5 - perk * 0.6) + hv.sn * (-0.5 + perk * 0.5))
        P.shape(ellipse(side * hv.cs * 9 - hv.sn * 8, 0, 13, 6.5, 0), dim ? far(k.mark) : kind === 'goat' ? k.body : k.mark, { shade: 0.3 })
      } else {
        P.shape(circle(HX(side * q.hw * 0.8, -q.hl * 0.3), -q.hh * 0.7, 8), col, { shade: 0.3 })
      }
      c.restore()
    }
    const earOrder = [-1, 1].sort((s1, s2) => HD(s1 * q.hw, 0) - HD(s2 * q.hw, 0))
    ear(earOrder[0])
    if (kind === 'goat') for (const side of earOrder) {
      // horns sweep back
      const bx = HX(side * q.hw * 0.4, -q.hl * 0.1)
      const tip = { x: HX(side * q.hw * 0.7, -q.hl * 1.5), y: -q.hh * 1.5 }
      P.shape(limbPath({ x: bx, y: -q.hh * 0.8 }, { x: (bx + tip.x) / 2 + hv.cs * side * 3, y: -q.hh * 1.5 }, tip, 9, 7, 3, 0.6), k.extra, { shade: 0.4 })
    }
    const headCol = kind === 'sheep' ? k.mark : k.body
    const facing = hv.cs > -0.3
    const snoutZ = q.hl * 0.55 + q.snout
    const snoutX = HX(0, snoutZ)
    const muzzle = kind === 'sheep' ? mixHex(k.mark, '#ffffff', 0.08) : kind === 'cat' || kind === 'goat' ? k.belly : kind === 'camel' ? k.belly : k.belly
    const drawSnout = () => {
      if (q.snout <= 0) return
      const sw = hv.W(q.snoutR, q.snoutR + q.snout * 0.5)
      P.shape(ellipse(snoutX, q.snoutY, sw, q.snoutR * (kind === 'donkey' || kind === 'camel' ? 1.05 : 0.86)), muzzle, { shade: 0.6 })
    }
    if (!facing) drawSnout()
    P.shape(ellipse(-hv.sn * q.hl * 0.08, 0, skullW, q.hh), headCol, { shade: 0.9 })
    if (kind === 'sheep' && !P.sil) P.group([circle(-10 - hv.sn * 4, -q.hh * 0.9, 10), circle(2 - hv.sn * 6, -q.hh * 1.06, 11), circle(13 - hv.sn * 8, -q.hh * 0.86, 9)], k.body, { shade: 0.4 })
    if (kind === 'cat' && !P.sil && facing) for (const u of [-0.3, 0, 0.3]) P.line(curve([HX(u * q.hw, q.hl * 0.6), -q.hh * 0.92, HX(u * q.hw * 0.9, q.hl * 0.7), -q.hh * 0.56]), k.mark, 5, 0.9)
    if (facing) {
      drawSnout()
      if (!P.sil) {
        const er = Math.max(4, q.hh * 0.19)
        for (const side of [-1, 1]) eye(P, HX(side * q.hw * 0.5, q.hl * 0.62), -q.hh * 0.14, er, a, kind === 'sheep' || kind === 'goat', HW(side * q.hw * 0.5, q.hl * 0.62))
        // nose and mouth, at the end of the muzzle
        const nx = HX(0, snoutZ + q.snoutR * 0.7)
        const nw = 0.5 + 0.5 * Math.abs(hv.cs)
        if (kind === 'cat') P.flat(poly([nx - 4 * nw, q.snoutY - 4, nx + 4 * nw, q.snoutY - 4, nx, q.snoutY]), k.extra)
        else if (kind === 'dog') P.shape(ellipse(nx, q.snoutY - 6, 7 * nw + 1, 5.5), '#3a2630', { shade: 0.3, line: 0.6 })
        else for (const side of [-1, 1]) P.flat(ellipse(HX(side * q.snoutR * 0.36, snoutZ + q.snoutR * 0.6), q.snoutY - 2, 2.2 * nw + 0.6, 3), mixHex(k.mark, DARK, 0.5), 0.8)
        const mx = HX(0, snoutZ + q.snoutR * 0.3)
        const my = q.snoutY + q.snoutR * 0.42
        if (a.open > 0.25) {
          P.flat(ellipse(mx, my + a.open * 4, 6 * nw + 2, 2 + a.open * 6), '#6e2733')
          if (kind === 'dog') P.shape(ellipse(mx + hv.sn * 2, my + 4 + a.open * 8, 5, 4 + a.open * 6), '#ee8f86', { shade: 0.3, line: 0.6 })
        } else P.line(curve([mx - 7 * nw, my - 1, mx, my + 2, mx + 7 * nw, my - 1]), '#5a3340', 1.6)
        if (kind === 'cat') for (const side of [-1, 1]) for (const dy of [-2, 3]) {
          const w0 = HW(side * q.hw * 0.4, q.hl * 0.8)
          if (w0 > 0.2) P.line(curve([HX(side * q.snoutR * 0.9, snoutZ), q.snoutY + dy * 0.6, HX(side * (q.hw + 8), snoutZ * 0.6), q.snoutY - 2 + dy * 1.6]), '#5a3340', 1, 0.6)
        }
        if (kind === 'dog' || kind === 'cat') for (const side of [-1, 1]) {
          const w0 = HW(side * q.hw * 0.7, q.hl * 0.4)
          if (w0 > 0.3) P.flat(ellipse(HX(side * q.hw * 0.66, q.hl * 0.5), q.hh * 0.24, 7 * w0, 5), '#f2a6a0', 0.45)
        }
        if (kind === 'goat') P.shape(blob([mx - 5, my + 4, mx + 5, my + 4, mx + hv.sn * 3, my + 22]), k.belly, { shade: 0.3, line: 0.7 })
      }
    }
    ear(earOrder[1])
    c.restore()
  }

  // ── in order, far to near ──
  const farLegs = legs.filter((l) => l.d < -1)
  const nearLegs = legs.filter((l) => l.d >= -1).sort((l1, l2) => l1.d - l2.d)
  for (const l of farLegs) drawLeg(l, !P.sil)
  const tailBehind = tailP.d < 0
  const headBehind = headP.d < -q.len * 0.4
  if (tailBehind) drawTail()
  if (headBehind) drawHead()
  if (kind === 'camel') {
    // the hump, behind the line of the back
    const hp = R(0, (rump.z + chest.z) / 2 - q.len * 0.1, (rump.y + chest.y) / 2 - q.rr * 0.9)
    P.shape(ellipse(hp.x, hp.y, v.W(q.wid * 0.7, q.len * 0.52), q.rr * 0.8), k.body, { shade: 0.8 })
  }
  if (kind === 'sheep') {
    // wool: curls all round the body, each with its own place, so they turn with it
    const wool: Pen[] = [hull, rumpE, chestE]
    for (let i = 0; i < 16; i++) {
      const t = (i / 16) * Math.PI * 2
      const z = Math.cos(t) * (q.len + q.rr * 0.86)
      const y = (rump.y + chest.y) / 2 + Math.sin(t) * q.rr * 0.92
      wool.push(circle(v.X(0, z) * 1 + (i % 2 ? 1 : -1) * v.cs * q.wid * 0.5, y, 17 + (i % 3) * 2))
    }
    P.group(wool, k.body, { shade: 0.7 })
  } else {
    P.group([rumpE, chestE, hull], k.body, { shade: 1 })
    if (!P.sil) {
      const reg = new Pen()
      reg.addPath(hull)
      reg.addPath(rumpE)
      reg.addPath(chestE)
      P.clip(hull, () => {
        if (kind !== 'camel') P.flat(ellipse((rumpP.x + chestP.x) / 2, Math.max(rumpP.y, chestP.y) + q.rr * 0.9, Math.abs(chestP.x - rumpP.x) / 2 + q.rr, q.rr * 0.5), k.belly, 0.9)
        if (kind === 'cat') for (const u of [0.25, 0.42, 0.59]) {
          const x = lerp(rumpP.x, chestP.x, u)
          const y = lerp(rumpP.y, chestP.y, u)
          P.line(curve([x - 3, y - q.rr, x, y - q.rr * 0.3]), k.mark, 5, 0.9)
        }
        if (kind === 'dog') P.flat(ellipse(lerp(rumpP.x, chestP.x, 0.3), lerp(rumpP.y, chestP.y, 0.3) - q.rr * 0.6, 26, 16), k.mark, 0.9)
        if (kind === 'donkey') P.line(curve([lerp(rumpP.x, chestP.x, 0.78), chestP.y - q.rc, lerp(rumpP.x, chestP.x, 0.8), chestP.y + q.rc * 0.2]), k.mark, 6, 0.7)
      })
      void reg
    }
  }
  if (sit > 0.5 && !P.sil && v.cs > 0.3) P.flat(ellipse(chestP.x, chestP.y + q.rc * 0.9, v.W(q.wid * 0.6, q.rc * 0.5), q.rc * 1.1), k.belly, 0.9)
  for (const l of nearLegs) drawLeg(l, false)
  if (!tailBehind) drawTail()
  if (!headBehind) drawHead()
}

// ── tortoise ──────────────────────────────────────────────────────────────────
function tortoise(P: Painter, a: AnimalPose, k: Coat) {
  const v = viewOf(a.view)
  const slp = clamp01(a.sleep)
  const hide = Math.max(slp, clamp01(a.sit)) // drawn into its shell
  const len = 46
  const wid = 34
  const R = (x: number, z: number, y: number): Pt & { d: number } => ({ x: v.X(x, z), y, d: v.D(x, z) })
  const up = 14 * (1 - hide) + a.alert * 4
  // four short legs that paddle
  const legs: { p: Pt & { d: number }; f: Pt }[] = []
  for (const fore of [true, false]) for (const side of [-1, 1]) {
    const st = step(a.walk + (fore === (side > 0) ? 0 : 0.5), 0.7)
    const z = (fore ? 1 : -1) * len * 0.62 + st.z * 40 * (1 - hide) * a.pace
    const p = R(side * wid * 0.74, z, -up - 4)
    legs.push({ p, f: { x: p.x + v.sn * 3, y: -4 - st.y * 6 * (1 - hide) * a.pace } })
  }
  const leg = (l: { p: Pt & { d: number }; f: Pt }, dim: boolean) => {
    if (hide > 0.8) return
    P.shape(limbPath(l.p, { x: (l.p.x + l.f.x) / 2, y: (l.p.y + l.f.y) / 2 }, l.f, 15, 14, 13, 0.4), dim ? far(k.body) : k.body, { shade: 0.5 })
  }
  for (const l of legs) if (l.p.d < 0) leg(l, !P.sil)
  // head on a neck that stretches out, or draws in
  const out = (1 - hide) * (1 + 0.3 * a.alert)
  const hp = R(0, len * 0.86 + 30 * out, -up - 16 - 16 * out - a.alert * 6)
  const head = () => {
    if (hide > 0.85) return
    const nb = R(0, len * 0.7, -up - 10)
    P.shape(limbPath(nb, { x: (nb.x + hp.x) / 2, y: (nb.y + hp.y) / 2 + 3 }, hp, 17, 14, 14, 0.5), k.body, { shade: 0.6 })
    const c = P.ctx
    c.save()
    c.translate(hp.x, hp.y)
    c.rotate(a.head * v.sn)
    const hv = viewOf(a.view - a.turn * 0.9)
    P.shape(ellipse(hv.sn * 3, 0, hv.W(13, 17), 13), k.body, { shade: 0.7 })
    if (!P.sil && hv.cs > -0.3) {
      for (const side of [-1, 1]) {
        const cv = Math.cos(a.view - a.turn * 0.9 + Math.atan2(side * 8, 9))
        eye(P, hv.X(side * 8, 9), -3, 3.4, a, false, smooth(-0.14, 0.3, cv))
      }
      const mx = hv.X(0, 15)
      if (a.open > 0.3) P.flat(ellipse(mx - hv.sn * 3, 6, 5, 2 + a.open * 3), '#6e2733')
      else P.line(curve([mx - hv.sn * 9 - hv.cs * 6, 5, mx - hv.sn * 3, 7, mx + hv.cs * 6, 5]), '#4a5a3a', 1.6)
    }
    c.restore()
  }
  if (hp.d < -10) head()
  // tail
  const tp = R(0, -len * 0.96, -up - 6)
  P.shape(blob([tp.x, tp.y - 5, tp.x - v.sn * 16 * (1 - hide), tp.y + 3, tp.x, tp.y + 5]), k.body, { shade: 0.3 })
  // the shell: a dome over a flat plate
  const w = v.W(wid, len)
  P.shape(blob([-w * 1.04, -up, -w * 0.98, -up + 9, w * 0.98, -up + 9, w * 1.04, -up]), k.belly, { shade: 0.5 })
  const dome = new Pen()
  dome.moveTo(-w * 1.06, -up)
  dome.bezierCurveTo(-w * 1.0, -up - 62, w * 1.0, -up - 62, w * 1.06, -up)
  dome.closePath()
  P.shape(dome, k.mark, { shade: 1.1 })
  if (!P.sil) P.clip(dome, () => {
    // the plates of the shell: each has its place on the dome
    for (const [px, pz, r] of [[0, 0, 15], [0, 30, 12], [0, -30, 12], [20, 14, 11], [-20, 14, 11], [20, -16, 11], [-20, -16, 11]] as const) {
      const d = v.D(px, pz)
      if (d < -14) continue
      const lift = 44 * (1 - (px * px) / (wid * wid) - (pz * pz) / (len * len) * 0.7)
      P.shape(ellipse(v.X(px, pz), -up - 6 - lift * 0.86, v.W(r, r * 1.1) * (0.5 + 0.5 * clamp01(d / 30 + 0.7)), r * 0.82), k.body, { shade: 0.4, line: 0.8 })
    }
    P.line(curve([-w, -up - 3, 0, -up - 8, w, -up - 3]), k.extra, 5, 0.9)
  })
  for (const l of legs) if (l.p.d >= 0) leg(l, false)
  if (hp.d >= -10) head()
}

// ── birds ─────────────────────────────────────────────────────────────────────
function bird(P: Painter, a: AnimalPose, k: Coat, hen: boolean) {
  const c = P.ctx
  const v = viewOf(a.view)
  const R = (x: number, z: number, y: number): Pt & { d: number } => ({ x: v.X(x, z), y, d: v.D(x, z) })
  const fly = a.lift > 0.05
  const s = hen ? 1.5 : 1
  const settle = clamp01(Math.max(a.sit, a.sleep))
  const legH = (hen ? 26 : 14) * (1 - settle)
  const by = -legH - 20 * s
  const bob = hen ? Math.abs(Math.sin(a.walk * Math.PI * 2)) * 2 * a.pace : 0
  // legs
  if (!fly && settle < 0.8) for (const side of [-1, 1]) {
    const st = step(a.walk + (side > 0 ? 0 : 0.5), 0.6)
    const top = R(side * 7 * s, -2, by + 12 * s)
    const foot = R(side * 7 * s, -2 + st.z * 46 * s * a.pace, -1 - st.y * 9 * s * a.pace)
    P.line(curve([top.x, top.y, (top.x + foot.x) / 2 - v.sn * 3, (top.y + foot.y) / 2, foot.x, foot.y]), k.extra, 3 * (hen ? 1.3 : 1))
    P.line(curve([foot.x - 5 * s, foot.y + 1, foot.x + v.sn * 2, foot.y, foot.x + 8 * s * (0.4 + 0.6 * Math.abs(v.sn)), foot.y + 1]), k.extra, 2.6 * (hen ? 1.3 : 1))
  }
  const tilt = (hen ? -0.1 : -0.16) * v.sn
  const body = R(0, 0, by - bob)
  // tail feathers, behind
  const tp = R(0, -24 * s, by - 2 * s - bob)
  const tail = () => {
    c.save()
    c.translate(tp.x, tp.y)
    c.rotate((0.2 + a.tail * 0.3) * v.sn + (hen ? -0.9 * v.sn : 0))
    if (hen) {
      const fan: Pen[] = []
      for (const u of [-0.5, 0, 0.5]) fan.push(ellipse(-v.sn * 16 + u * 4, -14 + Math.abs(u) * 8, 9, 20, u * 0.7 * v.sn))
      P.group(fan, k.mark, { shade: 0.5 })
    } else P.shape(blob([4 * v.sn, -8, -36 * v.sn, -14, -40 * v.sn, 0, -34 * v.sn, 10, 4 * v.sn, 8]), k.mark, { shade: 0.5 })
    c.restore()
  }
  const wing = (side: number) => {
    const wp = R(side * 20 * s, -2 * s, by - 6 * s - bob)
    const dim = wp.d < -4
    c.save()
    c.translate(wp.x, wp.y)
    c.rotate((-0.16 - a.flap * (hen ? 0.9 : 1.5)) * (v.sn >= 0 ? 1 : -1) * (0.3 + 0.7 * Math.abs(v.sn)) - side * v.cs * a.flap * 1.2)
    c.scale(s * (v.sn >= 0 ? 1 : -1), s)
    const fold = 0.4 + 0.6 * Math.abs(v.sn)
    P.shape(blob([10 * fold, -6, -8 * fold, -12, -34 * fold, -2, -30 * fold, 12, -8 * fold, 14, 10 * fold, 8]), dim ? far(k.mark) : k.mark, { shade: 0.7 })
    if (!dim) P.detail(curve([-24 * fold, 4, -8 * fold, 6, 4 * fold, 2]), k.mark, 0.6)
    c.restore()
  }
  // the head: forward and up; tucked down when asleep
  const hp = R(0, 18 * s * (1 - 0.5 * a.sleep), by - 24 * s * (1 - 0.5 * a.sleep) - bob * 2)
  const head = () => {
    const psiH = a.view - a.turn * 0.9
    const hv = viewOf(psiH)
    c.save()
    c.translate(hp.x, hp.y)
    c.rotate(a.head * v.sn)
    const o = a.open * 7
    const hr = hen ? 15 : 17
    const beak = () => {
      const bx = hv.X(0, hr * 0.74)
      const tipx = hv.X(0, hr * 0.74 + 20)
      const hwid = 5 * Math.abs(hv.cs) + 1
      P.shape(blob([bx - hwid, -6 - o * 0.4, tipx, -2 - o, bx + hwid, 2 - o * 0.2]), k.belly === COATS.hen.belly ? '#f2b53a' : k.extra, { shade: 0.3, line: 0.8 })
      P.shape(blob([bx - hwid, 1 + o * 0.2, tipx - hv.sn * 4, 2 + o, bx + hwid, 7 + o * 0.5]), mixHex(hen ? '#f2b53a' : k.extra, '#8a3a1a', 0.25), { shade: 0.3, line: 0.8 })
    }
    if (hv.cs < -0.2) beak()
    if (hen) {
      // comb on top, wattle under the beak
      const comb: Pen[] = []
      for (const u of [-0.5, 0, 0.5]) comb.push(circle(hv.X(0, u * 12), -hr * 0.96 - (u === 0 ? 3 : 0), 6))
      P.group(comb, k.extra, { shade: 0.3 })
    }
    P.shape(circle(-hv.sn * 1, 0, hr), k.body, { shade: 0.8 })
    if (hv.cs >= -0.2) {
      if (hen) P.shape(ellipse(hv.X(0, hr * 0.7), 11 + o, 5, 7), k.extra, { shade: 0.3, line: 0.7 })
      beak()
      if (!P.sil) for (const side of [-1, 1]) {
        const cv = Math.cos(psiH + Math.atan2(side * 8, 9))
        const w = smooth(-0.14, 0.3, cv)
        P.flat(ellipse(hv.X(side * 9, 7), 7, 9 * w, 6), '#f2a6a0', 0.45 * w)
        eye(P, hv.X(side * 8, 9), -3, 4.2, a, false, w)
      }
    }
    if (!hen) P.shape(blob([-8 * (v.sn || 1), -14, -4 * (v.sn || 1), -27, 2 * (v.sn || 1), -15]), k.mark, { shade: 0.3, line: 0.8 })
    c.restore()
  }
  if (tp.d < 0) tail()
  for (const side of [-1, 1]) if (v.D(side, 0) < 0) wing(side)
  if (hp.d < -8) head()
  const bodyE = ellipse(body.x, body.y, v.W(22 * s, 30 * s), 23 * s, tilt)
  P.shape(bodyE, k.body, { shade: 1 })
  P.clip(bodyE, () => P.flat(ellipse(body.x + v.sn * 8 * s, body.y + 14 * s, v.W(20 * s, 26 * s), 15 * s), k.belly))
  if (tp.d >= 0) tail()
  if (hp.d >= -8) head()
  for (const side of [-1, 1]) if (v.D(side, 0) >= 0 && Math.abs(v.sn) > 0.25) wing(side)
}

function fish(P: Painter, a: AnimalPose, k: Coat) {
  const c = P.ctx
  // a fish turns by swimming round: its length shortens toward us
  const sq = 0.3 + 0.7 * Math.abs(Math.sin(a.view))
  c.save()
  c.scale(sq, 1)
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
  c.restore()
}

// ── insects ───────────────────────────────────────────────────────────────────
/** A flat wing standing out from the body: `open` 0 = folded up over the back, 1 = spread level. Drawn from where it joins the body. */
function wingPath(v: V, side: number, open: number, pts: number[], lift = 0): Pen {
  // each point is (out along the wing, along the body); the wing rises as it folds
  const ang = (1 - open) * 1.35
  const q: number[] = []
  for (let i = 0; i < pts.length; i += 2) {
    const out = pts[i]
    const z = pts[i + 1]
    // insects are seen a little from above, so a wing lying flat still shows its whole shape
    q.push(v.X(side * out * Math.cos(ang), z), -out * Math.sin(ang) * 0.9 + v.D(side * out * Math.cos(ang), z) * 0.42 - lift)
  }
  return blob(q)
}
function butterfly(P: Painter, a: AnimalPose, k: Coat) {
  const v = viewOf(a.view)
  // wings beat between spread and folded; resting, they stand folded
  const open = a.sit > 0.5 ? 0.12 + 0.1 * a.flap : 0.18 + 0.82 * (0.5 + 0.5 * Math.cos(a.flap * Math.PI * 2))
  const sides = [-1, 1].sort((s1, s2) => v.D(s1, 0) - v.D(s2, 0))
  const wings = (side: number, dim: boolean) => {
    const fore = wingPath(v, side, open, [2, 4, 30, 30, 46, 14, 40, -8, 4, -6])
    const hind = wingPath(v, side, open, [2, -4, 34, -10, 36, -30, 16, -36, 2, -16])
    P.shape(hind, dim ? far(k.belly) : k.belly, { shade: 0.5 })
    P.shape(fore, dim ? far(k.mark) : k.mark, { shade: 0.6 })
    if (!P.sil && !dim) {
      P.clip(fore, () => P.flat(wingPath(v, side, open, [22, 12, 32, 20, 38, 12, 30, 4]), k.extra, 0.9))
      P.clip(hind, () => P.flat(wingPath(v, side, open, [18, -14, 26, -18, 26, -26, 18, -24]), k.extra, 0.8))
    }
  }
  wings(sides[0], !P.sil)
  const head = { x: v.X(0, 16), y: -2 }
  P.shape(limbPath({ x: v.X(0, -20), y: 0 }, { x: 0, y: -1 }, { x: v.X(0, 12), y: -1 }, 5, 8, 7, 0.5), k.body, { shade: 0.4 })
  P.shape(circle(head.x, head.y, 5.5), k.body, { shade: 0.3 })
  if (!P.sil) for (const side of [-1, 1]) P.line(curve([head.x, head.y - 4, head.x + v.X(side * 5, 8), head.y - 13, head.x + v.X(side * 8, 13), head.y - 15]), k.body, 1.4)
  wings(sides[1], false)
}
function ladybird(P: Painter, a: AnimalPose, k: Coat) {
  const v = viewOf(a.view)
  const len = 22
  const wid = 19
  const R = (x: number, z: number, y: number): Pt & { d: number } => ({ x: v.X(x, z), y, d: v.D(x, z) })
  const fly = a.lift > 0.05 || a.flap > 0.05
  const open = fly ? 0.5 + 0.5 * clamp01(a.flap) : 0
  // six legs
  if (!fly) for (const side of [-1, 1]) for (const i of [-1, 0, 1]) {
    const st = step(a.walk * 2 + (i === 0 ? 0.5 : 0) + (side > 0 ? 0 : 0.5), 0.6)
    const p = R(side * wid * 0.7, i * len * 0.6, -6)
    P.line(curve([p.x, p.y, p.x + v.X(side * 8, 0), -8 - st.y * 4 * a.pace, p.x + v.X(side * 11, st.z * 12 * a.pace), -st.y * 3 * a.pace]), k.mark, 2.2, p.d < 0 ? 0.6 : 1)
  }
  const hp = R(0, len * 0.92, -10)
  const head = () => {
    P.shape(ellipse(hp.x, hp.y, v.W(11, 9), 9), k.mark, { shade: 0.5 })
    if (!P.sil && v.cs > -0.3) {
      for (const side of [-1, 1]) {
        const cv = Math.cos(a.view + Math.atan2(side * 6, 5))
        const w = smooth(-0.14, 0.3, cv)
        if (w > 0.1) P.flat(circle(hp.x + v.X(side * 5.5, 5), hp.y - 1, 2.6 * (0.5 + 0.5 * w)), k.extra)
        P.line(curve([hp.x + v.X(side * 4, 4), hp.y - 7, hp.x + v.X(side * 8, 12), hp.y - 15]), k.mark, 1.4)
      }
    }
  }
  if (hp.d < -4) head()
  const w = v.W(wid, len)
  if (open > 0) {
    // wing cases lifted, the clear wings beating under them
    for (const side of [-1, 1]) P.flat(wingPath(v, side, 0.3 + 0.7 * Math.abs(Math.sin(a.flap * Math.PI * 6)), [3, 6, 34, 0, 36, -18, 8, -22], 14), k.extra, 0.7)
    P.shape(ellipse(0, -11, w * 0.7, 9), k.mark, { shade: 0.5 })
    for (const side of [-1, 1]) P.shape(wingPath(v, side, 0.55, [2, 16, 20, 12, 22, -16, 4, -20], 12), k.body, { shade: 0.6 })
  } else {
    const dome = new Pen()
    dome.moveTo(-w * 1.02, -5)
    dome.bezierCurveTo(-w * 1.0, -36, w * 1.0, -36, w * 1.02, -5)
    dome.quadraticCurveTo(0, -1, -w * 1.02, -5)
    dome.closePath()
    P.shape(dome, k.body, { shade: 1 })
    if (!P.sil) P.clip(dome, () => {
      // the line where the two wing cases meet, and the spots, each with its place on the dome
      const mid = v.X(0, 0)
      if (Math.abs(v.sn) < 0.92) P.line(curve([mid + v.X(0, len) * 0.9, -22 - 8 * Math.abs(v.cs), mid, -30, mid + v.X(0, -len) * 0.9, -22 - 8 * Math.abs(v.cs)]), k.mark, 1.6, 0.8)
      for (const [px, pz] of [[9, 10], [-9, 10], [11, -6], [-11, -6], [0, -14], [0, 4]] as const) {
        const d = v.D(px, pz)
        if (d < -8) continue
        const h = 24 * (1 - (px * px) / (wid * wid) * 0.8 - (pz * pz) / (len * len) * 0.6)
        P.flat(ellipse(v.X(px, pz), -8 - h, 4.6 * (0.45 + 0.55 * clamp01(d / 14 + 0.6)), 4.2), k.mark)
      }
    })
  }
  if (hp.d >= -4) head()
}
function bee(P: Painter, a: AnimalPose, k: Coat) {
  const v = viewOf(a.view)
  const len = 20
  const R = (x: number, z: number, y: number): Pt & { d: number } => ({ x: v.X(x, z), y, d: v.D(x, z) })
  const beat = Math.abs(Math.sin(a.flap * Math.PI * 9))
  const sides = [-1, 1].sort((s1, s2) => v.D(s1, 0) - v.D(s2, 0))
  const wing = (side: number) => P.flat(wingPath(v, side, a.sit > 0.5 ? 0.9 : 0.25 + 0.6 * beat, [2, 6, 24, 10, 34, -2, 22, -12, 4, -6], 12), k.extra, 0.75)
  wing(sides[0])
  const hp = R(0, len * 0.9, -2)
  const head = () => {
    P.shape(circle(hp.x, hp.y, 9.5), k.mark, { shade: 0.5 })
    if (!P.sil && v.cs > -0.3) for (const side of [-1, 1]) {
      const cv = Math.cos(a.view + Math.atan2(side * 6, 5))
      const w = smooth(-0.14, 0.3, cv)
      if (w > 0.1) eye(P, hp.x + v.X(side * 5, 6), hp.y - 1, 3, a, true, w)
      P.line(curve([hp.x + v.X(side * 3, 4), hp.y - 8, hp.x + v.X(side * 7, 10), hp.y - 16]), k.mark, 1.4)
    }
  }
  if (hp.d < -4) head()
  // legs tucked under
  if (!P.sil) for (const i of [-1, 0, 1]) P.line(curve([v.X(0, i * 8), 8, v.X(0, i * 8 - 3), 15]), k.mark, 1.6)
  const w = v.W(13, len)
  const body = ellipse(v.X(0, -4), 0, w, 13, -0.1 * v.sn)
  P.shape(body, k.body, { shade: 0.9 })
  if (!P.sil) P.clip(body, () => {
    for (const z of [-14, -2, 9]) P.flat(ellipse(v.X(0, z - 4), 0, 1.4 + 3.2 * Math.abs(v.sn), 14), k.mark, 0.92)
  })
  // the sting
  const sp = R(0, -len - 4, 1)
  if (sp.d < 6) P.shape(blob([sp.x + v.sn * 4, -2, sp.x - v.sn * 5, 1, sp.x + v.sn * 4, 4]), k.mark, { shade: 0, line: 0.6 })
  if (hp.d >= -4) head()
  wing(sides[1])
}

const HEIGHT: Record<AnimalKind, number> = { cat: 130, dog: 140, sheep: 115, goat: 150, donkey: 230, camel: 330, tortoise: 70, bird: 80, hen: 110, fish: 0, butterfly: 60, ladybird: 40, bee: 40 }

/** How tall an animal stands at scale 1, stage units (to place a hand on its back, or a label under it). */
export const animalHeight = (kind: AnimalKind) => HEIGHT[kind]

/**
 * How far an animal travels in one walk cycle, in stage units along the way it faces: add this to its x for every
 * whole number `walk` rises by (times sin(view) when it is not in side view) and its feet stay where they land.
 */
export function animalStride(kind: AnimalKind, scale = 1): number {
  if (kind === 'tortoise') return 40 * scale
  if (kind === 'bird') return 46 * scale
  if (kind === 'hen') return 46 * 1.5 * scale
  if (kind === 'ladybird') return 24 * scale
  if (kind in QUADS) {
    const q = QUADS[kind as keyof typeof QUADS]
    return q.len * 2 * q.stride * scale
  }
  return 0
}

/** Draws an animal. `coat` overrides any of the default colours. */
export function drawAnimal(P: Painter, kind: AnimalKind, a: AnimalPose, coat: Partial<Coat> = {}) {
  const k = { ...COATS[kind], ...coat }
  const pose = { ...restAnimal(), ...a }
  P.at(pose.x, pose.y - pose.lift * HEIGHT[kind] * pose.scale, pose.scale, () => {
    if (kind === 'tortoise') tortoise(P, pose, k)
    else if (kind === 'bird' || kind === 'hen') bird(P, pose, k, kind === 'hen')
    else if (kind === 'fish') fish(P, pose, k)
    else if (kind === 'butterfly') butterfly(P, pose, k)
    else if (kind === 'ladybird') ladybird(P, pose, k)
    else if (kind === 'bee') bee(P, pose, k)
    else quad(P, pose, k, QUADS[kind], kind)
  }, pose.flip)
}

/** The shadow an animal throws on the ground. Draw it first. */
export function drawAnimalShadow(P: Painter, kind: AnimalKind, a: AnimalPose) {
  const pose = { ...restAnimal(), ...a }
  P.castShadow(pose.x, pose.y, () => drawAnimal(P, kind, { ...pose, x: 0, y: 0, lift: 0 }), pose.lift * HEIGHT[kind] * pose.scale, 0.8)
}
