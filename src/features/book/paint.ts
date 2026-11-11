/**
 * Canvas "pages". A turning leaf is painted from these, so the paper carries exactly what the spread shows
 * (still, running clip frame, drift, crease) and nothing pops when the leaf lifts or lands.
 */
export const PAPER = '#f6f0e4'
export const BASE_BG = '#1a120b'

/** The crease down the middle of the open book: [offset from the centre as a fraction of the width, alpha]. */
const GUTTER: [number, number][] = [
  [-0.05, 0],
  [-0.022, 0.07],
  [-0.006, 0.2],
  [0, 0.34],
  [0.006, 0.2],
  [0.022, 0.07],
  [0.05, 0],
]
const GUTTER_RGB = '22, 11, 4'
export const GUTTER_CSS = `linear-gradient(to right, ${GUTTER.map(([o, a]) => `rgba(${GUTTER_RGB}, ${a}) ${((0.5 + o) * 100).toFixed(2)}%`).join(', ')})`

export interface Affine {
  a: number
  d: number
  /** Translation in CSS pixels. */
  e: number
  f: number
}

export function pageCanvas(W: number, H: number, k: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = Math.max(2, Math.round(W * k))
  c.height = Math.max(2, Math.round(H * k))
  return c
}

export function paintGutter(c: HTMLCanvasElement) {
  const ctx = c.getContext('2d')!
  const g = ctx.createLinearGradient(0, 0, c.width, 0)
  for (const [o, a] of GUTTER) g.addColorStop(0.5 + o, `rgba(${GUTTER_RGB}, ${a})`)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, c.width, c.height)
}

export function paintPaper(c: HTMLCanvasElement) {
  const ctx = c.getContext('2d')!
  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, c.width, c.height)
  paintGutter(c)
}

type Drawable = HTMLImageElement | HTMLVideoElement | HTMLCanvasElement

function intrinsic(src: Drawable): [number, number] {
  if (src instanceof HTMLVideoElement) return [src.videoWidth, src.videoHeight]
  if (src instanceof HTMLImageElement) return [src.naturalWidth, src.naturalHeight]
  return [src.width, src.height]
}

/**
 * Paints a 16:9 page: the picture cover-fitted, moved by the same transform the page uses on screen
 * (scale and translate about the centre), optionally through a CSS-style filter, then the crease.
 * Returns false when the source was not ready (the page is then plain paper).
 */
export function paintPicture(c: HTMLCanvasElement, src: Drawable | null, m: Affine | null, k: number, filter?: string): boolean {
  const ctx = c.getContext('2d')!
  const cw = c.width
  const ch = c.height
  const [iw, ih] = src ? intrinsic(src) : [0, 0]
  if (!src || !iw || !ih) {
    paintPaper(c)
    return false
  }
  ctx.save()
  ctx.fillStyle = BASE_BG
  ctx.fillRect(0, 0, cw, ch)
  if (filter && 'filter' in ctx) ctx.filter = filter
  if (m) {
    ctx.translate(cw / 2, ch / 2)
    ctx.transform(m.a, 0, 0, m.d, m.e * k, m.f * k)
    ctx.translate(-cw / 2, -ch / 2)
  }
  const tr = cw / ch
  let sx = 0
  let sy = 0
  let sw = iw
  let sh = ih
  if (iw / ih > tr) {
    sw = ih * tr
    sx = (iw - sw) / 2
  } else {
    sh = iw / tr
    sy = (ih - sh) / 2
  }
  try {
    ctx.drawImage(src, sx, sy, sw, sh, 0, 0, cw, ch)
  } catch {
    ctx.restore()
    paintPaper(c)
    return false
  }
  ctx.restore()
  paintGutter(c)
  return true
}

/** Copies a vertical slice of a page (in CSS pixels of the spread) into a face canvas. */
export function blit(face: HTMLCanvasElement, page: HTMLCanvasElement, x0: number, x1: number, W: number) {
  const ctx = face.getContext('2d')!
  const kx = page.width / W
  ctx.clearRect(0, 0, face.width, face.height)
  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, face.width, face.height)
  const sx = Math.max(0, x0 * kx)
  const sw = Math.min(page.width, x1 * kx) - sx
  if (sw <= 0) return
  // Keep the slice aligned even where it was clamped at the page edge.
  const dx = ((sx / kx - x0) / (x1 - x0)) * face.width
  const dw = (sw / kx / (x1 - x0)) * face.width
  ctx.drawImage(page, sx, 0, sw, page.height, dx, 0, dw, face.height)
}
