import { useEffect, useRef, useState } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedNow } from '@/app/useMotionTier'
import { useSiteStore } from '@/store/useSiteStore'
import { exposeQA } from '@/lib/qa'
import { DepthStory } from './Depth'
import { StillStory } from './Still'
import './scrollstory.css'

/**
 * "One story, three ways": the story's paintings come forward one by one as cards in depth under the
 * visitor's thumb while three giant words swap — read, watch, play. With reduced motion it is one still and a plain list.
 */
export function ScrollStory() {
  const tier = useSiteStore((s) => s.tier)
  // Synchronous first guess so a reduced-motion visitor never sees the tall scrubbed stage flash by.
  const [guess, setGuess] = useState(prefersReducedNow)
  useEffect(() => setGuess(false), [])
  const reduced = tier === 'reduced' || guess
  const mounted = useRef(false)

  useEffect(() => {
    if (reduced) exposeQA({ scrollstory: { mode: () => 'still', state: () => ({ beat: 0, card: 0, cards: 1, ready: true }), beat: () => 0, card: () => 0, progress: () => 0, y: () => 0, goTo: () => {}, goToCard: () => {}, stats: () => ({}) } })
    if (!mounted.current) {
      mounted.current = true
      return
    }
    // The two layouts have very different heights: let every scroll effect on the page re-measure.
    const id = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(id)
  }, [reduced])

  return reduced ? <StillStory /> : <DepthStory />
}
