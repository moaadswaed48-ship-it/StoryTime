import { data } from 'react-router'
import { useLang } from '@/i18n/use-dict'
import { langData, pageMeta } from '@/seo/meta'
import { isLegalDoc } from '@/seo/paths'
import { Page } from '@/ui/Page'
import type { Route } from './+types/legal'

export const loader = ({ params }: Route.LoaderArgs) => {
  if (!isLegalDoc(params.doc)) throw data(null, { status: 404 })
  return { doc: params.doc }
}
export const clientLoader = loader

export const meta: Route.MetaFunction = ({ matches, loaderData }) => {
  const d = langData(matches)
  if (!d || !loaderData) return []
  const legal = d.dict.pages.legal
  return pageMeta({ lang: d.lang, page: `legal/${loaderData.doc}`, title: legal[loaderData.doc], description: legal.description, siteName: d.dict.common.siteName })
}

export default function Legal({ loaderData }: Route.ComponentProps) {
  const { dict } = useLang()
  return (
    <Page title={dict.pages.legal[loaderData.doc]}>
      <p className="mt-4 max-w-prose text-lg text-ink-muted">{dict.pages.legal.description}</p>
    </Page>
  )
}
