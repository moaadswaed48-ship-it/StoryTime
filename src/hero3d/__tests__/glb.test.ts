/**
 * The game export: a figure written to GLB must load back with the standard bones and every gesture clip.
 * Run with: npx vitest run --config scripts/hero/vitest.config.ts
 */
import { describe, expect, it } from 'vitest'
import { CAST } from '../../cast/cast.ts'
import { HERO_SAMPLES } from '../../cast/samples.ts'
import { BONES, GESTURES } from '../../cast/sheet.ts'
import { buildFigure } from '../figure.ts'
import { GESTURE_DEFS, IDLE_LOOP } from '../gestures.ts'
import { roundTrip } from '../glb.ts'
import { REST, copyPose } from '../pose.ts'
import { ACTS, gesturePose } from '../gestures.ts'
import { newSolved, solve } from '../solver.ts'

describe('hero3d GLB export', () => {
  it('has six sample sheets with unique ids', () => {
    expect(HERO_SAMPLES).toHaveLength(6)
    expect(new Set(HERO_SAMPLES.map((s) => s.id)).size).toBe(6)
  })

  for (const sheet of HERO_SAMPLES) {
    it(`${sheet.id}: loads back with the same bone names and clip names`, async () => {
      const { bytes, summary } = await roundTrip(sheet)
      expect(bytes.byteLength).toBeGreaterThan(50_000)
      expect([...summary.bones].sort()).toEqual([...BONES].sort())
      expect(summary.clips).toEqual([...GESTURES])
      for (const g of GESTURES) expect(summary.durations[g]).toBeCloseTo(g === 'idle' ? IDLE_LOOP : GESTURE_DEFS[g].duration, 1)
      expect(summary.meshes).toContain('body')
      expect(summary.meshes).not.toContain('outline')
      expect(summary.morphs.mouth).toEqual(['smile', 'open', 'round'])
      expect(summary.morphs.lids).toEqual(['blink', 'happy'])
    })
  }
})

describe('hero3d figures', () => {
  it('builds every sheet in the cast without a bad number in the mesh', () => {
    const counts: string[] = []
    for (const sheet of CAST) {
      const f = buildFigure(sheet)
      const pos = f.body.geometry.getAttribute('position').array as Float32Array
      const w = f.body.geometry.getAttribute('skinWeight').array as Float32Array
      expect(pos.every(Number.isFinite), sheet.id).toBe(true)
      for (let i = 0; i < w.length; i += 4) expect(w[i] + w[i + 1] + w[i + 2] + w[i + 3]).toBeCloseTo(1, 4)
      counts.push(`${sheet.id} ${pos.length / 3}`)
      expect(pos.length / 3, `${sheet.id} vertex count`).toBeLessThan(12_000)
      f.dispose()
    }
    console.log(counts.join(', '))
  })

  it('every gesture starts and ends at rest, and planted feet stay where they stand', () => {
    for (const sheet of HERO_SAMPLES) {
      const f = buildFigure(sheet)
      const pose = copyPose(REST)
      const s = newSolved()
      solve(f.rig, copyPose(REST), s)
      const home = { l: s.at.leftFoot.clone(), r: s.at.rightFoot.clone() }
      const restAt = Object.fromEntries(Object.entries(s.at).map(([k, v]) => [k, v.clone()])) as typeof s.at
      for (const act of ACTS) {
        const d = GESTURE_DEFS[act].duration
        for (const t of [0, d]) {
          gesturePose(act, t, pose)
          solve(f.rig, pose, s)
          for (const k of Object.keys(s.at) as (keyof typeof s.at)[]) expect(s.at[k].distanceTo(restAt[k]), `${act} ${k} at ${t}`).toBeLessThan(f.rig.H * 0.004)
          for (const k of ['blink', 'happy', 'smile', 'open', 'round', 'browL', 'browR', 'lookX', 'lookY', 'squash'] as const) expect(pose[k], `${act} ${k} at ${t}`).toBeCloseTo(REST[k], 2)
        }
        // while a foot is neither lifted, raised on its toes nor airborne, it must not slide
        for (let t = 0; t <= d; t += 1 / 30) {
          gesturePose(act, t, pose)
          solve(f.rig, pose, s)
          for (const [side, c, at] of [['l', 'L', s.at.leftFoot], ['r', 'R', s.at.rightFoot]] as const) {
            const planted = pose.lift === 0 && pose[`fp${c}`] === 0 && pose[`fy${c}`] === 0 && pose[`fx${c}`] === 0 && pose[`fz${c}`] === 0
            if (planted) expect(at.distanceTo(home[side]), `${sheet.id} ${act} ${side} foot at ${t.toFixed(2)}`).toBeLessThan(f.rig.leg * 0.012)
          }
        }
      }
      f.dispose()
    }
  })

  it('blends gestures in and out of idle without pops, even when one interrupts another', () => {
    const sheet = HERO_SAMPLES[0]
    const f = buildFigure(sheet)
    const keys = Object.keys(f.solved.at) as (keyof typeof f.solved.at)[]
    const last = Object.fromEntries(keys.map((k) => [k, f.solved.at[k].clone()])) as typeof f.solved.at
    const speed = Object.fromEntries(keys.map((k) => [k, 0])) as Record<(typeof keys)[number], number>
    let worst = 0
    let worstAt = ''
    let frame = 0
    const pops: string[] = []
    // A pop is a jolt: a joint that suddenly moves (or stops) far faster than in the frame before, by a visible
    // part of the body. Fast but smooth moves (a spin, a flung arm) change speed gradually and are fine.
    const step = (label: string) => {
      f.update(1 / 60, { x: Math.sin(frame / 40), y: Math.cos(frame / 55) })
      frame++
      for (const k of keys) {
        const d = f.solved.at[k].distanceTo(last[k]) / f.rig.H
        const jolt = Math.abs(d - speed[k])
        if (jolt > worst) {
          worst = jolt
          worstAt = `${label} ${k} frame ${frame}`
        }
        if (jolt > LIMIT) pops.push(`${label} ${k} frame ${frame}: speed ${(speed[k] * 100).toFixed(1)} → ${(d * 100).toFixed(1)}% of height per frame`)
        if (d > 0.2) pops.push(`${label} ${k} frame ${frame}: moved ${(d * 100).toFixed(0)}% of height in one frame`)
        speed[k] = d
        last[k].copy(f.solved.at[k])
      }
    }
    const LIMIT = 0.035
    for (let i = 0; i < 30; i++) step('idle')
    // each gesture in full, then each one cut short by the next at an awkward moment
    for (const act of ACTS) {
      f.play(act)
      for (let i = 0; i < GESTURE_DEFS[act].duration * 60 + 20; i++) step(act)
    }
    ACTS.forEach((act, n) => {
      f.play(act)
      for (let i = 0; i < 25 + n * 9; i++) step(`${act} (cut)`)
    })
    f.rest()
    for (let i = 0; i < 60; i++) step('rest')
    expect(f.playing).toBe('idle')
    expect(pops, pops.join('\n')).toEqual([])
    expect(worst, worstAt).toBeLessThan(LIMIT)
    console.log(`largest change of speed between two frames: ${(worst * 100).toFixed(1)}% of body height (${worstAt})`)
    f.dispose()
  })
})
