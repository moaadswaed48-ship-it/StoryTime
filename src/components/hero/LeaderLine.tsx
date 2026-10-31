import { useEffect, useRef, type RefObject } from 'react'
import { coverPoint } from '@/lib/coverPoint'

const IMG = { w: 2576, h: 1664 }
/** Normalized position of the top of the photographed book stack in the hero plate. */
const STACK_TOP = { nx: 0.885, ny: 0.355 }

function heroFocus(): { px: number; py: number } {
  const plate = document.getElementById('hero-plate')
  const v = plate ? getComputedStyle(plate).getPropertyValue('--hero-focus').trim() : '100% 55%'
  const [a, b] = v.split(/\s+/).map((s) => parseFloat(s) / 100)
  return { px: Number.isFinite(a) ? a : 1, py: Number.isFinite(b) ? b : 0.55 }
}

/**
 * Draws a thin line + dot from the glass callout to the top of the photographed book stack.
 * Recomputed on resize; hidden below 1024px by CSS.
 */
export function LeaderLine({ heroRef, fromRef }: { heroRef: RefObject<HTMLElement | null>; fromRef: RefObject<HTMLElement | null> }) {
  const pathRef = useRef<SVGPathElement>(null)
  const dotRef = useRef<SVGCircleElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const hero = heroRef.current
    const from = fromRef.current
    const plate = document.getElementById('hero-plate')
    if (!hero || !from || !plate) return
    const update = () => {
      const hb = hero.getBoundingClientRect()
      const pb = plate.getBoundingClientRect()
      const fb = from.getBoundingClientRect()
      const p = coverPoint(STACK_TOP.nx, STACK_TOP.ny, IMG, { w: pb.width, h: pb.height }, heroFocus())
      const ex = pb.left - hb.left + p.x
      const ey = pb.top - hb.top + p.y
      const sx = fb.right - hb.left - 14
      const sy = fb.bottom - hb.top - 10
      const mx = sx + (ex - sx) * 0.35
      const d = `M ${sx} ${sy} L ${mx} ${sy} L ${ex} ${ey}`
      pathRef.current?.setAttribute('d', d)
      dotRef.current?.setAttribute('cx', String(ex))
      dotRef.current?.setAttribute('cy', String(ey))
      svgRef.current?.setAttribute('viewBox', `0 0 ${hb.width} ${hb.height}`)
      svgRef.current?.style.setProperty('--len', String(Math.hypot(mx - sx, 0) + Math.hypot(ex - mx, ey - sy)))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(hero)
    ro.observe(from)
    window.addEventListener('resize', update)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [heroRef, fromRef])

  return (
    <svg ref={svgRef} className="leader-line pointer-events-none absolute inset-0 z-10 hidden h-full w-full lg:block" aria-hidden>
      <path ref={pathRef} fill="none" stroke="rgba(255,255,255,.9)" strokeWidth="1.5" strokeLinecap="round" />
      <circle ref={dotRef} r="4.5" fill="#fff" stroke="rgba(16,20,24,.25)" strokeWidth="1" />
    </svg>
  )
}
