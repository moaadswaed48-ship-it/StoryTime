import { expect, test, type Page } from '@playwright/test'
import { pageUrl } from './_url'
import { waitForHook, watchConsole } from './helpers'

const profile = (page: Page) => page.evaluate(() => window.__st!.profile.getState().profile)
const view = (page: Page) => page.evaluate(() => window.__st!.store.getState().view)
const state = (page: Page) => page.evaluate(() => window.__st!.enter.state())

async function open(page: Page) {
  await page.goto(pageUrl('enter'))
  await waitForHook(page, 'enter')
  await page.evaluate(() => window.__st!.enter.open())
  await expect(page.locator('.enter__sheet')).toBeVisible()
}

test.describe('enter — who is reading today?', () => {
  test('shows four pictures and cancels with Escape without storing anything', async ({ page }) => {
    const con = watchConsole(page)
    await open(page)
    await expect(page.locator('.enter').getByRole('radio')).toHaveCount(4)
    await expect(page.locator('.enter').getByRole('radio', { checked: true })).toHaveCount(1)
    await page.keyboard.press('Escape')
    await expect(page.locator('.enter__sheet')).toHaveCount(0)
    expect(await profile(page)).toBeNull()
    expect(await view(page)).toBe('landing')
    con.assertClean()
  })

  test('a picture and a name are stored, the leaves cross into the library, and a reload keeps the reader', async ({ page }) => {
    const con = watchConsole(page)
    await open(page)
    await page.locator('[data-pick="amir"]').click()
    await expect(page.locator('[data-pick="amir"]')).toHaveAttribute('aria-checked', 'true')
    await page.locator('.enter__input').fill('   لينا   الصغيرة جدًا جدًا')
    expect((await state(page)).name).toBe('لينا الصغيرة ج') // single spaces, 14 characters at most
    await page.locator('.enter__input').fill('لينا')
    await page.locator('[data-enter-go]').click()
    await expect.poll(() => view(page)).toBe('home')
    expect(await profile(page)).toEqual({ name: 'لينا', avatar: 'amir' })
    // the curtain of leaves clears by itself
    await expect.poll(async () => (await state(page)).phase, { timeout: 5000 }).toBe('closed')
    await expect(page.locator('.enter')).toHaveCount(0)

    await page.reload()
    await waitForHook(page, 'enter')
    expect(await profile(page)).toEqual({ name: 'لينا', avatar: 'amir' })
    con.assertClean()
  })

  test('guest goes in with one tap', async ({ page }) => {
    await open(page)
    await page.locator('[data-enter-guest]').click()
    await expect.poll(() => view(page)).toBe('home')
    expect(await profile(page)).toEqual({ name: '', avatar: 'leaf' })
  })

  test('with reduced motion the crossing is instant', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page)
    await page.evaluate(() => window.__st!.enter.choose('bird', 'Lina'))
    expect(await state(page)).toMatchObject({ open: false, phase: 'closed' })
    expect(await profile(page)).toEqual({ name: 'Lina', avatar: 'bird' })
    expect(await view(page)).toBe('home')
  })
})
