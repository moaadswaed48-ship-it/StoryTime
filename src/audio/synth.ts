/** Tiny WebAudio synth: no audio files. Created on the first user gesture (iOS unlock). */
let ctx: AudioContext | null = null
let master: GainNode | null = null
let musicTimer: number | null = null
let enabled = false

function ensure(): AudioContext | null {
  if (!enabled) return null
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0.5
    master.connect(ctx.destination)
  }
  if (ctx.state !== 'running') void ctx.resume() // iOS reports 'interrupted' after a call or backgrounding
  return ctx
}

function tone(freq: number, dur: number, type: OscillatorType, vol: number, when = 0) {
  const c = ensure()
  if (!c || !master) return
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.value = freq
  const t = c.currentTime + when
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(vol, t + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(master)
  o.start(t)
  o.stop(t + dur + 0.05)
}

export const sfx = {
  pop: () => {
    tone(520, 0.12, 'sine', 0.35)
    tone(780, 0.16, 'sine', 0.2, 0.05)
  },
  chime: () => [880, 1108, 1318].forEach((f, i) => tone(f, 0.5, 'triangle', 0.16, i * 0.07)),
  win: () => [659, 784, 988, 1318].forEach((f, i) => tone(f, 0.45, 'triangle', 0.2, i * 0.11)),
  flip: () => {
    const c = ensure()
    if (!c || !master) return
    const len = Math.floor(c.sampleRate * 0.22)
    const buf = c.createBuffer(1, len, c.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2)
    const src = c.createBufferSource()
    src.buffer = buf
    const f = c.createBiquadFilter()
    f.type = 'bandpass'
    f.frequency.value = 2400
    const g = c.createGain()
    g.gain.value = 0.25
    src.connect(f).connect(g).connect(master)
    src.start()
  },
}

const SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5]
const TUNE = [0, 2, 4, 2, 3, 5, 4, 2, 0, 2, 3, 1, 0, 4, 2, 1]
function startMusic() {
  if (musicTimer !== null) return
  let i = 0
  musicTimer = window.setInterval(() => {
    const n = TUNE[i % TUNE.length]
    tone(SCALE[n], 1.4, 'sine', 0.09)
    if (i % 4 === 0) tone(SCALE[n] / 2, 1.8, 'sine', 0.05)
    i++
  }, 520)
}
function stopMusic() {
  if (musicTimer !== null) clearInterval(musicTimer)
  musicTimer = null
}

export function setSound(on: boolean) {
  enabled = on
  if (on) {
    ensure()
    startMusic()
  } else stopMusic()
}
