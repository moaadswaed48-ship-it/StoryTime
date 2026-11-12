import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { pauseQuietly, playQuietly } from '@/lib/quiet'
import gsap from 'gsap'
import { Play, type LucideIcon } from 'lucide-react'
import { useOnScreen } from '@/design/ui'
import { story } from '@/content/story'
import { t } from '@/i18n/copy'
import { locale, num } from '@/i18n/locale'
import { asset } from '@/lib/asset'
import { clamp } from '@/lib/clamp'
import { useSiteStore } from '@/store/useSiteStore'

export interface LiveApi {
  /** The clip is really running (not just requested). */
  playing: () => boolean
  /** The `<video>` element exists (it is only created near the viewport). */
  armed: () => boolean
}

/**
 * A "living" bento tile: one scene of the film looping silently behind a card's words.
 * The still is always there; the clip is created near the viewport, plays only while the tile is on screen
 * and nothing covers the page, and the still fades away once frames are really arriving.
 * Reduced motion: the still only. The picture drifts a little against the frame as the page scrolls.
 */
export function LiveTile({ scene, no, title, text, icon: Icon, focus, register }: { scene: number; no: string; title: string; text: string; icon: LucideIcon; focus: string; register: (scene: number, api: LiveApi | null) => void }) {
  const s = story.scenes[scene]
  const root = useRef<HTMLDivElement>(null)
  const layer = useRef<HTMLDivElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const reduced = useSiteStore((st) => st.tier === 'reduced')
  const covered = useSiteStore((st) => st.overlay !== null || st.loginOpen || st.picking)
  const openFilm = useSiteStore((st) => st.openFilm)
  const near = useOnScreen(root, '35% 0px')
  const on = useOnScreen(root, '0px')
  const live = !!s.clip && !reduced
  const [armed, setArmed] = useState(false)
  const [ready, setReady] = useState(false)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (near && live) setArmed(true)
  }, [near, live])

  // Play on screen only.
  const want = armed && live && on && !covered
  useEffect(() => {
    const v = video.current
    if (!v) return
    if (want) playQuietly(v)
    else pauseQuietly(v)
  }, [want])

  // The picture moves a little slower than its frame (transform only; runs only while the tile is on screen).
  useEffect(() => {
    const el = root.current
    const img = layer.current
    if (!el || !img) return
    if (!on || reduced) {
      img.style.transform = ''
      return
    }
    const tick = () => {
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight
      const p = clamp((r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2), -1, 1)
      img.style.transform = `translate3d(0, ${(-p * 4.2).toFixed(3)}%, 0)`
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [on, reduced])

  useEffect(() => {
    register(scene, {
      playing: () => !!video.current && !video.current.paused && video.current.readyState >= 2,
      armed: () => !!video.current,
    })
    return () => register(scene, null)
  }, [scene, register])

  return (
    <div ref={root} className="pr-live" data-scene={scene} data-ready={ready && live ? '' : undefined} data-playing={playing && live ? '' : undefined} style={{ '--focus': focus } as CSSProperties}>
      <div className="pr-live__zoom">
        <div ref={layer} className="pr-live__layer">
          {armed && live && (
            <video
              ref={video}
              className="pr-live__media"
              src={asset(s.clip!)}
              muted
              loop
              playsInline
              preload="auto"
              disablePictureInPicture
              tabIndex={-1}
              aria-hidden
              onPlaying={() => {
                setReady(true)
                setPlaying(true)
              }}
              onPause={() => setPlaying(false)}
            />
          )}
          <img className="pr-live__media pr-live__still" src={asset(s.img)} srcSet={`${asset(s.thumb)} 640w, ${asset(s.img)} 1344w`} sizes="(min-width: 1024px) 720px, 100vw" alt="" width={1344} height={752} loading="lazy" decoding="async" draggable={false} />
        </div>
      </div>
      <span className="pr-live__shade" aria-hidden />

      <div className="pr-live__top">
        <span className="pr-live__chip glass">
          <span className="pr-live__dot" aria-hidden />
          <span>
            {t.book.page} {num(scene + 1)}
          </span>
          <span className="pr-live__chip-title">{s.title[locale]}</span>
        </span>
        <button type="button" className="pr-live__watch" onClick={() => openFilm(scene)} aria-label={`${t.hero.watch} — ${s.title[locale]}`}>
          <span className="pr-live__watch-ico">
            <Play size={12} fill="currentColor" strokeWidth={0} aria-hidden />
          </span>
          <span className="pr-live__watch-label">{t.hero.watch}</span>
        </button>
      </div>

      <div className="pr-live__text">
        <div className="pr-live__copy">
          <span className="pr-live__icon glass">
            <Icon size={20} strokeWidth={1.8} aria-hidden />
          </span>
          <h3 className="pr-live__t display-on-film">{title}</h3>
          <p className="pr-live__s text-on-film">{text}</p>
        </div>
        <span className="pr-live__no" aria-hidden>
          {no}
        </span>
      </div>
    </div>
  )
}
