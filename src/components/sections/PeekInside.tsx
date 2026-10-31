import { useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import { featuredBook, site } from '@/content/loadBooks'
import { useSiteStore } from '@/store/useSiteStore'
import { formatPrice } from '@/lib/formatPrice'
import { useReveal } from '@/app/useReveal'
import { CoverImage } from '@/components/ui/CoverImage'
import { Button } from '@/components/ui/Button'
import { Section, Eyebrow, Heading } from './Section'

export function PeekInside() {
  const ref = useRef<HTMLElement>(null)
  useReveal(ref)
  const openBook = useSiteStore((s) => s.openBook)
  const lenis = useSiteStore((s) => s.lenis)
  const b = featuredBook
  const firstPara = b.firstPage.text.split(/\n\n+/)[0]
  return (
    <Section id="peek" ref={ref} className="bg-haze py-24 lg:py-32">
      <div className="grid items-center gap-12 lg:grid-cols-12">
        <div className="lg:col-span-7" data-reveal>
          <Eyebrow>{site.peek.heading}</Eyebrow>
          <Heading>{b.firstPage.heading}</Heading>
          <p className="mt-6 max-w-[58ch] font-accent text-[clamp(1.35rem,2.1vw,1.8rem)] italic leading-[1.55] text-ink-soft first-letter:float-left first-letter:mr-3 first-letter:text-[3.2em] first-letter:leading-[0.8] first-letter:not-italic first-letter:font-semibold first-letter:text-ink">
            {firstPara}
          </p>
          <p className="mt-6 text-lg text-body">{site.peek.sub}</p>
        </div>
        <div className="flex items-center gap-6 lg:col-span-5 lg:justify-end" data-reveal>
          <CoverImage book={b} className="w-[150px] lg:w-[200px]" />
          <div>
            <p className="text-xl font-semibold text-ink">{b.title}</p>
            <p className="text-body">
              {b.author} · ages {b.ageRange[0]}–{b.ageRange[1]}
            </p>
            <p className="mt-1 text-lg font-semibold text-ink">{formatPrice(b.price.amount)}</p>
            <Button
              className="mt-5"
              onClick={(e) => {
                lenis?.scrollTo('#shelf', { offset: -80 })
                openBook(b.id, e.currentTarget)
              }}
            >
              {site.peek.cta} <ArrowRight size={18} aria-hidden />
            </Button>
          </div>
        </div>
      </div>
    </Section>
  )
}
