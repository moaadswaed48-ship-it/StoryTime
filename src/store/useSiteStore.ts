import { create } from 'zustand'
import type Lenis from 'lenis'
import { exposeQA } from '@/lib/qa'

export type MotionTier = 'full' | 'low' | 'reduced'
/** Only one fullscreen experience is open at a time. */
export type Overlay = null | 'book' | 'film' | 'game'
/** The landing page is the front door; every other view is a screen of the app itself. */
export type View = 'landing' | 'home' | 'story' | 'tree' | 'grownups' | 'studio'

interface SiteState {
  tier: MotionTier
  reduceToggle: boolean
  perfLow: boolean
  lenis: Lenis | null
  /** Which page is showing. Change it with `go()` from `@/app/router`, never directly. */
  view: View
  /** True while the "who is reading today?" step is open on the way into the app. */
  picking: boolean
  /** Where "who is reading?" leads once a reader is chosen. */
  enterTarget: View
  overlay: Overlay
  /** Scene (0-based) the book or the film should open at. */
  startScene: number
  loggedIn: boolean
  loginOpen: boolean
  /** The demo checkout (subscribe → pay → receipt). Nothing is sent or charged. */
  checkout: null | { plan: string; yearly: boolean }
  sound: boolean
  setTier: (tier: MotionTier) => void
  setReduceToggle: (on: boolean) => void
  setPerfLow: (low: boolean) => void
  setLenis: (lenis: Lenis | null) => void
  openBook: (scene?: number) => void
  openFilm: (scene?: number) => void
  openGame: () => void
  closeOverlay: () => void
  setView: (view: View) => void
  setPicking: (on: boolean, target?: View) => void
  setLoggedIn: (v: boolean) => void
  setLoginOpen: (v: boolean) => void
  openCheckout: (plan?: string, yearly?: boolean) => void
  closeCheckout: () => void
  setSoundOn: (v: boolean) => void
}

export const useSiteStore = create<SiteState>()((set) => ({
  tier: 'full',
  reduceToggle: false,
  perfLow: false,
  lenis: null,
  view: 'landing',
  picking: false,
  enterTarget: 'home',
  overlay: null,
  startScene: 0,
  loggedIn: false,
  loginOpen: false,
  checkout: null,
  sound: false,
  setTier: (tier) => set({ tier }),
  setReduceToggle: (on) => set({ reduceToggle: on }),
  setPerfLow: (low) => set({ perfLow: low }),
  setLenis: (lenis) => set({ lenis }),
  openBook: (scene = 0) => set({ overlay: 'book', startScene: scene }),
  openFilm: (scene = 0) => set({ overlay: 'film', startScene: scene }),
  openGame: () => set({ overlay: 'game' }),
  closeOverlay: () => set({ overlay: null }),
  setView: (view) => set({ view }),
  setPicking: (picking, target) => set(target ? { picking, enterTarget: target } : { picking }),
  setLoggedIn: (loggedIn) => set({ loggedIn }),
  setLoginOpen: (loginOpen) => set({ loginOpen }),
  openCheckout: (plan = 'family', yearly = false) => set({ checkout: { plan, yearly } }),
  closeCheckout: () => set({ checkout: null }),
  setSoundOn: (sound) => set({ sound }),
}))

export const selectReduced = (s: SiteState) => s.tier === 'reduced'

// Tests drive overlays and login through the store: window.__st.store.getState().openBook(2)
exposeQA({ store: useSiteStore })
