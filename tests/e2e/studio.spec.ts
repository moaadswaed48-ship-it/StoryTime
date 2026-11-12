import { expect, test, type Page } from '@playwright/test'
import { story } from '../../src/content/story'
import { pageUrl } from './_url'
import { scrollToY, waitForHook, watchConsole } from './helpers'

async function open(page: Page) {
  const log = watchConsole(page)
  await page.goto(pageUrl('studio', '#studio'))
  await waitForHook(page, 'studio')
  return log
}
const state = (page: Page) => page.evaluate(() => window.__st!.studio.state())

test('the desk is labelled a demonstration and the path of a story is drawn', async ({ page }) => {
  const log = await open(page)
  const desk = page.locator('#studio')
  await expect(desk.locator('[data-st-demo]')).toBeVisible()
  await expect(desk.locator('[data-st-path] li')).toHaveCount(4)
  await scrollToY(page, '[data-st-path]')
  await page.waitForFunction(() => window.__st!.studio.state().drawn === true, null, { timeout: 10_000 })
  log.assertClean()
})

test('her twelve scenes are shown with her own words, verbatim, and open the book', async ({ page }) => {
  const log = await open(page)
  const rows = page.locator('#studio [data-st-scene]')
  await expect(rows).toHaveCount(12)
  const s = await state(page)
  expect(s.scenes).toBe(12)
  expect(s.film + s.still).toBe(12)
  await expect(page.locator('#studio [data-st-scene][data-film="true"]')).toHaveCount(s.film)

  // the words in each row are exactly her paragraphs, in Arabic, in both languages of the site
  const texts = await rows.locator('[lang="ar"]').allTextContents()
  expect(texts).toEqual(story.scenes.map((x) => x.ar.join(' ')))

  await scrollToY(page, '[data-st-scene="4"]')
  await rows.nth(4).click()
  const site = await page.evaluate(() => ({ overlay: window.__st!.store.getState().overlay, scene: window.__st!.store.getState().startScene }))
  expect(site).toEqual({ overlay: 'book', scene: 4 })
  await page.evaluate(() => window.__st!.store.getState().closeOverlay())
  log.assertClean()
})

test('the next stories are working titles, and "add" only shows a note', async ({ page }) => {
  const log = await open(page)
  const desk = page.locator('#studio')
  const n = (await state(page)).next
  expect(n).toBeGreaterThan(0)
  await expect(desk.locator('[data-st-folder]')).toHaveCount(n)
  const requests: string[] = []
  page.on('request', (r) => ['POST', 'PUT', 'PATCH'].includes(r.method()) && requests.push(r.url()))

  await scrollToY(page, '[data-st-add]')
  await expect(desk.locator('[data-st-note]')).toBeHidden()
  await desk.locator('[data-st-add]').click()
  await expect(desk.locator('[data-st-note]')).toBeVisible()
  expect((await state(page)).note).toBe(true)
  expect(await desk.locator('input, textarea, [contenteditable="true"]').count()).toBe(0)
  expect(requests).toEqual([])
  log.assertClean()
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })
  test('everything is visible at rest, without scrolling', async ({ page }) => {
    const log = await open(page)
    expect((await state(page)).drawn).toBe(true)
    await expect(page.locator('#studio .st-body').first()).toHaveCSS('opacity', '1')
    await expect(page.locator('#studio video')).toHaveCount(0)
    log.assertClean()
  })
})
