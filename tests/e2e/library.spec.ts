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

  // "Story page" asks who is reading (first visit) or goes straight to the story's page in the app.
  await detail.locator('[data-act="page"]').click()
  const st = await page.evaluate(() => {
    const s = window.__st!.store.getState()
    return { picking: s.picking as boolean, view: s.view as string }
  })
  expect(st.picking || st.view === 'story').toBe(true)
  await page.evaluate(() => window.__st!.store.getState().setPicking(false))
  if (st.view === 'story') {
    con.assertClean()
    return
  }

  // "Play" puts the book back on the shelf and opens the game.
  await detail.locator('[data-act="play"]').click()
  expect(await overlay(page)).toBe('game')
  await page.evaluate(() => window.__st!.store.getState().closeOverlay())
  await page.waitForFunction(() => window.__st!.library.state().detail === false)
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
  // Every spine on the shelf says "coming soon" in words (never just a mark), at any shelf size.
  expect(await page.locator('#library .lib-band.is-spine').first().textContent()).not.toBe('')

  // The other books of the season are one tap away: the open book goes back and the chosen one comes out.
  const chip = detail.locator('[data-jump]').first()
  const target = Number(await chip.getAttribute('data-jump'))
  await chip.click()
  await page.waitForFunction((i) => window.__st!.library.index() === i && window.__st!.library.state().detail === true, target, { timeout: 15_000 })
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

test('inside the app an opened book lands in its slot, on screen, and the page does not jump', async ({ page }) => {
  const con = watchConsole(page)
  await page.goto(pageUrl('home'))
  await waitForHook(page, 'store')
  await page.evaluate(() => {
    const pr = window.__st!.profile.getState()
    pr.reset()
    pr.setProfile({ name: 'لينا', avatar: 'sari' })
    window.__st!.store.getState().setView('home')
  })
  await waitForHook(page, 'library')
  // Stand where a reader would: the shelf in the middle of the screen.
  await page.evaluate(() => {
    const r = document.querySelector('#library .lib-stage')!.getBoundingClientRect()
    const y = Math.max(0, r.top + window.scrollY - (window.innerHeight - r.height) / 2)
    const lenis = window.__st?.lenis
    if (lenis) lenis.scrollTo(y, { immediate: true, force: true })
    else window.scrollTo(0, y)
  })
  await page.waitForFunction(() => window.__st!.library.state().landed === true, undefined, { timeout: 30_000 })

  for (const rank of [null, 0]) {
    if (rank !== null) {
      await lib(page, `select(${rank})`)
      await settled(page)
    }
    const y0 = await page.evaluate(() => window.scrollY)
    await lib(page, 'open()')
    await page.waitForTimeout(1500) // the flight (1.05 s); `settled` is also true in the instant before it starts
    await settled(page)
    const m = await page.evaluate(() => {
      const box = (q: string) => {
        const r = document.querySelector(q)!.getBoundingClientRect()
        return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, top: r.top, bottom: r.bottom, h: r.height }
      }
      return { y: window.scrollY, vh: window.innerHeight, slot: box('#library .lib-detail-slot'), book: box('#library .lib-book.is-open .lib-front'), sec: box('#library'), panel: box('#library .lib-detail-grid') }
    })
    // The cover is where its slot is (perspective draws it a few pixels larger), and both are on screen.
    expect(Math.abs(m.book.cx - m.slot.cx)).toBeLessThan(m.slot.h * 0.15)
    expect(Math.abs(m.book.cy - m.slot.cy)).toBeLessThan(m.slot.h * 0.15)
    expect(m.slot.top).toBeGreaterThanOrEqual(0)
    expect(m.slot.bottom).toBeLessThanOrEqual(m.vh)
    // The words stay inside the shelf's own section (never over the hero above it or whatever follows).
    expect(m.panel.top).toBeGreaterThanOrEqual(m.sec.top - 1)
    expect(m.panel.bottom).toBeLessThanOrEqual(m.sec.bottom + 1)
    // It was already in view, so the page stayed where it was.
    expect(Math.abs(m.y - y0)).toBeLessThan(4)
    await lib(page, 'close()')
    await settled(page)
  }
  con.assertClean()
})
