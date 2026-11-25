import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { getApi } from '@/data'
import { codeOf } from '@/data/errors'
import { errorText } from '@/features/account/messages'
import { useSession } from '@/features/account/session'
import { fmt } from '@/i18n/format'
import { useLang } from '@/i18n/use-dict'
import { privateMeta } from '@/seo/meta'
import { localPath } from '@/seo/paths'
import { Button, ButtonLink, Notice, Spinner } from '@/ui/controls'
import { Shell } from '@/ui/Shell'

export const meta = () => privateMeta('StoryTime')

/**
 * The link from the "confirm your new address" email: changes the account's sign-in address and signs in.
 * A used or expired link says so, with the way back to Settings to ask for a new one.
 */
export default function ConfirmEmail() {
  const { lang, dict } = useLang()
  const t = dict.account.auth
  const [params] = useSearchParams()
  const session = useSession()
  const [state, setState] = useState<'working' | 'done' | 'expired' | 'error'>('working')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const started = useRef(false)

  const run = async () => {
    setState('working')
    try {
      const s = await (await getApi()).completeLink('email_change', params)
      setEmail(s.email)
      await session.refresh()
      setState('done')
    } catch (err) {
      const code = codeOf(err)
      if (code === 'link_expired') setState('expired')
      else {
        setError(errorText(dict, code))
        setState('error')
      }
    }
  }

  useEffect(() => {
    if (started.current) return // a link works once: never run it twice (React development double-mount)
    started.current = true
    void run()
  })

  return (
    <Shell narrow>
      {state === 'working' && <Spinner label={t.confirmWorking} />}
      {state === 'done' && (
        <Notice tone="success" title={t.emailChangedTitle} action={<ButtonLink to={localPath(lang, 'app/library')}>{t.emailChangedContinue}</ButtonLink>}>
          <p data-testid="email-changed">{fmt(t.emailChangedLead, { email: `\u2068${email}\u2069` })}</p>
        </Notice>
      )}
      {state === 'expired' && (
        <Notice tone="warning" title={t.linkExpiredTitle} action={<ButtonLink to={localPath(lang, 'app/settings')}>{dict.account.settings.changeEmail}</ButtonLink>}>
          <p>{t.linkExpiredLead}</p>
        </Notice>
      )}
      {state === 'error' && <Notice tone="error" action={<Button onClick={run}>{dict.account.errors.retry}</Button>}>{error}</Notice>}
    </Shell>
  )
}
