import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import { asset } from '@/lib/asset'
import type { Frame } from './framing'

export interface FilmHandle {
  video: HTMLVideoElement | null
  /** Element moved by the pointer parallax. */
  parallax: HTMLDivElement | null
}

const POSTER = 'film/hero-poster.jpg'
/** 1080p from laptop width up, 720p on phones and small tablets (decided once per load). */
const pickSrc = () => asset(typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches ? 'film/hero-1080.mp4' : 'film/hero-720.mp4')

/**
 * The film plane: poster → looping film (fades in on `loadeddata`, settles from a slight zoom),
 * placed by the framing solver. On tall screens a blurred copy of the poster fills the rest.
 * `play` is false when the hero is off-screen, an overlay covers it, or motion is reduced.
 */
export const Film = forwardRef<FilmHandle, { frame: Frame | null; play: boolean; still: boolean; onState: (s: { ready: boolean; settled: boolean }) => void }>(function Film({ frame, play, still, onState }, ref) {
  const video = useRef<HTMLVideoElement>(null)
  const plate = useRef<HTMLDivElement>(null)
  const par = useRef<HTMLDivElement>(null)
  const backdrop = useRef<HTMLImageElement>(null)
  const [src] = useState(pickSrc)
  const [ready, setReady] = useState(false)
  const [settled, setSettled] = useState(still)

  useImperativeHandle(ref, () => ({
    get video() {
      return video.current
    },
    get parallax() {
      return par.current
    },
  }))

  // Place the 16:9 frame (and the blurred backdrop behind it) where the solver wants it.
  useLayoutEffect(() => {
    const p = plate.current
    const b = backdrop.current
    if (!p || !b || !frame) return
    Object.assign(p.style, { inset: 'auto', left: `${frame.x}px`, top: `${frame.y}px`, width: `${frame.w}px`, height: `${frame.h}px` })
    const stops: string[] = []
    if (frame.fadeTop) {
      const [a, z] = frame.fadeTop
      stops.push(`transparent ${a}px`, `rgb(0 0 0 / .3) ${a + (z - a) * 0.5}px`, `#000 ${z}px`)
    }
    if (frame.fadeBottom) stops.push(`#000 ${frame.fadeBottom[0]}px`, `transparent ${frame.fadeBottom[1]}px`)
    const mask = stops.length ? `linear-gradient(to bottom, ${stops.join(', ')})` : ''
    p.style.setProperty('-webkit-mask-image', mask)
    p.style.setProperty('mask-image', mask)
    // Same horizontal placement as the film so colours line up; stretched over the full height (it is only blur).
    Object.assign(b.style, { left: `${frame.x}px`, width: `${frame.w}px`, top: '-48px', height: 'calc(100% + 96px)' })
  }, [frame])

  // Fade the film in once it has a frame; settle the zoom then (or after a moment if it never loads).
  useEffect(() => {
    const v = video.current
    if (!v) return
    v.muted = true
    v.defaultMuted = true
    const onData = () => {
      setReady(true)
      setSettled(true)
    }
    if (v.readyState >= 2) onData()
    else v.addEventListener('loadeddata', onData, { once: true })
    const t = window.setTimeout(() => setSettled(true), 2200)
    return () => {
      v.removeEventListener('loadeddata', onData)
      window.clearTimeout(t)
    }
  }, [])

  useEffect(() => onState({ ready, settled }), [ready, settled, onState])

  // Play only while it can be seen.
  useEffect(() => {
    const v = video.current
    if (!v) return
    if (play) v.play().catch(() => {})
    else v.pause()
  }, [play, ready])

  return (
    <div className="hero-media grain" aria-hidden>
      <img ref={backdrop} className="hero-backdrop" src={asset(POSTER)} alt="" decoding="async" />
      <div ref={plate} className="hero-plate">
        <div ref={par} className="hero-plate__par">
          <div className="hero-plate__zoom">
            <img src={asset(POSTER)} alt="" decoding="async" fetchPriority="high" />
            <video ref={video} src={src} poster={asset(POSTER)} muted playsInline loop autoPlay={!still} preload="auto" disablePictureInPicture tabIndex={-1} />
          </div>
        </div>
      </div>
      <div className="hero-grade hero-grade--sky" />
      <div className="hero-grade hero-grade--halo" />
      <div className="hero-grade hero-grade--floor" />
    </div>
  )
})
