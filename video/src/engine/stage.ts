import * as THREE from 'three'
import { clamp, smooth } from './math'

/**
 * The stage: one WebGL canvas for the picture and one DOM layer for type (so Arabic is shaped by the
 * browser's own text engine), both exactly W×H CSS pixels. A film is a list of clips on a timeline; the
 * stage draws whichever clips are alive at time T into off-screen targets and a single final pass mixes
 * them (cut or dissolve), grades them and adds the vignette and grain. Nothing reads a clock: frame N
 * always produces the same pixels.
 */
export interface Stage {
  W: number
  H: number
  fps: number
  /** true for the 9:16 cut */
  tall: boolean
  aspect: number
  renderer: THREE.WebGLRenderer
  /** DOM layer above the picture (type). */
  dom: HTMLDivElement
}

export interface Shot {
  /** Called once before the first frame that needs this shot at time t (load frames, etc). */
  prepare?(t: number): Promise<void> | void
  /** true if the shot has hard geometry edges (a book, a figure) and needs multisampling. */
  aa?: boolean
  /** Draw the shot at local time t (seconds since the clip's start) into `target`. */
  render(t: number, target: THREE.WebGLRenderTarget): void
}

export interface Clip {
  shot: Shot
  /** Seconds on the film's timeline. Overlapping clips dissolve across the overlap. */
  start: number
  end: number
  /** Local time offset: the shot starts this many seconds into its own animation. */
  offset?: number
}

export interface Grade {
  /** 0 = picture, 1 = full fade to `fadeColor`. */
  fade?: number
  fadeColor?: [number, number, number]
  vignette?: number
  /** Warm light leak / bloom-ish lift, 0…1. */
  glow?: number
  /** Global saturation multiplier (1 = unchanged). */
  sat?: number
}

export interface Film {
  duration: number
  clips: Clip[]
  /** Per-frame look and DOM type. */
  frame?(time: number, grade: Grade): void
}

export function createStage(W: number, H: number, fps: number): Stage {
  const root = document.getElementById('stage') as HTMLDivElement
  root.style.cssText = `position:relative;width:${W}px;height:${H}px;overflow:hidden;background:#000;`
  const canvas = document.createElement('canvas')
  canvas.style.cssText = `position:absolute;inset:0;width:${W}px;height:${H}px;display:block;`
  root.appendChild(canvas)
  const dom = document.createElement('div')
  dom.style.cssText = `position:absolute;inset:0;width:${W}px;height:${H}px;overflow:hidden;pointer-events:none;`
  root.appendChild(dom)

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(W, H, false)
  renderer.toneMapping = THREE.NoToneMapping
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.autoClear = true
  renderer.setClearColor(0x000000, 1)
  return { W, H, fps, tall: H > W, aspect: W / H, renderer, dom }
}

const FINAL_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tA;
uniform sampler2D tB;
uniform float uMix;
uniform float uFade;
uniform vec3 uFadeColor;
uniform float uVignette;
uniform float uGlow;
uniform float uSat;
uniform float uSeed;
uniform vec2 uRes;
varying vec2 vUv;

float h21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
vec3 toSrgb(vec3 c) {
  c = max(c, 0.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}
void main() {
  vec3 a = texture2D(tA, vUv).rgb;
  vec3 c = a;
  if (uMix > 0.0) c = mix(a, texture2D(tB, vUv).rgb, uMix);
  // gentle filmic shoulder so additive light never clips hard
  c = c / (1.0 + max(c - 0.82, 0.0) * 0.9);
  vec3 s = toSrgb(c);
  // warm grade: lift shadows toward brown, keep highlights creamy
  float l = dot(s, vec3(0.299, 0.587, 0.114));
  s = mix(vec3(l), s, uSat);
  s = s * vec3(1.015, 1.0, 0.975) + vec3(0.012, 0.004, -0.004) * (1.0 - l);
  // warm glow from the upper corner (the low sun)
  vec2 q = vUv - vec2(0.5);
  float asp = uRes.x / uRes.y;
  float sun = exp(-dot((vUv - vec2(0.12, 1.02)) * vec2(asp, 1.0), (vUv - vec2(0.12, 1.02)) * vec2(asp, 1.0)) * 1.6);
  s += vec3(1.0, 0.62, 0.28) * sun * uGlow * 0.5;
  // vignette
  float v = dot(q * vec2(1.0, 1.0), q) * 1.9;
  s *= 1.0 - uVignette * smoothstep(0.18, 1.0, v);
  // fade
  s = mix(s, uFadeColor, uFade);
  // fine grain (also dithers the sky gradients)
  float g = h21(gl_FragCoord.xy + uSeed * vec2(17.0, 29.0)) - 0.5;
  s += g * (0.022 - 0.012 * l);
  gl_FragColor = vec4(s, 1.0);
}
`

export function createCompositor(stage: Stage) {
  const { renderer, W, H } = stage
  const dpr = renderer.getPixelRatio()
  // 8-bit sRGB targets: blending stays linear (the GPU converts on write), darks do not band, and software
  // WebGL fills them much faster than float targets. Multisampling only where a shot asks for it.
  const makeTarget = (samples: number) => {
    const rt = new THREE.WebGLRenderTarget(Math.round(W * dpr), Math.round(H * dpr), { samples, type: THREE.UnsignedByteType, depthBuffer: true })
    rt.texture.colorSpace = THREE.SRGBColorSpace
    return rt
  }
  const plain = [makeTarget(0), makeTarget(0)]
  let smooth4: THREE.WebGLRenderTarget[] | null = null
  const targetFor = (shot: Shot, slot: 0 | 1) => (shot.aa ? (smooth4 ??= [makeTarget(4), makeTarget(4)])[slot] : plain[slot])
  const rtA = plain[0]
  const rtB = plain[1]
  const uniforms = {
    tA: { value: rtA.texture },
    tB: { value: rtB.texture },
    uMix: { value: 0 },
    uFade: { value: 0 },
    uFadeColor: { value: new THREE.Vector3(0.07, 0.047, 0.031) },
    uVignette: { value: 0.3 },
    uGlow: { value: 0 },
    uSat: { value: 1 },
    uSeed: { value: 0 },
    uRes: { value: new THREE.Vector2(W, H) },
  }
  const quad = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      uniforms,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: FINAL_FRAG,
      depthTest: false,
      depthWrite: false,
    }),
  )
  quad.frustumCulled = false
  const scene = new THREE.Scene()
  scene.add(quad)
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

  async function draw(film: Film, time: number, frameIndex: number) {
    const alive = film.clips.filter((c) => time >= c.start - 1e-6 && time < c.end - 1e-6)
    // at most two clips overlap; the later-starting one is the incoming picture
    alive.sort((a, b) => a.start - b.start)
    const a = alive[0]
    const b = alive[1]
    const grade: Grade = { fade: 0, fadeColor: [0.07, 0.047, 0.031], vignette: 0.3, glow: 0, sat: 1 }
    film.frame?.(time, grade)
    if (a) {
      const t = time - a.start + (a.offset ?? 0)
      await a.shot.prepare?.(t)
      const ta = targetFor(a.shot, 0)
      a.shot.render(t, ta)
      uniforms.tA.value = ta.texture
    } else {
      uniforms.tA.value = rtA.texture
      renderer.setRenderTarget(rtA)
      renderer.setClearColor(0x000000, 1)
      renderer.clear()
    }
    let mix = 0
    if (a && b) {
      const t = time - b.start + (b.offset ?? 0)
      await b.shot.prepare?.(t)
      const tb = targetFor(b.shot, 1)
      b.shot.render(t, tb)
      uniforms.tB.value = tb.texture
      mix = smooth(clamp((time - b.start) / Math.max(1e-6, a.end - b.start)))
    }
    uniforms.uMix.value = mix
    uniforms.uFade.value = grade.fade ?? 0
    uniforms.uFadeColor.value.set(...(grade.fadeColor ?? [0.07, 0.047, 0.031]))
    uniforms.uVignette.value = grade.vignette ?? 0.3
    uniforms.uGlow.value = grade.glow ?? 0
    uniforms.uSat.value = grade.sat ?? 1
    uniforms.uSeed.value = frameIndex % 64
    renderer.setRenderTarget(null)
    renderer.render(scene, cam)
  }
  return { draw }
}

/** Clears a target to a colour and renders a scene into it. */
export function renderInto(stage: Stage, target: THREE.WebGLRenderTarget, scene: THREE.Scene, camera: THREE.Camera, clear: THREE.ColorRepresentation = 0x000000) {
  const r = stage.renderer
  r.setRenderTarget(target)
  r.setClearColor(clear, 1)
  r.clear()
  r.render(scene, camera)
}
