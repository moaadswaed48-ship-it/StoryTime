import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function GlassCard({ className, children, blur = true, ...rest }: HTMLAttributes<HTMLDivElement> & { blur?: boolean; children: ReactNode }) {
  return (
    <div className={cn('glass', blur && 'glass-blur', className)} {...rest}>
      {children}
    </div>
  )
}
