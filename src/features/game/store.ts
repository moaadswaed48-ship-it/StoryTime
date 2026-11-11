import { create } from 'zustand'
import { t } from '@/i18n/copy'
import { mulberry32 } from '@/lib/seeded'
import { allCollected, buildRound, collect, isCorrect, type Paper } from './logic'
import { resetRuntime } from './runtime'

/**
 * poster  → the card on the page
 * playing → Sari runs about
 * asking  → a paper was reached: the question card is open
 * right   → the right letter was chosen: a short celebration, then back to playing (or done)
 * done    → all five names collected
 */
export type Phase = 'poster' | 'playing' | 'asking' | 'right' | 'done'
/** '3d' = the yard; 'cards' = the same quiz without WebGL. */
export type Mode = '3d' | 'cards'

interface GameState {
  phase: Phase
  mode: Mode
  round: number
  papers: Paper[]
  collected: boolean[]
  /** Index of the paper being asked about. */
  current: number | null
  /** Wrong letters already tried for the current paper. */
  wrong: string[]
  /** Counts wrong answers (re-triggers the shake). */
  shakes: number
  /** The 3D world has drawn its first frames with Sari in it. */
  ready: boolean
  /** The player has moved Sari at least once (the hint can rest). */
  moved: boolean
  start: () => void
  exit: () => void
  again: () => void
  touch: (i: number) => void
  answer: (letter: string) => boolean
  advance: () => void
  setReady: (v: boolean) => void
  setMode: (m: Mode) => void
  setMoved: () => void
}

function newRound(round: number) {
  const papers = buildRound(t.game.names, t.game.letters, mulberry32(4177 + round * 97))
  resetRuntime(papers)
  return { round, papers, collected: papers.map(() => false), current: null, wrong: [], shakes: 0, moved: false }
}

export const useGame = create<GameState>()((set, get) => ({
  phase: 'poster',
  mode: '3d',
  round: 0,
  papers: [],
  collected: [],
  current: null,
  wrong: [],
  shakes: 0,
  ready: false,
  moved: false,
  start: () => {
    if (get().phase !== 'poster') return
    set({ ...newRound(get().round + 1), phase: 'playing', ready: false })
  },
  exit: () => set({ phase: 'poster', current: null, wrong: [], ready: false }),
  again: () => set({ ...newRound(get().round + 1), phase: 'playing' }),
  touch: (i) => {
    const s = get()
    if (s.phase !== 'playing' || s.collected[i] || !s.papers[i]) return
    set({ phase: 'asking', current: i, wrong: [] })
  },
  answer: (letter) => {
    const s = get()
    if (s.phase !== 'asking' || s.current === null) return false
    if (isCorrect(s.papers[s.current], letter)) {
      set({ phase: 'right', collected: collect(s.collected, s.current) })
      return true
    }
    if (!s.wrong.includes(letter)) set({ wrong: [...s.wrong, letter], shakes: s.shakes + 1 })
    else set({ shakes: s.shakes + 1 })
    return false
  },
  advance: () => {
    const s = get()
    if (s.phase !== 'right') return
    set({ phase: allCollected(s.collected) ? 'done' : 'playing', current: null, wrong: [] })
  },
  setReady: (ready) => set({ ready }),
  setMode: (mode) => set({ mode }),
  setMoved: () => !get().moved && set({ moved: true }),
}))
