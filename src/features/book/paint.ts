/**
 * Canvas "pages". A turning leaf is painted from these, so the paper carries exactly what the spread shows
 * (still, running clip frame, drift, crease) and nothing pops when the leaf lifts or lands.
 */
export const PAPER = '#f6f0e4'
export const BASE_BG = '#1a120b'

/**
 * Light on the open pages: a crease that fades from the spine (≈ 26 % · e^(−22u), u = distance across the page)
 * and slightly darker outer edges. Stops are [position across the spread 0…1, alpha].
 */
const crease = (u: number) => 0.26 * Math.exp(-22 * u)
const GUTTER: [number, number][] = [
  [0, 0.12],
  [0.012, 0.05],
  [0.035, 0],
  ...[0.16, 0.1, 0.06, 0.035, 0.018, 0.008, 0].map((u): [number, number] => [0.5 - u / 2, crease(u)]),
  ...[0.008, 0.018, 0.035, 0.06, 0.1, 0.16].map((u): [number, number] => [0.5 + u / 2, crease(u)]),
  [0.965, 0],
  [0.988, 0.05],
  [1, 0.12],
]
const GUTTER_RGB = '22, 11, 4'
export const GUTTER_CSS = `linear-gradient(to right, ${GUTTER.map(([x, a]) => `rgba(${GUTTER_RGB}, ${a.toFixed(4)}) ${(x * 100).toFixed(2)}%`).join(', ')})`

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
  for (const [x, a] of GUTTER) g.addColorStop(x, `rgba(${GUTTER_RGB}, ${a.toFixed(4)})`)
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

/**
 * The end page as the last leaf carries it: paper, the crease, and the parts of the end page that are printed on it
 * (its big title and, on the wide spread, the cover plate), measured from the end page laid out under the leaf, so
 * the leaf lands on a page that already says "The End". The rest of the page (lines, buttons) arrives after it lands.
 */
export function paintEnd(c: HTMLCanvasElement, scene: HTMLElement | null, k: number, cover?: HTMLImageElement | null) {
  const ctx = c.getContext('2d')!
  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, c.width, c.height)
  const end = scene?.querySelector<HTMLElement>('.bk-end')
  if (end) {
    const box = scene!.getBoundingClientRect()
    const sx = box.width ? c.width / k / box.width : 1
    try {
      paintPlate(ctx, end, box, k * sx, cover)
      paintTitle(ctx, end, box, k * sx)
    } catch {
      /* a page without its print is still a page */
    }
  }
  paintGutter(c)
}

function paintPlate(ctx: CanvasRenderingContext2D, end: HTMLElement, box: DOMRect, k: number, cover?: HTMLImageElement | null) {
  const el = end.querySelector<HTMLImageElement>('.bk-end-plate img')
  if (!el || !el.offsetWidth) return
  const img = cover && cover.complete && cover.naturalWidth ? cover : el.complete && el.naturalWidth ? el : null
  if (!img) return
  // Layout box (without the tilt), relative to the page.
  const pr = (el.offsetParent as HTMLElement | null)?.getBoundingClientRect()
  if (!pr) return
  const w = el.offsetWidth
  const h = el.offsetHeight
  const cx = pr.left - box.left + el.offsetLeft + w / 2
  const cy = pr.top - box.top + el.offsetTop + h / 2
  const deg = parseFloat(getComputedStyle(el).rotate) || 0
  ctx.save()
  ctx.scale(k, k)
  ctx.translate(cx, cy)
  ctx.rotate((deg * Math.PI) / 180)
  ctx.shadowColor = 'rgba(26, 18, 11, 0.24)'
  ctx.shadowBlur = 34
  ctx.shadowOffsetY = 18
  ctx.beginPath()
  ctx.roundRect(-w / 2, -h / 2, w, h, 10)
  ctx.fillStyle = '#e9dcc6'
  ctx.fill()
  ctx.shadowColor = 'transparent'
  ctx.clip()
  // object-fit: cover
  const r = Math.max(w / img.naturalWidth, h / img.naturalHeight)
  const dw = img.naturalWidth * r
  const dh = img.naturalHeight * r
  ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh)
  ctx.restore()
}

function paintTitle(ctx: CanvasRenderingContext2D, end: HTMLElement, box: DOMRect, k: number) {
  const el = end.querySelector<HTMLElement>('.bk-end-title')
  const node = el?.firstChild
  if (!el || !node || !el.offsetWidth) return
  const range = document.createRange()
  range.selectNodeContents(el)
  const rects = range.getClientRects()
  if (rects.length !== 1) return // a title on several lines stays for the page to show
  const r = rects[0]
  const cs = getComputedStyle(el)
  const rtl = cs.direction === 'rtl'
  ctx.save()
  ctx.scale(k, k)
  ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
  ctx.direction = rtl ? 'rtl' : 'ltr'
  ctx.textAlign = rtl ? 'right' : 'left'
  const ls = parseFloat(cs.letterSpacing)
  if (ls && 'letterSpacing' in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${ls}px`
  ctx.fillStyle = cs.color
  const m = ctx.measureText(el.textContent ?? '')
  const asc = m.fontBoundingBoxAscent || parseFloat(cs.fontSize) * 0.9
  const desc = m.fontBoundingBoxDescent || parseFloat(cs.fontSize) * 0.25
  const y = r.top - box.top + (r.height - (asc + desc)) / 2 + asc
  ctx.fillText(el.textContent ?? '', (rtl ? r.right : r.left) - box.left, y)
  ctx.restore()
}
