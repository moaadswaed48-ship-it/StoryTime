import { expect, test, type Page } from '@playwright/test'
import { story } from '../../src/content/story'
import { pageUrl } from './_url'
import { waitForHook, watchConsole } from './helpers'

/** The film overlay is opened through the store (never through query flags) and driven through window.__st.film. */
const film = <T>(page: Page, call: string) => page.evaluate((c) => new Function(`return window.__st.film.${c}`)() as T, call)
const openFilm = async (page: Page, scene = 0) => {
  await page.goto(pageUrl('film'))
  await waitForHook(page, 'film')
  await page.evaluate((s) => window.__st!.store.getState().openFilm(s), scene)
  await expect(page.getByRole('dialog')).toBeVisible()
}
const playing = (page: Page) => expect.poll(() => film<boolean>(page, 'playing()'), { timeout: 30_000 }).toBe(true)
const cue = (i: number) => story.scenes[i].cue.ar

test('opens as a cinema, plays with sound, shows the title and then her words', async ({ page }) => {
  const log = watchConsole(page)
  await openFilm(page)
  await expect(page.locator('[data-film-title="on"]')).toContainText(story.title.ar.split(' ')[0])
  await playing(page)
  expect(await film(page, 'muted()')).toBe(false)
  expect(await film<number>(page, 'duration()')).toBeGreaterThan(30)
  expect(await film<number>(page, 'duration()')).toBeLessThan(40)
  // the film really runs: time moves on, the title leaves, the first scene's line appears
  await expect.poll(() => film<number>(page, 'time()'), { timeout: 30_000 }).toBeGreaterThan(2.4)
  await expect(page.locator('[data-film-title="off"]')).toBeAttached()
  await expect(page.locator('[data-film-caption]')).toHaveText(cue(0), { timeout: 15_000 })
  expect(await film(page, 'scene()')).toBe(0)
  log.assertClean()
})

test('when sound is not allowed it starts muted and offers a clear unmute pill', async ({ page }) => {
  await page.addInitScript(() => {
    const play = HTMLMediaElement.prototype.play
    HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
      return this.muted ? play.call(this) : Promise.reject(new DOMException('sound needs a gesture', 'NotAllowedError'))
    }
  })
  await openFilm(page)
  await playing(page)
  expect(await film(page, 'muted()')).toBe(true)
  const pill = page.locator('[data-film-unmute]')
  await expect(pill).toBeVisible()
  await pill.click()
  expect(await film(page, 'muted()')).toBe(false)
  await expect(pill).toHaveCount(0)
  expect(await film(page, 'playing()')).toBe(true)
})

test('opens at the nearest film scene; chips and seek() move through the scenes', async ({ page }) => {
  const log = watchConsole(page)
  await openFilm(page, 6) // scene 7 has no clip: the film starts at scene 6 (the wind), not at the title
  await playing(page)
  expect(await film(page, 'scene()')).toBe(5)
  await expect(page.locator('[data-film-title]')).toHaveAttribute('data-film-title', 'off')
  const scenes = await film<{ scene: number; start: number; end: number }[]>(page, 'scenes()')
  expect(scenes.map((s) => s.scene)).toEqual([0, 3, 5, 7, 10, 11])

  await page.locator('[data-film-chip="10"]').click()
  await expect.poll(() => film(page, 'scene()')).toBe(10)
  await expect(page.locator('[data-film-chip="10"]')).toHaveAttribute('aria-current', 'true')
  await expect(page.locator('[data-film-caption]')).toHaveText(cue(10), { timeout: 15_000 })
  const at = await film<number>(page, 'time()')
  expect(at).toBeGreaterThanOrEqual(scenes[4].start)
  expect(at).toBeLessThan(scenes[4].end)

  await film(page, 'seek(9)')
  await expect.poll(() => film(page, 'scene()')).toBe(3)
  await expect(page.locator('[data-film-caption]')).toHaveText(cue(3), { timeout: 15_000 })
  log.assertClean()
})

test('controls leave while it plays and come back; keys drive it', async ({ page }, info) => {
  await openFilm(page, 3)
  await playing(page)
  const stage = page.locator('.film-stage')
  await expect(stage).toHaveAttribute('data-film-ui', 'off', { timeout: 20_000 })
  const box = (await page.locator('.film-frame').boundingBox())!
  if (info.project.name === 'mobile') {
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2)
    await expect(stage).toHaveAttribute('data-film-ui', 'on')
    expect(await film(page, 'playing()')).toBe(true) // a tap only brings the controls
    return
  }
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 3)
  await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 3 + 20)
  await expect(stage).toHaveAttribute('data-film-ui', 'on')

  await page.keyboard.press('Space')
  await expect.poll(() => film(page, 'playing()')).toBe(false)
  const t0 = await film<number>(page, 'time()')
  await page.keyboard.press('ArrowLeft') // Arabic reads right to left: ← is forward
  await expect.poll(() => film<number>(page, 'time()')).toBeGreaterThan(t0 + 4)
  await page.keyboard.press('ArrowRight')
  await expect.poll(() => film<number>(page, 'time()')).toBeLessThan(t0 + 1)
  await page.keyboard.press('KeyM')
  expect(await film(page, 'muted()')).toBe(true)
  await page.keyboard.press('KeyC')
  expect(await film(page, 'captions()')).toBe(false)
  await expect(page.locator('[data-film-caption] p')).toHaveCount(0)
  await page.keyboard.press('KeyC')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(await page.evaluate(() => window.__st!.store.getState().overlay)).toBe(null)
})

test('the end card offers to watch again and to read the book', async ({ page }) => {
  const log = watchConsole(page)
  await openFilm(page, 11)
  await playing(page)
  await film(page, 'seek(window.__st.film.duration() - 0.6)')
  await expect.poll(() => film(page, 'ended()'), { timeout: 30_000 }).toBe(true)
  await expect(page.locator('[data-film-end]')).toBeVisible()
  await page.locator('[data-film-replay]').click()
  await playing(page)
  expect(await film<number>(page, 'time()')).toBeLessThan(5)
  await expect(page.locator('[data-film-end]')).toHaveCount(0)

  await film(page, 'seek(window.__st.film.duration() - 0.6)')
  await expect.poll(() => film(page, 'ended()'), { timeout: 30_000 }).toBe(true)
  await page.locator('[data-film-read]').click()
  expect(await page.evaluate(() => window.__st!.store.getState().overlay)).toBe('book')
  expect(await page.evaluate(() => window.__st!.store.getState().startScene)).toBe(0)
  await expect(page.locator('.film-stage')).toHaveCount(0)
  log.assertClean()
})
