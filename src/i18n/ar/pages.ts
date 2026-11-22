import type { PagesDict } from '../schema'

export default {
  landing: {
    title: 'حكايات للأطفال من 2 إلى 8 سنوات',
    description: 'صفحة مؤقتة: نعمل على بناء مكتبة حكايات للأطفال من 2 إلى 8 سنوات.',
  },
  plans: { title: 'الباقات حسب الفئة العمرية', description: 'صفحة مؤقتة لعرض الباقات. لا أسعار بعد.' },
  signIn: { title: 'تسجيل الدخول', description: 'صفحة مؤقتة لتسجيل الدخول. الحسابات غير مفعّلة بعد.' },
  signUp: { title: 'إنشاء حساب', description: 'صفحة مؤقتة لإنشاء حساب. التسجيل غير مفعّل بعد.' },
  legal: { terms: 'شروط الاستخدام', privacy: 'سياسة الخصوصية', description: 'صفحة مؤقتة. النص القانوني قيد الإعداد.' },
  app: { library: 'المكتبة', story: 'الحكاية', collections: 'المجموعات', settings: 'الإعدادات' },
} satisfies PagesDict
