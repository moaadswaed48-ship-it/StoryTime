import { useEffect, useId, useRef } from 'react'
import { useLang } from '@/i18n/use-dict'
import './impact-chart.css'

/**
 * The landing page's rising-line graph (owner's request N4). It is an ILLUSTRATION with sample numbers, never
 * results (master plan §3.10, CLAUDE.md rule 4): the fixed label above the plot says so in the page's language,
 * the axes carry no numbers, and the text alternative says so again. Replace SAMPLE with real figures only when
 * the owner's papers arrive, and change the label and axes with them.
 *
 * Motion: the line draws itself in once when the graph scrolls into view. The finished graph is what the HTML
 * holds: with reduced motion, no JavaScript, or before hydration the graph is simply static (rule 8).
 * No hover tooltip on purpose: hovering would expose the sample values as if they were data.
 */

/** Sample values on a 0-100 scale, eight evenly spaced moments. Invented for the illustration; not data. */
export const SAMPLE = [22, 25, 31, 36, 43, 50, 57, 63] as const

const W = 400
const H = 260
const PLOT = { x0: 56, x1: 384, y0: 36, y1: 214 } as const

const px = (i: number) => PLOT.x0 + (i * (PLOT.x1 - PLOT.x0)) / (SAMPLE.length - 1)
const py = (v: number) => PLOT.y1 - (v / 100) * (PLOT.y1 - PLOT.y0)

/** A gently curved path through the sample points (Catmull-Rom turned into cubic Béziers). */
function curve(points: [number, number][]) {
  let d = `M${points[0][0]},${points[0][1]}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const [p1, p2] = [points[i], points[i + 1]]
    const p3 = points[Math.min(points.length - 1, i + 2)]
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`
  }
  return d
}

const POINTS = SAMPLE.map((v, i) => [px(i), py(v)] as [number, number])
const LINE = curve(POINTS)
const AREA = `${LINE} L${PLOT.x1},${PLOT.y1} L${PLOT.x0},${PLOT.y1} Z`

export function ImpactChart() {
  const { dict } = useLang()
  const t = dict.landing.evidence.chart
  const ref = useRef<HTMLElement>(null)
  const titleId = useId()
  const descId = useId()

  useEffect(() => {
    const el = ref.current
    if (!el || typeof matchMedia === 'undefined' || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    el.dataset.armed = ''
    const play = () => {
      el.dataset.play = ''
    }
    if (typeof IntersectionObserver === 'undefined') return play()
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        play()
        io.disconnect()
      }
    }, { threshold: 0.35 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <figure ref={ref} className="impact flex flex-col gap-3 rounded-control border border-line bg-surface p-4" data-testid="impact-chart">
      <figcaption className="flex flex-col gap-2">
        <span className="font-semibold">{t.title}</span>
        {/* Fixed, always visible, never part of the animation. */}
        <span role="note" className="self-start rounded-control border-2 border-dashed border-ink px-3 py-1.5 text-sm font-semibold" data-testid="impact-label">
          {t.label}
        </span>
      </figcaption>
      {/* Time runs left to right in every language, as in Arabic and Hebrew newspaper charts; the words are not mirrored art. */}
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={`${titleId} ${descId}`} direction="ltr" className="h-auto w-full max-w-xl text-ink">
        <title id={titleId}>{t.title}</title>
        <desc id={descId}>{`${t.label} ${t.alt}`}</desc>
        <g aria-hidden="true">
          {/* Recessive guide lines; no numbers on either axis. */}
          {[0.33, 0.66].map((f) => (
            <line key={f} x1={PLOT.x0} x2={PLOT.x1} y1={PLOT.y1 - f * (PLOT.y1 - PLOT.y0)} y2={PLOT.y1 - f * (PLOT.y1 - PLOT.y0)} className="stroke-line" strokeWidth="1" />
          ))}
          <line x1={PLOT.x0} x2={PLOT.x1} y1={PLOT.y1} y2={PLOT.y1} stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.5" />
          <line x1={PLOT.x0} x2={PLOT.x0} y1={PLOT.y0 - 6} y2={PLOT.y1} stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.5" />

          <path className="impact-area" d={AREA} fill="currentColor" fillOpacity="0.07" />
          <path className="impact-line" d={LINE} pathLength={1} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {POINTS.map(([x, y], i) => (
            <circle key={i} className="impact-dot" style={{ ['--i' as string]: i }} cx={x} cy={y} r="4.5" fill="currentColor" stroke="var(--color-surface)" strokeWidth="2" />
          ))}

          <g className="fill-ink-muted" fontSize="13">
            <text x={PLOT.x0} y={PLOT.y0 - 14} fontWeight="600" className="fill-ink">{t.yAxis}</text>
            <text x={PLOT.x0 - 8} y={PLOT.y0 + 4} textAnchor="end">{t.yHigh}</text>
            <text x={PLOT.x0 - 8} y={PLOT.y1} textAnchor="end">{t.yLow}</text>
            <text x={PLOT.x0} y={PLOT.y1 + 20} textAnchor="start">{t.xStart}</text>
            <text x={PLOT.x1} y={PLOT.y1 + 20} textAnchor="end">{t.xEnd}</text>
            <text x={(PLOT.x0 + PLOT.x1) / 2} y={PLOT.y1 + 40} textAnchor="middle" fontWeight="600" className="fill-ink">{t.xAxis}</text>
          </g>
        </g>
      </svg>
    </figure>
  )
}
