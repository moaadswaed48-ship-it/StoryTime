import { useEffect } from 'react'
import { useSiteStore, type MotionTier } from '@/store/useSiteStore'

const KEY = 'st:reduce-motion'

export function readReduceToggle(): boolean {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function writeReduceToggle(on: boolean) {
  try {
    if (on) localStorage.setItem(KEY, '1')
    else localStorage.removeItem(KEY)
  } catch {
    /* private mode */
  }
}

/** Synchronous first guess, for intro animations that must not wait for (or re-run on) the resolved tier. */
export function prefersReducedNow(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches || readReduceToggle()
}

/** Resolves the motion tier (full | low | reduced) and keeps `html[data-reduce-motion]` in sync. */
export function useMotionTier() {
  const reduceToggle = useSiteStore((s) => s.reduceToggle)
  const perfLow = useSiteStore((s) => s.perfLow)
  const setTier = useSiteStore((s) => s.setTier)
  const setReduceToggle = useSiteStore((s) => s.setReduceToggle)

  useEffect(() => {
    setReduceToggle(readReduceToggle())
  }, [setReduceToggle])

  // Safari has no `deviceMemory`, so an old iPhone would never get the lighter tier. Measure it instead: a few
  // seconds after loading, time sixty frames; a phone that cannot hold about 36 frames a second gets the low tier.
  const setPerfLow = useSiteStore((s) => s.setPerfLow)
  useEffect(() => {
    if (!window.matchMedia('(pointer: coarse)').matches || new URLSearchParams(location.search).has('qa')) return
    let raf = 0
    const times: number[] = []
    let last = 0
    const frame = (now: number) => {
      if (document.hidden) {
        last = 0
      } else {
        if (last) times.push(now - last)
        last = now
      }
      if (times.length < 60) raf = requestAnimationFrame(frame)
      else if ([...times].sort((a, b) => a - b)[30] > 28) setPerfLow(true)
    }
    const start = window.setTimeout(() => (raf = requestAnimationFrame(frame)), 3500)
    return () => {
      window.clearTimeout(start)
      cancelAnimationFrame(raf)
    }
  }, [setPerfLow])

  useEffect(() => {
    const prm = window.matchMedia('(prefers-reduced-motion: reduce)')
    const coarse = window.matchMedia('(pointer: coarse)')
    const resolve = () => {
      const nav = navigator as Navigator & { deviceMemory?: number }
      let tier: MotionTier = 'full'
      if (prm.matches || reduceToggle) tier = 'reduced'
      else if (perfLow || (coarse.matches && (nav.deviceMemory ?? 8) <= 4)) tier = 'low'
      setTier(tier)
      document.documentElement.toggleAttribute('data-reduce-motion', tier === 'reduced')
      document.documentElement.toggleAttribute('data-low-tier', tier === 'low')
    }
    resolve()
    prm.addEventListener('change', resolve)
    return () => prm.removeEventListener('change', resolve)
  }, [reduceToggle, perfLow, setTier])
}
