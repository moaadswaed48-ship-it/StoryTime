import { Navigate, Outlet, useLocation } from 'react-router'
import { justDeleted, signInPath } from '@/features/account/parts'
import { useSession } from '@/features/account/session'
import { useLang } from '@/i18n/use-dict'
import { localPath } from '@/seo/paths'
import { Spinner } from '@/ui/controls'
import { Shell } from '@/ui/Shell'

/**
 * The signed-in app: client-only, never pre-rendered (rule 6: paid content never ships in pre-rendered pages).
 * Signed out: sent to sign-in, and back here afterwards. Signed in but not onboarded: sent to onboarding.
 */
export default function AppLayout() {
  const { lang, dict } = useLang()
  const { pathname, search } = useLocation()
  const session = useSession()
  const here = pathname.replace(/\/+$/, '')
  const welcome = localPath(lang, 'app/welcome').replace(/\/+$/, '')

  if (session.status === 'signed-out') {
    if (justDeleted.check()) return <Navigate to={localPath(lang, 'auth/deleted')} replace />
    return <Navigate to={signInPath(lang, `${pathname}${search}`)} replace />
  }
  if (session.status === 'loading' || !session.account) {
    return (
      <Shell>
        <Spinner label={dict.account.states.loading} />
      </Shell>
    )
  }
  // The owner account does not need the family onboarding (part B2).
  if (!session.account.onboardedAt && here !== welcome && session.account.role !== 'owner') return <Navigate to={localPath(lang, 'app/welcome')} replace />

  // One menu for the whole site: the header's (Library, Collections, Settings, Plans, and the owner's area).
  return (
    <Shell>
      <Outlet />
    </Shell>
  )
}
