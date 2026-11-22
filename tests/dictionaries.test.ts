import { describe, expect, it } from 'vitest'
import { LANGS } from '@/i18n/config'
import { loadDict } from '@/i18n/load'

/** Every key path of a nested dictionary, e.g. "common.nav.home". */
function paths(o: unknown, prefix = ''): string[] {
  if (typeof o !== 'object' || o === null) return [prefix]
  return Object.entries(o).flatMap(([k, v]) => paths(v, prefix ? `${prefix}.${k}` : k)).sort()
}
function leaves(o: unknown): string[] {
  if (typeof o === 'string') return [o]
  if (typeof o !== 'object' || o === null) return []
  return Object.values(o).flatMap(leaves)
}

describe('dictionaries', () => {
  it('all four languages have exactly the same keys', async () => {
    const [first, ...rest] = await Promise.all(LANGS.map(loadDict))
    for (const d of rest) expect(paths(d)).toEqual(paths(first))
  })

  it('no string is empty or a lorem-ipsum filler', async () => {
    for (const lang of LANGS) {
      for (const s of leaves(await loadDict(lang))) {
        expect(s.trim().length, `${lang}: empty string`).toBeGreaterThan(0)
        expect(s, `${lang}: filler text`).not.toMatch(/lorem|ipsum|TODO|xxx/i)
      }
    }
  })

  it('Arabic and Hebrew strings are written in their own script (no untranslated English left behind)', async () => {
    const script = { ar: /[؀-ۿ]/, he: /[֐-׿]/ } as const
    for (const lang of ['ar', 'he'] as const) {
      const d = await loadDict(lang)
      for (const s of leaves({ ...d, common: { ...d.common, siteName: undefined } })) expect(s, `${lang}: "${s}"`).toMatch(script[lang])
    }
  })
})
