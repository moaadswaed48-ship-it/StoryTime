// Builds the short film the site plays in its cinema overlay.
//
// Usage (needs system ffmpeg/ffprobe and the repo's `sharp`; run from the repo root):
//   node scripts/film/build-film.mjs            → public/film/watch.mp4 + public/film/watch.json
//   node scripts/film/build-film.mjs --qa       → also writes check material to qa/out/:
//                                                  film-frame-NN.jpg (one frame every 3 s),
//                                                  film-xfade-N.jpg (start · middle · end of each dissolve),
//                                                  film-spectrum.png (the soundtrack) and prints levels
//   node scripts/film/build-film.mjs --qa-only  → only the checks, on the film that is already built
//   Options: --kbps=2500 (video bitrate; the file must stay under 12 MB) · --keep (keep the work folder)
//
// Sources (not committed): assets-src/film/v01 v04 v06 v08 v11 v12 .mp4 and cover.png (falls back to
// public/story/cover.webp). The music is written first by scripts/film/make-music.mjs with this timeline.
//
// The cut, at 24 fps:
//   0.0 – 2.0 s   the book cover between soft, blurred mirror images of itself, slowly pushing in
//                 (fades up from black)
//   then the six clips in story order, each slowed to 6/7 speed (plain re-timing: one repeated frame in
//   seven, no motion interpolation — interpolated frames smeared the flying papers and running feet),
//   joined by 0.5 s dissolves; the last 2.5 s fade to black with the music.
// Nothing is burned into the picture: titles and captions are set in type by the player.
// watch.json: { duration, scenes: [{ scene, start, end }] } — `scene` is the 0-based index into
// story.scenes; `start`/`end` are the middles of the dissolves (the scene is fully on screen xfade/2 later).
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync, statSync, writeFileSync, readFileSync } from 'node:fs'
import sharp from 'sharp'

const arg = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const SRC = 'assets-src/film'
const OUT = 'public/film/watch.mp4'
const JSON_OUT = 'public/film/watch.json'
const MUSIC = `${SRC}/music.wav`
const WORK = 'qa/out/film-build' // git-ignored; removed at the end

const FPS = 24
const W = 1280
const H = 720
const SCENES = [1, 4, 6, 8, 11, 12] // story scene numbers that have a clip
const SLOW = 7 / 6 // every six source frames become seven: 0.857× speed with an even cadence
const CLIP_FRAMES = Math.floor(121 * SLOW) // 141
const XFADE_FRAMES = 12
const OPEN_FRAMES = 48
const FADE_OUT_FRAMES = 60
const STEP_FRAMES = CLIP_FRAMES - XFADE_FRAMES // a new scene every 129 frames
const TOTAL_FRAMES = OPEN_FRAMES + SCENES.length * STEP_FRAMES
const sec = (frames) => frames / FPS
const DURATION = sec(TOTAL_FRAMES)
const pad = (n) => String(n).padStart(2, '0')
const round = (n) => Math.round(n * 1000) / 1000

const ff = (args, opts = {}) => execFileSync('ffmpeg', ['-hide_banner', '-v', 'error', '-y', ...args], { stdio: 'inherit', ...opts })

/* ── timeline ─────────────────────────────────────────────────────────────── */
// Dissolve k (0-based) brings in scene k; it starts XFADE_FRAMES before the previous picture ends.
const xfadeStart = (k) => sec(OPEN_FRAMES - XFADE_FRAMES + k * STEP_FRAMES)
const mid = (k) => xfadeStart(k) + sec(XFADE_FRAMES) / 2
const timeline = {
  duration: round(DURATION),
  fps: FPS,
  width: W,
  height: H,
  opening: round(sec(OPEN_FRAMES)),
  xfade: round(sec(XFADE_FRAMES)),
  fadeOut: round(sec(FADE_OUT_FRAMES)),
  scenes: SCENES.map((n, k) => ({ scene: n - 1, start: round(mid(k)), end: round(k + 1 < SCENES.length ? mid(k + 1) : DURATION) })),
}

/* ── checks ───────────────────────────────────────────────────────────────── */
function qa() {
  mkdirSync('qa/out', { recursive: true })
  const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', OUT]).toString())
  const v = probe.streams.find((s) => s.codec_type === 'video')
  const a = probe.streams.find((s) => s.codec_type === 'audio')
  const head = readFileSync(OUT).subarray(0, 4096).toString('latin1')
  console.log(`video  ${v.codec_name} ${v.profile} ${v.width}×${v.height} ${v.pix_fmt} ${v.r_frame_rate} fps · ${v.nb_frames} frames · ${Number(v.duration).toFixed(3)} s · ${(v.bit_rate / 1000).toFixed(0)} kb/s`)
  console.log(`audio  ${a.codec_name} ${a.sample_rate} Hz ${a.channels} ch · ${Number(a.duration).toFixed(3)} s · ${(a.bit_rate / 1000).toFixed(0)} kb/s`)
  console.log(`file   ${(statSync(OUT).size / 1e6).toFixed(2)} MB · faststart ${head.indexOf('moov') > -1 && (head.indexOf('mdat') < 0 || head.indexOf('moov') < head.indexOf('mdat')) ? 'yes' : 'NO'}`)
  // one frame every three seconds
  for (let t = 0, i = 0; t < timeline.duration; t += 3, i++) ff(['-ss', String(t), '-i', OUT, '-frames:v', '1', '-q:v', '3', `qa/out/film-frame-${pad(i)}.jpg`])
  // every dissolve: first frame, middle, last frame
  timeline.scenes.forEach((s, k) => {
    const t0 = s.start - timeline.xfade / 2
    const picks = [t0, s.start, t0 + timeline.xfade].map((t) => Math.round(t * FPS))
    ff(['-i', OUT, '-vf', `select='${picks.map((n) => `eq(n\\,${n})`).join('+')}',scale=640:-2,tile=3x1`, '-frames:v', '1', '-q:v', '3', `qa/out/film-xfade-${k + 1}.jpg`])
  })
  ff(['-i', OUT, '-lavfi', 'showspectrumpic=s=1600x800:legend=1:scale=log:stop=8000', 'qa/out/film-spectrum.png'])
  const vol = spawnSync('ffmpeg', ['-hide_banner', '-i', OUT, '-vn', '-af', 'volumedetect', '-f', 'null', '-']).stderr.toString()
  console.log('levels', (vol.match(/(mean|max)_volume: [-\d.]+ dB/g) ?? []).join(' · '))
  console.log('checks written to qa/out/film-frame-*.jpg, film-xfade-*.jpg, film-spectrum.png')
}
if (arg['qa-only']) {
  qa()
  process.exit(0)
}

/* ── 1. music, scored to this timeline ────────────────────────────────────── */
mkdirSync(WORK, { recursive: true })
mkdirSync('public/film', { recursive: true })
execFileSync('node', ['scripts/film/make-music.mjs', `--duration=${DURATION}`, `--opening=${sec(OPEN_FRAMES)}`, `--scene=${sec(STEP_FRAMES)}`, `--fadeout=${sec(FADE_OUT_FRAMES)}`, `--out=${MUSIC}`], { stdio: 'inherit' })

/* ── 2. opening picture: the portrait cover on a 16:9 frame ───────────────── */
// The cover stands in the middle. Each side is filled with the cover's own mirror image, so the picture
// continues without a seam, lightly blurred next to the cover and heavily blurred (and dimmed) toward the
// frame edges: it reads as one wide painting with soft, curtain-like sides. Composed at 2×; ffmpeg does
// the slow push-in on a 4× canvas so the movement is sub-pixel smooth.
const cover = existsSync(`${SRC}/cover.png`) ? `${SRC}/cover.png` : 'public/story/cover.webp'
const CW = W * 2
const CH = H * 2
const meta = await sharp(cover).metadata()
const fw = Math.round((CH * meta.width) / meta.height)
const side = Math.ceil((CW - fw) / 2)
const x0 = Math.floor((CW - fw) / 2)
const art = await sharp(cover).resize({ width: fw, height: CH, fit: 'fill' }).toBuffer()
const mirror = await sharp(art).flop().toBuffer()
const wide = await sharp({ create: { width: CW, height: CH, channels: 3, background: '#000' } })
  .composite([
    { input: await sharp(mirror).extract({ left: fw - side, top: 0, width: side, height: CH }).toBuffer(), left: x0 - side, top: 0 },
    { input: art, left: x0, top: 0 },
    { input: await sharp(mirror).extract({ left: 0, top: 0, width: side, height: CH }).toBuffer(), left: x0 + fw, top: 0 },
  ])
  .png()
  .toBuffer()
const svg = (w, stops) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${CH}"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="0">${stops.map(([at, color, alpha]) => `<stop offset="${at.toFixed(4)}" stop-color="${color}" stop-opacity="${alpha}"/>`).join('')}</linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`)
const L = x0 / CW
const R = (x0 + fw) / CW
const reach = (0.3 * side) / CW
const far = await sharp(wide).blur(84).modulate({ brightness: 0.8, saturation: 1.08 }).toBuffer()
const near = await sharp(wide).blur(22).ensureAlpha().composite([{ input: svg(CW, [[L - reach, '#fff', 0], [L + 0.01, '#fff', 1], [R - 0.01, '#fff', 1], [R + reach, '#fff', 0]]), blend: 'dest-in' }]).png().toBuffer()
const sharpArt = await sharp(art).ensureAlpha().composite([{ input: svg(fw, [[0, '#fff', 0], [0.06, '#fff', 0.25], [0.16, '#fff', 1], [0.84, '#fff', 1], [0.94, '#fff', 0.25], [1, '#fff', 0]]), blend: 'dest-in' }]).png().toBuffer()
const shade = svg(CW, [[0, '#120c08', 0.62], [L + 0.02, '#120c08', 0], [R - 0.02, '#120c08', 0], [1, '#120c08', 0.62]])
await sharp(far).composite([{ input: near, left: 0, top: 0 }, { input: sharpArt, left: x0, top: 0 }, { input: shade, left: 0, top: 0 }]).png().toFile(`${WORK}/opening.png`)

/* ── 3. one filter graph: opening → six re-timed clips → dissolves → fade ─── */
const inputs = ['-i', `${WORK}/opening.png`]
const graph = [
  `[0:v]scale=${W * 4}:${H * 4}:flags=lanczos,zoompan=z='1+0.07*on/${OPEN_FRAMES}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${OPEN_FRAMES}:s=${W}x${H}:fps=${FPS},trim=end_frame=${OPEN_FRAMES},setpts=PTS-STARTPTS,fade=t=in:st=0:d=0.5,format=yuv420p,settb=1/${FPS}[s0]`,
]
SCENES.forEach((n, k) => {
  inputs.push('-i', `${SRC}/v${pad(n)}.mp4`)
  graph.push(`[${k + 1}:v]scale=${W}:${H}:force_original_aspect_ratio=increase:flags=lanczos,crop=${W}:${H},setsar=1,setpts=PTS*${SLOW},fps=${FPS},trim=end_frame=${CLIP_FRAMES},setpts=PTS-STARTPTS,format=yuv420p,settb=1/${FPS}[s${k + 1}]`)
})
SCENES.forEach((_, k) => {
  graph.push(`[${k === 0 ? 's0' : `x${k - 1}`}][s${k + 1}]xfade=transition=fade:duration=${sec(XFADE_FRAMES)}:offset=${xfadeStart(k)}[x${k}]`)
})
graph.push(`[x${SCENES.length - 1}]fade=t=out:st=${DURATION - sec(FADE_OUT_FRAMES)}:d=${sec(FADE_OUT_FRAMES)},format=yuv420p[v]`)
inputs.push('-i', MUSIC) // already cut, faded and levelled for this timeline: it goes in untouched
const audioIn = SCENES.length + 1

// Two passes at a fixed bitrate: the best picture the 12 MB budget allows, with no guessing.
const kbps = Number(arg.kbps ?? 2500)
const video = ['-c:v', 'libx264', '-preset', 'slower', '-profile:v', 'high', '-level', '4.0', '-pix_fmt', 'yuv420p', '-b:v', `${kbps}k`, '-maxrate', `${Math.round(kbps * 1.8)}k`, '-bufsize', `${kbps * 3}k`, '-g', String(FPS * 2), '-r', String(FPS), '-passlogfile', `${WORK}/x264`]
const filter = ['-filter_complex', graph.join(';')]
console.log(`film: ${TOTAL_FRAMES} frames · ${DURATION} s · video ${kbps} kb/s (two passes, this takes a few minutes)`)
ff([...inputs, ...filter, '-map', '[v]', ...video, '-pass', '1', '-an', '-f', 'null', '/dev/null'])
ff([...inputs, ...filter, '-map', '[v]', '-map', `${audioIn}:a`, ...video, '-pass', '2', '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', '-ac', '2', '-t', String(DURATION), '-movflags', '+faststart', `${WORK}/watch.mp4`])

const size = statSync(`${WORK}/watch.mp4`).size
if (size >= 12e6) throw new Error(`watch.mp4 is ${(size / 1e6).toFixed(2)} MB — over the 12 MB budget; lower --kbps`)
writeFileSync(OUT, readFileSync(`${WORK}/watch.mp4`))
writeFileSync(JSON_OUT, JSON.stringify(timeline, null, 2) + '\n')
if (!arg.keep) rmSync(WORK, { recursive: true, force: true })
console.log(`${OUT} ${(size / 1e6).toFixed(2)} MB · ${JSON_OUT}`)
console.log(timeline.scenes.map((s) => `scene ${s.scene + 1}: ${s.start}–${s.end}`).join(' · '))
if (arg.qa) qa()
