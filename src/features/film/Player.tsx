import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { Captions, CaptionsOff, Pause, Play, Volume2, VolumeX, X } from 'lucide-react'
import { Eyebrow, Pill } from '@/design/ui'
import { useOverlayLock } from '@/design/overlay'
import { useSiteStore } from '@/store/useSiteStore'
import { story } from '@/content/story'
import { t } from '@/i18n/copy'
import { dirSign, locale } from '@/i18n/locale'
import { asset } from '@/lib/asset'
import { clamp } from '@/lib/clamp'
import { cn } from '@/lib/cn'
import { exposeQA } from '@/lib/qa'
import { Scrubber } from './Scrubber'
import { Ambient, Caption, EndCard, TitleCard } from './parts'
import { clearStart, clock, loadTimeline, nearestFilmScene, sceneIndexAt, type Timeline } from './timeline'
import './film.css'

/** The title card leaves at this point of the cover opening, in time for the first dissolve. */
const TITLE_UNTIL = 1.15
/** With reduced motion the film waits, paused, on this frame of the cover. */
const POSTER_AT = 1
const HIDE_AFTER = 2800
const CC_KEY = 'st:film-captions'

const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.hasAttribute('data-reduce-motion')
const readCaptions = () => {
  try {
    return localStorage.getItem(CC_KEY) !== '0'
  } catch {
    return true
  }
}

/* ── QA hooks: always present, they read whatever player is open ────────────── */
const live: { video: HTMLVideoElement | null; tl: Timeline | null; ui: boolean; captions: boolean; ended: boolean; seek: (time: number) => void } = { video: null, tl: null, ui: false, captions: true, ended: false, seek: () => {} }
const liveDuration = () => (live.video && Number.isFinite(live.video.duration) ? live.video.duration : (live.tl?.duration ?? 0))
exposeQA({
  film: {
    open: () => !!live.video,
    time: () => live.video?.currentTime ?? 0,
    duration: liveDuration,
    playing: () => !!live.video && !live.video.paused && !live.video.ended && live.video.readyState > 2,
    seek: (time: number) => live.seek(time),
    /** 0-based index into story.scenes of the scene on screen (the first scene during the cover opening). */
    scene: () => (live.tl && live.video ? live.tl.scenes[Math.max(0, sceneIndexAt(live.tl, live.video.currentTime))].scene : -1),
    scenes: () => live.tl?.scenes ?? [],
    muted: () => live.video?.muted ?? false,
    captions: () => live.captions,
    controls: () => live.ui,
    ended: () => live.ended,
  },
})

export function Player() {
  const stage = useRef<HTMLDivElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const chips = useRef<HTMLDivElement>(null)
  const hideTimer = useRef(0)
  const busy = useRef(false) // pointer resting on the controls, or scrubbing
  const pointer = useRef('mouse')
  const pendingSeek = useRef<number | null>(null)
  const lastWake = useRef(0)
  const titleFirst = useRef(!prefersReduced() && useSiteStore.getState().startScene === 0)

  const startScene = useSiteStore((s) => s.startScene)

  const [tl, setTl] = useState<Timeline | null>(null)
  const [ready, setReady] = useState(false)
  const [settled, setSettled] = useState(false) // the first attempt to start has finished, one way or the other
  const [playing, setPlaying] = useState(false)
  const [waiting, setWaiting] = useState(false)
  const [ended, setEnded] = useState(false)
  const [failed, setFailed] = useState(false)
  const [muted, setMuted] = useState(false)
  const [needUnmute, setNeedUnmute] = useState(false)
  const [captions, setCaptions] = useState(readCaptions)
  // Opening on the title sequence: the controls stay away until the title has left, then show themselves once.
  const [ui, setUi] = useState(() => prefersReduced() || useSiteStore.getState().startScene > 0)
  const [closing, setClosing] = useState(false)
  const [sec, setSec] = useState(0)
  const [idx, setIdx] = useState(-1)
  const [intro, setIntro] = useState(() => useSiteStore.getState().startScene === 0)
  const [outro, setOutro] = useState(false)
  const [bezel, setBezel] = useState<{ id: number; play: boolean } | null>(null)
  const [portrait, setPortrait] = useState(() => window.matchMedia('(orientation: portrait)').matches)

  const duration = tl?.duration ?? (video.current && Number.isFinite(video.current.duration) ? video.current.duration : 0)

  /* ── controls come and go ─────────────────────────────────────────────────── */
  const wake = useCallback(() => {
    setUi(true)
    window.clearTimeout(hideTimer.current)
    hideTimer.current = window.setTimeout(function rest() {
      const v = video.current
      if (!v || v.paused || v.ended || prefersReduced()) return
      if (busy.current || stage.current?.querySelector('.film-ui :focus-visible')) hideTimer.current = window.setTimeout(rest, HIDE_AFTER)
      else setUi(false)
    }, HIDE_AFTER)
  }, [])

  /* ── transport ────────────────────────────────────────────────────────────── */
  const sync = useCallback(() => {
    const v = video.current
    if (!v) return
    const time = v.currentTime
    setSec(Math.floor(time))
    setIntro(time < TITLE_UNTIL)
    const line = live.tl
    if (!line) return
    const i = sceneIndexAt(line, time)
    setIdx(i === 0 && time < line.opening - 0.05 ? -1 : i) // the first caption waits for the title to leave
    setOutro(time > line.duration - line.fadeOut + 0.4)
    if (titleFirst.current && time >= line.opening) {
      titleFirst.current = false
      if (!v.paused) wake()
    }
  }, [wake])

  const seek = useCallback(
    (time: number) => {
      const v = video.current
      if (!v) return
      const max = (Number.isFinite(v.duration) ? v.duration : (live.tl?.duration ?? 0)) - 0.05
      const to = clamp(time, 0, Math.max(0, max))
      const finished = v.ended
      if (v.seeking) pendingSeek.current = to
      else v.currentTime = to
      setEnded(false)
      if (finished) v.play().catch(() => {}) // scrubbing back from the end card picks the film up again
    },
    [],
  )
  const play = useCallback(() => {
    const v = video.current
    if (!v) return
    if (v.ended) v.currentTime = 0
    v.play().catch(() => {})
  }, [])
  const togglePlay = useCallback(
    (flash = false) => {
      const v = video.current
      if (!v) return
      const willPlay = v.paused || v.ended
      if (willPlay) play()
      else v.pause()
      if (flash && !prefersReduced()) setBezel((b) => ({ id: (b?.id ?? 0) + 1, play: willPlay }))
      wake()
    },
    [play, wake],
  )
  const toggleMute = useCallback(() => {
    const v = video.current
    if (!v) return
    v.muted = !v.muted
    if (!v.muted) setNeedUnmute(false)
  }, [])
  const toggleCaptions = useCallback(() => {
    setCaptions((on) => {
      try {
        localStorage.setItem(CC_KEY, on ? '0' : '1')
      } catch {
        /* private mode */
      }
      return !on
    })
  }, [])
  const seekScene = useCallback(
    (k: number) => {
      if (!live.tl) return
      seek(clearStart(live.tl, k))
      play()
      wake()
    },
    [seek, play, wake],
  )
  const close = useCallback(() => {
    video.current?.pause()
    setClosing(true)
    window.setTimeout(() => useSiteStore.getState().closeOverlay(), prefersReduced() ? 0 : 200)
  }, [])
  useOverlayLock(true, close)

  /* ── start: load the timings, go to the asked scene, play with sound if allowed ── */
  useEffect(() => {
    const v = video.current!
    let alive = true
    live.video = v
    live.seek = seek
    const metadata = new Promise<void>((resolve) => {
      if (v.readyState >= 1) return resolve()
      v.addEventListener('loadedmetadata', () => resolve(), { once: true })
      v.addEventListener('error', () => resolve(), { once: true })
    })
    void Promise.all([loadTimeline(), metadata]).then(async ([line]) => {
      if (!alive) return
      live.tl = line
      setTl(line)
      const from = useSiteStore.getState().startScene
      const still = prefersReduced()
      const at = line && from > 0 ? clearStart(line, nearestFilmScene(line, from)) : still ? POSTER_AT : 0
      if (at > 0) v.currentTime = at
      sync()
      if (still) return setSettled(true) // rest state: paused on the cover, a play button in the middle
      v.muted = false
      try {
        await v.play()
      } catch (e) {
        if (!alive) return
        if ((e as DOMException)?.name === 'NotAllowedError') {
          // Sound needs a tap here: start silently and say so.
          v.muted = true
          setNeedUnmute(true)
          await v.play().catch(() => {})
        }
      }
      if (alive) setSettled(true)
    })
    return () => {
      alive = false
      v.pause()
      window.clearTimeout(hideTimer.current)
      live.video = null
      live.seek = () => {}
    }
  }, [seek, sync])

  // Opened again at another scene while already open (a "watch this scene" button under the overlay's owner).
  const firstScene = useRef(startScene)
  useEffect(() => {
    if (startScene === firstScene.current || !live.tl) return
    firstScene.current = startScene
    seekScene(nearestFilmScene(live.tl, startScene))
  }, [startScene, seekScene])

  useEffect(() => {
    live.ui = ui
    live.captions = captions
    live.ended = ended
  }, [ui, captions, ended])

  useEffect(() => {
    if (playing) {
      if (!(titleFirst.current && (video.current?.currentTime ?? 0) < TITLE_UNTIL)) wake()
    } else if (settled) {
      window.clearTimeout(hideTimer.current)
      setUi(true)
    }
  }, [playing, settled, wake])

  // Focus: into the dialog on open, kept inside while open, back where it was on close.
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null
    stage.current?.focus({ preventScroll: true })
    return () => before?.focus?.({ preventScroll: true })
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(orientation: portrait)')
    const on = () => setPortrait(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  /* ── keys: Space/K play, ←/→ five seconds (by reading direction), M sound, C captions ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return
      const onControl = !!(e.target as HTMLElement | null)?.closest?.('button, [role="slider"]')
      const v = video.current
      if (!v) return
      switch (e.code) {
        case 'Space':
          if (onControl) return
          e.preventDefault()
          togglePlay(true)
          return
        case 'KeyK':
          togglePlay(true)
          return
        case 'ArrowRight':
        case 'ArrowLeft':
          e.preventDefault()
          seek(v.currentTime + (e.code === 'ArrowRight' ? 5 : -5) * dirSign)
          break
        case 'KeyM':
          toggleMute()
          break
        case 'KeyC':
          toggleCaptions()
          break
        case 'Home':
          seek(0)
          break
        default:
          return
      }
      wake()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [seek, togglePlay, toggleMute, toggleCaptions, wake])

  const trapTab = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab' || !stage.current) return
    wake()
    const items = [...stage.current.querySelectorAll<HTMLElement>('button:not([disabled]), [tabindex="0"]')].filter((el) => el.offsetParent !== null)
    if (!items.length) return e.preventDefault()
    const first = items[0]
    const last = items[items.length - 1]
    const at = document.activeElement
    if (e.shiftKey && (at === first || at === stage.current)) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && at === last) {
      e.preventDefault()
      first.focus()
    }
  }

  // The chip of the scene on screen stays in view (the row scrolls on phones).
  useEffect(() => {
    const row = chips.current
    const chip = row?.children[idx] as HTMLElement | undefined
    if (!row || !chip) return
    const r = row.getBoundingClientRect()
    const c = chip.getBoundingClientRect()
    if (c.left >= r.left + 8 && c.right <= r.right - 8) return
    row.scrollBy({ left: c.left + c.width / 2 - (r.left + r.width / 2), behavior: prefersReduced() ? 'auto' : 'smooth' })
  }, [idx, portrait, ui])

  /* ── pointer: a mouse click plays/pauses, a tap brings the controls (or sends them away) ── */
  const onStageClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button, [role="slider"], .film-dock, .film-top')) return
    if (needUnmute) {
      toggleMute()
      return wake()
    }
    if (pointer.current === 'mouse') {
      if ((e.target as HTMLElement).closest('.film-frame') && !ended && !failed) togglePlay(true)
      else wake()
    } else if (ui && playing) {
      window.clearTimeout(hideTimer.current)
      setUi(false)
    } else wake()
  }
  const onStageMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return
    const now = performance.now()
    if (ui && now - lastWake.current < 400) return
    lastWake.current = now
    wake()
  }
  const rest = (on: boolean) => (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse') busy.current = on
  }

  const onPlayerClick = () => togglePlay(false)
  const read = () => useSiteStore.getState().openBook(0)
  const replay = () => {
    seek(0)
    play()
  }

  const over = ended || failed
  const titleOn = intro && !over
  const film = tl?.scenes ?? []
  const cue = captions && !over && !outro && idx >= 0 && film[idx] ? story.scenes[film[idx].scene].cue[locale] : null
  const note = t.book.draft || story.title[locale] // English: say the captions are a draft translation
  const showBigPlay = settled && !playing && !over && !waiting
  const showSpinner = !over && (waiting || (!ready && !settled))

  const top = (
    <div className="film-top film-ui film-ui--drop" onPointerEnter={rest(true)} onPointerLeave={rest(false)}>
      <div className="film-top__label">
        <Eyebrow>{t.film.title}</Eyebrow>
        <span className={cn('film-top__name', titleOn && note === story.title[locale] && 'is-off')}>{note}</span>
      </div>
      <button type="button" className="film-btn glass" aria-label={t.film.close} title={t.film.close} onClick={close} data-film-close>
        <X size={20} aria-hidden />
      </button>
    </div>
  )

  const dock = (
    <div className="film-dock film-ui film-ui--rise" onPointerEnter={rest(true)} onPointerLeave={rest(false)}>
      {film.length > 0 && (
        <div ref={chips} className="film-chips" role="group" aria-label={t.film.chapters}>
          {film.map((s, k) => (
            <button key={s.scene} type="button" className="film-chip glass" aria-current={k === Math.max(0, idx) && !over ? 'true' : undefined} onClick={() => seekScene(k)} data-film-chip={s.scene}>
              <img src={asset(story.scenes[s.scene].thumb)} alt="" loading="lazy" decoding="async" />
              {story.scenes[s.scene].title[locale]}
            </button>
          ))}
        </div>
      )}
      <div className="film-bar glass">
        <button type="button" className="film-btn film-btn--main" aria-label={playing ? t.film.pause : t.film.play} title={playing ? t.film.pause : t.film.play} onClick={onPlayerClick} data-film-play>
          {playing ? <Pause size={20} fill="currentColor" strokeWidth={0} aria-hidden /> : <Play size={20} fill="currentColor" strokeWidth={0} className="translate-x-[1.5px]" aria-hidden />}
        </button>
        <span className="film-time" data-film-time>
          <span dir="ltr">{clock(sec)}</span>
          <span className="of">/</span>
          <span className="of" dir="ltr">
            {clock(duration)}
          </span>
        </span>
        <Scrubber video={video} tl={tl} duration={duration} onSeek={seek} onScrub={(on) => ((busy.current = on), wake())} />
        <button type="button" className="film-btn" aria-label={t.film.captions} title={t.film.captions} aria-pressed={captions} onClick={toggleCaptions} data-film-cc>
          {captions ? <Captions size={21} aria-hidden /> : <CaptionsOff size={21} aria-hidden />}
        </button>
        <button type="button" className="film-btn" aria-label={muted ? t.film.unmute : t.film.mute} title={muted ? t.film.unmute : t.film.mute} onClick={toggleMute} data-film-mute>
          {muted ? <VolumeX size={21} aria-hidden /> : <Volume2 size={21} aria-hidden />}
        </button>
      </div>
    </div>
  )

  const words = (
    <>
      {!over && <TitleCard off={!titleOn} />}
      <Caption text={cue} />
      {over && <EndCard onRead={read} onReplay={replay} canReplay={!failed} />}
    </>
  )

  return (
    <div
      ref={stage}
      className={cn('film-stage overlay-in', ui && 'has-ui', closing && 'is-closing', !ui && playing && 'is-idle')}
      role="dialog"
      aria-modal="true"
      aria-label={`${t.film.title} · ${story.title[locale]}`}
      tabIndex={-1}
      data-film={over ? 'ended' : playing ? 'playing' : 'paused'}
      data-film-ui={ui ? 'on' : 'off'}
      onPointerDownCapture={(e) => (pointer.current = e.pointerType)}
      onPointerMove={onStageMove}
      onClick={onStageClick}
      onKeyDown={trapTab}
      onFocus={(e) => (e.target as HTMLElement).matches?.(':focus-visible') && e.target !== stage.current && wake()}
    >
      {portrait && top}
      <div className="film-frame">
        <Ambient src={asset(over ? story.scenes[story.scenes.length - 1].thumb : idx >= 0 && film[idx] ? story.scenes[film[idx].scene].thumb : story.coverThumb)} />
        <div className="film-screen">
          <video
            ref={video}
            className={cn('film-video', ready && 'is-ready')}
            src={asset('film/watch.mp4')}
            preload="auto"
            playsInline
            aria-label={`${t.film.title} · ${story.title[locale]}`}
            onLoadedData={() => setReady(true)}
            onPlay={() => (setPlaying(true), setEnded(false))}
            onPlaying={() => (setPlaying(true), setWaiting(false))}
            onPause={() => setPlaying(false)}
            onWaiting={() => setWaiting(true)}
            onCanPlay={() => setWaiting(false)}
            onEnded={() => (setEnded(true), setPlaying(false), sync())}
            onError={() => (setFailed(true), setSettled(true))}
            onTimeUpdate={sync}
            onSeeking={sync}
            onSeeked={() => {
              const v = video.current
              if (v && pendingSeek.current !== null) {
                const to = pendingSeek.current
                pendingSeek.current = null
                if (Math.abs(to - v.currentTime) > 0.04) v.currentTime = to
              }
              sync()
            }}
            onVolumeChange={() => setMuted(!!video.current?.muted)}
          />
          {over && (
            <div className="film-end__back grain" aria-hidden>
              <img src={asset(story.scenes[story.scenes.length - 1].thumb)} alt="" decoding="async" />
            </div>
          )}
          {!portrait && <div className={cn('film-shade film-shade--title', titleOn && 'is-on')} />}
          {!portrait && <div className={cn('film-shade film-shade--top', ui && !over && 'is-on')} />}
          {!portrait && <div className={cn('film-shade film-shade--bottom', !over && (ui ? 'is-on' : cue && 'is-on is-soft'))} />}
        </div>
        {!portrait && words}
        <div className="film-center">
          {showSpinner ? (
            <span className="film-spinner" role="status" aria-label={t.film.title} />
          ) : showBigPlay ? (
            <button type="button" className="film-bigplay glass" aria-label={t.film.play} onClick={onPlayerClick} data-film-bigplay>
              <Play size={34} fill="currentColor" strokeWidth={0} className="translate-x-[2px]" aria-hidden />
            </button>
          ) : (
            bezel && (
              <span key={bezel.id} className="film-bezel glass" aria-hidden>
                {bezel.play ? <Play size={30} fill="currentColor" strokeWidth={0} className="translate-x-[2px]" /> : <Pause size={30} fill="currentColor" strokeWidth={0} />}
              </span>
            )
          )}
        </div>
        {needUnmute && muted && !over && (
          <Pill variant="solid" size="md" className="film-unmute" onClick={toggleMute} data-film-unmute>
            <VolumeX size={18} aria-hidden />
            {t.film.unmute}
          </Pill>
        )}
        {!portrait && top}
        {!portrait && dock}
      </div>
      {portrait && <div className="film-words">{words}</div>}
      {portrait && dock}
    </div>
  )
}
