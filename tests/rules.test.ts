import { describe, expect, it } from 'vitest'
import { addMonths, canCancel, cancelUntil, daysLeft, hasAccessToStory, maxCancellationFee, passDates, passView, timeLeft } from '@/data/rules'
import type { AccessSnapshot, Pass } from '@/data/types'

const NOW = '2026-11-22T12:00:00.000Z'
const pass = (over: Partial<Pass> = {}): Pass => ({
  id: 'p', orderId: 'o', ageGroup: '4-5', months: 1, startsAt: '2026-11-20T00:00:00.000Z', endsAt: '2026-12-20T00:00:00.000Z',
  status: 'active', paidAt: '2026-11-20T00:00:00.000Z', amountAgorot: 0, ...over,
})
const snap = (over: Partial<AccessSnapshot> = {}): AccessSnapshot => ({ now: NOW, role: 'parent', trial: null, passes: [], ...over })
const story = { id: 's1', published: true, ageGroups: ['4-5'] as const }
const trial = { id: 't', ageGroup: '4-5' as const, startedAt: '2026-11-21T12:00:00.000Z', endsAt: '2026-11-24T12:00:00.000Z', storyIds: ['s1'] }

describe('access rules (mirror of has_access_to_story)', () => {
  it('signed out and no trial or pass: locked', () => {
    expect(hasAccessToStory(null, story)).toBe(false)
    expect(hasAccessToStory(snap(), story)).toBe(false)
  })
  it('active trial opens its stories only, and only until it ends', () => {
    expect(hasAccessToStory(snap({ trial }), story)).toBe(true)
    expect(hasAccessToStory(snap({ trial }), { ...story, id: 's2' })).toBe(false)
    expect(hasAccessToStory(snap({ trial, now: trial.endsAt }), story)).toBe(false)
  })
  it('a current pass opens its age group, not another; expired, queued or cancelled passes do not', () => {
    expect(hasAccessToStory(snap({ passes: [pass()] }), story)).toBe(true)
    expect(hasAccessToStory(snap({ passes: [pass({ ageGroup: '6-8' })] }), story)).toBe(false)
    expect(hasAccessToStory(snap({ passes: [pass({ endsAt: '2026-11-21T00:00:00.000Z' })] }), story)).toBe(false)
    expect(hasAccessToStory(snap({ passes: [pass({ startsAt: '2026-12-01T00:00:00.000Z', endsAt: '2027-01-01T00:00:00.000Z' })] }), story)).toBe(false)
    expect(hasAccessToStory(snap({ passes: [pass({ status: 'cancelled' })] }), story)).toBe(false)
  })
  it('a story in two age groups opens under a pass for either', () => {
    const shared = { ...story, ageGroups: ['2-3', '6-8'] as const }
    expect(hasAccessToStory(snap({ passes: [pass({ ageGroup: '2-3' })] }), shared)).toBe(true)
    expect(hasAccessToStory(snap({ passes: [pass({ ageGroup: '6-8' })] }), shared)).toBe(true)
  })
  it('drafts stay locked except for the owner', () => {
    expect(hasAccessToStory(snap({ trial }), { ...story, published: false })).toBe(false)
    expect(hasAccessToStory(snap({ role: 'owner' }), { ...story, published: false })).toBe(true)
  })
})

describe('dates', () => {
  it('adds months like Postgres (end of month is clamped)', () => {
    expect(addMonths('2026-01-31T10:00:00.000Z', 1)).toBe('2026-02-28T10:00:00.000Z')
    expect(addMonths('2026-11-22T12:00:00.000Z', 12)).toBe('2027-11-22T12:00:00.000Z')
    expect(addMonths('2026-11-30T00:00:00.000Z', 3)).toBe('2027-02-28T00:00:00.000Z')
  })
  it('queues a new pass after a running one of the same group, not of another group', () => {
    const running = pass()
    expect(passDates([running], '4-5', 3, NOW)).toEqual({ startsAt: running.endsAt, endsAt: '2027-03-20T00:00:00.000Z' })
    expect(passDates([running], '6-8', 1, NOW).startsAt).toBe(NOW)
  })
  it('names the pass states', () => {
    expect(passView(pass(), NOW)).toBe('active')
    expect(passView(pass({ endsAt: '2026-11-25T00:00:00.000Z' }), NOW)).toBe('ending_soon')
    expect(passView(pass({ endsAt: '2026-11-21T00:00:00.000Z' }), NOW)).toBe('ended')
    expect(passView(pass({ startsAt: '2026-12-01T00:00:00.000Z' }), NOW)).toBe('queued')
    expect(passView(pass({ status: 'refunded' }), NOW)).toBe('refunded')
  })
  it('counts time left', () => {
    expect(timeLeft(trial.endsAt, NOW)).toEqual({ days: 2, hours: 0 })
    expect(timeLeft(trial.endsAt, '2026-11-24T11:30:00.000Z')).toEqual({ days: 0, hours: 1 })
    expect(daysLeft('2026-11-23T18:00:00.000Z', NOW)).toBe(2)
  })
})

describe('cancellation (14 days; fee at most the lower of 5% or 100 shekels)', () => {
  it('is open for 14 days from payment', () => {
    const p = pass({ paidAt: NOW })
    expect(cancelUntil(NOW)).toBe('2026-12-06T12:00:00.000Z')
    expect(canCancel(p, '2026-12-06T12:00:00.000Z')).toBe(true)
    expect(canCancel(p, '2026-12-06T12:00:00.001Z')).toBe(false)
    expect(canCancel({ ...p, status: 'cancelled' }, NOW)).toBe(false)
  })
  it('caps the fee', () => {
    expect(maxCancellationFee(10_000)).toBe(500) // 5% of 100 shekels
    expect(maxCancellationFee(1_000_000)).toBe(10_000) // never more than 100 shekels
  })
})
