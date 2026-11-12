import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { BookOpen, Clapperboard, Gamepad2, LockKeyhole, Pause, Play, RotateCcw, X } from 'lucide-react'
import { story, SCENES } from '@/content/story'
import { t } from '@/i18n/copy'
import { dirSign, locale, num, rtl } from '@/i18n/locale'
import { useSiteStore } from '@/store/useSiteStore'
import { useProfileStore } from '@/store/useProfileStore'
import { useOverlayLock } from '@/design/overlay'
import { BlurWords, Eyebrow, Pill } from '@/design/ui'
import { Leaves, type LeavesHandle } from '@/design/Leaves'
import { prefersReducedNow } from '@/app/useMotionTier'
import { sfx } from '@/audio/synth'
import { asset } from '@/lib/asset'
import { cn } from '@/lib/cn'
import { exposeQA } from '@/lib/qa'
import { END, FREE_SCENES, clampScene, nextPos, prevPos, stepCount, type Pos } from './logic'
import { SIDE_QUERY, STACK_QUERY, useMedia } from './hooks'
import { Spread, type BookPhase, type SpreadHandle, type TurnReq } from './Spread'
import { preloadCover, preloadScene } from './pictures'
import { NO_CLIP, idleHooks } from './qa'
import { Caption, type CapLayout } from './Caption'
import { Ambient } from './Ambient'

/** An arrow drawn by hand (it points right; `flip` turns it round). */
function HandArrow({ size, flip }: { size: number; flip?: boolean }) {
  return (
    <svg className="bk-hand" width={size} height={size} viewBox="0 0 24 24" aria-hidden style={flip ? { transform: 'scaleX(-1)' } : undefined}>
      <path d="M3.6 12.4c3.1-.5 7.4-.9 15.6-.3" />
      <path d="M13.4 6.2c1.8 2 3.6 3.7 6.1 5.8-2.3 1.7-4.2 3.6-5.8 5.9" />
    </svg>
  )
}

interface Actions {
  next(): void
  prev(): void
  goScene(n: number): void
  open(): void
  close(): void
  tap(x: number, y: number): void
}

export function Reader({ startScene }: { startScene: number }) {
  const closeOverlay = useSiteStore((s) => s.closeOverlay)
  const openFilm = useSiteStore((s) => s.openFilm)
  const loggedIn = useSiteStore((s) => s.loggedIn)
  const setLoggedIn = useSiteStore((s) => s.setLoggedIn)
  const openGame = useSiteStore((s) => s.openGame)
  const childName = useProfileStore((s) => s.profile?.name?.trim() ?? '')
  const classroom = useProfileStore((s) => s.classroom)
  const tierReduced = useSiteStore((s) => s.tier === 'reduced')
  const reduced = tierReduced || prefersReducedNow()
  const stack = useMedia(STACK_QUERY)
  const side = useMedia(SIDE_QUERY) && !stack
  const layout: CapLayout = stack ? 'stack' : side ? 'side' : 'wide'

  const [phase, setPhaseState] = useState<BookPhase>(startScene > 0 ? 'open' : 'closed')
  const [pos, setPosState] = useState<Pos>({ scene: clampScene(startScene), step: 0 })
  const [turn, setTurn] = useState<TurnReq | null>(null)
  const [clip, setClip] = useState({ playing: false, live: false })
  const [closing, setClosing] = useState(false)
  const [nudge, setNudge] = useState(0)
  const [moved, setMoved] = useState(false)
  const [dragging, setDragging] = useState(false)

  // The logical state lives in refs too, so keys, gestures and test hooks always read (and change) the latest value.
  const phaseRef = useRef(phase)
  const posRef = useRef(pos)
  const turnRef = useRef<TurnReq | null>(null)
  const turnNo = useRef(0)
  const reducedRef = useRef(reduced)
  reducedRef.current = reduced
  const closingRef = useRef(false)

  const root = useRef<HTMLDivElement>(null)
  const ghost = useRef<HTMLDivElement>(null)
  const spread = useRef<SpreadHandle>(null)
  const burst = useRef<LeavesHandle>(null)
  const strip = useRef<HTMLDivElement>(null)
  const act = useRef<Actions>(null!)

  const setPhase = (p: BookPhase) => {
    phaseRef.current = p
    setPhaseState(p)
  }
  const isGated = (p: Pos) => phaseRef.current === 'open' && p.scene < END && p.scene >= FREE_SCENES && !useSiteStore.getState().loggedIn

  const go = (to: Pos) => {
    const from = posRef.current
    if (to.scene === from.scene && to.step === from.step) return
    const sceneChange = to.scene !== from.scene
    // Take the page we are leaving exactly as it looks now (clip frame, drift, frost) before anything changes.
    const snapshot = sceneChange && !reducedRef.current && phaseRef.current === 'open' ? (spread.current?.capture() ?? null) : null
    posRef.current = to
    setPosState(to)
    setMoved(true)
    if (sceneChange) {
      const req: TurnReq | null = snapshot ? { id: ++turnNo.current, from: from.scene, to: to.scene, step: to.step, forward: to.scene > from.scene, snapshot } : null
      turnRef.current = req
      setTurn(req)
    }
  }

  const open = () => {
    if (phaseRef.current !== 'closed') return
    setPhase(reducedRef.current ? 'open' : 'opening')
  }
  const next = () => {
    const ph = phaseRef.current
    if (ph === 'closed') return open()
    if (ph !== 'open') return
    const p = posRef.current
    if (p.scene >= END) return
    if (isGated(p)) return setNudge((n) => n + 1)
    go(nextPos(p))
  }
  const prev = () => {
    if (phaseRef.current !== 'open') return
    const p = posRef.current
    go(prevPos(p, isGated(p)))
  }
  const goScene = (n: number) => {
    const scene = n >= END ? END : clampScene(n)
    if (phaseRef.current !== 'open') {
      // From the cover (or in the middle of opening) a jump lands straight on the open spread.
      posRef.current = { scene, step: 0 }
      setPosState(posRef.current)
      turnRef.current = null
      setTurn(null)
      setPhase('open')
      return
    }
    go({ scene, step: 0 })
  }
  const close = () => {
    if (closingRef.current) return
    closingRef.current = true
    setClosing(true)
    window.setTimeout(closeOverlay, reducedRef.current ? 0 : 200)
  }
  const tap = (x: number, y: number) => {
    if (phaseRef.current !== 'open') return
    const p = posRef.current
    if (p.scene >= END || isGated(p)) return
    const r = root.current?.getBoundingClientRect()
    if (r) burst.current?.burst(x - r.left, y - r.top, 12)
    sfx.chime()
    spread.current?.toggleClip()
  }
  act.current = { next, prev, goScene, open, close, tap }

  const onOpened = useCallback(() => {
    if (phaseRef.current !== 'opening') return
    phaseRef.current = 'open'
    setPhaseState('open')
  }, [])
  const onTurnEnd = useCallback((id: number) => {
    if (turnRef.current?.id !== id) return
    turnRef.current = null
    setTurn(null)
  }, [])
  const onClip = useCallback((playing: boolean, live: boolean) => setClip({ playing, live }), [])
  const closeStable = useCallback(() => act.current.close(), [])
  const openStable = useCallback(() => act.current.open(), [])
  useOverlayLock(true, closeStable)

  const atEnd = pos.scene >= END
  const gated = phase === 'open' && !atEnd && pos.scene >= FREE_SCENES && !loggedIn
  const turning = !!turn
  const gateShown = gated && !turning
  const clipOn = phase === 'open' && !turning && !gated && !atEnd && !reduced
  const hasClip = !atEnd && !!story.scenes[pos.scene].clip
  // On phones the text, beads and buttons arrive while the book is still landing, so the screen fills with it.
  const uiOn = phase === 'open' || (phase === 'opening' && stack)
  /** End actions and the paywall card sit outside the picture where the picture is small (phones). */
  const outside = stack || side
  // While a page is held by the finger (and not yet let go), its text steps aside.
  const lifted = !!turn?.manual && turn.from === pos.scene
  const scene = pos.scene

  /* ── Test hooks ───────────────────────────────────────────────────────────── */
  useEffect(() => {
    exposeQA({
      book: {
        phase: () => {
          const p = posRef.current
          if (phaseRef.current !== 'open') return phaseRef.current
          return p.scene >= END ? 'end' : isGated(p) ? 'gate' : 'open'
        },
        scene: () => posRef.current.scene,
        step: () => posRef.current.step,
        steps: () => (posRef.current.scene >= END ? 0 : stepCount(posRef.current.scene)),
        next: () => act.current.next(),
        prev: () => act.current.prev(),
        goScene: (n: number) => act.current.goScene(n),
        open: () => act.current.open(),
        close: () => act.current.close(),
        turning: () => !!turnRef.current,
        clip: () => spread.current?.clip() ?? NO_CLIP,
        hold: (p: number | null) => spread.current?.hold(p),
        tap: () => act.current.tap(window.innerWidth / 2, window.innerHeight * 0.36),
      },
    })
    return () => exposeQA({ book: idleHooks })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── Keys: arrows by reading direction, Space, PageUp/Down; focus stays inside ── */
  useEffect(() => {
    const el = root.current
    const before = document.activeElement as HTMLElement | null
    el?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return
      const tgt = e.target as HTMLElement | null
      const onControl = !!tgt?.closest?.('button, a, input, select, textarea')
      if (e.key === 'Tab') {
        const items = Array.from(el?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]') ?? []).filter((n) => n.offsetParent !== null)
        if (!items.length) return
        const i = items.indexOf(document.activeElement as HTMLElement)
        const to = e.shiftKey ? (i <= 0 ? items.length - 1 : i - 1) : i === -1 || i === items.length - 1 ? 0 : i + 1
        items[to].focus()
        e.preventDefault()
        return
      }
      switch (e.key) {
        case 'ArrowRight':
          if (rtl) act.current.prev()
          else act.current.next()
          break
        case 'ArrowLeft':
          if (rtl) act.current.next()
          else act.current.prev()
          break
        case 'PageDown':
          act.current.next()
          break
        case 'PageUp':
          act.current.prev()
          break
        case ' ':
        case 'Spacebar':
          if (onControl) return
          act.current.next()
          break
        case 'Enter':
          if (onControl || phaseRef.current !== 'closed') return
          act.current.open()
          break
        case 'Home':
          if (phaseRef.current !== 'open') return
          act.current.goScene(0)
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
  }, [])

  // Pictures of the scenes around the reader are fetched ahead of the turn.
  useEffect(() => {
    for (const d of [0, 1, -1, 2, -2]) preloadScene(scene + d)
    if (scene >= SCENES - 3) preloadCover()
  }, [scene])
  // Once the book is open the rest of the pictures follow quickly (about 2 MB in all), so jumps never meet a blank page.
  useEffect(() => {
    if (phase !== 'open') return
    let i = 0
    const id = window.setInterval(() => {
      preloadScene(i++)
      if (i >= SCENES) window.clearInterval(id)
    }, 110)
    return () => window.clearInterval(id)
  }, [phase])

  // The book was asked to open at another scene while it is already open (e.g. from another overlay).
  const startSeen = useRef(startScene)
  useEffect(() => {
    if (startSeen.current === startScene) return
    startSeen.current = startScene
    act.current.goScene(startScene)
  }, [startScene])

  // The child's progress: where the reader is (for "continue reading"), and the "read" leaf at the end of the story.
  useEffect(() => {
    if (phase !== 'open') return
    const profile = useProfileStore.getState()
    if (scene >= END) {
      profile.mark(story.id, 'read')
      profile.setScene(story.id, 0) // finished: the next visit starts from the cover again
    } else profile.setScene(story.id, scene)
  }, [phase, scene])

  // The end of the story: a shower of leaves once the last leaf has landed.
  useEffect(() => {
    if (!atEnd || turning) return
    sfx.win()
    if (reduced) return
    const r = root.current?.getBoundingClientRect()
    if (!r) return
    // Phones: a small shower from the top of the card, behind the buttons. Wide: three bursts over the spread.
    const card = spread.current?.rect()
    const shots = outside && card ? [0.3, 0.7].map((x) => [card.left - r.left + card.width * x, card.top - r.top + 10, 5]) : [0.3, 0.5, 0.7].map((x) => [r.width * x, r.height * 0.3, 14])
    const ids = shots.map(([x, y, n], i) => window.setTimeout(() => burst.current?.burst(x, y, n), 120 + i * 140))
    return () => ids.forEach((id) => window.clearTimeout(id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atEnd, turning, reduced])

  // Phones: the bead strip scrolls; the bead of the scene being read is kept in the middle of it.
  useEffect(() => {
    const el = strip.current
    if (!el || el.scrollWidth <= el.clientWidth + 1) return
    const on = el.querySelector<HTMLElement>('.bk-dot[aria-current]')
    if (!on) return
    const a = el.getBoundingClientRect()
    const b = on.getBoundingClientRect()
    el.scrollBy({ left: b.left + b.width / 2 - (a.left + a.width / 2), behavior: reduced || phase !== 'open' ? 'auto' : 'smooth' })
  }, [scene, phase, stack, reduced])

  /* ── Drag the page (it follows the finger), swipe, or tap the picture ─────── */
  const press = useRef<{ x: number; y: number; t: number; onPic: boolean; mode: 'none' | 'swipe' | 'drag'; forward: boolean; target: Pos | null; q: number; turn: number } | null>(null)
  /** How far a dragged leaf is turned: the grabbed point of the page follows the finger across the spine. */
  const dragProgress = (s: { x: number; forward: boolean }, x: number) => {
    const r = spread.current?.rect()
    if (!r || !r.width) return 0
    const half = r.width / 2
    const mid = r.left + half
    const lift = s.forward ? dirSign : -dirSign // +1: the leaf lifts from the right-hand page
    const u0 = ((s.x - mid) * lift) / half
    const u = ((x - mid) * lift) / half
    if (u0 > 0.2) return Math.acos(Math.max(-1, Math.min(1, u / Math.min(1, u0)))) / Math.PI
    return Math.max(0, Math.min(1, (Math.abs(x - s.x) - 14) / (half * 1.3)))
  }
  const onPointerDown = (e: ReactPointerEvent) => {
    if (e.button) return
    const tgt = e.target as HTMLElement
    if (tgt.closest('button, a')) return
    press.current = { x: e.clientX, y: e.clientY, t: performance.now(), onPic: !!tgt.closest('.bk-scene') && !tgt.closest('[data-scroll="1"]'), mode: 'none', forward: true, target: null, q: 0, turn: 0 }
  }
  const onPointerMove = (e: ReactPointerEvent) => {
    const s = press.current
    if (!s) return
    const dx = e.clientX - s.x
    const dy = e.clientY - s.y
    if (s.mode === 'none') {
      if (Math.abs(dx) < 14 || Math.abs(dx) < Math.abs(dy) * 1.2) return
      s.mode = 'swipe'
      // The page is dragged the way it turns: towards the start of the line for "next".
      s.forward = dx * dirSign < 0
      const p = posRef.current
      if (phaseRef.current === 'open' && !reducedRef.current && !turnRef.current) {
        const gatedNow = isGated(p)
        const target = s.forward ? (p.scene >= END || gatedNow ? p : nextPos(p)) : prevPos(p, gatedNow)
        const snapshot = target.scene !== p.scene ? spread.current?.capture() : null
        if (snapshot) {
          // A real page turn is next: the leaf lifts under the finger. (A further paragraph is just a swipe.)
          const req: TurnReq = { id: ++turnNo.current, from: p.scene, to: target.scene, step: target.step, forward: s.forward, snapshot, manual: true }
          turnRef.current = req
          setTurn(req)
          setDragging(true)
          s.mode = 'drag'
          s.target = target
          s.turn = req.id
          try {
            e.currentTarget.setPointerCapture(e.pointerId)
          } catch {
            /* the pointer is already gone */
          }
        }
      }
    }
    if (s.mode === 'drag' && turnRef.current?.id === s.turn) {
      s.q = dragProgress(s, e.clientX)
      spread.current?.dragTo(s.q)
    }
  }
  const endPress = (e: ReactPointerEvent, cancelled: boolean) => {
    const s = press.current
    press.current = null
    if (!s) return
    const dx = e.clientX - s.x
    const dy = e.clientY - s.y
    if (s.mode === 'drag') {
      setDragging(false)
      // Something else (a key, a dot) already took over from this drag.
      if (turnRef.current?.id !== s.turn) return
      // Past a third of the way the page goes over; a quick flick counts too. Otherwise it falls back.
      const flick = performance.now() - s.t < 320 && Math.abs(dx) > 36 && dx * dirSign < 0 === s.forward
      const land = !cancelled && !!s.target && (s.q > 0.3 || flick)
      if (land && s.target) {
        posRef.current = s.target
        setPosState(s.target)
        setMoved(true)
      }
      spread.current?.release(land)
      return
    }
    if (cancelled) return
    if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      if (dx * dirSign < 0) act.current.next()
      else act.current.prev()
      return
    }
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && s.onPic) act.current.tap(e.clientX, e.clientY)
  }

  const watch = () => openFilm(Math.min(scene, SCENES - 1))
  const pass = () => {
    sfx.pop()
    setLoggedIn(true)
  }
  const again = () => act.current.goScene(0)
  // The game is a full-screen experience of its own: opening it takes the book's place.
  const playGame = () => openGame()

  const qaPhase = phase !== 'open' ? phase : atEnd ? 'end' : gated ? 'gate' : 'open'
  const isOpen = phase === 'open'
  const canPrev = uiOn && !(scene === 0 && pos.step === 0)
  const canNext = uiOn && !atEnd && !gated
  // "Use the arrows or swipe · tap a picture to make it move": the promise about the picture only where it moves.
  const [hintMove, hintTap] = t.book.hint.split(' · ')
  const hint = hasClip && hintTap ? t.book.hint : hintMove

  const endActions = (
    <div className="bk-end-actions">
      <Pill variant="maple" size="lg" onClick={playGame}>
        <Gamepad2 size={19} aria-hidden />
        {t.book.playGame}
      </Pill>
      <i aria-hidden />
      <Pill variant={outside ? 'glass' : 'outline'} size={stack ? 'lg' : 'md'} onClick={again}>
        <RotateCcw size={17} aria-hidden />
        {t.book.again}
      </Pill>
      <Pill variant={outside ? 'glass' : 'outline'} size={stack ? 'lg' : 'md'} onClick={() => openFilm(0)}>
        <Play size={16} aria-hidden />
        {t.book.watch}
      </Pill>
    </div>
  )

  const endPage = (
    <div className="bk-end" data-in={!turning || undefined}>
      <div className="bk-end-text">
        <Eyebrow tone="light">{story.kicker[locale]}</Eyebrow>
        <h2 className="bk-end-title">{t.book.end}</h2>
        <p className="bk-end-sub font-story">{t.book.endSub}</p>
        {!outside && endActions}
      </div>
      <div className="bk-end-plate">
        <img src={asset(story.cover)} alt="" draggable={false} />
        <p className="font-story">{t.book.dedication}</p>
      </div>
    </div>
  )

  const dots = (
    <div className="bk-dots-strip" ref={strip} data-lenis-prevent>
      <div className="bk-dots" style={{ '--i': Math.min(scene, SCENES - 1), '--n': SCENES, '--dir': dirSign } as CSSProperties} data-end={atEnd || undefined}>
        <span className="bk-dots-ind" aria-hidden />
        {story.scenes.map((_, i) => {
          const locked = i >= FREE_SCENES && !loggedIn
          return (
            <button
              key={i}
              type="button"
              className="bk-dot"
              aria-label={`${t.book.page} ${num(i + 1)}`}
              aria-current={i === scene ? 'step' : undefined}
              data-state={i === scene ? 'on' : locked ? 'locked' : i < scene || atEnd ? 'seen' : 'off'}
              onClick={() => goScene(i)}
            >
              <span style={{ backgroundImage: `url(${asset(story.scenes[i].thumb)})` }}>{locked && i !== scene && <LockKeyhole size={11} strokeWidth={2.4} aria-hidden />}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
  const counter = <p className="bk-count">{!atEnd && `${t.book.page} ${num(scene + 1)} ${t.book.of} ${num(SCENES)}`}</p>

  return (
    <div
      ref={root}
      className={cn('bk overlay-in fixed inset-0 z-[60] overflow-hidden bg-night text-paper', closing && 'is-closing')}
      role="dialog"
      aria-modal="true"
      aria-label={story.title[locale]}
      tabIndex={-1}
      data-phase={qaPhase}
      data-layout={layout}
      data-turning={turning || undefined}
      data-dragging={dragging || undefined}
      data-classroom={classroom || undefined}
    >
      <div className="bk-bg" aria-hidden>
        <Ambient src={asset(phase !== 'open' || atEnd ? story.coverThumb : story.scenes[scene].thumb)} />
        <div className="bk-vig grain" />
      </div>
      <div className="bk-leaves" aria-hidden>
        <Leaves density={stack ? 6 : 10} />
      </div>

      <div className="bk-layout">
        <header className="bk-top">
          <div className="bk-top-id">
            {uiOn ? (
              <div className="bk-fade">
                <p className="bk-top-title">{story.title[locale]}</p>
                <p className="bk-top-sub">{t.book.draft || story.kicker[locale]}</p>
              </div>
            ) : (
              <p className="bk-brand">{t.brand}</p>
            )}
          </div>
          <div className="bk-top-actions">
            {uiOn && (
              <Pill variant="glass" size="sm" className="bk-watch bk-fade" onClick={watch} aria-label={t.book.watch}>
                {stack ? <Clapperboard size={18} aria-hidden /> : <Play size={15} aria-hidden />}
                <span className="bk-watch-label">{t.book.watch}</span>
              </Pill>
            )}
            <button type="button" className="bk-icon glass" aria-label={t.book.close} onClick={close}>
              <X size={20} aria-hidden />
            </button>
          </div>
        </header>

        <div className="bk-main" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={(e) => endPress(e, false)} onPointerCancel={(e) => endPress(e, true)}>
          <div className="bk-wrap">
            <Spread ref={spread} phase={phase} scene={scene} step={pos.step} turn={turn} blurred={gateShown} clipOn={clipOn} reduced={reduced} stack={stack} ghost={ghost} onOpen={openStable} onOpened={onOpened} onTurnEnd={onTurnEnd} onClip={onClip} endPage={endPage} />

            {uiOn && !atEnd && !gated && <Caption scene={scene} step={pos.step} wait={turning} layout={layout} hide={lifted} />}

            {gateShown && (
              <div className="bk-gate" data-lenis-prevent>
                <div key={nudge} className={cn('bk-gate-card glass', nudge > 0 && 'is-nudged')}>
                  <span className="bk-gate-icon" aria-hidden>
                    <LockKeyhole size={22} />
                  </span>
                  <h3 className="bk-gate-title">{t.book.gateTitle}</h3>
                  <p className="bk-gate-sub">{t.book.gateSub}</p>
                  <Pill variant="solid" size="lg" onClick={pass} data-testid="bk-gate-btn">
                    {t.book.gateBtn}
                  </Pill>
                </div>
              </div>
            )}

            {atEnd && outside && !turning && (
              <div className="bk-out-end">
                {endActions}
                <p className="bk-end-note font-story">{t.book.dedication}</p>
              </div>
            )}

            {isOpen && hasClip && !gated && !turning && (
              <button type="button" className="bk-chip glass-ink bk-fade" aria-label={clip.playing ? t.film.pause : t.film.play} onClick={() => spread.current?.toggleClip()} data-playing={clip.playing || undefined}>
                {clip.playing ? <Pause size={17} aria-hidden /> : <Play size={17} aria-hidden />}
              </button>
            )}

            {isOpen && !stack && (
              <>
                <button type="button" className="bk-arrow bk-arrow-prev glass bk-fade" aria-label={t.book.prev} disabled={!canPrev} onClick={prev}>
                  <HandArrow size={26} flip={!rtl} />
                </button>
                <button type="button" className="bk-arrow bk-arrow-next bk-fade" aria-label={t.book.next} disabled={!canNext} onClick={next}>
                  <HandArrow size={28} flip={rtl} />
                </button>
              </>
            )}
          </div>
        </div>

        <footer className="bk-bottom" data-on={uiOn || undefined}>
          {uiOn &&
            (stack ? (
              <>
                {dots}
                <p className="bk-hint" data-off={moved || atEnd || undefined}>
                  {hint}
                </p>
                <div className="bk-nav-row">
                  <button type="button" className="bk-icon bk-icon-lg glass" aria-label={t.book.prev} disabled={!canPrev} onClick={prev}>
                    <HandArrow size={24} flip={!rtl} />
                  </button>
                  {counter}
                  <Pill variant="solid" size="lg" className="bk-next-pill" disabled={!canNext} onClick={next} data-end={atEnd || undefined} aria-hidden={atEnd || undefined} tabIndex={atEnd ? -1 : undefined}>
                    {t.book.next}
                    <HandArrow size={20} flip={rtl} />
                  </Pill>
                </div>
              </>
            ) : (
              <>
                {counter}
                {dots}
                <p className="bk-hint">{!atEnd && hint}</p>
              </>
            ))}
        </footer>
      </div>

      {phase !== 'open' && (
        <div className={cn('bk-closed', phase === 'opening' && 'is-out')}>
          <div className="bk-closed-text">
            <p className="bk-kicker bk-rise" style={{ '--i': 0 } as CSSProperties}>
              <span aria-hidden />
              {story.kicker[locale]}
            </p>
            <h2 className="bk-closed-title">
              <BlurWords text={t.hero.titleA} className="a" immediate delay={120} />
              <BlurWords text={t.hero.titleB} className="b" immediate delay={300} />
            </h2>
            <p className="bk-dedication font-story bk-rise" style={{ '--i': 3 } as CSSProperties}>
              {t.book.dedication}
            </p>
            {childName && (
              <p className="bk-forchild bk-rise" style={{ '--i': 3.5 } as CSSProperties} data-testid="bk-forchild">
                {t.book.forChild} <bdi>{childName}</bdi>
              </p>
            )}
            <div className="bk-rise bk-open-wrap" style={{ '--i': 4 } as CSSProperties}>
              <Pill variant="solid" size="lg" className="bk-open" onClick={open} data-testid="bk-open">
                <BookOpen size={19} aria-hidden />
                {t.book.open}
              </Pill>
              {/* A ring drawn round the button by hand, once. */}
              <svg className="bk-ring" viewBox="0 0 300 100" preserveAspectRatio="none" aria-hidden>
                <path pathLength={1} d="M58 20 C110 4 236 3 279 29 C305 46 287 83 200 92 C124 100 33 93 15 63 C1 40 31 17 101 9 C131 6 161 6 188 9" />
              </svg>
            </div>
          </div>
          <div className="bk-ghost" ref={ghost} aria-hidden />
        </div>
      )}

      <div className="bk-burst" aria-hidden>
        <Leaves density={0} ref={burst} />
      </div>
    </div>
  )
}
