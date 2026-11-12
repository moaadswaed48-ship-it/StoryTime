import { locale } from '@/i18n/locale'

/**
 * Words this screen needs that are not in `t.app.grown` yet. They are listed in the build report so they can be
 * proofread and moved into src/i18n/copy.ts. Kept short and plain.
 */
const all = {
  ar: {
    /** Row labels in the progress card (a grown-up's words, not the child's). */
    leaves: 'الأوراق',
    lastScene: 'آخر مشهد',
    letters: 'الحروف',
    /** The confirm step before progress is cleared. */
    resetAsk: 'هل تريد مسح كل التقدّم؟',
    resetYes: 'نعم، امسح',
    cancel: 'إلغاء',
  },
  en: {
    leaves: 'Leaves',
    lastScene: 'Last scene',
    letters: 'Letters',
    resetAsk: 'Clear all progress?',
    resetYes: 'Yes, clear',
    cancel: 'Cancel',
  },
}

export const strings = all[locale]
