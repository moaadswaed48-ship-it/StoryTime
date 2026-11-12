import * as THREE from 'three'
import { story } from '../../../src/content/story'
import { drift, hash, lerp, ramp, smooth, easeInOutCubic } from '../engine/math'
import type { Shot, Stage } from '../engine/stage'
import { Book, coverTexture, endpaper, spreadPage, titlePage } from '../kit/book'
import { LeafField, WARM_LIGHT, fallingLeaves, type LeafState } from '../kit/leaves'
import { sitePicture } from '../kit/plate'
import { loadImage } from '../kit/textures'
import { Dust, Ground, Shafts } from '../kit/world'

/**
 * "Read": her book lies on the paving of the kindergarten yard, in the moving shade of the tree. The
 * cover opens to the right, as an Arabic book does, and two leaves turn: a painting across each spread,
 * her own line set beneath it. Leaves drift down and rest around the book.
 */
export async function bookShot(stage: Stage, dur: number): Promise<Shot> {
  const light = WARM_LIGHT()
  light.dir.set(-0.5, 0.78, 0.38).normalize()
  const [cover, k01, k06, k11] = await Promise.all([loadImage('/site/story/cover.webp'), sitePicture('k01'), sitePicture('k06'), sitePicture('k11')])
  const title: [string, string] = ['أوراق الخريف', 'والطيور المهاجرة']
  const cue = (i: number) => story.scenes[i].cue.ar
  const book = new Book(
    {
      cover: coverTexture(cover, title, story.kicker.ar),
      endpaper: endpaper(),
      leaves: [
        [titlePage(title, story.kicker.ar, 'وقت الحكاية'), spreadPage(k01, 'right', { text: cue(0), page: 1, cy: 0.3 })],
        [spreadPage(k01, 'left', { page: 2, cy: 0.3 }), spreadPage(k06, 'right', { text: cue(5), page: 3, cy: 0.35 })],
      ],
      last: spreadPage(k06, 'left', { page: 4, cy: 0.35 }),
    },
    light,
  )
  void k11
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0.9, 0.52, 0.24)
  const cam = new THREE.PerspectiveCamera(stage.tall ? 38 : 27, stage.aspect, 0.1, 80)
  const ground = new Ground(70)
  ground.uniforms.uHazeStart.value = 5.5
  ground.uniforms.uHazeEnd.value = 16
  ground.uniforms.uPool.value.set(0, 0, 2.2, 0.35)
  book.group.rotation.y = stage.tall ? 0.1 : 0.14
  scene.add(ground.mesh, book.group)
  // leaves resting on the paving around the book, and a few still coming down
  const rest = new LeafField(
    {
      count: 110,
      seed: 41,
      renderOrder: 3,
      focus: 4,
      focusRange: 2.2,
      place: (i: number, _t: number, s: LeafState) => {
        const r = (n: number) => hash(i, 400 + n)
        // keep a clear field where the open book lies
        let x = (r(1) - 0.5) * 8
        let z = (r(2) - 0.5) * 6.5 - 0.6
        if (Math.abs(x) < 1.25 && Math.abs(z) < 0.9) {
          x += x < 0 ? -1.2 : 1.2
          z += z < 0 ? -0.5 : 0.6
        }
        s.pos.set(x, 0.012 + r(3) * 0.01, z)
        s.quat.setFromEuler(new THREE.Euler(-Math.PI / 2 + (r(4) - 0.5) * 0.16, 0, r(5) * 6.283, 'YXZ'))
        s.size = 0.34 + r(6) * 0.3
        s.curl = 0.25 + r(7) * 0.4
      },
    },
    light,
  )
  const falling = new LeafField(
    { count: 34, seed: 43, renderOrder: 8, focus: 4, focusRange: 1.4, place: fallingLeaves({ center: [0, 0, 0.4], spread: [6, 4.5], top: 4.2, bottom: 0.05, speed: 0.6, wind: [0.2, 0.05], size: [0.24, 0.42], seed: 43, feather: 0.25 }) },
    light,
  )
  const shafts = new Shafts(4, { width: 1.6, length: 9, spread: 6, angle: 0.5, color: 0xffb873, seed: 31 })
  shafts.group.position.set(-1.2, 2.2, -1.5)
  const dust = new Dust(70, [7, 3, 5], [0, 1.4, 0.5], 0.045, 0xffd9ae, 0.4, 33)
  scene.add(rest.group, falling.group, shafts.group, dust.points)

  return {
    aa: true,
    render(t, target) {
      // cover: opens on the first beat; leaves follow on the next bar lines
      const open = easeInOutCubic(ramp(t, 0.35, 1.5, (x) => x))
      const turn1 = ramp(t, 1.95, 3.0, (x) => x)
      const turn2 = ramp(t, dur - 1.45, dur - 0.4, (x) => x)
      book.update(t, open, [turn1, turn2])
      // the camera starts on the closed book (it lies to the left of its spine) and settles on the spread
      const k = smooth(ramp(t, 0.2, 1.9, (x) => x))
      const push = t / dur
      const cx = lerp(-0.5, 0.0, k)
      if (stage.tall) {
        cam.position.set(cx * 0.6 + 0.05 + drift(t * 0.3, 3) * 0.02, lerp(4.6, 5.9, k) - push * 0.3, lerp(3.0, 3.6, k))
        cam.lookAt(cx * 0.6 - 0.02, 0, lerp(0.75, 0.95, k))
      } else {
        cam.position.set(cx + 0.56 + drift(t * 0.3, 3) * 0.02, lerp(2.45, 2.85, k) - push * 0.16, lerp(2.05, 2.4, k) - push * 0.14)
        cam.lookAt(cx + 0.34, 0, 0.02)
      }
      const focus = cam.position.length()
      ground.update(t, focus, 1.3)
      rest.setFocus(focus, 1.2)
      falling.setFocus(focus, 1.0)
      rest.update(t, cam)
      falling.update(t + 5, cam)
      shafts.update(t, 0.9)
      dust.update(t)
      const r = stage.renderer
      r.setRenderTarget(target)
      r.setClearColor(0x000000, 1)
      r.clear()
      r.render(scene, cam)
    },
  }
}
