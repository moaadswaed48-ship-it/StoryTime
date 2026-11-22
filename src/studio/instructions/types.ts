/**
 * The instruction-picture contract: an activity is a short list of cards (the materials, then each step), and a
 * direction is one way of drawing any card. Words never go into the drawing: the caption is real text set by the
 * page in the user's language, so a card is one picture for all four languages.
 */
import type { Painter } from '../kit/core'
import type { Lang, Words } from '../scene'
import type { InstructionProfile } from '../style/instruction-profiles'

export type { Lang, Words }

export type CardKey = 'materials' | 's1' | 's2' | 's3' | 's4'

export type Card = {
  key: CardKey
  /** 0 for the materials card, then 1, 2, 3 … */
  n: number
  caption: Words
  /** Seconds of the loop when this step moves; the last frame leads into the first. Absent = a still. */
  loop?: number
  /** The moment of a loop that is shown when it cannot play (print, reduced motion, the contact sheet). */
  still?: number
}

export type ActivityId = 'here-you-are' | 'talking-stick'

export type Activity = {
  id: ActivityId
  /** The story outline the activity belongs to, and its age group. */
  story: string
  ages: '2-3' | '4-5' | '6-8'
  title: Words
  /** What the activity teaches, for the adult (shown by the site beside the pictures, not inside them). */
  cards: Card[]
}

export type DrawCtx = {
  activity: Activity
  card: Card
  /** Seconds. For a loop, any real number (the picture is periodic); for a still, 0. */
  t: number
  /** true when the page reads right to left: the step number, and anything read in order, starts on the right. The art itself is never mirrored. */
  rtl: boolean
  /** How many steps the activity has (for "step 2 of 4" shown without words). */
  steps: number
}

export type Direction = {
  profile: InstructionProfile
  draw: (P: Painter, d: DrawCtx) => void
}
