import { describe, it, expect } from 'vitest'
import { newRound, catchLetter, wanted, isDone, pickLetter } from '../src/game/logic'
import { mulberry32 } from '../src/lib/seeded'

describe('names game rules', () => {
  it('collects Arabic letters in order and ignores wrong ones', () => {
    const r = newRound('حسن')
    expect(wanted(r)).toBe('ح')
    expect(catchLetter(r, 'ن')).toBe(false)
    expect(r.got).toBe(0)
    expect(catchLetter(r, 'ح')).toBe(true)
    expect(catchLetter(r, 'س')).toBe(true)
    expect(isDone(r)).toBe(false)
    expect(catchLetter(r, 'ن')).toBe(true)
    expect(isDone(r)).toBe(true)
    expect(catchLetter(r, 'ن')).toBe(false)
  })
  it('offers the wanted letter often enough to finish', () => {
    const r = newRound('أحمد')
    const rand = mulberry32(7)
    const pool = ['أ', 'ح', 'م', 'د', 'س', 'ن']
    let n = 0
    while (!isDone(r) && n < 200) {
      catchLetter(r, pickLetter(r, rand, pool))
      n++
    }
    expect(isDone(r)).toBe(true)
    expect(n).toBeLessThan(60)
  })
})
