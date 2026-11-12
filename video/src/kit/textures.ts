import * as THREE from 'three'
import { hash, mulberry32 } from '../engine/math'

/** Everything here is drawn in code at load time: leaves, paper, paving stones, light gobos. */

function canvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

/* ── maple leaf ───────────────────────────────────────────────────────────── */

/** Outline of a maple leaf in a unit box (stem base at (0,-0.78), top tip at (0, 1)). `kind` varies the cut. */
function mapleOutline(kind: number): Array<[number, number]> {
  // five lobes: angle from +Y, length, half-width of the lobe at its base
  const lobes: Array<[number, number, number]> =
    kind === 1
      ? [
          [0, 1.0, 0.3],
          [50, 0.84, 0.27],
          [108, 0.56, 0.24],
        ]
      : kind === 2
        ? [
            [0, 0.98, 0.36],
            [58, 0.8, 0.3],
            [118, 0.5, 0.26],
          ]
        : [
            [0, 1.0, 0.33],
            [54, 0.86, 0.28],
            [114, 0.6, 0.24],
          ]
  const half: Array<[number, number]> = []
  const dir = (deg: number, r: number): [number, number] => {
    const a = (deg * Math.PI) / 180
    return [Math.sin(a) * r, Math.cos(a) * r]
  }
  const lobePts = (ang: number, len: number, wid: number, first: boolean) => {
    const pts: Array<[number, number]> = []
    const add = (along: number, side: number) => {
      // point at `along` (0…1 of the lobe length) and `side` (signed half-width units), in lobe space
      const [cx, cy] = dir(ang, len * along)
      const [px, py] = dir(ang + 90, wid * side)
      pts.push([cx + px, cy + py])
    }
    if (!first) {
      add(0.34, -0.62)
      add(0.56, -0.98) // lower tooth
      add(0.6, -0.5)
      add(0.8, -0.56) // upper tooth
      add(0.84, -0.22)
    }
    add(1, 0) // tip
    add(0.84, 0.22)
    add(0.8, 0.56)
    add(0.6, 0.5)
    add(0.56, 0.98)
    add(0.34, 0.62)
    return pts
  }
  lobes.forEach(([ang, len, wid], i) => {
    for (const p of lobePts(ang, len, wid, i === 0)) half.push(p)
    // notch toward the next lobe
    const next = lobes[i + 1]
    if (next) half.push(dir((ang + next[0]) / 2, 0.2))
  })
  // bottom: curve in to the stem
  half.push([0.2, -0.2])
  half.push([0.035, -0.3])
  half.push([0.03, -0.78])
  const full: Array<[number, number]> = [...half]
  for (let i = half.length - 1; i >= 0; i--) full.push([-half[i][0], half[i][1]])
  return full
}

function tracePath(ctx: CanvasRenderingContext2D, pts: Array<[number, number]>, S: number, scale: number, soften = 0.42) {
  // smooth through midpoints so the cut edge is organic, but keep tips fairly pointed
  const P = pts.map(([x, y]) => [S / 2 + x * scale, S / 2 - (y - 0.1) * scale] as [number, number])
  ctx.beginPath()
  const n = P.length
  const mid = (a: [number, number], b: [number, number], k: number): [number, number] => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]
  let start = mid(P[n - 1], P[0], 1 - soften)
  ctx.moveTo(start[0], start[1])
  for (let i = 0; i < n; i++) {
    const cur = P[i]
    const next = P[(i + 1) % n]
    const end = mid(cur, next, soften)
    ctx.quadraticCurveTo(cur[0], cur[1], end[0], end[1])
    const far = mid(cur, next, 1 - soften)
    ctx.lineTo(far[0], far[1])
  }
  ctx.closePath()
}

/**
 * Leaf texture packed for the leaf shader: R = shading (veins, soft mottling), G = gradient from stem to
 * tips (mixes the two leaf colours), B = unused, A = shape. RGB is defined everywhere (no dark fringes when
 * the shader reads blurred mip levels for depth of field). The leaf fills ~62% of the tile so blur has room.
 */
export function makeLeafTexture(kind = 0, size = 512): THREE.DataTexture {
  const S = size
  const scale = S * 0.31
  const outline = mapleOutline(kind)
  // alpha
  const ca = canvas(S, S)
  const a = ca.getContext('2d', { willReadFrequently: true })!
  a.fillStyle = '#000'
  a.fillRect(0, 0, S, S)
  a.fillStyle = '#fff'
  tracePath(a, outline, S, scale)
  a.fill()
  // stem
  a.strokeStyle = '#fff'
  a.lineCap = 'round'
  a.lineWidth = S * 0.012
  a.beginPath()
  a.moveTo(S / 2, S / 2 + 0.36 * scale)
  a.quadraticCurveTo(S / 2 + 0.03 * scale, S / 2 + 0.8 * scale, S / 2 + 0.1 * scale, S / 2 + 1.12 * scale)
  a.stroke()
  // shading
  const cs = canvas(S, S)
  const s = cs.getContext('2d', { willReadFrequently: true })!
  s.fillStyle = 'rgb(205,205,205)'
  s.fillRect(0, 0, S, S)
  const rnd = mulberry32(31 + kind * 7)
  // mottling
  for (let i = 0; i < 90; i++) {
    const x = rnd() * S
    const y = rnd() * S
    const r = S * (0.02 + rnd() * 0.07)
    const g = s.createRadialGradient(x, y, 0, x, y, r)
    const dark = rnd() < 0.5
    g.addColorStop(0, dark ? 'rgba(120,120,120,0.22)' : 'rgba(255,255,255,0.25)')
    g.addColorStop(1, dark ? 'rgba(120,120,120,0)' : 'rgba(255,255,255,0)')
    s.fillStyle = g
    s.fillRect(x - r, y - r, r * 2, r * 2)
  }
  // edge darkening inside the shape
  s.save()
  tracePath(s, outline, S, scale)
  s.clip()
  s.shadowColor = 'rgba(60,60,60,0.55)'
  s.shadowBlur = S * 0.05
  s.lineWidth = S * 0.02
  s.strokeStyle = 'rgba(90,90,90,0.5)'
  tracePath(s, outline, S, scale)
  s.stroke()
  s.restore()
  // veins: midrib and one per lobe, each with small side veins
  const base: [number, number] = [S / 2, S / 2 + 0.36 * scale]
  const tips: Array<[number, number, number]> = [
    [0, 0.96, 1],
    [54, 0.8, 0.8],
    [-54, 0.8, 0.8],
    [114, 0.54, 0.6],
    [-114, 0.54, 0.6],
  ]
  s.lineCap = 'round'
  for (const [deg, len, w] of tips) {
    const ang = (deg * Math.PI) / 180
    const tx = S / 2 + Math.sin(ang) * len * scale
    const ty = S / 2 - (Math.cos(ang) * len - 0.1) * scale
    for (const pass of [0, 1]) {
      s.strokeStyle = pass === 0 ? 'rgba(70,70,70,0.4)' : 'rgba(255,255,255,0.6)'
      s.lineWidth = S * (pass === 0 ? 0.013 : 0.0055) * w
      s.beginPath()
      s.moveTo(base[0], base[1])
      s.lineTo(tx, ty)
      s.stroke()
    }
    // side veins
    for (let k = 1; k <= 4; k++) {
      const f = 0.28 + k * 0.14
      const px = base[0] + (tx - base[0]) * f
      const py = base[1] + (ty - base[1]) * f
      for (const side of [-1, 1]) {
        const a2 = Math.atan2(ty - base[1], tx - base[0]) + side * 0.75
        const l2 = scale * 0.2 * (1 - f * 0.55) * w
        s.strokeStyle = 'rgba(255,255,255,0.32)'
        s.lineWidth = S * 0.0035
        s.beginPath()
        s.moveTo(px, py)
        s.lineTo(px + Math.cos(a2) * l2, py + Math.sin(a2) * l2)
        s.stroke()
      }
    }
  }
  const A = a.getImageData(0, 0, S, S).data
  const L = s.getImageData(0, 0, S, S).data
  const out = new Uint8Array(S * S * 4)
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const i = (y * S + x) * 4
      const o = ((S - 1 - y) * S + x) * 4 // flip Y for GL
      const dx = (x - base[0]) / scale
      const dy = (base[1] - y) / scale
      const grad = Math.min(1, Math.max(0, Math.hypot(dx, dy) / 1.25))
      out[o] = L[i]
      out[o + 1] = Math.round(grad * 255)
      out[o + 2] = 0
      out[o + 3] = A[i]
    }
  }
  const tex = new THREE.DataTexture(out, S, S, THREE.RGBAFormat, THREE.UnsignedByteType)
  tex.generateMipmaps = true
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.colorSpace = THREE.NoColorSpace
  tex.needsUpdate = true
  return tex
}

/* ── soft sprites ─────────────────────────────────────────────────────────── */

/** Round soft glow (additive). `core` < 1 gives a hot centre. */
export function makeGlowTexture(size = 256, core = 0.25): THREE.Texture {
  const c = canvas(size, size)
  const g = c.getContext('2d', { willReadFrequently: true })!
  const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  grd.addColorStop(0, 'rgba(255,255,255,1)')
  grd.addColorStop(core, 'rgba(255,255,255,0.55)')
  grd.addColorStop(0.6, 'rgba(255,255,255,0.12)')
  grd.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, size, size)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** Bokeh disc with a slightly brighter rim, for dust and far lights. */
export function makeBokehTexture(size = 128): THREE.Texture {
  const c = canvas(size, size)
  const g = c.getContext('2d', { willReadFrequently: true })!
  const r = size / 2
  const grd = g.createRadialGradient(r, r, 0, r, r, r)
  grd.addColorStop(0, 'rgba(255,255,255,0.55)')
  grd.addColorStop(0.7, 'rgba(255,255,255,0.6)')
  grd.addColorStop(0.86, 'rgba(255,255,255,0.85)')
  grd.addColorStop(0.95, 'rgba(255,255,255,0.25)')
  grd.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, size, size)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** A light shaft: bright along its axis, feathered on both sides and at both ends. */
export function makeShaftTexture(w = 128, h = 512): THREE.Texture {
  const c = canvas(w, h)
  const g = c.getContext('2d', { willReadFrequently: true })!
  const img = g.createImageData(w, h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x / (w - 1)
      const v = y / (h - 1)
      const across = Math.sin(Math.PI * u) ** 2.2
      const along = Math.sin(Math.PI * Math.min(1, v * 1.15)) ** 0.8 * (1 - v * 0.55)
      const a = across * along
      const i = (y * w + x) * 4
      img.data[i] = 255
      img.data[i + 1] = 255
      img.data[i + 2] = 255
      img.data[i + 3] = Math.round(a * 255)
    }
  }
  g.putImageData(img, 0, 0)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/* ── dappled light (gobo) ─────────────────────────────────────────────────── */

/** Tileable leaf-shadow pattern: bright pools of sun between soft leaf shadows. White = lit. */
export function makeGoboTexture(size = 1024, seed = 5): THREE.Texture {
  const c = canvas(size, size)
  const g = c.getContext('2d', { willReadFrequently: true })!
  g.fillStyle = '#3a3a3a'
  g.fillRect(0, 0, size, size)
  const rnd = mulberry32(seed)
  g.filter = `blur(${size * 0.012}px)`
  for (let i = 0; i < 150; i++) {
    const x = rnd() * size
    const y = rnd() * size
    const r = size * (0.018 + rnd() * 0.06)
    const stretch = 0.55 + rnd() * 0.6
    const rot = rnd() * Math.PI
    g.fillStyle = `rgba(255,255,255,${0.5 + rnd() * 0.5})`
    for (const ox of [-size, 0, size])
      for (const oy of [-size, 0, size]) {
        g.beginPath()
        g.ellipse(x + ox, y + oy, r, r * stretch, rot, 0, Math.PI * 2)
        g.fill()
      }
  }
  g.filter = 'none'
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = THREE.NoColorSpace
  t.generateMipmaps = true
  t.minFilter = THREE.LinearMipmapLinearFilter
  return t
}

/* ── paving stones (the kindergarten yard) ────────────────────────────────── */

/** Warm cobbles like the yard in the paintings: irregular stones (a tileable Voronoi), soft bevels, grit. */
export function makeStonesTexture(size = 1024, seed = 3): THREE.Texture {
  const c = canvas(size, size)
  const g = c.getContext('2d', { willReadFrequently: true })!
  const img = g.createImageData(size, size)
  const d = img.data
  const N = 13 // cells per side
  const cell = size / N
  // jittered seed points, wrapped so the texture tiles
  const px = new Float32Array(N * N)
  const py = new Float32Array(N * N)
  const tone = new Float32Array(N * N)
  const hue = new Float32Array(N * N)
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++) {
      const k = j * N + i
      px[k] = (i + 0.5 + (hash(k, seed) - 0.5) * 0.78) * cell
      py[k] = (j + 0.5 + (hash(k, seed + 1) - 0.5) * 0.78) * cell * 1
      tone[k] = 0.8 + hash(k, seed + 2) * 0.36
      hue[k] = hash(k, seed + 3)
    }
  const mortar = [112, 80, 56]
  for (let y = 0; y < size; y++) {
    const cj = Math.floor(y / cell)
    for (let x = 0; x < size; x++) {
      const ci = Math.floor(x / cell)
      let d1 = 1e9
      let d2 = 1e9
      let id = 0
      for (let oj = -2; oj <= 2; oj++)
        for (let oi = -2; oi <= 2; oi++) {
          const ii = ci + oi
          const jj = cj + oj
          const k = ((jj + 2 * N) % N) * N + ((ii + 2 * N) % N)
          const sx = px[k] + (ii - ((ii + 2 * N) % N)) * cell
          const sy = py[k] + (jj - ((jj + 2 * N) % N)) * cell
          // stones are a little wider than tall, like laid pavers
          const dx = (x - sx) * 0.86
          const dy = y - sy
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < d1) {
            d2 = d1
            d1 = dist
            id = k
          } else if (dist < d2) d2 = dist
        }
      const edge = (d2 - d1) / cell // 0 at the joint
      const inStone = Math.min(1, Math.max(0, (edge - 0.016) / 0.05))
      const bevel = Math.min(1, edge / 0.3)
      // light from the upper left: brighter on the up-left shoulder of each stone
      const k = id
      const lx = (x - px[k]) / cell
      const ly = (y - py[k]) / cell
      const shoulder = Math.max(-1, Math.min(1, (-lx - ly) * 1.2)) * (1 - bevel) * 0.16
      const grit = (hash(x + y * size, seed + 9) - 0.5) * 0.07
      const mott = Math.sin(x * 0.021 + hue[k] * 9) * Math.sin(y * 0.017 + hue[k] * 5) * 0.05
      const t = tone[k] * (0.82 + 0.18 * bevel) + shoulder + grit + mott
      const r = (176 + hue[k] * 26) * t
      const gg = (136 + hue[k] * 18) * t
      const b = (104 + hue[k] * 10) * t
      const o = (y * size + x) * 4
      d[o] = mortar[0] + (r - mortar[0]) * inStone
      d[o + 1] = mortar[1] + (gg - mortar[1]) * inStone
      d[o + 2] = mortar[2] + (b - mortar[2]) * inStone
      d[o + 3] = 255
    }
  }
  g.putImageData(img, 0, 0)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = THREE.SRGBColorSpace
  t.generateMipmaps = true
  t.minFilter = THREE.LinearMipmapLinearFilter
  return t
}

/* ── images ───────────────────────────────────────────────────────────────── */

export async function loadImage(url: string): Promise<HTMLImageElement> {
  const img = new Image()
  img.decoding = 'sync'
  img.src = url
  await img.decode()
  return img
}

export function imageTexture(img: HTMLImageElement | HTMLCanvasElement | ImageBitmap, mip = true): THREE.Texture {
  const t = new THREE.Texture(img as HTMLImageElement)
  t.colorSpace = THREE.SRGBColorSpace
  t.generateMipmaps = mip
  t.minFilter = mip ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter
  t.magFilter = THREE.LinearFilter
  t.anisotropy = 4
  t.needsUpdate = true
  return t
}

/** A blurred, slightly darkened copy of a picture: the out-of-focus world behind a close-up. */
export function blurredCopy(img: HTMLImageElement | HTMLCanvasElement, blurPx: number, width = 640, tint = 'rgba(40,20,8,0.0)'): HTMLCanvasElement {
  const h = Math.round((width * img.height) / img.width)
  const c = canvas(width, h)
  const g = c.getContext('2d', { willReadFrequently: true })!
  const pad = blurPx * 2.5
  g.filter = `blur(${blurPx}px)`
  // draw larger than the canvas so the blur never pulls in transparent edges
  g.drawImage(img, -pad, -pad, width + pad * 2, h + pad * 2)
  g.filter = 'none'
  g.fillStyle = tint
  g.fillRect(0, 0, width, h)
  return c
}

export { canvas as makeCanvas }
