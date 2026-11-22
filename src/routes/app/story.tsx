import { useParams } from 'react-router'
import { useLang } from '@/i18n/use-dict'
import { privateMeta } from '@/seo/meta'

export const meta = () => privateMeta('StoryTime')

/** Placeholder: story data will be fetched from Supabase for entitled accounts only (Stage 4+). */
export default function Story() {
  const { dict } = useLang()
  const { id } = useParams()
  return (
    <h1 className="text-3xl font-semibold">
      {dict.pages.app.story} <bdi className="text-ink-muted">{id}</bdi>
    </h1>
  )
}
