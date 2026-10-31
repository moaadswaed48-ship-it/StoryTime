import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

const cls =
  'inline-flex shrink-0 items-center justify-center rounded-full border border-white/80 bg-white/25 text-ink transition-[transform,background-color] duration-150 ease-out hover:bg-white/60 active:scale-[0.96]'

/** Thin outlined circle (the reference's play / 360° affordances). Render `as="span"` when it sits inside another control. */
export function CircleButton({ className, children, size = 56, as = 'button', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { size?: number; children: ReactNode; as?: 'button' | 'span' }) {
  if (as === 'span') {
    return (
      <span style={{ width: size, height: size }} className={cn(cls, className)} aria-hidden>
        {children}
      </span>
    )
  }
  return (
    <button type="button" style={{ width: size, height: size }} className={cn(cls, className)} {...rest}>
      {children}
    </button>
  )
}
