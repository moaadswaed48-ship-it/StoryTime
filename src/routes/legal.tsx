import { data, Link } from 'react-router'
import { LEGAL_DRAFT_DATE, TERMS_VERSION } from '@/data/terms'
import { isLang } from '@/i18n/config'
import { fmt, formatDate } from '@/i18n/format'
import { useLang } from '@/i18n/use-dict'
import { legalView, loadLegal, type LegalView } from '@/legal/load'
import { Blocks, Inline, Placeholder } from '@/legal/LegalText'
import { langData, pageMeta } from '@/seo/meta'
import { isLegalDoc, LEGAL_DOCS, localPath } from '@/seo/paths'
import { Shell } from '@/ui/Shell'
import type { Route } from './+types/legal'

/**
 * The six legal pages (terms, privacy, refunds, accessibility, credits, cookies), public and pre-rendered in four
 * languages. Every page opens with the "draft, not reviewed by a lawyer" banner; gaps are visible placeholders.
 * The words live in src/i18n/<lang>/legal.ts (English is the master), loaded only here.
 */
async function load(lang: string | undefined, doc: string | undefined): Promise<LegalView> {
  if (!isLang(lang) || !isLegalDoc(doc)) throw data(null, { status: 404 })
  return legalView(await loadLegal(lang), doc)
}

/** Runs at build time for the pre-rendered pages. */
export const loader = ({ params }: Route.LoaderArgs) => load(params.lang, params.doc)
/** Runs in the browser on client-side navigation between pages. */
export const clientLoader = ({ params }: Route.ClientLoaderArgs) => load(params.lang, params.doc)

export const meta: Route.MetaFunction = ({ matches, loaderData }) => {
  const d = langData(matches)
  if (!d || !loaderData) return []
  return pageMeta({ lang: d.lang, page: `legal/${loaderData.doc}`, title: loaderData.title, description: loaderData.summary, siteName: d.dict.common.siteName })
}

export default function Legal({ loaderData: v }: Route.ComponentProps) {
  const { lang, dict } = useLang()
  const c = v.chrome
  const anchor = (id: string) => `${v.doc}-${id}`
  return (
    <Shell>
      <article className="mx-auto flex max-w-3xl flex-col gap-8 text-lg leading-relaxed">
        <header className="flex flex-col gap-4">
          <h1 id="top" className="text-3xl font-semibold text-balance sm:text-4xl">{v.title}</h1>
          <p className="max-w-prose text-ink-muted">{v.summary}</p>
          <div role="note" aria-labelledby="draft-title" className="flex flex-col gap-2 rounded-control border-2 border-dashed border-ink bg-surface p-4 text-base">
            <p id="draft-title" className="text-lg font-bold">{c.draftTitle}</p>
            <p>{c.draftBody}</p>
            <p className="text-sm text-ink-muted" aria-hidden="true">
              <Placeholder label="">{c.placeholderKey}</Placeholder>
            </p>
            <p className="text-sm text-ink-muted">
              {fmt(c.updated, { date: formatDate(LEGAL_DRAFT_DATE, lang) })}
              {v.doc === 'terms' || v.doc === 'privacy' ? (
                <>
                  {' · '}
                  <span dir="auto">{fmt(c.version, { version: TERMS_VERSION })}</span>
                </>
              ) : null}
            </p>
            <p className="text-sm"><Inline text={c.languageNote} lang={lang} placeholderLabel={c.placeholder} /></p>
          </div>
        </header>

        <nav aria-labelledby="contents-title" className="rounded-control border border-line bg-surface p-4">
          <h2 id="contents-title" className="text-base font-semibold">{c.contents}</h2>
          <ol className="mt-2 flex list-decimal flex-col ps-6 text-base">
            {v.sections.map((s) => (
              <li key={s.id}>
                <a href={`#${anchor(s.id)}`} className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">{s.title}</a>
              </li>
            ))}
          </ol>
        </nav>

        {v.sections.map((s, i) => (
          <section key={s.id} aria-labelledby={anchor(s.id)} className="flex scroll-mt-6 flex-col gap-4">
            <h2 id={anchor(s.id)} className="scroll-mt-6 text-2xl font-semibold text-balance">
              <span className="me-2 text-ink-muted">{i + 1}.</span>
              {s.title}
            </h2>
            <Blocks blocks={s.body} lang={lang} placeholderLabel={c.placeholder} />
          </section>
        ))}

        <p>
          <a href="#top" className="inline-flex min-h-11 items-center underline underline-offset-4">{c.backToTop}</a>
        </p>

        <nav aria-labelledby="other-legal" className="border-t border-line pt-6">
          <h2 id="other-legal" className="text-base font-semibold">{c.otherPages}</h2>
          <ul className="mt-2 flex flex-wrap gap-x-2">
            {LEGAL_DOCS.filter((d) => d !== v.doc).map((d) => (
              <li key={d}>
                <Link to={localPath(lang, `legal/${d}`)} className="inline-flex min-h-11 items-center px-1 underline underline-offset-4">{dict.pages.legal[d]}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </article>
    </Shell>
  )
}
