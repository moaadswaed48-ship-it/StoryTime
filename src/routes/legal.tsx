import { data } from 'react-router'
import { useLang } from '@/i18n/use-dict'
import { langData, pageMeta } from '@/seo/meta'
import { isLegalDoc } from '@/seo/paths'
import { Page } from '@/ui/Page'
import type { Route } from './+types/legal'

// One shared function: the client build strips `loader`, so `clientLoader = loader` would point at nothing there.
function load(doc: string | undefined) {
  if (!isLegalDoc(doc)) throw data(null, { status: 404 })
  return { doc }
}
export const loader = ({ params }: Route.LoaderArgs) => load(params.doc)
export const clientLoader = ({ params }: Route.ClientLoaderArgs) => load(params.doc)

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
