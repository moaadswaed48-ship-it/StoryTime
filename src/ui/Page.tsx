import type { ReactNode } from 'react'
import { useLang } from '@/i18n/use-dict'
import { OfflineBanner, TestModeBanner } from './Banners'
import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'

/** A placeholder public page: header, a visible "placeholder" notice, a title and a line of text. */
export function Page({ title, children }: { title: string; children?: ReactNode }) {
  const { dict } = useLang()
  return (
    <>
      <OfflineBanner />
      <SiteHeader />
      <TestModeBanner />
      <main id="main" className="mx-auto max-w-5xl px-4 py-10">
        <p role="note" className="mb-6 inline-block rounded-control border border-dashed border-ink-muted px-3 py-2 text-sm text-ink-muted">
          {dict.common.placeholder}
        </p>
        <h1 className="text-3xl font-semibold text-balance sm:text-4xl">{title}</h1>
        {children}
      </main>
      <SiteFooter />
    </>
  )
}
