import type { CSSProperties } from 'react'
import type { ZoneLayout } from '@/reader/zone'

/**
 * The look of a book page, shared by the two ways it is shown: as real DOM text at rest (PageView) and painted into
 * the curl engine's texture while a page turns (paintPage). Both use the same layout (src/reader/zone.ts) and the
 * same lines, so the turning page matches the resting one.
 */
export const PAPER = '#fbf8f1'
export const PAPER_RGB: [number, number, number] = [0xfb / 255, 0xf8 / 255, 0xf1 / 255]
export const INK = '#26221d'
export const WASH_ALPHA = 0.9
export const TEXT_WEIGHT = 500

let fontFamily = 'system-ui, sans-serif'
/** The reader's font: the page's own font stack (no brand fonts yet). */
export function readerFont(): string {
  if (typeof document !== 'undefined') fontFamily = getComputedStyle(document.body).fontFamily || fontFamily
  return fontFamily
}

let ctx: CanvasRenderingContext2D | null = null
const widths = new Map<string, number>()
/** Width of a run of text at a size, in the reader's font (canvas measure, cached). */
export function measureAt(text: string, px: number): number {
  const key = `${px}|${text}`
  const hit = widths.get(key)
  if (hit !== undefined) return hit
  if (!ctx) ctx = document.createElement('canvas').getContext('2d')
  if (!ctx) return text.length * px * 0.55
  ctx.font = `${TEXT_WEIGHT} ${px}px ${readerFont()}`
  const w = ctx.measureText(text).width
  if (widths.size > 4000) widths.clear()
  widths.set(key, w)
  return w
}

/** CSS for the paper wash: paper colour, faded to nothing over `fade` px at every edge (bands reach past the page). */
export function washStyle(l: ZoneLayout): CSSProperties {
  const f = `${l.fade}px`
  const mask = `linear-gradient(to right, transparent, #000 ${f}, #000 calc(100% - ${f}), transparent), linear-gradient(to bottom, transparent, #000 ${f}, #000 calc(100% - ${f}), transparent)`
  return {
    left: l.wash.x,
    top: l.wash.y,
    width: l.wash.w,
    height: l.wash.h,
    background: `color-mix(in srgb, ${PAPER} ${WASH_ALPHA * 100}%, transparent)`,
    maskImage: mask,
    WebkitMaskImage: mask,
    maskComposite: 'intersect',
    WebkitMaskComposite: 'source-in',
  } as CSSProperties
}

/** Draws a picture so it covers the box, centred (object-fit: cover). */
export function drawCover(g: CanvasRenderingContext2D, img: CanvasImageSource & { width: number; height: number }, w: number, h: number) {
  const iw = (img as HTMLImageElement).naturalWidth || img.width
  const ih = (img as HTMLImageElement).naturalHeight || img.height
  if (!iw || !ih) return
  const s = Math.max(w / iw, h / ih)
  const dw = iw * s
  const dh = ih * s
  g.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh)
}

function drawWash(g: CanvasRenderingContext2D, l: ZoneLayout) {
  const { x, y, w, h } = l.wash
  if (w <= 0 || h <= 0) return
  const off = document.createElement('canvas')
  off.width = Math.max(1, Math.round(w))
  off.height = Math.max(1, Math.round(h))
  const o = off.getContext('2d')!
  o.fillStyle = PAPER
  o.globalAlpha = WASH_ALPHA
  o.fillRect(0, 0, off.width, off.height)
  o.globalAlpha = 1
  o.globalCompositeOperation = 'destination-in'
  const fx = Math.min(0.5, l.fade / off.width)
  const fy = Math.min(0.5, l.fade / off.height)
  const gx = o.createLinearGradient(0, 0, off.width, 0)
  gx.addColorStop(0, 'rgba(0,0,0,0)')
  gx.addColorStop(fx, 'rgba(0,0,0,1)')
  gx.addColorStop(1 - fx, 'rgba(0,0,0,1)')
  gx.addColorStop(1, 'rgba(0,0,0,0)')
  o.fillStyle = gx
  o.fillRect(0, 0, off.width, off.height)
  const gy = o.createLinearGradient(0, 0, 0, off.height)
  gy.addColorStop(0, 'rgba(0,0,0,0)')
  gy.addColorStop(fy, 'rgba(0,0,0,1)')
  gy.addColorStop(1 - fy, 'rgba(0,0,0,1)')
  gy.addColorStop(1, 'rgba(0,0,0,0)')
  o.fillStyle = gy
  o.fillRect(0, 0, off.width, off.height)
  g.drawImage(off, x, y)
}

export type PaintSpec =
  | { kind: 'story'; img: HTMLImageElement | null; layout: ZoneLayout; rtl: boolean }
  | { kind: 'title'; img: HTMLImageElement | null; title: string; credit: string; rtl: boolean }
  | { kind: 'end'; text: string; rtl: boolean }
  | { kind: 'blank' }

/** Paints one page at `w × h` device px; `scale` is device px per CSS px. */
export function paintPage(spec: PaintSpec, w: number, h: number, scale: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')!
  g.fillStyle = PAPER
  g.fillRect(0, 0, w, h)
  g.scale(scale, scale)
  const cw = w / scale
  const ch = h / scale
  const family = readerFont()
  if (spec.kind === 'story') {
    if (spec.img?.complete && spec.img.naturalWidth) drawCover(g, spec.img, cw, ch)
    const l = spec.layout
    drawWash(g, l)
    g.fillStyle = INK
    g.font = `${TEXT_WEIGHT} ${l.fontSize}px ${family}`
    g.textBaseline = 'middle'
    g.direction = spec.rtl ? 'rtl' : 'ltr'
    g.textAlign = spec.rtl ? 'right' : 'left'
    const x = spec.rtl ? l.box.x + l.box.w - l.padX : l.box.x + l.padX
    l.lines.forEach((line, i) => g.fillText(line, x, l.box.y + l.padY + i * l.lineHeight + l.lineHeight / 2))
  } else if (spec.kind === 'title') {
    if (spec.img?.complete && spec.img.naturalWidth) {
      g.globalAlpha = 0.22
      drawCover(g, spec.img, cw, ch)
      g.globalAlpha = 1
    }
    g.fillStyle = INK
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.direction = spec.rtl ? 'rtl' : 'ltr'
    const size = Math.round(Math.min(44, Math.max(26, cw * 0.075)))
    g.font = `600 ${size}px ${family}`
    const lines = wrapTitle(g, spec.title, cw * 0.8)
    const top = ch * 0.42 - ((lines.length - 1) * size * 1.25) / 2
    lines.forEach((line, i) => g.fillText(line, cw / 2, top + i * size * 1.25))
    g.font = `400 ${Math.round(size * 0.45)}px ${family}`
    g.fillStyle = 'rgba(38,34,29,0.7)'
    g.fillText(spec.credit, cw / 2, top + lines.length * size * 1.25 + size * 0.4)
  } else if (spec.kind === 'end') {
    g.fillStyle = INK
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.direction = spec.rtl ? 'rtl' : 'ltr'
    g.font = `600 ${Math.round(Math.min(40, Math.max(26, cw * 0.07)))}px ${family}`
    g.fillText(spec.text, cw / 2, ch * 0.3)
  }
  return c
}

function wrapTitle(g: CanvasRenderingContext2D, text: string, max: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const t = line ? `${line} ${w}` : w
    if (line && g.measureText(t).width > max) {
      lines.push(line)
      line = w
    } else line = t
  }
  if (line) lines.push(line)
  return lines
}
