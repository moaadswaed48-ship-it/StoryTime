import { BookOpen, Gamepad2, Play, type LucideIcon } from 'lucide-react'
import type { Activity, StoryProgress } from '@/store/useProfileStore'
import { MAPLE } from '@/features/enter/Avatar'
import { cn } from '@/lib/cn'

/** The three things a child can do with a story, in the order they are offered. Each one earns a leaf. */
export const ACTIVITIES: { id: Activity; icon: LucideIcon }[] = [
  { id: 'read', icon: BookOpen },
  { id: 'watched', icon: Play },
  { id: 'played', icon: Gamepad2 },
]
export const earned = (p: StoryProgress | undefined, a: Activity) => !!p?.[a]

/** One maple leaf: filled when earned, a quiet outline when not yet. */
export function Leaf({ on, className }: { on: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn('leaf', on && 'is-on', className)} aria-hidden>
      <path d={MAPLE} />
    </svg>
  )
}

const TAU = Math.PI * 2
const pt = (r: number, a: number) => `${(32 + r * Math.cos(a)).toFixed(2)} ${(32 + r * Math.sin(a)).toFixed(2)}`

/**
 * Progress as a ring of three slim leaves round a maple leaf: one for reading, one for watching, one for playing.
 * No numbers to read — a leaf simply turns from an outline to autumn.
 */
export function LeafRing({ progress, className, label }: { progress?: StoryProgress; className?: string; label: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn('leaf-ring', className)} role="img" aria-label={label}>
      {ACTIVITIES.map(({ id }, k) => {
        const mid = -Math.PI / 2 + (k * TAU) / 3
        const a0 = mid - 0.84
        const a1 = mid + 0.84
        const d = `M${pt(25, a0)}Q${pt(40, mid)} ${pt(25, a1)}Q${pt(24.5, mid)} ${pt(25, a0)}Z`
        return <path key={id} d={d} className={cn('leaf-ring__seg', earned(progress, id) && 'is-on')} data-seg={id} />
      })}
      <path d={MAPLE} className="leaf-ring__heart" transform="translate(32 32.5) scale(0.92) translate(-12 -12)" />
    </svg>
  )
}
