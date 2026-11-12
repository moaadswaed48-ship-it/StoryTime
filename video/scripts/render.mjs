// Renders one composition to a video (or stills). Run from video/:
//
//   node scripts/render.mjs trailer-16x9            → ../public/film/trailer-16x9.mp4
//   node scripts/render.mjs trailer-9x16            → ../public/film/trailer-9x16.mp4
//   node scripts/render.mjs trailer-poster          → ../public/film/trailer-poster.jpg
//   node scripts/render.mjs story                   → ../public/film/story.mp4 + story.json
//
// Options
//   --scale=0.5        draft at half size (everything scales, type included)
//   --from=3 --to=8    only this range of seconds (drafts)
//   --stills=0,2.5,7   write JPEG stills at these seconds to out/<comp>/stills/ instead of a video
//   --every=1          write a still every N seconds (review sheets)
//   --workers=2        parallel browsers (software WebGL already uses every core; more does not help)
//   --out=path.mp4     write somewhere else (drafts never overwrite the published files)
//   --keep             keep the captured frames
//   --no-audio         skip the music
//   --audio-only       keep the published picture, re-make the music and re-mux it (seconds, not minutes)
//
// How it works: Vite serves the studio page; each worker opens /?comp=<id>, calls
// window.__film.seek(n) for its share of the frames and captures the page; ffmpeg encodes the
// frames with the music written by scripts/music.mjs. No clock is involved anywhere, so a frame is
// the same whether it is rendered first, last or alone. The server does not watch files, so editing
// sources during a render cannot reload the page half-way.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { chromium } from 'playwright-core'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const SITE_FILM = resolve(ROOT, '../public/film')
const args = process.argv.slice(2)
const comp = args.find((a) => !a.startsWith('--'))
const opt = Object.fromEntries(
  args
    .filter((a) => a.startsWith('--'))
    .map((a) => {
      const i = a.indexOf('=')
      return i < 0 ? [a.slice(2), true] : [a.slice(2, i), a.slice(i + 1)]
    }),
)
if (!comp) {
  console.error('usage: node scripts/render.mjs <trailer-16x9|trailer-9x16|trailer-poster|story|lab> [options]')
  process.exit(1)
}

/** Per composition: where the finished file goes, its size ceiling and its music. */
const TARGETS = {
  'trailer-16x9': { out: `${SITE_FILM}/trailer-16x9.mp4`, maxMB: 12, music: 'trailer', crf: 18 },
  'trailer-9x16': { out: `${SITE_FILM}/trailer-9x16.mp4`, maxMB: 12, music: 'trailer', crf: 18 },
  'trailer-poster': { out: `${SITE_FILM}/trailer-poster.jpg`, still: true },
  story: { out: `${SITE_FILM}/story.mp4`, maxMB: 14, music: 'story', crf: 19, json: `${SITE_FILM}/story.json` },
  lab: { out: `${ROOT}/out/lab.mp4`, maxMB: 50, crf: 20 },
}
const target = TARGETS[comp]
if (!target) throw new Error(`unknown composition ${comp}`)
const scale = Number(opt.scale ?? 1)
const draft = scale !== 1 || opt.from !== undefined || opt.to !== undefined
const workDir = resolve(ROOT, 'out', comp)
const framesDir = resolve(workDir, 'frames')
const stillsDir = resolve(workDir, 'stills')
const CHROME = process.env.CHROMIUM_PATH ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined)
const LAUNCH_ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-accelerated-2d-canvas', '--disable-gpu-vsync', '--force-color-profile=srgb', '--font-render-hinting=none', '--disable-lcd-text']

const pad = (n, w = 5) => String(n).padStart(w, '0')
const ff = (a, o = {}) => execFileSync('ffmpeg', ['-hide_banner', '-v', 'error', '-y', ...a], { stdio: 'inherit', ...o })

async function openPage(browser, url, W, H) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: scale })
  const page = await ctx.newPage()
  page.on('console', (m) => {
    if (m.type() === 'error') console.error('  [page]', m.text().slice(0, 600))
  })
  page.on('pageerror', (e) => console.error('  [page error]', String(e).slice(0, 600)))
  await page.goto(url)
  await page.waitForFunction(() => window.__film !== undefined, null, { timeout: 180000, polling: 200 })
  const meta = await page.evaluate(() => ({ ready: window.__film.ready, error: window.__film.error, frames: window.__film.frames, fps: window.__film.fps, W: window.__film.W, H: window.__film.H }))
  if (!meta.ready) throw new Error(`composition failed to build:\n${meta.error}`)
  return { page, meta }
}

async function capture(page, frame, file, type) {
  await page.evaluate((n) => window.__film.seek(n), frame)
  // straight from the compositor (no scrolling, caret hiding or font waits): the page is already final
  page.__cdp ??= await page.context().newCDPSession(page)
  const r = await page.__cdp.send('Page.captureScreenshot', type === 'jpeg' ? { format: 'jpeg', quality: 96, optimizeForSpeed: true } : { format: 'png', optimizeForSpeed: true })
  writeFileSync(file, Buffer.from(r.data, 'base64'))
}

async function main() {
  const t0 = Date.now()
  if (opt['audio-only']) {
    const music = resolve(ROOT, '.cache/music', `${target.music}.wav`)
    execFileSync('node', [resolve(HERE, 'music.mjs'), target.music, `--out=${music}`], { stdio: 'inherit' })
    const tmp = target.out.replace(/\.mp4$/, '.remux.mp4')
    ff(['-i', target.out, '-i', music, '-map', '0:v', '-c:v', 'copy', '-map', '1:a', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-shortest', '-movflags', '+faststart', tmp])
    renameSync(tmp, target.out)
    console.log(`${target.out} · audio replaced · ${(statSync(target.out).size / 1e6).toFixed(2)} MB`)
    return
  }
  const server = await createServer({ root: ROOT, configFile: resolve(ROOT, 'vite.config.ts'), server: { port: 5180 + Math.floor(Math.random() * 400), strictPort: false, hmr: false, watch: null } })
  await server.listen()
  const port = server.config.server.port ?? server.httpServer.address().port
  const base = `http://127.0.0.1:${server.httpServer.address().port ?? port}`
  const url = `${base}/?comp=${comp}`
  const browsers = []
  try {
    // probe: size and length come from the composition itself
    const probeBrowser = await chromium.launch({ executablePath: CHROME, args: LAUNCH_ARGS })
    browsers.push(probeBrowser)
    // the page's own W/H are only known after it builds: open once at a safe size, then reopen
    let { page, meta } = await openPage(probeBrowser, url, 1920, 1920)
    await page.context().close()
    const { W, H, fps, frames } = meta

    /* stills */
    if (target.still || opt.stills !== undefined || opt.every !== undefined) {
      if (!target.still || opt.stills !== undefined || opt.every !== undefined) rmSync(stillsDir, { recursive: true, force: true })
      mkdirSync(stillsDir, { recursive: true })
      const times = target.still && opt.stills === undefined && opt.every === undefined ? [0] : opt.every !== undefined ? Array.from({ length: Math.ceil(frames / fps / Number(opt.every)) }, (_, i) => i * Number(opt.every)) : String(opt.stills).split(',').map(Number)
      ;({ page } = await openPage(probeBrowser, url, W, H))
      for (const s of times) {
        const f = Math.min(frames - 1, Math.round(s * fps))
        const file = target.still && opt.stills === undefined && opt.every === undefined ? (opt.out ? resolve(opt.out) : target.out) : resolve(stillsDir, `s${pad(Math.round(s * 100), 6)}.jpg`)
        mkdirSync(dirname(file), { recursive: true })
        await capture(page, f, file, 'jpeg')
        console.log('still', s, '→', file)
      }
      return
    }

    /* frames */
    const from = Math.max(0, Math.round(Number(opt.from ?? 0) * fps))
    const to = Math.min(frames, opt.to !== undefined ? Math.round(Number(opt.to) * fps) : frames)
    const count = to - from
    rmSync(framesDir, { recursive: true, force: true })
    mkdirSync(framesDir, { recursive: true })
    const nWorkers = Math.max(1, Math.min(Number(opt.workers ?? 2), count))
    const type = draft ? 'jpeg' : 'png'
    const ext = type === 'jpeg' ? 'jpg' : 'png'
    console.log(`${comp}: ${W}×${H} @${fps} · frames ${from}…${to - 1} (${(count / fps).toFixed(2)} s) · scale ${scale} · ${nWorkers} workers`)
    let next = from
    let done = 0
    const CHUNK = 12
    const worker = async (id) => {
      const browser = id === 0 ? probeBrowser : await chromium.launch({ executablePath: CHROME, args: LAUNCH_ARGS })
      if (id !== 0) browsers.push(browser)
      const { page } = await openPage(browser, url, W, H)
      for (;;) {
        const start = next
        if (start >= to) break
        next = Math.min(to, start + CHUNK)
        for (let f = start; f < next; f++) {
          await capture(page, f, resolve(framesDir, `f${pad(f - from)}.${ext}`), type)
          done++
          if (done % 48 === 0 || done === count) {
            const el = (Date.now() - t0) / 1000
            console.log(`  ${done}/${count} frames · ${(el / done).toFixed(2)} s/frame · ${Math.round(el)} s elapsed`)
          }
        }
      }
    }
    await Promise.all(Array.from({ length: nWorkers }, (_, i) => worker(i)))

    /* music */
    let music = null
    if (target.music && !opt['no-audio']) {
      music = resolve(ROOT, '.cache/music', `${target.music}.wav`)
      execFileSync('node', [resolve(HERE, 'music.mjs'), target.music, `--out=${music}`], { stdio: 'inherit' })
    }

    /* encode */
    const out = opt.out ? resolve(opt.out) : draft ? resolve(ROOT, 'out', `${comp}-draft.mp4`) : target.out
    mkdirSync(dirname(out), { recursive: true })
    const input = ['-framerate', String(fps), '-i', resolve(framesDir, `f%05d.${ext}`)]
    const audioIn = music ? ['-ss', String(from / fps), '-t', String(count / fps), '-i', music] : []
    const vcodec = (extra) => ['-c:v', 'libx264', '-preset', 'slow', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-vf', 'scale=in_range=full:out_range=tv:out_color_matrix=bt709:flags=lanczos+accurate_rnd+full_chroma_int,format=yuv420p', ...extra]
    const acodec = music ? ['-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-shortest'] : ['-an']
    const tail = ['-movflags', '+faststart', '-r', String(fps), out]
    ff([...input, ...audioIn, ...vcodec(['-crf', String(opt.crf ?? target.crf ?? 19), '-tune', 'film']), ...acodec, ...tail])
    let mb = statSync(out).size / 1e6
    if (!draft && target.maxMB && mb > target.maxMB) {
      // too big for WhatsApp/the web: two-pass to just under the ceiling
      const secs = count / fps
      const kbps = Math.floor(((target.maxMB * 0.965 * 8000) / secs - (music ? 160 : 0)) * 0.99)
      console.log(`  ${mb.toFixed(2)} MB at CRF is over ${target.maxMB} MB → two-pass at ${kbps} kbps`)
      const log = resolve(workDir, 'x264pass')
      ff([...input, ...vcodec(['-b:v', `${kbps}k`, '-pass', '1', '-passlogfile', log]), '-an', '-f', 'null', '/dev/null'])
      ff([...input, ...audioIn, ...vcodec(['-b:v', `${kbps}k`, '-pass', '2', '-passlogfile', log]), ...acodec, ...tail])
      mb = statSync(out).size / 1e6
    }
    if (target.json && !draft) {
      const tl = JSON.parse(readFileSync(resolve(ROOT, 'src/comps/story.timeline.json'), 'utf8'))
      writeFileSync(target.json, JSON.stringify({ duration: tl.duration, scenes: tl.scenes.map((s) => ({ scene: s.scene, start: s.start, end: s.end })) }, null, 2) + '\n')
      console.log('wrote', target.json)
    }
    if (!opt.keep) rmSync(framesDir, { recursive: true, force: true })
    console.log(`${out} · ${mb.toFixed(2)} MB · ${(count / fps).toFixed(2)} s · rendered in ${Math.round((Date.now() - t0) / 1000)} s`)
  } finally {
    for (const b of browsers) await b.close().catch(() => {})
    await server.close()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
