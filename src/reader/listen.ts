/**
 * Listening and auto-flip as a small state machine: pure, so it is unit-tested (tests/listen.test.ts). The reader
 * feeds it what happens (play pressed, a page's recording ended, the reader turned a page by hand, the book came to
 * rest after an automatic turn) and carries out the effects it returns (start a page's recording, stop, turn).
 *
 * The rules (owner's requests G1 to G3):
 *   - Play reads what is open: the one page, or both pages of a spread in reading order.
 *   - When the last open page ends: with auto-flip on, the book turns by itself and reading goes on; with auto-flip
 *     off, the voice stops and the page stays.
 *   - A turn made by hand pauses the voice.
 *   - At the end of the book the voice stops.
 */
export type ListenState = {
  playing: boolean
  /** The page being read (book page index), or null. */
  current: number | null
  /** Pages still to read at this position, in reading order. */
  queue: number[]
  /** An automatic turn was asked for and the book has not come to rest yet. */
  turning: boolean
}

export type ListenEvent =
  /** `pages`: the readable pages now open, in reading order (empty on a title or end page). */
  | { type: 'play'; pages: number[] }
  | { type: 'pause' }
  /** The recording of `page` ended; `lastPosition`: no position follows this one. */
  | { type: 'ended'; page: number; lastPosition: boolean }
  /** The reader turned the page (button, key, finger): never sent for a turn this machine asked for. */
  | { type: 'manualTurn' }
  /** The book is at rest at a new position after the automatic turn. */
  | { type: 'landed'; pages: number[] }
  | { type: 'error' }

export type ListenEffect =
  | { type: 'start'; page: number }
  | { type: 'stop' }
  | { type: 'turn' }
  /** Reading stopped because the book ended. */
  | { type: 'finished' }
  | { type: 'failed' }

export const IDLE: ListenState = { playing: false, current: null, queue: [], turning: false }

export function listenStep(s: ListenState, e: ListenEvent, autoFlip: boolean): { state: ListenState; effects: ListenEffect[] } {
  switch (e.type) {
    case 'play': {
      if (!e.pages.length) return { state: IDLE, effects: [] }
      const [first, ...rest] = e.pages
      return { state: { playing: true, current: first!, queue: rest, turning: false }, effects: [{ type: 'start', page: first! }] }
    }
    case 'pause':
      return { state: IDLE, effects: s.playing ? [{ type: 'stop' }] : [] }
    case 'manualTurn':
      return { state: IDLE, effects: s.playing || s.turning ? [{ type: 'stop' }] : [] }
    case 'error':
      return { state: IDLE, effects: [{ type: 'stop' }, { type: 'failed' }] }
    case 'ended': {
      if (!s.playing || s.current !== e.page) return { state: s, effects: [] }
      if (s.queue.length) {
        const [next, ...rest] = s.queue
        return { state: { ...s, current: next!, queue: rest }, effects: [{ type: 'start', page: next! }] }
      }
      if (e.lastPosition) return { state: IDLE, effects: [{ type: 'finished' }] }
      if (autoFlip) return { state: { playing: true, current: null, queue: [], turning: true }, effects: [{ type: 'turn' }] }
      return { state: IDLE, effects: [] }
    }
    case 'landed': {
      if (!s.playing || !s.turning) return { state: s, effects: [] }
      if (!e.pages.length) return { state: IDLE, effects: [{ type: 'finished' }] }
      const [first, ...rest] = e.pages
      return { state: { playing: true, current: first!, queue: rest, turning: false }, effects: [{ type: 'start', page: first! }] }
    }
  }
}
