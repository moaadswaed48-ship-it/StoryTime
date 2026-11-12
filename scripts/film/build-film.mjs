// Builds the short film the site plays in its cinema overlay.
//
// Usage (needs system ffmpeg/ffprobe and the repo's `sharp`; run from the repo root):
//   node scripts/film/build-film.mjs            → public/film/watch.mp4 + public/film/watch.json
//   node scripts/film/build-film.mjs --qa       → also writes check material to qa/out/:
//                                                  film-frame-NN.jpg (one frame every 3 s),
//                                                  film-xfade-N.jpg (start · middle · end of each dissolve),
//                                                  film-open.jpg (the opening at 0 · 1 s · its last frame),
//                                                  film-push-N.jpg (start · middle · end of each camera push),
//                                                  film-spectrum.png (the soundtrack); prints levels and cadence
//   node scripts/film/build-film.mjs --qa-only  → only the checks, on the film that is already built
//   node scripts/film/build-film.mjs --opening-only → only composes the opening picture → qa/out/film-opening.jpg
//   Options: --kbps=2500 (video bitrate; the file must stay under 12 MB) · --keep (keep the work folder)
//
// Sources (not committed): assets-src/film/v01 v04 v06 v08 v11 v12 .mp4 and cover.png (falls back to
// public/story/cover.webp). The music is written first by scripts/film/make-music.mjs with this timeline.
//
// The cut:
//   0.0 – 2.0 s   the book the film comes out of: the cover as a crisp card with a soft shadow, standing
//                 in its own light (the cover blown up, blurred and dimmed), slowly pushing in. Frame 0 is
//                 already the full picture — the player fades the film in over a matching poster.
//   then the six clips in story order at 6/7 speed, joined by ≈ 0.5 s dissolves; the last ≈ 2.5 s fade to
//   black with the music.
//
// Frame rate: 144/7 fps (20.571). The sources are 24 fps; slowed to 6/7 speed they hold 20.571 pictures a
// second, so the film is simply encoded at that rate and every source picture gets exactly the same time
// on screen. (At 24 fps one picture in seven had to be shown twice — a 3.4 Hz hitch on camera moves — and
// motion interpolation smeared the flying papers and running feet.)
//
// Camera: the two scenes whose camera does not move get a slow push-in so the frame is alive from edge to
// edge: scene 8 (wide shot of the falling leaves, 1924 px source, so the push costs no sharpness) moves in
// on the two boys to 1.28×; scene 1 (classroom) drifts in to 1.06×. Pushes run on a 3840 px canvas so they
// are smooth to a third of a pixel.
//
// Nothing is burned into the picture: titles and captions are set in type by the player.
// watch.json: { duration, fps, width, height, opening, xfade, fadeOut, scenes: [{ scene, start, end }] } —
// `scene` is the 0-based index into story.scenes; `start`/`end` are the middles of the dissolves (the scene
// is fully on screen xfade/2 later).
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync, statSync, writeFileSync, readFileSync } from 'node:fs'
import sharp from 'sharp'

const arg = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const SRC = 'assets-src/film'
const OUT = 'public/film/watch.mp4'
const JSON_OUT = 'public/film/watch.json'
const MUSIC = `${SRC}/music.wav`
const WORK = 'qa/out/film-build' // git-ignored; removed at the end

const RATE = '144/7' // 24 fps × 6/7 speed
const FPS = 144 / 7
const W = 1280
const H = 720
const SCENES = [1, 4, 6, 8, 11, 12] // story scene numbers that have a clip
const CLIP_FRAMES = 121 // every picture of a 5 s source clip, once
const XFADE_FRAMES = 10 // 0.486 s
const OPEN_FRAMES = 41 // 1.993 s
const FADE_OUT_FRAMES = 51 // 2.479 s
const STEP_FRAMES = CLIP_FRAMES - XFADE_FRAMES // a new scene every 111 frames (5.396 s)
const TOTAL_FRAMES = OPEN_FRAMES + SCENES.length * STEP_FRAMES
const OPEN_ZOOM = 0.07
/** Slow camera pushes for the scenes that have none: [end zoom, focus x, focus y] (0–1 of the spare room). */
const PUSH = { 1: [1.06, 0.42, 0.4], 8: [1.28, 0.8, 0.72] }
const sec = (frames) => frames / FPS
const DURATION = sec(TOTAL_FRAMES)
const pad = (n) => String(n).padStart(2, '0')
const round = (n) => Math.round(n * 1000) / 1000

const ff = (args, opts = {}) => execFileSync('ffmpeg', ['-hide_banner', '-v', 'error', '-y', ...args], { stdio: 'inherit', ...opts })

/* ── timeline ─────────────────────────────────────────────────────────────── */
// Dissolve k (0-based) brings in scene k; it starts XFADE_FRAMES before the previous picture ends.
const xfadeFrame = (k) => OPEN_FRAMES - XFADE_FRAMES + k * STEP_FRAMES
const mid = (k) => sec(xfadeFrame(k) + XFADE_FRAMES / 2)
const timeline = {
  duration: round(DURATION),
  fps: round(FPS),
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
  console.log(`video  ${v.codec_name} ${v.profile} ${v.width}×${v.height} ${v.pix_fmt} ${v.r_frame_rate} fps (avg ${v.avg_frame_rate}) · ${v.nb_frames} frames · ${Number(v.duration).toFixed(3)} s · ${(v.bit_rate / 1000).toFixed(0)} kb/s`)
  console.log(`audio  ${a.codec_name} ${a.sample_rate} Hz ${a.channels} ch · ${Number(a.duration).toFixed(3)} s · ${(a.bit_rate / 1000).toFixed(0)} kb/s`)
  console.log(`file   ${(statSync(OUT).size / 1e6).toFixed(2)} MB · faststart ${head.indexOf('moov') > -1 && (head.indexOf('mdat') < 0 || head.indexOf('moov') < head.indexOf('mdat')) ? 'yes' : 'NO'}`)
  const pick = (frames, file, width = 640) => ff(['-i', OUT, '-vf', `select='${frames.map((n) => `eq(n\\,${n})`).join('+')}',scale=${width}:-2,tile=${frames.length}x1`, '-frames:v', '1', '-q:v', '3', file])
  // one frame every three seconds
  for (let t = 0, i = 0; t < timeline.duration; t += 3, i++) pick([Math.round(t * FPS)], `qa/out/film-frame-${pad(i)}.jpg`, W)
  // the opening: first frame, one second in, last frame before the dissolve
  pick([0, Math.round(FPS), OPEN_FRAMES - XFADE_FRAMES - 1], 'qa/out/film-open.jpg')
  // every dissolve: first frame, middle, last frame
  SCENES.forEach((_, k) => pick([xfadeFrame(k), xfadeFrame(k) + XFADE_FRAMES / 2, xfadeFrame(k) + XFADE_FRAMES], `qa/out/film-xfade-${k + 1}.jpg`))
  // every camera push: first clear frame, middle, last clear frame
  SCENES.forEach((n, k) => PUSH[n] && pick([xfadeFrame(k) + XFADE_FRAMES, xfadeFrame(k) + Math.round(CLIP_FRAMES / 2), xfadeFrame(k) + STEP_FRAMES - 1], `qa/out/film-push-${n}.jpg`))
  ff(['-i', OUT, '-lavfi', 'showspectrumpic=s=1600x800:legend=1:scale=log:stop=8000', 'qa/out/film-spectrum.png'])
  const vol = spawnSync('ffmpeg', ['-hide_banner', '-i', OUT, '-vn', '-af', 'volumedetect', '-f', 'null', '-']).stderr.toString()
  console.log('levels', (vol.match(/(mean|max)_volume: [-\d.]+ dB/g) ?? []).join(' · '))
  // cadence: no picture may be shown twice, and nothing may stand still
  const dup = spawnSync('ffmpeg', ['-hide_banner', '-i', OUT, '-an', '-vf', 'mpdecimate=hi=64*4:lo=64*2:frac=0.2', '-loglevel', 'debug', '-f', 'null', '-']).stderr.toString()
  const frozen = spawnSync('ffmpeg', ['-hide_banner', '-i', OUT, '-an', '-vf', 'freezedetect=n=0.003:d=0.2', '-f', 'null', '-']).stderr.toString()
  console.log(`cadence ${(dup.match(/ drop /g) ?? []).length} repeated frames of ${v.nb_frames} · frozen spans ≥ 0.2 s: ${(frozen.match(/freeze_start/g) ?? []).length}`)
  console.log('checks written to qa/out/film-frame-*.jpg, film-open.jpg, film-xfade-*.jpg, film-push-*.jpg, film-spectrum.png')
}
if (arg['qa-only']) {
  qa()
  process.exit(0)
}

/* ── 1. music, scored to this timeline ────────────────────────────────────── */
mkdirSync(WORK, { recursive: true })
mkdirSync('public/film', { recursive: true })
if (!arg['opening-only']) execFileSync('node', ['scripts/film/make-music.mjs', `--duration=${DURATION}`, `--opening=${sec(OPEN_FRAMES)}`, `--scene=${sec(STEP_FRAMES)}`, `--fadeout=${sec(FADE_OUT_FRAMES)}`, `--out=${MUSIC}`], { stdio: 'inherit' })

/* ── 2. opening picture: the book cover as an object on a 16:9 frame ──────── */
// Ground: the cover itself, blown up until no shape is left, dimmed, with a vignette to the site's night
// colour and a little grain so the dark gradients do not band. On it the cover as a card: 88 % of the frame
// height, rounded, a hairline of light on its edge and a deep soft shadow under it. Composed at 2×; ffmpeg
// does the slow push-in on a 4× canvas so the movement is sub-pixel smooth.
// The player draws the same picture in CSS as its poster (src/features/film/film.css, .film-poster):
// keep CARD_H, CARD_RADIUS and the 3:4 card in step with it.
const cover = existsSync(`${SRC}/cover.png`) ? `${SRC}/cover.png` : 'public/story/cover.webp'
const CW = W * 2
const CH = H * 2
const CARD_H = Math.round(CH * 0.88)
const CARD_W = Math.round((CARD_H * 3) / 4)
const CARD_RADIUS = 40 // at 2× → 20 px on the 1280 frame (1.5625 % of its width)
const cardX = Math.round((CW - CARD_W) / 2)
const cardY = Math.round((CH - CARD_H) / 2)
const svg = (body, w = CW, h = CH) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${body}</svg>`)

// (sharp keeps one resize per pipeline, hence the steps)
const tiny = await sharp(cover).resize({ width: 256, height: 144, fit: 'cover', position: 'centre' }).blur(13).png().toBuffer()
const soft = await sharp(tiny).resize({ width: CW, height: CH, kernel: 'cubic' }).blur(24).modulate({ brightness: 0.56, saturation: 1.12 }).png().toBuffer()
// pulled toward one amber so the ground reads as the book's own glow, not as a second picture
const amber = await sharp(soft).tint('#d07a2e').ensureAlpha(0.62).png().toBuffer()
const ground = await sharp(soft)
  .composite([
    { input: amber },
    { input: svg(`<defs><radialGradient id="v" cx="50%" cy="48%" r="72%"><stop offset="0" stop-color="#120c08" stop-opacity="0"/><stop offset="0.5" stop-color="#120c08" stop-opacity="0.3"/><stop offset="1" stop-color="#120c08" stop-opacity="0.86"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#v)"/>`) },
    { input: await sharp({ create: { width: CW, height: CH, channels: 3, background: '#808080', noise: { type: 'gaussian', mean: 128, sigma: 7 } } }).png().toBuffer(), blend: 'soft-light' },
  ])
  .png()
  .toBuffer()
const shadow = await sharp(svg(`<rect x="${cardX + 24}" y="${cardY + 56}" width="${CARD_W - 48}" height="${CARD_H - 24}" rx="${CARD_RADIUS}" fill="#000" fill-opacity="0.72"/>`))
  .blur(52)
  .png()
  .toBuffer()
const card = await sharp(cover)
  .resize({ width: CARD_W, height: CARD_H, fit: 'cover', position: 'centre' })
  .composite([
    // a breath of top light and a hairline edge make it an object, not a rectangle of pixels
    { input: svg(`<defs><linearGradient id="l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.1"/><stop offset="0.35" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#120c08" stop-opacity="0.16"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#l)"/><rect x="1.5" y="1.5" width="${CARD_W - 3}" height="${CARD_H - 3}" rx="${CARD_RADIUS - 1.5}" fill="none" stroke="#fff" stroke-opacity="0.2" stroke-width="3"/>`, CARD_W, CARD_H) },
    { input: svg(`<rect width="100%" height="100%" rx="${CARD_RADIUS}" fill="#fff"/>`, CARD_W, CARD_H), blend: 'dest-in' },
  ])
  .png()
  .toBuffer()
await sharp(ground).composite([{ input: shadow }, { input: card, left: cardX, top: cardY }]).png().toFile(`${WORK}/opening.png`)
if (arg['opening-only']) {
  await sharp(`${WORK}/opening.png`).resize({ width: W }).jpeg({ quality: 88 }).toFile('qa/out/film-opening.jpg')
  rmSync(WORK, { recursive: true, force: true })
  console.log('qa/out/film-opening.jpg')
  process.exit(0)
}

/* ── 3. one filter graph: opening → six clips → dissolves → fade ──────────── */
const inputs = ['-i', `${WORK}/opening.png`]
const graph = [
  `[0:v]scale=${W * 4}:${H * 4}:flags=lanczos,zoompan=z='1+${OPEN_ZOOM}*on/${OPEN_FRAMES}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${OPEN_FRAMES}:s=${W}x${H}:fps=${RATE},trim=end_frame=${OPEN_FRAMES},setpts=PTS-STARTPTS,format=yuv420p,settb=1/${RATE}[s0]`,
]
SCENES.forEach((n, k) => {
  inputs.push('-i', `${SRC}/v${pad(n)}.mp4`)
  const push = PUSH[n]
  // The pushes zoom geometrically (the same relative speed all the way), like a dolly at walking pace.
  const picture = push
    ? `scale=${W * 3}:${H * 3}:force_original_aspect_ratio=increase:flags=lanczos,crop=${W * 3}:${H * 3},zoompan=z='pow(${push[0]},on/${CLIP_FRAMES - 1})':x='(iw-iw/zoom)*${push[1]}':y='(ih-ih/zoom)*${push[2]}':d=1:s=${W}x${H}:fps=24`
    : `scale=${W}:${H}:force_original_aspect_ratio=increase:flags=lanczos,crop=${W}:${H}`
  graph.push(`[${k + 1}:v]${picture},setsar=1,setpts=(PTS-STARTPTS)*7/6,fps=${RATE},trim=end_frame=${CLIP_FRAMES},setpts=PTS-STARTPTS,format=yuv420p,settb=1/${RATE}[s${k + 1}]`)
})
SCENES.forEach((_, k) => {
  // a hair before the frame's own time stamp, so rounding can never push the dissolve one frame late
  graph.push(`[${k === 0 ? 's0' : `x${k - 1}`}][s${k + 1}]xfade=transition=fade:duration=${sec(XFADE_FRAMES).toFixed(5)}:offset=${(sec(xfadeFrame(k)) - 0.002).toFixed(5)}[x${k}]`)
})
graph.push(`[x${SCENES.length - 1}]fade=t=out:start_frame=${TOTAL_FRAMES - FADE_OUT_FRAMES}:nb_frames=${FADE_OUT_FRAMES},format=yuv420p[v]`)

// The picture is rendered once, without loss, so the two encoding passes read exactly the same frames.
console.log(`film: ${TOTAL_FRAMES} frames at ${RATE} fps · ${DURATION.toFixed(3)} s — rendering the cut…`)
ff([...inputs, '-filter_complex', graph.join(';'), '-map', '[v]', '-an', '-r', RATE, '-frames:v', String(TOTAL_FRAMES), '-c:v', 'libx264', '-preset', 'ultrafast', '-qp', '0', '-pix_fmt', 'yuv420p', `${WORK}/cut.mkv`])

// Two passes at a fixed bitrate: the best picture the 12 MB budget allows, with no guessing.
const kbps = Number(arg.kbps ?? 2500)
const video = ['-c:v', 'libx264', '-preset', 'slower', '-profile:v', 'high', '-level', '4.0', '-pix_fmt', 'yuv420p', '-b:v', `${kbps}k`, '-maxrate', `${Math.round(kbps * 1.8)}k`, '-bufsize', `${kbps * 3}k`, '-g', String(Math.round(FPS * 2)), '-r', RATE, '-passlogfile', `${WORK}/x264`]
console.log(`encoding: video ${kbps} kb/s, two passes (a few minutes)…`)
ff(['-i', `${WORK}/cut.mkv`, ...video, '-pass', '1', '-an', '-f', 'null', '/dev/null'])
// The music is already cut, faded and levelled for this timeline: it goes in untouched.
ff(['-i', `${WORK}/cut.mkv`, '-i', MUSIC, '-map', '0:v', '-map', '1:a', ...video, '-pass', '2', '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', '-ac', '2', '-t', DURATION.toFixed(5), '-movflags', '+faststart', `${WORK}/watch.mp4`])

const size = statSync(`${WORK}/watch.mp4`).size
if (size >= 12e6) throw new Error(`watch.mp4 is ${(size / 1e6).toFixed(2)} MB — over the 12 MB budget; lower --kbps`)
writeFileSync(OUT, readFileSync(`${WORK}/watch.mp4`))
writeFileSync(JSON_OUT, JSON.stringify(timeline, null, 2) + '\n')
if (!arg.keep) rmSync(WORK, { recursive: true, force: true })
console.log(`${OUT} ${(size / 1e6).toFixed(2)} MB · ${JSON_OUT}`)
console.log(timeline.scenes.map((s) => `scene ${s.scene + 1}: ${s.start}–${s.end}`).join(' · '))
if (arg.qa) qa()
