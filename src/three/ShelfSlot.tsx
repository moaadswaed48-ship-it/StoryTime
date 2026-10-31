import { lazy, Suspense } from 'react'
import { useSiteStore } from '@/store/useSiteStore'

const ShelfView = lazy(() => import('./shelf/ShelfView'))

/** Mounts the 3D shelf View once the shared canvas is live; otherwise renders nothing (the DOM rack takes over). */
export function ShelfSlot({ fallback }: { fallback: React.ReactNode }) {
  const ready = useSiteStore((s) => s.sceneReady)
  const webgl = useSiteStore((s) => s.webgl)
  if (webgl === 'failed') return <>{fallback}</>
  if (!ready) return <div className="shelf-view mt-6 h-[70vh] min-h-[420px] w-full" aria-hidden />
  return (
    <Suspense fallback={<div className="shelf-view mt-6 h-[70vh] min-h-[420px] w-full" aria-hidden />}>
      <ShelfView />
    </Suspense>
  )
}
