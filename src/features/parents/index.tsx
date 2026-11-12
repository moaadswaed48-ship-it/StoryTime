import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { Feather, Languages, Puzzle, School, ShieldCheck, UsersRound, type LucideIcon } from 'lucide-react'
import { prefersReducedNow } from '@/app/useMotionTier'
import { Container, Reveal, SectionHead, useInView } from '@/design/ui'
import { t } from '@/i18n/copy'
import { num } from '@/i18n/locale'
import { cn } from '@/lib/cn'
import { exposeQA } from '@/lib/qa'
import { LiveTile, type LiveApi } from './LiveTile'
import { Odometer } from './Odometer'
import './parents.css'

/** One icon per card of `t.parents.cards`, in copy order. */
const ICONS: LucideIcon[] = [Feather, UsersRound, Puzzle, ShieldCheck, Languages, School]

/**
 * Two cards are "living": a scene of the film loops behind their words.
 * Card 2 (the same three characters everywhere) → scene 1, the classroom, where all three faces are seen.
 * Card 6 (classroom and home) → scene 12, the whole class watching the birds at sunset.
 * `focus` keeps the subject in frame: [phones (tall crop), wide tiles]. The sunset clip tilts up to the sky,
 * so on phones its crop sits where both the children (at the start) and the flock (to the end) pass through.
 */
const LIVING: Record<number, { scene: number; focus: [string, string] }> = {
  1: { scene: 0, focus: ['26% 50%', '72% 50%'] },
  5: { scene: 11, focus: ['58% 50%', '46% 50%'] },
}

/** Bento order: two blocks of three, each built around its film tile (7 columns) with two cards (5 columns) beside it. */
const LAYOUT: Array<{ card: number; cell: string }> = [
  { card: 1, cell: 'a-live' },
  { card: 0, cell: 'a-1' },
  { card: 2, cell: 'a-2' },
  { card: 3, cell: 'b-1' },
  { card: 4, cell: 'b-2' },
  { card: 5, cell: 'b-live' },
]

const two = (n: number) => (n < 10 ? num(0) : '') + num(n)

/** For parents and educators: an editorial bento with two living film tiles, then four big light numerals. */
export function Parents() {
  const stats = useRef<HTMLUListElement>(null)
  const seen = useInView(stats, '0px 0px -8% 0px')
  const [armed, setArmed] = useState(false)
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 700px)').matches)
  const tiles = useRef(new Map<number, LiveApi>())

  useEffect(() => {
    if (!prefersReducedNow()) setArmed(true)
    const mq = window.matchMedia('(min-width: 700px)')
    const sync = () => setWide(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const register = useCallback((scene: number, api: LiveApi | null) => {
    if (api) tiles.current.set(scene, api)
    else tiles.current.delete(scene)
  }, [])

  const rolled = armed ? seen : true
  useEffect(() => {
    exposeQA({
      parents: {
        state: () => ({
          cards: document.querySelectorAll('#parents [data-card]').length,
          tiles: [...tiles.current.entries()].map(([scene, api]) => ({ scene, armed: api.armed(), playing: api.playing() })),
          stats: rolled,
        }),
      },
    })
  }, [rolled])

  return (
    <section id="parents" className="pr sheet bg-paper text-ink" aria-label={t.parents.eyebrow}>
      <Container>
        <div className="pr-head">
          <SectionHead tone="light" eyebrow={t.parents.eyebrow} title={t.parents.title} />
          <Reveal delay={180} className="pr-head__side">
            <p className="t-lede">{t.parents.lede}</p>
          </Reveal>
        </div>

        <div className="pr-bento">
          {LAYOUT.map(({ card, cell }, i) => {
            const c = t.parents.cards[card]
            const Icon = ICONS[card]
            const live = LIVING[card]
            return (
              <Reveal key={card} className={cn('pr-cell', `pr-cell--${cell}`, live && 'pr-cell--live')} delay={(i % 3) * 90}>
                {live ? (
                  <article className="pr-tile" data-card={card}>
                    <LiveTile scene={live.scene} no={two(i + 1)} title={c.t} text={c.s} icon={Icon} focus={live.focus[wide ? 1 : 0]} register={register} />
                  </article>
                ) : (
                  <article className="pr-card" data-card={card}>
                    <span className="pr-card__icon">
                      <Icon size={21} strokeWidth={1.8} aria-hidden />
                    </span>
                    <span className="pr-card__no" aria-hidden>
                      {two(i + 1)}
                    </span>
                    <div className="pr-card__body">
                      <h3 className="pr-card__t">{c.t}</h3>
                      <p className="pr-card__s">{c.s}</p>
                    </div>
                  </article>
                )}
              </Reveal>
            )
          })}
        </div>

        <ul ref={stats} className={cn('pr-stats', armed && 'is-armed', armed && seen && 'is-in')}>
          {t.parents.stats.map((s, i) => (
            <li key={i} className="pr-stat" style={{ '--i': i } as CSSProperties}>
              <span className="pr-stat__n">
                <Odometer value={s.n} order={i} />
              </span>
              <span className="pr-stat__l">{s.l}</span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
