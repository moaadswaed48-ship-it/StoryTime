import { data, Outlet } from 'react-router'
import { isLang } from '@/i18n/config'
import { loadDict } from '@/i18n/load'
import type { LangData } from '@/i18n/use-dict'
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
  return <Outlet />
}
