import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, Gamepad2, Play } from 'lucide-react'
import { prefersReducedNow } from '@/app/useMotionTier'
import { library } from '@/content/library'
import { BlurWords, Container, Pill, SectionHead, useOnScreen } from '@/design/ui'
import { t } from '@/i18n/copy'
import { locale, num, rtl } from '@/i18n/locale'
import { cn } from '@/lib/cn'
import { exposeQA } from '@/lib/qa'
import { useSiteStore } from '@/store/useSiteStore'
import { Book } from './Book'
import { READY, Shelf, type Filter } from './controller'
import { computeGeoms, computeMetrics, type Metrics } from './engine'
import './library.css'

const FILTERS: Filter[] = ['all', 'autumn', 'winter', 'spring', 'summer']
const COUNTS = Object.fromEntries(FILTERS.map((f) => [f, library.filter((b) => f === 'all' || b.season === f).length])) as Record<Filter, number>

/** First guess of the stage box (same clamps as library.css) so the first paint is already the right size. */
function guessMetrics(): Metrics {
  const w = typeof window === 'undefined' ? 1440 : window.innerWidth
  const h = typeof window === 'undefined' ? 900 : window.innerHeight
  const stageH = w < 640 ? Math.min(460, Math.max(410, h * 0.52)) : Math.min(640, Math.max(460, h * 0.64))
  return computeMetrics(w, Math.round(stageH))
}

/** Arrow that points toward the previous / next book whatever the reading direction. */
function Arrow({ next }: { next?: boolean }) {
  const Icon = next !== rtl ? ArrowRight : ArrowLeft
  return <Icon size={22} strokeWidth={2} aria-hidden />
}

/**
 * The shelf of moving books: a row of real (CSS-3D) books on a ledge. They land and shuffle when the
 * shelf scrolls into view; the centred one steps out and turns its cover to you; drag, wheel, arrows
 * and keys move along the row; clicking the cover flies it aside and opens its detail view.
 */
export function Library() {
  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<HTMLDivElement>(null)
  const plankRef = useRef<HTMLDivElement>(null)
  const lipRef = useRef<HTMLDivElement>(null)
  const slotRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const backRef = useRef<HTMLButtonElement>(null)
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
  const onScreen = useOnScreen(stageRef, '160px 0px')

  const shelfRef = useRef<Shelf | null>(null)
  if (!shelfRef.current) {
    shelfRef.current = new Shelf(metrics, {
      onSel: setSel,
      onDetail: (i) => {
        setDetail(i)
        if (i !== null) setShown((s) => ({ i, seq: s.seq + 1 }))
      },
      onLanded: () => setWaiting(false),
      onFilter: setFilter,
      onCover: (i) => library[i].ready && useSiteStore.getState().openBook(0),
    })
  }
  const shelf = shelfRef.current

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
      slot: slotRef.current!,
      panel: panelRef.current!,
      books: bookEls.current,
      shadows: shadowEls.current,
    })
    if (!prefersReducedNow() && shelf.landed && !armed.current) {
      armed.current = true
      shelf.arm()
    }
    return () => shelf.detach()
  }, [shelf])
  const armed = useRef(false)

  // Measure the stage; every size in the scene derives from it.
  useLayoutEffect(() => {
    const stage = stageRef.current!
    const measure = () => {
      const w = stage.clientWidth
      const h = stage.clientHeight
      if (w && h) setMetrics((prev) => (prev.stageW === w && prev.stageH === h ? prev : computeMetrics(w, h)))
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

  useEffect(() => shelf.setReduced(reduced), [shelf, reduced])
  useEffect(() => shelf.setOnScreen(onScreen), [shelf, onScreen])

  // Signature moment: the books land when a good part of the shelf is in view (once).
  useEffect(() => {
    const stage = stageRef.current!
    const io = new IntersectionObserver(
      ([en]) => {
        if (!en.isIntersecting) return
        io.disconnect()
        shelf.play()
      },
      { threshold: 0.4 },
    )
    io.observe(stage)
    return () => io.disconnect()
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
    const id = window.setTimeout(() => backRef.current?.focus({ preventScroll: true }), 450)
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
    if (document.getElementById('game')) useSiteStore.getState().lenis?.scrollTo('#game', { offset: -80 })
  }

  const visible = library.map((b) => filter === 'all' || b.season === filter)
  const list = library.map((_, i) => i).filter((i) => visible[i])
  const pos = list.indexOf(sel)
  const book = library[sel]
  const dBook = library[shown.i]
  const m = metrics
  const d = (n: number) => ({ '--d': n }) as CSSProperties

  return (
    <section ref={sectionRef} id="library" className={cn('sheet bg-paper text-ink lib', detail !== null && 'is-detail', waiting && 'is-waiting')}>
      <span className="lib-ghost" aria-hidden>
        {t.library.filters[dBook.season]}
      </span>

      <Container className="lib-chrome pt-24 lg:pt-28">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
          <SectionHead tone="light" eyebrow={t.library.eyebrow} title={t.library.title} lede={t.library.lede} />
          <div role="group" aria-label={t.library.eyebrow} className="lib-filters -mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0 lg:pb-1.5">
            {FILTERS.map((f) => (
              <button key={f} type="button" className={cn('lib-chip', filter === f && 'is-on')} aria-pressed={filter === f} data-filter={f} onClick={() => shelf.setFilter(f)}>
                {t.library.filters[f]}
                <span className="lib-chip-n">{num(COUNTS[f])}</span>
              </button>
            ))}
          </div>
        </div>
      </Container>

      <div
        ref={stageRef}
        className="lib-stage mt-2 lg:mt-0"
        role="listbox"
        aria-orientation="horizontal"
        aria-label={t.library.title}
        aria-activedescendant={`lib-book-${book.id}`}
        tabIndex={detail === null ? 0 : -1}
        style={{ perspective: `${m.persp}px`, perspectiveOrigin: `50% ${m.eyeY}px` }}
      >
        <div className="lib-wall" aria-hidden />
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

      <Container className="lib-chrome pb-20 lg:pb-28">
        <div className="lib-caption">
          <div className="mx-auto grid max-w-[44rem] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 sm:gap-8">
            <button type="button" className="lib-arrow" aria-label={t.library.prev} disabled={pos <= 0} onClick={() => shelf.step(-1)}>
              <Arrow />
            </button>
            <div className="min-h-[5.5rem] text-center" aria-live="polite">
              <div key={book.id} className="lib-cap-in">
                <h3 className="text-balance text-[clamp(1.35rem,2.5vw,2.1rem)] font-extrabold leading-[1.25] tracking-[-0.02em]">{book.title[locale]}</h3>
                <p className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[14.5px] font-medium text-muted">
                  <span>{t.library.filters[book.season]}</span>
                  <span className="h-1 w-1 rounded-full bg-current opacity-50" aria-hidden />
                  <span className={cn('lib-status', book.ready ? 'font-semibold text-maple' : 'is-soon')}>
                    <i aria-hidden />
                    {book.ready ? t.library.ready : t.library.soon}
                  </span>
                </p>
              </div>
            </div>
            <button type="button" className="lib-arrow" aria-label={t.library.next} disabled={pos < 0 || pos >= list.length - 1} onClick={() => shelf.step(1)}>
              <Arrow next />
            </button>
          </div>
          <p className="mt-5 flex items-center justify-center gap-3 text-[13.5px] text-muted">
            <span className="tabular-nums text-ink-2">
              {num(pos + 1)} / {num(list.length)}
            </span>
            <span className="h-3 w-px bg-ink/20" aria-hidden />
            <span>{t.library.hint}</span>
          </p>
        </div>
      </Container>

      <div className={cn('lib-detail', detail !== null && 'is-open')} aria-hidden={detail === null} inert={detail === null}>
        <Container>
          <div ref={panelRef} className="lib-detail-grid">
            <div className="lib-detail-slotwrap">
              <div ref={slotRef} className="lib-detail-slot" />
              <span className="lib-detail-shadow" aria-hidden />
            </div>
            <div className="lib-detail-text">
              <button ref={backRef} type="button" className="lib-back" data-d style={d(0)} onClick={close}>
                <span>
                  <Arrow />
                </span>
                {t.library.back}
              </button>
              <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 lg:mt-9" data-d style={d(1)}>
                <span className="t-label text-maple">{t.library.filters[dBook.season]}</span>
                <span className="h-1 w-1 rounded-full bg-ink/30" aria-hidden />
                <span className={cn('lib-status text-[14px] font-semibold', dBook.ready ? 'text-ink-2' : 'is-soon text-muted')}>
                  <i aria-hidden />
                  {dBook.ready ? t.library.ready : t.library.soon}
                </span>
              </p>
              <BlurWords key={`${dBook.id}-${shown.seq}`} as="h3" text={dBook.title[locale]} immediate={detail !== null} delay={260} className="lib-detail-title mt-3 block lg:mt-4" />
              {dBook.ready ? (
                <>
                  <p className="mt-4 text-[14.5px] font-medium text-muted lg:mt-5" data-d style={d(3)}>
                    {t.library.meta}
                    <span className="mx-2.5 opacity-50" aria-hidden>
                      ·
                    </span>
                    {t.library.by}
                  </p>
                  {dBook.blurb && (
                    <p className="t-lede mt-4 max-w-[34rem] text-ink-2 lg:mt-5" data-d style={d(4)}>
                      {dBook.blurb[locale]}
                    </p>
                  )}
                  <div className="mt-7 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap lg:mt-9" data-d style={d(5)}>
                    <Pill variant="ink" size="lg" className="col-span-2" data-act="read" onClick={() => useSiteStore.getState().openBook(0)}>
                      <BookOpen size={19} aria-hidden />
                      {t.library.read}
                    </Pill>
                    <Pill variant="outline" size="lg" className="px-5" data-act="watch" onClick={() => useSiteStore.getState().openFilm(0)}>
                      <Play size={17} fill="currentColor" aria-hidden />
                      {t.library.watch}
                    </Pill>
                    <Pill variant="outline" size="lg" className="px-5" data-act="play" onClick={playGame}>
                      <Gamepad2 size={19} aria-hidden />
                      {t.library.play}
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
                  <p className="t-lede mt-4 max-w-[30rem] text-ink-2 lg:mt-5" data-d style={d(4)}>
                    {t.library.soonNote}
                  </p>
                </>
              )}
            </div>
          </div>
        </Container>
      </div>
    </section>
  )
}
