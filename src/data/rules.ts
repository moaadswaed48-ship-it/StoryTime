/**
 * The access rules as pure functions. They mirror supabase/migrations/20261122100100_access.sql and
 * 20261122100200_flows.sql (has_access_to_story, start_trial, confirm_payment, cancel_purchase), so the local
 * backend enforces the same rules and the screens can explain them. tests/rules.test.ts checks them.
 */
import type { AccessSnapshot, AgeGroup, Iso, Pass, PassMonths, Trial } from './types'

export const TRIAL_DAYS = 3
export const TRIAL_STORIES = 3
export const CANCEL_DAYS = 14
/** A pass shows "ending soon" in its last 7 days (the first reminder email goes out then). */
export const ENDING_SOON_DAYS = 7
export const DAY_MS = 86_400_000

const t = (iso: Iso) => new Date(iso).getTime()

/** Adds calendar months the way Postgres adds an interval of months: the day is kept, or clamped to the month's end. */
export function addMonths(iso: Iso, months: number): Iso {
  const d = new Date(iso)
  const y = d.getUTCFullYear()
  const m = d.getUTCMonth() + months
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
  const out = new Date(d)
  out.setUTCFullYear(y, m, Math.min(d.getUTCDate(), last))
  return out.toISOString()
}

export const addDays = (iso: Iso, days: number): Iso => new Date(t(iso) + days * DAY_MS).toISOString()

export const isTrialActive = (trial: Trial | null, now: Iso): trial is Trial => !!trial && t(now) >= t(trial.startedAt) && t(now) < t(trial.endsAt)
export const isTrialEnded = (trial: Trial | null, now: Iso) => !!trial && t(now) >= t(trial.endsAt)

/** A pass that opens content right now. */
export const isPassCurrent = (p: Pass, now: Iso) => p.status === 'active' && t(now) >= t(p.startsAt) && t(now) < t(p.endsAt)

export type PassView = 'queued' | 'active' | 'ending_soon' | 'ended' | 'cancelled' | 'refunded'
export function passView(p: Pass, now: Iso): PassView {
  if (p.status !== 'active') return p.status
  if (t(now) < t(p.startsAt)) return 'queued'
  if (t(now) >= t(p.endsAt)) return 'ended'
  return t(p.endsAt) - t(now) <= ENDING_SOON_DAYS * DAY_MS ? 'ending_soon' : 'active'
}

/** Whole days left, rounded up (a pass ending in 30 hours has 2 days left). */
export const daysLeft = (endIso: Iso, now: Iso) => Math.max(0, Math.ceil((t(endIso) - t(now)) / DAY_MS))

/** Days and hours left in a trial, for the trial counter. */
export function timeLeft(endIso: Iso, now: Iso): { days: number; hours: number } {
  const ms = Math.max(0, t(endIso) - t(now))
  const hours = Math.ceil(ms / 3_600_000)
  return { days: Math.floor(hours / 24), hours: hours % 24 }
}

export type StoryFacts = { id: string; published: boolean; ageGroups: readonly AgeGroup[] }

/** The one question every paid read asks (has_access_to_story in SQL). */
export function hasAccessToStory(a: AccessSnapshot | null, story: StoryFacts): boolean {
  if (!a) return false
  if (a.role === 'owner') return true
  if (!story.published) return false
  if (isTrialActive(a.trial, a.now) && a.trial.storyIds.includes(story.id)) return true
  return a.passes.some((p) => isPassCurrent(p, a.now) && story.ageGroups.includes(p.ageGroup))
}

/** Age groups opened by a current pass. */
export const openGroups = (a: AccessSnapshot): AgeGroup[] => [...new Set(a.passes.filter((p) => isPassCurrent(p, a.now)).map((p) => p.ageGroup))]

/** When a newly bought pass for this group starts: now, or when the running pass for the same group ends. */
export function queuedStart(passes: readonly Pass[], group: AgeGroup, now: Iso): Iso {
  let start = t(now)
  for (const p of passes) if (p.ageGroup === group && p.status === 'active' && t(p.endsAt) > start) start = t(p.endsAt)
  return new Date(start).toISOString()
}

export function passDates(passes: readonly Pass[], group: AgeGroup, months: PassMonths, now: Iso): { startsAt: Iso; endsAt: Iso } {
  const startsAt = queuedStart(passes, group, now)
  return { startsAt, endsAt: addMonths(startsAt, months) }
}

/** The last moment a purchase may be cancelled (14 days from payment). */
export const cancelUntil = (paidAt: Iso) => addDays(paidAt, CANCEL_DAYS)
export const canCancel = (p: Pass, now: Iso) => p.status === 'active' && !!p.paidAt && t(now) <= t(cancelUntil(p.paidAt))

/** The most a cancellation fee may be: the lower of 5% of the price or 100 shekels (legal checklist item 6). */
export const maxCancellationFee = (amountAgorot: number) => Math.min(Math.floor(amountAgorot * 0.05), 10_000)

/** What a refund returns: the price paid minus the fee kept (refunds_amount_returned in SQL; 0 when declined). */
export const refundReturned = (paidAgorot: number, feeAgorot: number | null, declined = false) => (declined ? 0 : paidAgorot - (feeAgorot ?? 0))

/**
 * Whether what someone typed as the order number on the public cancellation form names this order: any run of 8 or
 * more hexadecimal characters (hyphens allowed, case ignored) that the order's id starts with. The family sees the
 * first 8 characters in Settings and the whole id in the purchase email. private.order_ref_matches() in SQL.
 */
export function orderRefMatches(ref: string, orderId: string): boolean {
  const id = orderId.toLowerCase().replace(/-/g, '')
  for (const m of ref.toLowerCase().matchAll(/[0-9a-f][0-9a-f-]{7,}/g)) {
    const run = m[0].replace(/-/g, '')
    if (run.length >= 8 && run.length <= 32 && id.startsWith(run)) return true
  }
  return false
}
