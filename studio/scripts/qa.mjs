// Checks on a finished video. Carried from the old build's video/scripts/qa.mjs.
//   node studio/scripts/qa.mjs <file.mp4> [--timeline=path.json] [--max-mb=12] [--tile=4x3] [--tw=480]
// --timeline gives the bar length (its `bar` field) for the cuts-vs-bar-lines check; without it that check is skipped.
// For each video it prints: container facts (codec, pixel format, size, duration, +faststart), loudness
// (integrated LUFS, true peak), where the picture cuts fall against the music's bar lines, and it writes
// one frame per second to out/qa/<name>/sNNN.jpg plus contact sheets (out/qa/<name>/sheet-NN.jpg).
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, openSync, readSync, closeSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const opt = Object.fromEntries(args.filter((a) => a.startsWith('--')).map((a) => a.slice(2).split('=')))
const file = args.find((a) => !a.startsWith('--'))
if (!file) throw new Error('usage: node studio/scripts/qa.mjs <file.mp4> [--timeline=path.json] [--max-mb=12]')
const VIDEOS = {
  [file.replace(/^.*\//, '').replace(/\.[^.]+$/, '')]: { file: resolve(file), maxMB: Number(opt['max-mb'] ?? Infinity), tl: opt.timeline, tile: opt.tile ?? '4x3', tw: Number(opt.tw ?? 480) },
}
const only = undefined
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
  const tl = v.tl ? JSON.parse(readFileSync(resolve(v.tl), 'utf8')) : null
  const sc = run('ffmpeg', ['-hide_banner', '-nostats', '-i', v.file, '-vf', 'scdet=threshold=9', '-an', '-f', 'null', '-']).stderr
  const cuts = [...sc.matchAll(/lavfi\.scd\.time:\s*([\d.]+)/g)].map((m) => Number(m[1]))
  const offs = !tl ? [] : cuts.map((c) => {
    const bars = c / tl.bar
    return { c, off: (bars - Math.round(bars)) * tl.bar }
  })
  const onBar = offs.filter((o) => Math.abs(o.off) < 0.06).length
  if (!tl) console.log(`  cuts  ${cuts.length} detected (no timeline given: bar-line check skipped)`)
  else console.log(`  cuts  ${cuts.length} detected · ${onBar} on a bar line (±0.06 s) · off-bar: ${offs.filter((o) => Math.abs(o.off) >= 0.06).map((o) => o.c.toFixed(2)).join(', ') || 'none'}`)
  // one frame per second, and sheets
  const out = resolve(ROOT, 'out/qa', name)
  rmSync(out, { recursive: true, force: true })
  mkdirSync(out, { recursive: true })
  execFileSync('ffmpeg', ['-hide_banner', '-v', 'error', '-y', '-i', v.file, '-vf', 'fps=1', '-q:v', '2', resolve(out, 's%03d.jpg')])
  execFileSync('ffmpeg', ['-hide_banner', '-v', 'error', '-y', '-i', v.file, '-vf', `fps=1,scale=${v.tw}:-1,tile=${v.tile}`, '-q:v', '3', resolve(out, 'sheet-%02d.jpg')])
  console.log(`  frames  one per second in ${out}`)
}
