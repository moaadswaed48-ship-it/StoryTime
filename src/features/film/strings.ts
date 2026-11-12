import { locale } from '@/i18n/locale'

/** Words the film player needs that are not in `t.film` yet (listed in the task report for proofreading). */
const all = {
  ar: { fullscreen: 'ملء الشاشة', exitFullscreen: 'إنهاء ملء الشاشة' },
  en: { fullscreen: 'Full screen', exitFullscreen: 'Exit full screen' },
}
export const strings = all[locale]
