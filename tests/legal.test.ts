import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { maxCancellationFee } from '@/data/rules'
import { TERMS_HISTORY, TERMS_VERSION } from '@/data/terms'
import { LANGS, type Lang } from '@/i18n/config'
import { LEGAL_SECTIONS, type LegalBlock, type LegalDict } from '@/i18n/legal-schema'
import { loadDict } from '@/i18n/load'
import { legalView, loadLegal } from '@/legal/load'
import { blockStrings, parseInline } from '@/legal/LegalText'
import { LEGAL_DOCS, PUBLIC_PAGES } from '@/seo/paths'

/**
 * The legal pages (src/i18n/<lang>/legal.ts): complete in four languages, the same shape in each, every placeholder
 * and link kept in translation, every link pointing at a real page, and the consent version published.
 */
const dicts = Object.fromEntries(await Promise.all(LANGS.map(async (l) => [l, await loadLegal(l)] as const))) as Record<Lang, LegalDict>

/** Paths a legal link may point at: the pre-rendered public pages and the signed-in settings page. */
const LINKABLE = new Set<string>([...PUBLIC_PAGES.filter(Boolean), 'app/settings'])

const shapeOf = (b: LegalBlock) =>
  typeof b === 'string' ? 'p' : 'list' in b ? `list:${b.list.length}` : 'steps' in b ? `steps:${b.steps.length}` : 'note' in b ? 'note' : `table:${b.table.head.length}x${b.table.rows.length}`
const allStrings = (blocks: LegalBlock[]) => blocks.flatMap(blockStrings)
const tokens = (blocks: LegalBlock[]) => allStrings(blocks).flatMap(parseInline)

describe('legal pages', () => {
  it('every page in the URL list has sections, and every section renders in every language', () => {
    expect(Object.keys(LEGAL_SECTIONS).sort()).toEqual([...LEGAL_DOCS].sort())
    for (const lang of LANGS) {
      for (const doc of LEGAL_DOCS) {
        const v = legalView(dicts[lang], doc)
        expect(v.sections.map((s) => s.id)).toEqual([...LEGAL_SECTIONS[doc]])
        for (const s of v.sections) {
          expect(s.title.trim(), `${lang} ${doc}.${s.id}`).not.toBe('')
          expect(s.body.length, `${lang} ${doc}.${s.id}`).toBeGreaterThan(0)
        }
      }
    }
  })

  it('no string is empty, a filler, or a broken mark', () => {
    for (const lang of LANGS) {
      const d = dicts[lang]
      const strings = [
        ...Object.values(d.chrome),
        ...LEGAL_DOCS.flatMap((doc) => legalView(d, doc).sections.flatMap((s) => [s.title, ...allStrings(s.body)])),
      ]
      for (const s of strings) {
        expect(s.trim().length, `${lang}: empty string`).toBeGreaterThan(0)
        expect(s, `${lang}: filler`).not.toMatch(/lorem|ipsum|TODO|xxx/i)
        for (const t of parseInline(s)) if (t.kind === 'text') expect(t.text, `${lang}: unclosed mark in "${s}"`).not.toMatch(/\[\[|\]\]|\{[a-z/-]+\|/)
      }
    }
  })

  it('all four languages have the same shape, the same placeholders count and the same links, section by section', () => {
    for (const doc of LEGAL_DOCS) {
      const ref = legalView(dicts.en, doc)
      for (const lang of LANGS) {
        const v = legalView(dicts[lang], doc)
        v.sections.forEach((s, i) => {
          const r = ref.sections[i]!
          const where = `${lang} ${doc}.${s.id}`
          expect(s.body.map(shapeOf), where).toEqual(r.body.map(shapeOf))
          expect(tokens(s.body).filter((t) => t.kind === 'placeholder').length, `${where}: placeholders`).toBe(tokens(r.body).filter((t) => t.kind === 'placeholder').length)
          const links = (b: LegalBlock[]) => tokens(b).flatMap((t) => (t.kind === 'link' ? [t.path] : []))
          expect(links(s.body), `${where}: links`).toEqual(links(r.body))
        })
      }
    }
  })

  it('every link points at a page that exists', () => {
    for (const lang of LANGS) {
      const strings = [dicts[lang].chrome.languageNote, ...LEGAL_DOCS.flatMap((doc) => legalView(dicts[lang], doc).sections.flatMap((s) => allStrings(s.body)))]
      for (const t of strings.flatMap(parseInline)) if (t.kind === 'link') expect(LINKABLE.has(t.path), `${lang}: link to "${t.path}"`).toBe(true)
    }
  })

  it('Arabic and Hebrew are written in their own script (library names in the credits table excepted)', () => {
    const script = { ar: /[؀-ۿ]/, he: /[֐-׿]/ } as const
    for (const lang of ['ar', 'he'] as const) {
      const d = dicts[lang]
      for (const s of Object.values(d.chrome)) expect(s).toMatch(script[lang])
      for (const doc of LEGAL_DOCS) {
        for (const sec of legalView(d, doc).sections) {
          expect(sec.title).toMatch(script[lang])
          for (const b of sec.body) {
            if (typeof b === 'object' && 'table' in b) {
              for (const h of b.table.head) expect(h).toMatch(script[lang])
              if (doc !== 'credits') for (const r of b.table.rows) expect(r.join(' '), `${lang} ${doc}.${sec.id}`).toMatch(script[lang])
            } else for (const s of blockStrings(b)) expect(s, `${lang} ${doc}.${sec.id}`).toMatch(script[lang])
          }
        }
      }
    }
  })

  it('every page opens with the draft banner, and the site names every legal page in every language', async () => {
    for (const lang of LANGS) {
      expect(dicts[lang].chrome.draftTitle.length).toBeGreaterThan(5)
      const site = await loadDict(lang)
      for (const doc of LEGAL_DOCS) expect(site.pages.legal[doc].trim()).not.toBe('')
    }
  })

  it('the refunds page states the same fee cap the code enforces (the lower of 5% or 100 shekels)', () => {
    expect(maxCancellationFee(1_000_00)).toBe(50_00) // 5% of 1,000 shekels
    expect(maxCancellationFee(5_000_00)).toBe(100_00) // capped at 100 shekels
    for (const lang of LANGS) {
      const text = allStrings(dicts[lang].refunds.sections.short.body).join(' ')
      expect(text, lang).toMatch(/5\s?%/)
      expect(text, lang).toMatch(/100/)
      expect(text, lang).toMatch(/14/)
    }
  })
})

describe('terms version recorded at sign-up and checkout', () => {
  const migrations = readdirSync(new URL('../supabase/migrations/', import.meta.url))
    .filter((f) => f.endsWith('.sql'))
    .map((f) => readFileSync(new URL(`../supabase/migrations/${f}`, import.meta.url), 'utf8'))
    .join('\n')

  it('the version the site sends is the newest in the history, and every version ever used is still published', () => {
    expect(TERMS_HISTORY[0].version).toBe(TERMS_VERSION)
    for (const h of TERMS_HISTORY) expect(migrations, h.version).toMatch(new RegExp(`insert into private\\.terms_versions[^;]*'${h.version}'`))
  })
})
