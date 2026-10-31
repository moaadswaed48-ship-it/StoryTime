// Drives a mouse drag + a flick on the shelf and reports the sim's group offset/index/phase; also tries keyboard and a tap.
import { chromium } from 'playwright'
import { ensureServer, BASE } from './serve.mjs'
const server = await ensureServer()
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
p.on('pageerror', (e) => console.error('pageerror', e.message))
await p.goto(BASE + '?qa=1', { waitUntil: 'networkidle' }); await p.waitForTimeout(2000)
await p.evaluate(() => { const el = document.querySelector('.shelf-view'); window.__st.lenis.scrollTo(el.getBoundingClientRect().top + window.scrollY - 110, { immediate: true, force: true }) })
await p.waitForTimeout(800)
await p.evaluate(() => window.__st.shelf.settleNow())
await p.waitForTimeout(300)
const state = () => p.evaluate(() => ({ phase: window.__st.shelf.phase(), index: window.__st.shelf.index(), gx: +window.__st.shelf.groupX().toFixed(3), wpp: +window.__st.shelf.wpp().toFixed(5) }))
console.log('settled', await state())
const box = await p.locator('.shelf-view').boundingBox()
const cx = box.x + box.width / 2, cy = box.y + box.height / 2
// slow drag 300px left
await p.mouse.move(cx, cy); await p.mouse.down()
for (let i = 1; i <= 15; i++) { await p.mouse.move(cx - i * 20, cy); await p.waitForTimeout(30) }
console.log('dragging', await state())
await p.mouse.up(); await p.waitForTimeout(2500)
console.log('after drag', await state())
// flick right
await p.mouse.move(cx, cy); await p.mouse.down()
for (let i = 1; i <= 6; i++) { await p.mouse.move(cx + i * 40, cy); await p.waitForTimeout(12) }
await p.mouse.up(); await p.waitForTimeout(2500)
console.log('after flick', await state())
// keyboard
await p.focus('.shelf-wrap'); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(1500)
console.log('after ArrowRight', await state())
// tap the centred book once the row is at rest
await p.waitForFunction(() => window.__st.shelf.phase() === 'browsing', null, { timeout: 15000 }).catch(() => console.warn('row still moving'))
console.log('at rest', await state())
await p.mouse.click(cx, cy); await p.waitForTimeout(1500)
console.log('after tap', await state(), 'dialogOpen=', await p.evaluate(() => document.querySelector('dialog')?.open))
await p.screenshot({ path: 'qa/out/1440-tap-open.png' })
await p.keyboard.press('Escape'); await p.waitForTimeout(1200)
console.log('after Escape', await state(), 'dialogOpen=', await p.evaluate(() => document.querySelector('dialog')?.open))
await b.close(); server.stop()
