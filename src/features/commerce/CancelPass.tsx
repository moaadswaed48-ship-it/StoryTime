import { useState } from 'react'
import { getApi } from '@/data'
import { codeOf } from '@/data/errors'
import { canCancel, cancelUntil } from '@/data/rules'
import type { Pass } from '@/data/types'
import { errorText } from '@/features/account/messages'
import { fmt, formatDate } from '@/i18n/format'
import { useLang } from '@/i18n/use-dict'
import { Button, Notice } from '@/ui/controls'

/**
 * "Cancel this purchase" for one pass, with the refund rule shown before the final tap (legal checklist 6).
 * Only offered while the 14 days last; the server checks the same rule again.
 */
export function CancelPass({ pass, now, onDone }: { pass: Pass; now: string; onDone: () => void }) {
  const { lang, dict } = useLang()
  const t = dict.commerce
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  if (!canCancel(pass, now) || !pass.paidAt) return null

  const cancel = async () => {
    setBusy(true)
    setError(null)
    try {
      await (await getApi()).cancelPurchase(pass.id)
      onDone()
    } catch (err) {
      setError(errorText(dict, codeOf(err)))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-ink-muted">{fmt(dict.account.settings.cancelUntil, { date: formatDate(cancelUntil(pass.paidAt), lang) })}</p>
      {!confirming ? (
        <Button variant="secondary" onClick={() => setConfirming(true)} className="self-start">{dict.account.settings.cancelPurchase}</Button>
      ) : (
        <Notice
          tone="warning"
          title={t.cancel.confirmTitle}
          action={
            <>
              <Button variant="danger" busy={busy} onClick={cancel}>{t.cancel.confirm}</Button>
              <Button variant="secondary" onClick={() => setConfirming(false)}>{t.cancel.keep}</Button>
            </>
          }
        >
          <p>{fmt(t.cancel.confirmLead, { group: t.groups[pass.ageGroup], length: t.months[pass.months] })}</p>
          <p className="text-sm">{t.cancel.refund}</p>
        </Notice>
      )}
      {error && <Notice tone="error">{error}</Notice>}
    </div>
  )
}
