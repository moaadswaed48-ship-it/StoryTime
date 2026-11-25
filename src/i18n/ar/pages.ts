import type { PagesDict } from '../schema'

export default {
  landing: {
    title: 'حكايات للأطفال من 2 إلى 8 سنوات',
    description: 'حكايات للأطفال من عمر سنتين إلى 8 سنوات تعلّم الاحترام واللطف، وسيكون لكلّ حكاية كتاب مصوَّر وفيلم قصير ونشاط مشترك.',
  },
  plans: { title: 'الباقات حسب الفئة العمرية', description: 'باقات لكلّ فئة عمرية، لشهر أو 3 أشهر أو 12 شهرًا. تُدفع مرة واحدة ولا تتجدّد وحدها. لم تُحدَّد الأسعار بعد.' },
  signIn: { title: 'تسجيل الدخول', description: 'تسجيل الدخول إلى حساب StoryTime.' },
  signUp: { title: 'إنشاء حساب', description: 'إنشاء حساب في StoryTime وبدء التجربة المجانية: 3 حكايات لمدة 3 أيام، دون بطاقة دفع.' },
  legal: { terms: 'شروط الاستخدام', privacy: 'سياسة الخصوصية', refunds: 'الإلغاء واسترداد المال', accessibility: 'بيان إتاحة الوصول', credits: 'الشكر والتراخيص', cookies: 'ملفات تعريف الارتباط والتخزين المحلي' },
  app: { library: 'المكتبة', story: 'الحكاية', collections: 'المجموعات', settings: 'الإعدادات' },
  forgotPassword: { title: 'إعادة تعيين كلمة المرور', description: 'الحصول على رابط لاختيار كلمة مرور جديدة لحساب StoryTime.' },
  cancelPurchase: { title: 'إلغاء عملية شراء', description: 'كيفية إلغاء شراء باقة من StoryTime خلال 14 يومًا: عبر الموقع أو بالبريد الإلكتروني أو بالبريد العادي.' },
  help: { title: 'مساعدة', description: 'إجابات عن الأسئلة الشائعة حول StoryTime، وطرق التواصل معنا.' },
  contact: { title: 'تواصل معنا', description: 'الكتابة إلى فريق StoryTime بسؤال أو فكرة أو مشكلة.' },
} satisfies PagesDict
