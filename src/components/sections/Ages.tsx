import { useRef } from 'react'
import { books, site } from '@/content/loadBooks'
import { useSiteStore } from '@/store/useSiteStore'
import { useReveal } from '@/app/useReveal'
import { Section, Eyebrow, Heading } from './Section'

export function Ages() {
  const ref = useRef<HTMLElement>(null)
  useReveal(ref)
  const setFilter = useSiteStore((s) => s.setFilter)
  const lenis = useSiteStore((s) => s.lenis)
  return (
    <Section id="ages" ref={ref} className="bg-paper py-24 lg:py-32">
      <div className="max-w-[60ch]" data-reveal>
        <Eyebrow>Picked by age</Eyebrow>
        <Heading>{site.ages.heading}</Heading>
        <p className="mt-5 text-lg leading-relaxed text-body">{site.ages.sub}</p>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {site.ages.bands.map((band) => {
          const swatches = books.filter((b) => b.ageRange[1] >= band.min && b.ageRange[0] <= band.max).slice(0, 4)
          return (
            <button
              key={band.label}
              type="button"
              data-reveal
              onClick={() => {
                setFilter({ ages: [band.min, band.max], query: '', tags: [] })
                lenis?.scrollTo('#shelf', { offset: -80 })
              }}
              className="group rounded-card border border-ink/10 bg-white/70 p-7 text-left transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(16,20,24,.10)]"
            >
              <div className="flex gap-1.5" aria-hidden>
                {swatches.map((b) => (
                  <span key={b.id} className="h-10 w-7 rounded-[3px]" style={{ background: b.cover.palette.bg }} />
                ))}
              </div>
              <h3 className="mt-6 text-2xl font-semibold text-ink">{band.label}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-body">{band.text}</p>
              <span className="mt-5 inline-block text-sm font-semibold text-moss group-hover:underline">Browse these books →</span>
            </button>
          )
        })}
      </div>
    </Section>
  )
}
