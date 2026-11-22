import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { getApi } from '@/data'
import { codeOf, type ErrorCode } from '@/data/errors'
import { isEmail, MIN_PASSWORD } from '@/data/validate'
import { TERMS_VERSION } from '@/data/terms'
import { errorText, strengthOf } from '@/features/account/messages'
import { pendingEmail } from '@/features/account/parts'
import { useLang } from '@/i18n/use-dict'
import { langData, pageMeta } from '@/seo/meta'
import { localPath } from '@/seo/paths'
import { Button, Checkbox, ChoiceGroup, Notice, PasswordField, TextField, TextLink } from '@/ui/controls'
import { PageTitle, Shell } from '@/ui/Shell'
import type { Route } from './+types/sign-up'

export const meta: Route.MetaFunction = ({ matches }) => {
  const d = langData(matches)
  const p = d?.dict.pages.signUp
  return d && p ? pageMeta({ lang: d.lang, page: 'sign-up', title: p.title, description: d.dict.account.auth.signUpLead, siteName: d.dict.common.siteName }) : []
}

type Errors = Partial<Record<'email' | 'password' | 'role' | 'adult' | 'terms', string>>

export default function SignUp() {
  const { lang, dict } = useLang()
  const t = dict.account.auth
  const e = dict.account.errors
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'parent' | 'teacher' | null>(null)
  const [adult, setAdult] = useState(false)
  const [terms, setTerms] = useState(false)
  const [marketing, setMarketing] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<ErrorCode | null>(null)
  const [busy, setBusy] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const strength = strengthOf(password)
  const clear = (k: keyof Errors) => setErrors((e) => (e[k] ? { ...e, [k]: undefined } : e))

  const submit = async (ev: FormEvent) => {
    ev.preventDefault()
    const next: Errors = {}
    if (!isEmail(email)) next.email = e.invalidEmail
    if (password.length < MIN_PASSWORD) next.password = e.weakPassword
    if (!role) next.role = e.required
    if (!adult) next.adult = e.mustAccept
    if (!terms) next.terms = e.mustAccept
    setErrors(next)
    setFormError(null)
    if (Object.keys(next).length) {
      // Move focus to the first field that needs attention.
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"], fieldset[aria-describedby] input')?.focus())
      return
    }
    setBusy(true)
    try {
      const api = await getApi()
      await api.signUp({ email, password, role: role!, language: lang, termsVersion: TERMS_VERSION, adult, marketing })
      pendingEmail.set(email.trim())
      navigate(localPath(lang, 'auth/check-email'))
    } catch (err) {
      const code = codeOf(err)
      if (code === 'email_taken') setErrors({ email: e.emailTaken })
      else if (code === 'invalid_email') setErrors({ email: e.invalidEmail })
      else if (code === 'weak_password') setErrors({ password: e.weakPassword })
      else setFormError(code)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Shell narrow>
      <PageTitle title={t.signUpTitle} lead={t.signUpLead} />
      <form ref={formRef} onSubmit={submit} noValidate className="flex flex-col gap-6">
        <ChoiceGroup
          legend={t.roleLegend}
          name="role"
          value={role}
          onChange={(v) => { setRole(v); clear('role') }}
          error={errors.role}
          options={[
            { value: 'parent', label: t.roleParent, hint: t.roleParentHint },
            { value: 'teacher', label: t.roleTeacher, hint: t.roleTeacherHint },
          ]}
        />
        <div className="flex flex-col gap-2">
          <TextField label={t.email} type="email" name="email" inputMode="email" autoComplete="email" dir="ltr" value={email} onChange={(v) => { setEmail(v.target.value); clear('email') }} error={errors.email} required />
          {errors.email === e.emailTaken && (
            <p className="flex flex-wrap gap-x-4">
              <TextLink to={localPath(lang, 'sign-in')}>{t.signInLink}</TextLink>
              <TextLink to={localPath(lang, 'forgot-password')}>{t.forgot}</TextLink>
            </p>
          )}
        </div>
        <PasswordField
          label={t.password}
          name="password"
          autoComplete="new-password"
          hint={t.passwordHint}
          value={password}
          onChange={(v) => { setPassword(v.target.value); clear('password') }}
          error={errors.password}
          showLabel={t.showPassword}
          hideLabel={t.hidePassword}
          strength={strength ? t.strength[strength] : null}
          required
        />
        <div className="flex flex-col gap-1 border-t border-line pt-4">
          <p className="text-sm text-ink-muted">{t.adultsOnly}</p>
          <Checkbox label={t.adultCheck} checked={adult} onChange={(v) => { setAdult(v.target.checked); clear('adult') }} error={errors.adult} />
          <Checkbox label={t.termsCheck} checked={terms} onChange={(v) => { setTerms(v.target.checked); clear('terms') }} error={errors.terms}>
            <p className="flex flex-wrap gap-x-4 ps-9 text-sm">
              <TextLink to={localPath(lang, 'legal/terms')} target="_blank">{t.readTerms}</TextLink>
              <TextLink to={localPath(lang, 'legal/privacy')} target="_blank">{t.readPrivacy}</TextLink>
            </p>
          </Checkbox>
          <Checkbox label={t.marketingCheck} checked={marketing} onChange={(v) => setMarketing(v.target.checked)}>
            <p className="ps-9 text-sm text-ink-muted">{t.marketingHint}</p>
          </Checkbox>
        </div>
        <p className="text-sm text-ink-muted">{t.dataNote}</p>
        {formError && <Notice tone="error">{errorText(dict, formError)}</Notice>}
        <Button type="submit" busy={busy} wide>{t.submitSignUp}</Button>
        <p className="flex flex-wrap items-center gap-x-2 text-ink-muted">
          {t.haveAccount}
          <Link to={localPath(lang, 'sign-in')} className="inline-flex min-h-11 items-center font-medium text-ink underline underline-offset-4">{t.signInLink}</Link>
        </p>
      </form>
    </Shell>
  )
}
