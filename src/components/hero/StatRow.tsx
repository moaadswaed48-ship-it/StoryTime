import { site } from '@/content/loadBooks'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'

export function StatRow({ className }: { className?: string }) {
  return (
    <ul className={cn('flex flex-wrap gap-x-10 gap-y-6', className)} aria-label="Why StoryTime">
      {site.hero.stats.map((s) => (
        <li key={s.title} className="flex flex-col gap-3">
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-white/80 bg-white/20 text-ink">
            <Icon name={s.icon} size={26} strokeWidth={1.5} aria-hidden />
          </span>
          <span className="text-[15px] font-semibold text-ink">{s.title}</span>
          <span className="-mt-2 text-sm font-medium text-ink-soft/80">{s.sub}</span>
        </li>
      ))}
    </ul>
  )
}
