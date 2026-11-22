/**
 * Direction 1 · FROM ABOVE.
 *
 * Idea: a photograph taken straight down, as in a flat-lay. The floor, a rug, the things and the people are cut
 * paper with soft shadows under them; nobody is drawn with an outline. What matters is where things are and
 * where they go, so it suits activities about a place, a path or a group (a circle is truly a circle here).
 *
 * The system
 * - People and hands: the same character sheets, seen from above by a small figure of this direction's own
 *   (the builder has no top view): hair shape and colour, shoulders in the person's own colour, arms that reach.
 *   Sizes come from the builder's rig, so a toddler is a toddler.
 * - Materials: the things laid out neatly on the floor, as for a photograph.
 * - Framing and number: a paper token in the corner where reading starts: the numeral and a row of pips.
 * - Motion in a still: a stitched white path with an arrow head, and a pale print of where somebody was.
 * - Speech: a paper bubble with a picture in it.
 * - Caption: on a paper label taped over the bottom of the picture, as real text.
 * - Loop: stop-motion, 8 drawings a second; it ends where it began.
 */
import { guide } from '@/cast/instruction-cast'
import type { Sheet } from '@/cast/sheet'
import { rigOf, type Rig } from '../figure/rig'
import { Painter, Pen, TAU, blob, circle, curve, cutRect, ellipse, lerp, limbPath, rrect, seededList, type Pt } from '../kit/core'
import { mixHex } from '../style/color'
import { INSTRUCTION_PROFILES } from '../style/instruction-profiles'
import { arrow, bubble, cushion, ease, icon, numeral, pips, softShadow, spoon, stick, tumbler, tumblerTop, wrap } from './kit'
import type { Direction, DrawCtx } from './types'

const PR = INSTRUCTION_PROFILES.above
const C = PR.c
const W = PR.W
const H = PR.H
const INK = C.ink

// ── a person seen from above ──────────────────────────────────────────────────
type TopFig = {
  s: Sheet
  x: number
  y: number
  /** Which way the person faces, radians on the picture (0 = right, π/2 = down). */
  a: number
  sc: number
  sit?: boolean
  /** Walking: 0…1 through a stride (feet show in front and behind). */
  step?: number
  /** Where each hand is, in the picture. Default: on the knees (sitting) or at the sides. */
  r?: Pt
  l?: Pt
  /** Head turned from the body's facing, radians. */
  look?: number
  /** 0…1: drawn pale. */
  ghost?: number
}

const under = (s: Sheet) => s.top.trim ?? mixHex(s.top.color, '#fff6e6', 0.62)

function hairTop(P: Painter, s: Sheet, R: number) {
  const hc = s.hair.color
  const st = s.hair.style
  if (st === 'none') return
  const cap = (back: number, size: number) => P.shape(circle(0, R * back, R * size), hc, { shade: 0.9 })
  if (st === 'covered') {
    P.shape(circle(0, R * 0.12, R * 1.12), s.hair.cover ?? hc, { shade: 0.9 })
    return
  }
  if (st === 'braids') {
    for (const side of [-1, 1]) {
      const parts = [0, 1, 2, 3].map((i) => ellipse(side * R * (0.7 + i * 0.1), R * (0.86 + i * 0.36), R * (0.27 - i * 0.03), R * 0.24, side * 0.3))
      P.group(parts, hc, { shade: 0.5 })
      P.flat(circle(side * R * 1.03, R * 2.08, R * 0.1), '#e9a23a')
    }
  }
  if (st === 'ponytail') P.shape(blob([-R * 0.26, R * 0.8, R * 0.3, R * 0.8, R * 0.5, R * 1.5, R * 0.3, R * 2.1, R * 0.02, R * 1.6]), hc, { shade: 0.7 })
  if (st === 'curls') {
    const parts: Pen[] = [circle(0, R * 0.14, R * 0.74)]
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU
      parts.push(circle(Math.cos(a) * R * 0.7, R * 0.16 + Math.sin(a) * R * 0.7, R * 0.4))
    }
    P.group(parts, hc, { shade: 0.6 })
    for (const [x, y] of [[-0.3, -0.1], [0.3, 0.2], [0, 0.5], [-0.4, 0.5], [0.4, -0.2]]) P.detail(curve([R * (x - 0.14), R * y, R * x, R * (y - 0.16), R * (x + 0.14), R * y]), hc, 0.9)
    return
  }
  if (st === 'bob' || st === 'long') cap(0.16, 1.12)
  else if (st === 'short') cap(0.2, 0.95)
  else cap(0.16, 1.02)
  // the parting, and the light on the crown
  P.detail(curve([0, -R * 0.74, R * 0.05, -R * 0.1, -R * 0.02, R * 0.5]), hc, 0.9)
  if (st === 'bun') P.shape(circle(0, R * 0.52, R * 0.46), hc, { shade: 0.8 })
  if (st === 'ponytail') P.flat(ellipse(R * 0.02, R * 0.84, R * 0.24, R * 0.12), '#e9a8c0')
  if (st === 'tuft') P.shape(circle(0, R * 0.1, R * 0.3), hc, { shade: 0.6 })
}

function pattern(P: Painter, s: Sheet, r: number) {
  const pat = s.top.pattern
  if (!pat || pat === 'plain') return
  const col = s.top.trim ?? mixHex(s.top.color, '#fff6e6', 0.5)
  const step = r * 0.34
  if (pat === 'stripes') for (let y = -r * 1.4; y < r * 1.4; y += step) P.flat(rrect(-r * 2, y, r * 4, step * 0.42, 0), col)
  else if (pat === 'dots') {
    for (let y = -r * 1.4, row = 0; y < r * 1.4; y += step * 0.8, row++) for (let x = -r * 2 + (row % 2) * step * 0.5; x < r * 2; x += step) P.flat(circle(x, y, step * 0.17), col)
  } else {
    for (let y = -r * 1.4; y < r * 1.4; y += step) P.flat(rrect(-r * 2, y, r * 4, step * 0.24, 0), col, 0.75)
    for (let x = -r * 2; x < r * 2; x += step) P.flat(rrect(x, -r * 2, step * 0.24, r * 4, 0), col, 0.75)
  }
}

/** Where the elbow goes for a hand at `ha`: an arm seen from above is shortened (it also goes down), so it never has to stretch flat. */
function elbowOf(g: Rig, sh: Pt, ha: Pt, side: number): { el: Pt; ha: Pt } {
  let dx = ha.x - sh.x
  let dy = ha.y - sh.y
  let d = Math.hypot(dx, dy)
  const max = (g.armU + g.armL) * 0.98
  if (d > max) {
    dx *= max / d
    dy *= max / d
    d = max
  }
  if (d < 1) return { el: { x: sh.x + side * g.armU * 0.3, y: sh.y }, ha: { x: sh.x + dx, y: sh.y + dy } }
  const l = Math.max(d * 0.56, (g.armU + g.armL) * 0.3)
  const off = Math.sqrt(Math.max(0, l * l - (d / 2) * (d / 2)))
  const mx = sh.x + dx / 2
  const my = sh.y + dy / 2
  // the two places the elbow could be; it bends away from the body
  const e1 = { x: mx - (dy / d) * off, y: my + (dx / d) * off }
  const e2 = { x: mx + (dy / d) * off, y: my - (dx / d) * off }
  return { el: side * e1.x > side * e2.x ? e1 : e2, ha: { x: sh.x + dx, y: sh.y + dy } }
}

function topFigure(P: Painter, f: TopFig) {
  if (f.ghost !== undefined) {
    P.layer(() => topFigure(P, { ...f, ghost: undefined }), f.ghost)
    return
  }
  const c = P.ctx
  const s = f.s
  const g = rigOf(s, P.style)
  const rot = f.a + Math.PI / 2
  const cr = Math.cos(rot)
  const sr = Math.sin(rot)
  const local = (p: Pt): Pt => {
    const dx = (p.x - f.x) / f.sc
    const dy = (p.y - f.y) / f.sc
    return { x: dx * cr + dy * sr, y: -dx * sr + dy * cr }
  }
  const sh = g.shW
  const R = g.headRx
  const trousers = s.bottom.style === 'trousers'
  const legCol = trousers ? s.bottom.color : s.skin
  const long = s.top.style === 'dress' || s.top.style === 'tunic' || s.top.style === 'coat' || s.top.style === 'apron' || s.bottom.style === 'skirt'
  const skirtCol = s.bottom.style === 'skirt' ? s.bottom.color : s.top.color
  const shoe = s.shoes.style === 'bare' ? s.skin : s.shoes.color
  P.at(f.x, f.y, f.sc, () => {
    c.rotate(rot)
    const hj = g.hipJ * 1.25
    if (f.sit) {
      // cross-legged: thighs out and forward, shins back across the middle, a foot showing at each side
      softShadow(P, ellipse(0, -g.legU * 0.4, hj + g.legU * 0.9, g.legU * 0.9), 5, 9, 16, 0.3)
      for (const side of [1, -1]) {
        const hip = { x: side * hj, y: -sh * 0.1 }
        const knee = { x: side * (hj + g.legU * 0.8), y: -g.legU * 0.62 }
        const ankle = { x: -side * g.legW1 * 0.3, y: -g.legU * 1.0 }
        P.shape(ellipse(ankle.x - side * g.footL * 0.36, ankle.y - g.footL * 0.04, g.footL * 0.54, g.footL * 0.32, -side * 0.2), shoe, { shade: 0.6 })
        P.shape(limbPath(hip, knee, ankle, g.legW0, g.legWj, g.legW1, 0.5), legCol, { shade: 0.9 })
        if (s.bottom.style === 'shorts') P.shape(limbPath(hip, knee, ankle, g.legW0 * 1.1, g.legWj * 1.1, g.legW1, 0.5, 0.42), s.bottom.color, { shade: 0.8 })
      }
      if (long) P.shape(blob([-sh * 1.0, 0, -hj - g.legU * 0.5, -g.legU * 0.5, -sh * 0.3, -g.legU * 0.74, sh * 0.3, -g.legU * 0.74, hj + g.legU * 0.5, -g.legU * 0.5, sh * 1.0, 0]), skirtCol, { shade: 0.8 })
    } else {
      // standing or walking: only the feet show, one ahead and one behind
      const st = f.step ?? 0.5
      const swing = Math.sin(st * TAU) * g.footL * 0.7
      softShadow(P, ellipse(0, 0, sh * (long ? 1.6 : 1.2), sh * (long ? 1.5 : 0.9)), 5, 9, 16, 0.3)
      for (const side of [1, -1]) P.shape(ellipse(side * hj, -g.footL * 0.3 + side * swing, g.footL * 0.3, g.footL * 0.52), shoe, { shade: 0.6 })
      if (long) P.shape(circle(0, sh * 0.06, sh * 1.44), skirtCol, { shade: 1 })
    }
    // shoulders and chest
    const apron = s.top.style === 'apron'
    const topCol = apron ? under(s) : s.top.color
    const torso = ellipse(0, 0, sh * 1.1, sh * 0.68)
    P.shape(torso, topCol, { shade: 1, over: () => (apron ? P.flat(rrect(-sh * 0.56, -sh * 0.9, sh * 1.12, sh * 0.9, sh * 0.1), s.top.color) : pattern(P, s, sh)) })
    // arms
    const sleeve = s.top.style === 'tee' || s.top.style === 'dress' ? 0.34 : 0.96
    const hands: [Pt, number][] = []
    for (const side of [1, -1]) {
      const t = side > 0 ? f.r : f.l
      const s0 = { x: side * sh * 0.92, y: -sh * 0.04 }
      const rest = f.sit ? { x: side * (hj + g.legU * 0.62), y: -g.legU * 0.5 } : { x: side * sh * 1.2, y: -sh * 0.2 }
      const k = elbowOf(g, s0, t ? local(t) : rest, side)
      if (sleeve < 0.9) P.shape(limbPath(s0, k.el, k.ha, g.armW0 * 0.9, g.armWj * 0.92, g.armW1, 0.5), s.skin, { shade: 0.8 })
      P.shape(limbPath(s0, k.el, k.ha, g.armW0 * 1.12, g.armWj * 1.1, g.armW1 * 1.08, 0.5, sleeve), topCol, { shade: 0.8 })
      hands.push([k.ha, Math.atan2(k.ha.y - k.el.y, k.ha.x - k.el.x)])
    }
    for (const [h, ang] of hands) P.shape(ellipse(h.x + Math.cos(ang) * g.hand * 0.5, h.y + Math.sin(ang) * g.hand * 0.5, g.hand * 1.2, g.hand * 0.95, ang), s.skin, { shade: 0.6 })
    // the head: nose and ears first, then the skull, then the hair
    c.save()
    c.translate(0, -sh * 0.2)
    c.rotate(f.look ?? 0)
    softShadow(P, circle(0, 0, R * 1.06), 3, 6, 10, 0.26)
    const hidesEars = s.hair.style === 'bob' || s.hair.style === 'long' || s.hair.style === 'covered' || s.hair.style === 'curls'
    if (!hidesEars) for (const side of [-1, 1]) P.shape(ellipse(side * R * 0.98, R * 0.04, R * 0.16, R * 0.2), s.skin, { shade: 0.4 })
    P.shape(ellipse(0, -R * 0.98, R * 0.17, R * 0.15), s.skin, { shade: 0.3 })
    P.shape(circle(0, 0, R), s.skin, { shade: 0.8 })
    if (s.extras?.includes('glasses')) {
      const gc = s.extraColors?.glasses ?? '#3a2a34'
      P.line(curve([-R * 0.62, -R * 0.74, -R * 0.3, -R * 0.94, 0, -R * 0.9, R * 0.3, -R * 0.94, R * 0.62, -R * 0.74]), gc, R * 0.07)
    }
    hairTop(P, s, R)
    c.restore()
  })
}

// ── the floor, the rugs, the paper signs ──────────────────────────────────────
function woodFloor(P: Painter) {
  const base = rrect(0, 0, W, H, 0)
  P.shape(base, C.wood, { line: 0, shade: 0 })
  const r = seededList(77, 60)
  const ph = 126
  for (let row = 0, y = -20; y < H; y += ph, row++) {
    const joints = [r[row * 3] * W * 0.6 + 80, r[row * 3 + 1] * W * 0.5 + W * 0.5]
    let x0 = -10
    let i = 0
    for (const x1 of [...joints.sort((a, b) => a - b), W + 10]) {
      P.flat(rrect(x0, y, x1 - x0, ph, 0), mixHex(C.wood, r[(row * 5 + i) % 60] > 0.5 ? C.woodDark : '#ecd0a2', 0.16 + r[(row * 7 + i) % 60] * 0.3))
      x0 = x1
      i++
    }
    for (const x of joints) P.line(curve([x, y, x, y + ph]), C.woodDark, 2.2, 0.7)
    P.line(curve([0, y, W, y]), C.woodDark, 2.6, 0.8)
  }
  P.speckle(base, C.wood, 9, [0, 0, W, H], 0.9, 2.2)
}
function softFloor(P: Painter) {
  const base = rrect(0, 0, W, H, 0)
  P.shape(base, C.floorB, { line: 0, shade: 0 })
  for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) if ((i + j) % 2) P.flat(rrect(i * 180 - 40, j * 180 - 40, 180, 180, 0), C.floorBDark, 0.5)
  P.speckle(base, C.floorB, 4, [0, 0, W, H], 0.7, 2)
}
function rugRect(P: Painter, x: number, y: number, w: number, h: number, col: string) {
  const p = cutRect(x - w / 2, y - h / 2, w, h, 26, 4, 3)
  softShadow(P, p, 4, 7, 12, 0.3)
  // fringe at the two short ends
  const fr = new Pen()
  for (let i = 0; i <= 40; i++) {
    const fx = x - w / 2 + 16 + (i / 40) * (w - 32)
    fr.moveTo(fx, y - h / 2 + 4)
    fr.lineTo(fx - 2, y - h / 2 - 16)
    fr.moveTo(fx, y + h / 2 - 4)
    fr.lineTo(fx + 2, y + h / 2 + 16)
  }
  P.line(fr, C.rugB, 4.5)
  P.shape(p, col, { shade: 0.6, over: () => {
    P.flat(rrect(x - w / 2 + 34, y - h / 2 + 34, w - 68, h - 68, 16), C.rugB)
    P.flat(rrect(x - w / 2 + 52, y - h / 2 + 52, w - 104, h - 104, 12), col)
    for (let i = 0; i < 7; i++) P.flat(rrect(x - w / 2 + 52, y - h / 2 + 100 + i * ((h - 200) / 6) - 5, w - 104, 10, 0), mixHex(col, C.rugB, 0.3), 0.8)
  } })
  P.speckle(p, col, 12, [x - w / 2, y - h / 2, w, h], 1.2, 1.6)
}
function rugRound(P: Painter, x: number, y: number, r: number) {
  softShadow(P, circle(x, y, r), 4, 7, 12, 0.3)
  P.shape(circle(x, y, r), C.rugC, { shade: 0.6 })
  P.flat(circle(x, y, r * 0.86), C.rugB)
  P.flat(circle(x, y, r * 0.78), C.rugA)
  P.flat(circle(x, y, r * 0.48), C.rugB)
  P.flat(circle(x, y, r * 0.4), '#e9a23a')
  P.speckle(circle(x, y, r), C.rugA, 14, [x - r, y - r, r * 2, r * 2], 1.2, 1.6)
}

/** The paper token with the step number, and the label the caption sits on. */
function signs(P: Painter, d: DrawCtx) {
  const c = P.ctx
  if (d.card.n > 0) {
    const x = d.rtl ? W - 122 : 122
    const y = 122
    const t = circle(x, y, 86)
    softShadow(P, t, 4, 8, 12, 0.34)
    P.shape(t, C.token, { shade: 0.5 })
    numeral(P, d.card.n, x, y - 14, 92, INK, { weight: 0.2 })
    pips(P, x - (d.rtl ? -1 : 1) * (d.steps - 1) * 13, y + 56, d.card.n, d.steps, 7.5, C.accent, '#d9cdb8', d.rtl, 3.5)
  }
  const b = PR.caption.box!
  const label = cutRect(b.x, b.y, b.w, b.h, 14, 21, 2.4)
  softShadow(P, label, 4, 9, 14, 0.36)
  P.shape(label, C.label, { shade: 0.4 })
  // two pieces of paper tape hold it down
  for (const [tx, rot, col] of [[b.x + 6, -0.5, C.tape], [b.x + b.w - 6, 0.46, C.tape2]] as const) {
    c.save()
    c.translate(tx, b.y + 10)
    c.rotate(rot)
    c.globalAlpha = 0.86
    P.shape(rrect(-58, -19, 116, 38, 3), col, { shade: 0, line: 0 })
    c.restore()
  }
}
const EDGE = '#4a3340'
const say = (P: Painter, x: number, y: number, to: Pt, w: number, h: number, inside: () => void, o: { dashed?: boolean; pop?: number } = {}) =>
  bubble(P, x, y, w, h, { to, edge: EDGE, lw: 3, shadow: 8, fill: '#fffaf0', ...o }, inside)
const giving = (P: Painter, what: 'cushion' | 'cup', ang: number) => {
  P.at(-34, 0, 1, () => (what === 'cup' ? tumblerTop(P, 0, 0, 34) : icon(P, 'cushion', 84)))
  P.at(44, 0, 1, () => {
    P.ctx.rotate(ang)
    arrow(P, [-28, 0, 0, 0, 30, 0], { width: 12, color: C.accent, edge: EDGE, head: 28 })
  })
}
const path = (P: Painter, pts: number[], o: { alpha?: number; head?: number } = {}) => arrow(P, pts, { dash: [3, 27], width: 12, color: C.arrow, edge: EDGE, head: 34, ...o })

/** A hand lying over the edge of a thing that was drawn after the person (so the thing sits on the arms, and the fingers on the thing). */
function handOn(P: Painter, s: Sheet, sc: number, p: Pt, ang = 0) {
  const g = rigOf(s, P.style)
  P.at(p.x, p.y, sc, () => {
    P.ctx.rotate(ang)
    P.shape(ellipse(0, 0, g.hand * 1.2, g.hand * 0.95), s.skin, { shade: 0.6 })
  })
}
/** Light falling across the floor from one corner, as in a photograph by a window. */
function daylight(P: Painter) {
  const c = P.ctx
  const g = c.createLinearGradient(0, 0, W, H)
  g.addColorStop(0, 'rgba(255,246,214,0.22)')
  g.addColorStop(0.5, 'rgba(255,246,214,0)')
  g.addColorStop(1, 'rgba(70,50,90,0.2)')
  c.save()
  c.fillStyle = g
  c.fillRect(0, 0, W, H)
  c.restore()
}

// ── activity A: here you are, thank you ───────────────────────────────────────
const S = 1.36
const UP = -Math.PI / 2
const DOWN = Math.PI / 2
function hereYouAre(P: Painter, d: DrawCtx) {
  const lia = guide('lia')
  const mum = guide('mother')
  const key = d.card.key
  woodFloor(P)
  if (key === 'materials') {
    rugRect(P, 540, 450, 900, 640, C.rugHome)
    cushion(P, 350, 450, 380, { ratio: 0.94, rot: -0.08, shadow: 12 })
    // the tumbler lies on its side, so we see that it is empty
    tumbler(P, 660, 470, 290, { rot: Math.PI / 2 - 0.12, shadow: 10 })
    daylight(P)
    return signs(P, d)
  }
  rugRect(P, 540, 470, 700, 800, C.rugHome)
  const M = { x: 540, y: 716 }
  const mumAt = (o: Partial<TopFig>): TopFig => ({ s: mum, x: M.x, y: M.y, a: UP, sc: S, sit: true, ...o })
  if (key === 's1') {
    // Lia comes down the rug with the cushion held out in front; a pale Lia shows where she was
    const walker = (x: number, y: number, a: number, step: number, ghost?: number) => {
      const fx = Math.cos(a)
      const fy = Math.sin(a)
      const c = { x: x + fx * 92, y: y + fy * 92 }
      const hr = { x: c.x + fy * 66 - fx * 16, y: c.y - fx * 66 - fy * 16 }
      const hl = { x: c.x - fy * 66 - fx * 16, y: c.y + fx * 66 - fy * 16 }
      const draw = () => {
        topFigure(P, { s: lia, x, y, a, sc: S, step, r: hr, l: hl })
        cushion(P, c.x, c.y, 150, { ratio: 0.94, rot: a - Math.PI / 2, shadow: ghost ? 0 : 7 })
        handOn(P, lia, S, hr, a)
        handOn(P, lia, S, hl, a)
      }
      if (ghost) P.layer(draw, ghost)
      else draw()
    }
    walker(330, 150, 1.1, 0.2, 0.3)
    topFigure(P, mumAt({ l: { x: 462, y: 560 }, r: { x: 618, y: 560 } }))
    walker(476, 322, 1.3, 0.7)
    path(P, [528, 480, 548, 520, 544, 548])
    daylight(P)
    return signs(P, d)
  }
  const L = { x: 540, y: 262 }
  const liaAt = (o: Partial<TopFig>): TopFig => ({ s: lia, x: L.x, y: L.y, a: DOWN, sc: S, step: 0.5, ...o })
  if (key === 's2') {
    const t = wrap(P.held(d.t), d.card.loop ?? 3)
    const out = ease(t, 0.25, 1.0) * (1 - ease(t, 2.4, 2.95))
    const take = ease(t, 0.9, 1.5) * (1 - ease(t, 2.3, 2.8))
    const pop = ease(t, 0.95, 1.25) * (1 - ease(t, 2.35, 2.6))
    const cy = lerp(366, 416, out)
    const lr = { x: 540 - 70, y: cy - 60 }
    const ll = { x: 540 + 70, y: cy - 60 }
    const mr = { x: lerp(618, 612, take), y: lerp(560, cy + 70, take) }
    const ml = { x: lerp(462, 468, take), y: lerp(560, cy + 70, take) }
    topFigure(P, mumAt({ l: ml, r: mr }))
    topFigure(P, liaAt({ l: ll, r: lr }))
    cushion(P, 540, cy, 172, { ratio: 0.94, shadow: 8 })
    handOn(P, lia, S, lr, DOWN)
    handOn(P, lia, S, ll, DOWN)
    if (take > 0.6) {
      handOn(P, mum, S, mr, UP)
      handOn(P, mum, S, ml, UP)
    }
    say(P, 810, 250, { x: 650, y: 262 }, 230, 124, () => giving(P, 'cushion', DOWN), { pop })
    daylight(P)
    return signs(P, d)
  }
  if (key === 's3') {
    const cy = 540
    const mr = { x: 624, y: cy + 16 }
    const ml = { x: 456, y: cy + 16 }
    topFigure(P, mumAt({ l: ml, r: mr }))
    topFigure(P, liaAt({ l: { x: 628, y: 318 }, r: { x: 452, y: 318 } }))
    cushion(P, 540, cy, 180, { ratio: 0.94, shadow: 8 })
    handOn(P, mum, S, mr, UP)
    handOn(P, mum, S, ml, UP)
    say(P, 836, 640, { x: 668, y: 690 }, 164, 132, () => icon(P, 'heart', 86))
    daylight(P)
    return signs(P, d)
  }
  // s4: the other way round, with the cup
  const cy = 430
  const mr = { x: 596, y: cy + 46 }
  const ml = { x: 484, y: cy + 46 }
  topFigure(P, mumAt({ l: ml, r: mr }))
  topFigure(P, liaAt({ l: { x: 600, y: cy - 60 }, r: { x: 480, y: cy - 60 } }))
  tumblerTop(P, 540, cy, 62, { shadow: 8 })
  handOn(P, mum, S, mr, UP - 0.5)
  handOn(P, mum, S, ml, UP + 0.5)
  say(P, 836, 640, { x: 668, y: 690 }, 220, 120, () => giving(P, 'cup', UP))
  say(P, 800, 232, { x: 650, y: 262 }, 160, 128, () => icon(P, 'heart', 84))
  daylight(P)
  return signs(P, d)
}

// ── activity B: the talking stick ─────────────────────────────────────────────
const SB = 1.3
const CX = 540
const CY = 436
const RING = 276
/** The four seats, clockwise from the top: the teacher, Sara, Jonah, Tom. Each faces the middle. */
const RING_OF = ['teacher', 'sara', 'jonah', 'tom'] as const
const seatAngle = (i: number) => -Math.PI / 2 + (i * TAU) / 4
const seat = (i: number): TopFig => {
  const a = seatAngle(i)
  return { s: guide(RING_OF[i]), x: CX + Math.cos(a) * RING, y: CY + Math.sin(a) * RING, a: a + Math.PI, sc: SB, sit: true }
}
/** The stick at angle `a` round the circle, held across in front of whoever sits there. */
const stickAt = (a: number, r = 140) => ({ x: CX + Math.cos(a) * r, y: CY + Math.sin(a) * r, rot: a + Math.PI / 2 })
const SLEN = 170
/** The two ends of the stick, a little in from the tips: where hands hold it. */
const grips = (st: { x: number; y: number; rot: number }, k = 0.36): [Pt, Pt] => [
  { x: st.x - Math.cos(st.rot) * SLEN * k, y: st.y - Math.sin(st.rot) * SLEN * k },
  { x: st.x + Math.cos(st.rot) * SLEN * k, y: st.y + Math.sin(st.rot) * SLEN * k },
]
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y)

function ringScene(P: Painter, d: DrawCtx, stickA: number | null, looks: number[], extra?: () => void) {
  softFloor(P)
  rugRound(P, CX, CY, 396)
  const st = stickA === null ? null : stickAt(stickA)
  const onStick: [Sheet, Pt][] = []
  const figs = [0, 1, 2, 3].map((i) => {
    const f = seat(i)
    f.look = looks[i] ?? 0
    if (st && stickA !== null) {
      // how near the stick is to this seat, 0…1: within reach, both hands go to it
      let da = Math.abs(((((stickA - seatAngle(i)) % TAU) + TAU + Math.PI) % TAU) - Math.PI)
      da = Math.max(0, 1 - da / 0.9)
      const k = da * da * (3 - 2 * da)
      if (k > 0.02) {
        const [g0, g1] = grips(st)
        const rest = { l: restHand(f, -1), r: restHand(f, 1) }
        // each hand takes the end of the stick that is nearer to it
        const straight = dist(rest.r, g0) + dist(rest.l, g1) < dist(rest.r, g1) + dist(rest.l, g0)
        const gr = straight ? g0 : g1
        const gl = straight ? g1 : g0
        f.r = { x: lerp(rest.r.x, gr.x, k), y: lerp(rest.r.y, gr.y, k) }
        f.l = { x: lerp(rest.l.x, gl.x, k), y: lerp(rest.l.y, gl.y, k) }
        if (k > 0.7) onStick.push([f.s, f.r], [f.s, f.l])
      }
    }
    return f
  })
  for (const f of figs) topFigure(P, f)
  if (st) {
    stick(P, st.x, st.y, SLEN, { rot: st.rot, shadow: 6 })
    for (const [s, p] of onStick) handOn(P, s, SB, p, st.rot + Math.PI / 2)
  }
  extra?.()
  daylight(P)
  signs(P, d)
}
/** Where a hand rests on the knee, in the picture (the same sum topFigure does). `side`: +1 the person's right. */
function restHand(f: TopFig, side: number): Pt {
  const g = rigOf(f.s, PR.style)
  const lx = side * (g.hipJ * 1.25 + g.legU * 0.62)
  const ly = -g.legU * 0.5
  const rot = f.a + Math.PI / 2
  return { x: f.x + (lx * Math.cos(rot) - ly * Math.sin(rot)) * f.sc, y: f.y + (lx * Math.sin(rot) + ly * Math.cos(rot)) * f.sc }
}

function talkingStick(P: Painter, d: DrawCtx) {
  const key = d.card.key
  if (key === 'materials') {
    woodFloor(P)
    rugRect(P, 540, 450, 900, 640, C.rugA)
    stick(P, 340, 440, 460, { rot: -1.0, shadow: 10 })
    spoon(P, 760, 460, 460, { rot: -1.2, shadow: 10 })
    // "or": a paper slash between the two
    const c = P.ctx
    c.save()
    c.translate(556, 452)
    c.rotate(0.32)
    softShadow(P, rrect(-13, -92, 26, 184, 13), 3, 6, 9, 0.34)
    P.shape(rrect(-13, -92, 26, 184, 13), C.token, { shade: 0.4 })
    c.restore()
    daylight(P)
    return signs(P, d)
  }
  if (key === 's1') {
    return ringScene(P, d, null, [0, 0, 0, 0], () => {
      const c = P.ctx
      c.save()
      c.setLineDash([3, 30])
      c.lineCap = 'round'
      c.lineWidth = 18
      c.strokeStyle = EDGE
      c.beginPath()
      c.arc(CX, CY, 96, 0, TAU)
      c.stroke()
      c.lineWidth = 12
      c.strokeStyle = P.col(C.arrow)
      c.stroke()
      c.restore()
    })
  }
  if (key === 's2') {
    return ringScene(P, d, seatAngle(0), [0, 0.5, 0, -0.5], () => {
      say(P, 810, 130, { x: 640, y: 150 }, 178, 138, () => icon(P, 'sun', 100))
      // the words going out to the listeners
      for (const r of [0, 1, 2]) P.line(curve([CX - 50 - r * 30, CY - 6 + r * 34, CX, CY + 22 + r * 42, CX + 50 + r * 30, CY - 6 + r * 34]), C.arrow, 9, 0.95 - r * 0.2)
    })
  }
  if (key === 's3') {
    // loop: the stick goes once round the circle, a quarter turn each second, stop-motion
    const L = d.card.loop ?? 4
    const t = wrap(P.held(d.t), L)
    const i = Math.floor(t)
    const u = ease(t - i, 0.15, 0.8)
    const a = seatAngle(0) + ((i + u) * TAU) / 4
    const looks = [0, 1, 2, 3].map((k) => {
      const da = ((((a - seatAngle(k)) % TAU) + TAU + Math.PI) % TAU) - Math.PI
      return Math.max(-0.6, Math.min(0.6, -da * 0.5))
    })
    return ringScene(P, d, a, looks, () => {
      // a turning arrow in the middle shows which way round
      const pts: number[] = []
      for (let k = 0; k <= 6; k++) pts.push(CX + Math.cos(a + 0.5 + k * 0.5) * 58, CY + Math.sin(a + 0.5 + k * 0.5) * 58)
      arrow(P, pts, { width: 13, color: C.arrow, edge: EDGE, head: 34 })
    })
  }
  // s4: Sara has it. First what she heard (the sun, pale and dashed), then her own (a fish).
  return ringScene(P, d, seatAngle(1), [0.5, 0, -0.5, 0], () => {
    const s = d.rtl ? -1 : 1
    say(P, CX - s * 96, CY - 16, { x: 700, y: CY - 30 }, 160, 126, () => icon(P, 'sun', 92, true), { dashed: true })
    say(P, CX + s * 78, CY + 110, { x: 700, y: CY + 60 }, 160, 126, () => icon(P, 'fish', 100))
    arrow(P, [CX - s * 60, CY + 62, CX - s * 44, CY + 104, CX - s * 14, CY + 112], { width: 9, color: C.accent, edge: EDGE, head: 24 })
  })
}

export const above: Direction = {
  profile: PR,
  draw(P, d) {
    if (d.activity.id === 'here-you-are') hereYouAre(P, d)
    else talkingStick(P, d)
  },
}
void H
