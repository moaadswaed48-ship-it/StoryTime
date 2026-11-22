import { useEffect, useState } from 'react'
import { getApi } from '@/data'
import { codeOf } from '@/data/errors'
import { errorText } from '@/features/account/messages'
import { pendingEmail, TestEmailPanel } from '@/features/account/parts'
import { fmt } from '@/i18n/format'
import { useLang } from '@/i18n/use-dict'
import { privateMeta } from '@/seo/meta'
import { localPath } from '@/seo/paths'
import { Button, Notice, TextLink } from '@/ui/controls'
import { PageTitle, Shell } from '@/ui/Shell'

export const meta = () => privateMeta('StoryTime')

const COOLDOWN_S = 60

/** "Check your email", after sign-up: names the address, offers a resend after a short wait, and a way back. */
export default function CheckEmail() {
  const { lang, dict } = useLang()
  const t = dict.account.auth
  const [email, setEmail] = useState('')
  const [wait, setWait] = useState(COOLDOWN_S)
  const [sent, setSent] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => setEmail(pendingEmail.get()), [])
  useEffect(() => {
    if (wait <= 0) return
    const id = setTimeout(() => setWait((w) => w - 1), 1000)
    return () => clearTimeout(id)
  }, [wait])

  const resend = async () => {
    setError(null)
    setBusy(true)
    try {
      await (await getApi()).resendConfirmation(email, lang)
      setSent((n) => n + 1)
      setWait(COOLDOWN_S)
    } catch (err) {
      setError(errorText(dict, codeOf(err)))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Shell narrow>
      <PageTitle title={t.checkTitle} lead={email ? fmt(t.checkLead, { email: `⁨${email}⁩` }) : undefined} />
      <div className="flex flex-col gap-5">
        <p className="text-ink-muted">{t.checkSpam}</p>
        <TestEmailPanel email={email} kind="confirm" refreshKey={sent} />
        {sent > 0 && <Notice tone="success">{t.checkResent}</Notice>}
        {error && <Notice tone="error">{error}</Notice>}
        <div className="flex flex-col gap-2">
          <Button variant="secondary" onClick={resend} disabled={!email || wait > 0} busy={busy} wide>{t.checkResend}</Button>
          {wait > 0 && <p className="text-sm text-ink-muted" aria-live="polite">{t.checkWait}</p>}
        </div>
        <TextLink to={localPath(lang, 'sign-up')}>{t.checkWrong}</TextLink>
        <TextLink to={localPath(lang, 'sign-in')}>{t.signInLink}</TextLink>
      </div>
    </Shell>
  )
}
