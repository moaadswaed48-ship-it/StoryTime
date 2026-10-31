import { test, expect } from '@playwright/test'

test('hero paints from static HTML and the LCP candidate is the photograph', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' })
  await expect(page.locator('#hero-title')).toContainText('Little Books')
  await expect(page.locator('#hero-img')).toBeVisible()
  const natural = await page.locator('#hero-img').evaluate((img: HTMLImageElement) => img.naturalWidth)
  expect(natural).toBeGreaterThan(600)
  await expect(page.locator('em.accent')).toHaveText('for')
})

test('the shared canvas mounts lazily and every 3D layer renders', async ({ page }) => {
  await page.goto('/?qa=1', { waitUntil: 'networkidle' })
  await page.waitForFunction(() => !!window.__st?.gl, null, { timeout: 30_000 })
  await page.waitForTimeout(1500)
  const calls = await page.evaluate(() => window.__st!.gl!.info.render.calls)
  expect(calls).toBeGreaterThan(0)
  expect(await page.locator('canvas').count()).toBe(1)
  expect(await page.locator('html').getAttribute('class')).not.toContain('no-webgl')
})

test('scrolling fades the hero copy and keeps the nav usable', async ({ page }) => {
  await page.goto('/?qa=1', { waitUntil: 'networkidle' })
  await page.waitForFunction(() => !!window.__st?.lenis, null, { timeout: 30_000 })
  await page.evaluate(() => window.__st!.lenis!.scrollTo(600, { immediate: true, force: true }))
  await page.waitForTimeout(800)
  const opacity = await page.locator('.hero-copy').evaluate((el) => parseFloat(getComputedStyle(el).opacity))
  expect(opacity).toBeLessThan(0.6)
  await expect(page.getByRole('link', { name: 'Books' })).toBeVisible()
})
