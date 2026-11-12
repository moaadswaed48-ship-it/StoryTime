import { memo, useEffect, useMemo, type RefObject } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { MAPLE, MAPLE_VEINS } from '@/features/tree/art'
import { dirSign } from '@/i18n/locale'
import { clamp } from '@/lib/clamp'
import { CARDS, FOV, layout, pose, type Layout, type Pose } from './layout'
import { Paintings } from './paintings'

/** What the stage (DOM, scroll) and the scene (WebGL) share. Fast values: written every frame, never React state. */
export interface Rig {
  /** Smoothed card position, 0 … CARDS − 1 (the stage's ticker owns it). */
  pos: number
  /** Cards per second. */
  vel: number
  /** 1 → 0 as the stage rises into place. */
  intro: number
  /** Where the finger or the mouse is, −1 … 1 from the middle of the stage (0 when nobody is touching). */
  tx: number
  ty: number
  card: number
  low: boolean
  /** The scene has a picture for the card in front. */
  onReady: (() => void) | null
  /** Numbers for QA: draw calls and textures of the last frame. */
  stats: { calls: number; textures: number; small: number; full: number; leaves: number }
}

export const newRig = (): Rig => ({ pos: 0, vel: 0, intro: 0, tx: 0, ty: 0, card: 0, low: false, onReady: null, stats: { calls: 0, textures: 0, small: 0, full: 0, leaves: 0 } })

// ── A painting on paper: rounded corners and a thin warm border, drawn in the shader so every edge stays crisp ──
const CARD_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`
const BOX = /* glsl */ `
float box(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
`
const CARD_FRAG = /* glsl */ `
uniform sampler2D uMap;
uniform float uHas;
uniform vec2 uSize;
uniform vec2 uPic;
uniform float uRadius;
uniform float uOpacity;
uniform float uDim;
uniform float uSheen;
uniform vec3 uFog;
uniform vec3 uPaper;
varying vec2 vUv;
${BOX}
void main() {
  vec2 p = (vUv - 0.5) * uSize;
  float outer = box(p, uSize * 0.5, uRadius + (uSize.x - uPic.x) * 0.5);
  float inner = box(p, uPic * 0.5, uRadius);
  float aa = max(fwidth(outer), 0.0001);
  float a = 1.0 - smoothstep(-aa * 1.5, 0.0, outer);
  if (a < 0.004) discard;
  vec2 uv = p / uPic + 0.5;
  vec3 pic = mix(uPaper * 0.82, texture2D(uMap, uv).rgb, uHas);
  // a breath of light across the painting that follows the finger
  float band = uv.x * 0.8 + (1.0 - uv.y) * 0.45 - uSheen;
  pic += vec3(1.0, 0.93, 0.82) * 0.055 * exp(-band * band * 14.0);
  vec3 col = mix(pic, uPaper, smoothstep(-aa * 0.75, aa * 0.75, inner));
  col = mix(col, uFog, uDim);
  gl_FragColor = vec4(col, a * uOpacity);
  #include <colorspace_fragment>
}
`
// ── Its shadow: one soft quad, no shadow map ──
const SHADOW_FRAG = /* glsl */ `
uniform vec2 uSize;
uniform vec2 uCard;
uniform float uBlur;
uniform float uOpacity;
varying vec2 vUv;
${BOX}
void main() {
  vec2 p = (vUv - 0.5) * uSize;
  float d = box(p, uCard * 0.5, uBlur * 0.5);
  float a = 1.0 - smoothstep(-uBlur, uBlur, d);
  gl_FragColor = vec4(0.035, 0.018, 0.008, a * a * uOpacity);
}
`

// ── Maple leaves: every leaf is placed on the GPU from its seed and the clock, so the CPU does nothing per leaf ──
const LEAF_VERT = /* glsl */ `
attribute vec4 aSeed;
attribute vec3 aTint;
uniform float uTime;
uniform float uTravel;
uniform float uD;
uniform vec2 uHalf;
uniform vec2 uZ;
uniform float uLeaf;
uniform vec2 uPush;
varying vec2 vUv;
varying vec3 vTint;
varying vec3 vN;
varying float vAlpha;
varying float vBlur;
varying float vFog;
mat3 rx(float a) { float c = cos(a), s = sin(a); return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c); }
mat3 ry(float a) { float c = cos(a), s = sin(a); return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c); }
mat3 rz(float a) { float c = cos(a), s = sin(a); return mat3(c, s, 0.0, -s, c, 0.0, 0.0, 0.0, 1.0); }
void main() {
  float range = uZ.y - uZ.x;
  // scrolling carries the leaves toward the viewer, like the cards
  float tz = fract(aSeed.z + uTravel / range);
  float z = uZ.x + tz * range;
  float k = (uD - z) / uD;
  float speed = 0.028 + 0.03 * aSeed.w;
  float fall = fract(aSeed.y + uTime * speed);
  float yy = 1.0 - 2.0 * fall;
  float ph = aSeed.x * 43.0 + aSeed.w * 17.0;
  float sway = sin(uTime * (0.55 + aSeed.w * 0.7) + ph) * 0.07 + sin(uTime * 0.23 + ph * 1.7) * 0.05;
  vec3 c = vec3((aSeed.x * 2.0 - 1.0 + sway + fall * 0.22) * uHalf.x * k * 1.12, yy * uHalf.y * k * 1.14, z);
  // the nearer a leaf, the more it gets out of the finger's way
  c.xy += uPush * (0.35 + 1.4 * tz);
  float size = uLeaf * (0.62 + 0.9 * fract(aSeed.w * 7.31));
  float t = uTime * (0.6 + aSeed.x * 0.9);
  mat3 R = rz(ph + t * 0.35 + sway * 4.0) * ry(t * 0.9 + ph) * rx(sin(t * 0.7 + ph) * 0.9 + 0.5);
  vec3 q = R * vec3(position.xy * size, 0.0);
  vN = R * vec3(0.0, 0.0, 1.0);
  vUv = uv;
  vTint = aTint;
  // soft where a leaf wraps around (top, bottom, far end, lens)
  float edge = smoothstep(0.0, 0.08, fall) * (1.0 - smoothstep(0.9, 1.0, fall));
  float depth = smoothstep(0.0, 0.14, tz) * (1.0 - smoothstep(0.84, 1.0, tz));
  float near = max(z, 0.0) / max(uZ.y, 1.0);
  vAlpha = edge * depth * (1.0 - 0.45 * near);
  vBlur = near * 3.2 + max(-z, 0.0) / max(-uZ.x, 1.0) * 0.6;
  vFog = clamp(-z / max(-uZ.x, 1.0), 0.0, 1.0) * 0.82;
  gl_Position = projectionMatrix * viewMatrix * vec4(c + q, 1.0);
}
`
const LEAF_FRAG = /* glsl */ `
uniform sampler2D uTex;
uniform vec3 uFog;
varying vec2 vUv;
varying vec3 vTint;
varying vec3 vN;
varying float vAlpha;
varying float vBlur;
varying float vFog;
void main() {
  vec4 tx = texture2D(uTex, vUv, vBlur);
  float a = tx.a * vAlpha;
  if (a < 0.01) discard;
  vec3 N = normalize(vN);
  float facing = abs(N.z);
  float lit = 0.5 + 0.5 * abs(dot(N, normalize(vec3(-0.35, 0.62, 0.7))));
  vec3 col = vTint * tx.rgb * lit;
  // light through the blade when it turns edge-on
  col += vTint * vTint * 0.35 * (1.0 - facing);
  col = mix(col, uFog, vFog);
  gl_FragColor = vec4(col, a);
  #include <colorspace_fragment>
}
`
/** Autumn palette (the film's): maple first. */
const AUTUMN = ['#e2531a', '#f08a1c', '#f6b529', '#d9541e', '#c9321a', '#f4a35e', '#e9a01f']

/** A grey-scale maple leaf with veins on a transparent tile; each leaf multiplies it by its own colour. */
function leafTexture(): THREE.CanvasTexture {
  const S = 256
  const cv = document.createElement('canvas')
  cv.width = cv.height = S
  const ctx = cv.getContext('2d')
  if (ctx) {
    ctx.translate(S / 2, S / 2 + 2)
    ctx.scale(S / 128, S / 128)
    const fill = ctx.createLinearGradient(-20, -48, 20, 46)
    fill.addColorStop(0, '#ffffff')
    fill.addColorStop(1, '#b9b9b9')
    ctx.fillStyle = fill
    ctx.fill(new Path2D(MAPLE))
    ctx.strokeStyle = 'rgba(0,0,0,0.26)'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.stroke(new Path2D(MAPLE_VEINS))
  }
  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.generateMipmaps = true
  tex.minFilter = THREE.LinearMipmapLinearFilter
  return tex
}

/** Small repeatable random numbers (the leaves must not reshuffle when the scene remounts). */
const rnd = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

interface Card {
  group: THREE.Group
  mat: THREE.ShaderMaterial
  shadow: THREE.ShaderMaterial
  face: THREE.Mesh
  under: THREE.Mesh
}

function build(count: number) {
  const root = new THREE.Group()
  const quad = new THREE.PlaneGeometry(1, 1)
  const fog = new THREE.Color('#24140b')
  const cards: Card[] = []
  for (let i = 0; i < CARDS; i++) {
    const mat = new THREE.ShaderMaterial({
      vertexShader: CARD_VERT,
      fragmentShader: CARD_FRAG,
      transparent: true,
      toneMapped: false,
      uniforms: {
        uMap: { value: null },
        uHas: { value: 0 },
        uSize: { value: new THREE.Vector2(1, 1) },
        uPic: { value: new THREE.Vector2(1, 1) },
        uRadius: { value: 12 },
        uOpacity: { value: 1 },
        uDim: { value: 0 },
        uSheen: { value: 0 },
        uFog: { value: fog },
        uPaper: { value: new THREE.Color('#f6ecdc') },
      },
    })
    const shadow = new THREE.ShaderMaterial({
      vertexShader: CARD_VERT,
      fragmentShader: SHADOW_FRAG,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      uniforms: { uSize: { value: new THREE.Vector2(1, 1) }, uCard: { value: new THREE.Vector2(1, 1) }, uBlur: { value: 20 }, uOpacity: { value: 0.5 } },
    })
    const face = new THREE.Mesh(quad, mat)
    const under = new THREE.Mesh(quad, shadow)
    const group = new THREE.Group()
    group.add(under, face)
    group.visible = false
    root.add(group)
    cards.push({ group, mat, shadow, face, under })
  }

  const geo = new THREE.InstancedBufferGeometry()
  geo.index = quad.index
  geo.setAttribute('position', quad.getAttribute('position'))
  geo.setAttribute('uv', quad.getAttribute('uv'))
  const seed = new Float32Array(count * 4)
  const tint = new Float32Array(count * 3)
  const c = new THREE.Color()
  for (let i = 0; i < count; i++) {
    for (let k = 0; k < 4; k++) seed[i * 4 + k] = rnd(i * 4 + k + 1)
    c.set(AUTUMN[Math.floor(rnd(i + 900) * AUTUMN.length)])
    tint.set([c.r, c.g, c.b], i * 3)
  }
  geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4))
  geo.setAttribute('aTint', new THREE.InstancedBufferAttribute(tint, 3))
  geo.instanceCount = count
  const tex = leafTexture()
  const leafMat = new THREE.ShaderMaterial({
    vertexShader: LEAF_VERT,
    fragmentShader: LEAF_FRAG,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
    uniforms: {
      uTex: { value: tex },
      uTime: { value: 0 },
      uTravel: { value: 0 },
      uD: { value: 1000 },
      uHalf: { value: new THREE.Vector2(1, 1) },
      uZ: { value: new THREE.Vector2(-1, 1) },
      uLeaf: { value: 30 },
      uPush: { value: new THREE.Vector2() },
      uFog: { value: fog },
    },
  })
  const leaves = new THREE.Mesh(geo, leafMat)
  leaves.frustumCulled = false
  leaves.renderOrder = 10 // after the cards: their depth decides which leaves pass behind a painting
  root.add(leaves)

  const dispose = () => {
    quad.dispose()
    geo.dispose()
    tex.dispose()
    leafMat.dispose()
    for (const card of cards) {
      card.mat.dispose()
      card.shadow.dispose()
    }
  }
  return { root, cards, leafMat, dispose }
}

/**
 * The paintings as cards hanging in a warm dark: the one in front is whole and sharp, the next ones wait above
 * and behind it, the last one drifts past the viewer. Maple leaves fall between them. Everything is derived
 * from `rig.pos` (the scroll, already eased) and the finger, so a frame can be drawn in any order.
 */
export const Scene = memo(function Scene({ rig }: { rig: RefObject<Rig> }) {
  const gl = useThree((s) => s.gl)
  const size = useThree((s) => s.size)
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const small = size.width < 768 || window.matchMedia('(pointer: coarse)').matches
  const count = rig.current.low ? 24 : small ? 44 : 72
  const world = useMemo(() => build(count), [count])
  const paintings = useMemo(() => new Paintings(gl), [gl])
  const L = useMemo<Layout>(() => layout(size.width, size.height, dirSign), [size.width, size.height])
  const fast = useMemo(() => ({ t: 0, px: 0, py: 0, sway: 0, ready: false, p: {} as Pose, look: new THREE.Vector3() }), [])

  useEffect(() => () => world.dispose(), [world])
  useEffect(() => () => paintings.dispose(), [paintings])
  useEffect(() => {
    rig.current.stats.leaves = count
  }, [rig, count])

  useEffect(() => {
    camera.fov = FOV
    camera.near = L.D * 0.08
    camera.far = L.D * 3
    camera.updateProjectionMatrix()
    const pad = L.border
    for (const card of world.cards) {
      const u = card.mat.uniforms
      u.uSize.value.set(L.W + pad * 2, L.H + pad * 2)
      u.uPic.value.set(L.W, L.H)
      u.uRadius.value = L.radius
      card.face.scale.set(L.W + pad * 2, L.H + pad * 2, 1)
      const s = card.shadow.uniforms
      const blur = L.H * 0.17
      s.uSize.value.set(L.W + blur * 4, L.H + blur * 4)
      s.uCard.value.set(L.W * 0.97, L.H * 0.94)
      s.uBlur.value = blur
      card.under.scale.set(L.W + blur * 4, L.H + blur * 4, 1)
      card.under.position.set(0, -L.H * 0.085, -2)
    }
    const m = world.leafMat.uniforms
    m.uD.value = L.D
    m.uHalf.value.set(L.w / 2, L.h / 2)
    m.uZ.value.set(-3.1 * L.gap, 0.8 * L.gap)
    m.uLeaf.value = clamp(0.08 * L.w, 28, 46)
  }, [L, camera, world])

  useFrame((state, delta) => {
    const r = rig.current
    const dt = Math.min(delta, 0.05)
    fast.t += dt
    paintings.focus(r.card)

    // The finger: a few degrees of camera, eased.
    const k = 1 - Math.exp(-dt * 5)
    fast.px += (r.tx - fast.px) * k
    fast.py += (r.ty - fast.py) * k
    fast.sway += (clamp(r.vel, -4, 4) - fast.sway) * (1 - Math.exp(-dt * 6))
    camera.position.set(fast.px * L.D * 0.055, -fast.py * L.D * 0.035, L.D)
    camera.lookAt(fast.look.set(0, 0, -L.gap * 0.7))

    const at = r.pos - r.intro * 0.85
    for (let i = 0; i < CARDS; i++) {
      const card = world.cards[i]
      const d = i - at
      if (d < -1.02 || d > 3.72) {
        card.group.visible = false
        continue
      }
      const side = (i % 2 === 0 ? 1 : -1) * dirSign
      const p = pose(d, side, L, fast.p)
      const front = clamp(1 - Math.abs(d), 0, 1)
      // The card in front breathes a little and turns toward the finger; a fast scroll tips the pages back.
      const bob = Math.sin(fast.t * 0.9 + i) * front
      card.group.position.set(p.x, p.y + bob * L.H * 0.012, p.z)
      card.group.rotation.set(p.rx + fast.py * 0.05 * front - fast.sway * 0.022, p.ry + fast.px * 0.085 * front, p.rz + Math.sin(fast.t * 0.6 + i * 2) * 0.006 * front)
      card.group.visible = p.alpha > 0.004
      const u = card.mat.uniforms
      const tex = paintings.get(i)
      if (u.uMap.value !== tex) {
        u.uMap.value = tex
        u.uHas.value = tex ? 1 : 0
      }
      u.uOpacity.value = p.alpha
      u.uDim.value = p.dim
      u.uSheen.value = 0.62 + fast.px * 0.5 - d * 0.7
      // A card that is fading must not hide the leaves behind it.
      card.mat.depthWrite = p.alpha > 0.96
      card.shadow.uniforms.uOpacity.value = 0.62 * p.alpha * (1 - p.dim * 0.7)
    }

    const m = world.leafMat.uniforms
    m.uTime.value = fast.t
    m.uTravel.value = at * L.gap * 0.55
    m.uPush.value.set(-fast.px * L.w * 0.02, fast.py * L.h * 0.012)

    if (!fast.ready && paintings.get(clamp(Math.round(r.pos), 0, CARDS - 1))) {
      fast.ready = true
      r.onReady?.()
    }
    const info = state.gl.info
    r.stats.calls = info.render.calls
    r.stats.textures = info.memory.textures
    const n = paintings.count()
    r.stats.small = n.small
    r.stats.full = n.full
  })

  return <primitive object={world.root} />
})
