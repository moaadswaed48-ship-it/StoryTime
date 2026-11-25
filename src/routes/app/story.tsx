import type { ComponentType, ReactNode, SVGProps } from 'react'
import { Link, useParams } from 'react-router'
import { errorText } from '@/features/account/messages'
import { Cover } from '@/features/family/Cover'
import { DoorDo, DoorListen, DoorRead, DoorWatch, IconArrow, IconCheck, IconHeart, IconLock } from '@/features/family/icons'
import { usePrefs } from '@/features/family/prefs'
import { useFavourites, useLearners, useProgress } from '@/features/family/useFamily'
import { useStory } from '@/features/family/useStory'
import { fmt } from '@/i18n/format'
import { useLang } from '@/i18n/use-dict'
import { privateMeta } from '@/seo/meta'
import { localPath } from '@/seo/paths'
import { Button, ButtonLink, Notice, PlaceholderTag, Spinner } from '@/ui/controls'

export const meta = () => privateMeta('StoryTime')

/**
 * The storybook page: the book's own place (owner's request E1, E2). Read, Listen, Watch and Do are four large
 * doors, always all visible, each a picture and one word, so a small child can choose without reading. A door
 * that cannot open yet stays in place and says why (no recording, film not ready, no activity): nothing is hidden.
 * Locked (no trial or pass for this story): cover, title and a short line; the doors lead to the passes, which sit
 * behind the parent gate.
 */
export default function Storybook() {
  const { lang, dict } = useLang()
  const t = dict.stories.doors
  const { id = '' } = useParams()
  const { summary, content, error, loading, reload, storyLang } = useStory(id)
  const { active } = useLearners()
  const progress = useProgress(active?.id ?? null)
  const [prefs, setPrefs] = usePrefs()
  const favourites = useFavourites(active?.id ?? null)
  const p = progress.byStory[id]

  if (loading && !summary) return <Spinner label={dict.account.states.loading} />
  if (!summary) {
    return (
      <Notice tone="error" title={errorText(dict, error ?? 'not_found')} action={<><Button onClick={reload}>{dict.account.errors.retry}</Button><ButtonLink to={localPath(lang, 'app/library')} variant="secondary">{t.backToLibrary}</ButtonLink></>} />
    )
  }
  const locked = error === 'locked'
  const base = localPath(lang, `app/story/${id}`)
  const plans = localPath(lang, 'app/plans')
  const f = summary.features
  const hasListen = content ? content.pages.some((x) => x.readAlong) : f?.listen ?? true
  const hasFilm = content ? !!content.film?.videoUrl : f?.film ?? true
  const hasActivity = content ? !!content.activity : f?.activity ?? true
  const credit = (content?.credit ?? summary.credit) === 'author' ? t.authorCredit : t.storyCredit

  return (
    <article className="flex flex-col gap-8" data-testid="storybook" data-state={locked ? 'locked' : content ? 'open' : 'error'}>
      <Link to={localPath(lang, 'app/library')} className="inline-flex min-h-11 items-center gap-2 self-start font-medium underline-offset-4 hover:underline">
        <IconArrow className="size-5 -scale-x-100 rtl:scale-x-100" />
        {t.backToLibrary}
      </Link>

      <header className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-end sm:text-start">
        <Cover story={summary} locked={locked} className="h-56 w-[10.5rem] shrink-0 sm:h-64 sm:w-48" />
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold text-balance sm:text-4xl" lang={storyLang}><bdi>{content?.title ?? summary.title}</bdi></h1>
          <p className="flex flex-wrap items-center justify-center gap-2 text-ink-muted sm:justify-start">
            <span>{credit}</span>
            <span aria-hidden="true">·</span>
            <span>{summary.ageGroups.map((g) => dict.commerce.groups[g]).join(' · ')}</span>
            {summary.isSample && <PlaceholderTag>{dict.commerce.access.sample}</PlaceholderTag>}
          </p>
          {summary.teaser && <p className="max-w-prose text-lg" lang={storyLang}>{summary.teaser}</p>}
          {active && favourites.ids && (() => {
            const on = favourites.ids.includes(id)
            return (
              <button type="button" data-state={on ? 'on' : 'off'} onClick={() => void favourites.toggle(id)} data-testid="favourite"
                className="inline-flex min-h-12 items-center gap-2 self-center rounded-full border-2 border-ink/20 bg-surface px-4 font-medium data-[state=on]:border-ink sm:self-start">
                <IconHeart filled={on} className={`size-6 ${on ? 'text-[#b3261e]' : ''}`} />
                {on ? dict.stories.library.removeFavourite : dict.stories.library.addFavourite}
              </button>
            )
          })()}
          {p && !locked && (
            <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-ink-muted sm:justify-start" data-testid="story-progress">
              {p.lastPage && <li className="inline-flex items-center gap-1"><IconCheck className="size-4" />{fmt(t.progressRead, { n: p.lastPage })}</li>}
              {p.filmWatched && <li className="inline-flex items-center gap-1"><IconCheck className="size-4" />{t.progressWatched}</li>}
              {p.activityDone && <li className="inline-flex items-center gap-1"><IconCheck className="size-4" />{t.progressDone}</li>}
            </ul>
          )}
        </div>
      </header>

      {locked && (
        <Notice title={t.lockedTitle} action={<ButtonLink to={plans}>{dict.commerce.access.seePasses}</ButtonLink>}>
          <p>{t.lockedLead}</p>
        </Notice>
      )}
      {error && !locked && <Notice tone="error" action={<Button onClick={reload}>{dict.account.errors.retry}</Button>}>{errorText(dict, error)}</Notice>}

      {!locked && content && !prefs.hintSeen && (
        <div role="note" className="flex flex-col gap-3 rounded-control border border-ink/20 bg-surface p-4 sm:flex-row sm:items-center sm:justify-between" data-testid="doors-hint">
          <div>
            <p className="font-semibold">{t.hintTitle}</p>
            <p className="text-ink-muted">{t.hintLead}</p>
          </div>
          <Button variant="secondary" onClick={() => setPrefs({ hintSeen: true })}>{t.hintDismiss}</Button>
        </div>
      )}

      <nav aria-label={t.legend}>
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4" data-testid="doors">
          <Door picture={DoorRead} word={t.read} hint={t.readHint} to={locked ? plans : `${base}/read`} locked={locked} testId="door-read" tint="#f3ead8" />
          <Door picture={DoorListen} word={t.listen} hint={t.listenHint} to={locked ? plans : hasListen ? `${base}/read?listen=1` : null} locked={locked} testId="door-listen" tint="#dfe9f3"
            note={!locked && !hasListen ? t.noRecording : !locked && summary.isSample ? t.testRecording : undefined} />
          <Door picture={DoorWatch} word={t.watch} hint={t.watchHint} to={locked ? plans : hasFilm ? `${base}/watch` : null} locked={locked} testId="door-watch" tint="#e8e1f0"
            note={!locked && !hasFilm ? t.noFilm : undefined} />
          <Door picture={DoorDo} word={t.do} hint={t.doHint} to={locked ? plans : hasActivity ? `${base}/do` : null} locked={locked} testId="door-do" tint="#e4efdc"
            note={!locked && !hasActivity ? t.noActivity : undefined} />
        </ul>
      </nav>
    </article>
  )
}

function Door({ picture: Picture, word, hint, to, locked, note, testId, tint }: {
  picture: ComponentType<SVGProps<SVGSVGElement>>
  word: string
  hint: string
  /** null: the door cannot open yet; it stays visible with its note. */
  to: string | null
  locked: boolean
  note?: string
  testId: string
  tint: string
}) {
  const body = (extra?: ReactNode) => (
    <>
      <span className="relative grid place-items-center">
        <Picture className="size-20 sm:size-24" style={{ ['--door-tint' as string]: tint }} />
        {locked && <span className="absolute -end-2 -top-1 grid size-9 place-items-center rounded-full bg-ink text-paper"><IconLock className="size-5" /></span>}
      </span>
      <span className="text-2xl font-semibold">{word}</span>
      <span className="text-sm text-ink-muted">{hint}</span>
      {extra}
    </>
  )
  const cls = 'flex h-full min-h-48 flex-col items-center justify-center gap-2 rounded-[1.25rem] border-2 p-4 text-center'
  return (
    <li>
      {to ? (
        <Link to={to} data-testid={testId} data-state={locked ? 'locked' : 'open'} className={`${cls} border-ink/15 bg-surface transition-[border-color,transform] hover:border-ink active:scale-[0.98] motion-reduce:transition-none`}>
          {body(note && <span className="mt-1 rounded-full border border-dashed border-ink-muted px-2.5 py-0.5 text-xs text-ink-muted">{note}</span>)}
        </Link>
      ) : (
        <div data-testid={testId} data-state="unavailable" aria-disabled="true" className={`${cls} border-dashed border-ink/25 bg-paper text-ink/70`}>
          {body(<span className="mt-1 text-sm font-medium text-ink">{note}</span>)}
        </div>
      )}
    </li>
  )
}
