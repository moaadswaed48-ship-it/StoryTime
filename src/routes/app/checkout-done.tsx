import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { getApi } from '@/data'
import { codeOf, type ErrorCode } from '@/data/errors'
import type { Order, Pass } from '@/data/types'
import { errorText } from '@/features/account/messages'
import { checkoutPath } from '@/features/commerce/PlanCards'
import { fmt, formatDate } from '@/i18n/format'
import { useLang } from '@/i18n/use-dict'
import { privateMeta } from '@/seo/meta'
import { localPath } from '@/seo/paths'
import { ButtonLink, Notice, Spinner } from '@/ui/controls'

export const meta = () => privateMeta('StoryTime')

const POLL_MS = 600
const SLOW_AFTER_MS = 4000

/**
 * Where the provider sends the browser back. It never unlocks anything itself: it waits until the server has the
 * provider's callback and the order is paid (or failed, or cancelled), then says so.
 */
export default function CheckoutDone() {
  const { lang, dict } = useLang()
  const t = dict.commerce.checkout
  const [params] = useSearchParams()
  const orderId = params.get('order') ?? ''
  const [order, setOrder] = useState<Order | null>(null)
  const [pass, setPass] = useState<Pass | null>(null)
  const [now, setNow] = useState<string>('')
  const [slow, setSlow] = useState(false)
  const [error, setError] = useState<ErrorCode | null>(null)

  useEffect(() => {
    let alive = true
    const started = Date.now()
    const tick = async () => {
      try {
        const a = await getApi()
        const o = await a.getOrder(orderId)
        if (!alive) return
        setOrder(o)
        if (o.status === 'pending') {
          setSlow(Date.now() - started > SLOW_AFTER_MS)
          setTimeout(tick, POLL_MS)
        } else if (o.status === 'paid') {
          const access = await a.getAccess()
          if (alive) {
            setNow(access.now)
            setPass(access.passes.find((p) => p.orderId === o.id) ?? null)
          }
        }
      } catch (e) {
        if (alive) setError(codeOf(e))
      }
    }
    void tick()
    return () => void (alive = false)
  }, [orderId])

  if (error) return <Notice tone="error">{errorText(dict, error)}</Notice>
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-5" data-testid="checkout-done" data-status={order?.status ?? 'loading'}>
      {(!order || order.status === 'pending') && (
        <>
          <h1 className="text-3xl font-semibold"><Spinner label={slow ? t.confirming : t.processing} /></h1>
        </>
      )}
      {order?.status === 'paid' && (
        <Notice
          tone="success"
          title={t.successTitle}
          action={<><ButtonLink to={localPath(lang, 'app/library')}>{t.toLibrary}</ButtonLink><ButtonLink to={localPath(lang, 'app/settings')} variant="secondary">{t.toPasses}</ButtonLink></>}
        >
          {pass && (
            <p>
              {new Date(pass.startsAt).getTime() > new Date(now).getTime() + 60_000
                ? fmt(t.successQueued, { group: dict.commerce.groups[pass.ageGroup], start: formatDate(pass.startsAt, lang), date: formatDate(pass.endsAt, lang) })
                : fmt(t.successLead, { group: dict.commerce.groups[pass.ageGroup], date: formatDate(pass.endsAt, lang) })}
            </p>
          )}
          <p className="text-sm">{t.orderRef}: <span dir="ltr" className="font-mono">{order.id.slice(0, 8).toUpperCase()}</span></p>
        </Notice>
      )}
      {(order?.status === 'failed' || order?.status === 'cancelled') && (
        <Notice
          tone={order.status === 'failed' ? 'error' : 'warning'}
          title={order.status === 'failed' ? t.failedTitle : t.cancelledTitle}
          action={<ButtonLink to={checkoutPath(lang, order.ageGroup, order.months)}>{t.tryAgain}</ButtonLink>}
        >
          <p>{order.status === 'failed' ? t.failedLead : t.cancelledLead}</p>
        </Notice>
      )}
    </div>
  )
}
