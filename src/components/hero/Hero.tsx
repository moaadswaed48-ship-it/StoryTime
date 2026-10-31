import { useRef } from 'react'
import { ArrowRight, Play, RotateCw } from 'lucide-react'
import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { useGSAP } from '@gsap/react'
import { site, featuredBook } from '@/content/loadBooks'
import { useSiteStore } from '@/store/useSiteStore'
import { heroProgress } from '@/three/shared/progress'
import { Pill } from '@/components/ui/Pill'
import { Button } from '@/components/ui/Button'
import { CircleButton } from '@/components/ui/CircleButton'
import { AccentTitle } from './AccentTitle'
import { StatRow } from './StatRow'
import { GlassCallout } from './GlassCallout'
import { ThumbCard } from './ThumbCard'
import { LeaderLine } from './LeaderLine'

export function Hero() {
  const scope = useRef<HTMLElement>(null)
  const calloutRef = useRef<HTMLDivElement>(null)
  const tier = useSiteStore((s) => s.tier)
  const lenis = useSiteStore((s) => s.lenis)
  const openBook = useSiteStore((s) => s.openBook)
  const requestSpin = useSiteStore((s) => s.requestSpin)

  useGSAP(
    () => {
      const q = gsap.utils.selector(scope)
      const heroImg = document.getElementById('hero-img')
      if (tier === 'reduced') {
        gsap.set([q('.hero-copy > *'), q('.hero-float')], { clearProps: 'all' })
        if (heroImg) gsap.set(heroImg, { clearProps: 'transform' })
        return
      }
      // Intro: masked line reveal of the headline, then the rest of the column.
      SplitText.create(q('.hero-title'), {
        type: 'lines,words',
        mask: 'lines',
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.lines, { yPercent: 110, duration: 1.1, ease: 'power3.out', stagger: 0.09, delay: 0.1 }),
      })
      gsap.from(q('.hero-copy > :not(.hero-title)'), { y: 18, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.07, delay: 0.45 })
      gsap.from(q('.hero-float'), { y: 14, opacity: 0, scale: 0.97, duration: 0.9, ease: 'power3.out', stagger: 0.1, delay: 0.7 })
      gsap.fromTo(q('.leader-line'), { opacity: 0 }, { opacity: 1, duration: 0.6, delay: 1.1 })

      // Scroll: the column and callouts leave, the photo dollies in, the 3D layer reads heroProgress.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: scope.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.8,
          onUpdate: (self) => {
            heroProgress.value = self.progress
          },
        },
      })
      tl.to(q('.hero-copy'), { y: -40, opacity: 0, ease: 'none', duration: 0.45 }, 0)
      tl.to(q('.hero-float, .leader-line'), { y: -24, opacity: 0, ease: 'none', duration: 0.25 }, 0)
      if (heroImg) tl.to(heroImg, { scale: 1.06, ease: 'none', duration: 1 }, 0)
    },
    { scope, dependencies: [tier] },
  )

  const browse = () => lenis?.scrollTo('#shelf', { offset: -80 })
  const sample = (el: HTMLElement) => {
    browse()
    openBook(featuredBook.id, el)
  }
  const spin = () => {
    browse()
    requestSpin(featuredBook.id)
  }

  return (
    <section id="top" ref={scope} className="hero relative z-10 min-h-[100svh] min-h-[640px]" aria-labelledby="hero-title">
      <div className="mx-auto grid min-h-[100svh] max-w-[1440px] grid-cols-1 items-end px-5 pb-12 pt-24 lg:grid-cols-12 lg:items-center lg:px-12 lg:pb-16 lg:pt-32">
        <div className="hero-copy lg:col-span-8 xl:col-span-7">
          <Pill>{site.hero.badge}</Pill>
          <h1
            id="hero-title"
            className="hero-title mt-5 text-[clamp(2.6rem,5.9vw,6rem)] font-semibold leading-[0.98] tracking-[-0.025em] text-ink"
          >
            <AccentTitle text={site.hero.title} />
          </h1>
          <p className="mt-6 max-w-[44ch] text-[16px] font-medium leading-relaxed text-ink-soft lg:text-[19px]">{site.hero.paragraph}</p>
          <div className="mt-8 flex flex-wrap items-center gap-6">
            <Button onClick={browse}>
              {site.hero.cta} <ArrowRight size={18} strokeWidth={2} aria-hidden />
            </Button>
            <button type="button" onClick={(e) => sample(e.currentTarget)} className="group inline-flex items-center gap-4 text-left">
              <CircleButton size={56} tabIndex={-1} aria-hidden>
                <Play size={18} strokeWidth={2} className="ml-0.5 fill-ink" aria-hidden />
              </CircleButton>
              <span>
                <span className="block text-[15px] font-semibold text-ink group-hover:underline">{site.hero.sample.label}</span>
                <span className="block text-sm text-body">{site.hero.sample.duration}</span>
              </span>
            </button>
          </div>
          <StatRow className="mt-10 lg:mt-14" />
          <p className="mt-10 hidden items-center gap-3 text-sm font-semibold tracking-wide text-ink lg:flex">
            <span className="h-px w-10 bg-ink/60" aria-hidden /> {site.hero.caption}
          </p>
        </div>
      </div>

      {/* Floating chrome around the photographed stack (desktop); collapses under the copy on small screens */}
      <div ref={calloutRef} className="hero-float lg:absolute lg:right-[23%] lg:top-[17%] lg:w-[320px] px-5 lg:px-0 -mt-4 lg:mt-0 mb-6 lg:mb-0">
        <GlassCallout />
      </div>
      <LeaderLine heroRef={scope} fromRef={calloutRef} />
      <div className="hero-float absolute right-[27%] top-[46%] hidden lg:block xl:right-[25%]">
        <button type="button" onClick={spin} className="group flex h-[120px] w-[120px] flex-col items-center justify-center rounded-full border border-white/80 bg-white/15 text-ink transition-colors hover:bg-white/45" aria-label={`${site.hero.spin.label} — ${site.hero.spin.sub}`}>
          <span className="text-2xl font-semibold leading-none">{site.hero.spin.label}</span>
          <span className="mt-1 flex items-center gap-1 text-xs text-ink-soft">
            <RotateCw size={12} aria-hidden /> {site.hero.spin.sub}
          </span>
        </button>
      </div>
      <div className="hero-float hidden lg:absolute lg:bottom-[7%] lg:right-[4%] lg:block lg:w-[360px]">
        <ThumbCard />
      </div>
    </section>
  )
}
