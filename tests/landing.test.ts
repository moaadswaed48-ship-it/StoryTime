import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { LANGS } from '@/i18n/config'
import { loadLanding } from '@/i18n/landing'
import { SAMPLE } from '@/features/landing/ImpactChart'

/** The landing page's words (src/i18n/<lang>/landing.ts). Their completeness is enforced by the type check. */
/** Every key path, e.g. "hero.title" or "faq.items.3.q". */
function paths(o: unknown, prefix = ''): string[] {
  if (typeof o !== 'object' || o === null) return [prefix]
  return Object.entries(o).flatMap(([k, v]) => paths(v, prefix ? `${prefix}.${k}` : k)).sort()
}
function leaves(o: unknown): string[] {
  if (typeof o === 'string') return [o]
  return typeof o === 'object' && o !== null ? Object.values(o).flatMap(leaves) : []
}

describe('landing words', () => {
  it('have the same keys in all four languages, none empty, Arabic and Hebrew in their own script', async () => {
    const all = await Promise.all(LANGS.map(loadLanding))
    for (const d of all) expect(paths(d)).toEqual(paths(all[0]))
    const script = { ar: /[\u0600-\u06FF]/, he: /[\u0590-\u05FF]/ } as const
    LANGS.forEach((lang, i) => {
      for (const s of leaves(all[i])) {
        expect(s.trim().length, lang).toBeGreaterThan(0)
        if (lang === 'ar' || lang === 'he') expect(s, `${lang}: "${s}"`).toMatch(script[lang])
      }
    })
  })

  it('quotes A04 page 5 exactly, the one story excerpt allowed in public HTML', async () => {
    for (const lang of LANGS) {
      const story = JSON.parse(readFileSync(`content/stories/a04/${lang}.json`, 'utf8')) as { title: string; pages: { text: string }[]; activity: { title: string } }
      const t = (await loadLanding(lang)).inside
      expect(t.excerpt, lang).toBe(story.pages[4].text)
      expect(t.storyTitle, lang).toBe(story.title)
      expect(t.do.text, `${lang}: activity named as in the story`).toContain(story.activity.title)
    }
  })

  it('keeps the headline to seven words or fewer', async () => {
    for (const lang of LANGS) {
      const words = (await loadLanding(lang)).hero.title.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w))
      expect(words.length, lang).toBeLessThanOrEqual(7)
    }
  })

  it('labels the graph as an illustration in every language', async () => {
    const marker = { ar: /توضيحي/, he: /איור/, en: /illustration/i, da: /illustration/i } as const
    for (const lang of LANGS) {
      const c = (await loadLanding(lang)).evidence.chart
      expect(c.label, lang).toMatch(marker[lang])
      expect(c.alt, lang).toMatch(marker[lang])
    }
  })

  it('draws a line that rises over time', () => {
    for (let i = 1; i < SAMPLE.length; i++) expect(SAMPLE[i]).toBeGreaterThan(SAMPLE[i - 1])
  })
})
