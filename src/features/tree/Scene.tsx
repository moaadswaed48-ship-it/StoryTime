import { forwardRef, useMemo, useRef, type CSSProperties, type ReactNode } from 'react'
import { BookOpen, Gamepad2, Play } from 'lucide-react'
import { Leaves, type LeavesHandle } from '@/design/Leaves'
import { useOnScreen } from '@/design/ui'
import { asset } from '@/lib/asset'
import { cn } from '@/lib/cn'
import { rtl } from '@/i18n/locale'
import { t } from '@/i18n/copy'
import type { Activity } from '@/store/useProfileStore'
import { buildTree, flock, KINDS, LEAF_TONE, MAPLE, MAPLE_VEINS, VIEW } from './art'
import { Crowned } from './Crowned'

export type Flags = Record<Activity, boolean>
export const DOOR_ICON = { read: BookOpen, watched: Play, played: Gamepad2 }
const TILT = [-16, 7, 15]

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

/** The migrating birds, in the V the teacher points at. They cross the sky behind the tree, slowly, again and again. */
function Flock({ paused }: { paused: boolean }) {
  const birds = useMemo(() => flock(9), [])
  return (
    <div className={cn('tree-flock pointer-events-none absolute inset-x-0 top-[13%]', paused && 'is-paused')} style={{ '--from': rtl ? 108 : -42, '--to': rtl ? -42 : 108 } as CSSProperties} data-tree-flock>
      <svg viewBox="-150 -80 170 160" className="h-auto w-[40%] min-w-[150px] max-w-[260px]" style={{ transform: rtl ? 'scaleX(-1)' : undefined }} aria-hidden>
        {birds.map((b, i) => (
          <g key={i} transform={`translate(${b.x} ${b.y}) scale(${b.s})`}>
            <g className="tree-wing" style={{ '--d': b.d } as CSSProperties}>
              <path d="M-13,-1 Q-7,-9 0,0 Q7,-9 13,-1 Q7,-5 0,3 Q-7,-5 -13,-1 Z" fill="#3a1c10" fillOpacity="0.86" />
            </g>
          </g>
        ))}
      </svg>
    </div>
  )
}

interface Props {
  /** Which big leaves hang on the tree. */
  earned: Flags
  /** Which limbs have opened their small leaves (after the big leaf has landed). */
  bloomed: Flags
  /** Limbs that were already open when the screen appeared: no opening animation for those. */
  still: Flags
  party: boolean
  count: number
  leafRef: (kind: Activity, el: HTMLButtonElement | null) => void
  onLeaf: (kind: Activity) => void
  onSari: (mode: '3d' | 'picture') => void
  leaves: React.RefObject<LeavesHandle | null>
  children?: ReactNode
}

/** The stage: a soft-focus sky from the story's last scene, the ground, the tree, its leaves, the birds and Sari. */
export const Scene = forwardRef<HTMLDivElement, Props>(function Scene({ earned, bloomed, still, party, count, leafRef, onLeaf, onSari, leaves, children }, ref) {
  const art = useMemo(() => buildTree(), [])
  const holder = useRef<HTMLDivElement>(null)
  const onScreen = useOnScreen(holder, '0px')
  return (
    <div ref={ref} className="tree-stage grain relative overflow-hidden rounded-[32px] shadow-lift" data-leaves={count} data-party={party}>
      <div ref={holder} className="absolute inset-0">
        <img src={asset('story/k12-sm.webp')} alt="" className="tree-sky absolute inset-0 h-full w-full object-cover object-[72%_0%]" draggable={false} />
        <div className="tree-sun absolute bottom-[4%] start-[18%] aspect-square w-[78%] rounded-full" aria-hidden />
        {/* a little depth where the words sit */}
        <div className="absolute inset-x-0 top-0 h-[34%] bg-gradient-to-b from-[rgba(58,22,8,.42)] to-transparent" aria-hidden />
        {party && <Flock paused={!onScreen} />}
        <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[17%] w-full" aria-hidden>
          <defs>
            <linearGradient id="tree-ground" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#a4551c" />
              <stop offset="0.5" stopColor="#6d3414" />
              <stop offset="1" stopColor="#3a1d0e" />
            </linearGradient>
          </defs>
          <path d="M0,8 Q22,1 50,3.5 T100,6 V20 H0 Z" fill="url(#tree-ground)" />
          <path d="M0,8 Q22,1 50,3.5 T100,6" fill="none" stroke="#f4a35e" strokeOpacity="0.55" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
        </svg>

        {/* the tree steps aside a little when Sari arrives */}
        <div className="tree-box absolute bottom-[4.5%] start-1/2 transition-transform duration-[1200ms] ease-[var(--ease-out)]" style={{ transform: `translateX(${(rtl ? 50 : -50) + (party ? (rtl ? 5 : -5) : 0)}%)` }}>
          <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
            <defs>
              <linearGradient id="tree-wood" gradientUnits="userSpaceOnUse" x1="60" y1="0" x2="560" y2="120">
                <stop offset="0" stopColor="#3b1f10" />
                <stop offset="1" stopColor="#5a2f17" />
              </linearGradient>
              <symbol id="tree-maple" viewBox="-56 -56 112 112" overflow="visible">
                <path d={MAPLE} />
              </symbol>
            </defs>
            <ellipse cx="300" cy="612" rx="150" ry="13" fill="#1e0d05" opacity="0.42" />
            {/* the low sun catches one edge of every limb */}
            <g fill="#d98a4e" transform="translate(3 -0.6)">
              {art.wood.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>
            <g fill="url(#tree-wood)">
              {art.wood.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>
            {art.limbs.map((limb, li) => {
              const kind = rtl ? KINDS[2 - li] : KINDS[li]
              return (
                <g key={li} className={cn('tree-limb', bloomed[kind] && 'is-on', still[kind] && 'is-still')} data-limb={kind}>
                  {limb.leaves.map((l) => (
                    <g key={l.i} transform={`translate(${l.x.toFixed(1)} ${l.y.toFixed(1)}) rotate(${l.r.toFixed(0)}) scale(${l.s.toFixed(2)})`}>
                      <use href="#tree-maple" x="-56" y="-56" width="112" height="112" className="tree-small" fill={l.c} stroke="rgba(110,40,0,.45)" strokeWidth="2.5" style={{ '--i': l.i } as CSSProperties} />
                    </g>
                  ))}
                </g>
              )
            })}
          </svg>
          {art.limbs.map((limb, li) => {
            const kind = rtl ? KINDS[2 - li] : KINDS[li]
            const on = earned[kind]
            const Icon = DOOR_ICON[kind]
            return (
              <button
                key={kind}
                type="button"
                ref={(el) => leafRef(kind, el)}
                className="tree-leaf text-white"
                style={{ left: `${(limb.spot[0] / VIEW.w) * 100}%`, top: `${(limb.spot[1] / VIEW.h) * 100}%`, rotate: `${TILT[li]}deg` }}
                data-leaf={kind}
                data-on={on}
                aria-label={on ? `${t.app.tree[kind]} · ${t.app.story.done}` : `${t.app.tree.go} · ${t.app.tree[kind]}`}
                onClick={() => onLeaf(kind)}
              >
                <Maple kind={kind} on={on} className="tree-leaf-art" big />
                {!on && <Icon className="absolute start-1/2 top-[46%] h-[26%] w-[26%] -translate-x-1/2 -translate-y-1/2 rtl:translate-x-1/2" strokeWidth={2.4} style={{ rotate: `${-TILT[li]}deg` }} aria-hidden />}
              </button>
            )
          })}
        </div>

        {party && (
          <div className="tree-sari absolute bottom-[5%] end-0 h-[50%] w-[40%] lg:bottom-[3%] lg:h-[54%]" data-tree-sari>
            <div className="absolute bottom-[10%] start-1/2 h-[7%] w-[56%] -translate-x-1/2 rounded-[50%] bg-[#1e0d05]/50 blur-[6px] rtl:translate-x-1/2" aria-hidden />
            <Crowned onMode={onSari} />
          </div>
        )}
        <Leaves ref={leaves} density={7} />
      </div>
      {children}
    </div>
  )
})
