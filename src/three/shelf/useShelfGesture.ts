import { useEffect, type RefObject } from 'react'
import { useDrag } from '@use-gesture/react'
import type { ShelfBus } from './bus'

/**
 * Pointer drag (mouse / touch / pen) and horizontal wheel on the View element.
 * Vertical pans fall through to the page (touch-action: pan-y) → pointercancel → treated as release with v = 0.
 */
export function useShelfGesture(target: RefObject<HTMLDivElement | null>, bus: ShelfBus) {
  useDrag(
    ({ first, last, active, movement: [mx], velocity: [vx], direction: [dx], tap, canceled }) => {
      const d = bus.drag
      if (tap) {
        d.active = false
        return
      }
      if (first) {
        d.id++
        d.active = true
        d.released = false
        d.cancelled = false
        d.dxPx = 0
        d.vxPxMs = 0
      }
      if (active) d.dxPx = mx
      if (last) {
        d.active = false
        d.released = true
        d.cancelled = !!canceled
        d.dxPx = mx
        d.vxPxMs = canceled ? 0 : Math.sign(dx || 1) * Math.abs(vx)
      }
    },
    {
      target,
      axis: 'x',
      filterTaps: true,
      tapsThreshold: 3,
      pointer: { capture: true, keys: false },
      eventOptions: { passive: false },
    },
  )

  useEffect(() => {
    const el = target.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return // vertical wheel keeps scrolling the page
      e.preventDefault()
      bus.wheelDx += e.deltaX
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [target, bus])
}
