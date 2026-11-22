import { useState } from 'react'
import { isPassCurrent, isTrialActive, isTrialEnded, timeLeft } from '@/data/rules'
import { AGE_GROUPS, type AccessSnapshot } from '@/data/types'
import { fmt, formatDate } from '@/i18n/format'
import { useLang } from '@/i18n/use-dict'
import { localPath } from '@/seo/paths'
import { Button, ButtonLink, Notice } from '@/ui/controls'

const DISMISS_KEY = 'storytime.access.dismissed'

/**
 * What the account can open right now, said calmly: the trial counter, the active passes, or the one screen that
 * says a trial or pass has ended (stories lock; profiles and progress are kept). "See passes" goes to the plans
 * inside the app, which sit behind the parent gate.
 */
export function AccessPanel({ access, onStartTrial }: { access: AccessSnapshot; onStartTrial?: () => void }) {
  const { lang, dict } = useLang()
  const t = dict.commerce.access
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem(DISMISS_KEY) === '1' } catch { return false }
  })
  const dismiss = () => {
    try { sessionStorage.setItem(DISMISS_KEY, '1') } catch { /* private tab */ }
    setDismissed(true)
  }
  const plans = localPath(lang, 'app/plans')
  const current = access.passes.filter((p) => isPassCurrent(p, access.now))
  const currentGroups = new Set(current.map((p) => p.ageGroup))
  const endedGroups = AGE_GROUPS.filter((g) => !currentGroups.has(g) && access.passes.some((p) => p.ageGroup === g && p.status === 'active' && new Date(p.endsAt) <= new Date(access.now)))
  const trialActive = isTrialActive(access.trial, access.now)

  return (
    <div className="flex flex-col gap-3" data-testid="access-panel">
      {trialActive && access.trial && (
        <Notice tone="info" title={fmt(t.trialActive, timeLeft(access.trial.endsAt, access.now))}>
          <p>{t.trialStoriesNote}</p>
        </Notice>
      )}
      {current.map((p) => (
        <Notice key={p.id} tone="success" title={fmt(t.activePass, { group: dict.commerce.groups[p.ageGroup], date: formatDate(p.endsAt, lang) })} />
      ))}
      {!dismissed && endedGroups.map((g) => (
        <Notice key={g} tone="warning" title={t.passEndedTitle} action={<><ButtonLink to={plans}>{t.buyNew}</ButtonLink><Button variant="secondary" onClick={dismiss}>{t.notNow}</Button></>}>
          <p>{fmt(t.passEndedLead, { group: dict.commerce.groups[g] })}</p>
        </Notice>
      ))}
      {!dismissed && !current.length && !endedGroups.length && isTrialEnded(access.trial, access.now) && (
        <Notice tone="warning" title={t.trialEndedTitle} action={<><ButtonLink to={plans}>{t.seePasses}</ButtonLink><Button variant="secondary" onClick={dismiss}>{t.notNow}</Button></>}>
          <p>{t.trialEndedLead}</p>
        </Notice>
      )}
      {!access.trial && !current.length && !endedGroups.length && (
        <Notice tone="info" title={t.noAccessTitle} action={<>{onStartTrial && <Button onClick={onStartTrial}>{t.startTrial}</Button>}<ButtonLink to={plans} variant="secondary">{t.seePasses}</ButtonLink></>}>
          <p>{t.noAccessLead}</p>
        </Notice>
      )}
    </div>
  )
}
