import type { PGlite } from '@electric-sql/pglite'
import { beforeAll, describe, expect, it } from 'vitest'
import { anon, freshDb, rows, service, signUp, user } from './harness'

/**
 * Recheck of 27 Nov 2026, N3 (supabase/migrations/20261127100000_order_ref_glued.sql): an order number glued to a
 * word by a hyphen ("Ref-3F2A1B9C", Danish "Ordre-3F2A1B9C") names the order; nothing else changes. The same cases as
 * src/data/rules.ts orderRefMatches() in tests/recheck-27nov.test.ts.
 */
let db: PGlite
let owner: string
const ORDER = '3f2a1b9c-1111-4222-8333-944445555666'

const matches = async (ref: string | null, order = ORDER) =>
  (await db.query<{ m: boolean }>(`select private.order_ref_matches($1, $2::uuid) as m`, [ref, order])).rows[0]!.m

beforeAll(async () => {
  db = await freshDb()
  owner = await signUp(db, 'owner-r27@example.test')
  await db.query(`update profiles set role = 'owner' where id = $1`, [owner])
}, 180_000)

describe('N3: private.order_ref_matches', () => {
  it('finds the number glued to a word by a hyphen', async () => {
    for (const ref of ['Ref-3F2A1B9C', 'ref-3f2a1b9c', 'Ordre-3F2A1B9C', 'Code-3F2A1B9C', 'Ordrenr. Ordre-3f2a1b9c', 'Bestilling-3F2A1B9C', 'Ref-3F2A1B9C-1111', `Ref-${ORDER.toUpperCase()}`])
      expect(await matches(ref), ref).toBe(true)
  })

  it('keeps what matched before', async () => {
    for (const ref of ['3F2A1B9C', 'Order #3f2a1b9c', ORDER.toUpperCase(), '3f2a1b9c1111', 'ORDER-3F2A1B9C', 'Order 3F2A1B9C', 'הזמנה 3F2A1B9C', 'طلب 3F2A1B9C'])
      expect(await matches(ref), ref).toBe(true)
  })

  it('still refuses what does not name this order', async () => {
    for (const ref of ['Ref-3F2A1B9', 'Ref-3F2A1B9D', 'Ref-2F2A1B9C', 'ORDER-2041', 'Ordre-1111-4222', 'Bead-3F2A1B9D', 'deadbeef-3f2a1b9', '', 'Ref-', '-3F2A1B9', 'Ref-1111-4222-8333', 'Ref-944445555666', 'Ref3F2A1B9C'])
      expect(await matches(ref), ref).toBe(false)
    expect(await matches(null)).toBe(false)
  })

  it('cannot be called from outside', async () => {
    await expect(rows(db, anon, `select private.order_ref_matches('x', $1::uuid)`, [ORDER])).rejects.toThrow()
  })

  it('the owner sees the paid order for a request typed as "Ref-…" with the buyer\'s email', async () => {
    await db.query(`update pass_prices set price_agorot = 4990 where age_group = '6-8' and months = 3`)
    const uid = await signUp(db, 'glued-r27@example.test')
    const o = (await rows<{ id: string; amount_agorot: number }>(db, user(uid), `select * from create_order('6-8', 3, 'test', 'terms-1', 4990)`))[0]!
    const e = `evt-${Math.random()}`
    await rows(db, service, `select confirm_payment('test', $1, $2, $3, $4)`, [e, o.id, `pay-${e}`, o.amount_agorot])
    const ref = `Ordre-${o.id.slice(0, 8).toUpperCase()}`
    await rows(db, anon, `select request_cancellation($1, $2, null)`, ['glued-r27@example.test', ref])
    const view = (await rows<{ r: { publicRequests: { orderRef: string; matches: { orderId: string }[] }[] } }>(db, user(owner), `select owner_refunds() as r`))[0]!.r
    expect(view.publicRequests.find((r) => r.orderRef === ref)!.matches.map((m) => m.orderId)).toEqual([o.id])
  })
})
