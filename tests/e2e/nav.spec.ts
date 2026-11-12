import { expect, test, type Page } from '@playwright/test'
import { pageUrl } from './_url'
import { scrollToY, waitForHook, watchConsole } from './helpers'

const nav = (page: Page) => page.evaluate(() => window.__st!.nav.state() as { tone: string; hidden: boolean; menu: boolean; active: string | null })
const site = (page: Page) =>
  page.evaluate(() => {
    const s = window.__st!.store.getState()
    return { overlay: s.overlay as string | null, loginOpen: s.loginOpen as boolean, picking: s.picking as boolean, view: s.view as string }
  })
const isWide = (page: Page) => (page.viewportSize()?.width ?? 0) >= 1024

/** The feature demo page is only one screen tall: give it room to scroll and a section for a link to land on. No-op on the full page. */
const makeScrollable = (page: Page) =>
  page.evaluate(() => {
    if (document.documentElement.scrollHeight < window.innerHeight * 2.5) {
      const pad = document.createElement('div')
      pad.style.height = '160vh'
      document.getElementById('page')?.appendChild(pad)
    }
    if (!document.getElementById('pricing')) {
      const target = document.createElement('section')
      target.id = 'pricing'
      target.style.height = '100vh'
      document.getElementById('page')?.appendChild(target)
    }
    window.__st?.lenis?.resize()
  })

/** How far (px) anything inside a floating pill sticks out of its glass, and the smallest gap between two pills. */
const barFit = (page: Page) =>
  page.evaluate(() => {
    const pills = [...document.querySelectorAll<HTMLElement>('.st-nav__bar .st-pill')].filter((p) => p.offsetParent !== null)
    let spill = 0
    for (const p of pills) {
      const pr = p.getBoundingClientRect()
      for (const c of p.querySelectorAll<HTMLElement>('a, button, span:not(.st-pill__skin), svg')) {
        const cr = c.getBoundingClientRect()
        if (cr.width) spill = Math.max(spill, pr.left - cr.left, cr.right - pr.right)
      }
    }
    const rects = pills.map((p) => p.getBoundingClientRect()).sort((a, b) => a.left - b.left)
    const gap = Math.min(...rects.slice(1).map((r, i) => r.left - rects[i].right))
    return { spill: Math.round(spill * 10) / 10, gap: Math.round(gap), overflow: document.documentElement.scrollWidth > window.innerWidth + 1 }
  })

test.describe('nav', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(pageUrl('nav,hero'))
    await waitForHook(page, 'nav')
    await makeScrollable(page)
    await scrollToY(page, 0)
  })

  test('is glass over the hero and dark glass after scrolling', async ({ page }) => {
    const con = watchConsole(page)
    await expect(page.locator('header.st-nav')).toBeVisible()
    await expect.poll(async () => (await nav(page)).tone).toBe('glass')
    await scrollToY(page, 400)
    await expect.poll(async () => (await nav(page)).tone).toBe('ink')
    await scrollToY(page, 0)
    await expect.poll(async () => (await nav(page)).tone).toBe('glass')
    con.assertClean()
  })

  test('the call to action is the way into the app, and the bar hides under overlays', async ({ page }) => {
    if (isWide(page)) await page.locator('.st-nav__bar .st-cta').click()
    else {
      await page.locator('.st-burger').click()
      await expect.poll(async () => (await nav(page)).menu).toBe(true)
      await page.locator('.st-sheet__enter').click()
    }
    // "enter the library": the first time it asks who is reading; with a known reader it opens the app straight away
    await expect.poll(async () => { const s = await site(page); return s.picking || s.view !== 'landing' }).toBe(true)
    expect((await site(page)).overlay).toBeNull()
    await page.evaluate(() => window.__st!.store.getState().setPicking(false))
    expect((await site(page)).view).toBe('landing')
    expect((await nav(page)).menu).toBe(false)

    await page.evaluate(() => window.__st!.store.getState().openBook(0))
    await expect.poll(async () => (await nav(page)).hidden).toBe(true)
    await page.evaluate(() => window.__st!.store.getState().closeOverlay())
    await expect.poll(async () => (await nav(page)).hidden).toBe(false)
  })

  test('desktop bar: four links scroll, the film link and log-in work', async ({ page }) => {
    test.skip(!isWide(page), 'the full bar exists from 1024px')
    const bar = page.locator('.st-nav__bar')
    await expect(bar.locator('.st-links [data-link]')).toHaveCount(4)
    expect(await bar.locator('.st-links [data-link]').evaluateAll((els) => els.map((e) => e.getAttribute('data-link')))).toEqual(['library', 'film', 'parents', 'pricing'])

    await bar.locator('[data-link="pricing"]').click()
    const target = await page.evaluate(() => document.getElementById('pricing')!.getBoundingClientRect().top + window.scrollY - 80)
    await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 20_000 }).toBeGreaterThan(Math.min(target, 200) - 4)
    await expect.poll(async () => (await nav(page)).tone).toBe('ink')
    await scrollToY(page, 0)

    await bar.locator('[data-link="film"]').click()
    await expect.poll(async () => (await site(page)).overlay).toBe('film')
    await page.evaluate(() => window.__st!.store.getState().closeOverlay())

    await bar.locator('.st-actions .st-ghost').nth(1).click()
    await expect.poll(async () => (await site(page)).loginOpen).toBe(true)
    await page.evaluate(() => window.__st!.store.getState().setLoginOpen(false))
  })

  test('desktop bar: nothing spills out of its pill, in English and Arabic, logged in or out', async ({ page }) => {
    test.skip(!isWide(page), 'the full bar exists from 1024px')
    for (const lang of ['&lang=en', '']) {
      await page.goto(pageUrl('nav,hero', lang))
      await waitForHook(page, 'nav')
      for (const loggedIn of [false, true]) {
        await page.evaluate((v) => window.__st!.store.getState().setLoggedIn(v), loggedIn)
        for (const width of [1024, 1100, 1240, 1280, 1360, 1440]) {
          await page.setViewportSize({ width, height: 800 })
          await page.waitForTimeout(150)
          const fit = await barFit(page)
          const at = `${lang ? 'en' : 'ar'} ${width}px ${loggedIn ? 'logged in' : 'logged out'}`
          expect(fit.spill, `spill at ${at}`).toBeLessThanOrEqual(0.5)
          expect(fit.gap, `gap between pills at ${at}`).toBeGreaterThanOrEqual(12)
          expect(fit.overflow, `page overflow at ${at}`).toBe(false)
        }
      }
      await page.evaluate(() => window.__st!.store.getState().setLoggedIn(false))
    }
  })

  test('phone menu: opens as a sheet, locks the page, rests the film, closes on Escape and on a link', async ({ page }) => {
    test.skip(isWide(page), 'phones and tablets only')
    const burger = page.locator('.st-burger')
    const sheet = page.locator('#st-menu')
    await burger.click()
    await expect.poll(async () => (await nav(page)).menu).toBe(true)
    await expect(burger).toHaveAttribute('aria-expanded', 'true')
    await expect(sheet.locator('.st-sheet__link')).toHaveCount(4)
    await expect(sheet.locator('.st-sheet__link').first()).toBeVisible()
    await expect(sheet.locator('.st-sheet__enter')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe('hidden')
    // the hero under the sheet stops playing (film and leaves) while it is covered
    await expect.poll(() => page.evaluate(() => { const h = window.__st!.hero; return !h || (!h.film()?.playing && !h.wind()?.running) })).toBe(true)

    await page.keyboard.press('Escape')
    await expect.poll(async () => (await nav(page)).menu).toBe(false)
    expect(await page.evaluate(() => document.documentElement.style.overflow)).not.toBe('hidden')

    await burger.click()
    await expect.poll(async () => (await nav(page)).menu).toBe(true)
    await sheet.locator('.st-sheet__link[data-link="film"]').click()
    await expect.poll(async () => (await nav(page)).menu).toBe(false)
    await expect.poll(async () => (await site(page)).overlay).toBe('film')
    await page.evaluate(() => window.__st!.store.getState().closeOverlay())
  })
})
