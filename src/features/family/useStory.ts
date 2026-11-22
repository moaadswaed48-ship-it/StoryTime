import { useCallback, useEffect, useState } from 'react'
import { getApi } from '@/data'
import { codeOf, DataError, type ErrorCode } from '@/data/errors'
import type { StoryContent, StorySummary } from '@/data/types'
import { useStoryLang } from './useFamily'

/**
 * One story: its catalogue facts (always, when signed in) and its content (only when the server lets it through:
 * `locked` otherwise). The screens never decide access themselves; they show what the data layer returns.
 */
export function useStory(id: string) {
  const storyLang = useStoryLang()
  const [summary, setSummary] = useState<StorySummary | null>(null)
  const [content, setContent] = useState<StoryContent | null>(null)
  const [error, setError] = useState<ErrorCode | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const a = await getApi()
      const list = await a.listStories(storyLang)
      const s = list.find((x) => x.id === id) ?? null
      setSummary(s)
      if (!s) throw new DataError('not_found')
      setContent(await a.getStoryContent(id, storyLang))
    } catch (e) {
      setContent(null)
      setError(codeOf(e))
    } finally {
      setLoading(false)
    }
  }, [id, storyLang])
  useEffect(() => void load(), [load])
  return { summary, content, error, loading, reload: load, storyLang }
}
