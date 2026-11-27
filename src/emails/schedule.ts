import type { AgeGroup, Iso, PassMonths, PassStatus } from '@/data/types'
import { refundReturned } from '@/data/rules'
import type { Lang } from '@/i18n/config'
import { israelHour } from './format'
import type { Params, TemplateId } from './types'

/**
 * Who is due which reminder right now. A pure function: the reminder job (supabase/functions/email-reminders)
 * reads the audience, the keys already in email_log and the suppression list, calls this, and sends what it returns.
 *
 * Rules (product checklist 24, legal checklist 11 and 36):
 *   - Service reminders go to every account (they are not advertising), never to a suppressed address
 *     (a permanent bounce or a spam complaint), and carry facts only.
 *   - The news email goes only to accounts whose latest choice is "yes" to news.
 *   - Each reminder has a key (template + trial, pass or story); a key already in email_log is never sent again.
 *   - Quiet hours: nothing is sent between 21:00 and 08:00 Israel time; a reminder due at night goes at 08:00.
 *     The night is 11 hours, so a "tomorrow" reminder still arrives before the end.
 *   - Late runs: an "ends" reminder is dropped once the end is less than an hour away, an "ended" or "started"
 *     one 3 days after the event, so a job that was down for days does not send stale news.
 *   - A pass followed straight away by another pass for the same group, or a trial whose group already has a pass,
 *     gets no "ends" or "ended" reminder: nothing locks.
 *   - Event emails (welcome, trial started, purchase confirmation, cancellation received, refund issued) answer
 *     something the person just did: they ignore quiet hours and go out on the next run (run the job every few
 *     minutes). Legally required ones (purchase confirmation, cancellation) are still sent up to 30 days late.
 */
export type AudiencePass = { id: string; ageGroup: AgeGroup; months: PassMonths; startsAt: Iso; endsAt: Iso; status: PassStatus; paidAt: Iso | null }
export type AudienceOrder = { id: string; ageGroup: AgeGroup; months: PassMonths; amountAgorot: number; priceWasPlaceholder: boolean; paidAt: Iso; startsAt: Iso | null; endsAt: Iso | null }
export type AudienceRefund = {
  id: string; orderId: string; ageGroup: AgeGroup; months: PassMonths; paidAgorot: number; priceWasPlaceholder: boolean
  amountAgorot: number | null; feeAgorot: number | null; status: 'requested' | 'issued' | 'declined'; requestedAt: Iso; issuedAt: Iso | null; creditDocUrl: string | null
}
export type AudienceMember = {
  accountId: string
  email: string
  lang: Lang
  role: 'parent' | 'teacher' | 'owner'
  /** When the address was confirmed (the welcome email follows it). */
  confirmedAt?: Iso | null
  /** The latest marketing consent. */
  marketing: boolean
  /** Age groups of the account's child or class profiles. */
  groups: AgeGroup[]
  trial: { id: string; ageGroup: AgeGroup; startedAt: Iso; endsAt: Iso; stories?: string[] } | null
  passes: AudiencePass[]
  orders?: AudienceOrder[]
  refunds?: AudienceRefund[]
}
export type NewStory = { id: string; publishedAt: Iso; langs: Lang[]; groups: AgeGroup[]; titles: Partial<Record<Lang, string>> }

export type ScheduleInput = {
  now: Iso
  audience: AudienceMember[]
  newStories?: NewStory[]
  /** dedupe_key values already in email_log. */
  sentKeys: ReadonlySet<string>
  /** Lower-case addresses that must get nothing. */
  suppressed: ReadonlySet<string>
}

export type ReminderTemplate = Extract<TemplateId,
  | 'trial_ends_tomorrow' | 'trial_ended' | 'pass_started' | 'pass_ends_7d' | 'pass_ends_1d' | 'pass_ended' | 'new_story'
  | 'welcome_parent' | 'welcome_teacher' | 'trial_started' | 'purchase_confirmation' | 'cancellation_received' | 'refund_issued'>
/** Emails that answer something the person just did: sent at once, also at night. */
export const EVENT_TEMPLATES: ReadonlySet<ReminderTemplate> = new Set(['welcome_parent', 'welcome_teacher', 'trial_started', 'purchase_confirmation', 'cancellation_received', 'refund_issued'])
export type DueEmail = {
  key: string
  template: ReminderTemplate
  accountId: string
  to: string
  lang: Lang
  ageGroup: AgeGroup
  /** The moment the email is about (an end, a start, a publication). */
  at: Iso
  /** pass_started: when the pass ends. */
  endsAt?: Iso
  story?: { id: string; title: string }
  stories?: string[]
  order?: AudienceOrder
  refund?: AudienceRefund
}

const H = 3_600_000
const D = 24 * H
export const QUIET_FROM = 21
export const QUIET_UNTIL = 8
const LATE_AFTER_EVENT = 3 * D
const NEWS_WINDOW = 7 * D

export const isQuietHour = (now: Iso | Date) => {
  const h = israelHour(now)
  return h >= QUIET_FROM || h < QUIET_UNTIL
}

const t = (iso: Iso) => new Date(iso).getTime()

/** Another active pass for the same group that carries on from `end` (so nothing locks then). */
function continues(passes: AudiencePass[], group: AgeGroup, end: Iso, exceptId?: string) {
  return passes.some((p) => p.id !== exceptId && p.status === 'active' && p.ageGroup === group && t(p.startsAt) <= t(end) + 60_000 && t(p.endsAt) > t(end))
}

export function dueEmails(input: ScheduleInput): DueEmail[] {
  const quiet = isQuietHour(input.now)
  const now = t(input.now)
  const out: DueEmail[] = []
  const push = (m: AudienceMember, d: Omit<DueEmail, 'accountId' | 'to' | 'lang'>) => {
    if (input.sentKeys.has(d.key)) return
    if (quiet && !EVENT_TEMPLATES.has(d.template)) return
    out.push({ ...d, accountId: m.accountId, to: m.email.toLowerCase(), lang: m.lang })
  }
  const within = (from: number, until: number) => now >= from && now < until

  for (const m of input.audience) {
    if (m.role === 'owner' || input.suppressed.has(m.email.toLowerCase())) continue

    // Event emails
    if (m.confirmedAt && within(t(m.confirmedAt), t(m.confirmedAt) + 2 * D)) {
      const template = m.role === 'teacher' ? 'welcome_teacher' : 'welcome_parent'
      push(m, { key: `welcome:${m.accountId}`, template, ageGroup: m.groups[0] ?? '4-5', at: m.confirmedAt })
    }
    if (m.trial && within(t(m.trial.startedAt), Math.min(t(m.trial.endsAt), t(m.trial.startedAt) + D))) {
      push(m, { key: `trial_started:${m.trial.id}`, template: 'trial_started', ageGroup: m.trial.ageGroup, at: m.trial.endsAt, stories: m.trial.stories ?? [] })
    }
    for (const o of m.orders ?? []) {
      if (within(t(o.paidAt), t(o.paidAt) + 30 * D)) push(m, { key: `purchase_confirmation:${o.id}`, template: 'purchase_confirmation', ageGroup: o.ageGroup, at: o.paidAt, order: o })
    }
    for (const r of m.refunds ?? []) {
      if (within(t(r.requestedAt), t(r.requestedAt) + 30 * D)) push(m, { key: `cancellation_received:${r.id}`, template: 'cancellation_received', ageGroup: r.ageGroup, at: r.requestedAt, refund: r })
      if (r.status === 'issued' && r.issuedAt && within(t(r.issuedAt), t(r.issuedAt) + 30 * D)) push(m, { key: `refund_issued:${r.id}`, template: 'refund_issued', ageGroup: r.ageGroup, at: r.issuedAt, refund: r })
    }

    const tr = m.trial
    if (tr && !continues(m.passes, tr.ageGroup, tr.endsAt)) {
      const end = t(tr.endsAt)
      if (within(end - D, end - H)) push(m, { key: `trial_ends_tomorrow:${tr.id}`, template: 'trial_ends_tomorrow', ageGroup: tr.ageGroup, at: tr.endsAt })
      if (within(end, end + LATE_AFTER_EVENT)) push(m, { key: `trial_ended:${tr.id}`, template: 'trial_ended', ageGroup: tr.ageGroup, at: tr.endsAt })
    }

    for (const p of m.passes) {
      if (p.status !== 'active') continue
      const start = t(p.startsAt)
      const end = t(p.endsAt)
      // Started later than it was paid for: it was queued behind another pass, so it gets its own "started" email.
      const queued = !!p.paidAt && start - t(p.paidAt) > H
      if (queued && within(start, Math.min(end, start + LATE_AFTER_EVENT))) push(m, { key: `pass_started:${p.id}`, template: 'pass_started', ageGroup: p.ageGroup, at: p.startsAt, endsAt: p.endsAt })
      if (continues(m.passes, p.ageGroup, p.endsAt, p.id)) continue
      if (end - start > 8 * D && within(end - 7 * D, end - D)) push(m, { key: `pass_ends_7d:${p.id}`, template: 'pass_ends_7d', ageGroup: p.ageGroup, at: p.endsAt })
      if (within(end - D, end - H)) push(m, { key: `pass_ends_1d:${p.id}`, template: 'pass_ends_1d', ageGroup: p.ageGroup, at: p.endsAt })
      if (within(end, end + LATE_AFTER_EVENT)) push(m, { key: `pass_ended:${p.id}`, template: 'pass_ended', ageGroup: p.ageGroup, at: p.endsAt })
    }

    if (m.marketing) {
      const mine = new Set<AgeGroup>([...m.groups, ...(m.trial ? [m.trial.ageGroup] : []), ...m.passes.map((p) => p.ageGroup)])
      for (const s of input.newStories ?? []) {
        const group = s.groups.find((g) => mine.has(g))
        const title = s.titles[m.lang]
        if (!group || !title || !s.langs.includes(m.lang) || !within(t(s.publishedAt), t(s.publishedAt) + NEWS_WINDOW)) continue
        push(m, { key: `new_story:${s.id}:${m.accountId}`, template: 'new_story', ageGroup: group, at: s.publishedAt, story: { id: s.id, title } })
      }
    }
  }
  return out
}

/** The template data for a due reminder. Links point into the site (siteUrl = origin + base path, ending in "/"). */
export function reminderParams(d: DueEmail, siteUrl: string, unsubscribeUrl?: string): Params[ReminderTemplate] {
  const app = `${siteUrl}${d.lang}/app/`
  const account = `${app}settings/#passes`
  switch (d.template) {
    case 'trial_ends_tomorrow': return { ageGroup: d.ageGroup, endsAt: d.at, link: account }
    case 'trial_ended': return { ageGroup: d.ageGroup, endedAt: d.at, link: account }
    case 'pass_started': return { ageGroup: d.ageGroup, startsAt: d.at, endsAt: d.endsAt ?? d.at, link: app }
    case 'pass_ends_7d':
    case 'pass_ends_1d': return { ageGroup: d.ageGroup, endsAt: d.at, link: account }
    case 'pass_ended': return { ageGroup: d.ageGroup, endedAt: d.at, link: account }
    case 'new_story': return { title: d.story!.title, ageGroup: d.ageGroup, link: `${app}story/${d.story!.id}/`, unsubscribeUrl: unsubscribeUrl ?? '' }
    case 'welcome_parent':
    case 'welcome_teacher': return { link: app }
    case 'trial_started': return { ageGroup: d.ageGroup, endsAt: d.at, stories: d.stories ?? [], link: `${app}library/` }
    case 'purchase_confirmation': {
      const o = d.order!
      return {
        orderRef: o.id, ageGroup: o.ageGroup, months: o.months, amountAgorot: o.priceWasPlaceholder ? null : o.amountAgorot, paidAt: o.paidAt,
        startsAt: o.startsAt ?? o.paidAt, endsAt: o.endsAt ?? o.paidAt, link: app, cancelLink: `${siteUrl}${d.lang}/cancel-purchase/`,
      }
    }
    case 'cancellation_received': {
      const r = d.refund!
      return {
        orderRef: r.orderId, ageGroup: r.ageGroup, months: r.months, cancelledAt: r.requestedAt, paidAgorot: r.priceWasPlaceholder ? null : r.paidAgorot,
        feeAgorot: r.feeAgorot, refundBy: new Date(t(r.requestedAt) + 14 * D).toISOString(),
      }
    }
    case 'refund_issued': {
      const r = d.refund!
      // The amount actually returned, never the price paid when a fee was kept (review 26 Nov, finding 1).
      const returned = r.feeAgorot === null ? r.amountAgorot : refundReturned(r.paidAgorot, r.feeAgorot)
      return {
        orderRef: r.orderId, amountAgorot: r.priceWasPlaceholder ? null : returned, paidAgorot: r.priceWasPlaceholder ? null : r.paidAgorot,
        feeAgorot: r.feeAgorot, issuedAt: r.issuedAt ?? d.at, creditDocUrl: r.creditDocUrl,
      }
    }
  }
}

/**
 * An email the database queued itself (email_claim_queued() in supabase/migrations/20261122120000_owner_emails_review.sql):
 * today only "account deleted", queued by delete_my_account() with the address captured before the account went.
 * Returns what to send, or null when it must not go (unknown template or language, a suppressed address).
 */
export type QueuedRow = { id: string; to_email: string | null; template: string; lang: string; created_at: Iso }
export function queuedEmail(row: QueuedRow, suppressed: ReadonlySet<string>): { template: 'account_deleted'; lang: Lang; to: string; params: Params['account_deleted']; idempotencyKey: string } | null {
  // A row whose address was already replaced by its hash (20261125120000_email_log_privacy.sql) cannot be sent.
  const to = (row.to_email ?? '').trim().toLowerCase()
  if (row.template !== 'account_deleted' || !to || suppressed.has(to)) return null
  if (!['ar', 'he', 'en', 'da'].includes(row.lang)) return null
  return { template: 'account_deleted', lang: row.lang as Lang, to, params: { deletedAt: row.created_at }, idempotencyKey: `queued:${row.id}` }
}
