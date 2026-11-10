export type Locale = 'ar' | 'en'
const KEY = 'st:lang'

function detect(): Locale {
  try {
    const q = new URLSearchParams(location.search).get('lang')
    if (q === 'ar' || q === 'en') {
      localStorage.setItem(KEY, q)
      return q
    }
    const s = localStorage.getItem(KEY)
    if (s === 'ar' || s === 'en') return s
  } catch {
    /* private mode */
  }
  return 'ar'
}

/** Resolved once per page load; switching language reloads (after a page-turn wipe) so every module re-reads it. */
export const locale: Locale = typeof location === 'undefined' ? 'ar' : detect()
export const rtl = locale === 'ar'
/** +1 when the reading direction is left→right, −1 when right→left. */
export const dirSign = rtl ? -1 : 1

if (typeof document !== 'undefined') {
  document.documentElement.lang = locale
  document.documentElement.dir = rtl ? 'rtl' : 'ltr'
}

export function switchLocale() {
  const next: Locale = locale === 'ar' ? 'en' : 'ar'
  try {
    localStorage.setItem(KEY, next)
  } catch {
    /* ignore */
  }
  const url = new URL(location.href)
  url.searchParams.set('lang', next)
  document.documentElement.classList.add('lang-turn')
  setTimeout(() => location.replace(url.toString()), 520)
}
