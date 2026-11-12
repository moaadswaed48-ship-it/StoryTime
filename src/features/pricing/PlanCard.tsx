import type { CSSProperties } from 'react'
import { ArrowUpRight, Check, Leaf } from 'lucide-react'
import { Pill } from '@/design/ui'
import { t } from '@/i18n/copy'
import { num } from '@/i18n/locale'
import { cn } from '@/lib/cn'
import { useCount } from './useCount'

export type Tier = (typeof t.pricing.tiers)[number]

/**
 * One plan. The highlighted one is a paper card with a tab; the others are dark glass.
 * A price is shown only for a real amount (> 0) and always carries the "sample" tag;
 * 0 and −1 show the plan's own words instead (`priceLabel`). Nothing here invents a number.
 */
export function PlanCard({ tier, featured, yearly, order, sweep = 0, tone = 'night', onChoose }: { tier: Tier; featured: boolean; yearly: boolean; order: number; sweep?: number; /** `paper`: the quiet cards are white instead of dark glass (the grown-ups' area in the app). */ tone?: 'night' | 'paper'; onChoose: () => void }) {
  const amount = yearly ? tier.yearly : tier.monthly
  const priced = amount > 0
  const shown = useCount(priced ? amount : 0)

  return (
    <article className={cn('pl-card', featured ? 'pl-card--featured' : tone === 'paper' ? 'pl-card--quiet' : 'glass-ink')} data-tier={tier.id} data-featured={featured ? '' : undefined} style={{ '--o': order } as CSSProperties}>
      <span className="pl-card__spot" aria-hidden />
      <span className="pl-card__ring" aria-hidden />
      {featured && (
        <span className="pl-card__clip" aria-hidden>
          {sweep > 0 && <span key={`s${sweep}`} className="pl-card__sheen" data-first={sweep === 1 ? '' : undefined} />}
        </span>
      )}
      {featured && sweep > 0 && (
        <span key={`r${sweep}`} className="pl-card__sweep" data-first={sweep === 1 ? '' : undefined} aria-hidden>
          <i />
        </span>
      )}
      {featured && (
        <span className="pl-tab">
          <Leaf size={13} strokeWidth={2.4} aria-hidden />
          {t.pricing.popular}
        </span>
      )}

      <header className="pl-card__head">
        <h3 className="pl-name">{tier.name}</h3>
        <p className="pl-desc">{tier.desc}</p>
      </header>

      <div className="pl-price">
        {priced ? (
          <>
            <span className="pl-price__amount">
              <span className="pl-price__cur">{t.pricing.currency}</span>
              <span key={yearly ? 'y' : 'm'} className="pl-price__num" data-price>
                {num(shown)}
              </span>
            </span>
            <span className="pl-price__meta">
              <span className="pl-sample" data-sample>
                <i aria-hidden />
                {t.pricing.sample}
              </span>
              <span className="pl-per" data-per={yearly ? 'year' : 'month'}>
                <span aria-hidden={yearly}>{t.pricing.perMonth}</span>
                <span aria-hidden={!yearly}>{t.pricing.perYear}</span>
              </span>
            </span>
          </>
        ) : (
          <p className={cn('pl-price__label', tier.priceLabel.length > 9 && 'is-long')}>{tier.priceLabel}</p>
        )}
      </div>

      <ul className="pl-feats">
        {tier.features.map((f, k) => (
          <li key={k} style={{ '--k': k } as CSSProperties}>
            <span className="pl-check" aria-hidden>
              <Check size={12} strokeWidth={3.2} />
            </span>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <Pill variant={featured ? 'ink' : tone === 'paper' ? 'outline' : 'glass'} size="lg" className="pl-cta" onClick={onChoose} data-cta={tier.id}>
        <span>{tier.cta}</span>
        <span className="pl-cta__chip" aria-hidden>
          <span className="pl-cta__arrow">
            <ArrowUpRight size={17} strokeWidth={2.2} className="flip-rtl" />
          </span>
        </span>
      </Pill>
    </article>
  )
}
