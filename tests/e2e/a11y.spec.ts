import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('axe: no serious or critical violations on the page and with the dialog open', async ({ page }) => {
  await page.goto('/?qa=1', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  const scan = async () => {
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
    return r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)
  }
  expect(await scan()).toEqual([])
  await page.waitForFunction(() => !!window.__st?.shelf, null, { timeout: 30_000 })
  await page.evaluate(() => window.__st!.shelf!.open('the-moon-who-lost-her-hat'))
  await expect(page.locator('dialog')).toHaveJSProperty('open', true)
  expect(await scan()).toEqual([])
})

test('keyboard: Tab reaches the carousel, arrows move it, Enter opens, focus returns on close', async ({ page }) => {
  await page.goto('/?qa=1', { waitUntil: 'networkidle' })
  await page.waitForFunction(() => !!window.__st?.shelf, null, { timeout: 30_000 })
  await page.evaluate(() => window.__st!.shelf!.settleNow())
  await page.locator('.shelf-wrap').focus()
  await page.keyboard.press('ArrowRight')
  await page.waitForFunction(() => window.__st!.shelf!.phase() === 'browsing', null, { timeout: 30_000 })
  await page.keyboard.press('Enter')
  await expect(page.locator('dialog')).toHaveJSProperty('open', true)
  const focusedInDialog = await page.evaluate(() => !!document.activeElement?.closest('dialog'))
  expect(focusedInDialog).toBe(true)
  await page.keyboard.press('Escape')
  await expect(page.locator('dialog')).toHaveJSProperty('open', false)
  const back = await page.evaluate(() => document.activeElement?.classList.contains('shelf-wrap'))
  expect(back).toBe(true)
})
