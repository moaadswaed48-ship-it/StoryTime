import { execSync } from 'node:child_process'
import { mkdirSync, readdirSync, readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'

/**
 * Every email at phone width in Arabic and English, as a mail app on a phone shows the HTML, saved to
 * qa/out/stage4b2/emails/ for a person to look at. The HTML comes from the "preview" transport
 * (tests/email-preview-files.test.ts, run first here). Checks: no sideways scroll at 390 px, the right direction.
 */
const SRC = 'qa/out/stage4b2/emails-html'
const DIR = 'qa/out/stage4b2/emails'
mkdirSync(DIR, { recursive: true })

test.describe.configure({ timeout: 180_000 })
test.beforeAll(({}, info) => {
  if (info.project.name !== 'phone') return
  execSync('npx vitest run tests/email-preview-files.test.ts', { stdio: 'pipe' })
})

for (const lang of ['ar', 'en'] as const) {
  test(`every email at phone width (${lang})`, async ({ page }, info) => {
    test.skip(info.project.name !== 'phone', 'phone width only')
    await page.setViewportSize({ width: 390, height: 844 })
    const files = readdirSync(SRC).filter((f) => f.endsWith(`-${lang}.html`))
    expect(files).toHaveLength(19)
    for (const f of files) {
      const name = f.replace(/^\d+-/, '').replace(/\.html$/, '')
      await page.setContent(readFileSync(`${SRC}/${f}`, 'utf8'), { waitUntil: 'load' })
      expect(await page.locator('html').getAttribute('dir')).toBe(lang === 'ar' ? 'rtl' : 'ltr')
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${name} scrolls sideways`).toBe(true)
      await page.screenshot({ path: `${DIR}/${name}.png`, fullPage: true })
    }
  })
}
