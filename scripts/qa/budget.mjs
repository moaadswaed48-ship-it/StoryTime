// Bundle + renderer budgets. Fails (exit 1) when a budget is exceeded.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { chromium } from 'playwright'
import { ensureServer, BASE } from './serve.mjs'

const BUDGET = { initialJsGz: 170_000, threeChunkGz: 320_000, heroAvif1280: 220_000, fontsTotal: 70_000, shelfCalls: 70, heroCalls: 8, textures: 32 }
const fails = []
const check = (name, value, max) => { const ok = value <= max; console.log(`${ok ? '✔' : '✖'} ${name}: ${value} (≤ ${max})`); if (!ok) fails.push(name) }

const assets = readdirSync('dist/assets')
const gz = (f) => gzipSync(readFileSync(`dist/assets/${f}`)).length
const js = assets.filter((f) => f.endsWith('.js'))
const lazy = (f) => /^(three|r3f|Scene|HeroView|ShelfView|coverAtlas)-/.test(f)
check('initial JS gz (index + gsap + runtime)', js.filter((f) => !lazy(f)).reduce((s, f) => s + gz(f), 0), BUDGET.initialJsGz)
check('three chunk gz', js.filter((f) => /^three-/.test(f)).reduce((s, f) => s + gz(f), 0), BUDGET.threeChunkGz)
check('hero-1280.avif bytes', statSync('public/hero/hero-1280.avif').size, BUDGET.heroAvif1280)
check('fonts bytes', readdirSync('public/fonts').reduce((s, f) => s + statSync(`public/fonts/${f}`).size, 0), BUDGET.fontsTotal)

const server = await ensureServer()
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
await p.goto(BASE + '?qa=1', { waitUntil: 'networkidle' })
await p.waitForFunction(() => !!window.__st?.gl, null, { timeout: 30_000 })
await p.waitForTimeout(1500)
const hero = await p.evaluate(() => window.__st.gl.info.render.calls)
check('hero draw calls', hero, BUDGET.heroCalls)
await p.evaluate(() => { const el = document.querySelector('.shelf-view'); window.__st.lenis.scrollTo(el.getBoundingClientRect().top + window.scrollY - 110, { immediate: true, force: true }) })
await p.waitForFunction(() => !!window.__st?.shelf, null, { timeout: 30_000 })
await p.waitForTimeout(2500)
await p.evaluate(() => window.__st.shelf.settleNow())
await p.waitForTimeout(800)
const stats = await p.evaluate(() => ({ calls: window.__st.gl.info.render.calls, textures: window.__st.gl.info.memory.textures, programs: window.__st.gl.info.programs.length, renderer: (() => { const gl = window.__st.gl.getContext(); const d = gl.getExtension('WEBGL_debug_renderer_info'); return d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'n/a' })() }))
check('shelf draw calls', stats.calls, BUDGET.shelfCalls)
check('resident textures', stats.textures, BUDGET.textures)
console.log(`  programs: ${stats.programs}  renderer: ${stats.renderer}`)
await b.close(); server.stop()
if (fails.length) { console.error('Budget failures:', fails.join(', ')); process.exit(1) }
