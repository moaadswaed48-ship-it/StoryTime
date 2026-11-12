import { useCallback, useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react'
import { BookOpen, Globe, LogIn, LogOut, Play } from 'lucide-react'
import { Pill } from '@/design/ui'
import { useOverlayLock } from '@/design/overlay'
import { t } from '@/i18n/copy'
import { locale, num, switchLocale } from '@/i18n/locale'
import { exposeQA } from '@/lib/qa'
import { useSiteStore } from '@/store/useSiteStore'
import './nav.css'

/** Sections the bar links to, in page order. `film` opens the player instead of scrolling. */
const LINKS = [
  { id: 'library', label: t.nav.library },
  { id: 'film', label: t.nav.film },
  { id: 'sari', label: t.nav.sari },
  { id: 'game', label: t.nav.game },
  { id: 'parents', label: t.nav.parents },
  { id: 'pricing', label: t.nav.pricing },
] as const
const SECTIONS = LINKS.filter((l) => l.id !== 'film').map((l) => l.id)
const otherLang = locale === 'ar' ? 'en' : 'ar'

/** Smooth-scrolls to a section (Lenis), leaving room for the floating bar. */
function scrollToSection(id: string) {
  const { lenis, tier } = useSiteStore.getState()
  const top = id === 'top'
  if (lenis) lenis.scrollTo(top ? 0 : `#${id}`, { offset: top ? 0 : -80, immediate: tier === 'reduced', force: true })
  else if (top) window.scrollTo(0, 0)
  else document.getElementById(id)?.scrollIntoView()
}

/** A floating pill with both glass skins; the bar's `data-tone` cross-fades them. */
function Skin() {
  return (
    <>
      <span className="st-pill__skin st-pill__skin--glass glass" aria-hidden />
      <span className="st-pill__skin st-pill__skin--ink glass-ink" aria-hidden />
    </>
  )
}

/** The mark: one autumn leaf. */
function LeafMark({ size = 20 }: { size?: number }) {
  return (
    <svg className="st-brand__mark" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 1.8c1.1 2.1 2.6 3 4.6 2.7-.5 1.7-.1 3.1 1.2 4.1 1.2-.6 2.4-.6 3.5 0-1 2-2.5 3.6-4.5 4.9.9.5 1.5 1.3 1.8 2.3-2 .4-3.8.2-5.5-.7l.3 6.8h-2.8l.3-6.8c-1.7.9-3.5 1.1-5.5.7.3-1 .9-1.8 1.8-2.3-2-1.3-3.5-2.9-4.5-4.9 1.1-.6 2.3-.6 3.5 0 1.3-1 1.7-2.4 1.2-4.1 2 .3 3.5-.6 4.6-2.7z" />
    </svg>
  )
}

/**
 * Floating navigation. Wordmark at the start, section links in the centre (from 1024px), language · log-in · "open the book" at the end.
 * Phones get wordmark + language + a menu button that opens a full-screen glass sheet. Hidden while the book or the film is open.
 */
export function Nav() {
  const overlay = useSiteStore((s) => s.overlay)
  const loggedIn = useSiteStore((s) => s.loggedIn)
  const openBook = useSiteStore((s) => s.openBook)
  const openFilm = useSiteStore((s) => s.openFilm)
  const setLoggedIn = useSiteStore((s) => s.setLoggedIn)
  const setLoginOpen = useSiteStore((s) => s.setLoginOpen)

  const [scrolled, setScrolled] = useState(() => typeof window !== 'undefined' && window.scrollY > 80)
  const [menu, setMenu] = useState(false)
  const [active, setActive] = useState<string | null>(null)
  const root = useRef<HTMLElement>(null)
  const burger = useRef<HTMLButtonElement>(null)
  const sheet = useRef<HTMLDivElement>(null)
  const hidden = overlay !== null
  const tone = scrolled && !menu ? 'ink' : 'glass'

  const close = useCallback(() => setMenu(false), [])
  useOverlayLock(menu, close) // stops Lenis, locks the page, Esc closes

  // Glass over the hero, dark glass once the page has moved 80px.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Mark the link of the section that is crossing the middle of the screen.
  useEffect(() => {
    const els = SECTIONS.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el)
    if (!els.length) return
    const seen = new Map<string, boolean>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set(e.target.id, e.isIntersecting)
        setActive(SECTIONS.find((id) => seen.get(id)) ?? null)
      },
      { rootMargin: '-42% 0px -56% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  // The sheet belongs to phones: close it when an overlay opens or the window grows to the full bar.
  useEffect(() => {
    if (hidden) setMenu(false)
  }, [hidden])
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const onChange = () => mq.matches && setMenu(false)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // While the sheet is open: focus moves into it and Tab stays inside the navigation.
  const wasOpen = useRef(false)
  useEffect(() => {
    if (!menu) {
      if (wasOpen.current && root.current?.contains(document.activeElement)) burger.current?.focus({ preventScroll: true })
      wasOpen.current = false
      return
    }
    wasOpen.current = true
    sheet.current?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !root.current) return
      const items = Array.from(root.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')).filter((n) => n.offsetParent !== null)
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) (e.preventDefault(), last.focus())
      else if (!e.shiftKey && document.activeElement === last) (e.preventDefault(), first.focus())
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menu])

  useEffect(() => {
    exposeQA({
      nav: {
        state: () => ({ tone: root.current?.dataset.tone, hidden: root.current?.hasAttribute('data-hidden') ?? false, menu: !!sheet.current?.hasAttribute('data-open'), active: root.current?.querySelector('[aria-current="true"]')?.getAttribute('data-link') ?? null }),
        openMenu: () => setMenu(true),
        closeMenu: () => setMenu(false),
      },
    })
  }, [])

  /** Runs a link: closes the sheet first (which restarts smooth scrolling), then scrolls or opens the film. */
  const follow = (id: string) => (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation() // Lenis' own anchor handler would scroll without the offset
    const run = () => (id === 'film' ? openFilm() : scrollToSection(id))
    if (menu) {
      setMenu(false)
      window.setTimeout(run, 80)
    } else run()
  }
  const account = () => {
    setMenu(false)
    if (loggedIn) setLoggedIn(false)
    else setLoginOpen(true)
  }
  const AccountIcon = loggedIn ? LogOut : LogIn
  const accountLabel = loggedIn ? t.nav.logout : t.nav.login

  const link = (l: (typeof LINKS)[number], className: string, children: ReactNode, style?: CSSProperties) =>
    l.id === 'film' ? (
      <button key={l.id} type="button" className={className} style={style} data-link={l.id} onClick={follow(l.id)}>
        {children}
      </button>
    ) : (
      <a key={l.id} href={`#${l.id}`} className={className} style={style} data-link={l.id} aria-current={active === l.id ? 'true' : undefined} onClick={follow(l.id)}>
        {children}
      </a>
    )

  return (
    <header ref={root} className="st-nav" data-tone={tone} data-hidden={hidden ? '' : undefined}>
      <div className="st-nav__bar" inert={hidden}>
        <div className="st-nav__side">
          <a href="#top" className="st-pill st-brand" onClick={follow('top')} aria-label={t.brand}>
            <Skin />
            <LeafMark />
            <span>{t.brand}</span>
            <span className="st-brand__alt" lang={otherLang} aria-hidden>
              {t.brandAlt}
            </span>
          </a>
        </div>

        <nav className="st-pill st-links" aria-label={t.nav.menu}>
          <Skin />
          {LINKS.map((l) =>
            link(
              l,
              'st-link',
              <>
                {l.id === 'film' && <Play size={11} fill="currentColor" strokeWidth={0} aria-hidden />}
                {l.label}
              </>,
            ),
          )}
        </nav>

        <div className="st-nav__side st-nav__side--end">
          <div className="st-pill st-actions">
            <Skin />
            <button type="button" className="st-ghost" onClick={switchLocale}>
              <Globe size={16} strokeWidth={1.9} aria-hidden />
              <span lang={otherLang}>{t.nav.lang}</span>
            </button>
            <button type="button" className="st-ghost st-only-wide" onClick={account} aria-label={accountLabel}>
              <AccountIcon size={16} strokeWidth={1.9} className="flip-rtl" aria-hidden />
              <span className="st-ghost__label--optional">{accountLabel}</span>
            </button>
            <Pill variant="solid" size="sm" className="st-cta st-only-wide" onClick={() => openBook()}>
              {t.nav.cta}
            </Pill>
          </div>
          <button ref={burger} type="button" className="st-pill st-burger st-only-narrow" aria-expanded={menu} aria-controls="st-menu" aria-label={menu ? t.nav.close : t.nav.menu} onClick={() => setMenu((v) => !v)}>
            <Skin />
            <i aria-hidden />
            <i aria-hidden />
          </button>
        </div>
      </div>

      <div ref={sheet} id="st-menu" className="st-sheet" role="dialog" aria-modal="true" aria-label={t.nav.menu} tabIndex={-1} data-open={menu ? '' : undefined} inert={!menu} data-lenis-prevent>
        <nav className="st-sheet__links" aria-label={t.nav.menu}>
          {LINKS.map((l, i) =>
            link(
              l,
              'st-sheet__link st-stagger',
              <>
                <span className="st-sheet__no" aria-hidden>
                  {locale === 'en' && '0'}
                  {num(i + 1)}
                </span>
                {l.label}
              </>,
              { '--i': i } as CSSProperties,
            ),
          )}
        </nav>
        <div className="st-sheet__foot st-stagger" style={{ '--i': LINKS.length + 1 } as CSSProperties}>
          <div className="st-sheet__row">
            <Pill variant="glass" size="lg" className="px-6" onClick={account}>
              <AccountIcon size={17} strokeWidth={1.9} className="flip-rtl shrink-0" aria-hidden />
              {accountLabel}
            </Pill>
            <Pill
              variant="solid"
              size="lg"
              className="w-full whitespace-nowrap px-4"
              onClick={() => {
                setMenu(false)
                openBook()
              }}
            >
              <BookOpen size={18} strokeWidth={2.2} className="shrink-0" aria-hidden />
              {t.nav.cta}
            </Pill>
          </div>
          <p className="st-sheet__note">{t.footer.legal}</p>
        </div>
      </div>
    </header>
  )
}
