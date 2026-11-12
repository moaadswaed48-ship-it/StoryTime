import * as THREE from 'three'
import { drift, ramp } from '../engine/math'
import type { Shot, Stage } from '../engine/stage'
import { LeafField, fallingLeaves } from '../kit/leaves'
import { Plate, sitePicture } from '../kit/plate'
import { blurredCopy, imageTexture, loadImage } from '../kit/textures'
import { Dust, Shafts } from '../kit/world'

/**
 * Opening and closing picture of the trailer: the autumn of the story, out of focus, with real leaves
 * falling through low sun in front of it. The type sits on top (set by the composition).
 * `mode` "open" starts with a few leaves and thickens; "close" lets them thin out and settle.
 */
export async function titleShot(stage: Stage, mode: 'open' | 'close'): Promise<Shot> {
  const img = stage.tall ? await loadImage('/site/story/cover.webp') : await sitePicture(mode === 'open' ? 'k08' : 'k12')
  const soft = blurredCopy(img, mode === 'open' ? 9 : 7, 720)
  const plate = new Plate(stage, imageTexture(soft, false), img.width / img.height)
  const scene = new THREE.Scene()
  const cam = new THREE.PerspectiveCamera(stage.tall ? 44 : 30, stage.aspect, 0.1, 60)
  cam.position.set(0, 0, 6)
  const leaves = new LeafField({
    count: stage.tall ? 120 : 150,
    seed: mode === 'open' ? 11 : 23,
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
      seed: mode === 'open' ? 11 : 23,
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
      plate.look({
        cx: (stage.tall ? 0.5 : mode === 'open' ? 0.56 : 0.6) + drift(t * 0.2, 2) * 0.004,
        cy: (stage.tall ? 0.42 : mode === 'open' ? 0.46 : 0.3) - k * 0.012,
        zoom: (mode === 'open' || stage.tall ? 1.12 : 1.7) + k * 0.05,
        exposure: mode === 'open' ? 0.6 : 0.56,
        tint: [1, 0.92, 0.84],
      })
      plate.draw(target, true)
      cam.position.set(drift(t * 0.25, 4) * 0.05, drift(t * 0.22, 6) * 0.04, 6 - k * 0.35)
      cam.lookAt(0, 0, 0)
      shafts.update(t, 1.15)
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
