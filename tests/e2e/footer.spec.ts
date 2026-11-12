import { expect, test, type Page } from '@playwright/test'
import { pageUrl } from './_url'
import { scrollToY, waitForHook, watchConsole } from './helpers'

type State = { film: { armed: boolean; playing: boolean; live: boolean; loops: number }; reduced: boolean; toggle: boolean; wordWidth: number; boxWidth: number }
const state = (page: Page) => page.evaluate(() => window.__st!.footer.state() as State)
const store = (page: Page) =>
  page.evaluate(() => {
    const s = window.__st!.store.getState()
    return { overlay: s.overlay as string | null, picking: s.picking as boolean }
  })

test.describe('footer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(pageUrl('footer'))
    await waitForHook(page, 'footer')
    await scrollToY(page, '#footer')
  })

  test('one line, the links, the fine print and a wordmark as wide as the page', async ({ page }) => {
    const con = watchConsole(page)
    const footer = page.locator('#footer')
    await expect(footer.locator('.ft-line')).not.toBeEmpty()
    await expect(footer.locator('.ft-links [data-link]')).toHaveCount(4)
    await expect(footer.locator('.ft-legal')).not.toBeEmpty()
    await expect(footer.locator('.ft-note')).not.toBeEmpty()
    await expect(footer.locator('.ft-enter')).not.toBeEmpty()
    // measured to the gutters, in both languages, with no letter-spacing tricks
    await expect.poll(async () => { const s = await state(page); return Math.abs(s.wordWidth - s.boxWidth) }, { timeout: 20_000 }).toBeLessThan(2)
    expect((await state(page)).boxWidth).toBeGreaterThan(200)
    // every control is a comfortable target
    for (const sel of ['.ft-link', '.ft-switch', '.ft-top', '.ft-enter']) {
      const box = await footer.locator(sel).first().boundingBox()
      expect(box!.height).toBeGreaterThanOrEqual(44)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
    con.assertClean()
  })

  test('the last film plays on screen and rests while something covers the page', async ({ page }) => {
    await expect.poll(async () => (await state(page)).film.playing, { timeout: 40_000 }).toBe(true)
    await page.evaluate(() => window.__st!.store.getState().openBook(0))
    await expect.poll(async () => (await state(page)).film.playing).toBe(false)
    await page.evaluate(() => window.__st!.store.getState().closeOverlay())
    await expect.poll(async () => (await state(page)).film.playing, { timeout: 40_000 }).toBe(true)
  })

  test('the links follow the bar at the top: film, sections, the way into the app', async ({ page }) => {
    await scrollToY(page, 99_999)
    const footer = page.locator('#footer')
    await footer.locator('[data-link="film"]').click()
    await expect.poll(async () => (await store(page)).overlay).toBe('film')
    await page.evaluate(() => window.__st!.store.getState().closeOverlay())
    await expect.poll(async () => (await store(page)).overlay).toBe(null)

    // "enter the library" asks who is reading (nobody is signed in yet)
    await footer.locator('.ft-enter').click()
    await expect.poll(async () => (await store(page)).picking).toBe(true)
    await page.evaluate(() => window.__st!.store.getState().setPicking(false))

    // a section link travels up the page (only where that section is mounted)
    if (await page.locator('#pricing').count()) {
      const before = await page.evaluate(() => window.scrollY)
      await footer.locator('[data-link="pricing"]').click()
      await expect.poll(async () => page.evaluate(() => window.scrollY), { timeout: 20_000 }).toBeLessThan(before - 200)
    }
  })

  test('the reduce-motion switch stills the film and is remembered', async ({ page }) => {
    await scrollToY(page, 99_999)
    const sw = page.locator('#footer .ft-switch')
    await expect(sw).toHaveAttribute('aria-checked', 'false')
    await expect.poll(async () => (await state(page)).film.playing, { timeout: 40_000 }).toBe(true)
    await sw.click()
    await expect(sw).toHaveAttribute('aria-checked', 'true')
    await expect.poll(async () => (await state(page)).reduced).toBe(true)
    await expect(page.locator('html')).toHaveAttribute('data-reduce-motion', '')
    await expect.poll(async () => (await state(page)).film.playing).toBe(false)
    expect(await page.evaluate(() => localStorage.getItem('st:reduce-motion'))).toBe('1')
    // the still is what shows now
    await expect(page.locator('#footer .qf__still')).toHaveCSS('opacity', '1')
    await sw.click()
    await expect(sw).toHaveAttribute('aria-checked', 'false')
    await expect.poll(async () => (await state(page)).reduced).toBe(false)
    expect(await page.evaluate(() => localStorage.getItem('st:reduce-motion'))).toBe(null)
  })

  test('back to top', async ({ page }) => {
    await scrollToY(page, 99_999)
    await expect.poll(async () => page.evaluate(() => window.scrollY)).toBeGreaterThan(50)
    await page.locator('#footer .ft-top').click()
    await expect.poll(async () => page.evaluate(() => window.scrollY), { timeout: 20_000 }).toBeLessThan(2)
  })
})
