// Captures real screens of the app for the landing page's "Inside StoryTime" section (src/features/tour).
//   node scripts/qa/tour-shots.mjs [baseUrl=http://localhost:5173] [--only=home,story,reader,tree] [--preview]
// Phone size (390×844 @2x), Arabic and English → public/app/shots/<name>-<ar|en>.webp (780px wide).
// --preview also writes JPEG copies to qa/out/tour-shots/ for looking at them.
// The reader is a guest who tapped Sari's picture (the app's own guest door, no invented name) and has
// watched the film and played the game, so the library, the doors and the tree show real progress.
import { chromium } from 'playwright'
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

const args = process.argv.slice(2)
const base = (args.find((a) => !a.startsWith('--')) ?? 'http://localhost:5173').replace(/\/$/, '')
const opt = Object.fromEntries(args.filter((a) => a.startsWith('--')).map((a) => a.replace(/^--/, '').split(/=(.*)/s).slice(0, 2)).map(([k, v]) => [k, v ?? true]))
const only = opt.only ? String(opt.only).split(',') : null
const OUT = 'public/app/shots'
const PREVIEW = 'qa/out/tour-shots'
mkdirSync(OUT, { recursive: true })
if (opt.preview) mkdirSync(PREVIEW, { recursive: true })

const STORY = 'autumn-leaves'
// first letters the game stores for the two names a child collects first (Sari, Amir) — t.game.letters
const LETTERS = { ar: ['س', 'أ'], en: ['S', 'A'] }

/**
 * Each screen: the app view (address hash), what to do once it is up, and how long to let it settle.
 * `y` scrolls the screen first (the story page's three doors sit below its picture).
 */
const SCREENS = [
  { name: 'home', hash: 'app', settle: 3200 },
  { name: 'story', hash: 'story', settle: 2600, scrollTo: '[data-door], .story__doors', offset: -96 },
  { name: 'reader', hash: 'story', settle: 1200, open: 2, after: 5200 },
  { name: 'tree', hash: 'tree', settle: 4200 },
]

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] })
const problems = []
for (const lang of ['ar', 'en']) {
  for (const s of SCREENS) {
    if (only && !only.includes(s.name)) continue
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: lang === 'ar' ? 'ar' : 'en-US' })
    await ctx.addInitScript(
      ({ lang, story, letters }) => {
        try {
          localStorage.setItem('st:lang', lang)
          localStorage.setItem(
            'st:profile:v1',
            JSON.stringify({
              profile: { name: '', avatar: 'sari' },
              progress: { [story]: { read: false, watched: true, played: true, scene: 3, letters } },
              classroom: false,
            }),
          )
          // the leaves already arrived on an earlier visit: the tree is shown at rest, not mid-celebration
          localStorage.setItem('st:tree:seen:v1', JSON.stringify([`${story}:watched`, `${story}:played`]))
        } catch {
          /* ignore */
        }
      },
      { lang, story: STORY, letters: LETTERS[lang] },
    )
    const page = await ctx.newPage()
    page.on('pageerror', (e) => problems.push(`${lang}/${s.name}: ${e.message.slice(0, 200)}`))
    page.on('console', (m) => m.type() === 'error' && problems.push(`${lang}/${s.name}: ${m.text().slice(0, 200)}`))
    await page.goto(`${base}/?qa=1&lang=${lang}#${s.hash}`, { waitUntil: 'load' })
    await page.waitForFunction(() => !!window.__st?.store, null, { timeout: 45_000 })
    await page.waitForTimeout(s.settle)
    if (s.scrollTo) {
      await page.evaluate(
        ({ sel, offset }) => {
          const el = document.querySelector(sel)
          if (!el) return
          const y = el.getBoundingClientRect().top + window.scrollY + offset
          const lenis = window.__st?.lenis
          if (lenis) lenis.scrollTo(y, { immediate: true, force: true })
          else window.scrollTo(0, y)
        },
        { sel: s.scrollTo, offset: s.offset ?? 0 },
      )
      await page.waitForTimeout(1600)
    }
    if (s.open !== undefined) {
      await page.evaluate((n) => window.__st.store.getState().openBook(n), s.open)
      await page.waitForTimeout(s.after ?? 3000)
    }
    const png = await page.screenshot({ type: 'png' })
    const file = `${OUT}/${s.name}-${lang}.webp`
    await sharp(png).resize({ width: 780 }).webp({ quality: 80 }).toFile(file)
    if (opt.preview) await sharp(png).resize({ width: 390 }).jpeg({ quality: 80 }).toFile(`${PREVIEW}/${s.name}-${lang}.jpg`)
    console.log('saved', file)
    await ctx.close()
  }
}
await browser.close()
console.log(problems.length ? 'PROBLEMS:\n' + [...new Set(problems)].join('\n') : 'no console errors')
