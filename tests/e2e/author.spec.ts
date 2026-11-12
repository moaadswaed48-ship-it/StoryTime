import { expect, test, type Page } from '@playwright/test'
import { pageUrl } from './_url'
import { scrollToY, waitForHook, watchConsole } from './helpers'

type Pose = { rx: number; ry: number; rz: number }
type State = { book: { landed: boolean; pose: Pose | null }; film: { armed: boolean; playing: boolean; live: boolean }; lit: number; signed: boolean }
const state = (page: Page) => page.evaluate(() => window.__st!.author.state() as State)
const site = (page: Page) =>
  page.evaluate(() => {
    const s = window.__st!.store.getState()
    return { overlay: s.overlay as string | null, startScene: s.startScene as number, view: s.view as string }
  })
const closeOverlay = (page: Page) => page.evaluate(() => window.__st!.store.getState().closeOverlay())

test.describe('author', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(pageUrl('author'))
    await waitForHook(page, 'author')
    await scrollToY(page, '#author')
  })

  test('her words, her title on the cover, and nothing spills', async ({ page }) => {
    const con = watchConsole(page)
    const section = page.locator('#author')
    await expect(section.locator('h2')).not.toBeEmpty()
    await expect(section.locator('.au-text')).not.toBeEmpty()
    await expect(section.locator('.au-sign__by')).not.toBeEmpty()
    // the cover is lettered in type (the art itself has no words) and can be opened with the keyboard
    await expect(section.locator('.au-lockup')).not.toBeEmpty()
    await expect(section.locator('.au-open')).toHaveAttribute('aria-label', /.+/)
    // the paragraph is whole in the page, whatever its words are doing
    const words = await section.locator('.au-w').count()
    expect(words).toBeGreaterThan(10)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
    con.assertClean()
  })

  test('the book lands on the paper and leans toward the pointer', async ({ page }) => {
    await scrollToY(page, '#author .au-scene')
    await expect.poll(async () => (await state(page)).book.landed, { timeout: 30_000 }).toBe(true)
    await expect(page.locator('#author .au-scene')).toHaveCSS('opacity', '1')
    const rest = (await state(page)).book.pose!
    // lying down, not flat to the screen
    expect(Math.abs(rest.rx)).toBeGreaterThan(8)
    expect(Math.abs(rest.ry)).toBeGreaterThan(8)
    await page.evaluate(() => window.__st!.author.point(1, 0))
    await expect.poll(async () => Math.abs((await state(page)).book.pose!.ry - rest.ry), { timeout: 20_000 }).toBeGreaterThan(2)
    await page.evaluate(() => window.__st!.author.point(0, 0))
    await expect.poll(async () => Math.abs((await state(page)).book.pose!.ry - rest.ry), { timeout: 20_000 }).toBeLessThan(0.6)
  })

  test('the paragraph lights up as it is read and the signature is drawn', async ({ page }) => {
    await scrollToY(page, '#author .au-sign')
    await expect.poll(async () => (await state(page)).lit, { timeout: 20_000 }).toBe(1)
    await expect.poll(async () => (await state(page)).signed).toBe(true)
    const last = page.locator('#author .au-w').last()
    await expect(last).toHaveCSS('opacity', '1')
  })

  test('the cover and the invitation open the book, the film and the desk', async ({ page }) => {
    await scrollToY(page, '#author .au-scene')
    await expect.poll(async () => (await state(page)).book.landed, { timeout: 30_000 }).toBe(true)
    await page.locator('#author .au-open').click()
    await expect.poll(async () => (await site(page)).overlay).toBe('book')
    expect((await site(page)).startScene).toBe(0)
    await closeOverlay(page)
    await expect.poll(async () => (await site(page)).overlay).toBe(null)

    await scrollToY(page, '#author .au-cta')
    const card = page.locator('#author .au-cta')
    await expect(card.locator('.au-cta__title')).not.toBeEmpty()
    await card.locator('[data-act="read"]').click()
    await expect.poll(async () => (await site(page)).overlay).toBe('book')
    await closeOverlay(page)
    await expect.poll(async () => (await site(page)).overlay).toBe(null)

    await card.locator('[data-act="watch"]').click()
    await expect.poll(async () => (await site(page)).overlay).toBe('film')
    expect((await site(page)).startScene).toBe(0)
    await closeOverlay(page)
    await expect.poll(async () => (await site(page)).overlay).toBe(null)

    // last: this one leaves the landing page for the author's desk
    await card.locator('[data-act="studio"]').click()
    await expect.poll(async () => (await site(page)).view).toBe('studio')
  })

  test('the falling leaves play only while the card is on screen', async ({ page }) => {
    await scrollToY(page, '#author .au-cta')
    await expect.poll(async () => (await state(page)).film.playing, { timeout: 40_000 }).toBe(true)
    // something covers the page: the clip rests
    await page.evaluate(() => window.__st!.store.getState().setLoginOpen(true))
    await expect.poll(async () => (await state(page)).film.playing).toBe(false)
    await page.evaluate(() => window.__st!.store.getState().setLoginOpen(false))
    await expect.poll(async () => (await state(page)).film.playing, { timeout: 40_000 }).toBe(true)
    // back at the top of the section the card is far below the screen
    await scrollToY(page, '#author')
    await expect.poll(async () => (await state(page)).film.playing).toBe(false)
  })

  test('reduced motion: everything is in its place and only the still shows', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(pageUrl('author'))
    await waitForHook(page, 'author')
    await scrollToY(page, '#author')
    const s = await state(page)
    expect(s.book.landed).toBe(true)
    expect(s.lit).toBe(1)
    expect(s.signed).toBe(true)
    await scrollToY(page, '#author .au-cta')
    await page.waitForTimeout(1200)
    expect((await state(page)).film.armed).toBe(false)
    await expect(page.locator('#author .au-cta img')).toBeVisible()
    await expect(page.locator('#author .au-w').last()).toHaveCSS('opacity', '1')
  })
})
