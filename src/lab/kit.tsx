import { useCallback, useEffect, useRef, useState } from 'react'
import { GESTURES, type Gesture } from '@/cast/sheet'
import { CAST, castById } from '@/cast/cast'
import { drawFigure, drawFigureShadow } from '@/studio/figure/draw'
import { GESTURE_SECONDS, gesturePose } from '@/studio/figure/gestures'
import { rigOf } from '@/studio/figure/rig'
import { Painter, STAGE_H, STAGE_W, ellipse, paperGrain } from '@/studio/kit/core'
import { PROFILES } from '@/studio/style/profile'
import { LabButton } from './Button'

/**
 * The character builder on its own: any sheet of the cast, any shared gesture, either style profile.
 * Everything drawn is a pure function of time, so the scrubber can stop on any drawing.
 */
function render(ctx: CanvasRenderingContext2D, w: number, t: number, who: string, gesture: Gesture, style: string) {
  const P = new Painter(ctx, w)
  P.style = PROFILES[style] ?? PROFILES.gouache
  P.screen()
  ctx.fillStyle = P.style.palette.paper
  ctx.fillRect(0, 0, STAGE_W, STAGE_H)
  P.flat(ellipse(STAGE_W / 2, 930, 620, 70), '#f0d9a8')
  const sheet = castById(who)
  const pose = gesturePose(gesture, P.held(t), STAGE_W / 2, 930)
  // every character fills the frame, whatever its height
  const scale = 640 / rigOf(sheet, P.style).H
  drawFigureShadow(P, sheet, pose, { scale }, 0.7)
  drawFigure(P, sheet, pose, { scale })
  paperGrain(P)
}

const selectClass = 'min-h-11 rounded-control border border-line bg-surface px-3'

export default function KitLab() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [who, setWho] = useState('noor')
  const [gesture, setGesture] = useState<Gesture>('wave')
  const [style, setStyle] = useState('gouache')
  const [t, setT] = useState(0)
  const [playing, setPlaying] = useState(false)
  const duration = GESTURE_SECONDS[gesture]

  const draw = useCallback(
    (time: number) => {
      const c = canvas.current
      if (!c) return
      const pw = Math.round(c.clientWidth * Math.min(2, window.devicePixelRatio || 1))
      const ph = Math.round((pw * STAGE_H) / STAGE_W)
      if (c.width !== pw || c.height !== ph) {
        c.width = pw
        c.height = ph
      }
      render(c.getContext('2d')!, pw, time, who, gesture, style)
    },
    [who, gesture, style],
  )

  // Plays unless reduced motion is asked for.
  useEffect(() => {
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) setPlaying(true)
  }, [])
  useEffect(() => draw(t), [t, draw])
  useEffect(() => {
    const onResize = () => draw(t)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [draw, t])
  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      setT((v) => (v + dt) % duration)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, duration])

  return (
    <main className="flex flex-1 flex-col gap-3 p-3">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          Character
          <select className={selectClass} value={who} onChange={(e) => setWho(e.target.value)}>
            {CAST.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name.en} ({s.stage})
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          Gesture
          <select className={selectClass} value={gesture} onChange={(e) => (setT(0), setGesture(e.target.value as Gesture))}>
            {GESTURES.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          Style
          <select className={selectClass} value={style} onChange={(e) => setStyle(e.target.value)}>
            {Object.values(PROFILES).map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <canvas ref={canvas} className="aspect-video w-full rounded-control" role="img" aria-label="One character playing one gesture" />
      <div className="flex flex-wrap items-center gap-3">
        <LabButton onClick={() => setPlaying((p) => !p)} aria-pressed={playing} className="w-24">
          {playing ? 'Pause' : 'Play'}
        </LabButton>
        <input type="range" min={0} max={duration} step={0.01} value={t} onChange={(e) => (setPlaying(false), setT(Number(e.target.value)))} aria-label="Scrub through the gesture" className="min-h-11 flex-1" />
        <span className="w-28 text-end text-sm tabular-nums text-ink-muted">
          {t.toFixed(2)} / {duration} s
        </span>
      </div>
    </main>
  )
}
