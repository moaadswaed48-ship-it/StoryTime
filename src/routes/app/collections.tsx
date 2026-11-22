import { useLang } from '@/i18n/use-dict'
import { privateMeta } from '@/seo/meta'

export const meta = () => privateMeta('StoryTime')

/** Placeholder until part B builds the collections. */
export default function Screen() {
  const { dict } = useLang()
  return (
    <>
      <p role="note" className="mb-6 inline-block rounded-control border border-dashed border-ink-muted px-3 py-2 text-sm text-ink-muted">{dict.common.placeholder}</p>
      <h1 className="text-3xl font-semibold">{dict.pages.app.collections}</h1>
    </>
  )
}
