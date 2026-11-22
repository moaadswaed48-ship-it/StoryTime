import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { getApi } from '@/data'
import { codeOf, type ErrorCode } from '@/data/errors'
import { addDays, TRIAL_DAYS } from '@/data/rules'
import { AGE_GROUPS, type AgeGroup, type StorySummary } from '@/data/types'
import { errorText } from '@/features/account/messages'
import { useSession } from '@/features/account/session'
import { ENDONYM, LANGS, type Lang } from '@/i18n/config'
import { fmt, formatDate } from '@/i18n/format'
import { useLang } from '@/i18n/use-dict'
import { privateMeta } from '@/seo/meta'
import { localPath } from '@/seo/paths'
import { Button, ChoiceGroup, Notice, Spinner, TextField } from '@/ui/controls'

export const meta = () => privateMeta('StoryTime')

const TOTAL = 4

/**
 * Onboarding after the email is confirmed: story language, age group, a child profile (or a class for kindergarten
 * staff, with no children's names), then the trial screen. Parent or teacher was chosen at sign-up. Every step can
 * be skipped with a sensible default; it ends inside the first trial story.
 */
export default function Welcome() {
  const { lang, dict } = useLang()
  const t = dict.account.onboarding
  const navigate = useNavigate()
  const session = useSession()
  const account = session.status === 'signed-in' ? session.account : null
  const teacher = account?.role === 'teacher'
  const [step, setStep] = useState(1)
  const [storyLang, setStoryLang] = useState<Lang>(lang)
  const [group, setGroup] = useState<AgeGroup | null>(null)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<ErrorCode | null>(null)
  const [trialStories, setTrialStories] = useState<StorySummary[] | null>(null)
  const [trialUsed, setTrialUsed] = useState(false)

  useEffect(() => {
    if (step !== 4 || !group) return
    let alive = true
    getApi().then(async (a) => {
      const [list, access] = await Promise.all([a.listStories(storyLang, group), a.getAccess()])
      if (!alive) return
      setTrialStories(list.filter((s) => s.trialIn.includes(group)).slice(0, 3))
      setTrialUsed(!!access.trial)
    }).catch((e) => alive && setError(codeOf(e)))
    return () => void (alive = false)
  }, [step, group, storyLang])

  const go = async (fn: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
    } catch (e) {
      setError(codeOf(e))
    } finally {
      setBusy(false)
    }
  }

  const saveLanguage = () => go(async () => {
    await (await getApi()).updateAccount({ storyLanguage: storyLang })
    setStep(2)
  })
  const saveGroup = (g: AgeGroup) => {
    setGroup(g)
    setStep(3)
  }
  const saveProfile = (e?: FormEvent) => {
    e?.preventDefault()
    return go(async () => {
      const a = await getApi()
      const existing = await a.listLearners()
      if (!existing.length) await a.addLearner({ name: name.trim() || (teacher ? t.classDefault : t.childDefault), ageGroup: group ?? '4-5' })
      setStep(4)
    })
  }
  const finish = (startTrial: boolean) => go(async () => {
    const a = await getApi()
    let first: string | null = null
    if (startTrial) {
      const trial = await a.startTrial(group ?? '4-5')
      first = trial.storyIds[0] ?? null
    }
    await a.updateAccount({ onboarded: true })
    await session.refresh()
    navigate(first ? localPath(lang, `app/story/${first}`) : localPath(lang, 'app/library'), { replace: true })
  })

  if (!account) return <Spinner label={dict.account.states.loading} />

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6" data-testid={`onboarding-step-${step}`}>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-ink-muted" aria-live="polite">{fmt(t.stepOf, { n: step, total: TOTAL })}</p>
        {step > 1 && <Button variant="quiet" onClick={() => setStep((s) => s - 1)}>{dict.actions.back}</Button>}
      </div>

      {step === 1 && (
        <section className="flex flex-col gap-5">
          <h1 className="text-3xl font-semibold">{t.languageTitle}</h1>
          <p className="text-ink-muted">{t.languageLead}</p>
          <ChoiceGroup legend={t.languageTitle} legendClass="sr-only" name="story-lang" value={storyLang} onChange={setStoryLang} columns={2} compact
            options={LANGS.map((l) => ({ value: l, label: ENDONYM[l], lang: l }))} />
          <Button onClick={saveLanguage} busy={busy} wide>{dict.actions.next}</Button>
        </section>
      )}

      {step === 2 && (
        <section className="flex flex-col gap-5">
          <h1 className="text-3xl font-semibold">{t.ageTitle}</h1>
          <p className="text-ink-muted">{t.ageLead}</p>
          <ChoiceGroup legend={t.ageTitle} legendClass="sr-only" name="group" value={group} onChange={saveGroup}
            options={AGE_GROUPS.map((g) => ({ value: g, label: dict.commerce.groups[g], hint: dict.commerce.groupHints[g] }))} />
          <Button variant="quiet" onClick={() => saveGroup('4-5')} className="self-start">{t.skip}</Button>
        </section>
      )}

      {step === 3 && (
        <form onSubmit={saveProfile} className="flex flex-col gap-5" noValidate>
          <h1 className="text-3xl font-semibold">{teacher ? t.classTitle : t.childTitle}</h1>
          <p className="text-ink-muted">{teacher ? t.classLead : t.childLead}</p>
          <TextField
            label={teacher ? t.className : t.childName}
            optionalLabel={t.optional}
            hint={teacher ? t.classNameHint : t.childNameHint}
            value={name}
            maxLength={40}
            autoComplete="off"
            onChange={(e) => setName(e.target.value)}
          />
          <Button type="submit" busy={busy} wide>{dict.actions.next}</Button>
          <Button variant="quiet" onClick={() => saveProfile()} className="self-start">{t.skip}</Button>
        </form>
      )}

      {step === 4 && (
        <section className="flex flex-col gap-5">
          <h1 className="text-3xl font-semibold">{t.trialTitle}</h1>
          {trialStories === null && !error ? (
            <Spinner label={dict.account.states.loading} />
          ) : trialUsed ? (
            <>
              <Notice tone="info">{t.trialAlreadyUsed}</Notice>
              <Button onClick={() => finish(false)} busy={busy} wide>{t.toLibrary}</Button>
            </>
          ) : (
            <>
              <p className="text-lg">{t.trialLead}</p>
              {!!trialStories?.length && (
                <div className="flex flex-col gap-2">
                  <h2 className="font-semibold">{t.trialStoriesTitle}</h2>
                  <ul className="flex list-disc flex-col gap-1 ps-6" data-testid="trial-stories">
                    {trialStories.map((s) => <li key={s.id}><bdi>{s.title}</bdi></li>)}
                  </ul>
                </div>
              )}
              <p>{fmt(t.trialEndsAt, { date: formatDate(addDays(new Date().toISOString(), TRIAL_DAYS), lang, true) })}</p>
              <p className="text-ink-muted">{t.trialAfter}</p>
              <Button onClick={() => finish(true)} busy={busy} wide disabled={!trialStories?.length}>{t.trialStart}</Button>
              <Button variant="quiet" onClick={() => finish(false)} className="self-start">{dict.commerce.access.notNow}</Button>
            </>
          )}
        </section>
      )}

      {error && <Notice tone="error">{errorText(dict, error)}</Notice>}
    </div>
  )
}
