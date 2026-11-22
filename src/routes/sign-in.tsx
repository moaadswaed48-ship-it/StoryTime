import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { getApi } from '@/data'
import { codeOf, type ErrorCode } from '@/data/errors'
import { errorText } from '@/features/account/messages'
import { pendingEmail, safeNext, TestEmailPanel } from '@/features/account/parts'
import { useLang } from '@/i18n/use-dict'
import { langData, pageMeta } from '@/seo/meta'
import { localPath } from '@/seo/paths'
import { Button, Notice, PasswordField, TextField, TextLink } from '@/ui/controls'
import { PageTitle, Shell } from '@/ui/Shell'
import type { Route } from './+types/sign-in'

export const meta: Route.MetaFunction = ({ matches }) => {
  const d = langData(matches)
  const p = d?.dict.pages.signIn
  return d && p ? pageMeta({ lang: d.lang, page: 'sign-in', title: p.title, description: d.dict.account.auth.signUpLead, siteName: d.dict.common.siteName }) : []
}

export default function SignIn() {
  const { lang, dict } = useLang()
  const t = dict.account.auth
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'), lang)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<ErrorCode | null>(null)
  const [busy, setBusy] = useState(false)
  const [resent, setResent] = useState(0)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email.trim() || !password) return setError('wrong_credentials')
    setBusy(true)
    try {
      const api = await getApi()
      await api.signIn(email, password)
      const account = await api.getAccount()
      // The language chosen on any device wins, unless the visitor was on their way to a page.
      navigate(next ?? localPath(account.language, 'app'), { replace: true })
    } catch (err) {
      setError(codeOf(err))
    } finally {
      setBusy(false)
    }
  }

  const resend = async () => {
    try {
      await (await getApi()).resendConfirmation(email, lang)
      pendingEmail.set(email.trim())
      setResent((n) => n + 1)
    } catch (err) {
      setError(codeOf(err))
    }
  }

  return (
    <Shell narrow>
      <PageTitle title={t.signInTitle} />
      {next && <Notice tone="info" className="mb-6">{t.sessionExpired}</Notice>}
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <TextField label={t.email} type="email" name="email" inputMode="email" autoComplete="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} />
        <PasswordField label={t.password} name="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} showLabel={t.showPassword} hideLabel={t.hidePassword} />
        <TextLink to={localPath(lang, 'forgot-password')} className="self-start">{t.forgot}</TextLink>
        {error === 'email_unconfirmed' ? (
          <Notice tone="warning" action={<Button variant="secondary" onClick={resend}>{t.sendAgain}</Button>}>
            {errorText(dict, error)}
            {resent > 0 && <p className="font-medium">{t.checkResent}</p>}
          </Notice>
        ) : error ? (
          <Notice tone="error">{errorText(dict, error)}</Notice>
        ) : null}
        {resent > 0 && <TestEmailPanel email={email} kind="confirm" refreshKey={resent} />}
        <Button type="submit" busy={busy} wide>{t.submitSignIn}</Button>
        <p className="flex flex-wrap items-center gap-x-2 text-ink-muted">
          {t.noAccount}
          <Link to={localPath(lang, 'sign-up')} className="inline-flex min-h-11 items-center font-medium text-ink underline underline-offset-4">{t.createLink}</Link>
        </p>
      </form>
    </Shell>
  )
}
