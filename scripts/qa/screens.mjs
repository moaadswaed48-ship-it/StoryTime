// Screenshot matrix: viewports x page states → qa/out/<width>-<state>.png
import { chromium, devices } from 'playwright'
import { mkdirSync } from 'node:fs'
import { ensureServer, BASE } from './serve.mjs'

const VIEWPORTS = [
  { name: '390', ...devices['iPhone 13'], hasTouch: true },
  { name: '768', viewport: { width: 768, height: 1024 }, deviceScaleFactor: 2 },
  { name: '1440', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
]
const STATES = (process.env.QA_STATES ?? 'hero,hero50,shelf,peek,bottom').split(',')
const only = process.argv.find((a) => a.startsWith('--only='))?.slice(7)

mkdirSync('qa/out', { recursive: true })
const server = await ensureServer()
const browser = await chromium.launch({ headless: true })
try {
  for (const vp of VIEWPORTS) {
    if (only && only !== vp.name) continue
    const { name, ...opts } = vp
    const ctx = await browser.newContext({ ...opts, reducedMotion: process.env.QA_REDUCED ? 'reduce' : 'no-preference' })
    const page = await ctx.newPage()
    page.on('pageerror', (e) => console.error(`[${name}] pageerror:`, e.message))
    page.on('console', (m) => { if (m.type() === 'error') console.error(`[${name}] console.error:`, m.text()) })
    await page.goto(BASE + (process.env.QA_QUERY ?? '?qa=1'), { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(1800)
    const shot = (state) => page.screenshot({ path: `qa/out/${name}-${state}.png`, fullPage: false })
    const scrollTo = async (sel, frac = 0, wait = 1400, offset = 0) => {
      await page.evaluate(({ sel, frac, offset }) => {
        const el = document.querySelector(sel)
        const y = el ? el.getBoundingClientRect().top + window.scrollY + frac * el.getBoundingClientRect().height + offset : 0
        const l = window.__st?.lenis
        if (l) l.scrollTo(y, { immediate: true, force: true }); else window.scrollTo(0, y)
      }, { sel, frac, offset })
      await page.waitForTimeout(wait)
    }
    for (const st of STATES) {
      if (st === 'hero') await scrollTo('#top')
      if (st === 'hero50') await scrollTo('#top', 0.5)
      if (st === 'shelf-mid') {
        await scrollTo('.shelf-view', 0, 0, -110)
        await page.waitForTimeout(650)
      }
      if (st === 'shelf') {
        await scrollTo('.shelf-view', 0, 1200, -110)
        // headless SwiftShader runs the sim far below real time; force the deterministic settled state for the shot
        await page.evaluate(() => window.__st?.shelf?.settleNow?.())
        await page.waitForTimeout(500)
      }
      if (st === 'book-open') {
        await scrollTo('.shelf-view', 0, 300, -110)
        await page.evaluate(() => { window.__st?.shelf?.settleNow?.(); window.__st?.shelf?.open?.('a-garden-for-grandpa') })
        await page.waitForTimeout(1600)
      }
      if (st === 'peek') await scrollTo('#peek')
      if (st === 'bottom') await scrollTo('#order')
      await shot(st)
      console.log('shot', name, st)
    }
    await ctx.close()
  }
} finally {
  await browser.close()
  server.stop()
}
