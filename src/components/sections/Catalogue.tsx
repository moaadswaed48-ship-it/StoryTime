import { useRef } from 'react'
import { books, matchesFilter, site } from '@/content/loadBooks'
import { useSiteStore } from '@/store/useSiteStore'
import { useReveal } from '@/app/useReveal'
import { formatPrice } from '@/lib/formatPrice'
import { CoverImage } from '@/components/ui/CoverImage'
import { Section, Eyebrow, Heading } from './Section'

/** Every book as a DOM card: the SEO / screen-reader / no-WebGL mirror of the 3D shelf (same filter store). */
export function Catalogue() {
  const ref = useRef<HTMLElement>(null)
  useReveal(ref)
  const filter = useSiteStore((s) => s.shelf.filter)
  const openBook = useSiteStore((s) => s.openBook)
  const list = books.filter((b) => matchesFilter(b, filter))
  return (
    <Section id="catalogue" ref={ref} className="bg-paper py-24 lg:py-32">
      <div className="max-w-[60ch]" data-reveal>
        <Eyebrow>All books</Eyebrow>
        <Heading>Every story on the shelf</Heading>
        <p className="mt-5 text-lg leading-relaxed text-body">{site.shelf.sub}</p>
      </div>
      <ul className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-5">
        {list.map((b) => (
          <li key={b.id} data-reveal>
            <button type="button" onClick={(e) => openBook(b.id, e.currentTarget)} className="group block w-full text-left">
              <div className="transition-transform duration-200 ease-out group-hover:-translate-y-1">
                <CoverImage book={b} />
              </div>
              <h3 className="mt-4 text-[15px] font-semibold leading-snug text-ink">{b.title}</h3>
              <p className="text-sm text-body">
                {b.author} · ages {b.ageRange[0]}–{b.ageRange[1]}
              </p>
              <p className="mt-1 text-sm font-semibold text-ink">{formatPrice(b.price.amount)}</p>
              <span className="mt-2 inline-block text-xs font-semibold text-moss group-hover:underline">{site.peek.cta} →</span>
            </button>
          </li>
        ))}
        {list.length === 0 && <li className="col-span-full text-lg text-body">{site.shelf.empty}</li>}
      </ul>
    </Section>
  )
}
