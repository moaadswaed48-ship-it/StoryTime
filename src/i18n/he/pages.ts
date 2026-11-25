import type { PagesDict } from '../schema'

export default {
  landing: {
    title: 'סיפורים לילדים בגילאי 2 עד 8',
    description: 'סיפורים לגילאי 2 עד 8 שמלמדים כבוד וטוב לב. לכל סיפור יהיו ספר מאויר, סרט קצר ופעילות משותפת.',
  },
  plans: { title: 'מסלולים לפי קבוצת גיל', description: 'מסלולים לכל קבוצת גיל, לחודש, ל־3 חודשים או ל־12 חודשים. משלמים פעם אחת, והמסלול לא מתחדש מעצמו. המחירים עדיין לא נקבעו.' },
  signIn: { title: 'כניסה', description: 'כניסה לחשבון StoryTime.' },
  signUp: { title: 'הרשמה', description: 'הרשמה ל־StoryTime והתחלת ניסיון חינם: 3 סיפורים ל־3 ימים, בלי כרטיס אשראי.' },
  legal: { terms: 'תנאי שימוש', privacy: 'מדיניות פרטיות', refunds: 'ביטול עסקה והחזרים', accessibility: 'הצהרת נגישות', credits: 'קרדיטים ורישיונות', cookies: 'עוגיות ואחסון מקומי' },
  app: { library: 'הספרייה', story: 'הסיפור', collections: 'אוספים', settings: 'הגדרות' },
  forgotPassword: { title: 'איפוס סיסמה', description: 'קבלת קישור לבחירת סיסמה חדשה לחשבון StoryTime.' },
  cancelPurchase: { title: 'ביטול רכישה', description: 'איך מבטלים רכישה של מסלול StoryTime תוך 14 יום: באתר, בדוא״ל או בדואר.' },
  help: { title: 'עזרה', description: 'תשובות לשאלות נפוצות על StoryTime, ודרכים ליצור איתנו קשר.' },
  contact: { title: 'יצירת קשר', description: 'כתיבה לצוות StoryTime: שאלה, רעיון או בעיה.' },
} satisfies PagesDict
