import type { Lang } from '@/i18n/config'
import { LEGAL_SECTIONS, type LegalBlock, type LegalDict, type LegalSection } from '@/i18n/legal-schema'
import type { LegalDoc } from '@/seo/paths'

/** Every legal page in the URL list has a section order, and nothing else does (checked by the compiler). */
const ORDER: { readonly [D in LegalDoc]: readonly string[] } = LEGAL_SECTIONS

/** One chunk per language, loaded only when a legal page is opened (at build time for the pre-rendered pages). */
const loaders: Record<Lang, () => Promise<{ default: LegalDict }>> = {
  ar: () => import('@/i18n/ar/legal.ts'),
  he: () => import('@/i18n/he/legal.ts'),
  en: () => import('@/i18n/en/legal.ts'),
  da: () => import('@/i18n/da/legal.ts'),
}

export const loadLegal = (lang: Lang): Promise<LegalDict> => loaders[lang]().then((m) => m.default)

/** What a legal page needs: its title, summary and sections in order, plus the shared banner and labels. */
export type LegalView = {
  doc: LegalDoc
  title: string
  summary: string
  sections: { id: string; title: string; body: LegalBlock[] }[]
  chrome: LegalDict['chrome']
}

export function legalView(dict: LegalDict, doc: LegalDoc): LegalView {
  const page = dict[doc]
  const sections = page.sections as Record<string, LegalSection>
  return {
    doc,
    title: page.title,
    summary: page.summary,
    sections: ORDER[doc].map((id) => ({ id, ...sections[id]! })),
    chrome: dict.chrome,
  }
}
