/**
 * Auto-framing for the hero film.
 *
 * The loop is a fixed 16:9 shot: the two boys stand centre-right in the lower half, the tree fills the
 * upper right, the sky on the upper left is calm. A plain `object-fit: cover` cannot keep both boys in
 * view on a portrait phone, and on a laptop the title would land on their heads. So the film is placed
 * by hand: this solver takes the hero's size and the measured UI boxes and returns where the 16:9 frame
 * should sit so that (1) both boys are in view and (2) no type, pill or card touches a face.
 *
 * Pure functions — no DOM in here.
 */
export const FILM = { w: 1920, h: 1080 }

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

/** Head boxes in film pixels, with a little air for the boys' small movements during the loop. */
const HEADS = [
  { x0: 975, y0: 478, x1: 1180, y1: 663 }, // Amir
  { x0: 1355, y0: 415, x1: 1685, y1: 645 }, // Sari and the leaf he holds up
]
/** Both boys, hair to shoes. */
const SUBJECT = { x0: 925, x1: 1685, cx: 1305, top: 415, waist: 705, feet: 988, reach: 1715 /* how far right Sari swings his leaf */ }
/** Resting zoom of the film inside its frame (hero.css) and the point it grows from — the faces move with it. */
const ZOOM = { wide: 1.03, tall: 1, ox: 0.62, oy: 0.58 }

export interface Frame {
  mode: 'wide' | 'tall'
  /** CSS pixels per film pixel. */
  s: number
  /** The film frame, relative to the hero's top-left corner. */
  x: number
  y: number
  w: number
  h: number
  /** Where the two faces end up (hero coordinates). */
  heads: Box[]
  /** Soft top edge (tall layout): transparent at [0], opaque at [1], in frame-local pixels. */
  fadeTop: [number, number] | null
  /** Soft bottom edge (tall layout): opaque at [0], transparent at [1]. */
  fadeBottom: [number, number] | null
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

export const overlaps = (a: Box, b: Box, pad = 0) => a.x < b.x + b.w + pad && a.x + a.w > b.x - pad && a.y < b.y + b.h + pad && a.y + a.h > b.y - pad

function project(s: number, x: number, y: number, zoom: number): Box[] {
  const cx = FILM.w * ZOOM.ox
  const cy = FILM.h * ZOOM.oy
  const px = (v: number) => x + (cx + (v - cx) * zoom) * s
  const py = (v: number) => y + (cy + (v - cy) * zoom) * s
  return HEADS.map((h) => ({ x: px(h.x0), y: py(h.y0), w: px(h.x1) - px(h.x0), h: py(h.y1) - py(h.y0) }))
}

const hits = (ui: Box[], heads: Box[], pad: number) => ui.some((u) => heads.some((h) => overlaps(u, h, pad)))

/**
 * Landscape screens: the film always covers the hero. It is anchored to the top edge and enlarged just
 * enough to push the boys below the title stack (they end up cropped around the shins, like a medium shot).
 */
export function frameWide(W: number, H: number, stack: Box[]): Frame {
  const cover = Math.max(W / FILM.w, H / FILM.h)
  const pad = Math.max(12, H * 0.016)
  let s = cover
  let x = 0
  let heads: Box[] = []
  for (let k = 1; k <= 1.5001; k += 0.01) {
    s = cover * k
    x = clamp(0.7 * W - SUBJECT.cx * s, W - FILM.w * s, 0) // boys right of centre
    const reach = (FILM.w * ZOOM.ox + (SUBJECT.reach - FILM.w * ZOOM.ox) * ZOOM.wide) * s
    x = Math.max(Math.min(x, W - 16 - reach), W - FILM.w * s) // …with Sari's raised hand inside the screen
    heads = project(s, x, 0, ZOOM.wide)
    if (!hits(stack, heads, pad)) break
  }
  return { mode: 'wide', s, x, y: 0, w: FILM.w * s, h: FILM.h * s, heads, fadeTop: null, fadeBottom: null }
}

/**
 * Portrait screens: both boys must fit across the width, so the film usually cannot cover the height.
 * It becomes a band — heads just under the title stack, feet just above the scene strip when there is
 * room — and dissolves at the top and bottom into a blurred copy of itself.
 */
export function frameTall(W: number, H: number, stackBottom: number, stripTop: number): Frame {
  const cover = Math.max(W / FILM.w, H / FILM.h)
  const gap = Math.max(14, H * 0.02)
  const need = stackBottom + gap // the hair may not start above this line
  let s = Math.min(cover, W / (SUBJECT.x1 - SUBJECT.x0 + 36))
  let y = Math.max(stripTop - 8 - SUBJECT.feet * s, need - SUBJECT.top * s) // feet above the strip, but never under the text
  if (SUBJECT.waist * s + y > stripTop) {
    // Too little height for everything: the strip may hide the legs, but never more than up to the waist.
    s = clamp((stripTop - need) / (SUBJECT.waist - SUBJECT.top), Math.max(W / FILM.w, s * 0.62), s)
    y = need - SUBJECT.top * s
  }
  const x = clamp(W / 2 - SUBJECT.cx * s, W - FILM.w * s, 0)
  const h = FILM.h * s
  const hair = SUBJECT.top * s
  const visibleTop = Math.max(0, -y)
  const fadeTop: [number, number] = [Math.max(visibleTop, hair - Math.max(150, H * 0.32)), hair - 14]
  const fadeBottom: [number, number] | null = y + h < H + 1 ? [Math.min(SUBJECT.feet * s + 4, h - 24), h] : null
  return { mode: 'tall', s, x, y, w: FILM.w * s, h, heads: project(s, x, y, ZOOM.tall), fadeTop, fadeBottom }
}
