import { useEffect, useRef, type RefObject } from 'react'

/** Mutable visibility flag for a DOM element (IntersectionObserver). Read it inside useFrame; never setState per frame. */
export function useViewVisible(ref: RefObject<HTMLElement | null>, rootMargin = '10% 0px') {
  const visible = useRef(true)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => (visible.current = e.isIntersecting), { rootMargin })
    io.observe(el)
    return () => io.disconnect()
  }, [ref, rootMargin])
  return visible
}
