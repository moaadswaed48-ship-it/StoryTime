import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type RefObject } from 'react'
import { story } from '@/content/story'
import { t } from '@/i18n/copy'
import { dirSign, locale, rtl } from '@/i18n/locale'
import { asset } from '@/lib/asset'
import { clamp } from '@/lib/clamp'
import { cn } from '@/lib/cn'
import { clock, sceneIndexAt, type Timeline } from './timeline'

/**
 * The film's timeline: played and buffered fills, a gap at every scene change, a thumb, and (with a mouse)
 * a small preview of the scene under the pointer. Time runs with the reading direction, so in Arabic it
 * fills from the right. Progress goes straight into CSS variables every frame — no React state at frame rate.
 */
export function Scrubber({ video, tl, duration, onSeek, onScrub }: { video: RefObject<HTMLVideoElement | null>; tl: Timeline | null; duration: number; onSeek: (time: number) => void; onScrub: (active: boolean) => void }) {
  const root = useRef<HTMLDivElement>(null)
  const peekTime = useRef<HTMLSpanElement>(null)
  const drag = useRef(false)
  const [dragging, setDragging] = useState(false)
  const [peeking, setPeeking] = useState(false)
  const [peek, setPeek] = useState(0)

  useEffect(() => {
    let raf = 0
    let p = -1
    let b = -1
    let second = -1
    const tick = () => {
      const v = video.current
      const el = root.current
      if (v && el && duration > 0) {
        const np = clamp(v.currentTime / duration, 0, 1)
        if (np !== p) el.style.setProperty('--p', String((p = np)))
        let end = 0
        for (let i = 0; i < v.buffered.length; i++) if (v.buffered.start(i) <= v.currentTime + 0.25) end = Math.max(end, v.buffered.end(i))
        const nb = clamp(end / duration, 0, 1)
        if (nb !== b) el.style.setProperty('--b', String((b = nb)))
        const s = Math.floor(v.currentTime)
        if (s !== second) {
          second = s
          el.setAttribute('aria-valuenow', String(s))
          el.setAttribute('aria-valuetext', `${clock(s)} / ${clock(duration)}`)
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [video, duration])

  const timeAt = (clientX: number) => {
    const r = root.current!.getBoundingClientRect()
    const x = clamp((clientX - r.left) / Math.max(1, r.width), 0, 1)
    return (rtl ? 1 - x : x) * duration
  }
  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = true
    setDragging(true)
    onScrub(true)
    onSeek(timeAt(e.clientX))
  }
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const time = timeAt(e.clientX)
    if (drag.current) onSeek(time)
    if (e.pointerType !== 'mouse' || !tl) return
    root.current!.style.setProperty('--h', String(time / duration))
    if (peekTime.current) peekTime.current.textContent = clock(time)
    setPeek(Math.max(0, sceneIndexAt(tl, time)))
    setPeeking(true)
  }
  const up = () => {
    if (!drag.current) return
    drag.current = false
    setDragging(false)
    onScrub(false)
  }
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    const v = video.current
    if (!v) return
    const to = e.key === 'ArrowRight' ? v.currentTime + 5 * dirSign : e.key === 'ArrowLeft' ? v.currentTime - 5 * dirSign : e.key === 'ArrowUp' || e.key === 'PageUp' ? v.currentTime + 10 : e.key === 'ArrowDown' || e.key === 'PageDown' ? v.currentTime - 10 : e.key === 'Home' ? 0 : e.key === 'End' ? duration - 0.5 : null
    if (to === null) return
    e.preventDefault()
    e.stopPropagation()
    onSeek(to)
  }

  const scene = tl ? story.scenes[tl.scenes[peek]?.scene ?? 0] : null
  return (
    <div
      ref={root}
      className={cn('film-scrub', dragging && 'is-dragging', peeking && 'is-peeking')}
      role="slider"
      tabIndex={0}
      aria-label={t.film.title}
      aria-orientation="horizontal"
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={0}
      data-film-scrub
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onPointerLeave={() => setPeeking(false)}
      onKeyDown={key}
    >
      <div className="film-scrub__track">
        <div className="film-scrub__fill film-scrub__fill--buffer" />
        <div className="film-scrub__fill" />
        {/* a gap at every change of scene (not before the first one: the cover opening is part of it) */}
        {tl?.scenes.map((s, k) => (k > 0 ? <span key={s.scene} className="film-scrub__tick" style={{ insetInlineStart: `${(s.start / duration) * 100}%` }} /> : null))}
      </div>
      <span className="film-scrub__thumb" />
      {scene && (
        <span className="film-peek glass-ink" aria-hidden>
          <img src={asset(scene.thumb)} alt="" loading="lazy" decoding="async" />
          <span className="film-peek__title">{scene.title[locale]}</span>
          <span className="film-peek__time" dir="ltr" ref={peekTime} />
        </span>
      )}
    </div>
  )
}
