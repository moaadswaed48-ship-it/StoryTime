import { ParentGate } from '@/features/account/ParentGate'
import { useAccess } from '@/features/access/useAccess'
import { PlanCards, PlanFacts } from '@/features/commerce/PlanCards'
import { useLang } from '@/i18n/use-dict'
import { privateMeta } from '@/seo/meta'
import { Spinner } from '@/ui/controls'
import { PageTitle } from '@/ui/Shell'

export const meta = () => privateMeta('StoryTime')

/** The passes, reached from inside the app (lock screens, "See passes"): behind the parent gate. */
export default function AppPlans() {
  const { dict } = useLang()
  const { access } = useAccess()
  return (
    <ParentGate>
      <PageTitle title={dict.pages.plans.title} lead={dict.commerce.plans.lead} />
      {!access ? <Spinner label={dict.account.states.loading} /> : (
        <div className="flex flex-col gap-8">
          <PlanCards initialGroup={access.trial?.ageGroup ?? access.passes[0]?.ageGroup ?? '4-5'} />
          <PlanFacts />
        </div>
      )}
    </ParentGate>
  )
}
