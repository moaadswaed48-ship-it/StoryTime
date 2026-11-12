import { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from 'react'
import gsap from 'gsap'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, BookOpen, Check, Gamepad2, Hand, RotateCcw, Volume2, VolumeX, X } from 'lucide-react'
import { Leaves, type LeavesHandle } from '@/design/Leaves'
import { BlurWords, Pill } from '@/design/ui'
import { useOverlayLock } from '@/design/overlay'
import { ErrorBoundary } from '@/design/ErrorBoundary'
import { useSiteStore } from '@/store/useSiteStore'
import { setSound, sfx } from '@/audio/synth'
import { t } from '@/i18n/copy'
import { dirSign, locale, num } from '@/i18n/locale'
import { asset } from '@/lib/asset'
import { cn } from '@/lib/cn'
import { mulberry32 } from '@/lib/seeded'
import { story } from '@/content/story'
import { countCollected, shuffle } from './logic'
import { rt } from './runtime'
import { useGame } from './store'
import { strings } from './strings'

/** three.js, R3F and the yard arrive in their own chunk, only when a game is started (or about to be). */
const loadWorld = () => import('./world/World')
const World = lazy(loadWorld)
export const preloadWorld = () => void loadWorld().catch(() => undefined)

const PICTURE = asset(story.scenes[5].img)
const TILT = [-5, 4, -3, 6, -4]
const reducedNow = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.hasAttribute('data-reduce-motion')
/** A reader's own name may be written in the other alphabet than the page: it keeps its own language and direction. */
const langOf = (name: string) => (/\p{Script=Arabic}/u.test(name) ? 'ar' : /\p{Script=Latin}/u.test(name) ? 'en' : locale)

/**
 * One line of text that always fits its box: a child's own name can be much longer than the five in the story
 * ("عبدالرحمن", "Abdulrahman"), so the size it was designed at is only the upper limit.
 */
function FitLine({ text, className, min = 14, ...rest }: { text: string; className?: string; min?: number } & Record<`data-${string}`, string | number | boolean | undefined>) {
  const ref = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    const box = el?.parentElement
    if (!el || !box) return
    const fit = () => {
      el.style.fontSize = ''
      const cs = getComputedStyle(box)
      const room = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
      const wide = el.offsetWidth
      if (room > 0 && wide > room) el.style.fontSize = `${Math.max(min, Math.floor((parseFloat(getComputedStyle(el).fontSize) * room) / wide))}px`
    }
    fit()
    document.fonts?.ready.then(fit, () => undefined)
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [text, min])
  return (
    <span ref={ref} className={className} lang={langOf(text)} dir="auto" {...rest}>
      {text}
    </span>
  )
}

/**
 * The play view: a fixed layer over the page. The poster picture grows to fill the screen, then melts into the live yard.
 * Everything a child touches is DOM (stick, papers row, question card); the yard behind it is WebGL — or, without WebGL,
 * the film still with the same five papers to tap.
 */
export function PlayView({ from, touch }: { from: DOMRect | null; touch: boolean }) {
  // the rectangle of the poster picture, if the game was started from it (kept as it was at that moment)
  const [origin] = useState(() => {
    const vh = window.innerHeight
    return from && !reducedNow() && from.width >= 40 && from.bottom >= 40 && from.top <= vh - 40 ? from : null
  })
  const phase = useGame((g) => g.phase)
  const mode = useGame((g) => g.mode)
  const ready = useGame((g) => g.ready)
  const current = useGame((g) => g.current)
  const setMode = useGame((g) => g.setMode)
  const lowTier = useSiteStore((s) => s.tier === 'low')
  const root = useRef<HTMLDivElement>(null)
  const curtain = useRef<HTMLDivElement>(null)
  const leaves = useRef<LeavesHandle>(null)
  const slots = useRef<(HTMLLIElement | null)[]>([])
  const [grown, setGrown] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [stick, setStick] = useState(touch)

  const leaveTimer = useRef(0)
  const exit = useCallback(() => {
    setLeaving(true)
    window.clearTimeout(leaveTimer.current)
    // closing the overlay is what ends the game (GameOverlay listens to it)
    leaveTimer.current = window.setTimeout(() => useSiteStore.getState().closeOverlay(), reducedNow() ? 0 : 300)
  }, [])
  useEffect(() => () => window.clearTimeout(leaveTimer.current), [])
  useOverlayLock(true, exit)

  // a modal layer: focus comes in, stays in, and goes back to where it was (the start button) afterwards
  useEffect(() => {
    const el = root.current
    const before = document.activeElement instanceof HTMLElement ? document.activeElement : null
    el?.focus({ preventScroll: true })
    const keep = (e: FocusEvent) => {
      if (el && e.target instanceof Node && !el.contains(e.target)) el.focus({ preventScroll: true })
    }
    document.addEventListener('focusin', keep)
    return () => {
      document.removeEventListener('focusin', keep)
      before?.focus({ preventScroll: true })
    }
  }, [])

  // the poster picture grows from where it sits on the page until it covers the screen (transform only)
  useLayoutEffect(() => {
    const el = curtain.current
    if (!el) return
    const vw = window.innerWidth
    const vh = window.innerHeight
    const r = origin
    if (!r) {
      // opened from somewhere else (the story page, the scroll story): the picture simply covers the screen
      Object.assign(el.style, { left: '0px', top: '0px', width: '100%', height: '100%', borderRadius: '0px' })
      setGrown(true)
      return
    }
    Object.assign(el.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, borderRadius: '28px' })
    const scale = Math.max(vw / r.width, vh / r.height) * 1.03
    // on a tall phone end on Sari, not on the gap between the boys
    const focus = vw < vh ? 0.5 + dirSign * 0.23 : 0.5
    const tween = gsap.fromTo(
      el,
      { x: 0, y: 0, scale: 1 },
      { x: vw / 2 - (r.left + r.width / 2) - (focus - 0.5) * r.width * scale, y: vh / 2 - (r.top + r.height / 2), scale, duration: 0.85, ease: 'power3.inOut', onComplete: () => setGrown(true) },
    )
    return () => void tween.kill()
  }, [origin])

  // keyboard: arrows or WASD by physical key, so an Arabic keyboard layout works too
  useEffect(() => {
    const map: Record<string, [number, number]> = { ArrowUp: [0, 1], KeyW: [0, 1], ArrowDown: [0, -1], KeyS: [0, -1], ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0] }
    const held = new Set<string>()
    const sync = () => {
      let x = 0
      let y = 0
      held.forEach((code) => {
        x += map[code][0]
        y += map[code][1]
      })
      rt.keys.x = Math.sign(x)
      rt.keys.y = Math.sign(y)
    }
    const down = (e: KeyboardEvent) => {
      if (!(e.code in map) || e.metaKey || e.ctrlKey || e.altKey) return
      e.preventDefault()
      held.add(e.code)
      sync()
    }
    const up = (e: KeyboardEvent) => {
      held.delete(e.code)
      sync()
    }
    const clear = () => {
      held.clear()
      sync()
    }
    // a finger on the screen of a laptop with a touch screen brings the stick out
    const pointer = (e: PointerEvent) => e.pointerType === 'touch' && setStick(true)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', clear)
    window.addEventListener('pointerdown', pointer, { passive: true })
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', clear)
      window.removeEventListener('pointerdown', pointer)
      clear()
    }
  }, [])

  const burst = useCallback((x: number, y: number, n = 22) => {
    if (!reducedNow()) leaves.current?.burst(x, y, n)
  }, [])

  // all five names: Sari waves, leaves everywhere, a little tune if sound is on
  useEffect(() => {
    if (phase !== 'done') return
    sfx.win()
    rt.burst++
    const w = window.innerWidth
    const h = window.innerHeight
    const timers = [0, 260, 560].map((ms, i) => window.setTimeout(() => burst(w * (0.3 + i * 0.2), h * 0.42, 26), ms))
    timers.push(window.setTimeout(() => sfx.chime(), 620))
    return () => timers.forEach(clearTimeout)
  }, [phase, burst])

  const asking = current !== null && (phase === 'asking' || phase === 'right')
  const veil = mode === '3d' ? grown && ready : grown

  return (
    <div
      ref={root}
      tabIndex={-1}
      className={cn('game-play fixed inset-0 z-[60] overflow-hidden text-paper outline-none', !origin && 'overlay-in', leaving && 'game-out')}
      role="dialog"
      aria-modal="true"
      aria-label={t.game.title}
      data-game-play
      style={{ '--dir': dirSign } as CSSProperties}
    >
      <div className="absolute inset-0 bg-night" style={{ opacity: grown ? 1 : 0 }}>
        {mode === '3d' ? (
          <>
            <ErrorBoundary fallback={null} onError={() => setMode('cards')}>
              <Suspense fallback={null}>
                <World onFail={() => setMode('cards')} paused={leaving} />
              </Suspense>
            </ErrorBoundary>
            {/* film finish: low sun from the tree's side, darker corners, grain */}
            <div className={cn('game-light pointer-events-none absolute inset-0', !lowTier && 'grain')} aria-hidden />
          </>
        ) : (
          <CardsYard />
        )}
      </div>

      <div ref={curtain} className={cn('game-curtain', veil && 'is-gone')} aria-hidden>
        <span className="game-flip block h-full w-full">
          <img src={PICTURE} alt="" className="object-[28%_50%] sm:object-center" />
        </span>
        {grown && !veil && (
          <span className="game-loader">
            <i />
          </span>
        )}
      </div>

      {mode === '3d' && <Arrows />}
      <Hud slots={slots} waiting={!grown} onExit={exit} />
      {/* the controls arrive with the yard, never over the growing film still */}
      {mode === '3d' && phase !== 'done' && stick && veil && <Stick off={phase !== 'playing'} />}
      {phase === 'playing' && veil && <Hint touch={stick} cards={mode === 'cards'} />}
      {asking && <QuestionCard key={`${useGame.getState().round}:${current}`} slots={slots} burst={burst} />}
      {phase === 'done' && <Done cards={mode === 'cards'} />}

      {/* the leaves of a right answer and of the finale fly over everything: card, veil and row (always mounted, so a burst is never lost) */}
      <Leaves ref={leaves} density={0} className="pointer-events-none absolute inset-0 z-[46] h-full w-full" />
    </div>
  )
}

/* ── HUD: the row of collected papers, sound, exit ──────────────────────────── */

function Hud({ slots, waiting, onExit }: { slots: RefObject<(HTMLLIElement | null)[]>; waiting: boolean; onExit: () => void }) {
  const papers = useGame((g) => g.papers)
  const order = useGame((g) => g.order)
  const sound = useSiteStore((s) => s.sound)
  const setSoundOn = useSiteStore((s) => s.setSoundOn)
  const count = order.length
  const toggleSound = () => {
    setSound(!sound)
    setSoundOn(!sound)
    if (!sound) sfx.pop()
  }
  return (
    <div className={cn('game-hud pointer-events-none absolute inset-x-0 top-0 z-[45] flex items-start justify-between gap-2 px-3 sm:gap-3 sm:px-6', waiting && 'is-waiting')} style={{ paddingTop: 'max(16px, env(safe-area-inset-top))' }}>
      <div className="game-chip glass-ink pointer-events-auto flex items-center gap-2 rounded-full ps-2.5 pe-3 sm:gap-4 sm:ps-5 sm:pe-5">
        <span className="game-chip-label t-label hidden text-paper/70 sm:block">{t.game.papers}</span>
        {/* the row fills in the order the names are won: the first paper a child collects takes the first place */}
        <ol className="flex gap-[5px] sm:gap-2" aria-label={`${t.game.papers} ${num(count)} / ${num(papers.length)}`} data-game-row>
          {papers.map((p, k) => {
            const got = k < order.length ? papers[order[k]] : null
            return (
              <li
                key={p.id}
                ref={(el) => {
                  slots.current[k] = el
                }}
                className={cn('game-slot', got && 'is-full')}
                style={{ '--r': `${TILT[k % TILT.length]}deg` } as CSSProperties}
                aria-label={got ? got.name : undefined}
                lang={got ? langOf(got.letter) : undefined}
              >
                {got ? got.letter : null}
              </li>
            )
          })}
        </ol>
        <span className={cn('min-w-[2.3rem] text-center text-[14px] font-semibold tabular-nums text-paper/85 sm:min-w-[2.6rem] sm:text-[15px]', papers.length > 5 && 'max-[400px]:hidden')} dir="ltr">
          {num(count)} / {num(papers.length)}
        </span>
      </div>
      <div className="pointer-events-auto flex gap-1.5 sm:gap-2">
        <button type="button" onClick={toggleSound} aria-label={t.nav.sound} aria-pressed={sound} className="game-chip game-chip-round glass-ink grid place-items-center rounded-full text-paper transition-transform duration-200 active:scale-[0.95]">
          {sound ? <Volume2 size={22} aria-hidden /> : <VolumeX size={22} aria-hidden />}
        </button>
        <button
          type="button"
          onClick={onExit}
          aria-label={t.game.exit}
          data-game-exit
          className="game-chip glass-ink inline-flex min-w-12 items-center justify-center gap-2.5 rounded-full px-[13px] text-[15px] font-semibold text-paper transition-transform duration-200 active:scale-[0.95] sm:px-6"
        >
          <X size={22} aria-hidden />
          <span className="hidden sm:inline">{t.game.exit}</span>
        </button>
      </div>
    </div>
  )
}

/* ── Stick: one thumb, bottom corner on the reading-start side ──────────────── */

function Stick({ off }: { off: boolean }) {
  const base = useRef<HTMLDivElement>(null)
  const knob = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = base.current
    const k = knob.current
    if (!el || !k) return
    const R = 46
    let id = -1
    let cx = 0
    let cy = 0
    const set = (x: number, y: number) => {
      rt.stick.x = x
      rt.stick.y = y
      k.style.transform = `translate3d(${(x * R).toFixed(1)}px, ${(-y * R).toFixed(1)}px, 0)`
    }
    const move = (e: PointerEvent) => {
      if (e.pointerId !== id) return
      let dx = (e.clientX - cx) / R
      let dy = (e.clientY - cy) / R
      const len = Math.hypot(dx, dy)
      if (len > 1) {
        dx /= len
        dy /= len
      }
      set(dx, -dy)
    }
    const down = (e: PointerEvent) => {
      if (id !== -1) return
      id = e.pointerId
      try {
        el.setPointerCapture(id)
      } catch {
        /* synthetic pointers cannot be captured */
      }
      const r = el.getBoundingClientRect()
      cx = r.left + r.width / 2
      cy = r.top + r.height / 2
      move(e)
      e.preventDefault()
    }
    const up = (e: PointerEvent) => {
      if (e.pointerId !== id) return
      id = -1
      set(0, 0)
    }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    el.addEventListener('lostpointercapture', up)
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
      el.removeEventListener('lostpointercapture', up)
      set(0, 0)
    }
  }, [])
  return (
    // it rises in once with the yard; during a question it only steps aside
    <div className="game-stick-wrap game-rise z-[44]" style={{ '--d': '250ms' } as CSSProperties} aria-hidden>
      <div ref={base} className={cn('game-stick glass-ink', off && 'is-off')} data-game-stick>
        <div ref={knob} className="game-stick-knob" />
      </div>
    </div>
  )
}

function Hint({ touch, cards }: { touch: boolean; cards: boolean }) {
  const moved = useGame((g) => g.moved)
  const rest = moved && !cards
  const base = 'glass-ink pointer-events-none absolute z-[43] flex items-center gap-3 rounded-full text-[14.5px] font-medium text-paper/90 transition-opacity duration-700'
  if (cards)
    return (
      <p className={cn(base, 'game-rise bottom-[max(22px,env(safe-area-inset-bottom))] left-1/2 h-16 -translate-x-1/2 whitespace-nowrap ps-2 pe-6')} style={{ '--d': '700ms' } as CSSProperties}>
        <SariFace className="h-12 w-12" />
        <Hand size={18} aria-hidden className="text-maple-soft" />
        {strings.tapPaper}
      </p>
    )
  if (touch)
    return (
      <p className={cn(base, 'bottom-[calc(max(26px,env(safe-area-inset-bottom))+152px)] start-5 h-11 whitespace-nowrap px-4', rest && 'opacity-0')}>
        <Gamepad2 size={18} aria-hidden className="shrink-0 text-maple-soft" />
        {t.game.move}
      </p>
    )
  return (
    <p className={cn(base, 'bottom-7 left-1/2 h-14 -translate-x-1/2 whitespace-nowrap ps-4 pe-6', rest && 'opacity-0')}>
      <span className="grid grid-cols-3 gap-[3px] text-paper/90" dir="ltr" aria-hidden>
        <i className="col-start-2 grid h-[18px] w-[18px] place-items-center rounded-[5px] bg-white/15">
          <ArrowUp size={11} strokeWidth={2.6} />
        </i>
        <i className="col-start-1 row-start-2 grid h-[18px] w-[18px] place-items-center rounded-[5px] bg-white/15">
          <ArrowLeft size={11} strokeWidth={2.6} />
        </i>
        <i className="row-start-2 grid h-[18px] w-[18px] place-items-center rounded-[5px] bg-white/15">
          <ArrowDown size={11} strokeWidth={2.6} />
        </i>
        <i className="row-start-2 grid h-[18px] w-[18px] place-items-center rounded-[5px] bg-white/15">
          <ArrowRight size={11} strokeWidth={2.6} />
        </i>
      </span>
      {t.game.moveKeys}
    </p>
  )
}

/** Papers outside the camera's view get a small arrow at the edge of the screen (moved by the 3D world every frame). */
function Arrows() {
  const papers = useGame((g) => g.papers)
  useEffect(() => () => void (rt.arrows = []), [])
  return (
    <div className="pointer-events-none absolute inset-0 z-[42]" aria-hidden>
      {papers.map((p, i) => (
        <span
          key={p.id}
          ref={(el) => {
            rt.arrows[i] = el
          }}
          className="game-arrow glass-ink"
        >
          <span className="game-arrow-tip" />
        </span>
      ))}
    </div>
  )
}

/* ── The question: the educational moment ───────────────────────────────────── */

function QuestionCard({ slots, burst }: { slots: RefObject<(HTMLLIElement | null)[]>; burst: (x: number, y: number, n?: number) => void }) {
  const phase = useGame((g) => g.phase)
  const current = useGame((g) => g.current)
  const papers = useGame((g) => g.papers)
  const wrong = useGame((g) => g.wrong)
  const shakes = useGame((g) => g.shakes)
  const collected = useGame((g) => g.collected)
  const answer = useGame((g) => g.answer)
  const card = useRef<HTMLDivElement>(null)
  const index = useRef(current ?? 0).current
  const paper = papers[index]
  const right = phase === 'right'

  useEffect(() => {
    sfx.flip()
    card.current?.focus({ preventScroll: true })
    const key = (e: KeyboardEvent) => {
      const n = ['Digit1', 'Digit2', 'Digit3'].indexOf(e.code) + 1 || ['Numpad1', 'Numpad2', 'Numpad3'].indexOf(e.code) + 1
      const letter = n ? useGame.getState().papers[index]?.options[n - 1] : undefined
      if (letter) useGame.getState().answer(letter)
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [index])

  // right: a cheer, leaves out of the key that was pressed, then the paper flies up into its place in the row
  useEffect(() => {
    if (!right) return
    sfx.win()
    rt.burst++
    const el = card.current
    const key = el?.querySelector<HTMLElement>('.game-letter.is-right')?.getBoundingClientRect()
    const r = key ?? el?.getBoundingClientRect()
    const timers: number[] = []
    if (r) {
      // from the top edge of the key, so the letter itself stays in view
      burst(r.left + r.width / 2, r.top + 4, 24)
      timers.push(window.setTimeout(() => burst(r.left + r.width / 2, r.top - 6, 14), 160))
    }
    if (rt.hold) return () => timers.forEach(clearTimeout)
    const calm = reducedNow()
    let anim: Animation | undefined
    const place = Math.max(0, useGame.getState().order.indexOf(index))
    timers.push(
      window.setTimeout(
        () => {
          const slot = slots.current[place]?.getBoundingClientRect()
          const now = el?.getBoundingClientRect()
          if (!el || !slot || !now || calm) return
          const dx = slot.left + slot.width / 2 - (now.left + now.width / 2)
          const dy = slot.top + slot.height / 2 - (now.top + now.height / 2)
          anim = el.animate([{ transform: 'rotate(-1.2deg)', opacity: 1 }, { transform: `translate(${dx}px, ${dy}px) scale(${(slot.width / now.width).toFixed(3)}) rotate(8deg)`, opacity: 0.5 }], {
            duration: 520,
            easing: 'cubic-bezier(0.5, 0, 0.3, 1)',
            fill: 'forwards',
          })
          // …and a few leaves where it lands
          timers.push(window.setTimeout(() => burst(slot.left + slot.width / 2, slot.top + slot.height / 2, 12), 470))
        },
        calm ? 900 : 1000,
      ),
    )
    timers.push(window.setTimeout(() => useGame.getState().advance(), calm ? 1200 : 1500))
    return () => {
      timers.forEach(clearTimeout)
      anim?.cancel()
    }
  }, [right, index, slots, burst])

  if (!paper) return null
  const total = papers.length
  const nth = right ? countCollected(collected) : countCollected(collected) + 1
  return (
    <div className="game-ask absolute inset-0 z-[41] grid place-items-center px-4" style={{ perspective: '1400px' }} data-game-question>
      <div className="game-veil absolute inset-0" aria-hidden />
      <div
        ref={card}
        tabIndex={-1}
        role="group"
        aria-labelledby="game-question"
        className="game-card relative flex w-[min(92vw,35rem)] flex-col items-center rounded-[32px] px-6 pb-5 pt-6 text-center text-ink outline-none sm:px-10 sm:pb-7 sm:pt-8"
      >
        <p className="game-name-line">
          <FitLine text={paper.name} className="game-name" min={22} data-game-name />
        </p>
        <h3 id="game-question" className="text-[clamp(1.15rem,2.2vw,1.5rem)] font-semibold leading-snug text-ink-2 [text-wrap:balance]">
          {t.game.question}
        </h3>
        <div className="grid w-full grid-cols-3 gap-3 sm:gap-4">
          {paper.options.map((letter) => {
            const isWrong = wrong.includes(letter)
            const isRight = right && letter === paper.letter
            return (
              <button
                key={`${letter}:${isWrong ? shakes : 0}`}
                type="button"
                lang={langOf(letter)}
                disabled={isWrong || right}
                onClick={() => answer(letter)}
                className={cn('game-letter', isWrong && 'is-wrong', isRight && 'is-right', right && !isRight && !isWrong && 'is-rest')}
                data-game-letter={letter}
              >
                {letter}
              </button>
            )
          })}
        </div>
        {/* one quiet line under the buttons: which paper this is, then the word of encouragement */}
        <p className={cn('flex h-8 items-center justify-center gap-2 text-[1.15rem] font-bold', right ? 'text-ink' : 'text-maple')} role="status" aria-live="polite" data-game-feedback>
          {right ? (
            <>
              <span className="grid h-7 w-7 place-items-center rounded-full bg-maple text-white">
                <Check size={17} strokeWidth={3} aria-hidden />
              </span>
              {t.game.right}
            </>
          ) : wrong.length ? (
            <span key={shakes} className="game-nudge inline-block">
              {t.game.wrong}
            </span>
          ) : (
            <span className="text-[13px] font-semibold tabular-nums text-muted" dir="ltr">
              {num(nth)} / {num(total)}
            </span>
          )}
        </p>
      </div>
    </div>
  )
}

/* ── All five collected ─────────────────────────────────────────────────────── */

function Done({ cards }: { cards: boolean }) {
  const again = useGame((g) => g.again)
  // the book takes the overlay's place; that closes the game
  const read = () => useSiteStore.getState().openBook(0)
  return (
    <div className={cn('game-done absolute inset-0 z-[41] flex flex-col items-center justify-between px-5', cards && 'is-cards')} data-game-done>
      <div className="game-done-shade pointer-events-none absolute inset-0" aria-hidden />
      <div className={cn('game-done-words relative text-center', cards && 'my-auto')}>
        {cards && <SariFace className="game-rise mx-auto mb-6 h-28 w-28 shadow-[0_18px_40px_rgba(0,0,0,0.4)]" />}
        <BlurWords as="h3" text={t.game.done} immediate className="game-done-title display-on-film block text-paper" />
        <p className="game-rise t-lede text-on-film mt-3 text-paper/85" style={{ '--d': '500ms' } as CSSProperties}>
          {t.game.doneSub}
        </p>
      </div>
      <div className="game-done-pills game-rise relative flex w-full flex-col gap-3 sm:w-auto sm:flex-row" style={{ '--d': '750ms' } as CSSProperties}>
        <Pill size="lg" onClick={again} data-game-again>
          <RotateCcw size={18} aria-hidden />
          {t.game.again}
        </Pill>
        <Pill size="lg" variant="glass" className="glass-ink" onClick={read} data-game-read>
          <BookOpen size={18} aria-hidden />
          {t.game.read}
        </Pill>
      </div>
    </div>
  )
}

/** Sari's face in a round frame (the same picture the 3D section falls back to). */
function SariFace({ className }: { className?: string }) {
  return (
    <span className={cn('relative block shrink-0 overflow-hidden rounded-full bg-[#dcdcdc]', className)} aria-hidden>
      <img src={asset('story/sari.webp')} alt="" className="absolute left-[-66%] top-[-14%] w-[232%] max-w-none" decoding="async" />
    </span>
  )
}

/* ── Without WebGL: the same quiz, nobody is left out ───────────────────────── */

// places that leave the boys' faces in the picture free (landscape x/y, portrait xm/ym, in % of the screen)
const SPOTS = [
  { x: 11, y: 44, xm: 26, ym: 27 },
  { x: 36, y: 70, xm: 74, ym: 36 },
  { x: 47, y: 30, xm: 27, ym: 53 },
  { x: 69, y: 70, xm: 72, ym: 62 },
  { x: 87, y: 42, xm: 44, ym: 76 },
]
// six papers (the reader's own name is among them): two staggered columns on a phone
const SPOTS6 = [
  { x: 10, y: 44, xm: 27, ym: 25 },
  { x: 28, y: 70, xm: 73, ym: 31 },
  { x: 45, y: 31, xm: 27, ym: 47 },
  { x: 59, y: 71, xm: 73, ym: 53 },
  { x: 76, y: 34, xm: 27, ym: 69 },
  { x: 90, y: 64, xm: 73, ym: 75 },
]

function CardsYard() {
  const papers = useGame((g) => g.papers)
  const collected = useGame((g) => g.collected)
  const current = useGame((g) => g.current)
  const phase = useGame((g) => g.phase)
  const round = useGame((g) => g.round)
  const touchPaper = useGame((g) => g.touch)
  const spots = useMemo(() => shuffle(papers.length > 5 ? SPOTS6 : SPOTS, mulberry32(round * 13 + 5)), [round, papers.length])
  return (
    <div className="absolute inset-0 overflow-hidden" data-game-cards>
      <span className="game-flip absolute inset-0 block">
        <img src={PICTURE} alt="" className="h-full w-full scale-[1.06] object-cover object-[27%_50%] blur-[3px] sm:object-center" />
      </span>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgba(18,12,8,0.2),rgba(18,12,8,0.62))]" aria-hidden />
      <Leaves density={14} />
      {papers.map((p, i) => {
        const s = spots[i % spots.length]
        const gone = collected[i] || current === i
        return (
          <button
            key={`${round}:${p.id}`}
            type="button"
            disabled={phase !== 'playing' || gone}
            tabIndex={gone ? -1 : 0}
            onClick={() => {
              sfx.pop()
              touchPaper(i)
            }}
            className={cn('game-sheet', gone && 'is-gone', !gone && phase !== 'playing' && 'is-waiting')}
            style={{ '--x': `${s.x}%`, '--y': `${s.y}%`, '--xm': `${s.xm}%`, '--ym': `${s.ym}%`, '--i': i, '--r': `${TILT[i % TILT.length] * 1.4}deg` } as CSSProperties}
            data-game-sheet={i}
          >
            <span className="game-sheet-face relative">
              <FitLine text={p.name} className="game-sheet-name" min={11} />
            </span>
          </button>
        )
      })}
    </div>
  )
}
