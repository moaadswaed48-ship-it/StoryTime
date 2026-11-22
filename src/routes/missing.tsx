import { useLang } from '@/i18n/use-dict'
import { privateMeta } from '@/seo/meta'
import { Page } from '@/ui/Page'

export const meta = () => privateMeta('404')

export default function Missing() {
  const { dict } = useLang()
  return <Page title={dict.common.notFound} />
}
