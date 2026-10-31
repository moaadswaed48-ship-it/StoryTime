import { type RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { useSiteStore } from '@/store/useSiteStore'

/** Batched scroll reveal for every `[data-reveal]` inside `scope`. Reduced tier = plain opacity, no transform. */
export function useReveal(scope: RefObject<HTMLElement | null>) {
  const tier = useSiteStore((s) => s.tier)
  useGSAP(
    () => {
      const items = gsap.utils.toArray<HTMLElement>('[data-reveal]', scope.current ?? undefined)
      if (!items.length) return
      if (tier === 'reduced') {
        gsap.set(items, { clearProps: 'all' })
        return
      }
      gsap.set(items, { y: 28, opacity: 0 })
      ScrollTrigger.batch(items, {
        start: 'top 86%',
        once: true,
        onEnter: (batch) => gsap.to(batch, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', stagger: 0.08, overwrite: true }),
      })
    },
    { scope, dependencies: [tier] },
  )
}
