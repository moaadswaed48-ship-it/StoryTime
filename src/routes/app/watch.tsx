import { useCallback } from 'react'
import { Link, useParams } from 'react-router'
import { errorText } from '@/features/account/messages'
import { useClassroom } from '@/features/classroom/useClassroom'
import { Film } from '@/features/film/Film'
import { IconArrow } from '@/features/family/icons'
import { usePrefs } from '@/features/family/prefs'
import { useLearners, useProgress } from '@/features/family/useFamily'
import { useStory } from '@/features/family/useStory'
import { useLang } from '@/i18n/use-dict'
import { privateMeta } from '@/seo/meta'
import { localPath } from '@/seo/paths'
import { Button, ButtonLink, Notice, Spinner } from '@/ui/controls'

export const meta = () => privateMeta('StoryTime')

/**
 * "Watch": the story's film, on its own calm page, with a way back to the storybook. In classroom mode (a teacher's
 * big screen) the film takes as much of the screen as fits above its controls, with larger controls and captions
 * (film.css), and a large way back. On a short screen (a phone held sideways, a short laptop window) the film
 * never shrinks below 28rem wide (or the screen's width): the page then scrolls a little instead (review 26 Nov, 5).
 */
export default function Watch() {
  const { lang, dict } = useLang()
  const { id = '' } = useParams()
  const { summary, content, error, loading, reload } = useStory(id)
  const { active } = useLearners()
  const progress = useProgress(active?.id ?? null)
  const [prefs, setPrefs] = usePrefs()
  const save = progress.save
  const onWatched = useCallback(() => void save(id, { filmWatched: true }), [save, id])
  const onCaptions = useCallback((on: boolean) => setPrefs({ captions: on }), [setPrefs])
  const onPosition = useCallback((at: number | null) => void save(id, { filmPositionS: at }), [save, id])
  const title = content?.title ?? summary?.title ?? ''
  const room = useClassroom().on

  return (
    <div className={`mx-auto flex w-full flex-col ${room ? 'max-w-[max(28rem,calc((100dvh-22rem)*16/9))] min-w-0 gap-3' : 'max-w-4xl gap-5'}`} data-testid="watch-page">
      <Link to={localPath(lang, `app/story/${id}`)} className={`inline-flex items-center gap-2 self-start font-medium underline-offset-4 hover:underline ${room ? 'min-h-14 rounded-control border border-ink/30 bg-surface px-4 text-lg no-underline' : 'min-h-11'}`}>
        <IconArrow className={`${room ? 'size-7' : 'size-5'} -scale-x-100 rtl:scale-x-100`} />
        {title ? <bdi>{title}</bdi> : dict.stories.doors.backToLibrary}
      </Link>
      {title && !room && <h1 className="text-2xl font-semibold sm:text-3xl" lang={content?.lang}><bdi>{title}</bdi></h1>}
      {title && room && <h1 className="sr-only" lang={content?.lang}><bdi>{title}</bdi></h1>}
      {loading && <Spinner label={dict.account.states.loading} />}
      {/* On the class screen no button leads to the passes (for grown-ups, outside classroom mode). */}
      {error === 'locked' && (room
        ? <Notice title={dict.stories.doors.lockedTitle}><p>{dict.stories.classroom.lockedLead}</p></Notice>
        : <Notice title={dict.stories.doors.lockedTitle} action={<ButtonLink to={localPath(lang, 'app/plans')}>{dict.commerce.access.seePasses}</ButtonLink>}><p>{dict.stories.doors.lockedLead}</p></Notice>)}
      {error && error !== 'locked' && <Notice tone="error" action={<Button onClick={reload}>{dict.account.errors.retry}</Button>}>{errorText(dict, error)}</Notice>}
      {/* No film file yet: an honest note and no player (a player without a file would only show an error). */}
      {content && !content.film?.videoUrl && <Notice title={dict.stories.film.notReady} />}
      {content?.film?.videoUrl && (
        <Film film={content.film} title={title} lang={content.film.captionsLang} memoryKey={`storytime.film.${active?.id ?? 'account'}.${id}`}
          captions={prefs.captions} onCaptions={onCaptions} onWatched={onWatched} autoStart
          savedAt={progress.byStory[id]?.filmPositionS ?? null} onPosition={active ? onPosition : undefined} />
      )}
    </div>
  )
}
