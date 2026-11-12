import { story } from '@/content/story'
import { clamp } from '@/lib/clamp'

/** One card per scene of the story, in story order. */
export const CARDS = story.scenes.length
/** Cards per beat: 1–4 read, 5–8 watch, 9–12 play. */
export const PER_BEAT = Math.ceil(CARDS / 3)
export const beatOf = (card: number) => clamp(Math.floor(card / PER_BEAT), 0, 2)

/** The paintings are 1344×752. */
export const PIC_W = 1344
export const PIC_H = 752
const ASPECT = PIC_W / PIC_H
/** Camera lens (vertical field of view, degrees). */
export const FOV = 30

export const smooth = (a: number, b: number, x: number) => {
  const v = clamp((x - a) / (b - a), 0, 1)
  return v * v * (3 - 2 * v)
}

/**
 * Where things stand on a stage of w×h CSS pixels. World units are CSS pixels on the plane of the front card
 * (the camera stands exactly far enough back for that), so "86% of the phone's width" is literally that.
 */
export interface Layout {
  w: number
  h: number
  portrait: boolean
  /** Front card: picture size and centre (x right, y up, from the middle of the stage). */
  W: number
  H: number
  fx: number
  fy: number
  /** Camera distance and the depth between two cards. */
  D: number
  gap: number
  /** How far the waiting cards climb and fan out, on screen. */
  rise: number
  fan: number
  /** Paper border and corner radius. */
  border: number
  radius: number
}

export function layout(w: number, h: number, dir: number): Layout {
  const portrait = w / h < 1.25
  // Never wider than the painting itself at two device pixels per CSS pixel.
  const cap = 720
  const W = Math.round(portrait ? Math.min(0.86 * w, cap, 0.44 * h * ASPECT) : Math.min(0.44 * w, cap, 0.6 * h * ASPECT))
  const H = W / ASPECT
  // Portrait: the cards own the upper part and the words stand below. Landscape: cards on the far side of the words.
  const fx = portrait ? 0 : dir * 0.1 * w
  const fy = portrait ? 0.17 * h : 0.03 * h
  const D = h / 2 / Math.tan((FOV * Math.PI) / 360)
  const top = h / 2 - fy
  return {
    w,
    h,
    portrait,
    W,
    H,
    fx,
    fy,
    D,
    gap: 0.5 * D,
    rise: Math.min(1.25 * H, (top - 0.1 * H) / 0.84),
    fan: portrait ? 0.2 * w : 0.3 * W,
    border: Math.max(3, Math.round(W * 0.011)),
    radius: Math.max(8, Math.round(W * 0.028)),
  }
}

export interface Pose {
  x: number
  y: number
  z: number
  rx: number
  ry: number
  rz: number
  /** 0…1 */
  alpha: number
  /** 0…1: how far the card has sunk into the warm dark. */
  dim: number
  /** Lens: extra softness in mip levels for the cards out of focus. */
  blur: number
}

/**
 * A card `d` steps away from the front (d > 0: still waiting in the distance, d < 0: already drifting past).
 * Designed on screen, then pushed back along the camera ray, so the composition is the same on every screen.
 */
export function pose(d: number, side: number, L: Layout, out: Pose): Pose {
  if (d >= 0) {
    const e = 1 - Math.exp(-1.4 * d)
    const z = -L.gap * d
    const k = (L.D - z) / L.D
    out.x = (L.fx + side * L.fan * e) * k
    out.y = (L.fy + L.rise * (1 - Math.exp(-0.6 * d))) * k
    out.z = z
    out.rx = -0.07 * e
    out.ry = -side * 0.2 * e
    out.rz = side * 0.055 * e
    out.alpha = 1 - smooth(2.7, 3.7, d)
    out.dim = 0.36 * smooth(0, 1, d) + 0.46 * smooth(1, 3.2, d)
    out.blur = Math.min(d, 3) * 0.9
  } else {
    const u = -d
    const z = L.gap * 0.55 * u
    const k = (L.D - z) / L.D
    const go = smooth(0, 1, u) // leaves the front gently, is gone before it fades
    // Portrait: each card leaves across the stage, opposite the side it came from. Landscape: always away from the words.
    const sx = L.portrait ? -side : Math.sign(L.fx) || -side
    out.x = (L.fx + sx * (L.portrait ? 1.05 * L.w : 0.75 * L.W + 0.2 * L.w) * go) * k
    out.y = (L.fy + 0.12 * L.H * go) * k
    out.z = z
    out.rx = 0.05 * u
    out.ry = -sx * 0.7 * go
    out.rz = sx * 0.1 * go
    out.alpha = 1 - smooth(0.4, 0.95, u)
    out.dim = 0
    out.blur = 0
  }
  return out
}
