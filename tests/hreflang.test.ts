import { describe, expect, it } from 'vitest'
import { LANGS } from '@/i18n/config'
import { alternates, localPath, PUBLIC_PAGES, prerenderPaths } from '@/seo/paths'

const ORIGIN = 'https://example.test'
const BASE = '/StoryTime/next/'

describe('hreflang and public paths', () => {
  it('every page lists all four languages plus x-default, as absolute URLs with a trailing slash', () => {
    const list = alternates(ORIGIN, BASE, 'plans')
    expect(list.map((a) => a.hrefLang)).toEqual([...LANGS, 'x-default'])
    for (const a of list) expect(a.href).toMatch(/^https:\/\/example\.test\/StoryTime\/next\/([a-z]{2}\/)?(plans\/)?$/)
    expect(list.find((a) => a.hrefLang === 'he')?.href).toBe('https://example.test/StoryTime/next/he/plans/')
  })

  it('links are reciprocal: each language version points at every other one, and at itself', () => {
    for (const page of PUBLIC_PAGES) {
      const set = alternates(ORIGIN, BASE, page)
      for (const lang of LANGS) {
        const self = `${ORIGIN}/StoryTime/next${localPath(lang, page)}`
        expect(set.some((a) => a.hrefLang === lang && a.href === self)).toBe(true)
      }
    }
  })

  it('x-default is the language picker for the landing page and the Arabic page elsewhere', () => {
    expect(alternates(ORIGIN, '/', '').at(-1)).toEqual({ hrefLang: 'x-default', href: 'https://example.test/' })
    expect(alternates(ORIGIN, '/', 'legal/terms').at(-1)?.href).toBe('https://example.test/ar/legal/terms/')
  })

  it('pre-renders the picker and every public page in every language, and never the app or the lab', () => {
    const paths = prerenderPaths()
    expect(paths).toHaveLength(1 + LANGS.length * PUBLIC_PAGES.length)
    expect(paths).toContain('/')
    expect(paths).toContain('/da/legal/privacy')
    expect(paths.some((p) => p.includes('/app') || p.startsWith('/lab'))).toBe(false)
  })
})
