import { Link, useParams } from 'react-router'
import { errorText } from '@/features/account/messages'
import { useSession } from '@/features/account/session'
import { useClassroom } from '@/features/classroom/useClassroom'
import { ActivityView } from '@/features/family/ActivityView'
import { IconArrow } from '@/features/family/icons'
import { useLearners, useProgress } from '@/features/family/useFamily'
import { useStory } from '@/features/family/useStory'
import { useLang } from '@/i18n/use-dict'
import { privateMeta } from '@/seo/meta'
import { localPath } from '@/seo/paths'
import { Button, ButtonLink, Notice, Spinner } from '@/ui/controls'

export const meta = () => privateMeta('StoryTime')

/** The activity page of one story ("Do"). Teachers see the class note first; in classroom mode, one card at a time. */
export default function Do() {
  const { lang, dict } = useLang()
  const { id = '' } = useParams()
  const { summary, content, error, loading, reload } = useStory(id)
  const { active } = useLearners()
  const progress = useProgress(active?.id ?? null)
  const back = localPath(lang, `app/story/${id}`)
  const title = content?.title ?? summary?.title
  const session = useSession()
  const teacher = session.status === 'signed-in' && session.account?.role === 'teacher'
  const room = useClassroom().on

  return (
    <div className="flex flex-col gap-6">
      <Link to={back} className={`inline-flex items-center gap-2 self-start font-medium underline-offset-4 hover:underline ${room ? 'min-h-14 rounded-control border border-ink/30 bg-surface px-4 text-lg no-underline' : 'min-h-11'}`} data-no-print>
        <IconArrow className={`${room ? 'size-7' : 'size-5'} -scale-x-100 rtl:scale-x-100`} />
        {title ? <bdi>{title}</bdi> : dict.stories.doors.backToLibrary}
      </Link>
      {loading && <Spinner label={dict.account.states.loading} />}
      {/* On the class screen no button leads to the passes (for grown-ups, outside classroom mode). */}
      {error === 'locked' && (room
        ? <Notice title={dict.stories.doors.lockedTitle}><p>{dict.stories.classroom.lockedLead}</p></Notice>
        : <Notice title={dict.stories.doors.lockedTitle} action={<ButtonLink to={localPath(lang, 'app/plans')}>{dict.commerce.access.seePasses}</ButtonLink>}><p>{dict.stories.doors.lockedLead}</p></Notice>)}
      {error && error !== 'locked' && <Notice tone="error" action={<Button onClick={reload}>{dict.account.errors.retry}</Button>}>{errorText(dict, error)}</Notice>}
      {content && !content.activity && <Notice title={dict.stories.doors.noActivity} />}
      {content?.activity && (
        <ActivityView activity={content.activity} lang={content.lang} done={!!progress.byStory[id]?.activityDone} learnerName={active?.name ?? null}
          onDone={active ? (done) => void progress.save(id, { activityDone: done }) : null} printable teacher={teacher} classroom={room} />
      )}
    </div>
  )
}
