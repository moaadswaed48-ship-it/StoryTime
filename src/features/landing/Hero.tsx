import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ArrowRight, ArrowUpRight, BookOpen, Check, Gamepad2, Play } from 'lucide-react'
import { enterApp } from '@/app/router'
import { prefersReducedNow } from '@/app/useMotionTier'
import { story } from '@/content/story'
import { useOnScreen } from '@/design/ui'
import { t } from '@/i18n/copy'
import { dirSign, locale, num } from '@/i18n/locale'
import { asset } from '@/lib/asset'
import { cn } from '@/lib/cn'
import { useSiteStore } from '@/store/useSiteStore'
import { Butterfly } from './Butterfly'

const H = t.landing.hero
const WAYS = [BookOpen, Play, Gamepad2]

/** The three short facts that stand beside every call to action. */
export function Assure({ className }: { className?: string }) {
  return (
    <ul className={cn('lp-assure', className)}>
      {t.landing.assure.map((a) => (
        <li key={a}>
          <Check size={14} strokeWidth={2.6} aria-hidden />
          {a}
        </li>
      ))}
    </ul>
  )
}

/**
 * The first screen: a stack of old books on a green peak above the clouds. The service in one picture.
 * The headline stands in the open sky on the reading side (the picture is mirrored for Arabic).
 * Depth: the picture, the glass notes pinned to it and the butterflies are separate layers that answer the
 * pointer (or the tilt of a phone) by different amounts. Scrolling walks into the picture: it comes closer,
 * the words lift away and the cloud rises until the page is the sky.
 */
export function Hero() {
  const root = useRef<HTMLElement>(null)
  const tier = useSiteStore((s) => s.tier)
  const openFilm = useSiteStore((s) => s.openFilm)
  const reduced = tier === 'reduced'
  const onScreen = useOnScreen(root, '0px')
  const wander = useRef<gsap.core.Tween[]>([])

  useGSAP(
    () => {
      const el = root.current
      if (!el || reduced || prefersReducedNow()) return
      const q = gsap.utils.selector(el)

      // entrance: the picture settles, the words arrive in reading order, the notes and butterflies last
      const intro = gsap.timeline({ defaults: { ease: 'expo.out' } })
      intro
        .from(q('.lp-plate__in'), { scale: 1.14, duration: 2.6, ease: 'power3.out' }, 0)
        .from(q('.lp-in'), { y: 34, autoAlpha: 0, filter: 'blur(12px)', duration: 1.25, stagger: 0.11, clearProps: 'filter' }, 0.2)
        .from(q('.lp-note'), { y: 22, autoAlpha: 0, scale: 0.94, duration: 1.1, stagger: 0.14 }, 0.95)
        .from(q('.lp-ring__arc'), { strokeDashoffset: 100, duration: 1.8, ease: 'power2.inOut' }, 1.1)
        .from(q('.lp-bf'), { x: (i: number) => (i % 2 ? 260 : -260) * dirSign, y: 160, autoAlpha: 0, duration: 2.4, stagger: 0.25, ease: 'power2.out' }, 0.7)

      // life: each butterfly wanders around its own place, never the same path twice
      wander.current = gsap.utils.toArray<HTMLElement>(q('.lp-bf:not(.lp-bf--follow) .lp-bf__fly')).map((b, i) =>
        gsap.to(b, { x: 'random(-70, 70)', y: 'random(-46, 46)', rotation: 'random(-24, 24)', duration: 'random(2.6, 4.4)', ease: 'sine.inOut', repeat: -1, repeatRefresh: true, delay: i * 0.4 }),
      )

      // scroll: walk into the picture
      gsap
        .timeline({ scrollTrigger: { trigger: el, start: 'top top', end: 'bottom bottom', scrub: 0.5 }, defaults: { ease: 'none' } })
        .to(q('.lp-plate__zoom'), { scale: 1.26, duration: 1 }, 0)
        .to(q('.lp-hero__copy'), { yPercent: -26, autoAlpha: 0, duration: 0.5, ease: 'power1.in' }, 0)
        .to(q('.lp-notes, .lp-hero__foot'), { autoAlpha: 0, duration: 0.3 }, 0)
        .to(q('.lp-bfs'), { yPercent: -30, scale: 1.25, duration: 1 }, 0)
        .to(q('.lp-mist'), { '--m': 0, duration: 0.78, ease: 'power1.inOut' }, 0.22)

      // depth: far things move a little, near things more
      const layers = ([['.lp-plate__par', 16, 9], ['.lp-notes', 30, 16], ['.lp-bfs', 52, 28]] as const).map(([sel, ax, ay]) => {
        const node = q(sel)[0]
        return { ax, ay, x: gsap.quickTo(node, 'x', { duration: 1.1, ease: 'power3.out' }), y: gsap.quickTo(node, 'y', { duration: 1.1, ease: 'power3.out' }) }
      })
      const lean = (nx: number, ny: number) => layers.forEach((l) => (l.x(-nx * l.ax), l.y(-ny * l.ay)))
      const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
      const follower = q('.lp-bf--follow')[0] as HTMLElement | undefined
      const fx = follower && gsap.quickTo(follower, 'x', { duration: 2.2, ease: 'power2.out' })
      const fy = follower && gsap.quickTo(follower, 'y', { duration: 2.2, ease: 'power2.out' })
      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== 'mouse') return
        lean((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1)
        if (follower && fx && fy) {
          // the follower's home is the middle of the screen: it trails the pointer, a little above and beside it
          fx(e.clientX - window.innerWidth * 0.5 + 46 * dirSign)
          fy(e.clientY - window.innerHeight * 0.5 - 40)
        }
      }
      // a phone held in the hand: the picture leans with it (where the browser gives tilt without asking)
      const onTilt = (e: DeviceOrientationEvent) => {
        if (e.gamma == null || e.beta == null) return
        lean(gsap.utils.clamp(-1, 1, e.gamma / 24), gsap.utils.clamp(-1, 1, (e.beta - 45) / 28))
      }
      if (fine) el.addEventListener('pointermove', onMove)
      else window.addEventListener('deviceorientation', onTilt)
      return () => {
        el.removeEventListener('pointermove', onMove)
        window.removeEventListener('deviceorientation', onTilt)
        wander.current = []
      }
    },
    { scope: root, dependencies: [reduced], revertOnUpdate: true },
  )

  // nothing flies while the hero is off screen
  useEffect(() => {
    wander.current.forEach((w) => w.paused(!onScreen))
  }, [onScreen])

  return (
    <section ref={root} className={cn('lp-hero', reduced && 'is-still', !onScreen && 'is-off', tier === 'low' && 'is-low')} aria-label={`${H.titleA} ${H.titleB}`}>
      <div className="lp-hero__pin">
        <div className="lp-plate" aria-hidden>
          <div className="lp-plate__par">
            <div className="lp-plate__zoom">
              <div className="lp-plate__in">
                {/* one file for every screen: a phone shows a tall slice of it at three device pixels per point */}
                <picture>
                  <img className="lp-plate__img" src={asset('landing/hero.webp')} alt="" width={2560} height={1429} decoding="async" fetchPriority="high" draggable={false} />
                </picture>
              </div>
            </div>
          </div>
        </div>
        <div className="lp-wash" aria-hidden />

        <div className="lp-bfs" aria-hidden>
          <Butterfly size={40} beat={0.24} className="lp-bf--1" />
          <Butterfly size={30} beat={0.2} flip className="lp-bf--2" />
          <Butterfly size={52} beat={0.28} className="lp-bf--follow" />
        </div>

        <div className="lp-hero__copy">
          <p className="lp-kicker lp-in">
            <i aria-hidden />
            {H.kicker}
          </p>
          <h1 className="lp-h1">
            <span className="lp-h1__a lp-in">{H.titleA}</span>
            <span className="lp-h1__b lp-in">{H.titleB}</span>
          </h1>
          <p className="lp-sub lp-in">{H.sub}</p>
          <div className="lp-actions lp-in">
            <button type="button" className="lp-btn" data-enter="hero" onClick={() => enterApp()}>
              {H.enter}
              <span className="lp-btn__arrow" aria-hidden>
                <ArrowRight size={16} strokeWidth={2.4} className="flip-rtl" />
              </span>
            </button>
            <button type="button" className="lp-watch" data-act="watch" onClick={() => openFilm(0)}>
              <span className="lp-watch__disc" aria-hidden>
                <Play size={15} fill="currentColor" strokeWidth={0} />
              </span>
              <span className="lp-watch__txt">
                <b>{H.watch}</b>
                <small>{H.watchSub}</small>
              </span>
            </button>
          </div>
          {/* what a parent wants to know before pressing: three facts (the two sign-in doors are in the bar above) */}
          <Assure className="lp-hero__more lp-in" />
        </div>

        {/* glass notes pinned to the picture (wide screens): the first story, the three ways, the film */}
        <div className="lp-notes">
          <button type="button" className="lp-note lp-note--first lp-glass" onClick={() => enterApp('story')}>
            <span className="lp-note__icon" aria-hidden>
              <BookOpen size={17} strokeWidth={1.9} />
            </span>
            <span className="lp-note__txt">
              <small>{H.first}</small>
              <b>{story.title[locale]}</b>
            </span>
            <span className="lp-note__go" aria-hidden>
              <ArrowUpRight size={15} strokeWidth={2.2} className="flip-rtl" />
            </span>
          </button>
          <div className="lp-note lp-ring">
            <svg viewBox="0 0 120 120" aria-hidden>
              <circle className="lp-ring__arc" cx="60" cy="60" r="56" pathLength="100" />
            </svg>
            <b className="tnum">{num(3)}</b>
            <small>{H.waysCount}</small>
          </div>
          <button type="button" className="lp-note lp-note--film lp-glass-ink" onClick={() => openFilm(0)}>
            <span className="lp-note__thumb" aria-hidden>
              <img src={asset('story/k08-sm.webp')} alt="" loading="lazy" decoding="async" />
              <i>
                <Play size={12} fill="currentColor" strokeWidth={0} />
              </i>
            </span>
            <span className="lp-note__txt">
              <b>{H.film}</b>
              <small>{H.filmSub}</small>
            </span>
          </button>
        </div>

        <div className="lp-hero__foot">
          <ul className="lp-trio lp-glass lp-in">
            {t.landing.ways.items.map((w, i) => {
              const Icon = WAYS[i]
              return (
                <li key={w.word}>
                  <Icon size={16} strokeWidth={1.9} aria-hidden />
                  {w.word}
                </li>
              )
            })}
          </ul>
          <p className="lp-scroll lp-in">
            <i aria-hidden />
            {H.scroll}
          </p>
        </div>

        <div className="lp-mist" aria-hidden />
      </div>
    </section>
  )
}
