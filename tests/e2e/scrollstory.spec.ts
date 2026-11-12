import { expect, test, type Page } from '@playwright/test'
import { pageUrl } from './_url'
import { scrollToY, waitForHook, watchConsole } from './helpers'

/** The scroll-scrubbed film: hooks are `window.__st.scrollstory = { frame(), beat(), loaded(), total(), progress(), y(p), goTo(i) }`. */
const hook = <T>(page: Page, expr: string) => page.evaluate(`window.__st.scrollstory.${expr}`) as Promise<T>
const frame = (page: Page) => hook<number>(page, 'frame()')
const beat = (page: Page) => hook<number>(page, 'beat()')

/** Scrolls to a point on the scrub runway (0 = the stage has just locked, 1 = the last frame). */
async function scrub(page: Page, p: number) {
  await scrollToY(page, await hook<number>(page, `y(${p})`))
}

async function open(page: Page) {
  await page.goto(pageUrl('scrollstory'))
  await waitForHook(page, 'scrollstory')
  await scrollToY(page, '#ways')
  await expect.poll(() => hook<number>(page, 'loaded()'), { timeout: 45_000 }).toBeGreaterThan(0)
}

test.describe('scrollstory', () => {
  // The dev machine is shared and slow at times; the film itself needs 121 pictures.
  test.describe.configure({ timeout: 180_000 })

  test('the film plays forward and back under the scroll, and the three words swap', async ({ page }) => {
    const con = watchConsole(page)
    await open(page)
    const total = await hook<number>(page, 'total()')
    expect(total).toBeGreaterThan(60)

    await scrub(page, 0)
    await expect.poll(() => frame(page)).toBe(1)
    expect(await beat(page)).toBe(0)
    await expect(page.locator('#ways [data-beat="0"]')).toHaveAttribute('data-state', 'on')

    await scrub(page, 0.5)
    await expect.poll(() => frame(page)).toBeGreaterThan(total * 0.4)
    await expect.poll(() => frame(page)).toBeLessThan(total * 0.6)
    await expect.poll(() => beat(page)).toBe(1)
    await expect(page.locator('#ways [data-beat="1"]')).toHaveAttribute('data-state', 'on')
    await expect(page.locator('#ways [data-beat="0"]')).toHaveAttribute('data-state', 'past')

    await scrub(page, 1)
    await expect.poll(() => frame(page)).toBe(total)
    await expect.poll(() => beat(page)).toBe(2)
    await expect(page.locator('#ways [data-beat="2"]')).toHaveAttribute('data-state', 'on')

    // …and scrolling back rewinds it.
    await scrub(page, 0)
    await expect.poll(() => frame(page)).toBe(1)
    await expect.poll(() => beat(page)).toBe(0)
    await expect(page.locator('#ways [data-beat="0"]')).toHaveAttribute('data-state', 'on')
    con.assertClean()
  })

  test('every frame loads and the canvas is painted at each stop', async ({ page }) => {
    test.setTimeout(300_000)
    const con = watchConsole(page)
    await open(page)
    const total = await hook<number>(page, 'total()')
    await expect.poll(() => hook<number>(page, 'loaded()'), { timeout: 240_000 }).toBe(total)

    const seen = new Set<number>()
    for (const p of [0.05, 0.28, 0.52, 0.76, 0.97]) {
      await scrub(page, p)
      // A resting playhead sits on a real frame near where the scroll is (never a blank or a half-blend).
      await expect.poll(() => frame(page)).toBeGreaterThan(p * total - 6)
      await expect.poll(() => frame(page)).toBeLessThan(p * total + 6)
      seen.add(await frame(page))
      const alpha = await page.evaluate(() => {
        const cv = document.querySelector<HTMLCanvasElement>('#ways canvas')!
        const ctx = cv.getContext('2d')!
        return [0.25, 0.5, 0.75].map((x) => ctx.getImageData(Math.floor(cv.width * x), Math.floor(cv.height * 0.5), 1, 1).data[3])
      })
      expect(alpha).toEqual([255, 255, 255])
    }
    expect(seen.size).toBe(5)
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
    // Not a tall scrubbed runway: the section is an ordinary block.
    const ratio = await page.evaluate(() => document.querySelector('#ways')!.getBoundingClientRect().height / window.innerHeight)
    expect(ratio).toBeLessThan(2)
    con.assertClean()
  })
})
