import { PlanCards, PlanFacts } from '@/features/commerce/PlanCards'
import { useLang } from '@/i18n/use-dict'
import { langData, pageMeta } from '@/seo/meta'
import { localPath } from '@/seo/paths'
import { ButtonLink } from '@/ui/controls'
import { PageTitle, Shell } from '@/ui/Shell'
import type { Route } from './+types/plans'

export const meta: Route.MetaFunction = ({ matches }) => {
  const d = langData(matches)
  const p = d?.dict.pages.plans
  return d && p ? pageMeta({ lang: d.lang, page: 'plans', title: p.title, description: d.dict.commerce.plans.lead, siteName: d.dict.common.siteName }) : []
}

export default function Plans() {
  const { lang, dict } = useLang()
  const t = dict.commerce.plans
  return (
    <Shell>
      <PageTitle title={dict.pages.plans.title} lead={t.lead} />
      <div className="flex flex-col gap-8">
        <PlanCards />
        <PlanFacts />
        <section className="flex flex-col items-start gap-3 rounded-control border border-dashed border-ink/40 p-5">
          <h2 className="text-xl font-semibold">{t.trialTitle}</h2>
          <p className="text-ink-muted">{t.trialLead}</p>
          <ButtonLink to={localPath(lang, 'sign-up')}>{t.trialCta}</ButtonLink>
        </section>
      </div>
    </Shell>
  )
}
