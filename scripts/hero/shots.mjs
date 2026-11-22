/**
 * Screenshots of the 3D hero for review, and the still pictures shown to visitors without WebGL.
 *   node scripts/hero/shots.mjs frames   → qa/out/hero/frames/<id>-<gesture>-<n>.png  + contact sheets
 *   node scripts/hero/shots.mjs pages    → qa/out/hero/pages/<width>-<id>-<gesture>.png (whole stage with buttons)
 *   node scripts/hero/shots.mjs stills   → src/hero3d/stills/<id>-<gesture>.webp
 * Options: --ids=noor,lulu  --acts=wave,jump  --cast=all  --dpr=2  --at=0.3,0.5 (moments, as fractions of the gesture)
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { startHarness } from './serve.mjs'

const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const root = fileURLToPath(new URL('../..', import.meta.url))
const what = process.argv[2] ?? 'frames'
const opt = Object.fromEntries(process.argv.slice(3).map((a) => a.replace(/^--/, '').split('=')))
const GL = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl']

const { server, url } = await startHarness(5184)
const browser = await chromium.launch({ args: GL })
const cast = opt.cast === 'all' ? '&cast=all' : ''
try {
  if (what === 'frames' || what === 'stills') {
    const still = what === 'stills'
    const page = await browser.newPage({ viewport: still ? { width: 448, height: 640 } : { width: 448, height: 640 }, deviceScaleFactor: still ? 1.5 : Number(opt.dpr ?? 1) })
    page.on('pageerror', (e) => console.error('page error:', e.message))
    page.on('console', (m) => m.type() === 'error' && console.error('console:', m.text()))
    await page.goto(`${url}?qa=1${cast}`)
    await page.waitForFunction(() => window.__hero?.ready, null, { timeout: 60000 })
    const info = await page.evaluate(() => ({ ids: window.__hero.ids, acts: window.__hero.acts, durations: window.__hero.durations }))
    const ids = opt.ids ? opt.ids.split(',') : info.ids
    const acts = opt.acts ? opt.acts.split(',') : still ? ['idle', ...info.acts] : info.acts
    const out = still ? `${root}src/hero3d/stills` : `${root}qa/out/hero/frames`
    await mkdir(out, { recursive: true })
    const stage = page.locator('[data-hero-mode]')
    const sheetRows = []
    const pending = []
    for (const id of ids) {
      for (const act of acts) {
        if (still) {
          await page.evaluate(([i, a]) => window.__hero.show(i, a), [id, act])
          const data = await page.evaluate(() => window.__hero.shot('image/webp'))
          // kept in memory until the end: writing into src/ while the page is open would make it reload
          pending.push([`${out}/${id}-${act}.webp`, Buffer.from(data.split(',')[1], 'base64')])
          continue
        }
        // five moments through the gesture: anticipation, rise, key pose, action, settle
        const d = info.durations[act]
        const files = []
        for (const [n, f] of (opt.at ? opt.at.split(',').map(Number) : [0.1, 0.26, 0.42, 0.6, 0.84]).entries()) {
          await page.evaluate(([i, a, t]) => window.__hero.show(i, a, t), [id, act, f * d])
          const file = `${out}/${id}-${act}-${n}.png`
          await stage.screenshot({ path: file })
          files.push(file)
        }
        sheetRows.push({ id, act, files })
      }
      console.log('done', id)
    }
    await page.close()
    for (const [file, bytes] of pending) await writeFile(file, bytes)
    if (!still) {
      // contact sheets: one per character, a row per gesture
      const sheetPage = await browser.newPage({ viewport: { width: 1180, height: 800 } })
      for (const id of ids) {
        const rows = sheetRows.filter((r) => r.id === id)
        const html = `<body style="margin:0;background:#f4f1ec;font:14px system-ui">${rows
          .map((r) => `<div style="display:flex;align-items:center;gap:4px;border-bottom:1px solid #ccc"><b style="width:60px;padding-left:6px">${r.act}</b>${r.files.map((f) => `<img src="file://${f}" style="width:220px">`).join('')}</div>`)
          .join('')}</body>`
        await writeFile(`${out}/_sheet-${id}.html`, html)
        await sheetPage.goto(`file://${out}/_sheet-${id}.html`)
        await sheetPage.screenshot({ path: `${root}qa/out/hero/sheet-${id}.png`, fullPage: true })
      }
    }
  } else if (what === 'pages') {
    const out = `${root}qa/out/hero/pages`
    await mkdir(out, { recursive: true })
    for (const width of (opt.widths ?? '390,1440').split(',').map(Number)) {
      const page = await browser.newPage({ viewport: { width, height: width < 600 ? 844 : 900 }, deviceScaleFactor: width < 600 ? 2 : 1, hasTouch: width < 600 })
      page.on('pageerror', (e) => console.error('page error:', e.message))
      await page.goto(`${url}?mode=live${cast}${opt.dir === 'rtl' ? '&dir=rtl' : ''}`)
      await page.waitForSelector('canvas', { timeout: 60000 })
      await page.waitForTimeout(1500)
      const ids = opt.ids ? opt.ids.split(',') : await page.$$eval('[aria-pressed][aria-label]:not([data-gesture])', (els) => els.map((e) => e.getAttribute('aria-label')))
      const acts = opt.acts ? opt.acts.split(',') : ['wave', 'jump', 'dance', 'peek']
      for (const [i, name] of ids.entries()) {
        await page.getByRole('button', { name, exact: true }).first().click()
        await page.waitForTimeout(900)
        for (const act of acts) {
          await page.locator(`[data-gesture="${act}"]`).click()
          await page.waitForTimeout(opt.wait ? Number(opt.wait) : 1050)
          await page.screenshot({ path: `${out}/${width}-${i}-${act}.png` })
          await page.waitForTimeout(2600)
        }
      }
      await page.close()
    }
  }
} finally {
  await browser.close()
  await server.close()
}
