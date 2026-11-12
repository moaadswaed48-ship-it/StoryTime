// Bench: capture strategies. node scripts/bench.mjs
import { createServer } from 'vite'
import { chromium } from 'playwright-core'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeFileSync } from 'node:fs'
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const server = await createServer({ root: ROOT, configFile: resolve(ROOT, 'vite.config.ts'), server: { port: 5998 } })
await server.listen()
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-accelerated-2d-canvas', ...(process.argv[2] ? process.argv[2].split(' ') : [])] })
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })
const page = await ctx.newPage()
await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/?comp=trailer-16x9${process.argv[3] ?? ''}`, { waitUntil: 'commit' })
await page.waitForFunction(() => window.__film !== undefined, null, { timeout: 120000, polling: 200 })
const cdp = await ctx.newCDPSession(page)
const sets = { footage: [130, 131, 132], gust: [290, 291, 292], book: [520, 521, 522], play: [700, 701, 702], title: [30, 31, 32] }
for (const [mode, frames] of Object.entries(sets)) {
  let t = Date.now()
  for (const f of frames) {
    await page.evaluate((n) => window.__film.seek(n), f)
    const r = await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true })
    writeFileSync(`out/bench-${mode}.png`, Buffer.from(r.data, 'base64'))
  }
  console.log(process.argv[3] ?? '', mode, ((Date.now() - t) / frames.length).toFixed(0), 'ms/frame')
}
await browser.close()
await server.close()
