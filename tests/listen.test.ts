import { describe, expect, it } from 'vitest'
import { IDLE, listenStep, type ListenEvent, type ListenState } from '@/reader/listen'

/** Runs events through the machine and collects the effects, as the reader does. */
function run(events: ListenEvent[], autoFlip: boolean, from: ListenState = IDLE) {
  let s = from
  const effects: string[] = []
  for (const e of events) {
    const out = listenStep(s, e, autoFlip)
    s = out.state
    effects.push(...out.effects.map((x) => ('page' in x ? `${x.type}:${x.page}` : x.type)))
  }
  return { state: s, effects }
}

describe('listen and auto-flip', () => {
  it('auto-flip on: reads a page, turns by itself, reads the next, and stops at the end of the book', () => {
    const { state, effects } = run([
      { type: 'play', pages: [1] },
      { type: 'ended', page: 1, lastPosition: false },
      { type: 'landed', pages: [2] },
      { type: 'ended', page: 2, lastPosition: true },
    ], true)
    expect(effects).toEqual(['start:1', 'turn', 'start:2', 'finished'])
    expect(state.playing).toBe(false)
  })

  it('auto-flip off: the voice stops when the page ends and the page stays', () => {
    const { state, effects } = run([{ type: 'play', pages: [3] }, { type: 'ended', page: 3, lastPosition: false }], false)
    expect(effects).toEqual(['start:3'])
    expect(state).toEqual(IDLE)
  })

  it('a spread is read in reading order before the book turns', () => {
    const { effects } = run([
      { type: 'play', pages: [1, 2] },
      { type: 'ended', page: 1, lastPosition: false },
      { type: 'ended', page: 2, lastPosition: false },
      { type: 'landed', pages: [3, 4] },
    ], true)
    expect(effects).toEqual(['start:1', 'start:2', 'turn', 'start:3'])
  })

  it('a turn by hand pauses the voice, also while an automatic turn is under way', () => {
    expect(run([{ type: 'play', pages: [1] }, { type: 'manualTurn' }], true)).toEqual({ state: IDLE, effects: ['start:1', 'stop'] })
    const mid = run([{ type: 'play', pages: [1] }, { type: 'ended', page: 1, lastPosition: false }, { type: 'manualTurn' }, { type: 'landed', pages: [2] }], true)
    expect(mid.effects).toEqual(['start:1', 'turn', 'stop'])
    expect(mid.state.playing).toBe(false)
  })

  it('ignores a late "ended" from a page that is no longer being read, and plays nothing on a page without words', () => {
    expect(run([{ type: 'play', pages: [2] }, { type: 'ended', page: 1, lastPosition: false }], true).effects).toEqual(['start:2'])
    expect(run([{ type: 'play', pages: [] }], true).effects).toEqual([])
    expect(run([{ type: 'play', pages: [4] }, { type: 'ended', page: 4, lastPosition: false }, { type: 'landed', pages: [] }], true).effects).toEqual(['start:4', 'turn', 'finished'])
  })

  it('pause stops; an error stops and reports', () => {
    expect(run([{ type: 'play', pages: [1] }, { type: 'pause' }], true).effects).toEqual(['start:1', 'stop'])
    expect(run([{ type: 'play', pages: [1] }, { type: 'error' }], true).effects).toEqual(['start:1', 'stop', 'failed'])
  })
})
