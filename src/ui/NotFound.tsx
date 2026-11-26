import { Link } from 'react-router'
import { dirOf, ENDONYM, LANGS } from '@/i18n/config'
import { useLang } from '@/i18n/use-dict'
import { localPath } from '@/seo/paths'
import { PageTitle, Shell } from './Shell'

/**
 * The not-found page in the visitor's language: what happened in one line, the way home, and Help. `withTitle` when
 * shown by an error boundary, which has no route meta to give the tab its title.
 */
export function NotFoundPage({ withTitle = false }: { withTitle?: boolean }) {
  const { lang, dict } = useLang()
  const t = dict.common
  return (
    <Shell>
      {withTitle && <title>{`${t.notFound} · ${t.siteName}`}</title>}
      <div data-testid="not-found">
        <PageTitle title={t.notFound} lead={t.notFoundLead} />
        <ul className="flex flex-wrap gap-3">
          <li>
            <Link to={localPath(lang)} className="inline-flex min-h-12 items-center rounded-control bg-ink px-5 font-semibold text-paper">{t.notFoundHome}</Link>
          </li>
          <li>
            <Link to={localPath(lang, 'help')} className="inline-flex min-h-12 items-center rounded-control border border-ink px-5">{t.footer.help}</Link>
          </li>
        </ul>
      </div>
    </Shell>
  )
}

/**
 * A 404 outside any language (the address does not start with one): the number, and each language's home page by
 * its own name, so nobody is left on a dead end. No dictionary is loaded here, so there are no other words.
 */
export function NoLanguageNotFound() {
  return (
    <main id="main" className="grid min-h-dvh place-items-center p-6 text-center" data-testid="not-found">
      {/* No route meta here; the working name is the same in every language (as on the language picker). */}
      <title>404 · StoryTime</title>
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-6xl font-semibold tabular-nums text-ink-muted">404</h1>
        <ul className="flex flex-wrap justify-center gap-2">
          {LANGS.map((l) => (
            <li key={l}>
              <Link to={localPath(l)} lang={l} dir={dirOf(l)} hrefLang={l} className="inline-flex min-h-12 items-center rounded-control border border-ink px-5 text-lg">{ENDONYM[l]}</Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
