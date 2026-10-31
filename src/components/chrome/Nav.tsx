import { useRef, useState } from 'react'
import { Menu, Search, X, Globe } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { site } from '@/content/loadBooks'
import { useSiteStore } from '@/store/useSiteStore'
import { MotionToggle } from './MotionToggle'
import { cn } from '@/lib/cn'

function Logo() {
  return (
    <a href="#top" className="flex items-center gap-2.5 text-ink" aria-label={`${site.brand.name} — home`}>
      <svg width="30" height="30" viewBox="0 0 64 64" aria-hidden className="shrink-0">
        <path d="M12 18h18c3 0 5 2 5 5v25c-1-2-3-3-5-3H12z" fill="currentColor" />
        <path d="M52 18H34c-3 0-5 2-5 5v25c1-2 3-3 5-3h18z" fill="currentColor" opacity=".55" />
        <path d="M40 10c3-4 10-4 11 0-2 1-4 4-5 7-1-3-4-6-6-7z" fill="#f28c28" />
      </svg>
      <span className="text-[19px] font-bold tracking-[-0.02em]">{site.brand.name}</span>
    </a>
  )
}

export function Nav() {
  const ref = useRef<HTMLElement>(null)
  const [open, setOpen] = useState(false)
  const lenis = useSiteStore((s) => s.lenis)

  useGSAP(() => {
    ScrollTrigger.create({
      trigger: '#page',
      start: 'top -64px',
      end: 'bottom top',
      toggleClass: { targets: ref.current!, className: 'is-scrolled' },
    })
  })

  const goToSearch = () => {
    setOpen(false)
    lenis?.scrollTo('#shelf', { offset: -80, onComplete: () => document.getElementById('shelf-search')?.focus() })
  }

  return (
    <header
      ref={ref}
      className={cn(
        'group/nav fixed inset-x-0 top-0 z-40 transition-[background-color,box-shadow,backdrop-filter] duration-300',
        '[&.is-scrolled]:bg-white/80 [&.is-scrolled]:shadow-[0_1px_0_rgba(16,20,24,.06)] [&.is-scrolled]:backdrop-blur-md',
      )}
    >
      <nav className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-5 lg:px-12" aria-label="Primary">
        <Logo />
        <ul className="hidden items-center gap-9 lg:flex">
          {site.nav.links.map((l, i) => (
            <li key={l.href}>
              <a
                href={l.href}
                className={cn(
                  'relative py-2 text-[15px] font-medium text-ink-soft transition-colors hover:text-ink',
                  i === 0 && 'text-ink after:absolute after:inset-x-0 after:-bottom-1 after:h-[2px] after:rounded-full after:bg-ink',
                )}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2 lg:gap-4">
          <span className="hidden h-10 items-center gap-1.5 rounded-full px-2 text-sm font-medium text-ink-soft lg:inline-flex" title="English">
            <Globe size={18} strokeWidth={1.75} aria-hidden />
            {site.nav.lang}
          </span>
          <button
            type="button"
            onClick={goToSearch}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-white/70 hover:text-ink"
            aria-label="Search books"
          >
            <Search size={20} strokeWidth={1.75} aria-hidden />
          </button>
          <div className="hidden xl:block">
            <MotionToggle />
          </div>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-white/70 hover:text-ink lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X size={22} strokeWidth={1.75} aria-hidden /> : <Menu size={22} strokeWidth={1.75} aria-hidden />}
          </button>
        </div>
      </nav>
      <div
        id="mobile-menu"
        hidden={!open}
        className="border-t border-ink/10 bg-white/95 px-6 py-6 backdrop-blur-md lg:hidden"
      >
        <ul className="flex flex-col gap-1">
          {site.nav.links.map((l) => (
            <li key={l.href}>
              <a href={l.href} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-3 text-lg font-medium text-ink hover:bg-haze">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center gap-3">
          <MotionToggle />
        </div>
      </div>
    </header>
  )
}

// keep gsap referenced for tree-shaking clarity of plugin registration in Providers
void gsap
