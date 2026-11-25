import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { getApi } from '@/data'
import { codeOf, type ErrorCode } from '@/data/errors'
import { AGE_GROUPS, type AgeGroup, type StorySummary } from '@/data/types'
import { AccessPanel } from '@/features/access/AccessPanel'
import { useAccess } from '@/features/access/useAccess'
import { errorText } from '@/features/account/messages'
import { Cover } from '@/features/family/Cover'
import { IconArrow, IconList, IconShelf } from '@/features/family/icons'
import { usePrefs, useReducedMotion } from '@/features/family/prefs'
import { Avatar, ProfilePicker } from '@/features/family/ProfilePicker'
import { Shelf, supports3d } from '@/features/family/Shelf'
import { keepTogether, useFavourites, useIsOpen, useLearners, useProgress, useStories } from '@/features/family/useFamily'
import { isRtl } from '@/i18n/config'
import { fmt } from '@/i18n/format'
import { useLang } from '@/i18n/use-dict'
import { privateMeta } from '@/seo/meta'
import { localPath } from '@/seo/paths'
import { Button, ButtonLink, ChoiceGroup, Notice, PlaceholderTag, Spinner } from '@/ui/controls'

export const meta = () => privateMeta('StoryTime')

/**
 * The library: who is reading, the access panel, "continue where you left off", and the age group's books on the
 * bookshelf (or as a list: the accessible alternative, and the default when motion is reduced or 3D is missing).
 * Every book opens its storybook page, open or locked; the storybook page explains a lock.
 */
export default function Library() {
  const { lang, dict } = useLang()
  const t = dict.stories.library
  const a = dict.commerce.access
  const navigate = useNavigate()
  const { access, error: accessError, reload: reloadAccess } = useAccess()
  const { learners, active, choose, mustChoose, error: learnersError, reload: reloadLearners } = useLearners()
  const [group, setGroup] = useState<AgeGroup | null>(null)
  const { stories, error, reload, storyLang } = useStories(group)
  const progress = useProgress(active?.id ?? null)
  const favourites = useFavourites(active?.id ?? null)
  // "My shelf" holds books of any age group, so it reads the whole catalogue (facts only, never story text).
  const all = useStories(favourites.ids?.length ? 'all' : null)
  const [prefs, setPrefs] = usePrefs()
  const reduced = useReducedMotion()
  const [can3d, setCan3d] = useState(true)
  useEffect(() => setCan3d(supports3d()), [])
  const view = prefs.view ?? (reduced || !can3d ? 'list' : 'shelf')
  const isOpen = useIsOpen(access)
  const [index, setIndex] = useState(0)
  const [startError, setStartError] = useState<ErrorCode | null>(null)

  // The age group follows the reader's profile; without one, the trial's group or the first pass's.
  useEffect(() => {
    if (active) return setGroup(active.ageGroup)
    if (group || !access || !learners) return
    setGroup(access.trial?.ageGroup ?? access.passes[0]?.ageGroup ?? learners[0]?.ageGroup ?? '4-5')
  }, [active, access, learners]) // eslint-disable-line react-hooks/exhaustive-deps

  const items = useMemo(() => (stories ?? []).map((s) => ({ story: s, open: isOpen(s) })), [stories, isOpen])
  const continueRow = useMemo(() => {
    const rows = Object.values(progress.byStory).filter((p) => p.lastPage !== null && stories?.some((s) => s.id === p.storyId))
    rows.sort((x, y) => y.updatedAt.localeCompare(x.updatedAt))
    const p = rows[0]
    const story = p && stories?.find((s) => s.id === p.storyId)
    return p && story ? { p, story } : null
  }, [progress.byStory, stories])

  // Start the shelf on the book being read, else the first open one.
  useEffect(() => {
    if (!items.length) return
    const i = continueRow ? items.findIndex((x) => x.story.id === continueRow.story.id) : items.findIndex((x) => x.open)
    setIndex(Math.max(0, i))
  }, [items.length, group]) // eslint-disable-line react-hooks/exhaustive-deps

  const startTrial = async () => {
    try {
      await (await getApi()).startTrial(group ?? '4-5')
      await reloadAccess()
    } catch (e) {
      setStartError(codeOf(e))
    }
  }
  const storyPath = (s: StorySummary) => localPath(lang, `app/story/${s.id}`)

  if (learnersError) return <Notice tone="error" action={<Button onClick={reloadLearners}>{dict.account.errors.retry}</Button>}>{errorText(dict, learnersError)}</Notice>
  if (!learners) return <Spinner label={dict.account.states.loading} />
  if (mustChoose) return <ProfilePicker learners={learners} title={t.whoIsReading} lead={t.whoIsReadingLead} onChoose={choose} />

  const centred = items[index]
  return (
    <div className="flex flex-col gap-6" data-testid="library">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold">{dict.pages.app.library}</h1>
        {active && (
          <div className="flex items-center gap-3" data-testid="active-profile">
            <Avatar learner={active} size="sm" />
            <span className="font-medium">{fmt(t.reading, { name: active.name })}</span>
            {learners.length > 1 && <Button variant="quiet" onClick={() => choose(null)}>{t.changeReader}</Button>}
          </div>
        )}
      </div>

      {accessError && <Notice tone="error" action={<Button onClick={reloadAccess}>{dict.account.errors.retry}</Button>}>{errorText(dict, accessError)}</Notice>}
      {startError && <Notice tone="error">{errorText(dict, startError)}</Notice>}
      {access && <AccessPanel access={access} onStartTrial={startTrial} />}

      <section aria-labelledby="continue-h" className="flex flex-col gap-3">
        <h2 id="continue-h" className="text-xl font-semibold">{t.continueTitle}</h2>
        {continueRow ? (
          <Link to={`${localPath(lang, `app/story/${continueRow.story.id}/read`)}?page=${continueRow.p.lastPage}`} data-testid="continue" className="flex min-h-20 items-center gap-4 rounded-control border border-line bg-surface p-3 hover:border-ink">
            <Cover story={continueRow.story} locked={!isOpen(continueRow.story)} className="h-20 w-16 shrink-0" />
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="font-medium" lang={storyLang}><bdi>{continueRow.story.title}</bdi></span>
              <span className="text-sm text-ink-muted">{fmt(t.continuePage, { n: continueRow.p.lastPage! })}</span>
            </span>
            <span className="inline-flex min-h-11 items-center gap-2 rounded-control bg-ink px-4 font-medium text-paper">
              {t.continueAction}
              <IconArrow className="size-5 rtl:-scale-x-100" />
            </span>
          </Link>
        ) : (
          progress.loaded && <p className="text-ink-muted" data-testid="nothing-started">{t.nothingStarted}</p>
        )}
      </section>

      {active && (
        <section aria-labelledby="my-shelf-h" className="flex flex-col gap-3" data-testid="my-shelf">
          <h2 id="my-shelf-h" className="text-xl font-semibold">{t.myShelf}</h2>
          {favourites.ids && !favourites.ids.length && <p className="text-ink-muted" data-testid="my-shelf-empty">{t.myShelfEmpty}</p>}
          {!!favourites.ids?.length && (
            <ul className="flex gap-3 overflow-x-auto pb-2">
              {favourites.ids.map((fid) => {
                const s = all.stories?.find((x) => x.id === fid)
                if (!s) return null
                return (
                  <li key={fid} className="shrink-0">
                    <Link to={storyPath(s)} className="flex w-28 flex-col gap-2 rounded-control p-1 hover:bg-surface" data-testid="my-shelf-book">
                      <Cover story={s} locked={!isOpen(s)} className="h-36 w-28" />
                      <span className="line-clamp-2 text-sm font-medium" lang={storyLang}><bdi>{s.title}</bdi></span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        {group && (
          <div className="sm:max-w-md sm:flex-1">
            <ChoiceGroup legend={t.groupLegend} name="library-group" value={group} onChange={setGroup} columns={3} compact
              options={AGE_GROUPS.map((g) => ({ value: g, label: keepTogether(dict.commerce.groups[g]) }))} />
          </div>
        )}
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-medium">{t.viewLegend}</legend>
          <div className="inline-flex rounded-control border border-ink/30 bg-surface p-1">
            {(['shelf', 'list'] as const).map((v) => (
              <button key={v} type="button" aria-pressed={view === v} onClick={() => setPrefs({ view: v })} data-testid={`view-${v}`}
                className="inline-flex min-h-11 items-center gap-2 rounded-[0.55rem] px-4 font-medium aria-pressed:bg-ink aria-pressed:text-paper">
                {v === 'shelf' ? <IconShelf className="size-5" /> : <IconList className="size-5" />}
                {v === 'shelf' ? t.viewShelf : t.viewList}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      {error && <Notice tone="error" action={<Button onClick={reload}>{dict.account.errors.retry}</Button>}>{errorText(dict, error)}</Notice>}
      {!stories && !error && <ShelfSkeleton label={dict.account.states.loading} />}
      {stories && !stories.length && <Notice title={t.emptyGroup} />}

      {stories && !!stories.length && view === 'shelf' && centred && (
        <section aria-label={t.shelfLabel} className="flex flex-col gap-4">
          <Shelf items={items} index={index} onIndex={setIndex} onOpen={(i) => navigate(storyPath(items[i]!.story))} rtl={isRtl(lang)} reduced={reduced} label={t.shelfLabel} />
          <div className="flex flex-col items-center gap-3 text-center" aria-live="polite" data-testid="shelf-focus">
            <p className="text-sm text-ink-muted">{fmt(t.bookOf, { n: index + 1, total: items.length })}</p>
            <p className="flex flex-wrap items-center justify-center gap-2 text-xl font-semibold" lang={storyLang}>
              <bdi>{centred.story.title}</bdi>
              {centred.story.isSample && <PlaceholderTag>{a.sample}</PlaceholderTag>}
            </p>
            <StateLine open={centred.open} story={centred.story} />
            <div className="flex w-full max-w-md items-center justify-between gap-3">
              <Button variant="secondary" onClick={() => setIndex(Math.max(0, index - 1))} disabled={index === 0} aria-label={t.prevBook} className="!px-3">
                <IconArrow className="size-6 -scale-x-100 rtl:scale-x-100" />
              </Button>
              <ButtonLink to={storyPath(centred.story)} className="flex-1" data-testid="open-centred">{t.openBook}</ButtonLink>
              <Button variant="secondary" onClick={() => setIndex(Math.min(items.length - 1, index + 1))} disabled={index === items.length - 1} aria-label={t.nextBook} className="!px-3">
                <IconArrow className="size-6 rtl:-scale-x-100" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {stories && !!stories.length && view === 'list' && (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="story-list">
          {items.map(({ story: s, open }) => (
            <li key={s.id}>
              <Link to={storyPath(s)} data-state={open ? 'open' : 'locked'} className="flex min-h-28 items-center gap-4 rounded-control border border-line bg-surface p-3 hover:border-ink">
                <Cover story={s} locked={!open} className="h-24 w-[4.6rem] shrink-0" />
                <span className="flex min-w-0 flex-col gap-1.5">
                  <span className="font-medium" lang={storyLang}><bdi>{s.title}</bdi></span>
                  <span className="flex flex-wrap items-center gap-2">
                    {s.isSample && <PlaceholderTag>{a.sample}</PlaceholderTag>}
                    <StateLine open={open} story={s} small />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {stories?.some((s) => s.isSample) && <p role="note" className="text-sm text-ink-muted">{t.samplesNote}</p>}
    </div>
  )
}

function StateLine({ open, story, small }: { open: boolean; story: StorySummary; small?: boolean }) {
  const { dict } = useLang()
  const a = dict.commerce.access
  const g = story.ageGroups.map((x) => dict.commerce.groups[x]).join(' · ')
  return (
    <span className={`${small ? 'text-sm' : ''} font-medium ${open ? 'text-green-900' : 'text-ink-muted'}`} data-state={open ? 'open' : 'locked'}>
      {open ? a.open : `${a.locked} · ${fmt(dict.stories.library.lockedBy, { group: g })}`}
    </span>
  )
}

function ShelfSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className="flex h-64 items-end justify-center gap-3 rounded-control bg-line/30 p-6">
      {[0, 1, 2, 3, 4].map((i) => <span key={i} className="h-40 w-9 animate-pulse rounded-[3px] bg-line motion-reduce:animate-none" style={{ height: `${8 + (i % 3)}rem` }} />)}
    </div>
  )
}
