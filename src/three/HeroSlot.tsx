import { lazy, Suspense } from 'react'
import { useSiteStore } from '@/store/useSiteStore'

const HeroView = lazy(() => import('./hero/HeroView'))

/** Renders the hero's 3D View only once the shared canvas is live (keeps three.js out of the initial bundle). */
export function HeroSlot() {
  const ready = useSiteStore((s) => s.sceneReady)
  if (!ready) return null
  return (
    <Suspense fallback={null}>
      <HeroView />
    </Suspense>
  )
}
