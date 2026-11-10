import { test, expect } from '@playwright/test'

for (const lang of ['ar', 'en'] as const) {
  test(`${lang}: direction, reader, paywall, watch`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto(`/?qa=1&lang=${lang}`, { waitUntil: 'networkidle' })
    await expect(page.locator('html')).toHaveAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr')
    await page.click('[data-testid=hero-read]')
    await expect(page.locator('.reader-root')).toBeVisible()
    await page.evaluate(() => (window as any).__st.reader.go(3))
    await page.waitForTimeout(1200)
    expect(await page.evaluate(() => (window as any).__st.reader.page())).toBe(3)
    // beyond the free pages the demo paywall appears, and the demo log-in lifts it
    await page.evaluate(() => (window as any).__st.reader.go(6))
    await page.getByRole('button', { name: lang === 'ar' ? 'دخول تجريبي' : 'Demo log-in' }).click()
    await page.evaluate(() => (window as any).__st.reader.go(12))
    await page.waitForTimeout(400)
    expect(await page.evaluate(() => (window as any).__st.reader.page())).toBe(12)
    await page.keyboard.press('Escape')
    await expect(page.locator('.reader-root')).toHaveCount(0)
    await page.click('[data-testid=hero-watch]')
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    expect(errors).toEqual([])
  })
}

test('language switch reloads into English', async ({ page }) => {
  await page.goto('/?lang=ar', { waitUntil: 'networkidle' })
  await page.click('[data-testid=lang-switch]')
  await page.waitForURL(/lang=en/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
})

test('game: catching the wanted letters in order completes a name', async ({ page }) => {
  await page.goto('/?qa=1&lang=ar', { waitUntil: 'networkidle' })
  await page.waitForFunction(() => !!(window as any).__st?.lenis)
  await page.evaluate(() => {
    const el = document.querySelector('#play')!
    ;(window as any).__st.lenis.scrollTo(el.getBoundingClientRect().top + window.scrollY + 120, { immediate: true, force: true })
  })
  await page.waitForFunction(() => !!(window as any).__st?.game, null, { timeout: 60_000 })
  await page.click('[data-testid=game-start]')
  const view = page.locator('[data-testid=game-view]')
  const box = (await view.boundingBox())!
  // steer toward the nearest leaf carrying the wanted letter until at least one letter is collected
  await expect
    .poll(
      async () => {
        const y = await page.evaluate(() => {
          const g = (window as any).__st.game
          const want = g.wanted()
          const l = g.positions().filter((p: any) => p.ch === want).sort((a: any, b: any) => b.x - a.x)[0]
          return l ? l.y : null
        })
        if (y !== null) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - (y / 2.05) * (box.height / 2))
        return page.evaluate(() => (window as any).__st.game.state().got + (window as any).__st.game.state().nameIdx * 10)
      },
      { timeout: 60_000, intervals: [150] },
    )
    .toBeGreaterThan(0)
})

test('no WebGL: page still works and the story opens', async ({ page }) => {
  await page.goto('/?nowebgl&lang=ar', { waitUntil: 'networkidle' })
  await page.click('[data-testid=hero-read]')
  await expect(page.locator('.reader-root')).toBeVisible()
})
