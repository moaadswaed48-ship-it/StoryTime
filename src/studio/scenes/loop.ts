/**
 * A looping clip, as an activity instruction step will be: a teacher and a child clap a rhythm together.
 * The last frame leads into the first, so the clip repeats without a jump. Square, small, no words.
 */
import { castById } from '@/cast/cast'
import { drawFigure, drawFigureShadow } from '../figure/draw'
import { GESTURE_SECONDS, gesturePose } from '../figure/gestures'
import { blob, wobble } from '../kit/core'
import type { Scene } from '../scene'

const D = GESTURE_SECONDS.clap
export const loopClap: Scene = {
  id: 'loop-clap',
  title: 'Instruction loop: clap the rhythm together',
  W: 1080,
  H: 1080,
  duration: D,
  loop: true,
  render(P, t) {
    P.screen()
    const card = blob(wobble([60, 70, 540, 50, 1020, 70, 1040, 540, 1020, 1010, 540, 1030, 60, 1010, 40, 540], 8, 5))
    P.flat(card, '#cfe0d2')
    P.speckle(card, '#cfe0d2', 3, [40, 50, 1000, 980], 0.8, 1.6)
    P.flat(blob(wobble([120, 880, 540, 850, 960, 880, 980, 960, 540, 990, 100, 960], 6, 7)), '#f0d9a8')
    const ta = P.held(t)
    const list = [['salma', 660, 920, 1.12, 0], ['sami', 360, 930, 1.12, 0.12]] as const
    for (const [id, x, y, sc, lag] of list) {
      const s = castById(id)
      const p = gesturePose('clap', ta + lag, x, y)
      p.turn = id === 'salma' ? -0.4 : 0.4
      p.lookX = id === 'salma' ? -0.7 : 0.7
      p.lookY = id === 'salma' ? 0.5 : -0.6
      drawFigureShadow(P, s, p, { scale: sc }, 0.6)
      drawFigure(P, s, p, { scale: sc })
    }
  },
}
