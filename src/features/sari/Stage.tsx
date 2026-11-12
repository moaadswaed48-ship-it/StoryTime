import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { Footprints, Hand, PersonStanding, Rotate3d, type LucideIcon } from 'lucide-react'
import { sfx } from '@/audio/synth'
import { LazyCanvas } from '@/design/LazyCanvas'
import { Leaves, type LeavesHandle } from '@/design/Leaves'
import type { SariAction } from '@/design/SariModel'
import { useInView, useOnScreen } from '@/design/ui'
import { t } from '@/i18n/copy'
import { asset } from '@/lib/asset'
import { clamp } from '@/lib/clamp'
import { cn } from '@/lib/cn'
import { exposeQA } from '@/lib/qa'
import { useSiteStore } from '@/store/useSiteStore'
import { DRAG, WAVE_MS, createRuntime, wrapAngle } from './runtime'
import { FOV, Scene } from './Scene'

gsap.registerPlugin(ScrollTrigger)

const ACTIONS: Array<{ id: SariAction; icon: LucideIcon }> = [
  { id: 'wave', icon: Hand },
  { id: 'run', icon: Footprints },
  { id: 'idle', icon: PersonStanding },
]
const coarse = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
/** Colours stay as painted (the hoodie's mustard, the jeans' teal): highlights roll off softly instead of clipping. */
const GL = { antialias: !coarse, powerPreference: 'high-performance' as const, alpha: true, toneMapping: THREE.NeutralToneMapping, toneMappingExposure: 1.02 }
const CAMERA = { fov: FOV, near: 0.1, far: 40, position: [0, 0.95, 5] as [number, number, number] }
/** The giant word is repeated so it can rush past while he runs; at rest only the middle copy is on stage. */
const COPIES = [0, 1, 2, 3, 4]

/**
 * Without WebGL: his portrait, standing in a lit arch like a studio alcove.
 * The picture has a flat studio grey behind him: brightened until that grey is white and multiplied onto the arch,
 * the grey vanishes and only he (and his own soft shadow) lands on the warm wall. No cut-out file needed.
 */
function Portrait({ onShown }: { onShown: () => void }) {
  useEffect(() => onShown(), [onShown])
  return (
    <div className="sari-portrait">
      <div className="sari-portrait__arch">
        <img src={asset('story/sari.webp')} alt={t.sari.title} width={700} height={929} decoding="async" draggable={false} />
      </div>
    </div>
  )
}

/**
 * The stage: backdrop, the giant word, the 3D canvas, and the dock that makes him wave, run and stand.
 * Drag turns him (with a throw), a tap makes him wave, and he waves once by himself the first time he is seen.
 */
export function Stage() {
  const stage = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const leaves = useRef<LeavesHandle>(null)
  const rt = useRef(createRuntime()).current
  const reduced = useSiteStore((s) => s.tier === 'reduced')
  const seen = useInView(stage, '0px 0px -16% 0px')
  const onScreen = useOnScreen(stage, '40px 0px')

  /** What the visitor chose (stays until changed). A wave on top of it is a passing gesture. */
  const [mode, setMode] = useState<SariAction>('idle')
  const [waving, setWaving] = useState(false)
  const [ready, setReady] = useState(false)
  const [flat, setFlat] = useState(false) // no WebGL: the portrait is showing
  const [waved, setWaved] = useState(false)
  const [used, setUsed] = useState(false) // he has been turned once: the hint has done its job
  const [busy, setBusy] = useState(true)
  const [burst, setBurst] = useState<{ x: number; y: number; n: number } | null>(null) // a tap throws a few leaves
  const action: SariAction = waving ? 'wave' : mode
  const live = (ready || flat) && seen

  const timers = useRef<{ wave?: number; calm?: number; burst?: number }>({})
  /**
   * Reduced motion renders on demand. Anything the visitor does wakes the loop until the pose has settled:
   * at least 1.8 s and at least 45 drawn frames, so a slow device is never left half-way through a blend.
   */
  const poke = useCallback(() => {
    rt.lastInput = performance.now()
    setBusy(true)
    const from = rt.frames
    const settle = () => {
      if (rt.frames - from >= 45 || rt.frames === from) setBusy(false)
      else timers.current.calm = window.setTimeout(settle, 500)
    }
    window.clearTimeout(timers.current.calm)
    timers.current.calm = window.setTimeout(settle, 1800)
  }, [rt])
  const wave = useCallback(() => {
    setWaving(true)
    poke()
    window.clearTimeout(timers.current.wave)
    timers.current.wave = window.setTimeout(() => (setWaving(false), poke()), WAVE_MS)
  }, [poke])
  const choose = useCallback(
    (next: SariAction, keep = false) => {
      if (next === 'wave' && !keep) return wave()
      window.clearTimeout(timers.current.wave)
      setWaving(false)
      setMode(next)
      poke()
    },
    [poke, wave],
  )
  useEffect(() => {
    const held = timers.current
    return () => {
      window.clearTimeout(held.wave)
      window.clearTimeout(held.calm)
      window.clearTimeout(held.burst)
    }
  }, [])
  // the leaf layer only exists while leaves are in the air (or all the time behind the portrait)
  useEffect(() => {
    if (!burst) return
    leaves.current?.burst(burst.x, burst.y, 10)
    window.clearTimeout(timers.current.burst)
    timers.current.burst = window.setTimeout(() => setBurst(null), 2400)
  }, [burst])

  // the loop reads these without waiting for React
  useLayoutEffect(() => {
    rt.action = action
    rt.reduced = reduced
  }, [rt, action, reduced])
  // wide layout (same breakpoint as sari.css): the dock floats over the stage, so the framing leaves room for it
  useLayoutEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const sync = () => void (rt.docked = mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [rt])

  // first time on screen with him ready: the entrance turn starts, then he waves hello (once)
  useEffect(() => {
    if (!live || waved) return
    rt.introAt = performance.now()
    const id = window.setTimeout(
      () => {
        setWaved(true)
        // with reduced motion nothing moves by itself: he waves when asked
        if (!flat && !reduced) wave()
      },
      reduced || flat ? 0 : 700,
    )
    return () => window.clearTimeout(id)
  }, [live, waved, flat, reduced, rt, wave])

  // the stage's place on screen drives the scroll turn and the word's drift
  useGSAP(
    () => {
      const el = stage.current
      if (!el) return
      // progress 0 → 1 while the stage crosses the screen; turned into "screens away from the middle"
      const place = (self: ScrollTrigger) => {
        const span = (window.innerHeight + el.offsetHeight) / window.innerHeight
        rt.scroll = clamp((0.5 - self.progress) * span, -0.7, 0.7)
      }
      ScrollTrigger.create({ trigger: el, start: 'top bottom', end: 'bottom top', onUpdate: place, onRefresh: place })
    },
    { scope: stage },
  )

  // the marquee wraps on the distance between two copies of the word
  useEffect(() => {
    const el = track.current
    if (!el) return
    rt.word = el
    const measure = () => {
      const a = el.children[0] as HTMLElement | undefined
      const b = el.children[1] as HTMLElement | undefined
      if (a && b) rt.pitch = Math.abs(b.offsetLeft - a.offsetLeft)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    document.fonts?.ready.then(measure)
    return () => {
      ro.disconnect()
      rt.word = null
    }
  }, [rt])

  /* ── pointer: drag to turn, tap to wave, hover to be looked at ─────────────── */
  const drag = useRef({ id: -1, x: 0, t: 0, moved: 0, downAt: 0 })
  const look = (e: PointerEvent) => {
    const r = stage.current!.getBoundingClientRect()
    rt.px = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1)
    rt.py = clamp(1 - ((e.clientY - r.top) / r.height) * 2, -1, 1)
  }
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (flat || (e.pointerType === 'mouse' && e.button !== 0)) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { id: e.pointerId, x: e.clientX, t: e.timeStamp, moved: 0, downAt: e.timeStamp }
    rt.dragging = true
    rt.hold = false
    rt.vel = 0
    e.currentTarget.classList.add('is-grabbing')
    look(e)
    poke()
  }
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (d.id !== e.pointerId) {
      if (e.pointerType === 'mouse') look(e)
      return
    }
    const dx = e.clientX - d.x
    const dms = Math.max(1, e.timeStamp - d.t)
    d.x = e.clientX
    d.t = e.timeStamp
    d.moved += Math.abs(dx)
    rt.yaw += dx * DRAG
    rt.vel = 0.7 * rt.vel + 0.3 * ((dx * DRAG) / dms) * 1000
    rt.lastInput = performance.now()
    look(e)
  }
  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (d.id !== e.pointerId) return
    drag.current = { ...d, id: -1 }
    rt.dragging = false
    e.currentTarget.classList.remove('is-grabbing')
    if (e.pointerType !== 'mouse') rt.px = rt.py = 0
    const tap = e.type === 'pointerup' && d.moved < 8 && e.timeStamp - d.downAt < 500
    if (tap) {
      rt.vel = 0
      wave()
      sfx.pop()
      if (!reduced) {
        const r = e.currentTarget.getBoundingClientRect()
        const at = { x: e.clientX - r.left, y: e.clientY - r.top }
        setBurst((b) => ({ ...at, n: (b?.n ?? 0) + 1 }))
      }
    } else {
      // a pause before letting go kills the throw
      if (e.type !== 'pointerup' || e.timeStamp - d.t > 90 || reduced) rt.vel = 0
      rt.vel = clamp(rt.vel, -9, 9)
      if (d.moved > 24) setUsed(true)
    }
    poke()
  }
  const onLeave = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && drag.current.id === -1) rt.px = rt.py = 0
  }
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (flat || e.target !== e.currentTarget) return
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      rt.hold = false
      rt.vel = clamp(rt.vel + (e.key === 'ArrowRight' ? 2.4 : -2.4), -9, 9)
      setUsed(true)
    } else if (e.key === 'Enter' || e.key === ' ') wave()
    else return
    e.preventDefault()
    poke()
  }

  /* ── QA hooks: deterministic, no timing ────────────────────────────────────── */
  const snap = useRef({ action, mode, ready, flat, waved, reduced, live })
  snap.current = { action, mode, ready, flat, waved, reduced, live }
  useEffect(() => {
    exposeQA({
      sari: {
        action: () => snap.current.action,
        /** Holds an action (a held wave does not time out). */
        set: (a: SariAction) => choose(a, true),
        /** The same as a tap on him: one passing wave. */
        tap: () => wave(),
        /** Puts him at a turn (rad) and keeps him there. */
        turn: (rad: number) => {
          rt.yaw = rad
          rt.vel = 0
          rt.hold = true
          poke()
        },
        yaw: () => wrapAngle(rt.yaw),
        state: () => ({ ...snap.current, webgl: !snap.current.flat, yaw: wrapAngle(rt.yaw), shown: rt.shown, run: rt.run, stride: rt.stride, scroll: rt.scroll, calls: rt.calls, frames: rt.frames }),
      },
    })
  }, [choose, wave, poke, rt])

  const onReady = useCallback(() => (setReady(true), poke()), [poke])
  const onFlat = useCallback(() => setFlat(true), [])
  const index = ACTIONS.findIndex((a) => a.id === action)

  return (
    <div className={cn('sari-stagewrap', live && 'is-live', flat && 'is-flat', action === 'run' && 'is-running')}>
      <div
        ref={stage}
        className="sari-stage"
        tabIndex={flat ? -1 : 0}
        role="group"
        aria-label={flat ? t.sari.title : `${t.sari.title} · ${t.sari.hint}`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onPointerLeave={onLeave}
        onKeyDown={onKey}
      >
        <div className="sari-back" aria-hidden>
          <div className="sari-back__glow" />
          <div className="sari-back__rays" />
        </div>
        <div className="sari-word" aria-hidden>
          <div ref={track} className="sari-word__track t-mega">
            {COPIES.map((i) => (
              <span key={i}>{t.nav.sari}</span>
            ))}
          </div>
        </div>
        <div className="sari-canvas">
          <LazyCanvas camera={CAMERA} gl={GL} frameloop={!onScreen ? 'never' : reduced && !busy && action === 'idle' ? 'demand' : 'always'} fallback={<Portrait onShown={onFlat} />}>
            <Scene rt={rt} action={action} onReady={onReady} />
          </LazyCanvas>
        </div>
        {(flat || burst) && <Leaves ref={leaves} density={flat ? 9 : 0} className="sari-burst" />}
      </div>
      {!flat && (
        <div className="sari-controls">
          <p className={cn('sari-hint', used && 'is-used')}>
            <Rotate3d size={15} strokeWidth={2} aria-hidden />
            {t.sari.hint}
          </p>
          <div className="sari-dock glass" role="group" aria-label={t.sari.eyebrow} style={{ '--i': Math.max(0, index) } as CSSProperties}>
            <span className="sari-dock__thumb" aria-hidden />
            {ACTIONS.map(({ id, icon: Icon }) => (
              <button key={id} type="button" className="sari-dock__btn" data-action={id} aria-pressed={action === id} onClick={() => choose(id)}>
                <Icon size={17} strokeWidth={2.1} aria-hidden />
                <span>{t.sari[id]}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
