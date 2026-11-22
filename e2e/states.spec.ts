import { expect, test, type Page } from '@playwright/test'
import en from '../src/i18n/en/index.ts'
import he from '../src/i18n/he/index.ts'

/**
 * The account states from the product checklist: wrong password, email already used, unconfirmed email, expired
 * link, password reset, offline, session return, cancelling a purchase (signed in and signed out), deleted account.
 */
test.describe.configure({ timeout: 120_000 })
const t = en.account

async function passGate(page: Page) {
  const input = page.getByTestId('gate-answer')
  await expect(input).toBeVisible()
  const a = Number(await input.getAttribute('data-a'))
  const b = Number(await input.getAttribute('data-b'))
  await input.fill('1') // a wrong answer first: calm retry with a new question
  await input.press('Enter')
  await expect(page.getByText(t.gate.wrong)).toBeVisible()
  const a2 = Number(await input.getAttribute('data-a'))
  const b2 = Number(await input.getAttribute('data-b'))
  expect([a2, b2]).not.toEqual([a, b]) // a new question each time
  await input.fill(String(a2 * b2))
  await input.press('Enter')
}

/** Signs up and confirms through the test-mode link; leaves the user at onboarding step 1. */
async function confirmedUser(page: Page, email: string) {
  await page.goto('en/sign-up/')
  await page.getByLabel(t.auth.roleParent).check()
  await page.getByLabel(t.auth.email, { exact: true }).fill(email)
  await page.getByLabel(t.auth.password, { exact: true }).fill('a long test password')
  await page.getByLabel(t.auth.adultCheck).check()
  await page.getByLabel(t.auth.termsCheck).check()
  await page.getByRole('button', { name: t.auth.submitSignUp, exact: true }).click()
  await page.getByTestId('test-email-link').click()
  await expect(page.getByTestId('onboarding-step-1')).toBeVisible()
}

async function signIn(page: Page, email: string, password = 'a long test password') {
  await page.goto('en/sign-in/')
  await page.getByLabel(t.auth.email, { exact: true }).fill(email)
  await page.getByLabel(t.auth.password, { exact: true }).fill(password)
  await page.getByRole('button', { name: t.auth.submitSignIn, exact: true }).click()
}

test('unconfirmed email, then wrong password and email already used', async ({ page }) => {
  await page.goto('en/sign-up/')
  await page.getByLabel(t.auth.roleParent).check()
  await page.getByLabel(t.auth.email, { exact: true }).fill('waiting@example.test')
  await page.getByLabel(t.auth.password, { exact: true }).fill('a long test password')
  await page.getByLabel(t.auth.adultCheck).check()
  await page.getByLabel(t.auth.termsCheck).check()
  await page.getByRole('button', { name: t.auth.submitSignUp, exact: true }).click()
  await expect(page.getByRole('heading', { name: t.auth.checkTitle })).toBeVisible()
  await expect(page.getByRole('button', { name: t.auth.checkResend })).toBeDisabled() // a short wait between sends

  await signIn(page, 'waiting@example.test')
  await expect(page.getByText(t.errors.unconfirmed)).toBeVisible()
  await expect(page.getByRole('button', { name: t.auth.sendAgain })).toBeVisible()

  await signIn(page, 'waiting@example.test', 'not the password')
  await expect(page.getByText(t.errors.wrongCredentials)).toBeVisible()
  await expect(page.getByRole('link', { name: t.auth.forgot })).toBeVisible()

  await page.goto('en/sign-up/')
  await page.getByLabel(t.auth.roleParent).check()
  await page.getByLabel(t.auth.email, { exact: true }).fill('waiting@example.test')
  await page.getByLabel(t.auth.password, { exact: true }).fill('a long test password')
  await page.getByLabel(t.auth.adultCheck).check()
  await page.getByLabel(t.auth.termsCheck).check()
  await page.getByRole('button', { name: t.auth.submitSignUp, exact: true }).click()
  await expect(page.getByText(t.errors.emailTaken)).toBeVisible()
  await expect(page.getByRole('main').getByRole('link', { name: t.auth.signInLink, exact: true }).first()).toBeVisible()
})

test('an expired or used link offers a new one', async ({ page }) => {
  await page.goto('en/auth/confirm/?token=not-a-real-token')
  await expect(page.getByTestId('link-expired')).toBeVisible()
  await expect(page.getByRole('heading', { name: t.auth.linkExpiredTitle })).toBeVisible()
  await expect(page.getByRole('button', { name: t.auth.linkExpiredSend })).toBeVisible()
  await page.goto('en/auth/reset/?token=not-a-real-token')
  await expect(page.getByTestId('link-expired')).toBeVisible()
})

test('forgotten password: the same answer for any address, and the link sets a new password', async ({ page }) => {
  await confirmedUser(page, 'forgot@example.test')
  await page.evaluate(() => localStorage.removeItem('storytime.local.session'))
  await page.goto('en/forgot-password/')
  await page.getByLabel(t.auth.email, { exact: true }).fill('forgot@example.test')
  await page.getByRole('button', { name: t.auth.forgotSubmit }).click()
  await expect(page.getByText(t.auth.forgotSent.replace('{email}', 'forgot@example.test'))).toBeVisible()
  await page.getByTestId('test-email-link').click()
  await page.getByLabel(t.auth.newPassword).fill('another long password')
  await page.getByRole('button', { name: t.auth.resetSubmit }).click()
  await expect(page.getByText(t.auth.resetDone)).toBeVisible()
  await page.evaluate(() => localStorage.removeItem('storytime.local.session'))
  await signIn(page, 'forgot@example.test', 'another long password')
  await expect(page.getByTestId('onboarding-step-1')).toBeVisible()
})

test('signed out, an app page asks to sign in and returns to the same page afterwards', async ({ page }) => {
  await confirmedUser(page, 'return@example.test')
  await page.getByRole('button', { name: en.actions.next }).click()
  await page.getByLabel(en.commerce.groups['2-3']).click()
  await page.getByRole('button', { name: t.onboarding.skip }).click()
  await page.getByRole('button', { name: en.commerce.access.notNow }).click()
  await expect(page).toHaveURL(/\/en\/app\/library\/$/)
  await page.evaluate(() => localStorage.removeItem('storytime.local.session'))
  await page.goto('en/app/settings/')
  await expect(page).toHaveURL(/\/en\/sign-in\/\?next=/)
  await expect(page.getByText(t.auth.sessionExpired)).toBeVisible()
  await page.getByLabel(t.auth.email, { exact: true }).fill('return@example.test')
  await page.getByLabel(t.auth.password, { exact: true }).fill('a long test password')
  await page.getByRole('button', { name: t.auth.submitSignIn, exact: true }).click()
  await expect(page).toHaveURL(/\/en\/app\/settings\/$/)
  await passGate(page)
  await expect(page.getByRole('heading', { name: t.settings.title })).toBeVisible()
})

test('offline: a banner says so and actions explain the failure', async ({ page, context }) => {
  await page.goto('en/sign-in/', { waitUntil: 'networkidle' })
  await context.setOffline(true)
  await expect(page.getByText(t.states.offline)).toBeVisible()
  await page.getByLabel(t.auth.email, { exact: true }).fill('a@example.test')
  await page.getByLabel(t.auth.password, { exact: true }).fill('whatever password')
  await page.getByRole('button', { name: t.auth.submitSignIn, exact: true }).click()
  await expect(page.getByText(t.errors.network)).toBeVisible()
  await context.setOffline(false)
  await expect(page.getByText(t.states.offline)).toHaveCount(0)
})

test('cancel a purchase within 14 days, signed in; the public form signed out; then delete the account', async ({ page }) => {
  const c = en.commerce
  // The home page carries the cancellation link with the methods beside it.
  await page.goto('en/')
  await expect(page.getByRole('main').getByRole('link', { name: c.cancel.homeLink })).toBeVisible()
  await expect(page.getByText(c.cancel.homeMethods)).toBeVisible()

  // Signed out: the form.
  await page.getByRole('main').getByRole('link', { name: c.cancel.homeLink }).click()
  await page.getByRole('button', { name: c.cancel.send }).click()
  await expect(page.getByText(t.errors.invalidEmail)).toBeVisible()
  await page.getByLabel(c.cancel.email).fill('buyer@example.test')
  await page.getByLabel(c.cancel.orderRef).fill('AB12CD34')
  await page.getByRole('button', { name: c.cancel.send }).click()
  await expect(page.getByText(c.cancel.sent)).toBeVisible()

  // Signed in: buy a pass (test checkout), cancel it from Settings.
  await confirmedUser(page, 'cancel@example.test')
  await page.getByRole('button', { name: en.actions.next }).click()
  await page.getByRole('button', { name: t.onboarding.skip }).click()
  await page.getByRole('button', { name: t.onboarding.skip }).click()
  await page.getByRole('button', { name: c.access.notNow }).click()
  await expect(page).toHaveURL(/\/en\/app\/library\/$/)
  await page.goto('en/app/checkout/?group=6-8&months=1')
  await passGate(page)
  await page.getByLabel(c.checkout.termsCheck).check()
  await page.getByRole('button', { name: c.checkout.pay }).click()
  await page.getByRole('button', { name: c.checkout.testPaySucceed, exact: true }).click()
  await expect(page.getByTestId('checkout-done')).toHaveAttribute('data-status', 'paid', { timeout: 15_000 })
  await page.goto('en/app/settings/')
  await page.getByRole('button', { name: t.settings.cancelPurchase }).click()
  await expect(page.getByText(c.cancel.refund)).toBeVisible() // the refund rule before the final tap
  await page.getByRole('button', { name: c.cancel.confirm }).click()
  await expect(page.getByText(c.cancel.done)).toBeVisible()
  await expect(page.getByTestId('passes').locator('li').first()).toHaveAttribute('data-status', 'cancelled')

  // Delete the account: typed email must match; afterwards signing in fails and the page says so.
  await page.getByLabel(t.settings.deleteType).fill('someone-else@example.test')
  await page.getByRole('button', { name: t.settings.deleteSubmit }).click()
  await expect(page.getByText(t.settings.deleteMismatch)).toBeVisible()
  await page.getByLabel(t.settings.deleteType).fill('cancel@example.test')
  await page.getByRole('button', { name: t.settings.deleteSubmit }).click()
  await expect(page.getByRole('heading', { name: t.settings.deletedTitle })).toBeVisible()
  await signIn(page, 'cancel@example.test')
  await expect(page.getByText(t.errors.wrongCredentials)).toBeVisible()
})

test('Hebrew: the sign-up form is right-to-left and its errors are in Hebrew', async ({ page }) => {
  await page.goto('he/sign-up/')
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await page.getByRole('button', { name: he.account.auth.submitSignUp, exact: true }).click()
  await expect(page.getByText(he.account.errors.invalidEmail)).toBeVisible()
  // The e-mail field is typed left to right even on a right-to-left page.
  await expect(page.getByLabel(he.account.auth.email, { exact: true })).toHaveAttribute('dir', 'ltr')
})
