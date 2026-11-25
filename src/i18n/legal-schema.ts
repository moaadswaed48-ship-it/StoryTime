/**
 * The legal pages' words, in four languages (src/i18n/<lang>/legal.ts). Kept out of the main dictionary so a family
 * downloads them only when it opens a legal page: src/legal/load.ts loads one language's file on demand. Each file is
 * checked with `satisfies LegalDict`, so a missing page, section or chrome string in any language fails
 * `npm run typecheck`.
 *
 * English (src/i18n/en/legal.ts) is the master. Hebrew, Arabic and Danish are written natively from it, not word for
 * word. Questions for the lawyer are `// LAWYER Qn` comments in the English file and are listed, with every visible
 * placeholder, in docs/legal/LAWYER-PACK.md.
 *
 * Inline marks inside any string (rendered by src/legal/LegalText.tsx):
 *   [[text]]          a visible placeholder ("to be filled in"), never an invented fact
 *   {path|label}      a link to a page of the site, e.g. {legal/refunds|Refunds and cancellation} or
 *                     {cancel-purchase|Cancel a purchase}; tests/legal.test.ts checks that every path exists
 */

/** A block of a section: a paragraph, a list, numbered steps, a highlighted note, or a table. */
export type LegalBlock =
  | string
  | { list: string[] }
  | { steps: string[] }
  | { note: string }
  | { table: { head: string[]; rows: string[][] } }

export type LegalSection = { title: string; body: LegalBlock[] }

/** The order sections appear in, the same in every language. */
export const LEGAL_SECTIONS = {
  terms: ['about', 'service', 'accounts', 'trial', 'passes', 'prices', 'cancel', 'ends', 'use', 'content', 'changes', 'liability', 'ending', 'updates', 'law', 'contact'],
  privacy: ['short', 'who', 'collect', 'never', 'why', 'helpers', 'abroad', 'kept', 'rights', 'children', 'security', 'news', 'cookies', 'updates', 'complaints'],
  refunds: ['short', 'right', 'how', 'refund', 'ourFault', 'longer', 'after', 'nothing', 'deleting', 'contact'],
  accessibility: ['commitment', 'done', 'gaps', 'contact', 'date'],
  credits: ['stories', 'art', 'fonts', 'code', 'copyright'],
  cookies: ['short', 'what', 'testMode', 'others', 'control', 'updates'],
} as const

export type LegalDocKey = keyof typeof LEGAL_SECTIONS
type SectionsOf<D extends LegalDocKey> = { [K in (typeof LEGAL_SECTIONS)[D][number]]: LegalSection }

export type LegalPage<D extends LegalDocKey> = {
  title: string
  /** One or two plain sentences under the title; also the page's search-engine description. */
  summary: string
  sections: SectionsOf<D>
}

export type LegalDict = {
  chrome: {
    /** The banner at the top of every legal page. */
    draftTitle: string
    draftBody: string
    /** Read by screen readers before each placeholder, and shown in the key under the banner. */
    placeholder: string
    placeholderKey: string
    /** "{date}" is filled with the date of this draft. */
    updated: string
    /** "{version}" is filled with the terms version recorded when someone signs up or buys (src/data/terms.ts). */
    version: string
    /** Which language version counts: a placeholder until the lawyer decides. */
    languageNote: string
    contents: string
    otherPages: string
    backToTop: string
  }
  terms: LegalPage<'terms'>
  privacy: LegalPage<'privacy'>
  refunds: LegalPage<'refunds'>
  accessibility: LegalPage<'accessibility'>
  credits: LegalPage<'credits'>
  cookies: LegalPage<'cookies'>
}
