// Screenshot helper. Looks at a URL the way a visitor would and reports console errors.
//   node scripts/qa/shot.mjs "<url>" <outPrefix> [--wait=1500] [--y=0,900,1800] [--full] [--only=desktop|mobile]
//        [--click="css selector"] [--eval="js run in the page before shooting"] [--after=800] [--reduce] (emulate prefers-reduced-motion)
// Saves <outPrefix>-desktop[-N].jpg (1440×900) and <outPrefix>-mobile[-N].jpg (390×844). View them with the Read tool.
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const [, , url, out, ...rest] = process.argv
const opt = Object.fromEntries(rest.map((a) => a.replace(/^--/, '').split(/=(.*)/s).slice(0, 2)).map(([k, v]) => [k, v ?? true]))
mkdirSync(dirname(out), { recursive: true })
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] })
const errors = []
const sizes = [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]].filter(([n]) => !opt.only || opt.only === n)
for (const [name, viewport] of sizes) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, hasTouch: name === 'mobile', isMobile: name === 'mobile', reducedMotion: opt.reduce ? 'reduce' : 'no-preference' })
  const page = await ctx.newPage()
  page.on('console', (m) => m.type() === 'error' && errors.push(`${name}: ${m.text().slice(0, 300)}`))
  page.on('pageerror', (e) => errors.push(`${name}: ${e.message.slice(0, 300)}`))
  page.on('requestfailed', (r) => !/\.(mp4|webm)$/.test(r.url()) && errors.push(`${name}: request failed ${r.url().slice(0, 160)}`))
  await page.goto(url, { waitUntil: 'load' })
  await page.waitForTimeout(Number(opt.wait ?? 1800))
  if (opt.eval) await page.evaluate(opt.eval)
  if (opt.click) await page.click(opt.click)
  if (opt.eval || opt.click) await page.waitForTimeout(Number(opt.after ?? 900))
  const ys = opt.y ? String(opt.y).split(',').map(Number) : [null]
  for (let i = 0; i < ys.length; i++) {
    if (ys[i] !== null) {
      await page.evaluate((y) => (window.__st?.lenis ? window.__st.lenis.scrollTo(y, { immediate: true, force: true }) : window.scrollTo(0, y)), ys[i])
      await page.waitForTimeout(Number(opt.after ?? 900))
    }
    const file = `${out}-${name}${ys.length > 1 ? '-' + i : ''}.jpg`
    await page.screenshot({ path: file, type: 'jpeg', quality: 78, fullPage: !!opt.full })
    console.log('saved', file)
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
  if (overflow) errors.push(`${name}: horizontal overflow (page is wider than the screen)`)
  await ctx.close()
}
await browser.close()
console.log(errors.length ? 'PROBLEMS:\n' + [...new Set(errors)].join('\n') : 'no console errors, no overflow')
