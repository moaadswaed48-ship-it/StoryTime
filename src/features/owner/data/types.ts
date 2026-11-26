import type { Lang } from '@/i18n/config'
import type { AgeGroup, Iso, PageZone, PassMonths } from '@/data/types'

/**
 * The owner's view of a story: everything the owner's area reads and writes. It follows content/SCHEMA.md
 * (pages with a quiet zone for the words, per-language text and speech forms, a film per language with its
 * captions, an activity with steps) and maps onto the tables in supabase/migrations.
 */

/** Where the calm area for the words sits on a page (content/SCHEMA.md `zone`). start = right in Arabic and Hebrew. */
export const ZONE_SIDES = ['start', 'end', 'full'] as const
export const ZONE_VS = ['top', 'middle', 'bottom'] as const
export const ZONE_SIZES = ['s', 'm', 'l'] as const
export type TextZone = PageZone
export const DEFAULT_ZONE: TextZone = { side: 'full', v: 'bottom', size: 'm' }

/** What a stored file is for. A looping step clip is a short video. */
export type MediaKind = 'image' | 'video' | 'captions'
/** Where a file came from: the ownership pack (plan section 13, legal checklist item 37). */
export type MediaSource = 'studio' | 'upload' | 'third_party'

export type MediaRecord = {
  id: string
  kind: MediaKind
  fileName: string
  mimeType: string
  bytes: number
  source: MediaSource
  /** Free text: "own work" for our own files, or the licence of someone else's file. */
  licence: string
  /** Who made it, when it is someone else's file. */
  credit: string | null
  storagePath: string
  createdAt: Iso
}

export type UploadMeta = { purpose: UploadPurpose; source: MediaSource; licence: string; credit: string | null }
/** Decides the size and type limits: a book picture, a film, a caption file, a step picture or loop. */
export type UploadPurpose = 'page' | 'film' | 'captions' | 'step'

export type StoryPage = { key: string; pictureId: string | null; zone: TextZone }
export type ActivityStep = { key: string; mediaId: string | null; loop: boolean }

/** One page's words: what the reader sees, and what the future voice reads (empty = the same as text). */
export type PageText = { text: string; speech: string }

export type ActivityText = {
  title: string
  goal: string
  /** One item per line in the form. */
  materials: string[]
  /** Step captions by step key. */
  steps: Record<string, string>
  safety: string
  forAdult: string
  inClass: string
}

export type LangContent = {
  title: string
  teaser: string
  /** Page words by page key. */
  pages: Record<string, PageText>
  activity: ActivityText
}

export type FilmFiles = { videoId: string | null; captionsId: string | null }

/** A reviewer's "this language is checked". Valid only while the language's content is unchanged. */
export type Signoff = { fingerprint: string; at: Iso; by: string }

export type StoryStatus = 'draft' | 'published'
export type Credit = 'storytime' | 'author'

export type OwnerStory = {
  id: string
  slug: string
  status: StoryStatus
  credit: Credit
  /** The author's story: her Arabic text may not be changed (CLAUDE.md rule 3). */
  textLocked: boolean
  groups: { group: AgeGroup; trial: boolean }[]
  /** null = all four languages; otherwise "publish in these languages only". */
  publishLangs: Lang[] | null
  pages: StoryPage[]
  texts: Record<Lang, LangContent>
  films: Record<Lang, FilmFiles>
  activity: { steps: ActivityStep[] }
  signoffs: Partial<Record<Lang, Signoff>>
  createdAt: Iso
  updatedAt: Iso
  publishedAt: Iso | null
}

/** The parts of a story the editor saves. Status, sign-offs and dates change only through their own actions. */
export type StoryDraft = Pick<OwnerStory, 'groups' | 'pages' | 'texts' | 'films' | 'activity'>

export type OwnerStorySummary = {
  id: string
  status: StoryStatus
  credit: Credit
  titles: Partial<Record<Lang, string>>
  groups: { group: AgeGroup; trial: boolean }[]
  publishLangs: Lang[] | null
  /** Blocking gaps per language (0 = complete). */
  missing: Record<Lang, number>
  signedOff: Record<Lang, boolean>
  updatedAt: Iso
}

export type AuditRow = { id: string; at: Iso; actor: string; action: string; target: string; storyId: string | null; detail: string }

export type Dashboard = {
  /** The clock the numbers were counted at. */
  now: Iso
  signUps: { total: number; last7Days: number; parents: number; teachers: number }
  activeTrials: Record<AgeGroup, number>
  activePasses: Record<AgeGroup, number>
  /** Newest first; never a child's name (product checklist 20). */
  recentPurchases: { orderId: string; email: string | null; ageGroup: AgeGroup; months: number; amountAgorot: number; priceWasPlaceholder: boolean; status: string; paidAt: Iso | null; createdAt: Iso }[]
}

// ---- Part 2 (26 Nov 2026): messages, cancellations and refunds, prices ---------------------------------------------

/** A message from the public contact form (table contact_messages). Read only by the owner. */
export type ContactMessage = {
  id: string
  name: string | null
  email: string
  /** The site language the visitor wrote from. */
  lang: Lang
  message: string
  createdAt: Iso
  /** When the owner marked it as handled; null = still to do. */
  handledAt: Iso | null
}

/** Newest first, with the number still to do (counted by the backend, not from the list, which may be cut short). */
export type Inbox = { messages: ContactMessage[]; unhandled: number }

/** requested = waiting for the owner; issued = the owner marked the money as returned. */
export type RefundStatus = 'requested' | 'issued' | 'declined'

/**
 * A refund request, made when a family cancels a pass within 14 days (cancel_purchase). No money moves through the
 * site: there is no payment company yet. The owner returns the money herself, sets the fee and marks it refunded.
 */
export type RefundRequest = {
  id: string
  orderId: string
  passId: string | null
  /** The buyer's address; null once the account is deleted (the order stays, without a name). */
  email: string | null
  ageGroup: AgeGroup
  months: PassMonths
  /** What the family paid, in agorot. */
  paidAgorot: number
  /** The purchase went through the test provider while no price was set (so nothing was paid). */
  priceWasPlaceholder: boolean
  paidAt: Iso | null
  requestedAt: Iso
  /** The cancellation fee the owner set; null = not decided yet. */
  feeAgorot: number | null
  /** The legal cap: the lower of 5% of what was paid or 100 shekels (src/data/rules.ts maxCancellationFee). */
  maxFeeAgorot: number
  status: RefundStatus
  issuedAt: Iso | null
  /** How and when the owner returned the money (required to mark it refunded). */
  note: string | null
}

/** A request sent through the public "Cancel a purchase" form by someone who was not signed in. */
export type PublicCancellation = { id: string; email: string; orderRef: string; message: string | null; createdAt: Iso; handledAt: Iso | null }

export type RefundsView = {
  /** Newest first. */
  refunds: RefundRequest[]
  /** Requests still waiting for the owner. */
  open: number
  /** Newest first. */
  publicRequests: PublicCancellation[]
}
