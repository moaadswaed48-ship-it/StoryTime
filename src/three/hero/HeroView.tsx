import { useEffect, useRef } from 'react'
import { View, PerspectiveCamera } from '@react-three/drei'
import { useSiteStore } from '@/store/useSiteStore'
import { useViewVisible } from '@/three/shared/useViewVisible'
import { pointer } from '@/three/shared/progress'
import { QA } from '@/three/shared/qa'
import { Butterflies } from './Butterflies'
import { DepthPlane } from './DepthPlane'
import { Suspense } from 'react'
import { LayerBoundary } from '@/three/shared/LayerBoundary'

/**
 * Transparent 3D layer over the hero photograph: living monarch butterflies (and, on the full tier, the depth plane).
 * The View element is pointer-events:none so it never competes with the DOM chrome; pointer data comes from window.
 */
export default function HeroView() {
  const ref = useRef<HTMLDivElement>(null)
  const visible = useViewVisible(ref)
  const tier = useSiteStore((s) => s.tier)

  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const onMove = (e: PointerEvent) => {
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1
      pointer.y = -(((e.clientY - r.top) / r.height) * 2 - 1)
      pointer.active = e.clientY >= r.top && e.clientY <= r.bottom
    }
    const onLeave = () => (pointer.active = false)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  if (tier === 'reduced') return null
  const low = tier === 'low'
  const depthOk = tier === 'full' && window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1024px)').matches
  return (
    <View ref={ref} className="hero-view pointer-events-none absolute inset-0" aria-hidden>
      <PerspectiveCamera makeDefault fov={30} position={[0, 0, 6]} near={0.1} far={30} />
      {depthOk && (
        <LayerBoundary name="depth-plane">
          <Suspense fallback={null}>
            <DepthPlane visible={visible} focus={{ px: 1, py: 0.55 }} />
          </Suspense>
        </LayerBoundary>
      )}
      <LayerBoundary name="butterflies">
        <Suspense fallback={null}>
          <Butterflies near={low ? 5 : 7} far={low ? 3 : 6} visible={visible} frozen={QA && new URLSearchParams(location.search).has('freeze')} />
        </Suspense>
      </LayerBoundary>
    </View>
  )
}
