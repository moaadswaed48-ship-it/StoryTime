import { chromium } from 'playwright'
const base = process.argv[2]
const out = process.argv[3]
const b = await chromium.launch()
const errs = []
for (const [name, url, w, h] of [['lab-studio-ar-390', '/lab/studio?scene=spread-oranges&lang=ar', 390, 844], ['lab-kit-390', '/lab/kit', 390, 844], ['lab-studio-shot-1440', '/lab/studio?scene=shot-tower', 1440, 1000]]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2, reducedMotion: 'reduce' })
  p.on('pageerror', (e) => errs.push(name + ': ' + String(e).slice(0, 300)))
  p.on('console', (m) => m.type() === 'error' && errs.push(name + ' console: ' + m.text().slice(0, 300)))
  await p.goto(base + url, { waitUntil: 'networkidle', timeout: 90000 })
  await p.waitForSelector('canvas', { timeout: 60000 })
  await p.waitForTimeout(1500)
  await p.screenshot({ path: `${out}/${name}.png` })
  await p.close()
}
await b.close()
console.log(errs.length ? errs.join('\n') : 'no page errors')
