import { useCallback, useEffect, useState } from 'react'
import { ownerError, useOwner } from '@/features/owner/context'
import { agorotToInput, parseShekels, priceProblem } from '@/features/owner/data/money'
import { AGE_GROUPS, PASS_MONTHS, type AgeGroup, type PassMonths, type Price } from '@/data/types'
import { fmt, formatShekels } from '@/i18n/format'
import { useLang } from '@/i18n/use-dict'
import { Button, Notice, PlaceholderTag, Section, Spinner, TextField } from '@/ui/controls'
import { PageTitle } from '@/ui/Shell'

/**
 * Pass prices (owner's area, part 2): one price per age group and length, in shekels with VAT. No number is ever
 * filled in for the owner (CLAUDE.md rule 4): a field starts empty until she sets a price, and until then the plans
 * page says "Price not set yet" and create_order refuses every real payment provider for that pass.
 */
export default function OwnerPrices() {
  const { dict } = useLang()
  const { od, api } = useOwner()
  const t = od.prices
  const [prices, setPrices] = useState<Price[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setError(null)
    api.listPrices().then(setPrices, (e) => setError(ownerError(od, e)))
  }, [api, od])
  useEffect(load, [load])

  return (
    <div className="flex flex-col gap-6" data-testid="owner-prices">
      <PageTitle title={t.title} lead={t.lead} />
      <Notice tone="info"><p>{t.notSetRule}</p></Notice>
      {error && <Notice tone="error" title={error} action={<Button variant="secondary" onClick={load}>{od.errors.retry}</Button>} />}
      {!prices && !error && <Spinner label={dict.account.states.loading} />}
      {prices && (
        <div className="grid gap-6 xl:grid-cols-3">
          {AGE_GROUPS.map((g) => (
            <Section key={g} title={dict.commerce.groups[g]}>
              <ul className="flex flex-col divide-y divide-line">
                {PASS_MONTHS.map((m) => (
                  <PriceRow key={m} group={g} months={m} current={prices.find((p) => p.ageGroup === g && p.months === m)?.priceAgorot ?? null} onSaved={setPrices} />
                ))}
              </ul>
            </Section>
          ))}
        </div>
      )}
    </div>
  )
}

function PriceRow({ group, months, current, onSaved }: { group: AgeGroup; months: PassMonths; current: number | null; onSaved: (p: Price[]) => void }) {
  const { lang, dict } = useLang()
  const { od, api } = useOwner()
  const t = od.prices
  const [value, setValue] = useState(agorotToInput(current))
  const [busy, setBusy] = useState<'save' | 'clear' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const id = `price-${group}-${months}`

  async function save(next: number | null, kind: 'save' | 'clear') {
    setBusy(kind)
    setError(null)
    setDone(null)
    try {
      const list = await api.setPrice(group, months, next)
      onSaved(list)
      setValue(agorotToInput(next))
      setDone(next === null ? t.cleared : t.saved)
    } catch (e) {
      setError(ownerError(od, e))
    } finally {
      setBusy(null)
    }
  }

  function submit() {
    const v = parseShekels(value)
    const problem = priceProblem(v)
    if (problem) return setError(problem === 'invalid' ? t.invalid : problem === 'too_low' ? t.tooLow : t.tooHigh)
    if (v === null) return setError(t.invalid)
    void save(v as number, 'save')
  }

  const shown = formatShekels(current, lang)
  return (
    <li className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0" data-testid={id}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">{dict.commerce.months[months]}</h3>
        {shown ? (
          <span className="font-semibold" data-testid={`${id}-current`}>{t.current.split('{price}')[0]}<bdi>{shown}</bdi>{t.current.split('{price}')[1]}</span>
        ) : (
          <span className="flex flex-wrap items-center gap-2 text-ink-muted" data-testid={`${id}-current`}>
            {dict.commerce.plans.priceNotSet} <PlaceholderTag>{dict.commerce.plans.placeholderBadge}</PlaceholderTag>
          </span>
        )}
      </div>
      <TextField
        label={fmt(t.inputLabel, { pass: dict.commerce.months[months] })}
        value={value}
        onChange={(e) => { setValue(e.target.value); setDone(null) }}
        onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
        inputMode="decimal"
        autoComplete="off"
        dir="ltr"
        error={error}
        data-testid={`${id}-input`}
      />
      <div className="flex flex-wrap gap-2">
        <Button busy={busy === 'save'} disabled={!!busy} onClick={submit} data-testid={`${id}-save`}>{t.save}</Button>
        {current !== null && <Button variant="secondary" busy={busy === 'clear'} disabled={!!busy} onClick={() => void save(null, 'clear')} data-testid={`${id}-clear`}>{t.clear}</Button>}
      </div>
      {done && <p role="status" className="text-sm font-medium" data-testid={`${id}-done`}>{done}</p>}
    </li>
  )
}
