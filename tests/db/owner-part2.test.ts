import type { PGlite } from '@electric-sql/pglite'
import { beforeAll, describe, expect, it } from 'vitest'
import { anon, freshDb, rows, service, signUp, user } from './harness'

/**
 * Owner's area, part 2 (supabase/migrations/20261126100000_owner_inbox_refunds_prices.sql): the contact-message
 * inbox, cancellations and refunds, and pass prices. Owner-only, one way in for every change, every change in the
 * audit log, the legal fee cap, and create_order still refusing a real provider while a price is missing.
 */
let db: PGlite
let owner: string
let parent: string

const one = async <T>(uid: string, sql: string, params: unknown[] = []) => (await rows<{ r: T }>(db, user(uid), sql, params))[0]!.r
const audit = async (table: string, id: string) =>
  (await db.query<{ action: string; actor_id: string; detail: Record<string, unknown> }>(
    `select action, actor_id, detail from audit_log where target_table = $1 and target_id = $2 order by id`, [table, id])).rows

const order = async (uid: string, group = '4-5', months = 1, provider = 'test') =>
  (await rows<{ id: string; amount_agorot: number }>(db, user(uid), `select * from create_order($1, $2, $3, 'terms-1')`, [group, months, provider]))[0]!
const pay = async (o: { id: string; amount_agorot: number }) => {
  const e = `evt-${Math.random()}`
  return (await rows<{ p: string }>(db, service, `select confirm_payment('test', $1, $2, $3, $4) as p`, [e, o.id, `pay-${e}`, o.amount_agorot]))[0]!.p
}
/** A parent buys a pass at the given price (set by the database owner) and cancels it: returns the refund's id. */
async function cancelled(email: string, priceAgorot: number | null, group = '6-8', months = 3) {
  await db.query(`update pass_prices set price_agorot = $1 where age_group = $2 and months = $3`, [priceAgorot, group, months])
  const uid = await signUp(db, email)
  const pass = await pay(await order(uid, group, months))
  await rows(db, user(uid), `select cancel_purchase($1)`, [pass])
  await db.query(`update pass_prices set price_agorot = null where age_group = $1 and months = $2`, [group, months])
  return { uid, pass, refund: (await db.query<{ id: string }>(`select id from refunds where pass_id = $1`, [pass])).rows[0]!.id }
}

beforeAll(async () => {
  db = await freshDb()
  owner = await signUp(db, 'owner-p2@example.test')
  await db.query(`update profiles set role = 'owner' where id = $1`, [owner])
  parent = await signUp(db, 'parent-p2@example.test')
}, 180_000)

describe('every new function refuses anyone but the owner', () => {
  it('a parent gets not_owner, a signed-out visitor cannot call them at all', async () => {
    const id = '00000000-0000-0000-0000-000000000000'
    const calls = [
      [`select owner_inbox()`, []],
      [`select owner_set_message_handled($1, true)`, [id]],
      [`select owner_refunds()`, []],
      [`select owner_set_refund_fee($1, 0)`, [id]],
      [`select owner_mark_refunded($1, 'x')`, [id]],
      [`select owner_set_cancellation_handled($1, true)`, [id]],
      [`select owner_set_price('4-5', 1, 4990)`, []],
    ] as const
    for (const [sql, params] of calls) {
      await expect(rows(db, user(parent), sql, [...params]), sql).rejects.toThrow(/not_owner/)
      await expect(rows(db, anon, sql, [...params]), sql).rejects.toThrow(/permission denied/)
    }
  })

  it('nobody, the owner included, changes these tables directly any more', async () => {
    await expect(rows(db, user(owner), `update pass_prices set price_agorot = 100 where age_group = '4-5' and months = 1`)).rejects.toThrow(/permission denied/)
    await expect(rows(db, user(owner), `update refunds set status = 'issued'`)).rejects.toThrow(/permission denied/)
    await expect(rows(db, user(owner), `update contact_messages set handled_at = now()`)).rejects.toThrow(/permission denied/)
    await expect(rows(db, user(owner), `update cancellation_requests set handled_at = now()`)).rejects.toThrow(/permission denied/)
  })
})

describe('messages from the contact form', () => {
  it('newest first, a count of those not handled, handled and back, each change in the audit log', async () => {
    const send = (email: string, msg: string) => rows(db, anon, `select send_contact_message(null, $1, $2, 'ar')`, [email, msg])
    await send('first@example.test', 'الرسالة الأولى')
    await db.query(`update contact_messages set created_at = now() - interval '1 hour' where email = 'first@example.test'`)
    await send('second@example.test', 'Second message')
    type InboxRow = { unhandled: number; messages: { id: string; email: string; lang: string; handledAt: string | null; name: string | null }[] }
    let inbox = await one<InboxRow>(owner, `select owner_inbox() as r`)
    expect(inbox.unhandled).toBe(2)
    expect(inbox.messages.map((m) => m.email)).toEqual(['second@example.test', 'first@example.test'])
    expect(inbox.messages[1]).toMatchObject({ lang: 'ar', name: null, handledAt: null })

    const id = inbox.messages[0]!.id
    await rows(db, user(owner), `select owner_set_message_handled($1, true)`, [id])
    await rows(db, user(owner), `select owner_set_message_handled($1, true)`, [id]) // no change: no second audit row
    inbox = await one<InboxRow>(owner, `select owner_inbox() as r`)
    expect(inbox.unhandled).toBe(1)
    expect(inbox.messages[0]!.handledAt).not.toBeNull()
    await rows(db, user(owner), `select owner_set_message_handled($1, false)`, [id])
    expect((await one<InboxRow>(owner, `select owner_inbox() as r`)).unhandled).toBe(2)

    const log = await audit('contact_messages', id)
    expect(log).toEqual([
      { action: 'update', actor_id: owner, detail: { handled: true } },
      { action: 'update', actor_id: owner, detail: { handled: false } },
    ])
    // The audit log keeps neither the words nor the address.
    expect(JSON.stringify(log)).not.toMatch(/example|Second/)
    await expect(rows(db, user(owner), `select owner_set_message_handled($1, true)`, ['00000000-0000-0000-0000-000000000000'])).rejects.toThrow(/not_found/)
  })
})

describe('cancellations and refunds', () => {
  it('lists a cancelled pass with the buyer, what was paid and the legal cap (5%, at most 100 shekels)', async () => {
    const small = await cancelled('small@example.test', 4990)
    const big = await cancelled('big@example.test', 300_000, '2-3', 12)
    type View = { open: number; refunds: Record<string, unknown>[] }
    const v = await one<View>(owner, `select owner_refunds() as r`)
    const s = v.refunds.find((r) => r.id === small.refund)!
    expect(s).toMatchObject({ email: 'small@example.test', ageGroup: '6-8', months: 3, paidAgorot: 4990, priceWasPlaceholder: false, feeAgorot: null, maxFeeAgorot: 249, status: 'requested', note: null })
    expect(v.refunds.find((r) => r.id === big.refund)).toMatchObject({ maxFeeAgorot: 10_000 })
    expect(v.open).toBeGreaterThanOrEqual(2)
    // Newest first.
    expect(v.refunds.findIndex((r) => r.id === big.refund)).toBeLessThan(v.refunds.findIndex((r) => r.id === small.refund))
  })

  it('the fee stays within the cap; marking refunded needs the fee and a note, and is final', async () => {
    const { pass, refund } = await cancelled('fee@example.test', 4990)
    await expect(rows(db, user(owner), `select owner_set_refund_fee($1, 250)`, [refund])).rejects.toThrow(/fee_over_cap/)
    await expect(rows(db, user(owner), `select owner_set_refund_fee($1, -1)`, [refund])).rejects.toThrow(/fee_over_cap/)
    await expect(rows(db, user(owner), `select owner_mark_refunded($1, 'Bank transfer')`, [refund])).rejects.toThrow(/fee_not_set/)
    await rows(db, user(owner), `select owner_set_refund_fee($1, 249)`, [refund])
    await expect(rows(db, user(owner), `select owner_mark_refunded($1, '   ')`, [refund])).rejects.toThrow(/note_required/)
    await expect(rows(db, user(owner), `select owner_mark_refunded($1, $2)`, [refund, 'x'.repeat(501)])).rejects.toThrow(/note_required/)
    await rows(db, user(owner), `select owner_mark_refunded($1, '  Bank transfer, ref 12  ')`, [refund])

    const [r] = (await db.query<{ status: string; fee_agorot: number; note: string; issued_at: Date | null }>(`select status, fee_agorot, note, issued_at from refunds where id = $1`, [refund])).rows
    expect(r).toMatchObject({ status: 'issued', fee_agorot: 249, note: 'Bank transfer, ref 12' })
    expect(r!.issued_at).not.toBeNull()
    expect((await db.query(`select status from passes where id = $1`, [pass])).rows).toEqual([{ status: 'refunded' }])
    expect((await db.query(`select o.status from orders o join refunds r on r.order_id = o.id where r.id = $1`, [refund])).rows).toEqual([{ status: 'refunded' }])

    await expect(rows(db, user(owner), `select owner_set_refund_fee($1, 0)`, [refund])).rejects.toThrow(/refund_closed/)
    await expect(rows(db, user(owner), `select owner_mark_refunded($1, 'again')`, [refund])).rejects.toThrow(/refund_closed/)

    // The audit triggers wrote the fee, the mark and the pass change, by the owner.
    const log = await audit('refunds', refund)
    expect(log.map((l) => [l.action, l.actor_id, l.detail.status, l.detail.fee_agorot])).toEqual([
      ['insert', expect.any(String), 'requested', null],
      ['update', owner, 'requested', 249],
      ['update', owner, 'issued', 249],
    ])
    expect((await audit('passes', pass)).at(-1)).toMatchObject({ action: 'update', actor_id: owner, detail: { status: 'refunded' } })
  })

  it('a test purchase with no price (nothing paid) can only have a fee of 0', async () => {
    const { refund } = await cancelled('free@example.test', null)
    await expect(rows(db, user(owner), `select owner_set_refund_fee($1, 1)`, [refund])).rejects.toThrow(/fee_over_cap/)
    await rows(db, user(owner), `select owner_set_refund_fee($1, 0)`, [refund])
    await rows(db, user(owner), `select owner_mark_refunded($1, 'Nothing to return: test purchase')`, [refund])
  })

  it('the family reads its own refund with the note; another family does not', async () => {
    const { uid, refund } = await cancelled('family@example.test', 4990)
    await rows(db, user(owner), `select owner_set_refund_fee($1, 0)`, [refund])
    await rows(db, user(owner), `select owner_mark_refunded($1, 'Returned in full')`, [refund])
    expect(await rows(db, user(uid), `select status, note from refunds where id = $1`, [refund])).toEqual([{ status: 'issued', note: 'Returned in full' }])
    expect(await rows(db, user(parent), `select * from refunds where id = $1`, [refund])).toEqual([])
  })

  it('requests from the public cancellation form are listed and marked handled, with an audit row', async () => {
    await rows(db, anon, `select request_cancellation('public@example.test', 'ORDER-77', 'Please cancel')`)
    type View = { publicRequests: { id: string; email: string; orderRef: string; message: string; handledAt: string | null }[] }
    const req = (await one<View>(owner, `select owner_refunds() as r`)).publicRequests.find((c) => c.orderRef === 'ORDER-77')!
    expect(req).toMatchObject({ email: 'public@example.test', message: 'Please cancel', handledAt: null })
    await rows(db, user(owner), `select owner_set_cancellation_handled($1, true)`, [req.id])
    const after = (await one<View>(owner, `select owner_refunds() as r`)).publicRequests.find((c) => c.id === req.id)!
    expect(after.handledAt).not.toBeNull()
    expect(await audit('cancellation_requests', req.id)).toEqual([{ action: 'update', actor_id: owner, detail: { handled: true } }])
  })
})

describe('prices', () => {
  it('the owner sets and clears a price within 1 to 10,000 shekels; each change is in the audit log', async () => {
    await expect(rows(db, user(owner), `select owner_set_price('4-5', 1, 99)`)).rejects.toThrow(/bad_price/)
    await expect(rows(db, user(owner), `select owner_set_price('4-5', 1, 1000001)`)).rejects.toThrow(/bad_price/)
    await expect(rows(db, user(owner), `select owner_set_price('9-10', 1, 4990)`)).rejects.toThrow(/bad_plan/)
    await expect(rows(db, user(owner), `select owner_set_price('4-5', 2, 4990)`)).rejects.toThrow(/bad_plan/)
    await rows(db, user(owner), `select owner_set_price('4-5', 1, 4990)`)
    expect(await rows(db, anon, `select price_agorot from pass_prices where age_group = '4-5' and months = 1`)).toEqual([{ price_agorot: 4990 }])
    const log = (await db.query<{ actor_id: string; detail: { price_agorot: number | null } }>(
      `select actor_id, detail from audit_log where target_table = 'pass_prices' and detail ->> 'age_group' = '4-5' and (detail ->> 'months')::int = 1 order by id`)).rows
    expect(log.map((l) => [l.actor_id, l.detail.price_agorot])).toEqual([[owner, 4990]])
    await rows(db, user(owner), `select owner_set_price('4-5', 1, null)`)
    expect(await rows(db, anon, `select price_agorot from pass_prices where age_group = '4-5' and months = 1`)).toEqual([{ price_agorot: null }])
  })

  it('the table itself refuses a price outside the range, whoever writes it', async () => {
    await expect(db.query(`update pass_prices set price_agorot = 50 where age_group = '2-3' and months = 1`)).rejects.toThrow(/pass_prices_price_range/)
  })

  it('create_order charges the price the owner set, and refuses a real provider while a price is missing', async () => {
    await db.query(`update private.settings set payment_providers = '{cardcom}'`)
    const uid = await signUp(db, 'buyer-p2@example.test')
    await expect(order(uid, '6-8', 1, 'cardcom')).rejects.toThrow(/price_not_set/)
    await rows(db, user(owner), `select owner_set_price('6-8', 1, 3990)`)
    const real = await rows<{ amount_agorot: number; price_was_placeholder: boolean }>(db, user(uid), `select * from create_order('6-8', 1, 'cardcom', 'terms-1')`)
    expect(real[0]).toMatchObject({ amount_agorot: 3990, price_was_placeholder: false })
    await rows(db, user(owner), `select owner_set_price('6-8', 1, null)`)
    await expect(order(uid, '6-8', 1, 'cardcom')).rejects.toThrow(/price_not_set/)
    await db.query(`update private.settings set payment_providers = '{}'`)
  })
})
