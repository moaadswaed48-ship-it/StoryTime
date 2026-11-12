import { useCallback, useEffect, useRef, useState } from 'react'
import { Info } from 'lucide-react'
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
  const grid = useRef<HTMLDivElement>(null)
  const fxBox = useRef<HTMLDivElement>(null)
  const leaves = useRef<LeavesHandle>(null)
  const seen = useInView(grid, '0px 0px -8% 0px')
  const reduced = useSiteStore((s) => s.tier === 'reduced')
  const setLoginOpen = useSiteStore((s) => s.setLoginOpen)

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
      if (next && !reduced) setFx((n) => n + 1)
    },
    [reduced],
  )

  // A few leaves fly off the "save" sticker when yearly is chosen. The canvas exists only while they fall.
  useEffect(() => {
    if (!fx) return
    // one beat later, once the canvas has settled in (React's dev double-mount would drop leaves thrown at once)
    const fire = window.setTimeout(() => {
      const box = fxBox.current
      const chip = box?.querySelector('.pl-toggle__save')
      if (!box || !chip) return
      const a = box.getBoundingClientRect()
      const b = chip.getBoundingClientRect()
      leaves.current?.burst(b.left + b.width / 2 - a.left + 150, b.top + b.height / 2 - a.top + 110, 9)
    }, 60)
    const end = window.setTimeout(() => setFx(0), 2800)
    return () => {
      window.clearTimeout(fire)
      window.clearTimeout(end)
    }
  }, [fx])

  // Border glow that follows the pointer (mouse only). The position is eased in a rAF loop that sleeps when it settles.
  useEffect(() => {
    const el = grid.current
    if (!el || reduced || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    let tx = 0
    let ty = 0
    let x = 0
    let y = 0
    let raf = 0
    let fresh = true
    const paint = () => {
      raf = 0
      x += (tx - x) * 0.2
      y += (ty - y) * 0.2
      el.querySelectorAll<HTMLElement>('.pl-card').forEach((card) => {
        const r = card.getBoundingClientRect()
        card.style.setProperty('--mx', `${(x - r.left).toFixed(1)}px`)
        card.style.setProperty('--my', `${(y - r.top).toFixed(1)}px`)
      })
      if (Math.abs(tx - x) > 0.4 || Math.abs(ty - y) > 0.4) raf = requestAnimationFrame(paint)
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
      el.setAttribute('data-glow', '')
      if (!raf) raf = requestAnimationFrame(paint)
    }
    const leave = () => {
      el.removeAttribute('data-glow')
      fresh = true
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
      cancelAnimationFrame(raf)
      el.removeAttribute('data-glow')
    }
  }, [reduced])

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
          }
        },
        setYearly: (v: boolean) => choose(!!v),
      },
    })
  }, [yearly, choose])

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

        <div ref={grid} className={cn('pl-grid', armed && 'is-armed', armed && seen && 'is-in')}>
          {order.map((i, pos) => (
            <PlanCard key={tiers[i].id} tier={tiers[i]} featured={i === FEATURED} yearly={yearly} order={pos} onChoose={() => setLoginOpen(true)} />
          ))}
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
