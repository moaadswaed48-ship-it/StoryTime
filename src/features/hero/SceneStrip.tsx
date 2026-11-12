import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState, type CSSProperties } from 'react'
import { ChevronRight, Play } from 'lucide-react'
import { story } from '@/content/story'
import { t } from '@/i18n/copy'
import { locale } from '@/i18n/locale'
import { asset } from '@/lib/asset'
import { useSiteStore } from '@/store/useSiteStore'

/** Scenes 4, 6 and 11 (0-based indexes into `story.scenes`): blowing the paper · the wind · the leaf boat. */
export const HERO_SCENES = [3, 5, 10] as const

export interface StripHandle {
  el: HTMLDivElement | null
  hover: (i: number) => void
  leave: (i: number) => void
  playing: (i: number) => boolean
}

type CardApi = { hover: () => void; leave: () => void; playing: () => boolean }

const canHover = () => typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches

/**
 * One 16:9 scene card. With a mouse, the scene's real clip plays inside the card while it is hovered or focused.
 * `warm` (the pointer is somewhere over the strip) creates the <video> early so its first frames are already there.
 */
function SceneCard({ index, order, live, warm, clash, reduced, register }: { index: number; order: number; live: boolean; warm: boolean; clash: boolean; reduced: boolean; register: (order: number, api: CardApi | null) => void }) {
  const scene = story.scenes[index]
  const openFilm = useSiteStore((s) => s.openFilm)
  const covered = useSiteStore((s) => s.overlay !== null)
  const video = useRef<HTMLVideoElement>(null)
  const want = useRef(false)
  const [armed, setArmed] = useState(false) // the <video> exists
  const [wanted, setWanted] = useState(false) // hovered or focused: the clip should be running
  const [playing, setPlaying] = useState(false)
  const flag = useRef(false)

  const start = useCallback(() => {
    if (!scene.clip || reduced) return
    want.current = true
    setWanted(true)
    setArmed(true)
    video.current?.play().catch(() => {})
  }, [scene.clip, reduced])
  const stop = useCallback(() => {
    want.current = false
    flag.current = false
    setWanted(false)
    setPlaying(false)
    const v = video.current
    if (v) {
      v.pause()
      window.setTimeout(() => !want.current && (v.currentTime = 0), 360)
    }
  }, [])

  // The element is created on first hover: start it as soon as it exists.
  useEffect(() => {
    if (armed && want.current) video.current?.play().catch(() => {})
  }, [armed])

  // The film or the book opened on top (often by clicking this very card): the clip rests.
  useEffect(() => {
    if (covered) stop()
  }, [covered, stop])

  useEffect(() => {
    register(order, { hover: start, leave: stop, playing: () => flag.current })
    return () => register(order, null)
  }, [order, register, start, stop])

  return (
    <button
      type="button"
      className="hero-card hero-rise"
      style={{ '--d': `${640 + order * 60}ms`, '--rise': '44px' } as CSSProperties}
      data-hero-ui="strip"
      data-scene={index}
      data-playing={playing ? '' : undefined}
      data-loading={wanted && !playing ? '' : undefined}
      data-clash={clash ? '' : undefined}
      tabIndex={clash ? -1 : undefined}
      aria-hidden={clash || undefined}
      onClick={() => openFilm(index)}
      onPointerEnter={(e) => e.pointerType === 'mouse' && live && start()}
      onPointerLeave={(e) => e.pointerType === 'mouse' && stop()}
      onFocus={(e) => live && e.currentTarget.matches(':focus-visible') && start()}
      onBlur={stop}
      aria-label={`${t.hero.watch} — ${scene.title[locale]}`}
    >
      <img className="hero-card__media" src={asset(scene.thumb)} alt="" width={640} height={358} loading="eager" decoding="async" draggable={false} />
      {(armed || warm) && scene.clip && !reduced && (
        <video
          ref={video}
          className="hero-card__media hero-card__clip"
          src={asset(scene.clip)}
          muted
          playsInline
          loop
          preload="metadata"
          disablePictureInPicture
          tabIndex={-1}
          onPlaying={() => {
            if (!want.current) return video.current?.pause()
            flag.current = true
            setPlaying(true)
          }}
          onPause={() => {
            flag.current = false
            setPlaying(false)
          }}
        />
      )}
      <span className="hero-card__shade" />
      <span className="hero-card__meta">
        <span className="hero-card__play">
          <Play size={10} fill="currentColor" strokeWidth={0} aria-hidden />
        </span>
        <span className="hero-card__title">{scene.title[locale]}</span>
      </span>
    </button>
  )
}

/** "Scenes from the story": three living scene cards. Wide screens: a row, bottom-left. Phones and tablets: a snap row of posters. */
export const SceneStrip = forwardRef<StripHandle, { reduced: boolean; clash: number[] }>(function SceneStrip({ reduced, clash }, ref) {
  const el = useRef<HTMLDivElement>(null)
  const openBook = useSiteStore((s) => s.openBook)
  const cards = useRef<Array<CardApi | null>>([])
  const [live, setLive] = useState(false)
  const [warm, setWarm] = useState(false)
  useEffect(() => setLive(canHover()), [])
  const register = useCallback((order: number, api: CardApi | null) => {
    cards.current[order] = api
  }, [])

  useImperativeHandle(ref, () => ({
    get el() {
      return el.current
    },
    hover: (i) => cards.current[i]?.hover(),
    leave: (i) => cards.current[i]?.leave(),
    playing: (i) => !!cards.current[i]?.playing(),
  }))

  return (
    <div ref={el} className="hero-strip" onPointerEnter={(e) => e.pointerType === 'mouse' && live && setWarm(true)}>
      <div className="hero-strip__in">
        <div className="hero-strip__head hero-rise" style={{ '--d': '600ms' } as CSSProperties} data-hero-ui="strip">
          <p className="hero-strip__label">{t.hero.scenes}</p>
          <button type="button" className="hero-strip__all" onClick={() => openBook(0)}>
            {t.hero.all}
            <span className="hero-strip__arrow">
              <ChevronRight size={16} strokeWidth={2.2} className="flip-rtl" aria-hidden />
            </span>
          </button>
        </div>
        <div className="hero-strip__rail">
          {HERO_SCENES.map((index, order) => (
            <SceneCard key={index} index={index} order={order} live={live} warm={warm} clash={clash.includes(order)} reduced={reduced} register={register} />
          ))}
        </div>
      </div>
    </div>
  )
})
