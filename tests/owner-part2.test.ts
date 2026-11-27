import { beforeEach, describe, expect, it } from 'vitest'
import { DB_KEY, LocalServer, memoryKv, type KeyValue } from '@/data/local/server'
import { TERMS_VERSION } from '@/data/terms'
import { OwnerError } from '@/features/owner/data/api'
import { memoryBlobs } from '@/features/owner/data/blobs'
import { LocalOwnerServer } from '@/features/owner/data/local'
import { agorotToInput, parseShekels, priceProblem } from '@/features/owner/data/money'

/**
 * Owner's area, part 2, on the local (test-mode) backend: the same rules as the database
 * (tests/db/owner-part2.test.ts): owner only, inbox newest first with a count, the fee cap, a note to mark a refund,
 * prices that the family side and create_order then use, and an audit row for every change.
 */
const OWNER = 'owner-1'
const PARENT = 'parent-1'
const DAY = 86_400_000
let kv: KeyValue
let srv: LocalOwnerServer

const ago = (ms: number) => new Date(Date.now() - ms).toISOString()
const code = (fn: () => unknown) => {
  try {
    fn()
    return null
  } catch (e) {
    return (e as OwnerError).code
  }
}
const db = () => JSON.parse(kv.get(DB_KEY)!)

beforeEach(() => {
  kv = memoryKv()
  const t = ago(0)
  kv.set(DB_KEY, JSON.stringify({
    version: 1,
    users: [{ id: OWNER, email: 'owner@x.test', createdAt: t }, { id: PARENT, email: 'p@x.test', createdAt: t }],
    profiles: { [OWNER]: { role: 'owner' }, [PARENT]: { role: 'parent' } },
    orders: [
      { id: 'o1', accountId: PARENT, ageGroup: '6-8', months: 3, amountAgorot: 4990, priceWasPlaceholder: false, provider: 'test', status: 'paid', createdAt: ago(2 * DAY), paidAt: ago(2 * DAY) },
      { id: 'o2', accountId: null, ageGroup: '2-3', months: 12, amountAgorot: 300_000, priceWasPlaceholder: false, provider: 'test', status: 'paid', createdAt: ago(DAY), paidAt: ago(DAY) },
    ],
    passes: [{ id: 'p1', accountId: PARENT, orderId: 'o1', ageGroup: '6-8', months: 3, startsAt: ago(2 * DAY), endsAt: ago(-80 * DAY), status: 'cancelled', cancelledAt: ago(DAY) }],
    refunds: [
      { id: 'r1', orderId: 'o1', passId: 'p1', amountAgorot: 4990, feeAgorot: null, status: 'requested', requestedAt: ago(DAY) },
      { id: 'r2', orderId: 'o2', passId: 'gone', amountAgorot: 300_000, feeAgorot: null, status: 'requested', requestedAt: ago(DAY / 2) },
    ],
    contactMessages: [
      { id: 'm1', name: null, email: 'a@x.test', lang: 'ar', message: 'مرحبا', createdAt: ago(3 * DAY) },
      { id: 'm2', name: 'Dana', email: 'b@x.test', lang: 'he', message: 'Hi', createdAt: ago(DAY) },
    ],
    cancellationRequests: [{ id: 'c1', email: 'pub@x.test', orderRef: 'ORDER-9', message: null, createdAt: ago(DAY) }],
  }))
  srv = new LocalOwnerServer(kv, memoryBlobs())
})

describe('owner only', () => {
  it('a parent and a signed-out visitor are refused every part-2 call', () => {
    for (const uid of [PARENT, null]) {
      const want = uid ? 'not_owner' : 'not_signed_in'
      expect(code(() => srv.listMessages(uid))).toBe(want)
      expect(code(() => srv.setMessageHandled(uid, 'm1', true))).toBe(want)
      expect(code(() => srv.listRefunds(uid))).toBe(want)
      expect(code(() => srv.setRefundFee(uid, 'r1', 0))).toBe(want)
      expect(code(() => srv.markRefunded(uid, 'r1', 'x'))).toBe(want)
      expect(code(() => srv.setCancellationHandled(uid, 'c1', true))).toBe(want)
      expect(code(() => srv.listPrices(uid))).toBe(want)
      expect(code(() => srv.setPrice(uid, '4-5', 1, 4990))).toBe(want)
    }
  })
})

describe('messages', () => {
  it('newest first with the unhandled count; handled and back; audit rows only for real changes', () => {
    let inbox = srv.listMessages(OWNER)
    expect(inbox.messages.map((m) => m.id)).toEqual(['m2', 'm1'])
    expect(inbox.unhandled).toBe(2)
    const m = srv.setMessageHandled(OWNER, 'm2', true)
    expect(m.handledAt).not.toBeNull()
    srv.setMessageHandled(OWNER, 'm2', true)
    inbox = srv.listMessages(OWNER)
    expect(inbox.unhandled).toBe(1)
    srv.setMessageHandled(OWNER, 'm2', false)
    expect(srv.listMessages(OWNER).unhandled).toBe(2)
    const log = srv.listAudit(OWNER).filter((a) => a.target === 'contact_messages')
    expect(log.map((a) => a.detail)).toEqual(['not handled', 'handled'])
    expect(JSON.stringify(log)).not.toMatch(/x\.test|Hi/)
    expect(code(() => srv.setMessageHandled(OWNER, 'nope', true))).toBe('not_found')
  })

  it('a message sent through the family-side contact form shows up in the inbox', () => {
    new LocalServer(kv).sendContactMessage({ email: 'new@x.test', message: 'Hello there', lang: 'da' })
    const inbox = srv.listMessages(OWNER)
    expect(inbox.messages[0]).toMatchObject({ email: 'new@x.test', lang: 'da', handledAt: null })
    expect(inbox.unhandled).toBe(3)
  })
})

describe('refunds', () => {
  it('lists each request with the buyer, what was paid and the cap; a deleted account shows no email', () => {
    const v = srv.listRefunds(OWNER)
    expect(v.open).toBe(2)
    expect(v.refunds.map((r) => r.id)).toEqual(['r2', 'r1'])
    expect(v.refunds[1]).toMatchObject({ email: 'p@x.test', ageGroup: '6-8', months: 3, paidAgorot: 4990, maxFeeAgorot: 249, feeAgorot: null, status: 'requested' })
    expect(v.refunds[0]).toMatchObject({ email: null, maxFeeAgorot: 10_000 })
    expect(v.publicRequests).toEqual([expect.objectContaining({ id: 'c1', orderRef: 'ORDER-9', handledAt: null })])
  })

  it('fee within the cap, then a note, then final: pass and order become refunded', () => {
    expect(code(() => srv.setRefundFee(OWNER, 'r1', 250))).toBe('fee_over_cap')
    expect(code(() => srv.setRefundFee(OWNER, 'r1', -1))).toBe('fee_over_cap')
    expect(code(() => srv.markRefunded(OWNER, 'r1', 'Bank'))).toBe('fee_not_set')
    srv.setRefundFee(OWNER, 'r1', 249)
    expect(code(() => srv.markRefunded(OWNER, 'r1', '  '))).toBe('note_required')
    expect(code(() => srv.markRefunded(OWNER, 'r1', 'x'.repeat(501)))).toBe('note_required')
    srv.markRefunded(OWNER, 'r1', ' Bank transfer, ref 12 ')
    const r = srv.listRefunds(OWNER).refunds.find((x) => x.id === 'r1')!
    expect(r).toMatchObject({ status: 'issued', feeAgorot: 249, note: 'Bank transfer, ref 12' })
    expect(r.issuedAt).not.toBeNull()
    expect(db().passes[0].status).toBe('refunded')
    expect(db().orders[0].status).toBe('refunded')
    expect(srv.listRefunds(OWNER).open).toBe(1)
    expect(code(() => srv.setRefundFee(OWNER, 'r1', 0))).toBe('refund_closed')
    expect(code(() => srv.markRefunded(OWNER, 'r1', 'again'))).toBe('refund_closed')
    const targets = srv.listAudit(OWNER).map((a) => a.target)
    expect(targets.filter((t) => t === 'refunds')).toHaveLength(2)
    expect(targets).toContain('passes')
  })

  it('the family sees the refunded pass and the note in its own data', () => {
    srv.setRefundFee(OWNER, 'r1', 0)
    srv.markRefunded(OWNER, 'r1', 'Returned in full')
    const fam = new LocalServer(kv)
    expect(fam.access(PARENT).passes[0]!.status).toBe('refunded')
    const data = fam.exportMyData(PARENT) as { refunds: { note: string; status: string }[] }
    expect(data.refunds[0]).toMatchObject({ status: 'issued', note: 'Returned in full' })
  })

  it('public form requests: handled and back, with audit rows', () => {
    srv.setCancellationHandled(OWNER, 'c1', true)
    expect(srv.listRefunds(OWNER).publicRequests[0]!.handledAt).not.toBeNull()
    srv.setCancellationHandled(OWNER, 'c1', false)
    expect(srv.listRefunds(OWNER).publicRequests[0]!.handledAt).toBeNull()
    expect(srv.listAudit(OWNER).filter((a) => a.target === 'cancellation_requests')).toHaveLength(2)
  })
})

describe('prices', () => {
  it('all nine start not set; the owner sets one, the family side and create_order use it; clearing brings the placeholder back', async () => {
    expect(srv.listPrices(OWNER).every((p) => p.priceAgorot === null)).toBe(true)
    expect(srv.listPrices(OWNER)).toHaveLength(9)
    expect(code(() => srv.setPrice(OWNER, '4-5', 1, 99))).toBe('bad_price')
    expect(code(() => srv.setPrice(OWNER, '4-5', 1, 1_000_001))).toBe('bad_price')
    expect(code(() => srv.setPrice(OWNER, '4-5', 1, 49.5))).toBe('bad_price')
    const list = srv.setPrice(OWNER, '4-5', 1, 4990)
    expect(list.find((p) => p.ageGroup === '4-5' && p.months === 1)!.priceAgorot).toBe(4990)
    expect(list.filter((p) => p.priceAgorot !== null)).toHaveLength(1)

    const fam = new LocalServer(kv)
    expect(fam.listPrices().find((p) => p.ageGroup === '4-5' && p.months === 1)!.priceAgorot).toBe(4990)
    const o = fam.createOrder(PARENT, { ageGroup: '4-5', months: 1, provider: 'test', termsVersion: TERMS_VERSION, expectedAgorot: 4990 })
    expect(o).toMatchObject({ amountAgorot: 4990, priceWasPlaceholder: false })
    // No real provider in test mode, price or not.
    expect(() => fam.createOrder(PARENT, { ageGroup: '4-5', months: 1, provider: 'cardcom', termsVersion: TERMS_VERSION, expectedAgorot: 4990 })).toThrow(/provider_not_connected/)

    srv.setPrice(OWNER, '4-5', 1, null)
    expect(fam.listPrices().every((p) => p.priceAgorot === null)).toBe(true)
    expect(fam.createOrder(PARENT, { ageGroup: '4-5', months: 1, provider: 'test', termsVersion: TERMS_VERSION, expectedAgorot: null })).toMatchObject({ amountAgorot: 0, priceWasPlaceholder: true })
    expect(srv.listAudit(OWNER).filter((a) => a.target === 'pass_prices').map((a) => a.detail)).toEqual(['4-5/1', '4-5/1'])
  })
})

describe('reading amounts as the owner types them', () => {
  it('parseShekels', () => {
    expect(parseShekels('')).toBeNull()
    expect(parseShekels('  ')).toBeNull()
    expect(parseShekels('49')).toBe(4900)
    expect(parseShekels('49.9')).toBe(4990)
    expect(parseShekels('49.90')).toBe(4990)
    expect(parseShekels('49,90')).toBe(4990)
    expect(parseShekels('₪ 49.90')).toBe(4990)
    expect(parseShekels('٤٩٫٩٠')).toBe(4990)
    expect(parseShekels('0')).toBe(0)
    expect(parseShekels('-5')).toBe('invalid')
    expect(parseShekels('4.999')).toBe('invalid')
    expect(parseShekels('1.2.3')).toBe('invalid')
    expect(parseShekels('abc')).toBe('invalid')
    expect(parseShekels('1,000.50')).toBe('invalid')
  })

  it('priceProblem and agorotToInput', () => {
    expect(priceProblem(null)).toBeNull()
    expect(priceProblem('invalid')).toBe('invalid')
    expect(priceProblem(99)).toBe('too_low')
    expect(priceProblem(100)).toBeNull()
    expect(priceProblem(1_000_000)).toBeNull()
    expect(priceProblem(1_000_001)).toBe('too_high')
    expect(agorotToInput(null)).toBe('')
    expect(agorotToInput(5000)).toBe('50')
    expect(agorotToInput(4990)).toBe('49.90')
    expect(agorotToInput(5)).toBe('0.05')
  })
})
