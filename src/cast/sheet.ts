/**
 * The character sheet: the one description of a character that every picture is built from.
 *
 * A sheet is plain data. The flat puppet (books, films, activity pictures) and the 3D figure (landing hero, the
 * future game) are both built from the same sheet, so a character is designed once and never redrawn.
 * Nothing here may name a drawing technique: no canvas, no three.js. Keep it serialisable (it is stored with a story).
 */

/** Life stage sets the proportions: how many heads tall, limb length, how big the head reads. */
export type Stage = 'toddler' | 'child' | 'teen' | 'adult' | 'elder'

export type Build = {
  /** Height in stage units for an adult-normalised world (an adult is about 1.0). */
  height: number
  /** Total height measured in head heights (a toddler about 3.5, a child about 4.5, an adult about 6). */
  heads: number
  /** 0 slim … 1 round. */
  girth: number
  /** Shoulder width relative to the head width. */
  shoulders: number
}

export type HairStyle =
  | 'none'
  | 'short'
  | 'tuft'
  | 'curls'
  | 'bob'
  | 'long'
  | 'braids'
  | 'ponytail'
  | 'bun'
  | 'covered'

export type TopStyle = 'tee' | 'shirt' | 'jumper' | 'dress' | 'tunic' | 'coat' | 'apron'
export type BottomStyle = 'shorts' | 'trousers' | 'skirt' | 'none'
export type ShoeStyle = 'bare' | 'shoes' | 'boots' | 'sandals'
export type Extra = 'glasses' | 'hat' | 'scarf' | 'cane' | 'bag' | 'beard' | 'moustache' | 'freckles'

export type Sheet = {
  /** Stable id, lowercase with dashes, unique across the whole library. */
  id: string
  /** Names per language (a name may be kept, adapted or changed between languages). */
  name: { ar: string; he: string; en: string; da: string }
  stage: Stage
  build: Build
  /** Colours are hex strings. */
  skin: string
  /** Cheek and lip tint derived from skin when omitted. */
  blush?: string
  hair: { style: HairStyle; color: string; cover?: string }
  eyes: { color: string; /** 0 small … 1 large. */ size: number }
  brows?: { color: string; weight: number }
  top: { style: TopStyle; color: string; trim?: string; pattern?: 'plain' | 'stripes' | 'dots' | 'check' }
  bottom: { style: BottomStyle; color: string }
  shoes: { style: ShoeStyle; color: string }
  extras?: Extra[]
  /** One line a writer or animator can act from: how this character moves and feels. */
  manner: string
}

/** Default proportions per life stage. A sheet may override any field. */
export const BUILDS: Record<Stage, Build> = {
  toddler: { height: 0.48, heads: 3.5, girth: 0.6, shoulders: 1.05 },
  child: { height: 0.62, heads: 4.5, girth: 0.45, shoulders: 1.15 },
  teen: { height: 0.86, heads: 5.5, girth: 0.4, shoulders: 1.35 },
  adult: { height: 1, heads: 6, girth: 0.5, shoulders: 1.55 },
  elder: { height: 0.94, heads: 5.8, girth: 0.55, shoulders: 1.45 },
}

/**
 * The shared gesture list. Every gesture is written once against the standard skeleton and must work, unchanged,
 * on every sheet (flat puppet and 3D figure alike). The landing hero offers these; the future game reuses them.
 */
export const GESTURES = [
  'idle',
  'wave',
  'dance',
  'jump',
  'clap',
  'spin',
  'bow',
  'cheer',
  'think',
  'peek',
  'hug',
] as const
export type Gesture = (typeof GESTURES)[number]

/** Standard humanoid bone names (the set other 3D tools and game engines expect). */
export const BONES = [
  'hips',
  'spine',
  'chest',
  'neck',
  'head',
  'leftShoulder',
  'leftUpperArm',
  'leftLowerArm',
  'leftHand',
  'rightShoulder',
  'rightUpperArm',
  'rightLowerArm',
  'rightHand',
  'leftUpperLeg',
  'leftLowerLeg',
  'leftFoot',
  'rightUpperLeg',
  'rightLowerLeg',
  'rightFoot',
] as const
export type Bone = (typeof BONES)[number]
