import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpLeft, ArrowUpRight, BookOpen, Gamepad2, Play } from 'lucide-react'
import { enterApp } from '@/app/router'
import { prefersReducedNow } from '@/app/useMotionTier'
import { library, type ShelfBook } from '@/content/library'
import { BlurWords, Container, Pill, SectionHead, useOnScreen } from '@/design/ui'
import { t } from '@/i18n/copy'
import { dirSign, locale, num, rtl } from '@/i18n/locale'
import { cn } from '@/lib/cn'
import { exposeQA } from '@/lib/qa'
import { useSiteStore } from '@/store/useSiteStore'
import { Book, Emblem, foilVars } from './Book'
import { emblemMask } from './emblems'
import { READY, Shelf, type Filter } from './controller'
import { computeGeoms, computeMetrics, type Metrics } from './engine'
import { noiseTile } from './noise'
import './library.css'

const FILTERS: Filter[] = ['all', 'nature', 'sea', 'space', 'town', 'magic']
const COUNTS = Object.fromEntries(FILTERS.map((f) => [f, library.filter((b) => f === 'all' || b.season === f).length])) as Record<Filter, number>

/** First guess of the stage box (same clamps as library.css) so the first paint is already the right size. */
function guessMetrics(): Metrics {
  const w = typeof window === 'undefined' ? 1440 : window.innerWidth
  const h = typeof window === 'undefined' ? 900 : window.innerHeight
  const stageH = w < 640 ? Math.min(430, Math.max(380, h * 0.48)) : Math.min(640, Math.max(460, h * 0.64))
  return computeMetrics(w, Math.round(stageH), h)
}

const OpenIcon = rtl ? ArrowUpLeft : ArrowUpRight

/** Arrow that points toward the previous / next book whatever the reading direction. */
function Arrow({ next }: { next?: boolean }) {
  const Icon = !!next !== rtl ? ArrowRight : ArrowLeft
  return <Icon size={22} strokeWidth={2} aria-hidden />
}

/** The words under the shelf: title, then season and status. Each line sits in its own mask and slides through it. */
function CapBody({ book, className, hidden }: { book: ShelfBook; className?: string; hidden?: boolean }) {
  const Title = hidden ? 'p' : 'h3' // the line that is leaving is decoration, not a second heading
  return (
    <div className={cn('lib-capbody', className)} aria-hidden={hidden || undefined}>
      <div className="lib-mask">
        <Title className="lib-line text-balance text-[clamp(1.35rem,2.5vw,2.1rem)] font-extrabold leading-[1.25] tracking-[-0.02em]">{book.title[locale]}</Title>
      </div>
      <div className="lib-mask mt-1">
        <p className="lib-line flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[14.5px] font-medium text-ink-2/85">
          <span>{t.library.filters[book.season]}</span>
          <span className="h-1 w-1 rounded-full bg-current opacity-40" aria-hidden />
          <span className={cn('lib-status', book.ready ? 'is-ready font-semibold text-ink' : 'is-soon')}>
            <i aria-hidden />
            {book.ready ? t.library.ready : t.library.soon}
          </span>
        </p>
      </div>
    </div>
  )
}

/**
 * The shelf of moving books: a row of real (CSS-3D) books on a ledge. They land and shuffle when the
 * shelf scrolls into view; the centred one steps out and turns its cover to you; drag, wheel, arrows
 * and keys move along the row; clicking the cover flies it aside and opens its detail view.
 */
export function Library({ variant = 'landing' }: { variant?: 'landing' | 'app' }) {
  const app = variant === 'app'
  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<HTMLDivElement>(null)
  const plankRef = useRef<HTMLDivElement>(null)
  const lipRef = useRef<HTMLDivElement>(null)
  const wallRef = useRef<HTMLDivElement>(null)
  const slotRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const detailRef = useRef<HTMLDivElement>(null)
  const backRef = useRef<HTMLButtonElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const openRef = useRef<HTMLButtonElement>(null)
  const bookEls = useRef<(HTMLDivElement | null)[]>([])
  const shadowEls = useRef<(HTMLDivElement | null)[]>([])

  const [metrics, setMetrics] = useState<Metrics>(guessMetrics)
  const geoms = useMemo(() => computeGeoms(library, metrics), [metrics])
  const [sel, setSel] = useState(READY)
  const [filter, setFilter] = useState<Filter>('all')
  const [detail, setDetail] = useState<number | null>(null)
  /** The book whose detail text is mounted (kept while the panel fades out). */
  const [shown, setShown] = useState({ i: READY, seq: 0 })
  const [waiting, setWaiting] = useState(() => !prefersReducedNow())
  const reduced = useSiteStore((s) => s.tier === 'reduced')
  const grain = useMemo(() => {
    const tile = noiseTile()
    return tile ? ({ '--lib-noise': tile } as CSSProperties) : undefined
  }, [])
  const onScreen = useOnScreen(stageRef, '160px 0px')

  const shelfRef = useRef<Shelf | null>(null)
  if (!shelfRef.current) {
    shelfRef.current = new Shelf(metrics, {
      onSel: setSel,
      onDetail: (i) => {
        setDetail(i)
        if (i !== null) setShown((s) => ({ i, seq: s.seq + 1 }))
      },
      onLanded: (landed) => setWaiting(!landed),
      onFilter: setFilter,
      onCover: (i) => library[i].ready && useSiteStore.getState().openBook(0),
    })
  }
  const shelf = shelfRef.current
  const armed = useRef(false)

  const setBookRef = useCallback((i: number, el: HTMLDivElement | null) => {
    bookEls.current[i] = el
  }, [])

  // Wire the controller to the DOM before the first paint, so no frame ever shows unplaced books.
  useLayoutEffect(() => {
    shelf.attach({
      stage: stageRef.current!,
      scene: sceneRef.current!,
      plank: plankRef.current!,
      lip: lipRef.current!,
      wall: wallRef.current!,
      slot: slotRef.current!,
      panel: panelRef.current!,
      detail: detailRef.current!,
      open: openRef.current,
      books: bookEls.current,
      shadows: shadowEls.current,
    })
    if (!prefersReducedNow() && shelf.landed && !armed.current) {
      armed.current = true
      shelf.arm()
    }
    return () => shelf.detach()
  }, [shelf])

  // Measure the stage; every size in the scene derives from it.
  useLayoutEffect(() => {
    const stage = stageRef.current!
    const measure = () => {
      const w = stage.clientWidth
      const h = stage.clientHeight
      if (w && h) setMetrics((prev) => (prev.stageW === w && prev.stageH === h ? prev : computeMetrics(w, h, window.innerHeight)))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(stage)
    return () => ro.disconnect()
  }, [])
  useLayoutEffect(() => {
    shelf.setMetrics(metrics, geoms)
    shelf.renderNow()
  }, [shelf, metrics, geoms])

  // The panel's size depends on the book, so it is placed (and its slot read) only now that React has rendered
  // it — before the browser paints, so the book flies to where its slot really is.
  useLayoutEffect(() => {
    if (detail !== null) shelf.place()
  }, [shelf, detail, shown])

  useEffect(() => shelf.setReduced(reduced), [shelf, reduced])
  useEffect(() => shelf.setOnScreen(onScreen), [shelf, onScreen])

  // Signature moment (once): the books land when the ledge they land on is in view. If the visitor stops
  // short of that, or has already scrolled past it, they still land — the shelf is never left empty on screen.
  useEffect(() => {
    const stage = stageRef.current!
    let timer = 0
    const go = () => {
      window.clearTimeout(timer)
      io.disconnect()
      shelf.play()
    }
    const io = new IntersectionObserver(
      ([en]) => {
        window.clearTimeout(timer)
        if (!en.isIntersecting) return
        if (en.intersectionRatio >= 0.85 || en.boundingClientRect.top < 0) go()
        else timer = window.setTimeout(go, 1100)
      },
      { threshold: [0.2, 0.5, 0.85] },
    )
    io.observe(stage)
    return () => {
      window.clearTimeout(timer)
      io.disconnect()
    }
  }, [shelf])

  // Test / screenshot hooks.
  useEffect(() => {
    exposeQA({
      library: {
        index: () => shelf.index(),
        count: () => shelf.count(),
        select: (i: number) => shelf.select(i),
        open: () => shelf.open(),
        close: () => shelf.close(),
        state: () => shelf.state(),
        filter: (f: Filter) => shelf.setFilter(f),
        entrance: (p: number) => shelf.seek(p),
        replay: () => shelf.replay(),
        scrub: (p: number) => shelf.scrub(p),
        jump: (i: number) => shelf.jump(i),
      },
    })
  }, [shelf])

  // While a book is open: Escape goes back, the pointer tilts the book, focus moves to "back".
  useEffect(() => {
    if (detail === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && useSiteStore.getState().overlay === null && !useSiteStore.getState().loginOpen) shelf.close()
    }
    const onMove = (e: PointerEvent) => e.pointerType === 'mouse' && shelf.tilt(e.clientX, e.clientY)
    const sec = sectionRef.current!
    window.addEventListener('keydown', onKey)
    sec.addEventListener('pointermove', onMove)
    // Focus moves into the opened view; the "back" control only wears its ring when the book was opened from the keyboard.
    const id = window.setTimeout(() => (shelf.viaKey ? backRef.current : textRef.current)?.focus({ preventScroll: true }), 450)
    return () => {
      window.removeEventListener('keydown', onKey)
      sec.removeEventListener('pointermove', onMove)
      window.clearTimeout(id)
    }
  }, [shelf, detail])

  const close = () => {
    shelf.close()
    stageRef.current?.focus({ preventScroll: true })
  }
  const playGame = () => {
    shelf.close()
    useSiteStore.getState().openGame()
  }

  // Caption: remembers the book it is leaving and which way the shelf travelled, so the lines can slide that way.
  const [cap, setCap] = useState({ cur: READY, prev: -1, dir: 1, seq: 0 })
  if (cap.cur !== sel) setCap({ cur: sel, prev: cap.cur, dir: sel > cap.cur ? 1 : -1, seq: cap.seq + 1 })

  const visible = library.map((b) => filter === 'all' || b.season === filter)
  const list = library.map((_, i) => i).filter((i) => visible[i])
  const pos = list.indexOf(sel)
  const book = library[sel]
  const dBook = library[shown.i]
  const dTitle = dBook.title[locale]
  // The copy breaks the real title by hand (as the hero and the cover do); other titles balance themselves.
  const dSplit = dTitle === `${t.hero.titleA} ${t.hero.titleB}`
  const sameSeason = library.map((b, i) => ({ b, i })).filter(({ b, i }) => b.season === dBook.season && i !== shown.i)
  const m = metrics
  const d = (n: number) => ({ '--d': n }) as CSSProperties

  return (
    <section ref={sectionRef} id="library" className={cn(app ? 'is-app' : 'sheet', 'bg-paper text-ink lib', detail !== null && 'is-detail', waiting && 'is-waiting')} style={grain}>
      <Container className={cn('lib-chrome', app ? 'pt-2' : 'pt-24 lg:pt-28')}>
        <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
          {!app && <SectionHead tone="light" eyebrow={t.library.eyebrow} title={t.library.title} lede={t.library.lede} />}
          <div role="group" aria-label={t.library.eyebrow} className="lib-filters -mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0 lg:shrink-0 lg:overflow-visible lg:pb-1.5">
            {FILTERS.map((f) => (
              <button key={f} type="button" className={cn('lib-chip', filter === f && 'is-on')} aria-pressed={filter === f} data-filter={f} onClick={() => shelf.setFilter(f)}>
                {t.library.filters[f]}
                <span className="lib-chip-n">{num(COUNTS[f])}</span>
              </button>
            ))}
          </div>
        </div>
      </Container>

      <div className="lib-stagewrap mt-2 lg:mt-0">
        <div
          ref={stageRef}
          className="lib-stage"
          role="listbox"
          aria-orientation="horizontal"
          aria-label={t.library.title}
          aria-activedescendant={`lib-book-${book.id}`}
          tabIndex={detail === null ? 0 : -1}
          style={{ perspective: `${m.persp}px`, perspectiveOrigin: `50% ${m.eyeY}px` }}
        >
          <div className="lib-wall" aria-hidden />
          <div ref={wallRef} className="lib-wallshadow" aria-hidden style={{ top: m.floorY - m.S * 0.8, height: m.S * 0.8 }} />
          <div ref={sceneRef} className="lib-scene" role="presentation" style={{ transformOrigin: `50% ${m.floorY}px` }}>
            <div
              ref={plankRef}
              className="lib-plank"
              aria-hidden
              style={{ top: m.floorY, width: m.plankW, height: m.plankFront + m.plankBack, marginLeft: -m.plankW / 2, transform: `translateZ(${-m.plankBack}px) rotateX(90deg)` }}
            >
              {library.map((b, i) => (
                <div
                  key={b.id}
                  ref={(el) => {
                    shadowEls.current[i] = el
                  }}
                  className="lib-shadow"
                  style={{ width: geoms[i].W, height: geoms[i].T }}
                />
              ))}
            </div>
            <div ref={lipRef} className="lib-lip" aria-hidden style={{ top: m.floorY, width: m.plankW, height: m.lip, marginLeft: -m.plankW / 2, transform: `translateZ(${m.plankFront}px)` }} />
            {library.map((b, i) => (
              <Book key={b.id} book={b} g={geoms[i]} m={m} i={i} selected={i === sel} setRef={setBookRef} />
            ))}
          </div>
        </div>
        <button
          ref={openRef}
          type="button"
          className="lib-open"
          aria-label={book.title[locale]}
          tabIndex={detail === null ? 0 : -1}
          style={{ left: `calc(50% + ${Math.round(dirSign * geoms[READY].W * 0.52)}px)`, top: m.floorY + Math.round(m.S * 0.075), '--dir': dirSign } as CSSProperties}
          onClick={(e) => {
            shelf.viaKey = e.detail === 0
            shelf.open()
          }}
        >
          <OpenIcon size={22} strokeWidth={2.2} aria-hidden />
        </button>
      </div>

      <Container className={cn('lib-chrome', app ? 'pb-10 lg:pb-14' : 'pb-20 lg:pb-28')}>
        <div className="lib-caption pt-5 lg:pt-7">
          <div className="mx-auto grid max-w-[44rem] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 sm:gap-8">
            <button type="button" className="lib-arrow" aria-label={t.library.prev} disabled={pos <= 0} onClick={() => shelf.step(-1)}>
              <Arrow />
            </button>
            <div className="lib-cap min-h-[5.5rem] text-center" aria-live="polite" style={{ '--cd': cap.dir } as CSSProperties}>
              {cap.prev >= 0 && <CapBody key={`o${cap.seq}`} book={library[cap.prev]} className="lib-cap-out" hidden />}
              <CapBody key={`i${cap.seq}`} book={book} className={cap.seq ? 'lib-cap-in' : undefined} />
            </div>
            <button type="button" className="lib-arrow" aria-label={t.library.next} disabled={pos < 0 || pos >= list.length - 1} onClick={() => shelf.step(1)}>
              <Arrow next />
            </button>
          </div>
          <p className="mt-5 flex items-center justify-center gap-3 text-[13.5px] text-ink-2/80">
            <span className="tabular-nums text-ink-2">
              {num(pos + 1)} / {num(list.length)}
            </span>
            <span className="h-3 w-px bg-ink/20" aria-hidden />
            <span>{t.library.hint}</span>
          </p>
        </div>
      </Container>

      <div ref={detailRef} className={cn('lib-detail', detail !== null && 'is-open', !dBook.ready && 'is-soon')} aria-hidden={detail === null} inert={detail === null}>
        <Container>
          <div ref={panelRef} className="lib-detail-grid">
            <div className="lib-detail-slotwrap">
              <div ref={slotRef} className="lib-detail-slot" />
              <span className="lib-detail-shadow" aria-hidden />
            </div>
            <div ref={textRef} className="lib-detail-text" tabIndex={-1}>
              {!dBook.ready && <span className="lib-ghost" aria-hidden style={{ maskImage: emblemMask(dBook.emblem), WebkitMaskImage: emblemMask(dBook.emblem) }} />}
              <button ref={backRef} type="button" className="lib-return" data-d style={d(0)} onClick={close}>
                <span>
                  <Arrow />
                </span>
                <b>{t.library.back}</b>
              </button>
              <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 lg:mt-9" data-d style={d(1)}>
                <span className="t-label inline-flex items-center gap-2.5 text-ink-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-maple" aria-hidden />
                  {t.library.filters[dBook.season]}
                </span>
                {dBook.ready && (
                  <>
                    <span className="h-3 w-px bg-ink/20" aria-hidden />
                    <span className="text-[14px] font-semibold text-ink-2">{t.library.ready}</span>
                  </>
                )}
              </p>
              <h3 key={`${dBook.id}-${shown.seq}`} className="lib-detail-title mt-3 lg:mt-4">
                {dSplit ? (
                  <>
                    <BlurWords text={t.hero.titleA} immediate={detail !== null} delay={260} className="block" />
                    <BlurWords text={t.hero.titleB} immediate={detail !== null} delay={440} className="lib-detail-titleb block" />
                  </>
                ) : (
                  <BlurWords text={dTitle} immediate={detail !== null} delay={260} className="block" />
                )}
              </h3>
              {dBook.ready ? (
                <>
                  <p className="mt-4 flex flex-wrap gap-x-2.5 gap-y-0.5 text-[14.5px] font-medium text-ink-2/80 lg:mt-5" data-d style={d(3)}>
                    <span>{t.library.meta}</span>
                    <span className="opacity-50 max-sm:hidden" aria-hidden>
                      ·
                    </span>
                    <span>{t.library.by}</span>
                  </p>
                  {dBook.blurb && (
                    <p className="t-lede mt-4 max-w-[34rem] text-ink-2 lg:mt-5" data-d style={d(4)}>
                      {dBook.blurb[locale]}
                    </p>
                  )}
                  <div className="mt-5 grid grid-cols-2 gap-2.5 sm:mt-7 sm:flex sm:flex-wrap sm:gap-3 lg:mt-9" data-d style={d(5)}>
                    <Pill variant="ink" size="lg" className="col-span-2" data-act="read" onClick={() => useSiteStore.getState().openBook(0)}>
                      <BookOpen size={19} aria-hidden />
                      {t.library.read}
                    </Pill>
                    <Pill variant="outline" size="lg" className="whitespace-nowrap px-3 max-sm:gap-2 max-sm:text-[14.5px] sm:px-6" data-act="watch" onClick={() => useSiteStore.getState().openFilm(0)}>
                      <Play size={17} fill="currentColor" className="shrink-0" aria-hidden />
                      {t.library.watch}
                    </Pill>
                    <Pill variant="outline" size="lg" className="whitespace-nowrap px-3 max-sm:gap-2 max-sm:text-[14.5px] sm:px-6" data-act="play" onClick={playGame}>
                      <Gamepad2 size={19} className="shrink-0" aria-hidden />
                      {t.library.play}
                    </Pill>
                    <Pill variant="outline" size="md" className="lib-quiet col-span-2 whitespace-nowrap max-sm:h-11" data-act="page" onClick={() => enterApp('story')}>
                      {t.app.home.open}
                      <OpenIcon size={17} strokeWidth={2.2} className="shrink-0" aria-hidden />
                    </Pill>
                  </div>
                </>
              ) : (
                <>
                  <p className="mt-6 lg:mt-8" data-d style={d(3)}>
                    <span className="lib-status is-soon inline-flex h-11 items-center rounded-full bg-ink/[0.06] px-5 text-[15px] font-semibold text-ink-2" data-soon>
                      <i aria-hidden />
                      {t.library.soon}
                    </span>
                  </p>
                  {dBook.blurb && (
                    <p className="t-lede mt-4 max-w-[34rem] text-ink-2 lg:mt-5" data-d style={d(4)}>
                      {dBook.blurb[locale]}
                    </p>
                  )}
                  <p className="mt-3 max-w-[30rem] text-[14px] font-medium text-ink-2/75" data-d style={d(4)} data-idea>
                    {t.library.soonNote}
                  </p>
                  {dBook.filmScene && (
                    <p className="mt-5 lg:mt-7" data-d style={d(5)}>
                      <Pill variant="ink" size="lg" className="max-sm:w-full" data-act="moon" onClick={() => useSiteStore.getState().openMoon()}>
                        <Play size={17} fill="currentColor" className="shrink-0" aria-hidden />
                        {t.ui.moon.watch}
                      </Pill>
                    </p>
                  )}
                  {sameSeason.length > 0 && (
                    <div className="mt-7 border-t border-ink/10 pt-5 lg:mt-10 lg:pt-6" data-d style={d(5)}>
                      <p className="flex items-center gap-2.5 text-[13.5px] font-semibold text-ink-2">
                        {t.library.filters[dBook.season]}
                        <span className="h-3 w-px bg-ink/20" aria-hidden />
                        <span className="tabular-nums font-medium opacity-70">{num(sameSeason.length + 1)}</span>
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2.5">
                        {sameSeason.map(({ b, i }) => (
                          <button key={b.id} type="button" className="lib-mini" data-jump={i} style={foilVars(b)} onClick={() => shelf.jump(i)}>
                            <span className="lib-mini-spine" aria-hidden>
                              <Emblem name={b.emblem} />
                            </span>
                            <span className="lib-mini-t">{b.title[locale]}</span>
                            {b.ready && <i className="lib-mini-ready" aria-label={t.library.ready} role="img" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </Container>
      </div>
    </section>
  )
}
