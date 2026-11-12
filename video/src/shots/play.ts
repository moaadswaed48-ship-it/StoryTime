import * as THREE from 'three'
import { clamp, drift, easeOutCubic, hash, lerp } from '../engine/math'
import type { Shot, Stage } from '../engine/stage'
import { LeafField, WARM_LIGHT, fallingLeaves, type LeafState } from '../kit/leaves'
import { PaperSet } from '../kit/papers'
import { Plate, sitePicture } from '../kit/plate'
import { Sari, sariLights } from '../kit/sari'
import { blurredCopy, imageTexture, makeCanvas } from '../kit/textures'
import { Dust, Ground, Shafts, makeGlow } from '../kit/world'

/**
 * "Play": the game on the site in one tracking shot. Sari (the site's own rigged model) runs across the
 * yard and gathers the name papers the wind scattered; each one is taken on a beat of the music.
 * `collected(t)` tells the composition how many he has, for the counter.
 */
export interface PlayShot extends Shot {
  collected(t: number): number
  total: number
}

const _q = new THREE.Quaternion()
const _e = new THREE.Euler()

export async function playShot(stage: Stage, beat: number, dur: number): Promise<PlayShot> {
  const img = await sitePicture('k08')
  const plate = new Plate(stage, imageTexture(blurredCopy(img, 6, 720), false), img.width / img.height)
  const scene = new THREE.Scene()
  const cam = new THREE.PerspectiveCamera(stage.tall ? 40 : 26, stage.aspect, 0.1, 120)
  const light = WARM_LIGHT()
  const ground = new Ground(160)
  ground.uniforms.uHazeStart.value = 7
  ground.uniforms.uHazeEnd.value = 17
  ground.uniforms.uHaze.value = new THREE.Color(0.86, 0.5, 0.24)
  const sari = await Sari.create()
  // soft shadow under his feet
  const sc = makeCanvas(128, 128)
  const sg = sc.getContext('2d', { willReadFrequently: true })!
  const grd = sg.createRadialGradient(64, 64, 4, 64, 64, 62)
  grd.addColorStop(0, 'rgba(0,0,0,0.75)')
  grd.addColorStop(1, 'rgba(0,0,0,0)')
  sg.fillStyle = grd
  sg.fillRect(0, 0, 128, 128)
  const shGeo = new THREE.PlaneGeometry(1, 1)
  shGeo.rotateX(-Math.PI / 2)
  const shadow = new THREE.Mesh(shGeo, new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), color: 0x1a0c05, transparent: true, opacity: 0.6, depthWrite: false }))
  shadow.renderOrder = 2

  const SPEED = 2.35
  const total = 5
  const first = beat * 1 // first paper is taken on the second beat of the shot
  const takeAt = (k: number) => first + k * beat
  const set = new PaperSet(light)
  set.focusRange = 1.5
  const glows: THREE.Sprite[] = []
  for (let k = 0; k < total + 3; k++) {
    set.add(k % 4, 0.42) // the children's names only
    const g = makeGlow(0xffc37a, 1.5, 0.5)
    glows.push(g)
    scene.add(g)
  }
  // the air and the fallen leaves travel with the run, so the yard never empties
  let runZ = 0
  const fall = fallingLeaves({ center: [0, 0, 0], spread: [9, 9], top: 3.6, bottom: 0.02, speed: 0.6, wind: [0.3, 0.1], size: [0.2, 0.38], seed: 61, feather: 0.3 })
  const leaves = new LeafField(
    {
      count: 80,
      seed: 61,
      renderOrder: 8,
      focus: 5,
      focusRange: 1.4,
      place: (i: number, t: number, s: LeafState) => {
        fall(i, t, s)
        s.pos.z += runZ
      },
    },
    light,
  )
  const SPAN = 26
  const rest = new LeafField(
    {
      count: 190,
      seed: 67,
      renderOrder: 3,
      focus: 5,
      focusRange: 2.2,
      place: (i: number, _t: number, s: LeafState) => {
        const r = (n: number) => hash(i, 700 + n)
        // an endless carpet: each leaf keeps its place in the world, wrapped around the runner
        const z0 = r(2) * SPAN
        const z = runZ + 6 - ((((runZ + 6 - z0) % SPAN) + SPAN) % SPAN)
        s.pos.set((r(1) - 0.5) * 9, 0.012 + r(3) * 0.01, z)
        s.quat.setFromEuler(_e.set(-Math.PI / 2 + (r(4) - 0.5) * 0.2, 0, r(5) * 6.283, 'YXZ'))
        s.size = 0.26 + r(6) * 0.26
        s.curl = 0.25 + r(7) * 0.4
      },
    },
    light,
  )
  const shafts = new Shafts(5, { width: 1.8, length: 10, spread: 8, angle: 0.5, color: 0xffb873, seed: 51 })
  const dust = new Dust(90, [8, 3.4, 7], [0, 1.5, 0], 0.05, 0xffd9ae, 0.42, 53)
  scene.add(ground.mesh, shadow, sari.group, sariLights(), set.group, rest.group, leaves.group, shafts.group, dust.points)

  const collected = (t: number) => {
    let n = 0
    for (let k = 0; k < total; k++) if (t >= takeAt(k)) n++
    return n
  }
  return {
    aa: true,
    total,
    collected,
    render(t, target) {
      // Sari runs toward us; the camera backs away at his speed, so the papers come in past the lens,
      // sharpen as they near him, and are taken on the beat
      const sz = SPEED * t
      runZ = sz
      const lin = clamp(t / dur)
      plate.look({ cx: 0.22 + drift(t * 0.3, 7) * 0.006, cy: 0.56, zoom: lerp(2.4, 2.2, lin), exposure: 0.9, tint: [1, 0.95, 0.88] })
      plate.draw(target, true)
      sari.group.position.set(0, 0, sz)
      sari.group.rotation.y = 0.18 + Math.sin(t * 1.1) * 0.05
      sari.pose({ run: 1, t, runTime: t * 1.05 + 0.2 })
      shadow.position.set(0.08, 0.004, sz - 0.05)
      shadow.scale.set(0.8, 1, 0.7)
      const dist = stage.tall ? 4.6 : 3.7
      const side = stage.tall ? 0 : 0.95 // the wide cut leaves the right of the frame to the words
      cam.position.set(side + drift(t * 0.5, 2) * 0.03, 0.86 + drift(t * 0.45, 4) * 0.015, sz + dist)
      cam.lookAt(side * 0.92, stage.tall ? 0.4 : 0.6, sz)
      const focus = dist
      ground.update(t, focus, 1.6)
      set.focus = focus
      set.papers.forEach((p, k) => {
        const tk = takeAt(k)
        // wide: the camera stands to his right, so every paper waits on that side, clear of the line of
        // sight to him; phone: either side, close enough to stay inside the narrow frame
        const px = stage.tall ? (k % 2 ? 0.34 : -0.34) : 0.66 + (k % 2 ? 0.1 : 0) + Math.sin(k * 1.9) * 0.03
        const pz = SPEED * tk + 0.32
        // papers near the lens are not drawn; they fade in once they are clear of it and inside the frame
        const seen = clamp((sz + dist - pz - (stage.tall ? 2.7 : 1.9)) / 0.6)
        const since = t - tk
        const bob = Math.sin(t * 2.4 + k * 1.3) * 0.05
        const pop = clamp(since / 0.42)
        const e = easeOutCubic(pop)
        // taken: it lifts up and out to its own side, so it never crosses his face
        const y = (k % 2 ? 0.9 : 0.72) + bob + (since > 0 ? e * 1.0 : 0)
        const x = px + (since > 0 ? Math.sign(px) * e * 0.5 : 0)
        p.pos.set(x, y, pz + (since > 0 ? SPEED * since : 0))
        // face the camera, swaying; spin away when taken
        _e.set(-0.06, Math.sin(t * 1.6 + k * 2.1) * 0.35 + (since > 0 ? e * 3.4 : 0), Math.sin(t * 1.3 + k) * 0.07)
        p.quat.setFromEuler(_e)
        p.size = (0.42 / 0.86) * (since > 0 ? 1 - e * 0.35 : 1)
        // papers behind the lens are not drawn; they fade in as they enter the frame
        p.alpha = (since > 0 ? 1 - pop * pop : 1) * seen
        p.bend = 0.08 + Math.sin(t * 2 + k) * 0.05
        p.wave = 0.25
        p.dapple = 0.35
        const g = glows[k]
        g.position.set(x, y, p.pos.z - 0.06)
        const mat = g.material as THREE.SpriteMaterial
        mat.opacity = (since > 0 ? 0.9 * (1 - pop) : 0.3 + 0.08 * Math.sin(t * 3 + k)) * seen
        g.scale.setScalar(since > 0 ? 1.4 + e * 2.2 : 1.3)
      })
      set.update(t, cam)
      rest.setFocus(focus, 1.8)
      leaves.setFocus(focus, 1.3)
      rest.update(t, cam)
      leaves.update(t + 2, cam)
      shafts.group.position.set(-1.6, 2.6, sz - 2)
      shafts.update(t, 0.85)
      dust.points.position.z = sz
      dust.update(t)
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
