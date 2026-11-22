/**
 * The instruction cast: the eight people who appear in every activity's instruction pictures, and nowhere else.
 *
 * They are not story characters (owner's request L3) and they are not the builder's test set in `cast.ts`: a parent
 * meets these same eight under every story, so they must be easy to tell apart at phone size and good company.
 *
 * How they were chosen
 * - One signature colour each, far apart on the colour wheel, so a person is recognised from a sleeve alone
 *   (the hands-first and from-above pictures often show little more).
 * - One hair shape each that reads from the front, from behind and from above (bun, ponytail, curls, bob …).
 * - Skin and hair cover the range of families who will use the site (Arab and Jewish families in Israel, Danish
 *   and English-speaking families). Nobody wears a marker of a religion or a nation, and nobody is a "type".
 * - Adults are named by what they are to the child (Mum, Dad, Grandpa), each in the user's own language; the
 *   teacher and the children carry names that exist, or have a twin, in all four languages.
 * - Safety is part of the design: no child wears a scarf, a bag strap or anything else round the neck (the activity
 *   red list), and the grandfather walks without a stick so nothing long is ever near a small child.
 *
 * Sheets are plain data (see `sheet.ts`). The ids start with `guide-` so they can never collide with a story's.
 */
import { BUILDS, type Sheet } from './sheet'

const n = (ar: string, he: string, en: string, da: string) => ({ ar, he, en, da })

export const INSTRUCTION_CAST: Sheet[] = [
  {
    id: 'guide-teacher', name: n('المعلّمة منى', 'המורה מונה', 'Miss Mona', 'Mona'), stage: 'adult',
    build: { ...BUILDS.adult, height: 0.96, girth: 0.5 },
    skin: '#d6a07a', hair: { style: 'bun', color: '#4a2a22' }, eyes: { color: '#4a2f22', size: 0.62 },
    top: { style: 'apron', color: '#e8ac2e', trim: '#fbf1dc' }, bottom: { style: 'trousers', color: '#3c4f78' }, shoes: { style: 'shoes', color: '#7a4a3a' },
    extras: ['glasses'], extraColors: { glasses: '#c9483a' },
    manner: 'The kindergarten teacher: kneels to a child\'s height, shows first, then waits; never in a hurry.',
  },
  {
    id: 'guide-mother', name: n('ماما', 'אמא', 'Mum', 'Mor'), stage: 'adult',
    build: { ...BUILDS.adult, height: 0.94, girth: 0.54 },
    skin: '#a8683f', hair: { style: 'ponytail', color: '#1f1414' }, eyes: { color: '#2e1c14', size: 0.6 },
    top: { style: 'jumper', color: '#c84f6c', trim: '#f6dfd0' }, bottom: { style: 'trousers', color: '#51688f' }, shoes: { style: 'shoes', color: '#f3ecdf' },
    manner: 'The mother: warm, a little tired, fully there for these ten minutes; her smile starts in her eyes.',
  },
  {
    id: 'guide-father', name: n('بابا', 'אבא', 'Dad', 'Far'), stage: 'adult',
    build: { ...BUILDS.adult, height: 1.02, girth: 0.6, shoulders: 1.66 },
    skin: '#eec4a0', hair: { style: 'short', color: '#8a5632' }, eyes: { color: '#5b7a66', size: 0.52 }, brows: { color: '#7a4a2c', weight: 0.8 },
    top: { style: 'shirt', color: '#4f9a72', trim: '#eef4e6', pattern: 'check' }, bottom: { style: 'trousers', color: '#55505c' }, shoes: { style: 'shoes', color: '#6b4030' },
    extras: ['beard'],
    manner: 'The father: big and soft-spoken; sits on the floor without being asked; laughs last and longest.',
  },
  {
    id: 'guide-grandpa', name: n('جدّو', 'סבא', 'Grandpa', 'Bedstefar'), stage: 'elder',
    build: { ...BUILDS.elder, height: 0.93, girth: 0.6 },
    skin: '#c58a62', hair: { style: 'short', color: '#ece8e2' }, eyes: { color: '#4a3a2c', size: 0.48 }, brows: { color: '#d9d4cc', weight: 0.9 },
    top: { style: 'coat', color: '#5f82b8', trim: '#f4ecd8' }, bottom: { style: 'trousers', color: '#8a7a66' }, shoes: { style: 'shoes', color: '#4a3028' },
    extras: ['moustache', 'glasses'], extraColors: { glasses: '#6a5a4a' },
    manner: 'The grandfather: slow and exact; does each step as if it mattered, because to him it does.',
  },
  {
    id: 'guide-lia', name: n('ليا', 'ליה', 'Lia', 'Lia'), stage: 'toddler',
    build: { ...BUILDS.toddler, height: 0.47, girth: 0.62 },
    skin: '#efc59e', hair: { style: 'ponytail', color: '#8a5a36' }, eyes: { color: '#5a3a24', size: 0.95 },
    top: { style: 'dress', color: '#ef7d54', trim: '#fff0d8' }, bottom: { style: 'none', color: '#ef7d54' }, shoes: { style: 'bare', color: '#000000' },
    manner: 'About two and a half: carries everything with both arms and her whole tummy; proud of every delivery.',
  },
  {
    id: 'guide-tom', name: n('توم', 'תום', 'Tom', 'Tom'), stage: 'child',
    build: { ...BUILDS.child, height: 0.56, girth: 0.52 },
    skin: '#7b4a2e', hair: { style: 'short', color: '#1a1210' }, eyes: { color: '#2a1a12', size: 0.88 },
    top: { style: 'tee', color: '#48a6c4', trim: '#f4f8f4', pattern: 'stripes' }, bottom: { style: 'shorts', color: '#e0a13a' }, shoes: { style: 'shoes', color: '#d8563e' },
    manner: 'About four: bursting to go next; sits on his hands to help himself wait.',
  },
  {
    id: 'guide-sara', name: n('سارة', 'שרה', 'Sara', 'Sara'), stage: 'child',
    build: { ...BUILDS.child, height: 0.63, girth: 0.42 },
    skin: '#d19a6c', hair: { style: 'braids', color: '#2a1816' }, eyes: { color: '#3a2418', size: 0.8 },
    top: { style: 'tunic', color: '#8a63b8', trim: '#f3e6c8' }, bottom: { style: 'trousers', color: '#efe3c8' }, shoes: { style: 'shoes', color: '#c9506a' },
    manner: 'About six: listens with her whole face; repeats things under her breath to keep them.',
  },
  {
    id: 'guide-jonah', name: n('يونس', 'יונה', 'Jonah', 'Jonas'), stage: 'child',
    build: { ...BUILDS.child, height: 0.7, heads: 4.9, girth: 0.4 },
    skin: '#f6d8be', hair: { style: 'curls', color: '#b9853f' }, eyes: { color: '#4f7a8a', size: 0.74 },
    top: { style: 'jumper', color: '#d9513c', trim: '#f6e6c8' }, bottom: { style: 'trousers', color: '#3d4a6c' }, shoes: { style: 'boots', color: '#6b4a34' },
    extras: ['freckles'],
    manner: 'About eight: the helper; shows the little ones how, then steps back so they can do it.',
  },
]

/** The cast by short role name, for writing scenes ("mum gives the cup to lia"). */
export type GuideId = 'teacher' | 'mother' | 'father' | 'grandpa' | 'lia' | 'tom' | 'sara' | 'jonah'

export const guide = (id: GuideId): Sheet => {
  const s = INSTRUCTION_CAST.find((c) => c.id === `guide-${id}`)
  if (!s) throw new Error(`no instruction cast member "${id}"`)
  return s
}
