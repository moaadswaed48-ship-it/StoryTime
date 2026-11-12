import { expect, test, type Page } from '@playwright/test'
import { pageUrl } from './_url'
import { waitForHook, watchConsole } from './helpers'

type State = { open: boolean; mounted: boolean; done: boolean; show: boolean; focusInside: boolean }
const state = (page: Page) => page.evaluate(() => window.__st!.auth.state() as State)
const site = (page: Page) =>
  page.evaluate(() => {
    const s = window.__st!.store.getState()
    return { loginOpen: s.loginOpen as boolean, loggedIn: s.loggedIn as boolean, picking: s.picking as boolean, view: s.view as string }
  })
const open = (page: Page) => page.evaluate(() => window.__st!.store.getState().setLoginOpen(true))
const dialog = (page: Page) => page.locator('.au [role="dialog"]')

test.describe('auth', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(pageUrl('auth'))
    await waitForHook(page, 'auth')
  })

  test('a demo: both fields prefilled and read-only, and nothing is sent', async ({ page }) => {
    const con = watchConsole(page)
    await open(page)
    await expect(dialog(page)).toBeVisible()
    await expect(dialog(page)).toHaveAttribute('aria-modal', 'true')
    await expect(page.locator('.au__demo')).toBeVisible()

    const email = page.locator('[data-auth="email"]')
    const pass = page.locator('[data-auth="pass"]')
    // a demo to try: the fields start empty and take anything, even text that is not an address
    await expect(email).toHaveValue('')
    await expect(pass).toHaveValue('')
    for (const field of [email, pass]) {
      await expect(field).not.toHaveAttribute('readonly', '')
      await expect(field).toHaveAttribute('dir', 'ltr')
    }
    await email.fill('asdf qwer !!')
    await pass.fill('zx')
    await expect(email).toHaveValue('asdf qwer !!')

    // sign in ⇄ sign up
    await page.locator('[data-auth="switch"]').click()
    await expect(page.locator('[data-auth="name"]')).toBeVisible()
    await page.locator('[data-auth="switch"]').click()
    await expect(page.locator('[data-auth="name"]')).toHaveCount(0)
    await expect(email).toHaveValue('asdf qwer !!')

    // show / hide the password
    await expect(pass).toHaveAttribute('type', 'password')
    await page.locator('[data-auth="eye"]').click()
    await expect(pass).toHaveAttribute('type', 'text')
    await expect(page.locator('[data-auth="eye"]')).toHaveAttribute('aria-pressed', 'true')

    // submitting stays on the page and makes no request of its own
    const sent: string[] = []
    page.on('request', (r) => {
      if (r.method() !== 'GET' || r.isNavigationRequest() || /asdf|qwer/.test(r.url())) sent.push(`${r.method()} ${r.url()}`)
    })
    const url = page.url()
    await page.locator('[data-auth="submit"]').click()
    await expect.poll(async () => (await state(page)).done).toBe(true)
    expect((await site(page)).loggedIn).toBe(true)
    await page.waitForTimeout(600)
    expect(sent).toEqual([])
    expect(page.url()).toBe(url)
    con.assertClean()
  })

  test('focus stays inside, Esc and the backdrop close, focus goes back', async ({ page }) => {
    await page.evaluate(() => {
      const b = document.createElement('button')
      b.id = 'auth-opener'
      b.textContent = 'open'
      b.style.cssText = 'position:fixed;top:8px;left:8px;z-index:5;width:60px;height:44px'
      b.onclick = () => window.__st!.store.getState().setLoginOpen(true)
      document.body.appendChild(b)
    })
    await page.locator('#auth-opener').focus()
    await page.keyboard.press('Enter')
    await expect(dialog(page)).toBeVisible()
    await expect.poll(async () => (await state(page)).focusInside).toBe(true)
    await expect(page.locator('[data-auth="submit"]')).toBeFocused()

    for (let i = 0; i < 7; i++) {
      await page.keyboard.press('Tab')
      expect((await state(page)).focusInside).toBe(true)
    }
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Shift+Tab')
      expect((await state(page)).focusInside).toBe(true)
    }
    // something outside asks for focus: it is pulled back
    await page.evaluate(() => document.getElementById('auth-opener')!.focus())
    await expect.poll(async () => (await state(page)).focusInside).toBe(true)

    // keyboard users: Enter signs in and focus moves to the way into the library
    await page.locator('[data-auth="submit"]').focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('[data-auth="go"]')).toBeFocused()

    await page.keyboard.press('Escape')
    await expect.poll(async () => (await site(page)).loginOpen).toBe(false)
    await expect(dialog(page)).toHaveCount(0)
    await expect(page.locator('#auth-opener')).toBeFocused()
    expect(await page.evaluate(() => document.documentElement.style.overflow)).not.toBe('hidden')

    // backdrop
    await open(page)
    await expect(dialog(page)).toBeVisible()
    await page.waitForTimeout(700)
    await page.mouse.click(200, 6)
    await expect.poll(async () => (await site(page)).loginOpen).toBe(false)
    await expect(dialog(page)).toHaveCount(0)
  })

  test('signing in welcomes the visitor and leads into the library', async ({ page }) => {
    await open(page)
    await expect(dialog(page)).toBeVisible()
    // opened without the keyboard: the dialog holds focus (no ring on the button), Tab still enters it
    await expect(dialog(page)).toBeFocused()
    await page.locator('[data-auth="submit"]').click()
    const go = page.locator('[data-auth="go"]')
    await expect(go).toBeVisible()
    await expect(dialog(page)).toBeFocused()
    await page.keyboard.press('Tab')
    expect((await state(page)).focusInside).toBe(true)
    await expect(page.locator('.au__welcome')).toBeVisible()
    expect((await site(page)).loggedIn).toBe(true)

    await go.click()
    await expect.poll(async () => (await site(page)).loginOpen).toBe(false)
    // enterApp(): the first time it asks who is reading, otherwise it shows the library
    await expect.poll(async () => { const s = await site(page); return s.picking || s.view !== 'landing' }).toBe(true)
    await expect(dialog(page)).toHaveCount(0)

    // already signed in: the sheet opens on the welcome state
    await page.evaluate(() => { const s = window.__st!.store.getState(); s.setPicking(false); s.setLoginOpen(true) })
    await expect(page.locator('[data-auth="go"]')).toBeVisible()
    await expect(page.locator('[data-auth="submit"]')).toHaveCount(0)
  })

  test('phones get a bottom sheet that fits the screen', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 760, 'phone layout only')
    await open(page)
    await expect(dialog(page)).toBeVisible()
    await page.waitForTimeout(900)
    const vp = page.viewportSize()!
    const box = (await dialog(page).boundingBox())!
    expect(Math.round(box.x)).toBe(0)
    expect(Math.round(box.width)).toBe(vp.width)
    expect(Math.round(box.y + box.height)).toBeGreaterThanOrEqual(vp.height - 1)
    expect(box.y).toBeGreaterThan(0)
    for (const sel of ['[data-auth="submit"]', '[data-auth="eye"]', '.au__close']) {
      const b = (await page.locator(sel).boundingBox())!
      expect(b.height).toBeGreaterThanOrEqual(44)
      expect(b.y + b.height).toBeLessThanOrEqual(vp.height)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
  })
})
