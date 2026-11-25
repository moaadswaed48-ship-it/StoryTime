import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { LANGS } from '@/i18n/config'
import { loadDict } from '@/i18n/load'
import { SAMPLE } from '@/features/landing/ImpactChart'

/** The landing page's words (src/i18n/<lang>/landing.ts). Their completeness is enforced by the type check. */
describe('landing words', () => {
  it('quotes A04 page 5 exactly, the one story excerpt allowed in public HTML', async () => {
    for (const lang of LANGS) {
      const story = JSON.parse(readFileSync(`content/stories/a04/${lang}.json`, 'utf8')) as { title: string; pages: { text: string }[]; activity: { title: string } }
      const t = (await loadDict(lang)).landing.inside
      expect(t.excerpt, lang).toBe(story.pages[4].text)
      expect(t.storyTitle, lang).toBe(story.title)
      expect(t.do.text, `${lang}: activity named as in the story`).toContain(story.activity.title)
    }
  })

  it('keeps the headline to seven words or fewer', async () => {
    for (const lang of LANGS) {
      const words = (await loadDict(lang)).landing.hero.title.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w))
      expect(words.length, lang).toBeLessThanOrEqual(7)
    }
  })

  it('labels the graph as an illustration in every language', async () => {
    const marker = { ar: /توضيحي/, he: /איור/, en: /illustration/i, da: /illustration/i } as const
    for (const lang of LANGS) {
      const c = (await loadDict(lang)).landing.evidence.chart
      expect(c.label, lang).toMatch(marker[lang])
      expect(c.alt, lang).toMatch(marker[lang])
    }
  })

  it('draws a line that rises over time', () => {
    for (let i = 1; i < SAMPLE.length; i++) expect(SAMPLE[i]).toBeGreaterThan(SAMPLE[i - 1])
  })
})
