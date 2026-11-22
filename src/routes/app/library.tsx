import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { getApi } from '@/data'
import { codeOf, type ErrorCode } from '@/data/errors'
import { hasAccessToStory } from '@/data/rules'
import { AGE_GROUPS, type AgeGroup, type StorySummary } from '@/data/types'
import { AccessPanel } from '@/features/access/AccessPanel'
import { useAccess } from '@/features/access/useAccess'
import { errorText } from '@/features/account/messages'
import { useSession } from '@/features/account/session'
import { useLang } from '@/i18n/use-dict'
import { privateMeta } from '@/seo/meta'
import { localPath } from '@/seo/paths'
import { Button, ChoiceGroup, Notice, PlaceholderTag, Spinner } from '@/ui/controls'

export const meta = () => privateMeta('StoryTime')

/**
 * Interim library (Stage 4 part A): the access panel and a plain list of the age group's stories, open or locked.
 * The bookshelf replaces the list in part B; the access logic stays.
 */
export default function Library() {
  const { lang, dict } = useLang()
  const t = dict.commerce.access
  const session = useSession()
  const { access, error: accessError, reload } = useAccess()
  const [group, setGroup] = useState<AgeGroup | null>(null)
  const [stories, setStories] = useState<StorySummary[] | null>(null)
  const [error, setError] = useState<ErrorCode | null>(null)
  const storyLang = (session.status === 'signed-in' && session.account?.storyLanguage) || lang

  // Start on the trial's group, else the first profile's group.
  useEffect(() => {
    if (group || !access) return
    if (access.trial) return setGroup(access.trial.ageGroup)
    getApi().then((a) => a.listLearners()).then((l) => setGroup(l[0]?.ageGroup ?? access.passes[0]?.ageGroup ?? '4-5'), () => setGroup('4-5'))
  }, [access, group])

  const load = async (g: AgeGroup) => {
    setStories(null)
    setError(null)
    try {
      setStories(await (await getApi()).listStories(storyLang, g))
    } catch (e) {
      setError(codeOf(e))
    }
  }
  useEffect(() => {
    if (group) void load(group)
  }, [group, storyLang]) // eslint-disable-line react-hooks/exhaustive-deps

  const startTrial = async () => {
    try {
      await (await getApi()).startTrial(group ?? '4-5')
      await reload()
    } catch (e) {
      setError(codeOf(e))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold">{dict.pages.app.library}</h1>
      {accessError && <Notice tone="error" action={<Button onClick={reload}>{dict.account.errors.retry}</Button>}>{errorText(dict, accessError)}</Notice>}
      {access && <AccessPanel access={access} onStartTrial={startTrial} />}
      {group && (
        <ChoiceGroup legend={dict.commerce.plans.groupLegend} name="library-group" value={group} onChange={setGroup} columns={3} compact
          options={AGE_GROUPS.map((g) => ({ value: g, label: dict.commerce.groups[g] }))} />
      )}
      <p role="note" className="rounded-control border border-dashed border-ink-muted px-3 py-2 text-sm text-ink-muted">{t.interimList} {t.samplesNote}</p>
      {error && <Notice tone="error" action={group && <Button onClick={() => load(group)}>{dict.account.errors.retry}</Button>}>{errorText(dict, error)}</Notice>}
      {!stories && !error && <Spinner label={dict.account.states.loading} />}
      {stories && !stories.length && <p>{dict.account.errors.noTrialStories}</p>}
      {stories && access && (
        <ul className="grid gap-3 sm:grid-cols-2" data-testid="story-list">
          {stories.map((s) => {
            const open = hasAccessToStory(access, { id: s.id, published: true, ageGroups: s.ageGroups })
            return (
              <li key={s.id}>
                <Link to={localPath(lang, `app/story/${s.id}`)} data-state={open ? 'open' : 'locked'} className="flex min-h-16 flex-col gap-1 rounded-control border border-line bg-surface p-4 hover:border-ink">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-medium" lang={storyLang}><bdi>{s.title}</bdi></span>
                    {s.isSample && <PlaceholderTag>{t.sample}</PlaceholderTag>}
                  </span>
                  <span className={`text-sm font-medium ${open ? 'text-green-900' : 'text-ink-muted'}`}>
                    <span aria-hidden="true">{open ? '○ ' : '■ '}</span>{open ? t.open : t.locked}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
