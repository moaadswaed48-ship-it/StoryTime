import { createElement, Fragment } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LANGS } from '@/i18n/config'
import { formatTimeLeft } from '@/i18n/format'
import { isolateLatin } from '@/legal/LegalText'
import { alternates, PUBLIC_PAGES } from '@/seo/paths'
import { robotsTxt, sitemapXml } from '@/seo/sitemap'

/** Launch readiness (26 Nov 2026): sitemap and robots, the trial's time-left words, Latin names in RTL legal text. */
const ORIGIN = 'https://storytime.example'

describe('sitemap.xml', () => {
  const xml = sitemapXml(ORIGIN, '/')
  const urls = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1]!)

  it('lists every public page in every language once, and nothing else (no app, no language picker)', () => {
    expect(urls).toHaveLength(PUBLIC_PAGES.length * LANGS.length)
    const locs = urls.map((u) => u.match(/<loc>(.*?)<\/loc>/)![1])
    expect(new Set(locs).size).toBe(locs.length)
    expect(locs).toContain(`${ORIGIN}/ar/`)
    expect(locs).toContain(`${ORIGIN}/da/legal/cookies/`)
    expect(locs.some((l) => /\/app\/|\/auth\//.test(l!) || l === `${ORIGIN}/`)).toBe(false)
  })

  it('gives each URL the same reciprocal hreflang set as the page itself, including x-default', () => {
    for (const page of PUBLIC_PAGES) {
      const want = alternates(ORIGIN, '/', page).map((a) => `hreflang="${a.hrefLang}" href="${a.href}"`)
      const mine = urls.filter((u) => want.some((w) => u.includes(`<loc>${w.split('href="')[1]!.slice(0, -1)}</loc>`)))
      expect(mine).toHaveLength(LANGS.length)
      for (const u of mine) for (const w of want) expect(u).toContain(w)
    }
  })

  it('works under the preview base path', () => {
    expect(sitemapXml(ORIGIN, '/StoryTime/next/')).toContain(`<loc>${ORIGIN}/StoryTime/next/he/help/</loc>`)
  })
})

describe('robots.txt', () => {
  it('preview: disallows everything and names no sitemap', () => {
    expect(robotsTxt(ORIGIN, '/StoryTime/next/', true)).toBe('User-agent: *\nDisallow: /\n')
  })
  it('launch: allows the public pages, keeps the app and email-link pages out, names the sitemap', () => {
    const r = robotsTxt(ORIGIN, '/', false)
    expect(r).toContain('Allow: /\n')
    for (const l of LANGS) expect(r).toContain(`Disallow: /${l}/app/\nDisallow: /${l}/auth/`)
    expect(r).toContain(`Sitemap: ${ORIGIN}/sitemap.xml`)
    expect(r).not.toMatch(/^Disallow: \/$/m)
  })
})

describe('trial time left (review item 8)', () => {
  const end = '2026-11-29T12:00:00.000Z'
  it('says whole days while more than a day is left, rounded up', () => {
    expect(formatTimeLeft(end, '2026-11-26T12:00:00.000Z', 'en')).toBe('3 days')
    expect(formatTimeLeft(end, '2026-11-26T13:00:00.000Z', 'en')).toBe('3 days')
    expect(formatTimeLeft(end, '2026-11-28T11:00:00.000Z', 'en')).toBe('2 days')
  })
  it('then hours, and never below zero', () => {
    expect(formatTimeLeft(end, '2026-11-28T12:00:00.000Z', 'en')).toBe('24 hours')
    expect(formatTimeLeft(end, '2026-11-29T11:30:00.000Z', 'en')).toBe('1 hour')
    expect(formatTimeLeft(end, '2026-11-30T00:00:00.000Z', 'en')).toBe('0 hours')
  })
  it('uses each language\'s own plural forms, with Western digits', () => {
    expect(formatTimeLeft(end, '2026-11-27T12:00:00.000Z', 'ar')).toBe('يومان')
    expect(formatTimeLeft(end, '2026-11-26T12:00:00.000Z', 'ar')).toBe('3 أيام')
    expect(formatTimeLeft(end, '2026-11-27T12:00:00.000Z', 'he')).toBe('יומיים')
    expect(formatTimeLeft(end, '2026-11-26T12:00:00.000Z', 'da')).toBe('3 dage')
  })
})

describe('Latin names inside Arabic and Hebrew legal text (review item 16)', () => {
  const html = (s: string, l: 'ar' | 'he' | 'en') => renderToStaticMarkup(createElement(Fragment, null, isolateLatin(s, l)))
  it('isolates each Latin run left-to-right without changing a word or moving the full stop', () => {
    expect(html('تستخدم StoryTime مكتبة three.js.', 'ar')).toBe('تستخدم <bdi dir="ltr" lang="en">StoryTime</bdi> مكتبة <bdi dir="ltr" lang="en">three.js</bdi>.')
    expect(html('המפתח storytime.prefs נשמר.', 'he')).toBe('המפתח <bdi dir="ltr" lang="en">storytime.prefs</bdi> נשמר.')
  })
  it('keeps a multi-word name together, and leaves English and Danish pages alone', () => {
    expect(html('رخصة MIT من three.js authors', 'ar')).toBe('رخصة <bdi dir="ltr" lang="en">MIT</bdi> من <bdi dir="ltr" lang="en">three.js authors</bdi>')
    expect(html('Built with three.js.', 'en')).toBe('Built with three.js.')
  })
})
