/**
 * Six characters for the landing hero and the 3D lab: a toddler, two children, a mother, a grandfather and a
 * teacher. They are picked from the first cast (cast.ts) rather than drawn again, so the 3D figure on the landing
 * page and the flat puppet in the books are the same character built from the same sheet.
 */
import { castById } from './cast.ts'
import type { Sheet } from './sheet.ts'

export const HERO_SAMPLE_IDS = ['noor', 'lulu', 'adam', 'hala', 'nabil', 'salma'] as const

export const HERO_SAMPLES: Sheet[] = HERO_SAMPLE_IDS.map((id) => castById(id))
