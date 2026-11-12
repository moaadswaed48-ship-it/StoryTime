import { useCallback, useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ArrowRight, ArrowUp, Globe } from 'lucide-react'
import { enterApp } from '@/app/router'
import { prefersReducedNow, writeReduceToggle } from '@/app/useMotionTier'
import { BlurWords, Eyebrow, Reveal } from '@/design/ui'
import { t } from '@/i18n/copy'
import { dirSign, locale, switchLocale } from '@/i18n/locale'
import { asset } from '@/lib/asset'
import { useSiteStore } from '@/store/useSiteStore'
import { BookMark, scrollToSection } from './Nav'

const C = t.landing.closing

/**
 * The way in. Two screens of the app rise out of the dark as the page arrives: the landing page ends where the
 * app begins, and they do not look alike. One action: step inside.
 */
export function Closing() {
  const root = useRef<HTMLElement>(null)
  const reduced = useSiteStore((s) => s.tier === 'reduced')

  useGSAP(
    () => {
      const el = root.current
      if (!el || reduced || prefersReducedNow()) return
      const q = gsap.utils.selector(el)
      const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: q('.lp-phones')[0], start: 'top 96%', end: 'center 52%', scrub: 0.6 } })
      tl.from(q('.lp-phone--a'), { yPercent: 34, rotationX: 26, scale: 0.9 }, 0).from(q('.lp-phone--b'), { yPercent: 52, xPercent: -34 * dirSign, rotation: -9 * dirSign, rotationX: 26 }, 0)
      // wide screens: the pair leans toward the pointer
      if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
      const box = q('.lp-phones__lean')[0]
      const rx = gsap.quickTo(box, 'rotationX', { duration: 0.9, ease: 'power3.out' })
      const ry = gsap.quickTo(box, 'rotationY', { duration: 0.9, ease: 'power3.out' })
      const onMove = (e: PointerEvent) => {
        const r = el.getBoundingClientRect()
        ry(((e.clientX - r.left) / r.width - 0.5) * 14)
        rx(-((e.clientY - r.top) / r.height - 0.5) * 10)
      }
      el.addEventListener('pointermove', onMove)
      return () => el.removeEventListener('pointermove', onMove)
    },
    { scope: root, dependencies: [reduced], revertOnUpdate: true },
  )

  return (
    <section ref={root} id="enter" className="lp-close" aria-label={`${C.titleA} ${C.titleB}`}>
      <div className="lp-close__in">
        <div className="lp-close__copy">
          <Reveal>
            <Eyebrow>{C.eyebrow}</Eyebrow>
          </Reveal>
          <h2 className="lp-close__title">
            <BlurWords text={C.titleA} className="lp-close__a" />
            <BlurWords text={C.titleB} className="lp-close__b" delay={180} />
          </h2>
          <Reveal delay={260}>
            <p className="lp-close__text">{C.text}</p>
          </Reveal>
          <Reveal delay={360}>
            <button type="button" className="lp-btn lp-btn--light lp-btn--lg" data-enter="closing" onClick={() => enterApp()}>
              {C.enter}
              <span className="lp-btn__arrow" aria-hidden>
                <ArrowRight size={17} strokeWidth={2.4} className="flip-rtl" />
              </span>
            </button>
          </Reveal>
        </div>
        <div className="lp-phones" aria-hidden>
          <div className="lp-phones__lean">
            <div className="lp-phone lp-phone--b">
              <img src={asset(`app/shots/story-${locale}.webp`)} alt="" width={780} height={1688} loading="lazy" decoding="async" />
            </div>
            <div className="lp-phone lp-phone--a">
              <img src={asset(`app/shots/home-${locale}.webp`)} alt="" width={780} height={1688} loading="lazy" decoding="async" />
            </div>
          </div>
        </div>
      </div>
      <LandingFooter />
    </section>
  )
}

/** The page's last lines: the wordmark, what this preview is, and the three small controls. */
function LandingFooter() {
  const reduceToggle = useSiteStore((s) => s.reduceToggle)
  const reduced = useSiteStore((s) => s.tier === 'reduced')
  const setReduceToggle = useSiteStore((s) => s.setReduceToggle)
  const toggleMotion = useCallback(() => {
    const now = useSiteStore.getState().reduceToggle
    // nothing to give back while the system setting is on (turning our own switch off is still allowed)
    if (!now && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    writeReduceToggle(!now)
    setReduceToggle(!now)
  }, [setReduceToggle])
  return (
    <footer className="lp-foot">
      <div className="lp-foot__brand">
        <span className="lp-brand">
          <BookMark />
          <span>{t.brand}</span>
        </span>
        <p>{t.landing.footer.line}</p>
      </div>
      <div className="lp-foot__tools">
        <button type="button" role="switch" aria-checked={reduceToggle || reduced} className="lp-switch" onClick={toggleMotion}>
          <i aria-hidden />
          {t.footer.motion}
        </button>
        <button type="button" className="lp-foot__btn" onClick={switchLocale}>
          <Globe size={16} strokeWidth={1.9} aria-hidden />
          {t.nav.lang}
        </button>
        <button type="button" className="lp-foot__btn" onClick={() => scrollToSection(0)}>
          <ArrowUp size={16} strokeWidth={2} aria-hidden />
          {t.footer.top}
        </button>
      </div>
      <div className="lp-foot__legal">
        <p>{t.footer.legal}</p>
        <p>{t.footer.note}</p>
      </div>
    </footer>
  )
}
