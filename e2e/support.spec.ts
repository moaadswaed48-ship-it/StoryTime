import { mkdirSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import ar from '../src/i18n/ar/index.ts'
import arLanding from '../src/i18n/ar/landing.ts'
import en from '../src/i18n/en/index.ts'
import enLanding from '../src/i18n/en/landing.ts'

/**
 * Site review, second pass (25 Nov 2026): the footer on every kind of page (Help, Contact, Cancel a purchase, the
 * legal pages, a language picker, the business-details placeholder), the Help page (the landing questions and how
 * to reach us) and the Contact page (a form that records the message in test mode), in English and Arabic.
 */
const DICTS = { en: { d: en, landing: enLanding }, ar: { d: ar, landing: arLanding } } as const
const SHOTS = 'qa/out/support'
mkdirSync(SHOTS, { recursive: true })

function watchErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => m.type() === 'error' && !/Failed to load resource/.test(m.text()) && errors.push(m.text()))
  return errors
}
const noSideScroll = async (page: Page) => expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false)

for (const lang of ['en', 'ar'] as const) {
  const { d, landing } = DICTS[lang]

  test(`footer on public pages has Help, Contact, Cancel, legal links, a language picker and the business placeholder (${lang})`, async ({ page }) => {
    const errors = watchErrors(page)
    for (const path of ['', 'plans/', 'legal/terms/', 'help/', 'contact/', 'sign-in/']) {
      await page.goto(`${lang}/${path}`)
      const footer = page.locator('footer')
      await expect(footer.getByRole('link', { name: d.common.footer.cancelPurchase })).toHaveAttribute('href', new RegExp(`/${lang}/cancel-purchase/$`))
      await expect(footer.getByRole('link', { name: d.common.footer.help, exact: true })).toHaveAttribute('href', new RegExp(`/${lang}/help/$`))
      await expect(footer.getByRole('link', { name: d.common.footer.contact, exact: true })).toHaveAttribute('href', new RegExp(`/${lang}/contact/$`))
      await expect(footer.getByRole('link', { name: d.pages.legal.privacy, exact: true })).toBeVisible()
      const langs = footer.getByRole('navigation', { name: d.common.footer.languages }).getByRole('link')
      await expect(langs).toHaveCount(4)
      await expect(footer.getByText(d.common.footer.business)).toBeVisible()
    }
    // The footer's language picker keeps the page.
    await page.goto(`${lang}/help/`)
    await page.locator('footer').getByRole('link', { name: 'Dansk' }).click()
    await expect(page).toHaveURL(/\/da\/help\/$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'da')
    expect(errors).toEqual([])
  })

  test(`help page: the landing questions, the contact form link and the support placeholder (${lang})`, async ({ page }, info) => {
    const errors = watchErrors(page)
    const res = await page.goto(`${lang}/help/`)
    const html = await res!.text()
    expect(html).toContain(landing.faq.items[0].q) // pre-rendered
    expect(html).not.toContain(landing.inside.excerpt) // only the questions travel with this page
    await expect(page.locator('h1')).toHaveText(d.pages.help.title)
    await expect(page.locator('main details')).toHaveCount(landing.faq.items.length)
    await page.getByText(landing.faq.items[3].q).click()
    await expect(page.getByText(landing.faq.items[3].a)).toBeVisible()
    await expect(page.getByText(d.support.help.emailPlaceholder)).toBeVisible()
    await noSideScroll(page)
    await page.screenshot({ path: `${SHOTS}/help-${lang}-${info.project.name}.png`, fullPage: true })
    await page.getByTestId('help-contact-link').click()
    await expect(page).toHaveURL(new RegExp(`/${lang}/contact/$`))
    expect(errors).toEqual([])
  })

  test(`contact page: checks the fields, then records the message in test mode (${lang})`, async ({ page }, info) => {
    const errors = watchErrors(page)
    const t = d.support.contact
    await page.goto(`${lang}/contact/`)
    await expect(page.locator('h1')).toHaveText(d.pages.contact.title)
    await expect(page.getByText(t.testNote)).toBeVisible()
    await page.getByRole('button', { name: t.send }).click()
    await expect(page.getByText(d.account.errors.invalidEmail)).toBeVisible()
    await expect(page.getByText(d.account.errors.required)).toBeVisible()
    await page.getByLabel(t.name).fill('Dana')
    await page.getByLabel(t.email, { exact: true }).fill(`contact-${lang}-${info.project.name}@example.test`)
    await page.getByLabel(t.message).fill(lang === 'ar' ? 'سؤال عن التجربة المجانية.' : 'A question about the free trial.')
    await noSideScroll(page)
    await page.screenshot({ path: `${SHOTS}/contact-${lang}-${info.project.name}.png`, fullPage: true })
    await page.getByRole('button', { name: t.send }).click()
    await expect(page.getByTestId('contact-sent')).toContainText(t.sent)
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('storytime.local.v1')!).contactMessages as { lang: string; name: string; message: string }[])
    expect(saved).toEqual([expect.objectContaining({ lang, name: 'Dana' })])
    expect(errors).toEqual([])
  })
}
