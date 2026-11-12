// Checks on the code-drawn Moon film (src/features/moonfilm) that do not need eyes:
//   1. pops — every joint that jumps too far between two frames at 30 fps (an elbow flipping, a position that skips)
//   2. determinism — the same second, reached from different places, must give the same pixels: the canvas alone,
//      and the whole stage with its caption caught in the middle of a fade
//   node scripts/qa/moonfilm-audit.mjs [--base=http://localhost:5173]
import { chromium } from 'playwright'
import { createHash } from 'node:crypto'

const base = process.argv.find((a) => a.startsWith('--base='))?.slice(7) ?? 'http://localhost:5173'
const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage()
await page.goto(`${base}/demo.html?f=moonfilm&t=0&bare=1&qa=1`, { waitUntil: 'load' })
await page.waitForFunction(() => window.__st?.moonfilm)
await page.evaluate(() => document.fonts.ready)

const pops = await page.evaluate(() => window.__st.moonfilm.audit(30, 40))
const merged = []
for (const p of pops) {
  const last = merged[merged.length - 1]
  if (last && last.joint === p.joint && p.t - last.to < 0.1) {
    last.to = p.t
    last.max = Math.max(last.max, p.jump)
  } else merged.push({ joint: p.joint, from: p.t, to: p.t, max: p.jump })
}
console.log(merged.length ? 'fastest moves (units per frame; over ~60 is a pop):\n' + merged.map((m) => `  ${m.from}–${m.to}s ${m.joint} ${m.max}`).join('\n') : 'no joint moves faster than 40 units a frame')

const sha = (b) => createHash('sha1').update(b).digest('hex')
const seek = (t) => page.evaluate((t) => window.__st.moonfilm.seek(t), t)
const canvas = async (t) => {
  await seek(t)
  return sha(await page.evaluate(() => document.querySelector('canvas').toDataURL()))
}
const stage = async (t) => {
  await seek(t)
  return sha(await page.locator('[data-moonfilm-stage]').screenshot({ type: 'png' }))
}
const same = []
for (const t of [3.1, 10.3, 16.2, 22.05, 27.4, 31.2]) {
  const a = await canvas(t)
  await canvas(t + 7.77 > 35 ? 1.23 : t + 7.77)
  same.push(a === (await canvas(t)))
}
console.log('canvas deterministic:', same.every(Boolean))
const cap = []
for (const t of [5.55, 6.45, 28.2, 32.85]) {
  const a = await stage(t) // straight after a seek, no waiting: nothing may still be fading
  await stage(t > 20 ? 2 : 34)
  const b = await stage(t)
  await page.waitForTimeout(500)
  const c = sha(await page.locator('[data-moonfilm-stage]').screenshot({ type: 'png' }))
  cap.push(a === b && b === c)
}
console.log('stage with caption deterministic:', cap.every(Boolean), cap.join(','))
await browser.close()
