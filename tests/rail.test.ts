import { describe, it, expect } from 'vitest'
import { makeRailBooks, startLanding, nudge, step, isSettled, RAIL } from '../src/three/shelf/rail'

const ids = Array.from({ length: 10 }, (_, i) => `b${i}`)
const widths = ids.map(() => 0.7)

function run(seed: number, mode: 'landing' | 'nudge', steps = 600) {
  const books = makeRailBooks(ids, widths, 0.82)
  if (mode === 'landing') startLanding(books, seed)
  else nudge(books, seed, 0.15)
  let t = 0
  for (let i = 0; i < steps; i++) {
    step(books, RAIL.SUB, t)
    t += RAIL.SUB
  }
  return books
}

describe('rail model', () => {
  it('is deterministic for a given seed', () => {
    const a = run(1337, 'landing')
    const b = run(1337, 'landing')
    expect(a.map((x) => x.x)).toEqual(b.map((x) => x.x))
    expect(a.map((x) => x.y)).toEqual(b.map((x) => x.y))
  })
  it('differs for a different seed', () => {
    const a = run(1337, 'landing')
    const b = run(7, 'landing')
    expect(a.map((x) => x.x)).not.toEqual(b.map((x) => x.x))
  })
  it('never lets books interpenetrate after contact resolution', () => {
    for (const seed of [1, 2, 3, 1337]) {
      const books = makeRailBooks(ids, widths, 0.82)
      startLanding(books, seed)
      let t = 0
      for (let i = 0; i < 400; i++) {
        step(books, RAIL.SUB, t)
        const active = books.filter((b) => t >= b.delay).sort((a, c) => a.x - c.x)
        t += RAIL.SUB
        for (let k = 0; k < active.length - 1; k++) {
          const overlap = active[k].x + active[k].w / 2 - (active[k + 1].x - active[k + 1].w / 2)
          expect(overlap).toBeLessThanOrEqual(1e-6)
        }
      }
    }
  })
  it('settles within 2.2 s at 120 Hz after a landing', () => {
    const books = makeRailBooks(ids, widths, 0.82)
    startLanding(books, 1337)
    let t = 0
    let settledAt = -1
    for (let i = 0; i < 120 * 3; i++) {
      step(books, RAIL.SUB, t)
      t += RAIL.SUB
      if (isSettled(books)) {
        settledAt = t
        break
      }
    }
    expect(settledAt).toBeGreaterThan(0)
    expect(settledAt).toBeLessThan(2.2)
  })
  it('settles quickly after a light nudge', () => {
    const books = run(1337, 'nudge', 120)
    expect(isSettled(books)).toBe(true)
  })
})
