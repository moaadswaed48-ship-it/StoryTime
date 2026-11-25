import { data, useLoaderData } from 'react-router'
import { Faq } from '@/features/landing/Faq'
import { isLang } from '@/i18n/config'
import { loadLanding } from '@/i18n/landing'
import { useLang } from '@/i18n/use-dict'
import { langData, pageMeta } from '@/seo/meta'
import { localPath } from '@/seo/paths'
import { ButtonLink, PlaceholderTag, Section, TextLink } from '@/ui/controls'
import { PageTitle, Shell } from '@/ui/Shell'
import type { Route } from './+types/help'

export const meta: Route.MetaFunction = ({ matches }) => {
  const d = langData(matches)
  const p = d?.dict.pages.help
  return d && p ? pageMeta({ lang: d.lang, page: 'help', title: p.title, description: p.description, siteName: d.dict.common.siteName }) : []
}

/** Only the questions travel with this page, never the rest of the landing words (they hold the A04 excerpt). */
async function load(lang: string | undefined) {
  if (!isLang(lang)) throw data(null, { status: 404 })
  return { faq: (await loadLanding(lang)).faq.items }
}
export const loader = ({ params }: Route.LoaderArgs) => load(params.lang)
export const clientLoader = ({ params }: Route.ClientLoaderArgs) => load(params.lang)

/** Help: the landing page's questions and answers, then how to reach us and how to cancel a purchase. */
export default function Help() {
  const { lang, dict } = useLang()
  const { faq } = useLoaderData<typeof loader>()
  const t = dict.support.help
  return (
    <Shell>
      <PageTitle title={dict.pages.help.title} lead={t.lead} />
      <div className="flex flex-col gap-10">
        <section aria-labelledby="help-faq" className="flex flex-col gap-4">
          <h2 id="help-faq" className="text-2xl font-semibold">{t.faqTitle}</h2>
          <Faq items={faq} />
        </section>
        <Section title={t.contactTitle} id="help-contact">
          <p>{t.contactLead}</p>
          <ButtonLink to={localPath(lang, 'contact')} className="self-start" data-testid="help-contact-link">{t.contactLink}</ButtonLink>
          <p className="flex flex-wrap items-center gap-2 text-ink-muted"><PlaceholderTag>{dict.commerce.plans.placeholderBadge}</PlaceholderTag> {t.emailPlaceholder}</p>
        </Section>
        <Section title={t.cancelTitle}>
          <p>{t.cancelLead}</p>
          <TextLink to={localPath(lang, 'cancel-purchase')} className="self-start text-lg">{dict.common.footer.cancelPurchase}</TextLink>
        </Section>
      </div>
    </Shell>
  )
}
