import * as THREE from 'three'
import { drift, lerp, ramp } from '../engine/math'
import type { Shot, Stage } from '../engine/stage'
import { LeafField, fallingLeaves } from '../kit/leaves'
import { Plate, sitePicture } from '../kit/plate'
import { blurredCopy, imageTexture, loadImage } from '../kit/textures'
import { Dust, Shafts } from '../kit/world'

/**
 * Opening and closing picture of the trailer, with real leaves falling through low sun in front.
 *
 * "open": the first frame is her world in focus (it is the thumbnail WhatsApp shows); then the lens pulls
 * focus to the falling leaves and the picture goes soft and a little darker, so the title can sit on it.
 * "close": the sunset with the migrating birds (wide) or the cover (phone), in focus, drifting slowly;
 * the composition puts a soft shade behind the type.
 */
export async function titleShot(stage: Stage, mode: 'open' | 'close'): Promise<Shot> {
  const img = stage.tall ? await loadImage('/site/story/cover.webp') : await sitePicture(mode === 'open' ? 'k08' : 'k12')
  const aspect = img.width / img.height
  const sharp = new Plate(stage, imageTexture(img), aspect)
  const mid = new Plate(stage, imageTexture(blurredCopy(img, 3, 960), false), aspect)
  const soft = new Plate(stage, imageTexture(blurredCopy(img, 9, 720), false), aspect)
  const scene = new THREE.Scene()
  const cam = new THREE.PerspectiveCamera(stage.tall ? 44 : 30, stage.aspect, 0.1, 60)
  cam.position.set(0, 0, 6)
  const seed = mode === 'open' ? 11 : 23
  const leaves = new LeafField({
    count: mode === 'open' ? (stage.tall ? 120 : 150) : stage.tall ? 70 : 80,
    seed,
    focus: 4.6,
    focusRange: 1.3,
    place: fallingLeaves({
      center: [0, 0, 0.8],
      spread: [stage.tall ? 5.5 : 10, 7],
      top: stage.tall ? 4.6 : 3.1,
      bottom: stage.tall ? -4.6 : -3.1,
      speed: 0.62,
      wind: [0.3, 0],
      size: [0.2, 0.46],
      seed,
      feather: 0.5,
    }),
  })
  const shafts = new Shafts(5, { width: 1.3, length: 11, spread: stage.tall ? 4 : 8, angle: 0.62, color: 0xffb46a, seed: 5 })
  shafts.group.position.set(stage.tall ? -0.4 : -1.5, 0.6, -1)
  const dust = new Dust(90, [stage.tall ? 5 : 9, stage.tall ? 8 : 5, 5], [0, 0, 1.5], 0.07, 0xffd2a0, 0.42, 9)
  scene.add(shafts.group, leaves.group, dust.points)
  return {
    render(t, target) {
      const k = ramp(t, 0, 4.5)
      let look
      if (mode === 'open') {
        // rack focus: sharp → soft between 0.2 s and 1.1 s
        const a1 = ramp(t, 0.2, 0.7)
        const a2 = ramp(t, 0.5, 1.15)
        const dim = lerp(1, 0.6, ramp(t, 0.25, 1.15))
        look = { cx: (stage.tall ? 0.5 : 0.56) + drift(t * 0.2, 2) * 0.004, cy: (stage.tall ? 0.42 : 0.46) - k * 0.012, zoom: 1.08 + k * 0.07, exposure: dim, tint: [1, lerp(1, 0.93, a2), lerp(1, 0.86, a2)] as [number, number, number] }
        sharp.look(look)
        sharp.draw(target, true)
        if (a1 > 0) {
          mid.look({ ...look, alpha: a1 })
          mid.draw(target, false)
        }
        if (a2 > 0) {
          soft.look({ ...look, alpha: a2 })
          soft.draw(target, false)
        }
      } else {
        look = stage.tall ? { cx: 0.5, cy: 0.5 - k * 0.01, zoom: 1.04 + k * 0.03 } : { cx: 0.54 + drift(t * 0.2, 2) * 0.003, cy: 0.4 - k * 0.012, zoom: 1.2 + k * 0.04 }
        sharp.look({ ...look, exposure: 0.92 })
        sharp.draw(target, true)
      }
      cam.position.set(drift(t * 0.25, 4) * 0.05, drift(t * 0.22, 6) * 0.04, 6 - k * 0.35)
      cam.lookAt(0, 0, 0)
      shafts.update(t, mode === 'open' ? 1.15 * ramp(t, 0.1, 1) : 0.5)
      dust.update(t, [0.08, 0.03, 0.02])
      leaves.update(t + (mode === 'open' ? 6 : 2), cam)
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
