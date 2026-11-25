import type { PagesDict } from '../schema'

export default {
  landing: {
    title: 'حكايات للأطفال من 2 إلى 8 سنوات',
    description: 'حكايات للأطفال من عمر سنتين إلى 8 سنوات تعلّم الاحترام واللطف، ولكلّ حكاية كتاب مصوَّر وفيلم قصير ونشاط مشترك.',
  },
  plans: { title: 'الباقات حسب الفئة العمرية', description: 'صفحة مؤقتة لعرض الباقات. لا أسعار بعد.' },
  signIn: { title: 'تسجيل الدخول', description: 'صفحة مؤقتة لتسجيل الدخول. الحسابات غير مفعّلة بعد.' },
  signUp: { title: 'إنشاء حساب', description: 'صفحة مؤقتة لإنشاء حساب. التسجيل غير مفعّل بعد.' },
  legal: { terms: 'شروط الاستخدام', privacy: 'سياسة الخصوصية', refunds: 'الإلغاء واسترداد المال', accessibility: 'بيان إتاحة الوصول', credits: 'الشكر والتراخيص', cookies: 'ملفات تعريف الارتباط والتخزين المحلي' },
  app: { library: 'المكتبة', story: 'الحكاية', collections: 'المجموعات', settings: 'الإعدادات' },
  forgotPassword: { title: 'إعادة تعيين كلمة المرور', description: 'الحصول على رابط لاختيار كلمة مرور جديدة لحساب StoryTime.' },
  cancelPurchase: { title: 'إلغاء عملية شراء', description: 'كيفية إلغاء شراء باقة من StoryTime خلال 14 يومًا: عبر الموقع أو بالبريد الإلكتروني أو بالبريد العادي.' },
} satisfies PagesDict
