import { ArrowUpRight, BookOpen } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { featuredBook, site } from '@/content/loadBooks'
import { useSiteStore } from '@/store/useSiteStore'
import { cn } from '@/lib/cn'

export function GlassCallout({ className }: { className?: string }) {
  const openBook = useSiteStore((s) => s.openBook)
  const lenis = useSiteStore((s) => s.lenis)
  return (
    <GlassCard className={cn('p-2', className)}>
      <button
        type="button"
        onClick={(e) => {
          lenis?.scrollTo('#shelf', { offset: -80 })
          openBook(featuredBook.id, e.currentTarget)
        }}
        className="flex w-full items-center gap-4 rounded-[14px] p-2 text-left transition-colors hover:bg-white/60"
        aria-label={`${site.hero.callout.kicker}: ${featuredBook.title} — open preview`}
      >
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-ink/10 bg-white text-ink">
          <BookOpen size={20} strokeWidth={1.6} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-body">{site.hero.callout.kicker}</span>
          <span className="block truncate text-[15px] font-semibold text-ink">{featuredBook.title}</span>
          <span className="block text-sm text-body">{site.hero.callout.sub}</span>
        </span>
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink/10 bg-white/70 text-ink">
          <ArrowUpRight size={18} strokeWidth={1.75} aria-hidden />
        </span>
      </button>
    </GlassCard>
  )
}
