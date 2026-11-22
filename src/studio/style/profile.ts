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
    /** A second, paler step of shadow lying wider than the first (a half-tone): width as a multiple of `offset` (0 = none) and strength 0…1. */
    half?: number
    halfDepth?: number
  }
  /**
   * The hand that made it: how far a drawn edge strays from the true one (stage units at scale 1), the distance
   * between its swells, how much more the ink line strays than the paint (`line`) and the shadow edge (`shade`),
   * and how far the line sits off the paint, like a print not quite in register. All of it is fixed for each place
   * along each outline, so a film does not boil. 0 everywhere = ruled, machine-made edges.
   */
  hand?: { wobble: number; wave?: number; line?: number; shade?: number; register?: { x: number; y: number } }
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
    /** How far the brush streaks turn to run along each shape, 0…1 (0 = one direction everywhere). */
    follow?: number
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

/**
 * How a scene is lit. A mood changes form, not only colour: where the light comes from (`dir`) decides which side
 * of everything is in shadow and where cast shadows fall; `soft` (cloud) takes cast shadows away and leaves soft
 * patches at the feet; `rim` paints a thin edge of coloured light on the lit side (moonlight, lamp light);
 * standing lights (`Painter.lamps`) light what is near them in the mood's `lamp` colour.
 */
export type Mood = {
  id: string
  /** The colour of the light everything stands in, and how strongly it takes over (0 = plain daylight). */
  light: string
  k: number
  /** The colour of the air (what distance fades into). */
  haze?: string
  /** The colour of shade and cast shadows, and how dark cast shadows are. */
  shadow?: string
  shadowAlpha?: number
  /** Unit vector from a thing toward the light, on screen (x right, y down). Default: the profile's. */
  dir?: { x: number; y: number }
  /** 0…1 cloud: form shadows narrower and paler, cast shadows become soft patches under things. */
  soft?: number
  /** How long cast shadows are (1 = the profile's; a low sun gives 2) and how soft their edge is (stage units). */
  castLen?: number
  castBlur?: number
  /** Multiplies the profile's form-shadow depth (deeper at night). */
  shadeDepth?: number
  /** Multiplies colour saturation (cloud greys a little, lamp light enriches). */
  sat?: number
  /** A thin rim of light on the lit edge of everything: its colour, strength 0…1 and width (as a multiple of the form-shadow width). `lampOnly`: only where a standing light reaches. */
  rim?: { color: string; k: number; w: number; lampOnly?: boolean }
}
const unit = (x: number, y: number) => ({ x: x / Math.hypot(x, y), y: y / Math.hypot(x, y) })
export const MOODS = {
  day: { id: 'day', light: '#fff4dc', k: 0 },
  /** A low warm sun from the upper left: long cool shadows. */
  morning: { id: 'morning', light: '#ffe2b0', k: 0.1, haze: '#f6e3cf', shadow: '#4f4a86', castLen: 1.5, dir: unit(-0.86, -0.5) },
  /** Cloud: flat cool light from above, no cast shadows, colour a little greyed. */
  overcast: { id: 'overcast', light: '#c9d3dc', k: 0.2, haze: '#d5dbe0', shadow: '#5a6478', shadowAlpha: 0.22, soft: 0.85, sat: 0.78, shadeDepth: 0.7, dir: unit(-0.2, -0.98) },
  golden: { id: 'golden', light: '#ffc98a', k: 0.2, haze: '#f7cfa6', shadow: '#5a2f52', castLen: 1.9, dir: unit(0.9, -0.42) },
  dusk: { id: 'dusk', light: '#8f7fb8', k: 0.34, haze: '#b9a4c9', shadow: '#2b2350', shadowAlpha: 0.3 },
  /** Night with a moon: deep blue, deep shade, a pale rim of moonlight on everything. */
  night: { id: 'night', light: '#3d4b86', k: 0.58, haze: '#39457a', shadow: '#12163a', shadowAlpha: 0.36, shadeDepth: 1.25, castBlur: 2, rim: { color: '#cfe0ff', k: 0.55, w: 0.42 }, dir: unit(-0.62, -0.78) },
  /** Evening indoors by lamp light: the room is dusk-blue, and whatever stands near a lamp is warm and lit from its side. */
  lamp: { id: 'lamp', light: '#6a5f9c', k: 0.46, haze: '#5a5590', shadow: '#2a1a40', shadowAlpha: 0.4, shadeDepth: 1.2, castBlur: 2.5, sat: 1.05, rim: { color: '#ffd79a', k: 0, w: 0.5, lampOnly: true } },
} satisfies Record<string, Mood>

/**
 * The provisional house look: warm gouache on cream paper. Coloured contours (never black), one hard form shadow,
 * a violet shadow family, cut-paper overlap and hazy distance. Tuned to read on a phone.
 */
export const GOUACHE: StyleProfile = {
  id: 'gouache',
  label: 'Warm gouache',
  line: { weight: 2.1, heavy: 0.75, ink: '#3a2238', mix: 0.6, detail: 0.85, scaling: 0.62 },
  shade: { model: 'crescent', offset: 7, tint: '#8c6fa3', depth: 0.62, hi: 0.34, light: '#fff3d6', lift: 0.3, half: 2.3, halfDepth: 0.34 },
  hand: { wobble: 1.5, wave: 58, line: 1.5, shade: 3.2, register: { x: 0.7, y: 0.5 } },
  light: { x: -0.74, y: -0.67 },
  cast: { tint: '#6b4f8f', alpha: 0.3, skew: 0.42, flat: 0.13 },
  texture: { grain: 0.55, mottle: 0.5, speckle: 0.5, follow: 1 },
  proportions: { head: 1.16, eyes: 1.04, hands: 1, feet: 1, limb: 1, cheeks: 1 },
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
  shade: { model: 'flat', offset: 0, tint: '#7a6a9a', depth: 0, hi: 0, light: '#ffffff', lift: 0, half: 0, halfDepth: 0 },
  hand: { wobble: 2.2, wave: 80, line: 0.6, shade: 0, register: { x: 0, y: 0 } },
  light: { x: -0.74, y: -0.67 },
  cast: { tint: '#3f3a6b', alpha: 0.22, skew: 0.42, flat: 0.13 },
  texture: { grain: 0.25, mottle: 0.1, speckle: 0.2, follow: 0 },
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
