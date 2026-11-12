// Extracts the frames of the six master clips so the studio can draw footage frame-accurately.
//   node scripts/prepare.mjs     → .cache/frames/<clip>/0001.jpg … (git-ignored, ~120 MB)
// The masters are 24 fps, 121 frames each. Nothing is re-timed or interpolated here.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = resolve(ROOT, '../assets-src/film/master')
for (const id of ['v01', 'v04', 'v06', 'v08', 'v11', 'v12']) {
  const out = resolve(ROOT, '.cache/frames', id)
  if (existsSync(out) && readdirSync(out).length >= 120 && !process.argv.includes('--force')) {
    console.log(id, 'already extracted')
    continue
  }
  mkdirSync(out, { recursive: true })
  execFileSync('ffmpeg', ['-hide_banner', '-v', 'error', '-y', '-i', resolve(SRC, `${id}.mp4`), '-vsync', '0', '-q:v', '1', '-qmin', '1', '-pix_fmt', 'yuvj444p', resolve(out, '%04d.jpg')], { stdio: 'inherit' })
  console.log(id, readdirSync(out).length, 'frames')
}
