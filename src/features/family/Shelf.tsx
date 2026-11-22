import gsap from 'gsap'
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent } from 'react'
import type { StorySummary } from '@/data/types'
import { emblemMask } from '@/library/emblems'
import { computeGeoms, computeMetrics, layout, mix, nearest, newLive, newPose, stepSize, type Geom, type LayoutInput, type Pose } from '@/library/engine'
import type { ShelfBook } from '@/library/types'
import { Cover, shelfBookOf } from './Cover'
import { IconLock } from './icons'

/**
 * The bookshelf: the carried-over shelf engine (src/library/engine.ts, see /lab/shelf) with the stories of one age
 * group. The book in the middle slides out and turns its cover to the reader; dragging the row, the arrows or a tap
 * on another book brings that one to the middle. Motion runs outside React: one tween writes the transforms of the
 * book elements directly, so a drag never re-renders the page. With reduced motion every move is a jump.
 */
export type ShelfItem = { story: StorySummary; open: boolean }

function BookBox({ item, g, dir, setRef }: { item: ShelfItem; g: Geom; dir: number; setRef: (el: HTMLDivElement | null) => void }) {
  const b: ShelfBook = shelfBookOf(item.story)
  const half = g.T / 2
  const spineSide = -dir
  const { cloth, foil } = b.palette
  const mask = emblemMask(b.emblem)
  return (
    <div ref={setRef} data-book={item.story.id} className="absolute left-1/2 [transform-style:preserve-3d] will-change-transform" style={{ width: g.W, height: g.H, marginLeft: -g.W / 2, top: 'var(--floor)', marginTop: -g.H, transformOrigin: '50% 100%' }}>
      <div className="absolute inset-0 [backface-visibility:hidden]" style={{ transform: `translateZ(${half}px)` }}>
        <Cover story={item.story} locked={!item.open} className="size-full !rounded-[3px] !shadow-none" />
      </div>
      <div className="absolute inset-0 [backface-visibility:hidden]" style={{ transform: `rotateY(180deg) translateZ(${half}px)`, background: mix(cloth, '#000000', 0.35) }} />
      <div className="absolute top-0 left-1/2 h-full [backface-visibility:hidden]" style={{ width: g.T, marginLeft: -half, transform: `rotateY(${spineSide * 90}deg) translateZ(${g.W / 2}px)`, background: `linear-gradient(90deg, rgba(0,0,0,.3), rgba(255,255,255,.08) 40%, rgba(0,0,0,.3)), ${cloth}` }}>
        <span className="absolute inset-x-[18%] bottom-[8%] aspect-square" style={{ background: foil, maskImage: mask, WebkitMaskImage: mask, maskSize: 'contain', WebkitMaskSize: 'contain' } as CSSProperties} />
        {!item.open && <IconLock className="absolute inset-x-[18%] top-[6%] aspect-square w-[64%] text-white/90" />}
      </div>
      <div className="absolute top-0 left-1/2 h-full [backface-visibility:hidden]" style={{ width: g.T, marginLeft: -half, transform: `rotateY(${-spineSide * 90}deg) translateZ(${g.W / 2 - 1}px)`, background: '#f1ede4' }} />
      <div className="absolute left-0 w-full [backface-visibility:hidden]" style={{ height: g.T, top: -half, transform: 'rotateX(90deg)', background: '#e9e4d8' }} />
    </div>
  )
}

const transformOf = (p: Pose) => `translate3d(${p.x.toFixed(2)}px,${p.y.toFixed(2)}px,${p.z.toFixed(2)}px) rotateZ(${p.rz.toFixed(3)}deg) rotateY(${p.ry.toFixed(3)}deg)`

export function Shelf({ items, index, onIndex, onOpen, rtl, reduced, label }: {
  items: ShelfItem[]
  index: number
  onIndex: (i: number) => void
  onOpen: (i: number) => void
  rtl: boolean
  reduced: boolean
  label: string
}) {
  const stage = useRef<HTMLDivElement>(null)
  const nodes = useRef<(HTMLDivElement | null)[]>([])
  const [size, setSize] = useState({ w: 390, h: 400 })
  const dir = rtl ? -1 : 1
  const pos = useRef({ u: index })
  const drag = useRef<{ x: number; y: number; u: number; moved: boolean; id: number } | null>(null)

  useLayoutEffect(() => {
    const el = stage.current
    if (!el) return
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const books = useMemo(() => items.map((i) => shelfBookOf(i.story)), [items])
  const m = useMemo(() => computeMetrics(size.w, size.h), [size])
  const geoms = useMemo(() => computeGeoms(books, m), [books, m])
  const live = useMemo(() => books.map(newLive), [books])
  const poses = useMemo(() => books.map(newPose), [books])
  const step = stepSize(geoms, live, m.gap)

  const apply = () => {
    const inp: LayoutInput = { geoms, live, u: pos.current.u, dir, gap: m.gap, focusGain: 1, spread: 0, step, bias: m.bias, shift: 0 }
    layout(inp, poses)
    poses.forEach((p, i) => {
      const el = nodes.current[i]
      if (!el) return
      el.style.transform = transformOf(p)
      el.style.opacity = String(p.o)
    })
  }
  const applyRef = useRef(apply)
  applyRef.current = apply
  useLayoutEffect(() => apply()) // every render (size, items, direction)

  const goTo = (target: number, animate = !reduced) => {
    const to = Math.max(0, Math.min(items.length - 1, Math.round(target)))
    gsap.killTweensOf(pos.current)
    if (!animate) {
      pos.current.u = to
      applyRef.current()
    } else gsap.to(pos.current, { u: to, duration: 0.55, ease: 'power3.out', onUpdate: () => applyRef.current() })
    if (to !== index) onIndex(to)
  }
  // The parent moved the selection (arrows, list, a new group): follow it.
  useEffect(() => {
    if (Math.round(pos.current.u) !== index) goTo(index)
  }, [index]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => void gsap.killTweensOf(pos.current), [])

  const down = (e: RPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    gsap.killTweensOf(pos.current)
    drag.current = { x: e.clientX, y: e.clientY, u: pos.current.u, moved: false, id: e.pointerId }
  }
  const move = (e: RPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.x
    if (!d.moved) {
      if (Math.abs(dx) < 8) return
      if (Math.abs(e.clientY - d.y) > Math.abs(dx)) return void (drag.current = null) // a vertical stroke scrolls the page
      d.moved = true
      e.currentTarget.setPointerCapture?.(d.id)
    }
    pos.current.u = Math.max(-0.4, Math.min(items.length - 0.6, d.u - (dx * dir) / step))
    applyRef.current()
  }
  const up = (e: RPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    drag.current = null
    if (!d) return
    if (d.moved) return goTo(nearest(live, live.map(() => true), pos.current.u))
    // A tap: on the middle book it opens; on another book it brings that one to the middle.
    const hit = (e.target as HTMLElement).closest<HTMLElement>('[data-book]')
    const i = hit ? items.findIndex((x) => x.story.id === hit.dataset.book) : -1
    if (i < 0) return goTo(index)
    if (i === index) onOpen(i)
    else goTo(i)
  }

  return (
    <div
      ref={stage}
      role="group"
      aria-label={label}
      data-testid="shelf"
      className="relative h-[clamp(320px,50dvh,540px)] cursor-grab touch-pan-y overflow-hidden select-none active:cursor-grabbing"
      style={{ perspective: `${m.persp}px`, perspectiveOrigin: `50% ${m.eyeY}px`, ['--floor' as string]: `${m.floorY}px` }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={() => (drag.current = null)}
    >
      <div className="absolute inset-0 [transform-style:preserve-3d]" aria-hidden="true">
        <div className="absolute left-1/2" style={{ top: m.floorY, width: m.plankW, height: m.plankFront + m.plankBack, marginLeft: -m.plankW / 2, transformOrigin: '50% 0', transform: `translateZ(${-m.plankBack}px) rotateX(90deg)`, background: 'linear-gradient(#d9d5cd, #cbc6bc)' }} />
        <div className="absolute left-1/2" style={{ top: m.floorY, width: m.plankW, height: m.lip, marginLeft: -m.plankW / 2, transform: `translateZ(${m.plankFront}px)`, background: '#bdb8ae' }} />
        {items.map((it, i) => (
          <BookBox key={it.story.id} item={it} g={geoms[i]!} dir={dir} setRef={(el) => void (nodes.current[i] = el)} />
        ))}
      </div>
    </div>
  )
}

/** CSS 3D with preserve-3d is what the shelf needs; without it the library shows the list. */
export function supports3d(): boolean {
  try {
    return typeof CSS !== 'undefined' && CSS.supports('transform-style', 'preserve-3d') && CSS.supports('perspective', '1px')
  } catch {
    return false
  }
}
