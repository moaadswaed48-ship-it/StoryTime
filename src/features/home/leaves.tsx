import { BookOpen, Gamepad2, Play, type LucideIcon } from 'lucide-react'
import type { Activity, StoryProgress } from '@/store/useProfileStore'
import { MAPLE_BODY, MAPLE_STEM } from '@/features/enter/Avatar'
import { cn } from '@/lib/cn'

/** The three things a child can do with a story, in the order they are offered. Each one earns a leaf. */
export const ACTIVITIES: { id: Activity; icon: LucideIcon }[] = [
  { id: 'read', icon: BookOpen },
  { id: 'watched', icon: Play },
  { id: 'played', icon: Gamepad2 },
]
export const earned = (p: StoryProgress | undefined, a: Activity) => !!p?.[a]

/** One maple leaf (blade and a thin stalk): filled when earned, a quiet outline when not yet. */
export function Leaf({ on, className }: { on: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn('leaf', on && 'is-on', className)} aria-hidden>
      <path className="leaf__stem" d={MAPLE_STEM} />
      <path className="leaf__blade" d={MAPLE_BODY} />
    </svg>
  )
}

/** Progress at a glance, without numbers: three small leaves, one for reading, one for watching, one for playing. */
export function LeafMarks({ progress, className, label }: { progress?: StoryProgress; className?: string; label: string }) {
  return (
    <span className={cn('leaf-marks', className)} role="img" aria-label={label}>
      {ACTIVITIES.map(({ id }) => (
        <span key={id} className="leaf-marks__one" data-seg={id} data-on={earned(progress, id) ? '' : undefined}>
          <Leaf on={earned(progress, id)} />
        </span>
      ))}
    </span>
  )
}
