import { pageMeta, langData } from '@/seo/meta'
import { useLang } from '@/i18n/use-dict'
import { Page } from '@/ui/Page'
import type { Route } from './+types/sign-in'

export const meta: Route.MetaFunction = ({ matches }) => {
  const d = langData(matches)
  const p = d?.dict.pages.signIn
  return d && p ? pageMeta({ lang: d.lang, page: 'sign-in', title: p.title, description: p.description, siteName: d.dict.common.siteName }) : []
}

export default function SignIn() {
  const { dict } = useLang()
  return (
    <Page title={dict.pages.signIn.title}>
      <p className="mt-4 max-w-prose text-lg text-ink-muted">{dict.pages.signIn.description}</p>
    </Page>
  )
}
