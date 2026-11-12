import { expect, test, type Page } from '@playwright/test'
import { pageUrl } from './_url'
import { scrollToY, waitForHook, watchConsole } from './helpers'

type State = { film: { armed: boolean; playing: boolean; live: boolean; loops: number }; reduced: boolean; toggle: boolean; locked: boolean; wordWidth: number; boxWidth: number }
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
    await expect(footer.locator('.ft-links [data-link]')).toHaveCount(3)
    expect(await footer.locator('.ft-links [data-link]').evaluateAll((els) => els.map((e) => e.getAttribute('data-link')))).toEqual(['library', 'sari', 'film'])
    await expect(footer.locator('.ft-legal')).not.toBeEmpty()
    await expect(footer.locator('.ft-note')).not.toBeEmpty()
    await expect(footer.locator('.ft-enter')).not.toBeEmpty()
    // measured to the gutters (never letter-spaced, never spilling); only a landscape screen that is short makes it stop earlier
    const fitsHeight = await page.evaluate(() => window.innerWidth <= window.innerHeight || window.innerHeight >= 860)
    await expect
      .poll(async () => { const s = await state(page); return s.boxWidth - s.wordWidth }, { timeout: 20_000 })
      .toBeLessThan(fitsHeight ? 2 : 0.4 * (await state(page)).boxWidth)
    const fit = await state(page)
    expect(fit.boxWidth).toBeGreaterThan(200)
    expect(fit.wordWidth).toBeLessThanOrEqual(fit.boxWidth + 2)
    // every control is a comfortable target
    for (const sel of ['.ft-link', '.ft-switch', '.ft-top', '.ft-enter']) {
      const box = await footer.locator(sel).first().boundingBox()
      expect(box!.height).toBeGreaterThanOrEqual(44)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
    // the page ends with the paper gone: the footer is at least as tall as the screen
    const tall = await page.evaluate(() => document.getElementById('footer')!.getBoundingClientRect().height - window.innerHeight)
    expect(tall).toBeGreaterThanOrEqual(0)
    con.assertClean()
  })

  test('the fine print arrives with the links, and the line stands clear of the bar', async ({ page }) => {
    await scrollToY(page, 99_999)
    const footer = page.locator('#footer')
    // links and fine print are one block: both end up fully shown
    await expect(footer.locator('.ft-foot')).toHaveCSS('opacity', '1')
    await expect(footer.locator('.ft-legal')).toBeVisible()
    await expect(footer.locator('.ft-note')).toBeVisible()
    const line = (await footer.locator('.ft-line').boundingBox())!
    const bar = (await footer.locator('.ft-bar').boundingBox())!
    expect(line.y + line.height).toBeLessThanOrEqual(bar.y)
    // on wide screens the line is set on the picture's calm (right) side
    if (await page.evaluate(() => window.innerWidth >= 900)) {
      const width = await page.evaluate(() => window.innerWidth)
      expect(line.x + line.width / 2).toBeGreaterThan(width / 2)
    }
  })

  test('the last film plays on screen and rests while something covers the page', async ({ page }) => {
    await expect.poll(async () => (await state(page)).film.playing, { timeout: 40_000 }).toBe(true)
    await page.evaluate(() => window.__st!.store.getState().openBook(0))
    await expect.poll(async () => (await state(page)).film.playing).toBe(false)
    await page.evaluate(() => window.__st!.store.getState().closeOverlay())
    await expect.poll(async () => (await state(page)).film.playing, { timeout: 40_000 }).toBe(true)
  })

  test('the loop never dissolves two pictures: it rests briefly, dips to the night and starts again', async ({ page }) => {
    await scrollToY(page, 99_999)
    await expect.poll(async () => (await state(page)).film.playing, { timeout: 40_000 }).toBe(true)
    // the picture at rest is the clip's last frame (open sky), not its first
    await expect(page.locator('#footer .qf__still')).toHaveAttribute('src', /k12-end/)
    // record every change of the picture from here on: did the night come down, and was the clip ever off show?
    await page.evaluate(() => {
      const qf = document.querySelector('#footer .qf')!
      const log = ((window as unknown as { __ftLog: string[] }).__ftLog = [])
      new MutationObserver(() => log.push(`${qf.hasAttribute('data-dip') ? 'dip' : 'clear'}/${qf.hasAttribute('data-live') ? 'live' : 'still'}`)).observe(qf, { attributes: true })
      const v = document.querySelector<HTMLVideoElement>('#footer video')!
      v.currentTime = Math.max(0, v.duration - 0.3)
    })
    await expect.poll(async () => (await state(page)).film.loops, { timeout: 20_000 }).toBeGreaterThan(0)
    const log = () => page.evaluate(() => (window as unknown as { __ftLog: string[] }).__ftLog)
    await expect.poll(async () => (await log()).includes('dip/live'), { timeout: 20_000 }).toBe(true)
    await expect.poll(async () => (await log()).at(-1), { timeout: 20_000 }).toBe('clear/live')
    // the moving picture stayed on show the whole time (no still crossfading over it)
    expect((await log()).some((e) => e.endsWith('/still'))).toBe(false)
    await expect.poll(async () => page.evaluate(() => document.querySelector<HTMLVideoElement>('#footer video')!.currentTime), { timeout: 20_000 }).toBeLessThan(2)
    await expect(page.locator('#footer .qf__still')).toHaveCSS('opacity', '0')
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
    if (await page.locator('#sari').count()) {
      const before = await page.evaluate(() => window.scrollY)
      await footer.locator('[data-link="sari"]').click()
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

  test('when the system already asks for less motion the switch is on and locked', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(pageUrl('footer'))
    await waitForHook(page, 'footer')
    await scrollToY(page, 99_999)
    const sw = page.locator('#footer .ft-switch')
    await expect(sw).toHaveAttribute('aria-checked', 'true')
    await expect(sw).toHaveAttribute('aria-disabled', 'true')
    expect((await state(page)).locked).toBe(true)
    // (aria-disabled: a real click is refused by the test driver, so press it anyway and go through the hook as well)
    await sw.click({ force: true })
    await page.evaluate(() => window.__st!.footer.toggleMotion())
    // nothing to give back: our own setting is untouched, the still stays
    await expect(sw).toHaveAttribute('aria-checked', 'true')
    expect((await state(page)).toggle).toBe(false)
    expect(await page.evaluate(() => localStorage.getItem('st:reduce-motion'))).toBe(null)
    expect((await state(page)).film.armed).toBe(false)
    await expect(page.locator('#footer .qf__still')).toHaveCSS('opacity', '1')
    await expect(page.locator('#footer .qf__still')).toHaveAttribute('src', /k12-end/)
    // everything is in place without waiting for a transition
    await expect(page.locator('#footer .ft-legal')).toBeVisible()
  })

  test('back to top', async ({ page }) => {
    await scrollToY(page, 99_999)
    await expect.poll(async () => page.evaluate(() => window.scrollY)).toBeGreaterThan(50)
    await page.locator('#footer .ft-top').click()
    await expect.poll(async () => page.evaluate(() => window.scrollY), { timeout: 20_000 }).toBeLessThan(2)
  })
})
