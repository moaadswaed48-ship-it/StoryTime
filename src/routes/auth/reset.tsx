import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router'
import { getApi } from '@/data'
import { codeOf } from '@/data/errors'
import { MIN_PASSWORD } from '@/data/validate'
import { errorText, strengthOf } from '@/features/account/messages'
import { LinkExpired } from '@/features/account/parts'
import { useLang } from '@/i18n/use-dict'
import { privateMeta } from '@/seo/meta'
import { localPath } from '@/seo/paths'
import { Button, ButtonLink, Notice, PasswordField, Spinner } from '@/ui/controls'
import { PageTitle, Shell } from '@/ui/Shell'

export const meta = () => privateMeta('StoryTime')

/** The password link from the reset email: opens it once, then asks for a new password. */
export default function Reset() {
  const { lang, dict } = useLang()
  const t = dict.account.auth
  const [params] = useSearchParams()
  const [state, setState] = useState<'working' | 'form' | 'expired' | 'done'>('working')
  const [password, setPassword] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    getApi()
      .then((a) => a.completeLink('recovery', params))
      .then(() => setState('form'), () => setState('expired'))
  })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < MIN_PASSWORD) return setFieldError(dict.account.errors.weakPassword)
    setFieldError(null)
    setBusy(true)
    try {
      await (await getApi()).setPassword(password)
      setState('done')
    } catch (err) {
      setError(errorText(dict, codeOf(err)))
    } finally {
      setBusy(false)
    }
  }

  const strength = strengthOf(password)
  return (
    <Shell narrow>
      {state === 'working' && <Spinner label={t.confirmWorking} />}
      {state === 'expired' && <LinkExpired kind="reset" />}
      {state === 'form' && (
        <>
          <PageTitle title={t.resetTitle} />
          <form onSubmit={submit} noValidate className="flex flex-col gap-5">
            <PasswordField label={t.newPassword} autoComplete="new-password" hint={t.passwordHint} value={password} onChange={(e) => setPassword(e.target.value)} error={fieldError} showLabel={t.showPassword} hideLabel={t.hidePassword} strength={strength ? t.strength[strength] : null} />
            {error && <Notice tone="error">{error}</Notice>}
            <Button type="submit" busy={busy} wide>{t.resetSubmit}</Button>
          </form>
        </>
      )}
      {state === 'done' && (
        <Notice tone="success" title={t.resetDone} action={<ButtonLink to={localPath(lang, 'app')}>{dict.account.onboarding.toLibrary}</ButtonLink>} />
      )}
    </Shell>
  )
}
