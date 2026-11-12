import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { prefersReducedNow } from '@/app/useMotionTier'
import { story } from '@/content/story'
import { BlurWords, Container, Eyebrow, Reveal, useInView, useOnScreen } from '@/design/ui'
import type { QuietFilmHandle } from '@/features/footer/QuietFilm'
import { t } from '@/i18n/copy'
import { locale } from '@/i18n/locale'
import { clamp } from '@/lib/clamp'
import { cn } from '@/lib/cn'
import { exposeQA } from '@/lib/qa'
import { useSiteStore } from '@/store/useSiteStore'
import { LyingBook, type BookHandle } from './Book'
import { CtaCard } from './CtaCard'
import './author.css'

/** The headline is broken by hand: its last two words make the second, quieter line. */
const TITLE = t.author.title.split(' ')
const LINE_A = TITLE.slice(0, Math.max(1, TITLE.length - 2)).join(' ')
const LINE_B = TITLE.slice(Math.max(1, TITLE.length - 2)).join(' ')
const WORDS = t.author.text.split(' ')
/** How many words are "being read" at once while the paragraph lights up. */
const SPREAD = 7
const DIM = 0.24

/**
 * The author's page: her book lying on a sheet of paper, beside the few words about her (exactly the copy — nothing
 * is added about who she is). The paragraph lights up word by word at reading pace as the page moves; the signature
 * is drawn with one stroke. Then the invitation: the falling leaves behind dark glass.
 * The sheet has rounded shoulders above and below: it slides over the night and lifts off the last film of the page.
 */
export function Author() {
  const para = useRef<HTMLParagraphElement>(null)
  const sign = useRef<HTMLDivElement>(null)
  const book = useRef<BookHandle>(null)
  const film = useRef<QuietFilmHandle>(null)
  const lit = useRef(1)
  const reduced = useSiteStore((s) => s.tier === 'reduced')
  const paraOn = useOnScreen(para, '0px')
  const signSeen = useInView(sign, '0px 0px -10% 0px')
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    if (!prefersReducedNow()) setArmed(true)
  }, [])

  // The paragraph is read at scroll pace: words go from a whisper to full ink as it crosses the lower half of the screen.
  // Opacity only, computed from where the paragraph is right now (never from a cached position).
  useEffect(() => {
    const p = para.current
    if (!p) return
    const words = Array.from(p.querySelectorAll<HTMLElement>('.au-w'))
    const paint = (k: number) => {
      lit.current = k
      const head = k * (words.length + SPREAD)
      words.forEach((w, i) => (w.style.opacity = (DIM + (1 - DIM) * clamp((head - i) / SPREAD, 0, 1)).toFixed(3)))
    }
    if (reduced) {
      lit.current = 1
      words.forEach((w) => (w.style.opacity = ''))
      return
    }
    if (!paraOn) return
    let last = -1
    const tick = () => {
      const r = p.getBoundingClientRect()
      const vh = window.innerHeight
      const k = clamp((vh * 0.9 - r.top) / (vh * 0.42), 0, 1)
      if (Math.abs(k - last) < 0.002) return
      last = k
      paint(k)
    }
    tick()
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [paraOn, reduced])

  useEffect(() => {
    exposeQA({
      author: {
        state: () => ({
          book: { landed: book.current?.landed() ?? false, pose: book.current?.pose() ?? null },
          film: { armed: film.current?.armed() ?? false, playing: film.current?.playing() ?? false, live: film.current?.live() ?? false },
          lit: lit.current,
          signed: !!sign.current?.classList.contains('is-in') || !sign.current?.classList.contains('is-armed'),
        }),
        point: (x: number, y: number) => book.current?.point(x, y),
      },
    })
  }, [])

  return (
    <section id="author" className="au sheet bg-paper text-ink">
      <span className="au-paper" aria-hidden />
      <Container className="au-wrap">
        <div className="au-grid">
          <div className="au-copy">
            <Reveal>
              <Eyebrow tone="light">{t.author.eyebrow}</Eyebrow>
            </Reveal>
            <h2 className="au-title">
              <BlurWords text={LINE_A} className="au-title__a" />
              <BlurWords text={LINE_B} className="au-title__b" delay={200} />
            </h2>
            <p ref={para} className="au-text">
              {WORDS.map((w, i) => (
                <span key={i}>
                  <span className="au-w">{w}</span>{' '}
                </span>
              ))}
            </p>
            <div ref={sign} className={cn('au-sign', armed && 'is-armed', armed && signSeen && 'is-in')}>
              <span className="au-sign__swash" aria-hidden>
                <span>
                  <svg viewBox="0 0 132 30" fill="none" className="flip-rtl">
                    <path d="M3 21c9-11 19-17 24-13 5 5-9 17-12 12-3-6 14-14 30-11 14 3 20 9 36 8 15-1 26-8 48-9" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </span>
              <span className="au-sign__by">{t.author.sign}</span>
            </div>
          </div>

          <div className="au-stage">
            <span className="au-ghost" aria-hidden>
              {t.author.eyebrow}
            </span>
            <LyingBook ref={book} />
            <Reveal className="au-caption" delay={500}>
              <span className="au-caption__k">
                <i aria-hidden />
                {story.kicker[locale]}
              </span>
              <span className="au-caption__m">{t.library.meta}</span>
            </Reveal>
          </div>
        </div>

        <CtaCard ref={film} />
      </Container>
    </section>
  )
}
