import { useEffect, useLayoutEffect, useRef, useState, type ComponentType } from 'react'
import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react'
import { go } from '@/app/router'
import { story } from '@/content/story'
import { Pill } from '@/design/ui'
import { Library } from '@/features/library'
import { ReaderAvatar } from '@/features/enter/Avatar'
import { t } from '@/i18n/copy'
import { locale, num, rtl } from '@/i18n/locale'
import { cn } from '@/lib/cn'
import { exposeQA } from '@/lib/qa'
import { leavesOf, useProfileStore } from '@/store/useProfileStore'
import { useSiteStore } from '@/store/useSiteStore'
import { LivingPicture } from './Living'
import { ACTIVITIES, earned, Leaf, LeafRing } from './leaves'
import './home.css'

/** The shelf takes `variant="app"` once the library supports it (then it renders without its own heading); until then the prop is ignored. */
const Shelf = Library as ComponentType<{ variant?: 'landing' | 'app' }>
/** The scene of "today's story": leaves falling like rain (scene 8), the same picture that opens the landing page. */
const TODAY = story.scenes[7]
const Chevron = rtl ? ChevronLeft : ChevronRight

/**
 * The child's library: a greeting by name, today's story as one large living card, the leaves earned so far,
 * and the shelf with every story.
 */
export function AppHome() {
  const profile = useProfileStore((s) => s.profile)
  const progress = useProfileStore((s) => s.progress[story.id])
  const classroom = useProfileStore((s) => s.classroom)
  const shelf = useRef<HTMLDivElement>(null)
  /** True when the mounted shelf brings its own heading (the library without `variant="app"`): ours would only repeat it. */
  const [shelfHasHead, setShelfHasHead] = useState(false)
  useLayoutEffect(() => setShelfHasHead(!!shelf.current?.querySelector('h2')), [])

  const leaves = leavesOf(progress)
  const scene = Math.min(Math.max(progress?.scene ?? 0, 0), story.scenes.length - 1)
  const resume = scene > 0 && !progress?.read
  const name = profile?.name ?? ''
  const leafLabel = `${t.app.home.leaves}: ${num(leaves)} ${t.book.of} ${num(3)}`
  const read = () => useSiteStore.getState().openBook(resume ? scene : 0)

  useEffect(() => {
    exposeQA({
      home: {
        state: () => {
          const pr = useProfileStore.getState()
          const p = pr.progress[story.id]
          const sc = p?.scene ?? 0
          return {
            name: pr.profile?.name ?? '',
            avatar: pr.profile?.avatar ?? null,
            leaves: leavesOf(p),
            cta: sc > 0 && !p?.read ? 'continue' : 'start',
            scene: sc,
            classroom: pr.classroom,
            living: !!document.querySelector('.home__today [data-live]'),
          }
        },
      },
    })
  }, [])

  return (
    <section id="home" className="home bg-paper text-ink" data-classroom={classroom ? '' : undefined}>
      <div className="home__wrap">
        <header className="home__hello">
          <button type="button" className="home__me" onClick={() => useSiteStore.getState().setPicking(true)} aria-label={t.app.who.title}>
            <ReaderAvatar avatar={profile?.avatar ?? 'leaf'} className="h-full w-full" eager />
          </button>
          <h1 className="home__greet">
            {name ? (
              <>
                <span className="home__hi">{t.app.home.hello}</span>{' '}
                <span className="home__name" dir="auto">
                  {name}
                </span>
              </>
            ) : (
              <span>{t.app.home.helloGuest}</span>
            )}
          </h1>
        </header>

        <div className="home__grid">
          <article className="home__today" aria-labelledby="home-today-title">
            <div className="home__today-pic grain">
              <LivingPicture still={TODAY.img} clip={TODAY.clip} position="var(--today-pos, 68% 50%)" eager />
              <div className="home__today-fade" aria-hidden />
              <button type="button" className="home__today-hit" tabIndex={-1} aria-hidden onClick={read} />
            </div>

            <div className="home__today-top">
              <p className="home__chip glass">
                <span className="home__chip-dot" aria-hidden />
                {t.app.home.today}
              </p>
              {!classroom && (
                <div className="home__ring">
                  <LeafRing progress={progress} label={leafLabel} />
                </div>
              )}
            </div>

            <div className="home__today-body">
              <p className="home__kicker">{story.kicker[locale]}</p>
              <h2 id="home-today-title" className="home__title display-on-film">
                {story.title[locale]}
              </h2>
              <div className="home__acts">
                <Pill variant="solid" size="lg" className="home__go" data-home-read onClick={read}>
                  <BookOpen size={21} strokeWidth={2.2} aria-hidden />
                  {resume ? t.app.home.continue : t.app.home.start}
                </Pill>
                <Pill variant="glass" size="lg" className="home__open" data-home-open onClick={() => go('story')}>
                  {t.app.home.open}
                  <Chevron size={18} strokeWidth={2.4} aria-hidden />
                </Pill>
              </div>
            </div>
          </article>

          {!classroom && (
            <button type="button" className="home__leaves" data-home-leaves onClick={() => go('tree')} aria-label={`${leafLabel} — ${t.app.home.tree}`}>
              <span className="home__leaves-head">
                <span className="home__leaves-title">{t.app.home.leaves}</span>
                <span className="home__leaves-count" aria-hidden>
                  <b>{num(leaves)}</b> {t.book.of} {num(3)}
                </span>
              </span>
              <span className="home__leaves-row" aria-hidden>
                <svg className="home__twig" viewBox="0 0 300 60" preserveAspectRatio="none">
                  <path d="M2 34C60 14 120 46 176 26S262 22 298 30" />
                </svg>
                {ACTIVITIES.map(({ id, icon: Icon }, i) => (
                  <span key={id} className={cn('home__leaf', earned(progress, id) && 'is-on')} data-leaf={id} style={{ ['--i' as string]: i }}>
                    <Leaf on={earned(progress, id)} />
                    <span className="home__leaf-how">
                      <Icon strokeWidth={2.2} />
                    </span>
                  </span>
                ))}
              </span>
              <span className="home__leaves-go">
                {t.app.home.tree}
                <span className="home__leaves-arrow" aria-hidden>
                  <Chevron size={18} strokeWidth={2.6} />
                </span>
              </span>
            </button>
          )}
        </div>
      </div>

      <div ref={shelf} className="home__shelf">
        {!shelfHasHead && (
          <div className="home__wrap">
            <h2 className="home__h2">{t.app.home.shelf}</h2>
          </div>
        )}
        <Shelf variant="app" />
      </div>
    </section>
  )
}
