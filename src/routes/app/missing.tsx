import { useLang } from '@/i18n/use-dict'
import { privateMeta } from '@/seo/meta'

export const meta = () => privateMeta('StoryTime')

export default function Screen() {
  const { dict } = useLang()
  return <h1 className="text-3xl font-semibold">{dict.common.notFound}</h1>
}
