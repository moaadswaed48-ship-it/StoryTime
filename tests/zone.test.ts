import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { LangJson, StoryJson } from '@/content/schema'
import type { AgeGroup } from '@/data/types'
import { LANGS, isRtl } from '@/i18n/config'
import { layoutZone, MIN_FONT, scriptOf, TEXT_SCALES, type MeasureAt } from '@/reader/zone'

/**
 * The words-over-picture layout. The measure here is an estimate (average glyph widths, a little generous); the
 * browser walk (e2e/stage4b1.spec.ts) checks the same rules with real fonts.
 */
const WIDTH = { arabic: 0.52, hebrew: 0.56, latin: 0.54 }
const measureFor = (lang: string): MeasureAt => (s, px) => s.length * px * WIDTH[scriptOf(lang)]
const ROOT = new URL('../content/stories/', import.meta.url).pathname
const read = <T>(p: string) => JSON.parse(readFileSync(p, 'utf8')) as T
const SIZES = { phone: [390, 700], 'phone-small': [320, 560], tablet: [560, 720], desktop: [608, 760] } as const

const base = { pageW: 390, pageH: 700, rtl: false, group: '4-5' as AgeGroup, scale: 0, script: 'latin' as const, measure: measureFor('en') }

describe('zone layout', () => {
  it('mirrors a side zone by reading direction (the art does not move)', () => {
    const z = { side: 'start' as const, v: 'top' as const, size: 'l' as const }
    const ltr = layoutZone({ ...base, pageW: 900, pageH: 760, zone: z, text: 'Short words here.' })
    const rtl = layoutZone({ ...base, pageW: 900, pageH: 760, zone: z, rtl: true, text: 'Short words here.' })
    expect(ltr.kind).toBe('column')
    expect(ltr.side).toBe('left')
    expect(rtl.side).toBe('right')
    expect(rtl.box.x + rtl.box.w).toBeCloseTo(900 - ltr.box.x, 0)
    const end = layoutZone({ ...base, pageW: 900, pageH: 760, zone: { ...z, side: 'end' }, text: 'Short.' })
    expect(end.side).toBe('right')
  })

  it('a side column too narrow for the type becomes a full-width band on a phone', () => {
    const l = layoutZone({ ...base, zone: { side: 'start', v: 'bottom', size: 'm' }, text: 'Here is a red ball. It is round.' })
    expect(l.kind).toBe('band')
    expect(l.box.y + l.box.h).toBeLessThanOrEqual(700)
  })

  it('places top, middle and bottom zones where they say, inside the page', () => {
    for (const v of ['top', 'middle', 'bottom'] as const) {
      const l = layoutZone({ ...base, zone: { side: 'full', v, size: 'm' }, text: 'A few words for the page.' })
      expect(l.box.y).toBeGreaterThanOrEqual(0)
      expect(l.box.y + l.box.h).toBeLessThanOrEqual(700)
      if (v === 'top') expect(l.box.y).toBeLessThan(100)
      if (v === 'bottom') expect(l.box.y + l.box.h).toBeGreaterThan(600)
    }
  })

  it('grows the wash rather than shrinking the type below the minimum', () => {
    const long = Array.from({ length: 60 }, (_, i) => `word${i}`).join(' ')
    const l = layoutZone({ ...base, group: '6-8', zone: { side: 'full', v: 'top', size: 's' }, text: long })
    expect(l.fontSize).toBeGreaterThanOrEqual(MIN_FONT['6-8'])
    expect(l.box.h).toBeGreaterThan(700 * 0.3) // past the small calm area
    expect(l.overflow).toBe(false)
  })

  it('the larger text sizes stay at or above their own floor', () => {
    for (let s = 0; s < TEXT_SCALES.length; s++) {
      const l = layoutZone({ ...base, group: '2-3', scale: s, zone: { side: 'full', v: 'bottom', size: 'm' }, text: 'The ball rolls. Roll, roll, roll!' })
      expect(l.fontSize).toBeGreaterThanOrEqual(MIN_FONT['2-3'] * TEXT_SCALES[s]! - 0.01)
    }
  })

  // The longest of the four languages on every page of every sample story, at every page size: never below the
  // age group's minimum, every line inside the box, no scrolling at the normal and the next text size.
  for (const id of ['sample-a', 'sample-b', 'sample-c']) {
    it(`${id}: the longest language fits at the minimum size or larger, on phone, tablet and desktop pages`, () => {
      const story = read<StoryJson>(`${ROOT}${id}/story.json`)
      const texts = Object.fromEntries(LANGS.map((l) => [l, read<LangJson>(`${ROOT}${id}/${l}.json`)]))
      const group = story.ageGroups[0]!
      for (const page of story.pages) {
        const longest = [...LANGS].sort((a, b) => measureFor(b)(texts[b]!.pages[page.n - 1]!.text, 20) - measureFor(a)(texts[a]!.pages[page.n - 1]!.text, 20))[0]!
        const text = texts[longest]!.pages[page.n - 1]!.text
        for (const [name, [w, h]] of Object.entries(SIZES)) {
          for (const scale of [0, 1]) {
            const l = layoutZone({ pageW: w, pageH: h, zone: page.zone, rtl: isRtl(longest), group, scale, script: scriptOf(longest), text, measure: measureFor(longest) })
            const where = `${id} p${page.n} ${longest} ${name} scale ${scale}`
            expect(l.fontSize, where).toBeGreaterThanOrEqual(MIN_FONT[group] * TEXT_SCALES[scale]! - 0.01)
            expect(l.overflow, where).toBe(false)
            const inner = l.box.w - 2 * l.padX
            for (const line of l.lines) expect(measureFor(longest)(line, l.fontSize), where).toBeLessThanOrEqual(inner + 0.5)
            expect(l.lines.join(' '), where).toBe(text.split(/\s+/).join(' ')) // nothing added or lost
            expect(l.box.x).toBeGreaterThanOrEqual(0)
            expect(l.box.x + l.box.w).toBeLessThanOrEqual(w)
          }
        }
      }
    })
  }
})
