import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

const base =
  'inline-flex h-14 items-center justify-center gap-3 rounded-full px-7 text-[15px] font-semibold transition-[transform,background-color,color] duration-150 ease-out active:scale-[0.97]'
const variants = {
  primary: 'bg-ink text-white hover:bg-ink-soft',
  ghost: 'border border-ink/15 bg-white/60 text-ink hover:bg-white',
}

type Variant = keyof typeof variants

export function Button({ variant = 'primary', className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; children: ReactNode }) {
  return (
    <button type="button" className={cn(base, variants[variant], className)} {...rest}>
      {children}
    </button>
  )
}

export function LinkButton({ variant = 'primary', className, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: Variant; children: ReactNode }) {
  return (
    <a className={cn(base, variants[variant], className)} {...rest}>
      {children}
    </a>
  )
}
