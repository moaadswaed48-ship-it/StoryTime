import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { useOnScreen } from '@/design/ui'
import { useSiteStore } from '@/store/useSiteStore'
import { exposeQA } from '@/lib/qa'
import { REACH, nearestOpen, standPoint } from './logic'
import { rt } from './runtime'
import { useGame, webglSupported } from './store'
import { Poster } from './Poster'
import { PlayView, preloadWorld } from './PlayView'
import './game.css'

/**
 * "The Paper Yard" — the wind scattered the name papers: run with Sari, collect them, tell each name's first letter.
 *
 *  - `Game`        the poster section (`#game`); its button calls `openGame()`.
 *  - `GameOverlay` the full-screen play view, shown while `overlay === 'game'` — whoever calls `openGame()`
 *                  (the poster, the story page, the scroll story…) gets the same game.
 */

/** Where the poster picture sits on screen when the game is started from it: the play view grows out of that rectangle. */
const launch = { from: null as DOMRect | null }
const posterRect = () => document.querySelector<HTMLElement>('[data-game-picture]')?.getBoundingClientRect() ?? null

/* Only one play view may exist, however many times <GameOverlay> is mounted (App mounts one; the poster section brings its own). */
const mounted: symbol[] = []
const watchers = new Set<() => void>()
const subscribe = (fn: () => void) => {
  watchers.add(fn)
  return () => void watchers.delete(fn)
}
function useIsFirst() {
  const [id] = useState(() => Symbol('game-overlay'))
  useEffect(() => {
    mounted.push(id)
    watchers.forEach((fn) => fn())
    return () => {
      mounted.splice(mounted.indexOf(id), 1)
      watchers.forEach((fn) => fn())
    }
  }, [id])
  return useSyncExternalStore(
    subscribe,
    () => mounted[0] === id,
    () => false,
  )
}

export function GameOverlay() {
  const first = useIsFirst()
  const open = useSiteStore((s) => s.overlay === 'game')
  const playing = useGame((g) => g.phase !== 'poster')
  const [touch, setTouch] = useState(false)

  useEffect(() => setTouch(window.matchMedia('(pointer: coarse)').matches), [])
  // the overlay state is the single switch: opening it starts a round, anything that closes it ends the game
  useEffect(() => {
    if (!first) return
    if (open) useGame.getState().start()
    else {
      launch.from = null
      if (useGame.getState().phase !== 'poster') useGame.getState().exit()
    }
  }, [open, first])

  if (!first || !open || !playing) return null
  // PlayView keeps the rectangle it was born with, so it is read once, here
  return createPortal(<PlayView from={launch.from} touch={touch} />, document.body)
}

export function Game() {
  const picture = useRef<HTMLDivElement>(null)
  const section = useRef<HTMLElement>(null)
  const near = useOnScreen(section, '500px 0px')
  const [touch, setTouch] = useState(false)

  useEffect(() => setTouch(window.matchMedia('(pointer: coarse)').matches), [])
  // fetch the 3D chunk while the poster is coming into view, so "start" is instant
  useEffect(() => {
    if (near && webglSupported()) preloadWorld()
  }, [near])

  const start = useCallback(() => {
    launch.from = picture.current?.getBoundingClientRect() ?? null
    useSiteStore.getState().openGame()
  }, [])

  return (
    <>
      <Poster onStart={start} pictureRef={picture} sectionRef={section} touch={touch} />
      <GameOverlay />
    </>
  )
}

/* ── QA hooks: a test (or a screenshot script) can finish the game without real input ───────────────────── */

const flush = () => useGame.getState().phase === 'right' && useGame.getState().advance()
function place(i: number, gap: number) {
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
        total: g.papers.length,
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
      return g.papers.map((p, i) => ({ name: p.name, letter: p.letter, options: p.options.slice(), own: !!p.own, collected: !!g.collected[i], x: rt.papers[i]?.x ?? p.x, z: rt.papers[i]?.z ?? p.z }))
    },
    /** Opens the play view and deals a round at once (the same as pressing the poster's button). */
    start: () => {
      launch.from = posterRect()
      useSiteStore.getState().openGame()
      useGame.getState().start()
    },
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
    exit: () => {
      if (useSiteStore.getState().overlay === 'game') useSiteStore.getState().closeOverlay()
      useGame.getState().exit()
    },
  },
})
