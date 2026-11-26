import type { ReactNode } from 'react'
import { OfflineBanner } from './Banners'
import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'

/**
 * The frame of every account, plans and app screen: header, test-mode and offline notices, content, footer.
 * `narrow` is for forms (one column, comfortable line length on desktop).
 */
export function Shell({ children, narrow }: { children: ReactNode; narrow?: boolean }) {
  return (
    <>
      <OfflineBanner />
      <SiteHeader />
      <main id="main" className={`mx-auto w-full px-4 py-8 sm:py-12 ${narrow ? 'max-w-lg' : 'max-w-5xl'}`}>
        {children}
      </main>
      <SiteFooter />
    </>
  )
}

/** A page heading with an optional lead line. */
export function PageTitle({ title, lead }: { title: string; lead?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-3">
      <h1 className="text-3xl font-semibold text-balance sm:text-4xl">{title}</h1>
      {lead && <p className="max-w-prose text-lg text-ink-muted">{lead}</p>}
    </div>
  )
}
