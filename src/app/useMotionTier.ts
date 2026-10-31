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

/** Resolves the motion tier (full | low | reduced) and keeps `html[data-reduce-motion]` in sync. */
export function useMotionTier() {
  const reduceToggle = useSiteStore((s) => s.reduceToggle)
  const perfLow = useSiteStore((s) => s.perfLow)
  const setTier = useSiteStore((s) => s.setTier)
  const setReduceToggle = useSiteStore((s) => s.setReduceToggle)

  useEffect(() => {
    setReduceToggle(readReduceToggle())
  }, [setReduceToggle])

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
