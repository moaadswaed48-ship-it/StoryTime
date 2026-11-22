import { describe, expect, it } from 'vitest'
import { buildBook, flow, geometryFor, pageOfScene, pagesAt, positionOf, relocate, stageFor, wrap } from '@/reader/layout'

/** A fake measure: every character is 10 px wide. */
const measure = (s: string) => s.length * 10

describe('reader layout (carried from the old build)', () => {
  it('a phone held upright gets one full-screen page; a wide screen gets a two-page spread', () => {
    expect(stageFor(390, 844)).toMatchObject({ spread: false, full: true, pageW: 390, pageH: 844 })
    const wide = stageFor(1440, 900)
    expect(wide.spread).toBe(true)
    expect(wide.left + wide.pageW).toBe(720) // the spine is at the middle of the screen
  })

  it('wrapping never adds, drops or splits a word', () => {
    const text = 'كان ساري طفلاً مليئًا بالحيوية والنشاط. في كل صباح، بالكاد يستطيع الجلوس في مكانه داخل الصف'
    const lines = wrap(text, 120, measure)
    expect(lines.length).toBeGreaterThan(1)
    expect(lines.join(' ')).toBe(text)
    for (const l of lines) expect(measure(l) <= 120 || !l.includes(' ')).toBe(true)
  })

  it('a dialogue dash stays with the word it introduces', () => {
    const lines = wrap('aaaa bbbb - cccc', 90, measure)
    expect(lines.some((l) => l.endsWith('-'))).toBe(false)
  })

  it('flow puts every line on a page, in order, inside the room it was given', () => {
    const paras = Array.from({ length: 6 }, (_, i) => `paragraph ${i} `.repeat(12).trim())
    const pages = flow(paras, 200, 300, 500, 30, 15, measure)
    const all = pages.flatMap((p) => p.lines.map((l) => l.text))
    expect(all.join(' ')).toBe(paras.flatMap((p) => wrap(p, 200, measure)).join(' '))
    pages.forEach((p, i) => expect(p.height).toBeLessThanOrEqual((i === 0 ? 300 : 500) + 0.5))
  })

  it('a two-page book always ends on a complete spread, and positions map to pages', () => {
    const g = geometryFor(500, 700, { size: 1, arabic: true })
    const scenes = [['one two three'], ['four five six seven'], ['eight']]
    const spread = buildBook(scenes, g, measure, true)
    expect(spread.length % 2).toBe(0)
    expect(spread[0].kind).toBe('title')
    expect(pageOfScene(spread, 1)).toBeGreaterThan(pageOfScene(spread, 0))
    expect(positionOf(3, true)).toBe(1)
    expect(pagesAt(1, spread.length, true)).toEqual([2, 3])
    // Re-flowing at another size keeps the reader in the same scene.
    const single = buildBook(scenes, g, measure, false)
    const at = pageOfScene(spread, 2)
    expect(single[relocate(spread[at], single)].scene).toBe(2)
  })
})
