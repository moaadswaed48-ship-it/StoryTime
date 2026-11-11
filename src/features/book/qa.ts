/** What `spread.clip()` reports about the scene's living picture. */
export interface ClipInfo {
  has: boolean
  playing: boolean
  live: boolean
  time: number
  ready: number
}
export const NO_CLIP: ClipInfo = { has: false, playing: false, live: false, time: 0, ready: 0 }

/** Hooks published while the overlay is closed, so tests can wait for `window.__st.book` on any page. */
export const idleHooks = {
  phase: () => 'idle',
  scene: () => 0,
  step: () => 0,
  steps: () => 0,
  next: () => {},
  prev: () => {},
  goScene: (_n: number) => {},
  open: () => {},
  close: () => {},
  turning: () => false,
  clip: () => NO_CLIP,
  hold: (_p: number | null) => {},
  tap: () => {},
}
