import { describe, expect, it } from 'vitest'
import { dueEmails, isQuietHour, reminderParams, type AudienceMember, type ScheduleInput } from '@/emails/schedule'

/**
 * The reminder scheduler: dates and Israel time (including summer time), quiet hours, opt-outs, bounces, never the
 * same reminder twice, no "ends" email when nothing locks, and no stale email after a long outage.
 */
const H = 3_600_000
const D = 24 * H
const iso = (ms: number) => new Date(ms).toISOString()
// 10:00 Israel winter time (UTC+2) on 1 December 2026.
const NOW = Date.parse('2026-12-01T08:00:00Z')

function member(over: Partial<AudienceMember> = {}): AudienceMember {
  return { accountId: 'a1', email: 'Parent@Example.test', lang: 'he', role: 'parent', marketing: false, groups: ['4-5'], trial: null, passes: [], ...over }
}
const run = (audience: AudienceMember[], over: Partial<ScheduleInput> = {}, now = NOW) =>
  dueEmails({ now: iso(now), audience, sentKeys: new Set(), suppressed: new Set(), ...over })
const keys = (r: ReturnType<typeof run>) => r.map((d) => d.key).sort()

describe('quiet hours in Israel time', () => {
  it('knows Israel winter and summer time', () => {
    expect(isQuietHour('2026-12-01T05:30:00Z')).toBe(true) // 07:30 in winter (UTC+2)
    expect(isQuietHour('2026-12-01T06:00:00Z')).toBe(false) // 08:00
    expect(isQuietHour('2026-07-01T05:30:00Z')).toBe(false) // 08:30 in summer (UTC+3)
    expect(isQuietHour('2026-07-01T04:30:00Z')).toBe(true) // 07:30 in summer
    expect(isQuietHour('2026-12-01T19:00:00Z')).toBe(true) // 21:00
    expect(isQuietHour('2026-12-01T18:59:00Z')).toBe(false) // 20:59
  })
  it('holds a reminder due at night until 08:00, still before the end', () => {
    const trial = { id: 't1', ageGroup: '4-5' as const, startedAt: iso(NOW - 2 * D), endsAt: '2026-12-02T01:00:00Z' } // ends 03:00 Israel
    const atNight = Date.parse('2026-12-01T01:30:00Z') // 03:30 Israel: due, but quiet
    expect(run([member({ trial })], {}, atNight)).toEqual([])
    const morning = Date.parse('2026-12-01T06:00:00Z') // 08:00 Israel
    expect(keys(run([member({ trial })], {}, morning))).toEqual(['trial_ends_tomorrow:t1'])
  })
})

describe('trial reminders', () => {
  const trial = (endsIn: number) => ({ id: 't1', ageGroup: '4-5' as const, startedAt: iso(NOW - 3 * D + endsIn), endsAt: iso(NOW + endsIn) })
  it('"ends tomorrow" within the last day, not in its last hour; "ended" for 3 days after', () => {
    expect(run([member({ trial: trial(25 * H) })])).toEqual([])
    expect(keys(run([member({ trial: trial(23 * H) })]))).toEqual(['trial_ends_tomorrow:t1'])
    expect(run([member({ trial: trial(30 * 60_000) })])).toEqual([])
    expect(keys(run([member({ trial: trial(-2 * H) })]))).toEqual(['trial_ended:t1'])
    expect(run([member({ trial: trial(-4 * D) })])).toEqual([])
  })
  it('says nothing about the trial when a pass for its group carries on', () => {
    const pass = { id: 'p1', ageGroup: '4-5' as const, months: 1 as const, startsAt: iso(NOW - D), endsAt: iso(NOW + 29 * D), status: 'active' as const, paidAt: iso(NOW - D) }
    expect(run([member({ trial: trial(23 * H), passes: [pass] })])).toEqual([])
  })
  it('carries the facts the email needs, with a link to the account', () => {
    const [d] = run([member({ trial: trial(23 * H) })])
    expect(d).toMatchObject({ to: 'parent@example.test', lang: 'he', ageGroup: '4-5', template: 'trial_ends_tomorrow' })
    expect(reminderParams(d!, 'https://s.example.test/')).toEqual({ ageGroup: '4-5', endsAt: iso(NOW + 23 * H), link: 'https://s.example.test/he/app/settings/#passes' })
  })
})

describe('pass reminders', () => {
  const pass = (startOffset: number, endOffset: number, over = {}) => ({ id: 'p1', ageGroup: '6-8' as const, months: 1 as const, startsAt: iso(NOW + startOffset), endsAt: iso(NOW + endOffset), status: 'active' as const, paidAt: iso(NOW + startOffset), ...over })
  it('7 days, 1 day, and ended', () => {
    expect(keys(run([member({ passes: [pass(-23 * D, 6.5 * D)] })]))).toEqual(['pass_ends_7d:p1'])
    expect(keys(run([member({ passes: [pass(-29 * D, 20 * H)] })]))).toEqual(['pass_ends_1d:p1'])
    expect(keys(run([member({ passes: [pass(-30 * D, -H)] })]))).toEqual(['pass_ended:p1'])
  })
  it('skips "7 days" for a pass of 8 days or less, and anything for a cancelled pass', () => {
    expect(run([member({ passes: [pass(-1 * D, 6 * D)] })])).toEqual([])
    expect(run([member({ passes: [pass(-30 * D, -H, { status: 'cancelled' })] })])).toEqual([])
  })
  it('a queued pass gets "started"; the pass before it gets no "ends" or "ended"', () => {
    const first = pass(-30 * D, -H, { id: 'first', paidAt: iso(NOW - 30 * D) })
    const queued = pass(-H, 30 * D, { id: 'queued', paidAt: iso(NOW - 10 * D) })
    expect(keys(run([member({ passes: [first, queued] })]))).toEqual(['pass_started:queued'])
    const [d] = run([member({ passes: [first, queued] })])
    expect(reminderParams(d!, 'https://s.example.test/')).toMatchObject({ startsAt: queued.startsAt, endsAt: queued.endsAt })
  })
})

describe('never twice, never to a bounce, news only with consent', () => {
  const trial = { id: 't1', ageGroup: '4-5' as const, startedAt: iso(NOW - 2 * D), endsAt: iso(NOW + 20 * H) }
  it('skips a key already in the email log', () => {
    expect(run([member({ trial })], { sentKeys: new Set(['trial_ends_tomorrow:t1']) })).toEqual([])
  })
  it('skips a suppressed address (bounce or complaint), whatever its case', () => {
    expect(run([member({ trial })], { suppressed: new Set(['parent@example.test']) })).toEqual([])
  })
  it('sends service reminders even to someone who said no to news', () => {
    expect(keys(run([member({ trial, marketing: false })]))).toEqual(['trial_ends_tomorrow:t1'])
  })
  it('sends the news email only with consent, for one of the account’s groups, in a language the story has', () => {
    const story = { id: 's1', publishedAt: iso(NOW - D), langs: ['he', 'ar'] as ('he' | 'ar')[], groups: ['4-5'] as ['4-5'], titles: { he: 'כותרת', ar: 'عنوان' } }
    expect(run([member({ marketing: false })], { newStories: [story] })).toEqual([])
    expect(keys(run([member({ marketing: true })], { newStories: [story] }))).toEqual(['new_story:s1:a1'])
    expect(run([member({ marketing: true, groups: ['2-3'] })], { newStories: [story] })).toEqual([])
    expect(run([member({ marketing: true, lang: 'da' })], { newStories: [story] })).toEqual([])
    expect(run([member({ marketing: true })], { newStories: [{ ...story, publishedAt: iso(NOW - 8 * D) }] })).toEqual([])
    const [d] = run([member({ marketing: true })], { newStories: [story] })
    expect(reminderParams(d!, 'https://s.example.test/', 'https://u.example.test')).toEqual({ title: 'כותרת', ageGroup: '4-5', link: 'https://s.example.test/he/app/story/s1/', unsubscribeUrl: 'https://u.example.test' })
  })
  it('never emails the owner account', () => {
    expect(run([member({ trial, role: 'owner' })])).toEqual([])
  })
})

describe('event emails', () => {
  const night = Date.parse('2026-12-01T00:30:00Z') // 02:30 in Israel
  it('go out at once, also at night, once each', () => {
    const m = member({
      role: 'teacher', confirmedAt: iso(night - H),
      trial: { id: 't9', ageGroup: '2-3', startedAt: iso(night - 10 * 60_000), endsAt: iso(night + 3 * D), stories: ['A', 'B', 'C'] },
      orders: [{ id: 'o1', ageGroup: '6-8', months: 3, amountAgorot: 0, priceWasPlaceholder: true, paidAt: iso(night - 5 * 60_000), startsAt: iso(night), endsAt: iso(night + 90 * D) }],
      refunds: [{ id: 'r1', orderId: 'o0', ageGroup: '4-5', months: 1, paidAgorot: 5000, priceWasPlaceholder: false, amountAgorot: 4750, feeAgorot: 250, status: 'issued', requestedAt: iso(night - 2 * D), issuedAt: iso(night - H), creditDocUrl: null }],
    })
    const due = run([m], {}, night)
    expect(keys(due)).toEqual(['cancellation_received:r1', 'purchase_confirmation:o1', 'refund_issued:r1', 'trial_started:t9', 'welcome:a1'])
    expect(due.find((d) => d.key === 'welcome:a1')!.template).toBe('welcome_teacher')
    expect(run([m], { sentKeys: new Set(due.map((d) => d.key)) }, night)).toEqual([])
    const site = 'https://s.example.test/'
    expect(reminderParams(due.find((d) => d.template === 'purchase_confirmation')!, site)).toMatchObject({ orderRef: 'o1', amountAgorot: null, months: 3, cancelLink: 'https://s.example.test/he/cancel-purchase/' })
    expect(reminderParams(due.find((d) => d.template === 'cancellation_received')!, site)).toMatchObject({ paidAgorot: 5000, feeAgorot: 250, refundBy: iso(night + 12 * D) })
    expect(reminderParams(due.find((d) => d.template === 'trial_started')!, site)).toMatchObject({ stories: ['A', 'B', 'C'], ageGroup: '2-3' })
  })
  it('stop after their window (welcome 2 days, purchase confirmation 30 days)', () => {
    expect(run([member({ confirmedAt: iso(NOW - 3 * D) })])).toEqual([])
    const order = { id: 'o1', ageGroup: '6-8' as const, months: 1 as const, amountAgorot: 100, priceWasPlaceholder: false, paidAt: iso(NOW - 31 * D), startsAt: null, endsAt: null }
    expect(run([member({ orders: [order] })])).toEqual([])
  })
})
