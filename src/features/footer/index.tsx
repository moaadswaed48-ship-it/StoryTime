import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react'
import gsap from 'gsap'
import { ArrowRight, ArrowUp, Play } from 'lucide-react'
import { enterApp } from '@/app/router'
import { prefersReducedNow, writeReduceToggle } from '@/app/useMotionTier'
import { story } from '@/content/story'
import { BlurWords, Container, Pill, Reveal, useInView, useOnScreen } from '@/design/ui'
import { t } from '@/i18n/copy'
import { locale } from '@/i18n/locale'
import { clamp } from '@/lib/clamp'
import { cn } from '@/lib/cn'
import { exposeQA } from '@/lib/qa'
import { useSiteStore } from '@/store/useSiteStore'
import { QuietFilm, type QuietFilmHandle } from './QuietFilm'
import './footer.css'

/** The last scene of the story: the birds leaving at sunset. */
const LAST = story.scenes[11]
/** Same destinations as the bar at the top of the page. `film` opens the player instead of scrolling. */
const LINKS = [
  { id: 'library', label: t.nav.library },
  { id: 'film', label: t.nav.film },
  { id: 'parents', label: t.nav.parents },
  { id: 'pricing', label: t.nav.pricing },
] as const

/** Tallest the wordmark's type may be, as a share of the screen's height (landscape screens only). Arabic stands
 *  taller on its line (dots above, tails below), so it stops a little earlier; on very short screens both stop sooner. */
const MAX_WORD = locale === 'ar' ? 0.27 : 0.3
const MAX_WORD_SHORT = 0.2
/** The film rests this long on its last frame — the open sky, where the line of text stands clear — before it starts again. */
const HOLD = 9
/** While the paper lifts off, the film underneath moves this much slower (share of its own height). */
const UNDER = 14
/** …and it rises while the last lines slide over it, so the line of text always stands on calm sky. The clip is a
 *  crane-up from the children to the birds, so the right amount changes as it plays: little (RISE_MIN) while the
 *  children are in the frame — they stay down in the dusk, below the line — and, by the resting frame, as much as it
 *  takes (up to RISE_MAX) for the point of the flock to fly clear above the line. Never faster than a share of the
 *  page's own travel, so on screens with little travel it does not rush. */
const RISE_MIN = 6
const RISE_MAX = 26
const RISE_PACE = 0.6
/** Where the point of the flock's V is when the clip comes to rest, as a share of the frame's height. */
const FLOCK_Y = 0.492
/** The clip's shape. */
const FRAME = 16 / 9

function scrollToSection(id: string) {
  const { lenis, tier } = useSiteStore.getState()
  const el = document.getElementById(id)
  if (!el) return
  if (lenis) lenis.scrollTo(el, { offset: -80, immediate: tier === 'reduced', force: true })
  else el.scrollIntoView()
}
function scrollToTop() {
  const { lenis, tier } = useSiteStore.getState()
  if (lenis) lenis.scrollTo(0, { immediate: tier === 'reduced', force: true, duration: 1.6 })
  else window.scrollTo(0, 0)
}

/**
 * The close of the page. The paper lifts off the last picture of the story — the birds leaving at sunset — which
 * stays pinned (CSS sticky) while the night rises over it, carrying one line of the story, the links, the fine
 * print and the wordmark, set as wide as the page and sinking off its bottom edge.
 * The film plays only on screen, rests on its last frame and dissolves back to its first. Reduced motion: the still.
 */
export function Footer() {
  const root = useRef<HTMLElement>(null)
  const layer = useRef<HTMLDivElement>(null)
  const quote = useRef<HTMLDivElement>(null)
  const wordBox = useRef<HTMLDivElement>(null)
  const word = useRef<HTMLSpanElement>(null)
  const film = useRef<QuietFilmHandle>(null)
  const reduced = useSiteStore((s) => s.tier === 'reduced')
  const reduceToggle = useSiteStore((s) => s.reduceToggle)
  const setReduceToggle = useSiteStore((s) => s.setReduceToggle)
  const openFilm = useSiteStore((s) => s.openFilm)
  const on = useOnScreen(root, '0px')
  const wordSeen = useInView(wordBox, '0px 0px -4% 0px')
  const [armed, setArmed] = useState(false)
  const [uncovered, setUncovered] = useState(false)
  // The system itself asks for less motion: the switch cannot give it back, so it shows "on" and is locked.
  const [osReduced, setOsReduced] = useState(false)
  const locked = osReduced && !reduceToggle

  useEffect(() => {
    if (!prefersReducedNow()) setArmed(true)
  }, [])
  useEffect(() => {
    if (on) setUncovered(true)
  }, [on])
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const read = () => setOsReduced(mq.matches)
    read()
    mq.addEventListener('change', read)
    return () => mq.removeEventListener('change', read)
  }, [])

  // The film sits under the page: it lags while the paper lifts off it and rises a little under the last lines.
  // Transform only, written straight from the scroll position (Lenis has already smoothed it); runs on screen only.
  useEffect(() => {
    const el = root.current
    const plate = layer.current
    if (!el || !plate) return
    if (!on || reduced) {
      plate.style.transform = ''
      return
    }
    let shown = film.current?.progress() ?? 0
    const tick = (_time: number, dt: number) => {
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight
      const travel = Math.max(1, r.height - vh)
      const under = clamp(r.top / vh, 0, 1)
      const over = clamp(-r.top / travel, 0, 1)
      // Where things will be when the page has ended: the point of the flock in the pinned picture (cover-fitted,
      // centred), and the top of the line of text. The picture rises by the difference, plus some air.
      const h = Math.max(1, plate.offsetHeight)
      const pic = Math.max(h, plate.offsetWidth / FRAME)
      const flock = (h - pic) / 2 + FLOCK_Y * pic
      const lineTop = quote.current ? vh - r.height + (quote.current.getBoundingClientRect().top - r.top) : vh
      const need = ((flock - (lineTop - Math.max(48, vh * 0.06))) / h) * 100
      const top = Math.min(clamp(need, RISE_MIN, RISE_MAX), ((travel * RISE_PACE) / h) * 100)
      const base = Math.min(RISE_MIN, top)
      // follow the clip (and the dissolve back to its first frame) softly
      shown += ((film.current?.progress() ?? 0) - shown) * (1 - Math.exp((-Math.min(dt || 16, 100) / 1000) * 3.2))
      const rise = base + (top - base) * shown * shown * (3 - 2 * shown)
      plate.style.transform = `translate3d(0, ${(-under * UNDER - over * rise).toFixed(3)}%, 0)`
    }
    tick(0, 16)
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [on, reduced])

  // The wordmark is set exactly as wide as the page between its gutters (measured, never letter-spaced).
  useLayoutEffect(() => {
    const box = wordBox.current
    const w = word.current
    if (!box || !w) return
    let last = 0
    let raf = 0
    let alive = true
    const fit = (force = false) => {
      const width = box.clientWidth
      if (!width || (!force && Math.abs(width - last) < 0.5)) return
      last = width
      // Width grows in step with the font size, so one ratio is exact. Read both as they are now: writing a size and
      // reading it back in the same task is not safe (a global reduced-motion rule turns every change into a tiny transition).
      const size = parseFloat(getComputedStyle(box).fontSize)
      const now = w.getBoundingClientRect().width
      if (!(size > 0 && now > 0)) return
      // On landscape screens the word stops growing before it would push the film off the screen (it stays centred).
      const wide = (size * width) / now
      const vh = window.innerHeight
      const next = window.innerWidth > vh ? Math.min(wide, vh * (vh < 500 ? MAX_WORD_SHORT : MAX_WORD)) : wide
      if (Math.abs(next - size) > 0.05) box.style.fontSize = `${next.toFixed(2)}px`
    }
    const refit = () => {
      if (!alive) return
      fit(true)
      // once more after the frame, in case the first reading was taken mid-change
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => alive && fit(true))
    }
    refit()
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => fit())
    })
    ro.observe(box)
    window.addEventListener('resize', refit)
    // Measure again once the display face has really arrived (the first measure may have used a fallback).
    const fonts = document.fonts
    fonts?.ready.then(refit)
    fonts?.load(`900 200px 'Rubik Variable'`, t.brand).then(refit, () => {})
    fonts?.addEventListener?.('loadingdone', refit)
    return () => {
      alive = false
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('resize', refit)
      fonts?.removeEventListener?.('loadingdone', refit)
    }
  }, [])

  const toggleMotion = useCallback(() => {
    const now = useSiteStore.getState().reduceToggle
    // nothing to give back while the system setting is on (turning our own switch off is still allowed)
    if (!now && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const next = !now
    writeReduceToggle(next)
    setReduceToggle(next)
  }, [setReduceToggle])

  useEffect(() => {
    exposeQA({
      footer: {
        state: () => ({
          film: { armed: film.current?.armed() ?? false, playing: film.current?.playing() ?? false, live: film.current?.live() ?? false, loops: film.current?.loops() ?? 0 },
          reduced: useSiteStore.getState().tier === 'reduced',
          toggle: useSiteStore.getState().reduceToggle,
          locked: !useSiteStore.getState().reduceToggle && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
          wordWidth: word.current?.getBoundingClientRect().width ?? 0,
          boxWidth: wordBox.current?.clientWidth ?? 0,
        }),
        toggleMotion,
        top: scrollToTop,
      },
    })
  }, [toggleMotion])

  const follow = (id: string) => (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation() // Lenis' own anchor handler would scroll without the offset
    if (id === 'film') openFilm()
    else scrollToSection(id)
  }

  return (
    <footer ref={root} id="footer" className="ft" data-seen={uncovered ? '' : undefined}>
      <div className="ft-stage grain" aria-hidden>
        <div ref={layer} className="ft-film">
          <QuietFilm ref={film} clip={LAST.clip!} poster={LAST.img} posterSm={LAST.thumb} sizes="100vw" hold={HOLD} />
        </div>
      </div>

      <div className="ft-body">
        <Container className="ft-wrap">
          <div ref={quote} className="ft-quote">
            <BlurWords as="p" text={t.footer.line} className="ft-line font-story" />
            <Reveal delay={420}>
              <p className="ft-from">
                <i aria-hidden />
                {story.title[locale]}
              </p>
            </Reveal>
          </div>

          {/* links, tools and fine print arrive as one block */}
          <Reveal className="ft-foot" delay={120}>
            <div className="ft-bar">
              <nav className="ft-links" aria-label={t.nav.menu}>
                {LINKS.map((l) =>
                  l.id === 'film' ? (
                    <button key={l.id} type="button" className="ft-link" data-link={l.id} onClick={follow(l.id)}>
                      <Play size={10} fill="currentColor" strokeWidth={0} aria-hidden />
                      <span>{l.label}</span>
                    </button>
                  ) : (
                    <a key={l.id} href={`#${l.id}`} className="ft-link" data-link={l.id} onClick={follow(l.id)}>
                      <span>{l.label}</span>
                    </a>
                  ),
                )}
              </nav>
              <div className="ft-tools">
                <button
                  type="button"
                  role="switch"
                  aria-checked={reduceToggle || reduced}
                  aria-disabled={locked || undefined}
                  className="ft-switch"
                  data-on={reduceToggle || reduced ? '' : undefined}
                  data-locked={locked ? '' : undefined}
                  onClick={toggleMotion}
                >
                  <span className="ft-switch__track" aria-hidden>
                    <span className="ft-switch__thumb" />
                  </span>
                  <span>{t.footer.motion}</span>
                </button>
                <button type="button" className="ft-top" onClick={scrollToTop}>
                  <span className="ft-top__disc glass" aria-hidden>
                    <ArrowUp size={17} strokeWidth={2.2} />
                  </span>
                  <span>{t.footer.top}</span>
                </button>
              </div>
              <Pill variant="solid" size="md" className="ft-enter" onClick={() => enterApp()}>
                {t.app.enter}
                <ArrowRight size={16} strokeWidth={2.4} className="ft-enter__arrow flip-rtl" aria-hidden />
              </Pill>
            </div>
            <div className="ft-fine">
              <p className="ft-legal">{t.footer.legal}</p>
              <p className="ft-note">{t.footer.note}</p>
            </div>
          </Reveal>
        </Container>

        <div ref={wordBox} className={cn('ft-word', armed && 'is-armed', armed && wordSeen && 'is-in')} aria-hidden>
          <span ref={word}>{t.brand}</span>
        </div>
      </div>
    </footer>
  )
}
