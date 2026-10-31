import { useSiteStore } from '@/store/useSiteStore'
import { writeReduceToggle } from '@/app/useMotionTier'
import { site } from '@/content/loadBooks'
import { cn } from '@/lib/cn'

export function MotionToggle({ className }: { className?: string }) {
  const on = useSiteStore((s) => s.reduceToggle)
  const set = useSiteStore((s) => s.setReduceToggle)
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => {
        writeReduceToggle(!on)
        set(!on)
      }}
      className={cn(
        'inline-flex h-10 items-center gap-2 rounded-full border border-ink/15 bg-white/60 px-3 text-xs font-semibold text-ink-soft transition-colors hover:bg-white',
        className,
      )}
    >
      <span className={cn('h-2.5 w-2.5 rounded-full transition-colors', on ? 'bg-leaf' : 'bg-ink/25')} aria-hidden />
      {site.footer.reduceMotion}
    </button>
  )
}
