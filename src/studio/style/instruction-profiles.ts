/**
 * The three candidate looks for activity instruction pictures, as data. Each is a complete small system: the
 * drawing style (a `StyleProfile`, read by the Painter and the character builder), the page, the colours, how a
 * step is numbered, how the caption sits and how a loop moves.
 *
 * The owner chooses one. To keep the chosen one: delete the other two entries here, their files in
 * `src/studio/instructions/` and their lines in `src/studio/instructions/index.ts`.
 */
import { GOUACHE, INK, type StyleProfile } from './profile'

export type DirectionId = 'above' | 'hands' | 'stage'

export type CaptionStyle = {
  /** 'over': on a label drawn inside the picture. 'below': on a band under the picture, part of the same card. */
  place: 'over' | 'below'
  /** For 'over': the label's box in the picture's own units, as for a left-to-right page (the picture draws the label, the page sets the words in it; a right-to-left page mirrors the box). */
  box?: { x: number; y: number; w: number; h: number }
  /** The box on a card that has no step number beside the words (the materials card), when that differs. */
  box0?: { x: number; y: number; w: number; h: number }
  /** For 'below': the band's colour and its height as a fraction of the picture's width. */
  band?: string
  bandH?: number
  color: string
  /** Type size as a fraction of the card's width (Arabic is set a little larger, as its letters are smaller). */
  size: number
  weight: number
}

export type InstructionProfile = {
  id: DirectionId
  /** The name the owner sees. */
  label: string
  /** One line: the idea. */
  idea: string
  style: StyleProfile
  /** Picture size in its own units. */
  W: number
  H: number
  /** Corner radius of the card as a fraction of its width. */
  radius: number
  /** Drawings per second in a loop (12 = animation on twos, 8 = stop-motion). */
  holdFps: number
  caption: CaptionStyle
  /** The direction's own colours, by role. */
  c: Record<string, string>
}

/**
 * Each look starts from one of the Studio's own profiles and changes what makes it itself, so a field the Studio
 * adds to `StyleProfile` later is inherited instead of breaking these.
 *
 * 1 · FROM ABOVE: a photograph-like flat-lay. Cut paper with barely a drawn outline; things are separated by soft
 * shadows, as real paper on a real floor would be.
 */
const ABOVE_STYLE: StyleProfile = {
  ...GOUACHE,
  id: 'inst-above',
  label: 'From above (cut paper, soft shadows)',
  line: { ...GOUACHE.line, weight: 0.75, heavy: 0, ink: '#4a3340', mix: 0.42, detail: 1.5, scaling: 0.5 },
  shade: { ...GOUACHE.shade, model: 'crescent', offset: 5, tint: '#9a7f9c', depth: 0.34, hi: 0.5, light: '#fff6e0', lift: 0.34, half: 0, halfDepth: 0 },
  hand: { ...GOUACHE.hand, wobble: 0.9, line: 1, shade: 1.5, register: { x: 0, y: 0 } },
  light: { x: -0.6, y: -0.8 },
  cast: { ...GOUACHE.cast, tint: '#5a4668', alpha: 0.3, skew: 0.3, flat: 0.2 },
  texture: { ...GOUACHE.texture, grain: 0.75, mottle: 0.35, speckle: 0.42 },
  proportions: { ...GOUACHE.proportions, head: 1.12, eyes: 1.05, hands: 1.1, feet: 1, limb: 1, cheeks: 1 },
  palette: { ...GOUACHE.palette, paper: '#efe4d0', saturation: 0.92, warm: '#f1cf9c', warmth: 0.05, floor: 0.14, ceil: 0.96, haze: '#e4e2dc', hazeK: 0.5 },
}

/**
 * 2 · HANDS FIRST: a printed craft book. One confident dark line, flat colour, no shading, big hands; one strong
 * colour per activity behind everything.
 */
const HANDS_STYLE: StyleProfile = {
  ...INK,
  id: 'inst-hands',
  label: 'Hands first (ink line, flat colour)',
  line: { ...INK.line, weight: 2.5, heavy: 0, ink: '#22203a', mix: 1, detail: 0.8, scaling: 0.72 },
  shade: { ...INK.shade, model: 'flat', offset: 0, depth: 0, hi: 0 },
  hand: { ...INK.hand, wobble: 1.6, line: 0.7, shade: 0, register: { x: 0, y: 0 } },
  cast: { ...INK.cast, tint: '#22203a', alpha: 0.16, skew: 0.3, flat: 0.12 },
  texture: { ...INK.texture, grain: 0.4, mottle: 0.12, speckle: 0 },
  proportions: { ...INK.proportions, head: 1.22, eyes: 1.14, hands: 1.34, feet: 1.1, limb: 1.04, cheeks: 0.9 },
  palette: { ...INK.palette, paper: '#fbf5e8', saturation: 1.06, warm: '#ffe9c9', warmth: 0.02, floor: 0.13, ceil: 0.97 },
}

/**
 * 3 · THE LITTLE STAGE: a paper theatre in warm gouache. Coloured contours, one form shadow, footlights; the
 * whole person acts, so faces and feelings carry the step.
 */
const STAGE_STYLE: StyleProfile = {
  ...GOUACHE,
  id: 'inst-stage',
  label: 'The little stage (warm gouache)',
  line: { ...GOUACHE.line, weight: 2, heavy: 0.7, ink: '#3a2238', mix: 0.6, detail: 0.85, scaling: 0.62 },
  shade: { ...GOUACHE.shade, model: 'crescent', offset: 7, tint: '#8c6fa3', depth: 0.6, hi: 0.34, light: '#fff3d6', lift: 0.3 },
  light: { x: -0.5, y: -0.86 },
  cast: { ...GOUACHE.cast, tint: '#4a3566', alpha: 0.3, skew: 0.3, flat: 0.13 },
  texture: { ...GOUACHE.texture, grain: 0.55, mottle: 0.45, speckle: 0.6 },
  proportions: { ...GOUACHE.proportions, head: 1.2, eyes: 1.08, hands: 1.04, feet: 1, limb: 1, cheeks: 1 },
  palette: { ...GOUACHE.palette, paper: '#f8efdc', saturation: 0.96, warm: '#f2c58c', warmth: 0.06, floor: 0.14, ceil: 0.95, haze: '#e6dcd6', hazeK: 0.55 },
}

export const INSTRUCTION_PROFILES: Record<DirectionId, InstructionProfile> = {
  above: {
    id: 'above',
    label: 'From above',
    idea: 'A photo-like view straight down: the things and the people as cut paper on the floor, with soft shadows.',
    style: ABOVE_STYLE,
    W: 1080,
    H: 1080,
    radius: 0.045,
    holdFps: 8,
    caption: { place: 'over', box: { x: 96, y: 888, w: 888, h: 150 }, color: '#3a2a34', size: 0.058, weight: 700 },
    c: {
      wood: '#d9b88a', woodDark: '#c49e6c', rugA: '#3f8f8a', rugB: '#e9d9b8', rugC: '#d9694a', rugHome: '#c9785a', floorB: '#cfd9cf', floorBDark: '#bccabf',
      label: '#fffaf0', tape: '#f2c14e', tape2: '#7fb8b0', token: '#fffaf0', ink: '#3a2a34', arrow: '#fffaf0', accent: '#d9573f',
    },
  },
  hands: {
    id: 'hands',
    label: 'Hands first',
    idea: 'A craft-book close-up: big hands and the thing they hold, one dark line, one strong colour.',
    style: HANDS_STYLE,
    W: 1200,
    H: 1140,
    radius: 0.05,
    holdFps: 12,
    caption: { place: 'over', box: { x: 250, y: 918, w: 916, h: 204 }, box0: { x: 60, y: 918, w: 1080, h: 204 }, color: '#22203a', size: 0.06, weight: 800 },
    c: {
      ink: '#22203a', paper: '#fbf5e8', fieldA: '#f6b93b', fieldA2: '#fbd06a', fieldB: '#5cb8ae', fieldB2: '#86cfc4', arrow: '#fbf5e8', accent: '#e4572e',
    },
  },
  stage: {
    id: 'stage',
    label: 'The little stage',
    idea: 'A small paper theatre: the cast act each step with a few props, and their faces tell how it feels.',
    style: STAGE_STYLE,
    W: 1200,
    H: 1040,
    radius: 0.04,
    holdFps: 12,
    caption: { place: 'over', box: { x: 120, y: 852, w: 960, h: 166 }, color: '#fff6e2', size: 0.054, weight: 700 },
    c: {
      frame: '#2b3a67', frameDark: '#1f2b50', curtain: '#d9573f', curtainDark: '#b8402f', gold: '#f2c14e', back: '#f9ecd2', backA: '#f6dfc0', backB: '#dfeadf',
      floor: '#dcae72', floorDark: '#c4925a', lampOn: '#ffe08a', lampOff: '#4a5a8a', ink: '#3a2238', arrow: '#fffaf0', accent: '#d9573f',
    },
  },
}
