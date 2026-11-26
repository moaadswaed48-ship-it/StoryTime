import type { Lang } from '@/i18n/config'

/** The three age groups (plan section 14). The order is the display order. */
export const AGE_GROUPS = ['2-3', '4-5', '6-8'] as const
export type AgeGroup = (typeof AGE_GROUPS)[number]
export const isAgeGroup = (v: unknown): v is AgeGroup => typeof v === 'string' && (AGE_GROUPS as readonly string[]).includes(v)

/** Pass lengths in months. */
export const PASS_MONTHS = [1, 3, 12] as const
export type PassMonths = (typeof PASS_MONTHS)[number]
export const isPassMonths = (v: unknown): v is PassMonths => (PASS_MONTHS as readonly unknown[]).includes(v)

export type Role = 'parent' | 'teacher' | 'owner'
/** A parent account keeps child profiles; a teacher account keeps classes (no children's names). */
export type LearnerKind = 'child' | 'class'
export const learnerKindFor = (role: Role): LearnerKind => (role === 'teacher' ? 'class' : 'child')

/** Every time is an ISO 8601 string in UTC. */
export type Iso = string

export type Session = { userId: string; email: string }

/**
 * Reading and film settings kept with the account (profiles.prefs), so they follow it to another device. Only these
 * keys; the database refuses any other (supabase/migrations/20261125130000_family_prefs_favourites.sql, and
 * 20261126110000_classroom_mode.sql for `classroom`).
 */
export type AccountPrefs = {
  autoFlip?: boolean
  captions?: boolean
  /** Index into TEXT_SCALES (src/reader/zone.ts). */
  textScale?: number
  view?: 'shelf' | 'list' | null
  hintSeen?: boolean
  /** Classroom mode (big screen, big words) for a teacher's account; the screens ignore it for other roles. */
  classroom?: boolean
}
export const PREF_KEYS = ['autoFlip', 'captions', 'textScale', 'view', 'hintSeen', 'classroom'] as const

/** Keeps only the known keys with the right types (both backends store only this). */
export function cleanPrefs(v: unknown): AccountPrefs {
  const o = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>
  const out: AccountPrefs = {}
  if (typeof o.autoFlip === 'boolean') out.autoFlip = o.autoFlip
  if (typeof o.captions === 'boolean') out.captions = o.captions
  if (typeof o.hintSeen === 'boolean') out.hintSeen = o.hintSeen
  if (typeof o.classroom === 'boolean') out.classroom = o.classroom
  if (typeof o.textScale === 'number' && o.textScale >= 0 && o.textScale <= 3) out.textScale = Math.round(o.textScale)
  if (o.view === 'shelf' || o.view === 'list' || o.view === null) out.view = o.view
  return out
}

export type Account = {
  id: string
  email: string
  role: Role
  language: Lang
  storyLanguage: Lang | null
  onboardedAt: Iso | null
  marketingOptIn: boolean
  createdAt: Iso
  /** Reading and film settings (empty until one is changed). */
  prefs: AccountPrefs
}

export type Learner = { id: string; kind: LearnerKind; name: string; ageGroup: AgeGroup }

/** Catalogue facts any signed-in user may see (cover, title, age groups). Never story text. */
export type StorySummary = {
  id: string
  slug: string
  title: string
  teaser: string
  ageGroups: AgeGroup[]
  /** Age groups in which this story is one of the trial stories. */
  trialIn: AgeGroup[]
  isSample: boolean
  credit: 'storytime' | 'author'
  coverUrl: string | null
  /**
   * What the story has (catalogue facts, not content), so the collections can list films and activities without
   * fetching paid content. Undefined = not known by this backend yet: the screens then assume it exists.
   */
  features?: { listen: boolean; film: boolean; activity: boolean; filmSoon?: boolean }
}

/** Where the calm area for words sits on a page (content/SCHEMA.md). "start" is the reading side. */
export type PageZone = { side: 'start' | 'end' | 'full'; v: 'top' | 'middle' | 'bottom'; size: 's' | 'm' | 'l' }

/** A page's recording and when each word of its text is spoken (see WordTiming in src/content/schema.ts). */
export type ReadAlong = { audioUrl: string; timing: { duration: number; words: [number, number][] } }

export type StoryPage = {
  pageNo: number
  display: string
  speech: string
  pictureUrl: string | null
  /** null: no zone known (the reader uses a full-width band at the bottom). */
  zone: PageZone | null
  /** null: no recording for this page in this language yet. */
  readAlong: ReadAlong | null
}

export type FilmContent = {
  /** The film file; null while the film is not made yet. */
  videoUrl: string | null
  posterUrl: string | null
  /** WebVTT captions in the language of the voice; null when there are none. */
  captionsUrl: string | null
  captionsLang: Lang
}

export type ActivityContent = {
  title: string
  goal: string
  minutes: number | null
  materials: { id: string; label: string; pictureUrl: string | null }[]
  steps: { n: number; caption: string; pictureUrl: string | null; loopUrl: string | null }[]
  safety: string
  forAdult: string
  inClass: string
}

/** Paid content: returned only with access to the story. */
export type StoryContent = {
  id: string
  /** The language of the text returned (the one asked for, or the nearest one the story has). */
  lang: Lang
  title: string
  credit: 'storytime' | 'author'
  isSample: boolean
  pages: StoryPage[]
  film: FilmContent | null
  activity: ActivityContent | null
}

/** One profile's progress in one story (the progress table). */
export type Progress = {
  storyId: string
  /** Last page shown (1-based); null when the book was never opened. */
  lastPage: number | null
  filmWatched: boolean
  activityDone: boolean
  /** Where this profile stopped in the story's film, in whole seconds; null = from the start. */
  filmPositionS: number | null
  updatedAt: Iso
}
export type ProgressPatch = Partial<Pick<Progress, 'lastPage' | 'filmWatched' | 'activityDone' | 'filmPositionS'>>
export const MAX_FILM_POSITION_S = 36_000

export type Trial = { id: string; ageGroup: AgeGroup; startedAt: Iso; endsAt: Iso; storyIds: string[] }

export type PassStatus = 'active' | 'cancelled' | 'refunded'
export type Pass = {
  id: string
  orderId: string | null
  ageGroup: AgeGroup
  months: PassMonths
  startsAt: Iso
  endsAt: Iso
  status: PassStatus
  /** When the order was paid: the 14-day cancellation window counts from here. */
  paidAt: Iso | null
  amountAgorot: number
}

export type OrderStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded'
export type Order = {
  id: string
  ageGroup: AgeGroup
  months: PassMonths
  amountAgorot: number
  /** True when the price was not set yet and the order went through the test provider for 0. */
  priceWasPlaceholder: boolean
  provider: string
  status: OrderStatus
  createdAt: Iso
  paidAt: Iso | null
}

/** Final price with VAT, in agorot. null = not set by the owner yet (a visibly marked placeholder). */
export type Price = { ageGroup: AgeGroup; months: PassMonths; priceAgorot: number | null }

/** What the app needs to decide what is open: the clock the server used, the trial and the passes. */
export type AccessSnapshot = {
  now: Iso
  role: Role
  trial: Trial | null
  passes: Pass[]
  /** The trial's stories that a profile of this account has opened (read, watched or done), for "1 of 3 opened". */
  trialOpened?: string[]
}
