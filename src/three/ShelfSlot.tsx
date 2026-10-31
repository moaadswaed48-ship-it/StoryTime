import { lazy, Suspense, type ReactNode } from 'react'
import { useSiteStore } from '@/store/useSiteStore'
import type { ShelfBus } from './shelf/bus'

const ShelfView = lazy(() => import('./shelf/ShelfView'))

/** Mounts the 3D shelf View once the shared canvas is live; otherwise renders the DOM fallback rack. */
export function ShelfSlot({ bus, fallback }: { bus: ShelfBus; fallback: ReactNode }) {
  const ready = useSiteStore((s) => s.sceneReady)
  const webgl = useSiteStore((s) => s.webgl)
  if (webgl === 'failed') return <>{fallback}</>
  const placeholder = <div className="shelf-view mt-6 h-[70vh] min-h-[420px] w-full" aria-hidden />
  if (!ready) return placeholder
  return (
    <Suspense fallback={placeholder}>
      <ShelfView bus={bus} />
    </Suspense>
  )
}
