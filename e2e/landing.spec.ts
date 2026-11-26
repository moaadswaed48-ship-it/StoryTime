import { mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import ar from '../src/i18n/ar/index.ts'
import arLanding from '../src/i18n/ar/landing.ts'
import da from '../src/i18n/da/index.ts'
import daLanding from '../src/i18n/da/landing.ts'
import en from '../src/i18n/en/index.ts'
import enLanding from '../src/i18n/en/landing.ts'
import he from '../src/i18n/he/index.ts'
import heLanding from '../src/i18n/he/landing.ts'

/**
 * The landing page's words and its illustration graph, in all four languages: pre-rendered, right-to-left where it
 * should be, no side scroll at 390 px, the graph labelled as an illustration with a text alternative, static with
 * reduced motion, drawn in otherwise. Phone screenshots go to qa/out/landing/ for a person to look at.
 */
const DICTS = {
  ar: { commerce: ar.commerce, landing: arLanding },
  he: { commerce: he.commerce, landing: heLanding },
  en: { commerce: en.commerce, landing: enLanding },
  da: { commerce: da.commerce, landing: daLanding },
}
const SHOTS = 'qa/out/landing'
mkdirSync(SHOTS, { recursive: true })

function watchErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  return errors
}

for (const [lang, d] of Object.entries(DICTS) as [keyof typeof DICTS, (typeof DICTS)[keyof typeof DICTS]][]) {
  test(`/${lang}/ landing: every section, the labelled graph, no side scroll`, async ({ page }, info) => {
    const errors = watchErrors(page)
    const t = d.landing
    const res = await page.goto(`${lang}/`)
    const html = await res!.text()
    // Pre-rendered with the real words, the excerpt and the graph label.
    for (const s of [t.hero.title, t.inside.excerpt, t.evidence.chart.label, t.faq.items[8].q]) expect(html).toContain(s)
    await expect(page.locator('h1')).toHaveText(t.hero.title)
    // Beside the headline, the honest line: what is ready today and what is still being made (CLAUDE.md rule 4).
    await expect(page.getByTestId('hero-note')).toHaveText(t.hero.note)
    for (const h of [t.inside.title, t.values.title, t.evidence.title, t.steps.title, t.ages.title, t.plans.title, t.faq.title]) {
      await expect(page.getByRole('heading', { level: 2, name: h })).toBeVisible()
    }
    await expect(page.getByRole('link', { name: t.hero.primary }).first()).toBeVisible()
    await expect(page.getByRole('main').getByRole('link', { name: d.commerce.cancel.homeLink })).toBeVisible() // and the footer keeps its own
    // The graph: an image with a text alternative that says it is an illustration, and the visible fixed label.
    const graph = page.getByRole('img', { name: t.evidence.chart.title })
    await expect(graph).toBeVisible()
    await expect(graph).toHaveAccessibleDescription(`${t.evidence.chart.label} ${t.evidence.chart.alt}`)
    await expect(page.getByTestId('impact-label')).toHaveText(t.evidence.chart.label)
    // FAQ answers open with a tap.
    await page.getByText(t.faq.items[8].q).click()
    await expect(page.getByText(t.faq.items[8].a)).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false)
    // Let the line finish drawing before the picture is taken.
    await page.getByTestId('impact-chart').scrollIntoViewIfNeeded()
    await page.waitForTimeout(3200)
    await page.evaluate(() => scrollTo(0, 0))
    if (info.project.name === 'phone') await page.screenshot({ path: `${SHOTS}/landing-${lang}-390.png`, fullPage: true })
    expect(errors).toEqual([])
  })
}

test('the graph draws itself in when it scrolls into view', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('en/')
  const fig = page.getByTestId('impact-chart')
  await expect(fig).toHaveAttribute('data-armed', '')
  await fig.scrollIntoViewIfNeeded()
  await expect(fig).toHaveAttribute('data-play', '')
  await expect.poll(() => fig.locator('.impact-line').evaluate((el) => getComputedStyle(el).strokeDashoffset), { timeout: 5000 }).toMatch(/^0(px)?$/)
})

test('with reduced motion the graph is static and complete', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('he/')
  const fig = page.getByTestId('impact-chart')
  await fig.scrollIntoViewIfNeeded()
  await page.waitForTimeout(500)
  expect(await fig.getAttribute('data-armed')).toBeNull()
  const state = await fig.evaluate((el) => ({
    animations: el.getAnimations({ subtree: true }).length,
    offset: getComputedStyle(el.querySelector('.impact-line')!).strokeDashoffset,
    dots: [...el.querySelectorAll('.impact-dot')].map((c) => getComputedStyle(c).opacity),
  }))
  expect(state.animations).toBe(0)
  expect(state.offset).toMatch(/^0(px)?$/)
  expect(state.dots.every((o) => o === '1')).toBe(true)
  if (info.project.name === 'phone') await fig.screenshot({ path: `${SHOTS}/graph-reduced-motion-he-390.png` })
})

test('the story excerpt appears only on the landing pages', async ({}, info) => {
  test.skip(info.project.name !== 'desktop', 'checks files once')
  const files: string[] = []
  const walk = (dir: string) => {
    for (const f of readdirSync(dir)) {
      const p = join(dir, f)
      if (statSync(p).isDirectory()) walk(p)
      else if (p.endsWith('.html')) files.push(p)
    }
  }
  walk(join(process.env.BUILD_DIR || 'build', 'client')) // the build being served (BUILD_DIR, as scripts/serve.mjs)
  for (const [lang, d] of Object.entries(DICTS)) {
    const hits = files.filter((f) => readFileSync(f, 'utf8').includes(d.landing.inside.excerpt))
    // Its own landing page only: the words load with the landing route, not with the dictionary every page carries.
    expect(hits.map((f) => f.replace(/\\/g, '/')), lang).toEqual([expect.stringMatching(new RegExp(`/${lang}/index\\.html$`))])
  }
})
