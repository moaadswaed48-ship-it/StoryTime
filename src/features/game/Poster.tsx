import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { Gamepad2, Keyboard, Play } from 'lucide-react'
import { BlurWords, Container, Eyebrow, Pill, Reveal, useInView } from '@/design/ui'
import { t } from '@/i18n/copy'
import { dirSign, locale } from '@/i18n/locale'
import { asset } from '@/lib/asset'
import { cn } from '@/lib/cn'
import { story } from '@/content/story'

const TILT = [-7, 5, -3, 8, -5]
const LIFT = [0, 14, -6, 10, -2]

/**
 * The poster: scene 6 of the film ("the wind plays") as a 16:9 card, the title set like a game title screen,
 * and the five name papers lying by it as if the wind had just dropped them.
 * Wide screens (≥ 1280px): the words lie over the picture on the reading side, the boys on the other half.
 * Below that the picture sits on top (re-cropped on phones so both boys stay in) and the words under it.
 */
export function Poster({ onStart, pictureRef, sectionRef, touch }: { onStart: () => void; pictureRef: RefObject<HTMLDivElement | null>; sectionRef: RefObject<HTMLElement | null>; touch: boolean }) {
  const tags = useRef<HTMLUListElement>(null)
  const seen = useInView(tags)
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.hasAttribute('data-reduce-motion')
    if (!reduced) setArmed(true)
  }, [])
  const Hint = touch ? Gamepad2 : Keyboard

  return (
    <section ref={sectionRef} id="game" className="relative overflow-clip bg-night py-14 sm:py-24 lg:py-28" aria-label={t.game.title}>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[70%] bg-[radial-gradient(ellipse_at_top,rgba(244,163,94,0.08),transparent_70%)]" />
      <Container className="relative">
        <Reveal>
          <div className="game-poster relative isolate overflow-hidden rounded-[28px] bg-night-2 shadow-[0_40px_120px_rgba(0,0,0,0.45)] xl:aspect-[16/9]" data-game-poster>
            <div ref={pictureRef} className="grain relative aspect-[4/3] overflow-hidden sm:aspect-[16/9] xl:absolute xl:inset-0 xl:aspect-auto" data-game-picture>
              {/* composed for right-to-left reading (words over the school wall); mirrored for English so they never sit on a face */}
              <span className="game-flip block h-full w-full">
                <img
                  src={asset(story.scenes[5].img)}
                  alt={story.scenes[5].title[locale]}
                  width={1344}
                  height={752}
                  decoding="async"
                  className="game-poster-img h-full w-full object-cover object-[28%_50%] sm:object-center"
                />
              </span>
              {/* wide screens: a soft shade on the reading side only (the boys stay in full light), and a little ground under the words */}
              <div aria-hidden className="game-poster-scrim absolute inset-0 hidden xl:block" />
              <div aria-hidden className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-night-2 to-transparent xl:hidden" />
            </div>

            <div className="game-poster-body relative z-10 -mt-10 p-6 pb-7 sm:p-9 md:-mt-6 xl:absolute xl:inset-y-0 xl:start-0 xl:mt-0 xl:w-[34rem] xl:p-14">
              <div className="game-poster-text">
                <Reveal>
                  <Eyebrow>{t.game.eyebrow}</Eyebrow>
                </Reveal>
                <BlurWords as="h2" text={t.game.title} className="game-title display-on-film mt-3 block text-paper" />
                <Reveal delay={160}>
                  <p className="t-lede text-on-film mt-4 max-w-[32rem] text-paper/85 xl:max-w-[20.5rem]">{t.game.text}</p>
                </Reveal>
              </div>

              {/* the names to collect: little white slips, as if the wind had just dropped them here */}
              <ul ref={tags} aria-label={t.game.papers} className={cn('game-tags flex flex-wrap gap-2.5 xl:flex-nowrap xl:gap-1.5', armed && 'is-armed', armed && seen && 'is-in')} style={{ '--dir': dirSign } as CSSProperties}>
                {t.game.names.map((name, i) => (
                  <li key={name} className="game-tag" style={{ '--r': `${TILT[i % TILT.length]}deg`, '--i': i, '--lift': `${LIFT[i % LIFT.length]}px` } as CSSProperties}>
                    {name}
                  </li>
                ))}
              </ul>

              <Reveal delay={260} className="game-poster-cta flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                <Pill size="lg" onClick={onStart} className="w-full sm:w-auto" data-game-start>
                  <Play size={18} fill="currentColor" strokeWidth={0} aria-hidden />
                  {t.game.start}
                </Pill>
                <span className="inline-flex items-center justify-center gap-2.5 text-[14px] text-paper/60 sm:justify-start xl:text-paper/75">
                  <Hint size={18} aria-hidden />
                  {touch ? t.game.move : t.game.moveKeys}
                </span>
              </Reveal>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
