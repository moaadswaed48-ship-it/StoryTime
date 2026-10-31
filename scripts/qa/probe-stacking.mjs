import { chromium } from 'playwright'
import { ensureServer, BASE } from './serve.mjs'
const server = await ensureServer()
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
await p.goto(BASE + '?qa=1', { waitUntil: 'networkidle' }); await p.waitForTimeout(2500)
const info = await p.evaluate(() => {
  const cs = (el) => el ? { tag: el.tagName, cls: (el.className||'').toString().slice(0,60), pos: getComputedStyle(el).position, z: getComputedStyle(el).zIndex, tr: getComputedStyle(el).transform, parent: el.parentElement?.id || el.parentElement?.tagName } : null
  const canvas = document.querySelector('canvas')
  const h1 = document.getElementById('hero-title')
  const chain = []
  let e = h1; while (e && e !== document.body) { chain.push(cs(e)); e = e.parentElement }
  return { canvasWrapper: cs(canvas?.parentElement), canvasWrapperParent: cs(canvas?.parentElement?.parentElement), h1chain: chain, topAtH1: cs(document.elementFromPoint(300, 250)) }
})
console.log(JSON.stringify(info, null, 1))
await b.close(); server.stop()
