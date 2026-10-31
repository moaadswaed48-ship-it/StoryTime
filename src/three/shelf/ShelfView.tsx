import { useEffect, useMemo, useRef } from 'react'
import { View, PerspectiveCamera } from '@react-three/drei'
import { ShelfStage } from './ShelfStage'
import { Shelf, type ShelfSignals } from './Shelf'

/**
 * The shelf's drei View: an EMPTY div that is simultaneously the render rect, the pointer target and
 * (M3) the gesture surface. Lights/env/shadows live inside so the portal scene is lit.
 */
export default function ShelfView() {
  const ref = useRef<HTMLDivElement>(null)
  const signals = useMemo<ShelfSignals>(() => ({ enters: 0, visible: false }), [])
  const portrait = typeof window !== 'undefined' && window.innerWidth < window.innerHeight

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const enter = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) signals.enters++
      },
      { threshold: 0.35, rootMargin: '0px 0px -15% 0px' },
    )
    const vis = new IntersectionObserver(([e]) => (signals.visible = e.isIntersecting), { rootMargin: '10% 0px' })
    enter.observe(el)
    vis.observe(el)
    return () => {
      enter.disconnect()
      vis.disconnect()
    }
  }, [signals])

  return (
    <View
      ref={ref}
      className="shelf-view view-target mt-6 h-[70vh] min-h-[420px] w-full select-none rounded-card"
      style={{ touchAction: 'pan-y pinch-zoom', cursor: 'grab' }}
      data-lenis-prevent-horizontal
    >
      <PerspectiveCamera makeDefault fov={portrait ? 40 : 32} position={[0, 0.72, portrait ? 6.4 : 5.2]} rotation={[-Math.atan2(0.72 - 0.42, portrait ? 6.4 : 5.2), 0, 0]} near={0.1} far={40} />
      <ShelfStage />
      <Shelf signals={signals} />
    </View>
  )
}
