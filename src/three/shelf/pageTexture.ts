import * as THREE from 'three'
import type { Book } from '@/content/schema'

const ACCENT = '"Instrument Serif", Georgia, serif'
const SANS = '"Manrope Variable", system-ui, sans-serif'

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const out: string[] = []
  for (const para of text.split(/\n\n+/)) {
    let cur = ''
    for (const w of para.split(/\s+/)) {
      const t = cur ? `${cur} ${w}` : w
      if (ctx.measureText(t).width > maxW && cur) {
        out.push(cur)
        cur = w
      } else cur = t
    }
    if (cur) out.push(cur)
    out.push('')
  }
  return out
}

/** The first page, typeset onto warm paper (512×700) — shown on the page block when the cover opens. */
export async function createPageTexture(book: Book): Promise<THREE.CanvasTexture> {
  if ('fonts' in document) await Promise.all([document.fonts.load(`italic 400 30px ${ACCENT}`), document.fonts.load(`500 17px ${SANS}`)])
  const W = 512
  const H = Math.round(W * (0.95 / 0.7))
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')!
  const grd = ctx.createLinearGradient(0, 0, W, 0)
  grd.addColorStop(0, '#efe6d3')
  grd.addColorStop(0.08, '#f8f3e8')
  grd.addColorStop(1, '#f6f1e6')
  ctx.fillStyle = grd
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = '#2a2520'
  ctx.textAlign = 'center'
  ctx.font = `italic 400 30px ${ACCENT}`
  ctx.fillText(book.firstPage.heading, W / 2 + 10, 86)
  ctx.strokeStyle = book.cover.palette.accent
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(W / 2 - 30, 104)
  ctx.lineTo(W / 2 + 50, 104)
  ctx.stroke()
  ctx.textAlign = 'left'
  ctx.font = `500 17px ${SANS}`
  ctx.fillStyle = '#3a3530'
  const lines = wrap(ctx, book.firstPage.text, W - 112)
  let y = 150
  for (const l of lines) {
    if (y > H - 70) break
    if (l) ctx.fillText(l, 66, y)
    y += l ? 27 : 14
  }
  ctx.fillStyle = '#8a8378'
  ctx.font = `500 13px ${SANS}`
  ctx.textAlign = 'center'
  ctx.fillText('1', W / 2 + 10, H - 36)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}
