import * as THREE from 'three'
import { clamp, smooth } from '../engine/math'
import { gobo } from './plate'
import { makeCanvas } from './textures'
import { arNum } from './type'

/**
 * The picture book, as an Arabic book really is: spine on the right, the cover swings open to the right,
 * leaves turn from left to right and are read right page first. Pages are drawn in code (her words set
 * in Noto Naskh by the browser's text engine); a painting runs across each spread. Leaves bend as they
 * turn: their shape is integrated along the sheet every frame, so the paper never stretches.
 */
export const PAGE = { w: 1, h: 1.34, pxW: 768, pxH: 1024 }
const T = 0.085 // thickness of the block of pages
const CT = 0.02 // cover board
const OV = 0.03 // cover overhang

const INK = '#2a1a10'
const PAPER = '#fbf5e8'

function paperBase(g: CanvasRenderingContext2D, w: number, h: number, gutterAt: 'left' | 'right') {
  g.fillStyle = PAPER
  g.fillRect(0, 0, w, h)
  // soft shade toward the gutter, a little warmth at the outer edge
  const gx = gutterAt === 'right' ? w : 0
  const grd = g.createLinearGradient(gx, 0, gutterAt === 'right' ? w - w * 0.22 : w * 0.22, 0)
  grd.addColorStop(0, 'rgba(120,80,45,0.32)')
  grd.addColorStop(0.35, 'rgba(120,80,45,0.08)')
  grd.addColorStop(1, 'rgba(120,80,45,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, w, h)
}

function wrapRtl(g: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w
    if (g.measureText(next).width > maxW && cur) {
      lines.push(cur)
      cur = w
    } else cur = next
  }
  if (cur) lines.push(cur)
  return lines
}

function tex(c: HTMLCanvasElement): THREE.Texture {
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.generateMipmaps = true
  t.minFilter = THREE.LinearMipmapLinearFilter
  t.anisotropy = 8
  return t
}

/** One page of a spread: `side` is where the page sits when the book lies open. */
export function spreadPage(img: HTMLImageElement, side: 'right' | 'left', opts: { text?: string; page: number; cy?: number }): THREE.Texture {
  const { pxW: w, pxH: h } = PAGE
  const c = makeCanvas(w, h)
  const g = c.getContext('2d', { willReadFrequently: true })!
  paperBase(g, w, h, side === 'right' ? 'left' : 'right')
  // the painting runs across both pages, bleeding off the top and the outer edges
  const ph = Math.round(h * 0.7)
  const srcW = img.width
  const srcH = Math.round((srcW * ph) / (w * 2))
  const sy = Math.round((img.height - srcH) * (opts.cy ?? 0.4))
  g.drawImage(img, side === 'left' ? 0 : srcW / 2, sy, srcW / 2, srcH, 0, 0, w, ph)
  // gutter shade over the picture
  const gx = side === 'right' ? 0 : w
  const grd = g.createLinearGradient(gx, 0, side === 'right' ? w * 0.16 : w - w * 0.16, 0)
  grd.addColorStop(0, 'rgba(40,20,8,0.42)')
  grd.addColorStop(1, 'rgba(40,20,8,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, w, ph)
  g.direction = 'rtl'
  if (opts.text) {
    g.font = `600 50px "Noto Naskh Arabic"`
    g.fillStyle = INK
    g.textAlign = 'right'
    g.textBaseline = 'alphabetic'
    const lines = wrapRtl(g, opts.text, w - 150)
    const lh = 86
    const y0 = ph + (h - ph) / 2 - ((lines.length - 1) * lh) / 2 + 8
    lines.forEach((ln, i) => g.fillText(ln, w - 78, y0 + i * lh))
  } else {
    // a quiet maple rule and the page number
    g.strokeStyle = 'rgba(217,84,30,0.8)'
    g.lineWidth = 5
    g.lineCap = 'round'
    g.beginPath()
    g.moveTo(w / 2 - 46, ph + (h - ph) / 2 - 24)
    g.lineTo(w / 2 + 46, ph + (h - ph) / 2 - 24)
    g.stroke()
  }
  g.font = `500 30px "Rubik Variable"`
  g.fillStyle = 'rgba(42,26,16,0.55)'
  g.textAlign = 'center'
  g.fillText(arNum(opts.page), w / 2, h - 44)
  return tex(c)
}

export function titlePage(title: [string, string], kicker: string, brand: string): THREE.Texture {
  const { pxW: w, pxH: h } = PAGE
  const c = makeCanvas(w, h)
  const g = c.getContext('2d', { willReadFrequently: true })!
  paperBase(g, w, h, 'right')
  g.direction = 'rtl'
  g.textAlign = 'center'
  g.fillStyle = '#d9541e'
  g.font = `500 34px "Rubik Variable"`
  g.fillText(kicker, w / 2, h * 0.3)
  g.fillStyle = INK
  g.font = `800 88px "Rubik Variable"`
  g.fillText(title[0], w / 2, h * 0.43)
  g.font = `800 76px "Rubik Variable"`
  g.fillText(title[1], w / 2, h * 0.43 + 108)
  g.strokeStyle = 'rgba(217,84,30,0.85)'
  g.lineWidth = 6
  g.lineCap = 'round'
  g.beginPath()
  g.moveTo(w / 2 - 60, h * 0.63)
  g.lineTo(w / 2 + 60, h * 0.63)
  g.stroke()
  g.fillStyle = 'rgba(42,26,16,0.6)'
  g.font = `600 32px "Rubik Variable"`
  g.fillText(brand, w / 2, h * 0.9)
  return tex(c)
}

export function endpaper(): THREE.Texture {
  const { pxW: w, pxH: h } = PAGE
  const c = makeCanvas(w, h)
  const g = c.getContext('2d', { willReadFrequently: true })!
  g.fillStyle = '#e7a25c'
  g.fillRect(0, 0, w, h)
  // scattered leaf-like dabs
  for (let i = 0; i < 46; i++) {
    const x = ((i * 137.5) % 100) / 100
    const y = ((i * 61.8 + 13) % 100) / 100
    g.save()
    g.translate(x * w, y * h)
    g.rotate(i * 1.7)
    g.fillStyle = i % 3 === 0 ? 'rgba(217,84,30,0.5)' : i % 3 === 1 ? 'rgba(246,200,120,0.55)' : 'rgba(190,70,25,0.4)'
    g.beginPath()
    g.ellipse(0, 0, 26, 12, 0, 0, Math.PI * 2)
    g.fill()
    g.restore()
  }
  const grd = g.createLinearGradient(0, 0, w * 0.2, 0)
  grd.addColorStop(0, 'rgba(60,25,8,0.35)')
  grd.addColorStop(1, 'rgba(60,25,8,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, w, h)
  return tex(c)
}

export function coverTexture(img: HTMLImageElement, title: [string, string], kicker: string): THREE.Texture {
  const { pxW: w, pxH: h } = PAGE
  const c = makeCanvas(w, h)
  const g = c.getContext('2d', { willReadFrequently: true })!
  const s = Math.max(w / img.width, h / img.height)
  g.drawImage(img, (w - img.width * s) / 2, (h - img.height * s) / 2, img.width * s, img.height * s)
  // lettering in the sky
  const sky = g.createLinearGradient(0, 0, 0, h * 0.42)
  sky.addColorStop(0, 'rgba(120,50,10,0.38)')
  sky.addColorStop(1, 'rgba(120,50,10,0)')
  g.fillStyle = sky
  g.fillRect(0, 0, w, h * 0.42)
  g.direction = 'rtl'
  g.textAlign = 'center'
  g.shadowColor = 'rgba(70,25,5,0.55)'
  g.shadowBlur = 18
  g.shadowOffsetY = 3
  g.fillStyle = '#fff6e6'
  g.font = `800 96px "Rubik Variable"`
  g.fillText(title[0], w / 2, 190)
  g.font = `800 80px "Rubik Variable"`
  g.fillText(title[1], w / 2, 296)
  g.shadowBlur = 8
  g.font = `600 30px "Rubik Variable"`
  g.fillStyle = '#ffe3bd'
  g.fillText(kicker, w / 2, 92)
  g.shadowColor = 'transparent'
  // spine-side shade (the spine is on the right)
  const grd = g.createLinearGradient(w, 0, w - 46, 0)
  grd.addColorStop(0, 'rgba(40,15,5,0.5)')
  grd.addColorStop(0.5, 'rgba(40,15,5,0.12)')
  grd.addColorStop(1, 'rgba(40,15,5,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, w, h)
  return tex(c)
}

const LEAF_VERT = /* glsl */ `
varying vec2 vUv; varying vec3 vN; varying vec3 vW;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz; vUv = uv;
  vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}`
const LEAF_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D front; uniform sampler2D back; uniform sampler2D gobo;
uniform vec3 uLightDir; uniform vec3 uKey; uniform vec3 uAmbSky; uniform vec3 uAmbGround;
uniform vec2 uGoboShift; uniform float uShade; uniform float uBlur;
varying vec2 vUv; varying vec3 vN; varying vec3 vW;
void main() {
  vec3 N = normalize(vN);
  vec3 base;
  if (gl_FrontFacing) base = texture2D(front, vec2(1.0 - vUv.x, vUv.y), uBlur).rgb;
  else { base = texture2D(back, vUv, uBlur).rgb; N = -N; }
  float ndl = dot(N, uLightDir);
  float diff = clamp(ndl * 0.5 + 0.5, 0.0, 1.0);
  vec3 amb = mix(uAmbGround, uAmbSky, N.y * 0.5 + 0.5);
  vec2 g = vW.xz * 0.16 + uGoboShift;
  float ga = texture2D(gobo, g).r;
  float gb = texture2D(gobo, g * 0.47 + vec2(0.3, 0.6) - uGoboShift * 0.35).r;
  float light = smoothstep(0.3, 0.85, ga * 0.62 + gb * 0.38);
  vec3 col = base * (amb + uKey * diff * (0.5 + 0.5 * light) + uKey * clamp(-ndl, 0.0, 1.0) * 0.25) * uShade;
  gl_FragColor = vec4(col, 1.0);
}`

const SEG = 30

class Sheet {
  mesh: THREE.Mesh
  uniforms: Record<string, THREE.IUniform>
  private pos: THREE.BufferAttribute
  private nor: THREE.BufferAttribute
  constructor(
    front: THREE.Texture,
    back: THREE.Texture,
    shared: Record<string, THREE.IUniform>,
    private width: number,
    private height: number,
    private rigid = false,
  ) {
    const geo = new THREE.BufferGeometry()
    const n = (SEG + 1) * 2
    this.pos = new THREE.BufferAttribute(new Float32Array(n * 3), 3)
    this.nor = new THREE.BufferAttribute(new Float32Array(n * 3), 3)
    const uv = new Float32Array(n * 2)
    const idx: number[] = []
    for (let i = 0; i <= SEG; i++) {
      uv.set([i / SEG, 0, i / SEG, 1], i * 4)
      if (i < SEG) {
        const a = i * 2
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
      }
    }
    geo.setAttribute('position', this.pos)
    geo.setAttribute('normal', this.nor)
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
    geo.setIndex(idx)
    this.uniforms = { ...shared, front: { value: front }, back: { value: back }, gobo: { value: gobo() }, uShade: { value: 1 }, uBlur: { value: 0 } }
    this.mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: this.uniforms, vertexShader: LEAF_VERT, fragmentShader: LEAF_FRAG, side: THREE.DoubleSide }))
    this.mesh.frustumCulled = false
    this.mesh.renderOrder = 4
  }
  /** phi: 0 = lying to the left of the spine, π = lying to the right. (hx, hy) is the hinge. */
  shape(phi: number, hx: number, hy: number) {
    const ds = this.width / SEG
    let x = hx
    let y = hy
    const B = this.rigid ? 0 : 0.95
    for (let i = 0; i <= SEG; i++) {
      const s = i / SEG
      // near the spine the sheet lags behind the edge that is being carried over
      const a = phi - B * Math.sin(phi) * (1 - s) ** 1.6 + (this.rigid ? 0 : 0.1 * Math.sin(phi) * Math.sin(s * Math.PI))
      const nx = Math.sin(a)
      const ny = Math.cos(a)
      this.pos.setXYZ(i * 2, x, y, this.height / 2)
      this.pos.setXYZ(i * 2 + 1, x, y, -this.height / 2)
      this.nor.setXYZ(i * 2, nx, ny, 0)
      this.nor.setXYZ(i * 2 + 1, nx, ny, 0)
      x += -Math.cos(a) * ds
      y += Math.sin(a) * ds
    }
    this.pos.needsUpdate = true
    this.nor.needsUpdate = true
  }
}

export interface BookPages {
  cover: THREE.Texture
  endpaper: THREE.Texture
  /** leaves[i] = [front, back]: front faces up while the leaf waits on the left. */
  leaves: Array<[THREE.Texture, THREE.Texture]>
  /** What the left block shows once every leaf has turned. */
  last: THREE.Texture
}

export interface BookLight {
  dir: THREE.Vector3
  key: THREE.Color
  sky: THREE.Color
  ground: THREE.Color
}

export class Book {
  group = new THREE.Group()
  private cover: Sheet
  private leaves: Sheet[] = []
  private rest: Sheet
  private blockL: THREE.Mesh
  private blockR: THREE.Mesh
  private shadow: THREE.Mesh
  private shared: Record<string, THREE.IUniform>

  constructor(pages: BookPages, light: BookLight) {
    this.shared = {
      uLightDir: { value: light.dir },
      uKey: { value: light.key },
      uAmbSky: { value: light.sky },
      uAmbGround: { value: light.ground },
      uGoboShift: { value: new THREE.Vector2() },
    }
    const edge = new THREE.MeshBasicMaterial({ color: new THREE.Color('#e9dcc2').multiplyScalar(0.92) })
    const board = new THREE.MeshBasicMaterial({ color: new THREE.Color('#8a3a16') })
    // back cover + spine
    const back = new THREE.Mesh(new THREE.BoxGeometry(PAGE.w + OV, CT, PAGE.h + OV * 2), board)
    back.position.set(-(PAGE.w + OV) / 2, CT / 2, 0)
    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.03, T + CT * 2, PAGE.h + OV * 2), board)
    spine.position.set(0.012, (T + CT * 2) / 2, 0)
    this.blockL = new THREE.Mesh(new THREE.BoxGeometry(PAGE.w, 1, PAGE.h), edge)
    this.blockR = new THREE.Mesh(new THREE.BoxGeometry(PAGE.w, 1, PAGE.h), edge)
    this.group.add(back, spine, this.blockL, this.blockR)
    this.cover = new Sheet(pages.cover, pages.endpaper, this.shared, PAGE.w + OV, PAGE.h + OV * 2, true)
    this.group.add(this.cover.mesh)
    for (const [f, b] of pages.leaves) {
      const s = new Sheet(f, b, this.shared, PAGE.w, PAGE.h)
      this.leaves.push(s)
      this.group.add(s.mesh)
    }
    this.rest = new Sheet(pages.last, pages.last, this.shared, PAGE.w, PAGE.h, true)
    this.group.add(this.rest.mesh)
    // soft contact shadow
    const c = makeCanvas(256, 256)
    const g = c.getContext('2d', { willReadFrequently: true })!
    g.filter = 'blur(20px)'
    g.fillStyle = '#000'
    g.fillRect(48, 48, 160, 160)
    const st = new THREE.CanvasTexture(c)
    const sg = new THREE.PlaneGeometry(1, 1)
    sg.rotateX(-Math.PI / 2)
    this.shadow = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ map: st, color: 0x1a0c05, transparent: true, opacity: 0.6, depthWrite: false }))
    this.shadow.renderOrder = 2
    this.group.add(this.shadow)
  }

  /** open: 0 closed … 1 cover fully open. turns[i]: 0…1 for each leaf. */
  update(t: number, open: number, turns: number[]) {
    ;(this.shared.uGoboShift.value as THREE.Vector2).set(Math.sin(t * 0.33) * 0.025 + t * 0.006, Math.cos(t * 0.27) * 0.02)
    const n = this.leaves.length
    const turned = turns.reduce((a, b) => a + smooth(clamp(b)), 0)
    const TR = T * (0.06 + 0.1 * turned) * smooth(clamp(open * 3))
    const TL = T - T * 0.1 * turned
    this.blockL.scale.y = TL
    this.blockL.position.set(-PAGE.w / 2, CT + TL / 2, 0)
    this.blockR.scale.y = Math.max(0.0005, TR)
    this.blockR.position.set(PAGE.w / 2, CT + TR / 2, 0)
    this.blockR.visible = false
    const phiC = smooth(clamp(open)) * Math.PI
    // the hinge of the cover slides from the top of the closed block down to the table
    this.cover.shape(phiC, 0, CT + TL + 0.012 + (CT - (CT + TL + 0.012)) * smooth(clamp(open)))
    this.cover.mesh.position.x = 0.02 * smooth(clamp(open))
    for (let i = 0; i < n; i++) {
      const k = clamp(turns[i] ?? 0)
      const phi = (k * k * (3 - 2 * k)) * Math.PI
      const yL = CT + TL + 0.0015 * (n - i)
      const yR = CT + TR + 0.0015 * (i + 1)
      this.leaves[i].shape(phi, 0, yL + (yR - yL) * k)
      this.leaves[i].mesh.renderOrder = 4 + (k > 0 && k < 1 ? 1 : 0)
    }
    this.rest.shape(0, 0, CT + TL + 0.0005)
    const openW = 1 + smooth(clamp(open))
    this.shadow.scale.set((PAGE.w + 0.5) * openW, 1, PAGE.h + 0.55)
    this.shadow.position.set(-PAGE.w / 2 + (PAGE.w / 2) * smooth(clamp(open)) + 0.06, 0.003, 0.05)
  }
}
