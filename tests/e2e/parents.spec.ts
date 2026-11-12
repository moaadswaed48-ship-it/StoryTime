import { expect, test, type Page } from '@playwright/test'
import { pageUrl } from './_url'
import { scrollToY, waitForHook, watchConsole } from './helpers'

type Tile = { scene: number; armed: boolean; playing: boolean }
type State = { cards: number; tiles: Tile[]; stats: boolean }
const state = (page: Page) => page.evaluate(() => window.__st!.parents.state() as State)
const tile = async (page: Page, scene: number) => (await state(page)).tiles.find((t) => t.scene === scene)
const site = (page: Page) => page.evaluate(() => { const s = window.__st!.store.getState(); return { overlay: s.overlay as string | null, startScene: s.startScene as number } })

test.describe('parents', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(pageUrl('parents'))
    await waitForHook(page, 'parents')
    await scrollToY(page, '#parents')
  })

  test('six cards (two of them film) and four numerals, all with words', async ({ page }) => {
    const con = watchConsole(page)
    const section = page.locator('#parents')
    await expect(section.locator('[data-card]')).toHaveCount(6)
    await expect(section.locator('.pr-live')).toHaveCount(2)
    for (const h of await section.locator('[data-card] h3').all()) expect((await h.textContent())?.trim()).toBeTruthy()
    for (const p of await section.locator('[data-card] p').all()) expect((await p.textContent())?.trim()).toBeTruthy()

    const stats = section.locator('.pr-stat')
    await expect(stats).toHaveCount(4)
    for (const s of await stats.all()) {
      // the numeral is readable as plain text, and its label is there
      expect(await s.locator('.sr-only').textContent()).toMatch(/[0-9٠-٩]/)
      expect((await s.locator('.pr-stat__l').textContent())?.trim()).toBeTruthy()
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
    con.assertClean()
  })

  test('a film tile plays only while it is on screen', async ({ page }) => {
    await scrollToY(page, '#parents .pr-live[data-scene="0"]')
    await expect.poll(async () => (await tile(page, 0))?.playing, { timeout: 40_000 }).toBe(true)
    // far below, at the numerals, the first tile is off screen and must stop
    await scrollToY(page, '#parents .pr-stats')
    await expect.poll(async () => (await tile(page, 0))?.playing).toBe(false)
    await scrollToY(page, '#parents .pr-live[data-scene="0"]')
    await expect.poll(async () => (await tile(page, 0))?.playing, { timeout: 40_000 }).toBe(true)
  })

  test('the watch button on a film tile opens the film at that scene', async ({ page }) => {
    await scrollToY(page, '#parents .pr-live[data-scene="11"]')
    await page.locator('#parents .pr-live[data-scene="11"] .pr-live__watch').click()
    await expect.poll(async () => (await site(page)).overlay).toBe('film')
    expect((await site(page)).startScene).toBe(11)
    // while something covers the page the tile rests
    await expect.poll(async () => (await tile(page, 11))?.playing).toBe(false)
    await page.evaluate(() => window.__st!.store.getState().closeOverlay())
    await expect.poll(async () => (await site(page)).overlay).toBe(null)
  })

  test('the numerals roll in when reached and end on their real digits', async ({ page }) => {
    await scrollToY(page, '#parents .pr-stats')
    await expect.poll(async () => (await state(page)).stats).toBe(true)
    const first = page.locator('#parents .pr-stat').first()
    const strip = first.locator('.pr-odo__strip').first()
    await expect(strip).toHaveCSS('opacity', '1')
    // the last glyph of every strip is the digit of the copy
    const ok = await page.evaluate(() =>
      Array.from(document.querySelectorAll('#parents .pr-stat')).every((li) => {
        const want = (li.querySelector('.sr-only')?.textContent ?? '').replace(/[^0-9٠-٩]/g, '')
        // a lone Arabic «٠» is drawn as one larger glyph instead of a rolling strip
        const zero = li.querySelector('.pr-odo__zero > span')?.textContent ?? ''
        const got = zero || Array.from(li.querySelectorAll('.pr-odo__strip')).map((s) => s.lastElementChild?.textContent ?? '').join('')
        return want.length > 0 && want === got
      }),
    )
    expect(ok).toBe(true)
  })

  test('reduced motion: stills only, numerals already in place', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(pageUrl('parents'))
    await waitForHook(page, 'parents')
    await scrollToY(page, '#parents .pr-live[data-scene="0"]')
    expect((await state(page)).stats).toBe(true)
    await page.waitForTimeout(1200)
    expect((await tile(page, 0))?.armed).toBe(false)
    await expect(page.locator('#parents .pr-live[data-scene="0"] img')).toBeVisible()
  })
})
