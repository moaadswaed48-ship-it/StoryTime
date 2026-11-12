import { expect, test, type Page } from '@playwright/test'
import { pageUrl } from './_url'
import { waitForHook, watchConsole } from './helpers'

const view = (page: Page) => page.evaluate(() => window.__st!.store.getState().view)
const nav = (page: Page) => page.evaluate(() => window.__st!.appnav.state())
const tab = (page: Page, id: string) => page.locator(`[data-tab="${id}"]:visible`)

/** Opens the app as a signed-in child (the app's navigation only exists behind the front door). */
async function openApp(page: Page) {
  await page.goto(pageUrl('appnav'))
  await waitForHook(page, 'store')
  await page.evaluate(() => {
    window.__st!.profile.getState().reset()
    window.__st!.profile.getState().setProfile({ name: 'لينا', avatar: 'amir' })
    window.__st!.store.getState().setView('home')
  })
  await waitForHook(page, 'appnav')
}

test.describe('appnav — the app navigation', () => {
  test('three tabs change the screen and mark the current one', async ({ page }) => {
    const con = watchConsole(page)
    await openApp(page)
    await expect(page.locator('[data-tab]:visible')).toHaveCount(3)
    await expect(tab(page, 'home')).toHaveAttribute('aria-current', 'page')

    await tab(page, 'tree').click()
    await expect.poll(() => view(page)).toBe('tree')
    await expect(tab(page, 'tree')).toHaveAttribute('aria-current', 'page')

    await tab(page, 'grownups').click()
    await expect.poll(() => view(page)).toBe('grownups')

    // a story's page belongs to the library tab
    await page.evaluate(() => window.__st!.store.getState().setView('story'))
    await expect(tab(page, 'home')).toHaveAttribute('aria-current', 'page')

    // every tab is a comfortable target for a small finger
    const box = await tab(page, 'home').boundingBox()
    expect(box!.height).toBeGreaterThanOrEqual(44)

    // the navigation stays reachable while reading down a long screen (desktop pill, phone tab bar)
    await page.evaluate(() => {
      const spacer = document.createElement('div')
      spacer.style.height = '3000px'
      document.body.appendChild(spacer)
      window.scrollTo(0, 1500)
    })
    await expect(tab(page, 'home')).toBeInViewport()
    con.assertClean()
  })

  test('shows who is reading and opens "who is reading?" from the reader chip', async ({ page }) => {
    await openApp(page)
    // (on phones the library screen shows the reader in its greeting instead, so look from another screen)
    await page.evaluate(() => window.__st!.store.getState().setView('tree'))
    const chip = page.locator('[data-reader]')
    await expect(chip).toContainText('لينا')
    await expect(chip.locator('[data-avatar="amir"]')).toBeVisible()
    await chip.click()
    expect(await page.evaluate(() => window.__st!.store.getState().picking)).toBe(true)
  })

  test('steps aside for the book, and classroom mode has no tree tab', async ({ page }) => {
    await openApp(page)
    await page.evaluate(() => window.__st!.store.getState().openBook(0))
    expect((await nav(page)).hidden).toBe(true)
    await expect(page.locator('.appnav')).toHaveAttribute('data-hidden', '')
    await page.evaluate(() => window.__st!.store.getState().closeOverlay())
    await expect(page.locator('.appnav')).not.toHaveAttribute('data-hidden', '')

    // leaves earned so far ride on the tree tab
    await expect(page.locator('.appnav__badge:visible')).toHaveCount(0)
    await page.evaluate(() => window.__st!.profile.getState().mark('autumn-leaves', 'read'))
    await expect(page.locator('.appnav__badge:visible')).toHaveCount(1)
    await expect(page.locator('.appnav__badge:visible')).toHaveText(/^[1١]$/)

    await page.evaluate(() => window.__st!.profile.getState().setClassroom(true))
    await expect(page.locator('[data-tab]:visible')).toHaveCount(2)
    await expect(tab(page, 'tree')).toHaveCount(0)
    await page.evaluate(() => window.__st!.profile.getState().setClassroom(false))
  })

  test('the wordmark leads back to the landing page', async ({ page }) => {
    await openApp(page)
    await page.locator('.appnav__brand').click()
    await expect.poll(() => view(page)).toBe('landing')
  })
})
