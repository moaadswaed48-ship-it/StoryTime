import { locale } from '@/i18n/locale'

/**
 * Words this screen needs that are not in `t.app.tree` yet. They are listed in the build report so they can be
 * proofread and moved into src/i18n/copy.ts. Kept short and plain.
 */
const all = {
  ar: {
    /** The line over the tree while one or two leaves are earned (empty and full already have theirs). */
    one: 'ورقتك الأولى على الشجرة!',
    two: 'بقيت ورقة واحدة!',
  },
  en: {
    one: 'Your first leaf is on the tree!',
    two: 'One more leaf to go!',
  },
}

export const strings = all[locale]
