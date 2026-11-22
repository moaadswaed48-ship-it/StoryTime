import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { getApi } from '@/data'
import { codeOf } from '@/data/errors'
import { errorText } from '@/features/account/messages'
import { LinkExpired } from '@/features/account/parts'
import { useLang } from '@/i18n/use-dict'
import { privateMeta } from '@/seo/meta'
import { localPath } from '@/seo/paths'
import { Button, Notice, Spinner } from '@/ui/controls'
import { Shell } from '@/ui/Shell'

export const meta = () => privateMeta('StoryTime')

/** The confirmation link from the sign-up email: signs in and continues onboarding where it stopped. */
export default function Confirm() {
  const { lang, dict } = useLang()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [state, setState] = useState<'working' | 'expired' | 'error'>('working')
  const [error, setError] = useState('')
  const started = useRef(false)

  const run = async () => {
    setState('working')
    try {
      await (await getApi()).completeLink('signup', params)
      navigate(localPath(lang, 'app'), { replace: true })
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
      {state === 'working' && <Spinner label={dict.account.auth.confirmWorking} />}
      {state === 'expired' && <LinkExpired kind="confirm" />}
      {state === 'error' && <Notice tone="error" action={<Button onClick={run}>{dict.account.errors.retry}</Button>}>{error}</Notice>}
    </Shell>
  )
}
