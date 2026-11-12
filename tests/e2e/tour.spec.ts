import { expect, test, type Page } from '@playwright/test'
import { pageUrl } from './_url'
import { scrollToY, waitForHook, watchConsole } from './helpers'

const tour = (page: Page) => page.evaluate(() => window.__st!.tour.state())
const site = (page: Page) => page.evaluate(() => ({ view: window.__st!.store.getState().view, picking: window.__st!.store.getState().picking }))

async function open(page: Page, extra = '') {
  await page.goto(pageUrl('tour', extra))
  await waitForHook(page, 'store')
  await scrollToY(page, '#inside')
  await waitForHook(page, 'tour')
  await expect(page.locator('#inside')).toBeVisible()
}

test.describe('tour — inside StoryTime', () => {
  for (const lang of ['ar', 'en'] as const) {
    test(`shows the real app screens in ${lang}`, async ({ page }) => {
      const con = watchConsole(page)
      await open(page, lang === 'en' ? '&lang=en' : '')
      await expect(page.locator('html')).toHaveAttribute('lang', lang)
      await expect(page.locator('#inside h2:visible')).toHaveText(lang === 'ar' ? 'هكذا تبدو الحكاية في يد الطفل' : "This is the story in a child's hands")
      const shots = (await tour(page)).shots as string[]
      expect(shots).toHaveLength(4)
      for (const s of shots) expect(s).toMatch(new RegExp(`/app/shots/(home|story|reader|tree)-${lang}\\.webp$`))
      // the screen in front really loads (lazy images near the viewport)
      await expect.poll(() => page.locator('#inside [data-shot="home"] img').evaluate((im: HTMLImageElement) => im.complete && im.naturalWidth)).toBe(780)
      await expect(page.locator('#inside .tour-cap__t:visible').first()).toBeVisible()
      con.assertClean()
    })
  }

  test('scrolling through the section brings each screen to the front', async ({ page }) => {
    const con = watchConsole(page)
    await open(page)
    expect(await tour(page)).toMatchObject({ mode: 'scrub', active: 0 })
    await page.evaluate(() => {
      const tr = document.querySelector<HTMLElement>('#inside .tour-track')!
      const y = tr.getBoundingClientRect().bottom + window.scrollY - window.innerHeight
      window.__st!.lenis.scrollTo(y, { immediate: true, force: true })
    })
    await expect.poll(async () => (await tour(page)).active).toBe(3)
    con.assertClean()
  })

  test('the pill enters the app (asks who is reading the first time)', async ({ page }) => {
    const con = watchConsole(page)
    await open(page)
    await page.evaluate(() => window.__st!.profile.getState().reset())
    const pill = page.locator('[data-tour-enter]:visible')
    await expect(pill).toHaveText(/ادخل المكتبة|Enter the library/)
    await pill.click()
    await expect.poll(async () => (await site(page)).picking).toBe(true)

    await page.evaluate(() => {
      window.__st!.store.getState().setPicking(false)
      window.__st!.profile.getState().setProfile({ name: '', avatar: 'leaf' })
    })
    await pill.click()
    await expect.poll(async () => (await site(page)).view).toBe('home')
    await page.evaluate(() => window.__st!.profile.getState().reset())
    con.assertClean()
  })

  test('reduced motion: every screen and caption is visible, nothing scrubs', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page)
    expect((await tour(page)).mode).toBe('rest')
    await expect(page.locator('#inside .tour-phone')).toHaveCount(4)
    await expect(page.locator('#inside .tour-cap')).toHaveCount(4)
    for (const cap of await page.locator('#inside .tour-cap').all()) await expect(cap).toBeVisible()
  })
})
