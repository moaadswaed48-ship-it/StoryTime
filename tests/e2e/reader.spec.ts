import { expect, test, type Page } from '@playwright/test'
import { story } from '../../src/content/story'
import { pageUrl } from './_url'
import { waitForHook, watchConsole } from './helpers'

/**
 * The immersive reader (the book whose pages curl). It is opened through the store and read through
 * `window.__st.reader`; pages are turned the way a reader turns them: by dragging the paper and by the arrows.
 * WebGL is software-rendered here, so nothing depends on timing: every step waits for the paper to be at rest.
 */
const rd = <T>(page: Page, call: string) => page.evaluate((c) => new Function(`return window.__st.reader.${c}`)() as T, call)
const atRest = (page: Page) => page.waitForFunction(() => window.__st?.reader?.ready?.() && !window.__st.reader.turning(), null, { timeout: 45_000 })
const pageIs = (page: Page, n: number) => page.waitForFunction((want) => window.__st?.reader?.page?.() === want && !window.__st.reader.turning(), n, { timeout: 45_000 })

async function openReader(page: Page, lang: 'ar' | 'en', scene = 0) {
  await page.goto(pageUrl('reader', `&lang=${lang}`))
  await waitForHook(page, 'reader')
  await page.evaluate((s) => window.__st!.store.getState().openBook(s), scene)
  await expect(page.locator('.rd')).toBeVisible()
  await atRest(page)
  await rd(page, 'chrome(false)')
}

interface Rect {
  x: number
  y: number
  w: number
  h: number
  pageW: number
  spread: boolean
  rtl: boolean
}
/** Drags the page the way a hand does: from just inside its free edge towards (dir 1) or away from (dir −1) the binding. */
async function dragPage(page: Page, dir: 1 | -1) {
  const r = await rd<Rect>(page, 'rect()')
  const y = r.y + r.h * 0.5
  // The free edge of the page that turns forward: the left edge of an Arabic book, the right edge of an English one.
  const free = r.rtl ? r.x : r.x + r.w
  const inward = r.rtl ? 1 : -1
  const reach = r.spread ? r.pageW * 1.45 : r.pageW * 0.8
  const from = dir > 0 ? free + inward * 44 : free + inward * reach
  const to = dir > 0 ? free + inward * reach : free + inward * 44
  await page.mouse.move(from, y)
  await page.mouse.down()
  await page.mouse.move(from + (to - from) * 0.2, y - 6, { steps: 4 })
  await page.mouse.move(to, y - 10, { steps: 10 })
  // the paper is in the air and following the hand
  expect(await rd<boolean>(page, 'turning()')).toBe(true)
  await page.mouse.up()
}

for (const lang of ['ar', 'en'] as const) {
  test(`${lang}: pages turn by dragging the paper, forward and back`, async ({ page }) => {
    const log = watchConsole(page)
    await openReader(page, lang)
    await expect(page.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
    expect(await rd<boolean>(page, 'rect().rtl')).toBe(lang === 'ar')
    const first = await rd<number>(page, 'page()')
    expect(first).toBe(1)
    const step = (await rd<boolean>(page, 'spread()')) ? 2 : 1

    await dragPage(page, 1)
    await pageIs(page, first + step)
    await expect(page.locator('.rd')).toHaveAttribute('data-page', String(first + step))
    await dragPage(page, 1)
    await pageIs(page, first + 2 * step)

    await dragPage(page, -1)
    await pageIs(page, first + step)

    // a drag that is let go early falls back
    const r = await rd<Rect>(page, 'rect()')
    const free = r.rtl ? r.x : r.x + r.w
    const inward = r.rtl ? 1 : -1
    await page.mouse.move(free + inward * 40, r.y + r.h * 0.5)
    await page.mouse.down()
    await page.mouse.move(free + inward * 110, r.y + r.h * 0.5, { steps: 6 })
    await page.waitForTimeout(350) // held still, so it is not a flick
    await page.mouse.up()
    await atRest(page)
    expect(await rd<number>(page, 'page()')).toBe(first + step)
    log.assertClean()
  })

  test(`${lang}: the arrows and the keyboard turn the page the way the language reads`, async ({ page }) => {
    const log = watchConsole(page)
    await openReader(page, lang)
    const step = (await rd<boolean>(page, 'spread()')) ? 2 : 1
    const forward = lang === 'ar' ? 'ArrowLeft' : 'ArrowRight'
    const back = lang === 'ar' ? 'ArrowRight' : 'ArrowLeft'

    await page.keyboard.press(forward)
    expect(await rd<boolean>(page, 'turning()')).toBe(true)
    await pageIs(page, 1 + step)
    await page.keyboard.press(back)
    await pageIs(page, 1)

    // the on-screen arrows (beside the book on wide screens, in the bottom bar on a phone)
    await rd(page, 'chrome(true)')
    const next = page.getByRole('button', { name: lang === 'ar' ? 'التالي' : 'Next', exact: true })
    const prev = page.getByRole('button', { name: lang === 'ar' ? 'السابق' : 'Previous', exact: true })
    await expect(prev).toBeDisabled()
    await next.click()
    await pageIs(page, 1 + step)
    await rd(page, 'chrome(true)')
    await next.click()
    await pageIs(page, 1 + 2 * step)
    await expect(page.getByTestId('rd-count')).toContainText(lang === 'ar' ? 'صفحة' : 'Page')
    await rd(page, 'chrome(true)')
    await prev.click()
    await pageIs(page, 1 + step)
    log.assertClean()
  })
}

test('the author’s words are on the page exactly, and a larger size re-flows them', async ({ page }) => {
  const log = watchConsole(page)
  await openReader(page, 'ar', 2)
  // (an open book can show two scenes at once; the one asked for is among them)
  const reading = await rd<number>(page, 'scene()')
  expect([1, 2]).toContain(reading)
  const norm = (s: string) => s.split(/\s+/).filter(Boolean).join(' ')
  const printed = async () => norm((await rd<string[]>(page, 'lines()')).join(' '))
  // the third scene opens where it was asked to, and its first paragraph is printed word for word
  expect(await printed()).toContain(norm(story.scenes[2].ar[0]))
  const pages = await rd<number>(page, 'pages()')
  const lines = (await rd<string[]>(page, 'lines()')).length

  await rd(page, 'setSize(4)')
  await page.waitForFunction((n) => window.__st!.reader.size() === 4 && window.__st!.reader.pages() > n && window.__st!.reader.ready(), pages)
  // same place in the story, bigger type, more pages
  expect(await rd<number>(page, 'scene()')).toBe(reading)
  expect(await printed()).toContain(norm(story.scenes[reading].ar[0]).split(' ').slice(0, 4).join(' '))
  await rd(page, 'setSize(1)')
  await page.waitForFunction((n) => window.__st!.reader.pages() === n && window.__st!.reader.ready(), pages)
  expect((await rd<string[]>(page, 'lines()')).length).toBe(lines)
  log.assertClean()
})

test('the fifth scene waits behind the demo log-in; the end earns the reading leaf', async ({ page }) => {
  const log = watchConsole(page)
  await openReader(page, 'ar')
  await page.evaluate(() => window.__st!.profile.getState().reset())
  await rd(page, 'goScene(11)')
  await page.waitForFunction(() => window.__st!.reader.phase() === 'gate' && !window.__st!.reader.turning())
  expect(await rd<number>(page, 'scene()')).toBeLessThanOrEqual(4)
  // the locked page cannot be turned
  const before = await rd<number>(page, 'page()')
  await rd(page, 'next()')
  await atRest(page)
  expect(await rd<number>(page, 'page()')).toBe(before)

  await page.getByTestId('rd-gate-btn').click()
  // the gate leads to the demo checkout (its own feature); here the payment is finished through the store
  await expect.poll(() => page.evaluate(() => !!window.__st!.store.getState().checkout)).toBe(true)
  await page.evaluate(() => {
    const st = window.__st!.store.getState()
    st.setLoggedIn(true)
    st.closeCheckout()
  })
  await page.waitForFunction(() => window.__st!.reader.phase() === 'open' && window.__st!.reader.ready())
  expect(await page.evaluate(() => window.__st!.store.getState().loggedIn)).toBe(true)

  await rd(page, 'goScene(12)')
  await page.waitForFunction(() => window.__st!.reader.phase() === 'end' && !window.__st!.reader.turning())
  await page.waitForFunction((id) => window.__st!.profile.getState().progress[id]?.read === true, story.id)
  await expect(page.getByTestId('rd-again')).toBeVisible()
  await page.getByTestId('rd-again').click()
  await pageIs(page, 1)

  // Escape leaves the book
  await page.keyboard.press('Escape')
  await expect(page.locator('.rd')).toHaveCount(0)
  expect(await page.evaluate(() => window.__st!.store.getState().overlay)).toBe(null)
  log.assertClean()
})
