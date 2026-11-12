import { expect, test, type Page } from '@playwright/test'
import { story } from '../../src/content/story'
import { pageUrl } from './_url'
import { waitForHook, watchConsole } from './helpers'

/**
 * The film overlay is opened through the store (never through query flags) and driven through window.__st.film.
 * A film does not wait for a slow test runner, so anything that depends on "where the film is now" is checked
 * inside the page: `freezeWhen` waits there for a condition and pauses the film on the spot.
 */
const film = <T>(page: Page, call: string) => page.evaluate((c) => new Function(`return window.__st.film.${c}`)() as T, call)
const freezeWhen = (page: Page, condition: string) =>
  page.waitForFunction(
    (c) => {
      const f = window.__st?.film
      if (!f || !new Function('f', `return ${c}`)(f)) return false
      f.pause()
      return true
    },
    condition,
    { timeout: 45_000 },
  )
const openFilm = async (page: Page, scene = 0) => {
  await page.goto(pageUrl('film'))
  await waitForHook(page, 'film')
  await page.evaluate((s) => window.__st!.store.getState().openFilm(s), scene)
  await expect(page.locator('.film-stage')).toBeVisible()
}
const cue = (i: number) => story.scenes[i].cue.ar
const caption = (page: Page) => page.locator('[data-film-caption]')

test('opens as a cinema, plays with sound, shows the title and then her words', async ({ page }) => {
  const log = watchConsole(page)
  await openFilm(page)
  await expect(page.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
  await expect(page.locator('[data-film-title]')).toContainText(story.title.ar.split(' ')[0])
  await expect(page.locator('[data-film-title]')).toHaveAttribute('data-film-title', 'on')
  // the film really runs, with sound: the title holds over the cover and into scene 1, then her words come in
  await freezeWhen(page, 'f.playing() && !f.muted() && f.time() > 3.9')
  expect(await film<number>(page, 'duration()')).toBeGreaterThan(100)
  expect(await film<number>(page, 'duration()')).toBeLessThan(130)
  expect(await film(page, 'scene()')).toBe(0)
  await expect(page.locator('[data-film-title]')).toHaveAttribute('data-film-title', 'off')
  await expect(caption(page)).toHaveText(cue(0))
  await expect(page.locator('[data-film-chip="0"]')).toHaveAttribute('aria-current', 'true')
  // held mid-film: the scene row is there, and no big play button sits on her words
  await expect(page.locator('[data-film-chip="0"]')).toBeVisible()
  await expect(page.locator('[data-film-bigplay]')).toHaveCount(0)
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
  await freezeWhen(page, 'f.playing() && f.muted()')
  const pill = page.locator('[data-film-unmute]')
  await expect(pill).toBeVisible()
  await pill.click()
  expect(await film(page, 'muted()')).toBe(false)
  await expect(pill).toHaveCount(0)
})

test('opens at the nearest film scene; chips and seek() move through the scenes', async ({ page }) => {
  const log = watchConsole(page)
  await openFilm(page, 6) // the whole-story film has every scene: it starts at scene 7 (index 6), not at the title
  await freezeWhen(page, 'f.playing()')
  expect(await film(page, 'scene()')).toBe(6)
  await expect(page.locator('[data-film-title]')).toHaveAttribute('data-film-title', 'off')
  const scenes = await film<{ scene: number; start: number; end: number }[]>(page, 'scenes()')
  expect(scenes.map((s) => s.scene)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])

  await page.locator('[data-film-chip="10"]').click() // a chip seeks and plays
  await freezeWhen(page, 'f.playing() && f.scene() === 10')
  const at = await film<number>(page, 'time()')
  expect(at).toBeGreaterThanOrEqual(scenes[10].start)
  expect(at).toBeLessThan(scenes[10].end)
  await expect(page.locator('[data-film-chip="10"]')).toHaveAttribute('aria-current', 'true')
  await expect(caption(page)).toHaveText(cue(10))

  await film(page, 'seek(9)')
  await expect.poll(() => film(page, 'scene()')).toBe(1)
  await expect(caption(page)).toHaveText(cue(1))
  log.assertClean()
})

test('controls leave while it plays and come back; keys drive it', async ({ page }, info) => {
  await openFilm(page, 3)
  // every state the controls go through is noted inside the page, so nothing is missed between two looks
  await page.evaluate(() => {
    const stage = document.querySelector('.film-stage')!
    const seen: string[] = ((window as unknown as { __ui: string[] }).__ui = [stage.getAttribute('data-film-ui')!])
    new MutationObserver(() => seen.push(stage.getAttribute('data-film-ui')!)).observe(stage, { attributes: true, attributeFilter: ['data-film-ui'] })
  })
  const seen = () => page.evaluate(() => (window as unknown as { __ui: string[] }).__ui.join(' '))
  await expect.poll(seen, { timeout: 30_000 }).toMatch(/off/) // they left by themselves while it played
  const box = (await page.locator('.film-frame').boundingBox())!
  if (info.project.name === 'mobile') {
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2)
    await expect.poll(seen).toMatch(/off.* on/) // a tap brings them back…
    await expect(page.locator('.film-stage')).not.toHaveAttribute('data-film', 'paused') // …and does not stop the film
    return
  }
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 3)
  await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 3 + 20)
  await expect.poll(seen).toMatch(/off.* on/)

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
  await expect(caption(page).locator('p')).toHaveCount(0)
  await page.keyboard.press('KeyC')
  await page.keyboard.press('Escape')
  await expect(page.locator('.film-stage')).toHaveCount(0)
  expect(await page.evaluate(() => window.__st!.store.getState().overlay)).toBe(null)
})

test('the end card offers to watch again and to read the book', async ({ page }) => {
  const log = watchConsole(page)
  await openFilm(page, 11)
  await waitForHook(page, 'profile')
  const watched = () => page.evaluate((id) => !!window.__st!.profile.getState().progress[id]?.watched, story.id)
  await page.evaluate(() => window.__st!.profile.getState().reset())
  await freezeWhen(page, 'f.playing()')
  expect(await watched()).toBe(false)
  await film(page, 'seek(window.__st.film.duration() - 0.6)')
  await film(page, 'play()')
  await expect.poll(() => film(page, 'ended()'), { timeout: 30_000 }).toBe(true)
  await expect(page.locator('[data-film-end]')).toBeVisible()
  expect(await watched()).toBe(true) // reaching the end earns the "watched" leaf
  await expect(page.locator('[data-film-chip]')).toHaveCount(0)
  await page.locator('[data-film-replay]').click()
  await freezeWhen(page, 'f.playing()')
  expect(await film<number>(page, 'time()')).toBeLessThan(5)
  await expect(page.locator('[data-film-end]')).toHaveCount(0)

  await film(page, 'seek(window.__st.film.duration() - 0.6)')
  await film(page, 'play()')
  await expect.poll(() => film(page, 'ended()'), { timeout: 30_000 }).toBe(true)
  await page.locator('[data-film-read]').click()
  expect(await page.evaluate(() => window.__st!.store.getState().overlay)).toBe('book')
  expect(await page.evaluate(() => window.__st!.store.getState().startScene)).toBe(0)
  await expect(page.locator('.film-stage')).toHaveCount(0)
  log.assertClean()
})
