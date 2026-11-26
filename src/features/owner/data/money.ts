/**
 * Pure rules for the owner's money screens (prices, cancellation fees, refund notes). The database enforces the
 * same limits (supabase/migrations/20261126100000_owner_inbox_refunds_prices.sql); these let the screen say what is
 * wrong before anything is sent. No price or fee is ever made up here: every number comes from the owner.
 */
export { maxCancellationFee } from '@/data/rules'

/** The lowest and highest price the owner may set for a pass, in agorot (1 shekel to 10,000 shekels, VAT included). */
export const PRICE_MIN_AGOROT = 100
export const PRICE_MAX_AGOROT = 1_000_000
/** The longest refund note (how and when the money was returned). */
export const REFUND_NOTE_MAX = 500

const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩'
const PERSIAN = '۰۱۲۳۴۵۶۷۸۹'

/**
 * Reads an amount in shekels as the owner types it: "49", "49.9", "49.90", "49,90" (a Danish comma), with or without
 * a shekel sign or spaces, Western or Arabic-Indic digits. Returns agorot, null for an empty field, or 'invalid'
 * (letters, a negative number, more than two decimals, two separators).
 */
export function parseShekels(input: string): number | null | 'invalid' {
  let s = input.trim()
  if (!s) return null
  s = s.replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC.indexOf(d))).replace(/[۰-۹]/g, (d) => String(PERSIAN.indexOf(d)))
  s = s.replace(/[₪\s ‎‏⁦-⁩]/g, '').replace(/^ILS|ILS$|ש"ח$|شيكل$/gi, '')
  s = s.replace('٫', '.').replace(',', '.')
  const m = /^(\d{1,7})(?:\.(\d{1,2}))?$/.exec(s)
  if (!m) return 'invalid'
  return Number(m[1]) * 100 + Number((m[2] ?? '').padEnd(2, '0'))
}

export type PriceProblem = 'invalid' | 'too_low' | 'too_high'
/** Why a price may not be saved; null = it may. An empty field means "not set" and is always allowed. */
export function priceProblem(agorot: number | null | 'invalid'): PriceProblem | null {
  if (agorot === 'invalid') return 'invalid'
  if (agorot === null) return null
  if (agorot < PRICE_MIN_AGOROT) return 'too_low'
  if (agorot > PRICE_MAX_AGOROT) return 'too_high'
  return null
}

/** Agorot back to the text the owner typed (for an input field): 4990 -> "49.90", 5000 -> "50". */
export const agorotToInput = (agorot: number | null): string =>
  agorot === null ? '' : agorot % 100 === 0 ? String(agorot / 100) : (agorot / 100).toFixed(2)
