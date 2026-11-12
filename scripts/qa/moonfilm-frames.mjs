// Frame checker for the code-drawn Moon film (src/features/moonfilm). One browser, many frames.
//   node scripts/qa/moonfilm-frames.mjs --times=0,2.5,5 [--out=qa/out/moonfilm/sheet.jpg] [--cols=4] [--tile=480]
//        [--mobile] (390×844 portrait, whole page)  [--each=qa/out/moonfilm/f] (also save every frame full size)
//        [--still=4,6,9 --out=qa/out/moonfilm/still] (export the book pictures as PNG instead)
//        [--base=http://localhost:5173]
// Makes a contact sheet of the stage at the given seconds. No WebGL involved, so it is quick.
import { chromium } from 'playwright'
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const opt = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split(/=(.*)/s).slice(0, 2)).map(([k, v]) => [k, v ?? true]))
const base = opt.base ?? 'http://localhost:5173'
const out = opt.out ?? 'qa/out/moonfilm/sheet.jpg'
mkdirSync(dirname(out), { recursive: true })
const browser = await chromium.launch()
const errors = []
const watch = (page) => {
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 300)))
  page.on('pageerror', (e) => errors.push(e.message.slice(0, 300)))
}

if (opt.still) {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  watch(page)
  for (const n of String(opt.still).split(',')) {
    await page.goto(`${base}/demo.html?f=moonfilm&still=${n}`, { waitUntil: 'load' })
    await page.waitForSelector('[data-moonfilm-still]')
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(300)
    const file = `${out}-${String(n).padStart(2, '0')}.png`
    await page.locator('[data-moonfilm-still]').screenshot({ path: file })
    if (opt.jpg) await sharp(file).resize(Number(opt.jpg)).jpeg({ quality: 86 }).toFile(file.replace(/\.png$/, '.jpg'))
    console.log('saved', file)
  }
} else {
  const times = String(opt.times ?? '0').split(',').map(Number)
  const mobile = !!opt.mobile
  const ctx = await browser.newContext(mobile ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  watch(page)
  await page.goto(`${base}/demo.html?f=moonfilm&t=0${mobile ? '' : '&bare=1'}&qa=1`, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__st?.moonfilm)
  await page.evaluate(() => document.fonts.ready)
  const tile = Number(opt.tile ?? 480)
  const cols = Number(opt.cols ?? 4)
  const th = mobile ? Math.round((tile * 844) / 390) : Math.round((tile * 9) / 16)
  const shots = []
  for (const t of times) {
    // the shared dev server may reload the page under us: seek until the frame really is the one asked for
    for (let k = 0; k < 6; k++) {
      await page.waitForFunction(() => window.__st?.moonfilm)
      await page.evaluate((t) => window.__st.moonfilm.seek(t), t)
      await page.waitForTimeout(mobile ? 200 : 90)
      const at = await page.evaluate(() => window.__st?.moonfilm?.time?.()).catch(() => null)
      if (at !== null && Math.abs(at - t) < 0.001) break
      await page.waitForTimeout(800)
    }
    const buf = mobile ? await page.screenshot({ type: 'png' }) : await page.locator('[data-moonfilm-stage]').screenshot({ type: 'png' })
    if (opt.each) {
      const f = `${opt.each}-${String(t).replace('.', '_')}.jpg`
      await sharp(buf).jpeg({ quality: 88 }).toFile(f)
      console.log('saved', f)
    }
    shots.push(await sharp(buf).resize(tile, th).toBuffer())
  }
  const rows = Math.ceil(shots.length / cols)
  await sharp({ create: { width: Math.min(cols, shots.length) * tile, height: rows * th, channels: 3, background: '#000' } })
    .composite(shots.map((input, i) => ({ input, left: (i % cols) * tile, top: Math.floor(i / cols) * th })))
    .jpeg({ quality: 84 })
    .toFile(out)
  console.log('saved', out, `(${times.join(', ')})`)
}
await browser.close()
console.log(errors.length ? 'PROBLEMS:\n' + [...new Set(errors)].join('\n') : 'no console errors')
