import { describe, expect, it } from 'vitest'
import { mulberry32 } from '@/lib/seeded'
import { t } from '@/i18n/copy'
import {
  OBSTACLES,
  REACH,
  START,
  YARD,
  allCollected,
  angleDelta,
  buildOptions,
  buildRound,
  collect,
  countCollected,
  firstLetter,
  gustTarget,
  isCorrect,
  nearestOpen,
  newProgress,
  pushOut,
  scatter,
  standPoint,
  stepWalker,
  touching,
} from '@/features/game/logic'

const AR_NAMES = ['حسن', 'أحمد', 'ساري', 'أمير', 'ليلى']
const AR_LETTERS = ['ح', 'أ', 'س', 'ل', 'م', 'ن', 'د', 'ر', 'ب']
const EN_NAMES = ['Hasan', 'Ahmad', 'Sari', 'Amir', 'Layla']
const EN_LETTERS = ['H', 'A', 'S', 'L', 'M', 'N', 'D', 'R', 'B']
const dist = (a: { x: number; z: number }, b: { x: number; z: number }) => Math.hypot(a.x - b.x, a.z - b.z)

describe('first letters', () => {
  it('reads Arabic names the way a child says them', () => {
    expect(AR_NAMES.map(firstLetter)).toEqual(['ح', 'أ', 'س', 'أ', 'ل'])
  })
  it('keeps the hamza on its alef even when the text is decomposed', () => {
    expect(firstLetter('أحمد')).toBe('أ')
  })
  it('reads Latin names, ignoring case and stray spaces', () => {
    expect(EN_NAMES.map(firstLetter)).toEqual(['H', 'A', 'S', 'A', 'L'])
    expect(firstLetter('  layla ')).toBe('L')
  })
  it('matches the site copy (Arabic in the test runner)', () => {
    expect(t.game.names).toHaveLength(5)
    for (const name of t.game.names) expect(t.game.letters).toContain(firstLetter(name))
  })
})

describe('answer buttons', () => {
  for (const [label, names, letters] of [
    ['Arabic', AR_NAMES, AR_LETTERS],
    ['English', EN_NAMES, EN_LETTERS],
  ] as const) {
    it(`${label}: three different letters, exactly one of them right`, () => {
      for (let seed = 1; seed <= 40; seed++) {
        const rng = mulberry32(seed)
        for (const name of names) {
          const options = buildOptions(name, letters, rng)
          expect(options).toHaveLength(3)
          expect(new Set(options).size).toBe(3)
          expect(options.filter((l) => isCorrect({ letter: firstLetter(name) }, l))).toHaveLength(1)
          for (const l of options) expect(letters).toContain(l)
        }
      }
    })
  }
  it('is the same for the same seed and moves the right answer around', () => {
    const a = buildOptions('ساري', AR_LETTERS, mulberry32(5))
    const b = buildOptions('ساري', AR_LETTERS, mulberry32(5))
    expect(a).toEqual(b)
    const places = new Set<number>()
    for (let seed = 1; seed <= 60; seed++) places.add(buildOptions('ساري', AR_LETTERS, mulberry32(seed)).indexOf('س'))
    expect(places.size).toBe(3)
  })
})

describe('the round', () => {
  it('scatters the papers inside the yard, apart from each other and from the tree', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const pts = scatter(5, mulberry32(seed))
      expect(pts).toHaveLength(5)
      for (const p of pts) {
        expect(p.x).toBeGreaterThanOrEqual(YARD.minX)
        expect(p.x).toBeLessThanOrEqual(YARD.maxX)
        expect(p.z).toBeGreaterThanOrEqual(YARD.minZ)
        expect(p.z).toBeLessThanOrEqual(YARD.maxZ)
        expect(dist(p, START)).toBeGreaterThan(REACH + 1) // never picked up by standing still
        for (const o of OBSTACLES) expect(dist(p, o)).toBeGreaterThan(o.r + 0.5)
      }
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) expect(dist(pts[i], pts[j])).toBeGreaterThan(REACH * 2)
      // the first paper is a few steps ahead of Sari
      expect(dist(pts[0], START)).toBeLessThan(5)
      expect(pts[0].z).toBeLessThan(START.z)
    }
  })
  it('builds one paper per name with its letter and options', () => {
    const round = buildRound(AR_NAMES, AR_LETTERS, mulberry32(11))
    expect(round.map((p) => p.name)).toEqual(AR_NAMES)
    expect(round.map((p) => p.letter)).toEqual(['ح', 'أ', 'س', 'أ', 'ل'])
    for (const p of round) expect(p.options).toContain(p.letter)
    expect(buildRound(AR_NAMES, AR_LETTERS, mulberry32(11))).toEqual(round)
    expect(buildRound(AR_NAMES, AR_LETTERS, mulberry32(12))).not.toEqual(round)
  })
  it('accepts only the first letter', () => {
    const [hasan] = buildRound(EN_NAMES, EN_LETTERS, mulberry32(3))
    expect(isCorrect(hasan, 'H')).toBe(true)
    expect(isCorrect(hasan, 'h')).toBe(true)
    expect(isCorrect(hasan, 'A')).toBe(false)
  })
})

describe('progress', () => {
  it('collects papers one by one and nobody loses', () => {
    let c = newProgress(5)
    expect(countCollected(c)).toBe(0)
    expect(allCollected(c)).toBe(false)
    c = collect(c, 2)
    c = collect(c, 2)
    expect(c).toEqual([false, false, true, false, false])
    for (const i of [0, 1, 3]) c = collect(c, i)
    expect(allCollected(c)).toBe(false)
    c = collect(c, 4)
    expect(countCollected(c)).toBe(5)
    expect(allCollected(c)).toBe(true)
    expect(allCollected([])).toBe(false)
  })
  it('finds the nearest paper still in the yard', () => {
    const papers = [{ x: 1, z: 0 }, { x: 3, z: 0 }, { x: -6, z: 0 }]
    expect(nearestOpen({ x: 0, z: 0 }, papers, [false, false, false])).toBe(0)
    expect(nearestOpen({ x: 0, z: 0 }, papers, [true, false, false])).toBe(1)
    expect(nearestOpen({ x: 0, z: 0 }, papers, [true, true, true])).toBe(-1)
  })
})

describe('moving about', () => {
  it('walks at a steady speed and stops at the fence', () => {
    let p = { x: 0, z: 0 }
    for (let i = 0; i < 30; i++) p = stepWalker(p, { x: 1, z: 0 }, 1 / 30, 3)
    expect(p.x).toBeCloseTo(3, 5)
    for (let i = 0; i < 600; i++) p = stepWalker(p, { x: 5, z: -5 }, 1 / 30)
    expect(p.x).toBeCloseTo(YARD.maxX, 5)
    expect(p.z).toBeCloseTo(YARD.minZ, 5)
    expect(stepWalker(p, { x: 0, z: 0 }, 1 / 30)).toBe(p)
  })
  it('never ends up inside the tree', () => {
    const tree = OBSTACLES[0]
    let p = { x: tree.x + 3, z: tree.z }
    for (let i = 0; i < 300; i++) {
      p = stepWalker(p, { x: -1, z: 0.02 }, 1 / 30)
      expect(dist(p, tree)).toBeGreaterThanOrEqual(tree.r + 0.33)
    }
    expect(dist(pushOut({ x: tree.x, z: tree.z }), tree)).toBeGreaterThan(tree.r)
  })
  it('knows when Sari reaches a paper and where to stand beside one', () => {
    const paper = { x: 2, z: -1 }
    expect(touching({ x: 2.5, z: -1 }, paper)).toBe(true)
    expect(touching({ x: 4, z: -1 }, paper)).toBe(false)
    const near = standPoint(paper, { x: 2, z: 4 }, 1.8)
    expect(dist(near, paper)).toBeCloseTo(1.8, 5)
    expect(near.z).toBeGreaterThan(paper.z)
    expect(touching(near, paper)).toBe(false)
    expect(touching(standPoint(paper, near, 0.3), paper)).toBe(true)
  })
  it('turns the short way round', () => {
    expect(angleDelta(3, -3)).toBeCloseTo(Math.PI * 2 - 6, 6)
    expect(angleDelta(0.2, 0.5)).toBeCloseTo(0.3, 6)
    expect(Math.abs(angleDelta(-3.1, 3.1))).toBeLessThan(0.1)
  })
  it('lets a gust slide a paper without losing it or dropping it on Sari', () => {
    const rng = mulberry32(9)
    for (let i = 0; i < 200; i++) {
      const paper = { x: YARD.minX + rng() * (YARD.maxX - YARD.minX), z: YARD.minZ + rng() * (YARD.maxZ - YARD.minZ) }
      const a = rng() * Math.PI * 2
      const walker = { x: rng() * 4 - 2, z: rng() * 4 - 2 }
      const next = gustTarget(paper, { x: Math.cos(a), z: Math.sin(a) }, 1.2, walker)
      if (next !== paper) {
        expect(next.x).toBeGreaterThanOrEqual(YARD.minX)
        expect(next.x).toBeLessThanOrEqual(YARD.maxX)
        expect(next.z).toBeGreaterThanOrEqual(YARD.minZ)
        expect(next.z).toBeLessThanOrEqual(YARD.maxZ)
        expect(dist(next, walker)).toBeGreaterThanOrEqual(1.6)
        for (const o of OBSTACLES) expect(dist(next, o)).toBeGreaterThanOrEqual(o.r + 0.89)
      }
    }
  })
})
