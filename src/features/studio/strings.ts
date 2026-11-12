import { locale } from '@/i18n/locale'

/** Words this screen needs that are not in `t.app.studio` yet (listed in the report for proofreading). */
const all = {
  ar: {
    /** A scene that has its own moving clip (the other state is `t.app.studio.still`). */
    clip: 'مقطع متحرّك',
  },
  en: {
    clip: 'Moving clip',
  },
}

export const strings = all[locale]
