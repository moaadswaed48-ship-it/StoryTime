/**
 * A small code-made score for scene 8: no audio files, no voice. Soft mallet notes on the beats of the picture
 * (the count, the hop, each petal of the wing, the three blinks) over a quiet two-note drone that turns from minor
 * to major when the Sun reaches the robot. The Moon has no air, so there are no "real" sound effects — only music.
 *
 * The notes are a fixed list in film time, scheduled on the Web Audio clock whenever the film starts or is moved,
 * and the picture follows that clock while it runs (so sound and picture cannot drift apart).
 */

type Note = { t: number; f: number; d: number; v: number; wave?: OscillatorType; to?: number; attack?: number }

// D major pentatonic
const D3 = 146.83, F3 = 174.61, Fs3 = 185.0, A3 = 220.0
const D4 = 293.66, E4 = 329.63, Fs4 = 369.99, A4 = 440.0
const D5 = 587.33, E5 = 659.25, Fs5 = 739.99, A5 = 880.0, B5 = 987.77, D6 = 1174.66, E6 = 1318.51

const mallet = (t: number, f: number, v = 0.16, d = 0.7): Note => ({ t, f, d, v, wave: 'triangle' })
const bell = (t: number, f: number, v = 0.1, d = 1.4): Note => ({ t, f, d, v, wave: 'sine' })
const thud = (t: number, v = 0.22): Note => ({ t, f: 96, to: 58, d: 0.28, v, wave: 'sine' })
const pad = (t: number, end: number, f: number, v: number): Note => ({ t, f, d: end - t, v, wave: 'sine', attack: 1.6 })

const SCORE: Note[] = [
  // the night: a hollow fifth with a minor third
  pad(0, 19.4, D3, 0.05), pad(0, 19.4, A3, 0.035), pad(0.6, 18.6, F3, 0.022),
  // 1 ─ the idea, and Sari's leap
  bell(1.3, E5, 0.07, 1.0), mallet(2.25, A4, 0.1), mallet(2.45, D5, 0.1), thud(3.5, 0.12),
  // 2 ─ one… two… three… hop!
  mallet(5.5, D4, 0.2), mallet(6.35, E4, 0.2), mallet(7.2, Fs4, 0.22),
  { t: 7.9, f: A4, to: D6, d: 0.9, v: 0.13, wave: 'sine' }, mallet(7.9, A4, 0.2),
  // 3 ─ he floats… and is caught
  bell(8.8, B5, 0.05), bell(9.56, D6, 0.06, 1.8), bell(10.3, A5, 0.045), thud(10.94, 0.2), mallet(10.96, D4, 0.12),
  // 4 ─ three bounds into the light
  mallet(13.0, D4, 0.13), thud(14.5, 0.16), mallet(14.75, Fs4, 0.13), thud(16.25, 0.16), bell(16.3, A5, 0.06), bell(16.4, D6, 0.05),
  mallet(16.5, A4, 0.13), thud(17.5, 0.14), thud(18.12, 0.12), mallet(18.14, D4, 0.1),
  // the daylight: the same fifth, now with a major third
  pad(18.6, 36.5, D3, 0.05), pad(18.6, 36.5, A3, 0.035), pad(19.2, 36.5, Fs3, 0.026),
  // 5 ─ the wing: a tick, an unfolding, then one note per petal, climbing
  bell(20.2, B5, 0.035, 0.4), mallet(20.6, D5, 0.1),
  ...[E5, Fs5, A5, B5, D6, E6].map((f, i) => mallet(20.9 + (i + 1) * 0.36 + 0.1, f, 0.12, 0.9)),
  // 6, 7 ─ blink… blink… and the one that stays
  bell(24.3, A5, 0.11, 0.7), bell(25.1, B5, 0.12, 0.8),
  bell(26.8, D6, 0.12, 3.2), bell(26.8, A5, 0.09, 3.2), bell(26.84, Fs5, 0.08, 3.2), mallet(26.8, D4, 0.14, 2.0),
  // 8 ─ the leap, the landing, a happy double blink, and home
  { t: 30.3, f: A4, to: A5, d: 0.9, v: 0.1, wave: 'sine' }, mallet(30.3, D5, 0.14), bell(31.3, Fs5, 0.05),
  thud(32.4, 0.18), mallet(32.42, D5, 0.12), bell(33.4, E6, 0.06, 0.3), bell(33.72, E6, 0.06, 0.3),
  mallet(34.1, D4, 0.14, 2.6), mallet(34.1, A4, 0.1, 2.6), bell(34.14, D5, 0.08, 2.6), bell(34.18, Fs5, 0.07, 2.6),
]

export class Sound {
  private ctx: AudioContext | null = null
  private out: GainNode | null = null
  private live: { o: OscillatorNode; g: GainNode }[] = []
  private t0 = 0
  private c0 = 0
  private asked = 0
  private running = false
  muted = false

  private ensure(): AudioContext | null {
    if (this.ctx) return this.ctx
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    const c = (this.ctx = new AC())
    const out = (this.out = c.createGain())
    out.gain.value = this.muted ? 0 : 0.8
    // soften the top, and one quiet echo for space
    const lp = c.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 5200
    const delay = c.createDelay(1)
    delay.delayTime.value = 0.31
    const fb = c.createGain()
    fb.gain.value = 0.26
    const wet = c.createGain()
    wet.gain.value = 0.22
    out.connect(lp)
    lp.connect(c.destination)
    lp.connect(delay)
    delay.connect(fb)
    fb.connect(delay)
    delay.connect(wet)
    wet.connect(c.destination)
    return c
  }

  /** Start (or restart) the score from film time `T`. Call from a user gesture the first time. */
  play(T: number) {
    this.silence()
    const c = this.ensure()
    if (!c || !this.out) return
    if (c.state !== 'running') void c.resume()
    this.t0 = T
    this.c0 = c.currentTime + 0.06
    this.asked = performance.now()
    this.running = true
    for (const n of SCORE) {
      const end = n.t + n.d
      if (end <= T) continue
      const o = c.createOscillator()
      const g = c.createGain()
      o.type = n.wave ?? 'sine'
      const at = this.c0 + Math.max(0, n.t - T)
      const stop = this.c0 + (end - T)
      o.frequency.setValueAtTime(n.f, at)
      if (n.to) o.frequency.exponentialRampToValueAtTime(n.to, at + n.d * 0.7)
      g.gain.setValueAtTime(0.0001, at)
      if (n.attack) {
        // a long, slow note: rise, hold, fall
        const a = Math.min(n.attack, (stop - at) / 3)
        g.gain.exponentialRampToValueAtTime(n.v, at + a)
        g.gain.setValueAtTime(n.v, Math.max(at + a, stop - a))
        g.gain.exponentialRampToValueAtTime(0.0001, stop)
      } else {
        g.gain.exponentialRampToValueAtTime(n.v, at + 0.012)
        g.gain.exponentialRampToValueAtTime(0.0001, stop)
      }
      o.connect(g).connect(this.out)
      o.start(at)
      o.stop(stop + 0.05)
      this.live.push({ o, g })
    }
  }

  /** Stop every scheduled note (pause, scrub, end). */
  silence() {
    this.running = false
    for (const { o, g } of this.live) {
      try {
        o.stop()
      } catch {
        // already ended
      }
      o.disconnect()
      g.disconnect()
    }
    this.live = []
  }

  setMuted(m: boolean) {
    this.muted = m
    if (this.ctx && this.out) this.out.gain.setTargetAtTime(m ? 0 : 0.8, this.ctx.currentTime, 0.03)
  }

  /**
   * The film time according to the audio clock, `'wait'` while the audio is still starting up, or null when there
   * is no audio clock to follow (the picture then keeps its own time).
   */
  clock(): number | 'wait' | null {
    const c = this.ctx
    if (!c || !this.running) return null
    if (c.state !== 'running') {
      if (performance.now() - this.asked < 350) return 'wait'
      // the browser will not start the audio: let the picture go on alone, silently
      this.silence()
      return null
    }
    return this.t0 + Math.max(0, c.currentTime - this.c0)
  }

  dispose() {
    this.silence()
    void this.ctx?.close()
    this.ctx = null
  }
}
