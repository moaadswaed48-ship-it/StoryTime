import * as THREE from 'three'
import { drift, hash, lerp, smooth } from '../engine/math'
import type { Shot, Stage } from '../engine/stage'
import { LeafField, WARM_LIGHT, fallingLeaves, type LeafLight, type LeafState } from '../kit/leaves'
import { Plate, makeDepthTexture, sitePicture, type DepthSpec } from '../kit/plate'
import { blurredCopy, imageTexture } from '../kit/textures'
import { Dust, Ground, Shafts } from '../kit/world'

/**
 * The kindergarten yard as a 3D set for close-ups: paving in moving leaf shade, the scene's own painting
 * far out of focus behind it (so the colours of an insert always match the picture it cuts with), sun
 * shafts, dust, fallen leaves on the ground and a few still coming down.
 */
export interface YardOptions {
  picture: string
  fov?: number
  backdrop?: { cx?: number; cy?: number; zoom?: number; exposure?: number; blur?: number }
  haze?: [number, number]
  fallen?: number
  falling?: number
  /** Keep fallen leaves out of this radius around the origin. */
  clear?: number
  seed?: number
}
export interface Yard {
  scene: THREE.Scene
  cam: THREE.PerspectiveCamera
  light: LeafLight
  ground: Ground
  /** Call once per frame after moving the camera; then draw(). */
  update(t: number, focus: number, range?: number): void
  draw(target: THREE.WebGLRenderTarget, t: number): void
}

const _e = new THREE.Euler()

export async function makeYard(stage: Stage, o: YardOptions): Promise<Yard> {
  const img = await sitePicture(o.picture)
  const b = o.backdrop ?? {}
  const plate = new Plate(stage, imageTexture(blurredCopy(img, b.blur ?? 7, 720), false), img.width / img.height)
  const scene = new THREE.Scene()
  const cam = new THREE.PerspectiveCamera(o.fov ?? 30, stage.aspect, 0.1, 120)
  const light = WARM_LIGHT()
  const ground = new Ground(120)
  ground.uniforms.uHazeStart.value = o.haze?.[0] ?? 6
  ground.uniforms.uHazeEnd.value = o.haze?.[1] ?? 16
  ground.uniforms.uHaze.value = new THREE.Color(0.88, 0.52, 0.25)
  const seed = o.seed ?? 1
  const clear = o.clear ?? 1.2
  const fallen = new LeafField(
    {
      count: o.fallen ?? 240,
      seed: seed + 100,
      renderOrder: 3,
      place: (i: number, _t: number, s: LeafState) => {
        const r = (n: number) => hash(i, seed * 900 + n)
        let x = (r(1) - 0.5) * 8
        let z = 2.6 - r(2) ** 1.3 * 8
        const d = Math.hypot(x, z)
        if (d < clear) {
          x *= (clear + 0.2) / Math.max(d, 0.05)
          z *= (clear + 0.2) / Math.max(d, 0.05)
        }
        s.pos.set(x, 0.012 + r(3) * 0.012, z)
        s.quat.setFromEuler(_e.set(-Math.PI / 2 + (r(4) - 0.5) * 0.2, 0, r(5) * 6.283, 'YXZ'))
        s.size = 0.3 + r(6) * 0.3
        s.curl = 0.25 + r(7) * 0.4
      },
    },
    light,
  )
  const falling = new LeafField(
    { count: o.falling ?? 40, seed: seed + 200, renderOrder: 8, place: fallingLeaves({ center: [0, 0, 0.3], spread: [7, 6], top: 4, bottom: 0.03, speed: 0.6, wind: [0.25, 0.05], size: [0.2, 0.38], seed: seed + 200, feather: 0.25 }) },
    light,
  )
  const shafts = new Shafts(4, { width: 1.6, length: 9, spread: 6, angle: 0.5, color: 0xffb873, seed: seed + 3 })
  shafts.group.position.set(-1.2, 2.3, -1.6)
  const dust = new Dust(70, [7, 3, 6], [0, 1.4, 0.3], 0.045, 0xffd9ae, 0.4, seed + 4)
  scene.add(ground.mesh, fallen.group, falling.group, shafts.group, dust.points)
  let focusNow = 4
  return {
    scene,
    cam,
    light,
    ground,
    update(t, focus, range = 1.4) {
      focusNow = focus
      ground.update(t, focus, range)
      fallen.setFocus(focus, range * 0.9)
      falling.setFocus(focus, range * 0.8)
      fallen.update(t, cam)
      falling.update(t + 3 + seed, cam)
      shafts.update(t, 0.9)
      dust.update(t)
    },
    draw(target, t) {
      void focusNow
      plate.look({ cx: (b.cx ?? 0.5) + drift(t * 0.25, seed) * 0.006, cy: b.cy ?? 0.36, zoom: (b.zoom ?? 1.5) + t * 0.006, exposure: b.exposure ?? 0.84, tint: [1, 0.95, 0.88] })
      plate.draw(target, true)
      const r = stage.renderer
      r.setRenderTarget(target)
      const auto = r.autoClear
      r.autoClear = false
      r.clearDepth()
      r.render(scene, cam)
      r.autoClear = auto
    },
  }
}

/* ── a painting, alive ────────────────────────────────────────────────────── */

export interface PlateShotOptions {
  picture: string
  depth: DepthSpec
  /** Camera move: framing from → to, and the sideways/vertical travel that produces parallax. */
  from: { cx: number; cy: number; zoom: number }
  to: { cx: number; cy: number; zoom: number }
  travel?: [number, number]
  dur: number
  leaves?: number
  seed?: number
  dapple?: number
  /** Extra things drawn in front of the painting (3D), e.g. sparkles. */
  extra?: (scene: THREE.Scene, cam: THREE.PerspectiveCamera) => (t: number) => void
}

/**
 * A scene painting as a shot. Not a zoom on a flat picture: a hand-drawn depth map lets the camera travel
 * (near things slide over far ones), the light through the branches moves over the ground, and real 3D
 * leaves fall in front of and around the figures, in and out of focus.
 */
export async function plateShot(stage: Stage, o: PlateShotOptions): Promise<Shot> {
  const img = await sitePicture(o.picture)
  const plate = new Plate(stage, imageTexture(img), img.width / img.height, makeDepthTexture(o.depth))
  const scene = new THREE.Scene()
  const cam = new THREE.PerspectiveCamera(30, stage.aspect, 0.1, 60)
  cam.position.set(0, 0, 6)
  const seed = o.seed ?? 1
  const leaves = new LeafField({
    count: o.leaves ?? 46,
    seed,
    focus: 5.2,
    focusRange: 1.3,
    place: fallingLeaves({ center: [0, 0, 1.2], spread: [8, 5], top: 2.7, bottom: -2.7, speed: 0.7, wind: [0.32, 0], size: [0.2, 0.44], seed, feather: 0.4 }),
  })
  const dust = new Dust(50, [8, 4.5, 4], [0, 0, 2], 0.05, 0xffdcb0, 0.38, seed + 9)
  scene.add(leaves.group, dust.points)
  const extra = o.extra?.(scene, cam)
  const travel = o.travel ?? [0.012, 0.004]
  return {
    render(t, target) {
      const lin = Math.min(1, Math.max(0, t / o.dur))
      const k = lerp(lin, smooth(lin), 0.5)
      plate.look({
        cx: lerp(o.from.cx, o.to.cx, k),
        cy: lerp(o.from.cy, o.to.cy, k),
        zoom: lerp(o.from.zoom, o.to.zoom, k),
        px: (k - 0.5) * travel[0] * 2 + drift(t * 0.3, seed) * 0.0015,
        py: (k - 0.5) * travel[1] * 2,
        dapple: o.dapple ?? 0.55,
        dappleShift: [t * 0.012 + Math.sin(t * 0.5) * 0.01, Math.cos(t * 0.37) * 0.008],
      })
      plate.draw(target, true)
      cam.position.set((k - 0.5) * 0.25, (k - 0.5) * 0.06, 6 - k * 0.3)
      cam.lookAt(0, 0, 0)
      leaves.update(t + seed * 1.7, cam)
      dust.update(t, [0.1, 0.03, 0])
      extra?.(t)
      const r = stage.renderer
      r.setRenderTarget(target)
      const auto = r.autoClear
      r.autoClear = false
      r.clearDepth()
      r.render(scene, cam)
      r.autoClear = auto
    },
  }
}
