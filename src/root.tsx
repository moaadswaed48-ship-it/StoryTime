import { useEffect, type ReactNode } from 'react'
import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration, useLocation } from 'react-router'
import { dirOf, FALLBACK, isLang, type Lang } from '@/i18n/config'
import { NoLanguageNotFound } from '@/ui/NotFound'
import type { Route } from './+types/root'
import './app.css'

/** The language a URL is in: its first segment, English for the lab, the fallback otherwise. */
function langOf(pathname: string): Lang {
  const seg = pathname.split('/')[1]
  if (seg === 'lab') return 'en'
  return isLang(seg) ? seg : FALLBACK
}

export function Layout({ children }: { children: ReactNode }) {
  const lang = langOf(useLocation().pathname)
  const dir = dirOf(lang)
  // Pages served by the SPA fallback were rendered for "/": put the right language on <html> once in the browser.
  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = dir
  }, [lang, dir])
  return (
    <html lang={lang} dir={dir}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        {/* Preview builds (NOINDEX=1): on every page, the SPA fallback included, so no URL of the preview is indexed. */}
        {__NOINDEX__ && <meta name="robots" content="noindex, nofollow" />}
        {/* No icon until the brand exists (design stage): an empty one stops the browser asking for /favicon.ico,
            which answered 404 and showed as a console error on every first visit. Replace with the real icons. */}
        <link rel="icon" href="data:," />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  return <Outlet />
}

/** Shown while a client-only page (the app, the lab) loads in the browser. Wordless on purpose: no language is known yet. */
export function HydrateFallback() {
  return <div className="grid min-h-dvh place-items-center" aria-busy="true"><span className="size-8 animate-spin rounded-full border-2 border-line border-t-ink motion-reduce:animate-none" /></div>
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const status = isRouteErrorResponse(error) ? error.status : 500
  if (import.meta.env.DEV && !isRouteErrorResponse(error)) console.error(error)
  if (status === 404) return <NoLanguageNotFound />
  return (
    <main className="grid min-h-dvh place-items-center p-6 text-center">
      <p className="text-6xl font-semibold tabular-nums text-ink-muted">{status}</p>
    </main>
  )
}
