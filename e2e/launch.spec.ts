import { expect, test } from '@playwright/test'
import { siteOrigin } from '../site.config.ts'
import { dirOf, ENDONYM, LANGS, type Lang } from '../src/i18n/config.ts'
import ar from '../src/i18n/ar/index.ts'
import da from '../src/i18n/da/index.ts'
import en from '../src/i18n/en/index.ts'
import he from '../src/i18n/he/index.ts'
import { absoluteUrl, alternates, prerenderPaths, PUBLIC_PAGES } from '../src/seo/paths.ts'

/**
 * Launch readiness (26 Nov 2026), against the built preview: canonical and reciprocal hreflang on every pre-rendered
 * page, the sitemap and robots.txt, the not-found page in four languages, structured data only where it is true, and
 * no secrets or test tools in the public files. Viewport does not matter here, so it runs in the phone project only.
 */
const DICTS: Record<Lang, typeof en> = { ar, he, en, da }
/** The base path the e2e build is served under (as in playwright.config.ts; the config passes it only to the server). */
const basePath = `/${(process.env.BASE_PATH ?? '/StoryTime/next/').replace(/^\/+|\/+$/g, '')}/`.replace(/^\/\/$/, '/')
test.beforeEach(({}, info) => test.skip(info.project.name !== 'phone', 'same files at every size'))

const attr = (tag: string, name: string) => tag.match(new RegExp(`\\s${name}="([^"]*)"`, 'i'))?.[1]
const decode = (s: string) => s.replace(/&amp;/g, '&')

test('every pre-rendered page: lang and dir, one self canonical, the five reciprocal hreflang links, noindex, title', async ({ request }) => {
  const paths = prerenderPaths()
  expect(paths).toHaveLength(1 + LANGS.length * PUBLIC_PAGES.length)
  for (const p of paths) {
    const local = p === '/' ? '/' : `${p}/`
    const res = await request.get(`${basePath.replace(/\/$/, '')}${local}`)
    expect(res.status(), local).toBe(200)
    const html = await res.text()
    const lang = (p.split('/')[1] || 'ar') as Lang
    if (p !== '/') expect(html, local).toContain(`<html lang="${lang}" dir="${dirOf(lang)}">`)
    const page = p === '/' ? '' : p.split('/').slice(2).join('/')
    const canon = [...html.matchAll(/<link[^>]*rel="canonical"[^>]*>/g)].map((m) => decode(attr(m[0], 'href') ?? ''))
    expect(canon, local).toEqual([absoluteUrl(siteOrigin, basePath, local)])
    const alts = [...html.matchAll(/<link[^>]*rel="alternate"[^>]*>/g)].map((m) => ({ hrefLang: attr(m[0], 'hreflang')!, href: decode(attr(m[0], 'href')!) }))
    expect(alts, local).toEqual(alternates(siteOrigin, basePath, page))
    // The preview build: nothing may be indexed.
    expect(html, local).toContain('<meta name="robots" content="noindex, nofollow"/>')
    expect(html.match(/<title>([^<]+)<\/title>/)?.[1]?.length ?? 0, local).toBeGreaterThan(3)
    if (p !== '/') expect(html, local).toMatch(/<meta name="description" content="[^"]{20,}"/)
  }
})

test('sitemap.xml lists exactly the pre-rendered public pages, each with reciprocal hreflang; robots.txt keeps the preview out', async ({ request }) => {
  const res = await request.get(`${basePath}sitemap.xml`)
  expect(res.status()).toBe(200)
  const xml = await res.text()
  const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]!)
  const want = prerenderPaths().filter((p) => p !== '/').map((p) => absoluteUrl(siteOrigin, basePath, `${p}/`))
  expect([...locs].sort()).toEqual([...want].sort())
  for (const block of xml.match(/<url>[\s\S]*?<\/url>/g)!) expect(block.match(/hreflang=/g)).toHaveLength(LANGS.length + 1)
  const robots = await (await request.get(`${basePath}robots.txt`)).text()
  expect(robots).toBe('User-agent: *\nDisallow: /\n')
})

for (const lang of LANGS) {
  test(`not-found page (${lang}): in its language, with the way home and Help, never indexed`, async ({ page }) => {
    const t = DICTS[lang].common
    for (const bad of ['no-such-page/', 'legal/no-such-page/']) {
      await page.goto(`${lang}/${bad}`)
      await expect(page.getByTestId('not-found')).toBeVisible()
      await expect(page.locator('h1')).toHaveText(t.notFound)
      await expect(page.getByText(t.notFoundLead)).toBeVisible()
      await expect(page.getByRole('main').getByRole('link', { name: t.notFoundHome })).toHaveAttribute('href', `${basePath}${lang}/`)
      await expect(page.getByRole('main').getByRole('link', { name: t.footer.help })).toBeVisible()
      await expect(page.locator('html')).toHaveAttribute('lang', lang)
      await expect(page.locator('html')).toHaveAttribute('dir', dirOf(lang))
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
      await expect(page).toHaveTitle(new RegExp(t.notFound))
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false)
    }
  })
}

test('an address under no language shows 404 and the four home pages by their own names', async ({ page }) => {
  await page.goto('xx/somewhere/')
  await expect(page.getByTestId('not-found')).toBeVisible()
  await expect(page).toHaveTitle(/404/)
  for (const l of LANGS) await expect(page.getByRole('link', { name: ENDONYM[l] })).toHaveAttribute('href', `${basePath}${l}/`)
})

test('structured data: a plain WebSite on the four home pages only; never a price, rating or review', async ({ request }) => {
  for (const p of prerenderPaths()) {
    const html = await (await request.get(`${basePath.replace(/\/$/, '')}${p === '/' ? '/' : `${p}/`}`)).text()
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]!)
    const isHome = /^\/[a-z]{2}$/.test(p)
    expect(blocks.length, p).toBe(isHome ? 1 : 0)
    for (const b of blocks) {
      const j = JSON.parse(b)
      expect(j).toEqual({ '@context': 'https://schema.org', '@type': 'WebSite', name: 'StoryTime', url: absoluteUrl(siteOrigin, basePath, `${p}/`), inLanguage: p.slice(1) })
      expect(b).not.toMatch(/price|offer|rating|review/i)
    }
  }
})

/** Patterns that must never reach a public file: server keys, tokens, private keys. */
const SECRET = /service_role|sb_secret_|SUPABASE_SERVICE|RESEND_API_KEY|\bre_[A-Za-z0-9]{24,}|sk_live_|-----BEGIN [A-Z ]*PRIVATE KEY|eyJhbGciOi[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/

test('public pages and the scripts they load carry no secrets and no test-only tools', async ({ request }) => {
  const scripts = new Set<string>()
  for (const p of prerenderPaths()) {
    const html = await (await request.get(`${basePath.replace(/\/$/, '')}${p === '/' ? '/' : `${p}/`}`)).text()
    expect(html, p).not.toMatch(SECRET)
    // Test tools: the lab, the film studio hook, the test payment page.
    expect(html, p).not.toMatch(/\/lab\/|__film|test-pay/)
    for (const m of html.matchAll(/(?:src|href)="([^"]+\.js)"/g)) scripts.add(m[1]!)
  }
  expect(scripts.size).toBeGreaterThan(5)
  for (const s of scripts) {
    const js = await (await request.get(s)).text()
    expect(js, s).not.toMatch(SECRET)
  }
})
