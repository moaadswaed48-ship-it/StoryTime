import { pageMeta, langData } from '@/seo/meta'
import { useLang } from '@/i18n/use-dict'
import { Page } from '@/ui/Page'
import type { Route } from './+types/landing'

export const meta: Route.MetaFunction = ({ matches }) => {
  const d = langData(matches)
  return d ? pageMeta({ lang: d.lang, page: '', title: d.dict.pages.landing.title, description: d.dict.pages.landing.description, siteName: d.dict.common.siteName }) : []
}

export default function Landing() {
  const { dict } = useLang()
  return (
    <Page title={dict.pages.landing.title}>
      <p className="mt-4 max-w-prose text-lg text-ink-muted">{dict.pages.landing.description}</p>
    </Page>
  )
}
