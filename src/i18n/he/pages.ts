import type { PagesDict } from '../schema'

export default {
  landing: {
    title: 'סיפורים לילדים בגילאי 2 עד 8',
    description: 'סיפורים לגילאי 2 עד 8 שמלמדים כבוד וטוב לב, ולכל סיפור ספר מאויר, סרט קצר ופעילות משותפת.',
  },
  plans: { title: 'מסלולים לפי קבוצת גיל', description: 'עמוד זמני להצגת המסלולים. עדיין אין מחירים.' },
  signIn: { title: 'כניסה', description: 'עמוד כניסה זמני. החשבונות עדיין לא פעילים.' },
  signUp: { title: 'הרשמה', description: 'עמוד הרשמה זמני. ההרשמה עדיין לא פעילה.' },
  legal: { terms: 'תנאי שימוש', privacy: 'מדיניות פרטיות', refunds: 'ביטול עסקה והחזרים', accessibility: 'הצהרת נגישות', credits: 'קרדיטים ורישיונות', cookies: 'עוגיות ואחסון מקומי' },
  app: { library: 'הספרייה', story: 'הסיפור', collections: 'אוספים', settings: 'הגדרות' },
  forgotPassword: { title: 'איפוס סיסמה', description: 'קבלת קישור לבחירת סיסמה חדשה לחשבון StoryTime.' },
  cancelPurchase: { title: 'ביטול רכישה', description: 'איך מבטלים רכישה של מסלול StoryTime תוך 14 יום: באתר, בדוא״ל או בדואר.' },
} satisfies PagesDict
