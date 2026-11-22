/**
 * Direction 2 · HANDS FIRST.
 *
 * Idea: a page from a printed craft book. The picture is cropped so close that the hands and the thing they hold
 * fill it; a grown-up is often only a pair of sleeves coming in from the edge, a child a face just above its
 * hands. One dark line, flat colour, one strong colour field per activity.
 *
 * The system
 * - People and hands: the character builder at two and a half times its usual size, hands enlarged by the profile.
 *   Who it is reads from the sleeve colour (each cast member has one of their own).
 * - Materials: the things alone, big, each on a paper disc, with "+" (and) or "/" (or) between them.
 * - Framing and number: a huge drawn numeral in the corner where reading starts, and a row of pips under it.
 * - Motion in a still: one fat paper-white arrow with a dark edge.
 * - Speech: a bubble with a picture in it, its tail pointing at the speaker (or off the edge to a speaker we do not see).
 * - Caption: on a paper band under the picture, heavy dark type, as real text.
 * - Loop: 12 drawings a second; hands only, so the action is the whole picture.
 */
import { guide } from '@/cast/instruction-cast'
import { Painter, circle, rrect, type Pt } from '../kit/core'
import { mixHex } from '../style/color'
import { INSTRUCTION_PROFILES } from '../style/instruction-profiles'
import { play } from './actors'
import { hereYouAreAct, talkingStickAct, type Act } from './acts'
import { arrow, bubble, cushion, ease, icon, numeral, pips, spoon, stick, tumbler, wrap } from './kit'
import type { Direction, DrawCtx } from './types'

const PR = INSTRUCTION_PROFILES.hands
const C = PR.c
const W = PR.W
const H = PR.H
const INK = C.ink

/** The colour field of an activity, its pale spot, the corner numeral and the pips. */
function field(P: Painter, d: DrawCtx, spot: { x: number; y: number; r: number }) {
  const a = d.activity.id === 'here-you-are'
  const base = a ? C.fieldA : C.fieldB
  const pale = a ? C.fieldA2 : C.fieldB2
  P.flat(rrect(0, 0, W, H, 0), base)
  P.flat(circle(spot.x, spot.y, spot.r), pale)
  // a printer's halftone fading out of one corner
  const sx = d.rtl ? 0 : W
  for (let i = 0; i < 9; i++)
    for (let j = 0; j < 7; j++) {
      const r = 9 - (i + j) * 0.95
      if (r > 0.8) P.flat(circle(sx + (d.rtl ? 1 : -1) * (26 + i * 34), H - 26 - j * 34, r), pale)
    }
}
function number(P: Painter, d: DrawCtx) {
  const x = d.rtl ? W - 128 : 128
  if (d.card.n > 0) {
    numeral(P, d.card.n, x, 150, 200, C.paper, { edge: INK, edgeW: 0.045, weight: 0.21 })
    pips(P, d.rtl ? W - 62 : 62, 296, d.card.n, d.steps, 13, INK, mixHex(d.activity.id === 'here-you-are' ? C.fieldA : C.fieldB, INK, 0.24), d.rtl, 3.4)
  }
}
const say = (P: Painter, x: number, y: number, to: { x: number; y: number }, w: number, h: number, inside: () => void, o: { dashed?: boolean; pop?: number } = {}) =>
  bubble(P, x, y, w, h, { to, edge: INK, lw: 5.5, fill: C.paper, ...o }, inside)
const giving = (P: Painter, what: 'cushion' | 'cup', dir: number) => {
  P.at(-dir * 46, 0, 1, () => icon(P, what, 120))
  arrow(P, [dir * 30, 0, dir * 64, 0, dir * 104, 0], { width: 17, color: C.accent, edge: INK, head: 40 })
}
const big = (P: Painter, pts: number[], o: { alpha?: number; dash?: number[] } = {}) => arrow(P, pts, { width: 30, color: C.arrow, edge: INK, head: 64, ...o })
/** A paper disc for a thing to lie on. */
const disc = (P: Painter, x: number, y: number, r: number) => {
  P.flat(circle(x + 10, y + 12, r), INK, 0.2)
  P.shape(circle(x, y, r), C.paper, { line: 1.2 })
}
/** "+" or "/" drawn fat between two things. */
function sign(P: Painter, kind: '+' | '/', x: number, y: number, s: number) {
  const c = P.ctx
  c.save()
  c.lineCap = 'round'
  const draw = (w: number, col: string) => {
    c.lineWidth = w
    c.strokeStyle = col
    c.beginPath()
    if (kind === '+') {
      c.moveTo(x - s, y)
      c.lineTo(x + s, y)
      c.moveTo(x, y - s)
      c.lineTo(x, y + s)
    } else {
      c.moveTo(x - s * 0.5, y + s * 1.1)
      c.lineTo(x + s * 0.5, y - s * 1.1)
    }
    c.stroke()
  }
  draw(s * 0.62, INK)
  draw(s * 0.36, C.paper)
  c.restore()
}

// ── the camera ────────────────────────────────────────────────────────────────
/** A close shot of an act: the point (x, y) of the act's floor plan comes to the middle of the picture, `k` times larger. */
type Cam = { x: number; y: number; k: number }
const see = (cam: Cam, p: Pt): Pt => ({ x: W / 2 + (p.x - cam.x) * cam.k, y: H / 2 + (p.y - cam.y) * cam.k })
function film(P: Painter, cam: Cam, a: Act) {
  for (const x of a.actors) x.shadow = 0
  P.at(W / 2 - cam.x * cam.k, H / 2 - cam.y * cam.k, cam.k, () => play(P, a.actors, a.things))
}

// ── activity A: here you are, thank you ───────────────────────────────────────
const CAM_A: Record<string, Cam> = { s1: { x: 610, y: 560, k: 2.1 }, s2: { x: 612, y: 568, k: 2.25 }, s3: { x: 600, y: 566, k: 2.1 }, s4: { x: 618, y: 566, k: 2.25 } }

function hereYouAre(P: Painter, d: DrawCtx) {
  const key = d.card.key
  if (key === 'materials') {
    field(P, d, { x: 600, y: 470, r: 0 })
    disc(P, 340, 450, 270)
    disc(P, 890, 450, 230)
    cushion(P, 340, 450, 390, { rot: -0.07 })
    tumbler(P, 890, 610, 320, { rot: 0.03 })
    sign(P, '+', 632, 450, 44)
    return
  }
  const cam = CAM_A[key]
  const t = d.card.loop ? wrap(P.held(d.t), d.card.loop) : 0
  const a = hereYouAreAct(P, key, t)
  const thing = see(cam, a.at.thing)
  field(P, d, { x: thing.x, y: thing.y + 20, r: 330 })
  number(P, d)
  film(P, cam, a)
  const lia = see(cam, a.at.lia)
  if (key === 's1') big(P, [thing.x + 150, thing.y - 190, thing.x + 250, thing.y - 230, thing.x + 350, thing.y - 170])
  else if (key === 's2') say(P, lia.x + 300, lia.y - 190, { x: lia.x + 110, y: lia.y - 100 }, 330, 170, () => giving(P, 'cushion', 1), { pop: a.at.pop.x })
  else if (key === 's3') say(P, 930, 170, { x: 1130, y: 250 }, 220, 172, () => icon(P, 'heart', 118))
  else {
    say(P, lia.x + 60, lia.y - 250, { x: lia.x + 60, y: lia.y - 130 }, 196, 156, () => icon(P, 'heart', 100))
    // the swap sign: two arrows going round
    arrow(P, [870, 150, 940, 100, 1020, 138], { width: 20, color: C.arrow, edge: INK, head: 46 })
    arrow(P, [1016, 218, 944, 270, 866, 232], { width: 20, color: C.arrow, edge: INK, head: 46 })
  }
}

// ── activity B: the talking stick ─────────────────────────────────────────────
const CAM_B: Record<string, Cam> = { s1: { x: 615, y: 660, k: 1.12 }, s2: { x: 380, y: 610, k: 2 }, s3: { x: 356, y: 640, k: 2.35 }, s4: { x: 560, y: 606, k: 2.1 } }

function talkingStick(P: Painter, d: DrawCtx) {
  const key = d.card.key
  if (key === 'materials') {
    field(P, d, { x: 600, y: 470, r: 0 })
    disc(P, 330, 450, 250)
    disc(P, 870, 450, 250)
    stick(P, 330, 450, 400, { rot: -0.7 })
    spoon(P, 870, 450, 420, { rot: -0.85 })
    sign(P, '/', 600, 450, 60)
    return
  }
  const cam = CAM_B[key]
  const L = d.card.loop ?? 0
  const t = L ? wrap(P.held(d.t), L) : 0
  const shot = (tt: number) => {
    const a = talkingStickAct(P, key, tt, key === 's1')
    const focus = see(cam, a.at.stick ?? { x: 615, y: 640 })
    field(P, d, { x: focus.x, y: focus.y, r: key === 's1' ? 420 : 330 })
    number(P, d)
    film(P, cam, a)
    const mona = see(cam, a.at.mona)
    const sara = see(cam, a.at.sara)
    if (key === 's1') big(P, [330, 150, 600, 90, 880, 150], { dash: [2, 52] })
    else if (key === 's2') say(P, mona.x + 330, mona.y - 130, { x: mona.x + 120, y: mona.y - 50 }, 230, 180, () => icon(P, 'sun', 130))
    else if (key === 's3') {
      const p0 = see(cam, a.at.a)
      const p1 = see(cam, a.at.b)
      big(P, [p0.x + 40, 200, (p0.x + p1.x) / 2, 130, p1.x - 40, 200], { alpha: 0.35 + 0.65 * a.at.k.x * (1 - a.at.k.y * 0.6) })
    } else {
      // read downward: first the thing she heard (pale, dashed), then her own
      const s = d.rtl ? -1 : 1
      const bx = sara.x + s * 360
      say(P, bx, 210, { x: sara.x + s * 120, y: sara.y - 60 }, 240, 186, () => icon(P, 'sun', 130, true), { dashed: true })
      say(P, bx + s * 20, 500, { x: sara.x + s * 130, y: sara.y + 10 }, 250, 196, () => icon(P, 'fish', 150))
      arrow(P, [bx + s * 150, 270, bx + s * 186, 350, bx + s * 172, 430], { width: 14, color: C.accent, edge: INK, head: 34 })
    }
  }
  shot(L ? Math.min(t, L - 0.6) : 0)
  const fade = L ? ease(t, L - 0.6, L - 0.05) : 0
  if (fade > 0.01) P.layer(() => shot(0), fade)
}

export const hands: Direction = {
  profile: PR,
  draw(P, d) {
    if (d.activity.id === 'here-you-are') hereYouAre(P, d)
    else talkingStick(P, d)
  },
}
