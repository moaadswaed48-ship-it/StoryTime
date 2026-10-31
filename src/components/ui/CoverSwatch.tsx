import type { Book } from '@/content/schema'
import { cn } from '@/lib/cn'

/** Lightweight CSS stand-in for a book cover (used in cards before the canvas cover is available). */
export function CoverSwatch({ book, className }: { book: Book; className?: string }) {
  const { bg, ink, accent } = book.cover.palette
  return (
    <div
      className={cn('relative overflow-hidden rounded-[6px] shadow-[inset_-3px_0_6px_rgba(0,0,0,.25),0_6px_14px_rgba(16,20,24,.18)]', className)}
      style={{ background: `linear-gradient(135deg, ${bg} 0%, color-mix(in oklab, ${bg} 80%, black) 100%)`, aspectRatio: '3 / 4' }}
      aria-hidden
    >
      <span className="absolute inset-x-0 top-[14%] px-[10%] text-center font-accent italic leading-[1.05]" style={{ color: ink, fontSize: 'min(1.1em, 9cqw)' }}>
        {book.title}
      </span>
      <span className="absolute bottom-[12%] left-1/2 h-[18%] w-[18%] -translate-x-1/2 rounded-full" style={{ background: accent }} />
      <span className="absolute inset-y-0 left-0 w-[7%]" style={{ background: `color-mix(in oklab, ${bg} 70%, black)` }} />
    </div>
  )
}
