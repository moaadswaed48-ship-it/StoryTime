import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import { pauseQuietly, playQuietly } from '@/lib/quiet'
import { asset } from '@/lib/asset'
import { blurPixels } from './blur'
import type { Frame } from './framing'

export interface FilmHandle {
  video: HTMLVideoElement | null
  /** Element moved by the pointer parallax. */
  parallax: HTMLDivElement | null
}

/**
 * Portrait phones do not get the film at all: a 16:9 frame shows them its middle 40 %, stretched two to three times.
 * They get the cover painting — the same moment, painted tall — as one sharp still (2× the original, see
 * scripts/assets/upscale.py). The lead's index.html preloads the same file for the same media query.
 */
export const PHONE_STILL = '(max-width: 760px) and (orientation: portrait)'
export const COVER_STILL = { src: 'story/hero-phone.webp', w: 1760, h: 2336 }
/** The cover at 16 × 21 pixels, inline: what the picture's place shows until the file has arrived, and the soft sky behind it. */
const COVER_TINY = 'data:image/webp;base64,UklGRrgAAABXRUJQVlA4IKwAAACQBACdASoQABUAPrVInkmnJCKhMAgA4BaJbACdMoR4GdBNBvSXiwHImBgcnoAA/uqB5Lw8DKLuhxN/qyReEVv/6Xs5h4wKVV1rhgITNpcvJwPeG6oUBm189aoNi/4j6J4+AgasM5vq9LtgsL38CVVUB33bbAEKoKgVGqAWBD/JbidfQP6+7wUXLFkbtAErZ5EqfCJ9EPE2dPclRgAuE7e5FWA3+/LlT9anAP4A'

/** Phones get a lighter poster (it only shows until the film arrives); index.html preloads the same file per screen. */
const POSTER = typeof window !== 'undefined' && window.matchMedia('(max-width: 760px)').matches ? 'film/hero-poster-1280.jpg' : 'film/hero-poster.jpg'

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
 * placed by the framing solver. With `cover` (portrait phones) it is the cover painting instead, and no film is fetched. On tall screens a blurred copy of the poster fills the rest.
 * `play` is false when the hero is off-screen, something covers it, or motion is reduced.
 */
export const Film = forwardRef<FilmHandle, { frame: Frame | null; play: boolean; still: boolean; /** Portrait phones: the cover painting, no <video> at all. */ cover: boolean; onState: (s: { ready: boolean; settled: boolean }) => void }>(function Film({ frame, play, still, cover, onState }, ref) {
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
  }, [frame, cover])

  // The backdrop is painted from the poster as soon as the poster has arrived.
  useEffect(() => {
    const img = poster.current
    const cv = backdrop.current
    if (!img || !cv) return
    if (cover) {
      // the cover's backdrop is its own tiny copy, stretched by CSS: nothing to paint (and nothing left from the film)
      cv.getContext('2d')?.clearRect(0, 0, cv.width, cv.height)
      return
    }
    const paint = () => paintBackdrop(cv, img)
    if (img.complete && img.naturalWidth) paint()
    else img.addEventListener('load', paint, { once: true })
    return () => img.removeEventListener('load', paint)
  }, [cover])

  // Fade the film in once it has a frame; settle the zoom then (or after a moment if it never loads).
  useEffect(() => {
    const v = video.current
    if (!v) {
      // the still: it settles from its slight zoom once it is on screen (or after a moment if it is slow)
      setReady(false)
      const img = poster.current
      const done = () => setSettled(true)
      if (img?.complete && img.naturalWidth) done()
      else img?.addEventListener('load', done, { once: true })
      const t = window.setTimeout(done, 2200)
      return () => {
        img?.removeEventListener('load', done)
        window.clearTimeout(t)
      }
    }
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
  }, [cover])

  useEffect(() => onState({ ready, settled }), [ready, settled, onState])

  // Play only while it can be seen.
  useEffect(() => {
    const v = video.current
    if (!v) return
    if (play) playQuietly(v)
    else pauseQuietly(v)
  }, [play, ready, cover])

  return (
    <div className="hero-media grain" aria-hidden>
      <canvas ref={backdrop} className="hero-backdrop" width={128} height={72} style={cover ? { backgroundImage: `url(${COVER_TINY})` } : undefined} />
      <div ref={plate} className="hero-plate" style={cover ? { backgroundImage: `url(${COVER_TINY})` } : undefined}>
        <div ref={par} className="hero-plate__par">
          <div className="hero-plate__zoom">
            {cover ? (
              <img key="cover" ref={poster} className="hero-still" src={asset(COVER_STILL.src)} width={COVER_STILL.w} height={COVER_STILL.h} alt="" decoding="async" fetchPriority="high" draggable={false} />
            ) : (
              <>
                <img key="poster" ref={poster} src={asset(POSTER)} alt="" decoding="async" fetchPriority="high" />
                <video ref={video} src={src} poster={asset(POSTER)} muted playsInline loop autoPlay={!still} preload="auto" disablePictureInPicture tabIndex={-1} />
              </>
            )}
          </div>
        </div>
      </div>
      <div className="hero-grade hero-grade--sky" />
      <div className="hero-grade hero-grade--halo" />
      <div className="hero-grade hero-grade--floor" />
    </div>
  )
})
