import * as THREE from 'three'
import { hash } from '../engine/math'
import { makeLeafTexture } from './textures'

/**
 * Autumn leaves as lit, bent, two-sided cards. Each leaf is placed by a pure function of (index, time),
 * so a frame can be drawn in any order. Depth of field is done per leaf: the further a leaf is from the
 * focus distance, the blurrier the mip level its texture is read from (and the more it fades), which is
 * cheap and looks like a lens. Light from behind makes a leaf glow, as in the paintings.
 */

export interface LeafState {
  pos: THREE.Vector3
  quat: THREE.Quaternion
  /** Size in world units (the texture tile; the leaf itself is ~62% of it). */
  size: number
  /** 0…1 visibility. */
  alpha: number
  /** Cupping of the blade, −1…1. */
  curl: number
  /** Extra blur in mip levels (added to the lens blur). */
  blur: number
}

export type LeafPlacer = (i: number, t: number, out: LeafState) => void

export interface LeafFieldOptions {
  count: number
  seed?: number
  place: LeafPlacer
  /** Palette index → [base colour, tip colour]. Defaults to the film's autumn palette. */
  palette?: Array<[string, string]>
  /** Lens: distance in focus, and how many world units away one mip level of blur is added. */
  focus?: number
  focusRange?: number
  maxBlur?: number
  renderOrder?: number
  /** Overall brightness. */
  gain?: number
  /** Explicit colours for leaf i (overrides the palette pick). */
  colorOf?: (i: number) => [string, string]
}

export const AUTUMN: Array<[string, string]> = [
  ['#e2531a', '#b8230f'], // maple red-orange
  ['#f08a1c', '#d9541e'], // orange
  ['#f6b529', '#e8791a'], // amber
  ['#f7cf45', '#f09a22'], // yellow
  ['#c9321a', '#8e1a10'], // deep red
  ['#f4a35e', '#d9541e'], // soft maple
  ['#e9a01f', '#b65a12'], // ochre
]

const VERT = /* glsl */ `
attribute vec3 aColA;
attribute vec3 aColB;
attribute vec4 aParams; // alpha, curl, blur, unused
varying vec2 vUv;
varying vec3 vN;
varying vec3 vW;
varying vec3 vColA;
varying vec3 vColB;
varying vec3 vP;
void main() {
  vec3 p = position;
  float curl = aParams.y;
  // cup across the midrib and droop at the tip
  float bx = p.x * p.x;
  float by = (p.y + 0.5);
  p.z += curl * (bx * 0.9 + by * by * 0.22 - 0.12);
  // analytic normal of the bent sheet
  vec3 n = normalize(vec3(-curl * 1.8 * p.x, -curl * 0.44 * by, 1.0));
  vec4 w = modelMatrix * instanceMatrix * vec4(p, 1.0);
  vW = w.xyz;
  vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * n);
  vUv = uv;
  vColA = aColA;
  vColB = aColB;
  vP = aParams.xzw;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`
const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D map;
uniform vec3 uLightDir;
uniform vec3 uKey;
uniform vec3 uAmbSky;
uniform vec3 uAmbGround;
uniform float uGain;
varying vec2 vUv;
varying vec3 vN;
varying vec3 vW;
varying vec3 vColA;
varying vec3 vColB;
varying vec3 vP;
void main() {
  float blur = vP.y;
  vec4 tx = texture2D(map, vUv, blur);
  float a = tx.a * vP.x;
  // blurred leaves keep their light: do not let the mip average wash the shape to nothing
  a *= 1.0 - 0.07 * blur;
  if (a < 0.003) discard;
  vec3 base = mix(vColA, vColB, smoothstep(0.15, 0.95, tx.g));
  float shade = mix(1.0, 0.45 + 0.75 * tx.r, 1.0 - clamp(blur / 5.0, 0.0, 1.0) * 0.8);
  base *= shade;
  vec3 N = normalize(vN);
  vec3 V = normalize(cameraPosition - vW);
  if (dot(N, V) < 0.0) N = -N;
  float ndl = dot(N, uLightDir);
  float diff = clamp(ndl * 0.55 + 0.45, 0.0, 1.0);
  float back = clamp(-ndl, 0.0, 1.0);
  vec3 amb = mix(uAmbGround, uAmbSky, N.y * 0.5 + 0.5);
  vec3 col = base * (amb + uKey * diff);
  // translucency: the sun through the blade
  col += base * (0.6 + 0.8 * base) * uKey * back * 0.9;
  // soft sheen toward the light
  vec3 H = normalize(uLightDir + V);
  col += uKey * pow(max(dot(N, H), 0.0), 18.0) * 0.07;
  col *= uGain;
  gl_FragColor = vec4(col * a, a);
}
`

export interface LeafLight {
  dir: THREE.Vector3
  key: THREE.Color
  sky: THREE.Color
  ground: THREE.Color
}
export const WARM_LIGHT = (): LeafLight => ({
  dir: new THREE.Vector3(-0.55, 0.62, 0.35).normalize(),
  key: new THREE.Color(1.5, 1.08, 0.7),
  sky: new THREE.Color(0.5, 0.42, 0.36),
  ground: new THREE.Color(0.36, 0.22, 0.13),
})

const KINDS = 3
let leafTextures: THREE.DataTexture[] | null = null
function textures() {
  if (!leafTextures) leafTextures = [0, 1, 2].map((k) => makeLeafTexture(k))
  return leafTextures
}

export class LeafField {
  group = new THREE.Group()
  private meshes: THREE.InstancedMesh[] = []
  private states: LeafState[] = []
  private order: number[] = []
  private depth: Float32Array
  private kindOf: Uint8Array
  private colA: Float32Array
  private colB: Float32Array
  private uniforms: Record<string, THREE.IUniform>
  private opts: Required<Omit<LeafFieldOptions, 'palette' | 'colorOf'>> & { palette: Array<[string, string]>; colorOf?: (i: number) => [string, string] }
  private tmpM = new THREE.Matrix4()
  private tmpS = new THREE.Vector3()
  private tmpV = new THREE.Vector3()

  constructor(options: LeafFieldOptions, light: LeafLight = WARM_LIGHT()) {
    this.opts = {
      seed: 1,
      palette: AUTUMN,
      focus: 6,
      focusRange: 2.2,
      maxBlur: 5.5,
      renderOrder: 5,
      gain: 1,
      ...options,
    }
    const n = this.opts.count
    this.depth = new Float32Array(n)
    this.kindOf = new Uint8Array(n)
    this.colA = new Float32Array(n * 3)
    this.colB = new Float32Array(n * 3)
    const c = new THREE.Color()
    for (let i = 0; i < n; i++) {
      this.states.push({ pos: new THREE.Vector3(), quat: new THREE.Quaternion(), size: 1, alpha: 1, curl: 0.3, blur: 0 })
      this.order.push(i)
      this.kindOf[i] = Math.floor(hash(i, this.opts.seed + 3) * KINDS)
      const pal = this.opts.colorOf?.(i) ?? this.opts.palette[Math.floor(hash(i, this.opts.seed + 5) * this.opts.palette.length)]
      const v = 0.86 + hash(i, this.opts.seed + 7) * 0.28
      c.set(pal[0]).multiplyScalar(v)
      c.toArray(this.colA, i * 3)
      c.set(pal[1]).multiplyScalar(v)
      c.toArray(this.colB, i * 3)
    }
    this.uniforms = {
      uLightDir: { value: light.dir },
      uKey: { value: light.key },
      uAmbSky: { value: light.sky },
      uAmbGround: { value: light.ground },
      uGain: { value: this.opts.gain },
    }
    const geo = new THREE.PlaneGeometry(1, 1, 6, 6)
    const tex = textures()
    for (let k = 0; k < KINDS; k++) {
      const g = geo.clone()
      g.setAttribute('aColA', new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3))
      g.setAttribute('aColB', new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3))
      g.setAttribute('aParams', new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4))
      const mat = new THREE.ShaderMaterial({
        uniforms: { ...this.uniforms, map: { value: tex[k] } },
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        premultipliedAlpha: true,
        depthWrite: false,
        depthTest: true,
        side: THREE.DoubleSide,
      })
      const mesh = new THREE.InstancedMesh(g, mat, n)
      mesh.frustumCulled = false
      mesh.renderOrder = this.opts.renderOrder
      mesh.count = 0
      this.meshes.push(mesh)
      this.group.add(mesh)
    }
  }

  set gain(v: number) {
    this.uniforms.uGain.value = v
  }
  setFocus(focus: number, range = this.opts.focusRange) {
    this.opts.focus = focus
    this.opts.focusRange = range
  }

  update(t: number, camera: THREE.Camera) {
    const n = this.opts.count
    const camPos = camera.getWorldPosition(this.tmpV)
    const fwd = camera.getWorldDirection(new THREE.Vector3())
    for (let i = 0; i < n; i++) {
      const s = this.states[i]
      s.alpha = 1
      s.blur = 0
      s.curl = 0.25 + hash(i, 91) * 0.5
      this.opts.place(i, t, s)
      this.depth[i] = (s.pos.x - camPos.x) * fwd.x + (s.pos.y - camPos.y) * fwd.y + (s.pos.z - camPos.z) * fwd.z
    }
    // far to near
    this.order.sort((a, b) => this.depth[b] - this.depth[a])
    const counts = new Array(KINDS).fill(0)
    for (const i of this.order) {
      const s = this.states[i]
      const d = this.depth[i]
      if (s.alpha <= 0.002 || d < 0.12) continue
      const k = this.kindOf[i]
      const mesh = this.meshes[k]
      const j = counts[k]++
      this.tmpM.compose(s.pos, s.quat, this.tmpS.setScalar(s.size))
      mesh.setMatrixAt(j, this.tmpM)
      const lens = Math.min(this.opts.maxBlur, Math.abs(d - this.opts.focus) / this.opts.focusRange)
      // very close leaves get large on screen: their blur must grow with their size on screen
      const near = d < this.opts.focus ? Math.min(2.5, (this.opts.focus / Math.max(d, 0.2) - 1) * 0.5) : 0
      const blur = Math.min(7, s.blur + lens + near)
      const A = mesh.geometry.getAttribute('aColA') as THREE.InstancedBufferAttribute
      const B = mesh.geometry.getAttribute('aColB') as THREE.InstancedBufferAttribute
      const P = mesh.geometry.getAttribute('aParams') as THREE.InstancedBufferAttribute
      A.setXYZ(j, this.colA[i * 3], this.colA[i * 3 + 1], this.colA[i * 3 + 2])
      B.setXYZ(j, this.colB[i * 3], this.colB[i * 3 + 1], this.colB[i * 3 + 2])
      P.setXYZW(j, s.alpha, s.curl, blur, 0)
    }
    for (let k = 0; k < KINDS; k++) {
      const mesh = this.meshes[k]
      mesh.count = counts[k]
      mesh.instanceMatrix.needsUpdate = true
      ;(mesh.geometry.getAttribute('aColA') as THREE.BufferAttribute).needsUpdate = true
      ;(mesh.geometry.getAttribute('aColB') as THREE.BufferAttribute).needsUpdate = true
      ;(mesh.geometry.getAttribute('aParams') as THREE.BufferAttribute).needsUpdate = true
    }
  }
}

/* ── stock motions ────────────────────────────────────────────────────────── */

const _e = new THREE.Euler()
const _q = new THREE.Quaternion()
const _q2 = new THREE.Quaternion()

export interface FallParams {
  /** Volume the leaves live in: x/z extents around `center`, y from `top` down to `bottom`. */
  center: [number, number, number]
  spread: [number, number]
  top: number
  bottom: number
  /** Fall speed (units/s) and its variation. */
  speed?: number
  /** Wind drift (units/s) along x and z. */
  wind?: [number, number]
  size?: [number, number]
  seed?: number
  /** Leaves fade in below the top and out above the bottom over this distance. */
  feather?: number
  sway?: number
}

/** A leaf falling the way leaves do: sliding from side to side, rocking as it slides, slowly turning. */
export function fallingLeaves(p: FallParams): LeafPlacer {
  const seed = p.seed ?? 1
  const speed = p.speed ?? 0.55
  const wind = p.wind ?? [0.12, 0]
  const size = p.size ?? [0.16, 0.3]
  const H = p.top - p.bottom
  const feather = p.feather ?? 0.6
  const swayAmt = p.sway ?? 1
  return (i, t, s) => {
    const r = (k: number) => hash(i, seed * 13 + k)
    const v = speed * (0.65 + r(1) * 0.7)
    const phase = r(2) * H
    const fall = (((phase + v * t) % H) + H) % H
    const y = p.top - fall
    const w = 1.1 + r(3) * 1.3 // sway frequency
    const A = (0.14 + r(4) * 0.3) * swayAmt
    const ph = r(5) * 6.283
    const swing = Math.sin(w * t + ph)
    // wind carries the leaf sideways as it falls (wrapped with the fall so the loop is seamless per leaf)
    const x = p.center[0] + (r(6) - 0.5) * p.spread[0] + A * swing + wind[0] * (fall / v)
    const z = p.center[2] + (r(7) - 0.5) * p.spread[1] + A * 0.5 * Math.cos(w * 0.7 * t + ph) + wind[1] * (fall / v)
    // slight lift at the ends of each swing
    s.pos.set(x, y + Math.abs(swing) * A * 0.22 + p.center[1], z)
    // rocking: the blade banks into the slide; plus a slow spin about the vertical
    const bank = Math.cos(w * t + ph) * (0.55 + r(8) * 0.5)
    const pitch = -0.15 - r(9) * 0.95 + Math.sin(w * 2 * t + ph * 1.7) * 0.3
    const yaw = r(10) * 6.283 + t * (r(11) - 0.5) * 1.6
    _e.set(pitch, 0, bank, 'YXZ')
    _q.setFromEuler(_e)
    _e.set(0, yaw, 0)
    _q2.setFromEuler(_e)
    s.quat.copy(_q2).multiply(_q)
    // a few tumble end over end
    if (r(12) < 0.22) {
      _e.set(t * (1.6 + r(13) * 2.2) + r(14) * 6, 0, 0)
      _q.setFromEuler(_e)
      s.quat.multiply(_q)
    }
    s.size = size[0] + (size[1] - size[0]) * r(15) ** 1.6
    s.alpha = Math.min(1, fall / feather, (H - fall) / feather)
    s.curl = (0.2 + r(16) * 0.6) * (r(17) < 0.5 ? 1 : -1)
  }
}
