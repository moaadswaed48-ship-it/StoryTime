import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { enterApp } from '@/app/router'
import { prefersReducedNow } from '@/app/useMotionTier'
import { Container, Pill, Reveal, SectionHead } from '@/design/ui'
import { t } from '@/i18n/copy'
import { dirSign, locale, num, rtl } from '@/i18n/locale'
import { asset } from '@/lib/asset'
import { clamp } from '@/lib/clamp'
import { cn } from '@/lib/cn'
import { exposeQA } from '@/lib/qa'
import { useSiteStore } from '@/store/useSiteStore'
import './tour.css'

/**
 * Real screens of the app, captured from the running app by `scripts/qa/tour-shots.mjs`
 * (390×844 at 2×, one set per language) — in the order of `t.tour.steps`.
 */
const SHOTS = ['home', 'story', 'reader', 'tree'] as const
const N = SHOTS.length
const src = (name: (typeof SHOTS)[number]) => asset(`app/shots/${name}-${locale}.webp`)
const Arrow = rtl ? ArrowLeft : ArrowRight

/**
 * Each screen holds still for a while, then the deck glides to the next one:
 * the scrubbed value p (0 → N−1) becomes steps with smooth risers.
 */
function stair(p: number) {
  const i = Math.floor(p)
  const s = clamp((p - i - 0.24) / 0.52, 0, 1)
  return i + s * s * (3 - 2 * s)
}

/** One phone: a thin, quiet frame drawn in CSS around a real screenshot. */
function Phone({ i, className }: { i: number; className?: string }) {
  const step = t.tour.steps[i]
  return (
    <figure className={cn('tour-phone', className)} data-shot={SHOTS[i]}>
      <div className="tour-phone__screen">
        <img src={src(SHOTS[i])} alt={`${t.tour.shot}: ${step.t}`} width={780} height={1688} loading="lazy" decoding="async" draggable={false} />
        <span className="tour-phone__dim" aria-hidden />
      </div>
    </figure>
  )
}

function Caption({ i, active, onPick }: { i: number; active?: boolean; onPick?: () => void }) {
  const step = t.tour.steps[i]
  const body = (
    <>
      <span className="tour-cap__n" aria-hidden>
        {num(i + 1)}
      </span>
      <span className="tour-cap__text">
        <span className="tour-cap__t">{step.t}</span>
        <span className="tour-cap__s">{step.s}</span>
      </span>
    </>
  )
  return onPick ? (
    <button type="button" className="tour-cap" data-step={i} data-active={active ? '' : undefined} aria-current={active ? 'step' : undefined} onClick={onPick}>
      {body}
    </button>
  ) : (
    <div className="tour-cap" data-step={i} data-active="">
      {body}
    </div>
  )
}

function Enter() {
  return (
    <div className="tour-enter">
      <Pill variant="solid" size="lg" className="tour-enter__pill" data-tour-enter onClick={() => enterApp()}>
        {t.app.enter}
        <Arrow className="tour-enter__arrow h-5 w-5" aria-hidden />
      </Pill>
      <p className="tour-enter__sub">{t.app.enterSub}</p>
    </div>
  )
}

/**
 * Inside StoryTime: the landing page's proof that the app is real.
 * Motion: a tall track with a CSS-sticky stage; ScrollTrigger scrubs the deck of phones from one screen to the next
 * (no GSAP pin). Rest state (reduced motion, before scripts run): the four phones side by side, every caption visible.
 */
export function Tour() {
  const tier = useSiteStore((s) => s.tier)
  const [mode, setMode] = useState<'rest' | 'scrub'>('rest')
  const [active, setActive] = useState(0)
  const track = useRef<HTMLDivElement>(null)
  const deck = useRef<HTMLDivElement>(null)
  const activeRef = useRef(0)
  const trigger = useRef<ScrollTrigger | null>(null)

  useEffect(() => {
    setMode(tier === 'reduced' || prefersReducedNow() ? 'rest' : 'scrub')
  }, [tier])

  useGSAP(
    () => {
      if (mode !== 'scrub' || !track.current || !deck.current) return
      const phones = gsap.utils.toArray<HTMLElement>('.tour-phone', deck.current)
      const dims = phones.map((p) => p.querySelector<HTMLElement>('.tour-phone__dim'))
      const proxy = { p: 0 }
      const apply = () => {
        const q = stair(proxy.p)
        phones.forEach((el, i) => {
          const r = i - q
          // next screens wait in a fanned queue toward the end side; the one just seen slides back toward the start and fades
          const ahead = r >= 0
          const x = ahead ? r * 44 : r * 30
          const scale = ahead ? 1 - 0.1 * Math.min(r, 3) : 1 + r * 0.12
          const opacity = ahead ? clamp(2.7 - r, 0, 1) : clamp(1 + r * 1.3, 0, 1)
          gsap.set(el, {
            xPercent: -50 + x * dirSign,
            yPercent: -50 + (ahead ? r * 2 : 0),
            scale,
            rotation: (ahead ? r * 2.4 : r * -2) * dirSign,
            opacity,
            // the screen in front is always on top; the one leaving sinks behind the one arriving
            zIndex: ahead ? 20 - Math.round(r * 4) : 8 + Math.round(r * 4),
          })
          const d = dims[i]
          if (d) d.style.opacity = String(Math.min(Math.abs(r) * (ahead ? 0.42 : 0.7), 0.72))
        })
        const a = clamp(Math.round(q), 0, N - 1)
        if (a !== activeRef.current) {
          activeRef.current = a
          setActive(a)
        }
      }
      apply()
      const tween = gsap.to(proxy, {
        p: N - 1,
        ease: 'none',
        onUpdate: apply,
        scrollTrigger: { trigger: track.current, start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true },
      })
      trigger.current = tween.scrollTrigger ?? null
      // the whole deck drifts a little against the scroll, so the stage never feels frozen while a screen holds
      gsap.fromTo(deck.current, { y: 26 }, { y: -26, ease: 'none', scrollTrigger: { trigger: track.current, start: 'top top', end: 'bottom bottom', scrub: true } })
      ScrollTrigger.refresh()
      return () => {
        trigger.current = null
      }
    },
    { dependencies: [mode], revertOnUpdate: true },
  )

  /** Scrolls the track so screen i is the one in front (captions are buttons on wide screens). */
  const goTo = (i: number) => {
    const st = trigger.current
    if (!st) return
    const y = st.start + ((st.end - st.start) * i) / (N - 1)
    const lenis = useSiteStore.getState().lenis
    if (lenis) lenis.scrollTo(y, { duration: 1.1 })
    else window.scrollTo({ top: y, behavior: 'smooth' })
  }

  useEffect(() => {
    exposeQA({
      tour: {
        state: () => ({
          mode,
          active: activeRef.current,
          shots: [...document.querySelectorAll<HTMLImageElement>('#inside .tour-phone img')].map((im) => im.getAttribute('src')),
        }),
        goTo,
      },
    })
  })

  const head = <SectionHead eyebrow={t.tour.eyebrow} title={t.tour.title} lede={t.tour.lede} className="tour-head" />

  if (mode === 'rest') {
    return (
      <section id="inside" className="tour is-rest bg-night text-paper" aria-label={t.tour.eyebrow} data-mode="rest">
        <Container>
          {head}
          <ol className="tour-rest">
            {t.tour.steps.map((_, i) => (
              <li key={i} className="tour-rest__item">
                <Phone i={i} />
                <Caption i={i} />
              </li>
            ))}
          </ol>
          <Enter />
        </Container>
      </section>
    )
  }

  return (
    <section id="inside" className="tour is-scrub bg-night text-paper" aria-label={t.tour.eyebrow} data-mode="scrub" data-active={active}>
      <Container className="tour-intro">{head}</Container>
      <div ref={track} className="tour-track">
        <div className="tour-stage">
          <Container className="tour-stage__inner">
            <div className="tour-side">
              <div className="tour-side__head">{head}</div>
              <ol className="tour-caps">
                {t.tour.steps.map((_, i) => (
                  <li key={i}>
                    <Caption i={i} active={i === active} onPick={() => goTo(i)} />
                  </li>
                ))}
              </ol>
              <Reveal className="tour-side__enter">
                <Enter />
              </Reveal>
            </div>
            <div className="tour-deck-wrap">
              <div ref={deck} className="tour-deck">
                {SHOTS.map((_, i) => (
                  <Phone key={i} i={i} />
                ))}
              </div>
              <div className="tour-now" aria-live="polite">
                <div className="tour-now__caps">
                  {t.tour.steps.map((_, i) => (
                    <div key={i} className="tour-now__cap" data-on={i === active ? '' : undefined} aria-hidden={i !== active}>
                      <Caption i={i} />
                    </div>
                  ))}
                </div>
                <div className="tour-now__bars" aria-hidden>
                  {SHOTS.map((_, i) => (
                    <span key={i} data-on={i <= active ? '' : undefined} />
                  ))}
                </div>
              </div>
            </div>
          </Container>
        </div>
      </div>
      <Container className="tour-outro">
        <Enter />
      </Container>
    </section>
  )
}
