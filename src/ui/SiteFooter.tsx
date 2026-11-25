import { Link } from 'react-router'
import { useLang } from '@/i18n/use-dict'
import { LEGAL_DOCS, localPath } from '@/seo/paths'

/**
 * Footer on every page. Holds the "Cancel a purchase" link the consumer law asks for on the home page and in every
 * footer (legal checklist items 9-10), and the business details, still a visible placeholder.
 * Links to all six legal pages (src/seo/paths.ts LEGAL_DOCS), refunds and cancellation included.
 */
export function SiteFooter() {
  const { lang, dict } = useLang()
  const links: (readonly [string, string])[] = [
    [localPath(lang, 'plans'), dict.common.nav.plans],
    ...LEGAL_DOCS.map((d) => [localPath(lang, `legal/${d}`), dict.pages.legal[d]] as const),
  ]
  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8">
        <nav aria-label={dict.common.footer.label}>
          <ul className="flex flex-wrap gap-x-2 gap-y-1">
            <li>
              <Link to={localPath(lang, 'cancel-purchase')} className="inline-flex min-h-11 items-center rounded-control px-3 font-semibold underline underline-offset-4">
                {dict.common.footer.cancelPurchase}
              </Link>
            </li>
            {links.map(([to, label]) => (
              <li key={to}>
                <Link to={to} className="inline-flex min-h-11 items-center rounded-control px-3 underline-offset-4 hover:underline">{label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="px-3 text-sm text-ink-muted">
          <span className="me-2 inline-flex rounded-full border border-dashed border-ink-muted px-2 py-0.5 text-xs">{dict.commerce.plans.placeholderBadge}</span>
          {dict.common.footer.business}
        </p>
      </div>
    </footer>
  )
}
