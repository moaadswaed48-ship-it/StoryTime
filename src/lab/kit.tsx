import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { num } from '@/i18n/helpers'
import { E, Painter, STAGE_H, STAGE_W, ellipse, paperGrain, track } from '@/studio/kit/core'
import { drawPerson, rest, type Pose } from '@/studio/kit/people'
import { addHops, blinkAt, smoothBends } from '@/studio/kit/stage'
import { LabButton } from './Button'

/** One loop of the test action, seconds. Everything below is a pure function of time inside it. */
const DURATION = 4
const WHO = 'amir' as const
const BASE = rest(WHO, STAGE_W / 2, 880)
const HANG = BASE.by

/** Pose-to-pose: the hand comes up, waves, goes down; a small hop near the end; blinks. */
const keyed = track<Pose>(BASE, [
  [0.25, 0.5, { bx: 44, by: -82, happy: 1, mOpen: 0.45, turn: 0.18, lean: -0.05, brow: 0.4 }, 'back'],
  [2.35, 0.45, { bx: 9, by: HANG, happy: 0.4, mOpen: 0, turn: 0, lean: 0, brow: 0 }],
])
function rawPose(t: number): { amir: Pose } {
  const p = keyed(t)
  // The wave rides on top of the raised hand, fading in and out with it.
  const up = Math.min(1, Math.max(0, (t - 0.55) / 0.2)) * Math.min(1, Math.max(0, (2.4 - t) / 0.2))
  p.bx += up * 16 * Math.sin((t - 0.55) * Math.PI * 2 * 2.1)
  p.tilt = up * 0.06 * Math.sin((t - 0.55) * Math.PI * 2 * 1.05)
  p.blink = blinkAt([1.4, 3.55], t)
  addHops(p, t, [[3.05, 0.42, 46]])
  return { amir: p }
}

/** Draws frame `t` onto the canvas: neutral backdrop, a soft floor shadow, the puppet, the paper grain; the camera breathes. */
function render(ctx: CanvasRenderingContext2D, w: number, t: number) {
  const P = new Painter(ctx, w)
  P.screen()
  ctx.fillStyle = '#ecebe8'
  ctx.fillRect(0, 0, STAGE_W, STAGE_H)
  ctx.fillStyle = '#dedcd7'
  ctx.fillRect(0, 760, STAGE_W, STAGE_H - 760)
  const loop = 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / DURATION)
  P.cam = { x: STAGE_W / 2 + 60 * Math.sin((2 * Math.PI * t) / DURATION), y: 690 - 30 * E.soft(loop), zoom: 1.65 + 0.3 * loop }
  P.world()
  const pose = smoothBends(rawPose, t).amir
  ctx.fillStyle = 'rgba(40,40,40,0.16)'
  ctx.fill(ellipse(pose.x, pose.y + 4, 70 - pose.lift * 0.3, 12))
  drawPerson(P, WHO, pose, { helmet: false })
  paperGrain(P)
}

export default function KitLab() {
  const [params] = useSearchParams()
  const canvas = useRef<HTMLCanvasElement>(null)
  const start = Number(params.get('t'))
  const [t, setT] = useState(Number.isFinite(start) && start > 0 ? start % DURATION : 0)
  const [playing, setPlaying] = useState(false)
  const tRef = useRef(t)
  tRef.current = t

  const draw = useCallback((time: number) => {
    const c = canvas.current
    if (!c) return
    const w = c.clientWidth
    const scale = Math.min(2, window.devicePixelRatio || 1)
    const pw = Math.round(w * scale)
    const ph = Math.round((pw * STAGE_H) / STAGE_W)
    if (c.width !== pw || c.height !== ph) {
      c.width = pw
      c.height = ph
    }
    render(c.getContext('2d')!, pw, time)
  }, [])

  // Starts playing unless reduced motion is asked for, or a still was asked for with ?t=.
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!reduce && !params.get('t')) setPlaying(true)
    ;(window as unknown as { __lab?: unknown }).__lab = { seek: (s: number) => (setPlaying(false), setT(s)) }
  }, [params])

  useEffect(() => draw(t), [t, draw])
  useEffect(() => {
    const onResize = () => draw(tRef.current)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [draw])

  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      setT((v) => (v + dt) % DURATION)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing])

  return (
    <main className="flex flex-1 flex-col gap-3 p-3">
      <canvas ref={canvas} className="aspect-video w-full rounded-control bg-[#ecebe8]" role="img" aria-label="A paper-cut puppet waving, then hopping" />
      <div className="flex flex-wrap items-center gap-3">
        <LabButton onClick={() => setPlaying((p) => !p)} aria-pressed={playing} className="w-24">
          {playing ? 'Pause' : 'Play'}
        </LabButton>
        <input
          type="range"
          min={0}
          max={DURATION}
          step={0.01}
          value={t}
          onChange={(e) => {
            setPlaying(false)
            setT(Number(e.target.value))
          }}
          aria-label="Scrub through the loop"
          className="min-h-11 flex-1"
        />
        <span className="w-24 text-end text-sm tabular-nums text-ink-muted">
          {num(Math.floor(t * 100) / 100)} / {num(DURATION)} s
        </span>
      </div>
    </main>
  )
}
