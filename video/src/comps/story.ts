import * as THREE from 'three'
import type { Clip, Film, Grade, Shot, Stage } from '../engine/stage'
import { ramp } from '../engine/math'
import type { DepthSpec } from '../kit/plate'
import { Sparks } from '../kit/world'
import { footageShot } from '../shots/footage'
import { birdsShot, crownShot, layShot, leafShot, pictureShot, stickShot, waitShot } from '../shots/inserts'
import { plateShot, type PlateShotOptions } from '../shots/yard'
import { hash } from '../engine/math'
import TL from './story.timeline.json'

/**
 * The whole story, twelve scenes in order, with nothing written on the picture (the site's player sets
 * her words as captions from story.json). Thirty-two bars of 3/4 at 72 bpm: a scene with footage is two
 * bars (the clip at its own speed), a scene without footage is three — the painting, alive, for one bar
 * and a code-made close-up of what her text describes for two. Scenes dissolve into each other on the
 * bar line; inside a scene the cut is hard, on the bar.
 */
const DEPTH: Record<string, DepthSpec> = {
  k02: { horizon: 0.44, blobs: [{ x: 0.27, y: 0.45, rx: 0.14, ry: 0.3, d: 0.74 }, { x: 0.72, y: 0.45, rx: 0.14, ry: 0.28, d: 0.74 }, { x: 0.93, y: 0.3, rx: 0.08, ry: 0.36, d: 0.52 }] },
  k03: { horizon: 0.5, blobs: [{ x: 0.17, y: 0.56, rx: 0.14, ry: 0.3, d: 0.72 }, { x: 0.68, y: 0.62, rx: 0.17, ry: 0.25, d: 0.72 }] },
  k05: { horizon: 0.6, blobs: [{ x: 0.28, y: 0.46, rx: 0.15, ry: 0.4, d: 0.72 }, { x: 0.72, y: 0.46, rx: 0.11, ry: 0.38, d: 0.66 }] },
  k07: { horizon: 0.62, blobs: [{ x: 0.3, y: 0.68, rx: 0.13, ry: 0.3, d: 0.74 }, { x: 0.58, y: 0.62, rx: 0.13, ry: 0.37, d: 0.74 }, { x: 0.93, y: 0.4, rx: 0.07, ry: 0.45, d: 0.5 }] },
  k09: { horizon: 0.7, blobs: [{ x: 0.27, y: 0.45, rx: 0.09, ry: 0.4, d: 0.7 }, { x: 0.1, y: 0.6, rx: 0.08, ry: 0.25, d: 0.7 }, { x: 0.42, y: 0.55, rx: 0.09, ry: 0.3, d: 0.75 }, { x: 0.6, y: 0.55, rx: 0.08, ry: 0.3, d: 0.72 }, { x: 0.76, y: 0.55, rx: 0.1, ry: 0.25, d: 0.68 }, { x: 0.88, y: 0.3, rx: 0.08, ry: 0.35, d: 0.45 }] },
  k10: { horizon: 0.6, blobs: [{ x: 0.12, y: 0.65, rx: 0.13, ry: 0.25, d: 0.76 }, { x: 0.33, y: 0.45, rx: 0.1, ry: 0.35, d: 0.66 }, { x: 0.78, y: 0.6, rx: 0.2, ry: 0.28, d: 0.72 }, { x: 0.58, y: 0.78, rx: 0.12, ry: 0.12, d: 0.85 }] },
}
type Move = Pick<PlateShotOptions, 'from' | 'to' | 'travel' | 'leaves' | 'extra'>
const MOVES: Record<string, Move> = {
  k02: { from: { cx: 0.5, cy: 0.5, zoom: 1.02 }, to: { cx: 0.5, cy: 0.57, zoom: 1.13 }, travel: [0.012, 0.006] },
  k03: { from: { cx: 0.54, cy: 0.5, zoom: 1.05 }, to: { cx: 0.6, cy: 0.56, zoom: 1.16 }, travel: [0.014, 0.004] },
  k05: {
    from: { cx: 0.44, cy: 0.52, zoom: 1.16 },
    to: { cx: 0.5, cy: 0.5, zoom: 1.03 },
    travel: [-0.012, 0.003],
    leaves: 30,
    // the painted swirl of light around the paper keeps glittering
    extra: (scene: THREE.Scene) => {
      const sparks = new Sparks(46, 0.085)
      scene.add(sparks.points)
      return (t: number) =>
        sparks.update((i) => {
          const life = 1.1 + hash(i, 2) * 0.9
          const u = (((t + hash(i, 1) * life) % life) + life) % life / life
          const a = hash(i, 3) * 6.283 + u * 3
          const rad = 0.12 + u * 0.3
          return [-0.25 + Math.cos(a) * rad, -0.75 + u * 1.25, 0.5 + Math.sin(a) * rad, Math.sin(Math.PI * u) * (0.5 + 0.5 * Math.sin(t * 11 + i * 3))]
        })
    },
  },
  k07: { from: { cx: 0.5, cy: 0.42, zoom: 1.18 }, to: { cx: 0.52, cy: 0.47, zoom: 1.05 }, travel: [0.012, -0.004] },
  k09: { from: { cx: 0.5, cy: 0.5, zoom: 1.02 }, to: { cx: 0.48, cy: 0.46, zoom: 1.12 }, travel: [0.014, 0.004], leaves: 70 },
  k10: { from: { cx: 0.5, cy: 0.5, zoom: 1.12 }, to: { cx: 0.5, cy: 0.5, zoom: 1.02 }, travel: [-0.012, 0.003] },
}
const FOOT: Record<string, { from: { cx: number; cy: number; zoom: number }; to: { cx: number; cy: number; zoom: number }; leaves: number }> = {
  v01: { from: { cx: 0.5, cy: 0.5, zoom: 1.0 }, to: { cx: 0.48, cy: 0.49, zoom: 1.06 }, leaves: 8 },
  v04: { from: { cx: 0.5, cy: 0.5, zoom: 1.0 }, to: { cx: 0.5, cy: 0.52, zoom: 1.05 }, leaves: 14 },
  v06: { from: { cx: 0.5, cy: 0.5, zoom: 1.0 }, to: { cx: 0.5, cy: 0.48, zoom: 1.05 }, leaves: 24 },
  v08: { from: { cx: 0.5, cy: 0.5, zoom: 1.0 }, to: { cx: 0.52, cy: 0.5, zoom: 1.06 }, leaves: 30 },
  v11: { from: { cx: 0.5, cy: 0.5, zoom: 1.0 }, to: { cx: 0.5, cy: 0.5, zoom: 1.05 }, leaves: 14 },
  v12: { from: { cx: 0.5, cy: 0.5, zoom: 1.0 }, to: { cx: 0.5, cy: 0.48, zoom: 1.04 }, leaves: 12 },
}

async function build(stage: Stage): Promise<Film> {
  const B = TL.bar
  const X = TL.xfade
  const clips: Clip[] = []
  let seed = 1
  for (const sc of TL.scenes) {
    let t = sc.start
    for (let i = 0; i < sc.shots.length; i++) {
      const s = sc.shots[i] as { kind: string; clip?: string; picture?: string; bars: number }
      const dur = s.bars * B
      const first = i === 0
      const last = i === sc.shots.length - 1
      // scenes dissolve into each other across the bar line; shots inside a scene cut on it
      const start = first && sc.scene > 0 ? t - X / 2 : t
      const end = last && sc.scene < TL.scenes.length - 1 ? t + dur + X / 2 : t + dur
      const span = end - start
      let shot: Shot
      if (s.kind === 'footage') shot = footageShot(stage, { clip: s.clip!, startFrame: 0, dur: span, from: FOOT[s.clip!].from, to: FOOT[s.clip!].to, leaves: FOOT[s.clip!].leaves, leafSeed: seed })
      else if (s.kind === 'plate') shot = await plateShot(stage, { picture: s.picture!, depth: DEPTH[s.picture!], dur: span, seed, ...MOVES[s.picture!] })
      else if (s.kind === 'lay') shot = await layShot(stage, span)
      else if (s.kind === 'wait') shot = await waitShot(stage, span)
      else if (s.kind === 'stick') shot = await stickShot(stage, span, TL.beat + (first ? X / 2 : 0))
      else if (s.kind === 'leaf') shot = await leafShot(stage, span)
      else if (s.kind === 'picture') shot = await pictureShot(stage, span)
      else if (s.kind === 'crown') shot = await crownShot(stage, span)
      else shot = await birdsShot(stage, span)
      clips.push({ shot, start, end })
      t += dur
      seed += 2
    }
  }
  return {
    duration: TL.duration,
    clips,
    frame(time: number, grade: Grade) {
      grade.vignette = 0.3
      grade.glow = 0.1
      grade.fade = Math.max(1 - ramp(time, 0, 0.9), ramp(time, TL.duration - 2.2, TL.duration - 0.15))
    },
  }
}

export default { W: TL.width, H: TL.height, fps: TL.fps, build }
