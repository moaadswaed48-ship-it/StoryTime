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
const hasCta = (page: Page) => page.locator('#author .aut-cta').count().then((n) => n > 0)
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
    await expect(section.locator('.aut-text')).not.toBeEmpty()
    await expect(section.locator('.aut-sign__by')).not.toBeEmpty()
    // the cover is lettered in type (the art itself has no words) and can be opened with the keyboard
    await expect(section.locator('.aut-lockup')).not.toBeEmpty()
    await expect(section.locator('.aut-open')).toHaveAttribute('aria-label', /.+/)
    // the paragraph is whole in the page, whatever its words are doing
    const words = await section.locator('.aut-w').count()
    expect(words).toBeGreaterThan(10)
    // the invitation keeps every word of its title, one sentence to a line
    // (the landing page shows the section without its invitation card; the demo page shows it)
    if (await hasCta(page)) {
      const lines = await section.locator('.aut-cta__title span').allInnerTexts()
      expect(lines.length).toBeGreaterThanOrEqual(1)
      expect(lines.every((l) => l.trim().length > 0)).toBe(true)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
    con.assertClean()
  })

  test('the book lands on the paper and leans toward the pointer', async ({ page }) => {
    await scrollToY(page, '#author .aut-scene')
    await expect.poll(async () => (await state(page)).book.landed, { timeout: 30_000 }).toBe(true)
    await expect(page.locator('#author .aut-scene')).toHaveCSS('opacity', '1')
    const rest = (await state(page)).book.pose!
    // lying down, not flat to the screen
    expect(Math.abs(rest.rx)).toBeGreaterThan(8)
    expect(Math.abs(rest.ry)).toBeGreaterThan(8)
    await page.evaluate(() => window.__st!.author.point(1, 0))
    await expect.poll(async () => Math.abs((await state(page)).book.pose!.ry - rest.ry), { timeout: 20_000 }).toBeGreaterThan(2)
    await page.evaluate(() => window.__st!.author.point(0, 0))
    await expect.poll(async () => Math.abs((await state(page)).book.pose!.ry - rest.ry), { timeout: 20_000 }).toBeLessThan(0.6)
  })

  test('the words about her are fully lit once the paragraph is in the upper part of the screen', async ({ page }) => {
    // put the paragraph's top at 60% of the screen: a common resting place, not the end of the scroll
    const y = await page.evaluate(() => {
      const p = document.querySelector('#author .aut-text')!
      return p.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.6
    })
    await scrollToY(page, Math.max(0, y))
    await expect.poll(async () => (await state(page)).lit, { timeout: 20_000 }).toBe(1)
    await expect(page.locator('#author .aut-w').last()).toHaveCSS('opacity', '1')
  })

  test('the paragraph lights up as it is read and the signature is drawn', async ({ page }) => {
    await scrollToY(page, '#author .aut-sign')
    await expect.poll(async () => (await state(page)).lit, { timeout: 20_000 }).toBe(1)
    await expect.poll(async () => (await state(page)).signed).toBe(true)
    const last = page.locator('#author .aut-w').last()
    await expect(last).toHaveCSS('opacity', '1')
  })

  test('the cover and the invitation open the book, the film and the desk', async ({ page }) => {
    await scrollToY(page, '#author .aut-scene')
    await expect.poll(async () => (await state(page)).book.landed, { timeout: 30_000 }).toBe(true)
    await page.locator('#author .aut-open').click()
    await expect.poll(async () => (await site(page)).overlay).toBe('book')
    expect((await site(page)).startScene).toBe(0)
    await closeOverlay(page)
    await expect.poll(async () => (await site(page)).overlay).toBe(null)
    if (!(await hasCta(page))) return // the landing page has no invitation card

    await scrollToY(page, '#author .aut-cta')
    const card = page.locator('#author .aut-cta')
    await expect(card.locator('.aut-cta__title')).not.toBeEmpty()
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
    test.skip(!(await hasCta(page)), 'no invitation card on this page')
    await scrollToY(page, '#author .aut-cta')
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
    if (!(await hasCta(page))) return
    await scrollToY(page, '#author .aut-cta')
    await page.waitForTimeout(1200)
    expect((await state(page)).film.armed).toBe(false)
    await expect(page.locator('#author .aut-cta img')).toBeVisible()
    await expect(page.locator('#author .aut-w').last()).toHaveCSS('opacity', '1')
  })
})
