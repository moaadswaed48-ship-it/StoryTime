/**
 * The version of the terms a user agrees to, stored with every consent (sign-up and checkout). Bump it whenever the
 * terms or privacy text changes, and publish the new version in a migration (private.terms_versions); the database
 * refuses a sign-up or an order that names a version it does not know. The terms are a draft for a lawyer's review
 * (docs/LEGAL-CHECKLIST.md, docs/legal/LAWYER-PACK.md).
 */
export const TERMS_VERSION = 'draft-2026-11-25'

/** The date of the current draft of the legal pages, shown at the top of each (noon UTC: the same day everywhere). */
export const LEGAL_DRAFT_DATE = '2026-11-25T12:00:00Z'

/**
 * Every terms version ever published, newest first, with what its text was, so a consent record can always be matched
 * to what the person saw. The text of each version is the git history of src/i18n/<lang>/legal.ts at that date.
 */
export const TERMS_HISTORY = [
  {
    version: 'draft-2026-11-25',
    date: '2026-11-25',
    text: 'First full draft of all six legal pages in four languages (src/i18n/<lang>/legal.ts). Not reviewed by a lawyer.',
  },
  {
    version: 'draft-2026-11-22',
    date: '2026-11-22',
    text: 'No terms text existed: /:lang/legal/terms and /:lang/legal/privacy showed only "Placeholder page. The legal text is being prepared." Accepted only by test accounts before sales opened.',
  },
] as const
