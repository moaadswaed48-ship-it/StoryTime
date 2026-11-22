/**
 * The style profile: everything that makes "the look", as data. Figures, animals, places and props never choose a
 * line weight, a shadow colour or a texture themselves; they ask the Painter, and the Painter reads the profile.
 * So when the owner's reference cartoon arrives, the look is tuned here (or a new profile is added) and every
 * picture, old and new, follows without touching a figure.
 */
import { fromHsl, mixHex, toHsl } from './color'

export type StyleProfile = {
  id: string
  label: string
  line: {
    /** Half-width of the contour around every shape, in stage units for a thing drawn at scale 1. 0 = no line. */
    weight: number
    /** Extra contour on the side away from the light, as a multiple of `weight` (a thick-and-thin drawn line). */
    heavy: number
    /** The contour is the shape's own colour pulled toward this ink by `mix` (1 = one ink for everything). */
    ink: string
    mix: number
    /** Width of inner lines (folds, seams, hair strands) as a multiple of `weight`. */
    detail: number
    /** How much a contour thins when its figure is drawn small (0 = same on the page at any size, 1 = scales fully). */
    scaling: number
  }
  shade: {
    /** 'crescent': a hard-edged form shadow hugging the side away from the light. 'flat': none. */
    model: 'crescent' | 'flat'
    /** Width of the form shadow in stage units at scale 1. */
    offset: number
    /** Shadow colour: the fill multiplied by `tint`, mixed in by `depth`. */
    tint: string
    depth: number
    /** A thin lit edge on the side toward the light: width as a multiple of `offset` (0 = none) and strength. */
    hi: number
    light: string
    lift: number
  }
  /** Unit vector pointing from a thing toward the light, on screen (x right, y down). */
  light: { x: number; y: number }
  /** Shadows thrown on the ground: colour (multiplied over what is there), strength, how far they slide, how flat they lie. */
  cast: { tint: string; alpha: number; skew: number; flat: number }
  texture: {
    /** Fine paper tooth over everything, 0…1. */
    grain: number
    /** Slow uneven wash, as paint dries darker in places, 0…1. */
    mottle: number
    /** Dry-brush speckle inside large surfaces (ground, walls, foliage), 0…1. */
    speckle: number
  }
  /** Exaggeration: multiplies what the character sheet's life stage gives. */
  proportions: { head: number; eyes: number; hands: number; feet: number; limb: number; cheeks: number }
  palette: {
    paper: string
    /** Every sheet and prop colour passes through here: saturation scaled, then pulled toward `warm` by `warmth`. */
    saturation: number
    warm: string
    warmth: number
    /** Lightness is kept inside this range so nothing is chalk white or dead black. */
    floor: number
    ceil: number
    /** What distance turns colours into (aerial perspective) and how strongly at depth 1. */
    haze: string
    hazeK: number
  }
}

/** How a scene is lit: a light colour laid over everything, and the colour of the air. */
export type Mood = { id: string; light: string; k: number; haze?: string; shadow?: string; shadowAlpha?: number }
export const MOODS = {
  day: { id: 'day', light: '#fff4dc', k: 0 },
  morning: { id: 'morning', light: '#ffe2b0', k: 0.1, haze: '#f6e3cf' },
  golden: { id: 'golden', light: '#ffc98a', k: 0.2, haze: '#f7cfa6', shadow: '#5a2f52' },
  dusk: { id: 'dusk', light: '#8f7fb8', k: 0.34, haze: '#b9a4c9', shadow: '#2b2350', shadowAlpha: 0.3 },
  night: { id: 'night', light: '#3d4b86', k: 0.56, haze: '#39457a', shadow: '#161a3c', shadowAlpha: 0.34 },
  lamp: { id: 'lamp', light: '#ffcf8f', k: 0.16, haze: '#e9c9a2', shadow: '#4a2c3a' },
} satisfies Record<string, Mood>

/**
 * The provisional house look: warm gouache on cream paper. Coloured contours (never black), one hard form shadow,
 * a violet shadow family, cut-paper overlap and hazy distance. Tuned to read on a phone.
 */
export const GOUACHE: StyleProfile = {
  id: 'gouache',
  label: 'Warm gouache',
  line: { weight: 2.1, heavy: 0.75, ink: '#3a2238', mix: 0.6, detail: 0.85, scaling: 0.62 },
  shade: { model: 'crescent', offset: 7, tint: '#8c6fa3', depth: 0.62, hi: 0.34, light: '#fff3d6', lift: 0.3 },
  light: { x: -0.74, y: -0.67 },
  cast: { tint: '#6b4f8f', alpha: 0.3, skew: 0.42, flat: 0.13 },
  texture: { grain: 0.55, mottle: 0.5, speckle: 0.6 },
  proportions: { head: 1.16, eyes: 1.04, hands: 0.94, feet: 1, limb: 1, cheeks: 1 },
  palette: { paper: '#f8efdc', saturation: 0.94, warm: '#f2c58c', warmth: 0.06, floor: 0.14, ceil: 0.95, haze: '#dfe6e6', hazeK: 0.62 },
}

/**
 * A second look, kept to prove the swap: bold dark ink, flat colour, bigger heads. Not a finished style; it exists
 * so every picture can be re-rendered under another profile with no change to the figures.
 */
export const INK: StyleProfile = {
  id: 'ink',
  label: 'Bold ink, flat colour',
  line: { weight: 3.4, heavy: 0.2, ink: '#221a2c', mix: 0.96, detail: 0.7, scaling: 0.8 },
  shade: { model: 'flat', offset: 0, tint: '#7a6a9a', depth: 0, hi: 0, light: '#ffffff', lift: 0 },
  light: { x: -0.74, y: -0.67 },
  cast: { tint: '#3f3a6b', alpha: 0.22, skew: 0.42, flat: 0.13 },
  texture: { grain: 0.25, mottle: 0.1, speckle: 0.2 },
  proportions: { head: 1.3, eyes: 1.25, hands: 1.15, feet: 1.15, limb: 0.92, cheeks: 0.8 },
  palette: { paper: '#fbf7ee', saturation: 1.12, warm: '#ffe9c9', warmth: 0.02, floor: 0.12, ceil: 0.97, haze: '#e7ecef', hazeK: 0.55 },
}

export const PROFILES: Record<string, StyleProfile> = { gouache: GOUACHE, ink: INK }

const TUNED = new Map<string, string>()
/** A colour as this profile's palette rules allow it. */
export function tune(c: string, st: StyleProfile): string {
  const key = st.id + c
  let out = TUNED.get(key)
  if (!out) {
    const [h, s, l] = toHsl(c)
    const p = st.palette
    out = mixHex(fromHsl(h, Math.min(1, s * p.saturation), Math.max(p.floor, Math.min(p.ceil, l))), p.warm, p.warmth)
    TUNED.set(key, out)
  }
  return out
}
