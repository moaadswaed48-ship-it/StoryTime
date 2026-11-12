import { create } from 'zustand'
import type Lenis from 'lenis'
import { exposeQA } from '@/lib/qa'

export type MotionTier = 'full' | 'low' | 'reduced'
/** Only one fullscreen experience is open at a time. */
export type Overlay = null | 'book' | 'film' | 'game' | 'moon'
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
  /** Which side of the sign-in sheet opens first: signing in, or a new account. Back to 'in' whenever `setLoginOpen` is used. */
  authMode: 'in' | 'up'
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
  /** The first scene of the Moon film (code-drawn), from the Moon book's panel on the shelf. */
  openMoon: () => void
  closeOverlay: () => void
  setView: (view: View) => void
  setPicking: (on: boolean, target?: View) => void
  setLoggedIn: (v: boolean) => void
  setLoginOpen: (v: boolean) => void
  /** Opens the sign-in sheet on the given side (the landing page's two doors: returning parent, new parent). */
  openAuth: (mode?: 'in' | 'up') => void
  openCheckout: (plan?: string, yearly?: boolean) => void
  closeCheckout: () => void
  setSoundOn: (v: boolean) => void
}

/** The demo sign-in / subscription is remembered on this device, so a visitor who "paid" is not asked again. */
const MEMBER = 'st:member:v1'
function readMember(): boolean {
  try {
    return typeof location !== 'undefined' && !new URLSearchParams(location.search).has('qa') && localStorage.getItem(MEMBER) === '1'
  } catch {
    return false
  }
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
  loggedIn: readMember(),
  loginOpen: false,
  authMode: 'in',
  checkout: null,
  sound: false,
  setTier: (tier) => set({ tier }),
  setReduceToggle: (on) => set({ reduceToggle: on }),
  setPerfLow: (low) => set({ perfLow: low }),
  setLenis: (lenis) => set({ lenis }),
  openBook: (scene = 0) => set({ overlay: 'book', startScene: scene }),
  openFilm: (scene = 0) => set({ overlay: 'film', startScene: scene }),
  openGame: () => set({ overlay: 'game' }),
  openMoon: () => set({ overlay: 'moon' }),
  closeOverlay: () => set({ overlay: null }),
  setView: (view) => set({ view }),
  setPicking: (picking, target) => set(target ? { picking, enterTarget: target } : { picking }),
  setLoggedIn: (loggedIn) => {
    try {
      localStorage.setItem(MEMBER, loggedIn ? '1' : '0')
    } catch {
      /* private mode: the choice lasts for this visit */
    }
    set({ loggedIn })
  },
  setLoginOpen: (loginOpen) => set({ loginOpen, authMode: 'in' }),
  openAuth: (authMode = 'in') => set({ loginOpen: true, authMode }),
  openCheckout: (plan = 'family', yearly = false) => set({ checkout: { plan, yearly } }),
  closeCheckout: () => set({ checkout: null }),
  setSoundOn: (sound) => set({ sound }),
}))

export const selectReduced = (s: SiteState) => s.tier === 'reduced'

// Tests drive overlays and login through the store: window.__st.store.getState().openBook(2)
exposeQA({ store: useSiteStore })
