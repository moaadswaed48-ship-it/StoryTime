import { describe, expect, it } from 'vitest'
import { CAST } from '@/cast/cast'
import { BONES, GESTURES, type Stage } from '@/cast/sheet'
import { GESTURE_SECONDS, gesturePose } from '@/studio/figure/gestures'
import { FACES, mixPose, rest, type Pose } from '@/studio/figure/pose'
import { rigOf, solve } from '@/studio/figure/rig'
import { PROFILES } from '@/studio/style/profile'

const finite = (o: object, where: string) => {
  for (const [k, v] of Object.entries(o)) {
    if (typeof v === 'number') expect(Number.isFinite(v), `${where}.${k} = ${v}`).toBe(true)
    else if (v && typeof v === 'object' && !Array.isArray(v) && typeof (v as { x?: unknown }).x === 'number') finite(v, `${where}.${k}`)
  }
}

describe('the cast', () => {
  it('has unique ids, names in four languages and all five life stages', () => {
    expect(new Set(CAST.map((s) => s.id)).size).toBe(CAST.length)
    expect(CAST.length).toBeGreaterThanOrEqual(12)
    for (const s of CAST) for (const l of ['ar', 'he', 'en', 'da'] as const) expect(s.name[l].length).toBeGreaterThan(0)
    const stages = new Set<Stage>(CAST.map((s) => s.stage))
    expect([...stages].sort()).toEqual(['adult', 'child', 'elder', 'teen', 'toddler'])
  })
  it('keeps the shared contract', () => {
    expect(GESTURES).toEqual(['idle', 'wave', 'dance', 'jump', 'clap', 'spin', 'bow', 'cheer', 'think', 'peek', 'hug'])
    expect(BONES.length).toBe(19)
  })
})

describe('rigs', () => {
  for (const st of Object.values(PROFILES)) {
    it(`gives every sheet sane proportions under "${st.id}"`, () => {
      for (const s of CAST) {
        const g = rigOf(s, st)
        finite(g, s.id)
        for (const k of ['H', 'headRx', 'headRy', 'torso', 'shW', 'armU', 'armL', 'legU', 'legL', 'hand', 'footL'] as const) expect(g[k], `${s.id}.${k}`).toBeGreaterThan(0)
        // the parts add up to the height
        expect(g.footH + g.legU + g.legL + g.torso + g.neck + g.headRy).toBeCloseTo(g.H - g.headRy * 0.1, -1)
      }
      const h = (id: string) => rigOf(CAST.find((s) => s.id === id)!, st).H
      expect(h('sami')).toBeLessThan(h('noor'))
      expect(h('noor')).toBeLessThan(h('dana'))
      expect(h('dana')).toBeLessThan(h('karim'))
    })
  }
})

describe('gestures', () => {
  it('give finite poses and joints for every sheet at every drawing', () => {
    const st = PROFILES.gouache
    for (const s of CAST) {
      const g = rigOf(s, st)
      for (const name of GESTURES) {
        const d = GESTURE_SECONDS[name]
        for (let t = 0; t <= d + 0.001; t += 1 / 12) {
          const p = gesturePose(name, t, 300, 800)
          finite(p, `${s.id}.${name}@${t.toFixed(2)}`)
          const k = solve(g, p, 1.2)
          finite(k, `${s.id}.${name}@${t.toFixed(2)}.skeleton`)
          // feet never sink into the floor, hands never leave the arm
          expect(k.ftR.y).toBeLessThanOrEqual(0.001)
          expect(k.ftL.y).toBeLessThanOrEqual(0.001)
          for (const [sh, ha] of [[k.shR, k.haR], [k.shL, k.haL]] as const) expect(Math.hypot(ha.x - sh.x, ha.y - sh.y)).toBeLessThanOrEqual((g.armU + g.armL) * 1.001)
          const w = k.world(k.head)
          expect(w.y).toBeLessThan(800)
        }
      }
    }
  })
  it('start and end at rest, so they chain and loop', () => {
    const R = rest(0, 0)
    for (const name of GESTURES) {
      for (const t of [0, GESTURE_SECONDS[name] - 0.001]) {
        const p = gesturePose(name, t)
        for (const key of ['rx', 'ry', 'lx', 'ly', 'lift', 'crouch', 'pitch', 'rB', 'lB', 'rH', 'lH', 'rHand', 'lHand'] as const) expect(p[key], `${name}.${key}@${t}`).toBeCloseTo(key === 'lift' || key === 'crouch' ? 0 : R[key], 1)
        expect(Math.cos(p.spin)).toBeCloseTo(1, 2)
      }
    }
  })
  it('move the same way on a toddler and on an adult (hands meet when clapping)', () => {
    const st = PROFILES.gouache
    for (const id of ['lulu', 'maya', 'karim']) {
      const g = rigOf(CAST.find((s) => s.id === id)!, st)
      const k = solve(g, gesturePose('clap', 0.4 + 0.5 / 2.7))
      expect(Math.abs(k.haR.x - k.haL.x)).toBeLessThan(g.shW * 0.5)
    }
  })
})

describe('poses', () => {
  it('blend number by number, but switch hand shapes instead of counting through them', () => {
    const a = rest()
    const b: Pose = { ...rest(), ...FACES.delight, rHand: 5, lean: 0.4 }
    expect(mixPose(a, b, 0.5).lean).toBeCloseTo(0.2)
    expect(mixPose(a, b, 0.4).rHand).toBe(0)
    expect(mixPose(a, b, 0.6).rHand).toBe(5)
    expect(mixPose(a, b, 1).smile).toBe(1)
  })
  it('every named face is a face', () => {
    for (const f of Object.values(FACES)) for (const v of Object.values(f)) expect(Number.isFinite(v)).toBe(true)
  })
})
