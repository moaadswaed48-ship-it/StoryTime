import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Thin outlined circle button (the reference's play / 360° affordances). */
export function CircleButton({ className, children, size = 56, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { size?: number; children: ReactNode }) {
  return (
    <button
      type="button"
      style={{ width: size, height: size }}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full border border-white/80 bg-white/25 text-ink transition-[transform,background-color] duration-150 ease-out hover:bg-white/60 active:scale-[0.96]',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
