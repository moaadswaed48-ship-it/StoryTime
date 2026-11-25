import { expect, test, type Page } from '@playwright/test'

const LANGS = [
  ['ar', 'rtl'],
  ['he', 'rtl'],
  ['en', 'ltr'],
  ['da', 'ltr'],
] as const

function watchErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  return errors
}

for (const [lang, dir] of LANGS) {
  test(`/${lang}/ is pre-rendered in its language and direction, and hydrates without errors`, async ({ page }) => {
    const errors = watchErrors(page)
    const res = await page.goto(`${lang}/`)
    expect(res?.status()).toBe(200)
    const html = await res!.text()
    expect(html).toContain(`<html lang="${lang}" dir="${dir}">`)
    expect(html).toMatch(/<link rel="canonical"/)
    expect(html.match(/rel="alternate"/g)).toHaveLength(5)
    await expect(page.locator('h1')).toBeVisible()
    // The landing now carries real words; its notes are the "being made now" line and the graph's illustration label.
    await expect(page.locator('[role="note"]').first()).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)
    expect(overflow).toBe(false)
    expect(errors).toEqual([])
  })
}

test('the language switch keeps the page and changes lang and dir', async ({ page }) => {
  const errors = watchErrors(page)
  await page.goto('en/plans/')
  await page.getByRole('link', { name: 'עברית' }).click()
  await expect(page).toHaveURL(/\/he\/plans\/$/)
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect(page.locator('html')).toHaveAttribute('lang', 'he')
  await expect(page.locator('h1')).toHaveText('מסלולים לפי קבוצת גיל')
  expect(errors).toEqual([])
})

test('/ sends a Danish browser to /da/', async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ locale: 'da-DK' })
  const page = await ctx.newPage()
  await page.goto(baseURL!)
  await expect(page).toHaveURL(/\/da\/$/)
  await ctx.close()
})

test('/ falls back to Arabic for a language the site does not have', async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ locale: 'fr-FR' })
  const page = await ctx.newPage()
  await page.goto(baseURL!)
  await expect(page).toHaveURL(/\/ar\/$/)
  await ctx.close()
})

test('the app is client-only: not pre-rendered; signed out, it sends the visitor to sign-in in the right language', async ({ page, request, baseURL }) => {
  const raw = await (await request.get(`${baseURL}en/app/library`)).text()
  expect(raw).not.toContain('<h1') // the HTML is the empty SPA fallback, no page content
  const errors = watchErrors(page)
  await page.goto('he/app/library')
  await expect(page).toHaveURL(/\/he\/sign-in\/\?next=/)
  await expect(page.locator('h1')).toHaveText('כניסה')
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  expect(errors).toEqual([])
})

test('lab pages are not in the production build', async ({ page }) => {
  await page.goto('lab/curl')
  // "lab" is not a language: the router answers 404 instead of a lab page.
  await expect(page.getByText('404')).toBeVisible()
  await expect(page.locator('canvas')).toHaveCount(0)
})
