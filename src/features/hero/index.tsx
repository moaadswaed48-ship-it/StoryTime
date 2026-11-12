import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { BookOpen, Play } from 'lucide-react'
import { BlurWords, Pill, useOnScreen } from '@/design/ui'
import { prefersReducedNow } from '@/app/useMotionTier'
import { t } from '@/i18n/copy'
import { dirSign } from '@/i18n/locale'
import { exposeQA } from '@/lib/qa'
import { useSiteStore } from '@/store/useSiteStore'
import { Film, type FilmHandle } from './Film'
import { HERO_SCENES, SceneStrip, type StripHandle } from './SceneStrip'
import { Wind, type WindHandle } from './Wind'
import { frameTall, frameWide, overlaps, type Box, type Frame } from './framing'
import './hero.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/**
 * Wide layout (film covers, title on top, strip bottom-left) needs a screen that is both wide and clearly landscape.
 * Below 3:2 — landscape tablets, squarish windows — the boys would be cropped at the chest, so those get the tall layout.
 */
const WIDE = '(min-width: 1024px) and (min-aspect-ratio: 3/2)'
const FINE = '(hover: hover) and (pointer: fine)'
type Layout = 'wide' | 'tall'
const sameFrame = (a: Frame | null, b: Frame) => !!a && a.mode === b.mode && Math.abs(a.s - b.s) < 0.0005 && Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) < 0.5 && Math.abs(a.w - b.w) < 0.5
const wantsWide = () => typeof window !== 'undefined' && window.matchMedia(WIDE).matches
/** The sub-copy ends with who the story is for; that part gets its own line instead of a dash stranded at a line start. */
const [SUB_LEAD, SUB_FOR] = t.hero.sub.split(' — ')

/**
 * The first screen: the hero film full-bleed, the story's title in heavy type, two pills and three living scene cards,
 * with the story's wind — falling leaves that answer a touch — in front of it all.
 * The film is framed by a small solver (framing.ts) so that type, pills and cards never sit on the boys' faces.
 */
export function Hero() {
  const section = useRef<HTMLElement>(null)
  const media = useRef<HTMLDivElement>(null)
  const stack = useRef<HTMLDivElement>(null)
  const stackPar = useRef<HTMLDivElement>(null)
  const veil = useRef<HTMLDivElement>(null)
  const cue = useRef<HTMLDivElement>(null)
  const film = useRef<FilmHandle>(null)
  const strip = useRef<StripHandle>(null)
  const wind = useRef<WindHandle>(null)
  const frameRef = useRef<Frame | null>(null)

  const openBook = useSiteStore((s) => s.openBook)
  const openFilm = useSiteStore((s) => s.openFilm)
  // Anything that covers the hero: the book, the film or the game, "who is reading?", the sign-in sheet, the phone menu.
  const overlaid = useSiteStore((s) => s.overlay !== null || s.picking || s.loginOpen)
  const tier = useSiteStore((s) => s.tier)
  const [menu, setMenu] = useState(false)
  const [still] = useState(() => typeof window !== 'undefined' && prefersReducedNow())
  const reduced = still || tier === 'reduced'
  const onScreen = useOnScreen(section, '0px')
  const live = onScreen && !overlaid && !menu && !reduced

  const [layout, setLayout] = useState<Layout>(() => (wantsWide() ? 'wide' : 'tall'))
  const layoutRef = useRef(layout)
  /** Screen size at which the wide layout could not keep the strip off a face (it then stays tall for that size). */
  const forcedTall = useRef('')
  const [frame, setFrame] = useState<Frame | null>(null)
  const [clash, setClash] = useState<number[]>([])
  const [phase, setPhase] = useState<'pre' | 'in' | undefined>(undefined)
  const [filmState, setFilmState] = useState({ ready: false, settled: false })

  useEffect(() => {
    const on = (e: Event) => setMenu(!!(e as CustomEvent<{ open?: boolean }>).detail?.open)
    window.addEventListener('st:menu', on)
    return () => window.removeEventListener('st:menu', on)
  }, [])

  /* ── Measure the UI, then let the solver place the film ─────────────────────── */
  const boxOf = useCallback((n: HTMLElement): Box => {
    // offset* ignores transforms, so entrance and scroll motion never disturb the measurement
    let x = 0
    let y = 0
    let p: HTMLElement | null = n
    while (p && p !== section.current) {
      x += p.offsetLeft
      y += p.offsetTop
      p = p.offsetParent as HTMLElement | null
    }
    return { x, y, w: n.offsetWidth, h: n.offsetHeight }
  }, [])
  const uiBoxes = useCallback((kind?: string) => Array.from(section.current?.querySelectorAll<HTMLElement>(kind ? `[data-hero-ui="${kind}"]` : '[data-hero-ui]:not([data-clash])') ?? []).map(boxOf), [boxOf])

  const solve = useCallback(() => {
    const el = section.current
    if (!el) return
    const W = el.clientWidth
    const H = el.clientHeight
    if (!W || !H) return
    const size = `${W}x${H}`
    const want: Layout = wantsWide() && forcedTall.current !== size ? 'wide' : 'tall'
    if (want !== layoutRef.current) {
      // the styles follow `data-layout`: switch first, measure on the next pass
      layoutRef.current = want
      setLayout(want)
      return
    }
    const stackBoxes = uiBoxes('stack')
    const stripTop = strip.current?.el?.offsetTop ?? H
    const f = want === 'wide' ? frameWide(W, H, stackBoxes) : frameTall(W, H, Math.max(0, ...stackBoxes.map((b) => b.y + b.h)), stripTop)
    const onFace = (b: Box) => f.heads.some((h) => overlaps(b, h, 10))
    const cards = Array.from(el.querySelectorAll<HTMLElement>('.hero-card')).map(boxOf)
    const hit = cards.map((c, i) => (onFace(c) ? i : -1)).filter((i) => i >= 0)
    if (want === 'wide') {
      // One card touching a face is hidden. If the strip's own label would, or no card could stay, the screen is too
      // small for this layout: use the tall one, where the strip sits under the boys.
      const head = el.querySelector<HTMLElement>('.hero-strip__head')
      if ((head && onFace(boxOf(head))) || hit.length === cards.length) {
        forcedTall.current = size
        layoutRef.current = 'tall'
        setLayout('tall')
        return
      }
    }
    frameRef.current = f
    setFrame((prev) => (sameFrame(prev, f) ? prev : f))
    setClash((prev) => (prev.join() === hit.join() ? prev : hit))
  }, [boxOf, uiBoxes])

  useLayoutEffect(() => {
    solve()
    let raf = 0
    const queue = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(solve)
    }
    const ro = new ResizeObserver(queue)
    for (const n of [section.current, stackPar.current, strip.current?.el]) if (n) ro.observe(n)
    window.addEventListener('resize', queue)
    document.fonts?.ready.then(queue).catch(() => {})
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('resize', queue)
    }
  }, [solve, layout])

  /* ── Entrance: hidden before the first paint, released two frames later, cleaned up when it is over ── */
  useLayoutEffect(() => {
    if (reduced) return setPhase(undefined)
    setPhase('pre')
    let r2 = 0
    const r1 = requestAnimationFrame(() => (r2 = requestAnimationFrame(() => setPhase('in'))))
    const done = window.setTimeout(() => setPhase(undefined), 2100)
    return () => {
      cancelAnimationFrame(r1)
      cancelAnimationFrame(r2)
      window.clearTimeout(done)
    }
  }, [reduced])

  /* ── Leaving the hero: the film drifts slower than the page, the type lifts away, the scene dims ──
     The type fades through `--exit`, which every item of the stack turns into its OWN opacity: fading the wrapper
     would flatten the glass of the chip and the pill (a faded group has no backdrop to blur). */
  useGSAP(
    () => {
      if (reduced || !section.current) return
      gsap
        .timeline({
          defaults: { ease: 'none' },
          scrollTrigger: { trigger: section.current, start: 'top top', end: 'bottom top', scrub: true, onUpdate: (self) => self.progress > 0.004 && setPhase(undefined) },
        })
        .to(media.current, { yPercent: 12, duration: 1 }, 0)
        .to(veil.current, { opacity: 0.62, duration: 1 }, 0)
        .to(stack.current, { yPercent: -14, '--exit': 1, duration: 0.5 }, 0)
        .to(strip.current?.el ?? null, { y: -28, opacity: 0, duration: 0.42 }, 0)
        .to(cue.current, { opacity: 0, duration: 0.18 }, 0)
    },
    { scope: section, dependencies: [reduced], revertOnUpdate: true },
  )

  /* ── Pointer depth (mouse only): film and type slide a few pixels against each other ── */
  const wide = layout === 'wide'
  useEffect(() => {
    const el = section.current
    const plate = film.current?.parallax
    const type = stackPar.current
    if (reduced || !wide || !onScreen || !el || !plate || !type || !window.matchMedia(FINE).matches) return
    let tx = 0
    let ty = 0
    let x = 0
    let y = 0
    // The type only ever rests on whole device pixels, so small text is never resampled.
    const snap = (v: number) => {
      const d = window.devicePixelRatio || 1
      return Math.round(v * d) / d
    }
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2
    }
    const rest = () => (tx = ty = 0)
    const tick = () => {
      if (Math.abs(tx - x) < 0.0008 && Math.abs(ty - y) < 0.0008) return
      x += (tx - x) * 0.08
      y += (ty - y) * 0.08
      plate.style.transform = `translate3d(${(-x * 8).toFixed(2)}px, ${(-y * 5).toFixed(2)}px, 0)`
      type.style.transform = `translate3d(${snap(x * 3)}px, ${snap(y * 2)}px, 0)`
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', rest)
    gsap.ticker.add(tick)
    return () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', rest)
      gsap.ticker.remove(tick)
      plate.style.transform = ''
      type.style.transform = ''
    }
  }, [reduced, wide, onScreen])

  /* ── Test hooks ─────────────────────────────────────────────────────────────── */
  useEffect(() => {
    exposeQA({
      hero: {
        scenes: [...HERO_SCENES],
        /** Layout chosen by the solver, the film frame and the two face boxes (hero coordinates, CSS px). */
        frame: () => frameRef.current && { mode: frameRef.current.mode, scale: frameRef.current.s, x: frameRef.current.x, y: frameRef.current.y, w: frameRef.current.w, h: frameRef.current.h, heads: frameRef.current.heads },
        /** Every text block, pill and card of the hero (hero coordinates). */
        ui: () => uiBoxes(),
        /** True when nothing in `ui()` touches a face. */
        clear: () => !!frameRef.current && !uiBoxes().some((u) => frameRef.current!.heads.some((h) => overlaps(u, h, 0))),
        film: () => {
          const v = film.current?.video
          return v ? { src: v.currentSrc, ready: v.readyState >= 2, playing: !v.paused && !v.ended, time: v.currentTime } : null
        },
        hoverCard: (i: number) => strip.current?.hover(i),
        leaveCard: (i: number) => strip.current?.leave(i),
        cardPlaying: (i: number) => !!strip.current?.playing(i),
        /** The leaf layer: how many leaves are in the air and whether it is running (null when it is not mounted). */
        wind: () => (wind.current ? { leaves: wind.current.count(), running: wind.current.running() } : null),
        gust: (x: number, y: number) => wind.current?.burst(x, y),
      },
    })
  }, [uiBoxes])

  const d = (ms: number, rise?: number) => ({ '--d': `${ms}ms`, ...(rise === undefined ? null : { '--rise': `${rise}px` }) }) as CSSProperties

  return (
    <section
      id="top"
      ref={section}
      className="hero relative isolate overflow-hidden bg-night text-white"
      data-layout={layout}
      data-phase={phase}
      data-film={[filmState.ready && 'ready', (filmState.settled || reduced) && 'settled'].filter(Boolean).join(' ')}
      style={{ '--dir': dirSign } as CSSProperties}
    >
      <div ref={media} className="absolute inset-0 will-change-transform">
        <Film ref={film} frame={frame} play={live} still={reduced} onState={setFilmState} />
      </div>

      <div ref={stack} className="hero-stack">
        <div ref={stackPar} className="flex w-full flex-col items-center">
          <p className="hero-chip glass hero-rise hero-rise--blur" style={d(80, 16)} data-hero-ui="stack">
            <span className="hero-chip__dot" aria-hidden />
            {t.hero.presents}
          </p>
          <h1 className="hero-title">
            <span className="hero-title__a" data-hero-ui="stack">
              <BlurWords text={t.hero.titleA} delay={160} />
            </span>
            <span className="hero-title__b" data-hero-ui="stack">
              <BlurWords text={t.hero.titleB} delay={300} />
            </span>
          </h1>
          <p className="hero-sub hero-rise hero-rise--blur" style={d(420)} data-hero-ui="stack">
            {SUB_LEAD}
            {SUB_FOR && (
              <>
                <span className="sr-only"> — </span>
                <span className="hero-sub__for">{SUB_FOR}</span>
              </>
            )}
          </p>
          <div className="hero-actions">
            <Pill variant="solid" size="lg" className="hero-pill hero-pill--read hero-rise" style={d(520)} data-hero-ui="stack" onClick={() => openBook(0)}>
              <BookOpen size={18} strokeWidth={2.2} aria-hidden />
              {t.hero.read}
            </Pill>
            <Pill variant="glass" size="lg" className="hero-pill hero-pill--watch hero-rise" style={d(580)} data-hero-ui="stack" onClick={() => openFilm(0)}>
              <span className="hero-pill__disc" aria-hidden>
                <Play size={11} fill="currentColor" strokeWidth={0} />
              </span>
              {t.hero.watch}
            </Pill>
          </div>
        </div>
      </div>

      <SceneStrip ref={strip} reduced={reduced} clash={clash} />

      <div ref={cue} className="hero-cue" data-hero-ui="cue">
        <div className="hero-cue__in hero-rise" style={d(700, 0)}>
          <span className="hero-cue__label">{t.hero.scroll}</span>
          <span className="hero-cue__line" aria-hidden />
        </div>
      </div>

      {!reduced && tier !== 'low' && <Wind ref={wind} host={section} active={live} />}

      <div ref={veil} className="hero-veil" aria-hidden />
    </section>
  )
}
