import { expect, test, type Page } from '@playwright/test'
import { pageUrl } from './_url'
import { scrollToY, waitForHook, watchConsole } from './helpers'

/**
 * The paintings in depth: hooks are `window.__st.scrollstory = { mode(), state() → { beat, card, cards, ready },
 * progress(), y(p), goTo(beat), goToCard(card), stats() }`.
 */
interface State {
  beat: number
  card: number
  cards: number
  ready: boolean
}
const hook = <T>(page: Page, expr: string) => page.evaluate(`window.__st.scrollstory.${expr}`) as Promise<T>
const state = (page: Page) => hook<State>(page, 'state()')
const card = async (page: Page) => (await state(page)).card
const beat = async (page: Page) => (await state(page)).beat

/** Scrolls to a point on the runway (0 = the stage has just locked on the first card, 1 = the last card). */
async function scrub(page: Page, p: number) {
  await scrollToY(page, await hook<number>(page, `y(${p})`))
}

async function open(page: Page, extra = '') {
  await page.goto(pageUrl('scrollstory', extra))
  await waitForHook(page, 'scrollstory')
  await scrollToY(page, '#ways')
}

test.describe('scrollstory', () => {
  // The dev machine is shared and WebGL is drawn in software here: slow, a few frames a second.
  test.describe.configure({ timeout: 180_000 })

  test('one card per scroll step, forward and back, and the three words swap', async ({ page }) => {
    const con = watchConsole(page)
    await open(page)
    const { cards } = await state(page)
    expect(cards).toBeGreaterThanOrEqual(8)
    const last = cards - 1

    await scrub(page, 0)
    await expect.poll(() => card(page)).toBe(0)
    expect(await beat(page)).toBe(0)
    await expect(page.locator('#ways [data-beat="0"]')).toHaveAttribute('data-state', 'on')

    // Every step of the runway brings the next card to the front, in story order.
    const seen: number[] = []
    for (let i = 0; i <= last; i++) {
      await scrub(page, i / last)
      await expect.poll(() => card(page)).toBe(i)
      const s = await state(page)
      seen.push(s.card)
      expect(s.beat).toBe(Math.min(2, Math.floor(i / Math.ceil(cards / 3))))
      await expect(page.locator(`#ways [data-beat="${s.beat}"]`)).toHaveAttribute('data-state', 'on')
    }
    expect(new Set(seen).size).toBe(cards)
    await expect(page.locator('#ways [data-beat="0"]')).toHaveAttribute('data-state', 'past')
    await expect(page.locator('#ways [data-beat="1"]')).toHaveAttribute('data-state', 'past')

    // The middle of the runway is the second word.
    await scrub(page, 0.5)
    await expect.poll(() => beat(page)).toBe(1)
    await expect(page.locator('#ways [data-beat="1"]')).toHaveAttribute('data-state', 'on')

    // …and scrolling back brings the first card home.
    await scrub(page, 0)
    await expect.poll(() => card(page)).toBe(0)
    await expect.poll(() => beat(page)).toBe(0)
    await expect(page.locator('#ways [data-beat="0"]')).toHaveAttribute('data-state', 'on')
    con.assertClean()
  })

  test('the scene draws the paintings itself: sharp pictures, no film frames', async ({ page }) => {
    const con = watchConsole(page)
    const asked: string[] = []
    page.on('request', (r) => asked.push(r.url()))
    await open(page)
    await expect.poll(async () => (await state(page)).ready, { timeout: 90_000 }).toBe(true)
    await expect(page.locator('#ways canvas')).toHaveCount(1)
    await expect(page.locator('#ways .ss-stage')).toHaveClass(/has-scene/)

    // The card in front gets its full-size painting; only a handful are held at a time.
    await hook(page, 'goToCard(6)')
    await expect.poll(() => card(page)).toBe(6)
    await expect.poll(() => asked.some((u) => /story\/k07\.webp/.test(u)), { timeout: 60_000 }).toBe(true)
    const stats = await hook<{ calls: number; full: number; small: number; leaves: number }>(page, 'stats()')
    expect(stats.full).toBeLessThanOrEqual(8)
    expect(stats.leaves).toBeGreaterThan(0)
    expect(stats.leaves).toBeLessThanOrEqual(90)
    expect(stats.calls).toBeLessThanOrEqual(16)

    // The canvas has something on it where the front card hangs.
    const painted = await page.evaluate(async () => {
      const cv = document.querySelector<HTMLCanvasElement>('#ways canvas')!
      const stage = document.querySelector<HTMLElement>('#ways .ss-stage')!
      const x = parseFloat(getComputedStyle(stage).getPropertyValue('--ss-card-x')) / stage.clientWidth
      const y = parseFloat(getComputedStyle(stage).getPropertyValue('--ss-card-y')) / stage.clientHeight
      // WebGL clears its buffer after presenting: read it in the same task as a frame.
      return new Promise<number>((resolve) => {
        const probe = () => {
          const copy = document.createElement('canvas')
          copy.width = 8
          copy.height = 8
          const ctx = copy.getContext('2d')!
          ctx.drawImage(cv, cv.width * x - 4, cv.height * y - 4, 8, 8, 0, 0, 8, 8)
          const a = ctx.getImageData(4, 4, 1, 1).data[3]
          if (a > 0) resolve(a)
          else requestAnimationFrame(probe)
        }
        requestAnimationFrame(probe)
      })
    })
    expect(painted).toBeGreaterThan(200)

    // The old scrubbed film is gone: not one of its frames is requested.
    expect(asked.filter((u) => /film\/scrub\//.test(u))).toEqual([])
    con.assertClean()
  })

  test('the stage is never blank: a painting stands in until the scene is ready, and for good without WebGL', async ({ page }) => {
    const con = watchConsole(page)
    await open(page, '&nowebgl')
    await expect(page.locator('#ways canvas')).toHaveCount(0)
    await expect(page.locator('#ways .ss-poster')).toBeVisible()
    await expect(page.locator('#ways .ss-poster')).toHaveAttribute('src', /story\/k01\.webp/)
    expect((await state(page)).ready).toBe(false)
    // It follows the scroll card by card, and the copy works as ever.
    await scrub(page, 0.5)
    await expect.poll(() => beat(page)).toBe(1)
    const at = await card(page)
    await expect(page.locator('#ways .ss-poster')).toHaveAttribute('src', new RegExp(`story/k${String(at + 1).padStart(2, '0')}\\.webp`))
    await expect(page.locator('#ways [data-beat="1"]')).toHaveAttribute('data-state', 'on')
    await expect(page.locator('#ways [data-beat="1"] button')).toBeVisible()
    con.assertClean()
  })

  test('each beat has its own action: book, film, game', async ({ page }) => {
    const con = watchConsole(page)
    await open(page)
    const overlay = () => page.evaluate(() => window.__st!.store.getState().overlay as string | null)
    const close = () => page.evaluate(() => window.__st!.store.getState().closeOverlay())

    await hook(page, 'goTo(0)')
    await expect(page.locator('#ways [data-beat="0"]')).toHaveAttribute('data-state', 'on')
    await page.locator('#ways [data-beat="0"] button').click()
    expect(await overlay()).toBe('book')
    await close()

    await hook(page, 'goTo(1)')
    await expect(page.locator('#ways [data-beat="1"]')).toHaveAttribute('data-state', 'on')
    await page.locator('#ways [data-beat="1"] button').click()
    expect(await overlay()).toBe('film')
    await close()

    // The rail ticks jump between beats.
    await page.locator('#ways .ss-tick').nth(2).click()
    await expect.poll(() => beat(page), { timeout: 15_000 }).toBe(2)
    await expect(page.locator('#ways .ss-tick').nth(2)).toHaveAttribute('aria-current', 'step')
    await expect(page.locator('#ways [data-beat="2"]')).toHaveAttribute('data-state', 'on')
    await page.locator('#ways [data-beat="2"] button').click()
    expect(await overlay()).toBe('game')
    await close()
    con.assertClean()
  })

  test('reduced motion: one still picture and the three ways as a plain list', async ({ page }) => {
    const con = watchConsole(page)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(pageUrl('scrollstory'))
    await waitForHook(page, 'scrollstory')
    await scrollToY(page, '#ways')
    await expect.poll(() => hook<string>(page, 'mode()')).toBe('still')
    await expect(page.locator('#ways canvas')).toHaveCount(0)
    await expect(page.locator('#ways img')).toBeVisible()
    await expect(page.locator('#ways [data-beat]')).toHaveCount(3)
    for (const i of [0, 1, 2]) await expect(page.locator(`#ways [data-beat="${i}"] button`)).toBeVisible()
    // Not a tall runway: the section is an ordinary block.
    const ratio = await page.evaluate(() => document.querySelector('#ways')!.getBoundingClientRect().height / window.innerHeight)
    expect(ratio).toBeLessThan(2)
    con.assertClean()
  })
})
