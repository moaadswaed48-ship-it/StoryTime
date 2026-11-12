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
  /** How far through the clip the picture on show is: 0 on the first frame, 1 on the last (a still counts as the frame it shows). */
  progress: () => number
  /** The picture is dipping to the night between two runs (the parent may move things while it is hidden). */
  dipping: () => boolean
}

interface Props {
  /** Paths under `public/`. `poster` must be the clip's first frame. */
  clip: string
  poster: string
  posterSm?: string
  sizes?: string
  /** `object-position` of every layer (re-crop per breakpoint through the `--qf-focus` CSS variable instead, if needed). */
  focus?: string
  /** Seconds to rest on the last frame before the next run. 0 = loop straight away (the still crossfades over the seam). */
  hold?: number
  /** Playback speed (a slower crane-up breathes). */
  rate?: number
  /**
   * The clip's LAST frame as a still (full URL, e.g. an imported image), with an optional small one. When given, this is
   * the picture at rest — before the clip starts, with reduced motion, while paused — and every change between it and
   * the moving clip is a short dip to the night instead of a crossfade (for clips whose camera moves, where first and
   * last frames are different pictures and a dissolve would show both at once).
   */
  rest?: { src: string; sm?: string }
  className?: string
  /** Tells the parent whether the clip is on show (used to lift scrims that only the still needs). */
  onLive?: (live: boolean) => void
}

/** How long before the end the still starts to come back (crossfade mode, no hold), and the dissolve itself. */
const LEAD = 0.75
const DISSOLVE = 1100
/** Dip mode: the night comes down in DIP_IN ms, the cut happens under it, and it lifts once the first frame is on the glass. */
const DIP_IN = 600
const DIP_SAFE = 700

/**
 * A quiet moving background. A still is always there; the clip is created near the viewport, plays only while it is
 * on screen and nothing covers the page.
 * Crossfade mode (default, for a static camera): the still is the first frame; it fades away once frames really arrive
 * and fades back over the loop seam. Dip mode (`rest`): the still is the last frame; the picture dips briefly to the
 * night, the clip starts under it, and after each run (plus `hold`) it dips again and starts over. Never a double exposure.
 * Reduced motion: the still only (in dip mode, the last frame — the calm one).
 */
export const QuietFilm = forwardRef<QuietFilmHandle, Props>(function QuietFilm({ clip, poster, posterSm, sizes = '100vw', focus, hold = 0, rate = 1, rest, className, onLive }, ref) {
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
  const [dip, setDip] = useState(false)
  const liveRef = useRef(false)
  const dipRef = useRef(false)
  const wantRef = useRef(false)
  const dipMode = !!rest
  const show = (v: boolean) => {
    liveRef.current = v
    setLive(v)
  }
  const veil = (v: boolean) => {
    dipRef.current = v
    setDip(v)
  }

  useEffect(() => {
    if (near && !reduced) setArmed(true)
  }, [near, reduced])

  const want = armed && on && !covered && !reduced
  wantRef.current = want

  /** Dip mode: bring the night down, run `cut` under it, lift it once the new first frame is really on the glass. */
  const dipThen = (cut: (v: HTMLVideoElement) => void) => {
    const v = video.current
    if (!v) return
    window.clearTimeout(timer.current)
    veil(true)
    timer.current = window.setTimeout(() => {
      if (!wantRef.current) return veil(false)
      let done = false
      const lift = () => {
        if (done) return
        done = true
        v.removeEventListener('playing', lift)
        window.clearTimeout(timer.current)
        // one beat later, so the decoded frame is on the glass before the night lifts
        timer.current = window.setTimeout(() => veil(false), 60)
      }
      v.addEventListener('playing', lift)
      cut(v)
      show(true)
      // never stay dark: lift anyway if the browser is slow to say so
      timer.current = window.setTimeout(lift, DIP_SAFE)
    }, DIP_IN)
  }

  useEffect(() => {
    window.clearTimeout(timer.current)
    // with reduced motion the clip is not even in the page: the still must be what shows
    if (reduced) {
      show(false)
      veil(false)
    }
    const v = video.current
    if (!v) return
    v.muted = true
    if (!want) {
      v.pause()
      if (dipRef.current) veil(false)
      return
    }
    v.playbackRate = rate
    if (dipMode) {
      if (!liveRef.current || v.ended) {
        // from the resting still (the last frame) into the first: through the night
        dipThen((el) => {
          el.currentTime = 0
          el.playbackRate = rate
          el.play().catch(() => {})
        })
      } else v.play().catch(() => {})
      return () => window.clearTimeout(timer.current)
    }
    // Coming back to a clip that had finished: start it again from the still.
    if (v.ended || (v.duration && v.currentTime >= v.duration - 0.05)) {
      show(false)
      v.currentTime = 0
    }
    v.play().catch(() => {})
    return () => window.clearTimeout(timer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [want, reduced, rate, dipMode])

  // (the element is new each time motion is allowed again, so this follows `reduced` too)
  useEffect(() => {
    const v = video.current
    if (!v || !armed || reduced) return
    const onPlaying = () => {
      if (dipMode) return // the dip decides when the clip is on show
      // one beat later, so the first decoded frame is on the glass before the still leaves
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => show(true), 90)
    }
    const onTime = () => {
      if (dipMode || hold > 0 || !v.duration || !liveRef.current) return
      if (v.duration - v.currentTime < LEAD) show(false)
    }
    const restart = () => {
      v.currentTime = 0
      v.playbackRate = rate
      v.play().catch(() => {})
    }
    const onEnded = () => {
      loops.current += 1
      window.clearTimeout(timer.current)
      if (dipMode) {
        // rest on the last frame (the clip itself holds it), then through the night to the first
        timer.current = window.setTimeout(() => wantRef.current && dipThen(restart), hold * 1000)
      } else if (hold > 0) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [armed, hold, reduced, rate, dipMode])

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
      if (!v || !liveRef.current || !(v.duration > 0)) return dipMode ? 1 : 0
      return Math.min(1, Math.max(0, v.currentTime / v.duration))
    },
    dipping: () => dipRef.current,
  }))

  const style = focus ? ({ '--qf-focus': focus } as CSSProperties) : undefined
  const still = rest ? { src: rest.src, sm: rest.sm } : { src: asset(poster), sm: posterSm ? asset(posterSm) : undefined }
  return (
    <div ref={root} className={cn('qf', className)} data-live={live ? '' : undefined} data-dip={dip ? '' : undefined} data-mode={dipMode ? 'dip' : undefined} style={style}>
      {armed && !reduced && (
        <video ref={video} className="qf__media" src={asset(clip)} muted playsInline preload="auto" disablePictureInPicture tabIndex={-1} aria-hidden />
      )}
      <img
        className="qf__media qf__still"
        src={still.src}
        srcSet={still.sm ? `${still.sm} 640w, ${still.src} ${rest ? 1280 : 1344}w` : undefined}
        sizes={still.sm ? sizes : undefined}
        alt=""
        width={rest ? 1280 : 1344}
        height={rest ? 720 : 752}
        loading="lazy"
        decoding="async"
        draggable={false}
      />
      {dipMode && <span className="qf__veil" aria-hidden />}
    </div>
  )
})
