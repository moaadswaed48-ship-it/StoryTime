// Quick visual pass: node scripts/qa/shots.mjs [lang] — screenshots of every section + reader + watch + game.
import { chromium } from 'playwright'
const lang = process.argv[2] ?? 'ar'
const out = 'qa/out'
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const errors = []
for (const [name, vp] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, hasTouch: name === 'mobile' })
  const page = await ctx.newPage()
  page.on('console', (m) => m.type() === 'error' && errors.push(`${name}: ${m.text()}`))
  page.on('pageerror', (e) => errors.push(`${name}: ${e.message}`))
  await page.goto(`http://localhost:4173/?qa=1&lang=${lang}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  const shot = (n) => page.screenshot({ path: `${out}/${lang}-${name}-${n}.png` })
  await shot('01-hero')
  const scrollTo = async (sel, extra = 0) => {
    await page.evaluate(([s, e]) => { const el = document.querySelector(s); window.__st.lenis.scrollTo(el.getBoundingClientRect().top + window.scrollY + e, { immediate: true, force: true }) }, [sel, extra])
    await page.waitForTimeout(1600)
  }
  await scrollTo('#story', vp.height * 0.2); await shot('02-stage-closed')
  await scrollTo('#story', vp.height * 1.7); await shot('03-stage-open')
  await scrollTo('#hudhud', -60); await page.waitForTimeout(1500); await shot('04-hudhud')
  await scrollTo('#play', -60); await page.waitForTimeout(1200); await shot('05-play')
  await page.click('[data-testid=game-start]'); await page.waitForTimeout(3500); await shot('06-game')
  await scrollTo('#learn', -60); await shot('07-learn')
  await scrollTo('#plans', -60); await shot('08-plans')
  await scrollTo('#author', -60); await shot('09-author')
  await page.evaluate(() => window.__st.lenis.scrollTo(document.body.scrollHeight, { immediate: true, force: true })); await page.waitForTimeout(900); await shot('10-night')
  await page.evaluate(() => window.__st.lenis.scrollTo(0, { immediate: true, force: true }))
  await page.click('[data-testid=hero-read]'); await page.waitForTimeout(900); await shot('11-reader-cover')
  await page.evaluate(() => window.__st.reader.go(1)); await page.waitForTimeout(1600); await shot('12-reader-p1')
  await page.evaluate(() => window.__st.reader.go(4)); await page.waitForTimeout(1600); await shot('13-reader-p4')
  await page.evaluate(() => window.__st.reader.go(5)); await page.waitForTimeout(900); await shot('14-reader-gate')
  await page.keyboard.press('Escape'); await page.waitForTimeout(400)
  await page.click('[data-testid=hero-watch]'); await page.waitForTimeout(6500); await shot('15-watch')
  await ctx.close()
}
await browser.close()
console.log(errors.length ? 'ERRORS:\n' + [...new Set(errors)].join('\n') : 'no console errors')
