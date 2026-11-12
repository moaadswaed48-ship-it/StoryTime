import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { ArrowLeft, Clapperboard, Image as ImageIcon, Plus } from 'lucide-react'
import { Container, Eyebrow, Pill, Reveal, useInView, useOnScreen } from '@/design/ui'
import { asset } from '@/lib/asset'
import { cn } from '@/lib/cn'
import { exposeQA } from '@/lib/qa'
import { library } from '@/content/library'
import { story } from '@/content/story'
import { locale, num } from '@/i18n/locale'
import { t } from '@/i18n/copy'
import { useSiteStore } from '@/store/useSiteStore'
import { strings } from './strings'
import './studio.css'

const reducedNow = () => document.documentElement.hasAttribute('data-reduce-motion') || window.matchMedia('(prefers-reduced-motion: reduce)').matches
const two = (n: number) => (n < 10 ? num(0) : '') + num(n)
/** One waiting folder per season: enough to show how the next story gets in, without a wall of look-alike cards. */
const upcoming = (['winter', 'spring', 'summer', 'autumn'] as const).flatMap((season) => library.filter((b) => !b.ready && b.season === season).slice(0, 1))

/** Her manuscript is Arabic. It is shown as she wrote it in both languages of the site, set in the story face. */
function Hers({ children, className }: { children: string; className?: string }) {
  return (
    <span lang="ar" dir="rtl" className={cn('font-story', className)} style={{ fontFamily: "'Noto Naskh Arabic', 'Rubik Variable', serif" }}>
      {children}
    </span>
  )
}

/** A scene's clip, playing quietly only while it is on screen (a still when motion is reduced). */
function Clip({ src, poster }: { src: string; poster: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const on = useOnScreen(ref, '0px')
  const reduced = useSiteStore((s) => s.tier === 'reduced')
  const [live, setLive] = useState(false)
  useEffect(() => {
    const v = video.current
    if (!v) return
    if (on && !reduced) v.play().catch(() => {})
    else v.pause()
  }, [on, reduced])
  return (
    <div ref={ref} className="st-film">
      <img src={asset(poster)} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      {!reduced && (
        <video ref={video} src={asset(src)} muted loop playsInline preload="none" onPlaying={() => setLive(true)} className={cn('absolute inset-0 h-full w-full object-cover', live ? 'opacity-100' : 'opacity-0')} style={{ transition: 'opacity .5s' }} />
      )}
      <span className="glass absolute bottom-2.5 start-2.5 grid h-9 w-9 place-items-center rounded-full text-white" aria-hidden>
        <Clapperboard className="h-4 w-4" />
      </span>
    </div>
  )
}

/** What each of the four stops makes, shown with her own material: her text, her scenes, her film, her game. */
function Visual({ step }: { step: number }) {
  const first = story.scenes[0]
  if (step === 0)
    return (
      <div className="st-vis">
        <div className="st-manuscript">
          <Hers className="st-clamp block text-[14.5px] leading-[2.05] text-ink">{first.ar.join(' ')}</Hers>
        </div>
      </div>
    )
  if (step === 1)
    return (
      <div className="st-vis" dir="ltr">
        <img src={asset(story.scenes[1].thumb)} alt="" className="st-print" style={{ left: '2%', top: 10, rotate: '-7deg' }} draggable={false} />
        <img src={asset(story.scenes[9].thumb)} alt="" className="st-print" style={{ right: '2%', top: 22, rotate: '6deg' }} draggable={false} />
        <img src={asset(story.scenes[5].thumb)} alt="" className="st-print" style={{ left: '19%', top: 46, rotate: '-1.5deg' }} draggable={false} />
      </div>
    )
  if (step === 2)
    return (
      <div className="st-vis">
        <Clip src="film/c08.mp4" poster={story.scenes[7].thumb} />
      </div>
    )
  // the game in the story is the names game: her hero's name on a paper, the letter it starts with, and two that it does not contain
  const name = t.game.names[2]
  const letters = [t.game.letters[2], t.game.letters[4], t.game.letters[5]]
  return (
    <div className="st-vis">
      <span className="st-name">{name}</span>
      <span className="absolute bottom-3 end-[6%] flex gap-2">
        {letters.map((l, i) => (
          <span key={l} className={cn('grid h-[52px] w-[52px] place-items-center rounded-[16px] text-[24px] font-extrabold', i === 0 ? 'bg-ink text-paper shadow-lift' : 'bg-white/80 text-ink-2 shadow-soft')}>
            {l}
          </span>
        ))}
      </span>
    </div>
  )
}

/**
 * "The author's desk": a read-only demonstration of how her stories are managed and how the next one gets in.
 * She writes; the text becomes scenes, a film and a game. Her words are shown exactly as she wrote them.
 */
export function Studio() {
  const path = useRef<HTMLOListElement>(null)
  const seen = useInView(path, '0px 0px -18% 0px')
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!reducedNow()) setArmed(true)
  }, [])
  const [note, setNote] = useState(false)
  const film = story.scenes.filter((s) => s.clip).length

  useEffect(() => {
    exposeQA({ studio: { state: () => ({ scenes: story.scenes.length, film, still: story.scenes.length - film, next: upcoming.length, note, drawn: !armed || seen }) } })
  }, [film, note, armed, seen])

  return (
    <section id="studio" className="relative min-h-[100svh] bg-paper pb-[132px] pt-[84px] text-ink lg:pb-28 lg:pt-[132px]">
      <Container className="max-w-[1180px]">
        {/* head */}
        <header className="max-w-[50rem]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <Eyebrow tone="light">{t.app.studio.eyebrow}</Eyebrow>
            <span className="inline-flex h-8 items-center gap-2 rounded-full bg-ink px-3.5 text-[13px] font-semibold text-paper" data-st-demo>
              <span className="h-1.5 w-1.5 rounded-full bg-maple-soft" aria-hidden />
              {t.app.studio.demo}
            </span>
          </div>
          <h1 className="mt-5 max-w-[15ch] text-balance text-[clamp(2.3rem,6vw,4.6rem)] font-extrabold leading-[1.18] tracking-[-0.02em] ltr:leading-[1.02]">{t.app.studio.title}</h1>
          <p className="t-lede mt-5 max-w-[34rem] text-ink-2/80">{t.app.studio.lede}</p>
        </header>

        {/* the path of a story */}
        <ol ref={path} className={cn('st-path mt-12 lg:mt-16', armed && 'is-armed', armed && seen && 'is-drawn')} data-st-path>
          {t.app.studio.steps.map((s, i) => (
            <li key={i} className="st-step" style={{ '--i': i } as CSSProperties}>
              <span className="st-node tabular-nums" aria-hidden>
                {num(i + 1)}
              </span>
              <div className="st-body min-w-0">
                <Visual step={i} />
                <h2 className="t-h3 mt-4">{s.t}</h2>
                <p className="mt-1.5 max-w-[30ch] text-[15.5px] leading-relaxed text-ink-2/85">{s.s}</p>
              </div>
            </li>
          ))}
        </ol>

        {/* her story on the desk */}
        <div className="mt-20 lg:mt-28">
          <Reveal>
            <h2 className="t-h2 !text-[clamp(1.7rem,3.4vw,2.8rem)]">{t.app.studio.scenes}</h2>
          </Reveal>
          <Reveal delay={100} className="st-ledger mt-6 lg:mt-8" data-st-ledger>
            <div className="st-cols text-[13.5px] font-semibold text-muted" aria-hidden>
              <span />
              <span>{t.app.studio.cols.text}</span>
              <span>{t.app.studio.cols.picture}</span>
              <span>{t.app.studio.cols.film}</span>
              <span />
            </div>
            {story.scenes.map((s, i) => (
              <button key={i} type="button" className="st-row group" onClick={() => useSiteStore.getState().openBook(i)} data-st-scene={i} data-film={!!s.clip}>
                <span className="st-head flex items-baseline gap-3">
                  <span className="text-[13.5px] font-semibold tabular-nums text-muted">{two(i + 1)}</span>
                  <span className="text-[17px] font-bold leading-snug">{s.title[locale]}</span>
                </span>
                <Hers className="st-text text-[16px] leading-[1.9] text-ink-2">{s.ar.join(' ')}</Hers>
                <img src={asset(s.thumb)} alt="" loading="lazy" className="st-pic aspect-video w-full rounded-[10px] object-cover" draggable={false} />
                <span className="st-filmcell">
                  <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-ink/6 px-2.5 text-[12.5px] font-semibold text-ink-2">
                    {s.clip ? <Clapperboard className="h-3.5 w-3.5" aria-hidden /> : <ImageIcon className="h-3.5 w-3.5" aria-hidden />}
                    {s.clip ? strings.clip : t.app.studio.still}
                  </span>
                </span>
                <ArrowLeft className="hidden h-[18px] w-[18px] text-muted opacity-0 transition-[opacity,transform] duration-200 group-hover:opacity-100 ltr:rotate-180 min-[900px]:block" style={{ gridArea: 'go' }} aria-hidden />
              </button>
            ))}
          </Reveal>
        </div>

        {/* the next stories */}
        <div className="mt-20 lg:mt-28">
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
            <Reveal>
              <h2 className="t-h2 !text-[clamp(1.7rem,3.4vw,2.8rem)]">{t.app.studio.next}</h2>
            </Reveal>
            <div className="relative">
              <Pill variant="ink" size="lg" onClick={() => setNote((v) => !v)} aria-expanded={note} aria-controls="st-note" data-st-add>
                <Plus className="h-[18px] w-[18px]" aria-hidden />
                {t.app.studio.add}
              </Pill>
            </div>
          </div>
          <p id="st-note" role="status" className={cn('mt-4 rounded-[18px] bg-ink px-5 py-4 text-[15.5px] leading-relaxed text-paper', note ? 'view-in block' : 'hidden')} data-st-note>
            {note ? t.app.studio.addNote : ''}
          </p>
          <ul className="mt-7 grid grid-cols-2 gap-x-4 gap-y-6 lg:grid-cols-4 lg:gap-x-6" data-st-next>
            {upcoming.map((b, i) => (
              <Reveal as="li" key={b.id} delay={Math.min(i, 7) * 50}>
                <div className="st-folder flex min-h-[132px] flex-col" style={{ '--cloth': b.palette.cloth === '#e9e1d1' ? b.palette.ink : b.palette.cloth } as CSSProperties} data-st-folder={b.id}>
                  <span className="text-[12.5px] font-semibold text-muted">{t.library.filters[b.season]}</span>
                  <span className="mt-1 text-[18px] font-bold leading-snug">{b.title[locale]}</span>
                  <span className="mt-auto flex flex-wrap gap-1.5 pt-4">
                    <span className="inline-flex h-6 items-center rounded-full bg-white/70 px-2.5 text-[12px] font-semibold text-ink-2">{t.app.studio.working}</span>
                    <span className="inline-flex h-6 items-center rounded-full border border-dashed border-ink/25 px-2.5 text-[12px] font-semibold text-muted">{t.app.studio.waiting}</span>
                  </span>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  )
}
