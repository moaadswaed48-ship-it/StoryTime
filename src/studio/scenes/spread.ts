/**
 * Style test (a): one picture-book spread for a four-to-five-year-old. Two characters in a place, with the sky
 * left calm on both pages so the words can sit at the start of the spread in any language: top-left for English
 * and Danish, top-right for Arabic and Hebrew. The words are not in the picture: they are real text laid over it
 * on a soft paper wash (see `mount.ts`). The story line is StoryTime's own sample text, written for this test.
 */
import { castById } from '@/cast/cast'
import { drawAnimal, drawAnimalShadow, restAnimal } from '../animals'
import { drawFigure, drawFigureShadow } from '../figure/draw'
import { FACES, rest } from '../figure/pose'
import { blob, circle, curve, limbPath } from '../kit/core'
import { sun } from '../places/nature'
import { garden, gardenFront } from '../places/places'
import { basket, fruit, wateringCan } from '../places/things'
import type { Scene } from '../scene'
import { MOODS } from '../style/profile'

const GY = 1056
const ADULT = 730 / 540
const ORANGE = '#f59a2c'

export const spreadOranges: Scene = {
  id: 'spread-oranges',
  title: 'Noor reaches for an orange in her grandmother\'s garden',
  W: 1920,
  H: 1200,
  duration: 0,
  mood: MOODS.morning,
  words: [
    {
      x: 104, y: 92, w: 690, h: 250, size: 0.0205,
      text: {
        en: '“This one, Teta?” asked Noor, stretching up on her toes.\n“That one,” said Teta. “It has waited all morning for you.”',
        ar: '«هذه يا تيتا؟» سألت نور وهي تقف على أطراف أصابعها.\n«نعم، تلك» قالت تيتا. «لقد انتظرتك طوال الصباح.»',
        he: '"זאת, סבתא?" שאלה נור ונעמדה על קצות האצבעות.\n"זאת," אמרה סבתא. "היא חיכתה לך כל הבוקר."',
        da: '“Den her, bedste?” spurgte Noor og strakte sig op på tæerne.\n“Den der,” sagde bedste. “Den har ventet på dig hele morgenen.”',
      },
    },
  ],
  render(P) {
    const c = P.ctx
    garden(P, 0, { gy: GY, rise: 380, treeX: 620, treeH: 700, sun: false, fruit: ORANGE })
    P.screen()
    sun(P, 1010, 150, 46)
    P.world()

    // the bough that reaches out toward Noor, with the orange she wants
    const twig = { x: 1096, y: 506 }
    P.shape(limbPath({ x: 900, y: 600 }, { x: 1020, y: 540 }, twig, 26, 17, 8, 0.6), '#8f6048', { shade: 0.6 })
    for (const [x, y, a] of [[1000, 548, -0.9], [1050, 520, 0.5], [1090, 500, -0.5], [1112, 494, 0.3], [960, 574, 0.7]] as const) {
      c.save()
      c.translate(x, y)
      c.rotate(a)
      P.shape(blob([0, 0, 22, -16, 52, -8, 60, 0, 50, 10, 22, 14]), '#4f9458', { shade: 0.5 })
      P.detail(curve([4, 0, 54, 0]), '#4f9458', 0.6)
      c.restore()
    }
    P.line(curve([twig.x, twig.y, twig.x + 2, twig.y + 14]), '#6b4a3a', 3.4)
    fruit(P, twig.x + 2, twig.y + 36, 25, ORANGE, false)

    // things lying about the garden: a can, a fallen orange, the bird on the gate post
    wateringCan(P, 258, GY - 6, 74, '#5f8fa8', 1)
    P.groundShadow(880, GY + 44, 30, 8)
    fruit(P, 880, GY + 40, 21, ORANGE, true)
    drawAnimal(P, 'bird', { ...restAnimal(884, GY - 252), scale: 0.84, flip: 1, head: -0.25, open: 0.5 }, { body: '#e2674a', mark: '#b84a34' })

    // the cat watches the bird
    const cat = { ...restAnimal(430, GY + 30), scale: 1.34, sit: 1, head: -0.32, lookX: 0.8, tail: 0.6 }
    drawAnimalShadow(P, 'cat', cat)
    drawAnimal(P, 'cat', cat)

    // Noor: on her toes, one arm stretched to the orange, the other out for balance
    const noor = castById('noor')
    const np = {
      ...rest(1196, GY - 6), ...FACES.delight, open: 0.55, cheek: 0.4, wide: 0.35, brow: 1, lookX: -0.8, lookY: -1, nod: -0.8, turn: -0.4, tilt: 0.2,
      lean: -0.15, hipx: 0.34, sq: 1.07, tip: 1,
      rW: 1, rWx: twig.x + 14, rWy: twig.y + 126, rHand: 5, rWrist: -0.05, rBend: 0.5,
      lx: 0.7, ly: 0.52, lHand: 5,
      rfx: -0.02, lfx: 0.08, swing: 0.3,
    }
    drawFigureShadow(P, noor, np, { scale: ADULT })
    drawFigure(P, noor, np, { scale: ADULT })

    // Teta Widad: the basket on her arm, a hand to her heart, laughing at how far a small girl can stretch
    const teta = castById('widad')
    const tp = {
      ...rest(1560, GY + 6), ...FACES.delight, open: 0.45, cheek: 0.5, turn: -0.5, lookX: -0.8, lookY: -0.2, tilt: 0.1, lean: -0.05, hipx: 0.14,
      rB: 1, rBx: 0.16, rBy: 0.34, rHand: 5,
      lx: 0.22, ly: 0.86, lHand: 6,
    }
    drawFigureShadow(P, teta, tp, { scale: ADULT })
    drawFigure(P, teta, tp, {
      scale: ADULT,
      hold: {
        l: (Q) => {
          const w = 150
          basket(Q, 6, w * 0.56 * 1.9 - 4, w, '#d9ad6c', () => {
            for (const [x, y] of [[-46, -4], [-14, -14], [18, -6], [46, -2], [2, 4]] as const) fruit(Q, x, y, 21, ORANGE, false)
          })
        },
      },
    })

    gardenFront(P, 0, GY)
    void circle
  },
}
