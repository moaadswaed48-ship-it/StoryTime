import { useEffect, useRef, useState } from 'react'

const reducedNow = () => document.documentElement.hasAttribute('data-reduce-motion') || window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * A whole number that counts to its target whenever the target changes (ease-out cubic).
 * It starts from whatever is on screen, so a quick second toggle never jumps. Reduced motion: the value is set at once.
 */
export function useCount(target: number, ms = 720): number {
  const [value, setValue] = useState(target)
  const shown = useRef(target)

  useEffect(() => {
    const from = shown.current
    if (from === target) return
    const land = () => {
      shown.current = target
      setValue(target)
    }
    if (reducedNow()) return land()
    let raf = 0
    const t0 = performance.now()
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / ms)
      const v = Math.round(from + (target - from) * (1 - Math.pow(1 - p, 3)))
      shown.current = v
      setValue(v)
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    // A hidden tab pauses rAF: make sure the real price is what stays on screen.
    const safety = window.setTimeout(land, ms + 600)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(safety)
    }
  }, [target, ms])

  return value
}
