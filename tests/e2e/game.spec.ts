import { expect, test, type Page } from '@playwright/test'
import { pageUrl } from './_url'
import { scrollToY, waitForHook, watchConsole } from './helpers'

interface PaperInfo {
  name: string
  letter: string
  options: string[]
  own: boolean
  collected: boolean
}

async function open(page: Page, extra = '') {
  const log = watchConsole(page)
  await page.goto(pageUrl('game', extra))
  await waitForHook(page, 'game')
  await scrollToY(page, '#game')
  return log
}
const state = (page: Page) => page.evaluate(() => window.__st!.game.state())
const papers = (page: Page): Promise<PaperInfo[]> => page.evaluate(() => window.__st!.game.papers())
const worldReady = (page: Page) => page.waitForFunction(() => window.__st!.game.state().ready, null, { timeout: 70_000 })
const phaseIs = (page: Page, phase: string) => page.waitForFunction((p) => window.__st!.game.state().phase === p, phase, { timeout: 60_000 })
const overlay = (page: Page) => page.evaluate(() => window.__st!.store.getState().overlay)

// The poster section (#game) is no longer on the landing page: the game is opened from the app and the scroll story.
// These tests start from the poster, so they run on the demo page (ST_DEV=1).
test.skip(!process.env.ST_DEV, 'the game poster is tested on its demo page (ST_DEV=1)')

test('the poster starts the game, the page is locked while playing, Escape brings it back', async ({ page }) => {
  const log = await open(page)
  const section = page.locator('#game')
  await expect(section.getByRole('heading', { level: 2 })).toBeVisible()
  await expect(section.locator('.game-tag')).toHaveCount(5)
  await section.locator('[data-game-start]').click()
  await expect(page.locator('[data-game-play]')).toBeVisible()
  await phaseIs(page, 'playing')
  expect(await overlay(page)).toBe('game')
  expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe('hidden')

  // the yard renders, cheaply
  await worldReady(page)
  await page.waitForFunction(() => window.__st!.game.state().drawCalls > 0, null, { timeout: 30_000 })
  const s = await state(page)
  expect(s.mode).toBe('3d')
  expect(s.drawCalls).toBeLessThanOrEqual(60)
  await expect(page.locator('[data-game-row] li')).toHaveCount(5)

  await page.keyboard.press('Escape')
  await expect(page.locator('[data-game-play]')).toHaveCount(0, { timeout: 60_000 })
  await phaseIs(page, 'poster')
  expect(await overlay(page)).toBeNull()
  expect(await page.evaluate(() => document.documentElement.style.overflow)).not.toBe('hidden')
  log.assertClean()
})

test('five papers, five first letters: a wrong letter never loses, the right one collects the paper', async ({ page }) => {
  const log = await open(page)
  await page.evaluate(() => window.__st!.game.start())
  const list = await papers(page)
  expect(list).toHaveLength(5)
  for (let i = 0; i < list.length; i++) {
    const p = list[i]
    expect(p.options).toHaveLength(3)
    expect(p.options).toContain(p.letter)
    expect(await page.evaluate((k) => window.__st!.game.walkTo(k), i)).toBe(true)
    await expect(page.locator('[data-game-name]')).toHaveText(p.name)
    await expect(page.locator('[data-game-letter]')).toHaveCount(3)
    if (i === 0) {
      const bad = p.options.find((l) => l !== p.letter)!
      expect(await page.evaluate((l) => window.__st!.game.answer(l), bad)).toBe(false)
      await expect(page.locator(`[data-game-letter="${bad}"]`)).toBeDisabled()
      await expect(page.locator('[data-game-feedback]')).not.toBeEmpty()
      const after = await state(page)
      expect(after.phase).toBe('asking')
      expect(after.collected).toBe(0)
    }
    expect(await page.evaluate((l) => window.__st!.game.answer(l), p.letter)).toBe(true)
    expect((await state(page)).collected).toBe(i + 1)
  }
  await page.waitForFunction(() => window.__st!.game.state().phase === 'done', null, { timeout: 60_000 })
  await expect(page.locator('[data-game-done]')).toBeVisible({ timeout: 60_000 })
  await expect(page.locator('[data-game-row] li.is-full')).toHaveCount(5)

  // "play again" deals a fresh round
  await page.locator('[data-game-again]').click()
  const fresh = await state(page)
  expect(fresh.phase).toBe('playing')
  expect(fresh.collected).toBe(0)
  expect(fresh.round).toBe(2)
  await page.evaluate(() => window.__st!.game.exit())
  log.assertClean()
})

test('Sari runs with the keys (and the stick on a phone) and picks a paper up by walking into it', async ({ page, isMobile }) => {
  const log = await open(page)
  await page.evaluate(() => window.__st!.game.start())
  await worldReady(page)

  const start = (await state(page)).sari
  await page.keyboard.down('ArrowUp')
  await page.waitForFunction((z) => window.__st!.game.state().sari.z < z - 0.2, start.z, { timeout: 70_000 })
  await page.keyboard.up('ArrowUp')
  expect((await state(page)).phase).toBe('playing')

  if (isMobile) {
    const box = (await page.locator('[data-game-stick]').boundingBox())!
    const cx = box.x + box.width / 2
    const cy = box.y + box.height / 2
    const from = (await state(page)).sari
    await page.mouse.move(cx, cy)
    await page.mouse.down()
    await page.mouse.move(cx + 44, cy, { steps: 4 })
    await page.waitForFunction((x) => window.__st!.game.state().sari.x > x + 0.2, from.x, { timeout: 70_000 })
    await page.mouse.up()
  }

  // a few steps from a paper, then the real walk: frame loop, collision, question
  const target = (await state(page)).next
  expect(target).toBeGreaterThanOrEqual(0)
  expect(await page.evaluate((k) => window.__st!.game.near(k, 1.7), target)).toBe(true)
  expect((await state(page)).phase).toBe('playing')
  expect(await page.evaluate((k) => window.__st!.game.tap(k), target)).toBe(true)
  await page.waitForFunction(() => window.__st!.game.state().phase === 'asking', null, { timeout: 70_000 })
  expect((await state(page)).current).toBe(target)
  await expect(page.locator('[data-game-question]')).toBeVisible()
  await page.evaluate(() => window.__st!.game.exit())
  log.assertClean()
})

test("openGame() from anywhere starts it; the reader's own name is a sixth paper; finishing is remembered and leads to the book", async ({ page }) => {
  const log = await open(page)
  await page.evaluate(() => window.__st!.profile.getState().setProfile({ name: 'Lina', avatar: 'leaf' }))
  // the way the story page, the scroll story and Sari's section open the game
  await page.evaluate(() => window.__st!.store.getState().openGame())
  await phaseIs(page, 'playing')
  await expect(page.locator('[data-game-play]')).toBeVisible()
  const list = await papers(page)
  expect(list).toHaveLength(6)
  const own = list[5]
  expect(own).toMatchObject({ name: 'Lina', letter: 'L', own: true })
  expect(own.options).toHaveLength(3)
  for (const l of own.options) expect(l).toMatch(/^[A-Z]$/)
  await expect(page.locator('[data-game-row] li')).toHaveCount(6)

  // collected backwards: the row fills in the order the names are won, so the child's own name takes the first place
  for (let i = list.length - 1; i >= 0; i--) {
    await page.evaluate((k) => window.__st!.game.walkTo(k), i)
    await page.evaluate((l) => window.__st!.game.answer(l), list[i].letter)
    if (i === list.length - 1) {
      await expect(page.locator('[data-game-row] li').first()).toHaveAttribute('aria-label', 'Lina')
      await expect(page.locator('[data-game-row] li.is-full')).toHaveCount(1)
    }
  }
  await phaseIs(page, 'done')
  await expect(page.locator('[data-game-row] li').last()).toHaveAttribute('aria-label', list[0].name)
  // the child's tree gets its "played" leaf and the letters answered
  const progress = await page.evaluate(() => Object.values(window.__st!.profile.getState().progress)[0] as { played: boolean; letters: string[] })
  expect(progress.played).toBe(true)
  expect(progress.letters).toContain('L')
  expect(progress.letters.length).toBeGreaterThanOrEqual(4)

  await page.locator('[data-game-read]').click()
  await expect(page.locator('[data-game-play]')).toHaveCount(0, { timeout: 60_000 })
  expect(await overlay(page)).toBe('book')
  expect(await page.evaluate(() => window.__st!.store.getState().startScene)).toBe(0)
  await phaseIs(page, 'poster')
  await page.evaluate(() => {
    window.__st!.store.getState().closeOverlay()
    window.__st!.profile.getState().reset()
  })
  log.assertClean()
})

test('without WebGL the same quiz is played by tapping the papers', async ({ page }) => {
  const log = await open(page, '&nowebgl')
  await page.locator('#game [data-game-start]').click()
  await expect(page.locator('[data-game-cards]')).toBeVisible()
  await phaseIs(page, 'playing')
  expect((await state(page)).mode).toBe('cards')
  const list = await papers(page)
  for (let i = 0; i < list.length; i++) {
    await page.locator(`[data-game-sheet="${i}"]`).click()
    await expect(page.locator('[data-game-name]')).toHaveText(list[i].name)
    await page.locator(`[data-game-letter="${list[i].letter}"]`).click()
    await page.waitForFunction((n) => window.__st!.game.state().collected === n && window.__st!.game.state().phase !== 'right', i + 1, { timeout: 20_000 })
  }
  await expect(page.locator('[data-game-done]')).toBeVisible()
  expect((await state(page)).phase).toBe('done')
  await page.evaluate(() => window.__st!.game.exit())
  log.assertClean()
})

test("a long name still fits: on its paper and on the question card, at a phone's width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const log = await open(page, '&nowebgl')
  for (const name of ['Abdulrahman', 'عبدالرحمن']) {
    await page.evaluate((n) => window.__st!.profile.getState().setProfile({ name: n, avatar: 'leaf' }), name)
    await page.evaluate(() => window.__st!.store.getState().openGame())
    await phaseIs(page, 'playing')
    const list = await papers(page)
    expect(list).toHaveLength(6)
    expect(list[5]).toMatchObject({ name, own: true })

    // on its paper in the yard
    await expect(page.locator('[data-game-sheet="5"]')).toBeVisible()
    const sheet = await page.evaluate(() => {
      const face = document.querySelector<HTMLElement>('[data-game-sheet="5"] .game-sheet-face')!
      return { face: face.clientWidth, name: face.querySelector<HTMLElement>('.game-sheet-name')!.offsetWidth }
    })
    expect(sheet.name).toBeLessThanOrEqual(sheet.face)

    // on the question card: once the card has landed, the name's box lies inside the card's box and inside the screen
    await page.locator('[data-game-sheet="5"]').click()
    await expect(page.locator('[data-game-name]')).toHaveText(name)
    await page.waitForFunction(() => document.querySelector('.game-card')!.getAnimations().every((a) => a.playState === 'finished'), null, { timeout: 20_000 })
    const box = await page.evaluate(() => {
      const rect = (sel: string) => document.querySelector(sel)!.getBoundingClientRect()
      const n = rect('[data-game-name]')
      const c = rect('.game-card')
      return { name: [n.left, n.right], card: [c.left, c.right], screen: window.innerWidth }
    })
    expect(box.card[0]).toBeGreaterThanOrEqual(0)
    expect(box.card[1]).toBeLessThanOrEqual(box.screen)
    expect(box.name[0]).toBeGreaterThanOrEqual(box.card[0])
    expect(box.name[1]).toBeLessThanOrEqual(box.card[1])

    await page.evaluate(() => window.__st!.game.exit())
    await phaseIs(page, 'poster')
  }
  await page.evaluate(() => window.__st!.profile.getState().reset())
  log.assertClean()
})
