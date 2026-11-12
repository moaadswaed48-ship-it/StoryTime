import { useCallback, useEffect, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

const R = 46
const C = 2 * Math.PI * R

/**
 * A press-and-hold button with a ring that fills while it is held. A small child taps and moves on;
 * a grown-up keeps the finger down. Works with a finger, a mouse and the keyboard (hold Space or Enter).
 */
export function HoldButton({ children, onDone, ms = 1500, className, ...rest }: { children: ReactNode; onDone: () => void; ms?: number; className?: string } & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'onPointerDown'>) {
  const ring = useRef<SVGCircleElement>(null)
  const btn = useRef<HTMLButtonElement>(null)
  // fast values stay in refs: nothing here re-renders while the ring moves
  const s = useRef({ p: 0, held: false, raf: 0, last: 0, done: false })
  const done = useRef(onDone)
  done.current = onDone

  const paint = () => {
    if (ring.current) ring.current.style.strokeDashoffset = String(C * (1 - s.current.p))
    btn.current?.style.setProperty('--p', s.current.p.toFixed(3))
  }
  const tick = useCallback(
    (now: number) => {
      const st = s.current
      const dt = Math.min(64, now - st.last)
      st.last = now
      // fills at a steady pace while held; lets go three times faster
      st.p = Math.max(0, Math.min(1, st.p + (st.held ? dt / ms : (-dt / ms) * 3)))
      paint()
      if (st.p >= 1 && !st.done) {
        st.done = true
        st.held = false
        done.current()
        return
      }
      if (st.held || st.p > 0) st.raf = requestAnimationFrame(tick)
      else st.raf = 0
    },
    [ms],
  )
  const start = () => {
    const st = s.current
    if (st.done) return
    st.held = true
    if (!st.raf) {
      st.last = performance.now()
      st.raf = requestAnimationFrame(tick)
    }
  }
  const stop = () => void (s.current.held = false)
  useEffect(() => () => cancelAnimationFrame(s.current.raf), [])

  return (
    <button
      ref={btn}
      type="button"
      className={cn('gu-hold relative grid aspect-square w-[148px] select-none place-items-center rounded-full', className)}
      onPointerDown={(e) => {
        if (e.button !== 0) return
        e.currentTarget.setPointerCapture?.(e.pointerId)
        start()
      }}
      onPointerUp={stop}
      onPointerCancel={stop}
      onLostPointerCapture={stop}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && !e.repeat && (e.preventDefault(), start())}
      onKeyUp={(e) => (e.key === ' ' || e.key === 'Enter') && stop()}
      onBlur={stop}
      {...rest}
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={R} fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="4" />
        <circle ref={ring} cx="50" cy="50" r={R} fill="none" stroke="var(--color-maple)" strokeWidth="4" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C} />
      </svg>
      <span className="gu-hold-core grid h-[78%] w-[78%] place-items-center rounded-full bg-ink px-3 text-center text-[15px] font-semibold leading-tight text-paper">{children}</span>
    </button>
  )
}
