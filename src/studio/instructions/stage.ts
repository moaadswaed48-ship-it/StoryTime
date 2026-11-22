/**
 * Direction 3 · THE LITTLE STAGE.
 *
 * Idea: every step is a tiny play. A paper theatre frames the picture; the instruction cast act the step with a few
 * props, whole people with faces, so the feeling of the step (proud, patient, listening) is part of the instruction.
 *
 * The system
 * - People and hands: the character builder, whole figures in warm gouache; grown-ups come down to the floor.
 * - Materials: a cast member holds the things up to the audience, big, from the waist up.
 * - Framing and number: the proscenium is the frame; the crest at the top carries the step number, and one
 *   footlight is lit for every step done (no words needed, and nothing to mirror in right-to-left pages).
 * - Motion in a still: a pale "ghost" of where somebody was, and a dotted arrow on the floor or in the air.
 * - Speech: a bubble with a picture in it (a heart is "thank you"; the thing with an arrow is "here you are").
 * - Caption: on the board under the stage, pale on dark, as real text.
 * - Loop: acted on twos (12 drawings a second); it ends where it began.
 */
import { guide } from '@/cast/instruction-cast'
import { FACES } from '../figure/pose'
import { Painter, Pen, TAU, blob, circle, curve, ellipse, rrect } from '../kit/core'
import { bunting, rug, windowIn } from '../places/things'
import { potPlant } from '../places/nature'
import { INSTRUCTION_PROFILES } from '../style/instruction-profiles'
import { handOf, play, standing, type Actor } from './actors'
import { hereYouAreAct, talkingStickAct } from './acts'
import { arrow, bubble, cushion, ease, icon, numeral, sound, spoon, stick, tumbler, wrap } from './kit'
import type { Direction, DrawCtx } from './types'

const PR = INSTRUCTION_PROFILES.stage
const C = PR.c
const W = PR.W
const X0 = 60
const X1 = W - 60
const TOP = 50
const LIP = 826
const WALL = 610

function opening(): Pen {
  const p = new Pen()
  p.moveTo(X0, LIP)
  p.lineTo(X0, 210)
  p.bezierCurveTo(X0, 100, 150, TOP, 290, TOP)
  p.lineTo(W - 290, TOP)
  p.bezierCurveTo(W - 150, TOP, X1, 100, X1, 210)
  p.lineTo(X1, LIP)
  p.closePath()
  return p
}

/** The inside of the theatre: wall, floor, one cue for the place, a rug, and the light falling off toward the edges. */
function backdrop(P: Painter, place: 'home' | 'kinder', rugOn: boolean) {
  const c = P.ctx
  const wall = place === 'home' ? C.backA : C.backB
  P.shape(rrect(0, 0, W, WALL, 0), wall, { line: 0, shade: 0 })
  P.speckle(rrect(0, 0, W, WALL, 0), wall, 5, [0, 0, W, WALL], 0.5, 1.8)
  const floor = rrect(0, WALL, W, LIP - WALL + 10, 0)
  P.shape(floor, C.floor, { line: 0, shade: 0 })
  P.speckle(floor, C.floor, 7, [0, WALL, W, LIP - WALL], 1.1, 1.8)
  const boards = new Pen()
  for (let i = -9; i <= 9; i++) {
    boards.moveTo(W / 2 + i * 96, WALL)
    boards.lineTo(W / 2 + i * 190, LIP + 20)
  }
  P.clip(floor, () => P.detail(boards, C.floor, 0.6))
  P.shape(rrect(0, WALL - 16, W, 20, 0), '#fff3dc', { line: 0.6, shade: 0.4 })
  P.far(0.22, () => {
    if (place === 'home') {
      windowIn(P, 330, 300, 230, 250, { curtain: '#e9a05a', sky: '#cfe6ea', hill: '#9cc39a' })
      potPlant(P, 960, WALL - 6, 190, { pot: '#c96a4a', leaf: '#6a9e5c', seed: 8 })
    } else {
      bunting(P, 150, 190, 1050, 190, ['#e2674a', '#f2c94c', '#4f9a8f', '#7f6fb8'], 0, 11)
      for (const [x, kind, col] of [[330, 0, '#f2c94c'], [600, 1, '#e2674a'], [870, 2, '#4f9a8f']] as const) {
        // three children's drawings on the wall
        P.shape(rrect(x - 78, 290, 156, 190, 6), '#fffaf0', { shade: 0.5 })
        if (kind === 0) P.flat(circle(x, 385, 40), col)
        else if (kind === 1) P.flat(blob([x - 50, 440, x, 330, x + 50, 440]), col)
        else P.flat(ellipse(x, 385, 54, 30), col)
      }
    }
  })
  if (rugOn) rug(P, W / 2, 742, 470, 74, place === 'home' ? ['#d9694a', '#f6e2b8', '#3f8f8a'] : ['#3f8f8a', '#f6e2b8', '#e9a23a'])
  // stage light: bright in the middle, dim toward the wings
  const g = c.createRadialGradient(W / 2, 520, 240, W / 2, 520, 760)
  g.addColorStop(0, 'rgba(60,40,90,0)')
  g.addColorStop(1, 'rgba(60,40,90,0.34)')
  c.save()
  c.globalCompositeOperation = 'multiply'
  c.fillStyle = g
  c.fillRect(0, 0, W, LIP + 10)
  c.restore()
}

/** Everything in front of the play: the frame, curtains, crest with the step number, footlights and the caption board. */
function front(P: Painter, d: DrawCtx) {
  const c = P.ctx
  // the frame is the whole card with the opening cut out of it
  const frame = new Pen()
  frame.rect(-10, -10, W + 20, PR.H + 20)
  c.save()
  const hole = new Path2D()
  hole.rect(-10, -10, W + 20, PR.H + 20)
  hole.addPath(opening().raw)
  c.clip(hole, 'evenodd')
  P.shape(frame, C.frame, { line: 0, shade: 0 })
  P.speckle(frame, C.frame, 3, [0, 0, W, PR.H], 0.7, 2)
  c.restore()
  c.save()
  c.lineWidth = 7
  c.strokeStyle = P.col(C.gold)
  c.stroke(opening().raw)
  c.restore()

  // side curtains, gathered
  for (const sd of [-1, 1]) {
    const ex = sd < 0 ? X0 - 4 : X1 + 4
    const q = (dx: number) => ex - sd * dx
    const drape = new Pen()
    drape.moveTo(q(-2), TOP + 40)
    drape.lineTo(q(150), TOP + 40)
    drape.bezierCurveTo(q(150), 300, q(96), 430, q(64), 520)
    drape.bezierCurveTo(q(96), 600, q(116), 700, q(120), LIP - 6)
    drape.lineTo(q(-2), LIP - 6)
    drape.closePath()
    P.shape(drape, C.curtain, { shade: 1.3 })
    for (const [a, b, e] of [[40, 30, 36], [86, 54, 70], [124, 62, 100]] as const) P.detail(curve([q(a), TOP + 60, q(b), 500, q(e), LIP - 20]), C.curtain, 0.9)
    P.shape(rrect(Math.min(q(-4), q(78)), 500, 82, 30, 12), C.gold, { shade: 0.6 })
  }
  // the valance: a scalloped strip across the top
  const val = new Pen()
  val.moveTo(X0 - 6, TOP - 30)
  val.lineTo(X1 + 6, TOP - 30)
  val.lineTo(X1 + 6, 118)
  const n = 9
  const sw = (X1 - X0 + 12) / n
  for (let i = n - 1; i >= 0; i--) {
    const xa = X0 - 6 + (i + 1) * sw
    val.quadraticCurveTo(xa - sw / 2, 118 + 62, xa - sw, 118)
  }
  val.closePath()
  P.shape(val, C.curtain, { shade: 1.2 })
  for (let i = 0; i < n; i++) {
    const xa = X0 - 6 + i * sw
    P.line(curve([xa + 6, 122, xa + sw / 2, 172, xa + sw - 6, 122]), C.gold, 6)
  }
  // the crest: the step number (the materials card shows a little open box instead)
  const cx = W / 2
  const cy = 92
  P.shape(circle(cx, cy, 70), C.gold, { shade: 0.8 })
  P.shape(circle(cx, cy, 55), C.frame, { shade: 0, line: 0.6 })
  if (d.card.n > 0) numeral(P, d.card.n, cx, cy, 70, '#fff6e2', { weight: 0.19 })
  else {
    P.shape(rrect(cx - 26, cy - 8, 52, 34, 5), '#fff6e2', { shade: 0, line: 0 })
    P.line(curve([cx - 30, cy - 10, cx - 40, cy - 28]), '#fff6e2', 8)
    P.line(curve([cx + 30, cy - 10, cx + 40, cy - 28]), '#fff6e2', 8)
  }

  // the stage lip, and one footlight for every step: lit up to this one
  P.shape(rrect(30, LIP - 8, W - 60, 26, 10), C.gold, { shade: 0.7 })
  const total = d.steps
  for (let i = 0; i < total; i++) {
    const k = d.rtl ? total - 1 - i : i
    const x = W / 2 + (k - (total - 1) / 2) * 92
    const on = i < d.card.n
    if (on) {
      const g = c.createRadialGradient(x, LIP - 14, 4, x, LIP - 14, 110)
      g.addColorStop(0, 'rgba(255,232,150,0.6)')
      g.addColorStop(1, 'rgba(255,232,150,0)')
      c.save()
      c.globalCompositeOperation = 'screen'
      c.fillStyle = g
      c.fillRect(x - 120, LIP - 130, 240, 130)
      c.restore()
    }
    const dome = new Pen()
    dome.ellipse(x, LIP - 6, 26, 24, 0, Math.PI, TAU)
    dome.closePath()
    P.shape(dome, on ? C.lampOn : C.lampOff, { shade: on ? 0 : 0.6, tex: false })
  }
  // the caption board (the page sets the words on it)
  const b = PR.caption.box!
  P.shape(rrect(b.x, b.y, b.w, b.h, 26), C.frameDark, { shade: 0, line: 0 })
  c.save()
  c.lineWidth = 3
  c.strokeStyle = P.col(C.gold)
  c.globalAlpha = 0.7
  c.stroke(rrect(b.x + 8, b.y + 8, b.w - 16, b.h - 16, 20).raw)
  c.restore()
}

/** One card: the backdrop, the play (clipped to the opening), the theatre in front. */
function scene(P: Painter, d: DrawCtx, place: 'home' | 'kinder', rugOn: boolean, playIt: () => void) {
  P.clip(opening(), () => {
    backdrop(P, place, rugOn)
    playIt()
  })
  front(P, d)
}

const EDGE = '#3a2238'
const dots = [2, 26]
const say = (P: Painter, x: number, y: number, to: { x: number; y: number }, w: number, h: number, inside: () => void, o: { dashed?: boolean; pop?: number } = {}) =>
  bubble(P, x, y, w, h, { to, edge: EDGE, lw: 4, ...o }, inside)
/** "Here you are": the thing, and an arrow toward the one who gets it. */
const giving = (P: Painter, what: 'cushion' | 'cup', dir: number) => {
  P.at(-dir * 30, 0, 1, () => icon(P, what, 84))
  arrow(P, [dir * 22, 0, dir * 46, 0, dir * 72, 0], { width: 12, color: C.accent, edge: EDGE, head: 28 })
}
// ── activity A: here you are, thank you ───────────────────────────────────────
function hereYouAre(P: Painter, d: DrawCtx) {
  const key = d.card.key
  if (key === 'materials') {
    // Mum, close, shows both things to us: the cushion under one arm, the empty cup standing on her open hand
    const m: Actor = { s: guide('mother'), sc: 2, shadow: 0, p: standing(590, 1300, { ...FACES.smile, cheek: 0.6, lx: 0.5, ly: 0.56, rx: 0.56, ry: 0.36, rHand: 7, lHand: 6, tilt: -0.04, turn: -0.12, lookX: -0.5, lookY: 0.2 }) }
    return scene(P, d, 'home', false, () => {
      play(P, [m], () => {
        const l = handOf(P, m, 'l')
        cushion(P, l.x - 90, l.y - 96, 350, { rot: 0.08 })
      })
      const r = handOf(P, m, 'r')
      tumbler(P, r.x - 20, r.y - 16, 236, { rot: -0.04 })
    })
  }
  const t = d.card.loop ? wrap(P.held(d.t), d.card.loop) : 0
  return scene(P, d, 'home', true, () => {
    const a = hereYouAreAct(P, key, t)
    // the way she comes lies on the floor, behind everybody's feet
    if (key === 's1') arrow(P, [a.at.from.x, a.at.from.y, (a.at.from.x + a.at.to.x) / 2, a.at.from.y + 8, a.at.to.x, a.at.to.y], { dash: dots, width: 10, color: C.arrow, edge: EDGE, head: 30 })
    play(P, a.actors, a.things)
    const { lia, mum } = a.at
    if (key === 's2') say(P, lia.x + 46, lia.y - 200, { x: lia.x + 40, y: lia.y - 80 }, 236, 124, () => giving(P, 'cushion', 1), { pop: a.at.pop.x })
    else if (key === 's3') say(P, mum.x - 214, mum.y + 4, { x: mum.x - 84, y: mum.y + 24 }, 160, 128, () => icon(P, 'heart', 84))
    else if (key === 's4') {
      say(P, mum.x - 232, mum.y + 4, { x: mum.x - 84, y: mum.y + 24 }, 226, 122, () => giving(P, 'cup', -1))
      say(P, lia.x - 20, lia.y - 196, { x: lia.x + 10, y: lia.y - 84 }, 150, 120, () => icon(P, 'heart', 76))
    }
  })
}

// ── activity B: the talking stick ─────────────────────────────────────────────
function talkingStick(P: Painter, d: DrawCtx) {
  const key = d.card.key
  if (key === 'materials') {
    const m: Actor = { s: guide('teacher'), sc: 2, shadow: 0, p: standing(600, 1300, { ...FACES.delight, open: 0.3, rx: 0.7, ry: 0.2, lx: 0.7, ly: 0.2, rHand: 6, lHand: 6, tilt: 0.04 }) }
    return scene(P, d, 'kinder', false, () =>
      play(P, [m], () => {
        const r = handOf(P, m, 'r')
        const l = handOf(P, m, 'l')
        stick(P, r.x + 8, r.y - 76, 360, { rot: -Math.PI / 2 + 0.1 })
        spoon(P, l.x - 8, l.y - 76, 360, { rot: -Math.PI / 2 - 0.1 })
      }),
    )
  }
  const L = d.card.loop ?? 0
  const t = L ? wrap(P.held(d.t), L) : 0
  const shot = (tt: number) => {
    const a = talkingStickAct(P, key, tt)
    if (key === 's1') {
      // the ring they sit in: a dotted circle lying on the rug
      const c = P.ctx
      c.save()
      c.setLineDash(dots)
      c.lineCap = 'round'
      for (const [w, col] of [[16, EDGE], [10, P.col(C.arrow)]] as const) {
        c.lineWidth = w
        c.strokeStyle = col
        c.beginPath()
        c.ellipse(W / 2 + 14, 772, 392, 62, 0, 0, TAU)
        c.stroke()
      }
      c.restore()
    }
    play(P, a.actors, a.things)
    const { mona, sara } = a.at
    if (key === 's1') void 0
    else if (key === 's2') {
      say(P, mona.x + 150, mona.y - 150, { x: mona.x + 52, y: mona.y - 40 }, 180, 136, () => icon(P, 'sun', 100))
      sound(P, mona.x + 70, mona.y + 36, 0.2, 80, C.arrow, EDGE)
    }
    else if (key === 's3') arrow(P, [a.at.a.x + 30, a.at.a.y - 190, a.at.mid.x, a.at.mid.y - 200, a.at.b.x - 30, a.at.b.y - 190], { width: 12, color: C.arrow, edge: EDGE, head: 30, alpha: 0.3 + 0.7 * a.at.k.x * (1 - a.at.k.y * 0.7) })
    else {
      // first what she heard (Mona's sun, pale, dashed), then her own (a fish); the order follows the page's reading direction
      const s = d.rtl ? -1 : 1
      const bx = sara.x + 120
      const by = sara.y - 214
      say(P, bx - s * 112, by, { x: sara.x + 10, y: sara.y - 76 }, 172, 132, () => icon(P, 'sun', 96, true), { dashed: true })
      say(P, bx + s * 112, by, { x: sara.x + 40, y: sara.y - 76 }, 172, 132, () => icon(P, 'fish', 104))
      sound(P, sara.x + 64, sara.y + 30, 0.1, 70, C.arrow, EDGE)
      arrow(P, [bx - s * 22, by, bx, by, bx + s * 22, by], { width: 9, color: C.gold, edge: EDGE, head: 22 })
    }
  }
  return scene(P, d, 'kinder', true, () => {
    // a loop plays to its end, then dissolves back to its first drawing
    shot(L ? Math.min(t, L - 0.6) : 0)
    const fade = L ? ease(t, L - 0.6, L - 0.05) : 0
    if (fade > 0.01)
      P.layer(() => {
        backdrop(P, 'kinder', true)
        shot(0)
      }, fade)
  })
}

export const stage: Direction = {
  profile: PR,
  draw(P, d) {
    if (d.activity.id === 'here-you-are') hereYouAre(P, d)
    else talkingStick(P, d)
  },
}
