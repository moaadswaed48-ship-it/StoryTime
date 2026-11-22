// Studio export: any scene, at any moment, to a sharp picture; any stretch of time to a video; short loops.
//
//   node studio/scripts/export.mjs list
//   node studio/scripts/export.mjs still <scene> [--t=0] [--scale=2] [--format=png|webp|jpg] [--out=file]
//   node studio/scripts/export.mjs sheet <scene> --times=0,1,2.5 | --every=1 [--cols=4] [--tile=480] [--out=file.jpg]
//   node studio/scripts/export.mjs video <scene> [--from=0 --to=10] [--fps=24] [--scale=1] [--shots=2,3] [--captions=burn|none]
//   node studio/scripts/export.mjs loop  <scene> [--fps=24] [--scale=0.5] [--format=mp4|webp] [--out=file]
//
// Options for all: --lang=en|ar|he|da  --style=gouache|ink  --width=<CSS px> (the page width the picture is laid out
// at; default is the scene's own width).  --page=1|2 shows one page of a spread (with --width=390: a phone held upright).
//
// How it works: Vite serves the Studio's own page (studio/index.html); headless Chromium opens /?scene=<id>, the
// script calls window.__studio.seek(t) and captures the page; ffmpeg encodes. No clock is involved, so a frame is
// the same whether it is rendered first, last or alone. Character motion is held "on twos" inside the scenes
// (12 drawings a second) while the camera moves on every frame (24 a second).
// A film is rendered shot by shot into studio/out/<scene>/shot-NN.mp4 and joined without re-encoding, so a retime
// re-renders only the shots named with --shots.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { chromium } from 'playwright'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const REPO = resolve(ROOT, '..')
const args = process.argv.slice(2)
const [cmd, sceneId] = args.filter((a) => !a.startsWith('--'))
const opt = Object.fromEntries(args.filter((a) => a.startsWith('--')).map((a) => (a.includes('=') ? [a.slice(2, a.indexOf('=')), a.slice(a.indexOf('=') + 1)] : [a.slice(2), true])))
const lang = opt.lang ?? 'en'
const style = opt.style ?? 'gouache'
const CHROME = process.env.CHROMIUM_PATH
const LAUNCH = ['--force-color-profile=srgb', '--font-render-hinting=none', '--disable-lcd-text', '--disable-gpu-vsync']
const pad = (n, w = 5) => String(n).padStart(w, '0')
const ff = (a) => execFileSync('ffmpeg', ['-hide_banner', '-v', 'error', '-y', ...a], { stdio: 'inherit' })
const outPath = (name) => (opt.out ? resolve(String(opt.out)) : resolve(REPO, 'qa/out/studio', name))

if (!cmd || (cmd !== 'list' && !sceneId)) {
  console.error('usage: node studio/scripts/export.mjs list | still|sheet|video|loop <scene> [options]  (see the top of this file)')
  process.exit(1)
}

async function open(browser, base, { scale, width, captions }) {
  const probe = await browser.newPage()
  await probe.goto(`${base}/`)
  await probe.waitForFunction(() => window.__studio !== undefined, null, { timeout: 120000 })
  const list = await probe.evaluate(() => window.__studio.list)
  await probe.close()
  if (cmd === 'list') return { list }
  const meta = list.find((s) => s.id === sceneId)
  if (!meta) throw new Error(`no scene "${sceneId}". Scenes: ${list.map((s) => s.id).join(', ')}`)
  const cssW = Number(width ?? meta.W)
  const cssH = Math.round((cssW * meta.H) / (opt.page ? meta.W / 2 : meta.W))
  const make = async () => {
    const ctx = await browser.newContext({ viewport: { width: cssW, height: cssH }, deviceScaleFactor: scale })
    const page = await ctx.newPage()
    page.on('console', (m) => m.type() === 'error' && console.error('  [page]', m.text().slice(0, 500)))
    page.on('pageerror', (e) => console.error('  [page error]', String(e.stack ?? e).slice(0, 900)))
    await page.goto(`${base}/?scene=${sceneId}&lang=${lang}&style=${style}${captions ? '&captions=1' : ''}${opt.page ? `&page=${opt.page}` : ''}`)
    await page.waitForFunction(() => window.__studio !== undefined, null, { timeout: 120000 })
    const err = await page.evaluate(() => window.__studio.error)
    if (err) throw new Error(`scene failed to build:\n${err}`)
    await page.evaluate(() => document.fonts.ready)
    const cdp = await ctx.newCDPSession(page)
    const shoot = async (t, file, format) => {
      await page.evaluate((s) => window.__studio.seek(s), t)
      const r = await cdp.send('Page.captureScreenshot', { format, ...(format === 'png' ? {} : { quality: format === 'webp' ? 92 : 95 }), clip: { x: 0, y: 0, width: cssW, height: cssH, scale } })
      writeFileSync(file, Buffer.from(r.data, 'base64'))
    }
    return { page, shoot }
  }
  return { list, meta, make, cssW, cssH }
}

async function frames(make, dir, times, workers = 3) {
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
  let next = 0
  let done = 0
  const t0 = Date.now()
  await Promise.all(
    Array.from({ length: Math.min(workers, times.length) }, async () => {
      const { page, shoot } = await make()
      for (;;) {
        const i = next++
        if (i >= times.length) break
        await shoot(times[i], resolve(dir, `f${pad(i)}.jpg`), 'jpeg')
        if (++done % 60 === 0 || done === times.length) console.log(`  ${done}/${times.length} frames · ${((Date.now() - t0) / done / 1000).toFixed(2)} s/frame`)
      }
      await page.context().close()
    }),
  )
}

const X264 = ['-c:v', 'libx264', '-preset', 'slow', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2:in_range=full:out_range=tv:out_color_matrix=bt709:flags=lanczos+accurate_rnd+full_chroma_int,format=yuv420p', '-an']

async function main() {
  const server = await createServer({ root: ROOT, configFile: resolve(ROOT, 'vite.config.ts'), server: { port: 5300 + Math.floor(Math.random() * 300), strictPort: false, hmr: false, watch: null } })
  await server.listen()
  const base = `http://127.0.0.1:${server.httpServer.address().port}`
  const browser = await chromium.launch({ executablePath: CHROME, args: LAUNCH })
  try {
    const scale = Number(opt.scale ?? (cmd === 'still' ? 2 : cmd === 'loop' ? 0.5 : 1))
    const captions = (opt.captions ?? (cmd === 'video' ? 'burn' : 'none')) === 'burn'
    const s = await open(browser, base, { scale, width: opt.width, captions })
    if (cmd === 'list') {
      for (const x of s.list) console.log(`${x.id.padEnd(22)} ${String(x.W).padStart(4)}×${String(x.H).padEnd(4)} ${x.duration ? `${x.duration} s` : 'still'}${x.loop ? ' loop' : ''}${x.shots.length > 1 ? ` · ${x.shots.length} shots` : ''}  ${x.title}`)
      return
    }
    const { meta, make } = s
    const t0 = Date.now()

    if (cmd === 'still') {
      const format = String(opt.format ?? 'png').replace('jpg', 'jpeg')
      const file = outPath(`${sceneId}${lang !== 'en' ? `-${lang}` : ''}${opt.page ? `-page${opt.page}` : ''}${opt.width ? `-${opt.width}` : ''}.${format === 'jpeg' ? 'jpg' : format}`)
      mkdirSync(dirname(file), { recursive: true })
      const { shoot } = await make()
      await shoot(Number(opt.t ?? 0), file, format)
      console.log(`${file} · ${(statSync(file).size / 1e6).toFixed(2)} MB`)
      return
    }

    if (cmd === 'sheet') {
      const times = opt.times ? String(opt.times).split(',').map(Number) : Array.from({ length: Math.ceil(meta.duration / Number(opt.every ?? 1)) }, (_, i) => i * Number(opt.every ?? 1))
      const dir = resolve(ROOT, 'out', sceneId, 'sheet')
      await frames(make, dir, times, 2)
      const cols = Number(opt.cols ?? Math.min(4, times.length))
      const file = outPath(`${sceneId}-sheet.jpg`)
      mkdirSync(dirname(file), { recursive: true })
      ff(['-framerate', '1', '-i', resolve(dir, 'f%05d.jpg'), '-vf', `scale=${opt.tile ?? 480}:-1,tile=${cols}x${Math.ceil(times.length / cols)}:padding=6:margin=6:color=0xf8efdc`, '-frames:v', '1', '-q:v', '3', file])
      console.log(`${file} · ${times.length} frames at ${times.join(', ')} s`)
      return
    }

    const fps = Number(opt.fps ?? 24)
    const work = resolve(ROOT, 'out', sceneId)
    mkdirSync(work, { recursive: true })

    if (cmd === 'loop') {
      const n = Math.round(meta.duration * fps)
      const dir = resolve(work, 'loop')
      await frames(make, dir, Array.from({ length: n }, (_, i) => i / fps))
      const format = String(opt.format ?? 'mp4')
      const file = outPath(`${sceneId}-loop.${format}`)
      mkdirSync(dirname(file), { recursive: true })
      if (format === 'webp') ff(['-framerate', String(fps), '-i', resolve(dir, 'f%05d.jpg'), '-c:v', 'libwebp', '-loop', '0', '-q:v', '78', '-an', file])
      else ff(['-framerate', String(fps), '-i', resolve(dir, 'f%05d.jpg'), ...X264, '-crf', String(opt.crf ?? 20), '-movflags', '+faststart', file])
      rmSync(dir, { recursive: true, force: true })
      console.log(`${file} · ${(statSync(file).size / 1e6).toFixed(2)} MB · ${n} frames, loops · ${Math.round((Date.now() - t0) / 1000)} s`)
      return
    }

    if (cmd === 'video') {
      const from = Number(opt.from ?? 0)
      const to = Number(opt.to ?? meta.duration)
      const cuts = [...meta.shots.filter((c) => c > from && c < to), to]
      const only = opt.shots ? String(opt.shots).split(',').map(Number) : null
      const parts = []
      let start = from
      for (let i = 0; i < cuts.length; i++) {
        const end = cuts[i]
        const n = Math.round((end - start) * fps)
        const first = Math.round(start * fps)
        const part = resolve(work, `shot-${pad(i + 1, 2)}${captions ? `-${lang}` : ''}.mp4`)
        parts.push(part)
        if (only && !only.includes(i + 1) && existsSync(part)) {
          console.log(`shot ${i + 1}: kept (${part})`)
        } else {
          console.log(`shot ${i + 1}: ${start.toFixed(2)}…${end.toFixed(2)} s · ${n} frames at ${fps}/s · scale ${scale}`)
          const dir = resolve(work, `frames-${i + 1}`)
          await frames(make, dir, Array.from({ length: n }, (_, f) => (first + f) / fps))
          ff(['-framerate', String(fps), '-i', resolve(dir, 'f%05d.jpg'), ...X264, '-crf', String(opt.crf ?? 17), '-tune', 'animation', '-r', String(fps), part])
          if (!opt.keep) rmSync(dir, { recursive: true, force: true })
        }
        start = end
      }
      const file = outPath(`${sceneId}${lang !== 'en' ? `-${lang}` : ''}.mp4`)
      mkdirSync(dirname(file), { recursive: true })
      const listFile = resolve(work, 'concat.txt')
      writeFileSync(listFile, parts.map((p) => `file '${p}'`).join('\n'))
      ff(['-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', '-movflags', '+faststart', file])
      // captions as WebVTT for every language, beside the film
      const page = (await make()).page
      for (const l of ['ar', 'he', 'en', 'da']) {
        const vtt = await page.evaluate((l2) => window.__studio.vtt(l2), l)
        if (vtt.includes('-->')) writeFileSync(file.replace(/(-(ar|he|da))?\.mp4$/, `.${l}.vtt`), vtt)
      }
      console.log(`${file} · ${(statSync(file).size / 1e6).toFixed(2)} MB · ${(to - from).toFixed(2)} s · ${cuts.length} shot(s) · rendered in ${Math.round((Date.now() - t0) / 1000)} s`)
      return
    }
    throw new Error(`unknown command "${cmd}"`)
  } finally {
    await browser.close().catch(() => {})
    await server.close()
  }
}

main().catch((e) => {
  console.error(String(e.stack ?? e))
  process.exit(1)
})
