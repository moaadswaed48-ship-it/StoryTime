import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { getApi } from '@/data'
import { codeOf, type ErrorCode } from '@/data/errors'
import type { StoryContent, StorySummary } from '@/data/types'
import { errorText } from '@/features/account/messages'
import { useSession } from '@/features/account/session'
import { fmt } from '@/i18n/format'
import { useLang } from '@/i18n/use-dict'
import { privateMeta } from '@/seo/meta'
import { localPath } from '@/seo/paths'
import { Button, ButtonLink, Notice, PlaceholderTag, Spinner } from '@/ui/controls'

export const meta = () => privateMeta('StoryTime')

/**
 * Interim story view (Stage 4 part A). Proves the access path: the text is fetched from the data layer only with
 * an active trial or pass; otherwise the locked view shows the title and what opens it. The storybook page and the
 * reader replace this in part B.
 */
export default function Story() {
  const { lang, dict } = useLang()
  const t = dict.commerce.access
  const { id = '' } = useParams()
  const session = useSession()
  const storyLang = (session.status === 'signed-in' && session.account?.storyLanguage) || lang
  const [summary, setSummary] = useState<StorySummary | null>(null)
  const [content, setContent] = useState<StoryContent | null>(null)
  const [error, setError] = useState<ErrorCode | null>(null)

  const load = async () => {
    setError(null)
    setContent(null)
    try {
      const a = await getApi()
      const list = await a.listStories(storyLang)
      setSummary(list.find((s) => s.id === id) ?? null)
      setContent(await a.getStoryContent(id, storyLang))
    } catch (e) {
      setError(codeOf(e))
    }
  }
  useEffect(() => void load(), [id, storyLang]) // eslint-disable-line react-hooks/exhaustive-deps

  const title = summary ? <bdi lang={storyLang}>{summary.title}</bdi> : dict.pages.app.story
  return (
    <article className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold">{title}</h1>
        {summary?.isSample && <PlaceholderTag>{t.sample}</PlaceholderTag>}
      </div>
      {!content && !error && <Spinner label={dict.account.states.loading} />}
      {error === 'locked' && (
        <Notice tone="info" title={t.locked} action={<ButtonLink to={localPath(lang, 'app/plans')}>{t.seePasses}</ButtonLink>}>
          <p>{t.lockedLead}</p>
          <p className="text-sm text-ink-muted">{t.keptNote}</p>
        </Notice>
      )}
      {error && error !== 'locked' && <Notice tone="error" action={<Button onClick={load}>{dict.account.errors.retry}</Button>}>{errorText(dict, error)}</Notice>}
      {content && (
        <>
          <p role="note" className="rounded-control border border-dashed border-ink-muted px-3 py-2 text-sm text-ink-muted">{t.interimStory}</p>
          <ol className="flex flex-col gap-4" data-testid="story-pages" lang={content.lang}>
            {content.pages.map((p) => (
              <li key={p.pageNo} className="rounded-control border border-line bg-surface p-5">
                <p className="mb-2 text-sm text-ink-muted">{fmt(t.page, { n: p.pageNo })}</p>
                <p className="text-lg">{p.display}</p>
              </li>
            ))}
          </ol>
        </>
      )}
      <ButtonLink to={localPath(lang, 'app/library')} variant="quiet" className="self-start">{dict.common.nav.library}</ButtonLink>
    </article>
  )
}
