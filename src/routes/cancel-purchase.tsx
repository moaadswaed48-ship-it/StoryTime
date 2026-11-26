import { useState, type FormEvent } from 'react'
import { getApi } from '@/data'
import { codeOf } from '@/data/errors'
import { canCancel } from '@/data/rules'
import { isEmail } from '@/data/validate'
import { useAccess } from '@/features/access/useAccess'
import { errorText } from '@/features/account/messages'
import { ParentGate } from '@/features/account/ParentGate'
import { signInPath } from '@/features/account/parts'
import { useSession } from '@/features/account/session'
import { CancelPass } from '@/features/commerce/CancelPass'
import { fmt, formatDate } from '@/i18n/format'
import { useLang } from '@/i18n/use-dict'
import { langData, pageMeta } from '@/seo/meta'
import { localPath } from '@/seo/paths'
import { Button, ButtonLink, Notice, PlaceholderTag, Section, Spinner, TextField, TextLink } from '@/ui/controls'
import { PageTitle, Shell } from '@/ui/Shell'
import type { Route } from './+types/cancel-purchase'

export const meta: Route.MetaFunction = ({ matches }) => {
  const d = langData(matches)
  const p = d?.dict.pages.cancelPurchase
  return d && p ? pageMeta({ lang: d.lang, page: 'cancel-purchase', title: p.title, description: p.description, siteName: d.dict.common.siteName }) : []
}

/**
 * The cancellation route the consumer law asks for (legal checklist items 5-10; product checklist section 19).
 * Passes never renew, so this is about the 14-day right to cancel a purchase. Signed in: pick the pass (behind the
 * parent gate). Signed out: a form, plus the other ways to cancel.
 */
export default function CancelPurchase() {
  const { lang, dict } = useLang()
  const t = dict.commerce.cancel
  const session = useSession()
  return (
    <Shell>
      <PageTitle title={t.title} lead={t.lead} />
      <div className="flex flex-col gap-6">
        <ul className="flex list-disc flex-col gap-2 ps-6 text-lg">
          <li>{t.refund}</li>
          <li>{t.access}</li>
          <li>{t.trialNote}</li>
          <li>{t.noRenew}</li>
        </ul>
        <TextLink to={localPath(lang, 'legal/refunds')} className="self-start text-lg">{dict.pages.legal.refunds}</TextLink>
        {session.status === 'signed-in' ? (
          <Section title={t.signedInTitle}>
            <ParentGate inline>
              <SignedInPasses />
            </ParentGate>
          </Section>
        ) : (
          // Also while the session is still unknown: the pre-rendered page already shows the form, so it does not
          // jump when the visitor turns out to be signed out (the usual case here); a signed-in parent gets the passes.
          <SignedOutForm />
        )}
        <Section title={t.otherWays}>
          <p className="flex flex-wrap items-center gap-2"><PlaceholderTag>{dict.commerce.plans.placeholderBadge}</PlaceholderTag> {t.contactPlaceholder}</p>
        </Section>
        <ButtonLink to={localPath(lang, 'plans')} variant="quiet" className="self-start">{dict.common.nav.plans}</ButtonLink>
      </div>
    </Shell>
  )
}

function SignedInPasses() {
  const { lang, dict } = useLang()
  const t = dict.commerce
  const { access, error, loading, reload } = useAccess()
  const [done, setDone] = useState(false)
  if (loading && !access) return <Spinner label={dict.account.states.loading} />
  if (error) return <Notice tone="error" action={<Button onClick={reload}>{dict.account.errors.retry}</Button>}>{errorText(dict, error)}</Notice>
  const open = (access?.passes ?? []).filter((p) => canCancel(p, access!.now))
  return (
    <div className="flex flex-col gap-4" data-testid="cancel-passes">
      {done && <Notice tone="success">{t.cancel.done}</Notice>}
      {!open.length && !done && <p>{t.cancel.signedInNone}</p>}
      {open.map((p) => (
        <div key={p.id} className="flex flex-col gap-2 border-t border-line pt-4 first:border-0 first:pt-0">
          <p className="font-medium">{t.groups[p.ageGroup]} · {t.months[p.months]}</p>
          <p className="text-sm text-ink-muted">{fmt(dict.account.settings.passUntil, { date: formatDate(p.endsAt, lang) })}</p>
          <CancelPass pass={p} now={access!.now} onDone={() => { setDone(true); void reload() }} />
        </div>
      ))}
    </div>
  )
}

function SignedOutForm() {
  const { lang, dict } = useLang()
  const t = dict.commerce.cancel
  const [email, setEmail] = useState('')
  const [orderRef, setOrderRef] = useState('')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<{ email?: string; orderRef?: string }>({})
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!isEmail(email)) next.email = dict.account.errors.invalidEmail
    if (!orderRef.trim()) next.orderRef = dict.account.errors.required
    setErrors(next)
    setError(null)
    if (Object.keys(next).length) return
    setBusy(true)
    try {
      await (await getApi()).requestCancellation({ email, orderRef, message })
      setSent(true)
    } catch (err) {
      setError(errorText(dict, codeOf(err)))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Section title={t.signedOutTitle}>
      <p className="flex flex-wrap items-center gap-x-2">
        {t.signedOutLead}
        <ButtonLink to={signInPath(lang, localPath(lang, 'cancel-purchase'))} variant="quiet">{dict.account.auth.signInLink}</ButtonLink>
      </p>
      {sent ? (
        <Notice tone="success">{t.sent}</Notice>
      ) : (
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <TextField label={t.email} type="email" inputMode="email" autoComplete="email" dir="ltr" value={email} onChange={(e) => { setEmail(e.target.value); setErrors((x) => ({ ...x, email: undefined })) }} error={errors.email} />
          <TextField label={t.orderRef} dir="ltr" autoComplete="off" value={orderRef} onChange={(e) => { setOrderRef(e.target.value); setErrors((x) => ({ ...x, orderRef: undefined })) }} error={errors.orderRef} />
          <TextField label={t.message} optionalLabel={dict.account.onboarding.optional} value={message} onChange={(e) => setMessage(e.target.value)} />
          {error && <Notice tone="error">{error}</Notice>}
          <Button type="submit" busy={busy} className="self-start">{t.send}</Button>
        </form>
      )}
    </Section>
  )
}
