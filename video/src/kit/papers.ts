import * as THREE from 'three'
import { hash } from '../engine/math'
import { gobo } from './plate'
import { makeCanvas } from './textures'

/**
 * The name papers of the game. One side is blank, the other carries a classmate's name, written in the
 * site's display face and shaped by the browser (canvas text, right to left, letters joined). Only names
 * that appear in the author's story are used. Papers bend, cast a soft shadow on the ground, sit in the
 * same moving leaf-shadow light as the paving, and go soft when they leave the focus distance.
 */
export const NAMES = ['حسن', 'أحمد', 'ساري', 'أمير', 'ليلى'] as const

const TILE_W = 640
const TILE_H = 480
const COLS = 3
const ROWS = 2
/** The sheet occupies this part of its tile (the margin leaves room for blur). */
export const SHEET = { w: 0.86, h: 0.8 }

function drawSheet(g: CanvasRenderingContext2D, x: number, y: number, name: string | null, seed: number) {
  const w = TILE_W * SHEET.w
  const h = TILE_H * SHEET.h
  const px = x + (TILE_W - w) / 2
  const py = y + (TILE_H - h) / 2
  g.save()
  g.beginPath()
  g.roundRect(px, py, w, h, 16)
  g.fillStyle = '#fbf5e8'
  g.fill()
  g.clip()
  // paper: faint fibres and a warm edge
  for (let i = 0; i < 220; i++) {
    const fx = px + hash(i, seed) * w
    const fy = py + hash(i, seed + 1) * h
    const a = hash(i, seed + 2) * Math.PI
    const l = 6 + hash(i, seed + 3) * 22
    g.strokeStyle = hash(i, seed + 4) < 0.5 ? 'rgba(150,120,90,0.07)' : 'rgba(255,255,255,0.35)'
    g.lineWidth = 1
    g.beginPath()
    g.moveTo(fx, fy)
    g.lineTo(fx + Math.cos(a) * l, fy + Math.sin(a) * l)
    g.stroke()
  }
  const eg = g.createRadialGradient(px + w / 2, py + h / 2, h * 0.3, px + w / 2, py + h / 2, w * 0.72)
  eg.addColorStop(0, 'rgba(190,150,100,0)')
  eg.addColorStop(1, 'rgba(190,150,100,0.2)')
  g.fillStyle = eg
  g.fillRect(px, py, w, h)
  if (name) {
    g.direction = 'rtl'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.font = `700 ${Math.round(h * 0.5)}px "Rubik Variable"`
    g.fillStyle = '#2a1a10'
    g.fillText(name, px + w / 2, py + h * 0.5)
    // a soft maple underline, like a teacher's marker
    g.strokeStyle = 'rgba(217,84,30,0.85)'
    g.lineWidth = 9
    g.lineCap = 'round'
    g.beginPath()
    g.moveTo(px + w * 0.3, py + h * 0.86)
    g.quadraticCurveTo(px + w * 0.5, py + h * 0.9, px + w * 0.7, py + h * 0.855)
    g.stroke()
  }
  g.restore()
}

let atlas: THREE.Texture | null = null
function paperAtlas(): THREE.Texture {
  if (atlas) return atlas
  const c = makeCanvas(TILE_W * COLS, TILE_H * ROWS)
  const g = c.getContext('2d', { willReadFrequently: true })!
  // premultiplied canvas: keep the paper colour under the transparent margin so blurred mips stay clean
  g.fillStyle = 'rgba(251,245,232,0.004)'
  g.fillRect(0, 0, c.width, c.height)
  NAMES.forEach((n, i) => drawSheet(g, (i % COLS) * TILE_W, Math.floor(i / COLS) * TILE_H, n, 10 + i * 7))
  drawSheet(g, 2 * TILE_W, 1 * TILE_H, null, 99)
  atlas = new THREE.CanvasTexture(c)
  atlas.colorSpace = THREE.SRGBColorSpace
  atlas.premultiplyAlpha = true
  atlas.generateMipmaps = true
  atlas.minFilter = THREE.LinearMipmapLinearFilter
  return atlas
}
/** uv rectangle (x, y, w, h) of a tile; index 5 is the blank side. */
function tileRect(i: number): THREE.Vector4 {
  const col = i % COLS
  const row = Math.floor(i / COLS)
  return new THREE.Vector4(col / COLS, 1 - (row + 1) / ROWS, 1 / COLS, 1 / ROWS)
}

const VERT = /* glsl */ `
uniform float uBend;
uniform float uCorner;
uniform float uWave;
varying vec2 vUv;
varying vec3 vN;
varying vec3 vW;
void main() {
  vec3 p = position;
  // cylinder bend along the long side, a lifted corner, and a travelling ripple while in the air
  float x = p.x, y = p.y;
  float cz = uBend * (x * x * 1.6 - 0.12);
  float corner = uCorner * smoothstep(0.1, 0.75, (x + 0.5) * 0.5 + (y + 0.36) * 0.7) * 0.5;
  float wave = uWave * sin(x * 7.0 + y * 3.0) * 0.035;
  p.z += cz + corner + wave;
  vec3 n = normalize(vec3(-uBend * 3.2 * x - uWave * cos(x * 7.0 + y * 3.0) * 0.245 - uCorner * 0.25, -uCorner * 0.35 - uWave * cos(x * 7.0 + y * 3.0) * 0.105, 1.0));
  vec4 w = modelMatrix * vec4(p, 1.0);
  vW = w.xyz;
  vN = normalize(mat3(modelMatrix) * n);
  vUv = uv;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`
const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D map;
uniform sampler2D gobo;
uniform vec4 uFront;
uniform vec4 uBack;
uniform float uBlur;
uniform float uAlpha;
uniform vec3 uLightDir;
uniform vec3 uKey;
uniform vec3 uAmbSky;
uniform vec3 uAmbGround;
uniform vec2 uGoboShift;
uniform float uDapple;
varying vec2 vUv;
varying vec3 vN;
varying vec3 vW;
void main() {
  vec4 r = gl_FrontFacing ? uFront : uBack;
  vec2 uv = vUv;
  if (!gl_FrontFacing) uv.x = 1.0 - uv.x;
  // stay inside the tile when reading blurred mips
  vec2 tuv = r.xy + clamp(uv, 0.02, 0.98) * r.zw;
  vec4 tx = texture2D(map, tuv, uBlur);
  float a = clamp(tx.a * 1.02, 0.0, 1.0);
  vec3 base = tx.rgb / max(tx.a, 0.004);
  a *= uAlpha;
  if (a < 0.004) discard;
  vec3 N = normalize(vN);
  if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vW);
  float ndl = dot(N, uLightDir);
  float diff = clamp(ndl * 0.5 + 0.5, 0.0, 1.0);
  float back = clamp(-ndl, 0.0, 1.0);
  vec3 amb = mix(uAmbGround, uAmbSky, N.y * 0.5 + 0.5);
  vec2 g = vW.xz * 0.16 + uGoboShift;
  float ga = texture2D(gobo, g).r;
  float gb = texture2D(gobo, g * 0.47 + vec2(0.3, 0.6) - uGoboShift * 0.35).r;
  float light = mix(1.0, smoothstep(0.3, 0.85, ga * 0.62 + gb * 0.38), uDapple);
  vec3 col = base * (amb + uKey * (diff * (0.35 + 0.65 * light)) + uKey * back * 0.38);
  gl_FragColor = vec4(col * a, a);
}
`

let shadowTex: THREE.Texture | null = null
function shadowTexture(): THREE.Texture {
  if (shadowTex) return shadowTex
  const c = makeCanvas(256, 256)
  const g = c.getContext('2d', { willReadFrequently: true })!
  g.filter = 'blur(22px)'
  g.fillStyle = '#000'
  g.beginPath()
  g.roundRect(58, 78, 140, 100, 14)
  g.fill()
  shadowTex = new THREE.CanvasTexture(c)
  shadowTex.generateMipmaps = true
  shadowTex.minFilter = THREE.LinearMipmapLinearFilter
  return shadowTex
}

export interface PaperLight {
  dir: THREE.Vector3
  key: THREE.Color
  sky: THREE.Color
  ground: THREE.Color
}

export class Paper {
  mesh: THREE.Mesh
  shadow: THREE.Mesh
  uniforms: Record<string, THREE.IUniform>
  pos = new THREE.Vector3()
  quat = new THREE.Quaternion()
  /** World width of the sheet. */
  size: number
  bend = 0
  corner = 0
  wave = 0
  alpha = 1
  extraBlur = 0
  /** 0…1: how much of the ground's dappled light falls on it. */
  dapple = 1

  constructor(nameIndex: number, size: number, shared: Record<string, THREE.IUniform>) {
    this.size = size
    this.uniforms = {
      ...shared,
      map: { value: paperAtlas() },
      gobo: { value: gobo() },
      uFront: { value: tileRect(nameIndex) },
      uBack: { value: tileRect(5) },
      uBlur: { value: 0 },
      uAlpha: { value: 1 },
      uBend: { value: 0 },
      uCorner: { value: 0 },
      uWave: { value: 0 },
      uDapple: { value: 1 },
    }
    const geo = new THREE.PlaneGeometry(1, TILE_H / TILE_W, 14, 10)
    const mat = new THREE.ShaderMaterial({ uniforms: this.uniforms, vertexShader: VERT, fragmentShader: FRAG, transparent: true, premultipliedAlpha: true, side: THREE.DoubleSide, depthWrite: true, depthTest: true })
    this.mesh = new THREE.Mesh(geo, mat)
    this.mesh.renderOrder = 3
    this.mesh.frustumCulled = false
    const sm = new THREE.MeshBasicMaterial({ map: shadowTexture(), color: 0x1a0c05, transparent: true, opacity: 0.5, depthWrite: false, depthTest: true })
    const sg = new THREE.PlaneGeometry(1, 1)
    sg.rotateX(-Math.PI / 2)
    this.shadow = new THREE.Mesh(sg, sm)
    this.shadow.renderOrder = 2
    this.shadow.frustumCulled = false
  }
}

const _fwd = new THREE.Vector3()
const _cam = new THREE.Vector3()
const _up = new THREE.Vector3()
const _e = new THREE.Euler()

export class PaperSet {
  group = new THREE.Group()
  papers: Paper[] = []
  shared: Record<string, THREE.IUniform>
  focus = 4
  focusRange = 1.6
  /** Height of the ground the shadows fall on. */
  groundY = 0
  shadows = true

  constructor(light: PaperLight) {
    this.shared = {
      uLightDir: { value: light.dir },
      uKey: { value: light.key },
      uAmbSky: { value: light.sky },
      uAmbGround: { value: light.ground },
      uGoboShift: { value: new THREE.Vector2() },
    }
  }

  add(nameIndex: number, size = 0.5): Paper {
    const p = new Paper(nameIndex, size / SHEET.w, this.shared)
    this.papers.push(p)
    this.group.add(p.mesh, p.shadow)
    return p
  }

  /** Call after setting every paper's pos/quat/bend for this frame. */
  update(t: number, camera: THREE.Camera) {
    ;(this.shared.uGoboShift.value as THREE.Vector2).set(Math.sin(t * 0.33) * 0.025 + t * 0.006, Math.cos(t * 0.27) * 0.02)
    camera.getWorldDirection(_fwd)
    camera.getWorldPosition(_cam)
    const L = this.shared.uLightDir.value as THREE.Vector3
    for (const p of this.papers) {
      p.mesh.position.copy(p.pos)
      p.mesh.quaternion.copy(p.quat)
      p.mesh.scale.setScalar(p.size)
      const d = (p.pos.x - _cam.x) * _fwd.x + (p.pos.y - _cam.y) * _fwd.y + (p.pos.z - _cam.z) * _fwd.z
      let blur = Math.min(5, Math.abs(d - this.focus) / this.focusRange)
      if (d < this.focus) blur = Math.min(6, blur * 1.4)
      blur += p.extraBlur
      const u = p.uniforms
      u.uBlur.value = blur
      u.uAlpha.value = p.alpha
      u.uBend.value = p.bend
      u.uCorner.value = p.corner
      u.uWave.value = p.wave
      u.uDapple.value = p.dapple
      const mat = p.mesh.material as THREE.ShaderMaterial
      mat.depthWrite = blur < 0.9 && p.alpha > 0.95
      p.mesh.visible = p.alpha > 0.003 && d > 0.1
      // shadow on the ground, sliding away from the light as the sheet rises
      const h = Math.max(0, p.pos.y - this.groundY)
      const sh = p.shadow
      sh.visible = this.shadows && p.mesh.visible && h < 2.2
      if (sh.visible) {
        sh.position.set(p.pos.x - (L.x / L.y) * h, this.groundY + 0.004, p.pos.z - (L.z / L.y) * h)
        // yaw of the sheet
        _up.set(1, 0, 0).applyQuaternion(p.quat)
        sh.rotation.set(0, Math.atan2(-_up.z, _up.x), 0)
        const grow = 1 + h * 1.3
        sh.scale.set(p.size * 1.62 * grow, 1, p.size * 1.62 * grow)
        ;(sh.material as THREE.MeshBasicMaterial).opacity = (0.62 * p.alpha) / (1 + h * 4.5)
      }
    }
  }
}

/** Orientation of a sheet lying on the ground: `faceUp` 0 = name down, 1 = name up; `yaw` turns it. */
export function lyingQuat(out: THREE.Quaternion, yaw: number, flip: number, roll = 0, flipAxis: 'x' | 'y' = 'x'): THREE.Quaternion {
  // start flat with the blank side up (name facing the ground), then rotate about the chosen in-plane axis
  const base = new THREE.Quaternion().setFromEuler(_e.set(Math.PI / 2, 0, 0)) // +Z (name) → −Y
  const yawQ = new THREE.Quaternion().setFromEuler(_e.set(0, yaw, 0))
  const axis = flipAxis === 'x' ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0)
  const flipQ = new THREE.Quaternion().setFromAxisAngle(axis, flip * Math.PI)
  const rollQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), roll)
  return out.copy(yawQ).multiply(base).multiply(flipQ).multiply(rollQ)
}
