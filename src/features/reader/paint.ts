/**
 * Prints a page: paper, the scene's painting and the author's words, drawn on a 2D canvas that the curl
 * engine then wraps around its cylinder. The browser's own text engine shapes the Arabic (whole lines are
 * drawn at once, never letters), so joining, marks and direction are exactly as in the rest of the site.
 */
import { story } from '@/content/story'
import { UI_FAMILY } from '@/design/fonts'
import { t } from '@/i18n/copy'
import { locale, num, rtl } from '@/i18n/locale'
import { asset } from '@/lib/asset'
import { mulberry32 } from '@/lib/seeded'
import { wrapBalanced, type BookPage, type Measure, type PageGeometry } from './layout'

export const PAPER = '#f7f1e5'
export const PAPER_RGB: [number, number, number] = [0xf7 / 255, 0xf1 / 255, 0xe5 / 255]
const INK = 'rgba(26, 18, 11, 0.93)'
const INK_SOFT = 'rgba(67, 54, 42, 0.86)'
const MUTED = 'rgba(125, 110, 94, 0.95)'
const MAPLE = '#d9541e'

const STORY_FONT = rtl ? `"Noto Naskh Arabic", "IBM Plex Sans Arabic", serif` : `Georgia, "Times New Roman", serif`
const UI_FONT = UI_FAMILY
export const storyFont = (px: number, weight = rtl ? 500 : 400) => `${weight} ${px}px ${STORY_FONT}`
export const uiFont = (px: number, weight = 500) => `${weight} ${px}px ${UI_FONT}`

/* ── Fonts and pictures are fetched ahead of the first page ───────────────────────────────────────── */

/** Loads the faces the page prints with, so the first measurement is the real one. Resolves either way. */
export async function loadFonts(): Promise<void> {
  const fonts = document.fonts
  if (!fonts?.load) return
  const sample = rtl ? 'أوراق الخريف 123' : 'Autumn Leaves 123'
  const wanted = rtl ? [storyFont(24, 500), storyFont(24, 700), uiFont(24, 500), uiFont(24, 800)] : [uiFont(24, 500), uiFont(24, 800)]
  const all = Promise.all(wanted.map((f) => fonts.load(f, sample))).then(() => undefined)
  await Promise.race([all.catch(() => undefined), new Promise<void>((r) => setTimeout(r, 2500))])
}

const pictures = new Map<string, HTMLImageElement>()
/** Starts loading a picture (once) and calls `onReady` when it can be drawn. */
export function picture(path: string, onReady?: () => void): HTMLImageElement {
  let im = pictures.get(path)
  if (!im) {
    im = new Image()
    im.decoding = 'async'
    im.src = asset(path)
    pictures.set(path, im)
  }
  if (onReady && !usable(im)) {
    const el = im
    const done = () => (el.decode ? el.decode().catch(() => undefined) : Promise.resolve()).then(onReady)
    el.addEventListener('load', done, { once: true })
  }
  return im
}
const usable = (im: HTMLImageElement) => im.complete && im.naturalWidth > 0

/* ── Measuring ────────────────────────────────────────────────────────────────────────────────────── */

let probe: CanvasRenderingContext2D | null = null
function probeCtx(): CanvasRenderingContext2D {
  if (!probe) {
    probe = document.createElement('canvas').getContext('2d')!
    probe.direction = rtl ? 'rtl' : 'ltr'
  }
  return probe
}
/** Width of a run of text set in `font`, in CSS px: the same shaping the page is printed with. */
export function measurer(font: string): Measure {
  const ctx = probeCtx()
  return (text) => {
    if (ctx.font !== font) ctx.font = font
    return ctx.measureText(text).width
  }
}

/* ── Paper ────────────────────────────────────────────────────────────────────────────────────────── */

let grain: HTMLCanvasElement | null = null
function grainTile(): HTMLCanvasElement {
  if (grain) return grain
  const size = 192
  grain = document.createElement('canvas')
  grain.width = grain.height = size
  const ctx = grain.getContext('2d')!
  const img = ctx.createImageData(size, size)
  const rnd = mulberry32(7)
  for (let i = 0; i < size * size; i++) {
    // Fibres: mostly nothing, now and then a darker or lighter fleck.
    const v = rnd()
    const dark = v < 0.5
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = dark ? 70 : 255
    img.data[i * 4 + 3] = Math.round((dark ? 16 : 22) * rnd() * rnd())
  }
  ctx.putImageData(img, 0, 0)
  return grain
}

function paper(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, w, h)
  const pattern = ctx.createPattern(grainTile(), 'repeat')
  if (pattern) {
    ctx.fillStyle = pattern
    ctx.fillRect(0, 0, w, h)
  }
}

/** Draws `im` so it covers the box (centre-cropped), or a quiet placeholder while it is still loading. */
function cover(ctx: CanvasRenderingContext2D, im: HTMLImageElement, x: number, y: number, w: number, h: number, focusY = 0.5): boolean {
  if (!usable(im)) {
    ctx.fillStyle = '#e9dfcb'
    ctx.fillRect(x, y, w, h)
    return false
  }
  const s = Math.max(w / im.naturalWidth, h / im.naturalHeight)
  const sw = w / s
  const sh = h / s
  ctx.drawImage(im, (im.naturalWidth - sw) / 2, (im.naturalHeight - sh) * focusY, sw, sh, x, y, w, h)
  return true
}

/** A small autumn leaf, the book's only ornament. */
function leaf(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, angle: number, alpha = 0.85) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(angle)
  ctx.scale(size / 20, size / 20)
  ctx.globalAlpha = alpha
  ctx.fillStyle = MAPLE
  ctx.beginPath()
  ctx.moveTo(0, -10)
  ctx.bezierCurveTo(7, -6, 8, 3, 0, 10)
  ctx.bezierCurveTo(-8, 3, -7, -6, 0, -10)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255, 244, 228, 0.75)'
  ctx.lineWidth = 0.9
  ctx.beginPath()
  ctx.moveTo(0, -7)
  ctx.lineTo(0, 13)
  ctx.stroke()
  ctx.restore()
}

/* ── The page ─────────────────────────────────────────────────────────────────────────────────────── */

export interface PaintOptions {
  /** Device px per CSS px. */
  scale: number
  /** The page is behind the demo paywall: printed, then frosted. */
  locked: boolean
  /** The first locked page also carries the paywall card (printed on it, so it turns with the paper). */
  gate: boolean
  /** The child's name for the dedication, if one is set. */
  childName: string
  /** Called when a picture that was missing has arrived (the page should be painted again). */
  onPicture: () => void
}

/** Where the painting sits on a scene page, in page fractions (x0, y0, x1, y1): the film plays in the same box. */
export const pictureBox = (g: PageGeometry): [number, number, number, number] => [0, 0, 1, g.pictureH / g.pageH]

function paintTitle(ctx: CanvasRenderingContext2D, g: PageGeometry, o: PaintOptions) {
  const { pageW: w, pageH: h } = g
  const artH = Math.round(Math.min(h * 0.6, w * 1.3))
  const titleSize = Math.round(Math.min(46, Math.max(27, w * 0.083)))
  cover(ctx, picture(story.cover, o.onPicture), 0, 0, w, artH, 0.3)
  // The cover painting melts into the paper instead of ending on a hard line.
  const fade = ctx.createLinearGradient(0, artH * 0.62, 0, artH)
  fade.addColorStop(0, 'rgba(247, 241, 229, 0)')
  fade.addColorStop(0.75, 'rgba(247, 241, 229, 0.86)')
  fade.addColorStop(1, PAPER)
  ctx.fillStyle = fade
  ctx.fillRect(0, artH * 0.62 - 1, w, artH * 0.38 + 2)

  // The lettering is set as one block and placed in the middle of the paper left under the painting.
  const lines = wrapBalanced(story.title[locale], w - 2 * Math.max(24, g.marginX * 0.8), measurer(uiFont(titleSize, 800)), 2)
  const pitch = Math.round(titleSize * (rtl ? 1.3 : 1.14))
  const small = Math.max(15.5, titleSize * 0.44)
  const block = titleSize * 1.28 + lines.length * pitch + titleSize * 1.15 + (o.childName ? small * 1.95 : 0)
  const room = g.folioY - small * 1.4 - artH
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  const cx = w / 2
  let y = artH - titleSize * 0.35 + Math.max(0, (room - block) * 0.42)
  ctx.font = uiFont(Math.max(12.5, titleSize * 0.36), 600)
  ctx.fillStyle = MAPLE
  ctx.fillText(story.kicker[locale], cx, y)
  y += Math.round(titleSize * 1.28)
  ctx.font = uiFont(titleSize, 800)
  ctx.fillStyle = INK
  for (const line of lines) {
    ctx.fillText(line, cx, y)
    y += pitch
  }
  y += Math.round(titleSize * 0.1)
  leaf(ctx, cx, y, titleSize * 0.42, 0.5)
  y += Math.round(titleSize * 1.05)
  ctx.font = storyFont(small)
  ctx.fillStyle = INK_SOFT
  ctx.fillText(t.book.dedication, cx, y)
  if (o.childName) {
    y += Math.round(small * 1.95)
    ctx.font = storyFont(small * 0.94)
    ctx.fillStyle = MUTED
    // One run of text, so the name joins and orders itself the way the language wants.
    ctx.fillText(`${t.book.forChild} ${o.childName}`, cx, y)
  }
  if (t.book.draft) {
    ctx.font = uiFont(11.5, 500)
    ctx.fillStyle = MUTED
    ctx.fillText(t.book.draft, cx, g.folioY)
  }
}

/** Baseline of the end page's two lines, as fractions of the page height (the buttons sit below them). */
export const END_TEXT = { title: 0.33, sub: 0.415, buttons: 0.5 }

function paintEnd(ctx: CanvasRenderingContext2D, g: PageGeometry) {
  const { pageW: w, pageH: h } = g
  const cx = w / 2
  const size = Math.round(Math.min(64, Math.max(40, w * 0.12)))
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  leaf(ctx, cx - size * 0.5, h * END_TEXT.title - size * 1.5, size * 0.44, -0.6, 0.9)
  leaf(ctx, cx + size * 0.42, h * END_TEXT.title - size * 1.72, size * 0.3, 0.7, 0.6)
  ctx.font = uiFont(size, 800)
  ctx.fillStyle = INK
  ctx.fillText(t.book.end, cx, h * END_TEXT.title)
  ctx.font = storyFont(Math.max(19, size * 0.42))
  ctx.fillStyle = INK_SOFT
  ctx.fillText(t.book.endSub, cx, h * END_TEXT.sub)
}

function paintScene(ctx: CanvasRenderingContext2D, page: BookPage, g: PageGeometry, o: PaintOptions) {
  const { pageW: w } = g
  if (page.picture) {
    cover(ctx, picture(story.scenes[page.scene].img, o.onPicture), 0, 0, w, g.pictureH)
    // A hairline where the painting meets the paper, as a printed plate has.
    ctx.fillStyle = 'rgba(26, 18, 11, 0.10)'
    ctx.fillRect(0, g.pictureH, w, 1 / o.scale)
  }
  // Every page starts its text on the same grid of lines, so facing pages sit level.
  const top = page.picture ? g.textTop : g.plainTop
  ctx.font = storyFont(g.fontSize)
  ctx.fillStyle = INK
  ctx.textAlign = 'start'
  ctx.textBaseline = 'alphabetic'
  const x = rtl ? w - g.marginX : g.marginX
  // The baseline sits where a line box of this height would put it.
  const base = g.lineHeight / 2 + g.fontSize * (rtl ? 0.3 : 0.34)
  for (const line of page.lines) ctx.fillText(line.text, x, top + line.y + base)
  // Where a scene ends on a page of its own with paper to spare, a small leaf closes it, as a tailpiece does.
  const end = top + page.textHeight
  if (!page.picture && page.part === page.parts - 1 && g.textBottom - end > g.lineHeight * 2.6) leaf(ctx, w / 2, end + g.lineHeight * 1.25, Math.max(20, g.fontSize), 0.5, 0.75)
}

function folio(ctx: CanvasRenderingContext2D, page: BookPage, g: PageGeometry) {
  ctx.font = uiFont(g.folioSize, 500)
  ctx.fillStyle = MUTED
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(num(page.number), g.pageW / 2, g.folioY)
}

/** Frosts a printed page (the demo paywall): everything is still there, nothing can be read. */
function frost(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  const k = 22
  const small = document.createElement('canvas')
  small.width = Math.max(8, Math.round(canvas.width / k))
  small.height = Math.max(8, Math.round(canvas.height / k))
  const sctx = small.getContext('2d')!
  sctx.imageSmoothingQuality = 'high'
  sctx.drawImage(canvas, 0, 0, small.width, small.height)
  ctx.save()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(small, 0, 0, canvas.width, canvas.height)
  ctx.fillStyle = 'rgba(247, 241, 229, 0.34)'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.restore()
}

export interface GateLayout {
  x: number
  y: number
  w: number
  h: number
  title: string[]
  sub: string[]
  titleSize: number
  /** The button, in page px: the real (invisible) button lies exactly over the printed one. */
  btn: { x: number; y: number; w: number; h: number }
}
const GATE = { pad: 28, icon: 50, gap: 13, subSize: 15, subPitch: 25, btnH: 54 }

/** Where the paywall card and its button sit on the page. */
export function gateLayout(g: PageGeometry): GateLayout {
  const w = Math.round(Math.min(g.pageW * 0.86, 400))
  const inner = w - 2 * GATE.pad
  const titleSize = Math.min(24, Math.max(19.5, g.pageW * 0.052))
  const title = wrapBalanced(t.book.gateTitle, inner, measurer(uiFont(titleSize, 800)), 2)
  const sub = wrapBalanced(t.book.gateSub, Math.min(inner, 290), measurer(uiFont(GATE.subSize, 400)), 3)
  const titlePitch = Math.round(titleSize * 1.36)
  const btnW = Math.round(Math.min(inner, measurer(uiFont(16, 600))(t.book.gateBtn) + 68))
  const h = GATE.pad + GATE.icon + GATE.gap + title.length * titlePitch + 6 + sub.length * GATE.subPitch + GATE.gap + 8 + GATE.btnH + GATE.pad
  const x = Math.round((g.pageW - w) / 2)
  const y = Math.round((g.pageH - h) / 2)
  return { x, y, w, h, title, sub, titleSize, btn: { x: Math.round((g.pageW - btnW) / 2), y: y + h - GATE.pad - GATE.btnH, w: btnW, h: GATE.btnH } }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** The paywall card, printed on the frosted page: dark glass, a lock, two lines and the button. */
function paintGate(ctx: CanvasRenderingContext2D, g: PageGeometry) {
  const c = gateLayout(g)
  const cx = g.pageW / 2
  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
  ctx.shadowBlur = 34
  ctx.shadowOffsetY = 10
  const glass = ctx.createLinearGradient(0, c.y, 0, c.y + c.h)
  glass.addColorStop(0, 'rgba(26, 18, 11, 0.74)')
  glass.addColorStop(1, 'rgba(26, 18, 11, 0.62)')
  ctx.fillStyle = glass
  roundRect(ctx, c.x, c.y, c.w, c.h, 28)
  ctx.fill()
  ctx.restore()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
  ctx.lineWidth = 1
  roundRect(ctx, c.x + 0.5, c.y + 0.5, c.w - 1, c.h - 1, 27.5)
  ctx.stroke()

  // the lock
  let y = c.y + GATE.pad + GATE.icon / 2
  ctx.fillStyle = 'rgba(255, 255, 255, 0.14)'
  ctx.beginPath()
  ctx.arc(cx, y, GATE.icon / 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#f4a35e'
  ctx.lineWidth = 2
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  roundRect(ctx, cx - 8, y - 2, 16, 12, 3)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx - 4.5, y - 2)
  ctx.lineTo(cx - 4.5, y - 5.5)
  ctx.arc(cx, y - 5.5, 4.5, Math.PI, 0)
  ctx.lineTo(cx + 4.5, y - 2)
  ctx.stroke()
  ctx.fillStyle = '#f4a35e'
  ctx.beginPath()
  ctx.arc(cx, y + 4, 1.4, 0, Math.PI * 2)
  ctx.fill()

  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  y = c.y + GATE.pad + GATE.icon + GATE.gap
  const titlePitch = Math.round(c.titleSize * 1.36)
  ctx.font = uiFont(c.titleSize, 800)
  ctx.fillStyle = '#ffffff'
  for (const line of c.title) {
    y += titlePitch
    ctx.fillText(line, cx, y - titlePitch * 0.24)
  }
  y += 6
  ctx.font = uiFont(GATE.subSize, 400)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.82)'
  for (const line of c.sub) {
    y += GATE.subPitch
    ctx.fillText(line, cx, y - GATE.subPitch * 0.28)
  }
  // the button
  ctx.fillStyle = '#f6f0e4'
  roundRect(ctx, c.btn.x, c.btn.y, c.btn.w, c.btn.h, c.btn.h / 2)
  ctx.fill()
  ctx.font = uiFont(16, 600)
  ctx.fillStyle = '#1a120b'
  ctx.fillText(t.book.gateBtn, cx, c.btn.y + c.btn.h / 2 + 5.5)
}

/** One reusable sheet: the engine copies it to the GPU straight away, so a page never needs its own canvas. */
let sheet: HTMLCanvasElement | null = null

/** Prints `page` at `pxW × pxH` device px and returns the canvas (valid until the next call). */
export function paintPage(page: BookPage, g: PageGeometry, pxW: number, pxH: number, o: PaintOptions): HTMLCanvasElement {
  sheet ??= document.createElement('canvas')
  if (sheet.width !== pxW || sheet.height !== pxH) {
    sheet.width = pxW
    sheet.height = pxH
  }
  const ctx = sheet.getContext('2d', { alpha: false })!
  ctx.setTransform(pxW / g.pageW, 0, 0, pxH / g.pageH, 0, 0)
  ctx.direction = rtl ? 'rtl' : 'ltr'
  ctx.globalAlpha = 1
  paper(ctx, g.pageW, g.pageH)
  if (page.kind === 'title') paintTitle(ctx, g, o)
  else if (page.kind === 'end') paintEnd(ctx, g)
  else if (page.kind === 'scene') {
    paintScene(ctx, page, g, o)
    folio(ctx, page, g)
  } else leaf(ctx, g.pageW / 2, g.pageH / 2, 26, 0.5, 0.5)
  if (o.locked) frost(sheet, ctx)
  if (o.gate) paintGate(ctx, g)
  return sheet
}

/** The film's current frame, cut to the painting's box, ready to be patched into the page on the GPU. */
let still: HTMLCanvasElement | null = null
export function frameOf(video: HTMLVideoElement, pxW: number, pxH: number): HTMLCanvasElement | null {
  if (!video.videoWidth || video.readyState < 2) return null
  still ??= document.createElement('canvas')
  if (still.width !== pxW || still.height !== pxH) {
    still.width = pxW
    still.height = pxH
  }
  const ctx = still.getContext('2d', { alpha: false })!
  const s = Math.max(pxW / video.videoWidth, pxH / video.videoHeight)
  const sw = pxW / s
  const sh = pxH / s
  try {
    ctx.drawImage(video, (video.videoWidth - sw) / 2, (video.videoHeight - sh) / 2, sw, sh, 0, 0, pxW, pxH)
  } catch {
    return null
  }
  return still
}
