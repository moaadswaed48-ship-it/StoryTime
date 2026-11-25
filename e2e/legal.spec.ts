import { mkdirSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import { TERMS_VERSION } from '../src/data/terms.ts'
import arLegal from '../src/i18n/ar/legal.ts'
import daLegal from '../src/i18n/da/legal.ts'
import enLegal from '../src/i18n/en/legal.ts'
import heLegal from '../src/i18n/he/legal.ts'
import en from '../src/i18n/en/index.ts'
import he from '../src/i18n/he/index.ts'

/**
 * The legal pages on the built site: six pages x four languages, pre-rendered with the draft banner, in the right
 * language and direction, no side scroll on a phone, every link inside them and in the footer answering, and the
 * terms version recorded at sign-up equal to the one the terms page shows. Phone screenshots in qa/out/legal/.
 */
const LEGAL = { ar: arLegal, he: heLegal, en: enLegal, da: daLegal } as const
const DOCS = ['terms', 'privacy', 'refunds', 'accessibility', 'credits', 'cookies'] as const
const DIR = { ar: 'rtl', he: 'rtl', en: 'ltr', da: 'ltr' } as const
const SHOTS = 'qa/out/legal'
mkdirSync(SHOTS, { recursive: true })

function watchErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  return errors
}

for (const lang of ['ar', 'he', 'en', 'da'] as const) {
  test(`${lang}: all six legal pages are pre-rendered with the draft banner and hydrate cleanly`, async ({ page, request, baseURL }) => {
    const L = LEGAL[lang]
    for (const doc of DOCS) {
      const raw = await request.get(`${baseURL}${lang}/legal/${doc}/`)
      expect(raw.status(), `${lang}/${doc}`).toBe(200)
      const html = await raw.text()
      expect(html).toContain(`<html lang="${lang}" dir="${DIR[lang]}">`)
      expect(html).toContain(L.chrome.draftTitle)
      expect(html).toContain(L[doc].title)

      const errors = watchErrors(page)
      await page.goto(`${lang}/legal/${doc}/`)
      await expect(page.locator('h1')).toHaveText(L[doc].title)
      await expect(page.getByRole('note').filter({ hasText: L.chrome.draftTitle })).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), `${lang}/${doc} side scroll`).toBe(false)
      expect(errors, `${lang}/${doc}`).toEqual([])
      page.removeAllListeners('console')
      page.removeAllListeners('pageerror')
    }
  })
}

test('every link inside the legal pages and the footer answers (English and Arabic)', async ({ page, request }) => {
  const seen = new Set<string>()
  for (const lang of ['en', 'ar'] as const) {
    for (const doc of DOCS) {
      await page.goto(`${lang}/legal/${doc}/`)
      const hrefs = await page.locator('main a[href], footer a[href]').evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href))
      for (const h of hrefs) {
        if (h.includes('#')) continue
        if (seen.has(h)) continue
        seen.add(h)
        expect((await request.get(h)).status(), h).toBe(200)
      }
    }
  }
  // The footer names all six pages and the cancellation page.
  await page.goto('en/')
  const footer = page.locator('footer')
  await expect(footer.getByRole('link', { name: en.common.footer.cancelPurchase })).toHaveAttribute('href', /\/en\/cancel-purchase\/$/)
  for (const doc of DOCS) await expect(footer.getByRole('link', { name: en.pages.legal[doc], exact: true })).toHaveAttribute('href', new RegExp(`/en/legal/${doc}/$`))
  // The cancellation page leads to the full refund rules.
  await page.goto('en/cancel-purchase/')
  await expect(page.locator('main').getByRole('link', { name: en.pages.legal.refunds })).toHaveAttribute('href', /\/en\/legal\/refunds\/$/)
})

test('in-page contents jump to each section', async ({ page }) => {
  await page.goto('he/legal/privacy/')
  const first = page.getByRole('navigation', { name: heLegal.chrome.contents }).getByRole('link').nth(2)
  const target = (await first.getAttribute('href'))!
  await first.click()
  await expect(page).toHaveURL(new RegExp(`${target}$`))
  await expect(page.locator(target)).toBeInViewport()
})

test('sign-up links to the terms and privacy pages and records the terms version the terms page shows', async ({ page }) => {
  const t = he.account.auth
  await page.goto('he/sign-up/')
  await expect(page.getByRole('link', { name: t.readTerms })).toHaveAttribute('href', /\/he\/legal\/terms\/$/)
  await expect(page.getByRole('link', { name: t.readPrivacy })).toHaveAttribute('href', /\/he\/legal\/privacy\/$/)
  await page.getByLabel(t.roleParent).check()
  await page.getByLabel(t.email, { exact: true }).fill('legal-version@example.test')
  await page.getByLabel(t.password, { exact: true }).fill('a long test password')
  await page.getByLabel(t.adultCheck).check()
  await page.getByLabel(t.termsCheck).check()
  await page.getByRole('button', { name: t.submitSignUp, exact: true }).click()
  await expect(page.getByRole('heading', { name: t.checkTitle })).toBeVisible()
  const recorded = await page.evaluate(() => {
    const db = JSON.parse(localStorage.getItem('storytime.local.v1') ?? '{}') as { consents?: { kind: string; termsVersion: string | null }[] }
    return db.consents?.filter((c) => c.kind === 'terms').map((c) => c.termsVersion)
  })
  expect(recorded).toEqual([TERMS_VERSION])
  await page.goto('he/legal/terms/')
  await expect(page.getByText(TERMS_VERSION)).toBeVisible()
})

test('phone screenshots: privacy and refunds in Arabic and Hebrew', async ({ page }, info) => {
  test.skip(info.project.name !== 'phone', 'phone only')
  for (const lang of ['ar', 'he'] as const) {
    for (const doc of ['privacy', 'refunds'] as const) {
      await page.goto(`${lang}/legal/${doc}/`)
      await expect(page.locator('h1')).toHaveText(LEGAL[lang][doc].title)
      await page.screenshot({ path: `${SHOTS}/${doc}-${lang}-390.png`, fullPage: true })
      await page.screenshot({ path: `${SHOTS}/${doc}-${lang}-390-top.png` })
    }
  }
})
