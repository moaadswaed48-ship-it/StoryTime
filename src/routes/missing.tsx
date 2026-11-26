import { langData, privateMeta } from '@/seo/meta'
import { NotFoundPage } from '@/ui/NotFound'
import type { Route } from './+types/missing'

/** Any address under a language that is not a page: the not-found page, never indexed. */
export const meta: Route.MetaFunction = ({ matches }) => {
  const d = langData(matches)
  return privateMeta(d ? `${d.dict.common.notFound} · ${d.dict.common.siteName}` : '404')
}

export default function Missing() {
  return <NotFoundPage />
}
