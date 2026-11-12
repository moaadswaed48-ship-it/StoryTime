import type { CurlStats } from './curl/engine'

export interface ReaderClip {
  page: number
  playing: boolean
  live: boolean
}
export interface ReaderRect {
  /** The page (or the spread) on screen, CSS px. */
  x: number
  y: number
  w: number
  h: number
  pageW: number
  spread: boolean
  rtl: boolean
}

const NO_STATS: CurlStats = { frames: 0, cpuAvg: 0, cpuMax: 0, gapAvg: 0, gapMax: 0 }

/** Hooks published while the reader is closed, so tests can wait for `window.__st.reader` on any page. */
export const idleHooks = {
  phase: () => 'idle' as string,
  /** Printed number of the first page showing (1-based), and how many pages the book has. */
  page: () => 0,
  pages: () => 0,
  /** Printed numbers of every page showing. */
  visible: () => [] as number[],
  position: () => 0,
  positions: () => 0,
  scene: () => 0,
  spread: () => false,
  turning: () => false,
  ready: () => false,
  next: () => {},
  prev: () => {},
  goScene: (_n: number) => {},
  goPage: (_n: number) => {},
  close: () => {},
  /** Freezes a forward turn at `progress` (0…1); `null` lets the page fall back. */
  hold: (_progress: number | null, _grip?: number, _rise?: number) => {},
  size: () => 0,
  setSize: (_n: number) => {},
  chrome: (_on?: boolean) => false,
  stats: (_reset?: boolean) => NO_STATS,
  clips: () => [] as ReaderClip[],
  rect: () => null as ReaderRect | null,
  lines: () => [] as string[],
}
export type ReaderHooks = typeof idleHooks
