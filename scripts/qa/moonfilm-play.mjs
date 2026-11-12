// Plays the Moon film for real (a click on the start button), then checks the clock, the frame pace and the controls.
import { chromium } from 'playwright'
const browser = await chromium.launch()
const errors = []
for (const [name, vp] of [['desktop', { width: 1440, height: 900 }], ['phone', { width: 390, height: 844 }]]) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: name === 'phone' ? 2 : 1, isMobile: name === 'phone', hasTouch: name === 'phone' })
  const page = await ctx.newPage()
  page.on('console', (m) => m.type() === 'error' && errors.push(`${name}: ${m.text().slice(0, 300)}`))
  page.on('pageerror', (e) => errors.push(`${name}: ${e.message.slice(0, 300)}`))
  await page.goto('http://localhost:5173/demo.html?f=moonfilm&qa=1', { waitUntil: 'load' })
  await page.waitForSelector('.mf-start')
  await page.screenshot({ path: `qa/out/moonfilm/ui-${name}-start.jpg`, type: 'jpeg', quality: 80 })
  const t0 = Date.now()
  await page.click('.mf-start')
  await page.evaluate(() => {
    window.__frames = 0
    const f = () => {
      window.__frames++
      requestAnimationFrame(f)
    }
    requestAnimationFrame(f)
  })
  await page.waitForTimeout(6000)
  const at = await page.evaluate(() => ({ time: window.__st.moonfilm.time(), frames: window.__frames, quality: window.__st.moonfilm.quality(), state: document.querySelector('[data-moonfilm]').dataset.moonfilm, caption: document.querySelector('.mf-caption').textContent, canvas: document.querySelector('canvas').width }))
  console.log(name, 'after', ((Date.now() - t0) / 1000).toFixed(2), 's of playing:', at)
  await page.screenshot({ path: `qa/out/moonfilm/ui-${name}-playing.jpg`, type: 'jpeg', quality: 80 })
  // pause with the button, scrub with the bar, restart
  await page.click('.mf-bar .mf-btn >> nth=0')
  const paused = await page.evaluate(() => document.querySelector('[data-moonfilm]').dataset.moonfilm)
  const box = await page.locator('.mf-scrub').boundingBox()
  await page.mouse.click(box.x + box.width * 0.25, box.y + box.height / 2)
  const scrubbed = await page.evaluate(() => window.__st.moonfilm.time())
  await page.click('.mf-bar .mf-btn >> nth=1')
  await page.waitForTimeout(700)
  const restarted = await page.evaluate(() => ({ time: window.__st.moonfilm.time(), state: document.querySelector('[data-moonfilm]').dataset.moonfilm }))
  await page.click('.mf-bar .mf-btn >> nth=2')
  const muted = await page.evaluate(() => document.querySelector('.mf-bar .mf-btn:last-child').getAttribute('aria-pressed'))
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
  console.log(name, { paused, scrubbedTo: +scrubbed.toFixed(2), restarted, muted, overflow })
  await ctx.close()
}
await browser.close()
console.log(errors.length ? 'PROBLEMS:\n' + [...new Set(errors)].join('\n') : 'no console errors')
