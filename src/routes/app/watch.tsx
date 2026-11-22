import { useCallback } from 'react'
import { Link, useParams } from 'react-router'
import { errorText } from '@/features/account/messages'
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

/** "Watch": the story's film, on its own calm page, with a way back to the storybook. */
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
  const title = content?.title ?? summary?.title ?? ''

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      <Link to={localPath(lang, `app/story/${id}`)} className="inline-flex min-h-11 items-center gap-2 self-start font-medium underline-offset-4 hover:underline">
        <IconArrow className="size-5 -scale-x-100 rtl:scale-x-100" />
        {title ? <bdi>{title}</bdi> : dict.stories.doors.backToLibrary}
      </Link>
      {title && <h1 className="text-2xl font-semibold sm:text-3xl" lang={content?.lang}><bdi>{title}</bdi></h1>}
      {loading && <Spinner label={dict.account.states.loading} />}
      {error === 'locked' && <Notice title={dict.stories.doors.lockedTitle} action={<ButtonLink to={localPath(lang, 'app/plans')}>{dict.commerce.access.seePasses}</ButtonLink>}><p>{dict.stories.doors.lockedLead}</p></Notice>}
      {error && error !== 'locked' && <Notice tone="error" action={<Button onClick={reload}>{dict.account.errors.retry}</Button>}>{errorText(dict, error)}</Notice>}
      {content && !content.film && <Notice title={dict.stories.film.notReady} />}
      {content?.film && (
        <Film film={content.film} title={title} lang={content.film.captionsLang} memoryKey={`storytime.film.${active?.id ?? 'account'}.${id}`}
          captions={prefs.captions} onCaptions={onCaptions} onWatched={onWatched} autoStart />
      )}
    </div>
  )
}
