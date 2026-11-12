import { expect, test } from '@playwright/test'
import { pageUrl } from './_url'
import { watchConsole } from './helpers'

const state = (page: import('@playwright/test').Page) => page.evaluate(() => window.__st!.checkout.state() as { open: boolean; phase: string })
const site = (page: import('@playwright/test').Page) => page.evaluate(() => ({ loggedIn: window.__st!.store.getState().loggedIn as boolean, checkout: window.__st!.store.getState().checkout }))

for (const lang of ['ar', 'en'] as const) {
  test(`the demo checkout takes any text, prints a receipt and opens the story (${lang})`, async ({ page }) => {
    const con = watchConsole(page)
    await page.goto(pageUrl('checkout', lang === 'en' ? '&lang=en' : ''))
    await page.waitForFunction(() => !!window.__st?.checkout)
    await page.evaluate(() => window.__st!.store.getState().openCheckout('family', false))
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.locator('.pay__demo')).toBeVisible()
    await expect(page.locator('.pay__sample')).toBeVisible() // the price is labelled as a sample

    // nothing is validated: random text in every field, and no request leaves the page
    const sent: string[] = []
    page.on('request', (r) => {
      if (r.method() !== 'GET' || r.isNavigationRequest() || /asdf|9911/.test(r.url())) sent.push(`${r.method()} ${r.url()}`)
    })
    await page.locator('[data-pay="name"]').fill('asdf qwer')
    await page.locator('[data-pay="card"]').fill('4242 9911 kjh8')
    await page.locator('[data-pay="exp"]').fill('zz/99')
    await page.locator('[data-pay="cvc"]').fill('x')
    for (const f of ['name', 'card', 'exp', 'cvc']) {
      const size = await page.locator(`[data-pay="${f}"]`).evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
      expect(size).toBeGreaterThanOrEqual(16) // an iPhone zooms the page on smaller inputs
    }
    expect((await site(page)).loggedIn).toBe(false)
    await page.locator('[data-pay="submit"]').click()
    await expect.poll(async () => (await state(page)).phase).toBe('receipt')
    await expect(page.locator('[data-pay="receipt"]')).toBeVisible()
    await expect(page.locator('[data-pay="receipt"]')).toContainText('kjh8') // the last four characters typed
    await expect(page.locator('.pay__stamp')).toBeVisible()
    expect((await site(page)).loggedIn).toBe(true)

    await page.locator('[data-pay="done"]').click()
    await expect.poll(async () => (await site(page)).checkout).toBe(null)
    await expect(page.getByRole('dialog')).toHaveCount(0)
    expect(sent).toEqual([])
    con.assertClean()
  })
}

test('an empty form can be paid too, and Escape closes the sheet', async ({ page }) => {
  await page.goto(pageUrl('checkout'))
  await page.waitForFunction(() => !!window.__st?.checkout)
  await page.evaluate(() => window.__st!.store.getState().openCheckout())
  await page.locator('[data-pay="submit"]').click()
  await expect.poll(async () => (await state(page)).phase).toBe('receipt')
  await page.keyboard.press('Escape')
  await expect.poll(async () => (await site(page)).checkout).toBe(null)
})
