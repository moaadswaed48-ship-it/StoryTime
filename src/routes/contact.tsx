import { useId, useState, type FormEvent } from 'react'
import { backendKind, getApi } from '@/data'
import { CONTACT_MESSAGE_MAX } from '@/data/api'
import { codeOf } from '@/data/errors'
import { isEmail } from '@/data/validate'
import { errorText } from '@/features/account/messages'
import { useLang } from '@/i18n/use-dict'
import { langData, pageMeta } from '@/seo/meta'
import { localPath } from '@/seo/paths'
import { Button, FieldError, Notice, PlaceholderTag, Section, TextField, TextLink } from '@/ui/controls'
import { PageTitle, Shell } from '@/ui/Shell'
import type { Route } from './+types/contact'

export const meta: Route.MetaFunction = ({ matches }) => {
  const d = langData(matches)
  const p = d?.dict.pages.contact
  return d && p ? pageMeta({ lang: d.lang, page: 'contact', title: p.title, description: p.description, siteName: d.dict.common.siteName }) : []
}

/**
 * Contact: a form for anyone, signed in or not. The message is recorded through the data layer (local test mode:
 * this browser; Supabase: contact_messages, read by the owner). No email is sent yet, and the page says so in test
 * mode. The support email address is a visible placeholder until the owner sets it.
 */
export default function Contact() {
  const { lang, dict } = useLang()
  const t = dict.support.contact
  return (
    <Shell narrow>
      <PageTitle title={dict.pages.contact.title} lead={t.lead} />
      <div className="flex flex-col gap-6">
        {backendKind === 'local' && <Notice>{t.testNote}</Notice>}
        <ContactForm />
        <Section title={t.otherWays}>
          <p className="flex flex-wrap items-center gap-2 text-ink-muted"><PlaceholderTag>{dict.commerce.plans.placeholderBadge}</PlaceholderTag> {dict.support.help.emailPlaceholder}</p>
          <TextLink to={localPath(lang, 'help')} className="self-start">{t.helpLink}</TextLink>
          <TextLink to={localPath(lang, 'cancel-purchase')} className="self-start">{dict.common.footer.cancelPurchase}</TextLink>
        </Section>
      </div>
    </Shell>
  )
}

function ContactForm() {
  const { lang, dict } = useLang()
  const t = dict.support.contact
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<{ email?: string; message?: string }>({})
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const msgId = useId()

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!isEmail(email)) next.email = dict.account.errors.invalidEmail
    if (!message.trim()) next.message = dict.account.errors.required
    else if (message.trim().length > CONTACT_MESSAGE_MAX) next.message = t.tooLong
    setErrors(next)
    setError(null)
    if (Object.keys(next).length) return
    setBusy(true)
    try {
      await (await getApi()).sendContactMessage({ name, email, message, lang })
      setSent(true)
      setMessage('')
    } catch (err) {
      setError(errorText(dict, codeOf(err)))
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-4" data-testid="contact-sent">
        <Notice tone="success">{t.sent}</Notice>
        <Button variant="secondary" className="self-start" onClick={() => setSent(false)}>{t.sendAnother}</Button>
      </div>
    )
  }
  const msgErr = errors.message ? `${msgId}-err` : undefined
  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4" data-testid="contact-form">
      <TextField label={t.name} optionalLabel={dict.account.onboarding.optional} autoComplete="name" maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
      <TextField label={t.email} hint={t.emailHint} type="email" inputMode="email" autoComplete="email" dir="ltr" value={email}
        onChange={(e) => { setEmail(e.target.value); setErrors((x) => ({ ...x, email: undefined })) }} error={errors.email} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor={msgId} className="font-medium">{t.message}</label>
        <p id={`${msgId}-hint`} className="text-sm text-ink-muted">{t.messageHint}</p>
        <textarea id={msgId} rows={6} value={message} aria-invalid={errors.message ? true : undefined} aria-describedby={[`${msgId}-hint`, msgErr].filter(Boolean).join(' ')}
          onChange={(e) => { setMessage(e.target.value); setErrors((x) => ({ ...x, message: undefined })) }}
          className={`min-h-32 w-full rounded-control border bg-surface px-4 py-3 text-base ${errors.message ? 'border-red-700' : 'border-ink/40'}`} />
        {errors.message && <FieldError id={msgErr!}>{errors.message}</FieldError>}
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      <Button type="submit" busy={busy} className="self-start">{t.send}</Button>
    </form>
  )
}
