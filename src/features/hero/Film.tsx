import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import { asset } from '@/lib/asset'
import { blurPixels } from './blur'
import type { Frame } from './framing'

export interface FilmHandle {
  video: HTMLVideoElement | null
  /** Element moved by the pointer parallax. */
  parallax: HTMLDivElement | null
}

const POSTER = 'film/hero-poster.jpg'

/**
 * Which file to play — decided once per load.
 * 1080p from laptop width up and on tall tablets (the frame is drawn that large), and also on phones with a dense
 * screen: a phone shows only the middle 40 % of the frame, so 720p would be stretched well over two times on the
 * boys' faces. 720p on plain screens and whenever the connection asks to save data.
 */
function pickSrc() {
  if (typeof window === 'undefined') return asset('film/hero-720.mp4')
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
  const thrifty = !!conn && (conn.saveData === true || /2g|3g/.test(conn.effectiveType ?? ''))
  const large = window.matchMedia('(min-width: 1024px), (min-width: 700px) and (min-height: 900px)').matches
  const dense = (window.devicePixelRatio || 1) >= 2
  return asset((large || dense) && !thrifty ? 'film/hero-1080.mp4' : 'film/hero-720.mp4')
}

/**
 * Paints the out-of-focus copy of the poster that fills what the film band leaves empty on tall screens.
 * It is blurred once, here, on a 128-pixel canvas that the browser then stretches — instead of a live
 * `filter: blur()` over a layer the size of a tablet screen.
 */
function paintBackdrop(cv: HTMLCanvasElement, img: HTMLImageElement) {
  const w = 128
  const h = 72
  const half = document.createElement('canvas')
  half.width = w * 3
  half.height = h * 3
  half.getContext('2d')?.drawImage(img, 0, 0, half.width, half.height) // two steps down: a cleaner average than one jump
  cv.width = w
  cv.height = h
  const ctx = cv.getContext('2d', { willReadFrequently: true })
  if (!ctx) return
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(half, 0, 0, w, h)
  try {
    const im = ctx.getImageData(0, 0, w, h)
    blurPixels(im.data, w, h, 3, 'clamp')
    const d = im.data
    for (let i = 0; i < d.length; i += 4) {
      // a little richer and a little darker than the film, so the band reads as the lit part of the picture
      const l = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]
      d[i] = (l + (d[i] - l) * 1.2) * 0.9
      d[i + 1] = (l + (d[i + 1] - l) * 1.2) * 0.9
      d[i + 2] = (l + (d[i + 2] - l) * 1.2) * 0.9
    }
    ctx.putImageData(im, 0, 0)
  } catch {
    /* the small unblurred copy is already soft when stretched */
  }
}

/**
 * The film plane: poster → looping film (fades in on `loadeddata`, settles from a slight zoom),
 * placed by the framing solver. On tall screens a blurred copy of the poster fills the rest.
 * `play` is false when the hero is off-screen, something covers it, or motion is reduced.
 */
export const Film = forwardRef<FilmHandle, { frame: Frame | null; play: boolean; still: boolean; onState: (s: { ready: boolean; settled: boolean }) => void }>(function Film({ frame, play, still, onState }, ref) {
  const video = useRef<HTMLVideoElement>(null)
  const plate = useRef<HTMLDivElement>(null)
  const par = useRef<HTMLDivElement>(null)
  const poster = useRef<HTMLImageElement>(null)
  const backdrop = useRef<HTMLCanvasElement>(null)
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
    Object.assign(b.style, { left: `${frame.x}px`, width: `${frame.w}px` })
  }, [frame])

  // The backdrop is painted from the poster as soon as the poster has arrived.
  useEffect(() => {
    const img = poster.current
    const cv = backdrop.current
    if (!img || !cv) return
    const paint = () => paintBackdrop(cv, img)
    if (img.complete && img.naturalWidth) paint()
    else img.addEventListener('load', paint, { once: true })
    return () => img.removeEventListener('load', paint)
  }, [])

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
      <canvas ref={backdrop} className="hero-backdrop" width={128} height={72} />
      <div ref={plate} className="hero-plate">
        <div ref={par} className="hero-plate__par">
          <div className="hero-plate__zoom">
            <img ref={poster} src={asset(POSTER)} alt="" decoding="async" fetchPriority="high" />
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
