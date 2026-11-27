import { useCallback, useMemo, useState } from 'react'
import { Link, NavLink, useParams } from 'react-router'
import { getApi } from '@/data'
import { codeOf, type ErrorCode } from '@/data/errors'
import { AGE_GROUPS, type AgeGroup, type StoryContent, type StorySummary } from '@/data/types'
import { useAccess } from '@/features/access/useAccess'
import { errorText } from '@/features/account/messages'
import { useClassroom } from '@/features/classroom/useClassroom'
import { ActivityView } from '@/features/family/ActivityView'
import { Cover } from '@/features/family/Cover'
import { DoorDo, DoorRead, DoorWatch, IconArrow } from '@/features/family/icons'
import { usePrefs } from '@/features/family/prefs'
import { keepTogether, useIsOpen, useLearners, useProgress, useStories } from '@/features/family/useFamily'
import { Film } from '@/features/film/Film'
import { fmt } from '@/i18n/format'
import { useLang } from '@/i18n/use-dict'
import { privateMeta } from '@/seo/meta'
import { localPath } from '@/seo/paths'
import { Button, ButtonLink, Notice, PlaceholderTag, Spinner } from '@/ui/controls'

export const meta = () => privateMeta('StoryTime')

/**
 * The three collections (owner's requests M1 to M3): all stories, all films, all activities. A film plays right
 * here, in the same player as everywhere; an activity opens right here, complete; every item links to its
 * storybook page. Filter by age group; locked items say what opens them.
 */
const KINDS = ['stories', 'films', 'activities'] as const
type Kind = (typeof KINDS)[number]

export default function Collections() {
  const { lang, dict } = useLang()
  // On the class screen no button leads to the passes (for grown-ups, outside classroom mode).
  const room = useClassroom().on
  const t = dict.stories.collections
  const params = useParams()
  const kind: Kind = (KINDS as readonly string[]).includes(params.kind ?? '') ? (params.kind as Kind) : 'stories'
  const [group, setGroup] = useState<AgeGroup | 'all'>('all')
  const { stories, error, reload, storyLang } = useStories('all')
  const { access } = useAccess()
  const isOpen = useIsOpen(access)
  const { active } = useLearners()
  const progress = useProgress(active?.id ?? null)
  const [prefs, setPrefs] = usePrefs()
  const [openId, setOpenId] = useState<string | null>(null)
  const [contents, setContents] = useState<Record<string, StoryContent | ErrorCode>>({})

  const list = useMemo(() => {
    const inGroup = (stories ?? []).filter((s) => group === 'all' || s.ageGroups.includes(group))
    // Every story with a film, made or planned: a planned one says "Film coming soon" and has no player.
    if (kind === 'films') return inGroup.filter((s) => (s.features?.film || s.features?.filmSoon) ?? true)
    if (kind === 'activities') return inGroup.filter((s) => s.features?.activity ?? true)
    return inGroup
  }, [stories, group, kind])

  const toggle = useCallback(async (s: StorySummary) => {
    if (openId === s.id) return setOpenId(null)
    setOpenId(s.id)
    if (contents[s.id] && typeof contents[s.id] !== 'string') return
    try {
      const c = await (await getApi()).getStoryContent(s.id, storyLang)
      setContents((m) => ({ ...m, [s.id]: c }))
    } catch (e) {
      setContents((m) => ({ ...m, [s.id]: codeOf(e) }))
    }
  }, [openId, contents, storyLang])

  const tabs: { kind: Kind; label: string; Picture: typeof DoorRead }[] = [
    { kind: 'stories', label: t.stories, Picture: DoorRead },
    { kind: 'films', label: t.films, Picture: DoorWatch },
    { kind: 'activities', label: t.activities, Picture: DoorDo },
  ]
  const storyPath = (s: StorySummary) => localPath(lang, `app/story/${s.id}`)

  return (
    <div className="flex flex-col gap-6" data-testid="collections" data-kind={kind}>
      <h1 className="text-3xl font-semibold">{dict.pages.app.collections}</h1>
      <nav aria-label={dict.pages.app.collections}>
        <ul className="grid grid-cols-3 gap-2 sm:gap-3">
          {tabs.map(({ kind: k, label, Picture }) => (
            <li key={k}>
              <NavLink to={localPath(lang, `app/collections/${k}`)} aria-current={k === kind ? 'page' : undefined} data-testid={`tab-${k}`}
                className="flex min-h-24 flex-col items-center justify-center gap-1 rounded-[1rem] border-2 border-ink/15 bg-surface p-2 text-center font-semibold aria-[current=page]:border-ink aria-[current=page]:bg-ink aria-[current=page]:text-paper">
                <Picture className="size-10 sm:size-12" />
                <span className="text-sm sm:text-base">{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <fieldset>
        <legend className="mb-2 font-medium">{t.legend}</legend>
        <div className="flex flex-wrap gap-2">
          {(['all', ...AGE_GROUPS] as const).map((g) => (
            <button key={g} type="button" aria-pressed={group === g} onClick={() => setGroup(g)} data-testid={`filter-${g}`}
              className="min-h-11 rounded-full border border-ink/30 bg-surface px-4 font-medium aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-paper">
              {g === 'all' ? t.allAges : keepTogether(dict.commerce.groups[g])}
            </button>
          ))}
        </div>
      </fieldset>

      {error && <Notice tone="error" action={<Button onClick={reload}>{dict.account.errors.retry}</Button>}>{errorText(dict, error)}</Notice>}
      {!stories && !error && <Spinner label={dict.account.states.loading} />}
      {stories && !list.length && <Notice title={t.empty} />}

      <ul className="flex flex-col gap-3" data-testid="collection-list">
        {list.map((s) => {
          const open = isOpen(s)
          const expanded = openId === s.id
          const c = contents[s.id]
          const groups = s.ageGroups.map((g) => dict.commerce.groups[g]).join(' · ')
          return (
            <li key={s.id} className="rounded-control border border-line bg-surface" data-testid="collection-item" data-state={open ? 'open' : 'locked'}>
              <div className="flex flex-wrap items-center gap-4 p-3">
                <Cover story={s} locked={!open} className="h-24 w-[4.6rem] shrink-0" />
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="font-medium" lang={storyLang}><bdi>{s.title}</bdi></span>
                  <span className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-ink-muted">{groups}</span>
                    {s.isSample && <PlaceholderTag>{dict.commerce.access.sample}</PlaceholderTag>}
                  </span>
                  {!open && <span className="text-sm font-medium text-ink-muted">{dict.commerce.access.locked} · {fmt(dict.stories.library.lockedBy, { group: groups })}</span>}
                </div>
                <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                  {kind === 'films' && s.features && !s.features.film && (
                    <span className="inline-flex min-h-11 items-center rounded-full border border-dashed border-ink-muted px-3 text-sm text-ink-muted" data-testid="film-soon">{dict.stories.doors.noFilm}</span>
                  )}
                  {open && kind === 'films' && (s.features?.film ?? true) && (
                    <Button onClick={() => toggle(s)} aria-expanded={expanded} data-testid="play-here" className="flex-1 sm:flex-none">{expanded ? t.close : t.playHere}</Button>
                  )}
                  {open && kind === 'activities' && (
                    <Button onClick={() => toggle(s)} aria-expanded={expanded} data-testid="open-here" className="flex-1 sm:flex-none">{expanded ? t.close : t.openHere}</Button>
                  )}
                  {!open && !room && <ButtonLink to={localPath(lang, 'app/plans')} variant="secondary" className="flex-1 sm:flex-none">{dict.commerce.access.seePasses}</ButtonLink>}
                  <Link to={storyPath(s)} data-testid="to-storybook" className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-control px-4 font-medium underline underline-offset-4 sm:flex-none">
                    {t.toStorybook}
                    <IconArrow className="size-5 rtl:-scale-x-100" />
                  </Link>
                </div>
              </div>
              {expanded && (
                <div className="border-t border-line p-3 sm:p-5" data-testid="in-place">
                  {!c && <Spinner label={dict.account.states.loading} />}
                  {typeof c === 'string' && <Notice tone="error" action={<Button onClick={() => { setContents((m) => { const n = { ...m }; delete n[s.id]; return n }); setOpenId(null) }}>{dict.account.errors.retry}</Button>}>{errorText(dict, c)}</Notice>}
                  {c && typeof c !== 'string' && kind === 'films' && (c.film?.videoUrl
                    ? <Film film={c.film} title={c.title} lang={c.film.captionsLang} memoryKey={`storytime.film.${active?.id ?? 'account'}.${s.id}`} captions={prefs.captions}
                        onCaptions={(on) => setPrefs({ captions: on })} onWatched={() => void progress.save(s.id, { filmWatched: true })} autoStart
                        savedAt={progress.byStory[s.id]?.filmPositionS ?? null} onPosition={active ? (at) => void progress.save(s.id, { filmPositionS: at }) : undefined} />
                    : <Notice title={dict.stories.film.notReady} />)}
                  {c && typeof c !== 'string' && kind === 'activities' && (c.activity
                    ? <ActivityView activity={c.activity} lang={c.lang} headingLevel={2} done={!!progress.byStory[s.id]?.activityDone} learnerName={active?.name ?? null}
                        onDone={active ? (done) => void progress.save(s.id, { activityDone: done }) : null} />
                    : <Notice title={dict.stories.doors.noActivity} />)}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
