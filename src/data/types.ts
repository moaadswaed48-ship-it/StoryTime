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

export type Account = {
  id: string
  email: string
  role: Role
  language: Lang
  storyLanguage: Lang | null
  onboardedAt: Iso | null
  marketingOptIn: boolean
  createdAt: Iso
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
}

/** Paid content: returned only with access to the story. */
export type StoryContent = {
  id: string
  lang: Lang
  pages: { pageNo: number; display: string; speech: string; pictureUrl: string | null }[]
}

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
export type AccessSnapshot = { now: Iso; role: Role; trial: Trial | null; passes: Pass[] }
