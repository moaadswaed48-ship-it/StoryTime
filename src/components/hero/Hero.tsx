import { useRef } from 'react'
import { ArrowRight, Play, BookOpen, Clapperboard, Gamepad2, ChevronDown } from 'lucide-react'
import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { useGSAP } from '@gsap/react'
import { t } from '@/i18n/copy'
import { useSiteStore } from '@/store/useSiteStore'
import { prefersReducedNow } from '@/app/useMotionTier'
import { heroProgress } from '@/three/shared/progress'
import { Button } from '@/components/ui/Button'
import { AccentTitle } from './AccentTitle'
import { HeroSlot } from '@/three/HeroSlot'

const ICONS = [BookOpen, Clapperboard, Gamepad2]

export function Hero() {
  const scope = useRef<HTMLElement>(null)
  const tier = useSiteStore((s) => s.tier)
  const lenis = useSiteStore((s) => s.lenis)
  const openReader = useSiteStore((s) => s.openReader)

  useGSAP(
    () => {
      if (prefersReducedNow()) return
      const q = gsap.utils.selector(scope)
      // Arabic letters must stay joined: split by lines/words only, never characters.
      SplitText.create(q('.hero-title'), {
        type: 'lines,words',
        mask: 'lines',
        autoSplit: true,
        onSplit: (self) => gsap.from(self.lines, { yPercent: 110, duration: 1.1, ease: 'power3.out', stagger: 0.09, delay: 0.1 }),
      })
      gsap.from(q('.hero-copy > :not(.hero-title)'), { y: 18, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.07, delay: 0.45, clearProps: 'opacity,transform' })
    },
    { scope },
  )
  const reduced = tier === 'reduced'
  useGSAP(
    () => {
      const q = gsap.utils.selector(scope)
      const heroImg = document.getElementById('hero-img')
      if (reduced) {
        gsap.set(q('.hero-copy'), { clearProps: 'all' })
        heroProgress.value = 0
        return
      }
      const tl = gsap.timeline({ scrollTrigger: { trigger: scope.current, start: 'top top', end: 'bottom top', scrub: 0.8, onUpdate: (self) => void (heroProgress.value = self.progress) } })
      tl.to(q('.hero-copy'), { y: -40, opacity: 0, ease: 'none', duration: 0.45 }, 0)
      if (heroImg) tl.to(heroImg, { scale: 1.06, ease: 'none', duration: 1 }, 0)
    },
    { scope, dependencies: [reduced] },
  )

  return (
    <section id="top" ref={scope} className="hero relative min-h-[100svh]" aria-labelledby="hero-title">
      <HeroSlot />
      <div className="relative z-10 mx-auto grid min-h-[100svh] max-w-[1440px] grid-cols-1 items-end px-5 pb-10 pt-24 lg:grid-cols-12 lg:items-center lg:px-12 lg:pb-16 lg:pt-28">
        <div className="hero-copy lg:col-span-7">
          <span className="inline-flex items-center gap-2.5 rounded-full bg-white/75 px-4 py-2 text-[13px] font-semibold text-ink-soft">
            <span className="h-2 w-2 rounded-full bg-monarch" aria-hidden /> {t.hero.badge}
          </span>
          <h1 id="hero-title" className="hero-title mt-5 text-[clamp(2.5rem,5.6vw,5.6rem)] font-bold leading-[1.02] tracking-[-0.025em] text-ink">
            <AccentTitle text={t.hero.title} />
          </h1>
          <p className="mt-5 max-w-[46ch] text-[16px] font-medium leading-relaxed text-ink-soft lg:text-[19px]">{t.hero.para}</p>
          <div className="mt-7 flex flex-wrap items-center gap-5">
            <Button onClick={() => openReader('read', 0)} data-testid="hero-read">
              {t.hero.cta} <ArrowRight size={18} strokeWidth={2} className="flip-rtl" aria-hidden />
            </Button>
            <button type="button" onClick={() => openReader('watch', 0)} className="group inline-flex items-center gap-3 text-start" data-testid="hero-watch">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-ink/15 bg-white/70 group-hover:bg-white">
                <Play size={18} strokeWidth={2} className="fill-ink" aria-hidden />
              </span>
              <span>
                <span className="block text-[15px] font-semibold text-ink group-hover:underline">{t.hero.watch}</span>
                <span className="block text-sm text-body">{t.hero.watchSub}</span>
              </span>
            </button>
          </div>
          <ul className="mt-9 flex flex-wrap gap-x-9 gap-y-4">
            {t.hero.stats.map((s, i) => {
              const I = ICONS[i]
              return (
                <li key={s.t} className="flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-ink/20 bg-white/50">
                    <I size={19} strokeWidth={1.6} aria-hidden />
                  </span>
                  <span>
                    <span className="block text-[15px] font-bold text-ink">{s.t}</span>
                    <span className="block text-[13px] text-body">{s.s}</span>
                  </span>
                </li>
              )
            })}
          </ul>
          <button type="button" onClick={() => lenis?.scrollTo('#story')} className="mt-8 hidden items-center gap-2 text-sm font-semibold text-ink lg:inline-flex">
            <ChevronDown size={16} className="animate-bounce" aria-hidden /> {t.hero.caption}
          </button>
        </div>
      </div>
    </section>
  )
}
