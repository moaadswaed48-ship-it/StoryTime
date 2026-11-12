import { Suspense, lazy } from 'react'
import { exposeQA } from '@/lib/qa'
import { useSiteStore } from '@/store/useSiteStore'

// The film (its puppets, sets and score) is only downloaded when someone asks to watch it.
const Screen = lazy(() => import('./Screen').then((m) => ({ default: m.Screen })))

/**
 * The first scene of the Moon film, full-screen over the site while `overlay === 'moon'` (the Moon book's panel on
 * the shelf opens it). This door is all the rest of the site loads; QA: `window.__st.moon.open()` / `.close()`.
 */
export function MoonOverlay() {
  const open = useSiteStore((s) => s.overlay === 'moon')
  if (!open) return null
  return (
    <Suspense fallback={<div className="fixed inset-0 z-[70] bg-[#05070f]" aria-busy="true" />}>
      <Screen />
    </Suspense>
  )
}

exposeQA({ moon: { open: () => useSiteStore.getState().openMoon(), close: () => useSiteStore.getState().closeOverlay() } })
