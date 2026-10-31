import type { ComponentPropsWithRef, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Section({ className, children, ...rest }: ComponentPropsWithRef<'section'> & { children: ReactNode }) {
  return (
    <section className={cn('relative scroll-mt-20', className)} {...rest}>
      <div className="mx-auto w-full max-w-[1440px] px-5 lg:px-12">{children}</div>
    </section>
  )
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-moss">{children}</p>
}

export function Heading({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn('mt-3 text-[clamp(2rem,4vw,3.4rem)] font-semibold leading-[1.02] tracking-[-0.02em] text-ink', className)}>{children}</h2>
}
