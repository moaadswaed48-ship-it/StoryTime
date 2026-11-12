import { expect, test, type Page } from '@playwright/test'
import { pageUrl } from './_url'
import { waitForHook, watchConsole } from './helpers'
import { story } from '../../src/content/story'

/** The book reader overlay: opened through the store, driven through `window.__st.book`. */
const SLOW = { timeout: 45_000 }
// Page turns are real animations (about a second each on ordinary hardware). The shared test machine renders them
// in software next to other jobs, so these tests get generous room rather than fake shortcuts.
test.describe.configure({ timeout: 240_000 })

async function start(page: Page, scene: number, loggedIn: boolean) {
  // On the full page the WebGL curl reader takes the book where it can run (§8.9); `nowebgl` keeps this DOM book.
  await page.goto(pageUrl('book', '&nowebgl'))
  await waitForHook(page, 'book')
  await waitForHook(page, 'store')
  await waitForHook(page, 'profile')
  await page.evaluate(
    ([n, on]) => {
      const st = window.__st!.store.getState()
      st.setLoggedIn(on as boolean)
      st.openBook(n as number)
    },
    [scene, loggedIn] as const,
  )
  await expect.poll(() => phase(page), SLOW).not.toBe('idle')
}
const phase = (page: Page) => page.evaluate(() => window.__st!.book.phase() as string)
const where = (page: Page) => page.evaluate(() => ({ scene: window.__st!.book.scene() as number, step: window.__st!.book.step() as number }))
const call = (page: Page, method: 'next' | 'prev' | 'open', times = 1) =>
  page.evaluate(
    ([m, n]) => {
      for (let i = 0; i < (n as number); i++) window.__st!.book[m as string]()
    },
    [method, times] as const,
  )
const landed = (page: Page) => expect.poll(() => page.evaluate(() => window.__st!.book.turning() as boolean), SLOW).toBe(false)
/** The author's paragraphs in the language the page is showing. */
const lines = async (page: Page, scene: number) => ((await page.evaluate(() => document.documentElement.lang)) === 'en' ? story.scenes[scene].en : story.scenes[scene].ar)
const text = (page: Page) => page.getByTestId('bk-text')

test('the closed book opens into the first spread and shows the author’s text exactly; Escape closes', async ({ page }) => {
  const log = watchConsole(page)
  await start(page, 0, false)
  expect(await phase(page)).toBe('closed')
  await expect(page.getByRole('dialog')).toBeVisible()
  // A child's name on the profile is written into the book, like a bookplate.
  await expect(page.getByTestId('bk-forchild')).toHaveCount(0)
  await page.evaluate(() => window.__st!.profile.getState().setProfile({ name: 'ليلى', avatar: 'leaf' }))
  await expect(page.getByTestId('bk-forchild')).toContainText('ليلى')
  await page.getByTestId('bk-open').click()
  await expect.poll(() => phase(page), SLOW).toBe('open')
  await expect(text(page)).toHaveText((await lines(page, 0))[0], SLOW)
  await expect(page.locator('.bk-base img').first()).toBeVisible()
  await page.keyboard.press('Escape')
  await expect.poll(() => page.evaluate(() => window.__st!.store.getState().overlay), SLOW).toBeNull()
  log.assertClean()
})

test('next walks the paragraphs one at a time, then turns the page; previous comes back; the picture is alive', async ({ page }) => {
  await start(page, 1, false)
  expect(await phase(page)).toBe('open')
  const first = await lines(page, 1)
  for (let i = 0; i < first.length; i++) {
    expect(await where(page)).toEqual({ scene: 1, step: i })
    await expect(text(page)).toHaveText(first[i], SLOW)
    await call(page, 'next')
  }
  expect(await where(page)).toEqual({ scene: 2, step: 0 })
  await landed(page)
  await expect(text(page)).toHaveText((await lines(page, 2))[0], SLOW)

  await call(page, 'prev')
  expect(await where(page)).toEqual({ scene: 1, step: first.length - 1 })
  await landed(page)
  // The scene the reader is on is remembered for "continue reading".
  await expect.poll(() => page.evaluate((id) => window.__st!.profile.getState().progress[id]?.scene, story.id), SLOW).toBe(1)

  // Scene 4 (index 3) has a five-second clip: it must really be playing inside the page.
  await page.evaluate(() => window.__st!.book.goScene(3))
  await landed(page)
  await expect.poll(() => page.evaluate(() => window.__st!.book.clip()), SLOW).toMatchObject({ has: true, playing: true, live: true })
  const t0 = await page.evaluate(() => window.__st!.book.clip().time as number)
  await expect.poll(() => page.evaluate(() => window.__st!.book.clip().time as number), SLOW).not.toBe(t0)
  // Tapping the picture pauses it.
  await page.evaluate(() => window.__st!.book.tap())
  await expect.poll(() => page.evaluate(() => window.__st!.book.clip().playing as boolean), SLOW).toBe(false)
})

test('scenes 1–4 are free; the fifth shows the demo paywall, and the demo log-in continues the story', async ({ page }) => {
  await start(page, 3, false)
  await call(page, 'next', (await lines(page, 3)).length)
  expect(await where(page)).toEqual({ scene: 4, step: 0 })
  expect(await phase(page)).toBe('gate')
  await landed(page)
  await expect(text(page)).toHaveCount(0)
  await call(page, 'next', 2) // blocked while the card is up
  expect(await where(page)).toEqual({ scene: 4, step: 0 })
  await page.getByTestId('bk-gate-btn').click()
  await expect.poll(() => phase(page), SLOW).toBe('open')
  expect(await page.evaluate(() => window.__st!.store.getState().loggedIn)).toBe(true)
  await expect(text(page)).toHaveText((await lines(page, 4))[0], SLOW)
})

test('after scene 12 comes the end page, and the story can start again', async ({ page }) => {
  await start(page, 11, true)
  await call(page, 'next', (await lines(page, 11)).length)
  expect(await phase(page)).toBe('end')
  await landed(page)
  await expect(page.locator('.bk-end-title')).toBeVisible(SLOW)
  await expect(page.locator('.bk-end-actions button')).toHaveCount(3)
  // Finishing the story earns the "read" leaf.
  await expect.poll(() => page.evaluate((id) => window.__st!.profile.getState().progress[id]?.read, story.id), SLOW).toBe(true)
  await call(page, 'prev')
  expect(await where(page)).toEqual({ scene: 11, step: (await lines(page, 11)).length - 1 })
  await landed(page)
  await page.evaluate(() => window.__st!.book.goScene(0))
  expect(await where(page)).toEqual({ scene: 0, step: 0 })
  await landed(page)
  await expect(text(page)).toHaveText((await lines(page, 0))[0], SLOW)
})

test('arrow keys follow the reading direction, and a dragged page turns or falls back', async ({ page }) => {
  await start(page, 6, true)
  const rtl = (await page.evaluate(() => document.documentElement.dir)) === 'rtl'
  await page.keyboard.press(rtl ? 'ArrowLeft' : 'ArrowRight')
  expect(await where(page)).toEqual({ scene: 6, step: 1 })
  await page.keyboard.press(rtl ? 'ArrowRight' : 'ArrowLeft')
  expect(await where(page)).toEqual({ scene: 6, step: 0 })
  await call(page, 'next', (await lines(page, 6)).length - 1) // last paragraph: the next move is a page turn

  const box = (await page.locator('.bk-scene').boundingBox())!
  const y = box.y + box.height * 0.5
  // "Next" lifts the page after the spine: the left-hand page in Arabic, the right-hand one in English.
  const from = box.x + box.width * (rtl ? 0.14 : 0.86)
  const drag = async (px: number) => {
    const to = from + (rtl ? 1 : -1) * px
    await page.mouse.move(from, y)
    await page.mouse.down()
    for (let i = 1; i <= 8; i++) await page.mouse.move(from + ((to - from) * i) / 8, y)
    await page.waitForTimeout(400) // held, not flicked
    await page.mouse.up()
  }
  await drag(30) // a short pull: the page falls back
  await landed(page)
  expect((await where(page)).scene).toBe(6)
  await drag(box.width * 0.6) // across the spine: the page goes over
  expect((await where(page)).scene).toBe(7)
  await landed(page)
  await expect(text(page)).toHaveText((await lines(page, 7))[0], SLOW)
})
