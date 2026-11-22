/**
 * Direction 2 · HANDS FIRST.
 *
 * Idea: a page from a printed craft book. The camera goes in so close that the hands and the thing they hold
 * fill the picture; a grown-up is often only a pair of sleeves coming in from the edge, a child a face just
 * above its hands. One dark line, flat colour, one strong colour field per activity.
 *
 * The system
 * - People and hands: the character builder, filmed close (the same acting as the little stage, see `acts.ts`),
 *   hands enlarged by the profile. Who it is reads from the sleeve colour (each cast member has their own).
 * - Materials: the things alone, big, each on a paper disc, with "+" (and) or "/" (or) between them.
 * - Framing and number: a dark disc with the numeral sits on the edge between picture and caption, on the side
 *   where reading starts, and a row of pips runs on from it.
 * - Motion in a still: one fat paper-white arrow with a dark edge.
 * - Speech: a bubble with a picture in it, its tail pointing at the speaker (or off the edge, to a speaker we do not see).
 * - Caption: on the paper band under the picture, heavy dark type, as real text.
 * - Loop: 12 drawings a second.
 */
import { Painter, circle, rrect, type Pt } from '../kit/core'
import { mixHex } from '../style/color'
import { INSTRUCTION_PROFILES } from '../style/instruction-profiles'
import { play } from './actors'
import { hereYouAreAct, talkingStickAct, type Act } from './acts'
import { arrow, bubble, cushion, ease, icon, numeral, pips, sound, spoon, stick, tumbler, wrap } from './kit'
import type { Direction, DrawCtx } from './types'

const PR = INSTRUCTION_PROFILES.hands
const C = PR.c
const W = PR.W
/** The picture is the top of the card; the caption band lies under it. */
const PH = 900
const INK = C.ink

/** The colour field of an activity and its pale spot. */
function field(P: Painter, d: DrawCtx, spot: { x: number; y: number; r: number }) {
  const a = d.activity.id === 'here-you-are'
  const base = a ? C.fieldA : C.fieldB
  const pale = a ? C.fieldA2 : C.fieldB2
  P.flat(rrect(0, 0, W, PH + 4, 0), base)
  if (spot.r > 0) P.flat(circle(spot.x, spot.y, spot.r), pale)
  // a printer's halftone fading out of the far top corner
  const sx = d.rtl ? 0 : W
  const dir = d.rtl ? 1 : -1
  for (let i = 0; i < 9; i++)
    for (let j = 0; j < 7; j++) {
      const r = 9 - (i + j) * 0.95
      if (r > 0.8) P.flat(circle(sx + dir * (26 + i * 34), 26 + j * 34, r), pale)
    }
}
/** The caption band, and on its edge the step number with its pips. */
function band(P: Painter, d: DrawCtx) {
  P.flat(rrect(0, PH, W, PR.H - PH + 4, 0), C.paper)
  P.line(rrect(-10, PH, W + 20, 400, 0), INK, 7)
  if (d.card.n > 0) {
    const x = d.rtl ? W - 124 : 124
    P.shape(circle(x, PH + 14, 96), INK, { line: 0 })
    numeral(P, d.card.n, x, PH + 14, 104, C.paper, { weight: 0.2 })
    const a = d.activity.id === 'here-you-are'
    pips(P, x + (d.rtl ? -1 : 1) * 140, PH - 34, d.card.n, d.steps, 13, C.paper, mixHex(a ? C.fieldA : C.fieldB, INK, 0.3), d.rtl, 3.2)
  }
}
const say = (P: Painter, x: number, y: number, to: Pt, w: number, h: number, inside: () => void, o: { dashed?: boolean; pop?: number } = {}) =>
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
const see = (cam: Cam, p: Pt): Pt => ({ x: W / 2 + (p.x - cam.x) * cam.k, y: PH / 2 + (p.y - cam.y) * cam.k })
function film(P: Painter, cam: Cam, a: Act) {
  for (const x of a.actors) x.shadow = 0
  P.at(W / 2 - cam.x * cam.k, PH / 2 - cam.y * cam.k, cam.k, () => play(P, a.actors, a.things))
}

// ── activity A: here you are, thank you ───────────────────────────────────────
const CAM_A: Record<string, Cam> = { s1: { x: 610, y: 590, k: 1.9 }, s2: { x: 556, y: 590, k: 2.1 }, s3: { x: 610, y: 474, k: 1.5 }, s4: { x: 584, y: 598, k: 2.06 } }

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
  const a = hereYouAreAct(P, key, t, false)
  const thing = see(cam, a.at.thing)
  field(P, d, { x: thing.x, y: thing.y + 10, r: 320 })
  film(P, cam, a)
  const lia = see(cam, a.at.lia)
  const mum = see(cam, a.at.mum)
  if (key === 's1') {
    const to = see(cam, a.at.hands)
    big(P, [thing.x + 60, thing.y - 250, (thing.x + to.x) / 2 + 20, thing.y - 330, to.x - 10, to.y - 150])
  } else if (key === 's2') say(P, lia.x + 440, 150, { x: lia.x + 170, y: lia.y + 40 }, 330, 170, () => giving(P, 'cushion', 1), { pop: a.at.pop.x })
  else if (key === 's3') say(P, mum.x - 300, mum.y + 10, { x: mum.x - 110, y: mum.y + 40 }, 200, 164, () => icon(P, 'heart', 108))
  else {
    // the same two sayings as before, the other way round: the giver is off the picture to the right
    say(P, 960, 130, { x: 1190, y: 150 }, 300, 160, () => giving(P, 'cup', -1))
    say(P, lia.x + 300, 110, { x: lia.x + 150, y: lia.y + 40 }, 170, 140, () => icon(P, 'heart', 90))
  }
}

// ── activity B: the talking stick ─────────────────────────────────────────────
const CAM_B: Record<string, Cam> = { s1: { x: 615, y: 640, k: 1.14 }, s2: { x: 390, y: 606, k: 1.96 }, s3: { x: 366, y: 626, k: 2.4 }, s4: { x: 500, y: 600, k: 2 } }

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
    field(P, d, { x: focus.x, y: focus.y, r: key === 's1' ? 430 : 320 })
    film(P, cam, a)
    const mona = see(cam, a.at.mona)
    const sara = see(cam, a.at.sara)
    if (key === 's1') big(P, [330, 150, 600, 86, 880, 150], { dash: [2, 52] })
    else if (key === 's2') {
      say(P, mona.x + 300, 130, { x: mona.x + 130, y: mona.y + 30 }, 220, 172, () => icon(P, 'sun', 124))
      sound(P, mona.x + 150, mona.y + 120, 0.25, 150, C.paper, INK)
    }
    else if (key === 's3') {
      const p0 = see(cam, a.at.a)
      const p1 = see(cam, a.at.b)
      big(P, [p0.x + 70, 300, (p0.x + p1.x) / 2 - 20, 236, p1.x - 150, 300], { alpha: 0.35 + 0.65 * a.at.k.x * (1 - a.at.k.y * 0.6) })
    } else {
      // read along the top: first the thing she heard (pale, dashed), then her own
      const s = d.rtl ? -1 : 1
      say(P, sara.x - s * 250, 130, { x: sara.x - s * 60, y: sara.y - 60 }, 220, 172, () => icon(P, 'sun', 122, true), { dashed: true })
      say(P, sara.x + s * 250, 130, { x: sara.x + s * 60, y: sara.y - 60 }, 220, 172, () => icon(P, 'fish', 138))
      arrow(P, [sara.x - s * 70, 76, sara.x, 60, sara.x + s * 70, 76], { width: 14, color: C.accent, edge: INK, head: 34 })
      sound(P, sara.x + 150, sara.y + 110, 0.2, 130, C.paper, INK)
    }
  }
  shot(L ? Math.min(t, L - 0.6) : 0)
  const fade = L ? ease(t, L - 0.6, L - 0.05) : 0
  if (fade > 0.01) P.layer(() => shot(0), fade)
}

export const hands: Direction = {
  profile: PR,
  draw(P, d) {
    P.clip(rrect(0, 0, W, PH + 2, 0), () => {
      if (d.activity.id === 'here-you-are') hereYouAre(P, d)
      else talkingStick(P, d)
    })
    band(P, d)
  },
}
