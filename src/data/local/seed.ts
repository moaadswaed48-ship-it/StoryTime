import type { Lang } from '@/i18n/config'
import type { AgeGroup } from '../types'

/**
 * Sample stories for the local backend. They are obviously samples (title, teaser and page text say so) and exist
 * only to exercise access: no real story text ships in the bundle (CLAUDE.md rule 6). Each age group has three
 * trial samples plus one sample from a neighbouring group listed in it too (not a trial story there), so every
 * group has one locked story during a trial and a story listed in two groups is tested.
 */
export type SeedStory = {
  id: string
  slug: string
  status: 'published' | 'draft'
  groups: { group: AgeGroup; trial: boolean; position: number }[]
  number: number
  home: AgeGroup
}

const L: Record<Lang, { title: (n: number, g: string) => string; teaser: string; page: (n: number) => string }> = {
  en: {
    title: (n, g) => `Sample story ${n} (ages ${g})`,
    teaser: 'A placeholder for testing access. Not a real story.',
    page: (n) => `Sample page ${n}. This placeholder text is shown only to accounts with access to this story.`,
  },
  ar: {
    title: (n, g) => `قصة تجريبية ${n} (عمر ${g})`,
    teaser: 'نصّ مؤقت لتجربة الوصول. ليست قصة حقيقية.',
    page: (n) => `صفحة تجريبية ${n}. هذا النص المؤقت يظهر فقط للحسابات التي لها وصول إلى هذه القصة.`,
  },
  he: {
    title: (n, g) => `סיפור לדוגמה ${n} (גילאי ${g})`,
    teaser: 'טקסט זמני לבדיקת הגישה. זה לא סיפור אמיתי.',
    page: (n) => `עמוד לדוגמה ${n}. הטקסט הזמני הזה מוצג רק לחשבונות עם גישה לסיפור.`,
  },
  da: {
    title: (n, g) => `Eksempelhistorie ${n} (${g} år)`,
    teaser: 'En pladsholder til at teste adgang. Ikke en rigtig historie.',
    page: (n) => `Eksempelside ${n}. Denne pladsholdertekst vises kun for konti med adgang til historien.`,
  },
}

function make(home: AgeGroup, n: number, extra?: AgeGroup, status: 'published' | 'draft' = 'published'): SeedStory {
  const slug = `sample-${home.replace('-', '')}-${n}`
  return {
    id: `story-${slug}`,
    slug,
    status,
    number: n,
    home,
    groups: [{ group: home, trial: status === 'published', position: n }, ...(extra ? [{ group: extra, trial: false, position: 9 }] : [])],
  }
}

export const SEED_STORIES: SeedStory[] = [
  make('2-3', 1),
  make('2-3', 2),
  make('2-3', 3),
  make('4-5', 1, '2-3'),
  make('4-5', 2),
  make('4-5', 3, '6-8'),
  make('6-8', 1, '4-5'),
  make('6-8', 2),
  make('6-8', 3),
  make('4-5', 4, undefined, 'draft'),
]

export const seedTitle = (s: SeedStory, lang: Lang) => L[lang].title(s.number, s.home.replace('-', '–'))
export const seedTeaser = (lang: Lang) => L[lang].teaser
export const seedPages = (lang: Lang) => [1, 2].map((n) => ({ pageNo: n, display: L[lang].page(n), speech: L[lang].page(n), pictureUrl: null }))
