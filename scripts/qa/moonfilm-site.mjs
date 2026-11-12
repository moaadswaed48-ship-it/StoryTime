// The Moon scene inside the real site: shelf → Moon book → "watch a scene" → full-screen player → close → shelf.
//   node scripts/qa/moonfilm-site.mjs [--base=http://localhost:5173/] [--lang=en]
// Saves qa/out/moonfilm/site-<size>-panel.jpg and site-<size>-film.jpg. One browser, desktop then phone.
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3) ?? d
let base = arg('base', 'http://localhost:5173/')
// --dist: check the production build instead (serves ./dist from this process on a free port)
let server = null
if (process.argv.includes('--dist')) {
  const { createServer } = await import('node:http')
  const { readFile } = await import('node:fs/promises')
  const { extname, join } = await import('node:path')
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff', '.webmanifest': 'application/manifest+json' }
  server = createServer(async (req, res) => {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname).split('/').filter((p) => p && p !== '..').join('/')
    try {
      const file = path || 'index.html'
      const body = await readFile(join('dist', file))
      res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' }).end(body)
    } catch {
      res.writeHead(404).end()
    }
  })
  await new Promise((r) => server.listen(0, '127.0.0.1', r))
  base = `http://127.0.0.1:${server.address().port}/`
}
const lang = arg('lang', 'ar')
mkdirSync('qa/out/moonfilm', { recursive: true })
const browser = await chromium.launch()
const errors = []
for (const [name, vp] of [['desktop', { width: 1440, height: 900 }], ['phone', { width: 390, height: 844 }]]) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: name === 'phone' ? 2 : 1, isMobile: name === 'phone', hasTouch: name === 'phone' })
  const page = await ctx.newPage()
  page.on('console', (m) => m.type() === 'error' && errors.push(`${name}: ${m.text().slice(0, 300)}`))
  page.on('pageerror', (e) => errors.push(`${name}: ${e.message.slice(0, 300)}`))
  page.on('requestfailed', (r) => !/\.(mp4|webm)$/.test(r.url()) && errors.push(`${name}: request failed ${r.url().slice(0, 160)}`))
  await page.goto(`${base}${base.includes('?') ? '&' : '?'}qa=1${lang === 'en' ? '&lang=en' : ''}#app`, { waitUntil: 'load' })
  // the shelf mounts as it nears the screen: bring it there
  await page.waitForSelector('#library, [data-lib], .lib-detail', { state: 'attached', timeout: 20000 })
  await page.evaluate(() => (document.querySelector('.lib-detail')?.closest('section') ?? document.querySelector('#library'))?.scrollIntoView({ block: 'start' }))
  await page.waitForFunction(() => window.__st?.library, null, { timeout: 20000 })
  const filmChunkBefore = await page.evaluate(() => performance.getEntriesByType('resource').filter((r) => /Screen|scene8|Player/i.test(r.name)).length)
  await page.evaluate(() => {
    window.__st.library.jump(1)
    window.__st.library.open()
  })
  await page.waitForTimeout(1600)
  const btn = page.locator('.lib-detail [data-act="moon"]')
  await btn.scrollIntoViewIfNeeded()
  await page.waitForTimeout(400)
  await page.screenshot({ path: `qa/out/moonfilm/site-${name}-panel.jpg`, type: 'jpeg', quality: 82 })
  const label = (await btn.textContent())?.trim()
  await btn.click()
  await page.waitForSelector('[data-moon] canvas', { timeout: 20000 })
  await page.waitForTimeout(6600)
  const playing = await page.evaluate(() => ({ time: +window.__st.moonfilm.time().toFixed(2), state: document.querySelector('[data-moonfilm]').dataset.moonfilm, note: document.querySelector('.mf-note')?.textContent, pageLocked: document.documentElement.style.overflow, overflowX: document.documentElement.scrollWidth > window.innerWidth + 1 }))
  await page.screenshot({ path: `qa/out/moonfilm/site-${name}-film.jpg`, type: 'jpeg', quality: 82 })
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)
  const afterEsc = await page.evaluate(() => !!document.querySelector('[data-moon]'))
  await btn.click()
  await page.waitForSelector('[data-moon-close]')
  await page.click('[data-moon-close]')
  await page.waitForTimeout(500)
  const closed = await page.evaluate(() => ({ overlayGone: !document.querySelector('[data-moon]'), pageLocked: document.documentElement.style.overflow, panelStillOpen: !!document.querySelector('.lib-detail.is-open'), focusBack: document.activeElement?.getAttribute('data-act') }))
  console.log(name, JSON.stringify({ label, filmCodeLoadedBeforeClick: filmChunkBefore, playing, escCloses: !afterEsc, closed }))
  await ctx.close()
}
await browser.close()
server?.close()
console.log(errors.length ? 'PROBLEMS:\n' + [...new Set(errors)].join('\n') : 'no console errors')
