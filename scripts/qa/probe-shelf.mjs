// Prints the shelf sim phase and residuals over time after scrolling to the shelf.
import { chromium } from 'playwright'
import { ensureServer, BASE } from './serve.mjs'
const server = await ensureServer()
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
p.on('pageerror', (e) => console.error('pageerror', e.message))
await p.goto(BASE + '?qa=1', { waitUntil: 'networkidle' }); await p.waitForTimeout(2000)
await p.evaluate(() => { const el = document.querySelector('.shelf-view'); window.__st.lenis.scrollTo(el.getBoundingClientRect().top + window.scrollY - 120, { immediate: true, force: true }) })
for (let i = 0; i < 12; i++) {
  await p.waitForTimeout(400)
  const r = await p.evaluate(() => {
    const s = window.__st?.shelf
    if (!s) return 'no hooks'
    const d = s.debug ? s.debug() : null
    return { phase: s.phase(), t: s.time ? s.time() : null, d }
  })
  console.log(JSON.stringify(r))
}
await b.close(); server.stop()
