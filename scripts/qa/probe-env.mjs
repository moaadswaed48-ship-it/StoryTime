import { chromium } from 'playwright'
import { ensureServer, BASE } from './serve.mjs'
const server = await ensureServer()
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
const reqs = []
p.on('response', (r) => { if (/\.(hdr|jpg|png|webp)$/.test(r.url())) reqs.push(`${r.status()} ${r.url().split('/').slice(-2).join('/')}`) })
p.on('pageerror', (e) => console.error('pageerror', e.message))
p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('console:', m.text().slice(0, 160)) })
await p.goto(BASE + '?qa=1', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500)
await p.evaluate(() => { const el = document.querySelector('.shelf-view'); window.__st.lenis.scrollTo(el.getBoundingClientRect().top + window.scrollY - 110, { immediate: true, force: true }) })
await p.waitForTimeout(4000)
console.log(reqs.join('\n'))
console.log('gl.info:', await p.evaluate(() => JSON.stringify({ mem: window.__st.gl.info.memory, render: window.__st.gl.info.render, programs: window.__st.gl.info.programs.length })))
await b.close(); server.stop()
