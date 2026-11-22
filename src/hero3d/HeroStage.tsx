/**
 * <HeroStage>: one code-built 3D character at a time, a way to switch between them, and a row of big picture
 * buttons that make them move. Touch, mouse and keyboard. With reduced motion the same canvas shows still poses;
 * without WebGL it shows pre-drawn pictures. The canvas stops drawing when it is off screen.
 */
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react'
import type * as THREE from 'three'
import type { Gesture, Sheet } from '../cast/sheet.ts'
import { mixHex } from './body.ts'
import type { Look } from './figure.ts'
import { ACTS, GESTURE_DEFS, type Act } from './gestures.ts'
import { FaceToken, GestureIcon } from './icons.tsx'
import { StageRuntime } from './stage.ts'

type Lang = 'ar' | 'he' | 'en' | 'da'
/** live: moving 3D · still: 3D shown as still poses (reduced motion) · flat: pictures only (no WebGL). */
export type HeroMode = 'live' | 'still' | 'flat'

export type HeroLabels = {
  stage: string
  choose: string
  move: string
  next: string
  previous: string
  gestures: Record<Act, string>
}
/** Screen-reader labels. English placeholders until the four dictionaries carry them (pass `labels`). */
const LABELS: HeroLabels = {
  stage: 'Story characters',
  choose: 'Choose a character',
  move: 'Make the character move',
  next: 'Next character',
  previous: 'Previous character',
  gestures: { wave: 'Wave', dance: 'Dance', jump: 'Jump', clap: 'Clap', spin: 'Spin', bow: 'Bow', cheer: 'Cheer', think: 'Think', peek: 'Peek-a-boo', hug: 'Hug' },
}

/** Pre-drawn pictures for visitors without WebGL: stills/<sheet id>-<gesture>.webp, made by scripts/hero-shots.mjs. */
const STILLS = import.meta.glob('./stills/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
const stillOf = (id: string, g: Gesture) => STILLS[`./stills/${id}-${g}.webp`] ?? STILLS[`./stills/${id}-idle.webp`]

type Frozen = { gesture: Gesture; t?: number } | null
type Shared = { look: Look | null; frozen: Frozen; dirty: boolean }

declare global {
  interface Window {
    /** Test hook (only with the `debug` prop): show one exact moment of one character. */
    __hero?: { ready: boolean; ids: string[]; acts: Act[]; durations: Record<string, number>; show: (id: string, gesture: Gesture, t?: number, turn?: number) => Promise<void>; shot: (type?: string) => string }
  }
}

function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

/** Inside the canvas: steps the stage and keeps the camera on the figure. */
function Scene({ rt, shared, animate }: { rt: StageRuntime; shared: Shared; animate: boolean }) {
  const { camera, size, invalidate } = useThree()
  useFrame((_, dt) => {
    rt.tick(dt, shared.look, shared.frozen)
    rt.placeCamera(camera as THREE.PerspectiveCamera, size.width / Math.max(1, size.height))
    // drawing on demand: keep going while something is still easing
    if (!animate && (rt.settling || shared.dirty)) {
      shared.dirty = false
      invalidate()
    }
  })
  return <primitive object={rt.group} />
}

export type HeroStageProps = {
  sheets: Sheet[]
  /** Language of the character names. */
  lang?: Lang
  /** Sheet id to start on. */
  initial?: string
  labels?: Partial<HeroLabels>
  /** Forces a mode (tests, the lab). */
  mode?: HeroMode
  /** Exposes window.__hero for screenshots and tests. */
  debug?: boolean
  className?: string
}

export function HeroStage({ sheets, lang = 'en', initial, labels, mode: forced, debug, className }: HeroStageProps) {
  const L = useMemo(() => ({ ...LABELS, ...labels, gestures: { ...LABELS.gestures, ...labels?.gestures } }), [labels])
  const [index, setIndex] = useState(() => Math.max(0, sheets.findIndex((s) => s.id === initial)))
  const [mode, setMode] = useState<HeroMode | null>(null)
  const [visible, setVisible] = useState(true)
  const [active, setActive] = useState<Gesture>('idle')
  const stageRef = useRef<HTMLDivElement>(null)
  const rt = useMemo(() => new StageRuntime(), [])
  const shared = useRef<Shared>({ look: null, frozen: null, dirty: true }).current
  const invalidateRef = useRef<() => void>(() => {})
  const sheet = sheets[index] ?? sheets[0]

  // which mode: no WebGL → pictures; reduced motion → still poses; else live
  useEffect(() => {
    if (forced) return setMode(forced)
    if (!hasWebGL()) return setMode('flat')
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const set = () => setMode(mq.matches ? 'still' : 'live')
    set()
    mq.addEventListener('change', set)
    return () => mq.removeEventListener('change', set)
  }, [forced])

  // draw only while on screen and the tab is in front
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    let onScreen = true
    const update = () => setVisible(onScreen && document.visibilityState === 'visible')
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting
      update()
    })
    io.observe(el)
    document.addEventListener('visibilitychange', update)
    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', update)
    }
  }, [])

  useEffect(() => () => rt.dispose(), [rt])

  // the character on stage
  useEffect(() => {
    if (!sheet || mode === null || mode === 'flat') return
    rt.select(sheet, mode === 'still')
    shared.dirty = true
    invalidateRef.current()
  }, [rt, sheet, mode, shared])

  // a still pose stays until another button is pressed; a live gesture ends by itself
  useEffect(() => {
    if (mode === 'live') {
      if (active === 'idle') return
      rt.play(active)
      const id = window.setTimeout(() => setActive('idle'), GESTURE_DEFS[active].duration * 1000)
      return () => window.clearTimeout(id)
    }
    if (!debug) shared.frozen = { gesture: active }
    shared.dirty = true
    invalidateRef.current()
  }, [rt, active, mode, shared, debug])
  useEffect(() => {
    if (mode === 'live' && !debug) shared.frozen = null
  }, [mode, shared, debug])

  const act = useCallback(
    (g: Act) => {
      if (mode === 'live') {
        // pressing again restarts it
        setActive('idle')
        requestAnimationFrame(() => setActive(g))
      } else setActive((was) => (was === g ? 'idle' : g))
    },
    [mode],
  )
  const go = useCallback(
    (to: number) => {
      const n = sheets.length
      setIndex(((to % n) + n) % n)
      setActive('idle')
    },
    [sheets.length],
  )

  // pointer: the character glances at it; a sideways drag turns the character; a tap says hello
  const drag = useRef<{ id: number; x: number; turn: number; moved: boolean } | null>(null)
  useEffect(() => {
    if (mode !== 'live') return
    const move = (e: PointerEvent) => {
      const el = stageRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      shared.look = { x: (e.clientX - (r.left + r.width / 2)) / (r.width * 0.7), y: -(e.clientY - (r.top + r.height * 0.38)) / (r.height * 0.7) }
    }
    const leave = () => (shared.look = null)
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerdown', move, { passive: true })
    document.addEventListener('pointerleave', leave)
    window.addEventListener('blur', leave)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', move)
      document.removeEventListener('pointerleave', leave)
      window.removeEventListener('blur', leave)
      shared.look = null
    }
  }, [mode, shared])
  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (mode === 'flat' || (e.target as HTMLElement).closest('button')) return
    drag.current = { id: e.pointerId, x: e.clientX, turn: rt.turn, moved: false }
  }
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const dx = e.clientX - d.x
    if (!d.moved && Math.abs(dx) > 8) {
      d.moved = true
      rt.holding = true
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    if (d.moved) {
      rt.turn = d.turn + dx * 0.012
      shared.dirty = true
      invalidateRef.current()
    }
  }
  const onUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    drag.current = null
    rt.holding = false
    if (!d.moved && e.type === 'pointerup') act('wave')
    else if (mode === 'still') {
      rt.turn = 0
      shared.dirty = true
      invalidateRef.current()
    }
  }

  // arrow keys move along a row of buttons (and follow the reading direction)
  const onRowKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Home' && e.key !== 'End') return
    const buttons = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('button')]
    const at = buttons.indexOf(document.activeElement as HTMLButtonElement)
    if (at < 0) return
    const rtl = getComputedStyle(e.currentTarget).direction === 'rtl'
    const step = (e.key === 'ArrowRight') !== rtl ? 1 : -1
    const to = e.key === 'Home' ? 0 : e.key === 'End' ? buttons.length - 1 : (at + step + buttons.length) % buttons.length
    buttons[to].focus()
    e.preventDefault()
  }

  // test hook
  useEffect(() => {
    if (!debug || mode === null || mode === 'flat') return
    const frame = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())))
    window.__hero = {
      ready: true,
      ids: sheets.map((s) => s.id),
      acts: ACTS,
      durations: Object.fromEntries(ACTS.map((a) => [a, GESTURE_DEFS[a].duration])),
      show: async (id, gesture, t, turn = 0) => {
        const i = sheets.findIndex((s) => s.id === id)
        if (i < 0) throw new Error(`no sheet ${id}`)
        rt.select(sheets[i], true)
        rt.turn = turn
        shared.frozen = { gesture, t }
        shared.dirty = true
        setIndex(i)
        invalidateRef.current()
        await frame()
        invalidateRef.current()
        await frame()
      },
      shot: (type = 'image/png') => stageRef.current?.querySelector('canvas')?.toDataURL(type, 0.9) ?? '',
    }
    return () => void delete window.__hero
  }, [debug, mode, rt, shared, sheets])

  if (!sheet) return null
  const tint = mixHex(sheet.top.color, '#fff8ee', 0.7)
  const animate = mode === 'live' && visible && !debug
  const vars = { '--hero-tint': tint } as CSSProperties

  return (
    <section className={`mx-auto flex w-full max-w-xl flex-col items-center gap-3 ${className ?? ''}`} aria-label={L.stage} style={vars}>
      <div
        ref={stageRef}
        className="relative aspect-[5/6] w-full max-w-md touch-pan-y select-none overflow-hidden"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        data-hero-mode={mode ?? 'pending'}
      >
        {/* the flat disc the character stands in front of, like a picture-book spot */}
        <div className="pointer-events-none absolute inset-x-0 top-[14%] mx-auto aspect-square w-[76%] rounded-full bg-[var(--hero-tint)] transition-colors duration-500 motion-reduce:transition-none" />
        {mode === 'flat' ? (
          <img src={stillOf(sheet.id, active)} alt={sheet.name[lang]} className="absolute inset-0 size-full object-contain" draggable={false} />
        ) : mode ? (
          <Canvas
            className="!absolute inset-0"
            flat
            dpr={[1, 2]}
            frameloop={animate ? 'always' : 'demand'}
            gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!debug }}
            camera={{ fov: 28, position: [0, 1, 6] }}
            onCreated={(state) => {
              invalidateRef.current = () => state.invalidate()
              const el = state.gl.domElement
              el.setAttribute('role', 'img')
              el.addEventListener('webglcontextlost', () => setMode('flat'))
            }}
            aria-label={sheet.name[lang]}
          >
            <Scene rt={rt} shared={shared} animate={animate} />
          </Canvas>
        ) : null}
        {sheets.length > 1 && (
          <>
            <button type="button" onClick={() => go(index - 1)} aria-label={L.previous} className="absolute start-1 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full border border-line bg-surface/90 text-ink shadow-sm active:scale-95">
              <svg viewBox="0 0 24 24" className="size-6 rtl:-scale-x-100" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button type="button" onClick={() => go(index + 1)} aria-label={L.next} className="absolute end-1 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full border border-line bg-surface/90 text-ink shadow-sm active:scale-95">
              <svg viewBox="0 0 24 24" className="size-6 rtl:-scale-x-100" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </>
        )}
      </div>

      <p className="text-lg font-semibold" aria-live="polite">{sheet.name[lang]}</p>

      {sheets.length > 1 && (
        <div role="group" aria-label={L.choose} className="flex max-w-full flex-wrap justify-center gap-2 px-2 py-1" onKeyDown={onRowKey}>
          {sheets.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => go(i)}
              aria-label={s.name[lang]}
              aria-pressed={i === index}
              className="size-12 shrink-0 rounded-full sm:size-14 border-2 border-transparent bg-surface p-0.5 transition-transform duration-150 aria-pressed:scale-110 aria-pressed:border-ink active:scale-95 motion-reduce:transition-none"
            >
              <FaceToken sheet={s} className="size-full rounded-full" />
            </button>
          ))}
        </div>
      )}

      <div role="group" aria-label={L.move} className="grid w-full grid-cols-5 gap-2 px-2 sm:gap-3" onKeyDown={onRowKey}>
        {ACTS.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => act(g)}
            aria-label={L.gestures[g]}
            aria-pressed={active === g}
            data-gesture={g}
            className="grid aspect-square min-h-14 place-items-center rounded-2xl border border-line bg-surface text-ink shadow-sm transition-transform duration-150 aria-pressed:bg-ink aria-pressed:text-paper active:scale-95 motion-reduce:transition-none"
          >
            <GestureIcon act={g} className="size-[78%]" />
          </button>
        ))}
      </div>
    </section>
  )
}
