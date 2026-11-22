import { useEffect, useRef, useState } from 'react'
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
  const relayoutRef = useRef<(() => void) | null>(null)

  // Engine: made once on a canvas of its own, given a layout whenever the box changes size or the direction flips.
  // The canvas is created here and removed on cleanup: destroy() loses its WebGL context for good, so a remount
  // (React's development double-mount included) must never reuse it.
  useEffect(() => {
    const host = box.current
    if (!host) return
    const el = document.createElement('canvas')
    el.className = 'absolute inset-0 touch-none'
    el.tabIndex = 0
    el.setAttribute('aria-label', 'Test book: drag a page corner, or use the arrow keys')
    host.appendChild(el)
    canvas.current = el
    let e: CurlEngine
    try {
      e = new CurlEngine(el, { onChange: setPos })
    } catch (err) {
      el.remove()
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
    relayoutRef.current = relayout
    relayout()
    const ro = new ResizeObserver(relayout)
    ro.observe(host)
    const down = (ev: PointerEvent) => {
      el.setPointerCapture?.(ev.pointerId)
      e.press(ev.clientX - frame.current.x, ev.clientY - frame.current.y, ev.timeStamp)
    }
    const move = (ev: PointerEvent) => e.move(ev.clientX - frame.current.x, ev.clientY - frame.current.y, ev.timeStamp)
    const up = (ev: PointerEvent) => e.release(ev.timeStamp)
    const cancel = () => e.cancel()
    const key = (ev: KeyboardEvent) => {
      const fwd = rtlRef.current ? 'ArrowLeft' : 'ArrowRight'
      const back = rtlRef.current ? 'ArrowRight' : 'ArrowLeft'
      if (ev.key === fwd) e.turn(1)
      if (ev.key === back) e.turn(-1)
    }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', cancel)
    el.addEventListener('keydown', key)
    // For screenshots: ?hold=0.4 holds a forward turn in the air.
    const hold = Number(params.get('hold'))
    let timer = 0
    if (hold > 0) timer = window.setTimeout(() => e.hold(hold, 0.75, -0.06), 400)
    return () => {
      clearTimeout(timer)
      ro.disconnect()
      e.destroy()
      el.remove()
      engine.current = null
      relayoutRef.current = null
    }
  }, [params])

  useEffect(() => {
    rtlRef.current = rtl
    relayoutRef.current?.()
  }, [rtl])

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
        <div ref={box} className="relative min-h-[60dvh] flex-1 bg-[oklch(0.93_0_0)]" />
      )}
    </main>
  )
}
