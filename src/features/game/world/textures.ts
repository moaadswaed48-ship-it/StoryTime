import * as THREE from 'three'
import { mulberry32 } from '@/lib/seeded'
import { asset } from '@/lib/asset'
import { rtl } from '@/i18n/locale'

/**
 * Every surface of the yard is painted here on small 2D canvases (no image files except the film still
 * for the backdrop). Textures are cached per page: three.js re-uploads them if the canvas is re-created.
 */

/** Golden mist: the colour the ground dissolves into and the base of the painted backdrop. */
export const HAZE = '#ecab76'
/** The same leaf colours as the 2D <Leaves>. */
export const LEAF_COLORS = ['#e2711d', '#f4a72c', '#c8421f', '#f2c14e', '#a44a1b', '#d9902f']

const cache = new Map<string, THREE.Texture>()
function once<T extends THREE.Texture>(key: string, make: () => T): T {
  let tex = cache.get(key) as T | undefined
  if (!tex) cache.set(key, (tex = make()))
  return tex
}
function board(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!] as const
}
function srgb(c: HTMLCanvasElement, repeat = false) {
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  if (repeat) tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}
function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath()
  g.moveTo(x + r, y)
  g.arcTo(x + w, y, x + w, y + h, r)
  g.arcTo(x + w, y + h, x, y + h, r)
  g.arcTo(x, y + h, x, y, r)
  g.arcTo(x, y, x + w, y, r)
  g.closePath()
}

/** Warm paving stones in running bond, tileable. */
export const pavingTexture = () =>
  once('paving', () => {
    const S = 1024
    const [c, g] = board(S, S)
    const rnd = mulberry32(21)
    g.fillStyle = '#93694a'
    g.fillRect(0, 0, S, S)
    const tones = ['#dab78e', '#cfa77d', '#c69b71', '#e0c29c', '#bf9168', '#d5ae84', '#caa179']
    const rows = 8
    const rh = S / rows
    const gap = 5
    for (let r = 0; r < rows; r++) {
      const n = 4 + Math.floor(rnd() * 3)
      const ws = Array.from({ length: n }, () => 0.7 + rnd() * 0.9)
      const sum = ws.reduce((a, b) => a + b, 0)
      let x = rnd() * S
      for (const w0 of ws) {
        const w = (w0 / sum) * S
        const tone = tones[Math.floor(rnd() * tones.length)]
        const rad = 14 + rnd() * 10
        const tilt = rnd()
        x %= S
        for (const ox of [0, -S]) {
          const px = x + ox + gap
          const py = r * rh + gap
          const pw = w - gap * 2
          const ph = rh - gap * 2
          // soft drop into the grout
          g.fillStyle = 'rgba(58,30,12,.4)'
          roundRect(g, px + 2, py + 4, pw, ph, rad)
          g.fill()
          const grad = g.createLinearGradient(px, py, px + pw * (0.4 + tilt * 0.6), py + ph)
          grad.addColorStop(0, tone)
          grad.addColorStop(1, shade(tone, -0.1))
          g.fillStyle = grad
          roundRect(g, px, py, pw, ph, rad)
          g.fill()
          g.strokeStyle = 'rgba(255,238,210,.22)'
          g.lineWidth = 2.5
          roundRect(g, px + 2.5, py + 2.5, pw - 5, ph - 5, Math.max(4, rad - 2))
          g.stroke()
        }
        x += w
      }
    }
    // grain: sand and tiny shadows
    for (let i = 0; i < 5200; i++) {
      const dark = rnd() < 0.55
      g.fillStyle = dark ? `rgba(84,48,22,${0.05 + rnd() * 0.1})` : `rgba(255,240,214,${0.05 + rnd() * 0.1})`
      const s = 1.5 + rnd() * 3.5
      g.fillRect(rnd() * S, rnd() * S, s, s)
    }
    return srgb(c, true)
  })

function shade(hex: string, amount: number) {
  const c = new THREE.Color(hex)
  c.offsetHSL(0, 0, amount)
  return '#' + c.getHexString()
}

/** Pools of late sun on the ground (drawn additively over the paving). */
export const dappleTexture = () =>
  once('dapple', () => {
    const S = 512
    const [c, g] = board(S, S)
    const rnd = mulberry32(5)
    for (let i = 0; i < 54; i++) {
      const x = rnd() * S
      const y = rnd() * S
      const r = 26 + rnd() * 86
      const a = 0.1 + rnd() * 0.2
      const grad = g.createRadialGradient(x, y, 0, x, y, r)
      grad.addColorStop(0, `rgba(255,214,150,${a})`)
      grad.addColorStop(0.6, `rgba(255,196,120,${a * 0.5})`)
      grad.addColorStop(1, 'rgba(255,190,110,0)')
      g.fillStyle = grad
      g.fillRect(x - r, y - r, r * 2, r * 2)
    }
    // no visible rectangle: fade to nothing at the edges
    g.globalCompositeOperation = 'destination-in'
    const mask = g.createRadialGradient(S / 2, S / 2, S * 0.18, S / 2, S / 2, S * 0.5)
    mask.addColorStop(0, 'rgba(0,0,0,1)')
    mask.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = mask
    g.fillRect(0, 0, S, S)
    return srgb(c)
  })

const LEAF_HALF: [number, number][] = [
  [0, 0.98],
  [0.1, 0.7],
  [0.27, 0.78],
  [0.25, 0.5],
  [0.58, 0.6],
  [0.5, 0.33],
  [0.92, 0.28],
  [0.68, 0.06],
  [0.76, -0.16],
  [0.42, -0.14],
  [0.44, -0.4],
  [0.08, -0.3],
  [0.05, -0.6],
]
/** A white maple leaf with soft veins; instances tint it. */
export const leafTexture = () =>
  once('leaf', () => {
    const S = 128
    const [c, g] = board(S, S)
    const R = S * 0.47
    const px = (x: number) => S / 2 + x * R
    const py = (y: number) => S / 2 - (y - 0.16) * R
    g.beginPath()
    LEAF_HALF.forEach(([x, y], i) => (i ? g.lineTo(px(x), py(y)) : g.moveTo(px(x), py(y))))
    for (let i = LEAF_HALF.length - 1; i >= 0; i--) g.lineTo(px(-LEAF_HALF[i][0]), py(LEAF_HALF[i][1]))
    g.closePath()
    g.fillStyle = '#fff'
    g.lineJoin = 'round'
    g.lineWidth = 5
    g.strokeStyle = '#fff'
    g.stroke()
    g.fill()
    // stem and veins, a little darker
    g.strokeStyle = 'rgba(70,28,0,.3)'
    g.lineWidth = 3
    g.lineCap = 'round'
    g.beginPath()
    g.moveTo(px(0), py(0.8))
    g.lineTo(px(0), py(-0.78))
    for (const [x, y] of [
      [0.7, 0.26],
      [0.46, 0.52],
      [0.56, -0.12],
    ]) {
      g.moveTo(px(0), py(-0.12))
      g.lineTo(px(x), py(y))
      g.moveTo(px(0), py(-0.12))
      g.lineTo(px(-x), py(y))
    }
    g.stroke()
    const tex = srgb(c)
    tex.anisotropy = 2
    return tex
  })

/** Soft round shadow (white alpha blob; the material gives it its warm dark colour). */
export const blobTexture = () =>
  once('blob', () => {
    const S = 128
    const [c, g] = board(S, S)
    const grad = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2)
    grad.addColorStop(0, 'rgba(255,255,255,1)')
    grad.addColorStop(0.45, 'rgba(255,255,255,.62)')
    grad.addColorStop(0.8, 'rgba(255,255,255,.14)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, S, S)
    return srgb(c)
  })

/** The soft ring that marks a paper on the ground. */
export const ringTexture = () =>
  once('ring', () => {
    const S = 256
    const [c, g] = board(S, S)
    const grad = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2)
    grad.addColorStop(0, 'rgba(255,255,255,.42)')
    grad.addColorStop(0.45, 'rgba(255,255,255,.2)')
    grad.addColorStop(0.66, 'rgba(255,255,255,.3)')
    grad.addColorStop(0.74, 'rgba(255,255,255,1)')
    grad.addColorStop(0.84, 'rgba(255,255,255,1)')
    grad.addColorStop(0.9, 'rgba(255,255,255,.3)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, S, S)
    return srgb(c)
  })

/** The little arrow that floats above a paper. */
export const markerTexture = () =>
  once('marker', () => {
    const S = 128
    const [c, g] = board(S, S)
    g.shadowColor = 'rgba(70,30,6,.45)'
    g.shadowBlur = 10
    g.shadowOffsetY = 4
    g.lineJoin = 'round'
    g.lineWidth = 16
    g.strokeStyle = '#fff'
    g.fillStyle = '#fff'
    g.beginPath()
    g.moveTo(34, 40)
    g.lineTo(94, 40)
    g.lineTo(64, 88)
    g.closePath()
    g.stroke()
    g.fill()
    g.shadowColor = 'transparent'
    g.fillStyle = '#d9541e'
    g.beginPath()
    g.arc(64, 54, 9, 0, Math.PI * 2)
    g.fill()
    return srgb(c)
  })

/** Rough bark: vertical streaks, tileable sideways. */
export const barkTexture = () =>
  once('bark', () => {
    const W = 256
    const H = 512
    const [c, g] = board(W, H)
    const rnd = mulberry32(3)
    g.fillStyle = '#b08a68'
    g.fillRect(0, 0, W, H)
    for (let i = 0; i < 150; i++) {
      const x = rnd() * W
      const w = 2 + rnd() * 9
      const dark = rnd() < 0.6
      g.strokeStyle = dark ? `rgba(40,18,6,${0.12 + rnd() * 0.22})` : `rgba(255,226,180,${0.08 + rnd() * 0.14})`
      g.lineWidth = w
      g.lineCap = 'round'
      const y0 = rnd() * H
      const len = 60 + rnd() * 260
      for (const ox of [0, -W, W]) {
        g.beginPath()
        g.moveTo(x + ox, y0)
        g.bezierCurveTo(x + ox + (rnd() - 0.5) * 22, y0 + len * 0.33, x + ox + (rnd() - 0.5) * 22, y0 + len * 0.66, x + ox + (rnd() - 0.5) * 14, y0 + len)
        g.stroke()
      }
    }
    return srgb(c, true)
  })

/** A name paper: off-white sheet, the name written large on a ruled line. */
export function paperTexture(name: string): THREE.CanvasTexture {
  const W = 256
  const H = 336
  const [c, g] = board(W, H)
  const tex = srgb(c)
  const draw = () => {
    const grad = g.createLinearGradient(0, 0, W * 0.4, H)
    grad.addColorStop(0, '#ffffff')
    grad.addColorStop(1, '#f4ead8')
    g.fillStyle = grad
    g.fillRect(0, 0, W, H)
    g.strokeStyle = 'rgba(26,18,11,.12)'
    g.lineWidth = 3
    g.strokeRect(1.5, 1.5, W - 3, H - 3)
    // ruled lines, like a kindergarten name sheet
    g.strokeStyle = 'rgba(217,84,30,.4)'
    g.lineWidth = 3
    for (const y of [204, 252, 292]) {
      g.beginPath()
      g.moveTo(34, y)
      g.lineTo(W - 34, y)
      g.stroke()
      g.strokeStyle = 'rgba(26,18,11,.14)'
    }
    g.fillStyle = '#1a120b'
    g.textAlign = 'center'
    g.textBaseline = 'alphabetic'
    g.direction = rtl ? 'rtl' : 'ltr'
    let size = 96
    do {
      g.font = `800 ${size}px "Rubik Variable", "Rubik", system-ui, sans-serif`
      size -= 4
    } while (g.measureText(name).width > W - 56 && size > 28)
    g.fillText(name, W / 2, 180)
    tex.needsUpdate = true
  }
  draw()
  // the web font may arrive after the first paint of the texture
  document.fonts?.load('800 96px "Rubik Variable"', name).then(draw, () => undefined)
  return tex
}

/**
 * The painted backdrop: the wide shot of the same yard from the film (school, playground, autumn trees, evening sky),
 * softened, mirrored into a seamless panorama and dissolved into the mist at its base.
 * Canvas = [mirror | picture]; with RepeatWrapping the panorama tiles without a seam.
 */
export const backdropTexture = () =>
  once('backdrop', () => {
    const TW = 1024
    const TH = 1024
    const [c, g] = board(TW * 2, TH)
    const sky = g.createLinearGradient(0, 0, 0, TH)
    sky.addColorStop(0, '#f3cdb6')
    sky.addColorStop(0.6, '#f6c99a')
    sky.addColorStop(1, HAZE)
    g.fillStyle = sky
    g.fillRect(0, 0, TW * 2, TH)
    const tex = srgb(c)
    tex.wrapS = THREE.RepeatWrapping
    tex.anisotropy = 4
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      // the part of scene 8 without the boys: x 0…565, y 0…620 of 1344×752
      const k = img.naturalWidth / 1344
      const [soft, sg] = board(452, 496)
      sg.imageSmoothingQuality = 'high'
      sg.drawImage(img, 0, 0, 565 * k, 620 * k, 0, 0, soft.width, soft.height)
      g.imageSmoothingQuality = 'high'
      g.save()
      g.translate(TW, 0)
      g.scale(-1, 1)
      g.drawImage(soft, 0, 0, TW, TH)
      g.restore()
      g.drawImage(soft, TW, 0, TW, TH)
      // a breath of mist over everything, thick at the base where the 3D ground arrives
      g.fillStyle = 'rgba(236,171,118,.1)'
      g.fillRect(0, 0, TW * 2, TH)
      const mist = g.createLinearGradient(0, TH, 0, TH - 150)
      mist.addColorStop(0, HAZE)
      mist.addColorStop(0.12, HAZE)
      mist.addColorStop(0.5, 'rgba(236,171,118,.55)')
      mist.addColorStop(1, 'rgba(236,171,118,0)')
      g.fillStyle = mist
      g.fillRect(0, TH - 150, TW * 2, 150)
      tex.needsUpdate = true
    }
    img.src = asset('story/k08.webp')
    return tex
  })
