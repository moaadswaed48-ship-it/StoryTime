import { useRef, useState } from 'react'
import { Menu, X, Globe, Volume2, VolumeX, UserRound } from 'lucide-react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { t } from '@/i18n/copy'
import { switchLocale } from '@/i18n/locale'
import { useSiteStore } from '@/store/useSiteStore'
import { setSound } from '@/audio/synth'
import { MotionToggle } from './MotionToggle'
import { cn } from '@/lib/cn'

const LINKS = [
  { href: '#story', label: t.nav.story },
  { href: '#hudhud', label: t.nav.hudhud },
  { href: '#play', label: t.nav.play },
  { href: '#learn', label: t.nav.learn },
  { href: '#plans', label: t.nav.plans },
]

function Logo() {
  return (
    <a href="#top" className="flex items-center gap-2.5 text-ink" aria-label={t.brand}>
      <svg width="30" height="30" viewBox="0 0 64 64" aria-hidden className="shrink-0">
        <path d="M12 18h18c3 0 5 2 5 5v25c-1-2-3-3-5-3H12z" fill="currentColor" />
        <path d="M52 18H34c-3 0-5 2-5 5v25c1-2 3-3 5-3h18z" fill="currentColor" opacity=".55" />
        <path d="M40 10c3-4 10-4 11 0-2 1-4 4-5 7-1-3-4-6-6-7z" fill="#f28c28" />
      </svg>
      <span className="font-display whitespace-nowrap text-[17px] font-bold not-italic sm:text-[20px]">{t.brand}</span>
    </a>
  )
}

export function Nav() {
  const ref = useRef<HTMLElement>(null)
  const [open, setOpen] = useState(false)
  const sound = useSiteStore((s) => s.sound)
  const setSoundOn = useSiteStore((s) => s.setSoundOn)
  const loggedIn = useSiteStore((s) => s.loggedIn)
  const setLoggedIn = useSiteStore((s) => s.setLoggedIn)
  const setLoginOpen = useSiteStore((s) => s.setLoginOpen)

  useGSAP(() => {
    ScrollTrigger.create({ trigger: '#page', start: 'top -64px', end: 'bottom top', toggleClass: { targets: ref.current!, className: 'is-scrolled' } })
  })
  const toggleSound = () => {
    setSound(!sound)
    setSoundOn(!sound)
  }
  const iconBtn = 'inline-flex h-11 items-center justify-center gap-1.5 rounded-full px-2.5 text-sm font-semibold text-ink-soft transition-colors hover:bg-white/70 hover:text-ink'

  return (
    <header ref={ref} className={cn('fixed inset-x-0 top-0 z-40 transition-[background-color,box-shadow] duration-300', '[&.is-scrolled]:bg-white/90 [&.is-scrolled]:shadow-[0_1px_0_rgba(16,20,24,.06)]')}>
      <nav className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-4 lg:px-12" aria-label={t.nav.menu}>
        <Logo />
        <ul className="hidden items-center gap-7 lg:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="py-2 text-[15px] font-medium text-ink-soft transition-colors hover:text-ink">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-1">
          <button type="button" onClick={switchLocale} className={iconBtn} data-testid="lang-switch">
            <Globe size={18} strokeWidth={1.75} aria-hidden /> {t.nav.lang}
          </button>
          <button type="button" onClick={toggleSound} className={iconBtn} aria-pressed={sound} aria-label={t.nav.sound}>
            {sound ? <Volume2 size={19} aria-hidden /> : <VolumeX size={19} aria-hidden />}
          </button>
          <button type="button" onClick={() => (loggedIn ? setLoggedIn(false) : setLoginOpen(true))} className={cn(iconBtn, 'max-sm:hidden')} data-testid="login-btn">
            <UserRound size={18} aria-hidden /> {loggedIn ? t.nav.logout : t.nav.login}
          </button>
          <button type="button" onClick={() => setOpen((o) => !o)} className={cn(iconBtn, 'lg:hidden')} aria-expanded={open} aria-controls="mobile-menu" aria-label={t.nav.menu}>
            {open ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
          </button>
        </div>
      </nav>
      <div id="mobile-menu" hidden={!open} className="border-t border-ink/10 bg-white px-6 py-5 lg:hidden">
        <ul className="flex flex-col gap-1">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-3 text-lg font-medium text-ink hover:bg-haze">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => (loggedIn ? setLoggedIn(false) : (setOpen(false), setLoginOpen(true)))} className={iconBtn}>
            <UserRound size={18} aria-hidden /> {loggedIn ? t.nav.logout : t.nav.login}
          </button>
          <MotionToggle />
        </div>
      </div>
    </header>
  )
}
