import { test, expect } from '@playwright/test'

test('without WebGL the page still works: static hero, DOM rack, dialog', async ({ page }) => {
  await page.goto('/?nowebgl=1', { waitUntil: 'networkidle' })
  await expect(page.locator('html')).toHaveClass(/no-webgl/)
  expect(await page.locator('canvas').count()).toBe(0)
  const rack = page.getByRole('list', { name: 'Books' })
  await expect(rack).toBeVisible()
  await rack.getByRole('button').first().click()
  await expect(page.locator('dialog')).toHaveJSProperty('open', true)
})

test('reduced motion: books start settled and no scroll scrub is applied', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/?qa=1', { waitUntil: 'networkidle' })
  await expect(page.locator('html')).toHaveAttribute('data-reduce-motion', '')
  await page.waitForFunction(() => !!window.__st?.shelf, null, { timeout: 30_000 })
  await page.evaluate(() => {
    const el = document.querySelector('.shelf-view')!
    window.__st!.lenis!.scrollTo(el.getBoundingClientRect().top + window.scrollY - 110, { immediate: true, force: true })
  })
  await page.waitForFunction(() => window.__st!.shelf!.phase() === 'browsing', null, { timeout: 20_000 })
  const pos = await page.evaluate(() => window.__st!.shelf!.positions())
  for (const [, y] of pos) expect(Math.abs(y)).toBeLessThan(1e-3)
})
