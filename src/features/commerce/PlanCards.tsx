import { useState } from 'react'
import { useSession } from '@/features/account/session'
import { PRICES } from '@/data/prices'
import { AGE_GROUPS, PASS_MONTHS, type AgeGroup, type PassMonths, type Price } from '@/data/types'
import { fmt, formatShekels } from '@/i18n/format'
import { useLang } from '@/i18n/use-dict'
import { localPath } from '@/seo/paths'
import { ButtonLink, ChoiceGroup, PlaceholderTag, TextLink } from '@/ui/controls'

/** Where "Choose" leads: checkout (behind the parent gate) when signed in; otherwise sign-up first. */
export function checkoutPath(lang: Parameters<typeof localPath>[0], group: AgeGroup, months: PassMonths) {
  return `${localPath(lang, 'app/checkout')}?group=${group}&months=${months}`
}

/**
 * The three passes (1, 3, 12 months) for the chosen age group. Prices are placeholders until the owner sets them;
 * a card says so instead of showing a number (CLAUDE.md rule 4). No "best value" mark until real prices exist.
 */
export function PlanCards({ initialGroup = '4-5', prices = PRICES }: { initialGroup?: AgeGroup; prices?: readonly Price[] }) {
  const { lang, dict } = useLang()
  const t = dict.commerce
  const session = useSession()
  const [group, setGroup] = useState<AgeGroup>(initialGroup)

  return (
    <div className="flex flex-col gap-6">
      <ChoiceGroup
        legend={t.plans.groupLegend}
        name="age-group"
        value={group}
        onChange={setGroup}
        columns={3}
        options={AGE_GROUPS.map((g) => ({ value: g, label: t.groups[g], hint: t.groupHints[g] }))}
      />
      <ul className="grid gap-4 md:grid-cols-3" aria-live="polite">
        {PASS_MONTHS.map((months) => {
          const price = prices.find((p) => p.ageGroup === group && p.months === months)?.priceAgorot ?? null
          const total = formatShekels(price, lang)
          const perMonth = price === null ? null : formatShekels(Math.round(price / months), lang)
          const to = checkoutPath(lang, group, months)
          // Signed out: create an account first. While the session is still loading, go to checkout: the app asks to sign in if needed.
          const href = session.status === 'signed-out' ? `${localPath(lang, 'sign-up')}?next=${encodeURIComponent(to)}` : to
          return (
            <li key={months} className="flex flex-col gap-4 rounded-control border border-line bg-surface p-5" data-testid={`plan-${months}`}>
              <h3 className="text-xl font-semibold">{t.months[months]}</h3>
              <div className="flex flex-col gap-1">
                {total ? (
                  <p className="text-2xl font-semibold"><bdi>{total}</bdi></p>
                ) : (
                  <p className="flex flex-wrap items-center gap-2 text-lg font-semibold">
                    {t.plans.priceNotSet} <PlaceholderTag>{t.plans.placeholderBadge}</PlaceholderTag>
                  </p>
                )}
                <p className="text-sm text-ink-muted">{t.plans.vatIncluded}</p>
                {months > 1 && (
                  <p className="text-sm text-ink-muted">
                    {fmt(t.plans.perMonth, { price: perMonth ?? '—' })} · {fmt(t.plans.total, { price: total ?? '—' })}
                  </p>
                )}
              </div>
              <p className="font-medium">{t.plans.paidOnce}</p>
              <ButtonLink to={href} variant="secondary" wide className="mt-auto">
                {fmt(t.plans.choose, { length: t.months[months] })}
              </ButtonLink>
            </li>
          )
        })}
      </ul>
      <p className="text-ink-muted">{t.plans.allFeatures}</p>
      {session.status === 'signed-out' && <p className="sr-only">{t.checkout.signInFirst}</p>}
    </div>
  )
}

/** The facts the consumer law asks for before a sale (legal checklist items 1-6), plus the Israel-only line. */
export function PlanFacts() {
  const { lang, dict } = useLang()
  const t = dict.commerce.plans
  return (
    <section aria-labelledby="facts" className="flex flex-col gap-3 rounded-control border border-line bg-surface p-5">
      <h2 id="facts" className="text-xl font-semibold">{t.factsTitle}</h2>
      <ul className="flex list-disc flex-col gap-2 ps-6">
        {[t.factInstant, t.factEnds, t.factTwoGroups, t.factQueue, t.factCancel, t.factValidity].map((f) => <li key={f}>{f}</li>)}
      </ul>
      <p className="font-medium">{t.israelOnly}</p>
      <p>
        <TextLink to={localPath(lang, 'cancel-purchase')} className="font-medium">{t.cancelLink}</TextLink>
      </p>
      <div className="flex flex-col gap-1 border-t border-line pt-3">
        <h3 className="font-semibold">{t.sellerTitle}</h3>
        <p className="flex flex-wrap items-center gap-2 text-ink-muted"><PlaceholderTag>{t.placeholderBadge}</PlaceholderTag> {t.sellerPlaceholder}</p>
      </div>
    </section>
  )
}

