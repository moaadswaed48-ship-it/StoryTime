import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useOnScreen } from '@/design/ui'
import { exposeQA } from '@/lib/qa'
import { nearestOpen, standPoint, REACH } from './logic'
import { rt } from './runtime'
import { useGame } from './store'
import { Poster } from './Poster'
import { PlayView, preloadWorld } from './PlayView'
import './game.css'

/** The same test LazyCanvas makes, so the game can choose its no-WebGL version before anything is loaded. */
function webglSupported(): boolean {
  try {
    if (new URLSearchParams(location.search).has('nowebgl')) return false
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

/**
 * "The Paper Yard" — the wind scattered the name papers: run with Sari, collect them, tell each name's first letter.
 * On the page it is a poster; starting it opens a fixed play view (WebGL yard, or the same quiz over the film still).
 */
export function Game() {
  const playing = useGame((g) => g.phase !== 'poster')
  const picture = useRef<HTMLDivElement>(null)
  const section = useRef<HTMLElement>(null)
  const near = useOnScreen(section, '500px 0px')
  const [from, setFrom] = useState<DOMRect | null>(null)
  const [touch, setTouch] = useState(false)

  useEffect(() => {
    setTouch(window.matchMedia('(pointer: coarse)').matches)
    useGame.getState().setMode(webglSupported() ? '3d' : 'cards')
  }, [])
  // fetch the 3D chunk while the poster is coming into view, so "start" is instant
  useEffect(() => {
    if (near && useGame.getState().mode === '3d') preloadWorld()
  }, [near])

  const start = useCallback(() => {
    setFrom(picture.current?.getBoundingClientRect() ?? null)
    useGame.getState().start()
  }, [])

  // QA hooks: a test (or a screenshot script) can finish the game without real input
  useEffect(() => {
    const flush = () => useGame.getState().phase === 'right' && useGame.getState().advance()
    const place = (i: number, gap: number) => {
      const g = useGame.getState()
      const p = rt.papers[i]
      if (!p || g.collected[i]) return false
      const stand = standPoint(p, rt.sari, gap)
      rt.target = null
      rt.snap = true
      rt.sari.x = stand.x
      rt.sari.z = stand.z
      rt.sari.heading = Math.atan2(p.x - stand.x, p.z - stand.z)
      return true
    }
    exposeQA({
      game: {
        state: () => {
          const g = useGame.getState()
          return {
            phase: g.phase,
            mode: g.mode,
            ready: g.ready,
            round: g.round,
            collected: g.collected.filter(Boolean).length,
            current: g.current,
            wrong: g.wrong.slice(),
            sari: { x: rt.sari.x, z: rt.sari.z, moving: rt.sari.moving },
            next: nearestOpen(rt.sari, rt.papers, g.collected),
            drawCalls: rt.calls,
            frames: rt.frames,
          }
        },
        papers: () => {
          const g = useGame.getState()
          return g.papers.map((p, i) => ({ name: p.name, letter: p.letter, options: p.options.slice(), collected: !!g.collected[i], x: rt.papers[i]?.x ?? p.x, z: rt.papers[i]?.z ?? p.z }))
        },
        start,
        /** Sari goes straight to paper i and reaches it (opens its question). */
        walkTo: (i: number) => {
          flush()
          if (useGame.getState().phase !== 'playing' || !place(i, REACH * 0.6)) return false
          useGame.getState().touch(i)
          return useGame.getState().phase === 'asking'
        },
        /** Sari stands a few steps from paper i without touching it. */
        near: (i: number, gap = 2.2) => {
          flush()
          return useGame.getState().phase === 'playing' && place(i, Math.max(gap, REACH + 0.4))
        },
        /** Puts Sari somewhere in the yard (screenshots of the heap of leaves, the fence, the tree). */
        teleport: (x: number, z: number) => {
          rt.target = null
          rt.snap = true
          rt.sari.x = x
          rt.sari.z = z
        },
        /** The same as tapping paper i: Sari walks to it through the real frame loop and picks it up on arrival. */
        tap: (i: number) => {
          const p = rt.papers[i]
          if (!p || useGame.getState().phase !== 'playing') return false
          rt.target = { x: p.x, z: p.z }
          return true
        },
        answer: (letter: string) => useGame.getState().answer(letter),
        again: () => useGame.getState().again(),
        /** Screenshots: keep the "well done" card on screen until the next walkTo(). */
        hold: (on = true) => void (rt.hold = on),
        exit: () => useGame.getState().exit(),
      },
    })
  }, [start])

  return (
    <>
      <Poster onStart={start} pictureRef={picture} sectionRef={section} touch={touch} />
      {playing && createPortal(<PlayView from={from} touch={touch} />, document.body)}
    </>
  )
}
