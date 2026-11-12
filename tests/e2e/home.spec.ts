import { expect, test, type Page } from '@playwright/test'
import { pageUrl } from './_url'
import { waitForHook, watchConsole } from './helpers'

const STORY = 'autumn-leaves'
const site = (page: Page) => page.evaluate(() => ({ view: window.__st!.store.getState().view, overlay: window.__st!.store.getState().overlay, scene: window.__st!.store.getState().startScene }))
const home = (page: Page) => page.evaluate(() => window.__st!.home.state())

/** Opens the child's library as a signed-in child with nothing done yet. */
async function openHome(page: Page) {
  await page.goto(pageUrl('home'))
  await waitForHook(page, 'store')
  await page.evaluate(() => {
    const pr = window.__st!.profile.getState()
    pr.reset()
    pr.setProfile({ name: 'لينا', avatar: 'sari' })
    window.__st!.store.getState().setView('home')
  })
  await waitForHook(page, 'home')
  await expect(page.locator('#home')).toBeVisible()
}

test.describe('home — the child’s library', () => {
  test('greets the child by name and offers today’s story with her title', async ({ page }) => {
    const con = watchConsole(page)
    await openHome(page)
    await expect(page.locator('.home__name')).toHaveText('لينا')
    await expect(page.locator('.home__me [data-avatar="sari"]')).toBeVisible()
    await expect(page.locator('#home-today-title')).toHaveText(/أوراق الخريف والطيور المهاجرة|Autumn Leaves and the Migrating Birds/)
    await expect(page.locator('#home #library')).toHaveCount(1) // the shelf with every story
    expect(await home(page)).toMatchObject({ name: 'لينا', avatar: 'sari', leaves: 0, cta: 'start' })
    con.assertClean()
  })

  test('“start” opens the book at the beginning, “continue” at the last scene read', async ({ page }) => {
    await openHome(page)
    await page.locator('[data-home-read]').click()
    expect(await site(page)).toMatchObject({ overlay: 'book', scene: 0 })
    await page.evaluate(() => window.__st!.store.getState().closeOverlay())

    await page.evaluate((id) => window.__st!.profile.getState().setScene(id, 5), STORY)
    expect((await home(page)).cta).toBe('continue')
    await page.locator('[data-home-read]').click()
    expect(await site(page)).toMatchObject({ overlay: 'book', scene: 5 })
    await page.evaluate(() => window.__st!.store.getState().closeOverlay())
  })

  test('leaves follow what the child has finished and survive a reload', async ({ page }) => {
    await openHome(page)
    await expect(page.locator('[data-leaf].is-on')).toHaveCount(0)
    await page.evaluate((id) => {
      window.__st!.profile.getState().mark(id, 'read')
      window.__st!.profile.getState().mark(id, 'played')
    }, STORY)
    await expect(page.locator('[data-leaf].is-on')).toHaveCount(2)
    await expect(page.locator('[data-leaf="read"]')).toHaveClass(/is-on/)
    await expect(page.locator('[data-seg].is-on')).toHaveCount(2)

    await page.reload()
    await waitForHook(page, 'store')
    await page.evaluate(() => window.__st!.store.getState().setView('home'))
    await waitForHook(page, 'home')
    expect(await home(page)).toMatchObject({ name: 'لينا', leaves: 2 })
    await expect(page.locator('[data-leaf].is-on')).toHaveCount(2)
  })

  test('the story page and the tree are one tap away; classroom mode shows no rewards', async ({ page }) => {
    await openHome(page)
    await page.locator('[data-home-leaves]').click()
    await expect.poll(async () => (await site(page)).view).toBe('tree')

    await page.evaluate(() => window.__st!.store.getState().setView('home'))
    await page.locator('[data-home-open]').click()
    await expect.poll(async () => (await site(page)).view).toBe('story')

    await page.evaluate(() => {
      window.__st!.store.getState().setView('home')
      window.__st!.profile.getState().setClassroom(true)
    })
    await expect(page.locator('[data-home-leaves]')).toHaveCount(0)
    await expect(page.locator('.home__ring')).toHaveCount(0)
    await page.evaluate(() => window.__st!.profile.getState().setClassroom(false))
  })
})
