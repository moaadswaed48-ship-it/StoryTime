import { locale } from '@/i18n/locale'

/**
 * Strings this feature needs that are not in `t.game` yet (listed in the build report so they can be proofread
 * and moved into src/i18n/copy.ts).
 */
const all = {
  ar: {
    /** Hint in the no-WebGL version of the game, where the papers are tapped instead of collected by running. */
    tapPaper: 'اضغط على ورقة لتلتقطها',
  },
  en: {
    tapPaper: 'Tap a paper to pick it up',
  },
}

export const strings = all[locale]
