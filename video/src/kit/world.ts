import * as THREE from 'three'
import { hash } from '../engine/math'
import { gobo } from './plate'
import { makeBokehTexture, makeGlowTexture, makeShaftTexture, makeStonesTexture } from './textures'

/** Pieces of the yard, built in code: paved ground with moving leaf shadows, sun shafts, dust in the light. */

/* ── ground ───────────────────────────────────────────────────────────────── */

const GROUND_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D stones;
uniform sampler2D gobo;
uniform vec2 uGoboShift;
uniform float uFocus;
uniform float uFocusRange;
uniform vec3 uSun;
uniform vec3 uShade;
uniform vec3 uHaze;
uniform float uHazeStart;
uniform float uHazeEnd;
uniform float uTile;
uniform vec4 uPool; // xz centre, radius, strength of a warm pool of light
varying vec3 vW;
varying float vDepth;
float gh(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float gn(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(gh(i), gh(i + vec2(1.0, 0.0)), f.x), mix(gh(i + vec2(0.0, 1.0)), gh(i + vec2(1.0, 1.0)), f.x), f.y);
}
void main() {
  float blur = clamp(abs(vDepth - uFocus) / uFocusRange, 0.0, 5.0);
  if (vDepth < uFocus) blur = min(6.0, blur * 1.5);
  vec3 base = texture2D(stones, vW.xz * uTile, blur).rgb;
  // close to the lens the stone needs its own grain: pores and speckle, fading out with blur and distance
  float sharp = (1.0 - clamp(blur / 2.0, 0.0, 1.0)) * (1.0 - smoothstep(2.0, 7.0, vDepth));
  float grain = gn(vW.xz * 34.0) * 0.5 + gn(vW.xz * 88.0) * 0.3 + gn(vW.xz * 210.0) * 0.2;
  base *= 1.0 + (grain - 0.5) * 0.3 * sharp;
  // broad, slow variation: no two patches of yard are the same colour
  base *= 0.9 + 0.2 * gn(vW.xz * 0.9 + 3.7);
  vec2 g = vW.xz * 0.16 + uGoboShift;
  float a = texture2D(gobo, g, blur * 0.5).r;
  float b = texture2D(gobo, g * 0.47 + vec2(0.3, 0.6) - uGoboShift * 0.35, blur * 0.5).r;
  float light = smoothstep(0.28, 0.8, a * 0.62 + b * 0.38);
  // the tree's larger shadow: whole areas of sun and shade
  light *= 0.55 + 0.45 * smoothstep(0.3, 0.7, gn(vW.xz * 0.33 + uGoboShift * 2.0 + 1.3));
  vec3 lit = mix(uShade, uSun, light);
  float pool = exp(-dot(vW.xz - uPool.xy, vW.xz - uPool.xy) / (uPool.z * uPool.z)) * uPool.w;
  vec3 col = base * (lit + uSun * pool);
  float haze = smoothstep(uHazeStart, uHazeEnd, vDepth);
  col = mix(col, uHaze, haze);
  gl_FragColor = vec4(col, 1.0 - smoothstep(uHazeEnd * 0.9, uHazeEnd * 1.25, vDepth));
}
`

export class Ground {
  mesh: THREE.Mesh
  uniforms: Record<string, THREE.IUniform>
  constructor(size = 60) {
    this.uniforms = {
      stones: { value: makeStonesTexture() },
      gobo: { value: gobo() },
      uGoboShift: { value: new THREE.Vector2() },
      uFocus: { value: 4 },
      uFocusRange: { value: 1.6 },
      uSun: { value: new THREE.Color(1.85, 1.24, 0.72) },
      uShade: { value: new THREE.Color(0.46, 0.31, 0.27) },
      uHaze: { value: new THREE.Color(0.95, 0.6, 0.3) },
      uHazeStart: { value: 8 },
      uHazeEnd: { value: 22 },
      uTile: { value: 0.3 },
      uPool: { value: new THREE.Vector4(0, 0, 1, 0) },
    }
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: /* glsl */ `
        varying vec3 vW; varying float vDepth;
        void main() {
          vec4 w = modelMatrix * vec4(position, 1.0);
          vW = w.xyz;
          vec4 v = viewMatrix * w;
          vDepth = -v.z;
          gl_Position = projectionMatrix * v;
        }`,
      fragmentShader: GROUND_FRAG,
      transparent: true,
      depthWrite: true,
    })
    const geo = new THREE.PlaneGeometry(size, size, 1, 1)
    geo.rotateX(-Math.PI / 2)
    this.mesh = new THREE.Mesh(geo, mat)
    this.mesh.renderOrder = 1
    this.mesh.frustumCulled = false
  }
  /** Leaf shadows drift as the branches move. */
  update(t: number, focus: number, range = 1.6) {
    ;(this.uniforms.uGoboShift.value as THREE.Vector2).set(Math.sin(t * 0.33) * 0.025 + t * 0.006, Math.cos(t * 0.27) * 0.02)
    this.uniforms.uFocus.value = focus
    this.uniforms.uFocusRange.value = range
  }
}

/* ── soft sprites: glows, shafts, dust ────────────────────────────────────── */

let glowTex: THREE.Texture | null = null
let bokehTex: THREE.Texture | null = null
let shaftTex: THREE.Texture | null = null
export const glowTexture = () => (glowTex ??= makeGlowTexture())
export const bokehTexture = () => (bokehTex ??= makeBokehTexture())
export const shaftTexture = () => (shaftTex ??= makeShaftTexture())

/** An additive glow card that always faces the camera. */
export function makeGlow(color: THREE.ColorRepresentation, size: number, opacity = 1): THREE.Sprite {
  const m = new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false })
  const s = new THREE.Sprite(m)
  s.scale.setScalar(size)
  s.renderOrder = 20
  return s
}

/** Slanting shafts of low sun. They breathe slowly and independently. */
export class Shafts {
  group = new THREE.Group()
  private mats: THREE.MeshBasicMaterial[] = []
  constructor(
    count: number,
    opts: { width?: number; length?: number; spread?: number; angle?: number; color?: THREE.ColorRepresentation; seed?: number; depthTest?: boolean } = {},
  ) {
    const { width = 0.9, length = 7, spread = 6, angle = 0.5, color = 0xffc98a, seed = 2, depthTest = false } = opts
    for (let i = 0; i < count; i++) {
      const m = new THREE.MeshBasicMaterial({ map: shaftTexture(), color, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false, depthTest, side: THREE.DoubleSide })
      const w = width * (0.5 + hash(i, seed) * 1.2)
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, length), m)
      mesh.position.set((hash(i, seed + 1) - 0.5) * spread, 0, (hash(i, seed + 2) - 0.5) * 1.5)
      mesh.rotation.z = angle + (hash(i, seed + 3) - 0.5) * 0.12
      mesh.renderOrder = 18
      this.mats.push(m)
      this.group.add(mesh)
    }
  }
  update(t: number, strength = 1) {
    this.mats.forEach((m, i) => {
      m.opacity = strength * (0.1 + 0.11 * (0.5 + 0.5 * Math.sin(t * (0.35 + hash(i, 9) * 0.5) + hash(i, 10) * 6.28)))
    })
  }
}

/** Dust and pollen drifting in the light: tiny out-of-focus discs. */
export class Dust {
  points: THREE.Points
  private base: Float32Array
  private count: number
  private box: [number, number, number]
  private center: [number, number, number]
  constructor(count: number, box: [number, number, number], center: [number, number, number] = [0, 1, 0], size = 0.05, color: THREE.ColorRepresentation = 0xffd9a0, opacity = 0.5, seed = 4) {
    this.count = count
    this.box = box
    this.center = center
    this.base = new Float32Array(count * 4)
    for (let i = 0; i < count; i++) {
      this.base[i * 4] = hash(i, seed)
      this.base[i * 4 + 1] = hash(i, seed + 1)
      this.base[i * 4 + 2] = hash(i, seed + 2)
      this.base[i * 4 + 3] = hash(i, seed + 3)
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3))
    const mat = new THREE.PointsMaterial({ map: bokehTexture(), color, size, sizeAttenuation: true, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: true })
    this.points = new THREE.Points(geo, mat)
    this.points.frustumCulled = false
    this.points.renderOrder = 19
  }
  update(t: number, wind: [number, number, number] = [0.05, 0.02, 0]) {
    const pos = this.points.geometry.getAttribute('position') as THREE.BufferAttribute
    const [bx, by, bz] = this.box
    const wrap = (v: number) => ((v % 1) + 1) % 1
    for (let i = 0; i < this.count; i++) {
      const r0 = this.base[i * 4]
      const r1 = this.base[i * 4 + 1]
      const r2 = this.base[i * 4 + 2]
      const r3 = this.base[i * 4 + 3]
      const x = wrap(r0 + (wind[0] * t) / bx + Math.sin(t * (0.2 + r3 * 0.3) + r1 * 6.28) * 0.02)
      const y = wrap(r1 + (wind[1] * t) / by + Math.sin(t * (0.15 + r0 * 0.3) + r2 * 6.28) * 0.03)
      const z = wrap(r2 + (wind[2] * t) / bz)
      pos.setXYZ(i, this.center[0] + (x - 0.5) * bx, this.center[1] + (y - 0.5) * by, this.center[2] + (z - 0.5) * bz)
    }
    pos.needsUpdate = true
  }
}

/** A far backdrop card (an out-of-focus picture) that fills the view behind a set. */
export function makeBackdrop(tex: THREE.Texture, width: number, height: number, exposure = 1): THREE.Mesh {
  const m = new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(exposure, exposure, exposure), depthWrite: false, depthTest: false, fog: false })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), m)
  mesh.renderOrder = -10
  mesh.frustumCulled = false
  return mesh
}

/** A soft round contact shadow to lay on the ground under a figure. */
export function blobShadow(opacity = 0.6): THREE.Mesh {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d', { willReadFrequently: true })!
  const grd = g.createRadialGradient(64, 64, 4, 64, 64, 62)
  grd.addColorStop(0, 'rgba(0,0,0,0.75)')
  grd.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, 128, 128)
  const geo = new THREE.PlaneGeometry(1, 1)
  geo.rotateX(-Math.PI / 2)
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), color: 0x1a0c05, transparent: true, opacity, depthWrite: false }))
  m.renderOrder = 2
  return m
}

/** A thin bright ring (additive), for the "hop!" of Sari's stick. */
export function makeRing(): THREE.Mesh {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d', { willReadFrequently: true })!
  const grd = g.createRadialGradient(128, 128, 60, 128, 128, 126)
  grd.addColorStop(0, 'rgba(255,255,255,0)')
  grd.addColorStop(0.62, 'rgba(255,255,255,0.12)')
  grd.addColorStop(0.84, 'rgba(255,255,255,1)')
  grd.addColorStop(0.93, 'rgba(255,255,255,0.35)')
  grd.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, 256, 256)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  const geo = new THREE.PlaneGeometry(1, 1)
  geo.rotateX(-Math.PI / 2)
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: t, color: 0xffc45e, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }))
  m.renderOrder = 6
  return m
}

/** Sparks that rise and twinkle: additive points whose brightness is set per point each frame. */
export class Sparks {
  points: THREE.Points
  constructor(public count: number, size = 0.06) {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3))
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3), 3))
    this.points = new THREE.Points(geo, new THREE.PointsMaterial({ map: glowTexture(), size, sizeAttenuation: true, transparent: true, vertexColors: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false }))
    this.points.frustumCulled = false
    this.points.renderOrder = 21
  }
  /** place(i) returns [x, y, z, brightness]. */
  update(place: (i: number) => [number, number, number, number], tint: [number, number, number] = [1, 0.78, 0.4]) {
    const pos = this.points.geometry.getAttribute('position') as THREE.BufferAttribute
    const col = this.points.geometry.getAttribute('color') as THREE.BufferAttribute
    for (let i = 0; i < this.count; i++) {
      const [x, y, z, b] = place(i)
      pos.setXYZ(i, x, y, z)
      col.setXYZ(i, tint[0] * b, tint[1] * b, tint[2] * b)
    }
    pos.needsUpdate = true
    col.needsUpdate = true
  }
}
