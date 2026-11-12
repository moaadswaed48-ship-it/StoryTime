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
 * and the five name papers lying on it as if the wind had just dropped them.
 * Phones get the picture on top (re-cropped so both boys stay in) and the words below it.
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
          <div className="game-poster relative isolate overflow-hidden rounded-[28px] bg-night-2 shadow-[0_40px_120px_rgba(0,0,0,0.45)] lg:aspect-[16/9]" data-game-poster>
            <div ref={pictureRef} className="grain relative aspect-[4/3] overflow-hidden sm:aspect-[16/9] lg:absolute lg:inset-0 lg:aspect-auto" data-game-picture>
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
              {/* text sits on the ground of the picture: a soft rise from the bottom, heavier on the reading side */}
              <div aria-hidden className="absolute inset-0 hidden bg-[linear-gradient(to_top,rgba(18,12,8,0.94)_0%,rgba(18,12,8,0.72)_24%,rgba(18,12,8,0.18)_52%,transparent_68%)] lg:block" />
              <div aria-hidden className="absolute inset-0 hidden bg-[radial-gradient(ellipse_at_0%_100%,rgba(18,12,8,0.72),transparent_58%)] lg:block rtl:bg-[radial-gradient(ellipse_at_100%_100%,rgba(18,12,8,0.72),transparent_58%)]" />
              <div aria-hidden className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-night-2 to-transparent lg:hidden" />
            </div>

            <div className="relative z-10 -mt-10 flex flex-col gap-7 p-6 pb-7 sm:p-9 lg:absolute lg:inset-x-0 lg:bottom-0 lg:mt-0 lg:flex-row lg:items-end lg:justify-between lg:gap-12 lg:p-12 xl:p-14">
              <div className="max-w-[35rem]">
                <Reveal>
                  <Eyebrow>{t.game.eyebrow}</Eyebrow>
                </Reveal>
                <BlurWords as="h2" text={t.game.title} className="game-title display-on-film mt-3 block text-paper lg:whitespace-nowrap" />
                <Reveal delay={160}>
                  <p className="t-lede text-on-film mt-4 max-w-[32rem] text-paper/85">{t.game.text}</p>
                </Reveal>
                <Reveal delay={260} className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                  <Pill size="lg" onClick={onStart} className="w-full sm:w-auto" data-game-start>
                    <Play size={18} fill="currentColor" strokeWidth={0} aria-hidden />
                    {t.game.start}
                  </Pill>
                  <span className="inline-flex items-center justify-center gap-2.5 text-[14px] text-paper/60 sm:justify-start">
                    <Hint size={18} aria-hidden />
                    {touch ? t.game.move : t.game.moveKeys}
                  </span>
                </Reveal>
              </div>

              <ul
                ref={tags}
                aria-label={t.game.papers}
                className={cn('game-tags order-first flex flex-wrap gap-2.5 lg:order-none lg:max-w-[21rem] lg:justify-end lg:gap-3 lg:pb-1', armed && 'is-armed', armed && seen && 'is-in')}
                style={{ '--dir': dirSign } as CSSProperties}
              >
                {t.game.names.map((name, i) => (
                  <li key={name} className="game-tag" style={{ '--r': `${TILT[i % TILT.length]}deg`, '--i': i, marginTop: LIFT[i % LIFT.length] } as CSSProperties}>
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
