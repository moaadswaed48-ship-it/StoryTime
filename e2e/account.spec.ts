import { mkdirSync } from 'node:fs'
import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test'
import ar from '../src/i18n/ar/index.ts'
import en from '../src/i18n/en/index.ts'

/**
 * Stage 4 part A walk-throughs against the built site with the local (test-mode) backend: a parent and a teacher,
 * in English and Arabic, from the landing page through sign-up, email confirmation, onboarding, the trial, its
 * end, and a test purchase that unlocks a pass only after the provider's callback. Runs at 390 px and 1440 px.
 * Time is moved forward with the local backend's test clock (localStorage key below), never by waiting.
 */
const DICTS = { en, ar } as const
type L = keyof typeof DICTS
const CLOCK = 'storytime.dev.clockOffsetMs'
const DAY = 86_400_000
const SHOTS = 'qa/out/stage4a'
mkdirSync(SHOTS, { recursive: true })

test.describe.configure({ timeout: 180_000 })

function watchErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => m.type() === 'error' && !/Failed to load resource/.test(m.text()) && errors.push(m.text()))
  return errors
}

async function shot(page: Page, info: TestInfo, name: string) {
  if (info.project.name !== 'phone') return
  await page.screenshot({ path: `${SHOTS}/${name}-phone.png`, fullPage: true })
}

async function noSideScroll(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false)
}

async function setClock(page: Page, ms: number) {
  await page.evaluate(([k, v]) => localStorage.setItem(k, String(v)), [CLOCK, ms] as const)
}

/** Waits for either the parent gate or the page behind it, and answers the gate if it is the one showing. */
async function passGate(page: Page, behind: Locator) {
  const input = page.getByTestId('gate-answer')
  await expect(input.or(behind).first()).toBeVisible()
  if (!(await input.isVisible())) return
  const a = Number(await input.getAttribute('data-a'))
  const b = Number(await input.getAttribute('data-b'))
  await input.fill(String(a * b))
  await input.press('Enter')
}

async function signUp(page: Page, lang: L, role: 'parent' | 'teacher', email: string, info: TestInfo) {
  const d = DICTS[lang]
  const t = d.account.auth
  await page.goto(`${lang}/`)
  await page.getByRole('link', { name: d.commerce.plans.trialCta }).first().click()
  await expect(page).toHaveURL(new RegExp(`/${lang}/sign-up/$`))
  await expect(page.locator('html')).toHaveAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr')

  // Submitting empty shows every error at once, beside its field.
  await page.getByRole('button', { name: t.submitSignUp, exact: true }).click()
  await expect(page.getByText(d.account.errors.invalidEmail)).toBeVisible()
  await expect(page.getByText(d.account.errors.weakPassword)).toBeVisible()
  await expect(page.getByText(d.account.errors.mustAccept)).toHaveCount(2)
  if (role === 'parent') await shot(page, info, `sign-up-errors-${lang}`)

  // The news box is never pre-ticked.
  await expect(page.getByLabel(t.marketingCheck)).not.toBeChecked()
  await page.getByLabel(role === 'parent' ? t.roleParent : t.roleTeacher).check()
  await page.getByLabel(t.email, { exact: true }).fill(email)
  await page.getByLabel(t.password, { exact: true }).fill('a long test password')
  await expect(page.getByText(t.strength.strong)).toBeVisible()
  await page.getByLabel(t.adultCheck).check()
  await page.getByLabel(t.termsCheck).check()
  await noSideScroll(page)
  if (role === 'parent') await shot(page, info, `sign-up-${lang}`)
  await page.getByRole('button', { name: t.submitSignUp, exact: true }).click()

  // "Check your email" names the address; in test mode the link is shown instead of sent.
  await expect(page.getByRole('heading', { name: t.checkTitle })).toBeVisible()
  await expect(page.getByText(email)).toBeVisible()
  await page.getByTestId('test-email-link').click()
}

async function onboard(page: Page, lang: L, role: 'parent' | 'teacher', info: TestInfo) {
  const d = DICTS[lang]
  const o = d.account.onboarding
  await expect(page.getByTestId('onboarding-step-1')).toBeVisible()
  await expect(page.getByText(o.stepOf.replace('{n}', '1').replace('{total}', '4'))).toBeVisible()
  await page.getByRole('button', { name: d.actions.next }).click()
  await expect(page.getByTestId('onboarding-step-2')).toBeVisible()
  await page.getByLabel(d.commerce.groups['4-5']).click()
  await expect(page.getByTestId('onboarding-step-3')).toBeVisible()
  await expect(page.getByRole('heading', { name: role === 'teacher' ? o.classTitle : o.childTitle })).toBeVisible()
  await page.getByLabel(role === 'teacher' ? o.className : o.childName).fill(role === 'teacher' ? 'Sunflowers' : 'Noor')
  if (role === 'parent') await shot(page, info, `onboarding-profile-${lang}`)
  await page.getByRole('button', { name: d.actions.next }).click()
  await expect(page.getByTestId('onboarding-step-4')).toBeVisible()
  await expect(page.getByTestId('trial-stories').locator('li')).toHaveCount(3)
  await noSideScroll(page)
  await shot(page, info, `onboarding-trial-${lang}-${role}`)
  await page.getByRole('button', { name: o.trialStart }).click()
  // Onboarding ends on the storybook page of the first trial story: its four doors, open.
  await expect(page.getByTestId('storybook')).toHaveAttribute('data-state', 'open')
  await expect(page.getByTestId('doors').locator('li')).toHaveCount(4)
}

async function library(page: Page, lang: L) {
  await page.goto(`${lang}/app/library/`)
  // The library opens on the bookshelf; the list view (same books) is one tap away and is what these checks count.
  await expect(page.getByTestId('view-list')).toBeVisible()
  if (!(await page.getByTestId('story-list').isVisible())) await page.getByTestId('view-list').click()
  await expect(page.getByTestId('story-list')).toBeVisible()
  return page.getByTestId('story-list').locator('a')
}

async function buyThreeMonths(page: Page, lang: L, fromPublicPlans: boolean, info: TestInfo, tag: string) {
  const d = DICTS[lang]
  const c = d.commerce
  if (fromPublicPlans) await page.goto(`${lang}/plans/`)
  else await page.getByRole('link', { name: c.access.seePasses }).first().click()
  await passGate(page, page.getByTestId('plan-3'))
  await page.getByTestId('plan-3').getByRole('link').click()
  await passGate(page, page.getByTestId('checkout-summary'))
  await expect(page.getByText(c.checkout.testBadge)).toBeVisible()
  // Paying without the terms box is refused.
  await page.getByRole('button', { name: c.checkout.pay }).click()
  await expect(page.getByText(d.account.errors.mustAccept)).toBeVisible()
  await page.getByLabel(c.checkout.termsCheck).check()
  await shot(page, info, `checkout-${tag}`)
  await page.getByRole('button', { name: c.checkout.pay }).click()
  await expect(page.getByTestId('test-pay')).toBeVisible()
  await page.getByRole('button', { name: c.checkout.testPaySucceed, exact: true }).click()
  // The return page waits for the server callback, then confirms.
  await expect(page.getByTestId('checkout-done')).toHaveAttribute('data-status', 'paid', { timeout: 15_000 })
  await expect(page.getByText(c.checkout.successTitle)).toBeVisible()
}

for (const lang of ['en', 'ar'] as const) {
  test(`parent (${lang}): sign-up, onboarding, trial, trial end, test purchase, settings, pass end`, async ({ page }, info) => {
    const errors = watchErrors(page)
    const d = DICTS[lang]
    const a = d.commerce.access
    await signUp(page, lang, 'parent', `parent-${lang}-${info.project.name}@example.test`, info)
    await onboard(page, lang, 'parent', info)

    // During the trial: 3 stories open, the others (including a 6-8 sample also listed in 4-5) locked.
    let items = await library(page, lang)
    await expect(page.getByTestId('access-panel')).toContainText(a.trialStoriesNote)
    await expect(items.and(page.locator('[data-state="open"]'))).toHaveCount(3)
    const total = await items.count()
    expect(total).toBeGreaterThan(3)
    await items.and(page.locator('[data-state="locked"]')).last().click()
    await expect(page.getByTestId('storybook')).toHaveAttribute('data-state', 'locked')
    await expect(page.getByText(d.stories.doors.lockedTitle)).toBeVisible()
    await expect(page.getByTestId('page-text')).toHaveCount(0)

    // Trial over (4 days later): everything locks, one calm screen, profile kept.
    await setClock(page, 4 * DAY)
    items = await library(page, lang)
    await expect(page.getByText(a.trialEndedTitle)).toBeVisible()
    await expect(items.and(page.locator('[data-state="open"]'))).toHaveCount(0)
    await shot(page, info, `trial-ended-${lang}`)

    // Plans: public page screenshot, then buy from inside the app (parent gate, test checkout, server callback).
    await page.goto(`${lang}/plans/`)
    await expect(page.getByTestId('plan-1')).toContainText(d.commerce.plans.priceNotSet)
    await noSideScroll(page)
    await shot(page, info, `plans-${lang}`)
    await page.goto(`${lang}/app/library/`)
    await buyThreeMonths(page, lang, false, info, `${lang}-parent`)
    items = await library(page, lang)
    await expect(items.and(page.locator('[data-state="open"]'))).toHaveCount(total)

    // Settings (behind the gate): pass active, profile kept, news unticked.
    await page.goto(`${lang}/app/settings/`)
    await passGate(page, page.getByTestId('passes'))
    await expect(page.getByTestId('passes').locator('li')).toHaveCount(1)
    await expect(page.getByTestId('passes').locator('li').first()).toHaveAttribute('data-status', 'active')
    await expect(page.getByTestId('profiles')).toContainText('Noor')
    await expect(page.getByLabel(d.account.settings.newsCheck)).not.toBeChecked()
    await noSideScroll(page)
    await shot(page, info, `settings-${lang}`)

    // The pass ends (100 days on): its group locks again; profile and progress are kept.
    await setClock(page, 104 * DAY)
    items = await library(page, lang)
    await expect(page.getByText(a.passEndedTitle)).toBeVisible()
    await expect(items.and(page.locator('[data-state="open"]'))).toHaveCount(0)
    expect(errors).toEqual([])
  })

  test(`teacher (${lang}): sign-up, class profile, trial, trial end, test purchase from the plans page`, async ({ page }, info) => {
    const errors = watchErrors(page)
    const d = DICTS[lang]
    await signUp(page, lang, 'teacher', `teacher-${lang}-${info.project.name}@example.test`, info)
    await onboard(page, lang, 'teacher', info)
    let items = await library(page, lang)
    await expect(items.and(page.locator('[data-state="open"]'))).toHaveCount(3)
    await setClock(page, 4 * DAY)
    items = await library(page, lang)
    await expect(page.getByText(d.commerce.access.trialEndedTitle)).toBeVisible()
    await buyThreeMonths(page, lang, true, info, `${lang}-teacher`)
    items = await library(page, lang)
    await expect(items.and(page.locator('[data-state="locked"]'))).toHaveCount(0)
    await page.goto(`${lang}/app/settings/`)
    await passGate(page, page.getByTestId('profiles'))
    await expect(page.getByRole('heading', { name: d.account.settings.classesTitle })).toBeVisible()
    await expect(page.getByTestId('profiles')).toContainText('Sunflowers')
    expect(errors).toEqual([])
  })
}
