import { useEffect } from 'react'
import { justDeleted } from '@/features/account/parts'
import { useLang } from '@/i18n/use-dict'
import { privateMeta } from '@/seo/meta'
import { localPath } from '@/seo/paths'
import { ButtonLink } from '@/ui/controls'
import { PageTitle, Shell } from '@/ui/Shell'

export const meta = () => privateMeta('StoryTime')

/** Shown after an account is deleted (the user is already signed out). */
export default function Deleted() {
  const { lang, dict } = useLang()
  const t = dict.account.settings
  useEffect(() => justDeleted.clear(), [])
  return (
    <Shell narrow>
      <PageTitle title={t.deletedTitle} lead={t.deletedLead} />
      <ButtonLink to={localPath(lang)} variant="secondary">{dict.common.nav.home}</ButtonLink>
    </Shell>
  )
}
