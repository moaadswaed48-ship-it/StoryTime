import { chromium } from 'playwright'
import { ensureServer, BASE } from './serve.mjs'
const server = await ensureServer()
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
await p.goto(BASE + '?qa=1&freeze=1', { waitUntil: 'networkidle' }); await p.waitForTimeout(2500)
await p.addStyleTag({ content: '#page > div[style*="fixed"]{pointer-events:auto !important}' })
const stack = await p.evaluate(() => {
  const em = document.querySelector('#hero-title em')
  const r = em.getBoundingClientRect()
  const x = r.left + r.width / 2, y = r.top + r.height / 2
  return document.elementsFromPoint(x, y).map((e) => `${e.tagName}${e.id ? '#' + e.id : ''}.${(e.className || '').toString().split(' ').slice(0, 2).join('.')} z=${getComputedStyle(e).zIndex} pos=${getComputedStyle(e).position}`)
})
console.log(stack.join('\n'))
await p.screenshot({ path: 'qa/out/z-0-base.png', clip: { x: 0, y: 150, width: 900, height: 320 } })
await p.addStyleTag({ content: '#top > div.relative{z-index:50 !important}' })
await p.waitForTimeout(300); await p.screenshot({ path: 'qa/out/z-1-grid50.png', clip: { x: 0, y: 150, width: 900, height: 320 } })
await p.addStyleTag({ content: '#page{isolation:isolate}' })
await p.waitForTimeout(300); await p.screenshot({ path: 'qa/out/z-2-isolate.png', clip: { x: 0, y: 150, width: 900, height: 320 } })
await b.close(); server.stop()
