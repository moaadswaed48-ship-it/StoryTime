import { expect, test, type Page } from '@playwright/test'
import { pageUrl } from './_url'
import { scrollToY, waitForHook, watchConsole } from './helpers'

type State = { yearly: boolean; price: string; per: string; samples: number; numbers: number; order: string[]; glow: boolean; sweeps: number }
const state = (page: Page) => page.evaluate(() => window.__st!.pricing.state() as State)
const loginOpen = (page: Page) => page.evaluate(() => window.__st!.store.getState().loginOpen as boolean)
const isWide = (page: Page) => (page.viewportSize()?.width ?? 0) >= 900
/** The sample amounts of the copy, in either digit system. */
const MONTH = /^(29|٢٩)$/
const YEAR = /^(290|٢٩٠)$/

test.describe('pricing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(pageUrl('pricing'))
    await waitForHook(page, 'pricing')
    await scrollToY(page, '#pricing')
  })

  test('three plans, the highlighted one in the middle (first on phones), every number tagged as a sample', async ({ page }) => {
    const con = watchConsole(page)
    const section = page.locator('#pricing')
    await expect(section.locator('.pl-card')).toHaveCount(3)
    await expect(section.locator('.pl-card[data-featured]')).toHaveCount(1)
    await expect(section.locator('.pl-tab')).toBeVisible()
    const s = await state(page)
    expect(s.order).toEqual(isWide(page) ? ['start', 'family', 'school'] : ['family', 'start', 'school'])
    expect(s.price).toMatch(MONTH)
    expect(s.per).toBe('month')
    // a number never appears without its "sample" tag in the same card
    expect(s.numbers).toBeGreaterThan(0)
    const tagged = await page.evaluate(() =>
      Array.from(document.querySelectorAll('#pricing [data-price]')).every((n) => {
        const tag = n.closest('.pl-card')?.querySelector('[data-sample]')
        return !!tag && tag.getClientRects().length > 0 && !!tag.textContent?.trim()
      }),
    )
    expect(tagged).toBe(true)
    // every plan has a checklist and a call to action
    for (const card of await section.locator('.pl-card').all()) {
      expect(await card.locator('.pl-feats li').count()).toBeGreaterThanOrEqual(3)
      await expect(card.locator('.pl-cta')).toBeVisible()
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
    con.assertClean()
  })

  test('the switch slides to yearly, the price counts to the yearly sample and back', async ({ page }) => {
    const toggle = page.locator('#pricing .pl-toggle')
    await scrollToY(page, '#pricing .pl-toggle')
    const thumb = toggle.locator('.pl-toggle__thumb')
    const before = (await thumb.boundingBox())!.x
    await toggle.locator('[data-value="yearly"]').click()
    await expect(toggle.locator('[data-value="yearly"]')).toHaveAttribute('aria-checked', 'true')
    await expect.poll(async () => (await state(page)).price).toMatch(YEAR)
    const s = await state(page)
    expect(s.yearly).toBe(true)
    expect(s.per).toBe('year')
    expect(s.samples).toBe(s.numbers)
    await expect.poll(async () => Math.abs((await thumb.boundingBox())!.x - before)).toBeGreaterThan(40)

    // keyboard: it is a radio group
    await toggle.locator('[data-value="yearly"]').focus()
    await page.keyboard.press('ArrowLeft')
    await expect(toggle.locator('[data-value="monthly"]')).toHaveAttribute('aria-checked', 'true')
    await expect(toggle.locator('[data-value="monthly"]')).toBeFocused()
    await expect.poll(async () => (await state(page)).price).toMatch(MONTH)
    expect((await state(page)).per).toBe('month')
  })

  test('choosing a plan opens the sign-in sheet', async ({ page }) => {
    await scrollToY(page, '#pricing [data-cta="family"]')
    expect(await loginOpen(page)).toBe(false)
    await page.locator('#pricing [data-cta="family"]').click()
    await expect.poll(() => loginOpen(page)).toBe(true)
    await page.evaluate(() => window.__st!.store.getState().setLoginOpen(false))
    await expect.poll(() => loginOpen(page)).toBe(false)
  })

  test('desktop: the card borders light up under the mouse', async ({ page }) => {
    test.skip(!isWide(page) || !(await page.evaluate(() => window.matchMedia('(hover: hover) and (pointer: fine)').matches)), 'mouse only')
    await scrollToY(page, '#pricing .pl-grid')
    const card = page.locator('#pricing .pl-card[data-featured]')
    await expect(card).toHaveCSS('opacity', '1')
    const box = (await card.boundingBox())!
    await page.mouse.move(box.x + 30, box.y + 80)
    await page.mouse.move(box.x + 60, box.y + 120, { steps: 6 })
    await expect.poll(async () => (await state(page)).glow).toBe(true)
    await expect.poll(() => card.evaluate((el) => (el as HTMLElement).style.getPropertyValue('--mx'))).toMatch(/px$/)
    await expect(card.locator('.pl-card__ring')).toHaveCSS('opacity', '1')
    // the page scrolls under a still mouse: the light keeps tracking the pointer
    const my = () => card.evaluate((el) => parseFloat((el as HTMLElement).style.getPropertyValue('--my')))
    const before = await my()
    await page.mouse.wheel(0, -120) // up: on the demo page the section may already sit at the end of the page
    await expect.poll(async () => Math.abs((await my()) - before), { timeout: 5_000 }).toBeGreaterThan(20)
    await page.mouse.move(5, 5)
    await expect.poll(async () => (await state(page)).glow).toBe(false)
  })

  test('phones: the light glides across the cards as they scroll by', async ({ page }) => {
    test.skip(await page.evaluate(() => window.matchMedia('(hover: hover) and (pointer: fine)').matches), 'touch only')
    await scrollToY(page, '#pricing .pl-grid')
    const card = page.locator('#pricing .pl-card[data-featured]')
    await expect.poll(async () => (await state(page)).glow).toBe(true)
    const mx = () => card.evaluate((el) => parseFloat((el as HTMLElement).style.getPropertyValue('--my')))
    const before = await mx()
    await page.evaluate(() => window.scrollBy(0, -160))
    await expect.poll(async () => Math.abs((await mx()) - before)).toBeGreaterThan(20)
  })

  test('a light sweeps the highlighted card once it lands, and again on every switch', async ({ page }) => {
    test.skip(await page.evaluate(() => window.__st!.store.getState().tier === 'reduced'), 'motion reduced')
    await scrollToY(page, '#pricing .pl-grid')
    await expect.poll(async () => (await state(page)).sweeps).toBe(1)
    await expect(page.locator('#pricing .pl-card[data-featured] .pl-card__sweep')).toHaveCount(1)
    await page.evaluate(() => window.__st!.pricing.setYearly(true))
    await expect.poll(async () => (await state(page)).sweeps).toBe(2)
    await expect(page.locator('#pricing .pl-card__sweep')).toHaveCount(1)
  })
})
