import type { Activity } from '@/store/useProfileStore'
import { LEAF_TONE, MAPLE, MAPLE_VEINS } from './art'

/** One maple leaf: full colour when earned, a dashed outline (with its door's sign) while it waits. */
export function Maple({ kind, on, className, big = false }: { kind: Activity; on: boolean; className?: string; big?: boolean }) {
  const tone = LEAF_TONE[kind]
  const id = `tree-g-${kind}`
  return (
    <svg viewBox="-56 -56 112 112" className={className} aria-hidden>
      {on ? (
        <>
          <defs>
            <linearGradient id={id} x1="0.2" y1="0" x2="0.8" y2="1">
              <stop offset="0" stopColor={tone.a} />
              <stop offset="1" stopColor={tone.b} />
            </linearGradient>
          </defs>
          <path d={MAPLE} fill={`url(#${id})`} stroke="rgba(120,44,0,.5)" strokeWidth="1.5" strokeLinejoin="round" />
          <path d={MAPLE_VEINS} fill="none" stroke="rgba(110,40,0,.38)" strokeWidth="2" strokeLinecap="round" />
          <path d="M-14,-18 Q-6,-30 -2,-38" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="3" strokeLinecap="round" />
        </>
      ) : (
        <g className="tree-ghost">
          <path d={MAPLE} fill="currentColor" fillOpacity="0.14" stroke="currentColor" strokeOpacity="0.9" strokeWidth={big ? 2.8 : 4} strokeDasharray={big ? '1 7' : undefined} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
    </svg>
  )
}
