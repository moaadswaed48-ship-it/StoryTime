import type { Lang } from './config'

/** Fills {placeholders} in a dictionary string. A missing value leaves the placeholder visible, so it is noticed. */
export function fmt(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in values ? String(values[k]) : m))
}

/** Western digits in every language (the owner's choice), Arabic included. */
const LOCALE: Record<Lang, string> = { ar: 'ar-u-nu-latn', he: 'he-IL-u-nu-latn', en: 'en-GB', da: 'da-DK' }

export function formatDate(iso: string, lang: Lang, withTime = false): string {
  return new Intl.DateTimeFormat(LOCALE[lang], { dateStyle: 'long', ...(withTime ? { timeStyle: 'short' } : {}) }).format(new Date(iso))
}

/** Agorot to a shekel price with the currency sign. null (price not set) has no text: the screen shows a placeholder. */
export function formatShekels(agorot: number | null, lang: Lang): string | null {
  if (agorot === null) return null
  return new Intl.NumberFormat(LOCALE[lang], { style: 'currency', currency: 'ILS' }).format(agorot / 100)
}

/**
 * Time left, as people say it: "3 days" while more than a day is left (whole days, rounded up), then "5 hours"
 * (rounded up). The platform writes the number and unit, so plurals are right in every language (Arabic dual
 * "يومان", Hebrew "יומיים").
 */
export function formatTimeLeft(endIso: string, nowIso: string, lang: Lang): string {
  const hours = Math.max(0, Math.ceil((new Date(endIso).getTime() - new Date(nowIso).getTime()) / 3_600_000))
  const [n, unit] = hours > 24 ? [Math.ceil(hours / 24), 'day'] : [hours, 'hour']
  return new Intl.NumberFormat(LOCALE[lang], { style: 'unit', unit, unitDisplay: 'long' }).format(n)
}
