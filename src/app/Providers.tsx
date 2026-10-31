import { useEffect, type ReactNode } from 'react'
import { ReactLenis, useLenis } from 'lenis/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { useGSAP } from '@gsap/react'
import { useSiteStore } from '@/store/useSiteStore'
import { useMotionTier } from './useMotionTier'

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP)

/**
 * ONE CLOCK: Lenis is stepped by GSAP's prioritized ticker so it runs before every
 * ScrollTrigger scrub and before R3F's own rAF (registered later, when the canvas mounts).
 */
function LenisTicker() {
  const lenis = useLenis()
  const setLenis = useSiteStore((s) => s.setLenis)
  useEffect(() => {
    if (!lenis) return
    setLenis(lenis)
    const onScroll = () => ScrollTrigger.update()
    lenis.on('scroll', onScroll)
    const tick = (t: number) => lenis.raf(t * 1000)
    gsap.ticker.add(tick, false, true)
    gsap.ticker.lagSmoothing(0)
    if (ScrollTrigger.isTouch === 1) ScrollTrigger.config({ ignoreMobileResize: true })
    const refresh = () => ScrollTrigger.refresh()
    document.fonts?.ready.then(refresh)
    return () => {
      gsap.ticker.remove(tick)
      lenis.off('scroll', onScroll)
      setLenis(null)
    }
  }, [lenis, setLenis])
  return null
}

export function Providers({ children }: { children: ReactNode }) {
  useMotionTier()
  const reduced = useSiteStore((s) => s.tier === 'reduced')
  return (
    <ReactLenis
      root
      options={{ autoRaf: false, lerp: 0.1, smoothWheel: !reduced, syncTouch: false, anchors: true }}
    >
      <LenisTicker />
      {children}
    </ReactLenis>
  )
}
