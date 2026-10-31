import { create } from 'zustand'
import type Lenis from 'lenis'

export type MotionTier = 'full' | 'low' | 'reduced'
export type ShelfPhase =
  | 'dormant'
  | 'landing'
  | 'settling'
  | 'browsing'
  | 'dragging'
  | 'flinging'
  | 'elevating'
  | 'preview'
  | 'lowering'

export interface ShelfFilter {
  query: string
  ages: [number, number] | null
  tags: string[]
}

interface SiteState {
  tier: MotionTier
  reduceToggle: boolean
  perfLow: boolean
  lenis: Lenis | null
  pageEl: HTMLElement | null
  webgl: 'pending' | 'ok' | 'failed'
  shelf: {
    phase: ShelfPhase
    activeId: string | null
    index: number
    spinId: string | null
    filter: ShelfFilter
  }
  returnFocusEl: HTMLElement | null
  setTier: (tier: MotionTier) => void
  setReduceToggle: (on: boolean) => void
  setPerfLow: (low: boolean) => void
  setLenis: (lenis: Lenis | null) => void
  setPageEl: (el: HTMLElement | null) => void
  setWebgl: (s: 'pending' | 'ok' | 'failed') => void
  setPhase: (phase: ShelfPhase) => void
  setIndex: (index: number) => void
  openBook: (id: string, returnEl?: HTMLElement | null) => void
  closeBook: () => void
  requestSpin: (id: string | null) => void
  setFilter: (patch: Partial<ShelfFilter>) => void
  toggleTag: (tag: string) => void
}

export const useSiteStore = create<SiteState>()((set, get) => ({
  tier: 'full',
  reduceToggle: false,
  perfLow: false,
  lenis: null,
  pageEl: null,
  webgl: 'pending',
  shelf: { phase: 'dormant', activeId: null, index: 0, spinId: null, filter: { query: '', ages: null, tags: [] } },
  returnFocusEl: null,
  setTier: (tier) => set({ tier }),
  setReduceToggle: (on) => set({ reduceToggle: on }),
  setPerfLow: (low) => set({ perfLow: low }),
  setLenis: (lenis) => set({ lenis }),
  setPageEl: (pageEl) => set({ pageEl }),
  setWebgl: (webgl) => set({ webgl }),
  setPhase: (phase) => set((s) => ({ shelf: { ...s.shelf, phase } })),
  setIndex: (index) => set((s) => (s.shelf.index === index ? s : { shelf: { ...s.shelf, index } })),
  openBook: (id, returnEl = null) => set((s) => ({ shelf: { ...s.shelf, activeId: id }, returnFocusEl: returnEl })),
  closeBook: () => set((s) => ({ shelf: { ...s.shelf, activeId: null, spinId: null } })),
  requestSpin: (id) => set((s) => ({ shelf: { ...s.shelf, spinId: id } })),
  setFilter: (patch) => set((s) => ({ shelf: { ...s.shelf, filter: { ...s.shelf.filter, ...patch } } })),
  toggleTag: (tag) => {
    const tags = get().shelf.filter.tags
    get().setFilter({ tags: tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag] })
  },
}))

export const selectReduced = (s: SiteState) => s.tier === 'reduced'
