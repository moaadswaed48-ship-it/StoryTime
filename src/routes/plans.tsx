import { pageMeta, langData } from '@/seo/meta'
import { useLang } from '@/i18n/use-dict'
import { Page } from '@/ui/Page'
import type { Route } from './+types/plans'

export const meta: Route.MetaFunction = ({ matches }) => {
  const d = langData(matches)
  const p = d?.dict.pages.plans
  return d && p ? pageMeta({ lang: d.lang, page: 'plans', title: p.title, description: p.description, siteName: d.dict.common.siteName }) : []
}

export default function Plans() {
  const { dict } = useLang()
  return (
    <Page title={dict.pages.plans.title}>
      <p className="mt-4 max-w-prose text-lg text-ink-muted">{dict.pages.plans.description}</p>
    </Page>
  )
}
