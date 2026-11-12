import { useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { BookOpen, Gamepad2, Play } from 'lucide-react'
import { prefersReducedNow } from '@/app/useMotionTier'
import { story } from '@/content/story'
import { t } from '@/i18n/copy'
import { dirSign, locale, num } from '@/i18n/locale'
import { asset } from '@/lib/asset'
import { cn } from '@/lib/cn'
import { useSiteStore } from '@/store/useSiteStore'

const W = t.landing.ways
const CARDS = [
  { img: 'app/doors/read.webp', icon: BookOpen },
  { img: 'app/doors/watch.webp', icon: Play },
  { img: 'app/doors/play.webp', icon: Gamepad2 },
]
/** Where a card rests when it is `i` places from the front of the deck. */
const pose = (i: number) => ({ xPercent: i * 9 * dirSign, yPercent: -i * 3.2, rotation: i * 5.5 * dirSign, scale: 1 - i * 0.07, autoAlpha: 1 })
/** Where the front card goes when its turn is over: up and away, toward the outer edge. */
const away = { xPercent: 118 * dirSign, yPercent: -34, rotation: 24 * dirSign, autoAlpha: 0 }

/**
 * What a story becomes here: read · watch · play, as one pinned sequence driven by the scroll.
 * Three cards lie fanned like a hand of cards; the page's travel deals them one after the other while the big
 * word on the reading side changes with them. With reduced motion the three simply stand side by side.
 */
export function Ways() {
  const root = useRef<HTMLElement>(null)
  const reduced = useSiteStore((s) => s.tier === 'reduced')
  const [active, setActive] = useState(0)

  useGSAP(
    () => {
      const el = root.current
      if (!el || reduced || prefersReducedNow()) return
      const q = gsap.utils.selector(el)
      const cards = gsap.utils.toArray<HTMLElement>(q('.lp-card'))
      const art = cards.map((c) => c.querySelector('img'))
      cards.forEach((c, i) => gsap.set(c, { ...pose(i), zIndex: 3 - i, transformOrigin: '50% 110%' }))
      gsap.set(art, { scale: 1.16 })
      const tl = gsap.timeline({
        defaults: { ease: 'power2.inOut', duration: 0.17 },
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.7,
          onUpdate: (self) => {
            const next = self.progress < 0.37 ? 0 : self.progress < 0.71 ? 1 : 2
            setActive((now) => (now === next ? now : next))
          },
        },
      })
      tl.to(q('.lp-ways__fill'), { scaleY: 1, ease: 'none', duration: 1 }, 0)
        .to(art[0], { scale: 1, ease: 'none', duration: 0.3 }, 0)
        .to(cards[0], away, 0.28)
        .to(cards[1], pose(0), 0.28)
        .to(cards[2], pose(1), 0.28)
        .to(art[1], { scale: 1, ease: 'none', duration: 0.34 }, 0.3)
        .to(cards[1], away, 0.62)
        .to(cards[2], pose(0), 0.62)
        .to(art[2], { scale: 1, ease: 'none', duration: 0.34 }, 0.64)
      // the section's entrance: the hand of cards rises as it comes into view
      gsap.from(q('.lp-deck'), { yPercent: 18, autoAlpha: 0, ease: 'none', scrollTrigger: { trigger: el, start: 'top 85%', end: 'top 15%', scrub: 0.5 } })
    },
    { scope: root, dependencies: [reduced], revertOnUpdate: true },
  )

  return (
    <section ref={root} id="ways" className={cn('lp-ways', reduced && 'is-still')} aria-label={W.title}>
      <div className="lp-ways__pin">
        <div className="lp-ways__copy">
          <p className="lp-kicker">
            <i aria-hidden />
            {W.kicker}
          </p>
          <h2 className="lp-ways__title">{W.title}</h2>
          <ol className="lp-words">
            {W.items.map((w, i) => (
              <li key={w.word} className={cn('lp-word', (reduced || active === i) && 'is-on')}>
                <span className="lp-word__n tnum" aria-hidden>
                  {num(0)}
                  {num(i + 1)}
                </span>
                <span className="lp-word__w">{w.word}</span>
                <span className="lp-word__line">
                  <span>{w.line}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="lp-ways__note">
            {W.note}: {story.title[locale]}
          </p>
        </div>
        <div className="lp-ways__stage">
          <span className="lp-ways__rail" aria-hidden>
            <i className="lp-ways__fill" />
          </span>
          <div className="lp-deck">
            {CARDS.map(({ img, icon: Icon }, i) => (
              <figure key={img} className="lp-card">
                <img src={asset(img)} alt="" width={560} height={840} loading="lazy" decoding="async" draggable={false} />
                <figcaption className="lp-card__tag lp-glass">
                  <Icon size={15} strokeWidth={2} aria-hidden />
                  {W.items[i].tag}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
