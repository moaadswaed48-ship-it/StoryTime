import { useRef } from 'react'
import { BookOpen, Clapperboard, Gamepad2 } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { t } from '@/i18n/copy'
import { dirSign } from '@/i18n/locale'
import { story } from '@/content/story'
import { useSiteStore } from '@/store/useSiteStore'
import { Eyebrow, Heading } from './Section'
import { Art, CoverFace, PaperPage, Words } from '@/components/reader/parts'
import { Leaves } from '@/components/fx/Leaves'
import { Button } from '@/components/ui/Button'

const ICONS = [BookOpen, Clapperboard, Gamepad2]
const smooth = (a: number, b: number, x: number) => {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return k * k * (3 - 2 * k)
}

/** Sticky, scroll-scrubbed scene: the closed book slides in, opens, and its paper pieces stand up. */
export function BookStage() {
  const scope = useRef<HTMLElement>(null)
  const book = useRef<HTMLDivElement>(null)
  const cover = useRef<HTMLDivElement>(null)
  const page = useRef<HTMLDivElement>(null)
  const reduced = useSiteStore((s) => s.tier === 'reduced')
  const openReader = useSiteStore((s) => s.openReader)
  const lenis = useSiteStore((s) => s.lenis)

  useGSAP(
    () => {
      const beats = gsap.utils.toArray<HTMLElement>('.beat', scope.current!)
      const apply = (p: number) => {
        const open = reduced ? 1 : smooth(0.08, 0.5, p)
        if (cover.current) cover.current.style.transform = `rotateY(${-dirSign * 168 * open}deg)`
        if (book.current) book.current.style.transform = `translateX(${dirSign * 50 * open}%) rotateX(${14 - 8 * open}deg) rotateZ(${dirSign * -4 * (1 - open)}deg) scale(${0.92 + 0.08 * open})`
        page.current?.classList.toggle('is-active', open > 0.75)
        beats.forEach((b, i) => {
          const on = reduced || p > 0.36 + i * 0.17
          b.style.opacity = on ? '1' : '0.25'
          b.style.transform = on ? 'none' : 'translateY(10px)'
        })
      }
      apply(0)
      if (reduced) return
      ScrollTrigger.create({ trigger: scope.current, start: 'top top', end: 'bottom bottom', scrub: 0.6, onUpdate: (self) => apply(self.progress) })
    },
    { scope, dependencies: [reduced] },
  )

  return (
    <section id="story" ref={scope} className="relative bg-gradient-to-b from-haze via-[#f3e6cf] to-[#f6d9a8]" style={{ height: reduced ? 'auto' : '300vh' }}>
      <div className="sticky top-0 flex min-h-[100svh] flex-col justify-center overflow-hidden pb-6 pt-20">
        <Leaves density={12} />
        <div className="relative z-10 mx-auto grid w-full max-w-[1440px] grid-cols-1 items-center gap-6 px-5 lg:grid-cols-2 lg:gap-10 lg:px-12">
          <div>
            <Eyebrow>{t.stage.eyebrow}</Eyebrow>
            <Heading className="font-display">{t.stage.heading}</Heading>
            <p className="mt-3 text-base text-body lg:text-lg">{t.stage.sub}</p>
            <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-1 sm:gap-3 lg:mt-8">
              {t.stage.beats.map((b, i) => {
                const I = ICONS[i]
                return (
                  <li key={b.t} className="beat flex items-center gap-2 rounded-2xl bg-white/70 p-2.5 transition-[opacity,transform] duration-500 sm:items-start sm:gap-3 sm:p-3 lg:p-4">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-monarch/15 text-[#b4541a]">
                      <I size={19} aria-hidden />
                    </span>
                    <span>
                      <span className="block text-[15px] font-bold text-ink lg:text-lg">{b.t}</span>
                      <span className="hidden text-[13px] leading-relaxed text-body sm:block lg:text-[15px]">{b.s}</span>
                    </span>
                  </li>
                )
              })}
            </ul>
            <div className="mt-5 flex flex-wrap gap-3 lg:mt-7">
              <Button onClick={() => openReader('read', 0)} data-testid="stage-read">
                <BookOpen size={18} aria-hidden /> {t.stage.read}
              </Button>
              <Button variant="ghost" onClick={() => openReader('watch', 0)}>
                <Clapperboard size={18} aria-hidden /> {t.stage.watch}
              </Button>
              <Button variant="ghost" onClick={() => lenis?.scrollTo('#play', { offset: -70 })}>
                <Gamepad2 size={18} aria-hidden /> {t.nav.play}
              </Button>
            </div>
            <p className="mt-3 text-xs text-body">{t.stage.note}</p>
          </div>

          <div className="order-first flex justify-center lg:order-none" style={{ perspective: '1800px' }} aria-hidden>
            <div ref={book} className="relative" style={{ width: 'min(40vw, 27svh, 330px)', aspectRatio: '3 / 4', transformStyle: 'preserve-3d', willChange: 'transform' }}>
              {/* first page under the cover */}
              <div ref={page} className="absolute inset-0 overflow-hidden rounded-[4px_12px_12px_4px] bg-[#fbf6ea] shadow-[0_24px_50px_rgba(90,50,10,.35)] rtl:rounded-[12px_4px_4px_12px]">
                <Art s={story.spreads[0]} index={5} active={false} />
              </div>
              {/* cover leaf, hinged at the spine */}
              <div ref={cover} className="absolute inset-0" style={{ transformStyle: 'preserve-3d', transformOrigin: dirSign === 1 ? 'left center' : 'right center', willChange: 'transform' }}>
                <div className="face" style={{ borderRadius: 6 }}>
                  <CoverFace small />
                </div>
                <div className="face back">
                  <PaperPage>
                    <Words s={story.spreads[0]} small />
                  </PaperPage>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
