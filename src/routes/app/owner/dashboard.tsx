import { useCallback, useEffect, useState } from 'react'
import { ownerError, useOwner } from '@/features/owner/context'
import type { Dashboard } from '@/features/owner/data'
import { AGE_GROUPS } from '@/data/types'
import { fmt, formatDate, formatShekels } from '@/i18n/format'
import { useLang } from '@/i18n/use-dict'
import { Button, Notice, Section, Spinner } from '@/ui/controls'
import { PageTitle } from '@/ui/Shell'

/** Read-only numbers: accounts, trials and passes running now, recent purchases. Never a child's name. */
export default function OwnerDashboard() {
  const { lang, dict } = useLang()
  const { od, api } = useOwner()
  const [d, setD] = useState<Dashboard | null>(null)
  const [error, setError] = useState<string | null>(null)
  const load = useCallback(() => {
    setError(null)
    api.dashboard().then(setD, (e) => setError(ownerError(od, e)))
  }, [api, od])
  useEffect(load, [load])
  const t = od.dashboard

  if (error) return <Notice tone="error" title={error} action={<Button variant="secondary" onClick={load}>{od.errors.retry}</Button>} />
  if (!d) return <Spinner label={dict.account.states.loading} />

  const Tile = ({ label, value, testId }: { label: string; value: number; testId?: string }) => (
    <div className="flex flex-col gap-1 rounded-control border border-line bg-surface p-4">
      <span className="text-sm text-ink-muted">{label}</span>
      <span className="text-3xl font-semibold tabular-nums" data-testid={testId}>{value}</span>
    </div>
  )

  return (
    <div className="flex flex-col gap-6" data-testid="owner-dashboard">
      <PageTitle title={t.title} lead={t.lead} />
      <p className="-mt-6 text-sm text-ink-muted">{fmt(t.countedAt, { date: formatDate(d.now, lang, true) })}</p>
      <Section title={t.signUps}>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Tile label={t.total} value={d.signUps.total} testId="dash-total" />
          <Tile label={t.last7} value={d.signUps.last7Days} />
          <Tile label={t.parents} value={d.signUps.parents} />
          <Tile label={t.teachers} value={d.signUps.teachers} />
        </div>
      </Section>
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title={t.trials}>
          <div className="grid grid-cols-3 gap-3">{AGE_GROUPS.map((g) => <Tile key={g} label={dict.commerce.groups[g]} value={d.activeTrials[g] ?? 0} testId={`dash-trial-${g}`} />)}</div>
        </Section>
        <Section title={t.passes}>
          <div className="grid grid-cols-3 gap-3">{AGE_GROUPS.map((g) => <Tile key={g} label={dict.commerce.groups[g]} value={d.activePasses[g] ?? 0} testId={`dash-pass-${g}`} />)}</div>
        </Section>
      </div>
      <Section title={t.purchases}>
        {!d.recentPurchases.length ? (
          <p className="text-ink-muted">{t.purchasesEmpty}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line" data-testid="dash-purchases">
            {d.recentPurchases.map((o) => (
              <li key={o.orderId} className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr_auto] sm:items-center sm:gap-4">
                <span className="text-sm text-ink-muted">{formatDate(o.paidAt ?? o.createdAt, lang)}</span>
                <span className="flex flex-col">
                  <span dir="ltr" className="truncate text-start">{o.email ?? t.noEmail}</span>
                  <span className="text-sm text-ink-muted">{dict.commerce.groups[o.ageGroup]} · {fmt(t.months, { n: o.months })}</span>
                </span>
                <span className="flex flex-col sm:items-end">
                  <span className="font-medium">{o.priceWasPlaceholder ? t.testNoPrice : formatShekels(o.amountAgorot, lang)}</span>
                  <span className="text-sm">{t.statuses[o.status as keyof typeof t.statuses] ?? o.status}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  )
}
