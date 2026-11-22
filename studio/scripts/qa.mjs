// Checks on the finished files. Run from video/:
//   node scripts/qa.mjs                  → all published videos
//   node scripts/qa.mjs trailer-16x9     → one
// For each video it prints: container facts (codec, pixel format, size, duration, +faststart), loudness
// (integrated LUFS, true peak), where the picture cuts fall against the music's bar lines, and it writes
// one frame per second to out/qa/<name>/sNNN.jpg plus contact sheets (out/qa/<name>/sheet-NN.jpg).
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, openSync, readSync, closeSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const FILM = resolve(ROOT, '../public/film')
const TL = (n) => JSON.parse(readFileSync(resolve(ROOT, `src/comps/${n}.timeline.json`), 'utf8'))
const VIDEOS = {
  'trailer-16x9': { file: `${FILM}/trailer-16x9.mp4`, maxMB: 12, tl: 'trailer', tile: '4x3', tw: 480 },
  'trailer-9x16': { file: `${FILM}/trailer-9x16.mp4`, maxMB: 12, tl: 'trailer', tile: '6x2', tw: 320 },
  story: { file: `${FILM}/story.mp4`, maxMB: 14, tl: 'story', tile: '4x3', tw: 480 },
}
const only = process.argv[2]
const run = (cmd, args) => spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 1 << 28 })

for (const [name, v] of Object.entries(VIDEOS)) {
  if (only && only !== name) continue
  if (!existsSync(v.file)) {
    console.log(`${name}: missing (${v.file})`)
    continue
  }
  const probe = JSON.parse(run('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', v.file]).stdout)
  const vs = probe.streams.find((s) => s.codec_type === 'video')
  const as = probe.streams.find((s) => s.codec_type === 'audio')
  const mb = statSync(v.file).size / 1e6
  // +faststart: the moov atom comes before mdat
  const fd = openSync(v.file, 'r')
  const head = Buffer.alloc(4096)
  readSync(fd, head, 0, 4096, 0)
  closeSync(fd)
  const fast = head.indexOf('moov') > 0 && (head.indexOf('mdat') < 0 || head.indexOf('moov') < head.indexOf('mdat'))
  const dur = Number(probe.format.duration)
  console.log(`\n${name}  ${v.file}`)
  console.log(`  video  ${vs.codec_name} ${vs.profile} ${vs.pix_fmt} ${vs.width}x${vs.height} @${vs.r_frame_rate} · ${dur.toFixed(2)} s · ${mb.toFixed(2)} MB (limit ${v.maxMB}) ${mb <= v.maxMB ? 'OK' : 'TOO BIG'}`)
  console.log(`  audio  ${as ? `${as.codec_name} ${as.sample_rate} Hz ${as.channels} ch ${Math.round(as.bit_rate / 1000)} kb/s` : 'none'} · faststart ${fast ? 'yes' : 'NO'}`)
  if (as) {
    const l = run('ffmpeg', ['-hide_banner', '-nostats', '-i', v.file, '-af', 'ebur128=peak=true', '-f', 'null', '-']).stderr
    const I = /I:\s+(-?[\d.]+) LUFS/.exec(l.slice(l.lastIndexOf('Summary')))?.[1]
    const P = /Peak:\s+(-?[\d.]+) dBFS/.exec(l.slice(l.lastIndexOf('Summary')))?.[1]
    console.log(`  loudness  ${I} LUFS integrated · true peak ${P} dBFS ${Number(P) < -3 ? 'OK (< -3)' : 'TOO HOT'}`)
  }
  // picture cuts vs bar lines
  const tl = TL(v.tl)
  const sc = run('ffmpeg', ['-hide_banner', '-nostats', '-i', v.file, '-vf', 'scdet=threshold=9', '-an', '-f', 'null', '-']).stderr
  const cuts = [...sc.matchAll(/lavfi\.scd\.time:\s*([\d.]+)/g)].map((m) => Number(m[1]))
  const offs = cuts.map((c) => {
    const bars = c / tl.bar
    return { c, off: (bars - Math.round(bars)) * tl.bar }
  })
  const onBar = offs.filter((o) => Math.abs(o.off) < 0.06).length
  console.log(`  cuts  ${cuts.length} detected · ${onBar} on a bar line (±0.06 s) · off-bar: ${offs.filter((o) => Math.abs(o.off) >= 0.06).map((o) => o.c.toFixed(2)).join(', ') || 'none'}`)
  // one frame per second, and sheets
  const out = resolve(ROOT, 'out/qa', name)
  rmSync(out, { recursive: true, force: true })
  mkdirSync(out, { recursive: true })
  execFileSync('ffmpeg', ['-hide_banner', '-v', 'error', '-y', '-i', v.file, '-vf', 'fps=1', '-q:v', '2', resolve(out, 's%03d.jpg')])
  execFileSync('ffmpeg', ['-hide_banner', '-v', 'error', '-y', '-i', v.file, '-vf', `fps=1,scale=${v.tw}:-1,tile=${v.tile}`, '-q:v', '3', resolve(out, 'sheet-%02d.jpg')])
  console.log(`  frames  one per second in ${out}`)
}
