import type { PagesDict } from '../schema'

export default {
  landing: {
    title: 'סיפורים לילדים בגילאי 2 עד 8',
    description: 'עמוד זמני: כאן נבנית ספריית סיפורים לילדים בגילאי 2 עד 8.',
  },
  plans: { title: 'מסלולים לפי קבוצת גיל', description: 'עמוד זמני להצגת המסלולים. עדיין אין מחירים.' },
  signIn: { title: 'כניסה', description: 'עמוד כניסה זמני. החשבונות עדיין לא פעילים.' },
  signUp: { title: 'הרשמה', description: 'עמוד הרשמה זמני. ההרשמה עדיין לא פעילה.' },
  legal: { terms: 'תנאי שימוש', privacy: 'מדיניות פרטיות', description: 'עמוד זמני. הנוסח המשפטי בהכנה.' },
  app: { library: 'הספרייה', story: 'הסיפור', collections: 'אוספים', settings: 'הגדרות' },
} satisfies PagesDict
