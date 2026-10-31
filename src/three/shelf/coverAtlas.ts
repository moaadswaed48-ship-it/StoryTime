import * as THREE from 'three'
import type { Book } from '@/content/schema'
import { mulberry32, hashString } from '@/lib/seeded'
import { ATLAS } from './bookGeometry'

const ACCENT = '"Instrument Serif", Georgia, serif'
const SANS = '"Manrope Variable", system-ui, sans-serif'

let grainTile: HTMLCanvasElement | null = null
function grain(): HTMLCanvasElement {
  if (grainTile) return grainTile
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const ctx = c.getContext('2d')!
  const img = ctx.createImageData(128, 128)
  const r = mulberry32(99)
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 128 + (r() - 0.5) * 70
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v
    img.data[i + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
  grainTile = c
  return c
}

function fontsReady(): Promise<unknown> {
  if (!('fonts' in document)) return Promise.resolve()
  return Promise.all([document.fonts.load(`italic 400 64px ${ACCENT}`), document.fonts.load(`700 40px ${SANS}`), document.fonts.load(`500 24px ${SANS}`)])
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w
    if (ctx.measureText(t).width > maxW && cur) {
      lines.push(cur)
      cur = w
    } else cur = t
  }
  if (cur) lines.push(cur)
  return lines
}

function drawPattern(ctx: CanvasRenderingContext2D, kind: Book['cover']['pattern'], x: number, y: number, w: number, h: number, color: string, seed: number) {
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()
  ctx.fillStyle = color
  ctx.strokeStyle = color
  ctx.globalAlpha = 0.22
  const r = mulberry32(seed)
  if (kind === 'dots') {
    for (let yy = y + 20; yy < y + h; yy += 44) for (let xx = x + 20 + ((yy / 44) % 2) * 22; xx < x + w; xx += 44) {
      ctx.beginPath()
      ctx.arc(xx, yy, 4, 0, Math.PI * 2)
      ctx.fill()
    }
  } else if (kind === 'stripes') {
    ctx.lineWidth = 10
    for (let d = -h; d < w + h; d += 46) {
      ctx.beginPath()
      ctx.moveTo(x + d, y)
      ctx.lineTo(x + d + h, y + h)
      ctx.stroke()
    }
  } else if (kind === 'stars') {
    for (let i = 0; i < 70; i++) {
      const sx = x + r() * w
      const sy = y + r() * h
      const s = 3 + r() * 6
      ctx.beginPath()
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * Math.PI * 2 - Math.PI / 2
        const rad = k % 2 === 0 ? s : s * 0.45
        ctx.lineTo(sx + Math.cos(a) * rad, sy + Math.sin(a) * rad)
      }
      ctx.closePath()
      ctx.fill()
    }
  } else if (kind === 'waves') {
    ctx.lineWidth = 6
    for (let yy = y + 30; yy < y + h; yy += 40) {
      ctx.beginPath()
      for (let xx = x; xx <= x + w; xx += 8) ctx.lineTo(xx, yy + Math.sin((xx - x) / 28) * 8)
      ctx.stroke()
    }
  }
  ctx.restore()
}

function drawMotif(ctx: CanvasRenderingContext2D, motif: Book['cover']['motif'], cx: number, cy: number, s: number, accent: string, ink: string) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.fillStyle = accent
  ctx.strokeStyle = ink
  ctx.lineWidth = s * 0.05
  ctx.lineJoin = 'round'
  const P = () => ctx.beginPath()
  switch (motif) {
    case 'moon':
      P(); ctx.arc(0, 0, s * 0.5, 0, Math.PI * 2); ctx.fill()
      ctx.globalCompositeOperation = 'destination-out'
      P(); ctx.arc(s * 0.22, -s * 0.12, s * 0.42, 0, Math.PI * 2); ctx.fill()
      ctx.globalCompositeOperation = 'source-over'
      break
    case 'star':
      P()
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * Math.PI * 2 - Math.PI / 2
        const rad = k % 2 === 0 ? s * 0.5 : s * 0.22
        ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad)
      }
      ctx.closePath(); ctx.fill()
      break
    case 'boat':
      P(); ctx.moveTo(-s * 0.5, s * 0.1); ctx.lineTo(s * 0.5, s * 0.1); ctx.lineTo(s * 0.32, s * 0.38); ctx.lineTo(-s * 0.32, s * 0.38); ctx.closePath(); ctx.fill()
      P(); ctx.moveTo(0, -s * 0.5); ctx.lineTo(0, s * 0.05); ctx.lineTo(s * 0.38, s * 0.05); ctx.closePath(); ctx.fill()
      P(); ctx.moveTo(-s * 0.04, -s * 0.4); ctx.lineTo(-s * 0.04, s * 0.05); ctx.lineTo(-s * 0.34, s * 0.05); ctx.closePath(); ctx.fill()
      break
    case 'tree':
      P(); ctx.moveTo(0, -s * 0.52); ctx.lineTo(s * 0.42, s * 0.18); ctx.lineTo(-s * 0.42, s * 0.18); ctx.closePath(); ctx.fill()
      ctx.fillRect(-s * 0.06, s * 0.18, s * 0.12, s * 0.28)
      break
    case 'kite':
      P(); ctx.moveTo(0, -s * 0.5); ctx.lineTo(s * 0.34, 0); ctx.lineTo(0, s * 0.5); ctx.lineTo(-s * 0.34, 0); ctx.closePath(); ctx.fill()
      P(); ctx.moveTo(0, s * 0.5); ctx.quadraticCurveTo(s * 0.3, s * 0.75, s * 0.1, s * 0.95); ctx.stroke()
      break
    case 'lighthouse':
      P(); ctx.moveTo(-s * 0.18, s * 0.5); ctx.lineTo(-s * 0.1, -s * 0.3); ctx.lineTo(s * 0.1, -s * 0.3); ctx.lineTo(s * 0.18, s * 0.5); ctx.closePath(); ctx.fill()
      ctx.fillRect(-s * 0.16, -s * 0.48, s * 0.32, s * 0.16)
      P(); ctx.moveTo(-s * 0.16, -s * 0.4); ctx.lineTo(-s * 0.6, -s * 0.6); ctx.lineTo(-s * 0.6, -s * 0.2); ctx.closePath(); ctx.globalAlpha = 0.5; ctx.fill(); ctx.globalAlpha = 1
      break
    case 'umbrella':
      P(); ctx.arc(0, 0, s * 0.5, Math.PI, 0); ctx.closePath(); ctx.fill()
      P(); ctx.moveTo(0, 0); ctx.lineTo(0, s * 0.45); ctx.quadraticCurveTo(0, s * 0.62, -s * 0.14, s * 0.58); ctx.stroke()
      break
    case 'cloud':
      P(); ctx.arc(-s * 0.22, s * 0.05, s * 0.22, 0, Math.PI * 2); ctx.arc(s * 0.05, -s * 0.1, s * 0.28, 0, Math.PI * 2); ctx.arc(s * 0.3, s * 0.08, s * 0.2, 0, Math.PI * 2); ctx.fill()
      ctx.fillRect(-s * 0.22, s * 0.05, s * 0.52, s * 0.22)
      break
    case 'thunder':
      P(); ctx.moveTo(s * 0.1, -s * 0.5); ctx.lineTo(-s * 0.25, s * 0.05); ctx.lineTo(0, s * 0.05); ctx.lineTo(-s * 0.1, s * 0.5); ctx.lineTo(s * 0.25, -s * 0.1); ctx.lineTo(0, -s * 0.1); ctx.closePath(); ctx.fill()
      break
    case 'fox':
      P(); ctx.moveTo(-s * 0.45, -s * 0.35); ctx.lineTo(-s * 0.15, -s * 0.1); ctx.lineTo(s * 0.15, -s * 0.1); ctx.lineTo(s * 0.45, -s * 0.35); ctx.lineTo(s * 0.3, s * 0.15); ctx.lineTo(0, s * 0.45); ctx.lineTo(-s * 0.3, s * 0.15); ctx.closePath(); ctx.fill()
      ctx.fillStyle = ink
      P(); ctx.arc(-s * 0.12, s * 0.02, s * 0.04, 0, Math.PI * 2); ctx.arc(s * 0.12, s * 0.02, s * 0.04, 0, Math.PI * 2); ctx.fill()
      break
    case 'garden':
      for (const [dx, h] of [[-0.3, 0.3], [0, 0.45], [0.3, 0.35]] as const) {
        P(); ctx.moveTo(dx * s, s * 0.5); ctx.lineTo(dx * s, s * (0.5 - h)); ctx.stroke()
        P(); ctx.arc(dx * s, s * (0.5 - h) - s * 0.08, s * 0.1, 0, Math.PI * 2); ctx.fill()
      }
      break
    case 'yawn':
      P(); ctx.arc(0, 0, s * 0.45, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = ink
      P(); ctx.ellipse(0, s * 0.12, s * 0.16, s * 0.2, 0, 0, Math.PI * 2); ctx.fill()
      P(); ctx.moveTo(-s * 0.2, -s * 0.12); ctx.lineTo(-s * 0.08, -s * 0.08); ctx.moveTo(s * 0.2, -s * 0.12); ctx.lineTo(s * 0.08, -s * 0.08); ctx.stroke()
      break
  }
  ctx.restore()
}

/**
 * Renders a book's cover atlas (front / back / spine) to a canvas and returns it as a texture.
 * Regions follow ATLAS; the paper-grain and vignette give the cloth a printed, not flat, feel.
 */
export async function createCoverAtlas(book: Book, size = 1024): Promise<THREE.CanvasTexture> {
  await fontsReady()
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')!
  const { bg, ink, accent } = book.cover.palette
  const seed = hashString(book.id)
  const rp = (r: { x: number; y: number; w: number; h: number }) => ({ x: r.x * size, y: r.y * size, w: r.w * size, h: r.h * size })
  const F = rp(ATLAS.front)
  const B = rp(ATLAS.back)
  const S = rp(ATLAS.spine)
  const CL = rp(ATLAS.cloth)
  const PA = rp(ATLAS.paper)
  const PG = rp(ATLAS.page)

  ctx.fillStyle = '#efe7d8'
  ctx.fillRect(0, 0, size, size)
  // page edges: paper with faint leaf lines
  ctx.fillStyle = '#f1ebdd'
  ctx.fillRect(PA.x, PA.y, PA.w, PA.h)
  ctx.strokeStyle = 'rgba(120,100,70,0.18)'
  ctx.lineWidth = 1
  for (let yy = PA.y + 2; yy < PA.y + PA.h; yy += 3) {
    ctx.beginPath()
    ctx.moveTo(PA.x, yy)
    ctx.lineTo(PA.x + PA.w, yy)
    ctx.stroke()
  }
  // first page placeholder (plain paper until the cover opens)
  ctx.fillStyle = '#f6f1e6'
  ctx.fillRect(PG.x, PG.y, PG.w, PG.h)
  for (const r of [F, B, S, CL]) {
    ctx.fillStyle = bg
    ctx.fillRect(r.x, r.y, r.w, r.h)
    // cloth grain
    ctx.save()
    ctx.globalAlpha = 0.16
    ctx.globalCompositeOperation = 'overlay'
    ctx.fillStyle = ctx.createPattern(grain(), 'repeat')!
    ctx.fillRect(r.x, r.y, r.w, r.h)
    ctx.restore()
  }
  // spine shading: slightly darker
  ctx.fillStyle = 'rgba(0,0,0,0.18)'
  ctx.fillRect(S.x, S.y, S.w, S.h)

  // front: pattern, frame, motif, title, author
  drawPattern(ctx, book.cover.pattern, F.x, F.y, F.w, F.h, accent, seed)
  ctx.strokeStyle = ink
  ctx.globalAlpha = 0.55
  ctx.lineWidth = 3
  ctx.strokeRect(F.x + 26, F.y + 26, F.w - 52, F.h - 52)
  ctx.globalAlpha = 1

  ctx.fillStyle = ink
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  const titleFace = book.cover.titleFace === 'accent' ? `italic 400 {px}px ${ACCENT}` : `700 {px}px ${SANS}`
  let px = book.cover.titleFace === 'accent' ? 74 : 60
  let lines: string[] = []
  for (; px >= 34; px -= 4) {
    ctx.font = titleFace.replace('{px}', String(px))
    lines = wrap(ctx, book.title, F.w - 90)
    if (lines.length <= 3) break
  }
  const lh = px * 1.08
  const top = F.y + 92
  lines.forEach((l, i) => ctx.fillText(l, F.x + F.w / 2, top + i * lh + px))
  // motif sits in the space left between the title block and the author line
  const titleBottom = top + lines.length * lh + 8
  const authorTop = F.y + F.h - 80
  const room = authorTop - titleBottom
  const ms = Math.min(F.w * 0.42, room * 0.82)
  drawMotif(ctx, book.cover.motif, F.x + F.w / 2, titleBottom + room / 2 + 4, ms, accent, ink)
  ctx.font = `500 22px ${SANS}`
  ctx.globalAlpha = 0.85
  ctx.fillText(book.author.toUpperCase(), F.x + F.w / 2, F.y + F.h - 46)
  ctx.globalAlpha = 1

  // back: blurb + small motif
  ctx.font = `500 21px ${SANS}`
  ctx.textAlign = 'left'
  ctx.fillStyle = ink
  const blurbLines = wrap(ctx, book.blurb, B.w - 90)
  blurbLines.slice(0, 9).forEach((l, i) => ctx.fillText(l, B.x + 45, B.y + 90 + i * 30))
  drawMotif(ctx, book.cover.motif, B.x + B.w / 2, B.y + B.h * 0.72, B.w * 0.22, accent, ink)
  ctx.font = `600 18px ${SANS}`
  ctx.textAlign = 'center'
  ctx.globalAlpha = 0.7
  ctx.fillText('STORYTIME', B.x + B.w / 2, B.y + B.h - 40)
  ctx.globalAlpha = 1

  // spine: rotated title (reads top → bottom)
  ctx.save()
  ctx.translate(S.x + S.w / 2, S.y + S.h / 2)
  ctx.rotate(Math.PI / 2)
  ctx.fillStyle = ink
  ctx.textAlign = 'center'
  let spx = 40
  ctx.font = `600 ${spx}px ${SANS}`
  while (ctx.measureText(book.title).width > S.h - 80 && spx > 18) {
    spx -= 2
    ctx.font = `600 ${spx}px ${SANS}`
  }
  ctx.fillText(book.title, 0, spx * 0.36)
  ctx.restore()

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  tex.generateMipmaps = true
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.needsUpdate = true
  return tex
}

function wrapParas(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const out: string[] = []
  for (const para of text.split(/\n\n+/)) {
    out.push(...wrap(ctx, para, maxW), '')
  }
  return out
}

/** Typesets the first page into the atlas's page region (called lazily when a cover opens) and flags the texture. */
export async function drawPageInto(tex: THREE.CanvasTexture, book: Book): Promise<void> {
  if ('fonts' in document) await Promise.all([document.fonts.load(`italic 400 30px ${ACCENT}`), document.fonts.load(`500 17px ${SANS}`)])
  const c = tex.image as HTMLCanvasElement
  const size = c.width
  const ctx = c.getContext('2d')!
  const PG = { x: ATLAS.page.x * size, y: ATLAS.page.y * size, w: ATLAS.page.w * size, h: ATLAS.page.h * size }
  const k = size / 1024
  const grd = ctx.createLinearGradient(PG.x, 0, PG.x + PG.w, 0)
  grd.addColorStop(0, '#ebe2cf')
  grd.addColorStop(0.1, '#f8f3e8')
  grd.addColorStop(1, '#f6f1e6')
  ctx.fillStyle = grd
  ctx.fillRect(PG.x, PG.y, PG.w, PG.h)
  ctx.fillStyle = '#2a2520'
  ctx.textAlign = 'center'
  ctx.font = `italic 400 ${Math.round(17 * k)}px ${ACCENT}`
  ctx.fillText(book.firstPage.heading, PG.x + PG.w / 2 + 6 * k, PG.y + 40 * k)
  ctx.strokeStyle = book.cover.palette.accent
  ctx.lineWidth = 1.5 * k
  ctx.beginPath()
  ctx.moveTo(PG.x + PG.w / 2 - 20 * k, PG.y + 50 * k)
  ctx.lineTo(PG.x + PG.w / 2 + 32 * k, PG.y + 50 * k)
  ctx.stroke()
  ctx.textAlign = 'left'
  ctx.font = `500 ${Math.round(9.5 * k)}px ${SANS}`
  ctx.fillStyle = '#3a3530'
  const lines = wrapParas(ctx, book.firstPage.text, PG.w - 56 * k)
  let y = PG.y + 74 * k
  for (const l of lines) {
    if (y > PG.y + PG.h - 24 * k) break
    if (l) ctx.fillText(l, PG.x + 30 * k, y)
    y += l ? 14.5 * k : 7 * k
  }
  ctx.fillStyle = '#8a8378'
  ctx.font = `500 ${Math.round(8 * k)}px ${SANS}`
  ctx.textAlign = 'center'
  ctx.fillText('1', PG.x + PG.w / 2 + 6 * k, PG.y + PG.h - 10 * k)
  tex.needsUpdate = true
}

/** Same renderer as the 3D cover, but for DOM cards (front region only) → data URL. */
const dataUrlCache = new Map<string, string>()
export async function coverDataUrl(book: Book): Promise<string> {
  const cached = dataUrlCache.get(book.id)
  if (cached) return cached
  const tex = await createCoverAtlas(book, 512)
  const src = tex.image as HTMLCanvasElement
  const c = document.createElement('canvas')
  c.width = ATLAS.front.w * 512
  c.height = ATLAS.front.h * 512
  c.getContext('2d')!.drawImage(src, 0, 0, c.width, c.height, 0, 0, c.width, c.height)
  tex.dispose()
  const url = c.toDataURL('image/webp', 0.85)
  dataUrlCache.set(book.id, url)
  return url
}
