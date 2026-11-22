/** Working sheets for the Studio itself (not proofs): every sheet turned through every view. */
import { CAST } from '@/cast/cast'
import { drawFigure, drawFigureShadow } from '../figure/draw'
import { FACES, rest } from '../figure/pose'
import type { Scene } from '../scene'

const YAWS = [0, 0.63, Math.PI / 2, 2.3, Math.PI, -2.3, -Math.PI / 2, -0.63]
export const devTurn: Scene = {
  id: 'dev-turn',
  title: 'Working sheet: every character turned through eight views',
  W: 2400,
  H: 13 * 420 + 40,
  duration: 0,
  render(P) {
    P.screen()
    CAST.forEach((s, i) => {
      const y = 400 + i * 420
      YAWS.forEach((yaw, j) => {
        const x = 170 + j * 295
        const p = { ...rest(x, y), ...FACES.smile, spin: yaw }
        drawFigureShadow(P, s, p, { scale: 0.62 }, 0.6)
        drawFigure(P, s, p, { scale: 0.62 })
      })
    })
  },
}
