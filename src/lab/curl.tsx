import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { useSearchParams } from 'react-router'
import { num } from '@/i18n/helpers'
import { CurlEngine } from '@/reader/curl/engine'
import { stageFor } from '@/reader/layout'
import { LabButton } from './Button'

const PAGES = 6
const HUES = [210, 32, 150, 275, 95, 340]

/** A dummy page: a coloured "picture" band, a big page number, grey lines standing in for text, and an arrow
 *  that points the way the book reads. Lines start on the reading side, as real text would. */
function paintPage(i: number, w: number, h: number, rtl: boolean): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')!
  const hue = HUES[i % HUES.length]
  g.fillStyle = `hsl(${hue} 25% 95%)`
  g.fillRect(0, 0, w, h)
  g.fillStyle = `hsl(${hue} 32% 72%)`
  g.fillRect(0, 0, w, h * 0.42)
  g.fillStyle = 'rgba(20,20,20,0.85)'
  g.font = `600 ${Math.round(h * 0.17)}px system-ui, sans-serif`
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText(num(i + 1), w / 2, h * 0.21)
  const margin = w * 0.1
  const lineH = h * 0.045
  g.fillStyle = 'rgba(40,40,40,0.28)'
  for (let k = 0; k < 9; k++) {
    const len = (w - 2 * margin) * (k % 4 === 3 ? 0.55 : 0.88 + 0.12 * Math.sin(i * 3 + k))
    const x = rtl ? w - margin - len : margin
    g.fillRect(x, h * 0.5 + k * lineH * 1.6, len, lineH * 0.5)
  }
  // Reading-direction arrow and label at the foot of the page.
  const y = h * 0.93
  const dir = rtl ? -1 : 1
  g.strokeStyle = 'rgba(20,20,20,0.7)'
  g.lineWidth = Math.max(2, h * 0.006)
  g.lineCap = 'round'
  g.beginPath()
  g.moveTo(w / 2 - dir * w * 0.12, y)
  g.lineTo(w / 2 + dir * w * 0.12, y)
  g.moveTo(w / 2 + dir * w * 0.12 - dir * h * 0.02, y - h * 0.02)
  g.lineTo(w / 2 + dir * w * 0.12, y)
  g.lineTo(w / 2 + dir * w * 0.12 - dir * h * 0.02, y + h * 0.02)
  g.stroke()
  g.font = `500 ${Math.round(h * 0.025)}px system-ui, sans-serif`
  g.fillStyle = 'rgba(20,20,20,0.6)'
  g.fillText(rtl ? 'RTL' : 'LTR', w / 2, y - h * 0.04)
  return c
}

export default function CurlLab() {
  const [params] = useSearchParams()
  const box = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const engine = useRef<CurlEngine | null>(null)
  const [rtl, setRtl] = useState(params.get('rtl') !== '0')
  const rtlRef = useRef(rtl)
  const [pos, setPos] = useState(0)
  const [positions, setPositions] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const frame = useRef({ x: 0, y: 0 })

  // Engine: made once, given a layout whenever the box changes size or the direction flips.
  useEffect(() => {
    const el = canvas.current
    const host = box.current
    if (!el || !host) return
    let e: CurlEngine
    try {
      e = new CurlEngine(el, { onChange: setPos })
    } catch (err) {
      setError(String(err))
      return
    }
    engine.current = e
    ;(window as unknown as { __lab?: unknown }).__lab = e
    const relayout = () => {
      const r = host.getBoundingClientRect()
      frame.current = { x: r.left, y: r.top }
      const w = Math.max(1, Math.round(r.width))
      const h = Math.max(1, Math.round(r.height))
      const stage = stageFor(w, h)
      const rtlNow = rtlRef.current
      const spineX = stage.spread || rtlNow ? stage.left + stage.pageW : stage.left
      el.style.width = `${w}px`
      el.style.height = `${h}px`
      e.setLayout({ width: w, height: h, scale: Math.min(2, window.devicePixelRatio || 1), spread: stage.spread, rtl: rtlNow, pageW: stage.pageW, pageH: stage.pageH, spineX, top: stage.top })
      const px = e.pagePixels()
      e.setBook({ count: PAGES, paint: (i) => paintPage(i, px.w, px.h, rtlRef.current) })
      setPositions(e.positions())
      setPos(e.position())
    }
    relayout()
    const ro = new ResizeObserver(relayout)
    ro.observe(host)
    ;(e as unknown as { relayout: () => void }).relayout = relayout
    // For screenshots: ?hold=0.4 holds a forward turn in the air.
    const hold = Number(params.get('hold'))
    let timer = 0
    if (hold > 0) timer = window.setTimeout(() => e.hold(hold, 0.75, -0.06), 400)
    return () => {
      clearTimeout(timer)
      ro.disconnect()
      e.destroy()
      engine.current = null
    }
  }, [params])

  useEffect(() => {
    rtlRef.current = rtl
    ;(engine.current as unknown as { relayout?: () => void } | null)?.relayout?.()
  }, [rtl])

  const down = (ev: PointerEvent<HTMLCanvasElement>) => {
    ev.currentTarget.setPointerCapture?.(ev.pointerId)
    engine.current?.press(ev.clientX - frame.current.x, ev.clientY - frame.current.y, ev.timeStamp)
  }
  const move = (ev: PointerEvent<HTMLCanvasElement>) => engine.current?.move(ev.clientX - frame.current.x, ev.clientY - frame.current.y, ev.timeStamp)
  const up = (ev: PointerEvent<HTMLCanvasElement>) => engine.current?.release(ev.timeStamp)

  return (
    <main className="flex flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-2 px-3 py-2">
        <LabButton onClick={() => engine.current?.turn(-1)} aria-label="Previous page">Previous</LabButton>
        <LabButton onClick={() => engine.current?.turn(1)} aria-label="Next page">Next</LabButton>
        <LabButton aria-pressed={rtl} onClick={() => setRtl(true)}>Right to left</LabButton>
        <LabButton aria-pressed={!rtl} onClick={() => setRtl(false)}>Left to right</LabButton>
        <span className="ms-auto text-sm tabular-nums text-ink-muted" data-testid="pos">
          {num(pos + 1)} / {num(positions)}
        </span>
      </div>
      {error ? (
        <p className="m-4 rounded-control border border-line p-4">WebGL is not available here: {error}</p>
      ) : (
        <div ref={box} className="relative min-h-[60dvh] flex-1 bg-[oklch(0.93_0_0)]">
          <canvas
            ref={canvas}
            className="absolute inset-0 touch-none"
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={() => engine.current?.cancel()}
            onKeyDown={(e) => {
              const fwd = rtl ? 'ArrowLeft' : 'ArrowRight'
              const back = rtl ? 'ArrowRight' : 'ArrowLeft'
              if (e.key === fwd) engine.current?.turn(1)
              if (e.key === back) engine.current?.turn(-1)
            }}
            tabIndex={0}
            aria-label="Test book: drag a page corner, or use the arrow keys"
          />
        </div>
      )}
    </main>
  )
}
