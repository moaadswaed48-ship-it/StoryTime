import { Search } from 'lucide-react'
import { site, books, matchesFilter } from '@/content/loadBooks'
import { useSiteStore } from '@/store/useSiteStore'
import { cn } from '@/lib/cn'

export function ShelfControls() {
  const filter = useSiteStore((s) => s.shelf.filter)
  const setFilter = useSiteStore((s) => s.setFilter)
  const toggleTag = useSiteStore((s) => s.toggleTag)
  const count = books.filter((b) => matchesFilter(b, filter)).length
  const chip = (active: boolean) =>
    cn(
      'inline-flex h-10 items-center rounded-full border px-4 text-sm font-semibold transition-colors',
      active ? 'border-ink bg-ink text-white' : 'border-ink/15 bg-white/70 text-ink-soft hover:bg-white',
    )
  return (
    <div className="mt-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <label className="relative block w-full max-w-[420px]">
        <span className="sr-only">Search books</span>
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-body" aria-hidden />
        <input
          id="shelf-search"
          type="search"
          value={filter.query}
          onChange={(e) => setFilter({ query: e.target.value })}
          placeholder={site.shelf.searchPlaceholder}
          className="h-12 w-full rounded-full border border-ink/15 bg-white/80 pl-11 pr-4 text-[15px] text-ink placeholder:text-body focus:border-ink/40 focus:outline-none"
        />
      </label>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter books">
        {site.shelf.ageChips.map((a) => {
          const active = !!filter.ages && filter.ages[0] === a.min && filter.ages[1] === a.max
          return (
            <button key={a.label} type="button" aria-pressed={active} className={chip(active)} onClick={() => setFilter({ ages: active ? null : [a.min, a.max] })}>
              {a.label}
            </button>
          )
        })}
        {site.shelf.tagChips.map((t) => {
          const active = filter.tags.includes(t)
          return (
            <button key={t} type="button" aria-pressed={active} className={chip(active)} onClick={() => toggleTag(t)}>
              {t}
            </button>
          )
        })}
        <span className="ml-1 text-sm text-body" aria-live="polite">
          {count} {count === 1 ? 'book' : 'books'}
        </span>
      </div>
    </div>
  )
}
