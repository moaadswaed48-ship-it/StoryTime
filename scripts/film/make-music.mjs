// The film's lullaby, made in code: plucked strings (an oud-like lead, a harp-like bed) over a soft pad.
//
// Usage (no npm packages, plain Node ≥ 18):
//   node scripts/film/make-music.mjs                       → assets-src/film/music.wav (48 kHz, 16-bit stereo)
//   node scripts/film/make-music.mjs --duration=34.25 --opening=2 --scene=5.375 --out=some/where.wav --seed=11
//
// The piece is scored to the film's cut: 3/4 time, two bars per film scene, so the bar length follows
// `--scene` (5.375 s → 67 bpm) and every picture change lands on a bar line. `scripts/film/build-film.mjs`
// calls this script with its own timeline, so normally you never run it by hand.
//
// What you hear: D major, twelve bars in three phrases (A · B · A′). A asks, B lifts, A′ answers and
// comes home to D. The lead is a double-course Karplus-Strong string; the bed rolls 1–5–8–10–8–5 in
// eighths; a three-voice pad sits underneath; one-beat echo on the lead; a small hall; a 6.5 kHz low-pass
// so nothing is harsh; raised-cosine fade in and out; peak held at −4.5 dBFS.
// Check it with:  ffmpeg -i assets-src/film/music.wav -af volumedetect -f null -
//                 ffmpeg -i assets-src/film/music.wav -lavfi showspectrumpic=s=1600x800:legend=1 qa/out/film-spectrum.png
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

const arg = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')))
const SR = 48000
const DURATION = Number(arg.duration ?? 34.25) // seconds, equal to the film
const OPENING = Number(arg.opening ?? 2) // bar 1 starts here (the first scene is fully on screen)
const SCENE = Number(arg.scene ?? 5.375) // seconds between scene changes = two bars
const OUT = arg.out ?? 'assets-src/film/music.wav'
const FADE_IN = 1.2
const FADE_OUT = Number(arg.fadeout ?? 2.5)
const PEAK_DB = -4.5

const BEAT = SCENE / 6
const BAR = BEAT * 3
const LEN = Math.round(DURATION * SR)

/* ── helpers ──────────────────────────────────────────────────────────────── */
function mulberry32(a) {
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(Number(arg.seed ?? 11))
const jitter = (amount) => (rand() * 2 - 1) * amount

const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
/** 'F#4' → Hz (A4 = 440). */
function hz(name) {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(name)
  if (!m) throw new Error(`bad note ${name}`)
  const midi = SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) + 1) * 12
  return 440 * 2 ** ((midi - 69) / 12)
}
const cents = (c) => 2 ** (c / 1200)
/** Time of a beat: bar 1 beat 1 is `OPENING`; beats count from 1 and may be fractional. */
const at = (bar, beat = 1) => OPENING + (bar - 1) * BAR + (beat - 1) * BEAT

const bus = () => [new Float32Array(LEN), new Float32Array(LEN)]
const lead = bus() // the melody (also feeds the echo)
const bed = bus() // harp arpeggios and bass notes
const pad = bus()

/** Adds a mono voice to a stereo bus with an equal-power pan (−1 left … +1 right). */
function place(target, voice, t, gain, pan = 0) {
  const start = Math.round(t * SR)
  const a = ((pan + 1) * Math.PI) / 4
  const gl = Math.cos(a) * gain
  const gr = Math.sin(a) * gain
  for (let i = 0; i < voice.length; i++) {
    const n = start + i
    if (n < 0) continue
    if (n >= LEN) break
    target[0][n] += voice[i] * gl
    target[1][n] += voice[i] * gr
  }
}

/* ── plucked string (extended Karplus-Strong) ─────────────────────────────── */
/**
 * One string. The delay line starts as the shape of a plucked string (a triangle with its peak at the
 * plucking point, which gives the mellow 1/k² harmonics of gut and nylon) plus a little filtered noise
 * for the finger. The loop holds a two-point low-pass (S) so high harmonics die first, an all-pass for
 * exact tuning, and a loss factor chosen for the wanted decay time.
 */
function pluck({ f, hold, t60 = 3, release = 0.3, S = 0.5, pos = 0.3, noise = 0.15, noiseLp = 3000, tone = 5000 }) {
  const period = SR / f
  let N = Math.floor(period - S)
  let frac = period - S - N
  if (frac < 0.12) {
    N -= 1
    frac += 1
  }
  const C = (1 - frac) / (1 + frac)
  const line = new Float32Array(N)
  const peak = Math.min(N - 1, Math.max(1, Math.round(pos * N)))
  const a = 1 - Math.exp((-2 * Math.PI * noiseLp) / SR)
  let lp = 0
  let mean = 0
  for (let i = 0; i < N; i++) {
    const tri = i < peak ? i / peak : (N - i) / (N - peak)
    lp += a * (rand() * 2 - 1 - lp)
    line[i] = (1 - noise) * tri + noise * 2.2 * lp
    mean += line[i]
  }
  mean /= N
  for (let i = 0; i < N; i++) line[i] -= mean

  const len = Math.round((hold + release * 1.6) * SR)
  const out = new Float32Array(len)
  const rho = 10 ** (-3 / (f * t60))
  const rhoRel = 10 ** (-3 / (f * release))
  const holdN = Math.round(hold * SR)
  const toneA = 1 - Math.exp((-2 * Math.PI * tone) / SR)
  const attackN = Math.round(0.004 * SR)
  let idx = 0
  let prev = 0
  let apx = 0
  let apy = 0
  let o = 0
  for (let n = 0; n < len; n++) {
    const y = line[idx]
    const low = (1 - S) * y + S * prev
    prev = y
    const ap = C * low + apx - C * apy
    apx = low
    apy = ap
    line[idx] = ap * (n < holdN ? rho : rhoRel)
    if (++idx >= N) idx = 0
    o += toneA * (y - o) // voice colour
    out[n] = n < attackN ? o * (0.5 - 0.5 * Math.cos((Math.PI * n) / attackN)) : o
  }
  return out
}

/** The lead: two strings of one course, a few cents apart and a few milliseconds apart, like an oud. */
function leadNote(note, t, beats, vel = 0.8, pan = -0.08) {
  const f = hz(note)
  const hold = beats * BEAT + 0.22
  const bright = 0.75 + 0.5 * vel
  for (const [detune, delay, g, p] of [[-2.2, 0, 0.95, pan - 0.1], [2.4, 0.007, 0.76, pan + 0.14]]) {
    const v = pluck({ f: f * cents(detune), hold, t60: 5.5, release: 0.42, S: 0.2, pos: 0.17, noise: 0.26 * bright, noiseLp: 3800, tone: 6000 })
    place(lead, v, t + delay + jitter(0.004), g * vel, p)
  }
}
/** A quick neighbour note that falls into the main note (word-level ornament, not a trill). */
function grace(note, t, vel = 0.4) {
  const v = pluck({ f: hz(note), hold: 0.07, t60: 1.2, release: 0.12, S: 0.2, pos: 0.17, noise: 0.2, tone: 5000 })
  place(lead, v, t - 0.075, vel * 1.5, -0.08)
}
/** The bed: a softer, rounder string that rings until the harmony changes. */
function harpNote(note, t, hold, vel = 0.5, pan = 0) {
  const f = hz(note)
  const low = f < 130
  const v = pluck({ f, hold, t60: low ? 5 : 4, release: 0.7, S: 0.5, pos: 0.42, noise: low ? 0.05 : 0.1, noiseLp: low ? 1200 : 2400, tone: low ? 1500 : 3200 })
  place(bed, v, t + jitter(0.007), vel * (low ? 1.15 : 1), pan)
}

/* ── pad: three soft voices, slow in, slow out ────────────────────────────── */
const PAD_HARMONICS = [1, 0.3, 0.12, 0.04]
function padNote(note, t0, t1, gain) {
  const f = hz(note)
  const attack = 0.9
  const release = 1
  const start = Math.max(0, Math.round((t0 - 0.25) * SR))
  const end = Math.min(LEN, Math.round((t1 + release) * SR))
  const relStart = Math.round(t1 * SR)
  const ph = [rand() * 6.283, rand() * 6.283]
  const tremPh = rand() * 6.283
  const tremHz = 0.17 + rand() * 0.1
  for (let n = start; n < end; n++) {
    const t = (n - start) / SR
    let env = t < attack ? 0.5 - 0.5 * Math.cos((Math.PI * t) / attack) : 1
    if (n > relStart) env *= 0.5 + 0.5 * Math.cos((Math.PI * (n - relStart)) / (release * SR))
    env *= 1 + 0.08 * Math.sin(6.283 * tremHz * t + tremPh)
    let l = 0
    let r = 0
    for (let h = 0; h < PAD_HARMONICS.length; h++) {
      const w = 6.283185307 * f * (h + 1) * t
      l += PAD_HARMONICS[h] * Math.sin(w * cents(-3.5) + ph[0] * (h + 1))
      r += PAD_HARMONICS[h] * Math.sin(w * cents(3.5) + ph[1] * (h + 1))
    }
    pad[0][n] += (l * 0.8 + r * 0.2) * env * gain
    pad[1][n] += (r * 0.8 + l * 0.2) * env * gain
  }
}

/* ── the score ────────────────────────────────────────────────────────────── */
// One chord per bar: [bed pattern in eighths, pad voicing]. Bar 11 changes harmony on beat 3.
const CHORD = {
  D: [['D3', 'A3', 'D4', 'F#4', 'D4', 'A3'], ['A3', 'D4', 'F#4']],
  Bm: [['B2', 'F#3', 'B3', 'D4', 'B3', 'F#3'], ['B3', 'D4', 'F#4']],
  G: [['G2', 'D3', 'G3', 'B3', 'G3', 'D3'], ['B3', 'D4', 'G4']],
  A: [['A2', 'E3', 'A3', 'C#4', 'A3', 'E3'], ['A3', 'C#4', 'E4']],
  'D/F#': [['F#2', 'D3', 'A3', 'D4', 'A3', 'D3'], ['A3', 'D4', 'F#4']],
  Em: [['E3', 'B3', 'E4', 'G4', 'E4', 'B3'], ['B3', 'E4', 'G4']],
  A7: [['A2', 'E3', 'G3', 'C#4', 'G3', 'E3'], ['A3', 'C#4', 'G4']],
  'G-A': [['G2', 'D3', 'B3', 'D3', 'A2', 'E3'], ['B3', 'D4', 'G4']],
}
const BARS = ['D', 'Bm', 'G', 'A', 'G', 'D/F#', 'Em', 'A7', 'D', 'Bm', 'G-A'] // bar 12 is the closing roll
const ACCENT = [1, 0.6, 0.7, 0.82, 0.66, 0.56]

// Melody: [bar, beat, length in beats, note, velocity]. Bar 0 beat 3 is the pick-up over the cover.
const MELODY = [
  [0, 3, 1, 'A4', 0.62],
  // A — the question
  [1, 1, 1.5, 'F#4', 0.78], [1, 2.5, 0.5, 'G4', 0.6], [1, 3, 1, 'A4', 0.7],
  [2, 1, 2, 'D5', 0.84], [2, 3, 1, 'B4', 0.7],
  [3, 1, 1, 'B4', 0.76], [3, 2, 1, 'A4', 0.68], [3, 3, 1, 'G4', 0.66],
  [4, 1, 3, 'A4', 0.74],
  // B — the lift (the wind, the leaves)
  [5, 1, 1.5, 'B4', 0.8], [5, 2.5, 0.5, 'C#5', 0.64], [5, 3, 1, 'D5', 0.78],
  [6, 1, 2, 'F#5', 0.9], [6, 3, 1, 'D5', 0.76],
  [7, 1, 1, 'E5', 0.84], [7, 2, 0.5, 'D5', 0.7], [7, 2.5, 0.5, 'C#5', 0.66], [7, 3, 1, 'B4', 0.72],
  [8, 1, 2, 'C#5', 0.78], [8, 3, 1, 'A4', 0.66],
  // A′ — the answer, home to D
  [9, 1, 1.5, 'F#4', 0.74], [9, 2.5, 0.5, 'G4', 0.58], [9, 3, 1, 'A4', 0.68],
  [10, 1, 2, 'D5', 0.8], [10, 3, 1, 'B4', 0.68],
  [11, 1, 1, 'A4', 0.74], [11, 2, 1, 'G4', 0.66], [11, 3, 1, 'E4', 0.62],
  [12, 1, 3.4, 'D4', 0.7],
]
const GRACES = [[2, 1, 'C#5'], [6, 1, 'E5'], [10, 1, 'C#5']]

// Opening (over the cover picture): a slow roll up the D chord under the pick-up note.
;['D3', 'A3', 'D4', 'F#4'].forEach((n, i) => harpNote(n, 0.34 + i * 0.17, 1.9, 0.36 - i * 0.02, i % 2 ? 0.3 : -0.3))
harpNote('D2', 0.34, 2, 0.3, 0)

BARS.forEach((name, i) => {
  const bar = i + 1
  const [pattern] = CHORD[name]
  const swell = bar >= 5 && bar <= 8 ? 1.08 : bar >= 9 ? 0.92 : 1 // B a little fuller, A′ a little softer
  pattern.forEach((note, k) => {
    const t = at(bar, 1 + k / 2)
    const changes = name === 'G-A' && k < 4 ? at(bar, 3) : at(bar + 1)
    harpNote(note, t, Math.max(0.3, changes - t + 0.1), 0.25 * ACCENT[k] * swell, k === 0 || (name === 'G-A' && k === 4) ? 0 : k % 2 ? 0.34 : -0.34)
  })
})
harpNote('D2', at(1), BAR, 0.22, 0)
harpNote('D2', at(9), BAR, 0.2, 0)
// Bar 12: one long roll up the home chord, left to ring under the fade.
;['D2', 'A2', 'D3', 'F#3', 'A3', 'D4', 'F#4', 'A4', 'D5'].forEach((n, i) => {
  harpNote(n, at(12) + 0.05 + i * (0.085 + i * 0.006), 4, 0.36 - i * 0.014, i === 0 ? 0 : i % 2 ? 0.3 : -0.3)
})

for (const [bar, beat, len, note, vel] of MELODY) leadNote(note, at(bar, beat), len, vel)
for (const [bar, beat, note] of GRACES) grace(note, at(bar, beat))

// Pad: hold every pitch across consecutive bars that share it (no re-attack, no phase beating).
const padBars = ['D', ...BARS, 'D'] // bar 0 (opening) … bar 12
const voices = new Map()
padBars.forEach((name, bar) => {
  const span = name === 'G-A' ? [[CHORD.G[1], at(bar), at(bar, 3)], [CHORD.A[1], at(bar, 3), at(bar + 1)]] : [[CHORD[name][1], bar === 0 ? 0.1 : at(bar), bar === 12 ? DURATION : at(bar + 1)]]
  for (const [notes, t0, t1] of span) {
    for (const n of notes) {
      const list = voices.get(n) ?? voices.set(n, []).get(n)
      const last = list[list.length - 1]
      if (last && Math.abs(last[1] - t0) < 1e-6) last[1] = t1
      else list.push([t0, t1])
    }
  }
})
for (const [note, spans] of voices) for (const [t0, t1] of spans) padNote(note, t0, t1, 0.015)
padNote('D3', 0.1, at(2), 0.014)
padNote('D3', at(9), at(10), 0.012)
padNote('D3', at(12), DURATION, 0.016)

/* ── effects ──────────────────────────────────────────────────────────────── */
/** Ping-pong echo of the lead, one beat apart, each repeat darker than the last. */
function echo(src, delay, feedback, cutoff) {
  const d = Math.round(delay * SR)
  const out = bus()
  const bl = new Float32Array(d)
  const br = new Float32Array(d)
  const a = 1 - Math.exp((-2 * Math.PI * cutoff) / SR)
  let ll = 0
  let lr = 0
  for (let n = 0, i = 0; n < LEN; n++) {
    const dl = bl[i]
    const dr = br[i]
    out[0][n] = dl
    out[1][n] = dr
    ll += a * (dr - ll)
    lr += a * (dl - lr)
    bl[i] = (src[0][n] + src[1][n]) * 0.5 + ll * feedback
    br[i] = lr * feedback
    if (++i >= d) i = 0
  }
  return out
}

/** A small hall (Schroeder/Moorer: eight damped combs into four all-passes per side). */
function hall(src, { room = 0.86, damp = 0.32, preDelay = 0.028 } = {}) {
  const k = SR / 44100
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617]
  const alls = [556, 441, 341, 225]
  const pre = Math.round(preDelay * SR)
  const input = new Float32Array(LEN)
  let hp = 0
  let lp = 0
  for (let n = pre; n < LEN; n++) {
    const x = (src[0][n - pre] + src[1][n - pre]) * 0.5
    lp += 0.48 * (x - lp) // ≈ 5 kHz
    hp += 0.02 * (lp - hp) // ≈ 150 Hz
    input[n] = lp - hp
  }
  return [0, 23].map((spread) => {
    const out = new Float32Array(LEN)
    for (const c of combs) {
      const buf = new Float32Array(Math.round((c + spread) * k))
      let f = 0
      for (let n = 0, i = 0; n < LEN; n++) {
        const y = buf[i]
        f = y * (1 - damp) + f * damp
        buf[i] = input[n] + f * room
        out[n] += y
        if (++i >= buf.length) i = 0
      }
    }
    for (const c of alls) {
      const buf = new Float32Array(Math.round((c + spread) * k))
      for (let n = 0, i = 0; n < LEN; n++) {
        const y = buf[i]
        const x = out[n]
        out[n] = y - x
        buf[i] = x + y * 0.5
        if (++i >= buf.length) i = 0
      }
    }
    return out
  })
}

const rms = (b) => {
  let s = 0
  for (let n = 0; n < LEN; n++) s += b[0][n] * b[0][n] + b[1][n] * b[1][n]
  return Math.sqrt(s / (2 * LEN))
}

const echoes = echo(lead, BEAT, 0.34, 2200)
const dry = bus()
const send = bus()
for (let c = 0; c < 2; c++) {
  for (let n = 0; n < LEN; n++) {
    dry[c][n] = lead[c][n] + bed[c][n] + pad[c][n] + echoes[c][n] * 0.2
    send[c][n] = lead[c][n] * 0.9 + bed[c][n] * 0.7 + pad[c][n] * 1.1 + echoes[c][n] * 0.3
  }
}
const wet = hall(send)
const wetGain = (0.3 * rms(dry)) / (rms(wet) || 1) // the hall sits about 10 dB under the players
if ('stats' in arg) {
  const rel = (b) => (20 * Math.log10(rms(b) / rms(lead))).toFixed(1)
  console.log(`balance vs lead (dB): bed ${rel(bed)} · pad ${rel(pad)} · echo ${(Number(rel(echoes)) + 20 * Math.log10(0.2)).toFixed(1)} · hall ${(Number(rel(wet)) + 20 * Math.log10(wetGain)).toFixed(1)}`)
}

/* ── master: DC block → 6.5 kHz low-pass → soft knee → peak → fades ───────── */
const mix = bus()
{
  const w0 = (2 * Math.PI * 6500) / SR
  const alpha = Math.sin(w0) / (2 * Math.SQRT1_2)
  const cs = Math.cos(w0)
  const b0 = (1 - cs) / 2 / (1 + alpha)
  const b1 = (1 - cs) / (1 + alpha)
  const a1 = (-2 * cs) / (1 + alpha)
  const a2 = (1 - alpha) / (1 + alpha)
  const R = 1 - (2 * Math.PI * 28) / SR
  for (let c = 0; c < 2; c++) {
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0, dx = 0, dy = 0
    for (let n = 0; n < LEN; n++) {
      const x = dry[c][n] + wet[c][n] * wetGain
      dy = x - dx + R * dy
      dx = x
      const y = b0 * dy + b1 * x1 + b0 * x2 - a1 * y1 - a2 * y2
      x2 = x1
      x1 = dy
      y2 = y1
      y1 = y
      mix[c][n] = y
    }
  }
}
let peak = 0
for (let c = 0; c < 2; c++) for (let n = 0; n < LEN; n++) peak = Math.max(peak, Math.abs(mix[c][n]))
const drive = 1.25 / peak // the loudest plucks lean gently into the knee
let peak2 = 0
for (let c = 0; c < 2; c++) {
  for (let n = 0; n < LEN; n++) {
    const t = n / SR
    let g = 1
    if (t < FADE_IN) g = 0.5 - 0.5 * Math.cos((Math.PI * t) / FADE_IN)
    if (t > DURATION - FADE_OUT) g = 0.5 + 0.5 * Math.cos((Math.PI * (t - (DURATION - FADE_OUT))) / FADE_OUT)
    mix[c][n] = Math.tanh(mix[c][n] * drive) * g
    peak2 = Math.max(peak2, Math.abs(mix[c][n]))
  }
}
const norm = 10 ** (PEAK_DB / 20) / peak2

/* ── 16-bit WAV with triangular dither ────────────────────────────────────── */
const data = Buffer.alloc(LEN * 4)
let sum = 0
for (let n = 0; n < LEN; n++) {
  for (let c = 0; c < 2; c++) {
    const v = mix[c][n] * norm
    sum += v * v
    const s = Math.round(v * 32767 + (rand() - rand()) * 0.5)
    data.writeInt16LE(Math.max(-32768, Math.min(32767, s)), (n * 2 + c) * 2)
  }
}
const head = Buffer.alloc(44)
head.write('RIFF', 0)
head.writeUInt32LE(36 + data.length, 4)
head.write('WAVEfmt ', 8)
head.writeUInt32LE(16, 16)
head.writeUInt16LE(1, 20) // PCM
head.writeUInt16LE(2, 22) // stereo
head.writeUInt32LE(SR, 24)
head.writeUInt32LE(SR * 4, 28)
head.writeUInt16LE(4, 32)
head.writeUInt16LE(16, 34)
head.write('data', 36)
head.writeUInt32LE(data.length, 40)
mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, Buffer.concat([head, data]))

const db = (x) => (20 * Math.log10(x)).toFixed(1)
console.log(`${OUT}: ${DURATION.toFixed(2)} s · ${(60 / BEAT).toFixed(1)} bpm (3/4, bar ${BAR.toFixed(3)} s) · peak ${PEAK_DB} dBFS · rms ${db(Math.sqrt(sum / (LEN * 2)))} dBFS`)
