import { useRouteLoaderData } from 'react-router'
import type { Lang } from './config'
import type { Dict } from './schema'

export type LangData = { lang: Lang; dict: Dict }

/** The current language and its dictionary, loaded once by the `/:lang` layout route. */
export function useLang(): LangData {
  const data = useRouteLoaderData('lang') as LangData | undefined
  if (!data) throw new Error('useLang() used outside the /:lang routes')
  return data
}
