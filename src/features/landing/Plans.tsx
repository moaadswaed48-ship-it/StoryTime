import { useEffect, useRef, useState } from 'react'
import { Info, ShieldCheck } from 'lucide-react'
import { enterApp } from '@/app/router'
import { prefersReducedNow } from '@/app/useMotionTier'
import { BlurWords, Eyebrow, Reveal, useInView } from '@/design/ui'
import { PlanCard } from '@/features/pricing/PlanCard'
import { BillingToggle } from '@/features/pricing/Toggle'
import '@/features/pricing/pricing.css'
import { t } from '@/i18n/copy'
import { cn } from '@/lib/cn'
import { useSiteStore } from '@/store/useSiteStore'

const tiers = t.pricing.tiers
/** The middle plan is the highlighted one. */
const FEATURED = 1

/**
 * The plans, back on the front door: the same three cards and the same monthly / yearly switch as the grown-ups'
 * tab in the app (`PlanCard`, `BillingToggle`), on the landing page's deep green. Every word and every number is
 * `t.pricing`: the amounts are samples and say so three times (the line under the heading, the tag beside each
 * number, the note under the cards). Free plan → into the app; family → the demo checkout; schools → the demo sign-in.
 */
export function Plans() {
  const [yearly, setYearly] = useState(false)
  const [armed, setArmed] = useState(false)
  const [stacked, setStacked] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 899px)').matches)
  const grid = useRef<HTMLDivElement>(null)
  const seen = useInView(grid, '0px 0px -8% 0px')

  useEffect(() => {
    if (!prefersReducedNow()) setArmed(true)
    const mq = window.matchMedia('(max-width: 899px)')
    const sync = () => setStacked(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const choose = (id: string) => {
    const site = useSiteStore.getState()
    if (id === 'family') site.openCheckout('family', yearly)
    else if (id === 'start') enterApp()
    else site.setLoginOpen(true)
  }
  // phones: the highlighted plan first, then the free one, then schools
  const order = stacked ? [FEATURED, ...tiers.map((_, i) => i).filter((i) => i !== FEATURED)] : tiers.map((_, i) => i)

  return (
    <section id="plans" className="lp-plans pl" aria-label={t.pricing.eyebrow}>
      <div className="lp-plans__in">
        <header className="lp-plans__head">
          <Reveal>
            <Eyebrow>{t.pricing.eyebrow}</Eyebrow>
          </Reveal>
          <BlurWords as="h2" text={t.pricing.title} className="lp-plans__title" delay={80} />
          <Reveal delay={200}>
            <p className="lp-plans__lede">
              <Info size={16} strokeWidth={2} aria-hidden />
              <span>{t.pricing.lede}</span>
            </p>
          </Reveal>
        </header>

        <Reveal delay={260} className="pl-switch">
          <div className="pl-switch__in">
            <BillingToggle yearly={yearly} onChange={setYearly} />
          </div>
        </Reveal>

        <div ref={grid} className={cn('pl-grid', armed && 'is-armed', armed && seen && 'is-in')}>
          {order.map((i, pos) => (
            <PlanCard key={tiers[i].id} tier={tiers[i]} featured={i === FEATURED} yearly={yearly} order={pos} onChoose={() => choose(tiers[i].id)} />
          ))}
        </div>

        <Reveal delay={120} className="lp-plans__foot">
          <p className="lp-plans__safe">
            <ShieldCheck size={16} strokeWidth={2} aria-hidden />
            {t.landing.plans.safe}
          </p>
          <p className="pl-foot">
            <Info size={15} strokeWidth={2} aria-hidden />
            <span>{t.pricing.footnote}</span>
          </p>
        </Reveal>
      </div>
    </section>
  )
}
