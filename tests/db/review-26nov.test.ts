import type { PGlite } from '@electric-sql/pglite'
import { beforeAll, describe, expect, it } from 'vitest'
import { anon, freshDb, rows, service, signUp, user } from './harness'

/**
 * Fixes from the fresh review of 26 Nov 2026 (supabase/migrations/20261126120000_review_26nov_fixes.sql):
 *   1  the refund's stored amount is what was returned (paid minus the fee), so the email and the family's data say so
 *   3  the owner can act on a request from the public cancellation form: matching orders, then the same checked
 *      cancellation as a family's own (14 days, active pass, fee cap), logged
 *   7  create_order refuses an order whose price differs from the price the family was shown (price_changed)
 *   9  a real payment company is refused while the seller's business name and number are missing (seller_not_set)
 */
let db: PGlite
let owner: string

const one = async <T>(uid: string, sql: string, params: unknown[] = []) => (await rows<{ r: T }>(db, user(uid), sql, params))[0]!.r
const setPrice = (group: string, months: number, agorot: number | null) =>
  db.query(`update pass_prices set price_agorot = $1 where age_group = $2 and months = $3`, [agorot, group, months])
const order = async (uid: string, group: string, months: number, expected: number | null, provider = 'test') =>
  (await rows<{ id: string; amount_agorot: number }>(db, user(uid), `select * from create_order($1, $2, $3, 'terms-1', $4)`, [group, months, provider, expected]))[0]!
const pay = async (o: { id: string; amount_agorot: number }) => {
  const e = `evt-${Math.random()}`
  return (await rows<{ p: string }>(db, service, `select confirm_payment('test', $1, $2, $3, $4) as p`, [e, o.id, `pay-${e}`, o.amount_agorot]))[0]!.p
}
/** A family that bought one pass at `price` agorot: its id, email, order and pass. */
async function buyer(email: string, price: number, group = '6-8', months = 3) {
  await setPrice(group, months, price)
  const uid = await signUp(db, email)
  const o = await order(uid, group, months, price)
  const pass = await pay(o)
  await setPrice(group, months, null)
  return { uid, email, orderId: o.id, pass }
}
type Match = { orderId: string; passId: string; passStatus: string; canCancel: boolean; paidAgorot: number; refundId: string | null }
type Req = { id: string; email: string; orderRef: string; handledAt: string | null; matches: Match[] }
const requests = async () => (await one<{ publicRequests: Req[] }>(owner, `select owner_refunds() as r`)).publicRequests
const ask = (email: string, ref: string) => rows(db, anon, `select request_cancellation($1, $2, null)`, [email, ref])
const requestFor = async (ref: string) => (await requests()).find((r) => r.orderRef === ref)!

beforeAll(async () => {
  db = await freshDb()
  owner = await signUp(db, 'owner-r26@example.test')
  await db.query(`update profiles set role = 'owner' where id = $1`, [owner])
}, 180_000)

describe('finding 1: the stored refund amount is what was returned', () => {
  it('with a 5.00 fee kept on 100.00, the refund row, "Download my data" and the email audience all say 95.00 returned and 5.00 kept', async () => {
    const b = await buyer('refund-r26@example.test', 10000)
    await rows(db, user(b.uid), `select cancel_purchase($1)`, [b.pass])
    const refund = (await db.query<{ id: string; amount_agorot: number }>(`select id, amount_agorot from refunds where pass_id = $1`, [b.pass])).rows[0]!
    expect(refund.amount_agorot).toBe(10000) // nothing kept yet
    await rows(db, user(owner), `select owner_set_refund_fee($1, 500)`, [refund.id])
    await rows(db, user(owner), `select owner_mark_refunded($1, 'Bank transfer 26 Nov, reference 123')`, [refund.id])

    const row = (await db.query<{ amount_agorot: number; fee_agorot: number; status: string }>(`select amount_agorot, fee_agorot, status from refunds where id = $1`, [refund.id])).rows[0]!
    expect(row).toEqual({ amount_agorot: 9500, fee_agorot: 500, status: 'issued' })

    const data = await one<{ refunds: { amount_agorot: number; fee_agorot: number; note: string }[] }>(b.uid, `select export_my_data() as r`)
    expect(data.refunds).toHaveLength(1)
    expect(data.refunds[0]).toMatchObject({ amount_agorot: 9500, fee_agorot: 500, note: 'Bank transfer 26 Nov, reference 123' })

    // The refund email is built from email_audience() (src/emails/schedule.ts): amountAgorot is the amount returned.
    const audience = (await rows<{ r: { email: string; refunds: { amountAgorot: number; feeAgorot: number; paidAgorot: number }[] }[] }>(db, service, `select email_audience() as r`))[0]!.r
    const mine = audience.find((m) => m.email === b.email)!
    expect(mine.refunds[0]).toMatchObject({ amountAgorot: 9500, feeAgorot: 500, paidAgorot: 10000 })
  })

  it('the amount follows the fee on any write, and a declined refund returns nothing', async () => {
    const b = await buyer('refund2-r26@example.test', 4000)
    await rows(db, user(b.uid), `select cancel_purchase($1)`, [b.pass])
    const id = (await db.query<{ id: string }>(`select id from refunds where pass_id = $1`, [b.pass])).rows[0]!.id
    const amount = async () => (await db.query<{ amount_agorot: number }>(`select amount_agorot from refunds where id = $1`, [id])).rows[0]!.amount_agorot
    await rows(db, user(owner), `select owner_set_refund_fee($1, 200)`, [id])
    expect(await amount()).toBe(3800)
    await db.query(`update refunds set amount_agorot = 4000 where id = $1`, [id]) // a direct write cannot make it untrue
    expect(await amount()).toBe(3800)
    await db.query(`update refunds set status = 'declined' where id = $1`, [id])
    expect(await amount()).toBe(0)
  })
})

describe('finding 3: a request from the public cancellation form can be acted on', () => {
  it('shows the paid orders whose number and buyer email match, and nothing for a wrong email or an unknown number', async () => {
    const b = await buyer('match-r26@example.test', 4990)
    const short = b.orderId.slice(0, 8).toUpperCase() // as the family's Settings show it
    await ask('Match-R26@Example.test ', `Order ${short}`)
    await ask('someone-else@example.test', short)
    await ask('match-r26@example.test', 'ORDER-2041')
    await ask('match-r26@example.test', b.orderId) // the whole number, as in the purchase email

    const ok = await requestFor(`Order ${short}`)
    expect(ok.matches).toEqual([expect.objectContaining({ orderId: b.orderId, passId: b.pass, passStatus: 'active', canCancel: true, paidAgorot: 4990, refundId: null })])
    expect((await requestFor(b.orderId)).matches.map((m) => m.orderId)).toEqual([b.orderId])
    expect((await requestFor(short)).matches).toEqual([]) // the email is not the buyer's
    expect((await requestFor('ORDER-2041')).matches).toEqual([])
  })

  it('only the owner can cancel for a request; a non-matching order is refused', async () => {
    const b = await buyer('guard-r26@example.test', 4990)
    const other = await buyer('guard2-r26@example.test', 4990)
    await ask(b.email, b.orderId.slice(0, 8))
    const req = await requestFor(b.orderId.slice(0, 8))
    await expect(rows(db, user(b.uid), `select owner_cancel_for_request($1, $2)`, [req.id, b.orderId])).rejects.toThrow(/not_owner/)
    await expect(rows(db, anon, `select owner_cancel_for_request($1, $2)`, [req.id, b.orderId])).rejects.toThrow(/permission denied/)
    await expect(rows(db, user(owner), `select owner_cancel_for_request($1, $2)`, [req.id, other.orderId])).rejects.toThrow(/order_not_matching/)
    const pass = (await db.query<{ status: string }>(`select status from passes where id = $1`, [other.pass])).rows[0]!
    expect(pass.status).toBe('active')
  })

  it('the owner ends the pass and opens the refund through the same rules as the family, logged, and the request is handled', async () => {
    const b = await buyer('cancel-r26@example.test', 10000)
    // A second pass for the same group, queued behind the first: it moves earlier, as with the family's own cancellation.
    await setPrice('6-8', 3, 10000)
    const queued = await pay(await order(b.uid, '6-8', 3, 10000))
    await setPrice('6-8', 3, null)
    await ask(b.email, b.orderId.slice(0, 8))
    const req = await requestFor(b.orderId.slice(0, 8))

    const refundId = await one<string>(owner, `select owner_cancel_for_request($1, $2) as r`, [req.id, b.orderId])
    const pass = (await db.query<{ status: string }>(`select status from passes where id = $1`, [b.pass])).rows[0]!
    expect(pass.status).toBe('cancelled')
    const q = (await db.query<{ starts_at: Date }>(`select starts_at from passes where id = $1`, [queued])).rows[0]!
    expect(Math.abs(q.starts_at.getTime() - Date.now())).toBeLessThan(60_000)
    const refund = (await db.query<{ status: string; amount_agorot: number; order_id: string }>(`select status, amount_agorot, order_id from refunds where id = $1`, [refundId])).rows[0]!
    expect(refund).toEqual({ status: 'requested', amount_agorot: 10000, order_id: b.orderId })

    const after = await requestFor(b.orderId.slice(0, 8))
    expect(after.handledAt).not.toBeNull()
    expect(after.matches[0]).toMatchObject({ passStatus: 'cancelled', canCancel: false, refundId })

    // Logged: the pass and the refund by the owner (audit triggers), and the request naming the order.
    const log = (await db.query<{ target_table: string; actor_id: string; detail: Record<string, unknown> }>(
      `select target_table, actor_id, detail from audit_log where (target_table = 'passes' and target_id = $1) or (target_table = 'refunds' and target_id = $2)
         or (target_table = 'cancellation_requests' and target_id = $3) order by id`, [b.pass, refundId, req.id])).rows
    expect(log.some((l) => l.target_table === 'passes' && l.actor_id === owner && l.detail.status === 'cancelled')).toBe(true)
    expect(log.some((l) => l.target_table === 'refunds' && l.actor_id === owner)).toBe(true)
    expect(log.find((l) => l.target_table === 'cancellation_requests')).toMatchObject({ actor_id: owner, detail: { handled: true, cancelled_order: b.orderId, refund: refundId } })

    // The legal fee cap still applies to this refund (lower of 5% or 100 shekels: 5.00 here).
    await expect(rows(db, user(owner), `select owner_set_refund_fee($1, 501)`, [refundId])).rejects.toThrow(/fee_over_cap/)
    await rows(db, user(owner), `select owner_set_refund_fee($1, 500)`, [refundId])

    // Not twice.
    await expect(rows(db, user(owner), `select owner_cancel_for_request($1, $2)`, [req.id, b.orderId])).rejects.toThrow(/pass_not_active/)
  })

  it('refuses after 14 days from payment, as cancel_purchase does', async () => {
    const b = await buyer('late-r26@example.test', 4990)
    await db.query(`update orders set paid_at = now() - interval '15 days' where id = $1`, [b.orderId])
    await ask(b.email, b.orderId)
    const req = await requestFor(b.orderId)
    expect(req.matches[0]).toMatchObject({ canCancel: false })
    await expect(rows(db, user(owner), `select owner_cancel_for_request($1, $2)`, [req.id, b.orderId])).rejects.toThrow(/cancel_window_closed/)
    await expect(rows(db, user(b.uid), `select cancel_purchase($1)`, [b.pass])).rejects.toThrow(/cancel_window_closed/)
  })

  it("the family's own cancellation keeps its rules: only their own pass", async () => {
    const b = await buyer('own-r26@example.test', 4990)
    const other = await signUp(db, 'own2-r26@example.test')
    await expect(rows(db, user(other), `select cancel_purchase($1)`, [b.pass])).rejects.toThrow(/pass_not_found/)
    await rows(db, user(b.uid), `select cancel_purchase($1)`, [b.pass])
    await expect(rows(db, user(b.uid), `select cancel_purchase($1)`, [b.pass])).rejects.toThrow(/pass_not_active/)
  })
})

describe('finding 7: the price the family saw is the price charged, or no order', () => {
  it('refuses an order whose expected price differs from the current one, in both directions', async () => {
    const uid = await signUp(db, 'price-r26@example.test')
    await setPrice('2-3', 12, 19900)
    await expect(order(uid, '2-3', 12, 14900)).rejects.toThrow(/price_changed/)
    await expect(order(uid, '2-3', 12, null)).rejects.toThrow(/price_changed/) // the family saw "Price not set yet"
    expect((await order(uid, '2-3', 12, 19900)).amount_agorot).toBe(19900)
    await setPrice('2-3', 12, null)
    await expect(order(uid, '2-3', 12, 19900)).rejects.toThrow(/price_changed/) // the owner removed the price
    expect((await order(uid, '2-3', 12, null)).amount_agorot).toBe(0) // test provider, placeholder price
  })
})

describe('finding 9: no real sale while the seller is a placeholder', () => {
  it('a connected real provider is refused until the business name and number are both recorded', async () => {
    await db.query(`update private.settings set payment_providers = '{cardcom}'`)
    const uid = await signUp(db, 'seller-r26@example.test')
    await setPrice('4-5', 12, 29900)
    await expect(order(uid, '4-5', 12, 29900, 'cardcom')).rejects.toThrow(/seller_not_set/)
    await db.query(`update private.settings set seller_name = 'A business'`)
    await expect(order(uid, '4-5', 12, 29900, 'cardcom')).rejects.toThrow(/seller_not_set/)
    await db.query(`update private.settings set seller_number = '  '`)
    await expect(order(uid, '4-5', 12, 29900, 'cardcom')).rejects.toThrow(/seller_not_set/)
    await db.query(`update private.settings set seller_number = '000000000'`)
    expect((await order(uid, '4-5', 12, 29900, 'cardcom')).amount_agorot).toBe(29900)
    // The test provider never needed the seller (no money moves).
    await db.query(`update private.settings set seller_name = null, seller_number = null, payment_providers = '{}'`)
    expect((await order(uid, '4-5', 12, 29900)).amount_agorot).toBe(29900)
    await setPrice('4-5', 12, null)
  })
})
