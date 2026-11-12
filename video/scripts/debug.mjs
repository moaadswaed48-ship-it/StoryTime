// Debug helper: node scripts/debug.mjs "<query>" <frame> [scale] → times seek + screenshot, prints page errors.
import { createServer } from 'vite'
import { chromium } from 'playwright-core'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const [query = 'comp=lab', frame = '0', scale = '0.5'] = process.argv.slice(2)
const server = await createServer({ root: ROOT, configFile: resolve(ROOT, 'vite.config.ts'), server: { port: 5999 } })
await server.listen()
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-accelerated-2d-canvas'] })
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: Number(scale) })
const page = await ctx.newPage()
page.on('console', (m) => console.log('[console]', m.type(), m.text().slice(0, 400)))
page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 800)))
let t = Date.now()
page.on('requestfailed', (r) => console.log('[failed]', r.url().slice(0, 200)))
page.on('response', (r) => { if (r.status() >= 400) console.log('[http]', r.status(), r.url().slice(0, 200)) })
await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/?${query}`, { waitUntil: 'commit' })
console.log('goto', Date.now() - t)
await page.waitForFunction(() => window.__film !== undefined, null, { timeout: 120000, polling: 200 })
console.log('built in', Date.now() - t, 'ms', await page.evaluate(() => JSON.stringify({ ...window.__film })))
for (const f of String(frame).split(',').map(Number)) {
  t = Date.now()
  await page.evaluate((n) => window.__film.seek(n), f)
  const t1 = Date.now() - t
  t = Date.now()
  try {
    await page.screenshot({ path: `out/debug-${f}.jpg`, type: 'jpeg', quality: 90, timeout: 60000 })
    console.log('frame', f, 'seek', t1, 'ms · shot', Date.now() - t, 'ms')
  } catch (e) {
    console.log('frame', f, 'seek', t1, 'ms · shot FAILED after', Date.now() - t, String(e).slice(0, 200))
  }
}
await browser.close()
await server.close()
