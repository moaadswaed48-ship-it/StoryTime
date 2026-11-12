import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type CSSProperties } from 'react'
import { useOnScreen } from '@/design/ui'
import { asset } from '@/lib/asset'
import { cn } from '@/lib/cn'
import { useSiteStore } from '@/store/useSiteStore'
import './quiet-film.css'

export interface QuietFilmHandle {
  /** The `<video>` element exists (it is only created near the viewport). */
  armed: () => boolean
  /** Frames are really arriving. */
  playing: () => boolean
  /** The clip (not the still) is what the visitor sees. */
  live: () => boolean
  /** How many times the clip has run to its end. */
  loops: () => number
  /** How far through the clip the picture on show is: 0 while the still (the first frame) shows, 1 on the resting last frame. */
  progress: () => number
}

interface Props {
  /** Paths under `public/`. The still must be the clip's first frame, so nothing jumps when the clip starts or loops. */
  clip: string
  poster: string
  posterSm?: string
  sizes?: string
  /** `object-position` of both layers (re-crop per breakpoint through the `--qf-focus` CSS variable instead, if needed). */
  focus?: string
  /** Seconds to rest on the last frame before dissolving back to the first. 0 = loop straight away. */
  hold?: number
  className?: string
  /** Tells the parent whether the clip is on show (used to lift scrims that only the still needs). */
  onLive?: (live: boolean) => void
}

/** How long before the end the still starts to come back (clips without a hold), and the dissolve itself. */
const LEAD = 0.75
const DISSOLVE = 1100

/**
 * A quiet moving background: the still is always there; the clip is created near the viewport, plays only while it is
 * on screen and nothing covers the page, and the still fades away once frames are really arriving.
 * The loop has no seam: at the end the clip rests on its last frame (`hold`), the still — which is the first frame —
 * dissolves back over it, and the clip restarts underneath. Reduced motion: the still only.
 */
export const QuietFilm = forwardRef<QuietFilmHandle, Props>(function QuietFilm({ clip, poster, posterSm, sizes = '100vw', focus, hold = 0, className, onLive }, ref) {
  const root = useRef<HTMLDivElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const loops = useRef(0)
  const timer = useRef(0)
  const reduced = useSiteStore((s) => s.tier === 'reduced')
  const covered = useSiteStore((s) => s.overlay !== null || s.loginOpen || s.picking)
  const near = useOnScreen(root, '60% 0px')
  const on = useOnScreen(root, '0px')
  const [armed, setArmed] = useState(false)
  const [live, setLive] = useState(false)
  const liveRef = useRef(false)
  const show = (v: boolean) => {
    liveRef.current = v
    setLive(v)
  }

  useEffect(() => {
    if (near && !reduced) setArmed(true)
  }, [near, reduced])

  const want = armed && on && !covered && !reduced

  useEffect(() => {
    window.clearTimeout(timer.current)
    // with reduced motion the clip is not even in the page: the still must be what shows
    if (reduced) show(false)
    const v = video.current
    if (!v) return
    v.muted = true
    if (!want) {
      v.pause()
      return
    }
    // Coming back to a clip that had finished: start it again from the still.
    if (v.ended || (v.duration && v.currentTime >= v.duration - 0.05)) {
      show(false)
      v.currentTime = 0
    }
    v.play().catch(() => {})
    return () => window.clearTimeout(timer.current)
  }, [want, reduced])

  // (the element is new each time motion is allowed again, so this follows `reduced` too)
  useEffect(() => {
    const v = video.current
    if (!v || !armed || reduced) return
    const onPlaying = () => {
      // one beat later, so the first decoded frame is on the glass before the still leaves
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => show(true), 90)
    }
    const onTime = () => {
      if (hold > 0 || !v.duration || !liveRef.current) return
      if (v.duration - v.currentTime < LEAD) show(false)
    }
    const restart = () => {
      v.currentTime = 0
      v.play().catch(() => {})
    }
    const onEnded = () => {
      loops.current += 1
      window.clearTimeout(timer.current)
      if (hold > 0) {
        // rest on the last frame, bring the still back over it, then run again underneath
        timer.current = window.setTimeout(() => {
          show(false)
          timer.current = window.setTimeout(restart, DISSOLVE)
        }, hold * 1000)
      } else {
        show(false)
        timer.current = window.setTimeout(restart, 320)
      }
    }
    v.addEventListener('playing', onPlaying)
    v.addEventListener('timeupdate', onTime)
    v.addEventListener('ended', onEnded)
    return () => {
      v.removeEventListener('playing', onPlaying)
      v.removeEventListener('timeupdate', onTime)
      v.removeEventListener('ended', onEnded)
      window.clearTimeout(timer.current)
    }
  }, [armed, hold, reduced])

  useEffect(() => {
    onLive?.(live)
  }, [live, onLive])

  useImperativeHandle(ref, () => ({
    armed: () => !!video.current,
    playing: () => !!video.current && !video.current.paused && !video.current.ended && video.current.readyState >= 2,
    live: () => liveRef.current,
    loops: () => loops.current,
    progress: () => {
      const v = video.current
      if (!v || !liveRef.current || !(v.duration > 0)) return 0
      return Math.min(1, Math.max(0, v.currentTime / v.duration))
    },
  }))

  const style = focus ? ({ '--qf-focus': focus } as CSSProperties) : undefined
  return (
    <div ref={root} className={cn('qf', className)} data-live={live ? '' : undefined} style={style}>
      {armed && !reduced && <video ref={video} className="qf__media" src={asset(clip)} muted playsInline preload="auto" disablePictureInPicture tabIndex={-1} aria-hidden />}
      <img
        className="qf__media qf__still"
        src={asset(poster)}
        srcSet={posterSm ? `${asset(posterSm)} 640w, ${asset(poster)} 1344w` : undefined}
        sizes={posterSm ? sizes : undefined}
        alt=""
        width={1344}
        height={752}
        loading="lazy"
        decoding="async"
        draggable={false}
      />
    </div>
  )
})
