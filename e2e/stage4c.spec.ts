import { mkdirSync } from 'node:fs'
import { expect, test, type Page, type TestInfo } from '@playwright/test'
import ar from '../src/i18n/ar/index.ts'
import en from '../src/i18n/en/index.ts'

/**
 * Stage 4, part C against the built site (local test-mode backend), at 390 px and 1440 px: all 45 stories in their
 * age groups with the three picked trial stories, every group's story read to the end in Arabic and English with
 * marked placeholder pictures, the honest Listen and Watch doors, the activity with its print view, favourites
 * ("my shelf"), the "1 of 3 opened" trial counter, settings that follow the account, and the email change.
 */
const DICTS = { en, ar } as const
type L = keyof typeof DICTS
const SHOTS = 'qa/out/stage4c'
mkdirSync(SHOTS, { recursive: true })
test.describe.configure({ timeout: 240_000 })

function watchErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => m.type() === 'error' && !/Failed to load resource/.test(m.text()) && errors.push(m.text()))
  return errors
}
const shot = (page: Page, info: TestInfo, name: string, fullPage = true) => page.screenshot({ path: `${SHOTS}/${name}-${info.project.name}.png`, fullPage })
const noSideScroll = async (page: Page) => expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false)

/** Answers the parent gate if it shows (it holds for 10 minutes in a tab). */
async function passGate(page: Page, behind = page.getByTestId('profiles')) {
  const input = page.getByTestId('gate-answer')
  await expect(input.or(behind).first()).toBeVisible()
  if (!(await input.isVisible())) return
  await input.fill(String(Number(await input.getAttribute('data-a')) * Number(await input.getAttribute('data-b'))))
  await input.press('Enter')
}

/** Sign up, confirm, onboard a 4-5 profile and start the trial (as a parent would). */
async function newFamily(page: Page, lang: L, email: string) {
  const d = DICTS[lang]
  const t = d.account.auth
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
  await page.getByLabel(d.account.onboarding.childName).fill('Noor')
  await page.getByRole('button', { name: d.actions.next }).click()
  await page.getByRole('button', { name: d.account.onboarding.trialStart }).click()
  await expect(page.getByTestId('storybook')).toHaveAttribute('data-state', 'open')
}

/** A pass for another age group in the test-mode database (buying one is walked through in account.spec.ts). */
async function grantPass(page: Page, email: string, group: string) {
  await page.evaluate(({ email, group }) => {
    const db = JSON.parse(localStorage.getItem('storytime.local.v1')!)
    const u = db.users.find((x: { email: string }) => x.email === email)
    const now = Date.now()
    db.passes.push({ id: crypto.randomUUID(), accountId: u.id, orderId: null, ageGroup: group, months: 1, startsAt: new Date(now - 60_000).toISOString(), endsAt: new Date(now + 30 * 86_400_000).toISOString(), status: 'active', cancelledAt: null })
    localStorage.setItem('storytime.local.v1', JSON.stringify(db))
  }, { email, group })
}

/** Opens a story in the flat book and turns every page to the end; each page shows words and a marked placeholder. */
async function readToTheEnd(page: Page, lang: L, id: string, info: TestInfo) {
  await page.goto(`${lang}/app/story/${id}/read?book=flat`)
  const reader = page.getByTestId('reader')
  await expect(reader).toHaveAttribute('data-mode', 'flat')
  // The reader saves the page after half a second on it (progress, and the trial counter).
  await page.waitForTimeout(800)
  let turns = 0
  while (!(await page.getByTestId('end-page').isVisible())) {
    if (turns > 0) {
      await expect(page.getByTestId('page-text').first()).toBeVisible()
      for (const t of await page.getByTestId('page-text').all()) expect((await t.innerText()).trim().length).toBeGreaterThan(0)
      await expect(page.getByTestId('art-placeholder').first()).toContainText(DICTS[lang].stories.placeholder.picture)
    }
    if (turns === 2) await shot(page, info, `read-${id}-${lang}`, false)
    await page.getByTestId('page-forward').click()
    await page.waitForTimeout(turns < 2 ? 800 : 150) // a page shown for half a second is saved as read
    turns++
    expect(turns).toBeLessThan(25)
  }
  return turns
}

for (const lang of ['en', 'ar'] as const) {
  test(`all stories (${lang}): three age groups, trial picks, a story per group read to the end, doors, activity`, async ({ page }, info) => {
    const errors = watchErrors(page)
    const d = DICTS[lang]
    const email = `c-${lang}-${info.project.name}@example.test`
    await newFamily(page, lang, email)

    // The library: 4-5 first (the profile's group), its three trial stories open and first, 15 real stories.
    await page.goto(`${lang}/app/library/`)
    await page.getByTestId('view-list').click()
    const items = page.getByTestId('story-list').locator('a')
    await expect(items.first()).toBeVisible()
    await expect(items.and(page.locator('[data-state="open"]'))).toHaveCount(3)
    for (const [i, id] of ['b02', 'b01', 'b09'].entries()) await expect(items.nth(i)).toHaveAttribute('href', new RegExp(`/story/${id}/$`))
    await expect(items.filter({ has: page.getByTestId('cover-placeholder') })).not.toHaveCount(0)
    await expect(page.getByTestId('trial-opened')).toContainText(lang === 'en' ? '0 of 3' : '0')
    await noSideScroll(page)
    await shot(page, info, `library-4-5-${lang}`)

    // The other two groups list their own 15 stories (locked during the 4-5 trial).
    for (const [group, first] of [['2-3', 'a04'], ['6-8', 'c01']] as const) {
      await page.locator(`input[name="library-group"][value="${group}"]`).check()
      await expect(items.first()).toHaveAttribute('href', new RegExp(`/story/${first}/$`))
      expect(await items.evaluateAll((as) => as.filter((a) => /\/story\/[abc]\d\d\/$/.test((a as HTMLAnchorElement).href)).length)).toBe(15)
      await expect(items.and(page.locator('[data-state="open"]'))).toHaveCount(0)
      await shot(page, info, `library-${group}-${lang}`)
    }

    // A story from each group, read to the end (passes for the two other groups).
    await grantPass(page, email, '2-3')
    await grantPass(page, email, '6-8')
    for (const id of ['a04', 'b02', 'c01']) expect(await readToTheEnd(page, lang, id, info)).toBeGreaterThan(4)

    // The trial counter now counts the opened trial story.
    await page.goto(`${lang}/app/library/`)
    await expect(page.getByTestId('trial-opened')).toContainText(lang === 'en' ? '1 of 3' : '1')

    // Storybook page: Listen and Watch are honest (no voice, no film yet), Read and Do open.
    await page.goto(`${lang}/app/story/b02/`)
    const doors = page.getByTestId('doors')
    await expect(doors.getByTestId('door-read')).toHaveAttribute('data-state', 'open')
    await expect(doors.getByTestId('door-do')).toHaveAttribute('data-state', 'open')
    await expect(doors.getByTestId('door-listen')).toHaveAttribute('data-state', 'unavailable')
    await expect(doors.getByTestId('door-listen')).toContainText(d.stories.doors.noRecording)
    await expect(doors.getByTestId('door-watch')).toHaveAttribute('data-state', 'unavailable')
    await expect(doors.getByTestId('door-watch')).toContainText(d.stories.doors.noFilm)
    await shot(page, info, `storybook-b02-${lang}`)
    await page.goto(`${lang}/app/story/b02/watch`)
    await expect(page.getByText(d.stories.film.notReady)).toBeVisible()
    await expect(page.getByTestId('film-video')).toHaveCount(0)

    // The films collection lists planned films as "coming soon", with no player.
    await page.goto(`${lang}/app/collections/films`)
    await expect(page.getByTestId('film-soon').first()).toBeVisible()

    // Activity: text steps with marked placeholder pictures, and a print view of the activity alone.
    await page.goto(`${lang}/app/story/b02/do`)
    const steps = page.getByTestId('activity-steps').locator('li')
    await expect(steps).not.toHaveCount(0)
    await expect(steps.first().getByTestId('art-placeholder')).toContainText(d.stories.placeholder.picture)
    await expect(page.getByTestId('activity-print')).toBeVisible()
    await noSideScroll(page)
    await shot(page, info, `activity-b02-${lang}`)
    await page.emulateMedia({ media: 'print' })
    await expect(page.getByTestId('activity-print')).toBeHidden()
    await expect(page.locator('footer').first()).toHaveCSS('visibility', 'hidden')
    await expect(page.getByTestId('activity').locator('h1')).toHaveCSS('visibility', 'visible')
    await shot(page, info, `activity-print-${lang}`)
    await page.emulateMedia({ media: 'screen' })
    expect(errors).toEqual([])
  })
}

test('favourites, settings on the account, and the email change (en)', async ({ page }, info) => {
  const errors = watchErrors(page)
  const d = en
  const email = `fav-${info.project.name}@example.test`
  await newFamily(page, 'en', email)

  // My shelf: empty, then the heart on a storybook page keeps the book there, also after a reload.
  await page.goto('en/app/library/')
  await expect(page.getByTestId('my-shelf-empty')).toBeVisible()
  await page.goto('en/app/story/b05/')
  await page.getByTestId('favourite').click()
  await expect(page.getByTestId('favourite')).toHaveAttribute('data-state', 'on')
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('storytime.local.v1')!).favourites?.length ?? 0)).toBe(1)
  await page.goto('en/app/library/')
  await expect(page.getByTestId('my-shelf-book')).toHaveCount(1)
  await page.reload()
  await expect(page.getByTestId('my-shelf-book').first()).toHaveAttribute('href', /\/story\/b05\/$/)
  await shot(page, info, 'my-shelf-en')

  // Reader settings are saved with the account: cleared from this device, they come back from the account.
  await page.goto('en/app/story/b02/read?book=flat')
  await page.getByTestId('text-larger').click()
  await page.waitForTimeout(500)
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('storytime.local.v1')!).profiles)
  expect(Object.values(saved as Record<string, { prefs?: { textScale?: number } }>)[0]!.prefs?.textScale).toBe(1)
  await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('storytime.prefs.')).forEach((k) => localStorage.removeItem(k)))
  await page.reload()
  await expect.poll(() => page.evaluate(() => Object.entries(localStorage).find(([k]) => k.startsWith('storytime.prefs.'))?.[1] ?? '')).toContain('"textScale":1')

  // Email change: a link to the new address; the address changes when it is opened.
  await page.goto('en/app/settings/')
  await passGate(page)
  await page.getByTestId('change-email').click()
  await page.getByLabel(d.account.settings.newEmail).fill(`new-${email}`)
  await page.getByRole('button', { name: d.account.settings.sendEmailLink }).click()
  await expect(page.getByTestId('test-email-link')).toBeVisible()
  await shot(page, info, 'email-change-sent-en')
  await page.getByTestId('test-email-link').click()
  await expect(page.getByTestId('email-changed')).toContainText(`new-${email}`)
  await shot(page, info, 'email-changed-en')
  await page.goto('en/app/settings/')
  await passGate(page)
  await expect(page.getByText(`new-${email}`).first()).toBeVisible()
  expect(errors).toEqual([])
})
