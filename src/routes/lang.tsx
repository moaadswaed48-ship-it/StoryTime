import { data, isRouteErrorResponse, Outlet, useRouteLoaderData } from 'react-router'
import { SessionProvider } from '@/features/account/session'
import { isLang } from '@/i18n/config'
import { loadDict } from '@/i18n/load'
import type { LangData } from '@/i18n/use-dict'
import { NoLanguageNotFound, NotFoundPage } from '@/ui/NotFound'
import type { Route } from './+types/lang'

async function load(lang: string | undefined): Promise<LangData> {
  if (!isLang(lang)) throw data(null, { status: 404 })
  return { lang, dict: await loadDict(lang) }
}

/** Runs at build time for the pre-rendered public pages. */
export const loader = ({ params }: Route.LoaderArgs) => load(params.lang)
/** Runs in the browser for pages that are not pre-rendered (the app) and on client-side navigation. */
export const clientLoader = ({ params }: Route.ClientLoaderArgs) => load(params.lang)

export default function LangLayout() {
  return (
    <SessionProvider>
      <Outlet />
    </SessionProvider>
  )
}

/**
 * A page under a language that answers 404 (an unknown legal page, a language code the site does not have): the
 * not-found page in that language, or, with no language, the four home pages. Other errors go up to the root.
 */
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const lang = useRouteLoaderData('lang') as LangData | undefined
  if (!isRouteErrorResponse(error) || error.status !== 404) throw error
  if (!lang) return <NoLanguageNotFound />
  return (
    <SessionProvider>
      <NotFoundPage withTitle />
    </SessionProvider>
  )
}
