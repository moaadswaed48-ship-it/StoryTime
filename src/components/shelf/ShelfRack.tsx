import { books, matchesFilter } from '@/content/loadBooks'
import { useSiteStore } from '@/store/useSiteStore'
import { CoverSwatch } from '@/components/ui/CoverSwatch'
import { formatPrice } from '@/lib/formatPrice'

/** No-WebGL fallback: a horizontal scroll-snap rack of covers with the same tap → preview behaviour. */
export function ShelfRack() {
  const filter = useSiteStore((s) => s.shelf.filter)
  const openBook = useSiteStore((s) => s.openBook)
  const list = books.filter((b) => matchesFilter(b, filter))
  return (
    <ul className="mt-6 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4" data-lenis-prevent aria-label="Books">
      {list.map((b) => (
        <li key={b.id} className="w-[160px] shrink-0 snap-center">
          <button type="button" onClick={(e) => openBook(b.id, e.currentTarget)} className="block w-full text-left">
            <CoverSwatch book={b} className="w-full text-[16px] [container-type:inline-size]" />
            <span className="mt-3 block text-sm font-semibold text-ink">{b.title}</span>
            <span className="block text-xs text-body">{formatPrice(b.price.amount)}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}
