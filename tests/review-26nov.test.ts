import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DataError } from '@/data/errors'
import { DB_KEY, LocalServer, memoryKv, type KeyValue } from '@/data/local/server'
import { allPriced, lengthPriced, PRICES } from '@/data/prices'
import { orderRefMatches, refundReturned } from '@/data/rules'
import { TERMS_VERSION } from '@/data/terms'
import type { Price } from '@/data/types'
import { buildEmail, renderEmail } from '@/emails/render'
import { reminderParams, type DueEmail } from '@/emails/schedule'
import { OwnerError } from '@/features/owner/data/api'
import { memoryBlobs } from '@/features/owner/data/blobs'
import { LocalOwnerServer } from '@/features/owner/data/local'

/**
 * Fixes from the fresh review of 26 Nov 2026 (docs/reviews/site-review-26nov.md), on the local (test-mode) backend
 * and in the pure rules both backends share. The database side is tests/db/review-26nov.test.ts; the launch build's
 * files are checked by e2e/stage4b1.spec.ts.
 */
const OWNER = 'owner-1'
const PARENT = 'parent-1'
const DAY = 86_400_000
const ORDER = '3f2a1b9c-1111-4222-8333-944445555666'
let kv: KeyValue
let owner: LocalOwnerServer
let family: LocalServer

const ago = (ms: number) => new Date(Date.now() - ms).toISOString()
const code = (fn: () => unknown) => {
  try {
    fn()
    return null
  } catch (e) {
    return (e as OwnerError | DataError).code
  }
}
const db = () => JSON.parse(kv.get(DB_KEY)!)

beforeEach(() => {
  kv = memoryKv()
  const t = ago(0)
  kv.set(DB_KEY, JSON.stringify({
    version: 1,
    users: [{ id: OWNER, email: 'owner@x.test', createdAt: t, confirmedAt: t }, { id: PARENT, email: 'Parent@X.test', createdAt: t, confirmedAt: t }],
    profiles: { [OWNER]: { role: 'owner', language: 'en' }, [PARENT]: { role: 'parent', language: 'ar' } },
    learners: [], consents: [], trials: [], payments: [], providerEvents: [], outbox: [], tokens: [], deletionRequests: [], failedSignIns: {}, progress: [],
    orders: [
      { id: ORDER, accountId: PARENT, ageGroup: '6-8', months: 3, amountAgorot: 10_000, priceWasPlaceholder: false, provider: 'test', status: 'paid', createdAt: ago(2 * DAY), paidAt: ago(2 * DAY), termsVersion: TERMS_VERSION },
      { id: 'aaaaaaaa-0000-4000-8000-000000000001', accountId: PARENT, ageGroup: '4-5', months: 1, amountAgorot: 4990, priceWasPlaceholder: false, provider: 'test', status: 'paid', createdAt: ago(20 * DAY), paidAt: ago(20 * DAY), termsVersion: TERMS_VERSION },
    ],
    passes: [
      { id: 'p1', accountId: PARENT, orderId: ORDER, ageGroup: '6-8', months: 3, startsAt: ago(2 * DAY), endsAt: ago(-88 * DAY), status: 'active', cancelledAt: null },
      { id: 'p2', accountId: PARENT, orderId: 'aaaaaaaa-0000-4000-8000-000000000001', ageGroup: '4-5', months: 1, startsAt: ago(20 * DAY), endsAt: ago(-10 * DAY), status: 'active', cancelledAt: null },
    ],
    refunds: [],
    cancellationRequests: [
      { id: 'c-short', email: ' parent@x.test', orderRef: `Order #${ORDER.slice(0, 8).toUpperCase()}`, message: null, createdAt: ago(DAY) },
      { id: 'c-wrong-email', email: 'other@x.test', orderRef: ORDER, message: null, createdAt: ago(DAY) },
      { id: 'c-unknown', email: 'parent@x.test', orderRef: 'ORDER-2041', message: null, createdAt: ago(DAY) },
      { id: 'c-late', email: 'parent@x.test', orderRef: 'AAAAAAAA', message: null, createdAt: ago(DAY) },
    ],
  }))
  owner = new LocalOwnerServer(kv, memoryBlobs())
  family = new LocalServer(kv)
})

describe('finding 1: the amount stored, emailed and shown is what was returned', () => {
  it('a 5.00 fee kept on 100.00: the refund row, "Download my data" and the payments list say 95.00 returned and 5.00 kept', () => {
    family.cancelPurchase(PARENT, 'p1', 'ar')
    const id = db().refunds[0].id
    expect(db().refunds[0]).toMatchObject({ amountAgorot: 10_000, feeAgorot: null, status: 'requested' })
    owner.setRefundFee(OWNER, id, 500)
    expect(db().refunds[0].amountAgorot).toBe(9500)
    owner.markRefunded(OWNER, id, 'Bank transfer, 26 Nov')
    expect(db().refunds[0]).toMatchObject({ amountAgorot: 9500, feeAgorot: 500, status: 'issued', note: 'Bank transfer, 26 Nov' })

    const data = family.exportMyData(PARENT) as { refunds: { amountAgorot: number; feeAgorot: number; note: string }[] }
    expect(data.refunds[0]).toMatchObject({ amountAgorot: 9500, feeAgorot: 500, note: 'Bank transfer, 26 Nov' })

    const order = family.listOrders(PARENT).find((o) => o.id === ORDER)!
    expect(order.status).toBe('refunded')
    expect(order.refund).toMatchObject({ status: 'issued', amountAgorot: 9500, feeAgorot: 500, note: 'Bank transfer, 26 Nov' })
    expect(family.listOrders(PARENT).find((o) => o.id !== ORDER)!.refund).toBeNull()
  })

  it('the refund email states the amount returned and the fee, never the price paid', async () => {
    const due: DueEmail = {
      key: 'refund_issued:r1', template: 'refund_issued', accountId: PARENT, to: 'parent@x.test', lang: 'en', ageGroup: '6-8', at: ago(0),
      // As email_audience() sent it before the fix: the stored amount was still the full price.
      refund: { id: 'r1', orderId: ORDER, ageGroup: '6-8', months: 3, paidAgorot: 10_000, priceWasPlaceholder: false, amountAgorot: 10_000, feeAgorot: 500, status: 'issued', requestedAt: ago(DAY), issuedAt: ago(0), creditDocUrl: null },
    }
    const params = reminderParams(due, 'https://s.example.test/') as { amountAgorot: number; feeAgorot: number; paidAgorot: number }
    expect(params).toMatchObject({ amountAgorot: 9500, feeAgorot: 500, paidAgorot: 10_000 })
    const e = await renderEmail('refund_issued', 'en', params as never)
    expect(e.text).toContain('We issued your refund of ₪95.00')
    expect(e.text).not.toContain('refund of ₪100.00')
    expect(e.text).toMatch(/Total, including VAT\s+₪100\.00\s+Cancellation fee\s+₪5\.00\s+Refund\s+₪95\.00/)
    // Every language carries the three rows: total paid, fee, refund.
    for (const lang of ['ar', 'he', 'da'] as const) expect(buildEmail('refund_issued', lang, params as never).subject).toContain(ORDER)
  })

  it('refundReturned is what was paid minus the fee, and 0 when declined', () => {
    expect(refundReturned(10_000, 500)).toBe(9500)
    expect(refundReturned(10_000, null)).toBe(10_000)
    expect(refundReturned(10_000, 0)).toBe(10_000)
    expect(refundReturned(10_000, 500, true)).toBe(0)
  })
})

describe('finding 3: a request from the public cancellation form can be acted on', () => {
  it('orderRefMatches reads the number as the family sees it (8 characters or the whole id), case and hyphens ignored', () => {
    expect(orderRefMatches('3F2A1B9C', ORDER)).toBe(true)
    expect(orderRefMatches('Order #3f2a1b9c', ORDER)).toBe(true)
    expect(orderRefMatches(ORDER.toUpperCase(), ORDER)).toBe(true)
    expect(orderRefMatches('3f2a1b9c1111', ORDER)).toBe(true)
    expect(orderRefMatches('3f2a1b9', ORDER)).toBe(false) // too short to name one order
    expect(orderRefMatches('3f2a1b9d', ORDER)).toBe(false)
    expect(orderRefMatches('ORDER-2041', ORDER)).toBe(false)
    expect(orderRefMatches('', ORDER)).toBe(false)
  })

  it('each request lists the paid orders matching its number and email; a wrong email or number matches nothing', () => {
    const view = owner.listRefunds(OWNER)
    const req = (id: string) => view.publicRequests.find((r) => r.id === id)!
    expect(req('c-short').matches).toEqual([expect.objectContaining({ orderId: ORDER, passId: 'p1', passStatus: 'active', canCancel: true, paidAgorot: 10_000, refundId: null })])
    expect(req('c-wrong-email').matches).toEqual([])
    expect(req('c-unknown').matches).toEqual([])
    expect(req('c-late').matches).toEqual([expect.objectContaining({ passStatus: 'active', canCancel: false })]) // paid 20 days ago
  })

  it('the owner ends the pass and opens the refund by the family rules, logged; the request is handled', () => {
    expect(code(() => owner.cancelForRequest(PARENT, 'c-short', ORDER))).toBe('not_owner')
    expect(code(() => owner.cancelForRequest(OWNER, 'c-wrong-email', ORDER))).toBe('order_not_matching')
    expect(code(() => owner.cancelForRequest(OWNER, 'c-unknown', ORDER))).toBe('order_not_matching')
    expect(code(() => owner.cancelForRequest(OWNER, 'c-late', 'aaaaaaaa-0000-4000-8000-000000000001'))).toBe('cancel_window_closed')

    const refundId = owner.cancelForRequest(OWNER, 'c-short', ORDER)
    const d = db()
    expect(d.passes.find((p: { id: string }) => p.id === 'p1')).toMatchObject({ status: 'cancelled' })
    expect(d.refunds).toEqual([expect.objectContaining({ id: refundId, orderId: ORDER, passId: 'p1', amountAgorot: 10_000, feeAgorot: null, status: 'requested' })])
    expect(d.cancellationRequests.find((c: { id: string }) => c.id === 'c-short').handledAt).toBeTruthy()
    // The cancellation email goes to the buyer, in the account's language, as with the family's own cancellation.
    expect(d.outbox).toEqual([expect.objectContaining({ to: 'Parent@X.test', template: 'cancellation', lang: 'ar' })])
    expect(owner.listRefunds(OWNER).refunds.map((r) => r.id)).toContain(refundId)
    const log = owner.listAudit(OWNER).map((a) => [a.target, a.detail])
    expect(log).toEqual(expect.arrayContaining([['passes', 'p1'], ['refunds', refundId], ['cancellation_requests', `handled; cancelled order ${ORDER}`]]))

    // The fee cap applies to that refund; and not twice.
    expect(code(() => owner.setRefundFee(OWNER, refundId, 501))).toBe('fee_over_cap')
    expect(code(() => owner.cancelForRequest(OWNER, 'c-short', ORDER))).toBe('pass_not_active')
  })
})

describe('finding 7: an order at a price the family did not see is refused', () => {
  it('test mode refuses a different expected price, in both directions', () => {
    owner.setPrice(OWNER, '2-3', 12, 19_900)
    const order = (expected: number | null) => () => family.createOrder(PARENT, { ageGroup: '2-3', months: 12, provider: 'test', termsVersion: TERMS_VERSION, expectedAgorot: expected })
    expect(code(order(14_900))).toBe('price_changed')
    expect(code(order(null))).toBe('price_changed')
    expect(order(19_900)()).toMatchObject({ amountAgorot: 19_900 })
    owner.setPrice(OWNER, '2-3', 12, null)
    expect(code(order(19_900))).toBe('price_changed')
    expect(order(null)()).toMatchObject({ amountAgorot: 0, priceWasPlaceholder: true })
  })
})

describe('finding 8: a build without a real address does not invite crawling', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })
  const load = async (env: Record<string, string>) => {
    vi.resetModules()
    for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v)
    return import('../site.config.ts')
  }
  it('no SITE_ORIGIN, or the placeholder: hidden from search; a real address: open; NOINDEX=1 always hidden', async () => {
    expect((await load({ SITE_ORIGIN: '', NOINDEX: '' })).noIndex).toBe(true)
    expect((await load({ SITE_ORIGIN: 'https://moaadswaed48-ship-it.github.io', NOINDEX: '' })).noIndex).toBe(true)
    expect((await load({ SITE_ORIGIN: 'https://storytime.example', NOINDEX: '' })).noIndex).toBe(false)
    expect((await load({ SITE_ORIGIN: 'https://storytime.example', NOINDEX: '1' })).noIndex).toBe(true)
  })
  it('the robots file of such a build disallows everything', async () => {
    const { robotsTxt } = await import('@/seo/sitemap')
    const cfg = await load({ SITE_ORIGIN: '', NOINDEX: '' })
    expect(robotsTxt(cfg.siteOrigin, '/', cfg.noIndex)).toBe('User-agent: *\nDisallow: /\n')
  })
  it('a launch build (Supabase configured) with the placeholder address and no NOINDEX is refused loudly', async () => {
    await load({ SITE_ORIGIN: '', NOINDEX: '', VITE_SUPABASE_URL: 'https://example.invalid', VITE_SUPABASE_PUBLISHABLE_KEY: 'x' })
    const config = (await import('../vite.config.ts')).default as unknown as (e: { mode: string; command: string }) => unknown
    expect(() => config({ mode: 'production', command: 'build' })).toThrow(/SITE_ORIGIN/)
  })
})

describe('finding 9: price honesty decided per pass', () => {
  const withPrices = (set: [string, number, number][]): Price[] =>
    PRICES.map((p) => ({ ...p, priceAgorot: set.find(([g, m]) => g === p.ageGroup && m === p.months)?.[2] ?? null }))
  it('the home teaser decides per length, and the validity line over all nine passes', () => {
    expect(lengthPriced(PRICES, 1)).toBe('none')
    const one = withPrices([['4-5', 1, 4990]])
    expect([lengthPriced(one, 1), lengthPriced(one, 3), lengthPriced(one, 12)]).toEqual(['some', 'none', 'none'])
    const month = withPrices([['2-3', 1, 3990], ['4-5', 1, 4990], ['6-8', 1, 4990]])
    expect([lengthPriced(month, 1), lengthPriced(month, 3)]).toEqual(['all', 'none'])
    expect([allPriced(PRICES), allPriced(one), allPriced(month)]).toEqual(['none', 'some', 'some'])
    expect(allPriced(PRICES.map((p) => ({ ...p, priceAgorot: 1000 })))).toBe('all')
  })
})
