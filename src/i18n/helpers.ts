import { isRtl, type Lang } from './config'

/**
 * Carried from the old build (src/i18n/locale.ts). There the language was a module-level constant; here it is
 * passed in, because one page load can now show any of four languages.
 */

/** +1 when the reading direction is left→right, −1 when right→left. */
export const dirSign = (lang: Lang): 1 | -1 => (isRtl(lang) ? -1 : 1)

/** Numbers as text. The owner's choice: Western digits (123) in every language, Arabic included. */
export const num = (n: number) => new Intl.NumberFormat('en-US', { useGrouping: false }).format(n)
