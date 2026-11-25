import { useCallback, useEffect, useMemo, useState } from 'react'
import { getApi } from '@/data'
import { codeOf, type ErrorCode } from '@/data/errors'
import { hasAccessToStory } from '@/data/rules'
import type { AccessSnapshot, AgeGroup, Learner, Progress, ProgressPatch, StorySummary } from '@/data/types'
import { useSession } from '@/features/account/session'
import type { Lang } from '@/i18n/config'
import { useLang } from '@/i18n/use-dict'

/**
 * The family's profiles and which one is reading. The choice is kept per account on this device; with one profile
 * there is nothing to choose. Every progress read and write goes through the active profile.
 */
const activeKey = (accountId: string) => `storytime.activeLearner.${accountId}`

export function useLearners() {
  const session = useSession()
  const accountId = session.status === 'signed-in' ? session.session.userId : null
  const [learners, setLearners] = useState<Learner[] | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [error, setError] = useState<ErrorCode | null>(null)

  const load = useCallback(async () => {
    if (!accountId) return
    setError(null)
    try {
      const list = await (await getApi()).listLearners()
      let stored: string | null = null
      try { stored = localStorage.getItem(activeKey(accountId)) } catch { /* private mode */ }
      setLearners(list)
      setActiveId(list.some((l) => l.id === stored) ? stored : list.length === 1 ? list[0]!.id : null)
    } catch (e) {
      setError(codeOf(e))
    }
  }, [accountId])
  useEffect(() => void load(), [load])

  const choose = useCallback((id: string | null) => {
    setActiveId(id)
    if (!accountId) return
    try {
      if (id) localStorage.setItem(activeKey(accountId), id)
      else localStorage.removeItem(activeKey(accountId))
    } catch { /* private mode */ }
  }, [accountId])

  const active = learners?.find((l) => l.id === activeId) ?? null
  /** More than one profile and none chosen yet: the picker shows first. */
  const mustChoose = !!learners && learners.length > 1 && !active
  return { learners, active, choose, mustChoose, error, reload: load }
}

/**
 * Saves still on their way. The reader saves its last page as it closes, and the page it closes into reads progress
 * at once: that read waits for these saves, so it never shows the page from before the save.
 */
let pendingSaves: Promise<unknown> = Promise.resolve()

/** The active profile's progress, by story id, with a saver that updates it in place. */
export function useProgress(learnerId: string | null) {
  const [byStory, setByStory] = useState<Record<string, Progress>>({})
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    setByStory({})
    setLoaded(false)
    if (!learnerId) return
    let alive = true
    pendingSaves.then(() => getApi()).then((a) => a.listProgress(learnerId)).then(
      (rows) => alive && (setByStory(Object.fromEntries(rows.map((r) => [r.storyId, r]))), setLoaded(true)),
      () => alive && setLoaded(true),
    )
    return () => void (alive = false)
  }, [learnerId])
  const save = useCallback(async (storyId: string, patch: ProgressPatch) => {
    if (!learnerId) return null
    try {
      const saving = getApi().then((a) => a.saveProgress(learnerId, storyId, patch))
      pendingSaves = pendingSaves.then(() => saving).catch(() => undefined)
      const row = await saving
      setByStory((m) => ({ ...m, [storyId]: row }))
      return row
    } catch {
      return null // progress is a convenience: a failed save never blocks reading
    }
  }, [learnerId])
  return { byStory, loaded, save }
}

/** "My shelf": the active profile's favourite stories, with an optimistic toggle (undone if the save fails). */
export function useFavourites(learnerId: string | null) {
  const [ids, setIds] = useState<string[] | null>(null)
  const [error, setError] = useState<ErrorCode | null>(null)
  useEffect(() => {
    setIds(null)
    setError(null)
    if (!learnerId) return
    let alive = true
    getApi().then((a) => a.listFavourites(learnerId)).then((r) => alive && setIds(r), (e) => alive && setError(codeOf(e)))
    return () => void (alive = false)
  }, [learnerId])
  const toggle = useCallback(async (storyId: string) => {
    if (!learnerId || !ids) return
    const on = !ids.includes(storyId)
    const before = ids
    setIds(on ? [storyId, ...ids] : ids.filter((x) => x !== storyId))
    try {
      await (await getApi()).setFavourite(learnerId, storyId, on)
    } catch (e) {
      setIds(before)
      setError(codeOf(e))
    }
  }, [learnerId, ids])
  return { ids, error, toggle }
}

/** The language stories are read in: the account's story language, else the site language. */
export function useStoryLang(): Lang {
  const { lang } = useLang()
  const session = useSession()
  return (session.status === 'signed-in' && session.account?.storyLanguage) || lang
}

/** The catalogue (optionally one age group), with loading, error and retry. */
export function useStories(group: AgeGroup | null | 'all') {
  const storyLang = useStoryLang()
  const [stories, setStories] = useState<StorySummary[] | null>(null)
  const [error, setError] = useState<ErrorCode | null>(null)
  const load = useCallback(async () => {
    if (!group) return
    setStories(null)
    setError(null)
    try {
      setStories(await (await getApi()).listStories(storyLang, group === 'all' ? undefined : group))
    } catch (e) {
      setError(codeOf(e))
    }
  }, [group, storyLang])
  useEffect(() => void load(), [load])
  return { stories, error, reload: load, storyLang }
}

/** Open or locked, with the same rule the server applies (the server still decides: content is fetched through it). */
export function useIsOpen(access: AccessSnapshot | null) {
  return useMemo(() => (s: Pick<StorySummary, 'id' | 'ageGroups'>) => !!access && hasAccessToStory(access, { id: s.id, published: true, ageGroups: s.ageGroups }), [access])
}

/** An age-group label that never breaks inside its range ("Ages 4–5"), also in right-to-left text. */
export const keepTogether = (label: string) => label.replace(/ /g, '\u00a0').replace(/–/g, '\u2060–\u2060')
