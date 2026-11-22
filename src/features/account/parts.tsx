import { useEffect, useState, type FormEvent } from 'react'
import { getApi } from '@/data'
import { codeOf } from '@/data/errors'
import type { LocalApi } from '@/data/local'
import type { Lang } from '@/i18n/config'
import { useLang } from '@/i18n/use-dict'
import { localPath } from '@/seo/paths'
import { Button, ButtonLink, Notice, TextField } from '@/ui/controls'
import { errorText } from './messages'

const PENDING = 'storytime.pendingEmail'

/** The address a sign-up or reset was sent to, kept for this tab only (not put in the URL). */
export const pendingEmail = {
  get: () => { try { return sessionStorage.getItem(PENDING) ?? '' } catch { return '' } },
  set: (v: string) => { try { sessionStorage.setItem(PENDING, v) } catch { /* private tab */ } },
}

const DELETED = 'storytime.justDeleted'

/** Set just before an account is deleted, so the app shows "account deleted" rather than "please sign in". */
export const justDeleted = {
  mark: () => { try { sessionStorage.setItem(DELETED, '1') } catch { /* private tab */ } },
  check: () => { try { return sessionStorage.getItem(DELETED) === '1' } catch { return false } },
  clear: () => { try { sessionStorage.removeItem(DELETED) } catch { /* private tab */ } },
}

/** A "?next=" target is used only if it is a path inside this site, never another host. */
export function safeNext(next: string | null, lang: Lang): string | null {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return null
  return /^\/(ar|he|en|da)\//.test(next) ? next : localPath(lang, next.replace(/^\/+/, ''))
}

/** Where to send someone who must sign in first, so they come back to the same page. */
export function signInPath(lang: Lang, here: string) {
  return `${localPath(lang, 'sign-in')}?next=${encodeURIComponent(here)}`
}

/**
 * Test mode only: shows the link the email would have carried, since no email is sent yet. Reads the local
 * backend's outbox. Nothing is shown with the Supabase backend, where real emails go out.
 */
export function TestEmailPanel({ email, kind, refreshKey }: { email: string; kind: 'confirm' | 'reset'; refreshKey?: unknown }) {
  const { dict } = useLang()
  const [link, setLink] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    getApi().then((a) => {
      if (!alive || a.kind !== 'local' || !email) return
      const mail = (a as LocalApi).server.outbox().filter((m) => m.to === email.trim().toLowerCase() && m.template === kind).at(-1)
      setLink(mail?.link ?? null)
    })
    return () => void (alive = false)
  }, [email, kind, refreshKey])
  if (!link) return null
  return (
    <Notice tone="info" title={dict.account.auth.testEmailTitle}>
      <p className="text-sm">{dict.account.auth.testEmailLead}</p>
      <div>
        <a href={link} data-testid="test-email-link" className="inline-flex min-h-12 items-center rounded-control border border-ink px-4 font-medium underline underline-offset-4">
          {kind === 'confirm' ? dict.account.auth.testOpenConfirm : dict.account.auth.testOpenReset}
        </a>
      </div>
    </Notice>
  )
}

/** "This link has expired": ask for a new one by email (confirmation link or password link). */
export function LinkExpired({ kind }: { kind: 'confirm' | 'reset' }) {
  const { lang, dict } = useLang()
  const t = dict.account.auth
  const [email, setEmail] = useState(pendingEmail.get())
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tries, setTries] = useState(0)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const a = await getApi()
      if (kind === 'confirm') await a.resendConfirmation(email, lang)
      else await a.requestPasswordReset(email, lang)
      pendingEmail.set(email)
      setSent(true)
      setTries((n) => n + 1)
    } catch (err) {
      setError(errorText(dict, codeOf(err)))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-5" data-testid="link-expired">
      <h1 className="text-3xl font-semibold text-balance">{t.linkExpiredTitle}</h1>
      <p className="text-ink-muted">{t.linkExpiredLead}</p>
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <TextField label={t.linkExpiredEmail} type="email" inputMode="email" autoComplete="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} />
        {error && <Notice tone="error">{error}</Notice>}
        {sent && <Notice tone="success">{kind === 'confirm' ? t.checkResent : t.forgotSent.replace('{email}', email)}</Notice>}
        <Button type="submit" busy={busy} wide>{t.linkExpiredSend}</Button>
      </form>
      {sent && <TestEmailPanel email={email} kind={kind} refreshKey={tries} />}
      <ButtonLink to={localPath(lang, 'sign-in')} variant="quiet">{t.backToSignIn}</ButtonLink>
    </div>
  )
}
