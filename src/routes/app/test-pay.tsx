import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { getApi } from '@/data'
import { codeOf, type ErrorCode } from '@/data/errors'
import { safeNext } from '@/features/account/parts'
import { testProvider } from '@/data/payments/test-provider'
import type { Order } from '@/data/types'
import { errorText } from '@/features/account/messages'
import { formatShekels } from '@/i18n/format'
import { useLang } from '@/i18n/use-dict'
import { privateMeta } from '@/seo/meta'
import { localPath } from '@/seo/paths'
import { Button, Notice, Spinner } from '@/ui/controls'

export const meta = () => privateMeta('StoryTime')

/**
 * The test provider's "hosted payment page". Stands in for the payment company until one is connected: no card,
 * no money. Its buttons send the provider's server callback (succeeded, failed or cancelled) and return the
 * browser to our confirmation page, exactly like a real provider.
 */
export default function TestPay() {
  const { lang, dict } = useLang()
  const t = dict.commerce.checkout
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const back = safeNext(params.get('return'), lang) ?? localPath(lang, 'app/library')
  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState<ErrorCode | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getApi().then((a) => a.getOrder(params.get('order') ?? '')).then(setOrder, (e) => setError(codeOf(e)))
  }, [params])

  const send = async (outcome: 'succeeded' | 'failed' | 'cancelled') => {
    if (!order) return
    setBusy(true)
    try {
      await testProvider.pay(await getApi(), order, outcome)
      navigate(back, { replace: true })
    } catch (e) {
      setError(codeOf(e))
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5 rounded-control border-2 border-dashed border-ink/60 p-5" data-testid="test-pay">
      <h1 className="text-2xl font-semibold">{t.testPayTitle}</h1>
      <p className="text-ink-muted">{t.testPayLead}</p>
      {error && <Notice tone="error">{errorText(dict, error)}</Notice>}
      {!order && !error && <Spinner label={dict.account.states.loading} />}
      {order && (
        <>
          <dl className="flex flex-col gap-1">
            <div className="flex justify-between gap-4"><dt className="text-ink-muted">{t.orderRef}</dt><dd className="font-mono text-sm" dir="ltr">{order.id.slice(0, 8).toUpperCase()}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-ink-muted">{t.amount}</dt><dd><bdi>{formatShekels(order.amountAgorot, lang)}</bdi></dd></div>
          </dl>
          <Button onClick={() => send('succeeded')} busy={busy} wide>{t.testPaySucceed}</Button>
          <Button variant="secondary" onClick={() => send('failed')} disabled={busy} wide>{t.testPayFail}</Button>
          <Button variant="quiet" onClick={() => send('cancelled')} disabled={busy} wide>{t.testPayCancel}</Button>
        </>
      )}
    </div>
  )
}
