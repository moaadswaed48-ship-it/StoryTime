import * as THREE from 'three'
import { clamp } from '../engine/math'
import type { Stage } from '../engine/stage'
import { imageTexture, loadImage, makeCanvas, makeGoboTexture } from './textures'

/**
 * A plate is a full-frame picture behind (or in front of) the 3D world: a painting or a frame of
 * footage. It is drawn by one shader that does the camera work on the picture:
 *   – cover-fit to the frame, with a framing centre and a zoom (pan-and-scan for the tall cut);
 *   – depth parallax: a soft hand-drawn depth map shifts near things more than far ones, so a push-in
 *     or a slide reads as a camera moving through a space instead of a zoom on a flat picture;
 *   – lens blur (mip bias) for rack focus;
 *   – dappled light: a moving leaf-shadow pattern brightens and dims the picture, strongest on the ground.
 */
export interface PlateLook {
  /** Framing centre in picture space (0…1, y down) and zoom (1 = the picture just covers the frame). */
  cx?: number
  cy?: number
  zoom?: number
  /** Camera offset for parallax, in picture widths (x right, y up). */
  px?: number
  py?: number
  /** Roll in radians. */
  roll?: number
  /** Blur in mip levels. */
  blur?: number
  /** Strength of the dappled light 0…1, and its drift. */
  dapple?: number
  dappleShift?: [number, number]
  exposure?: number
  /** Colour multiplier (linear). */
  tint?: [number, number, number]
  /** 0…1 overall opacity (plates drawn over the 3D world). */
  alpha?: number
  /**
   * Draw the picture as a card inside the frame instead of full-bleed: rectangle in stage pixels
   * (y from the top), corner radius, and a soft shadow under it (0…1).
   */
  frame?: { x: number; y: number; w: number; h: number; radius?: number; shadow?: number }
}

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D map;
uniform sampler2D depthMap;
uniform sampler2D gobo;
uniform vec2 uCenter;
uniform vec2 uScale;
uniform vec2 uParallax;
uniform float uRoll;
uniform float uBlur;
uniform float uDapple;
uniform vec2 uDappleShift;
uniform float uExposure;
uniform vec3 uTint;
uniform float uAlpha;
uniform float uHasDepth;
uniform float uAspect;
uniform vec2 uRes;
uniform vec4 uRect;
uniform float uRadius;
uniform float uShadow;
varying vec2 vUv;
void main() {
  // the card: a rounded rectangle in pixels (bottom-left origin)
  vec2 fp = vUv * uRes;
  vec2 rc = uRect.xy + uRect.zw * 0.5;
  vec2 qd = abs(fp - rc) - uRect.zw * 0.5 + uRadius;
  float sd = length(max(qd, 0.0)) + min(max(qd.x, qd.y), 0.0) - uRadius;
  float inside = 1.0 - smoothstep(-0.8, 0.8, sd);
  vec2 sdp = fp - rc + vec2(0.0, uRes.y * 0.012);
  vec2 qs = abs(sdp) - uRect.zw * 0.5 + uRadius;
  float ss = length(max(qs, 0.0)) + min(max(qs.x, qs.y), 0.0) - uRadius;
  float shadow = uShadow * (1.0 - smoothstep(-uRes.y * 0.01, uRes.y * 0.05, ss)) * 0.6;
  if (inside + shadow < 0.002) discard;
  vec2 p = (fp - uRect.xy) / uRect.zw - 0.5;
  float c = cos(uRoll), s = sin(uRoll);
  p = vec2(p.x * uAspect, p.y);
  p = vec2(c * p.x - s * p.y, s * p.x + c * p.y);
  p.x /= uAspect;
  vec2 uv = uCenter + p * uScale;
  float d = 0.5;
  if (uHasDepth > 0.5) {
    // two steps of parallax so near things slide over far ones without tearing
    d = texture2D(depthMap, uv).r;
    vec2 uv2 = uv - uParallax * (d - 0.35);
    d = texture2D(depthMap, uv2).r;
    uv = uv - uParallax * (d - 0.35);
  }
  vec3 col = texture2D(map, clamp(uv, 0.001, 0.999), uBlur).rgb;
  if (uDapple > 0.0) {
    vec2 g = uv * vec2(1.6, 0.9) * (1.0 + (1.0 - d) * 0.6) + uDappleShift;
    float a = texture2D(gobo, g).r;
    float b = texture2D(gobo, g * 0.53 + vec2(0.31, 0.17) - uDappleShift * 0.4).r;
    float light = a * 0.65 + b * 0.35;
    float amt = uDapple * (0.35 + 0.65 * smoothstep(0.25, 0.9, d));
    col *= 1.0 + (light - 0.52) * 0.85 * amt;
  }
  col *= uTint * uExposure;
  float alpha = (inside + (1.0 - inside) * shadow) * uAlpha;
  gl_FragColor = vec4(col * inside * uAlpha, alpha);
}
`

let sharedGobo: THREE.Texture | null = null
export const gobo = () => (sharedGobo ??= makeGoboTexture())

export class Plate {
  scene = new THREE.Scene()
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  private uniforms: Record<string, THREE.IUniform>
  private imgAspect = 16 / 9
  private mesh: THREE.Mesh

  constructor(
    private stage: Stage,
    map?: THREE.Texture,
    imgAspect = 16 / 9,
    depth?: THREE.Texture,
  ) {
    this.imgAspect = imgAspect
    this.uniforms = {
      map: { value: map ?? null },
      depthMap: { value: depth ?? null },
      gobo: { value: gobo() },
      uCenter: { value: new THREE.Vector2(0.5, 0.5) },
      uScale: { value: new THREE.Vector2(1, 1) },
      uParallax: { value: new THREE.Vector2(0, 0) },
      uRoll: { value: 0 },
      uBlur: { value: 0 },
      uDapple: { value: 0 },
      uDappleShift: { value: new THREE.Vector2(0, 0) },
      uExposure: { value: 1 },
      uTint: { value: new THREE.Vector3(1, 1, 1) },
      uAlpha: { value: 1 },
      uHasDepth: { value: depth ? 1 : 0 },
      uAspect: { value: stage.aspect },
      uRes: { value: new THREE.Vector2(stage.W, stage.H) },
      uRect: { value: new THREE.Vector4(0, 0, stage.W, stage.H) },
      uRadius: { value: 0 },
      uShadow: { value: 0 },
    }
    this.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        uniforms: this.uniforms,
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
        fragmentShader: FRAG,
        depthTest: false,
        depthWrite: false,
        transparent: true,
        premultipliedAlpha: true,
      }),
    )
    this.mesh.frustumCulled = false
    this.scene.add(this.mesh)
  }

  setMap(map: THREE.Texture, imgAspect?: number) {
    this.uniforms.map.value = map
    if (imgAspect) this.imgAspect = imgAspect
  }

  /** Sets the framing for this frame. */
  look(l: PlateLook) {
    const u = this.uniforms
    const zoom = Math.max(1, l.zoom ?? 1)
    const f = l.frame
    const { W, H } = this.stage
    if (f) (u.uRect.value as THREE.Vector4).set(f.x, H - f.y - f.h, f.w, f.h)
    else (u.uRect.value as THREE.Vector4).set(0, 0, W, H)
    u.uRadius.value = f?.radius ?? 0
    u.uShadow.value = f?.shadow ?? 0
    const fa = f ? f.w / f.h : this.stage.aspect
    u.uAspect.value = fa
    const ia = this.imgAspect
    // size of the visible window in picture uv
    let sx = 1
    let sy = 1
    if (fa > ia) sy = ia / fa
    else sx = fa / ia
    sx /= zoom
    sy /= zoom
    const roll = l.roll ?? 0
    const margin = Math.abs(roll) * 0.6
    const cx = clamp(l.cx ?? 0.5, sx / 2 + margin * sx, 1 - sx / 2 - margin * sx)
    const cyDown = clamp(l.cy ?? 0.5, sy / 2 + margin * sy, 1 - sy / 2 - margin * sy)
    ;(u.uCenter.value as THREE.Vector2).set(cx, 1 - cyDown)
    ;(u.uScale.value as THREE.Vector2).set(sx, sy)
    ;(u.uParallax.value as THREE.Vector2).set(l.px ?? 0, l.py ?? 0)
    u.uRoll.value = roll
    u.uBlur.value = l.blur ?? 0
    u.uDapple.value = l.dapple ?? 0
    ;(u.uDappleShift.value as THREE.Vector2).set(...(l.dappleShift ?? [0, 0]))
    u.uExposure.value = l.exposure ?? 1
    ;(u.uTint.value as THREE.Vector3).set(...(l.tint ?? [1, 1, 1]))
    u.uAlpha.value = l.alpha ?? 1
  }

  /** Draws the plate into the target. `clear` false draws it over what is already there. */
  draw(target: THREE.WebGLRenderTarget, clear = true) {
    const r = this.stage.renderer
    r.setRenderTarget(target)
    const auto = r.autoClear
    r.autoClear = false
    if (clear) {
      r.setClearColor(0x000000, 1)
      r.clear()
    }
    r.render(this.scene, this.camera)
    r.autoClear = auto
  }
}

/* ── depth maps drawn by hand ─────────────────────────────────────────────── */

export interface DepthSpec {
  /** y (0 top … 1 bottom) of the far edge of the ground. Above it everything is "far". */
  horizon: number
  /** Depth at the horizon and at the bottom edge (0 far … 1 near). */
  far?: number
  near?: number
  /** Soft bodies standing in the scene: centre, radii (in picture fractions) and their depth. */
  blobs?: Array<{ x: number; y: number; rx: number; ry: number; d: number }>
}

/** Ground plane ramp plus soft blobs for figures and trunks. Smooth on purpose: nothing can tear. */
export function makeDepthTexture(spec: DepthSpec, w = 256, h = 144): THREE.Texture {
  const c = makeCanvas(w, h)
  const g = c.getContext('2d', { willReadFrequently: true })!
  const far = spec.far ?? 0.12
  const near = spec.near ?? 1
  const grd = g.createLinearGradient(0, 0, 0, h)
  const v = (d: number) => {
    const x = Math.round(clamp(d) * 255)
    return `rgb(${x},${x},${x})`
  }
  grd.addColorStop(0, v(far * 0.4))
  grd.addColorStop(Math.max(0.01, spec.horizon - 0.02), v(far))
  grd.addColorStop(1, v(near))
  g.fillStyle = grd
  g.fillRect(0, 0, w, h)
  g.filter = `blur(${w * 0.02}px)`
  for (const b of spec.blobs ?? []) {
    g.fillStyle = v(b.d)
    g.beginPath()
    g.ellipse(b.x * w, b.y * h, b.rx * w, b.ry * h, 0, 0, Math.PI * 2)
    g.fill()
  }
  g.filter = 'none'
  // final soften
  const c2 = makeCanvas(w, h)
  const g2 = c2.getContext('2d', { willReadFrequently: true })!
  g2.filter = `blur(${w * 0.012}px)`
  g2.drawImage(c, 0, 0)
  const t = new THREE.CanvasTexture(c2)
  t.colorSpace = THREE.NoColorSpace
  t.minFilter = THREE.LinearFilter
  t.generateMipmaps = false
  return t
}

/* ── pictures and footage ─────────────────────────────────────────────────── */

const imageCache = new Map<string, Promise<HTMLImageElement>>()
export function sitePicture(name: string): Promise<HTMLImageElement> {
  const url = `/site/story/${name}.webp`
  if (!imageCache.has(url)) imageCache.set(url, loadImage(url))
  return imageCache.get(url)!
}
export async function pictureTexture(name: string): Promise<THREE.Texture> {
  return imageTexture(await sitePicture(name))
}

/**
 * Footage: the frames of a master clip (extracted by scripts/prepare.mjs) played as a texture.
 * `prepare(frame)` must be awaited before the frame is drawn.
 */
export class Footage {
  texture: THREE.Texture
  aspect = 16 / 9
  frames = 121
  fps = 24
  private current = -1
  private cache = new Map<number, ImageBitmap>()

  constructor(public id: string) {
    this.texture = new THREE.Texture()
    this.texture.colorSpace = THREE.SRGBColorSpace
    this.texture.generateMipmaps = true
    this.texture.minFilter = THREE.LinearMipmapLinearFilter
    this.texture.magFilter = THREE.LinearFilter
    this.texture.flipY = false
  }

  async prepare(frame: number) {
    const n = Math.max(0, Math.min(this.frames - 1, Math.round(frame)))
    if (n === this.current) return
    let bmp = this.cache.get(n)
    if (!bmp) {
      const res = await fetch(`/cache/frames/${this.id}/${String(n + 1).padStart(4, '0')}.jpg`)
      if (!res.ok) throw new Error(`missing footage frame ${this.id} #${n + 1}: run "npm run prepare:media"`)
      bmp = await createImageBitmap(await res.blob(), { imageOrientation: 'flipY' })
      this.cache.set(n, bmp)
      if (this.cache.size > 6) {
        const first = this.cache.keys().next().value as number
        if (first !== n) {
          this.cache.get(first)?.close()
          this.cache.delete(first)
        }
      }
    }
    this.aspect = bmp.width / bmp.height
    this.texture.image = bmp
    this.texture.needsUpdate = true
    this.current = n
  }
}
