import { forwardRef, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
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

/**
 * The migrating birds, in the V the teacher points at. They fly in when the last leaf lands and then stay,
 * gliding in the open sky above Sari: the picture her title promises is on screen for as long as the tree is full.
 */
function Flock({ paused }: { paused: boolean }) {
  const birds = useMemo(() => flock(7), [])
  return (
    <div className={cn('tree-flock pointer-events-none absolute inset-x-0 top-[13%]', paused && 'is-paused')} style={{ direction: 'ltr', '--from': rtl ? -60 : 110, '--rest': rtl ? '3%' : '52%' } as CSSProperties} data-tree-flock>
      <div className="tree-drift w-[40%] min-w-[150px] max-w-[212px]">
        <svg viewBox="-136 -78 160 156" className="h-auto w-full" style={{ transform: rtl ? undefined : 'scaleX(-1)' }} aria-hidden>
          {birds.map((b, i) => (
            <g key={i} transform={`translate(${b.x} ${b.y}) scale(${b.s})`} opacity={b.o}>
              <g className="tree-wing" style={{ '--d': b.d } as CSSProperties}>
                <path d="M-17,-2 Q-9,-12 0,-1 Q9,-12 17,-2 Q9,-6 2,4 L7,2 L0,7 L-3,4 Q-9,-6 -17,-2 Z" fill="#4a2030" />
              </g>
            </g>
          ))}
        </svg>
      </div>
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
  const first = KINDS.find((k) => !earned[k])

  // When Sari arrives, the small leaves nearest his head fold away, so his crown stands against open sky.
  const boxRef = useRef<HTMLDivElement>(null)
  const sariRef = useRef<HTMLDivElement>(null)
  const [room, setRoom] = useState<{ x: number; y: number; r: number } | null>(null)
  useEffect(() => {
    if (!party) return setRoom(null)
    const measure = () => {
      const b = boxRef.current?.getBoundingClientRect()
      const s = sariRef.current?.getBoundingClientRect()
      if (!b?.width || !s?.width) return
      const k = VIEW.w / b.width
      setRoom({ x: (s.left + s.width / 2 - b.left) * k, y: (s.top + s.height * 0.23 - b.top) * k, r: (Math.max(46, s.width * 0.2) + 18) * k })
    }
    // after the tree has stepped aside (at once when motion is reduced)
    const timers = [window.setTimeout(measure, 60), window.setTimeout(measure, 1350)]
    window.addEventListener('resize', measure)
    return () => {
      timers.forEach(clearTimeout)
      window.removeEventListener('resize', measure)
    }
  }, [party])
  const box = `0 0 ${VIEW.w} ${VIEW.h}`
  return (
    <div ref={ref} className="tree-stage grain relative overflow-hidden rounded-[32px] shadow-lift" data-leaves={count} data-party={party}>
      <div ref={holder} className="absolute inset-0">
        <img src={asset('story/k12-sm.webp')} alt="" className="tree-sky absolute inset-0 h-full w-full object-cover object-[72%_0%]" draggable={false} />
        <div className="tree-sun absolute bottom-[4%] start-[18%] aspect-square w-[78%] rounded-full" aria-hidden />
        {/* a little depth where the words sit */}
        <div className="absolute inset-x-0 top-0 h-[104px] bg-gradient-to-b from-[rgba(58,22,8,.24)] to-transparent" aria-hidden />

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
            <clipPath id="tree-hill">
              <path d={`${GROUND} V20 H0 Z`} />
            </clipPath>
            <filter id="tree-soft" x="-5%" y="-20%" width="110%" height="140%">
              <feGaussianBlur stdDeviation="0.9 0.5" />
            </filter>
            {/* the film's own leaf-covered ground, out of focus, under the hill's shading */}
            <g clipPath="url(#tree-hill)">
              <image href={asset('story/k08-sm.webp')} x="-6" y="-4" width="112" height="28" preserveAspectRatio="xMidYMax slice" filter="url(#tree-soft)" />
              <path d={`${GROUND} V20 H0 Z`} fill="url(#tree-ground)" opacity="0.62" />
            </g>
            <path d={GROUND} fill="none" stroke="#ffc27a" strokeOpacity="0.7" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          </svg>
          {fallen.map((l, i) => (
            <svg key={i} viewBox="-56 -56 112 112" className="absolute h-[16px] w-[16px]" style={{ left: `${l.x}%`, top: `${l.y}%`, transform: `translate(-50%,-50%) scaleY(0.46) rotate(${l.r.toFixed(0)}deg) scale(${l.s.toFixed(2)})` }}>
              <path d={MAPLE} fill={l.c} />
            </svg>
          ))}
        </div>

        {/* the tree steps aside and back a little when Sari arrives */}
        <div ref={boxRef} className="tree-box absolute bottom-[4.5%] start-1/2 origin-bottom transition-transform duration-[1200ms] ease-[var(--ease-out)]" style={{ transform: `translateX(calc(${rtl ? 50 : -50}% + ${party ? `var(--party-shift) * ${rtl ? 1 : -1}` : '0%'})) scale(${party ? 'var(--party-scale)' : 1})` }}>
          <div className="absolute bottom-[-1.5%] start-1/2 h-[5%] w-[58%] -translate-x-1/2 rounded-[50%] bg-[#1a0a03]/55 blur-[10px] rtl:translate-x-1/2" aria-hidden />
          {/* the wood is modelled by one light from the low sun, so the limbs read as round, not as cut paper */}
          <svg viewBox={box} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
            <defs>
              {/* shade on the side away from the sun, warm light on the side facing it: soft inner edges, no outline */}
              <filter id="tree-clay" x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
                <feGaussianBlur in="SourceAlpha" stdDeviation="3.2" result="soft" />
                <feOffset in="soft" dx="4.5" dy="-2" result="toSun" />
                <feComposite in="SourceAlpha" in2="toSun" operator="out" result="farSide" />
                <feFlood floodColor="#240f05" floodOpacity="0.7" />
                <feComposite in2="farSide" operator="in" result="shade" />
                <feOffset in="soft" dx="-3" dy="1.2" result="fromSun" />
                <feComposite in="SourceAlpha" in2="fromSun" operator="out" result="sunSide" />
                <feFlood floodColor="#f29a55" floodOpacity="0.5" />
                <feComposite in2="sunSide" operator="in" result="light" />
                <feMerge>
                  <feMergeNode in="SourceGraphic" />
                  <feMergeNode in="shade" />
                  <feMergeNode in="light" />
                </feMerge>
              </filter>
            </defs>
            <g fill="#5e3018" filter="url(#tree-clay)">
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
            {/* leaves gathered at the foot of the trunk, so it stands in the ground, not on it */}
            {art.foot.map((l, i) => (
              <g key={i} transform={`translate(${l.x.toFixed(1)} ${l.y.toFixed(1)}) scale(1 0.5) rotate(${l.r.toFixed(0)}) scale(${l.s.toFixed(2)})`}>
                <use href="#tree-maple" x="-56" y="-56" width="112" height="112" fill={l.c} />
              </g>
            ))}
            {art.limbs.map((limb, li) => {
              const kind = rtl ? KINDS[2 - li] : KINDS[li]
              return (
                <g key={li} className={cn('tree-limb', bloomed[kind] && 'is-on', still[kind] && 'is-still')} data-limb={kind}>
                  {limb.leaves.map((l) => (
                    <g key={l.i} transform={`translate(${l.x.toFixed(1)} ${l.y.toFixed(1)}) rotate(${l.r.toFixed(0)}) scale(${l.s.toFixed(2)})`}>
                      <use href="#tree-maple" x="-56" y="-56" width="112" height="112" className={cn('tree-small', room && Math.hypot(l.x - room.x, l.y - room.y) < room.r && 'is-away')} fill={l.c} style={{ '--i': l.i } as CSSProperties} />
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
                data-next={kind === first}
                data-tilt={TILT[li]}
                aria-label={on ? `${t.app.tree[kind]} · ${t.app.story.done}` : `${t.app.tree.go} · ${t.app.tree[kind]}`}
                onClick={() => onLeaf(kind)}
              >
                {/* the part that flies and rustles; the button itself only holds the leaf's place and tilt */}
                <span className="tree-leaf-fly block h-full w-full">
                  <Maple kind={kind} on={on} className="tree-leaf-art" big />
                  {!on && <Icon className="absolute start-1/2 top-[46%] h-[34%] w-[34%] -translate-x-1/2 -translate-y-1/2 rtl:translate-x-1/2" strokeWidth={2.4} style={{ rotate: `${-TILT[li]}deg` }} aria-hidden />}
                </span>
              </button>
            )
          })}
        </div>

        {/* falling leaves stay out of the band where the words sit */}
        <div className="tree-fall pointer-events-none absolute inset-0">
          <Leaves ref={leaves} density={7} />
        </div>
        {party && <Flock paused={!onScreen} />}
        {party && (
          <div ref={sariRef} className="tree-sari absolute bottom-[2.5%] end-[-1%] h-[58%] w-[48%] sm:end-[-3%] sm:w-[42%] lg:bottom-[3%]" data-tree-sari>
            <div className="absolute bottom-[10.5%] start-1/2 h-[6%] w-[48%] -translate-x-1/2 rounded-[50%] bg-[#2a1006]/60 blur-[7px] rtl:translate-x-1/2" aria-hidden />
            <Crowned onMode={onSari} />
          </div>
        )}
      </div>
      {children}
    </div>
  )
})
