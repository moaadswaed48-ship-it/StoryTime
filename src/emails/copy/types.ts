import type { TemplateId } from '../types'

/**
 * The words of every email in one language. {placeholders} are filled from the email's data (dates already in
 * Israel time, prices, age groups); a missing value stays visible and fails the tests in tests/emails.test.ts.
 * A body line that is exactly "{stories}" becomes a list of the story titles.
 */
export type Block = {
  subject: string
  /** The grey line many inboxes show after the subject. */
  preview: string
  heading: string
  body: string[]
  /** The one button. */
  cta?: string
  /** Lines under the button. */
  after?: string[]
}

export type EmailCopy = {
  common: {
    greeting: string
    signoff: string
    team: string
    linkFallback: string
    /** Added after a date and time: "(Israel time)". */
    israelTime: string
    footerService: string
    footerMarketing: string
    unsubscribe: string
    refusalByEmail: string
    notYou: string
    /** Shown wherever the support address goes until the owner gives one (a visible placeholder). */
    supportPlaceholder: string
  }
  /**
   * The marking at the start of a marketing subject line. The law asks for the Hebrew word "פרסומת" (legal checklist
   * item 34); whether a translation is enough in Arabic, English and Danish is unverified (lawyer question 5), so
   * every language puts "פרסומת" first and its own word after it.
   */
  marketingMark: string
  labels: {
    order: string
    pass: string
    passName: string
    group: string
    length: string
    starts: string
    ends: string
    paidOn: string
    total: string
    seller: string
    refund: string
    refundRule: string
    fee: string
    feeUndecided: string
    refundBy: string
    cancelledOn: string
  }
  templates: Record<TemplateId, Block>
}
