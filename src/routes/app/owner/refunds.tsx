import { useCallback, useEffect, useId, useState, type ReactNode } from 'react'
import { ownerError, useOwner } from '@/features/owner/context'
import type { PublicCancellation, RefundRequest, RefundsView, RequestMatch } from '@/features/owner/data'
import { agorotToInput, parseShekels, REFUND_NOTE_MAX } from '@/features/owner/data/money'
import { Email, MailLink, StateBadge } from '@/features/owner/ui'
import { fmt, formatDate, formatShekels } from '@/i18n/format'
import { useLang } from '@/i18n/use-dict'
import { Button, FieldError, Notice, Section, Spinner, TextField } from '@/ui/controls'
import { PageTitle } from '@/ui/Shell'

/**
 * Cancellations and refunds (owner's area, part 2). A family's cancellation already ended its access and made a
 * refund request for the full amount; here the owner sets the fee (never above the legal cap), returns the money
 * herself (no payment company is connected, so nothing moves from this screen) and marks the request as refunded
 * with a note. Below: requests from the public "Cancel a purchase" form, each with the paid orders that match its
 * order number and email; the owner can end such a pass here (the same rules as a family's own cancellation: 14 days,
 * an active pass), which opens its refund request above. Otherwise she settles it by email and marks it handled.
 */
export default function OwnerRefunds() {
  const { dict } = useLang()
  const { od, api } = useOwner()
  const t = od.refunds
  const [view, setView] = useState<RefundsView | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setError(null)
    api.listRefunds().then(setView, (e) => setError(ownerError(od, e)))
  }, [api, od])
  useEffect(load, [load])
  const reload = useCallback(async () => setView(await api.listRefunds()), [api])

  return (
    <div className="flex flex-col gap-6" data-testid="owner-refunds">
      <PageTitle title={t.title} lead={t.lead} />
      <Notice tone="warning" title={t.noMoneyTitle}><p>{t.noMoneyLead}</p></Notice>
      {error && <Notice tone="error" title={error} action={<Button variant="secondary" onClick={load}>{od.errors.retry}</Button>} />}
      {!view && !error && <Spinner label={dict.account.states.loading} />}
      {view && (
        <>
          <p role="status" className="text-lg font-semibold" data-testid="open-count">{view.open ? fmt(t.openCount, { n: view.open }) : t.noneOpen}</p>
          {!view.refunds.length ? (
            <p className="rounded-control border border-dashed border-ink/40 p-6 text-ink-muted">{t.empty}</p>
          ) : (
            <ul className="flex flex-col gap-3" data-testid="refund-list">
              {view.refunds.map((r) => <RefundCard key={r.id} r={r} onChanged={reload} />)}
            </ul>
          )}
          <Section title={t.publicTitle}>
            <p className="-mt-2 text-ink-muted">{t.publicLead}</p>
            {!view.publicRequests.length ? (
              <p className="text-ink-muted">{t.publicEmpty}</p>
            ) : (
              <ul className="flex flex-col divide-y divide-line" data-testid="public-requests">
                {view.publicRequests.map((c) => <PublicRequest key={c.id} c={c} onChanged={reload} />)}
              </ul>
            )}
          </Section>
        </>
      )}
    </div>
  )
}

/** Puts an amount (kept whole and left to right) into a sentence at {amount}. */
function slot(template: string, node: ReactNode) {
  const [before, after = ''] = template.split('{amount}')
  return <>{before}{node}{after}</>
}

function RefundCard({ r, onChanged }: { r: RefundRequest; onChanged: () => Promise<void> }) {
  const { lang, dict } = useLang()
  const { od, api } = useOwner()
  const t = od.refunds
  const noteId = useId()
  const [fee, setFee] = useState(agorotToInput(r.feeAgorot))
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState<'fee' | 'mark' | null>(null)
  const [feeError, setFeeError] = useState<string | null>(null)
  const [markError, setMarkError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const money = (a: number) => <bdi>{formatShekels(a, lang)}</bdi>
  const open = r.status === 'requested'

  /** Checks the fee field; returns agorot, null for empty, or undefined after showing the problem. */
  function readFee(): number | null | undefined {
    const v = parseShekels(fee)
    if (v === 'invalid') return void setFeeError(t.feeInvalid)
    if (v !== null && v > r.maxFeeAgorot) return void setFeeError(od.errors.feeOverCap)
    return v
  }

  async function saveFee() {
    setFeeError(null)
    setSaved(false)
    const v = readFee()
    if (v === undefined) return
    setBusy('fee')
    try {
      await api.setRefundFee(r.id, v)
      setSaved(true)
      await onChanged()
    } catch (e) {
      setFeeError(ownerError(od, e))
    } finally {
      setBusy(null)
    }
  }

  async function mark() {
    setFeeError(null)
    setMarkError(null)
    setSaved(false)
    if (!note.trim()) return setMarkError(od.errors.noteRequired)
    const v = readFee()
    if (v === undefined) return
    setBusy('mark')
    try {
      // A fee typed but not saved yet is saved first, so one press does what the owner sees on screen.
      if (v !== r.feeAgorot) await api.setRefundFee(r.id, v)
      await api.markRefunded(r.id, note)
      await onChanged()
    } catch (e) {
      setMarkError(ownerError(od, e))
      await onChanged().catch(() => {})
    } finally {
      setBusy(null)
    }
  }

  const state = r.status === 'issued' ? t.stateIssued : r.status === 'declined' ? t.stateDeclined : t.stateOpen
  return (
    <li className="flex min-w-0 flex-col gap-4 rounded-control border border-line bg-surface p-4" data-testid="refund" data-status={r.status}>
      <div className="flex flex-wrap items-center gap-2">
        <StateBadge done={!open}>{state}</StateBadge>
        <span className="text-sm text-ink-muted">{fmt(t.cancelledOn, { date: formatDate(r.requestedAt, lang, true) })}</span>
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="font-semibold">{r.email ? <Email value={r.email} /> : <span className="text-ink-muted">{t.noEmail}</span>}</p>
        <p>{dict.commerce.groups[r.ageGroup]} · {dict.commerce.months[r.months]}</p>
        <p className="text-sm"><span className="text-ink-muted">{t.orderRef}: </span><bdi dir="ltr" className="font-mono">{r.orderId.slice(0, 8).toUpperCase()}</bdi></p>
        {r.paidAt && <p className="text-sm text-ink-muted">{fmt(t.paidOn, { date: formatDate(r.paidAt, lang) })}</p>}
        <p className="font-medium" data-testid="refund-paid">
          {r.priceWasPlaceholder ? t.testPurchase : slot(t.paid, money(r.paidAgorot))}
        </p>
      </div>

      {open ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <TextField
              label={t.feeLabel}
              hint={fmt(t.feeHint, { /* first-strong isolate, as <bdi>: a Hebrew or Arabic amount starts with a right-to-left mark */ max: `⁨${formatShekels(r.maxFeeAgorot, lang)}⁩` })}
              value={fee}
              onChange={(e) => { setFee(e.target.value); setSaved(false) }}
              inputMode="decimal"
              autoComplete="off"
              dir="ltr"
              error={feeError}
              className="sm:max-w-xs"
              data-testid="fee-input"
            />
            <Button variant="secondary" busy={busy === 'fee'} disabled={!!busy} onClick={() => void saveFee()} data-testid="save-fee">{t.saveFee}</Button>
          </div>
          <p className="font-medium" role="status" data-testid="refund-amounts">
            {saved && <span className="me-2">{t.feeSaved}</span>}
            {r.feeAgorot === null ? <span className="text-ink-muted">{t.feeNotSet}</span> : (
              <>
                <span className="me-3">{slot(t.fee, money(r.feeAgorot))}</span>
                <span>{slot(t.toReturn, money(r.paidAgorot - r.feeAgorot))}</span>
              </>
            )}
          </p>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={noteId} className="font-medium">{t.noteLabel}</label>
            <p id={`${noteId}-hint`} className="text-sm text-ink-muted">{t.noteHint}</p>
            <textarea
              id={noteId}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={REFUND_NOTE_MAX}
              rows={3}
              dir="auto"
              aria-describedby={`${noteId}-hint`}
              className="w-full rounded-control border border-ink/40 bg-surface px-3 py-2.5 text-base"
              data-testid="refund-note"
            />
          </div>
          <div>
            <Button busy={busy === 'mark'} disabled={!!busy} onClick={() => void mark()} data-testid="mark-refunded">{t.markRefunded}</Button>
          </div>
          {markError && <FieldError id={`${noteId}-err`}>{markError}</FieldError>}
        </>
      ) : (
        <div className="flex flex-col gap-1" data-testid="refund-done">
          {r.issuedAt && <p className="font-medium">{fmt(t.refundedOn, { date: formatDate(r.issuedAt, lang, true) })}</p>}
          {r.feeAgorot !== null && (
            <p>
              <span className="me-3">{slot(t.fee, money(r.feeAgorot))}</span>
              <span>{slot(t.returned, money(r.paidAgorot - r.feeAgorot))}</span>
            </p>
          )}
          {r.note && <p><span className="font-medium">{t.noteTitle}: </span><span dir="auto" className="whitespace-pre-wrap break-words">{r.note}</span></p>}
        </div>
      )}
    </li>
  )
}

function PublicRequest({ c, onChanged }: { c: PublicCancellation; onChanged: () => Promise<void> }) {
  const { lang } = useLang()
  const { od, api } = useOwner()
  const t = od.refunds
  const m = od.messages
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  async function toggle() {
    setBusy(true)
    setErr(null)
    try {
      await api.setCancellationHandled(c.id, !c.handledAt)
      await onChanged()
    } catch (e) {
      setErr(ownerError(od, e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <li className="flex min-w-0 flex-col gap-2 py-4" data-testid="public-request" data-handled={c.handledAt ? 'yes' : 'no'}>
      <div className="flex flex-wrap items-center gap-2">
        <StateBadge done={!!c.handledAt}>{c.handledAt ? fmt(m.handledOn, { date: formatDate(c.handledAt, lang) }) : m.filterOpen}</StateBadge>
        <span className="text-sm text-ink-muted">{fmt(m.received, { date: formatDate(c.createdAt, lang, true) })}</span>
      </div>
      <p className="font-semibold"><Email value={c.email} /></p>
      <p><span className="text-ink-muted">{t.orderRef}: </span><bdi dir="ltr" className="break-all font-medium">{c.orderRef}</bdi></p>
      {c.message && <p dir="auto" className="whitespace-pre-wrap break-words text-start">{c.message}</p>}
      <div className="flex flex-col gap-2" data-testid="request-matches">
        <p className="font-medium">{t.matchesTitle}</p>
        {!c.matches.length ? <p className="text-ink-muted" data-testid="no-match">{t.noMatch}</p> : (
          <ul className="flex flex-col gap-2">
            {c.matches.map((m) => <MatchCard key={m.orderId} requestId={c.id} m={m} onChanged={onChanged} />)}
          </ul>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant={c.handledAt ? 'secondary' : 'primary'} busy={busy} onClick={() => void toggle()} data-testid="toggle-request">
          {c.handledAt ? m.markOpen : m.markHandled}
        </Button>
        <MailLink to={c.email}>{m.reply}</MailLink>
      </div>
      {err && <FieldError id={`req-${c.id}-err`}>{err}</FieldError>}
    </li>
  )
}

/** One paid order matching a public request, with the owner's cancellation for it (two steps: ask, then confirm). */
function MatchCard({ requestId, m, onChanged }: { requestId: string; m: RequestMatch; onChanged: () => Promise<void> }) {
  const { lang, dict } = useLang()
  const { od, api } = useOwner()
  const t = od.refunds
  const [asking, setAsking] = useState(false)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  async function cancel() {
    setBusy(true)
    setErr(null)
    try {
      await api.cancelForRequest(requestId, m.orderId)
      setDone(true)
      setAsking(false)
      await onChanged()
    } catch (e) {
      setErr(ownerError(od, e))
      await onChanged().catch(() => {})
    } finally {
      setBusy(false)
    }
  }
  const state = m.passStatus === 'active' ? t.passActive : m.passStatus === 'refunded' ? t.passRefunded : t.passCancelled
  return (
    <li className="flex min-w-0 flex-col gap-2 rounded-control border border-line bg-surface p-3" data-testid="request-match" data-pass={m.passStatus ?? 'none'}>
      <div className="flex flex-wrap items-center gap-2">
        <StateBadge done={m.passStatus !== 'active'}>{state}</StateBadge>
        <span><span className="text-ink-muted">{t.orderRef}: </span><bdi dir="ltr" className="font-mono font-medium">{m.orderId.slice(0, 8).toUpperCase()}</bdi></span>
      </div>
      <p>{dict.commerce.groups[m.ageGroup]} · {dict.commerce.months[m.months]}</p>
      <p className="text-sm text-ink-muted">
        {fmt(t.paidOn, { date: formatDate(m.paidAt, lang) })} · {m.priceWasPlaceholder ? t.testPurchase : slot(t.paid, <bdi>{formatShekels(m.paidAgorot, lang)}</bdi>)}
      </p>
      {done && <p role="status" className="font-medium" data-testid="cancel-done">{t.cancelDone}</p>}
      {m.passStatus === 'active' && !m.canCancel && <p className="text-ink-muted">{t.windowClosed}</p>}
      {m.canCancel && !asking && (
        <div><Button variant="secondary" onClick={() => setAsking(true)} data-testid="cancel-for-request">{t.cancelOrder}</Button></div>
      )}
      {m.canCancel && asking && (
        <div className="flex flex-col gap-2 rounded-control border border-ink/30 p-3" role="group" aria-label={t.cancelOrder}>
          <p>{t.cancelConfirm}</p>
          <div className="flex flex-wrap gap-2">
            <Button busy={busy} onClick={() => void cancel()} data-testid="confirm-cancel-for-request">{t.cancelYes}</Button>
            <Button variant="secondary" disabled={busy} onClick={() => setAsking(false)}>{t.cancelKeep}</Button>
          </div>
        </div>
      )}
      {err && <FieldError id={`match-${m.orderId}-err`}>{err}</FieldError>}
    </li>
  )
}
