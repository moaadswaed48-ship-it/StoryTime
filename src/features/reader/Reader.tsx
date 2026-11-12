import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from 'react'
import { ChevronLeft, ChevronRight, Gamepad2, LockKeyhole, Play, RotateCcw } from 'lucide-react'
import { story, sceneText, SCENES } from '@/content/story'
import { t } from '@/i18n/copy'
import { locale, num, rtl } from '@/i18n/locale'
import { useSiteStore } from '@/store/useSiteStore'
import { useProfileStore } from '@/store/useProfileStore'
import { useOverlayLock } from '@/design/overlay'
import { Pill } from '@/design/ui'
import { setSound, sfx } from '@/audio/synth'
import { asset } from '@/lib/asset'
import { cn } from '@/lib/cn'
import { exposeQA } from '@/lib/qa'
import { FREE_SCENES } from '@/features/book/logic'
import { CurlEngine } from './curl/engine'
import { DEFAULT_SIZE, SIZE_STEPS, buildBook, endPage, geometryFor, lockedFrom, pageOfScene, pagesAt, positionOf, relocate, stageFor, type BookPage } from './layout'
import { PAPER_RGB, frameOf, loadFonts, measurer, paintPage, picture, pictureBox, storyFont, END_TEXT } from './paint'
import { BottomBar, ScenesPanel, SizePanel, TopBar, type Panel } from './Chrome'
import { idleHooks, type ReaderHooks } from './qa'
import { s } from './strings'

const SIZE_KEY = 'st:reader:size'
function savedSize(): number {
  try {
    const raw = localStorage.getItem(SIZE_KEY)
    const v = raw === null ? NaN : Number(raw)
    return Number.isInteger(v) && v >= 0 && v < SIZE_STEPS.length ? v : DEFAULT_SIZE
  } catch {
    return DEFAULT_SIZE
  }
}
const coarse = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
const clampScene = (n: number) => Math.min(SCENES - 1, Math.max(0, Math.round(Number.isFinite(n) ? n : 0)))

interface Clip {
  page: number
  src: string
  poster: string
  style: CSSProperties
}

export function ReaderView({ startScene }: { startScene: number }) {
  const closeOverlay = useSiteStore((st) => st.closeOverlay)
  const openFilm = useSiteStore((st) => st.openFilm)
  const openGame = useSiteStore((st) => st.openGame)
  const loggedIn = useSiteStore((st) => st.loggedIn)
  const setLoggedIn = useSiteStore((st) => st.setLoggedIn)
  const low = useSiteStore((st) => st.tier === 'low')
  const sound = useSiteStore((st) => st.sound)
  const setSoundOn = useSiteStore((st) => st.setSoundOn)
  const classroom = useProfileStore((st) => st.classroom)
  const childName = useProfileStore((st) => st.profile?.name?.trim() ?? '')

  const root = useRef<HTMLDivElement>(null)
  const holder = useRef<HTMLDivElement>(null)
  const probe = useRef<HTMLDivElement>(null)
  const engine = useRef<CurlEngine | null>(null)

  const [view, setView] = useState(() => ({ w: window.innerWidth, h: window.innerHeight, top: 0, bottom: 0 }))
  const [fonts, setFonts] = useState(false)
  const [size, setSizeState] = useState(savedSize)
  const [pos, setPos] = useState(0)
  const [turning, setTurning] = useState(false)
  const [chrome, setChrome] = useState(true)
  const [panel, setPanel] = useState<Panel>(null)
  const [nudge, setNudge] = useState(0)
  const [closing, setClosing] = useState(false)
  const [hinted, setHinted] = useState(false)

  /* ── Where the book sits, how its pages break ─────────────────────────────── */
  const stage = useMemo(() => stageFor(view.w, view.h), [view.w, view.h])
  const geo = useMemo(
    () => geometryFor(stage.pageW, stage.pageH, { size, arabic: rtl, classroom, insetTop: stage.full ? view.top : 0, insetBottom: stage.full ? view.bottom : 0 }),
    [stage, size, classroom, view.top, view.bottom],
  )
  const pages = useMemo<BookPage[] | null>(
    () => (fonts ? buildBook(story.scenes.map((sc) => sceneText(sc, locale)), geo, measurer(storyFont(geo.fontSize)), stage.spread) : null),
    [fonts, geo, stage.spread],
  )
  const locked = useMemo(() => (pages ? lockedFrom(pages, FREE_SCENES, loggedIn) : Infinity), [pages, loggedIn])

  // The canvas covers the book and a little air around it (a lifted corner pokes out); on a phone, the screen.
  const frame = useMemo(() => {
    const bookW = stage.spread ? stage.pageW * 2 : stage.pageW
    const m = stage.full ? 0 : 26
    const x = Math.max(0, stage.left - m)
    const y = Math.max(0, stage.top - m)
    const w = Math.min(view.w, stage.left + bookW + m) - x
    const h = Math.min(view.h, stage.top + stage.pageH + m) - y
    // Sharp enough to read print at arm's length, never more pixels than the device can shade smoothly.
    const budget = (coarse ? 3.9e6 : 6e6) * (low ? 0.55 : 1)
    const scale = Math.min(window.devicePixelRatio || 1, 3, Math.sqrt(budget / (w * h)))
    return { x, y, w, h, scale }
  }, [stage, view.w, view.h, low])
  const spineX = stage.spread || rtl ? stage.left + stage.pageW : stage.left
  /** Left edge (stage px) of the box page `index` lies in. */
  const boxLeft = (index: number) => (!stage.spread ? stage.left : (index % 2 === 0) === !rtl ? stage.left : stage.left + stage.pageW)

  /* ── Latest values for callbacks that outlive a render ────────────────────── */
  const live = useRef({ pages, geo, stage, frame, locked, pos, turning, panel, spineX })
  live.current = { pages, geo, stage, frame, locked, pos, turning, panel, spineX }
  const shown = useRef<BookPage | undefined>(undefined)
  const opened = useRef(false)
  const videos = useRef(new Map<number, HTMLVideoElement>())
  const windows = useRef(new Set<number>())
  const frozen = useRef(new Set<number>())
  const restPos = useRef(0)

  /* ── Screen size, safe areas, fonts ───────────────────────────────────────── */
  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    const read = () => {
      const cs = probe.current ? getComputedStyle(probe.current) : null
      const next = { w: el.clientWidth, h: el.clientHeight, top: cs ? parseFloat(cs.paddingTop) || 0 : 0, bottom: cs ? parseFloat(cs.paddingBottom) || 0 : 0 }
      setView((v) => (v.w === next.w && v.h === next.h && v.top === next.top && v.bottom === next.bottom ? v : next))
    }
    read()
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  useEffect(() => {
    let alive = true
    loadFonts().then(() => alive && setFonts(true))
    // Every painting is fetched while the first pages are read, nearest first.
    picture(story.cover)
    const ids = story.scenes.map((sc, i) => window.setTimeout(() => picture(sc.img), 60 + i * 140))
    return () => {
      alive = false
      ids.forEach((id) => window.clearTimeout(id))
    }
  }, [])

  /* ── The engine ───────────────────────────────────────────────────────────── */
  useEffect(() => {
    const host = holder.current
    if (!host) return
    const canvas = document.createElement('canvas')
    canvas.setAttribute('aria-hidden', 'true')
    host.appendChild(canvas)
    let e: CurlEngine
    try {
      e = new CurlEngine(canvas, {
        onLift: () => {
          // The film stops on the frame it is showing and that frame is printed onto the page, so the paper that lifts is the picture the reader was looking at.
          const { geo: g, frame: f } = live.current
          const px = e.pagePixels()
          for (const [page, v] of videos.current) {
            v.pause()
            if (windows.current.has(page)) {
              const img = frameOf(v, px.w, Math.ceil(g.pictureH * f.scale))
              if (img) {
                e.patch(page, img, 0, 0)
                frozen.current.add(page)
              }
            }
            e.setLive(page, null, true)
          }
          windows.current.clear()
          setTurning(true)
          setChrome(false)
          setPanel(null)
          setHinted(true)
        },
        onChange: (p) => {
          sfx.flip()
          setPos(p)
        },
        onRest: (p) => {
          if (p === restPos.current) {
            // Fell back: the film carries on from the frame it stopped at.
            for (const v of videos.current.values()) v.play().catch(() => undefined)
          } else {
            for (const page of frozen.current) e.invalidate(page)
            frozen.current.clear()
          }
          restPos.current = p
          setTurning(false)
        },
        onBlocked: (dir) => {
          const { pages: pg, locked: lk, stage: sg, pos: at } = live.current
          if (dir > 0 && pg && lk !== Infinity && pagesAt(at, pg.length, sg.spread).some((i) => i >= lk)) setNudge((n) => n + 1)
        },
      })
    } catch {
      // WebGL went away between the check and now: hand the book back so the fallback reader can take it.
      host.removeChild(canvas)
      return
    }
    e.setPaper(PAPER_RGB)
    engine.current = e
    return () => {
      engine.current = null
      e.destroy()
      canvas.remove()
    }
  }, [])

  // Layout and book go to the engine whenever the screen, the type or the lock changes; the reader keeps their place.
  useEffect(() => {
    const e = engine.current
    if (!e || !pages) return
    e.setLayout({ width: frame.w, height: frame.h, scale: frame.scale, spread: stage.spread, rtl, pageW: stage.pageW, pageH: stage.pageH, spineX: spineX - frame.x, top: stage.top - frame.y })
    const px = e.pagePixels()
    let index = opened.current ? relocate(shown.current, pages) : startScene > 0 ? pageOfScene(pages, clampScene(startScene)) : 0
    opened.current = true
    if (index > locked) index = locked
    const position = positionOf(index, stage.spread)
    e.setLimit(locked === Infinity ? Infinity : positionOf(locked, stage.spread))
    windows.current.clear()
    frozen.current.clear()
    e.setBook(
      {
        count: pages.length,
        paint: (i) => paintPage(pages[i], geo, px.w, px.h, { scale: frame.scale, locked: i >= locked, childName, onPicture: () => engine.current?.invalidate(i) }),
      },
      position,
    )
    restPos.current = position
    setPos(position)
    setTurning(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages, geo, stage, frame, locked, childName])

  const visible = useMemo(() => (pages ? pagesAt(pos, pages.length, stage.spread) : []), [pages, pos, stage.spread])
  const first = pages?.[visible[0]]
  // The page the reader's place is counted from: where a scene starts on what is showing, else the page that
  // is continuing. Re-flowing the book (text size, rotation) and re-opening it both come back to this page.
  const anchor = pages ? (visible.map((i) => pages[i]).find((p) => p.kind === 'scene' && p.part === 0) ?? first) : undefined
  useEffect(() => {
    if (anchor) shown.current = anchor
  }, [anchor])

  const gated = visible.some((i) => i >= locked)
  const atEnd = !gated && !!pages && visible.some((i) => pages[i].kind === 'end')
  const phase = !pages ? 'loading' : gated ? 'gate' : atEnd ? 'end' : 'open'
  const scene = anchor?.scene ?? 0
  const scenesShown = pages ? visible.filter((i) => i < locked && pages[i].kind === 'scene').map((i) => pages[i].scene) : []

  /* ── Shared behaviour: progress, reward ───────────────────────────────────── */
  useEffect(() => {
    if (!first || turning) return
    // A finished book starts again from the beginning next time; otherwise the reader comes back to this scene.
    useProfileStore.getState().setScene(story.id, atEnd ? 0 : scene)
  }, [first, scene, atEnd, turning])
  const rewarded = useRef(false)
  useEffect(() => {
    if (!atEnd || turning || rewarded.current) return
    rewarded.current = true
    useProfileStore.getState().mark(story.id, 'read')
    sfx.win()
  }, [atEnd, turning])

  /* ── Actions ──────────────────────────────────────────────────────────────── */
  const goPage = useCallback((index: number, animate = true) => {
    const { pages: pg, locked: lk, stage: sg } = live.current
    const e = engine.current
    if (!pg || !e) return
    const to = Math.min(pg.length - 1, Math.max(0, Math.round(index)))
    if (to > lk) setNudge((n) => n + 1)
    e.jump(positionOf(Math.min(to, lk), sg.spread), animate)
  }, [])
  const goScene = useCallback(
    (n: number) => {
      const pg = live.current.pages
      if (pg) goPage(n >= SCENES ? endPage(pg) : pageOfScene(pg, clampScene(n)))
    },
    [goPage],
  )
  const next = useCallback(() => void engine.current?.turn(1), [])
  const prev = useCallback(() => void engine.current?.turn(-1), [])
  const close = useCallback(() => {
    setClosing(true)
    window.setTimeout(closeOverlay, 180)
  }, [closeOverlay])
  useOverlayLock(true, close)
  const setSize = useCallback((n: number) => {
    const v = Math.min(SIZE_STEPS.length - 1, Math.max(0, Math.round(n)))
    setSizeState(v)
    try {
      localStorage.setItem(SIZE_KEY, String(v))
    } catch {
      /* private mode */
    }
  }, [])
  const toggleSound = () => {
    setSound(!sound)
    setSoundOn(!sound)
  }
  const unlock = () => {
    sfx.pop()
    setLoggedIn(true)
  }

  // The book was asked to open at another scene while it is already open.
  const startSeen = useRef(startScene)
  useEffect(() => {
    if (startSeen.current === startScene) return
    startSeen.current = startScene
    goScene(startScene)
  }, [startScene, goScene])

  /* ── Controls come and go ─────────────────────────────────────────────────── */
  useEffect(() => {
    if (!chrome || panel) return
    // Shown on arrival so a grown-up sees what is there, then out of the way of the reading.
    const id = window.setTimeout(() => setChrome(false), hinted ? 6000 : 3600)
    return () => window.clearTimeout(id)
  }, [chrome, panel, hinted])

  useEffect(() => {
    if (!chrome) setPanel(null)
  }, [chrome])

  /* ── Gestures ─────────────────────────────────────────────────────────────── */
  // A sideways swipe on a trackpad turns one page per stroke.
  const wheel = useRef({ sum: 0, held: false, timer: 0 })
  const onWheel = (ev: ReactWheelEvent<HTMLDivElement>) => {
    if (Math.abs(ev.deltaX) <= Math.abs(ev.deltaY)) return
    const wh = wheel.current
    window.clearTimeout(wh.timer)
    wh.timer = window.setTimeout(() => {
      wh.held = false
      wh.sum = 0
    }, 200)
    if (wh.held) return
    wh.sum += ev.deltaX
    if (Math.abs(wh.sum) < 48) return
    wh.held = true
    if (wh.sum > 0 === !rtl) next()
    else prev()
  }
  const pointer = useRef<number | null>(null)
  const onDown = (ev: ReactPointerEvent<HTMLDivElement>) => {
    if (ev.button || pointer.current !== null) return
    pointer.current = ev.pointerId
    ev.currentTarget.setPointerCapture?.(ev.pointerId)
    engine.current?.press(ev.clientX - frame.x, ev.clientY - frame.y, ev.timeStamp)
  }
  const onMove = (ev: ReactPointerEvent<HTMLDivElement>) => {
    if (ev.pointerId !== pointer.current) return
    engine.current?.move(ev.clientX - frame.x, ev.clientY - frame.y, ev.timeStamp)
  }
  const onUp = (ev: ReactPointerEvent<HTMLDivElement>) => {
    if (ev.pointerId !== pointer.current) return
    pointer.current = null
    if (engine.current?.release(ev.timeStamp) === 'tap') tap(ev.clientX, ev.clientY)
  }
  const onCancel = (ev: ReactPointerEvent<HTMLDivElement>) => {
    if (ev.pointerId !== pointer.current) return
    pointer.current = null
    engine.current?.cancel()
  }
  /** A tap near the page's outer edge turns it; anywhere else shows or hides the controls. */
  const tap = (x: number, y: number) => {
    if (panel) return setPanel(null)
    const w = stage.pageW
    const lx = (x - spineX) * (rtl ? -1 : 1) // distance from the spine towards the page's free edge
    if (y >= stage.top && y <= stage.top + stage.pageH) {
      if (stage.spread) {
        if (lx > w * 0.66) return next()
        if (lx < -w * 0.66) return prev()
      } else {
        if (lx > w * 0.78) return next()
        if (lx < w * 0.22) return prev()
      }
    }
    setChrome((c) => !c)
  }

  /* ── Keys ─────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    const el = root.current
    const before = document.activeElement as HTMLElement | null
    el?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return
      const tgt = e.target as HTMLElement | null
      const onControl = !!tgt?.closest?.('button, a, input, select, textarea')
      if (e.key === 'Tab') {
        setChrome(true)
        const items = Array.from(el?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input') ?? []).filter((n) => n.offsetParent !== null)
        if (!items.length) return
        const i = items.indexOf(document.activeElement as HTMLElement)
        const to = e.shiftKey ? (i <= 0 ? items.length - 1 : i - 1) : i === -1 || i === items.length - 1 ? 0 : i + 1
        items[to].focus()
        e.preventDefault()
        return
      }
      if (tgt instanceof HTMLInputElement) return
      switch (e.key) {
        case 'ArrowRight':
          if (rtl) prev()
          else next()
          break
        case 'ArrowLeft':
          if (rtl) next()
          else prev()
          break
        case 'PageDown':
          next()
          break
        case 'PageUp':
          prev()
          break
        case ' ':
        case 'Spacebar':
          if (onControl) return
          next()
          break
        case 'Home':
          goPage(0)
          break
        case 'End':
          goScene(SCENES)
          break
        default:
          return
      }
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      before?.focus?.({ preventScroll: true })
    }
  }, [next, prev, goPage, goScene])

  /* ── Living pictures: the film of the scene plays under a window in the page ─ */
  const clips = useMemo<Clip[]>(() => {
    if (!pages) return []
    return visible
      .filter((i) => i < locked && pages[i].kind === 'scene' && pages[i].picture && !!story.scenes[pages[i].scene].clip)
      .map((i) => ({
        page: i,
        src: asset(story.scenes[pages[i].scene].clip!),
        poster: asset(story.scenes[pages[i].scene].img),
        style: { left: boxLeft(i), top: stage.top, width: stage.pageW, height: geo.pictureH },
      }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages, visible, locked, stage, geo])
  const onFilmFrame = (page: number, v: HTMLVideoElement) => {
    if (live.current.turning || windows.current.has(page) || v.paused || v.currentTime < 0.04) return
    windows.current.add(page)
    // A page that fell back already carries the film's frame, so its window opens at once; otherwise it fades in.
    engine.current?.setLive(page, pictureBox(live.current.geo), frozen.current.has(page))
  }
  // One ref callback per page, kept between renders (a new function would re-attach the video on every render).
  const binders = useRef(new Map<number, (el: HTMLVideoElement | null) => void>())
  const bindVideo = (page: number) => {
    let fn = binders.current.get(page)
    if (!fn) {
      fn = (el) => {
        if (el) videos.current.set(page, el)
        else videos.current.delete(page)
      }
      binders.current.set(page, fn)
    }
    return fn
  }
  useEffect(() => {
    // The pictures of the pages that have just settled start to move.
    if (live.current.turning) return
    for (const v of videos.current.values()) if (v.paused) v.play().catch(() => undefined)
  }, [clips])

  /* ── Test hooks ───────────────────────────────────────────────────────────── */
  const api = useRef<ReaderHooks>(idleHooks)
  api.current = {
    phase: () => phase,
    page: () => first?.number ?? 0,
    pages: () => pages?.length ?? 0,
    visible: () => visible.map((i) => pages?.[i]?.number ?? 0),
    position: () => engine.current?.position() ?? 0,
    positions: () => engine.current?.positions() ?? 0,
    scene: () => scene,
    spread: () => stage.spread,
    turning: () => !!engine.current?.turning(),
    ready: () => !!pages && !!engine.current?.ready(),
    next,
    prev,
    goScene,
    goPage: (n: number) => goPage(n - 1),
    close,
    hold: (p, grip, rise) => void engine.current?.hold(p, grip, rise),
    slow: (k: number) => engine.current?.setTimeScale(k),
    size: () => size,
    setSize,
    chrome: (on?: boolean) => {
      if (on !== undefined) setChrome(on)
      return on ?? chrome
    },
    stats: (reset?: boolean) => engine.current?.stats(reset) ?? idleHooks.stats(),
    clips: () => clips.map((c) => ({ page: pages?.[c.page]?.number ?? 0, playing: !!videos.current.get(c.page) && !videos.current.get(c.page)!.paused, live: windows.current.has(c.page) })),
    rect: () => ({ x: stage.left, y: stage.top, w: stage.spread ? stage.pageW * 2 : stage.pageW, h: stage.pageH, pageW: stage.pageW, spread: stage.spread, rtl }),
    lines: () => visible.flatMap((i) => pages?.[i]?.lines.map((l) => l.text) ?? []),
  }
  useEffect(() => {
    const hooks = Object.fromEntries(Object.keys(idleHooks).map((k) => [k, (...a: unknown[]) => (api.current[k as keyof ReaderHooks] as (...x: unknown[]) => unknown)(...a)]))
    exposeQA({ reader: hooks })
    return () => exposeQA({ reader: idleHooks })
  }, [])

  /* ── What is on the page for a screen reader ──────────────────────────────── */
  const spoken = useMemo(() => {
    if (!pages) return ''
    return visible
      .filter((i) => i < locked)
      .map((i) => {
        const p = pages[i]
        if (p.kind === 'title') return `${story.title[locale]}. ${t.book.dedication}`
        if (p.kind === 'end') return `${t.book.end}. ${t.book.endSub}`
        return p.lines.map((l) => l.text).join(' ')
      })
      .join(' ')
  }, [pages, visible, locked])

  /* ── Render ───────────────────────────────────────────────────────────────── */
  const total = pages ? pages.filter((p) => p.kind !== 'blank').length : 0
  const numbers = visible.map((i) => pages![i]).filter((p) => p.kind !== 'blank').map((p) => p.number)
  const pageLabel = numbers.length ? `${s.page} ${num(numbers[0])}${numbers.length > 1 ? `–${num(numbers[numbers.length - 1])}` : ''} ${t.book.of} ${num(total)}` : ''
  const sceneLo = Math.min(...scenesShown)
  const sceneHi = Math.max(...scenesShown)
  const sceneLabel = !scenesShown.length
    ? atEnd
      ? t.book.end
      : story.kicker[locale]
    : `${t.book.page} ${num(sceneLo + 1)}${sceneHi > sceneLo ? `–${num(sceneHi + 1)}` : ''} ${t.book.of} ${num(SCENES)}`
  const positions = pages ? (stage.spread ? Math.ceil(pages.length / 2) : pages.length) : 1
  const canPrev = !!pages && pos > 0
  const canNext = !!pages && pos < positions - 1 && !gated
  const settled = !turning && !!pages
  const bookW = stage.spread ? stage.pageW * 2 : stage.pageW
  const lockedBoxes = visible.filter((i) => i >= locked)
  const gateStyle: CSSProperties | undefined = lockedBoxes.length
    ? { left: Math.min(...lockedBoxes.map(boxLeft)), top: stage.top, width: stage.pageW * lockedBoxes.length, height: stage.pageH }
    : undefined
  const endIndex = pages ? visible.find((i) => pages[i].kind === 'end') : undefined
  const PrevIcon = rtl ? ChevronRight : ChevronLeft
  const NextIcon = rtl ? ChevronLeft : ChevronRight

  return (
    <div
      ref={root}
      className={cn('rd overlay-in fixed inset-0 z-[60] overflow-hidden text-paper', closing && 'is-closing')}
      role="dialog"
      aria-modal="true"
      aria-label={story.title[locale]}
      tabIndex={-1}
      data-phase={phase}
      data-page={first?.number ?? 0}
      data-pages={pages?.length ?? 0}
      data-spread={stage.spread || undefined}
      data-full={stage.full || undefined}
      data-turning={turning || undefined}
      data-chrome={chrome || undefined}
    >
      <div ref={probe} className="rd-probe" aria-hidden />
      <div className="rd-ground grain" aria-hidden />
      {!stage.full && <div className="rd-book" aria-hidden style={{ left: stage.left, top: stage.top, width: bookW, height: stage.pageH }} data-spread={stage.spread || undefined} />}

      {clips.map((c) => (
        <video
          key={c.page}
          ref={bindVideo(c.page)}
          className="rd-film"
          style={c.style}
          src={c.src}
          poster={c.poster}
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden
          tabIndex={-1}
          onTimeUpdate={(e) => onFilmFrame(c.page, e.currentTarget)}
          onPlaying={(e) => onFilmFrame(c.page, e.currentTarget)}
        />
      ))}

      <div ref={holder} className="rd-canvas" style={{ left: frame.x, top: frame.y, width: frame.w, height: frame.h }} />
      <div className="rd-surface" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onCancel} onWheel={onWheel} onContextMenu={(e) => e.preventDefault()} />

      {gateStyle && (
        <div className="rd-over" style={gateStyle} data-on={settled || undefined}>
          <div key={nudge} className={cn('rd-gate glass-ink', nudge > 0 && 'is-nudged')}>
            <span className="rd-gate-icon" aria-hidden>
              <LockKeyhole size={22} />
            </span>
            <h3 className="rd-gate-title">{t.book.gateTitle}</h3>
            <p className="rd-gate-sub">{t.book.gateSub}</p>
            <Pill variant="solid" size="lg" onClick={unlock} data-testid="rd-gate-btn" tabIndex={settled ? 0 : -1}>
              {t.book.gateBtn}
            </Pill>
          </div>
        </div>
      )}

      {atEnd && endIndex !== undefined && (
        <div className="rd-over" style={{ left: boxLeft(endIndex), top: stage.top, width: stage.pageW, height: stage.pageH }} data-on={settled || undefined}>
          <div className="rd-end" style={{ top: `${END_TEXT.buttons * 100}%` }}>
            <Pill variant="maple" size="lg" onClick={openGame} tabIndex={settled ? 0 : -1}>
              <Gamepad2 size={18} aria-hidden />
              {t.book.playGame}
            </Pill>
            <Pill variant="outline" size="lg" onClick={() => openFilm(0)} tabIndex={settled ? 0 : -1}>
              <Play size={16} aria-hidden />
              {t.book.watch}
            </Pill>
            <Pill variant="outline" size="lg" onClick={() => goPage(0)} tabIndex={settled ? 0 : -1} data-testid="rd-again">
              <RotateCcw size={17} aria-hidden />
              {t.book.again}
            </Pill>
          </div>
        </div>
      )}

      {!stage.full && pages && (
        <>
          <button type="button" className="rd-arrow glass" data-side="prev" aria-label={t.book.prev} disabled={!canPrev} onClick={prev}>
            <PrevIcon size={24} aria-hidden />
          </button>
          <button type="button" className="rd-arrow glass" data-side="next" aria-label={t.book.next} disabled={!canNext} onClick={next}>
            <NextIcon size={24} aria-hidden />
          </button>
        </>
      )}

      <TopBar
        shown={chrome}
        title={story.title[locale]}
        sub={sceneLabel}
        panel={panel}
        sound={sound}
        compact={stage.full}
        onClose={close}
        onPanel={(p) => {
          setChrome(true)
          setPanel((cur) => (cur === p ? null : p))
        }}
        onSound={toggleSound}
        onWatch={() => openFilm(scenesShown.length ? sceneLo : Math.min(scene, SCENES - 1))}
      />
      <BottomBar
        shown={chrome}
        label={pageLabel}
        hint={hinted ? '' : s.hint}
        position={pos}
        positions={positions}
        canPrev={canPrev}
        canNext={canNext}
        arrows={stage.full}
        onPrev={prev}
        onNext={next}
        onSeek={(p) => {
          const pg = live.current.pages
          if (pg) goPage(stage.spread ? p * 2 : p)
        }}
        labelFor={(p) => {
          const n = pages ? pagesAt(p, pages.length, stage.spread).map((i) => pages[i]).filter((x) => x.kind !== 'blank') : []
          return n.length ? `${num(n[0].number)}${n.length > 1 ? `–${num(n[n.length - 1].number)}` : ''}` : ''
        }}
      />
      {panel === 'scenes' && pages && (
        <ScenesPanel
          current={first?.kind === 'scene' ? scene : -1}
          lockedFrom={loggedIn ? SCENES : FREE_SCENES}
          onPick={(i) => {
            setPanel(null)
            setChrome(false)
            goScene(i)
          }}
          onClose={() => setPanel(null)}
        />
      )}
      {panel === 'size' && <SizePanel size={size} onSize={setSize} compact={stage.full} />}

      <p className="sr-only" aria-live="polite">
        {spoken}
      </p>
    </div>
  )
}
