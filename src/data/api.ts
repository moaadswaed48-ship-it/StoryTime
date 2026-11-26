import type { Lang } from '@/i18n/config'
import type { AccessSnapshot, Account, AccountPrefs, AgeGroup, Learner, Order, PassMonths, Price, Progress, ProgressPatch, Session, StoryContent, StorySummary, Trial } from './types'

/**
 * The one interface the screens use. Two implementations:
 *   local     in the browser (localStorage), for development, browser tests and the preview until a Supabase
 *             project is approved. Enforces the same rules (src/data/rules.ts) as the database.
 *   supabase  @supabase/supabase-js against the migrations in supabase/migrations. NOT yet run against a real
 *             project (none is approved).
 * Every method throws DataError (src/data/errors.ts) with a code the screens translate.
 */
export type SignUpInput = {
  email: string
  password: string
  role: 'parent' | 'teacher'
  language: Lang
  termsVersion: string
  adult: boolean
  marketing: boolean
}

/** A payment-provider message as the server receives it (the shape the test provider sends). */
export type ProviderEvent = {
  provider: string
  eventId: string
  orderId: string
  kind: 'payment_succeeded' | 'payment_failed' | 'payment_cancelled'
  providerPaymentId: string
  amountAgorot: number
}

/** A link from an email: confirming the address, resetting the password, or confirming a new address. */
export type LinkKind = 'signup' | 'recovery' | 'email_change'

export interface DataApi {
  readonly kind: 'local' | 'supabase'

  // Session and sign-in
  getSession(): Promise<Session | null>
  onSessionChange(listener: (s: Session | null) => void): () => void
  /** Creates an unconfirmed account and sends the confirmation email. Consents are recorded with it. */
  signUp(input: SignUpInput): Promise<void>
  resendConfirmation(email: string, language: Lang): Promise<void>
  /** Opens a link from an email. Throws link_expired for an expired or used link. Signs the user in. */
  completeLink(kind: LinkKind, params: URLSearchParams): Promise<Session>
  signIn(email: string, password: string): Promise<Session>
  signOut(): Promise<void>
  /** Never says whether the address has an account. */
  requestPasswordReset(email: string, language: Lang): Promise<void>
  /** Sets a new password for the signed-in user (after a recovery link, or from Settings). */
  setPassword(password: string): Promise<void>

  // Account
  getAccount(): Promise<Account>
  /** `prefs` is merged into the stored settings (only the keys given change). */
  updateAccount(patch: { language?: Lang; storyLanguage?: Lang; onboarded?: true; prefs?: AccountPrefs }): Promise<Account>
  /**
   * Starts a change of the sign-in address: a confirmation link goes to the new address; the address changes only
   * when that link is opened (completeLink('email_change')), and then a notice goes to the old address.
   */
  requestEmailChange(newEmail: string, language: Lang): Promise<void>
  setRole(role: 'parent' | 'teacher'): Promise<void>
  setMarketing(optIn: boolean): Promise<void>
  listLearners(): Promise<Learner[]>
  addLearner(input: { name: string; ageGroup: AgeGroup }): Promise<Learner>
  updateLearner(id: string, patch: { name?: string; ageGroup?: AgeGroup }): Promise<Learner>
  removeLearner(id: string): Promise<void>
  exportMyData(): Promise<unknown>
  deleteAccount(): Promise<void>

  // Catalogue and access
  listStories(lang: Lang, ageGroup?: AgeGroup): Promise<StorySummary[]>
  /** Paid content. Throws locked without an active trial or pass covering the story. */
  getStoryContent(id: string, lang: Lang): Promise<StoryContent>
  getAccess(): Promise<AccessSnapshot>
  startTrial(ageGroup: AgeGroup): Promise<Trial>

  // Progress, per profile (a child or a class)
  listProgress(learnerId: string): Promise<Progress[]>
  /** Merges the patch into the profile's progress in the story; returns the row as saved. */
  saveProgress(learnerId: string, storyId: string, patch: ProgressPatch): Promise<Progress>
  /** "My shelf": the profile's favourite stories, newest first. */
  listFavourites(learnerId: string): Promise<string[]>
  setFavourite(learnerId: string, storyId: string, on: boolean): Promise<void>

  // Money
  listPrices(): Promise<Price[]>
  /**
   * `expectedAgorot` is the price the family was shown (null: "Price not set yet"). The order is refused with
   * price_changed when the current price differs, so nobody is charged a price they did not see.
   */
  createOrder(input: { ageGroup: AgeGroup; months: PassMonths; provider: string; termsVersion: string; expectedAgorot: number | null }): Promise<Order>
  getOrder(id: string): Promise<Order>
  /** The account's orders, newest first, each with its latest refund (amount returned, fee, the owner's note). */
  listOrders(): Promise<Order[]>
  /** The test provider's server callback. A real provider calls the server directly, never the browser. */
  sendTestProviderEvent(event: ProviderEvent): Promise<void>
  /** Cancels one's own pass within 14 days of purchase; a refund request is recorded. */
  cancelPurchase(passId: string): Promise<void>
  /** The public cancellation form (signed out). Never reveals whether the order exists. */
  requestCancellation(input: { email: string; orderRef: string; message?: string }): Promise<void>
  /**
   * The public contact form (signed in or out). Recorded for the owner to read; at most 3 an hour for one address.
   * Nothing is sent by email yet (no sending service; the owner's inbox is not built).
   */
  sendContactMessage(input: ContactMessageInput): Promise<void>
}

/** The longest message the contact form accepts (the database checks the same). */
export const CONTACT_MESSAGE_MAX = 2000
export type ContactMessageInput = { name?: string; email: string; message: string; lang: Lang }
