import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import type { AgeGroup, StoryContent } from '@/data/types'
import { isRtl } from '@/i18n/config'
import { fmt } from '@/i18n/format'
import { num } from '@/i18n/helpers'
import { useLang } from '@/i18n/use-dict'
import { CurlEngine } from '@/reader/curl/engine'
import { stageFor, type Stage } from '@/reader/layout'
import { IDLE, listenStep, type ListenEvent, type ListenState } from '@/reader/listen'
import { layoutZone, scriptOf, TEXT_SCALES } from '@/reader/zone'
import { IconArrow, IconAutoFlip, IconClose, IconPause, IconPlay, IconTextLarger, IconTextSmaller } from '@/features/family/icons'
import { usePrefs, useReducedMotion } from '@/features/family/prefs'
import { measureAt, paintPage, PAPER_RGB, type PaintSpec } from './paint'
import { PageView, type PageModel } from './PageView'
import { useVoice } from './useVoice'
import './reader.css'

/**
 * The book reader (owner's requests F1 to F2 and G1 to G3).
 *
 * Two ways to show the same book, with the same features:
 *   curl  the carried-over page-curl engine (src/reader/curl) on a WebGL canvas. At rest the pages are real DOM
 *         (selectable text) laid exactly over the painted pages; while a leaf moves, the canvas shows the turn.
 *   flat  no WebGL, or reduced motion: the DOM pages only; a turn swaps the page (a short fade, none when motion is
 *         reduced). Listening, auto-flip, text size and progress work the same.
 * The engine gets a canvas of its own on every mount: destroy() ends its WebGL context for good (docs/HANDOFF.md).
 *
 * Listening follows src/reader/listen.ts: Play reads the open page(s); auto-flip (a separate switch, on by default,
 * remembered per account) turns the page when its recording ends; any turn by hand pauses the voice.
 */
type Props = {
  content: StoryContent
  group: AgeGroup
  /** Story page to open at (1-based); 0 opens the title page. */
  startPage: number
  /** Start listening at once (the person chose Listen). */
  listen: boolean
  closeTo: string
  /** Called with the story page number shown (the end page reports the last page). */
  onPage: (pageNo: number) => void
  /** Optional: the moment access ends (server clock), to close the book calmly after the current page. */
  accessEndsAt: number | null
  endActions: ReactNode
  accessEnded: ReactNode
}

type BookPage = { kind: 'title' } | { kind: 'story'; i: number } | { kind: 'end' } | { kind: 'blank' }

export function Reader({ content, group, startPage, listen, closeTo, onPage, accessEndsAt, endActions, accessEnded }: Props) {
  const { dict } = useLang()
  const t = dict.stories.reader
  const lang = content.lang
  const rtl = isRtl(lang)
  const [prefs, setPrefs] = usePrefs()
  const reduced = useReducedMotion()
  const stageRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  const [mode, setMode] = useState<'curl' | 'flat' | null>(null)
  const engine = useRef<CurlEngine | null>(null)
  const [turning, setTurning] = useState(false)
  const [notice, setNotice] = useState<'blocked' | 'audio' | null>(null)
  const [ended, setEnded] = useState(false)
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())

  // ---- the book: a title page, the story pages, an end page (and a blank to finish a spread) -----------------
  const stage: Stage | null = useMemo(() => (size ? stageFor(size.w, size.h) : null), [size])
  const spread = !!stage?.spread
  const pages: BookPage[] = useMemo(() => {
    const p: BookPage[] = [{ kind: 'title' }, ...content.pages.map((_, i) => ({ kind: 'story' as const, i })), { kind: 'end' }]
    if (spread && p.length % 2) p.push({ kind: 'blank' })
    return p
  }, [content.pages, spread])
  const positions = spread ? Math.ceil(pages.length / 2) : pages.length
  const pagesAt = useCallback((pos: number) => (spread ? [pos * 2, pos * 2 + 1].filter((i) => i < pages.length) : [pos]), [spread, pages.length])
  const positionOfPage = useCallback((bookIndex: number) => (spread ? Math.floor(bookIndex / 2) : bookIndex), [spread])
  const [pos, setPos] = useState(0)
  const posRef = useRef(0)
  posRef.current = pos

  const layouts = useMemo(() => {
    if (!stage) return []
    return content.pages.map((p) =>
      layoutZone({ pageW: stage.pageW, pageH: stage.pageH, zone: p.zone, rtl, group, scale: prefs.textScale, script: scriptOf(lang), text: p.display, measure: measureAt }),
    )
  }, [stage, content.pages, rtl, group, prefs.textScale, lang])

  const credit = content.credit === 'author' ? dict.stories.doors.authorCredit : dict.stories.doors.storyCredit
  const models: PageModel[] = useMemo(() => pages.map((p): PageModel => {
    if (p.kind === 'story') {
      const sp = content.pages[p.i]!
      return { kind: 'story', pageNo: sp.pageNo, text: sp.display, picture: sp.pictureUrl, layout: layouts[p.i]! }
    }
    if (p.kind === 'title') return { kind: 'title', title: content.title, credit, picture: content.pages[0]?.pictureUrl ?? null }
    return p
  }), [pages, content, layouts, credit])

  // ---- pictures: decoded once, for the painted pages --------------------------------------------------------
  const images = useRef(new Map<string, HTMLImageElement>())
  const imageFor = useCallback((url: string | null) => {
    if (!url) return null
    let img = images.current.get(url)
    if (!img) {
      img = new Image()
      img.decoding = 'async'
      img.onload = () => engine.current?.invalidate()
      img.onerror = () => setFailedImages((s) => new Set(s).add(url))
      img.src = url
      images.current.set(url, img)
    }
    return img
  }, [])
  useEffect(() => {
    for (const p of content.pages) imageFor(p.pictureUrl)
  }, [content.pages, imageFor])

  const specFor = useCallback((i: number): PaintSpec => {
    const m = models[i]
    if (!m || m.kind === 'blank') return { kind: 'blank' }
    if (m.kind === 'end') return { kind: 'end', text: t.theEnd, rtl }
    if (m.kind === 'title') return { kind: 'title', img: imageFor(m.picture), title: m.title, credit: m.credit, rtl }
    return { kind: 'story', img: imageFor(m.picture), layout: m.layout, rtl }
  }, [models, imageFor, rtl, t.theEnd])
  const specRef = useRef(specFor)
  specRef.current = specFor

  // ---- size of the stage ------------------------------------------------------------------------------------
  useLayoutEffect(() => {
    const el = stageRef.current
    if (!el) return
    const measure = () => {
      const r = el.getBoundingClientRect()
      setSize({ w: Math.max(1, Math.round(r.width)), h: Math.max(1, Math.round(r.height)) })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // ---- listening --------------------------------------------------------------------------------------------
  const ls = useRef<ListenState>(IDLE)
  const [playing, setPlaying] = useState(false)
  const autoTurn = useRef(false)
  const readable = useCallback((p: number) => pagesAt(p).filter((i) => pages[i]?.kind === 'story'), [pagesAt, pages])
  const prefsRef = useRef(prefs)
  prefsRef.current = prefs

  const voice = useVoice({
    onEnded: (page) => dispatch({ type: 'ended', page, lastPosition: posRef.current >= positions - 1 }),
    onError: () => dispatch({ type: 'error' }),
    onBlocked: () => {
      ls.current = IDLE
      setPlaying(false)
      setNotice('blocked')
    },
  })

  const dispatch = (e: ListenEvent) => {
    const out = listenStep(ls.current, e, prefsRef.current.autoFlip)
    ls.current = out.state
    setPlaying(out.state.playing)
    for (const fx of out.effects) {
      if (fx.type === 'start') {
        const bp = pages[fx.page]
        if (bp?.kind !== 'story') continue
        const sp = content.pages[bp.i]!
        setNotice(null)
        voice.start(fx.page, sp.readAlong, sp.speech || sp.display, lang)
      } else if (fx.type === 'stop') voice.stop()
      else if (fx.type === 'turn') turn(1, true)
      else if (fx.type === 'failed') setNotice('audio')
    }
  }
  const dispatchRef = useRef(dispatch)
  dispatchRef.current = dispatch

  const play = () => {
    if (playing) return dispatch({ type: 'pause' })
    const here = readable(posRef.current)
    if (here.length) return dispatch({ type: 'play', pages: here })
    if (posRef.current === 0) {
      // On the title page: turn to the first page, then read (the machine's "landed" starts the voice).
      ls.current = { playing: true, current: null, queue: [], turning: true }
      setPlaying(true)
      turn(1, true)
    }
  }

  // ---- turning ----------------------------------------------------------------------------------------------
  const landed = (p: number) => {
    setPos(p)
    if (autoTurn.current) {
      autoTurn.current = false
      dispatchRef.current({ type: 'landed', pages: readable(p) })
    }
  }
  const landedRef = useRef(landed)
  landedRef.current = landed

  const flatTimer = useRef(0)
  function turn(dir: 1 | -1, auto = false) {
    if (ended) return
    const target = posRef.current + dir
    if (target < 0 || target >= positions) return
    if (!auto && (ls.current.playing || ls.current.turning)) dispatchRef.current({ type: 'manualTurn' })
    autoTurn.current = auto
    const e = engine.current
    if (mode === 'curl' && e) {
      if (!e.turn(dir)) autoTurn.current = false
      return
    }
    clearTimeout(flatTimer.current)
    setPos(target)
    posRef.current = target
    flatTimer.current = window.setTimeout(() => landedRef.current(target), reduced ? 0 : 220)
  }
  const turnRef = useRef(turn)
  turnRef.current = turn

  // ---- the curl engine (a fresh canvas for every mount) -----------------------------------------------------
  const startPos = useMemo(() => positionOfPage(Math.min(Math.max(0, startPage), content.pages.length)), [positionOfPage, startPage, content.pages.length])
  useEffect(() => {
    if (!stage) return
    if (reduced || new URLSearchParams(location.search).get('book') === 'flat') {
      setMode('flat')
      return
    }
    const host = stageRef.current!
    const canvas = document.createElement('canvas')
    canvas.className = 'absolute inset-0 touch-none'
    canvas.setAttribute('aria-hidden', 'true')
    host.prepend(canvas)
    let e: CurlEngine
    try {
      e = new CurlEngine(canvas, {
        onLift: () => {
          setTurning(true)
          if (!autoTurn.current && (ls.current.playing || ls.current.turning)) dispatchRef.current({ type: 'manualTurn' })
        },
        onChange: (p) => {
          posRef.current = p
        },
        onRest: (p) => {
          setTurning(false)
          landedRef.current(p)
        },
      })
    } catch {
      canvas.remove()
      setMode('flat')
      return
    }
    e.setPaper(PAPER_RGB)
    engine.current = e
    setMode('curl')
    ;(window as unknown as { __reader?: unknown }).__reader = e
    return () => {
      e.destroy()
      canvas.remove()
      engine.current = null
    }
  }, [!!stage, reduced]) // eslint-disable-line react-hooks/exhaustive-deps

  // Layout and book for the engine whenever the stage, the pages or the text change.
  const opened = useRef(false)
  useEffect(() => {
    const e = engine.current
    if (!stage || !size) return
    const first = !opened.current
    const at = first ? startPos : positionOfPage(pagesAt(posRef.current)[0] ?? 0)
    if (e && mode === 'curl') {
      const scale = Math.min(2, window.devicePixelRatio || 1)
      const spineX = stage.spread || rtl ? stage.left + stage.pageW : stage.left
      const canvas = stageRef.current!.querySelector('canvas')!
      canvas.style.width = `${size.w}px`
      canvas.style.height = `${size.h}px`
      e.setLayout({ width: size.w, height: size.h, scale, spread: stage.spread, rtl, pageW: stage.pageW, pageH: stage.pageH, spineX, top: stage.top })
      const px = e.pagePixels()
      e.setBook({ count: pages.length, paint: (i) => paintPage(specRef.current(i), px.w, px.h, scale) }, at)
    }
    if (mode) {
      opened.current = true
      setPos(at)
      posRef.current = at
    }
  }, [stage, size, mode, pages.length, rtl]) // eslint-disable-line react-hooks/exhaustive-deps
  // Text size or language changed: repaint, same position.
  useEffect(() => engine.current?.invalidate(), [layouts])

  // Pointer on the curl canvas: drag a corner, or tap a side to turn.
  useEffect(() => {
    const host = stageRef.current
    const e = engine.current
    if (!host || mode !== 'curl' || !e) return
    let frame = { x: 0, y: 0 }
    const down = (ev: PointerEvent) => {
      if ((ev.target as HTMLElement).closest('[data-testid="page-text"],button,a')) return
      const r = host.getBoundingClientRect()
      frame = { x: r.left, y: r.top }
      host.setPointerCapture?.(ev.pointerId)
      e.press(ev.clientX - frame.x, ev.clientY - frame.y, ev.timeStamp)
    }
    const move = (ev: PointerEvent) => void e.move(ev.clientX - frame.x, ev.clientY - frame.y, ev.timeStamp)
    const up = (ev: PointerEvent) => {
      const how = e.release(ev.timeStamp)
      if (how !== 'tap') return
      const x = ev.clientX - frame.x
      const forwardSide = rtl ? x < host.clientWidth / 2 : x > host.clientWidth / 2
      turnRef.current(forwardSide ? 1 : -1)
    }
    const cancel = () => e.cancel()
    host.addEventListener('pointerdown', down)
    host.addEventListener('pointermove', move)
    host.addEventListener('pointerup', up)
    host.addEventListener('pointercancel', cancel)
    return () => {
      host.removeEventListener('pointerdown', down)
      host.removeEventListener('pointermove', move)
      host.removeEventListener('pointerup', up)
      host.removeEventListener('pointercancel', cancel)
    }
  }, [mode, rtl])

  // Flat book: a swipe turns the page.
  useEffect(() => {
    const host = stageRef.current
    if (!host || mode !== 'flat') return
    let start: { x: number; y: number } | null = null
    const down = (ev: PointerEvent) => void (start = (ev.target as HTMLElement).closest('[data-testid="page-text"],button,a') ? null : { x: ev.clientX, y: ev.clientY })
    const up = (ev: PointerEvent) => {
      if (!start) return
      const dx = ev.clientX - start.x
      const dy = ev.clientY - start.y
      start = null
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return
      const forward = rtl ? dx > 0 : dx < 0
      turnRef.current(forward ? 1 : -1)
    }
    host.addEventListener('pointerdown', down)
    host.addEventListener('pointerup', up)
    return () => {
      host.removeEventListener('pointerdown', down)
      host.removeEventListener('pointerup', up)
    }
  }, [mode, rtl])

  // Keys: arrows follow the reading direction; Escape is left to the browser (a child should not close by accident).
  useEffect(() => {
    const key = (ev: KeyboardEvent) => {
      if (ev.target instanceof HTMLElement && ev.target.closest('input,textarea,select')) return
      const fwd = rtl ? 'ArrowLeft' : 'ArrowRight'
      const back = rtl ? 'ArrowRight' : 'ArrowLeft'
      if (ev.key === fwd) turnRef.current(1)
      else if (ev.key === back) turnRef.current(-1)
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [rtl])

  // ---- progress and the end of access -------------------------------------------------------------------------
  const shown = pagesAt(pos)
  const firstStory = shown.map((i) => pages[i]).find((p) => p?.kind === 'story') as { kind: 'story'; i: number } | undefined
  const atEnd = shown.some((i) => pages[i]?.kind === 'end')
  const pageNo = firstStory ? content.pages[firstStory.i]!.pageNo : atEnd ? content.pages.length : null
  useEffect(() => {
    if (!mode || turning || pageNo === null) return
    const id = window.setTimeout(() => onPage(pageNo), 500)
    return () => clearTimeout(id)
  }, [pageNo, mode, turning]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!accessEndsAt || turning) return
    if (Date.now() >= accessEndsAt) {
      dispatchRef.current({ type: 'pause' })
      setEnded(true)
    }
  }, [pos, turning, accessEndsAt])

  // ---- start listening when asked (the Listen door) ---------------------------------------------------------
  const autoListen = useRef(listen)
  const playRef = useRef(play)
  playRef.current = play
  const autoTimer = useRef(0)
  useEffect(() => {
    if (!autoListen.current || !mode || !opened.current) return
    autoListen.current = false
    // Not cancelled by the re-render that follows opening (only by leaving the reader).
    autoTimer.current = window.setTimeout(() => playRef.current(), 350)
  }, [mode, pos])
  useEffect(() => () => clearTimeout(autoTimer.current), [])

  // ---- layout of the DOM pages over the stage ----------------------------------------------------------------
  const boxes = useMemo(() => {
    if (!stage) return [] as { index: number; left: number; top: number; width: number; height: number }[]
    return shown.map((index, k) => {
      // In a right-to-left spread the first page in reading order is the right-hand one.
      const slot = stage.spread ? (rtl ? 1 - k : k) : 0
      return { index, left: stage.left + slot * stage.pageW, top: stage.top, width: stage.pageW, height: stage.pageH }
    })
  }, [stage, shown.join(','), rtl]) // eslint-disable-line react-hooks/exhaustive-deps

  const indicator = atEnd && !firstStory ? t.theEnd : pageNo ? fmt(t.pageOf, { n: num(pageNo), total: num(content.pages.length) }) : content.title
  const hasAudio = content.pages.some((p) => p.readAlong)
  const recordingIsTest = content.isSample && hasAudio
  const activeFor = (index: number) => (voice.active && voice.active.page === index ? voice.active.word : -1)
  const canBack = pos > 0
  const canForward = pos < positions - 1

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[oklch(0.93_0.005_80)] text-ink" data-testid="reader" data-mode={mode ?? 'loading'} data-position={pos} data-positions={positions}
      data-playing={playing ? 'true' : 'false'} data-autoflip={prefs.autoFlip ? 'on' : 'off'} data-spread={spread ? 'true' : 'false'} data-page-no={pageNo ?? ''}>
      {/* Top bar: close, where we are, text size. */}
      <div className="flex min-h-14 items-center gap-2 px-2 sm:px-4">
        <Link to={closeTo} className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-control px-2 font-medium hover:bg-black/5" data-testid="reader-close">
          <IconClose className="size-6" />
          <span className="max-sm:sr-only">{t.close}</span>
        </Link>
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-sm font-semibold" lang={lang}><bdi>{content.title}</bdi></p>
          <p className="text-sm text-ink-muted tabular-nums" aria-live="polite" data-testid="reader-indicator">{indicator}</p>
        </div>
        <div role="group" aria-label={t.textSize} className="flex items-center gap-1">
          <span className="text-sm text-ink-muted max-lg:sr-only">{t.textSize}</span>
          <button type="button" aria-label={t.smaller} disabled={prefs.textScale <= 0} onClick={() => setPrefs({ textScale: prefs.textScale - 1 })} className="grid size-11 place-items-center rounded-control hover:bg-black/5 disabled:opacity-35" data-testid="text-smaller">
            <IconTextSmaller className="size-6" />
          </button>
          <button type="button" aria-label={t.larger} disabled={prefs.textScale >= TEXT_SCALES.length - 1} onClick={() => setPrefs({ textScale: prefs.textScale + 1 })} className="grid size-11 place-items-center rounded-control hover:bg-black/5 disabled:opacity-35" data-testid="text-larger">
            <IconTextLarger className="size-6" />
          </button>
        </div>
      </div>

      {/* The book. */}
      <div ref={stageRef} className="relative min-h-0 flex-1 touch-pan-y select-none" aria-label={fmt(t.bookLabel, { title: content.title })} role="region">
        {!mode && <p className="absolute inset-0 grid place-items-center text-ink-muted" role="status">{t.loading}</p>}
        <div key={mode === 'flat' ? pos : 'curl'} className={`pointer-events-none absolute inset-0 ${mode === 'flat' && !reduced ? 'reader-fade' : ''}`}>
          {mode && boxes.map((b) => (
            <PageView key={`${b.index}-${spread}`} page={models[b.index]!} box={b} lang={lang} activeWord={activeFor(b.index)} hidden={turning}
              onImageError={(u) => setFailedImages((s) => new Set(s).add(u))}
              end={models[b.index]?.kind === 'end' ? (
                <>
                  <p className="text-3xl font-semibold">{t.theEnd}</p>
                  <div className="flex w-full max-w-xs flex-col gap-3">
                    <button type="button" onClick={() => { dispatchRef.current({ type: 'pause' }); autoTurn.current = false; engine.current ? engine.current.jump(0, !reduced) : setPos(0) }}
                      className="inline-flex min-h-12 items-center justify-center rounded-control border border-ink/60 px-5 font-medium">{t.readAgain}</button>
                    {endActions}
                  </div>
                </>
              ) : undefined} />
          ))}
        </div>
        {failedImages.size > 0 && (
          <div role="alert" className="absolute inset-x-3 top-3 flex items-center justify-between gap-3 rounded-control bg-surface/95 p-3 shadow">
            <span>{t.pageError}</span>
            <button type="button" className="min-h-11 rounded-control border border-ink/50 px-4" onClick={() => {
              for (const u of failedImages) images.current.delete(u)
              setFailedImages(new Set())
              for (const p of content.pages) imageFor(p.pictureUrl)
            }}>{dict.account.errors.retry}</button>
          </div>
        )}
        {ended && <div className="absolute inset-0 z-10 grid place-items-center bg-[oklch(0.93_0.005_80/0.96)] p-6">{accessEnded}</div>}
      </div>

      {/* Bottom bar: back, Listen, auto-flip, forward. Always all visible. */}
      <div className="flex flex-col gap-1 px-2 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4">
        {(notice || voice.mode === 'speech' || voice.mode === 'none' || recordingIsTest) && (
          <p className="text-center text-sm text-ink-muted" aria-live="polite" data-testid="listen-note">
            {notice === 'blocked' ? t.tapToListen : notice === 'audio' ? t.audioError : voice.mode === 'speech' ? t.devVoice : voice.mode === 'none' ? t.noRecordingPage : t.testRecording}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 sm:flex-nowrap">
          <button type="button" onClick={() => turn(-1)} disabled={!canBack} aria-label={t.prevPage} data-testid="page-back"
            className="order-2 grid h-14 flex-1 place-items-center rounded-full bg-surface shadow-sm ring-1 ring-black/10 disabled:opacity-35 sm:order-none sm:w-14 sm:flex-none">
            <IconArrow className="size-7 -scale-x-100 rtl:scale-x-100" />
          </button>
          <div className="order-first flex w-full min-w-0 items-center justify-center gap-2 sm:order-none sm:w-auto sm:flex-1 sm:gap-4">
            <button type="button" onClick={play} disabled={!hasAudio && !import.meta.env.DEV} aria-pressed={playing} data-testid="listen"
              className="inline-flex min-h-14 shrink-0 items-center justify-center gap-2 rounded-full bg-ink px-4 text-lg sm:px-5 font-semibold text-paper shadow-sm disabled:opacity-40">
              {playing ? <IconPause className="size-7" /> : <IconPlay className="size-7" />}
              {playing ? t.pause : t.listen}
            </button>
            <button type="button" role="switch" aria-checked={prefs.autoFlip} onClick={() => setPrefs({ autoFlip: !prefs.autoFlip })} data-testid="autoflip"
              className="inline-flex min-h-14 min-w-0 items-center gap-2 rounded-full bg-surface px-3 text-start shadow-sm ring-1 ring-black/10 max-sm:flex-1">
              <IconAutoFlip className="size-6 shrink-0" />
              <span className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="text-sm font-semibold">{t.autoFlip}</span>
                <span className="text-xs text-ink-muted max-sm:hidden">{t.autoFlipHint}</span>
              </span>
              <span aria-hidden="true" className={`relative h-7 w-12 shrink-0 rounded-full transition-colors motion-reduce:transition-none ${prefs.autoFlip ? 'bg-green-800' : 'bg-ink/25'}`}>
                <span className={`absolute top-0.5 size-6 rounded-full bg-white shadow transition-[inset-inline-start] motion-reduce:transition-none ${prefs.autoFlip ? 'start-[1.375rem]' : 'start-0.5'}`} />
              </span>
              <span className="sr-only">{prefs.autoFlip ? t.on : t.off}</span>
            </button>
          </div>
          <button type="button" onClick={() => turn(1)} disabled={!canForward} aria-label={t.nextPage} data-testid="page-forward"
            className="order-3 grid h-14 flex-1 place-items-center rounded-full bg-surface shadow-sm ring-1 ring-black/10 disabled:opacity-35 sm:order-none sm:w-14 sm:flex-none">
            <IconArrow className="size-7 rtl:-scale-x-100" />
          </button>
        </div>
      </div>
    </div>
  )
}
