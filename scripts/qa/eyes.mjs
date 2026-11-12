// "Eyes": drive the site like a person and photograph it.
//   node scripts/qa/eyes.mjs <url> <outPrefix> [--device=iphone|desktop|ipad|land] [--dpr=1] [--steps='[...]'] [--walk=700] [--reduce]
// steps: [{type:[css,text]}|{hash:"#app"}|{walk:600,name:"home"}|{scroll:800}|{to:1200}|{sel:"#id"}|{tap:"css"}|{tapText:"..."}|{wait:500}|{eval:"js"}|{shot:"name"}|{key:"Escape"}|{drag:[x1,y1,x2,y2]}]
// --walk=N scrolls the whole page in small steps (so reveals fire like real scrolling) and shoots every N px.
import { chromium, devices } from 'playwright'
const [, , url, out, ...rest] = process.argv
const opt = Object.fromEntries(rest.map((a) => a.replace(/^--/, '').split(/=(.*)/s).slice(0, 2)).map(([k, v]) => [k, v ?? true]))
const dpr = Number(opt.dpr ?? 1)
const profiles = {
  iphone: { ...devices['iPhone 14'], deviceScaleFactor: dpr },
  land: { ...devices['iPhone 14 landscape'], deviceScaleFactor: dpr },
  ipad: { ...devices['iPad (gen 7)'], deviceScaleFactor: dpr },
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: dpr },
}
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] })
const ctx = await browser.newContext({ ...profiles[opt.device ?? 'iphone'], reducedMotion: opt.reduce ? 'reduce' : 'no-preference' })
const page = await ctx.newPage()
const errs = []
page.on('pageerror', (e) => errs.push('pageerror: ' + String(e).slice(0, 300)))
page.on('console', (m) => m.type() === 'error' && errs.push('console: ' + m.text().slice(0, 300)))
page.on('requestfailed', (r) => !/\.mp4|\.webm/.test(r.url()) && errs.push('failed: ' + r.url().slice(-80)))
page.on('response', (r) => r.status() >= 400 && errs.push(r.status() + ' ' + r.url().slice(-80)))
await page.goto(url, { waitUntil: 'load' })
await page.waitForTimeout(Number(opt.wait ?? 2500))
let n = 0
const shot = async (name) => {
  const f = `${out}-${name ?? String(n).padStart(2, '0')}.jpg`
  n++
  await page.screenshot({ path: f, type: 'jpeg', quality: 80 })
  return f
}
const glide = async (to) => {
  let y = await page.evaluate(() => scrollY)
  const dir = Math.sign(to - y) || 1
  while ((to - y) * dir > 0) {
    y += dir * Math.min(160, Math.abs(to - y))
    await page.evaluate((v) => window.scrollTo(0, v), y)
    await page.waitForTimeout(70)
  }
  await page.waitForTimeout(Number(opt.settle ?? 900))
}
if (opt.walk) {
  const step = Number(opt.walk)
  for (let y = 0; ; y += step) {
    const H = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)
    await glide(Math.min(y, H))
    await shot()
    if (y >= H || n > 80) break
  }
}
for (const s of opt.steps ? JSON.parse(opt.steps) : []) {
  if (s.scroll != null) await glide((await page.evaluate(() => scrollY)) + s.scroll)
  else if (s.to != null) await glide(s.to)
  else if (s.sel) await glide(await page.evaluate((q) => Math.max(0, document.querySelector(q).getBoundingClientRect().top + scrollY - 70), s.sel))
  else if (s.tap) await page.locator(s.tap).first().click({ timeout: 8000 }).catch((e) => errs.push('tap ' + s.tap + ': ' + String(e).slice(0, 120)))
  else if (s.tapText) await page.getByText(s.tapText, { exact: false }).first().click({ timeout: 8000 }).catch((e) => errs.push('tapText ' + s.tapText + ': ' + String(e).slice(0, 120)))
  else if (s.type) await page.locator(s.type[0]).first().fill(s.type[1])
  else if (s.hash) { await page.evaluate((h) => { location.hash = h }, s.hash); await page.waitForTimeout(1800) }
  else if (s.walk) {
    for (let y = 0, k = 0; ; y += s.walk, k++) {
      const H = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)
      await glide(Math.min(y, H))
      await shot(`${s.name}${k}`)
      if (y >= H || k > 14) break
    }
  }
  else if (s.wait) await page.waitForTimeout(s.wait)
  else if (s.eval) console.log('eval →', JSON.stringify(await page.evaluate(s.eval).catch((e) => 'ERR ' + e)))
  else if (s.key) await page.keyboard.press(s.key)
  else if (s.drag) {
    const [x1, y1, x2, y2] = s.drag
    await page.mouse.move(x1, y1); await page.mouse.down()
    for (let i = 1; i <= 12; i++) { await page.mouse.move(x1 + ((x2 - x1) * i) / 12, y1 + ((y2 - y1) * i) / 12); await page.waitForTimeout(30) }
    if (!s.hold) await page.mouse.up()
  } else if ('shot' in s) console.log('shot', await shot(s.shot))
}
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)
console.log(`frames ${n} · overflow ${overflow} · errors ${errs.length}${errs.length ? '\n' + [...new Set(errs)].slice(0, 12).join('\n') : ''}`)
await browser.close()
