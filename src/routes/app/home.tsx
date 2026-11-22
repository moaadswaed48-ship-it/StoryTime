import { Navigate } from 'react-router'
import { useLang } from '@/i18n/use-dict'
import { localPath } from '@/seo/paths'

/** /:lang/app/ opens the library (the layout sends a new account to onboarding first). */
export default function AppHome() {
  const { lang } = useLang()
  return <Navigate to={localPath(lang, 'app/library')} replace />
}
