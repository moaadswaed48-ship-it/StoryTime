import { mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test, type Page, type TestInfo } from '@playwright/test'
import ar from '../src/i18n/ar/index.ts'
import en from '../src/i18n/en/index.ts'

/**
 * Stage 4 part B1 walk-throughs against the built site (local test-mode backend): a parent signs up, starts the
 * 4-5 trial and then uses everything a family uses: library (shelf and list), storybook page, the whole book read
 * with Listen and auto-flip on, then off, a turn by hand pausing the voice, the film with captions, the activity
 * and its "we did it" mark, and each collection used in place. English and Arabic, at 390 px and 1440 px.
 * Recordings are the sample stories' test recordings (soft ticks with word timings), played 6x faster through the
 * reader's test hook so a whole book takes seconds; the audio path is the real one.
 */
const DICTS = { en, ar } as const
type L = keyof typeof DICTS
const SHOTS = 'qa/out/stage4b1'
mkdirSync(SHOTS, { recursive: true })
test.describe.configure({ timeout: 240_000 })

function watchErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => m.type() === 'error' && !/Failed to load resource|play\(\) request was interrupted/.test(m.text()) && errors.push(m.text()))
  return errors
}
const shot = (page: Page, info: TestInfo, name: string, fullPage = true) => page.screenshot({ path: `${SHOTS}/${name}-${info.project.name}.png`, fullPage })
const noSideScroll = async (page: Page) => expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false)

/** Sign up, confirm through the test-mode link, onboard a 4-5 profile and start the trial. */
async function newFamily(page: Page, lang: L, email: string) {
  const d = DICTS[lang]
  const t = d.account.auth
  const o = d.account.onboarding
  await page.goto(`${lang}/sign-up/`)
  await page.getByLabel(t.roleParent).check()
  await page.getByLabel(t.email, { exact: true }).fill(email)
  await page.getByLabel(t.password, { exact: true }).fill('a long test password')
  await page.getByLabel(t.adultCheck).check()
  await page.getByLabel(t.termsCheck).check()
  await page.getByRole('button', { name: t.submitSignUp, exact: true }).click()
  await page.getByTestId('test-email-link').click()
  await expect(page.getByTestId('onboarding-step-1')).toBeVisible()
  await page.getByRole('button', { name: d.actions.next }).click()
  await page.getByLabel(d.commerce.groups['4-5']).click()
  await page.getByLabel(o.childName).fill('Noor')
  await page.getByRole('button', { name: d.actions.next }).click()
  await page.getByRole('button', { name: o.trialStart }).click()
  await expect(page.getByTestId('storybook')).toHaveAttribute('data-state', 'open')
  await grantPass(page, email)
}

/**
 * The 4-5 sample (the only story with test recordings, a film file and step pictures) is not a trial story since
 * part C (the trial is three real stories), so these walk-throughs give the family a 4-5 pass in the test-mode
 * database, the way owner.spec.ts sets the owner role. Buying a pass is walked through in account.spec.ts.
 */
async function grantPass(page: Page, email: string, group = '4-5') {
  await page.evaluate(({ email, group }) => {
    const db = JSON.parse(localStorage.getItem('storytime.local.v1')!)
    const u = db.users.find((x: { email: string }) => x.email === email)
    const now = Date.now()
    db.passes.push({ id: crypto.randomUUID(), accountId: u.id, orderId: null, ageGroup: group, months: 1, startsAt: new Date(now - 60_000).toISOString(), endsAt: new Date(now + 30 * 86_400_000).toISOString(), status: 'active', cancelledAt: null })
    localStorage.setItem('storytime.local.v1', JSON.stringify(db))
  }, { email, group })
}

const reader = (page: Page) => page.getByTestId('reader')

/**
 * After opening the book from the Listen door the voice starts by itself where the browser allows sound without a
 * fresh tap; phones (and iPhones) refuse, and the reader then asks for a tap on Listen, as a parent would do.
 */
async function voiceStarts(page: Page, lang: L, info: TestInfo) {
  const asked = page.getByTestId('listen-note').filter({ hasText: DICTS[lang].stories.reader.tapToListen })
  await expect(reader(page).and(page.locator('[data-playing="true"]')).or(asked)).toBeVisible({ timeout: 10_000 })
  if (await asked.isVisible()) {
    info.annotations.push({ type: 'listen', description: 'browser asked for a tap before sound; tapped Listen' })
    await page.getByTestId('listen').click()
  }
  await expect(reader(page)).toHaveAttribute('data-playing', 'true', { timeout: 10_000 })
}

/** Every visible page's words are at least the age group's minimum size, measured by the browser. */
async function textNotTooSmall(page: Page) {
  const sizes = await page.getByTestId('page-text').evaluateAll((els) =>
    els.map((el) => ({ min: Number((el as HTMLElement).dataset.minFont), real: parseFloat(getComputedStyle(el.querySelector('p')!).fontSize), over: el.scrollWidth > el.clientWidth + 2 })))
  for (const s of sizes) {
    expect(s.real).toBeGreaterThanOrEqual(s.min - 0.01)
    expect(s.over).toBe(false) // no line runs out of its box
  }
  return sizes.length
}

for (const lang of ['en', 'ar'] as const) {
  test(`family (${lang}): library, storybook, listen with auto-flip on and off, film, activity, collections`, async ({ page }, info) => {
    const errors = watchErrors(page)
    const d = DICTS[lang]
    const s = d.stories
    await page.addInitScript(() => void ((window as unknown as { __storytimeListenRate: number }).__storytimeListenRate = 6))
    await newFamily(page, lang, `family-${lang}-${info.project.name}@example.test`)
    await expect(page.getByTestId('doors-hint')).toBeVisible()

    // Library: the shelf, one profile reading, nothing started yet; the list shows the same books.
    await page.goto(`${lang}/app/library/`)
    await expect(page.getByTestId('shelf')).toBeVisible()
    await expect(page.getByTestId('active-profile')).toContainText('Noor')
    await expect(page.getByTestId('nothing-started')).toBeVisible()
    await page.waitForTimeout(700)
    await noSideScroll(page)
    await shot(page, info, `library-shelf-${lang}`)
    await page.getByTestId('view-list').click()
    await expect(page.getByTestId('story-list').locator('a')).not.toHaveCount(0)
    await shot(page, info, `library-list-${lang}`)

    // Storybook page of the 4-5 sample: four doors, all visible; Listen says its recording is a test one.
    await page.goto(`${lang}/app/story/sample-b/`)
    const doors = page.getByTestId('doors')
    for (const door of ['door-read', 'door-listen', 'door-watch', 'door-do']) await expect(doors.getByTestId(door)).toHaveAttribute('data-state', 'open')
    await expect(doors.getByTestId('door-listen')).toContainText(s.doors.testRecording)
    await noSideScroll(page)
    await shot(page, info, `storybook-${lang}`)

    // Listen with auto-flip on (the default): the voice starts on page 1, marks words, turns every page by
    // itself and stops at the end of the book.
    await doors.getByTestId('door-listen').click()
    await expect(reader(page)).toHaveAttribute('data-mode', /curl|flat/)
    await expect(page.getByTestId('autoflip')).toHaveAttribute('aria-checked', 'true')
    await voiceStarts(page, lang, info)
    await expect(page.locator('[data-w].bg-\\[\\#ffd98a\\]')).toHaveCount(1, { timeout: 5_000 })
    expect(await textNotTooSmall(page)).toBeGreaterThan(0)
    await shot(page, info, `reader-listening-${lang}`, false)
    await expect(page.getByTestId('end-page')).toBeVisible({ timeout: 60_000 })
    await expect(reader(page)).toHaveAttribute('data-playing', 'false')
    await shot(page, info, `reader-end-${lang}`, false)

    // Auto-flip off: the voice reads the page and stops there; the page stays.
    await page.goto(`${lang}/app/story/sample-b/read?page=3`)
    await expect(reader(page)).toHaveAttribute('data-page-no', /^[23]$/) // a spread shows pages 2 and 3
    const here = await reader(page).getAttribute('data-page-no')
    await page.getByTestId('autoflip').click()
    await expect(page.getByTestId('autoflip')).toHaveAttribute('aria-checked', 'false')
    await page.getByTestId('listen').click()
    await expect(reader(page)).toHaveAttribute('data-playing', 'true')
    await expect(reader(page)).toHaveAttribute('data-playing', 'false', { timeout: 15_000 })
    await page.waitForTimeout(800)
    await expect(reader(page)).toHaveAttribute('data-page-no', here!)
    await shot(page, info, `reader-autoflip-off-${lang}`, false)

    // A turn by hand pauses the voice. Larger text never goes below the minimum either.
    await page.getByTestId('listen').click()
    await expect(reader(page)).toHaveAttribute('data-playing', 'true')
    await page.getByTestId('page-forward').click()
    await expect(reader(page)).toHaveAttribute('data-playing', 'false')
    await page.getByTestId('text-larger').click()
    await page.getByTestId('text-larger').click()
    await page.waitForTimeout(900)
    expect(await textNotTooSmall(page)).toBeGreaterThan(0)
    await shot(page, info, `reader-larger-text-${lang}`, false)
    await page.getByTestId('text-smaller').click()
    await page.getByTestId('text-smaller').click()
    // The auto-flip choice is remembered for the account.
    await page.reload()
    await expect(page.getByTestId('autoflip')).toHaveAttribute('aria-checked', 'false')
    await page.getByTestId('autoflip').click()

    // Progress: the library now offers to continue this book.
    await page.getByTestId('reader-close').click()
    await expect(page.getByTestId('storybook')).toBeVisible()
    await page.goto(`${lang}/app/library/`)
    await expect(page.getByTestId('continue')).toBeVisible()

    // Film: poster first, plays, captions on in the language of the story, controls labelled in the site language.
    await page.goto(`${lang}/app/story/sample-b/watch`)
    const video = page.getByTestId('film-video')
    await expect(video).toBeVisible()
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime), { timeout: 15_000 }).toBeGreaterThan(1.5)
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.textTracks[0]?.mode)).toBe('showing')
    const cue = await video.evaluate((v: HTMLVideoElement) => v.textTracks[0]?.activeCues?.[0] && (v.textTracks[0].activeCues[0] as VTTCue).text)
    if (cue) expect(cue).toMatch(lang === 'ar' ? /[؀-ۿ]/ : /[a-z]/i)
    await expect(page.getByTestId('film-captions')).toBeVisible()
    await noSideScroll(page)
    await shot(page, info, `film-${lang}`)
    await page.getByTestId('film-captions').click()
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.textTracks[0]?.mode)).not.toBe('showing')
    await page.getByTestId('film-captions').click()

    // Activity: complete, and "We did it!" is saved.
    await page.goto(`${lang}/app/story/sample-b/do`)
    await expect(page.getByTestId('activity-materials').locator('li')).toHaveCount(4)
    await expect(page.getByTestId('activity-steps').locator('li')).toHaveCount(3)
    await expect(page.getByTestId('activity-safety')).toBeVisible()
    await page.getByTestId('activity-did-it').click()
    await expect(page.getByTestId('activity-done')).toContainText('Noor')
    await noSideScroll(page)
    await shot(page, info, `activity-${lang}`)
    await page.goto(`${lang}/app/story/sample-b/`)
    await expect(page.getByTestId('story-progress')).toContainText(s.doors.progressDone)

    // Collections: stories; films play in place; activities open in place; each links to its storybook.
    await page.goto(`${lang}/app/collections/stories`)
    await expect(page.getByTestId('collection-item').first()).toBeVisible()
    await noSideScroll(page)
    await shot(page, info, `collection-stories-${lang}`)
    await page.getByTestId('tab-films').click()
    await expect(page.getByTestId('collections')).toHaveAttribute('data-kind', 'films')
    const film = page.getByTestId('collection-item').filter({ has: page.getByTestId('play-here') }).first()
    await film.getByTestId('play-here').click()
    await expect(film.getByTestId('film-video')).toBeVisible()
    await expect.poll(() => film.getByTestId('film-video').evaluate((v: HTMLVideoElement) => v.currentTime), { timeout: 15_000 }).toBeGreaterThan(0.5)
    await shot(page, info, `collection-films-${lang}`)
    await page.getByTestId('tab-activities').click()
    const act = page.getByTestId('collection-item').filter({ has: page.getByTestId('open-here') }).first()
    await act.getByTestId('open-here').click()
    await expect(act.getByTestId('activity')).toBeVisible()
    await shot(page, info, `collection-activities-${lang}`)
    await page.getByTestId('filter-6-8').click()
    await expect(page.getByTestId('collection-item').first()).toHaveAttribute('data-state', 'locked')
    await page.getByTestId('filter-4-5').click()
    await page.getByTestId('collection-item').first().getByTestId('to-storybook').click()
    await expect(page.getByTestId('storybook')).toBeVisible()
    expect(errors).toEqual([])
  })
}

test('reduced motion: the book without the curl has the same features', async ({ browser }, info) => {
  const page = await browser.newPage({ reducedMotion: 'reduce', viewport: info.project.name === 'phone' ? { width: 390, height: 844 } : { width: 1440, height: 900 } })
  const errors = watchErrors(page)
  await page.addInitScript(() => void ((window as unknown as { __storytimeListenRate: number }).__storytimeListenRate = 6))
  await newFamily(page, 'en', `reduced-${info.project.name}@example.test`)
  await page.goto('en/app/library/')
  await expect(page.getByTestId('story-list')).toBeVisible() // the list is the default with reduced motion
  await page.goto('en/app/story/sample-b/read?listen=1')
  await expect(reader(page)).toHaveAttribute('data-mode', 'flat')
  await expect(page.locator('canvas')).toHaveCount(0)
  await voiceStarts(page, 'en', info)
  await expect(reader(page)).toHaveAttribute('data-page-no', '2', { timeout: 30_000 }) // auto-flip turned the page
  await page.getByTestId('page-back').click()
  await expect(reader(page)).toHaveAttribute('data-playing', 'false')
  expect(await textNotTooSmall(page)).toBeGreaterThan(0)
  await shot(page, info, 'reader-reduced-motion-en', false)
  expect(errors).toEqual([])
  await page.close()
})

test('the built public pages carry no story text', async ({}, info) => {
  test.skip(info.project.name !== 'desktop', 'checks files once')
  const root = join(process.env.BUILD_DIR || 'build', 'client') // the build being served (BUILD_DIR, as scripts/serve.mjs)
  const html: string[] = []
  const walk = (dir: string) => {
    for (const f of readdirSync(dir)) {
      const p = join(dir, f)
      if (statSync(p).isDirectory()) walk(p)
      else if (p.endsWith('.html')) html.push(readFileSync(p, 'utf8'))
    }
  }
  walk(root)
  expect(html.length).toBeGreaterThan(10)
  const stories = 'content/stories'
  const needles: string[] = []
  for (const id of readdirSync(stories)) {
    for (const lang of ['ar', 'he', 'en', 'da']) {
      try {
        const j = JSON.parse(readFileSync(`${stories}/${id}/${lang}.json`, 'utf8')) as { pages: { text: string }[] }
        // The one excerpt the plan allows in public (Stage 8, "shown by opening a real book"): page 5 of A04 on the
        // landing page (src/i18n/<lang>/landing.ts, kept identical by tests/landing.test.ts). Every other page stays out.
        j.pages.forEach((p, i) => (id === 'a04' && i === 4 ? null : needles.push(p.text.slice(0, 40))))
      } catch {
        /* a folder still being written */
      }
    }
  }
  expect(needles.length).toBeGreaterThan(50)
  for (const page of html) for (const n of needles) expect(page.includes(n), n).toBe(false)
})
