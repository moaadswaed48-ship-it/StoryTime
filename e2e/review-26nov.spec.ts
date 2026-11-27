import { createHash } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test'
import arOwner from '../src/i18n/ar/owner.ts'
import enOwner from '../src/i18n/en/owner.ts'
import ar from '../src/i18n/ar/index.ts'
import en from '../src/i18n/en/index.ts'

/**
 * Fixes from the fresh review of 26 Nov 2026 (docs/reviews/site-review-26nov.md), on the built site with the local
 * (test-mode) backend, in English and Arabic, at 390 px (phone project) and 1440 px (desktop project):
 *   1, 3, 4  the owner acts on a request from the public cancellation form (matching order, end the pass, refund
 *            with a fee) and the family then sees the refund with the amount returned, the fee and the note
 *   5        the classroom film on a phone held sideways (844 x 390) and a tablet (1024 x 768)
 *   6        the classroom library with no trial or pass: a short note and the trial button, never "See passes"
 *   7        checkout refuses an order when the price changed, and shows the new price
 *   9        the home page teaser and the "Before you buy" line decide per pass
 * Amounts are test data in this browser only; nothing here is a real price. Screenshots: qa/out/fix26/.
 */
const SHOTS = 'qa/out/fix26'
mkdirSync(SHOTS, { recursive: true })
const DICT = { en: { od: enOwner, d: en }, ar: { od: arOwner, d: ar } } as const
type L = keyof typeof DICT
const fmt = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (m, k: string) => (k in v ? String(v[k]) : m))
const DAY = 86_400_000
const ORDER = '3f2a1b9c-1111-4222-8333-944445555666'
test.describe.configure({ timeout: 180_000 })

function watchErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => m.type() === 'error' && !/Failed to load resource/.test(m.text()) && errors.push(m.text()))
  return errors
}
const shot = (page: Page, name: string, fullPage = true) => page.screenshot({ path: `${SHOTS}/${name}-${page.viewportSize()!.width}.png`, fullPage })
const noSideScroll = async (page: Page) => expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false)

async function passGate(page: Page, behind: Locator) {
  const input = page.getByTestId('gate-answer')
  await expect(input.or(behind).first()).toBeVisible()
  if (!(await input.isVisible())) return
  const a = Number(await input.getAttribute('data-a'))
  const b = Number(await input.getAttribute('data-b'))
  await input.fill(String(a * b))
  await input.press('Enter')
}

type Seed = { lang: L; who: 'owner-e2e' | 'family-e2e' | 'teacher-e2e'; extra?: Record<string, unknown> }
/** The test-mode database: the owner, a family who paid 100.00 for a 6-8 pass two days ago, a teacher with a class. */
async function seed(page: Page, { lang, who, extra = {} }: Seed) {
  await page.goto(`${lang}/`)
  const hash = createHash('sha256').update('e2e:a long test password').digest('hex')
  await page.evaluate(([hash, lang, who, order, extra]) => {
    const ago = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString()
    const user = (id: string, email: string) => ({ id, email, salt: 'e2e', hash, confirmedAt: ago(100), createdAt: ago(100) })
    const profile = (role: string, prefs = {}) => ({ role, language: lang, storyLanguage: null, onboardedAt: ago(100), createdAt: ago(100), prefs })
    localStorage.setItem('storytime.local.v1', JSON.stringify({
      version: 1,
      users: [user('owner-e2e', 'owner@example.test'), user('family-e2e', 'family@example.test'), user('teacher-e2e', 'teacher@example.test')],
      profiles: { 'owner-e2e': profile('owner'), 'family-e2e': profile('parent'), 'teacher-e2e': profile('teacher', { classroom: true }) },
      learners: [
        { id: 'child-e2e', kind: 'child', name: 'Noor', ageGroup: '6-8', accountId: 'family-e2e', createdAt: ago(100) },
        { id: 'class-e2e', kind: 'class', name: 'Sunflowers', ageGroup: '4-5', accountId: 'teacher-e2e', createdAt: ago(100) },
      ],
      consents: [], trials: [], payments: [], providerEvents: [], outbox: [], tokens: [], deletionRequests: [], failedSignIns: {}, progress: [],
      orders: [{ id: order, accountId: 'family-e2e', ageGroup: '6-8', months: 3, amountAgorot: 10000, priceWasPlaceholder: false, provider: 'test', status: 'paid', createdAt: ago(48), paidAt: ago(48), termsVersion: 'x' }],
      passes: [{ id: 'pass-e2e', accountId: 'family-e2e', orderId: order, ageGroup: '6-8', months: 3, startsAt: ago(48), endsAt: ago(-2000), status: 'active', cancelledAt: null }],
      refunds: [],
      cancellationRequests: [
        { id: 'req-match', email: 'Family@Example.test', orderRef: order.slice(0, 8).toUpperCase(), message: 'I bought the wrong age group.', createdAt: ago(5) },
        { id: 'req-unknown', email: 'someone@example.test', orderRef: 'ORDER-2041', message: null, createdAt: ago(10) },
      ],
      contactMessages: [],
      ...extra,
    }))
    localStorage.setItem('storytime.local.session', JSON.stringify({ userId: who, email: `${who.split('-')[0]}@example.test` }))
  }, [hash, lang, who, ORDER, extra] as const)
}
const signInAs = (page: Page, who: Seed['who']) =>
  page.evaluate((who) => localStorage.setItem('storytime.local.session', JSON.stringify({ userId: who, email: `${who.split('-')[0]}@example.test` })), who)
const setPrices = (page: Page, prices: { ageGroup: string; months: number; priceAgorot: number }[]) =>
  page.evaluate((prices) => {
    const db = JSON.parse(localStorage.getItem('storytime.local.v1')!)
    db.prices = prices
    localStorage.setItem('storytime.local.v1', JSON.stringify(db))
  }, prices)

for (const lang of ['en', 'ar'] as const) {
  test(`a public-form cancellation, a refund with a fee, and what the family sees (${lang})`, async ({ page }) => {
    const errors = watchErrors(page)
    const { od, d } = DICT[lang]
    const t = od.refunds
    await seed(page, { lang, who: 'owner-e2e' })

    // The owner sees the matching order on the request (order number and email) and ends that pass.
    await page.goto(`${lang}/app/owner/refunds/`)
    await expect(page.getByTestId('open-count')).toHaveText(t.noneOpen)
    const req = page.getByTestId('public-request').filter({ hasText: 'I bought the wrong age group.' })
    const match = req.getByTestId('request-match')
    await expect(match).toHaveCount(1)
    await expect(match).toContainText(ORDER.slice(0, 8).toUpperCase())
    await expect(match).toContainText('100.00')
    await expect(match).toHaveAttribute('data-pass', 'active')
    await expect(page.getByTestId('public-request').filter({ hasText: 'ORDER-2041' }).getByTestId('no-match')).toHaveText(t.noMatch)
    await noSideScroll(page)
    await shot(page, `owner-public-request-${lang}`)
    await match.getByTestId('cancel-for-request').click()
    await expect(match.getByText(t.cancelConfirm)).toBeVisible()
    await shot(page, `owner-public-request-confirm-${lang}`, false)
    await match.getByTestId('confirm-cancel-for-request').click()
    await expect(match.getByTestId('cancel-done')).toHaveText(t.cancelDone)
    await expect(match).toHaveAttribute('data-pass', 'cancelled')
    await expect(req).toHaveAttribute('data-handled', 'yes')
    await expect(page.getByTestId('open-count')).toHaveText(fmt(t.openCount, { n: 1 }))

    // The refund it opened: a 5.00 fee (the cap on 100.00) and a note, then marked refunded.
    const card = page.getByTestId('refund').first()
    await expect(card).toContainText(ORDER.slice(0, 8).toUpperCase())
    await card.getByTestId('fee-input').fill('5')
    await card.getByTestId('refund-note').fill('Bank transfer, reference 7781')
    await card.getByTestId('mark-refunded').click()
    await expect(card).toHaveAttribute('data-status', 'issued')
    await expect(card.getByTestId('refund-done')).toContainText('95.00')
    await noSideScroll(page)
    await shot(page, `owner-refund-done-${lang}`)

    // The family: the payments list says what came back, the fee kept and the owner's note (no full refund implied).
    await signInAs(page, 'family-e2e')
    await page.goto(`${lang}/app/settings/`)
    await passGate(page, page.getByTestId('passes').or(page.getByText(d.account.settings.noPasses)))
    const pay = page.getByTestId('payment').filter({ hasText: ORDER.slice(0, 8).toUpperCase() })
    const lines = pay.getByTestId('refund-lines')
    await expect(lines).toHaveAttribute('data-status', 'issued')
    await expect(lines.getByTestId('refund-returned')).toContainText('95.00')
    await expect(lines.getByTestId('refund-returned')).toContainText(d.account.settings.refundReturned.split('{amount}')[0]!.trim())
    await expect(lines.getByTestId('refund-fee')).toContainText('5.00')
    await expect(lines).toContainText('Bank transfer, reference 7781')
    await expect(pay).toContainText(d.account.settings.orderStatus.refunded)
    await noSideScroll(page)
    await pay.scrollIntoViewIfNeeded()
    await shot(page, `family-payments-refund-${lang}`)
    expect(errors).toEqual([])
  })

  test(`classroom with no trial or pass: a short note and the trial button, no "See passes" (${lang})`, async ({ page }) => {
    const errors = watchErrors(page)
    const { d } = DICT[lang]
    const c = d.stories.classroom
    await seed(page, { lang, who: 'teacher-e2e' })
    await page.goto(`${lang}/app/library/`)
    await expect(page.getByTestId('classroom-bar')).toBeVisible()
    await expect(page.getByTestId('classroom-nothing-open')).toHaveText(c.nothingOpenLead)
    await expect(page.getByText(c.nothingOpenTitle)).toBeVisible()
    await expect(page.getByRole('link', { name: d.commerce.access.seePasses })).toHaveCount(0)
    await expect(page.getByTestId('story-list')).toHaveCount(0)
    await expect(page.getByTestId('shelf-focus')).toHaveCount(0)
    await noSideScroll(page)
    await shot(page, `classroom-library-no-access-${lang}`)
    // The trial button starts the trial here, and the books come back.
    await page.getByTestId('classroom-start-trial').click()
    await expect(page.getByTestId('classroom-nothing-open')).toHaveCount(0)
    await expect(page.getByTestId('view-list')).toBeVisible()

    // Four days later the trial has ended: the note says so, without a trial button; a story page has no "See passes".
    await page.evaluate((ms) => localStorage.setItem('storytime.dev.clockOffsetMs', String(ms)), 4 * DAY)
    await page.goto(`${lang}/app/library/`)
    await expect(page.getByTestId('classroom-nothing-open')).toHaveText(c.trialEndedLead)
    await expect(page.getByTestId('classroom-start-trial')).toHaveCount(0)
    await expect(page.getByRole('link', { name: d.commerce.access.seePasses })).toHaveCount(0)
    await shot(page, `classroom-library-trial-ended-${lang}`)
    await page.goto(`${lang}/app/story/b02/`)
    await expect(page.getByTestId('storybook')).toHaveAttribute('data-state', 'locked')
    // Nothing is open, so the story page shows the class library's note for the grown-up (recheck 27 Nov, N2;
    // e2e/recheck-27nov.spec.ts also checks that the doors do not lead to the passes).
    await expect(page.getByTestId('classroom-nothing-open')).toHaveText(c.trialEndedLead)
    await expect(page.getByRole('link', { name: d.commerce.access.seePasses })).toHaveCount(0)
    await noSideScroll(page)
    await shot(page, `classroom-story-locked-${lang}`)
    expect(errors).toEqual([])
  })

  test(`the classroom film keeps a usable size on short screens (${lang})`, async ({ page }, info: TestInfo) => {
    const errors = watchErrors(page)
    const now = Date.now()
    await seed(page, {
      lang, who: 'teacher-e2e',
      extra: { passes: [{ id: 'pass-class', accountId: 'teacher-e2e', orderId: null, ageGroup: '4-5', months: 1, startsAt: new Date(now - 60_000).toISOString(), endsAt: new Date(now + 30 * DAY).toISOString(), status: 'active', cancelledAt: null }] },
    })
    // The phone project: a phone held sideways; the desktop project: a tablet, or a short laptop window.
    const size = info.project.name === 'phone' ? { width: 844, height: 390 } : { width: 1024, height: 768 }
    await page.setViewportSize(size)
    await page.goto(`${lang}/app/story/sample-b/watch`)
    await expect(page.getByTestId('classroom-bar')).toBeVisible()
    await expect(page.getByTestId('film-video')).toBeVisible()
    const width = (await page.getByTestId('watch-page').boundingBox())!.width
    const film = (await page.getByTestId('film').boundingBox())!
    // Never a sliver (it was 67 px wide); at 1024 x 768 the film is as wide as fits. Sideways the film is as tall as
    // the screen allows and sits beside the way back, whole, with its controls (recheck 27 Nov, N1; the 28rem floor
    // of the first fix pushed the controls below the screen, so the film's width now follows the screen's height).
    expect(width).toBeGreaterThanOrEqual(size.width >= 1000 ? 700 : 440)
    expect(film.width).toBeGreaterThanOrEqual(size.width >= 1000 ? 700 : 400)
    expect(film.y + film.height).toBeLessThanOrEqual(size.height)
    // The way back stays on one line (at 67 px wide it broke into one word per line).
    const back = (await page.getByTestId('watch-page').getByRole('link').first().boundingBox())!
    expect(back.height).toBeLessThan(80)
    await noSideScroll(page)
    await page.waitForTimeout(800)
    await shot(page, `classroom-film-${size.width}x${size.height}-${lang}`, false)
    expect(errors).toEqual([])
  })

  test(`checkout refuses an order when the price changed, and shows the new price (${lang})`, async ({ page }) => {
    const errors = watchErrors(page)
    const { d } = DICT[lang]
    const c = d.commerce.checkout
    await seed(page, { lang, who: 'family-e2e' })
    await setPrices(page, [{ ageGroup: '4-5', months: 3, priceAgorot: 4990 }])
    await page.goto(`${lang}/app/checkout/?group=4-5&months=3`)
    await passGate(page, page.getByTestId('checkout-summary'))
    await expect(page.getByTestId('checkout-summary')).toContainText('49.90')
    // The owner changes the price while the summary is open.
    await setPrices(page, [{ ageGroup: '4-5', months: 3, priceAgorot: 5990 }])
    await page.getByLabel(c.termsCheck).check()
    await page.getByRole('button', { name: c.pay }).click()
    await expect(page.getByText(c.priceChangedTitle)).toBeVisible()
    await expect(page.getByTestId('price-changed')).toContainText('59.90')
    await expect(page.getByTestId('checkout-summary')).toContainText('59.90')
    await expect(page.getByTestId('test-pay')).toHaveCount(0)
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('storytime.local.v1')!).orders.length)).toBe(1) // no new order
    await noSideScroll(page)
    await shot(page, `checkout-price-changed-${lang}`)
    // With the new price seen, the order goes through.
    await page.getByRole('button', { name: c.pay }).click()
    await expect(page.getByTestId('test-pay')).toBeVisible()
    expect(errors).toEqual([])
  })

  test(`the home teaser and the "Before you buy" line decide per pass (${lang})`, async ({ page }) => {
    const errors = watchErrors(page)
    const { d } = DICT[lang]
    const p = d.commerce.plans
    await seed(page, { lang, who: 'family-e2e' })
    await page.evaluate(() => localStorage.removeItem('storytime.local.session'))
    // One price for 1 month, all three groups priced for 3 months, nothing for 12 months.
    await setPrices(page, [
      { ageGroup: '4-5', months: 1, priceAgorot: 4990 },
      { ageGroup: '2-3', months: 3, priceAgorot: 9990 }, { ageGroup: '4-5', months: 3, priceAgorot: 9990 }, { ageGroup: '6-8', months: 3, priceAgorot: 9990 },
    ])
    await page.goto(`${lang}/`)
    await expect(page.getByTestId('teaser-1')).toContainText(p.priceSetSome)
    await expect(page.getByTestId('teaser-3')).toHaveCount(0)
    await expect(page.getByTestId('teaser-12')).toContainText(p.priceNotSet)
    await page.getByTestId('teaser-1').scrollIntoViewIfNeeded()
    await shot(page, `home-teaser-per-length-${lang}`, false)
    await page.goto(`${lang}/plans/`)
    await expect(page.getByText(p.factValidityPartial)).toBeVisible()
    await expect(page.getByText(p.factValiditySet, { exact: true })).toHaveCount(0)
    expect(errors).toEqual([])
  })
}
