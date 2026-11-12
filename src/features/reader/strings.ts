import { locale } from '@/i18n/locale'

/**
 * Words the reader needs that are not in `t.book` yet (to be proofread, then moved into `src/i18n/copy.ts`).
 * Everything else comes from `t`.
 */
const all = {
  ar: {
    page: 'صفحة',
    textSize: 'حجم الخط',
    smaller: 'خط أصغر',
    larger: 'خط أكبر',
    hint: 'اسحب الصفحة لتقلبها · المس وسطها لتظهر الأدوات',
  },
  en: {
    page: 'Page',
    textSize: 'Text size',
    smaller: 'Smaller text',
    larger: 'Larger text',
    hint: 'Drag the page to turn it · tap the middle for the controls',
  },
}
export const s = all[locale]
