/** The four site languages. Arabic is the fallback when the browser asks for none of them. */
export const LANGS = ['ar', 'he', 'en', 'da'] as const
export type Lang = (typeof LANGS)[number]
export const FALLBACK: Lang = 'ar'

export const isLang = (v: unknown): v is Lang => typeof v === 'string' && (LANGS as readonly string[]).includes(v)
export const isRtl = (l: Lang) => l === 'ar' || l === 'he'
export const dirOf = (l: Lang): 'rtl' | 'ltr' => (isRtl(l) ? 'rtl' : 'ltr')

/** Each language's own name for itself. The same in every dictionary, so it lives here once. */
export const ENDONYM: Record<Lang, string> = { ar: 'العربية', he: 'עברית', en: 'English', da: 'Dansk' }

/** Picks a site language from the browser's list (e.g. navigator.languages); "iw" is the old code for Hebrew. */
export function pickLang(prefs: readonly string[] | undefined): Lang {
  for (const p of prefs ?? []) {
    let code = (p || '').slice(0, 2).toLowerCase()
    if (code === 'iw') code = 'he'
    if (isLang(code)) return code
  }
  return FALLBACK
}
