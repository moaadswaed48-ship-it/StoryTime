import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { BookOpen, RotateCcw } from 'lucide-react'
import { BlurWords, Eyebrow, Pill } from '@/design/ui'
import { story } from '@/content/story'
import { t } from '@/i18n/copy'
import { locale } from '@/i18n/locale'
import { asset } from '@/lib/asset'
import { cn } from '@/lib/cn'

/**
 * The film's light on the walls: every so often the current frame is drawn into a 32×18 canvas that CSS
 * blows up and blurs behind the screen. Before the film has a picture it holds the cover's colours.
 */
export function Ambient({ video, active, slow }: { video: RefObject<HTMLVideoElement | null>; active: boolean; slow: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const painted = useRef(false)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || painted.current) return
    const img = new Image()
    img.onload = () => {
      if (painted.current) return
      ctx.drawImage(img, 0, img.height * 0.25, img.width, img.height * 0.5, 0, 0, canvas.width, canvas.height)
    }
    img.src = asset(story.coverThumb)
    return () => {
      img.onload = null
    }
  }, [])

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    const v = video.current
    if (!canvas || !ctx || !v) return
    const draw = (alpha: number) => {
      if (v.readyState < 2) return
      ctx.globalAlpha = alpha
      try {
        ctx.drawImage(v, 0, 0, canvas.width, canvas.height)
        painted.current = true
      } catch {
        /* a frame that cannot be read is simply skipped */
      }
    }
    const still = () => draw(1)
    v.addEventListener('seeked', still)
    v.addEventListener('pause', still)
    const id = active ? window.setInterval(() => draw(0.4), slow ? 900 : 220) : 0
    return () => {
      window.clearInterval(id)
      v.removeEventListener('seeked', still)
      v.removeEventListener('pause', still)
    }
  }, [video, active, slow])

  return <canvas ref={ref} className="film-ambient" width={32} height={18} aria-hidden />
}

/** The current scene's line in the author's own words. Whole words rise in one after another; lines cross-fade. */
export function Caption({ text }: { text: string | null }) {
  const [shown, setShown] = useState(text)
  const [leaving, setLeaving] = useState(false)
  useEffect(() => {
    if (text === shown) {
      setLeaving(false)
      return
    }
    if (!shown) {
      setShown(text)
      return
    }
    setLeaving(true)
    const id = window.setTimeout(() => {
      setShown(text)
      setLeaving(false)
    }, 300)
    return () => window.clearTimeout(id)
  }, [text, shown])

  return (
    <div className="film-caption" aria-live="polite" data-film-caption>
      {shown && (
        <p key={shown} className={cn('film-cue font-story', leaving && 'is-leaving')}>
          {shown.split(' ').map((w, i) => (
            <span key={i}>
              <span className="w" style={{ '--i': i } as CSSProperties}>
                {w}
              </span>{' '}
            </span>
          ))}
        </p>
      )}
    </div>
  )
}

/** The title broken by hand into two lines when the hero's two halves spell the story title; otherwise one block. */
const titleLines = (): [string, string] => (`${t.hero.titleA} ${t.hero.titleB}` === story.title[locale] ? [t.hero.titleA, t.hero.titleB] : [story.title[locale], ''])

/** Kicker + the story's title, set in type over the film's cover opening. */
export function TitleCard({ off }: { off: boolean }) {
  const [a, b] = titleLines()
  return (
    <div className={cn('film-title', off && 'is-off')} aria-hidden={off} data-film-title={off ? 'off' : 'on'}>
      <Eyebrow>{story.kicker[locale]}</Eyebrow>
      <p className="film-title__name display-on-film">
        <BlurWords text={a} immediate delay={120} />
        {b && <BlurWords text={b} immediate delay={320} className="b" />}
      </p>
    </div>
  )
}

/** After the last frame: "The End", read the book, watch again. */
export function EndCard({ onRead, onReplay, canReplay = true }: { onRead: () => void; onReplay: () => void; canReplay?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.querySelector('button')?.focus({ preventScroll: true })
  }, [])
  return (
    <div ref={ref} className="film-end" data-film-end>
      <Eyebrow className="justify-center">{story.title[locale]}</Eyebrow>
      <p className="film-end__word display-on-film">{t.film.end}</p>
      <div className="film-end__actions">
        <Pill variant="solid" size="lg" onClick={onRead} data-film-read>
          <BookOpen size={18} aria-hidden />
          {t.film.read}
        </Pill>
        {canReplay && (
          <Pill variant="glass" size="lg" onClick={onReplay} data-film-replay>
            <RotateCcw size={18} aria-hidden />
            {t.film.replay}
          </Pill>
        )}
      </div>
    </div>
  )
}
