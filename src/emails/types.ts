import type { AgeGroup, Iso, PassMonths } from '@/data/types'
import type { Lang } from '@/i18n/config'

/**
 * Every email the product sends (docs/PRODUCT-CHECKLIST.md section 24) and the data each one needs.
 * Service emails carry facts and a link to the account, never an offer (legal checklist item 36). The one
 * marketing email, new_story, goes only to addresses that opted in, marked as the spam law asks (item 34).
 */
export const TEMPLATES = [
  'confirm_email',
  'welcome_parent',
  'welcome_teacher',
  'trial_started',
  'trial_ends_tomorrow',
  'trial_ended',
  'purchase_confirmation',
  'pass_started',
  'pass_ends_7d',
  'pass_ends_1d',
  'pass_ended',
  'password_reset',
  'email_change_confirm',
  'email_changed',
  'account_deleted',
  'cancellation_received',
  'refund_issued',
  'contact_reply',
  'new_story',
] as const
export type TemplateId = (typeof TEMPLATES)[number]

export const MARKETING: ReadonlySet<TemplateId> = new Set(['new_story'])
export const isMarketing = (t: TemplateId) => MARKETING.has(t)

export type Params = {
  confirm_email: { link: string; hours: number }
  welcome_parent: { link: string }
  welcome_teacher: { link: string }
  trial_started: { ageGroup: AgeGroup; endsAt: Iso; stories: string[]; link: string }
  trial_ends_tomorrow: { ageGroup: AgeGroup; endsAt: Iso; link: string }
  trial_ended: { ageGroup: AgeGroup; endedAt: Iso; link: string }
  purchase_confirmation: {
    orderRef: string
    ageGroup: AgeGroup
    months: PassMonths
    /** Final price with VAT; null = the price is still a placeholder (test checkout). */
    amountAgorot: number | null
    paidAt: Iso
    startsAt: Iso
    endsAt: Iso
    link: string
    cancelLink: string
  }
  pass_started: { ageGroup: AgeGroup; startsAt: Iso; endsAt: Iso; link: string }
  pass_ends_7d: { ageGroup: AgeGroup; endsAt: Iso; link: string }
  pass_ends_1d: { ageGroup: AgeGroup; endsAt: Iso; link: string }
  pass_ended: { ageGroup: AgeGroup; endedAt: Iso; link: string }
  password_reset: { link: string; minutes: number }
  email_change_confirm: { link: string; newEmail: string; hours: number }
  email_changed: { newEmail: string }
  account_deleted: { deletedAt: Iso }
  cancellation_received: {
    orderRef: string
    ageGroup: AgeGroup
    months: PassMonths
    cancelledAt: Iso
    /** Price paid; null = placeholder price. */
    paidAgorot: number | null
    /** Fee kept, once the owner sets it; null = not decided yet (capped by law). */
    feeAgorot: number | null
    /** The latest day the refund is made: 14 days after the request. */
    refundBy: Iso
  }
  refund_issued: { orderRef: string; amountAgorot: number | null; issuedAt: Iso; creditDocUrl: string | null }
  contact_reply: { subject: string; reply: string }
  new_story: { title: string; ageGroup: AgeGroup; link: string; unsubscribeUrl: string }
}

/** What the owner must fill in before sending for real: shown as visible placeholders until then (CLAUDE.md rule 4). */
export type SenderDetails = {
  /** Business name, ID number and address; null = placeholder. */
  business: string | null
  /** Support and refusal email address; null = placeholder. */
  supportEmail: string | null
}

export type RenderedEmail = { template: TemplateId; lang: Lang; subject: string; preview: string; html: string; text: string }
