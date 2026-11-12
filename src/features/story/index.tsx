import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, ChevronLeft, ChevronRight, Gamepad2, Play, type LucideIcon } from 'lucide-react'
import { go } from '@/app/router'
import { sfx } from '@/audio/synth'
import { words } from '@/content/learning'
import { story } from '@/content/story'
import { BlurWords, Reveal } from '@/design/ui'
import { MAPLE } from '@/features/enter/Avatar'
import { LivingPicture } from '@/features/home/Living'
import '@/features/home/home.css'
import { t } from '@/i18n/copy'
import { dirSign, locale, num, rtl } from '@/i18n/locale'
import { asset } from '@/lib/asset'
import { exposeQA } from '@/lib/qa'
import { useProfileStore, type Activity } from '@/store/useProfileStore'
import { useSiteStore } from '@/store/useSiteStore'
import { Grownups } from './Grownups'
import { Words } from './Words'
import './story.css'

/** The picture at the top: the last scene, the migrating birds over the sunset — the second half of her title. */
const TOP = story.scenes[11]
type DoorId = 'read' | 'watch' | 'play'
const DOORS: { id: DoorId; icon: LucideIcon; earns: Activity; copy: { t: string; s: string } }[] = [
  { id: 'read', icon: BookOpen, earns: 'read', copy: t.app.story.read },
  { id: 'watch', icon: Play, earns: 'watched', copy: t.app.story.watch },
  { id: 'play', icon: Gamepad2, earns: 'played', copy: t.app.story.play },
]
const Back = rtl ? ChevronRight : ChevronLeft
const Prev = rtl ? ArrowRight : ArrowLeft
const Next = rtl ? ArrowLeft : ArrowRight

/**
 * One story's own page: a living picture and her title, three doors (read · watch · play), the twelve scenes,
 * words from the story on cards that turn over, and a quiet area for parents and teachers.
 */
export function StoryPage() {
  const progress = useProfileStore((s) => s.progress[story.id])
  const [flipped, setFlipped] = useState<Set<string>>(() => new Set())
  const [grown, setGrown] = useState(false)
  const strip = useRef<HTMLDivElement>(null)
  const live = useRef({ flipped, grown })
  live.current = { flipped, grown }

  const scene = Math.min(Math.max(progress?.scene ?? 0, 0), story.scenes.length - 1)
  const resume = scene > 0 && !progress?.read
  const site = useSiteStore.getState
  const enter = (id: DoorId) => {
    if (id === 'read') site().openBook(resume ? scene : 0)
    else if (id === 'watch') site().openFilm(0)
    else site().openGame()
  }
  const flip = (id: string) => {
    if (!words.some((w) => w.id === id)) return
    sfx.flip()
    setFlipped((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  /** Moves the scene strip by about two pictures, toward the next (or previous) scenes whatever the reading direction. */
  const slide = (dir: 1 | -1) => {
    const el = strip.current
    if (!el) return
    const card = el.querySelector<HTMLElement>('.scene')
    const step = (card ? card.offsetWidth + 14 : 280) * 2
    el.scrollBy({ left: dir * dirSign * step, behavior: site().tier === 'reduced' ? 'auto' : 'smooth' })
  }

  useEffect(() => {
    exposeQA({
      story: {
        doors: () => {
          const p = useProfileStore.getState().progress[story.id]
          return DOORS.map((d) => ({ id: d.id, done: !!p?.[d.earns] }))
        },
        flip: (id: string) => flip(id),
        grown: (open: boolean) => setGrown(open),
        state: () => ({
          title: document.querySelector('.story__title')?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
          flipped: [...live.current.flipped],
          grown: live.current.grown,
          scene: useProfileStore.getState().progress[story.id]?.scene ?? 0,
          scenes: document.querySelectorAll('.scene').length,
          living: !!document.querySelector('.story__top [data-live]'),
        }),
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section id="story" className="story bg-paper text-ink">
      <header className="story__top grain">
        <LivingPicture still={TOP.img} clip={TOP.clip} position="var(--story-pos, 70% 20%)" rate={0.75} eager />
        <div className="story__top-shade" aria-hidden />
        <div className="story__top-inner">
          <button type="button" className="story__back glass" data-story-back onClick={() => go('home')}>
            <Back size={18} strokeWidth={2.5} aria-hidden />
            {t.app.tabs.home}
          </button>
          <div className="story__headline">
            <p className="story__kicker text-on-film">{story.kicker[locale]}</p>
            <BlurWords as="h1" text={story.title[locale]} className="story__title display-on-film" immediate delay={150} />
          </div>
        </div>
      </header>

      <div className="story__wrap">
        <div className="doors" role="group" aria-label={story.title[locale]}>
          {DOORS.map(({ id, icon: Icon, earns, copy }, i) => {
            const done = !!progress?.[earns]
            return (
              <button key={id} type="button" className="door" data-door={id} data-done={done ? '' : undefined} style={{ ['--i' as string]: i }} onClick={() => enter(id)}>
                <span className="door__arch">
                  <img className="door__pic" src={asset(`app/doors/${id}.webp`)} alt="" width={560} height={840} decoding="async" draggable={false} />
                  <span className="door__shade" aria-hidden />
                  {done && (
                    <span className="door__done">
                      <svg viewBox="0 0 24 24" aria-hidden>
                        <path d={MAPLE} />
                      </svg>
                      <span className="door__done-word">{t.app.story.done}</span>
                    </span>
                  )}
                  <span className="door__label">
                    <span className="door__icon" aria-hidden>
                      <Icon strokeWidth={2.2} fill={id === 'watch' ? 'currentColor' : 'none'} />
                    </span>
                    <span className="door__t">{copy.t}</span>
                  </span>
                </span>
                <span className="door__s">{copy.s}</span>
              </button>
            )
          })}
        </div>

        <section className="story__block" aria-labelledby="story-scenes-title">
          <Reveal className="story__block-head">
            <h2 id="story-scenes-title" className="story__h2">
              {t.app.story.scenes}
            </h2>
            <div className="story__arrows">
              <button type="button" className="story__arrow" onClick={() => slide(-1)} aria-label={t.book.prev}>
                <Prev size={20} strokeWidth={2.2} aria-hidden />
              </button>
              <button type="button" className="story__arrow" onClick={() => slide(1)} aria-label={t.book.next}>
                <Next size={20} strokeWidth={2.2} aria-hidden />
              </button>
            </div>
          </Reveal>
          <div ref={strip} className="scenes" tabIndex={-1}>
            {story.scenes.map((s, i) => (
              <button key={i} type="button" className="scene" data-scene={i} onClick={() => site().openBook(i)}>
                <span className="scene__pic">
                  <img src={asset(s.thumb)} alt="" width={640} height={358} loading="lazy" decoding="async" draggable={false} />
                  <span className="scene__n">{num(i + 1)}</span>
                </span>
                <span className="scene__t">{s.title[locale]}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="story__block" aria-labelledby="story-words-title">
          <Reveal className="story__block-head story__block-head--stack">
            <h2 id="story-words-title" className="story__h2">
              {t.app.story.words}
            </h2>
            <p className="story__sub">{t.app.story.wordsSub}</p>
            {t.book.draft && <p className="story__draft">{t.book.draft}</p>}
          </Reveal>
          <Words flipped={flipped} onFlip={flip} />
        </section>

        <Grownups open={grown} onToggle={() => setGrown((v) => !v)} />
      </div>
    </section>
  )
}
