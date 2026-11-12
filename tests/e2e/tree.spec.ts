import { expect, test, type Page } from '@playwright/test'
import { pageUrl } from './_url'
import { waitForHook, watchConsole } from './helpers'

const STORY = 'autumn-leaves'

/** Opens "My tree" for a child with nothing earned yet (progress and the tree's own memory start empty). */
async function open(page: Page) {
  const log = watchConsole(page)
  await page.goto(pageUrl('tree', '#tree'))
  await waitForHook(page, 'profile')
  await page.evaluate(() => {
    localStorage.removeItem('st:tree:seen:v1')
    window.__st!.profile.getState().reset()
    window.__st!.profile.getState().setProfile({ name: 'Lina', avatar: 'leaf' })
  })
  await page.reload()
  await waitForHook(page, 'tree')
  return log
}
const state = (page: Page) => page.evaluate(() => window.__st!.tree.state())
const mark = (page: Page, what: string[]) =>
  page.evaluate(([id, list]) => (list as string[]).forEach((w) => window.__st!.profile.getState().mark(id as string, w)), [STORY, what] as const)

test('an empty tree is calm, and a waiting leaf opens its door', async ({ page }) => {
  const log = await open(page)
  const tree = page.locator('#tree')
  await expect(tree.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(tree.locator('[data-leaf]')).toHaveCount(3)
  await expect(tree.locator('[data-leaf][data-on="true"]')).toHaveCount(0)
  await expect(tree.locator('[data-tree-status]')).toBeVisible()
  expect(await page.evaluate(() => window.__st!.tree.leaves())).toBe(0)
  // no flock, no Sari, no crown before the leaves are earned
  await expect(tree.locator('[data-tree-flock]')).toHaveCount(0)
  await expect(tree.locator('[data-tree-sari]')).toHaveCount(0)

  await tree.locator('[data-leaf="read"]').click()
  expect(await page.evaluate(() => window.__st!.store.getState().overlay)).toBe('book')
  await page.evaluate(() => window.__st!.store.getState().closeOverlay())
  await tree.locator('[data-row="played"]').click()
  expect(await page.evaluate(() => window.__st!.store.getState().overlay)).toBe('game')
  await page.evaluate(() => window.__st!.store.getState().closeOverlay())
  log.assertClean()
})

test('a finished activity earns its leaf, once, and the tree remembers it', async ({ page }) => {
  const log = await open(page)
  const tree = page.locator('#tree')
  const centre = () => tree.locator('[data-leaf="read"]').evaluate((el) => {
    const r = el.getBoundingClientRect()
    return [r.left + r.width / 2, r.top + r.height / 2]
  })
  const before = await centre()
  await mark(page, ['read'])
  await expect(tree.locator('[data-leaf="read"]')).toHaveAttribute('data-on', 'true')
  // the leaf lands, then its limb opens its small leaves
  await page.waitForFunction(() => window.__st!.tree.state().bloomed.read === true, null, { timeout: 15_000 })
  await expect(tree.locator('[data-limb="read"]')).toHaveClass(/is-on/)
  await expect(tree.locator('[data-row="read"]')).toHaveAttribute('data-on', 'true')
  // the leaf comes to rest exactly on its place on the branch
  await page.waitForTimeout(1200)
  const after = await centre()
  expect(Math.abs(after[0] - before[0])).toBeLessThan(2)
  expect(Math.abs(after[1] - before[1])).toBeLessThan(2)
  const s = await state(page)
  expect(s.shown).toBe(1)
  expect(s.party).toBe(false)
  expect(s.seen).toContain(`${STORY}:read`)

  // after a reload the leaf is simply there: no second celebration
  await page.reload()
  await waitForHook(page, 'tree')
  const again = await state(page)
  expect(again.bloomed.read).toBe(true)
  expect(again.earned).toEqual({ read: true, watched: false, played: false })
  await expect(tree.locator('[data-limb="read"]')).toHaveClass(/is-still/)
  log.assertClean()
})

test('all three leaves bring the birds, Sari in his crown, and the letters the child knows', async ({ page }) => {
  const log = await open(page)
  const tree = page.locator('#tree')
  await mark(page, ['read', 'watched', 'played'])
  await page.evaluate((id) => ['ح', 'أ', 'س'].forEach((l) => window.__st!.profile.getState().addLetter(id, l)), STORY)
  await page.waitForFunction(() => window.__st!.tree.state().party === true, null, { timeout: 30_000 })
  await expect(tree.locator('[data-leaf][data-on="true"]')).toHaveCount(3)
  await expect(tree.locator('[data-tree-flock]')).toHaveCount(1)
  await expect(tree.locator('[data-tree-crown]')).toBeVisible()
  await expect(tree.locator('[data-tree-sari]').first()).toBeVisible()
  await expect(tree.locator('[data-letter]')).toHaveCount(3)
  // Sari arrives as the 3D hero, or as his picture where WebGL is missing
  await page.waitForFunction(() => window.__st!.tree.state().sari !== null, null, { timeout: 60_000 })
  expect(['3d', 'picture']).toContain((await state(page)).sari)
  log.assertClean()
})

test('with reduced motion everything is in place at once', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const log = await open(page)
  await mark(page, ['read', 'watched', 'played'])
  await page.waitForFunction(() => window.__st!.tree.state().party === true, null, { timeout: 5_000 })
  const s = await state(page)
  expect(s.bloomed).toEqual({ read: true, watched: true, played: true })
  await expect(page.locator('#tree [data-tree-flock]')).toHaveCount(1)
  log.assertClean()
})
