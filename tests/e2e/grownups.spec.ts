import { expect, test, type Page } from '@playwright/test'
import { pageUrl } from './_url'
import { waitForHook, watchConsole } from './helpers'

const STORY = 'autumn-leaves'

/** Opens the grown-ups' area with the gate closed and nothing done yet. */
async function open(page: Page) {
  const log = watchConsole(page)
  await page.goto(pageUrl('grownups', '#grownups'))
  await waitForHook(page, 'profile')
  await page.evaluate(() => {
    sessionStorage.clear()
    localStorage.removeItem('st:reduce-motion')
    window.__st!.profile.getState().reset()
    window.__st!.profile.getState().setProfile({ name: 'Lina', avatar: 'leaf' })
  })
  await page.reload()
  await waitForHook(page, 'grownups')
  return log
}
const state = (page: Page) => page.evaluate(() => window.__st!.grownups.state())

test('a tap does not open the gate; pressing and holding does', async ({ page }) => {
  const log = await open(page)
  const area = page.locator('#grownups')
  await expect(area.locator('[data-gu-gate]')).toBeVisible()
  await expect(area.locator('[data-gu-local]')).toBeVisible()
  const hold = area.locator('[data-gu-hold]')
  await hold.click() // what a small child does
  await page.waitForTimeout(400)
  expect((await state(page)).open).toBe(false)

  await hold.dispatchEvent('pointerdown', { button: 0, pointerId: 1, isPrimary: true })
  await page.waitForFunction(() => window.__st!.grownups.state().open === true, null, { timeout: 8_000 })
  await expect(area.getByRole('tablist')).toBeVisible()
  await expect(area.getByRole('tab')).toHaveCount(4)
  // it stays open for the rest of the visit
  await page.reload()
  await waitForHook(page, 'grownups')
  expect((await state(page)).open).toBe(true)
  log.assertClean()
})

test('progress shows what the child really did, and says so honestly when nothing is done', async ({ page }) => {
  const log = await open(page)
  const area = page.locator('#grownups')
  await page.evaluate(() => window.__st!.grownups.unlock())
  await expect(area.locator('[data-gu-none]')).toBeVisible()
  await expect(area.locator('[data-gu-local]')).toBeVisible()

  await page.evaluate((id) => {
    const p = window.__st!.profile.getState()
    p.mark(id, 'read')
    p.setScene(id, 6)
    p.addLetter(id, 'ح')
    p.addLetter(id, 'أ')
  }, STORY)
  await expect(area.locator('[data-gu-none]')).toHaveCount(0)
  await expect(area.locator('[data-gu-leaf="read"]')).toHaveAttribute('data-on', 'true')
  await expect(area.locator('[data-gu-leaf="watched"]')).toHaveAttribute('data-on', 'false')
  await expect(area.locator('[data-gu-scene]')).toHaveAttribute('data-gu-scene', '6')
  await expect(area.locator('[data-gu-letter]')).toHaveCount(2)
  // the last scene opens the book where the child stopped
  await area.locator('[data-gu-scene]').click()
  const site = await page.evaluate(() => ({ overlay: window.__st!.store.getState().overlay, scene: window.__st!.store.getState().startScene }))
  expect(site).toEqual({ overlay: 'book', scene: 6 })
  await page.evaluate(() => window.__st!.store.getState().closeOverlay())
  log.assertClean()
})

test('classroom mode and the settings are real switches; clearing progress asks first', async ({ page }) => {
  const log = await open(page)
  const area = page.locator('#grownups')
  await page.evaluate(() => window.__st!.grownups.unlock())
  await page.evaluate((id) => window.__st!.profile.getState().mark(id, 'read'), STORY)

  await area.locator('[data-gu-tab="classroom"]').click()
  const classroom = area.locator('[data-gu-switch="classroom"]')
  await expect(classroom).toHaveAttribute('aria-checked', 'false')
  await classroom.click()
  await expect(classroom).toHaveAttribute('aria-checked', 'true')
  expect(await page.evaluate(() => window.__st!.profile.getState().classroom)).toBe(true)
  await area.locator('[data-gu-present]').click()
  expect(await page.evaluate(() => window.__st!.store.getState().overlay)).toBe('book')
  await page.evaluate(() => window.__st!.store.getState().closeOverlay())

  await area.locator('[data-gu-tab="settings"]').click()
  await area.locator('[data-gu-switch="motion"]').click()
  expect((await state(page)).reduce).toBe(true)
  expect(await page.evaluate(() => localStorage.getItem('st:reduce-motion'))).toBe('1')
  await area.locator('[data-gu-switch="motion"]').click()
  await area.locator('[data-gu-switch="sound"]').click()
  expect((await state(page)).sound).toBe(true)
  await area.locator('[data-gu-switch="sound"]').click()

  // clear progress: cancel keeps it, confirm clears it; the child's name and classroom mode stay
  await area.locator('[data-gu-reset-start]').click()
  await area.locator('[data-gu-reset-no]').click()
  expect((await state(page)).progress?.read).toBe(true)
  await area.locator('[data-gu-reset-start]').click()
  await area.locator('[data-gu-reset-yes]').click()
  await expect(area.locator('[data-gu-reset="done"]')).toBeVisible()
  const s = await state(page)
  expect(s.progress).toBeNull()
  expect(s.profile?.name).toBe('Lina')
  expect(s.classroom).toBe(true)
  log.assertClean()
})

test('the plan tab is honest about the demo, shows the three sample plans and leads to the author\'s desk', async ({ page }) => {
  const log = await open(page)
  const area = page.locator('#grownups')
  await page.evaluate(() => window.__st!.grownups.unlock())
  await area.locator('[data-gu-tab="plan"]').click()
  await expect(area.locator('[data-gu-plan]')).toBeVisible()
  // the plans live here now: three cards, the highlighted one first, every price tagged as a sample
  const plans = area.locator('[data-gu-plans]')
  await expect(plans).toBeVisible()
  expect(await plans.locator('[data-tier]').evaluateAll((els) => els.map((e) => e.getAttribute('data-tier')))).toEqual(['family', 'start', 'school'])
  await expect(plans.locator('.pl-foot')).not.toBeEmpty()
  const prices = await plans.locator('[data-price]').count()
  expect(prices).toBeGreaterThan(0)
  await expect(plans.locator('[data-sample]')).toHaveCount(prices)
  // nothing is white on paper: the quiet cards carry ink type
  const quiet = await plans.locator('[data-tier="start"] .pl-name').evaluate((el) => getComputedStyle(el).color)
  expect(quiet).not.toBe('rgb(255, 255, 255)')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)

  // monthly → yearly changes the amount
  const monthly = await plans.locator('[data-tier="family"] [data-price]').textContent()
  await plans.locator('[role="radio"][data-value="yearly"]').click()
  await expect(plans.locator('[data-tier="family"] [data-per]')).toHaveAttribute('data-per', 'year')
  await expect.poll(() => plans.locator('[data-tier="family"] [data-price]').textContent(), { timeout: 10_000 }).not.toBe(monthly)

  // family → the demo checkout (yearly, as chosen); school → the sign-in sheet; start → the library
  await plans.locator('[data-cta="family"]').click()
  expect(await page.evaluate(() => { const c = window.__st!.store.getState().checkout as { plan?: string; yearly?: boolean } | null; return c && { plan: c.plan, yearly: c.yearly } })).toEqual({ plan: 'family', yearly: true })
  await page.evaluate(() => window.__st!.store.getState().closeCheckout())
  await plans.locator('[data-cta="school"]').click()
  expect(await page.evaluate(() => window.__st!.store.getState().loginOpen)).toBe(true)
  await page.evaluate(() => window.__st!.store.getState().setLoginOpen(false))
  await area.locator('[data-gu-studio]').click()
  expect(await page.evaluate(() => window.__st!.store.getState().view)).toBe('studio')
  log.assertClean()
})
