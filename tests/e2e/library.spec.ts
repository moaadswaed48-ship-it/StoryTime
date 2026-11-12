import { expect, test, type Page } from '@playwright/test'
import { pageUrl } from './_url'
import { scrollToY, waitForHook, watchConsole } from './helpers'

/** The shelf's QA hooks: window.__st.library = { index, count, select, open, close, state, filter }. */
const lib = <T>(page: Page, call: string): Promise<T> => page.evaluate((c) => new Function(`return window.__st.library.${c}`)() as T, call)
const overlay = (page: Page) => page.evaluate(() => window.__st!.store.getState().overlay as string | null)

async function openShelf(page: Page) {
  await page.goto(pageUrl('library'))
  await waitForHook(page, 'library')
  await scrollToY(page, '#library')
  // The books land once when the shelf comes into view; wait for them to settle before driving it.
  await page.waitForFunction(() => window.__st!.library.state().landed === true, undefined, { timeout: 30_000 })
}
const settled = (page: Page) => page.waitForFunction(() => window.__st!.library.state().settled === true, undefined, { timeout: 15_000 })

test('the shelf starts on the real book and can be walked with hooks, arrows and keys', async ({ page }) => {
  const con = watchConsole(page)
  await openShelf(page)
  expect(await lib<number>(page, 'count()')).toBe(12)
  expect(await lib<{ ready: boolean; id: string }>(page, 'state()')).toMatchObject({ ready: true, id: 'autumn-leaves', detail: false })
  const start = await lib<number>(page, 'index()')
  await expect(page.locator('#library [role="option"][aria-selected="true"]')).toHaveCount(1)

  await lib(page, 'select(2)')
  expect(await lib<number>(page, 'index()')).toBe(2)
  await settled(page)
  await expect(page.locator('#library .lib-caption h3')).not.toBeEmpty()

  // Arrow buttons: "next" always moves one book on, whatever the reading direction.
  await page.locator('#library .lib-arrow').last().click()
  expect(await lib<number>(page, 'index()')).toBe(3)

  // Keys are mirrored: in Arabic the next book is to the left.
  const rtl = await page.evaluate(() => document.documentElement.dir === 'rtl')
  await page.locator('#library .lib-stage').focus()
  await page.keyboard.press(rtl ? 'ArrowLeft' : 'ArrowRight')
  expect(await lib<number>(page, 'index()')).toBe(4)
  await page.keyboard.press(rtl ? 'ArrowRight' : 'ArrowLeft')
  expect(await lib<number>(page, 'index()')).toBe(3)
  await page.keyboard.press('End')
  expect(await lib<number>(page, 'index()')).toBe(11)
  await page.keyboard.press('Home')
  expect(await lib<number>(page, 'index()')).toBe(0)
  await lib(page, `select(${start})`)
  expect(await lib<{ ready: boolean }>(page, 'state()')).toMatchObject({ ready: true })
  con.assertClean()
})

test('a season filter sinks the other books and re-packs the row', async ({ page }) => {
  const con = watchConsole(page)
  await openShelf(page)
  await page.locator('#library [data-filter="winter"]').click()
  expect(await lib<number>(page, 'count()')).toBe(3)
  await expect(page.locator('#library [data-filter="winter"]')).toHaveAttribute('aria-pressed', 'true')
  const s = await lib<{ index: number; ready: boolean; filter: string }>(page, 'state()')
  expect(s).toMatchObject({ ready: false, filter: 'winter' })
  expect(s.index).toBeGreaterThanOrEqual(0)

  // The real book is an autumn story: filtering to autumn brings the shelf back to it.
  await page.locator('#library [data-filter="autumn"]').click()
  expect(await lib<{ count: number; ready: boolean }>(page, 'state()')).toMatchObject({ count: 3, ready: true })
  await page.locator('#library [data-filter="all"]').click()
  expect(await lib<{ count: number; ready: boolean }>(page, 'state()')).toMatchObject({ count: 12, ready: true })
  con.assertClean()
})

test('the real book opens a detail view that leads to the reader and the film', async ({ page }) => {
  const con = watchConsole(page)
  await openShelf(page)
  await lib(page, 'open()')
  expect(await lib<{ detail: boolean }>(page, 'state()')).toMatchObject({ detail: true, ready: true })
  const detail = page.locator('#library .lib-detail')
  await expect(detail).toHaveClass(/is-open/)
  await expect(detail.locator('h3')).toBeVisible()

  await detail.locator('[data-act="read"]').click()
  expect(await overlay(page)).toBe('book')
  await page.evaluate(() => window.__st!.store.getState().closeOverlay())

  await detail.locator('[data-act="watch"]').click()
  expect(await overlay(page)).toBe('film')
  await page.evaluate(() => window.__st!.store.getState().closeOverlay())

  await detail.locator('.lib-return').click()
  expect(await lib<{ detail: boolean }>(page, 'state()')).toMatchObject({ detail: false })
  await expect(detail).not.toHaveClass(/is-open/)
  con.assertClean()
})

test('a coming-soon book says so and offers nothing to open', async ({ page }) => {
  const con = watchConsole(page)
  await openShelf(page)
  await lib(page, 'select(0)')
  await lib(page, 'open()')
  expect(await lib<{ detail: boolean; ready: boolean }>(page, 'state()')).toMatchObject({ detail: true, ready: false })
  const detail = page.locator('#library .lib-detail')
  await expect(detail.locator('[data-soon]')).toBeVisible()
  await expect(detail.locator('[data-act]')).toHaveCount(0)
  await lib(page, 'close()')
  expect(await lib<{ detail: boolean }>(page, 'state()')).toMatchObject({ detail: false })
  expect(await overlay(page)).toBeNull()
  con.assertClean()
})

test('dragging the shelf moves it and it snaps onto a book', async ({ page, isMobile }) => {
  test.skip(isMobile, 'mouse drag; touch swipes use the same pointer path')
  const con = watchConsole(page)
  await openShelf(page)
  const before = await lib<number>(page, 'index()')
  const box = (await page.locator('#library .lib-stage').boundingBox())!
  const y = box.y + box.height * 0.55
  const x = box.x + box.width * 0.7
  await page.mouse.move(x, y)
  await page.mouse.down()
  for (let i = 1; i <= 8; i++) await page.mouse.move(x - i * 22, y)
  await page.mouse.up()
  await settled(page)
  const after = await lib<{ index: number; settled: boolean }>(page, 'state()')
  expect(after.index).not.toBe(before)
  expect(after.settled).toBe(true)
  con.assertClean()
})
