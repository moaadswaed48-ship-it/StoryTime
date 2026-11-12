import { expect, test, type Page } from '@playwright/test'
import { pageUrl } from './_url'
import { scrollToY, waitForHook, watchConsole } from './helpers'

/** The stage's QA hooks: window.__st.sari = { action, set, tap, turn, yaw, state }. */
const sari = <T>(page: Page, call: string): Promise<T> => page.evaluate((c) => new Function(`return window.__st.sari.${c}`)() as T, call)
const action = (page: Page) => sari<string>(page, 'action()')
/** WebGL is software-rendered on the test machine: give anything that needs rendered frames plenty of time. */
const SLOW = { timeout: 60_000 }

/** Opens the page at the section and waits until Sari is on stage and has waved hello. Returns false when WebGL is missing. */
async function meet(page: Page): Promise<boolean> {
  await page.goto(pageUrl('sari'))
  await waitForHook(page, 'sari')
  await scrollToY(page, '#sari')
  await page.waitForFunction(
    () => {
      const s = window.__st!.sari.state()
      return (s.ready || s.flat) && s.waved
    },
    undefined,
    SLOW,
  )
  return !(await sari<{ flat: boolean }>(page, 'state()')).flat
}

test('Sari waves hello once when the section is first seen, then stands', async ({ page }) => {
  const con = watchConsole(page)
  const webgl = await meet(page)
  test.skip(!webgl, 'no WebGL here: the portrait fallback is showing')
  await expect(page.locator('#sari h2')).not.toBeEmpty()
  await expect(page.locator('#sari .sari-fact')).toHaveCount(3)
  await expect(page.locator('#sari canvas').first()).toBeVisible()
  // the hello is a passing gesture: he ends up standing, and the dock says so
  await expect.poll(() => action(page), SLOW).toBe('idle')
  await expect(page.locator('#sari [data-action="idle"]')).toHaveAttribute('aria-pressed', 'true')
  expect((await sari<{ calls: number }>(page, 'state()')).calls).toBeLessThan(30)
  con.assertClean()
})

test('the dock makes him run and stand, and a wave passes', async ({ page }) => {
  const con = watchConsole(page)
  const webgl = await meet(page)
  test.skip(!webgl, 'no WebGL here: the portrait fallback is showing')
  await expect.poll(() => action(page), SLOW).toBe('idle')

  await page.locator('#sari [data-action="run"]').click()
  expect(await action(page)).toBe('run')
  await expect(page.locator('#sari [data-action="run"]')).toHaveAttribute('aria-pressed', 'true')
  // the world starts rushing past him, and his legs really run (a foot leaves the ground)
  await expect.poll(async () => (await sari<{ run: number }>(page, 'state()')).run, SLOW).toBeGreaterThan(0.5)
  await expect.poll(async () => (await sari<{ stride: number }>(page, 'state()')).stride, SLOW).toBeGreaterThan(0.3)

  // waving interrupts the run for a moment, then he runs on
  await page.locator('#sari [data-action="wave"]').click()
  expect(await action(page)).toBe('wave')
  await expect.poll(() => action(page), SLOW).toBe('run')

  await page.locator('#sari [data-action="idle"]').click()
  expect(await action(page)).toBe('idle')
  await expect(page.locator('#sari [data-action="idle"]')).toHaveAttribute('aria-pressed', 'true')
  con.assertClean()
})

test('a drag turns him, he comes back to the front, and a tap makes him wave', async ({ page }) => {
  test.slow() // easing home needs rendered frames, and the software renderer draws only a few per second
  const con = watchConsole(page)
  const webgl = await meet(page)
  test.skip(!webgl, 'no WebGL here: the portrait fallback is showing')
  await expect.poll(() => action(page), SLOW).toBe('idle')
  const stage = page.locator('#sari .sari-stage')
  await stage.scrollIntoViewIfNeeded()
  const box = (await stage.boundingBox())!
  const cx = box.x + box.width / 2
  const cy = box.y + box.height * 0.45

  // drag to the right: his front follows the hand
  await page.mouse.move(cx - 70, cy)
  await page.mouse.down()
  for (let i = 1; i <= 7; i++) await page.mouse.move(cx - 70 + i * 20, cy)
  expect(await sari<number>(page, 'yaw()')).toBeGreaterThan(0.6)
  await page.mouse.up()
  // left alone for a few seconds, he eases back toward the visitor (well inside a quarter of the turn he was given)
  await expect.poll(async () => Math.abs(await sari<number>(page, 'yaw()')), { timeout: 120_000 }).toBeLessThan(0.3)

  // arrow keys turn him too
  await stage.focus()
  const before = await sari<number>(page, 'yaw()')
  await page.keyboard.press('ArrowRight')
  await expect.poll(async () => (await sari<number>(page, 'yaw()')) - before, SLOW).toBeGreaterThan(0.1)

  // a tap (no drag) is a wave
  await page.mouse.click(cx, cy)
  expect(await action(page)).toBe('wave')
  await expect.poll(() => action(page), SLOW).toBe('idle')
  con.assertClean()
})

test('with reduced motion nothing moves by itself, and he still does what the dock asks', async ({ page }) => {
  const con = watchConsole(page)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const webgl = await meet(page)
  test.skip(!webgl, 'no WebGL here: the portrait fallback is showing')
  // no hello by himself: he is simply standing there
  expect(await action(page)).toBe('idle')
  expect((await sari<{ reduced: boolean }>(page, 'state()')).reduced).toBe(true)
  await expect(page.locator('#sari [data-action="idle"]')).toHaveAttribute('aria-pressed', 'true')

  await page.locator('#sari [data-action="run"]').click()
  expect(await action(page)).toBe('run')
  await expect.poll(async () => (await sari<{ stride: number }>(page, 'state()')).stride, SLOW).toBeGreaterThan(0.3)
  await page.locator('#sari [data-action="idle"]').click()
  expect(await action(page)).toBe('idle')
  con.assertClean()
})

test('when WebGL is lost his portrait takes the stage and the dock goes', async ({ page }) => {
  const con = watchConsole(page)
  const webgl = await meet(page)
  if (webgl) {
    await page.evaluate(() => {
      const canvas = document.querySelector<HTMLCanvasElement>('#sari canvas')!
      const gl = (canvas.getContext('webgl2') ?? canvas.getContext('webgl')) as WebGLRenderingContext
      gl.getExtension('WEBGL_lose_context')!.loseContext()
    })
  }
  await expect.poll(async () => (await sari<{ flat: boolean }>(page, 'state()')).flat, SLOW).toBe(true)
  const portrait = page.locator('#sari .sari-portrait img')
  await expect(portrait).toBeVisible()
  await expect.poll(() => portrait.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true)
  await expect(page.locator('#sari .sari-dock')).toHaveCount(0)
  await expect(page.locator('#sari canvas.sari-burst')).toHaveCount(1) // the 2D leaves drift over the portrait
  // the words and the way into the game are untouched
  await expect(page.locator('#sari .sari-fact')).toHaveCount(3)
  await expect(page.locator('#sari [data-sari-play]')).toBeVisible()
  con.assertClean()
})

test('the play pill opens the game', async ({ page }) => {
  const con = watchConsole(page)
  await meet(page)
  await page.locator('#sari [data-sari-play]').click()
  expect(await page.evaluate(() => window.__st!.store.getState().overlay)).toBe('game')
  await page.evaluate(() => window.__st!.store.getState().closeOverlay())
  con.assertClean()
})
