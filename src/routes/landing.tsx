import { pageMeta, langData } from '@/seo/meta'
import { useLang } from '@/i18n/use-dict'
import { localPath } from '@/seo/paths'
import { ButtonLink, TextLink } from '@/ui/controls'
import { Page } from '@/ui/Page'
import type { Route } from './+types/landing'

export const meta: Route.MetaFunction = ({ matches }) => {
  const d = langData(matches)
  return d ? pageMeta({ lang: d.lang, page: '', title: d.dict.pages.landing.title, description: d.dict.pages.landing.description, siteName: d.dict.common.siteName }) : []
}

export default function Landing() {
  const { lang, dict } = useLang()
  const c = dict.commerce
  return (
    <Page title={dict.pages.landing.title}>
      <p className="mt-4 max-w-prose text-lg text-ink-muted">{dict.pages.landing.description}</p>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <ButtonLink to={localPath(lang, 'sign-up')}>{c.plans.trialCta}</ButtonLink>
        <ButtonLink to={localPath(lang, 'sign-in')} variant="quiet">{dict.common.nav.signIn}</ButtonLink>
      </div>
      <p className="mt-3 max-w-prose text-ink-muted">{c.plans.trialLead}</p>
      {/* Consumer Protection Law 14ט(ב): a clearly labelled cancellation link on the home page, with the methods beside it. */}
      <aside className="mt-12 flex max-w-prose flex-col gap-1 rounded-control border border-line bg-surface p-4">
        <TextLink to={localPath(lang, 'cancel-purchase')} className="text-lg font-semibold">{c.cancel.homeLink}</TextLink>
        <p className="text-ink-muted">{c.cancel.homeMethods}</p>
      </aside>
    </Page>
  )
}
