import * as THREE from 'three'
import { drift, hash, ramp, smooth } from '../engine/math'
import type { Shot, Stage } from '../engine/stage'
import { LeafField, WARM_LIGHT, type LeafState } from '../kit/leaves'
import { PaperSet } from '../kit/papers'
import { Plate, sitePicture } from '../kit/plate'
import { blurredCopy, imageTexture } from '../kit/textures'
import { Dust, Shafts } from '../kit/world'

/**
 * "The wind is playing with us": the camera stands inside the gust. Name papers and leaves spiral up
 * around the lens in real depth — some pass close and soft, some turn their names to us — over the
 * out-of-focus yard of the painting. Everything is a closed-form function of time.
 */
export interface GustOptions {
  picture?: string
  papers?: number
  leaves?: number
  /** Strength of the wind over the shot: 0 calm … 1 full. Defaults to a gust that is already blowing. */
  wind?: (t: number) => number
  /** 0…1: how far the scene has turned from papers to leaves (used by the story film). */
  seed?: number
  exposure?: number
}

const _e = new THREE.Euler()

export async function gustShot(stage: Stage, o: GustOptions = {}): Promise<Shot> {
  const img = await sitePicture(o.picture ?? 'k06')
  const plate = new Plate(stage, imageTexture(blurredCopy(img, 7, 720), false), img.width / img.height)
  const scene = new THREE.Scene()
  const cam = new THREE.PerspectiveCamera(stage.tall ? 52 : 36, stage.aspect, 0.1, 80)
  const light = WARM_LIGHT()
  const seed = o.seed ?? 1
  const nP = o.papers ?? 44
  const set = new PaperSet(light)
  set.shadows = false
  set.focus = 4.2
  set.focusRange = 1.5
  for (let i = 0; i < nP; i++) set.add(5, 0.5 + hash(i, seed + 40) * 0.2) // blank sides, as in the footage: tumbling names would read upside-down
  const wind = o.wind ?? (() => 1)

  // each object rides a helix around a slowly wandering axis; `u` is how far it has travelled
  const helix = (i: number, t: number, k: number, out: THREE.Vector3) => {
    const r = (n: number) => hash(i, seed * 31 + n + k * 100)
    const speed = 0.55 + r(1) * 0.6
    const u = t * speed + r(2) * 9
    const turn = u * (1.1 + r(3) * 0.8) + r(4) * 6.283
    const rad = 0.9 + r(5) * 2.9 + Math.sin(u * 0.9 + r(6) * 6) * 0.35
    const H = 7.5
    const y = ((((r(7) * H + u * (0.55 + r(8) * 0.5)) % H) + H) % H) - H / 2 + 0.6
    const cx = Math.sin(t * 0.4 + 1) * 0.5
    out.set(cx + Math.cos(turn) * rad * (stage.tall ? 0.72 : 1.35), y + Math.sin(turn * 2 + r(9) * 6) * 0.25, 0.4 + Math.sin(turn) * rad * 1.15)
    return { u, turn, y, H }
  }

  const leaves = new LeafField(
    {
      count: o.leaves ?? 170,
      seed: seed + 5,
      focus: 4.2,
      focusRange: 1.4,
      place: (i: number, t: number, s: LeafState) => {
        const h = helix(i, t, 1, s.pos)
        const r = (n: number) => hash(i, seed * 17 + n)
        _e.set(h.u * (2.2 + r(1) * 2.5) + r(2) * 6, h.turn + r(3) * 6, h.u * (1.2 + r(4) * 2) + r(5) * 6)
        s.quat.setFromEuler(_e)
        s.size = 0.2 + r(6) ** 1.5 * 0.34
        const edge = Math.min(1, (s.pos.y + h.H / 2 - 0.6) / 0.8, (h.H / 2 + 0.6 - s.pos.y) / 0.8)
        s.alpha = Math.max(0, edge)
        s.curl = (0.3 + r(7) * 0.6) * (r(8) < 0.5 ? -1 : 1)
      },
    },
    light,
  )
  const shafts = new Shafts(6, { width: 1.5, length: 14, spread: stage.tall ? 5 : 10, angle: 0.58, color: 0xffbe7c, seed: 8 })
  shafts.group.position.set(-1, 1, -2.5)
  const dust = new Dust(110, [stage.tall ? 6 : 11, 7, 6], [0, 0.6, 1], 0.06, 0xffd9ae, 0.45, 12)
  scene.add(shafts.group, set.group, leaves.group, dust.points)

  const p = new THREE.Vector3()
  return {
    render(t, target) {
      const w = wind(t)
      plate.look({ cx: 0.5 + drift(t * 0.3, 1) * 0.006, cy: 0.42 - ramp(t, 0, 3) * 0.03, zoom: 1.12 + ramp(t, 0, 3) * 0.06, exposure: o.exposure ?? 0.78, tint: [1, 0.94, 0.86] })
      plate.draw(target, true)
      const k = smooth(Math.min(1, t / 3))
      cam.position.set(drift(t * 0.3, 5) * 0.12, 0.2 + k * 0.25, 6.6 - k * 0.9)
      cam.lookAt(0, 0.9 + k * 0.35, 0)
      const tt = t * (0.55 + 0.45 * w) + 4
      set.papers.forEach((paper, i) => {
        const h = helix(i, tt, 0, p)
        paper.pos.copy(p)
        const r = (n: number) => hash(i, seed * 23 + n)
        // tumbling, but slow enough that a name can be read when a sheet faces us
        _e.set(h.u * (1.3 + r(1) * 1.4) + r(2) * 6, h.turn * 0.6 + r(3) * 6, Math.sin(h.u * 1.7 + r(4) * 6) * 0.9)
        paper.quat.setFromEuler(_e)
        paper.bend = Math.sin(h.u * 2.3 + r(5) * 6) * 0.32
        paper.wave = 0.6 + 0.4 * Math.sin(h.u * 3.1 + r(6) * 6)
        paper.corner = 0
        paper.dapple = 0
        const edge = Math.min(1, (p.y + h.H / 2 - 0.6) / 0.8, (h.H / 2 + 0.6 - p.y) / 0.8)
        paper.alpha = Math.max(0, edge)
      })
      set.update(t, cam)
      shafts.update(t, 1.2)
      dust.update(t, [0.5, 0.25, 0.1])
      leaves.update(tt, cam)
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
