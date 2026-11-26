import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page, type TestInfo } from '@playwright/test'
import { dirOf } from '../src/i18n/config.ts'
import ar from '../src/i18n/ar/index.ts'
import en from '../src/i18n/en/index.ts'
import { PUBLIC_PAGES } from '../src/seo/paths.ts'

/**
 * Accessibility audit (launch readiness, 26 Nov 2026). axe-core 4.14.0 with the WCAG 2.0, 2.1 and 2.2 A and AA rules
 * plus axe's best practices, on every public page type, the not-found page and the main signed-in screens, in
 * English and Arabic, at 390 px (phone) and 1440 px (desktop). Each screen must have no violations; the raw results
 * are kept in qa/out/a11y/. Keyboard walks: skip link, visible focus on everything Tab reaches, no positive tabindex,
 * sign-up and the reader by keyboard alone. Added at the integration of 26 Nov 2026: the classroom-mode screens
 * (storybook, library, book, film, activity) and the owner's messages, refunds and prices screens.
 */
const DICTS = { en, ar } as const
type L = keyof typeof DICTS
const OUT = 'qa/out/a11y'
mkdirSync(OUT, { recursive: true })
test.describe.configure({ timeout: 300_000 })
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']

type Found = { id: string; impact: string | null | undefined; help: string; targets: string[]; html: string[]; why: string[] }

/**
 * Runs axe and the touch-target check on the page as it is now; records the result and fails softly, so one run lists
 * every screen's faults.
 */
async function audit(page: Page, info: TestInfo, name: string) {
  await page.waitForLoadState('networkidle')
  const r = await new AxeBuilder({ page }).withTags(TAGS).analyze()
  const found: Found[] = r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, targets: v.nodes.slice(0, 6).map((n) => n.target.join(' ')), html: v.nodes.slice(0, 3).map((n) => n.html.slice(0, 240)), why: v.nodes.slice(0, 3).map((n) => n.failureSummary ?? '') }))
  const small = await smallTargets(page)
  writeFileSync(`${OUT}/${name}-${info.project.name}.json`, JSON.stringify({ url: page.url(), violations: found, smallTargets: small, incomplete: r.incomplete.map((v) => v.id) }, null, 2))
  expect.soft(found, `${name} (${info.project.name})`).toEqual([])
  expect.soft(small, `touch targets under 44 px: ${name} (${info.project.name})`).toEqual([])
}

/**
 * Touch targets under 44 x 44 CSS px (the project's bar; WCAG 2.2 AA asks 24). Exempt, as in WCAG: a link inside a
 * sentence. A tick box or radio counts together with its label (the label is part of the target).
 */
async function smallTargets(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const out: string[] = []
    const sel = 'a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=switch], [role=tab], [tabindex="0"]'
    for (const el of Array.from(document.querySelectorAll<HTMLElement>(sel))) {
      const r0 = el.getBoundingClientRect()
      const st = getComputedStyle(el)
      if (st.visibility === 'hidden' || st.display === 'none') continue
      if (el.closest('[aria-hidden="true"], .sr-only, [inert]')) continue
      let r = { w: r0.width, h: r0.height }
      if (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')) {
        const label = el.closest('label') ?? (el.id ? document.querySelector<HTMLElement>(`label[for="${el.id}"]`) : null)
        if (label) {
          const l = label.getBoundingClientRect()
          r = { w: Math.max(l.width, r0.width), h: Math.max(l.height, r0.height) }
        }
      }
      if (r.w === 0 && r.h === 0) continue // not shown (e.g. the skip link before focus)
      if (el.tagName === 'A') {
        const block = el.closest('p, li, dd, td, th')
        const own = el.textContent?.trim() ?? ''
        if (block && (block.textContent?.trim() ?? '').length > own.length + 1) continue // a link inside a sentence
      }
      if (r.w < 44 - 0.5 || r.h < 44 - 0.5) out.push(`${el.tagName.toLowerCase()} "${(el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 30)}" ${Math.round(r.w)}x${Math.round(r.h)}`)
    }
    return out
  })
}

/** The document says which language and direction it is in (also on client-only pages). */
async function langDir(page: Page, lang: L) {
  await expect(page.locator('html')).toHaveAttribute('lang', lang)
  await expect(page.locator('html')).toHaveAttribute('dir', dirOf(lang))
}

async function passGate(page: Page) {
  const input = page.getByTestId('gate-answer')
  await page.waitForLoadState('networkidle')
  if (!(await input.isVisible())) return
  await input.fill(String(Number(await input.getAttribute('data-a')) * Number(await input.getAttribute('data-b'))))
  await input.press('Enter')
  await expect(input).toHaveCount(0)
}

/** Sign up, confirm, onboard a 4-5 profile and start the trial (audits each step on the way). */
async function newFamily(page: Page, info: TestInfo, lang: L, email: string) {
  const d = DICTS[lang]
  const t = d.account.auth
  await page.goto(`${lang}/sign-up/`)
  // The form with its error messages showing.
  await page.getByRole('button', { name: t.submitSignUp, exact: true }).click()
  await audit(page, info, `${lang}-sign-up-errors`)
  await page.getByLabel(t.roleParent).check()
  await page.getByLabel(t.email, { exact: true }).fill(email)
  await page.getByLabel(t.password, { exact: true }).fill('a long test password')
  await page.getByLabel(t.adultCheck).check()
  await page.getByLabel(t.termsCheck).check()
  await page.getByRole('button', { name: t.submitSignUp, exact: true }).click()
  await expect(page.getByTestId('test-email-link')).toBeVisible()
  await audit(page, info, `${lang}-check-email`)
  await page.getByTestId('test-email-link').click()
  await expect(page.getByTestId('onboarding-step-1')).toBeVisible()
  await langDir(page, lang)
  await audit(page, info, `${lang}-onboarding-1`)
  await page.getByRole('button', { name: d.actions.next }).click()
  await page.getByLabel(d.commerce.groups['4-5']).click()
  await page.getByLabel(d.account.onboarding.childName).fill('Noor')
  await audit(page, info, `${lang}-onboarding-2`)
  await page.getByRole('button', { name: d.actions.next }).click()
  await audit(page, info, `${lang}-onboarding-3`)
  await page.getByRole('button', { name: d.account.onboarding.trialStart }).click()
  await expect(page.getByTestId('storybook')).toHaveAttribute('data-state', 'open')
}

/** A 4-5 pass in the test-mode database, so the sample story with test recordings and a test film opens. */
async function grantPass(page: Page, email: string) {
  await page.evaluate((email) => {
    const db = JSON.parse(localStorage.getItem('storytime.local.v1')!)
    const u = db.users.find((x: { email: string }) => x.email === email)
    const now = Date.now()
    db.passes.push({ id: crypto.randomUUID(), accountId: u.id, orderId: null, ageGroup: '4-5', months: 1, startsAt: new Date(now - 60_000).toISOString(), endsAt: new Date(now + 30 * 86_400_000).toISOString(), status: 'active', cancelledAt: null })
    localStorage.setItem('storytime.local.v1', JSON.stringify(db))
  }, email)
}

for (const lang of ['en', 'ar'] as const) {
  test(`axe (${lang}): every public page type and the not-found page`, async ({ page }, info) => {
    for (const p of [...PUBLIC_PAGES, 'no-such-page']) {
      const res = await page.goto(`${lang}/${p ? `${p}/` : ''}`)
      expect(res?.status()).toBeLessThan(500)
      await expect(page.locator('h1').first()).toBeVisible()
      await langDir(page, lang)
      await audit(page, info, `${lang}-${p.replace(/\//g, '-') || 'home'}`)
    }
    // An address under no language at all.
    await page.goto('xx/')
    await expect(page.getByTestId('not-found')).toBeVisible()
    await audit(page, info, `${lang}-no-language-404`)
  })

  test(`axe (${lang}): the signed-in screens`, async ({ page }, info) => {
    const email = `a11y-${lang}-${info.project.name}@example.test`
    await newFamily(page, info, lang, email)
    await langDir(page, lang)
    await audit(page, info, `${lang}-storybook`)

    await page.goto(`${lang}/app/library/`)
    await expect(page.getByTestId('access-panel')).toBeVisible()
    await audit(page, info, `${lang}-library`)
    if (await page.getByTestId('view-list').isVisible()) {
      await page.getByTestId('view-list').click()
      await audit(page, info, `${lang}-library-list`)
    }

    await page.goto(`${lang}/app/story/b02/read?book=flat`)
    await expect(page.getByTestId('reader')).toHaveAttribute('data-mode', 'flat')
    await audit(page, info, `${lang}-reader-cover`)
    await page.getByTestId('page-forward').click()
    await expect(page.getByTestId('page-text').first()).toBeVisible()
    await audit(page, info, `${lang}-reader-page`)

    await page.goto(`${lang}/app/story/b02/watch`)
    await expect(page.locator('h1').first()).toBeVisible()
    await audit(page, info, `${lang}-film-soon`)
    await page.goto(`${lang}/app/story/b02/do`)
    await expect(page.locator('h1').first()).toBeVisible()
    await audit(page, info, `${lang}-activity`)

    // The sample story has test recordings and a test film: the real player and the Listen controls.
    await grantPass(page, email)
    await page.goto(`${lang}/app/story/sample-b/watch`)
    await expect(page.locator('media-controller, video').first()).toBeAttached()
    await audit(page, info, `${lang}-film-player`)
    await page.goto(`${lang}/app/story/sample-b/read?book=flat`)
    await expect(page.getByTestId('reader')).toHaveAttribute('data-mode', 'flat')
    await page.getByTestId('page-forward').click()
    await audit(page, info, `${lang}-reader-listen`)

    await page.goto(`${lang}/app/collections/`)
    await expect(page.locator('h1').first()).toBeVisible()
    await audit(page, info, `${lang}-collections`)

    await page.goto(`${lang}/app/settings/`)
    await expect(page.getByTestId('gate-answer').or(page.getByTestId('profiles')).first()).toBeVisible()
    await audit(page, info, `${lang}-parent-gate`)
    await passGate(page)
    await expect(page.getByTestId('profiles')).toBeVisible()
    await audit(page, info, `${lang}-settings`)

    await page.goto(`${lang}/app/plans/`)
    await passGate(page)
    await expect(page.getByTestId('plan-3')).toBeVisible()
    await audit(page, info, `${lang}-app-plans`)
    await page.getByTestId('plan-3').getByRole('link').click()
    await passGate(page)
    await expect(page.getByTestId('checkout-summary')).toBeVisible()
    await audit(page, info, `${lang}-checkout`)
  })
}

/** A teacher (kindergarten staff) with a 4-5 class profile and the trial started (lands on B02's storybook page). */
async function newTeacher(page: Page, lang: L, email: string) {
  const d = DICTS[lang]
  const t = d.account.auth
  await page.goto(`${lang}/sign-up/`)
  await page.getByLabel(t.roleTeacher).check()
  await page.getByLabel(t.email, { exact: true }).fill(email)
  await page.getByLabel(t.password, { exact: true }).fill('a long test password')
  await page.getByLabel(t.adultCheck).check()
  await page.getByLabel(t.termsCheck).check()
  await page.getByRole('button', { name: t.submitSignUp, exact: true }).click()
  await page.getByTestId('test-email-link').click()
  await expect(page.getByTestId('onboarding-step-1')).toBeVisible()
  await page.getByRole('button', { name: d.actions.next }).click()
  await page.getByLabel(d.commerce.groups['4-5']).click()
  await page.getByLabel(d.account.onboarding.className).fill('Sunflowers')
  await page.getByRole('button', { name: d.actions.next }).click()
  await page.getByRole('button', { name: d.account.onboarding.trialStart }).click()
  await expect(page.getByTestId('storybook')).toHaveAttribute('data-state', 'open')
}

/** The owner signed in, with two contact messages, a cancelled pass waiting for its refund and a public request. */
async function seedOwner(page: Page, lang: L) {
  await page.goto(`${lang}/`)
  const hash = createHash('sha256').update('e2e:a long test password').digest('hex')
  await page.evaluate(([hash, lang]) => {
    const ago = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString()
    localStorage.setItem('storytime.local.v1', JSON.stringify({
      version: 1,
      users: [
        { id: 'owner-a11y', email: 'owner@example.test', salt: 'e2e', hash, confirmedAt: ago(100), createdAt: ago(100) },
        { id: 'family-a11y', email: 'family@example.test', salt: 'e2e', hash, confirmedAt: ago(90), createdAt: ago(90) },
      ],
      profiles: {
        'owner-a11y': { role: 'owner', language: lang, storyLanguage: null, onboardedAt: ago(100), createdAt: ago(100) },
        'family-a11y': { role: 'parent', language: 'he', storyLanguage: null, onboardedAt: ago(90), createdAt: ago(90) },
      },
      learners: [], consents: [], trials: [],
      orders: [{ id: 'order-a11y', accountId: 'family-a11y', ageGroup: '6-8', months: 3, amountAgorot: 4990, priceWasPlaceholder: false, provider: 'test', status: 'paid', createdAt: ago(50), paidAt: ago(50), termsVersion: 'x' }],
      payments: [],
      passes: [{ id: 'pass-a11y', accountId: 'family-a11y', orderId: 'order-a11y', ageGroup: '6-8', months: 3, startsAt: ago(50), endsAt: ago(-2000), status: 'cancelled', cancelledAt: ago(20) }],
      refunds: [{ id: 'refund-a11y', orderId: 'order-a11y', passId: 'pass-a11y', amountAgorot: 4990, feeAgorot: null, status: 'requested', requestedAt: ago(20) }],
      providerEvents: [],
      cancellationRequests: [{ id: 'req-a11y', email: 'someone@example.test', orderRef: 'ORDER-2041', message: 'I bought by mistake.', createdAt: ago(10) }],
      contactMessages: [
        { id: 'msg-old', name: null, email: 'old@example.test', lang: 'ar', message: 'مرحبًا، هل القصص متاحة بالعربية الفصحى؟', createdAt: ago(30) },
        { id: 'msg-new', name: 'Dana Levi', email: 'dana@example.test', lang: 'en', message: 'Hello!\nCan a teacher use one pass for a whole class?', createdAt: ago(2) },
      ],
      outbox: [], tokens: [], deletionRequests: [], failedSignIns: {}, progress: [],
    }))
    localStorage.setItem('storytime.local.session', JSON.stringify({ userId: 'owner-a11y', email: 'owner@example.test' }))
  }, [hash, lang] as const)
}

for (const lang of ['en', 'ar'] as const) {
  test(`axe (${lang}): classroom mode screens`, async ({ page }, info) => {
    const email = `a11y-class-${lang}-${info.project.name}@example.test`
    await newTeacher(page, lang, email)
    await page.getByTestId('classroom-switch').click()
    await expect(page.getByTestId('classroom-bar')).toBeVisible()
    await langDir(page, lang)
    await audit(page, info, `${lang}-classroom-storybook`)

    await page.goto(`${lang}/app/library/`)
    await expect(page.getByTestId('library')).toBeVisible()
    await expect(page.getByTestId('classroom-bar')).toBeVisible()
    await audit(page, info, `${lang}-classroom-library`)

    await page.goto(`${lang}/app/story/b02/read?book=flat&page=1`)
    await expect(page.getByTestId('reader')).toHaveAttribute('data-classroom', 'on')
    await expect(page.getByTestId('page-text').first()).toBeVisible()
    await audit(page, info, `${lang}-classroom-book`)

    await grantPass(page, email)
    await page.goto(`${lang}/app/story/sample-b/watch`)
    await expect(page.getByTestId('film-video')).toBeVisible()
    await expect(page.getByTestId('classroom-bar')).toBeVisible()
    await audit(page, info, `${lang}-classroom-film`)

    await page.goto(`${lang}/app/story/b02/do`)
    await expect(page.getByTestId('class-stage')).toBeVisible()
    await audit(page, info, `${lang}-classroom-activity-ready`)
    await page.getByTestId('class-step-forward').filter({ visible: true }).click()
    await expect(page.getByTestId('class-card-1')).toBeVisible()
    await audit(page, info, `${lang}-classroom-activity-step`)
  })

  test(`axe (${lang}): the owner's messages, refunds and prices screens`, async ({ page }, info) => {
    await seedOwner(page, lang)
    for (const p of ['messages', 'refunds', 'prices'] as const) {
      await page.goto(`${lang}/app/owner/${p}/`)
      await expect(page.getByTestId(`owner-${p}`)).toBeVisible()
      await langDir(page, lang)
      await audit(page, info, `${lang}-owner-${p}`)
    }
  })
}

/** Everything Tab reaches, in order: visible focus ring, never a positive tabindex, never hidden. */
async function tabWalk(page: Page, max = 80) {
  expect(await page.locator('[tabindex]:not([tabindex="0"]):not([tabindex="-1"])').count()).toBe(0)
  const seen: string[] = []
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab')
    const f = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null
      if (!el || el === document.body) return null
      const hasRing = (e: Element) => {
        const s = getComputedStyle(e)
        return (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2) || (s.boxShadow !== 'none' && s.boxShadow !== '')
      }
      const r = el.getBoundingClientRect()
      // A radio choice draws its ring on the whole label (controls.tsx Choice); that counts.
      const label = el instanceof HTMLInputElement && (el.type === 'radio' || el.type === 'checkbox') ? el.closest('label') : null
      const ring = hasRing(el) || (!!label && hasRing(label))
      const name = el.getAttribute('aria-label') ?? el.textContent?.trim().slice(0, 40) ?? ''
      return { key: `${el.tagName}${el instanceof HTMLInputElement ? `[${el.type}]` : ''}:${name}:${el.getAttribute('href') ?? el.getAttribute('name') ?? ''}`, ring, visible: r.width > 0 && r.height > 0 }
    })
    if (!f) break
    if (seen.includes(f.key) && seen[0] === f.key) break // wrapped round
    expect.soft(f.ring, `focus ring on ${f.key}`).toBe(true)
    expect.soft(f.visible, `focused element is visible: ${f.key}`).toBe(true)
    seen.push(f.key)
  }
  return seen
}

for (const lang of ['en', 'ar'] as const) {
  test(`keyboard (${lang}): skip link first, visible focus on every stop of the public pages`, async ({ page }) => {
    for (const p of ['', 'plans', 'sign-up', 'contact', 'legal/privacy', 'no-such-page']) {
      await page.goto(`${lang}/${p ? `${p}/` : ''}`)
      await page.waitForLoadState('networkidle')
      await page.keyboard.press('Tab')
      await expect(page.getByRole('link', { name: DICTS[lang].common.skipToContent })).toBeFocused()
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(/#main$/)
      await page.goto(`${lang}/${p ? `${p}/` : ''}`)
      await page.waitForLoadState('networkidle')
      const stops = await tabWalk(page)
      expect(stops.length).toBeGreaterThan(3)
    }
  })

  test(`keyboard (${lang}): sign up and read a story without a mouse`, async ({ page }, info) => {
    const d = DICTS[lang]
    const t = d.account.auth
    await page.goto(`${lang}/sign-up/`)
    await page.waitForLoadState('networkidle')
    // Reach the role choice by Tab only, then fill each field from the keyboard.
    for (let i = 0; i < 60 && !(await page.getByLabel(t.roleParent).evaluate((el) => el === document.activeElement)); i++) await page.keyboard.press('Tab')
    await page.keyboard.press('Space')
    await expect(page.getByLabel(t.roleParent)).toBeChecked()
    await page.getByLabel(t.email, { exact: true }).focus()
    await page.keyboard.type(`kbd-${lang}-${info.project.name}@example.test`)
    await page.keyboard.press('Tab')
    await page.keyboard.type('a long test password')
    for (const label of [t.adultCheck, t.termsCheck]) {
      await page.getByLabel(label).focus()
      await page.keyboard.press('Space')
      await expect(page.getByLabel(label)).toBeChecked()
    }
    await page.getByRole('button', { name: t.submitSignUp, exact: true }).focus()
    await page.keyboard.press('Enter')
    await page.getByTestId('test-email-link').focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('onboarding-step-1')).toBeVisible()
    await page.getByRole('button', { name: d.actions.next }).focus()
    await page.keyboard.press('Enter')
    await page.getByLabel(d.commerce.groups['4-5']).focus()
    await page.keyboard.press('Space')
    await page.getByLabel(d.account.onboarding.childName).focus()
    await page.keyboard.type('Noor')
    await page.getByRole('button', { name: d.actions.next }).focus()
    await page.keyboard.press('Enter')
    await page.getByRole('button', { name: d.account.onboarding.trialStart }).focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('storybook')).toHaveAttribute('data-state', 'open')

    // The reader: forward and back from the keyboard, focus stays visible.
    await page.goto(`${lang}/app/story/b02/read?book=flat`)
    await expect(page.getByTestId('reader')).toHaveAttribute('data-mode', 'flat')
    await page.getByTestId('page-forward').focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('page-text').first()).toBeVisible()
    await page.keyboard.press('Enter')
    const stops = await tabWalk(page, 40)
    expect(stops.length).toBeGreaterThan(2)
  })
}
