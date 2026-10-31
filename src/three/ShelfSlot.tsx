import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import { useSiteStore } from '@/store/useSiteStore'
import type { ShelfBus } from './shelf/bus'

const ShelfView = lazy(() => import('./shelf/ShelfView'))

/** Mounts the 3D shelf View once the shared canvas is live; otherwise renders the DOM fallback rack. */
export function ShelfSlot({ bus, fallback }: { bus: ShelfBus; fallback: ReactNode }) {
  const ready = useSiteStore((s) => s.sceneReady)
  const webgl = useSiteStore((s) => s.webgl)
  const [near, setNear] = useState(false)
  const holder = useRef<HTMLDivElement>(null)
  // mount the shelf chunk (and bake its covers) only once the section approaches the viewport
  useEffect(() => {
    const el = holder.current
    if (!el || near) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setNear(true)
        io.disconnect()
      }
    }, { rootMargin: '900px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [near])
  if (webgl === 'failed') return <>{fallback}</>
  const placeholder = <div ref={holder} className="shelf-view mt-6 h-[70vh] min-h-[420px] w-full" aria-hidden />
  if (!ready || !near) return placeholder
  return (
    <Suspense fallback={placeholder}>
      <ShelfView bus={bus} />
    </Suspense>
  )
}
