import { useState, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { getApi } from '@/data'
import { codeOf, type ErrorCode } from '@/data/errors'
import { activeProvider } from '@/data/payments/test-provider'
import { passDates } from '@/data/rules'
import { TERMS_VERSION } from '@/data/terms'
import { isAgeGroup, isPassMonths } from '@/data/types'
import { useAccess } from '@/features/access/useAccess'
import { errorText } from '@/features/account/messages'
import { ParentGate } from '@/features/account/ParentGate'
import { usePrices } from '@/features/commerce/usePrices'
import { fmt, formatDate, formatShekels } from '@/i18n/format'
import { useLang } from '@/i18n/use-dict'
import { privateMeta } from '@/seo/meta'
import { localPath } from '@/seo/paths'
import { Button, ButtonLink, Checkbox, Notice, PlaceholderTag, Spinner, TextLink } from '@/ui/controls'
import { PageTitle } from '@/ui/Shell'

export const meta = () => privateMeta('StoryTime')

/**
 * The summary before paying (legal checklist items 1-4): pass, group, length, start and end, total with VAT in
 * shekels, "does not renew", the right to cancel, the seller, and the terms tick box. Behind the parent gate.
 * Paying sends the browser to the provider's page; the pass appears only after the provider's server callback.
 */
export default function Checkout() {
  return (
    <ParentGate>
      <Summary />
    </ParentGate>
  )
}

function Summary() {
  const { lang, dict } = useLang()
  const t = dict.commerce.checkout
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const group = params.get('group')
  const months = Number(params.get('months'))
  const { access, error: accessError, reload } = useAccess()
  const { prices, error: pricesError, reload: reloadPrices } = usePrices()
  const [terms, setTerms] = useState(false)
  const [termsError, setTermsError] = useState<string | null>(null)
  const [error, setError] = useState<ErrorCode | null>(null)
  const [busy, setBusy] = useState(false)
  // The order was refused because the price changed while this summary was open (review 26 Nov, finding 7).
  const [priceChanged, setPriceChanged] = useState(false)

  if (!isAgeGroup(group) || !isPassMonths(months)) {
    return <Notice tone="error" action={<ButtonLink to={localPath(lang, 'app/plans')}>{dict.commerce.access.seePasses}</ButtonLink>}>{dict.account.errors.notFound}</Notice>
  }
  if (accessError) return <Notice tone="error" action={<Button onClick={reload}>{dict.account.errors.retry}</Button>}>{errorText(dict, accessError)}</Notice>
  if (pricesError) return <Notice tone="error" action={<Button onClick={reloadPrices}>{dict.account.errors.retry}</Button>}>{errorText(dict, pricesError)}</Notice>
  if (!access || !prices) return <Spinner label={dict.account.states.loading} />

  const { startsAt, endsAt } = passDates(access.passes, group, months, access.now)
  const queued = new Date(startsAt).getTime() > new Date(access.now).getTime() + 1000
  // The price create_order charges (review finding R8), not the static list of the public page.
  const price = prices.find((p) => p.ageGroup === group && p.months === months)?.priceAgorot ?? null
  const total = formatShekels(price, lang)

  const pay = async () => {
    if (!terms) return setTermsError(dict.account.errors.mustAccept)
    setTermsError(null)
    setError(null)
    setBusy(true)
    try {
      // The price on this screen goes with the order: the server refuses it if the price is no longer the same.
      const order = await (await getApi()).createOrder({ ageGroup: group, months, provider: activeProvider.id, termsVersion: TERMS_VERSION, expectedAgorot: price })
      const back = `${localPath(lang, 'app/checkout/done')}?order=${encodeURIComponent(order.id)}`
      navigate(activeProvider.checkoutUrl(order, { lang, returnPath: back }))
    } catch (e) {
      const code = codeOf(e)
      setBusy(false)
      if (code !== 'price_changed') return setError(code)
      // Show the new price at once (the summary above updates with it); nothing was charged.
      setPriceChanged(true)
      await reloadPrices()
    }
  }

  const rows: [string, ReactNode][] = [
    [t.passLabel, dict.commerce.months[months]],
    [t.groupLabel, dict.commerce.groups[group]],
    [t.startsLabel, formatDate(startsAt, lang)],
    [t.endsLabel, formatDate(endsAt, lang)],
    [t.totalLabel, total ? <bdi>{total}</bdi> : <span className="flex flex-wrap items-center gap-2">{dict.commerce.plans.priceNotSet} <PlaceholderTag>{dict.commerce.plans.placeholderBadge}</PlaceholderTag></span>],
  ]
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <PageTitle title={t.title} />
      {activeProvider.isTest && <Notice tone="warning">{t.testBadge}</Notice>}
      <dl className="flex flex-col divide-y divide-line rounded-control border border-line bg-surface" data-testid="checkout-summary">
        {rows.map(([k, v]) => (
          <div key={k} className="flex flex-wrap justify-between gap-x-4 gap-y-1 p-4">
            <dt className="text-ink-muted">{k}</dt>
            <dd className="font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="font-medium">{dict.commerce.plans.paidOnce}</p>
      {queued && <Notice tone="info">{t.queuedNote}</Notice>}
      <ul className="flex list-disc flex-col gap-1 ps-6 text-sm text-ink-muted">
        <li>{dict.commerce.plans.factCancel}</li>
        <li>{dict.commerce.plans.israelOnly}</li>
        <li>{dict.commerce.plans.sellerTitle}: <PlaceholderTag>{dict.commerce.plans.placeholderBadge}</PlaceholderTag> {dict.commerce.plans.sellerPlaceholder}</li>
      </ul>
      <TextLink to={localPath(lang, 'legal/refunds')} target="_blank" className="self-start">{t.rightsLink}</TextLink>
      <Checkbox label={t.termsCheck} checked={terms} onChange={(e) => { setTerms(e.target.checked); setTermsError(null) }} error={termsError}>
        <p className="ps-9 text-sm"><TextLink to={localPath(lang, 'legal/terms')} target="_blank">{dict.account.auth.readTerms}</TextLink></p>
      </Checkbox>
      {priceChanged && (
        <Notice tone="warning" title={t.priceChangedTitle}>
          {/* A removed price has no total to show: say that the pass cannot be bought now (recheck 27 Nov, N4). */}
          <p data-testid="price-changed">{total
            ? fmt(t.priceChangedLead, { /* first-strong isolate: an amount stays whole inside a right-to-left sentence */ price: `\u2068${total}\u2069` })
            : t.priceRemovedLead}</p>
        </Notice>
      )}
      {error && <Notice tone="error">{errorText(dict, error)}</Notice>}
      <Button onClick={() => { setPriceChanged(false); void pay() }} busy={busy} wide>{t.pay}</Button>
    </div>
  )
}
