import type { ErrorCode } from '@/data/errors'
import type { Dict } from '@/i18n/schema'

/** The sentence a screen shows for a data-layer error, in the page's language. */
export function errorText(dict: Dict, code: ErrorCode): string {
  const e = dict.account.errors
  const map: Partial<Record<ErrorCode, string>> = {
    email_taken: e.emailTaken,
    invalid_email: e.invalidEmail,
    weak_password: e.weakPassword,
    wrong_credentials: e.wrongCredentials,
    email_unconfirmed: e.unconfirmed,
    link_expired: dict.account.auth.linkExpiredTitle,
    rate_limited: e.rateLimited,
    network: e.network,
    not_signed_in: dict.account.auth.sessionExpired,
    locked: e.locked,
    not_found: e.notFound,
    trial_used: e.trialUsed,
    no_trial_stories: e.noTrialStories,
    profile_limit: e.profileLimit,
    role_locked: e.roleLocked,
    cancel_window_closed: e.cancelWindowClosed,
    pass_not_active: e.passNotActive,
    terms_required: e.mustAccept,
    price_changed: dict.commerce.checkout.priceChangedTitle,
    seller_not_set: e.sellerNotSet,
    price_not_set: e.priceNotSet,
  }
  return map[code] ?? e.unknown
}

/** Password strength in plain words: too short, good enough, strong. */
export function strengthOf(password: string): 'weak' | 'fair' | 'strong' | null {
  if (!password) return null
  if (password.length < 8) return 'weak'
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^\w\s]/, /\s/, /[^\x00-\x7F]/].filter((r) => r.test(password)).length
  return password.length >= 14 || (password.length >= 10 && kinds >= 3) ? 'strong' : 'fair'
}
