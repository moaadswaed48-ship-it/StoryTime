import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react'
import { t } from '@/i18n/copy'
import { dirSign, rtl } from '@/i18n/locale'
import { clamp } from '@/lib/clamp'
import { exposeQA } from '@/lib/qa'
import { Painter } from './kit/core'
import { DURATION, SHOTS, auditMotion, captionAt, renderScene8 } from './scene8'
import { Sound } from './sound'

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
/**
 * Canvas size as a share of the full size, per step. While it plays, a device that cannot keep up gets a smaller
 * canvas (never a simpler drawing); a paused frame is always drawn at full size. `&q=0` in the address locks it.
 */
const SCALE = [1, 0.8, 0.62]

/**
 * Plays scene 8 of «نزهة على القمر», drawn live on a canvas. The picture is a pure function of the time, so it can
 * be scrubbed, restarted, or stepped frame by frame for capture (`window.__st.moonfilm.seek(t)`, or `&t=12.5` in the
 * address to open paused on a frame; `&bare=1` hides the controls so the stage fills the window).
 */
export function Player({ startAt, bare, lockQuality, note, autoPlay }: { startAt: number | null; bare: boolean; lockQuality: boolean; note?: string; autoPlay?: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const scrub = useRef<HTMLDivElement>(null)
  const clockEl = useRef<HTMLSpanElement>(null)
  const time = useRef(startAt ?? 0)
  const playing = useRef(false)
  const drag = useRef(false)
  const quality = useRef(0)
  const sound = useRef<Sound | null>(null)
  const [isPlaying, setPlaying] = useState(false)
  const [started, setStarted] = useState(startAt !== null || bare)
  // the score is a first draft nobody has listened to yet: it stays off until someone asks for it
  const [muted, setMuted] = useState(true)
  const capEl = useRef<HTMLParagraphElement>(null)

  const draw = useCallback(() => {
    const cv = canvas.current
    const ctx = cv?.getContext('2d')
    if (!cv || !ctx) return
    const T = time.current
    renderScene8(new Painter(ctx, cv.width), T)
    scrub.current?.style.setProperty('--p', String(T / DURATION))
    scrub.current?.setAttribute('aria-valuenow', String(Math.round(T)))
    if (clockEl.current) clockEl.current.textContent = `${clock(T)} / ${clock(DURATION)}`
    // the words: real right-to-left text in the page, their visibility set from the time in the same instant
    const el = capEl.current
    if (el) {
      const cap = captionAt(T)
      const id = cap?.id ?? ''
      if (el.dataset.cap !== id) {
        el.dataset.cap = id
        el.replaceChildren(
          ...(cap?.words ?? []).map((w) => {
            const span = document.createElement('span')
            span.textContent = `${w} `
            return span
          }),
        )
      }
      el.style.opacity = String(cap?.alpha ?? 0)
      cap?.alphas.forEach((a, i) => ((el.children[i] as HTMLElement).style.opacity = String(a)))
    }
  }, [])

  // the canvas keeps the stage's size (sharp up to 1920 wide, at most 2× the CSS pixels: phones stay smooth)
  const fit = useCallback(() => {
    const el = stage.current
    const cv = canvas.current
    if (!el || !cv) return
    const w = Math.round(Math.min(1920, el.clientWidth * Math.min(2, window.devicePixelRatio || 1)) * (playing.current ? SCALE[quality.current] : 1))
    if (w > 0 && cv.width !== w) {
      cv.width = w
      cv.height = Math.round((w * 9) / 16)
    }
    draw()
  }, [draw])

  const setPlay = useCallback(
    (on: boolean) => {
      // pressing play on the last picture (where reduced motion opens) starts the scene from the top
      if (on && time.current >= DURATION - 0.6) time.current = 0
      playing.current = on
      setPlaying(on)
      if (on) {
        setStarted(true)
        if (!sound.current) {
          sound.current = new Sound()
          sound.current.muted = true
        }
        sound.current.play(time.current)
      } else sound.current?.silence()
      fit()
    },
    [fit],
  )

  const seek = useCallback(
    (T: number) => {
      time.current = clamp(T, 0, DURATION)
      if (playing.current && !drag.current) sound.current?.play(time.current)
      draw()
    },
    [draw],
  )

  useEffect(() => {
    const el = stage.current
    if (!el) return
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [fit])

  // the clock: the score's clock while it runs, otherwise real time; nothing at all while paused
  useEffect(() => {
    let raf = 0
    let last = 0
    let pace = 16
    let frames = 0
    const tick = (now: number) => {
      if (playing.current && !drag.current) {
        const gap = last ? now - last : 16
        const audio = sound.current?.clock() ?? null
        if (audio !== 'wait') {
          time.current = Math.min(DURATION, audio ?? time.current + Math.min(0.1, gap / 1000))
          draw()
          if (time.current >= DURATION) setPlay(false)
        }
        // a device that cannot keep up gets a smaller canvas, then a simpler picture (never the other way round)
        pace += (gap - pace) * 0.06
        if (!lockQuality && ++frames > 45 && pace > 42 && quality.current < SCALE.length - 1) {
          quality.current++
          frames = 0
          pace = 16
          fit()
        }
      } else frames = 0
      last = now
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    const hide = () => document.hidden && setPlay(false)
    document.addEventListener('visibilitychange', hide)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', hide)
      sound.current?.dispose()
      sound.current = null
    }
  }, [draw, fit, setPlay, lockQuality])

  // opened by someone who asked to watch: it starts by itself (the score stays off until asked for)
  useEffect(() => {
    if (autoPlay) setPlay(true)
  }, [autoPlay, setPlay])

  useEffect(() => {
    exposeQA({
      moonfilm: {
        duration: DURATION,
        shots: SHOTS,
        seek: (T: number) => {
          setPlay(false)
          setStarted(true)
          seek(T)
        },
        play: () => setPlay(true),
        pause: () => setPlay(false),
        time: () => time.current,
        quality: () => quality.current,
        audit: auditMotion,
      },
    })
  }, [seek, setPlay])

  const timeAt = (clientX: number) => {
    const r = scrub.current!.getBoundingClientRect()
    const x = clamp((clientX - r.left) / Math.max(1, r.width), 0, 1)
    return (rtl ? 1 - x : x) * DURATION
  }
  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = true
    sound.current?.silence()
    setStarted(true)
    seek(timeAt(e.clientX))
  }
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (drag.current) seek(timeAt(e.clientX))
  }
  const up = () => {
    if (!drag.current) return
    drag.current = false
    if (playing.current) sound.current?.play(time.current)
  }
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    const T = time.current
    const to = e.key === 'ArrowRight' ? T + dirSign : e.key === 'ArrowLeft' ? T - dirSign : e.key === 'Home' ? 0 : e.key === 'End' ? DURATION : e.key === ' ' || e.key === 'Enter' ? -1 : null
    if (to === null) return
    e.preventDefault()
    if (to === -1) setPlay(!playing.current)
    else seek(to)
  }
  const toggleMute = () => {
    const m = !muted
    setMuted(m)
    if (!sound.current) {
      sound.current = new Sound()
      if (playing.current) sound.current.play(time.current)
    }
    sound.current.setMuted(m)
  }

  return (
    <div className="mf-room" data-bare={bare ? '' : undefined} data-note={note ? '' : undefined} data-moonfilm={isPlaying ? 'playing' : 'paused'}>
      <div className="mf-stage" ref={stage} data-moonfilm-stage onClick={() => started && setPlay(!playing.current)}>
        <canvas ref={canvas} width={1280} height={720} />
        <p className="mf-caption" dir="rtl" lang="ar" ref={capEl} />
        {!started && (
          <button type="button" className="mf-start" aria-label={t.film.play} onClick={() => setPlay(true)}>
            <span>
              <Play fill="currentColor" strokeWidth={0} />
            </span>
          </button>
        )}
      </div>
      {!bare && (
        <div className="mf-bar">
          <button type="button" className="mf-btn" aria-label={isPlaying ? t.film.pause : t.film.play} onClick={() => setPlay(!playing.current)}>
            {isPlaying ? <Pause size={20} fill="currentColor" strokeWidth={0} /> : <Play size={20} fill="currentColor" strokeWidth={0} />}
          </button>
          <button
            type="button"
            className="mf-btn"
            aria-label={t.film.replay}
            onClick={() => {
              time.current = 0
              setPlay(true)
            }}
          >
            <RotateCcw size={19} />
          </button>
          <div
            ref={scrub}
            className="mf-scrub"
            role="slider"
            tabIndex={0}
            aria-label={t.film.title}
            aria-orientation="horizontal"
            aria-valuemin={0}
            aria-valuemax={Math.round(DURATION)}
            aria-valuenow={0}
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
            onKeyDown={key}
          >
            {SHOTS.slice(1).map((s) => (
              <i key={s} style={{ insetInlineStart: `${(s / DURATION) * 100}%` }} />
            ))}
            <b />
          </div>
          <span className="mf-time" dir="ltr" ref={clockEl} />
          <button type="button" className="mf-btn" aria-label={muted ? t.film.unmute : t.film.mute} aria-pressed={muted} onClick={toggleMute}>
            {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </div>
      )}
      {note && !bare && <p className="mf-note">{note}</p>}
    </div>
  )
}
