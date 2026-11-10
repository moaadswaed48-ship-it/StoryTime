// Turns the generated originals in assets-src/film into web media under public/.
// Usage: node scripts/assets/build-media.mjs   (needs ffmpeg + sharp)
import { execFileSync } from 'node:child_process'
import { mkdirSync, existsSync, rmSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import sharp from 'sharp'

const SRC = 'assets-src/film'
const ff = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' })
const pad = (n) => String(n).padStart(2, '0')
for (const d of ['public/story', 'public/film', 'public/film/scrub/d', 'public/film/scrub/m']) mkdirSync(d, { recursive: true })

// 1. keyframes: book pages, posters, thumbnails
for (let i = 1; i <= 12; i++) {
  const src = `${SRC}/k${pad(i)}.png`
  await sharp(src).resize(1344).webp({ quality: 82 }).toFile(`public/story/k${pad(i)}.webp`)
  await sharp(src).resize(640).webp({ quality: 74 }).toFile(`public/story/k${pad(i)}-sm.webp`)
}
await sharp(`${SRC}/cover.png`).resize(900).webp({ quality: 84 }).toFile('public/story/cover.webp')
await sharp(`${SRC}/cover.png`).resize(360).webp({ quality: 78 }).toFile('public/story/cover-sm.webp')
await sharp(`${SRC}/k08.png`).resize(1200, 630, { fit: 'cover', position: 'centre' }).jpeg({ quality: 84 }).toFile('public/og.jpg')

// 2. scene clips (silent, short GOP so they start instantly and loop cleanly)
const CLIPS = [1, 4, 6, 8, 11, 12]
for (const n of CLIPS) {
  ff(['-i', `${SRC}/v${pad(n)}.mp4`, '-an', '-vf', 'scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,fps=24', '-c:v', 'libx264', '-preset', 'slow', '-crf', '26', '-g', '24', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', `public/film/c${pad(n)}.mp4`])
}

// 3. hero loop: the clip was generated with identical first and last frame, so drop the duplicate tail frame
ff(['-i', `${SRC}/v08.mp4`, '-an', '-vf', 'trim=end_frame=120,scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=24', '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-g', '24', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', 'public/film/hero-1080.mp4'])
ff(['-i', `${SRC}/v08.mp4`, '-an', '-vf', 'trim=end_frame=120,scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,fps=24', '-c:v', 'libx264', '-preset', 'slow', '-crf', '26', '-g', '24', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', 'public/film/hero-720.mp4'])
ff(['-i', `${SRC}/v08.mp4`, '-frames:v', '1', '-vf', 'scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080', '-q:v', '3', 'public/film/hero-poster.jpg'])

// 4. scroll-scrub image sequence from the wind scene (desktop + phone sets)
for (const [dir, w, q] of [['d', 1280, 70], ['m', 720, 62]]) {
  const out = `public/film/scrub/${dir}`
  for (const f of readdirSync(out)) rmSync(`${out}/${f}`)
  ff(['-i', `${SRC}/v06.mp4`, '-vf', `scale=${w}:-2`, '-c:v', 'libwebp', '-quality', String(q), '-compression_level', '6', `${out}/%04d.webp`])
}
const frames = readdirSync('public/film/scrub/d').length
writeFileSync('public/film/scrub/meta.json', JSON.stringify({ frames, fps: 24, sets: { d: 1280, m: 720 }, pattern: 'film/scrub/{set}/{0000}.webp' }))

const size = (p) => (existsSync(p) ? (statSync(p).isDirectory() ? readdirSync(p).reduce((a, f) => a + size(`${p}/${f}`), 0) : statSync(p).size) : 0)
for (const p of ['public/story', 'public/film/scrub/d', 'public/film/scrub/m', 'public/film']) console.log(p, (size(p) / 1e6).toFixed(1) + ' MB')
for (const f of readdirSync('public/film').filter((f) => f.endsWith('.mp4'))) console.log(' ', f, (statSync(`public/film/${f}`).size / 1e6).toFixed(2) + ' MB')
console.log('scrub frames:', frames)
