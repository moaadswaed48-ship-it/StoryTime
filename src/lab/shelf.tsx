import gsap from 'gsap'
import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { num } from '@/i18n/helpers'
import { emblemMask, emblemPattern } from '@/library/emblems'
import { computeGeoms, computeMetrics, layout, mix, newLive, newPose, stepSize, type Geom, type LayoutInput } from '@/library/engine'
import type { ShelfBook } from '@/library/types'
import { LabButton } from './Button'

/** Test books only: colours and emblems picked to exercise the covers, not a design decision. */
const BOOKS: ShelfBook[] = [
  { id: 'lab-1', ready: false, emblem: 'shell', palette: { cloth: '#2f5d68', ink: '#f2efe8', foil: '#e8d3b0' } },
  { id: 'lab-2', ready: false, emblem: 'rocket', palette: { cloth: '#2b3150', ink: '#f2efe8', foil: '#d9cf9a' } },
  { id: 'lab-3', ready: false, emblem: 'lantern', palette: { cloth: '#4a3a5c', ink: '#f6f1e6', foil: '#e6c27a' } },
  { id: 'lab-4', ready: true, emblem: 'sun', palette: { cloth: '#5f6f52', ink: '#f6f1e6', foil: '#f0dca0' } },
  { id: 'lab-5', ready: false, emblem: 'clock', palette: { cloth: '#e4e0d6', ink: '#2e3f57', foil: '#2e3f57' } },
  { id: 'lab-6', ready: false, emblem: 'book', palette: { cloth: '#46624d', ink: '#f2efe8', foil: '#dcc79a' } },
  { id: 'lab-7', ready: false, emblem: 'starfish', palette: { cloth: '#6a4f6e', ink: '#f6f1e6', foil: '#efc7b8' } },
  { id: 'lab-8', ready: false, emblem: 'rainbow', palette: { cloth: '#3e5a7a', ink: '#f2efe8', foil: '#cfe0ee' } },
  { id: 'lab-9', ready: false, emblem: 'olive', palette: { cloth: '#5a5a3c', ink: '#f6f1e6', foil: '#e2dab0' } },
]

function Book({ book, g, dir, transform, opacity }: { book: ShelfBook; g: Geom; dir: number; transform: string; opacity: number }) {
  const half = g.T / 2
  const spineSide = -dir // the spine is on the right of a right-to-left book's front cover
  const { cloth, foil } = book.palette
  const mask = emblemMask(book.emblem)
  return (
    <div
      className="absolute left-1/2 [transform-style:preserve-3d]"
      style={{ width: g.W, height: g.H, marginLeft: -g.W / 2, top: 'var(--floor)', marginTop: -g.H, transformOrigin: '50% 100%', transform, opacity }}
    >
      <div className="absolute inset-0 overflow-hidden rounded-[3px] [backface-visibility:hidden]" style={{ transform: `translateZ(${half}px)`, background: cloth }}>
        <span className="absolute inset-0" style={{ backgroundImage: emblemPattern(book.emblem, mix(cloth, foil, 0.35), cloth), backgroundSize: `${g.W / 3}px`, opacity: 0.5 }} />
        <span className="absolute inset-x-[22%] top-[24%] aspect-square" style={{ background: foil, maskImage: mask, WebkitMaskImage: mask, maskSize: 'contain', WebkitMaskSize: 'contain' } as CSSProperties} />
      </div>
      <div className="absolute inset-0 [backface-visibility:hidden]" style={{ transform: `rotateY(180deg) translateZ(${half}px)`, background: mix(cloth, '#000000', 0.35) }} />
      <div
        className="absolute top-0 left-1/2 h-full [backface-visibility:hidden]"
        style={{ width: g.T, marginLeft: -half, transform: `rotateY(${spineSide * 90}deg) translateZ(${g.W / 2}px)`, background: `linear-gradient(90deg, rgba(0,0,0,.3), rgba(255,255,255,.08) 40%, rgba(0,0,0,.3)), ${cloth}` }}
      >
        <span className="absolute inset-x-[18%] bottom-[8%] aspect-square" style={{ background: foil, maskImage: mask, WebkitMaskImage: mask, maskSize: 'contain', WebkitMaskSize: 'contain' } as CSSProperties} />
      </div>
      <div className="absolute top-0 left-1/2 h-full [backface-visibility:hidden]" style={{ width: g.T, marginLeft: -half, transform: `rotateY(${-spineSide * 90}deg) translateZ(${g.W / 2 - 1}px)`, background: '#f1ede4' }} />
      <div className="absolute left-0 w-full [backface-visibility:hidden]" style={{ height: g.T, top: -half, transform: 'rotateX(90deg)', background: '#e9e4d8' }} />
    </div>
  )
}

export default function ShelfLab() {
  const stage = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 390, h: 420 })
  const [dir, setDir] = useState<1 | -1>(-1)
  const [u, setU] = useState(3)
  const tween = useRef({ u: 3 })
  const drag = useRef<{ x: number; u: number } | null>(null)

  useEffect(() => {
    const el = stage.current
    if (!el) return
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const m = useMemo(() => computeMetrics(size.w, size.h), [size])
  const geoms = useMemo(() => computeGeoms(BOOKS, m), [m])
  const live = useMemo(() => BOOKS.map(newLive), [])
  const step = stepSize(geoms, live, m.gap)
  const poses = useMemo(() => {
    const inp: LayoutInput = { geoms, live, u, dir, gap: m.gap, focusGain: 1, spread: 0, step, bias: m.bias, shift: 0 }
    return layout(inp, BOOKS.map(newPose))
  }, [geoms, live, u, dir, m, step])

  const goTo = (target: number) => {
    const to = Math.max(0, Math.min(BOOKS.length - 1, Math.round(target)))
    tween.current.u = u
    gsap.to(tween.current, { u: to, duration: 0.55, ease: 'power3.out', overwrite: true, onUpdate: () => setU(tween.current.u) })
  }
  ;(globalThis as unknown as { __lab?: unknown }).__lab = { goTo, u }

  const down = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture?.(e.pointerId)
    gsap.killTweensOf(tween.current)
    drag.current = { x: e.clientX, u }
  }
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return
    // Dragging the row toward the reading direction brings later books to the middle.
    setU(Math.max(-0.4, Math.min(BOOKS.length - 0.6, drag.current.u - ((e.clientX - drag.current.x) * dir) / step)))
  }
  const up = () => {
    if (!drag.current) return
    drag.current = null
    goTo(u)
  }

  return (
    <main className="flex flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-2 px-3 py-2">
        <LabButton onClick={() => goTo(u - 1)}>Previous</LabButton>
        <LabButton onClick={() => goTo(u + 1)}>Next</LabButton>
        <LabButton aria-pressed={dir === -1} onClick={() => setDir(-1)}>Right to left</LabButton>
        <LabButton aria-pressed={dir === 1} onClick={() => setDir(1)}>Left to right</LabButton>
        <span className="ms-auto text-sm tabular-nums text-ink-muted">
          {num(Math.round(u) + 1)} / {num(BOOKS.length)}
        </span>
      </div>
      <div
        ref={stage}
        className="relative h-[clamp(380px,60dvh,620px)] cursor-grab touch-pan-y overflow-hidden bg-[oklch(0.94_0_0)] select-none"
        style={{ perspective: `${m.persp}px`, perspectiveOrigin: `50% ${m.eyeY}px`, ['--floor' as string]: `${m.floorY}px` }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
      >
        <div className="absolute inset-0 [transform-style:preserve-3d]">
          <div
            className="absolute left-1/2"
            style={{ top: m.floorY, width: m.plankW, height: m.plankFront + m.plankBack, marginLeft: -m.plankW / 2, transformOrigin: '50% 0', transform: `translateZ(${-m.plankBack}px) rotateX(90deg)`, background: 'linear-gradient(#d6d3cc, #c9c5bc)' }}
          />
          <div className="absolute left-1/2" style={{ top: m.floorY, width: m.plankW, height: m.lip, marginLeft: -m.plankW / 2, transform: `translateZ(${m.plankFront}px)`, background: '#b9b5ac' }} />
          {BOOKS.map((b, i) => {
            const p = poses[i]
            return <Book key={b.id} book={b} g={geoms[i]} dir={dir} opacity={p.o} transform={`translate3d(${p.x.toFixed(2)}px,${p.y.toFixed(2)}px,${p.z.toFixed(2)}px) rotateZ(${p.rz.toFixed(3)}deg) rotateY(${p.ry.toFixed(3)}deg)`} />
          })}
        </div>
      </div>
      <p className="px-3 py-2 text-sm text-ink-muted">Drag the row, or use Previous and Next. The book in the middle turns to show its cover.</p>
    </main>
  )
}
