// The films' music, made in code: no samples, no downloads. Plain Node, no packages.
//
//   node scripts/music.mjs trailer [--out=.cache/music/trailer.wav]
//   node scripts/music.mjs story   [--out=.cache/music/story.wav]
//
// A score (scripts/scores/<name>.mjs) is a list of bars in 3/4: a chord, melody notes, and optional
// bells / chimes / wind. The beat length comes from the film's timeline file, so bar lines are picture cuts.
//
// The band: a double-course plucked string (extended Karplus–Strong) sings the tune; a celesta-like bell
// doubles it softly an octave up; a harp rolls 1–5–8–10–8–5 in eighths; a warm pad and a soft bass hold the
// harmony; a one-beat echo and a small hall glue it. A 7 kHz low-pass keeps it gentle. The mix is
// normalised so the sample peak is −4 dBFS (true peak after AAC stays under −3 dBFS; scripts/qa.mjs measures it).
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const name = process.argv[2]
if (!name) throw new Error('usage: node scripts/music.mjs <trailer|story> [--out=file.wav]')
const arg = Object.fromEntries(process.argv.slice(3).map((a) => a.replace(/^--/, '').split('=')))
const OUT = resolve(arg.out ?? resolve(HERE, '../.cache/music', `${name}.wav`))
const score = (await import(pathToFileURL(resolve(HERE, 'scores', `${name}.mjs`)).href)).default

const SR = 48000
const BEAT = score.beat
const BAR = BEAT * 3
const START = score.start ?? 0 // time of bar 1 beat 1
const DURATION = score.duration
const LEN = Math.round(DURATION * SR)
const PEAK_DB = -4

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
const rand = mulberry32(score.seed ?? 7)
const jit = (x) => (rand() * 2 - 1) * x
const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
function hz(n) {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(n)
  if (!m) throw new Error(`bad note ${n}`)
  const midi = SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) + 1) * 12
  return 440 * 2 ** ((midi - 69) / 12)
}
const cents = (c) => 2 ** (c / 1200)
const at = (bar, beat = 1) => START + (bar - 1) * BAR + (beat - 1) * BEAT
const bus = () => [new Float32Array(LEN), new Float32Array(LEN)]
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

/* ── instruments ──────────────────────────────────────────────────────────── */
/** Plucked string. `soft` 0…1 rounds the attack; `t60` is the ring time of the fundamental. */
function pluck(freq, dur, { t60 = 2.2, bright = 0.55, soft = 0.3, pos = 0.23 } = {}) {
  const n = Math.round(dur * SR)
  const out = new Float32Array(n)
  const s = 0.5 - bright * 0.32 // loop low-pass blend
  const period = SR / freq - s
  const N = Math.floor(period)
  const frac = period - N
  const C = (1 - frac) / (1 + frac)
  const buf = new Float32Array(N)
  // excitation: noise, low-passed, with a pluck-position notch
  let lp = 0
  const k = 0.18 + bright * 0.55
  for (let i = 0; i < N; i++) {
    lp += k * (rand() * 2 - 1 - lp)
    buf[i] = lp
  }
  const d = Math.max(1, Math.round(N * pos))
  const ex = new Float32Array(N)
  for (let i = 0; i < N; i++) ex[i] = buf[i] - buf[(i - d + N) % N] * 0.9
  let mean = 0
  for (let i = 0; i < N; i++) mean += ex[i]
  mean /= N
  let mx = 1e-9
  for (let i = 0; i < N; i++) {
    ex[i] -= mean
    mx = Math.max(mx, Math.abs(ex[i]))
  }
  for (let i = 0; i < N; i++) buf[i] = ex[i] / mx
  const rho = 10 ** (-3 / (t60 * freq))
  let prev = 0
  let apX = 0
  let apY = 0
  let idx = 0
  const att = Math.max(1, Math.round((0.002 + soft * 0.012) * SR))
  const rel = Math.round(0.06 * SR)
  for (let i = 0; i < n; i++) {
    const x = buf[idx]
    const f = rho * ((1 - s) * x + s * prev)
    prev = x
    const y = C * f + apX - C * apY
    apX = f
    apY = y
    buf[idx] = y
    idx = (idx + 1) % N
    let env = i < att ? i / att : 1
    if (i > n - rel) env *= (n - i) / rel
    out[i] = x * env
  }
  return out
}

/** Celesta / music-box bell: a few partials, each dying faster than the last. */
function bell(freq, dur, { tau = 0.9, hard = 0.5 } = {}) {
  const n = Math.round(dur * SR)
  const out = new Float32Array(n)
  const parts = [
    [1, 1, 1],
    [2, 0.26 + hard * 0.1, 0.55],
    [3.01, 0.09 + hard * 0.08, 0.36],
    [4.16, 0.04 + hard * 0.05, 0.22],
  ]
  const att = Math.round(0.003 * SR)
  for (const [mul, amp, tk] of parts) {
    const w = (2 * Math.PI * freq * mul) / SR
    if (freq * mul > 9000) continue
    const dec = 1 / (tau * tk * SR)
    for (let i = 0; i < n; i++) out[i] += Math.sin(w * i) * amp * Math.exp(-i * dec)
  }
  const rel = Math.round(0.05 * SR)
  for (let i = 0; i < n; i++) {
    let env = i < att ? i / att : 1
    if (i > n - rel) env *= (n - i) / rel
    out[i] *= env
  }
  return out
}

/** Warm sustained voice for the pad: soft harmonics, slow in, slow out. */
function padVoice(freq, dur, { attack = 0.7, release = 1.1 } = {}) {
  const n = Math.round((dur + release) * SR)
  const out = new Float32Array(n)
  for (const det of [-5, 4]) {
    const f = freq * cents(det)
    const ph = rand() * 6.283
    for (let h = 1; h <= 5; h++) {
      if (f * h > 2600) break
      const w = (2 * Math.PI * f * h) / SR
      const a = 0.5 / h ** 1.7
      for (let i = 0; i < n; i++) out[i] += Math.sin(w * i + ph * h) * a
    }
  }
  const aN = Math.round(attack * SR)
  const rN = Math.round(release * SR)
  const trem = (2 * Math.PI * (0.16 + rand() * 0.1)) / SR
  for (let i = 0; i < n; i++) {
    let env = i < aN ? 0.5 - 0.5 * Math.cos((Math.PI * i) / aN) : 1
    if (i > n - rN) env *= 0.5 - 0.5 * Math.cos((Math.PI * (n - i)) / rN)
    out[i] *= env * (0.9 + 0.1 * Math.sin(trem * i))
  }
  return out
}

/** Soft bass: sine with a little second harmonic and a rounded pluck envelope. */
function bass(freq, dur) {
  const n = Math.round(dur * SR)
  const out = new Float32Array(n)
  const w = (2 * Math.PI * freq) / SR
  const att = Math.round(0.02 * SR)
  for (let i = 0; i < n; i++) {
    const env = (i < att ? i / att : 1) * Math.exp(-i / (0.9 * SR)) * (i > n - 2400 ? (n - i) / 2400 : 1)
    out[i] = (Math.sin(w * i) + 0.25 * Math.sin(2 * w * i)) * env
  }
  return out
}

/** A breath of wind: band-passed noise that swells and falls. */
function wind(dur, { lo = 380, hi = 1300 } = {}) {
  const n = Math.round(dur * SR)
  const L = new Float32Array(n)
  const R = new Float32Array(n)
  for (const ch of [L, R]) {
    let b1 = 0
    let b2 = 0
    for (let i = 0; i < n; i++) {
      const p = i / n
      const env = Math.sin(Math.PI * p) ** 1.6 * (0.75 + 0.25 * Math.sin(p * 21 + (ch === L ? 0 : 1.3)))
      const fc = lo + (hi - lo) * Math.sin(Math.PI * p) ** 2
      const f = 2 * Math.sin((Math.PI * fc) / SR)
      const q = 0.9
      const x = rand() * 2 - 1
      // state-variable band-pass
      b1 += f * (x - b1 * q - b2)
      b2 += f * b1
      ch[i] = b1 * env
    }
  }
  return [L, R]
}

/* ── the score ────────────────────────────────────────────────────────────── */
const lead = bus()
const bells = bus()
const bed = bus()
const pad = bus()
const low = bus()
const air = bus()

const CHORDS = score.chords
score.bars.forEach((bar, bi) => {
  const b = bi + 1
  const ch = bar.chord ? CHORDS[bar.chord] : null
  const lvl = bar.level ?? 1
  if (ch) {
    // pad: the chord, held for the bar (and a breath longer so bars overlap)
    if (bar.pad !== false) for (const [i, note] of ch.pad.entries()) place(pad, padVoice(hz(note), BAR * (bar.hold ?? 1) + 0.3), at(b) - 0.12, 0.5 * (bar.padLevel ?? 1), (i - 1) * 0.35)
    // harp: six eighths
    if (bar.harp !== false) {
      const pattern = bar.harp === 'half' ? [0, 2, 4] : bar.harp === 'down' ? [0] : [0, 1, 2, 3, 4, 5]
      for (const k of pattern) {
        const note = ch.arp[k % ch.arp.length]
        const t = at(b, 1 + k * 0.5) + jit(0.007) + (k % 2 ? 0.004 : 0)
        const accent = k === 0 ? 1 : k % 2 === 0 ? 0.72 : 0.56
        place(bed, pluck(hz(note), BEAT * 3.2, { t60: 2.4, bright: 0.38, soft: 0.6, pos: 0.31 }), t, 0.5 * accent * lvl * (0.92 + rand() * 0.16), -0.45 + (k / 5) * 0.9)
      }
    }
    if (bar.bass !== false) place(low, bass(hz(ch.bass), BAR * 0.98), at(b) + jit(0.004), 0.55 * lvl)
  }
  for (const [note, beat, dur, vel = 1] of bar.melody ?? []) {
    const t = at(b, beat) + jit(0.006)
    const f = hz(note)
    const d = dur * BEAT + 1.4
    // two strings a few cents apart, struck almost together
    place(lead, pluck(f, d, { t60: 3.2, bright: 0.52, soft: 0.35 }), t, 0.62 * vel, -0.1)
    place(lead, pluck(f * cents(6), d, { t60: 3.0, bright: 0.46, soft: 0.45 }), t + 0.011, 0.44 * vel, 0.12)
    if (bar.double !== false) place(bells, bell(f * 2, Math.min(2.6, d), { tau: 0.8 + dur * 0.25, hard: 0.2 }), t + 0.004, 0.2 * vel * (bar.doubleLevel ?? 1), 0.22)
  }
  for (const [note, beat, vel = 1, tau = 1.0] of bar.bells ?? []) place(bells, bell(hz(note), 3.2, { tau, hard: 0.45 }), at(b, beat) + jit(0.005), 0.42 * vel, (rand() - 0.5) * 0.7)
})
for (const w of score.wind ?? []) {
  const [L, R] = wind(w.dur, w)
  const start = Math.round(w.at * SR)
  for (let i = 0; i < L.length && start + i < LEN; i++) {
    air[0][start + i] += L[i] * w.gain
    air[1][start + i] += R[i] * w.gain
  }
}

/* ── effects ──────────────────────────────────────────────────────────────── */
function echo(src, delay, fb, mixAmt) {
  const d = Math.round(delay * SR)
  const out = bus()
  for (let c = 0; c < 2; c++) {
    const s = src[c]
    const o = out[c]
    const other = src[1 - c]
    for (let i = d; i < LEN; i++) o[i] = (other[i - d] * 0.6 + s[i - d] * 0.4) * mixAmt + o[i - d] * fb
  }
  return out
}
function reverb(send) {
  const out = bus()
  const combs = [1557, 1617, 1491, 1422, 1277, 1356, 1188, 1116]
  const alls = [556, 441, 341, 225]
  const scale = SR / 44100
  for (let c = 0; c < 2; c++) {
    const input = send[c]
    const acc = new Float32Array(LEN)
    for (const base of combs) {
      const N = Math.round((base + c * 23) * scale * 1.18)
      const buf = new Float32Array(N)
      let idx = 0
      let store = 0
      const fb = 0.84
      const damp = 0.32
      for (let i = 0; i < LEN; i++) {
        const y = buf[idx]
        store = y * (1 - damp) + store * damp
        buf[idx] = input[i] + store * fb
        idx = (idx + 1) % N
        acc[i] += y
      }
    }
    let sig = acc
    for (const base of alls) {
      const N = Math.round((base + c * 23) * scale)
      const buf = new Float32Array(N)
      let idx = 0
      const o = new Float32Array(LEN)
      for (let i = 0; i < LEN; i++) {
        const b = buf[idx]
        const x = sig[i]
        o[i] = -x + b
        buf[idx] = x + b * 0.5
        idx = (idx + 1) % N
      }
      sig = o
    }
    out[c] = sig
  }
  return out
}
function lowpass(buf, fc) {
  const a = 1 - Math.exp((-2 * Math.PI * fc) / SR)
  for (const ch of buf) {
    let y1 = 0
    let y2 = 0
    for (let i = 0; i < LEN; i++) {
      y1 += a * (ch[i] - y1)
      y2 += a * (y1 - y2)
      ch[i] = y2
    }
  }
}
function highpass(buf, fc) {
  const a = 1 - Math.exp((-2 * Math.PI * fc) / SR)
  for (const ch of buf) {
    let y = 0
    for (let i = 0; i < LEN; i++) {
      y += a * (ch[i] - y)
      ch[i] -= y
    }
  }
}

const mix = bus()
const send = bus()
const add = (src, gain, wet) => {
  for (let c = 0; c < 2; c++)
    for (let i = 0; i < LEN; i++) {
      mix[c][i] += src[c][i] * gain
      send[c][i] += src[c][i] * wet
    }
}
const rms = (b) => {
  let e = 0
  for (let c = 0; c < 2; c++) for (let i = 0; i < LEN; i++) e += b[c][i] * b[c][i]
  return Math.sqrt(e / (2 * LEN)) || 1e-9
}
const db = (x) => (20 * Math.log10(x)).toFixed(1)
// balance by measurement: every part is set to a level relative to the tune (dB RMS)
const leadRms = rms(lead)
const level = (b, relDb) => (leadRms * 10 ** (relDb / 20)) / rms(b)
const leadEcho = echo(lead, BEAT, 0.28, 0.3)
const G = {
  lead: 1,
  echo: level(leadEcho, -11),
  bells: level(bells, score.mix?.bells ?? -9),
  bed: level(bed, score.mix?.bed ?? -6.5),
  pad: level(pad, score.mix?.pad ?? -13),
  low: level(low, score.mix?.low ?? -9),
}
add(lead, G.lead, 0.24)
add(leadEcho, G.echo, 0.2 * G.echo)
add(bells, G.bells, 0.34 * G.bells)
add(bed, G.bed, 0.2 * G.bed)
add(pad, G.pad, 0.22 * G.pad)
add(low, G.low, 0.03 * G.low)
add(air, 1.0, 0.25)
highpass(send, 180)
const wet = reverb(send)
const wetGain = (leadRms * 10 ** ((score.mix?.reverb ?? -10) / 20)) / rms(wet)
for (let c = 0; c < 2; c++) for (let i = 0; i < LEN; i++) mix[c][i] += wet[c][i] * wetGain
if (arg.verbose) console.log('levels dB rms · lead', db(leadRms), '· gains', Object.entries(G).map(([k, v]) => `${k} ${db(v)}`).join(' '), '· wet', db(wetGain))
lowpass(mix, 7000)
highpass(mix, 38)

// fades
const fin = Math.round((score.fadeIn ?? 0.03) * SR)
const fout = Math.round((score.fadeOut ?? 1.5) * SR)
for (let c = 0; c < 2; c++)
  for (let i = 0; i < LEN; i++) {
    let g = 1
    if (i < fin) g *= 0.5 - 0.5 * Math.cos((Math.PI * i) / fin)
    if (i > LEN - fout) g *= 0.5 - 0.5 * Math.cos((Math.PI * (LEN - i)) / fout)
    mix[c][i] *= g
  }
// soft limiter then normalise: a few plucks land together; round them instead of clipping
let peak = 0
for (let c = 0; c < 2; c++) for (let i = 0; i < LEN; i++) peak = Math.max(peak, Math.abs(mix[c][i]))
// only the tallest peaks are rounded: below half scale the curve is a straight line
const pre = 1.0 / peak
const soft = (x) => {
  const a = Math.abs(x)
  if (a <= 0.6) return x
  return Math.sign(x) * (0.6 + 0.4 * Math.tanh((a - 0.6) / 0.4))
}
for (let c = 0; c < 2; c++) for (let i = 0; i < LEN; i++) mix[c][i] = soft(mix[c][i] * pre * 2.0)
peak = 0
for (let c = 0; c < 2; c++) for (let i = 0; i < LEN; i++) peak = Math.max(peak, Math.abs(mix[c][i]))
const norm = 10 ** (PEAK_DB / 20) / peak

/* ── wav ──────────────────────────────────────────────────────────────────── */
const data = Buffer.alloc(LEN * 4)
for (let i = 0; i < LEN; i++) {
  for (let c = 0; c < 2; c++) {
    // triangular dither
    const v = mix[c][i] * norm * 32767 + (rand() - rand()) * 0.5
    data.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(v))), i * 4 + c * 2)
  }
}
const header = Buffer.alloc(44)
header.write('RIFF', 0)
header.writeUInt32LE(36 + data.length, 4)
header.write('WAVEfmt ', 8)
header.writeUInt32LE(16, 16)
header.writeUInt16LE(1, 20)
header.writeUInt16LE(2, 22)
header.writeUInt32LE(SR, 24)
header.writeUInt32LE(SR * 4, 28)
header.writeUInt16LE(4, 32)
header.writeUInt16LE(16, 34)
header.write('data', 36)
header.writeUInt32LE(data.length, 40)
mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, Buffer.concat([header, data]))
console.log(`music: ${OUT} · ${DURATION} s · ${score.bars.length} bars at ${(60 / BEAT).toFixed(1)} bpm · peak ${PEAK_DB} dBFS`)
