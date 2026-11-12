import { expect, test, type Page } from '@playwright/test'
import { pageUrl } from './_url'
import { scrollToY, waitForHook, watchConsole } from './helpers'

const nav = (page: Page) => page.evaluate(() => window.__st!.nav.state() as { tone: string; hidden: boolean; menu: boolean; active: string | null })
const site = (page: Page) => page.evaluate(() => { const s = window.__st!.store.getState(); return { overlay: s.overlay as string | null, loginOpen: s.loginOpen as boolean } })
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

  test('the call to action opens the book and the bar hides under overlays', async ({ page }) => {
    if (isWide(page)) await page.locator('.st-nav__bar .st-cta').click()
    else {
      await page.locator('.st-burger').click()
      await expect.poll(async () => (await nav(page)).menu).toBe(true)
      await page.locator('.st-sheet__foot button').last().click()
    }
    await expect.poll(async () => (await site(page)).overlay).toBe('book')
    await expect.poll(async () => (await nav(page)).hidden).toBe(true)
    expect((await nav(page)).menu).toBe(false)
    await page.evaluate(() => window.__st!.store.getState().closeOverlay())
    await expect.poll(async () => (await nav(page)).hidden).toBe(false)
  })

  test('desktop bar: links scroll, the film link and log-in work', async ({ page }) => {
    test.skip(!isWide(page), 'the full bar exists from 1024px')
    const bar = page.locator('.st-nav__bar')
    await expect(bar.locator('.st-links [data-link]')).toHaveCount(6)

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

  test('phone menu: opens as a sheet, locks the page, closes on Escape and on a link', async ({ page }) => {
    test.skip(isWide(page), 'phones and tablets only')
    const burger = page.locator('.st-burger')
    const sheet = page.locator('#st-menu')
    await burger.click()
    await expect.poll(async () => (await nav(page)).menu).toBe(true)
    await expect(burger).toHaveAttribute('aria-expanded', 'true')
    await expect(sheet.locator('.st-sheet__link')).toHaveCount(6)
    await expect(sheet.locator('.st-sheet__link').first()).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe('hidden')

    await page.keyboard.press('Escape')
    await expect.poll(async () => (await nav(page)).menu).toBe(false)
    expect(await page.evaluate(() => document.documentElement.style.overflow)).not.toBe('hidden')

    await burger.click()
    await expect.poll(async () => (await nav(page)).menu).toBe(true)
    await sheet.locator('[data-link="film"]').click()
    await expect.poll(async () => (await nav(page)).menu).toBe(false)
    await expect.poll(async () => (await site(page)).overlay).toBe('film')
    await page.evaluate(() => window.__st!.store.getState().closeOverlay())
  })
})
