/**
 * Plays a film's code-made score: no audio files, no voice. The notes are a fixed list in film time, scheduled on
 * the Web Audio clock whenever the film starts or is moved, and the picture follows that clock while it runs (so
 * sound and picture cannot drift apart). The Moon has no air, so there are no "real" sound effects — only music.
 */
import type { Note } from './kit/stage'

export class Sound {
  constructor(private score: Note[]) {}
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
    for (const n of this.score) {
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
