import { chromium } from 'playwright'
import { ensureServer, BASE } from './serve.mjs'
const server = await ensureServer()
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
p.on('pageerror', (e) => console.error('pageerror', e.message))
await p.goto(BASE + '?qa=1&freeze=1', { waitUntil: 'networkidle' }); await p.waitForTimeout(2500)
await p.mouse.move(100, 450); await p.waitForTimeout(1500)
await p.screenshot({ path: 'qa/out/parallax-left.png', clip: { x: 900, y: 150, width: 540, height: 600 } })
await p.mouse.move(1340, 450); await p.waitForTimeout(1500)
await p.screenshot({ path: 'qa/out/parallax-right.png', clip: { x: 900, y: 150, width: 540, height: 600 } })
console.log('stats', await p.evaluate(() => JSON.stringify({ calls: window.__st.gl.info.render.calls, programs: window.__st.gl.info.programs.length })))
await b.close(); server.stop()
