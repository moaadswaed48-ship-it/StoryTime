import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import { useSiteStore } from '@/store/useSiteStore'

/** Mounts a 3D View only when the shared canvas is live and the block is near the viewport; DOM fallback otherwise. */
export function Lazy3D({ children, fallback, className }: { children: ReactNode; fallback?: ReactNode; className?: string }) {
  const ready = useSiteStore((s) => s.sceneReady)
  const webgl = useSiteStore((s) => s.webgl)
  const [near, setNear] = useState(false)
  const holder = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = holder.current
    if (!el || near) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setNear(true), io.disconnect()), { rootMargin: '700px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [near])
  return (
    <div ref={holder} className={className}>
      {webgl === 'failed' ? fallback : ready && near ? <Suspense fallback={null}>{children}</Suspense> : null}
    </div>
  )
}
