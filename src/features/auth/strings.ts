import { locale } from '@/i18n/locale'

/** Words the sign-in sheet needs that are not in `t.auth` (labels for the show / hide password button). To be proofread. */
const strings = {
  ar: { show: 'إظهار كلمة المرور', hide: 'إخفاء كلمة المرور' },
  en: { show: 'Show password', hide: 'Hide password' },
}

export const s = strings[locale]
