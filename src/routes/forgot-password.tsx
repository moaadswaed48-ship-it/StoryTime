import { useState, type FormEvent } from 'react'
import { getApi } from '@/data'
import { codeOf } from '@/data/errors'
import { isEmail } from '@/data/validate'
import { errorText } from '@/features/account/messages'
import { pendingEmail, TestEmailPanel } from '@/features/account/parts'
import { fmt } from '@/i18n/format'
import { useLang } from '@/i18n/use-dict'
import { langData, pageMeta } from '@/seo/meta'
import { localPath } from '@/seo/paths'
import { Button, Notice, TextField, TextLink } from '@/ui/controls'
import { PageTitle, Shell } from '@/ui/Shell'
import type { Route } from './+types/forgot-password'

export const meta: Route.MetaFunction = ({ matches }) => {
  const d = langData(matches)
  const p = d?.dict.pages.forgotPassword
  return d && p ? pageMeta({ lang: d.lang, page: 'forgot-password', title: p.title, description: p.description, siteName: d.dict.common.siteName }) : []
}

/** Always answers the same way, so the page never tells whether an address has an account. */
export default function ForgotPassword() {
  const { lang, dict } = useLang()
  const t = dict.account.auth
  const [email, setEmail] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!isEmail(email)) return setFieldError(dict.account.errors.invalidEmail)
    setFieldError(null)
    setBusy(true)
    try {
      await (await getApi()).requestPasswordReset(email, lang)
      pendingEmail.set(email.trim())
      setSentTo(email.trim())
    } catch (err) {
      setError(errorText(dict, codeOf(err)))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Shell narrow>
      <PageTitle title={t.forgotTitle} lead={t.forgotLead} />
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <TextField label={t.email} type="email" inputMode="email" autoComplete="email" dir="ltr" value={email} onChange={(e) => { setEmail(e.target.value); setFieldError(null) }} error={fieldError} />
        {error && <Notice tone="error">{error}</Notice>}
        {sentTo && <Notice tone="success">{fmt(t.forgotSent, { email: sentTo })}</Notice>}
        <Button type="submit" busy={busy} wide>{t.forgotSubmit}</Button>
      </form>
      {sentTo && <div className="mt-5"><TestEmailPanel email={sentTo} kind="reset" /></div>}
      <TextLink to={localPath(lang, 'sign-in')} className="mt-6">{t.backToSignIn}</TextLink>
    </Shell>
  )
}
