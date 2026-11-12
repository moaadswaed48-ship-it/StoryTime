import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { Info } from 'lucide-react'
import { enterApp } from '@/app/router'
import { prefersReducedNow } from '@/app/useMotionTier'
import { Leaves, type LeavesHandle } from '@/design/Leaves'
import { Container, Reveal, SectionHead, useInView } from '@/design/ui'
import { t } from '@/i18n/copy'
import { cn } from '@/lib/cn'
import { exposeQA } from '@/lib/qa'
import { useSiteStore } from '@/store/useSiteStore'
import { PlanCard } from './PlanCard'
import { BillingToggle } from './Toggle'
import './pricing.css'

gsap.registerPlugin(ScrollTrigger)

/** The middle plan is the highlighted one. */
const FEATURED = 1
const tiers = t.pricing.tiers

/**
 * Plans: a monthly / yearly switch and three cards, the middle one lifted on paper.
 * Every amount comes from `t.pricing` and is tagged as a sample; choosing a plan opens the demo sign-in.
 * Desktop: the card borders light up under the pointer. Phones: stacked, the highlighted plan first.
 */
export function Pricing() {
  const [yearly, setYearly] = useState(false)
  const [armed, setArmed] = useState(false)
  const [stacked, setStacked] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 899px)').matches)
  const [fx, setFx] = useState(0)
  /** Counts the light sweeps across the highlighted card: once when the cards land, again on every switch. */
  const [sweep, setSweep] = useState(0)
  const grid = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const ghost = useRef<HTMLDivElement>(null)
  const fxBox = useRef<HTMLDivElement>(null)
  const leaves = useRef<LeavesHandle>(null)
  const seen = useInView(grid, '0px 0px -8% 0px')
  const reduced = useSiteStore((s) => s.tier === 'reduced')
  const setLoginOpen = useSiteStore((s) => s.setLoginOpen)
  const openCheckout = useSiteStore((st) => st.openCheckout)

  useEffect(() => {
    if (!prefersReducedNow()) setArmed(true)
    const mq = window.matchMedia('(max-width: 899px)')
    const sync = () => setStacked(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const current = useRef(false)
  const choose = useCallback(
    (next: boolean) => {
      if (next === current.current) return
      current.current = next
      setYearly(next)
      if (!reduced) setSweep((n) => n + 1)
      if (next && !reduced) setFx((n) => n + 1)
    },
    [reduced],
  )

  // A few leaves fly off the "save" sticker when yearly is chosen. The canvas exists only while they fall.
  useEffect(() => {
    if (!fx) return
    // one beat later, once the canvas has settled in (React's dev double-mount would drop leaves thrown at once)
    const fire = window.setTimeout(() => {
      const canvasBox = fxBox.current?.querySelector('.pl-switch__fx')
      const chip = fxBox.current?.querySelector('.pl-toggle__save')
      if (!canvasBox || !chip) return
      const a = canvasBox.getBoundingClientRect()
      const b = chip.getBoundingClientRect()
      leaves.current?.burst(b.left + b.width / 2 - a.left, b.top + b.height / 2 - a.top, 9)
    }, 60)
    const end = window.setTimeout(() => setFx(0), 2800)
    return () => {
      window.clearTimeout(fire)
      window.clearTimeout(end)
    }
  }, [fx])

  // The first sweep runs once the cards have landed.
  useEffect(() => {
    if (seen && armed && !reduced) setSweep((n) => n || 1)
  }, [seen, armed, reduced])

  // Light on the card borders.
  // Mouse: a rim and a soft pool follow the pointer (eased in a rAF loop that sleeps when settled), and keep
  // tracking while the page scrolls under a still pointer. Touch: the same light glides across each card as it
  // scrolls through the screen, so phones get the moment too. Off with reduced motion.
  useEffect(() => {
    const el = grid.current
    if (!el || reduced) return
    const mouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const cards = () => el.querySelectorAll<HTMLElement>('.pl-card')
    const lenis = useSiteStore.getState().lenis
    let tx = 0
    let ty = 0
    let x = 0
    let y = 0
    let raf = 0
    let fresh = true
    let inside = false

    const paint = () => {
      raf = 0
      x += (tx - x) * 0.2
      y += (ty - y) * 0.2
      cards().forEach((card) => {
        const r = card.getBoundingClientRect()
        card.style.setProperty('--mx', `${(x - r.left).toFixed(1)}px`)
        card.style.setProperty('--my', `${(y - r.top).toFixed(1)}px`)
      })
      if (Math.abs(tx - x) > 0.4 || Math.abs(ty - y) > 0.4) raf = requestAnimationFrame(paint)
    }
    // Touch: position from scroll. p runs 0 → 1 while a card crosses the screen; the light enters at the
    // top inline-start corner and leaves at the bottom inline-end one.
    const glide = () => {
      raf = 0
      const vh = window.innerHeight
      const rtl = document.documentElement.dir === 'rtl'
      let any = false
      cards().forEach((card) => {
        const r = card.getBoundingClientRect()
        if (r.bottom < 0 || r.top > vh) return
        any = true
        const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)))
        const px = 0.1 + 0.8 * p
        card.style.setProperty('--mx', `${((rtl ? 1 - px : px) * r.width).toFixed(1)}px`)
        card.style.setProperty('--my', `${((p * 1.3 - 0.15) * r.height).toFixed(1)}px`)
      })
      if (any) el.setAttribute('data-glow', '')
      else el.removeAttribute('data-glow')
    }
    const queue = (fn: () => void) => {
      if (!raf) raf = requestAnimationFrame(fn)
    }

    if (!mouse) {
      const onScroll = () => queue(glide)
      const off = lenis ? lenis.on('scroll', onScroll) : undefined
      window.addEventListener('scroll', onScroll, { passive: true })
      window.addEventListener('resize', onScroll)
      glide()
      return () => {
        off?.()
        window.removeEventListener('scroll', onScroll)
        window.removeEventListener('resize', onScroll)
        cancelAnimationFrame(raf)
        el.removeAttribute('data-glow')
      }
    }

    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      tx = e.clientX
      ty = e.clientY
      if (fresh) {
        x = tx
        y = ty
        fresh = false
      }
      inside = true
      el.setAttribute('data-glow', '')
      queue(paint)
    }
    const leave = () => {
      inside = false
      el.removeAttribute('data-glow')
      fresh = true
    }
    // the page moved under a still pointer: the cards moved, so repaint against the last pointer position
    const onScroll = () => {
      if (inside) queue(paint)
    }
    const off = lenis ? lenis.on('scroll', onScroll) : undefined
    window.addEventListener('scroll', onScroll, { passive: true })
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => {
      off?.()
      window.removeEventListener('scroll', onScroll)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
      cancelAnimationFrame(raf)
      el.removeAttribute('data-glow')
    }
  }, [reduced])

  // Depth: the giant word behind the cards drifts slower than the page.
  useGSAP(
    () => {
      if (reduced || !ghost.current || !stage.current) return
      gsap.fromTo(
        ghost.current,
        { yPercent: 12 },
        { yPercent: -12, ease: 'none', scrollTrigger: { trigger: stage.current, start: 'top bottom', end: 'bottom top', scrub: true } },
      )
    },
    { dependencies: [reduced], scope: stage, revertOnUpdate: true },
  )

  useEffect(() => {
    exposeQA({
      pricing: {
        state: () => {
          const root = document.getElementById('pricing')
          return {
            yearly,
            price: root?.querySelector('[data-price]')?.textContent ?? '',
            per: root?.querySelector('[data-per]')?.getAttribute('data-per') ?? '',
            samples: root?.querySelectorAll('[data-sample]').length ?? 0,
            numbers: root?.querySelectorAll('[data-price]').length ?? 0,
            order: Array.from(root?.querySelectorAll('[data-tier]') ?? []).map((n) => n.getAttribute('data-tier')),
            glow: !!grid.current?.hasAttribute('data-glow'),
            sweeps: sweep,
          }
        },
        setYearly: (v: boolean) => choose(!!v),
      },
    })
  }, [yearly, choose, sweep])

  const order = stacked ? [FEATURED, ...tiers.map((_, i) => i).filter((i) => i !== FEATURED)] : tiers.map((_, i) => i)

  return (
    <section id="pricing" className="pl sheet bg-night text-paper" aria-label={t.pricing.eyebrow}>
      <div className="pl-light grain" aria-hidden />
      <Container className="relative">
        <SectionHead align="center" eyebrow={t.pricing.eyebrow} title={t.pricing.title} lede={t.pricing.lede} />

        <Reveal delay={220} className="pl-switch">
          <div ref={fxBox} className="pl-switch__in">
            {fx > 0 && (
              <div className="pl-switch__fx" aria-hidden>
                <Leaves ref={leaves} density={0} />
              </div>
            )}
            <BillingToggle yearly={yearly} onChange={choose} />
          </div>
        </Reveal>

        <div ref={stage} className="pl-stage">
          {/* Depth: the section's own word, huge and faint, seen through the glass cards. */}
          <div ref={ghost} className="pl-ghost" aria-hidden>
            <span>{t.pricing.eyebrow}</span>
          </div>
          <div ref={grid} className={cn('pl-grid', armed && 'is-armed', armed && seen && 'is-in')}>
            {order.map((i, pos) => (
              <PlanCard key={tiers[i].id} tier={tiers[i]} featured={i === FEATURED} yearly={yearly} order={pos} sweep={i === FEATURED ? sweep : 0} onChoose={() => (tiers[i].id === 'family' ? openCheckout('family', yearly) : tiers[i].id === 'start' ? enterApp() : setLoginOpen(true))} />
            ))}
          </div>
        </div>

        <Reveal delay={120}>
          <p className="pl-foot">
            <Info size={15} strokeWidth={2} aria-hidden />
            <span>{t.pricing.footnote}</span>
          </p>
        </Reveal>
      </Container>
    </section>
  )
}
