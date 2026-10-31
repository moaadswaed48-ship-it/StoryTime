import { ArrowRight } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { CoverSwatch } from '@/components/ui/CoverSwatch'
import { newBooks, site } from '@/content/loadBooks'
import { useSiteStore } from '@/store/useSiteStore'
import { cn } from '@/lib/cn'

export function ThumbCard({ className }: { className?: string }) {
  const lenis = useSiteStore((s) => s.lenis)
  const openBook = useSiteStore((s) => s.openBook)
  const book = newBooks[0]
  if (!book) return null
  return (
    <GlassCard blur={false} className={cn('p-3', className)}>
      <button
        type="button"
        onClick={(e) => {
          lenis?.scrollTo('#shelf', { offset: -80 })
          openBook(book.id, e.currentTarget)
        }}
        className="flex items-center gap-4 text-left"
        aria-label={`${site.hero.thumb.kicker}: ${book.title} — open preview`}
      >
        <CoverSwatch book={book} className="w-[64px] [container-type:inline-size]" />
        <span className="min-w-0">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-body">{site.hero.thumb.kicker}</span>
          <span className="block text-[15px] font-semibold text-ink">{book.title}</span>
          <span className="block text-sm text-body">{site.hero.thumb.sub}</span>
          <span className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-ink">
            <span className="h-px w-6 bg-ink/50" aria-hidden /> <ArrowRight size={14} aria-hidden />
          </span>
        </span>
      </button>
    </GlassCard>
  )
}
