import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { Pause, Play, RotateCcw } from 'lucide-react'
import { t } from '@/i18n/copy'
import { dirSign, rtl } from '@/i18n/locale'
import { clamp } from '@/lib/clamp'
import { exposeQA } from '@/lib/qa'
import { Painter } from './kit/core'
import { DURATION, SHOTS, captionAt, renderScene8, type Caption } from './scene8'

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

/**
 * Plays scene 8 of «نزهة على القمر», drawn live on a canvas. The picture is a pure function of the time, so it can
 * be scrubbed, restarted, or stepped frame by frame for capture (`window.__st.moonfilm.seek(t)`, or `&t=12.5` in the
 * address to open paused on a frame; `&bare=1` hides the controls so the stage fills the window).
 */
export function Player({ startAt, bare }: { startAt: number | null; bare: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const scrub = useRef<HTMLDivElement>(null)
  const clockEl = useRef<HTMLSpanElement>(null)
  const time = useRef(startAt ?? 0)
  const playing = useRef(false)
  const drag = useRef(false)
  const [isPlaying, setPlaying] = useState(false)
  const [started, setStarted] = useState(startAt !== null || bare)
  const [caption, setCaption] = useState<Caption | null>(null)
  const capKey = useRef('')

  const draw = useCallback(() => {
    const cv = canvas.current
    const ctx = cv?.getContext('2d')
    if (!cv || !ctx) return
    const T = time.current
    renderScene8(new Painter(ctx, cv.width), T)
    scrub.current?.style.setProperty('--p', String(T / DURATION))
    scrub.current?.setAttribute('aria-valuenow', String(Math.round(T)))
    if (clockEl.current) clockEl.current.textContent = `${clock(T)} / ${clock(DURATION)}`
    const cap = captionAt(T)
    const key = cap ? `${cap.id}:${cap.shown}` : ''
    if (key !== capKey.current) {
      capKey.current = key
      setCaption(cap)
    }
  }, [])

  const seek = useCallback(
    (T: number) => {
      time.current = clamp(T, 0, DURATION)
      draw()
    },
    [draw],
  )
  const setPlay = useCallback((on: boolean) => {
    if (on && time.current >= DURATION - 0.05) time.current = 0
    playing.current = on
    setPlaying(on)
    if (on) setStarted(true)
  }, [])

  // the canvas keeps the stage's size (sharp up to 1920 wide, at most 2× the CSS pixels: phones stay smooth)
  useEffect(() => {
    const el = stage.current
    const cv = canvas.current
    if (!el || !cv) return
    const fit = () => {
      const w = Math.min(1920, Math.round(el.clientWidth * Math.min(2, window.devicePixelRatio || 1)))
      if (w > 0 && cv.width !== w) {
        cv.width = w
        cv.height = Math.round((w * 9) / 16)
      }
      draw()
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [draw])

  // the clock: real time while playing, nothing at all while paused
  useEffect(() => {
    let raf = 0
    let last = 0
    const tick = (now: number) => {
      if (playing.current && !drag.current) {
        const dt = last ? Math.min(0.1, (now - last) / 1000) : 0
        time.current = Math.min(DURATION, time.current + dt)
        draw()
        if (time.current >= DURATION) setPlay(false)
      }
      last = now
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    const hide = () => document.hidden && setPlay(false)
    document.addEventListener('visibilitychange', hide)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', hide)
    }
  }, [draw, setPlay])

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
    setStarted(true)
    seek(timeAt(e.clientX))
  }
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (drag.current) seek(timeAt(e.clientX))
  }
  const up = () => {
    drag.current = false
  }
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    const T = time.current
    const to = e.key === 'ArrowRight' ? T + dirSign : e.key === 'ArrowLeft' ? T - dirSign : e.key === 'Home' ? 0 : e.key === 'End' ? DURATION : e.key === ' ' || e.key === 'Enter' ? -1 : null
    if (to === null) return
    e.preventDefault()
    if (to === -1) setPlay(!playing.current)
    else seek(to)
  }

  return (
    <div className="mf-room" data-bare={bare ? '' : undefined} data-moonfilm={isPlaying ? 'playing' : 'paused'}>
      <div className="mf-stage" ref={stage} data-moonfilm-stage onClick={() => started && setPlay(!playing.current)}>
        <canvas ref={canvas} width={1280} height={720} />
        <p className="mf-caption" dir="rtl" lang="ar" data-on={caption ? '' : undefined}>
          {caption?.words.map((w, i) => (
            <span key={`${caption.id}${i}`} className="mf-word" data-on={i < caption.shown ? '' : undefined}>
              {`${w} `}
            </span>
          ))}
        </p>
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
              seek(0)
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
        </div>
      )}
    </div>
  )
}
