// Instruction pictures: export stills, loops, contact sheets and the cast sheet for the three directions.
//
//   node studio/scripts/instructions-export.mjs card  <dir> <activity> <card> [--lang=en] [--t=1.2] [--width=390] [--scale=2] [--out=file.png]
//   node studio/scripts/instructions-export.mjs strip <dir> <activity> <card> [--n=8] [--lang=en]      a loop as a strip of frames (for checking)
//   node studio/scripts/instructions-export.mjs stills  [dir]     every card, English and Arabic, as it looks on a phone (390 px wide, 2x)
//   node studio/scripts/instructions-export.mjs loops   [dir]     every moving step as MP4 and animated WebP, English and Arabic
//   node studio/scripts/instructions-export.mjs contact [dir]     the whole set on a phone (per activity and language) and on a tablet, and one sheet of both
//   node studio/scripts/instructions-export.mjs cast               the instruction cast
//   node studio/scripts/instructions-export.mjs all                everything above
//
// dir: above | hands | stage (default: all three).  activity: here-you-are | talking-stick.  card: materials | s1 … s4.
// Finished pictures go to docs/previews/instructions/; working frames and checks to studio/out/instructions/ (ignored by git).
//
// How it works: Vite serves the small page in studio/scripts/instructions/; headless Chromium opens it, the script
// calls window.__inst.seek(t) and captures the page; ffmpeg encodes. Nothing depends on a clock, so a frame is the
// same whether it is rendered first, last or alone.
import { execFileSync } from 'node:child_process'
import { mkdirSync, readdirSync, rmSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { chromium } from 'playwright'

const HERE = dirname(fileURLToPath(import.meta.url))
const PAGE = resolve(HERE, 'instructions')
const REPO = resolve(HERE, '../..')
const OUT = resolve(REPO, 'docs/previews/instructions')
const WORK = resolve(REPO, 'studio/out/instructions')
const args = process.argv.slice(2)
const pos = args.filter((a) => !a.startsWith('--'))
const cmd = pos[0]
const opt = Object.fromEntries(args.filter((a) => a.startsWith('--')).map((a) => (a.includes('=') ? [a.slice(2, a.indexOf('=')), a.slice(a.indexOf('=') + 1)] : [a.slice(2), true])))
const DIRS = ['above', 'hands', 'stage']
const ACTS = ['here-you-are', 'talking-stick']
const CARDS = ['materials', 's1', 's2', 's3', 's4']
const LOOPS = [['here-you-are', 's2'], ['talking-stick', 's3']]
const LANGS = String(opt.langs ?? 'en,ar').split(',')
const LAUNCH = ['--force-color-profile=srgb', '--font-render-hinting=none', '--disable-lcd-text', '--disable-gpu-vsync']
const ff = (a) => execFileSync('ffmpeg', ['-hide_banner', '-v', 'error', '-y', ...a], { stdio: 'inherit' })
const mb = (f) => `${(statSync(f).size / 1e6).toFixed(2)} MB`
const pad = (n, w = 4) => String(n).padStart(w, '0')
const short = (a) => (a === 'here-you-are' ? 'a' : 'b')

let base
let browser
async function open(query, width, scale = 2) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: scale })
  const page = await ctx.newPage()
  page.on('console', (m) => m.type() === 'error' && console.error('  [page]', m.text().slice(0, 500)))
  page.on('pageerror', (e) => console.error('  [page error]', String(e.stack ?? e).slice(0, 900)))
  await page.goto(`${base}/?${query}`)
  await page.waitForFunction(() => window.__inst !== undefined, null, { timeout: 120000 })
  const err = await page.evaluate(() => window.__inst.error)
  if (err) throw new Error(`page failed:\n${err}`)
  await page.evaluate(() => document.fonts.ready)
  const h = await page.evaluate(() => Math.ceil(document.getElementById('stage').getBoundingClientRect().height))
  const info = await page.evaluate(() => ({ loop: window.__inst.loop ?? 0, still: window.__inst.still ?? 0 }))
  const shoot = async (file, t) => {
    if (t !== undefined) await page.evaluate((s) => window.__inst.seek(s), t)
    await page.screenshot({ path: file, clip: { x: 0, y: 0, width, height: h }, type: file.endsWith('.png') ? 'png' : 'jpeg', ...(file.endsWith('.png') ? {} : { quality: Number(opt.q ?? 88) }) })
  }
  return { page, shoot, h, ...info, close: () => ctx.close() }
}

async function card(dir, act, key, lang, file, { t, width = 390, scale = 2 } = {}) {
  mkdirSync(dirname(file), { recursive: true })
  const p = await open(`view=card&dir=${dir}&act=${act}&card=${key}&lang=${lang}`, width, scale)
  await p.shoot(file, t ?? p.still)
  await p.close()
}

async function loopFrames(dir, act, key, lang, fps, width, scale) {
  const tmp = resolve(WORK, 'frames', `${dir}-${act}-${key}-${lang}`)
  rmSync(tmp, { recursive: true, force: true })
  mkdirSync(tmp, { recursive: true })
  const q = `view=card&dir=${dir}&act=${act}&card=${key}&lang=${lang}`
  const first = await open(q, width, scale)
  const n = Math.round(first.loop * fps)
  if (!n) throw new Error(`${dir}/${act}/${key} is not a loop`)
  let next = 0
  const run = async (p) => {
    for (;;) {
      const i = next++
      if (i >= n) break
      await p.shoot(resolve(tmp, `f${pad(i)}.png`), i / fps)
    }
    await p.close()
  }
  await Promise.all([run(first), ...(await Promise.all([1, 2].map(() => open(q, width, scale)))).map(run)])
  return { tmp, n, seconds: first.loop }
}

const X264 = ['-c:v', 'libx264', '-preset', 'slow', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2:flags=lanczos,format=yuv420p', '-an', '-movflags', '+faststart']

async function loop(dir, act, key, lang) {
  const fps = 24
  const { tmp, n, seconds } = await loopFrames(dir, act, key, lang, fps, 390, 1.5)
  const stem = resolve(OUT, dir, `${short(act)}-${key}-${lang}`)
  mkdirSync(dirname(stem), { recursive: true })
  ff(['-framerate', String(fps), '-i', resolve(tmp, 'f%04d.png'), ...X264, '-crf', '21', `${stem}.mp4`])
  // the drawings change 12 (or 8) times a second, so the WebP keeps every second frame
  ff(['-framerate', String(fps), '-i', resolve(tmp, 'f%04d.png'), '-vf', 'fps=12', '-c:v', 'libwebp', '-loop', '0', '-q:v', '74', '-compression_level', '6', '-an', `${stem}.webp`])
  rmSync(tmp, { recursive: true, force: true })
  console.log(`${stem}.mp4 ${mb(`${stem}.mp4`)} · .webp ${mb(`${stem}.webp`)} · ${n} frames, ${seconds} s`)
}

async function strip(dir, act, key, lang, n = 8) {
  const q = `view=card&dir=${dir}&act=${act}&card=${key}&lang=${lang}`
  const p = await open(q, 390, 1)
  const tmp = resolve(WORK, 'frames', `strip-${dir}-${act}-${key}`)
  rmSync(tmp, { recursive: true, force: true })
  mkdirSync(tmp, { recursive: true })
  for (let i = 0; i < n; i++) await p.shoot(resolve(tmp, `f${pad(i)}.png`), (i / n) * p.loop)
  await p.close()
  const file = resolve(WORK, 'strips', `${dir}-${short(act)}-${key}-${lang}.jpg`)
  mkdirSync(dirname(file), { recursive: true })
  const cols = Math.min(4, n)
  ff(['-framerate', '1', '-i', resolve(tmp, 'f%04d.png'), '-vf', `tile=${cols}x${Math.ceil(n / cols)}:padding=6:margin=6:color=0xf4ecdd`, '-frames:v', '1', '-q:v', '3', file])
  rmSync(tmp, { recursive: true, force: true })
  console.log(file)
  return file
}

async function setShot(dir, lang, cols, width, scale, file, act) {
  mkdirSync(dirname(file), { recursive: true })
  const p = await open(`view=set&dir=${dir}&lang=${lang}&cols=${cols}${act ? `&act=${act}` : ''}&pad=${cols > 1 ? 28 : 16}`, width, scale)
  await p.shoot(file)
  await p.close()
  return p.h * scale
}

async function contact(dir) {
  const w = resolve(WORK, 'contact', dir)
  mkdirSync(w, { recursive: true })
  // the phone, at its real size (390 px wide, 2x), one tall picture per activity and language
  const cols = []
  for (const lang of LANGS)
    for (const act of ACTS) {
      const f = resolve(OUT, `phone-${dir}-${short(act)}-${lang}.jpg`)
      await setShot(dir, lang, 1, 390, 2, f, act)
      cols.push(f)
      console.log(`${f} ${mb(f)}`)
    }
  // the tablet: three cards to a row, both activities
  const tablets = []
  for (const lang of LANGS) {
    const f = resolve(OUT, `tablet-${dir}-${lang}.jpg`)
    await setShot(dir, lang, 3, 820, 1.5, f)
    tablets.push(f)
    console.log(`${f} ${mb(f)}`)
  }
  // one sheet: the phone columns side by side, then the tablet, on the page colour
  const H = 2300
  const inputs = [...cols, tablets[0]]
  const fc = [
    ...cols.map((_, i) => `[${i}:v]scale=390:-1:flags=lanczos,pad=390:${H}:0:0:color=0xf4ecdd[c${i}]`),
    `[${cols.length}:v]scale=820:-1:flags=lanczos,pad=820:${H}:0:0:color=0xf4ecdd[c${cols.length}]`,
    `${inputs.map((_, i) => `[c${i}]`).join('')}hstack=inputs=${inputs.length}[s]`,
    `[s]pad=iw+60:ih+60:30:30:color=0xf4ecdd[o]`,
  ].join(';')
  const sheet = resolve(OUT, `contact-${dir}.jpg`)
  ff([...inputs.flatMap((f) => ['-i', f]), '-filter_complex', fc, '-map', '[o]', '-frames:v', '1', '-q:v', '4', sheet])
  console.log(`${sheet} ${mb(sheet)}`)
}

async function main() {
  const server = await createServer({ root: PAGE, configFile: resolve(PAGE, 'vite.config.ts'), server: { port: 5600 + Math.floor(Math.random() * 300), strictPort: false, hmr: false, watch: null } })
  await server.listen()
  base = `http://127.0.0.1:${server.httpServer.address().port}`
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, args: LAUNCH })
  const dirs = pos[1] && DIRS.includes(pos[1]) ? [pos[1]] : DIRS
  try {
    if (cmd === 'card') {
      const [, dir, act, key] = pos
      const lang = String(opt.lang ?? 'en')
      const file = opt.out ? resolve(String(opt.out)) : resolve(WORK, 'cards', `${dir}-${short(act)}-${key}-${lang}${opt.t ? `-t${opt.t}` : ''}.png`)
      await card(dir, act, key, lang, file, { t: opt.t !== undefined ? Number(opt.t) : undefined, width: Number(opt.width ?? 390), scale: Number(opt.scale ?? 2) })
      console.log(file)
    } else if (cmd === 'strip') {
      await strip(pos[1], pos[2], pos[3], String(opt.lang ?? 'en'), Number(opt.n ?? 8))
    } else if (cmd === 'check') {
      // quick look: every card of a direction on one sheet (English), plus the loops as strips
      for (const dir of dirs) {
        const f = resolve(WORK, 'check', `${dir}-${opt.lang ?? 'en'}.jpg`)
        await setShot(dir, String(opt.lang ?? 'en'), 5, 1900, 1, f)
        console.log(f)
      }
    } else if (cmd === 'stills' || cmd === 'all') {
      for (const dir of dirs)
        for (const act of ACTS)
          for (const key of CARDS)
            for (const lang of LANGS) await card(dir, act, key, lang, resolve(OUT, dir, `${short(act)}-${key}-${lang}.jpg`))
      console.log(`stills: ${dirs.join(', ')} → ${OUT}`)
    }
    if (cmd === 'loops' || cmd === 'all') for (const dir of dirs) for (const [act, key] of LOOPS) for (const lang of LANGS) await loop(dir, act, key, lang)
    if (cmd === 'contact' || cmd === 'all') for (const dir of dirs) await contact(dir)
    if (cmd === 'cast' || cmd === 'all') {
      const p = await open('view=cast&dir=stage', 1400, 1.5)
      const f = resolve(OUT, 'cast.jpg')
      mkdirSync(OUT, { recursive: true })
      await p.shoot(f)
      await p.close()
      console.log(`${f} ${mb(f)}`)
    }
    if (cmd === 'list') console.log(readdirSync(OUT).join('\n'))
  } finally {
    await browser.close().catch(() => {})
    await server.close()
  }
}

if (!cmd) {
  console.error('usage: node studio/scripts/instructions-export.mjs card|strip|check|stills|loops|contact|cast|all … (see the top of this file)')
  process.exit(1)
}
main().catch((e) => {
  console.error(String(e.stack ?? e))
  process.exit(1)
})
