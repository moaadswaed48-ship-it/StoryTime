import { backendKind } from '@/data'
import { useOnline } from '@/features/account/online'
import { useLang } from '@/i18n/use-dict'

/** "Test mode" while the local backend is in use: accounts live only in this browser, nothing is charged. Rendered at
 *  the end of the site header (SiteHeader), so it is inside a landmark. */
export function TestModeBanner() {
  const { dict } = useLang()
  if (backendKind !== 'local') return null
  return (
    <p role="note" data-testid="test-mode" className="border-t border-dashed border-ink-muted bg-paper px-4 py-2 text-center text-sm text-ink-muted">
      {dict.account.states.testMode}
    </p>
  )
}

/** Shown only while the browser is offline. */
export function OfflineBanner() {
  const { dict } = useLang()
  const online = useOnline()
  if (online) return null
  return (
    <p role="alert" className="sticky top-0 z-20 bg-amber-100 px-4 py-3 text-center font-medium text-amber-950">
      {dict.account.states.offline}
    </p>
  )
}
