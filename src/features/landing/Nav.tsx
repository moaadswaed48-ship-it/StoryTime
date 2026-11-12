import { useEffect, useState } from 'react'
import { ArrowRight, Globe } from 'lucide-react'
import { enterApp } from '@/app/router'
import { t } from '@/i18n/copy'
import { switchLocale } from '@/i18n/locale'
import { cn } from '@/lib/cn'
import { useSiteStore } from '@/store/useSiteStore'

const LINKS = [
  { id: 'ways', label: t.landing.nav.ways },
  { id: 'cast', label: t.landing.nav.cast },
  { id: 'author', label: t.landing.nav.author },
] as const

/** Smooth-scrolls to a section of the landing page (Lenis when it runs). */
export function scrollToSection(id: string | 0) {
  const { lenis, tier } = useSiteStore.getState()
  const target = id === 0 ? 0 : `#${id}`
  if (lenis) lenis.scrollTo(target, { offset: 0, immediate: tier === 'reduced', force: true })
  else if (id === 0) window.scrollTo(0, 0)
  else document.getElementById(id)?.scrollIntoView()
}

/** The mark: an open book whose pages rise like two hills. */
export function BookMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 7.5C10 5.6 7 5 3 5.2v12.6c4-.2 7 .4 9 2.2 2-1.8 5-2.4 9-2.2V5.2c-4-.2-7 .4-9 2.3z" />
      <path d="M12 7.5V20" />
    </svg>
  )
}

/**
 * The landing page's own bar: clear over the hero's sky, a pill of light glass once the page moves.
 * Wordmark · three places on the page (wide screens) · language · the one action: step inside.
 */
export function LandingNav() {
  const overlay = useSiteStore((s) => s.overlay)
  const picking = useSiteStore((s) => s.picking)
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  return (
    <header className={cn('lp-nav', scrolled && 'is-scrolled', (overlay !== null || picking) && 'is-hidden')}>
      <div className="lp-nav__bar">
        <button type="button" className="lp-brand" onClick={() => scrollToSection(0)} aria-label={t.footer.top}>
          <BookMark />
          <span>{t.brand}</span>
        </button>
        <nav className="lp-nav__links" aria-label={t.nav.menu}>
          {LINKS.map((l) => (
            <button key={l.id} type="button" onClick={() => scrollToSection(l.id)}>
              {l.label}
            </button>
          ))}
        </nav>
        <div className="lp-nav__end">
          <button type="button" className="lp-nav__lang" onClick={switchLocale} aria-label={t.nav.lang}>
            <Globe size={17} strokeWidth={1.9} aria-hidden />
            <span lang={t.nav.lang === 'English' ? 'en' : 'ar'}>{t.nav.lang}</span>
          </button>
          <button type="button" className="lp-btn lp-btn--sm" data-enter="nav" onClick={() => enterApp()}>
            {t.landing.nav.enter}
            <span className="lp-btn__arrow" aria-hidden>
              <ArrowRight size={14} strokeWidth={2.4} className="flip-rtl" />
            </span>
          </button>
        </div>
      </div>
    </header>
  )
}
