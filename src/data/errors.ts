/** Every failure the screens know how to explain. The data layer maps backend errors onto these. */
export const ERROR_CODES = [
  'email_taken',
  'invalid_email',
  'weak_password',
  'wrong_credentials',
  'email_unconfirmed',
  'link_expired',
  'rate_limited',
  'network',
  'not_signed_in',
  'locked',
  'not_found',
  'trial_used',
  'no_trial_stories',
  'profile_limit',
  'role_locked',
  'price_not_set',
  'cancel_window_closed',
  'pass_not_active',
  'terms_required',
  'unknown',
] as const
export type ErrorCode = (typeof ERROR_CODES)[number]

export class DataError extends Error {
  readonly code: ErrorCode
  constructor(code: ErrorCode, detail?: string) {
    super(detail ? `${code}: ${detail}` : code)
    this.name = 'DataError'
    this.code = code
  }
}

export const codeOf = (e: unknown): ErrorCode => (e instanceof DataError ? e.code : 'unknown')

/** Database functions raise their reason as the message ("trial_used"); find a known code in any text. */
export function codeFromText(text: string | undefined | null): ErrorCode | null {
  if (!text) return null
  for (const c of ERROR_CODES) if (new RegExp(`\\b${c}\\b`).test(text)) return c
  return null
}
