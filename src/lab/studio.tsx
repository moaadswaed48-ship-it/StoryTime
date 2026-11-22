import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { mountScene, type Mounted } from '@/studio/mount'
import { SCENES } from '@/studio/scenes'
import type { Lang } from '@/studio/scene'
import { PROFILES } from '@/studio/style/profile'
import { LabButton } from './Button'

/**
 * The Studio's scenes in the app: the book spread with its real text, the film shot with its caption, the model
 * sheets and the places. It mounts the same code the export script captures, so this page is the proof preview.
 * /lab/studio?scene=spread-oranges&lang=ar
 */
const LANGS: Lang[] = ['en', 'ar', 'he', 'da']
const selectClass = 'min-h-11 rounded-control border border-line bg-surface px-3'

export default function StudioLab() {
  const [params, setParams] = useSearchParams()
  const holder = useRef<HTMLDivElement>(null)
  const mounted = useRef<Mounted | null>(null)
  const id = params.get('scene') && SCENES[params.get('scene')!] ? params.get('scene')! : 'spread-oranges'
  const lang = (LANGS.includes(params.get('lang') as Lang) ? params.get('lang') : 'en') as Lang
  const style = params.get('style') && PROFILES[params.get('style')!] ? params.get('style')! : 'gouache'
  const scene = SCENES[id]
  const [t, setT] = useState(0)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const el = holder.current
    if (!el) return
    const m = mountScene(el, id, { lang, style, captions: true })
    mounted.current = m
    setT(0)
    return () => {
      m.destroy()
      mounted.current = null
    }
  }, [id, lang, style])
  useEffect(() => mounted.current?.seek(t), [t])
  useEffect(() => {
    if (!playing || !scene.duration) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      setT((v) => (v + dt) % scene.duration)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, scene.duration])

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    next.set(key, value)
    setParams(next, { replace: true })
  }

  return (
    <main className="flex flex-1 flex-col gap-3 p-3">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          Scene
          <select className={selectClass} value={id} onChange={(e) => (setPlaying(false), set('scene', e.target.value))}>
            {Object.values(SCENES).map((s) => (
              <option key={s.id} value={s.id}>
                {s.id}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          Language
          <select className={selectClass} value={lang} onChange={(e) => set('lang', e.target.value)}>
            {LANGS.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          Style
          <select className={selectClass} value={style} onChange={(e) => set('style', e.target.value)}>
            {Object.values(PROFILES).map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="text-sm text-ink-muted">{scene.title}</p>
      <div ref={holder} className="w-full overflow-hidden rounded-control" />
      {scene.duration > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <LabButton onClick={() => setPlaying((p) => !p)} aria-pressed={playing} className="w-24">
            {playing ? 'Pause' : 'Play'}
          </LabButton>
          <input type="range" min={0} max={scene.duration} step={0.01} value={t} onChange={(e) => (setPlaying(false), setT(Number(e.target.value)))} aria-label="Scrub through the scene" className="min-h-11 flex-1" />
          <span className="w-28 text-end text-sm tabular-nums text-ink-muted">
            {t.toFixed(2)} / {scene.duration} s
          </span>
        </div>
      )}
    </main>
  )
}
