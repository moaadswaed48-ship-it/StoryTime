import { forwardRef, useMemo, useRef, type CSSProperties, type ReactNode } from 'react'
import { BookOpen, Gamepad2, Play } from 'lucide-react'
import { Leaves, type LeavesHandle } from '@/design/Leaves'
import { useOnScreen } from '@/design/ui'
import { asset } from '@/lib/asset'
import { cn } from '@/lib/cn'
import { rtl } from '@/i18n/locale'
import { t } from '@/i18n/copy'
import type { Activity } from '@/store/useProfileStore'
import { buildTree, carpet, flock, GROUND, KINDS, MAPLE, VIEW } from './art'
import { Crowned } from './Crowned'
import { Maple } from './Maple'

export { Maple }

export type Flags = Record<Activity, boolean>
export const DOOR_ICON = { read: BookOpen, watched: Play, played: Gamepad2 }
const TILT = [-16, 7, 15]

/** The migrating birds, in the V the teacher points at. They cross the sky in front of the tree, slowly, again and again. */
function Flock({ paused }: { paused: boolean }) {
  const birds = useMemo(() => flock(11), [])
  return (
    <div className={cn('tree-flock pointer-events-none absolute inset-x-0 top-[12%]', paused && 'is-paused')} style={{ direction: 'ltr', '--from': rtl ? 110 : -56, '--to': rtl ? -56 : 110, '--rest': rtl ? '40%' : '8%' } as CSSProperties} data-tree-flock>
      <svg viewBox="-216 -118 240 236" className="h-auto w-[52%] min-w-[190px] max-w-[330px]" style={{ transform: rtl ? 'scaleX(-1)' : undefined }} aria-hidden>
        {birds.map((b, i) => (
          <g key={i} transform={`translate(${b.x} ${b.y}) scale(${b.s})`}>
            <g className="tree-wing" style={{ '--d': b.d } as CSSProperties}>
              <path d="M-17,-2 Q-9,-12 0,-1 Q9,-12 17,-2 Q9,-6 2,4 L7,2 L0,7 L-3,4 Q-9,-6 -17,-2 Z" fill="#4a2030" />
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
  const fallen = useMemo(() => carpet(), [])
  const holder = useRef<HTMLDivElement>(null)
  const onScreen = useOnScreen(holder, '0px')
  const box = `0 0 ${VIEW.w} ${VIEW.h}`
  return (
    <div ref={ref} className="tree-stage grain relative overflow-hidden rounded-[32px] shadow-lift" data-leaves={count} data-party={party}>
      <div ref={holder} className="absolute inset-0">
        <img src={asset('story/k12-sm.webp')} alt="" className="tree-sky absolute inset-0 h-full w-full object-cover object-[72%_0%]" draggable={false} />
        <div className="tree-sun absolute bottom-[4%] start-[18%] aspect-square w-[78%] rounded-full" aria-hidden />
        {/* a little depth where the words sit */}
        <div className="absolute inset-x-0 top-0 h-[34%] bg-gradient-to-b from-[rgba(58,22,8,.42)] to-transparent" aria-hidden />

        {/* the hill, lit along its crest, with the film's carpet of fallen leaves */}
        <div className="absolute inset-x-0 bottom-0 h-[17%]" aria-hidden>
          <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
            <defs>
              <linearGradient id="tree-ground" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#b9651f" />
                <stop offset="0.38" stopColor="#7c3d16" />
                <stop offset="1" stopColor="#3a1d0e" />
              </linearGradient>
            </defs>
            <path d={`${GROUND} V20 H0 Z`} fill="url(#tree-ground)" />
            <path d={GROUND} fill="none" stroke="#ffc27a" strokeOpacity="0.7" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          </svg>
          {fallen.map((l, i) => (
            <svg key={i} viewBox="-56 -56 112 112" className="absolute h-[18px] w-[18px]" style={{ left: `${l.x}%`, top: `${l.y}%`, transform: `translate(-50%,-50%) scaleY(0.46) rotate(${l.r.toFixed(0)}deg) scale(${l.s.toFixed(2)})` }}>
              <path d={MAPLE} fill={l.c} />
            </svg>
          ))}
        </div>

        {/* the tree steps aside and back a little when Sari arrives */}
        <div className="tree-box absolute bottom-[4.5%] start-1/2 origin-bottom transition-transform duration-[1200ms] ease-[var(--ease-out)]" style={{ transform: `translateX(${(rtl ? 50 : -50) + (party ? (rtl ? 9 : -9) : 0)}%) scale(${party ? 0.9 : 1})` }}>
          <div className="absolute bottom-[-1.5%] start-1/2 h-[5%] w-[58%] -translate-x-1/2 rounded-[50%] bg-[#1a0a03]/55 blur-[10px] rtl:translate-x-1/2" aria-hidden />
          {/* the wood is modelled by one light from the low sun, so the limbs read as round, not as cut paper */}
          <svg viewBox={box} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
            <defs>
              <filter id="tree-clay" x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
                <feGaussianBlur in="SourceAlpha" stdDeviation="6" result="h" />
                <feDiffuseLighting in="h" surfaceScale="6" diffuseConstant="1.1" lightingColor="#ffd2a0" result="lit">
                  <feDistantLight azimuth={-28} elevation={42} />
                </feDiffuseLighting>
                <feComposite in="lit" in2="SourceGraphic" operator="arithmetic" k1="1.05" k2="0" k3="0.34" k4="0" result="shaded" />
                <feComposite in="shaded" in2="SourceAlpha" operator="in" />
              </filter>
            </defs>
            <g fill="#7b4324" filter="url(#tree-clay)">
              {art.wood.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>
          </svg>
          <svg viewBox={box} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
            <defs>
              <linearGradient id="tree-leaf-light" x1="0.1" y1="0" x2="0.9" y2="1">
                <stop offset="0" stopColor="#fff6d8" stopOpacity="0.5" />
                <stop offset="0.5" stopColor="#fff6d8" stopOpacity="0" />
                <stop offset="1" stopColor="#5a1400" stopOpacity="0.3" />
              </linearGradient>
              <symbol id="tree-maple" viewBox="-56 -56 112 112" overflow="visible">
                <path d={MAPLE} />
                <path d={MAPLE} fill="url(#tree-leaf-light)" />
                <path d="M0,30 L0,-34 M0,10 L-26,-12 M0,10 L26,-12" fill="none" stroke="#5a1400" strokeOpacity="0.2" strokeWidth="2.5" strokeLinecap="round" />
              </symbol>
            </defs>
            {art.limbs.map((limb, li) => {
              const kind = rtl ? KINDS[2 - li] : KINDS[li]
              return (
                <g key={li} className={cn('tree-limb', bloomed[kind] && 'is-on', still[kind] && 'is-still')} data-limb={kind}>
                  {limb.leaves.map((l) => (
                    <g key={l.i} transform={`translate(${l.x.toFixed(1)} ${l.y.toFixed(1)}) rotate(${l.r.toFixed(0)}) scale(${l.s.toFixed(2)})`}>
                      <use href="#tree-maple" x="-56" y="-56" width="112" height="112" className="tree-small" fill={l.c} style={{ '--i': l.i } as CSSProperties} />
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

        {party && <Flock paused={!onScreen} />}
        {party && (
          <div className="tree-sari absolute bottom-[5%] end-[-3%] h-[58%] w-[48%] sm:end-0 sm:w-[42%] lg:bottom-[3%]" data-tree-sari>
            {/* a pocket of warm shade behind him, so the crown reads against the foliage */}
            <div className="tree-shade absolute inset-x-[-6%] top-[-4%] h-[62%] rounded-[50%]" aria-hidden />
            <div className="absolute bottom-[10%] start-1/2 h-[7%] w-[56%] -translate-x-1/2 rounded-[50%] bg-[#1a0a03]/55 blur-[7px] rtl:translate-x-1/2" aria-hidden />
            <Crowned onMode={onSari} />
          </div>
        )}
        <Leaves ref={leaves} density={7} />
      </div>
      {children}
    </div>
  )
})
