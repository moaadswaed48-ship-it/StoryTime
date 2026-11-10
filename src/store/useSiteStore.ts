import { create } from 'zustand'
import type Lenis from 'lenis'
import { exposeQA } from '@/lib/qa'

export type MotionTier = 'full' | 'low' | 'reduced'
/** Only one fullscreen experience is open at a time. */
export type Overlay = null | 'book' | 'film'

interface SiteState {
  tier: MotionTier
  reduceToggle: boolean
  perfLow: boolean
  lenis: Lenis | null
  overlay: Overlay
  /** Scene (0-based) the book or the film should open at. */
  startScene: number
  loggedIn: boolean
  loginOpen: boolean
  sound: boolean
  setTier: (tier: MotionTier) => void
  setReduceToggle: (on: boolean) => void
  setPerfLow: (low: boolean) => void
  setLenis: (lenis: Lenis | null) => void
  openBook: (scene?: number) => void
  openFilm: (scene?: number) => void
  closeOverlay: () => void
  setLoggedIn: (v: boolean) => void
  setLoginOpen: (v: boolean) => void
  setSoundOn: (v: boolean) => void
}

export const useSiteStore = create<SiteState>()((set) => ({
  tier: 'full',
  reduceToggle: false,
  perfLow: false,
  lenis: null,
  overlay: null,
  startScene: 0,
  loggedIn: false,
  loginOpen: false,
  sound: false,
  setTier: (tier) => set({ tier }),
  setReduceToggle: (on) => set({ reduceToggle: on }),
  setPerfLow: (low) => set({ perfLow: low }),
  setLenis: (lenis) => set({ lenis }),
  openBook: (scene = 0) => set({ overlay: 'book', startScene: scene }),
  openFilm: (scene = 0) => set({ overlay: 'film', startScene: scene }),
  closeOverlay: () => set({ overlay: null }),
  setLoggedIn: (loggedIn) => set({ loggedIn }),
  setLoginOpen: (loginOpen) => set({ loginOpen }),
  setSoundOn: (sound) => set({ sound }),
}))

export const selectReduced = (s: SiteState) => s.tier === 'reduced'

// Tests drive overlays and login through the store: window.__st.store.getState().openBook(2)
exposeQA({ store: useSiteStore })
