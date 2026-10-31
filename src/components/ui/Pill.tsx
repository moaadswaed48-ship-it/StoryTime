import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Pill({ children, className, dot = true }: { children: ReactNode; className?: string; dot?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2.5 rounded-full bg-white/70 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-soft',
        className,
      )}
    >
      {dot && <span className="h-2 w-2 rounded-full bg-leaf" aria-hidden />}
      {children}
    </span>
  )
}
