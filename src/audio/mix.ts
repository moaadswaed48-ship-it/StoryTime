/**
 * The film mixer: lays sound effects on a timeline, measures how loud the result is the way broadcasters do
 * (ITU-R BS.1770, in LUFS) and brings it to a set loudness, then writes a WAV file for ffmpeg to put in the MP4.
 * Plain arithmetic on samples: it runs in Node (the export script) and would run in a browser.
 */
import { SFX, SR, type Cue } from './sfx.ts'

export type Mix = { L: Float32Array; R: Float32Array; lufs: number; peakDb: number; gainDb: number }

/** K-weighting (BS.1770): a high shelf and a high-pass, as two biquads at 48 kHz. */
function kWeight(x: Float32Array): Float32Array {
  const y = new Float32Array(x.length)
  const stage = (inp: Float32Array, out: Float32Array, b0: number, b1: number, b2: number, a1: number, a2: number) => {
    let x1 = 0
    let x2 = 0
    let y1 = 0
    let y2 = 0
    for (let i = 0; i < inp.length; i++) {
      const v = b0 * inp[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2
      x2 = x1
      x1 = inp[i]
      y2 = y1
      y1 = v
      out[i] = v
    }
  }
  const t = new Float32Array(x.length)
  stage(x, t, 1.53512485958697, -2.69169618940638, 1.19839281085285, -1.69065929318241, 0.73248077421585)
  stage(t, y, 1.0, -2.0, 1.0, -1.99004745483398, 0.99007225036621)
  return y
}

/** Integrated loudness of a stereo signal in LUFS (400 ms blocks, 75 % overlap, absolute and relative gates). */
export function loudness(L: Float32Array, R: Float32Array): number {
  const kl = kWeight(L)
  const kr = kWeight(R)
  const block = Math.round(0.4 * SR)
  const hop = Math.round(0.1 * SR)
  const powers: number[] = []
  for (let s = 0; s + block <= kl.length; s += hop) {
    let p = 0
    for (let i = s; i < s + block; i++) p += kl[i] * kl[i] + kr[i] * kr[i]
    powers.push(p / block)
  }
  if (!powers.length) return -Infinity
  const lk = (p: number) => -0.691 + 10 * Math.log10(p || 1e-12)
  const abs = powers.filter((p) => lk(p) > -70)
  if (!abs.length) return -Infinity
  const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length
  const rel = lk(mean(abs)) - 10
  const gated = abs.filter((p) => lk(p) > rel)
  return lk(mean(gated.length ? gated : abs))
}

/**
 * Mixes cues into a stereo track of `duration` seconds and brings it to `target` LUFS (default −16), without
 * letting any sample pass `ceiling` dBFS (default −1.5: if the two cannot both be met, the track stays quieter).
 */
export function mixCues(cues: Cue[], duration: number, target = -16, ceiling = -1.5): Mix {
  const n = Math.round(duration * SR)
  const L = new Float32Array(n)
  const R = new Float32Array(n)
  cues.forEach((c, k) => {
    const make = SFX[c.sfx]
    if (!make) throw new Error(`no sound effect "${c.sfx}"`)
    const x = make({ seed: 100 + k * 7, ...c.opts })
    const start = Math.round(c.t * SR)
    const g = c.gain ?? 1
    for (let i = 0; i < x.length; i++) {
      const j = start + i
      if (j < 0) continue
      if (j >= n) break
      const pan = c.panTo === undefined ? (c.pan ?? 0) : (c.pan ?? 0) + (c.panTo - (c.pan ?? 0)) * (i / x.length)
      const a = ((Math.max(-1, Math.min(1, pan)) + 1) * Math.PI) / 4
      // a short fade at the film's end, so nothing is cut off with a click
      const fade = Math.min(1, (n - j) / (0.05 * SR))
      L[j] += x[i] * Math.cos(a) * g * fade
      R[j] += x[i] * Math.sin(a) * g * fade
    }
  })
  let peak = 1e-9
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]))
  const before = loudness(L, R)
  let gain = Number.isFinite(before) ? Math.pow(10, (target - before) / 20) : 1
  const top = Math.pow(10, ceiling / 20)
  if (peak * gain > top) {
    // a few loud moments may be rounded off (a soft limiter) to reach the target; beyond 4 dB of that, stay quieter
    gain = Math.min(gain, (top / peak) * Math.pow(10, 4 / 20))
    const knee = top * 0.7
    for (let i = 0; i < n; i++) for (const ch of [L, R]) {
      const v = ch[i] * gain
      const a = Math.abs(v)
      ch[i] = a <= knee ? v : Math.sign(v) * (knee + (top - knee) * Math.tanh((a - knee) / (top - knee)))
    }
  } else for (let i = 0; i < n; i++) {
    L[i] *= gain
    R[i] *= gain
  }
  let after = 1e-9
  for (let i = 0; i < n; i++) after = Math.max(after, Math.abs(L[i]), Math.abs(R[i]))
  return { L, R, lufs: loudness(L, R), peakDb: 20 * Math.log10(after), gainDb: 20 * Math.log10(gain) }
}

/** A 16-bit stereo WAV file at 48 kHz. */
export function wav(L: Float32Array, R: Float32Array): Uint8Array {
  const n = L.length
  const out = new Uint8Array(44 + n * 4)
  const v = new DataView(out.buffer)
  const str = (o: number, s: string) => { for (let i = 0; i < s.length; i++) out[o + i] = s.charCodeAt(i) }
  str(0, 'RIFF')
  v.setUint32(4, 36 + n * 4, true)
  str(8, 'WAVEfmt ')
  v.setUint32(16, 16, true)
  v.setUint16(20, 1, true)
  v.setUint16(22, 2, true)
  v.setUint32(24, SR, true)
  v.setUint32(28, SR * 4, true)
  v.setUint16(32, 4, true)
  v.setUint16(34, 16, true)
  str(36, 'data')
  v.setUint32(40, n * 4, true)
  for (let i = 0; i < n; i++) {
    v.setInt16(44 + i * 4, Math.round(Math.max(-1, Math.min(1, L[i])) * 32767), true)
    v.setInt16(46 + i * 4, Math.round(Math.max(-1, Math.min(1, R[i])) * 32767), true)
  }
  return out
}
