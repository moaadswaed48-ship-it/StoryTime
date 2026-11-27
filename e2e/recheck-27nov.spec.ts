import { createHash } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import en from '../src/i18n/en/index.ts'
import he from '../src/i18n/he/index.ts'

/**
 * Fixes from the fresh recheck of 27 Nov 2026 (docs/reviews/fixes-recheck-27nov.md), on the built site with the local
 * (test-mode) backend, in English and Hebrew:
 *   N1  the classroom film on a phone held sideways (844 x 390, 667 x 375, 568 x 320) fits the screen's height with
 *       its controls, with no scrolling and a usable picture; a tablet (1024 x 768) and a big screen (1920 x 1080)
 *       keep their large film
 *   N2  on the class screen, the doors of a locked story do not open and nothing leads to the passes; the note is
 *       the class library's note for the grown-up
 *   N4  checkout when the price is removed while the summary is open: a plain sentence, not "The total is now
 *       ‹Price not set yet›"
 * (N3 and the N4 error message are pure rules and SQL: tests/recheck-27nov.test.ts, tests/db/recheck-27nov.test.ts.)
 * Amounts are test data in this browser only; nothing here is a real price. Screenshots: qa/out/n14/.
 */
const SHOTS = 'qa/out/n14'
mkdirSync(SHOTS, { recursive: true })
const DICT = { en, he } as const
type L = keyof typeof DICT
const DAY = 86_400_000
test.describe.configure({ timeout: 180_000 })

function watchErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => m.type() === 'error' && !/Failed to load resource/.test(m.text()) && errors.push(m.text()))
  return errors
}
const noSideScroll = async (page: Page) => expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false)

type Who = 'family-e2e' | 'teacher-e2e'
/** The test-mode database: a family (no pass) and a teacher in classroom mode with a 4-5 class. */
async function seed(page: Page, lang: L, who: Who, extra: Record<string, unknown> = {}) {
  await page.goto(`${lang}/`)
  const hash = createHash('sha256').update('e2e:a long test password').digest('hex')
  await page.evaluate(([hash, lang, who, extra]) => {
    const ago = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString()
    const user = (id: string, email: string) => ({ id, email, salt: 'e2e', hash, confirmedAt: ago(100), createdAt: ago(100) })
    const profile = (role: string, prefs = {}) => ({ role, language: lang, storyLanguage: null, onboardedAt: ago(100), createdAt: ago(100), prefs })
    localStorage.setItem('storytime.local.v1', JSON.stringify({
      version: 1,
      users: [user('family-e2e', 'family@example.test'), user('teacher-e2e', 'teacher@example.test')],
      profiles: { 'family-e2e': profile('parent'), 'teacher-e2e': profile('teacher', { classroom: true }) },
      learners: [
        { id: 'child-e2e', kind: 'child', name: 'Noor', ageGroup: '4-5', accountId: 'family-e2e', createdAt: ago(100) },
        { id: 'class-e2e', kind: 'class', name: 'Sunflowers', ageGroup: '4-5', accountId: 'teacher-e2e', createdAt: ago(100) },
      ],
      consents: [], trials: [], payments: [], providerEvents: [], outbox: [], tokens: [], deletionRequests: [], failedSignIns: {}, progress: [],
      orders: [], passes: [], refunds: [], cancellationRequests: [], contactMessages: [],
      ...extra,
    }))
    localStorage.setItem('storytime.local.session', JSON.stringify({ userId: who, email: `${who.split('-')[0]}@example.test` }))
  }, [hash, lang, who, extra] as const)
}
const classPass = () => {
  const now = Date.now()
  return { passes: [{ id: 'pass-class', accountId: 'teacher-e2e', orderId: null, ageGroup: '4-5', months: 1, startsAt: new Date(now - 60_000).toISOString(), endsAt: new Date(now + 30 * DAY).toISOString(), status: 'active', cancelledAt: null }] }
}

/** Where the film sits on the screen: the frame, the picture inside it, the last control, and any scrolling. */
async function filmLayout(page: Page) {
  return page.evaluate(() => {
    const box = (el: Element | null) => {
      const r = el!.getBoundingClientRect()
      return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height }
    }
    const frame = document.querySelector('[data-testid="film"]')!
    const stage = box(frame.querySelector('media-controller'))
    const shown = (el: Element) => el.getClientRects().length > 0
    const bars = [...frame.querySelectorAll('media-control-bar')].filter(shown).map(box)
    const buttons = [...frame.querySelectorAll('media-control-bar :is(media-play-button, media-captions-button, media-mute-button, media-fullscreen-button)')].filter(shown).map(box)
    const timeBars = [...frame.querySelectorAll('media-time-range')].filter(shown).map(box)
    const main = document.querySelector('main')!
    return {
      frame: box(frame),
      // The picture keeps 16:9 inside its stage (a wider stage shows it centred with dark sides).
      picture: { width: Math.min(stage.width, (stage.height * 16) / 9), height: Math.min(stage.height, (stage.width * 9) / 16) },
      bars,
      buttons,
      timeBars,
      back: box(document.querySelector('[data-testid="watch-page"] > a')),
      pageScrolls: document.documentElement.scrollHeight > innerHeight + 1,
      mainScrolls: main.scrollHeight > main.clientHeight + 1,
      vw: innerWidth,
      vh: innerHeight,
    }
  })
}

for (const lang of ['en', 'he'] as const) {
  test(`N1: the classroom film fits a phone held sideways, with its controls, and stays large on bigger screens (${lang})`, async ({ page }) => {
    const errors = watchErrors(page)
    await seed(page, lang, 'teacher-e2e', classPass())
    // The smallest picture accepted on each sideways phone (before this fix: about 165 px wide at 844 x 390, and
    // the controls below the screen; the test-mode notice takes about 25 px that a launch build does not have), and
    // the large film of a tablet and a big screen.
    const sizes = [
      { width: 844, height: 390, minPicture: 380, sideways: true },
      { width: 667, height: 375, minPicture: 340, sideways: true },
      { width: 568, height: 320, minPicture: 260, sideways: true },
      { width: 1024, height: 768, minPicture: 700, sideways: false },
      { width: 1920, height: 1080, minPicture: 1100, sideways: false },
    ]
    for (const size of sizes) {
      await page.setViewportSize({ width: size.width, height: size.height })
      await page.goto(`${lang}/app/story/sample-b/watch`)
      await expect(page.getByTestId('classroom-bar')).toBeVisible()
      await expect(page.getByTestId('film-video')).toBeVisible()
      await page.waitForTimeout(700) // the frame's opening motion
      const l = await filmLayout(page)
      const at = `${size.width}x${size.height}`
      // The whole film, its controls and every button are on the screen. Sideways nothing scrolls at all; on a tablet
      // only the line about captions under the film may be below the fold, as before.
      expect(l.frame.top, at).toBeGreaterThanOrEqual(0)
      expect(l.frame.bottom, at).toBeLessThanOrEqual(l.vh)
      for (const b of [...l.bars, ...l.buttons]) {
        expect(b.bottom, at).toBeLessThanOrEqual(l.vh)
        expect(b.right, at).toBeLessThanOrEqual(l.frame.right + 0.5)
        expect(b.left, at).toBeGreaterThanOrEqual(l.frame.left - 0.5)
      }
      expect(l.buttons.length, at).toBeGreaterThanOrEqual(4)
      // One time bar, on the screen and wide enough to drag.
      expect(l.timeBars.length, at).toBe(1)
      expect(l.timeBars[0]!.bottom, at).toBeLessThanOrEqual(l.vh)
      expect(l.timeBars[0]!.width, at).toBeGreaterThanOrEqual(60)
      for (const b of l.buttons) expect(Math.min(b.width, b.height), at).toBeGreaterThanOrEqual(44)
      if (size.sideways) {
        expect(l.pageScrolls, at).toBe(false)
        expect(l.mainScrolls, at).toBe(false)
      }
      // Not unusably small.
      expect(l.picture.width, at).toBeGreaterThanOrEqual(size.minPicture)
      // The way back is on the screen, a large target, one line or two (sideways it sits in the narrow side column).
      expect(l.back.bottom, at).toBeLessThanOrEqual(l.vh)
      expect(l.back.height, at).toBeGreaterThanOrEqual(44)
      expect(l.back.height, at).toBeLessThan(80)
      await noSideScroll(page)
      await page.screenshot({ path: `${SHOTS}/classroom-film-${at}-${lang}.png` })
    }
    // Full screen still works from the sideways layout: the picture then takes the whole screen.
    await page.setViewportSize({ width: 844, height: 390 })
    await page.goto(`${lang}/app/story/sample-b/watch`)
    await expect(page.getByTestId('film-video')).toBeVisible()
    await page.evaluate(() => document.querySelector('[data-testid="film"]')!.requestFullscreen().catch(() => undefined))
    await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true)
    const full = await filmLayout(page)
    expect(full.picture.height).toBeGreaterThan(390 - 100 - 2)
    expect(errors).toEqual([])
  })

  test(`N2: a locked story on the class screen: the doors do not lead to the passes, the grown-up note shows (${lang})`, async ({ page }) => {
    const errors = watchErrors(page)
    const d = DICT[lang]
    const c = d.stories.classroom
    const doors = ['door-read', 'door-listen', 'door-watch', 'door-do']
    // A teacher whose trial ended: nothing is open, so the note is the class library's.
    await seed(page, lang, 'teacher-e2e', { trials: [{ id: 'trial-class', accountId: 'teacher-e2e', ageGroup: '4-5', startedAt: new Date(Date.now() - 5 * DAY).toISOString(), endsAt: new Date(Date.now() - 2 * DAY).toISOString(), storyIds: ['b01', 'b02', 'b03'] }] })
    await page.goto(`${lang}/app/library/`)
    await expect(page.getByTestId('classroom-nothing-open')).toHaveText(c.trialEndedLead)
    await page.goto(`${lang}/app/story/b02/`)
    await expect(page.getByTestId('storybook')).toHaveAttribute('data-state', 'locked')
    await expect(page.getByTestId('classroom-nothing-open')).toHaveText(c.trialEndedLead)
    await expect(page.getByText(c.nothingOpenTitle)).toBeVisible()
    for (const id of doors) {
      await expect(page.getByTestId(id)).toBeVisible()
      await expect(page.getByTestId(id)).toHaveAttribute('data-state', 'locked')
      expect(await page.getByTestId(id).evaluate((el) => el.tagName)).not.toBe('A')
    }
    await expect(page.getByTestId('doors').getByRole('link')).toHaveCount(0)
    await expect(page.locator('a[href*="app/plans"]')).toHaveCount(0)
    await expect(page.getByRole('link', { name: d.commerce.access.seePasses })).toHaveCount(0)
    // A child taps a door: nothing happens, the page stays.
    const here = page.url()
    await page.getByTestId('door-watch').click()
    await page.waitForTimeout(300)
    expect(page.url()).toBe(here)
    await noSideScroll(page)
    await page.screenshot({ path: `${SHOTS}/classroom-story-locked-${page.viewportSize()!.width}-${lang}.png`, fullPage: true })

    // A teacher with a pass for 4-5 opens a 2-3 story: other stories are open, so the note is about this story.
    await seed(page, lang, 'teacher-e2e', classPass())
    await page.goto(`${lang}/app/story/a01/`)
    await expect(page.getByTestId('storybook')).toHaveAttribute('data-state', 'locked')
    await expect(page.getByText(c.lockedLead)).toBeVisible()
    await expect(page.getByTestId('doors').getByRole('link')).toHaveCount(0)
    await expect(page.locator('a[href*="app/plans"]')).toHaveCount(0)

    // A family (not the class screen) keeps the way to the passes from a locked story.
    await seed(page, lang, 'family-e2e')
    await page.goto(`${lang}/app/story/b02/`)
    await expect(page.getByTestId('storybook')).toHaveAttribute('data-state', 'locked')
    await expect(page.getByTestId('door-read')).toHaveAttribute('href', /app\/plans/)
    await expect(page.getByRole('link', { name: d.commerce.access.seePasses })).toBeVisible()
    expect(errors).toEqual([])
  })

  test(`N4: checkout when the price is removed while it is open says so plainly (${lang})`, async ({ page }) => {
    const errors = watchErrors(page)
    const d = DICT[lang]
    const t = d.commerce.checkout
    await seed(page, lang, 'family-e2e', { prices: [{ ageGroup: '4-5', months: 3, priceAgorot: 4990 }] })
    await page.goto(`${lang}/app/checkout/?group=4-5&months=3`)
    const input = page.getByTestId('gate-answer')
    await expect(input.or(page.getByTestId('checkout-summary')).first()).toBeVisible()
    if (await input.isVisible()) {
      await input.fill(String(Number(await input.getAttribute('data-a')) * Number(await input.getAttribute('data-b'))))
      await input.press('Enter')
    }
    await expect(page.getByTestId('checkout-summary')).toContainText('49.90')
    // The owner removes the price while the summary is open.
    await page.evaluate(() => {
      const db = JSON.parse(localStorage.getItem('storytime.local.v1')!)
      db.prices = []
      localStorage.setItem('storytime.local.v1', JSON.stringify(db))
    })
    await page.getByLabel(t.termsCheck).check()
    await page.getByRole('button', { name: t.pay }).click()
    await expect(page.getByText(t.priceChangedTitle)).toBeVisible()
    await expect(page.getByTestId('price-changed')).toHaveText(t.priceRemovedLead)
    await expect(page.getByTestId('price-changed')).not.toContainText(d.commerce.plans.priceNotSet)
    await expect(page.getByTestId('test-pay')).toHaveCount(0)
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('storytime.local.v1')!).orders.length)).toBe(0)
    await noSideScroll(page)
    await page.getByTestId('price-changed').scrollIntoViewIfNeeded()
    await page.screenshot({ path: `${SHOTS}/checkout-price-removed-${page.viewportSize()!.width}-${lang}.png`, fullPage: true })
    expect(errors).toEqual([])
  })
}
