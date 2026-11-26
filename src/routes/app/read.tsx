import { useCallback, useMemo } from 'react'
import { useSearchParams, useParams } from 'react-router'
import { isPassCurrent, isTrialActive } from '@/data/rules'
import { useAccess } from '@/features/access/useAccess'
import { errorText } from '@/features/account/messages'
import { useClassroom } from '@/features/classroom/useClassroom'
import { useLearners, useProgress } from '@/features/family/useFamily'
import { useStory } from '@/features/family/useStory'
import { Reader } from '@/features/reader/Reader'
import { useLang } from '@/i18n/use-dict'
import { privateMeta } from '@/seo/meta'
import { localPath } from '@/seo/paths'
import { Button, ButtonLink, Notice, Spinner } from '@/ui/controls'

export const meta = () => privateMeta('StoryTime')

/**
 * "Read" and "Listen": the book. ?page=n opens at story page n; ?listen=1 starts the voice (and skips the title).
 * The reader saves the page reached to the active profile's progress.
 */
export default function Read() {
  const { lang, dict } = useLang()
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const { summary, content, error, loading, reload } = useStory(id)
  const { active } = useLearners()
  const progress = useProgress(active?.id ?? null)
  const { access } = useAccess()
  const classroom = useClassroom()
  const back = localPath(lang, `app/story/${id}`)
  const listen = params.get('listen') === '1'
  const page = Number(params.get('page')) || 0
  const save = progress.save
  const onPage = useCallback((n: number) => void save(id, { lastPage: n }), [save, id])

  // When this story's access ends, on this device's clock (corrected by the server's clock in the snapshot).
  const accessEndsAt = useMemo(() => {
    if (!access || !summary) return null
    const skew = Date.parse(access.now) - Date.now()
    const ends: number[] = []
    if (isTrialActive(access.trial, access.now) && access.trial.storyIds.includes(id)) ends.push(Date.parse(access.trial.endsAt))
    for (const p of access.passes) if (isPassCurrent(p, access.now) && summary.ageGroups.includes(p.ageGroup)) ends.push(Date.parse(p.endsAt))
    return access.role === 'owner' || !ends.length ? null : Math.max(...ends) - skew
  }, [access, summary, id])

  if (loading) return <Spinner label={dict.stories.reader.loading} />
  if (error || !content) {
    return error === 'locked'
      ? <Notice title={dict.stories.doors.lockedTitle} action={<ButtonLink to={localPath(lang, 'app/plans')}>{dict.commerce.access.seePasses}</ButtonLink>}><p>{dict.stories.doors.lockedLead}</p></Notice>
      : <Notice tone="error" action={<><Button onClick={reload}>{dict.account.errors.retry}</Button><ButtonLink to={back} variant="secondary">{dict.stories.reader.close}</ButtonLink></>}>{errorText(dict, error ?? 'unknown')}</Notice>
  }
  const group = active && summary?.ageGroups.includes(active.ageGroup) ? active.ageGroup : summary?.ageGroups[0] ?? '4-5'
  return (
    <Reader
      content={content}
      group={group}
      startPage={listen ? Math.max(1, page) : page}
      listen={listen}
      closeTo={back}
      onPage={onPage}
      accessEndsAt={accessEndsAt}
      classroom={classroom.on}
      endActions={
        <>
          {content.film?.videoUrl && <ButtonLink to={`${back}/watch`} variant="secondary">{dict.stories.doors.watch}</ButtonLink>}
          {content.activity && <ButtonLink to={`${back}/do`} variant="secondary">{dict.stories.doors.do}</ButtonLink>}
          <ButtonLink to={back} variant="quiet">{dict.stories.reader.close}</ButtonLink>
        </>
      }
      accessEnded={
        <Notice title={dict.stories.reader.accessEndedTitle} action={<><ButtonLink to={localPath(lang, 'app/plans')}>{dict.commerce.access.seePasses}</ButtonLink><ButtonLink to={localPath(lang, 'app/library')} variant="secondary">{dict.stories.doors.backToLibrary}</ButtonLink></>}>
          <p>{dict.stories.reader.accessEndedLead}</p>
        </Notice>
      }
    />
  )
}
