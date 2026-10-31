import { test, expect } from '@playwright/test'
import { gotoShelf, shelf } from './helpers'

test.describe('shelf', () => {
  test('lands, settles and is deterministic for a seed', async ({ page }) => {
    await gotoShelf(page)
    await page.evaluate(() => window.__st!.shelf!.relaunch(1337))
    await page.waitForFunction(() => window.__st!.shelf!.time() > 2.6, null, { timeout: 60_000 })
    const a = await page.evaluate(() => window.__st!.shelf!.positions())
    await page.evaluate(() => window.__st!.shelf!.relaunch(1337))
    await page.waitForFunction(() => window.__st!.shelf!.time() > 2.6, null, { timeout: 60_000 })
    const b = await page.evaluate(() => window.__st!.shelf!.positions())
    expect(a.map((p) => p[0].toFixed(3))).toEqual(b.map((p) => p[0].toFixed(3)))
    await shelf(page).waitRest()
  })

  test('drag moves the row and snaps to a slot; keyboard steps; tap opens the dialog; Escape closes it', async ({ page }) => {
    await gotoShelf(page)
    const s = shelf(page)
    const box = (await page.locator('.shelf-view').boundingBox())!
    const cx = box.x + box.width / 2
    const cy = box.y + box.height / 2
    const g0 = await s.gx()
    await page.mouse.move(cx, cy)
    await page.mouse.down()
    for (let i = 1; i <= 12; i++) {
      await page.mouse.move(cx - i * 25, cy)
      await page.waitForTimeout(25)
    }
    expect(await s.phase()).toBe('dragging')
    await page.mouse.up()
    await s.waitRest()
    expect(await s.gx()).not.toBeCloseTo(g0, 2)
    const i1 = await s.index()
    await page.locator('.shelf-wrap').focus()
    await page.keyboard.press('ArrowLeft')
    await s.waitRest()
    expect(await s.index()).toBe(i1 - 1)
    await page.mouse.click(cx, cy)
    await expect(page.locator('dialog')).toHaveJSProperty('open', true)
    await expect(page.locator('#pv-title')).not.toBeEmpty()
    await page.keyboard.press('Escape')
    await expect(page.locator('dialog')).toHaveJSProperty('open', false)
    await s.waitRest()
  })

  test('a horizontal wheel moves the shelf while a vertical wheel scrolls the page', async ({ page }) => {
    await gotoShelf(page)
    const s = shelf(page)
    const box = (await page.locator('.shelf-view').boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    const y0 = await page.evaluate(() => window.scrollY)
    const g0 = await s.gx()
    await page.mouse.wheel(240, 0)
    await page.waitForTimeout(600)
    expect(await s.gx()).not.toBeCloseTo(g0, 2)
    expect(await page.evaluate(() => window.scrollY)).toBe(y0)
    await page.mouse.wheel(0, 400)
    await page.waitForTimeout(600)
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(y0)
  })

  test('filters hide non-matching books and re-pack; deep links open a book', async ({ page }) => {
    await gotoShelf(page)
    await page.getByRole('button', { name: 'Ages 3–5', exact: true }).click()
    await page.waitForTimeout(1200)
    const hidden = await page.evaluate(() => window.__st!.shelf!.hidden())
    expect(hidden.filter(Boolean).length).toBeGreaterThan(0)
    await expect(page.locator('[aria-live]').first()).toContainText('books')
    await page.getByRole('button', { name: 'Ages 3–5', exact: true }).click()
    await page.goto('/?qa=1#book=pip-and-the-paper-boat', { waitUntil: 'networkidle' })
    await expect(page.locator('dialog')).toHaveJSProperty('open', true, { timeout: 20_000 })
    await expect(page.locator('#pv-title')).toHaveText('Pip and the Paper Boat')
  })

  test('mobile: a vertical touch pan that starts on the shelf scrolls the page', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'touch only')
    await gotoShelf(page)
    const box = (await page.locator('.shelf-view').boundingBox())!
    const y0 = await page.evaluate(() => window.scrollY)
    const client = await page.context().newCDPSession(page)
    const x = box.x + box.width / 2
    const y = box.y + box.height / 2
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
    for (let i = 1; i <= 8; i++) {
      await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - i * 30 }] })
      await page.waitForTimeout(16)
    }
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await page.waitForTimeout(600)
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(y0)
    expect(await shelf(page).phase()).not.toBe('dragging')
  })
})
