import { mkdirSync } from 'node:fs'
import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test'
import ar from '../src/i18n/ar/index.ts'
import en from '../src/i18n/en/index.ts'
import { CLASSROOM_BOOST, MIN_FONT } from '../src/reader/zone.ts'

/**
 * Teachers: classroom mode against the built site (local test-mode backend), in English and Arabic, at 390 px
 * (a phone held by the teacher), 1440 px and 1920 px (a classroom's big screen or projector):
 * the switch for teachers only, the classroom frame without menu or account details, no parent gate on the way,
 * the book with much larger words and page-turn buttons at its edges (curl book, reduced motion and the flat book used
 * without WebGL), the film with larger controls, the activity one card at a time with the "In a class" note, the
 * print view with every step, the choice remembered with the account, and leaving classroom mode.
 */
const DICTS = { en, ar } as const
type L = keyof typeof DICTS
const SHOTS = 'qa/out/classroom'
mkdirSync(SHOTS, { recursive: true })
test.describe.configure({ timeout: 240_000 })

function watchErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => m.type() === 'error' && !/Failed to load resource/.test(m.text()) && errors.push(m.text()))
  return errors
}
const shot = (page: Page, info: TestInfo, name: string, fullPage = false) =>
  page.screenshot({ path: `${SHOTS}/${name}-${page.viewportSize()!.width}.png`, fullPage })
const noSideScroll = async (page: Page) => expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false)
const noGate = (page: Page) => expect(page.getByTestId('parent-gate')).toHaveCount(0)
const visible = (l: Locator) => l.filter({ visible: true })

/** Sign up as kindergarten staff, confirm, a 4-5 class profile, start the trial (lands on B02's storybook page). */
async function newTeacher(page: Page, lang: L, email: string, role: 'teacher' | 'parent' = 'teacher') {
  const d = DICTS[lang]
  const t = d.account.auth
  await page.goto(`${lang}/sign-up/`)
  await page.getByLabel(role === 'teacher' ? t.roleTeacher : t.roleParent).check()
  await page.getByLabel(t.email, { exact: true }).fill(email)
  await page.getByLabel(t.password, { exact: true }).fill('a long test password')
  await page.getByLabel(t.adultCheck).check()
  await page.getByLabel(t.termsCheck).check()
  await page.getByRole('button', { name: t.submitSignUp, exact: true }).click()
  await page.getByTestId('test-email-link').click()
  await expect(page.getByTestId('onboarding-step-1')).toBeVisible()
  await page.getByRole('button', { name: d.actions.next }).click()
  await page.getByLabel(d.commerce.groups['4-5']).click()
  const o = d.account.onboarding
  await page.getByLabel(role === 'teacher' ? o.className : o.childName).fill(role === 'teacher' ? 'Sunflowers' : 'Noor')
  await page.getByRole('button', { name: d.actions.next }).click()
  await page.getByRole('button', { name: o.trialStart }).click()
  await expect(page.getByTestId('storybook')).toHaveAttribute('data-state', 'open')
}

/** A 4-5 pass in the test-mode database, so the sample with a code-made test film opens. */
async function grantPass(page: Page, email: string) {
  await page.evaluate((email) => {
    const db = JSON.parse(localStorage.getItem('storytime.local.v1')!)
    const u = db.users.find((x: { email: string }) => x.email === email)
    const now = Date.now()
    db.passes.push({ id: crypto.randomUUID(), accountId: u.id, orderId: null, ageGroup: '4-5', months: 1, startsAt: new Date(now - 60_000).toISOString(), endsAt: new Date(now + 30 * 86_400_000).toISOString(), status: 'active', cancelledAt: null })
    localStorage.setItem('storytime.local.v1', JSON.stringify(db))
  }, email)
}

/** Nothing about the account on screen: no email, no menu, no footer, no trial or pass panel. */
async function nothingPersonal(page: Page, email: string) {
  await expect(page.getByTestId('main-menu')).toHaveCount(0)
  await expect(page.locator('footer')).toHaveCount(0)
  await expect(page.getByTestId('trial-opened')).toHaveCount(0)
  expect(await page.locator('body').innerText()).not.toContain(email)
  await noGate(page)
}

const fontOf = async (page: Page) => Number(await page.getByTestId('page-text').first().getAttribute('data-font-size'))

for (const lang of ['en', 'ar'] as const) {
  test(`classroom mode (${lang}): switch, frame, book, film, activity, print, remembered, leave`, async ({ page }, info) => {
    const errors = watchErrors(page)
    const d = DICTS[lang]
    const c = d.stories.classroom
    const wide = (page.viewportSize()?.width ?? 0) >= 768
    const email = `class-${lang}-${info.project.name}@example.test`
    await newTeacher(page, lang, email)

    // The normal book first, to compare the size of the words.
    await page.goto(`${lang}/app/story/b02/read?book=flat&page=1`)
    await expect(page.getByTestId('reader')).toHaveAttribute('data-classroom', 'off')
    await expect(page.getByTestId('page-text').first()).toBeVisible()
    const normalFont = await fontOf(page)

    // The switch: on the storybook page and the library, for a teacher.
    await page.goto(`${lang}/app/story/b02/`)
    const sw = page.getByTestId('classroom-switch')
    await expect(sw).toHaveAttribute('aria-checked', 'false')
    await expect(sw).toContainText(c.mode)
    await shot(page, info, `storybook-switch-${lang}`, true)
    await sw.click()

    // The classroom frame: no menu, no footer, nothing about the account; full screen where the browser allows.
    await expect(page.getByTestId('classroom-bar')).toBeVisible()
    await expect(page.getByTestId('classroom-switch')).toHaveCount(0)
    await nothingPersonal(page, email)
    await noSideScroll(page)
    await shot(page, info, `storybook-classroom-${lang}`, true)

    await page.goto(`${lang}/app/library/`)
    await expect(page.getByTestId('classroom-bar')).toBeVisible()
    await expect(page.getByTestId('library')).toBeVisible()
    await nothingPersonal(page, email)
    await noSideScroll(page)
    await shot(page, info, `library-classroom-${lang}`, true)

    // The book: much larger words; on a tablet or larger, page-turn buttons at the two edges of the book.
    await page.goto(`${lang}/app/story/b02/read?book=flat&page=1`)
    const reader = page.getByTestId('reader')
    await expect(reader).toHaveAttribute('data-classroom', 'on')
    await expect(page.getByTestId('page-text').first()).toBeVisible()
    const roomFont = await fontOf(page)
    expect(roomFont).toBeGreaterThan(normalFont * (wide ? 1.3 : 1.05))
    if (wide) {
      expect(roomFont).toBeGreaterThanOrEqual(MIN_FONT['4-5'] * CLASSROOM_BOOST.min - 0.01)
      await expect(page.getByTestId('edge-forward')).toBeVisible()
      await expect(page.getByTestId('page-forward')).toBeHidden()
      expect((await page.getByTestId('edge-forward').boundingBox())!.width).toBeGreaterThanOrEqual(80)
      await page.getByTestId('edge-forward').click()
    } else {
      await expect(page.getByTestId('edge-forward')).toBeHidden()
      await expect(page.getByTestId('page-forward')).toBeVisible()
      await page.getByTestId('page-forward').click()
    }
    await expect(reader).toHaveAttribute('data-page-no', '2')
    for (const t of await page.getByTestId('page-text').all()) {
      const box = await t.evaluate((el) => ({ sh: el.scrollHeight, ch: el.clientHeight }))
      expect(box.sh).toBeLessThanOrEqual(box.ch + 2) // the words never scroll
    }
    await nothingPersonal(page, email)
    await shot(page, info, `reader-flat-classroom-${lang}`)

    // The film (the 4-5 sample's code-made test film): larger controls inside the classroom frame.
    await grantPass(page, email)
    await page.goto(`${lang}/app/story/sample-b/watch`)
    await expect(page.getByTestId('film-video')).toBeVisible()
    await expect(page.getByTestId('classroom-bar')).toBeVisible()
    const control = page.getByTestId('film-captions')
    await expect(control).toBeVisible()
    expect((await control.boundingBox())!.height).toBeGreaterThanOrEqual(63)
    // Every control lies wholly inside the film frame (at 390 px the full-screen button was cut off).
    const frame = (await page.getByTestId('film').boundingBox())!
    for (const el of await page.getByTestId('film').locator('media-control-bar > *').all()) {
      const b = await el.boundingBox()
      if (!b || b.width === 0) continue
      expect(b.x >= frame.x - 1 && b.x + b.width <= frame.x + frame.width + 1, `${await el.evaluate((e) => e.tagName)} inside the frame`).toBe(true)
    }
    await nothingPersonal(page, email)
    await noSideScroll(page)
    await page.waitForTimeout(1200)
    await shot(page, info, `film-classroom-${lang}`)

    // The activity: one card at a time ("Get ready", then each step), the class note under it for the teacher.
    await page.goto(`${lang}/app/story/b02/do`)
    const stage = page.getByTestId('class-stage')
    await expect(stage).toBeVisible()
    await expect(page.getByTestId('class-indicator')).toHaveText('')
    await expect(page.getByTestId('class-card-0')).toBeVisible()
    await expect(page.getByTestId('class-card-0').getByRole('heading', { name: c.getReady })).toBeVisible()
    await expect(page.getByTestId('class-card-1')).toBeHidden()
    await expect(page.getByTestId('activity-in-class')).toBeVisible()
    await expect(page.getByTestId('activity-in-class')).toContainText(d.stories.activity.inClass)
    const steps = await page.locator('[data-testid^="class-card-"]').count() - 1
    expect(steps).toBeGreaterThan(1)
    await nothingPersonal(page, email)
    await noSideScroll(page)
    await shot(page, info, `activity-ready-${lang}`)
    await visible(page.getByTestId('class-step-forward')).click()
    await expect(page.getByTestId('class-indicator')).toHaveText(c.stepOf.replace('{n}', '1').replace('{total}', String(steps)))
    await expect(page.getByTestId('class-card-0')).toBeHidden()
    await expect(page.getByTestId('class-card-1')).toBeVisible()
    const caption = page.getByTestId('class-card-1').getByTestId('class-caption')
    expect(parseFloat(await caption.evaluate((el) => getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(30)
    await shot(page, info, `activity-step-${lang}`)
    // The arrow key in the reading direction moves on as well.
    await page.keyboard.press(lang === 'ar' ? 'ArrowLeft' : 'ArrowRight')
    await expect(page.getByTestId('class-card-2')).toBeVisible()
    for (let i = 2; i < steps; i++) await visible(page.getByTestId('class-step-forward')).click()
    await expect(visible(page.getByTestId('class-step-forward'))).toBeDisabled()
    await page.getByTestId('activity-did-it').click()
    await expect(page.getByTestId('activity-done')).toContainText('Sunflowers')
    await shot(page, info, `activity-done-${lang}`)
    // On paper: every card, one after another, and the class note; no buttons.
    await page.emulateMedia({ media: 'print' })
    for (let i = 0; i <= steps; i++) await expect(page.getByTestId(`class-card-${i}`)).toBeVisible()
    await expect(page.getByTestId('activity-in-class')).toBeVisible()
    await expect(page.getByTestId('activity-print')).toBeHidden()
    await shot(page, info, `activity-print-${lang}`, true)
    await page.emulateMedia({ media: 'screen' })

    // Remembered with the account: with this device's copy gone, the account still says classroom mode.
    await page.evaluate(() => {
      const uid = JSON.parse(localStorage.getItem('storytime.local.session')!).userId
      localStorage.removeItem(`storytime.prefs.${uid}`)
    })
    await page.goto(`${lang}/app/library/`)
    await expect(page.getByTestId('classroom-bar')).toBeVisible()

    // Settings keep the normal frame (behind the parent gate) and offer the same switch.
    await page.goto(`${lang}/app/settings/`)
    await expect(page.getByTestId('classroom-bar')).toHaveCount(0)

    // Leaving: the normal menu and the trial panel come back.
    await page.goto(`${lang}/app/library/`)
    await page.getByTestId('classroom-leave').click()
    await expect(page.getByTestId('classroom-bar')).toHaveCount(0)
    await expect(page.getByTestId('main-menu')).toBeVisible()
    await expect(page.getByTestId('trial-opened')).toBeVisible()
    await expect(page.getByTestId('classroom-switch')).toHaveAttribute('aria-checked', 'false')
    expect(errors).toEqual([])
  })
}

test('classroom mode with reduced motion, and never for a parent account', async ({ browser }, info) => {
  const context = await browser.newContext({ baseURL: info.project.use.baseURL, viewport: page0(info), reducedMotion: 'reduce' })
  const page = await context.newPage()
  const errors = watchErrors(page)
  await newTeacher(page, 'en', `class-rm-${info.project.name}@example.test`)
  await page.getByTestId('classroom-switch').click()
  await page.goto('en/app/story/b02/read?page=1')
  // Reduced motion: the flat book, the same large words.
  await expect(page.getByTestId('reader')).toHaveAttribute('data-mode', 'flat')
  await expect(page.getByTestId('reader')).toHaveAttribute('data-classroom', 'on')
  await expect(page.getByTestId('page-text').first()).toBeVisible()
  await shot(page, info, 'reader-reduced-motion-en')
  await page.goto('en/app/story/b02/do')
  await expect(page.getByTestId('class-stage')).toBeVisible()
  expect(errors).toEqual([])
  await context.close()

  // A parent sees no classroom switch anywhere, and the activity page shows every step at once.
  const parent = await browser.newPage({ baseURL: info.project.use.baseURL, viewport: page0(info) })
  await newTeacher(parent, 'en', `class-parent-${info.project.name}@example.test`, 'parent')
  await expect(parent.getByTestId('classroom-switch')).toHaveCount(0)
  await parent.goto('en/app/library/')
  await expect(parent.getByTestId('library')).toBeVisible()
  await expect(parent.getByTestId('classroom-switch')).toHaveCount(0)
  await parent.goto('en/app/story/b02/do')
  await expect(parent.getByTestId('activity-steps')).toBeVisible()
  await expect(parent.getByTestId('class-stage')).toHaveCount(0)
  await expect(parent.getByTestId('activity-in-class')).toBeVisible()
  await parent.close()
})
const page0 = (info: TestInfo) => (info.project.name === 'phone' ? { width: 390, height: 844 } : { width: 1440, height: 900 })

// The classroom's big screen or projector (1920 x 1080), in the desktop run only.
test.describe('big screen 1920 px', () => {
  test.use({ viewport: { width: 1920, height: 1080 } })
  for (const lang of ['en', 'ar'] as const) {
    test(`big screen (${lang}): curl book, flat book, film and activity`, async ({ page }, info) => {
      test.skip(info.project.name !== 'desktop', 'one big-screen run is enough')
      const errors = watchErrors(page)
      const email = `class-big-${lang}@example.test`
      await newTeacher(page, lang, email)
      await page.getByTestId('classroom-switch').click()
      await expect(page.getByTestId('classroom-bar')).toBeVisible()
      // Full screen is offered (a desktop browser allows it).
      await expect(page.getByTestId('classroom-fullscreen')).toBeVisible()

      for (const flat of [false, true]) {
        await page.goto(`${lang}/app/story/b02/read?page=1${flat ? '&book=flat' : ''}`)
        const reader = page.getByTestId('reader')
        await expect(reader).toHaveAttribute('data-mode', flat ? 'flat' : /curl|flat/)
        await expect(page.getByTestId('page-text').first()).toBeVisible()
        expect(await fontOf(page)).toBeGreaterThanOrEqual(MIN_FONT['4-5'] * CLASSROOM_BOOST.min - 0.01)
        // The page-turn buttons stand beside the book, never over a page.
        const pages = await page.getByTestId('reader').locator('[data-page-no], [data-testid="title-page"], [data-testid="end-page"]').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON() as DOMRect))
        for (const id of ['edge-back', 'edge-forward']) {
          const b = (await page.getByTestId(id).boundingBox())!
          expect(b.width).toBeGreaterThanOrEqual(90)
          for (const p of pages) expect(b.x + b.width <= p.left + 1 || b.x >= p.right - 1, `${id} beside the pages`).toBe(true)
        }
        // Forward is on the reading side: the left in Arabic, the right in English.
        const fwd = (await page.getByTestId('edge-forward').boundingBox())!
        expect(lang === 'ar' ? fwd.x < 960 : fwd.x > 960).toBe(true)
        await page.waitForTimeout(600)
        await shot(page, info, `reader-${flat ? 'flat' : 'curl'}-big-${lang}`)
        await page.getByTestId('edge-forward').click()
        await expect(reader).toHaveAttribute('data-page-no', /[2-9]/)
        await page.waitForTimeout(900)
        await shot(page, info, `reader-${flat ? 'flat' : 'curl'}-big-turned-${lang}`)
      }

      await grantPass(page, email)
      await page.goto(`${lang}/app/story/sample-b/watch`)
      await expect(page.getByTestId('film-video')).toBeVisible()
      const film = (await page.getByTestId('film').boundingBox())!
      expect(film.y + film.height).toBeLessThanOrEqual(1080 + 1) // the whole film and its controls on one screen
      expect(film.width).toBeGreaterThan(1100)
      await page.waitForTimeout(1500)
      await shot(page, info, `film-big-${lang}`)

      await page.goto(`${lang}/app/story/c01/do`)
      // C01 is a 6-8 story: give the group a pass first.
      if (await page.getByTestId('class-stage').count() === 0) {
        await page.evaluate((email) => {
          const db = JSON.parse(localStorage.getItem('storytime.local.v1')!)
          const u = db.users.find((x: { email: string }) => x.email === email)
          const now = Date.now()
          db.passes.push({ id: crypto.randomUUID(), accountId: u.id, orderId: null, ageGroup: '6-8', months: 1, startsAt: new Date(now - 60_000).toISOString(), endsAt: new Date(now + 30 * 86_400_000).toISOString(), status: 'active', cancelledAt: null })
          localStorage.setItem('storytime.local.v1', JSON.stringify(db))
        }, email)
        await page.reload()
      }
      await expect(page.getByTestId('class-stage')).toBeVisible()
      const stage = (await page.getByTestId('class-stage').boundingBox())!
      expect(stage.y + stage.height).toBeLessThanOrEqual(1080 + 1)
      await shot(page, info, `activity-ready-big-${lang}`)
      await visible(page.getByTestId('class-step-forward')).click()
      await expect(page.getByTestId('class-card-1')).toBeVisible()
      const card = (await page.getByTestId('class-stage').boundingBox())!
      expect(card.y + card.height).toBeLessThanOrEqual(1080 + 1) // a step, its picture and its words fit on one screen
      await shot(page, info, `activity-step-big-${lang}`)
      await page.mouse.wheel(0, 1200)
      await page.waitForTimeout(300)
      await shot(page, info, `activity-notes-big-${lang}`)
      await noSideScroll(page)
      expect(errors).toEqual([])
    })
  }
})
