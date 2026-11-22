import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import { dirOf, ENDONYM, FALLBACK, LANGS, pickLang } from '@/i18n/config'
import { absoluteUrl, alternates } from '@/seo/paths'
import type { Route } from './+types/pick-language'

const base = import.meta.env.BASE_URL

export const meta: Route.MetaFunction = () => [
  { title: 'StoryTime' },
  { tagName: 'link', rel: 'canonical', href: absoluteUrl(__SITE_ORIGIN__, base, '/') },
  ...alternates(__SITE_ORIGIN__, base, '').map((a) => ({ tagName: 'link', rel: 'alternate', hrefLang: a.hrefLang, href: a.href })),
  ...(__NOINDEX__ ? [{ name: 'robots', content: 'noindex' }] : []),
]

/**
 * Runs before the page paints (it is in the pre-rendered HTML): sends the visitor to the language their
 * browser asks for, Arabic otherwise. Kept in step with pickLang() in i18n/config.ts.
 */
const redirect = `(function(){var s=${JSON.stringify(LANGS)},p=navigator.languages||[navigator.language||''];for(var i=0;i<p.length;i++){var c=(p[i]||'').slice(0,2).toLowerCase();if(c==='iw')c='he';if(s.indexOf(c)>=0){location.replace(${JSON.stringify(base)}+c+'/');return}}location.replace(${JSON.stringify(base)}+${JSON.stringify(FALLBACK)}+'/')})()`

/** `/`: the language picker. Visitors normally never see it; it stays as plain links if scripts are off. */
export default function PickLanguage() {
  const navigate = useNavigate()
  // Reached by an in-app link rather than a page load: redirect here instead.
  useEffect(() => {
    navigate(`/${pickLang(navigator.languages)}/`, { replace: true })
  }, [navigate])
  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <script dangerouslySetInnerHTML={{ __html: redirect }} />
      <ul className="flex flex-col gap-3 text-center text-xl">
        {LANGS.map((l) => (
          <li key={l}>
            <Link to={`/${l}/`} lang={l} dir={dirOf(l)} hrefLang={l} className="inline-flex min-h-12 items-center rounded-control px-6 underline-offset-4 hover:underline">
              {ENDONYM[l]}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
