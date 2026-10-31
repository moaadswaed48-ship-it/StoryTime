import { useEffect, useMemo, useRef } from 'react'
import { View, PerspectiveCamera } from '@react-three/drei'
import { ShelfStage } from './ShelfStage'
import { Shelf } from './Shelf'
import { createBus, type ShelfBus } from './bus'
import { useShelfGesture } from './useShelfGesture'

/**
 * The shelf's drei View: an EMPTY div that is simultaneously the render rect, the pointer target and
 * the gesture surface. Lights/env/shadows live inside so the portal scene is lit.
 */
export default function ShelfView({ bus: external }: { bus?: ShelfBus }) {
  const ref = useRef<HTMLDivElement>(null)
  const bus = useMemo<ShelfBus>(() => external ?? createBus(), [external])
  const portrait = typeof window !== 'undefined' && window.innerWidth < window.innerHeight
  useShelfGesture(ref, bus)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const enter = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) bus.enters++
      },
      { threshold: 0.35, rootMargin: '0px 0px -15% 0px' },
    )
    const vis = new IntersectionObserver(([e]) => (bus.visible = e.isIntersecting), { rootMargin: '10% 0px' })
    enter.observe(el)
    vis.observe(el)
    return () => {
      enter.disconnect()
      vis.disconnect()
    }
  }, [bus])

  const camZ = portrait ? 4.9 : 5.2
  const camY = portrait ? 0.78 : 0.72
  return (
    <View
      ref={ref}
      className="shelf-view view-target mt-6 h-[70vh] min-h-[420px] w-full select-none rounded-card"
      style={{ touchAction: 'pan-y pinch-zoom', cursor: 'grab' }}
      data-lenis-prevent-horizontal
    >
      <PerspectiveCamera makeDefault fov={portrait ? 42 : 32} position={[0, camY, camZ]} rotation={[-Math.atan2(camY - 0.42, camZ), 0, 0]} near={0.1} far={40} />
      <ShelfStage />
      <Shelf bus={bus} />
    </View>
  )
}
