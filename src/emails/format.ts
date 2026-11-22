import type { Lang } from '@/i18n/config'

/**
 * Dates and money in emails. Emails are rendered on a server whose clock runs in UTC, but every reader is in
 * Israel (checkout is Israel-only at launch), so times are always shown in Israel time and say so.
 * Western digits in every language (the owner's choice), as on the site (src/i18n/format.ts).
 */
export const ISRAEL_TZ = 'Asia/Jerusalem'
const LOCALE: Record<Lang, string> = { ar: 'ar-u-nu-latn', he: 'he-IL-u-nu-latn', en: 'en-GB', da: 'da-DK' }

export function emailDate(iso: string, lang: Lang, withTime = false): string {
  return new Intl.DateTimeFormat(LOCALE[lang], {
    timeZone: ISRAEL_TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' } : {}),
  }).format(new Date(iso))
}

export function emailMoney(agorot: number, lang: Lang): string {
  return new Intl.NumberFormat(LOCALE[lang], { style: 'currency', currency: 'ILS' }).format(agorot / 100)
}

/** The calendar day in Israel of a moment, as YYYY-MM-DD (used by the scheduler and its tests). */
export function israelDay(iso: string | Date): string {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: ISRAEL_TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso))
  return p
}

/** The hour (0-23) in Israel of a moment. */
export function israelHour(iso: string | Date): number {
  return Number(new Intl.DateTimeFormat('en-GB', { timeZone: ISRAEL_TZ, hour: '2-digit', hourCycle: 'h23' }).format(new Date(iso)))
}
