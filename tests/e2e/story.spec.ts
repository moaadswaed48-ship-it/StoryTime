import { expect, test, type Page } from '@playwright/test'
import { pageUrl } from './_url'
import { waitForHook, watchConsole } from './helpers'

const STORY = 'autumn-leaves'
const site = (page: Page) => page.evaluate(() => ({ view: window.__st!.store.getState().view, overlay: window.__st!.store.getState().overlay, scene: window.__st!.store.getState().startScene }))
const closeOverlay = (page: Page) => page.evaluate(() => window.__st!.store.getState().closeOverlay())
const state = (page: Page) => page.evaluate(() => window.__st!.story.state())

/** Opens the story's page as a signed-in child with nothing done yet. */
async function openStory(page: Page) {
  await page.goto(pageUrl('story'))
  await waitForHook(page, 'store')
  await page.evaluate(() => {
    const pr = window.__st!.profile.getState()
    pr.reset()
    pr.setProfile({ name: 'لينا', avatar: 'sari' })
    window.__st!.store.getState().setView('story')
  })
  await waitForHook(page, 'story')
  await expect(page.locator('#story')).toBeVisible()
}

test.describe('story — the story’s own page', () => {
  test('shows her title exactly, three doors and twelve scenes', async ({ page }) => {
    const con = watchConsole(page)
    await openStory(page)
    const s = await state(page)
    expect(['أوراق الخريف والطيور المهاجرة', 'Autumn Leaves and the Migrating Birds']).toContain(s.title)
    expect(s.scenes).toBe(12)
    await expect(page.locator('[data-door]')).toHaveCount(3)
    for (const id of ['read', 'watch', 'play']) {
      const box = await page.locator(`[data-door="${id}"]`).boundingBox()
      expect(box!.width).toBeGreaterThanOrEqual(56) // a child's finger
    }
    con.assertClean()
  })

  test('the doors open the book where the child stopped, the film and the game, and wear a leaf once finished', async ({ page }) => {
    await openStory(page)
    await page.evaluate((id) => window.__st!.profile.getState().setScene(id, 3), STORY)
    await page.locator('[data-door="read"]').click()
    expect(await site(page)).toMatchObject({ overlay: 'book', scene: 3 })
    await closeOverlay(page)
    await page.locator('[data-door="watch"]').click()
    expect(await site(page)).toMatchObject({ overlay: 'film', scene: 0 })
    await closeOverlay(page)
    await page.locator('[data-door="play"]').click()
    expect((await site(page)).overlay).toBe('game')
    await closeOverlay(page)

    expect(await page.evaluate(() => window.__st!.story.doors())).toEqual([
      { id: 'read', done: false },
      { id: 'watch', done: false },
      { id: 'play', done: false },
    ])
    await page.evaluate((id) => window.__st!.profile.getState().mark(id, 'watched'), STORY)
    await expect(page.locator('[data-door="watch"]')).toHaveAttribute('data-done', '')
    await expect(page.locator('[data-door][data-done]')).toHaveCount(1)
  })

  test('a scene picture opens the book at that scene', async ({ page }) => {
    await openStory(page)
    await page.locator('[data-scene="6"]').click()
    expect(await site(page)).toMatchObject({ overlay: 'book', scene: 6 })
    await closeOverlay(page)
  })

  test('a word card turns over to the author’s own sentence, and back', async ({ page }) => {
    await openStory(page)
    const card = page.locator('[data-word="wind"]')
    await expect(card).toHaveAttribute('aria-pressed', 'false')
    await card.click()
    await expect(card).toHaveAttribute('aria-pressed', 'true')
    await expect(card).toHaveClass(/is-flipped/)
    expect((await state(page)).flipped).toEqual(['wind'])
    const quote = (await card.locator('.word__quote').textContent())!.replace(/…/g, '').trim()
    expect(['هبّت ريح مفاجئة، وأطاحت بكل الأوراق في الهواء.', 'A sudden wind blew and sent every paper into the air.']).toContain(quote)

    await page.evaluate(() => window.__st!.story.flip('wind'))
    await expect(card).toHaveAttribute('aria-pressed', 'false')

    // an excerpt cut from a longer sentence of hers says so; her words themselves stay untouched
    const boat = page.locator('[data-word="boat"]')
    await expect(boat.locator('.word__cut')).toHaveCount(2)
    expect(await boat.locator('.word__quote').textContent()).toMatch(/ابتكرا قاربًا ومجاذيف من الأوراق|They invented a boat and oars out of leaves/)
    await expect(page.locator('[data-word="turn"] .word__cut')).toHaveCount(0)
    await expect(page.locator('[data-word]')).toHaveCount(8)
  })

  test('the grown-ups’ area is closed until asked for, and labelled as a draft', async ({ page }) => {
    await openStory(page)
    const body = page.locator('#story-grown-body')
    await expect(body).toBeHidden()
    await expect(page.locator('.grown__draft')).toBeVisible()
    await page.locator('[data-grown-toggle]').click()
    await expect(body).toBeVisible()
    await expect(body.locator('.grown__col')).toHaveCount(3)
    await expect(body.locator('.grown__list--dots li')).toHaveCount(5)
    await expect(body.locator('.grown__col').nth(1).locator('li')).toHaveCount(6)
    await page.locator('[data-grown-toggle]').click()
    await expect(body).toBeHidden()

    await page.locator('[data-story-back]').click()
    await expect.poll(async () => (await site(page)).view).toBe('home')
  })
})
