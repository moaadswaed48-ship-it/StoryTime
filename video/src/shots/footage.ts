import * as THREE from 'three'
import { drift, lerp, smooth } from '../engine/math'
import type { Shot, Stage } from '../engine/stage'
import { LeafField, fallingLeaves, type LeafPlacer } from '../kit/leaves'
import { Footage, Plate, type PlateLook } from '../kit/plate'

/**
 * A shot of the animated footage. The clip plays at its own speed (24 fps, never re-timed); the code adds
 * what a camera operator and a compositor would: a slow move on the picture, and real 3D leaves falling
 * between the lens and the scene, so the six clips sit in one continuous autumn.
 *
 * Wide cut: full bleed. Tall cut: the picture is a tall card (pan-and-scan framing chosen per clip) over
 * an out-of-focus copy of itself, with the leaves crossing the whole phone screen in front of it.
 */
export interface Framing {
  cx: number
  cy: number
  zoom: number
}
export interface FootageShotOptions {
  clip: string
  /** First source frame and playback rate (1 = real time). */
  startFrame?: number
  rate?: number
  /** Camera move on the picture: from → to over the shot. */
  from?: Partial<Framing>
  to?: Partial<Framing>
  /** Same, for the tall cut's card. */
  tallFrom?: Partial<Framing>
  tallTo?: Partial<Framing>
  /** Card rectangle for the tall cut (stage px). */
  card?: { x: number; y: number; w: number; h: number }
  /** Foreground leaves: how many, and an optional custom motion. */
  leaves?: number
  leafPlacer?: LeafPlacer
  leafSeed?: number
  exposure?: number
  /** Seconds the shot is expected to last (for the move). */
  dur: number
}

export const TALL_CARD = { x: 48, y: 232, w: 984, h: 1230 }

export function footageShot(stage: Stage, o: FootageShotOptions): Shot {
  const footage = new Footage(o.clip)
  const plate = new Plate(stage, footage.texture)
  const glow = new Plate(stage, footage.texture)
  const scene = new THREE.Scene()
  const cam = new THREE.PerspectiveCamera(stage.tall ? 46 : 30, stage.aspect, 0.1, 60)
  cam.position.set(0, 0, 6)
  const nLeaves = o.leaves ?? 26
  const leaves = new LeafField({
    count: nLeaves,
    seed: o.leafSeed ?? 3,
    focus: 9,
    focusRange: 1.5,
    maxBlur: 5,
    gain: 0.95,
    place:
      o.leafPlacer ??
      fallingLeaves({
        center: [0, 0, 2.2],
        spread: [stage.tall ? 4.4 : 7.5, 4.2],
        top: stage.tall ? 4.2 : 2.6,
        bottom: stage.tall ? -4.2 : -2.6,
        speed: 0.75,
        wind: [0.35, 0],
        size: [0.26, 0.5],
        seed: o.leafSeed ?? 3,
        feather: 0.4,
      }),
  })
  scene.add(leaves.group)
  const card = o.card ?? TALL_CARD
  const F = (a: Partial<Framing> | undefined, b: Partial<Framing> | undefined, k: number): Framing => ({
    cx: lerp(a?.cx ?? 0.5, b?.cx ?? a?.cx ?? 0.5, k),
    cy: lerp(a?.cy ?? 0.5, b?.cy ?? a?.cy ?? 0.5, k),
    zoom: lerp(a?.zoom ?? 1.02, b?.zoom ?? (a?.zoom ?? 1.02) + 0.05, k),
  })
  return {
    async prepare(t) {
      await footage.prepare((o.startFrame ?? 0) + t * footage.fps * (o.rate ?? 1))
    },
    render(t, target) {
      const k = smooth(Math.min(1, Math.max(0, t / o.dur)))
      const lin = Math.min(1, Math.max(0, t / o.dur))
      plate.setMap(footage.texture, footage.aspect)
      const base: PlateLook = { exposure: o.exposure ?? 1 }
      if (!stage.tall) {
        const f = F(o.from, o.to, lerp(lin, k, 0.4))
        plate.look({ ...base, ...f, cx: f.cx + drift(t * 0.35, 3) * 0.002, cy: f.cy + drift(t * 0.3, 8) * 0.002 })
        plate.draw(target, true)
      } else {
        // ambient: the same frame far out of focus, dimmed, filling the phone screen
        glow.setMap(footage.texture, footage.aspect)
        const f = F(o.tallFrom ?? o.from, o.tallTo ?? o.to, lerp(lin, k, 0.4))
        glow.look({ cx: f.cx, cy: 0.5, zoom: 1.15, blur: 6.2, exposure: 0.42, tint: [1, 0.86, 0.74] })
        glow.draw(target, true)
        plate.look({ ...base, ...f, frame: { ...card, radius: 40, shadow: 0.9 } })
        plate.draw(target, false)
      }
      leaves.update(t + 3, cam)
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
