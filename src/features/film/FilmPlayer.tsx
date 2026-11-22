import 'media-chrome'
import { MediaCaptionsButton, MediaControlBar, MediaController, MediaFullscreenButton, MediaLoadingIndicator, MediaMuteButton, MediaPlayButton, MediaTimeDisplay, MediaTimeRange } from 'media-chrome/react'
import { addTranslation } from 'media-chrome/dist/utils/i18n.js'
import { useEffect, useId, useRef, useState } from 'react'
import type { FilmContent } from '@/data/types'
import { dirOf, type Lang } from '@/i18n/config'
import { useLang } from '@/i18n/use-dict'
import { Button } from '@/ui/controls'
import { chromeLabels } from './chrome-labels'
import './film.css'

/**
 * The one film player (owner's requests H2 to H4; Media Chrome 4.19.4, MIT, chosen in docs/SKILLS.md). Loaded only
 * inside the signed-in app (it is a lazy chunk). Poster first and metadata-only preload, so it opens at once; the
 * picture never carries controls on top of it (they sit underneath and never hide); captions in the language of
 * the voice, on by default, the choice remembered; the position remembered per profile; no next film starts.
 * Full screen: the frame itself where the browser allows it, else (iPhone) the video element's own full screen,
 * which Media Chrome falls back to; on a phone full screen also asks for landscape, as the old player did.
 */
type Props = {
  film: FilmContent
  title: string
  /** Language of the voice and captions (the story's language). */
  lang: Lang
  /** Where the position is remembered (per profile and story). */
  memoryKey: string
  captions: boolean
  onCaptions: (on: boolean) => void
  onWatched: () => void
  /** Try to start at once (the person just pressed Watch). Browsers may refuse; the big play button stays. */
  autoStart?: boolean
}

type LockableOrientation = ScreenOrientation & { lock?: (o: string) => Promise<void> }
/** Plain HTML attributes the React wrappers do not type (Media Chrome reads them as attributes). */
const attrs = (a: Record<string, string>) => a as object

export default function FilmPlayer({ film, title, lang, memoryKey, captions, onCaptions, onWatched, autoStart }: Props) {
  const { lang: siteLang, dict } = useLang()
  const t = dict.stories.film
  const ids = useId().replace(/[^a-zA-Z0-9]/g, '')
  const frameId = `film-frame-${ids}`
  const ctrlId = `film-ctrl-${ids}`
  const video = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState(false)
  const [track, setTrack] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const watched = useRef(false)

  // Our labels for Media Chrome, in the site language (the controller's `lang` picks them).
  addTranslation(siteLang, chromeLabels(t.chrome))

  // Captions: a small file can arrive inlined as a data: address, which some browsers will not load as a track;
  // turned into a same-origin blob address it always loads.
  useEffect(() => {
    let url: string | null = null
    let alive = true
    const src = film.captionsUrl
    if (!src) return setTrack(null)
    if (!src.startsWith('data:')) return setTrack(src)
    fetch(src).then((r) => r.blob()).then((b) => {
      if (!alive) return
      url = URL.createObjectURL(new Blob([b], { type: 'text/vtt' }))
      setTrack(url)
    }, () => alive && setTrack(null))
    return () => {
      alive = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [film.captionsUrl])

  // Remembered position, captions choice, "watched" mark.
  useEffect(() => {
    const v = video.current
    if (!v) return
    const restore = () => {
      let at = 0
      try { at = Number(localStorage.getItem(memoryKey)) || 0 } catch { /* private mode */ }
      if (at > 3 && Number.isFinite(v.duration) && at < v.duration - 3) v.currentTime = at
    }
    let last = 0
    const save = () => {
      if (Math.abs(v.currentTime - last) < 2) return
      last = v.currentTime
      try { localStorage.setItem(memoryKey, String(Math.floor(v.currentTime))) } catch { /* private mode */ }
      if (!watched.current && Number.isFinite(v.duration) && v.currentTime > v.duration * 0.9) {
        watched.current = true
        onWatched()
      }
    }
    const ended = () => {
      try { localStorage.removeItem(memoryKey) } catch { /* private mode */ }
      if (!watched.current) {
        watched.current = true
        onWatched()
      }
    }
    const fail = () => setError(true)
    v.addEventListener('loadedmetadata', restore)
    v.addEventListener('timeupdate', save)
    v.addEventListener('ended', ended)
    v.addEventListener('error', fail)
    if (v.readyState >= 1) restore()
    return () => {
      v.removeEventListener('loadedmetadata', restore)
      v.removeEventListener('timeupdate', save)
      v.removeEventListener('ended', ended)
      v.removeEventListener('error', fail)
    }
  }, [memoryKey, onWatched, attempt])

  useEffect(() => {
    const v = video.current
    if (!v) return
    const sync = () => {
      const tr = [...v.textTracks].find((x) => x.kind === 'captions' || x.kind === 'subtitles')
      if (tr && tr.mode !== 'showing' && captions) onCaptions(false)
      if (tr && tr.mode === 'showing' && !captions) onCaptions(true)
    }
    const apply = () => {
      const tr = [...v.textTracks].find((x) => x.kind === 'captions' || x.kind === 'subtitles')
      if (tr) tr.mode = captions ? 'showing' : 'disabled'
    }
    apply()
    v.textTracks.addEventListener('addtrack', apply)
    v.textTracks.addEventListener('change', sync)
    return () => {
      v.textTracks.removeEventListener('addtrack', apply)
      v.textTracks.removeEventListener('change', sync)
    }
  }, [captions, onCaptions, track])

  useEffect(() => {
    if (autoStart) void video.current?.play().catch(() => { /* the browser wants a tap: the big play button is there */ })
  }, [autoStart, attempt])

  // On a phone, full screen turns the film on its side (where the browser allows it).
  useEffect(() => {
    const on = () => {
      if (!document.fullscreenElement || !matchMedia('(pointer: coarse)').matches) return
      void (screen.orientation as LockableOrientation | undefined)?.lock?.('landscape').catch(() => {})
    }
    document.addEventListener('fullscreenchange', on)
    return () => document.removeEventListener('fullscreenchange', on)
  }, [])

  const [entering, setEntering] = useState(true)
  useEffect(() => {
    const id = window.setTimeout(() => setEntering(false), 500)
    return () => clearTimeout(id)
  }, [])

  if (!film.videoUrl) return <p className="rounded-control border border-dashed border-ink-muted p-6 text-center text-ink-muted">{t.notReady}</p>
  return (
    <div className="flex flex-col gap-2">
      <div id={frameId} className="film-frame" data-entering={entering || undefined} data-testid="film" dir={dirOf(siteLang)}>
        <MediaController id={ctrlId} lang={siteLang} noAutohide gesturesDisabled aria-label={t.label.replace('{title}', title)} {...attrs({ fullscreenelement: frameId })}>
          <video
            key={attempt}
            ref={video}
            slot="media"
            src={film.videoUrl}
            poster={film.posterUrl ?? undefined}
            preload="metadata"
            playsInline
            crossOrigin={film.videoUrl.startsWith('http') && !film.videoUrl.startsWith(location.origin) ? 'anonymous' : undefined}
            lang={lang}
            data-testid="film-video"
          >
            {track && <track kind="captions" src={track} srcLang={lang} label={dict.stories.film.chrome.captions} default={captions} />}
          </video>
          <MediaLoadingIndicator slot="centered-chrome" noAutohide />
          <MediaPlayButton slot="centered-chrome" className="film-big-play" />
        </MediaController>
        <MediaControlBar className="film-scrub" {...attrs({ mediacontroller: ctrlId })}>
          <MediaTimeRange />
        </MediaControlBar>
        <MediaControlBar {...attrs({ mediacontroller: ctrlId })}>
          <MediaPlayButton />
          <MediaTimeDisplay showDuration />
          <span className="flex-1" />
          {track && <MediaCaptionsButton data-testid="film-captions" />}
          <MediaMuteButton />
          <MediaFullscreenButton />
        </MediaControlBar>
      </div>
      {track && <p className="text-sm text-ink-muted">{t.captionsNote}</p>}
      {error && (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-control border-s-4 border border-red-800 bg-red-50 p-3 text-red-950">
          <span>{t.error}</span>
          <Button variant="secondary" onClick={() => { setError(false); setAttempt((n) => n + 1) }}>{dict.account.errors.retry}</Button>
        </div>
      )}
    </div>
  )
}
