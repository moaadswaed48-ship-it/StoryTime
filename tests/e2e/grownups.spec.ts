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

test('the plan tab is honest about the demo and leads to the plans and to the author\'s desk', async ({ page }) => {
  const log = await open(page)
  const area = page.locator('#grownups')
  await page.evaluate(() => window.__st!.grownups.unlock())
  await area.locator('[data-gu-tab="plan"]').click()
  await expect(area.locator('[data-gu-plan]')).toBeVisible()
  await expect(area.locator('[data-gu-plans]')).toBeVisible()
  await area.locator('[data-gu-studio]').click()
  expect(await page.evaluate(() => window.__st!.store.getState().view)).toBe('studio')
  log.assertClean()
})
