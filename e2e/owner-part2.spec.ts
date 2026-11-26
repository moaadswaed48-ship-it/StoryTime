import { createHash } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { expect, test, type Page, type TestInfo } from '@playwright/test'
import arOwner from '../src/i18n/ar/owner.ts'
import enOwner from '../src/i18n/en/owner.ts'
import ar from '../src/i18n/ar/index.ts'
import en from '../src/i18n/en/index.ts'

/**
 * Owner's area, part 2, on the built site with the local (test-mode) backend, in English and Arabic at 390 and
 * 1440 px: the contact-message inbox (newest first, the count, handled and back), cancellations and refunds (the fee
 * cap, the note, marking refunded, the public form's requests), and prices (set one, see it on the public plans page,
 * remove it and see "Price not set yet" again), then the change history. Screenshots go to qa/out/owner-part2/.
 * The amounts below are test data in this browser only; nothing here is a real price.
 */
const SHOTS = 'qa/out/owner-part2'
mkdirSync(SHOTS, { recursive: true })
const DICT = { en: { od: enOwner, d: en }, ar: { od: arOwner, d: ar } } as const
type L = keyof typeof DICT
const fmt = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (m, k: string) => (k in v ? String(v[k]) : m))

test.describe.configure({ timeout: 180_000 })

function watchErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => m.type() === 'error' && !/Failed to load resource/.test(m.text()) && errors.push(m.text()))
  return errors
}
const shot = (page: Page, info: TestInfo, name: string) => page.screenshot({ path: `${SHOTS}/${name}-${info.project.name}.png`, fullPage: true })
async function noSideScroll(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false)
}

/** The owner, one family with a cancelled pass waiting for its refund, two contact messages and a public request. */
async function seed(page: Page, lang: L) {
  await page.goto(`${lang}/`)
  const hash = createHash('sha256').update('e2e:a long test password').digest('hex')
  await page.evaluate(([hash, lang]) => {
    const ago = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString()
    localStorage.setItem('storytime.local.v1', JSON.stringify({
      version: 1,
      users: [
        { id: 'owner-e2e', email: 'owner@example.test', salt: 'e2e', hash, confirmedAt: ago(100), createdAt: ago(100) },
        { id: 'family-e2e', email: 'family@example.test', salt: 'e2e', hash, confirmedAt: ago(90), createdAt: ago(90) },
      ],
      profiles: {
        'owner-e2e': { role: 'owner', language: lang, storyLanguage: null, onboardedAt: ago(100), createdAt: ago(100) },
        'family-e2e': { role: 'parent', language: 'he', storyLanguage: null, onboardedAt: ago(90), createdAt: ago(90) },
      },
      learners: [], consents: [], trials: [],
      orders: [{ id: 'order-e2e', accountId: 'family-e2e', ageGroup: '6-8', months: 3, amountAgorot: 4990, priceWasPlaceholder: false, provider: 'test', status: 'paid', createdAt: ago(50), paidAt: ago(50), termsVersion: 'x' }],
      payments: [],
      passes: [{ id: 'pass-e2e', accountId: 'family-e2e', orderId: 'order-e2e', ageGroup: '6-8', months: 3, startsAt: ago(50), endsAt: ago(-2000), status: 'cancelled', cancelledAt: ago(20) }],
      refunds: [{ id: 'refund-e2e', orderId: 'order-e2e', passId: 'pass-e2e', amountAgorot: 4990, feeAgorot: null, status: 'requested', requestedAt: ago(20) }],
      providerEvents: [],
      cancellationRequests: [{ id: 'req-e2e', email: 'someone@example.test', orderRef: 'ORDER-2041', message: 'I bought by mistake.', createdAt: ago(10) }],
      contactMessages: [
        { id: 'msg-old', name: null, email: 'old@example.test', lang: 'ar', message: 'مرحبًا، هل القصص متاحة بالعربية الفصحى؟', createdAt: ago(30) },
        { id: 'msg-new', name: 'Dana Levi', email: 'dana@example.test', lang: 'en', message: 'Hello!\nCan a teacher use one pass for a whole class?', createdAt: ago(2) },
      ],
      outbox: [], tokens: [], deletionRequests: [], failedSignIns: {}, progress: [],
    }))
    localStorage.setItem('storytime.local.session', JSON.stringify({ userId: 'owner-e2e', email: 'owner@example.test' }))
  }, [hash, lang] as const)
}

for (const lang of ['en', 'ar'] as const) {
  test(`owner reads messages, refunds a cancellation and sets a price (${lang})`, async ({ page }, info) => {
    const errors = watchErrors(page)
    const { od, d } = DICT[lang]
    await seed(page, lang)

    // ---- Messages: newest first, the count, handled and back ------------------------------------------------------
    await page.goto(`${lang}/app/owner/`)
    await page.getByTestId('owner-area').getByRole('navigation').getByRole('link', { name: od.area.nav.messages, exact: true }).click()
    await expect(page.getByTestId('unhandled-count')).toHaveText(fmt(od.messages.unhandledCount, { n: 2 }))
    await expect(page.locator('html')).toHaveAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr')
    const texts = page.getByTestId('message-text')
    await expect(texts).toHaveCount(2)
    await expect(texts.first()).toContainText('Can a teacher use one pass')
    await expect(texts.nth(1)).toHaveAttribute('dir', 'auto')
    await noSideScroll(page)
    await shot(page, info, `messages-${lang}`)
    await page.getByTestId('message').first().getByTestId('toggle-handled').click()
    await expect(page.getByTestId('unhandled-count')).toHaveText(fmt(od.messages.unhandledCount, { n: 1 }))
    await expect(page.getByTestId('message')).toHaveCount(1)
    await page.getByText(`${od.messages.filterAll} (2)`).click()
    await expect(page.getByTestId('message')).toHaveCount(2)
    await expect(page.getByTestId('message').first()).toHaveAttribute('data-handled', 'yes')
    await expect(page.getByTestId('message').first().getByRole('link', { name: od.messages.reply })).toHaveAttribute('href', 'mailto:dana@example.test')
    await shot(page, info, `messages-all-${lang}`)
    // And back to "not handled".
    await page.getByTestId('message').first().getByTestId('toggle-handled').click()
    await expect(page.getByTestId('unhandled-count')).toHaveText(fmt(od.messages.unhandledCount, { n: 2 }))

    // ---- Cancellations and refunds ----------------------------------------------------------------------------------
    await page.getByTestId('owner-area').getByRole('navigation').getByRole('link', { name: od.area.nav.refunds, exact: true }).click()
    await expect(page.getByText(od.refunds.noMoneyTitle)).toBeVisible()
    await expect(page.getByTestId('open-count')).toHaveText(fmt(od.refunds.openCount, { n: 1 }))
    const card = page.getByTestId('refund').first()
    await expect(card).toContainText('family@example.test')
    await expect(card.getByTestId('refund-paid')).toContainText('49.90')
    await card.getByTestId('fee-input').fill('3')
    await card.getByTestId('save-fee').click()
    await expect(card.getByText(od.errors.feeOverCap)).toBeVisible()
    await card.getByTestId('fee-input').fill('2.49')
    await card.getByTestId('save-fee').click()
    await expect(card.getByTestId('refund-amounts')).toContainText('47.41')
    await card.getByTestId('mark-refunded').click()
    await expect(card.getByText(od.errors.noteRequired)).toBeVisible()
    await noSideScroll(page)
    await shot(page, info, `refunds-open-${lang}`)
    await card.getByTestId('refund-note').fill('Bank transfer, reference 5531')
    await card.getByTestId('mark-refunded').click()
    await expect(card).toHaveAttribute('data-status', 'issued')
    await expect(card.getByTestId('refund-done')).toContainText('Bank transfer, reference 5531')
    await expect(card.getByTestId('refund-done')).toContainText('47.41')
    await expect(page.getByTestId('open-count')).toHaveText(od.refunds.noneOpen)
    const req = page.getByTestId('public-request').first()
    await expect(req).toContainText('ORDER-2041')
    await req.getByTestId('toggle-request').click()
    await expect(req).toHaveAttribute('data-handled', 'yes')
    await noSideScroll(page)
    await shot(page, info, `refunds-done-${lang}`)
    // The family's pass now reads as refunded in its own data.
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('storytime.local.v1')!).passes[0].status)).toBe('refunded')

    // ---- Prices -----------------------------------------------------------------------------------------------------
    await page.getByTestId('owner-area').getByRole('navigation').getByRole('link', { name: od.area.nav.prices, exact: true }).click()
    for (const g of ['2-3', '4-5', '6-8']) for (const m of [1, 3, 12]) {
      await expect(page.getByTestId(`price-${g}-${m}-current`)).toContainText(d.commerce.plans.priceNotSet)
      await expect(page.getByTestId(`price-${g}-${m}-input`)).toHaveValue('')
    }
    await page.getByTestId('price-4-5-1-input').fill('abc')
    await page.getByTestId('price-4-5-1-save').click()
    await expect(page.getByTestId('price-4-5-1').getByText(od.prices.invalid)).toBeVisible()
    await page.getByTestId('price-4-5-1-input').fill('0.5')
    await page.getByTestId('price-4-5-1-save').click()
    await expect(page.getByTestId('price-4-5-1').getByText(od.prices.tooLow)).toBeVisible()
    await page.getByTestId('price-4-5-1-input').fill('49.90')
    await page.getByTestId('price-4-5-1-save').click()
    await expect(page.getByTestId('price-4-5-1-done')).toHaveText(od.prices.saved)
    await expect(page.getByTestId('price-4-5-1-current')).toContainText('49.90')
    await expect(page.getByTestId('price-4-5-3-current')).toContainText(d.commerce.plans.priceNotSet)
    await noSideScroll(page)
    await shot(page, info, `prices-${lang}`)

    // The public plans page shows the price set, and "Price not set yet" for the others.
    await page.goto(`${lang}/plans/`)
    await expect(page.getByTestId('plan-1')).toContainText('49.90')
    await expect(page.getByTestId('plan-3')).toContainText(d.commerce.plans.priceNotSet)
    await expect(page.getByText(d.commerce.plans.factValiditySet)).toBeVisible()
    await expect(page.getByText(d.commerce.plans.factValidity)).toHaveCount(0)
    await noSideScroll(page)
    await shot(page, info, `plans-with-price-${lang}`)

    // Remove it again: the plans page is back to the placeholder.
    await page.goto(`${lang}/app/owner/prices/`)
    await page.getByTestId('price-4-5-1-clear').click()
    await expect(page.getByTestId('price-4-5-1-done')).toHaveText(od.prices.cleared)
    await expect(page.getByTestId('price-4-5-1-current')).toContainText(d.commerce.plans.priceNotSet)
    await page.goto(`${lang}/plans/`)
    await expect(page.getByTestId('plan-1')).toContainText(d.commerce.plans.priceNotSet)
    await expect(page.getByText(d.commerce.plans.factValidity)).toBeVisible()

    // ---- Every change is in the change history ----------------------------------------------------------------------
    await page.goto(`${lang}/app/owner/changes/`)
    const log = page.getByTestId('audit-list')
    for (const target of ['pass_prices', 'refunds', 'passes', 'contact_messages', 'cancellation_requests'] as const) {
      await expect(log.getByText(`${od.changes.actions.update}: ${od.changes.targets[target]}`, { exact: true }).first()).toBeVisible()
    }
    await noSideScroll(page)
    await shot(page, info, `changes-${lang}`)
    expect(errors).toEqual([])
  })
}

test('a parent account cannot open the new owner screens', async ({ page }) => {
  await seed(page, 'en')
  await page.evaluate(() => localStorage.setItem('storytime.local.session', JSON.stringify({ userId: 'family-e2e', email: 'family@example.test' })))
  for (const p of ['messages', 'refunds', 'prices']) {
    await page.goto(`en/app/owner/${p}/`)
    await expect(page.getByTestId('owner-refused')).toBeVisible()
    await expect(page.getByTestId(`owner-${p}`)).toHaveCount(0)
  }
})
