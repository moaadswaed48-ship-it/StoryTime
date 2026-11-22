/**
 * The instruction cast on one sheet, for the owner's comparison page: the eight people standing together, each
 * with a small living pose and their name. Drawn under any of the three directions' drawing styles.
 */
import { INSTRUCTION_CAST } from '@/cast/instruction-cast'
import { drawFigure } from '../figure/draw'
import { FACES, rest, type Pose } from '../figure/pose'
import { Painter, blob, paperGrain, wobble } from '../kit/core'
import { INSTRUCTION_PROFILES, type DirectionId } from '../style/instruction-profiles'

const W = 1700
const H = 900
const POSES: Record<string, Partial<Pose>> = {
  'guide-teacher': { ...FACES.smile, rx: 0.6, ry: 0.2, rHand: 5, lB: 1, lBx: 0.2, lBy: 0.5, turn: -0.2, lookX: -0.5, tilt: -0.05 },
  'guide-mother': { ...FACES.smile, cheek: 0.7, rB: 1, rBx: 0.3, rBy: 0.94, lB: 1, lBx: 0.3, lBy: 0.94, hipx: -0.2, tilt: 0.07, turn: 0.2, lookX: 0.5 },
  'guide-father': { ...FACES.laugh, rB: 1, rBx: 1.0, rBy: 0.9, lB: 1, lBx: 1.0, lBy: 0.9, lean: 0.03 },
  'guide-grandpa': { ...FACES.smile, lx: 0.3, ly: -0.2, lHand: 1, turn: 0.25, lookX: 0.6, brow: 0.6 },
  'guide-lia': { ...FACES.delight, rx: 0.5, ry: 0.5, lx: 0.5, ly: 0.5, rHand: 5, lHand: 5, turn: 0.2 },
  'guide-tom': { ...FACES.laugh, rx: 0.44, ry: -0.8, lx: 0.44, ly: -0.8, rHand: 5, lHand: 5, lift: 0.05, rfx: -0.08, lfx: 0.08, rfy: 0.05 },
  'guide-sara': { ...FACES.smile, lx: 0.5, ly: -0.6, lHand: 5, tilt: 0.1, hipx: -0.15, turn: 0.15 },
  'guide-jonah': { ...FACES.smile, rx: 0.62, ry: -0.3, rHand: 2, rWrist: 0.4, lx: 0.3, ly: 0.7, hipx: 0.1, turn: -0.1 },
}
const ORDER = ['guide-lia', 'guide-tom', 'guide-sara', 'guide-jonah', 'guide-teacher', 'guide-mother', 'guide-father', 'guide-grandpa']
const ROLE: Record<string, string> = {
  'guide-teacher': 'kindergarten teacher', 'guide-mother': 'mother', 'guide-father': 'father', 'guide-grandpa': 'grandfather',
  'guide-lia': 'about 2½', 'guide-tom': 'about 4', 'guide-sara': 'about 6', 'guide-jonah': 'about 8',
}

export function mountCast(root: HTMLElement, dirId: DirectionId, dpr = 1) {
  const pr = INSTRUCTION_PROFILES[dirId]
  const canvas = document.createElement('canvas')
  canvas.style.cssText = `display:block;width:100%;aspect-ratio:${W}/${H}`
  root.appendChild(canvas)
  const draw = () => {
    const pw = Math.round((root.clientWidth || W) * dpr)
    canvas.width = pw
    canvas.height = Math.round((pw * H) / W)
    const ctx = canvas.getContext('2d')!
    const P = new Painter(ctx, pw, W, H)
    P.style = pr.style
    P.screen()
    ctx.fillStyle = pr.style.palette.paper
    ctx.fillRect(0, 0, W, H)
    const floor = blob(wobble([70, 690, W / 2, 664, W - 70, 690, W - 50, 770, W / 2, 792, 50, 770], 7, 5))
    P.flat(floor, '#ecd7a8')
    P.speckle(floor, '#ecd7a8', 5, [50, 660, W - 100, 130], 0.8)
    const xs = [150, 330, 520, 720, 950, 1160, 1380, 1580]
    ORDER.forEach((id, i) => {
      const s = INSTRUCTION_CAST.find((c) => c.id === id)!
      const p = { ...rest(xs[i], 730), ...POSES[id], x: xs[i], y: 730 }
      P.groundShadow(xs[i], 732, s.stage === 'adult' || s.stage === 'elder' ? 96 : 60, 13)
      drawFigure(P, s, p, { scale: 1.14, cane: false })
      ctx.fillStyle = '#3a2238'
      ctx.textAlign = 'center'
      ctx.font = "700 34px 'Andika','Inter',system-ui,sans-serif"
      ctx.fillText(s.name.en, xs[i], 836)
      ctx.globalAlpha = 0.7
      ctx.font = "500 23px 'Andika','Inter',system-ui,sans-serif"
      ctx.fillText(ROLE[id], xs[i], 868)
      ctx.globalAlpha = 1
    })
    paperGrain(P)
  }
  draw()
  return { seek: draw }
}
