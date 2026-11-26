import type { PGlite } from '@electric-sql/pglite'
import { beforeAll, describe, expect, it } from 'vitest'
import { PRICES } from '@/data/prices'
import { TERMS_VERSION } from '@/data/terms'
import { EXPORT_KEYS } from '../export-shape'
import { anon, as, freshDb, rows, service, signUp, user } from './harness'

/**
 * One test (or more) per database finding of docs/reviews/stage4a-review.md. Each failed before
 * supabase/migrations/20261122110000_review_fixes.sql and passes after it.
 */

let db: PGlite
let owner: string

async function story(slug: string, group: string) {
  const id = (await db.query<{ id: string }>(`insert into stories (slug, status, published_at) values ($1, 'published', now()) returning id`, [slug])).rows[0]!.id
  await db.query(`insert into story_age_groups (story_id, age_group, is_trial, trial_position) values ($1, $2, true, 1)`, [id, group])
  return id
}

const order = async (uid: string, group = '4-5', months = 1, provider = 'test') =>
  (await rows<{ id: string; amount_agorot: number }>(db, user(uid), `select * from create_order($1, $2, $3, 'terms-1', (select price_agorot from pass_prices where age_group = $1::text and months = $2::integer))`, [group, months, provider]))[0]!

const pay = async (o: { id: string; amount_agorot: number }, eventId = `evt-${Math.random()}`) =>
  (await rows<{ p: string }>(db, service, `select confirm_payment('test', $1, $2, $3, $4) as p`, [eventId, o.id, `pay-${eventId}`, o.amount_agorot]))[0]!.p

beforeAll(async () => {
  db = await freshDb()
  await story('trial-45', '4-5')
  owner = await signUp(db, 'owner@example.test')
  await db.query(`update profiles set role = 'owner' where id = $1`, [owner])
}, 60_000)

describe('R1: no account without the terms and the adult box', () => {
  const insertUser = (email: string, meta: object) =>
    db.query(`insert into auth.users (email, raw_user_meta_data) values ($1, $2)`, [email, JSON.stringify(meta)])

  it('refuses a sign-up that skipped the form (role only), the adult box, the terms, or names an unknown terms version', async () => {
    const full = { role: 'parent', terms_accepted: true, adult: true, terms_version: 'test-1' }
    await expect(insertUser('r1a@example.test', { role: 'parent' })).rejects.toThrow(/terms_required/)
    await expect(insertUser('r1b@example.test', { ...full, adult: false })).rejects.toThrow(/terms_required/)
    await expect(insertUser('r1c@example.test', { ...full, terms_accepted: false })).rejects.toThrow(/terms_required/)
    await expect(insertUser('r1d@example.test', { ...full, terms_accepted: 'true' })).rejects.toThrow(/terms_required/)
    await expect(insertUser('r1e@example.test', { ...full, terms_version: 'v99' })).rejects.toThrow(/terms_required/)
    await expect(insertUser('r1f@example.test', { ...full, terms_version: null })).rejects.toThrow(/terms_required/)
    expect((await db.query(`select 1 from auth.users where email like 'r1%'`)).rows).toEqual([])
    await insertUser('r1ok@example.test', full)
    expect((await db.query(`select 1 from profiles p join auth.users u on u.id = p.id where u.email = 'r1ok@example.test'`)).rows).toHaveLength(1)
  })

  it('an order must name a published terms version', async () => {
    const uid = await signUp(db, 'r1order@example.test')
    await expect(rows(db, user(uid), `select create_order('4-5', 1, 'test', 'v99', null)`)).rejects.toThrow(/terms_required/)
  })

  it('the terms version the site sends is published in the database', async () => {
    const prod = await freshDb({ preview: false })
    expect((await prod.query(`select 1 from private.terms_versions where version = $1`, [TERMS_VERSION])).rows).toHaveLength(1)
  })
})

describe('R2: a "cancelled" or "failed" event before the success does not lose the purchase', () => {
  it('a verified success after a cancelled event still makes the pass, and both events are stored', async () => {
    const uid = await signUp(db, 'r2@example.test')
    const o = await order(uid)
    await rows(db, service, `select record_payment_failure('test', 'r2-cancel', $1, 'payment_cancelled')`, [o.id])
    expect((await db.query<{ status: string }>(`select status from orders where id = $1`, [o.id])).rows[0]!.status).toBe('cancelled')
    const pass = await pay(o, 'r2-paid')
    expect(pass).toBeTruthy()
    expect((await db.query<{ status: string }>(`select status from orders where id = $1`, [o.id])).rows[0]!.status).toBe('paid')
    expect((await db.query(`select kind from provider_events where order_id = $1 order by received_at`, [o.id])).rows).toHaveLength(2)
  })

  it('also after a failed event; the amount is still checked', async () => {
    const uid = await signUp(db, 'r2b@example.test')
    const o = await order(uid)
    await rows(db, service, `select record_payment_failure('test', 'r2b-fail', $1, 'payment_failed')`, [o.id])
    await expect(rows(db, service, `select confirm_payment('test', 'r2b-wrong', $1, 'p', 999)`, [o.id])).rejects.toThrow(/amount_mismatch/)
    expect(await pay(o, 'r2b-paid')).toBeTruthy()
  })
})

describe('R3: no second trial by deleting the account', () => {
  it('delete, sign up again with the same email (any case), start a trial: refused', async () => {
    const first = await signUp(db, 'again@example.test')
    await rows(db, user(first), `select start_trial('4-5')`)
    await rows(db, user(first), `select delete_my_account()`)
    const second = await signUp(db, ' Again@Example.test ')
    await expect(rows(db, user(second), `select start_trial('4-5')`)).rejects.toThrow(/trial_used/)
    // Another address still gets its trial.
    const other = await signUp(db, 'fresh@example.test')
    await rows(db, user(other), `select start_trial('4-5')`)
  })

  it('the record keeps no email, only a salted hash and the day', async () => {
    const ledger = (await db.query<{ email_hash: string; used_on: Date }>(`select * from private.trial_ledger`)).rows
    expect(ledger.length).toBeGreaterThanOrEqual(2)
    const dump = JSON.stringify(ledger)
    expect(dump).not.toMatch(/example/i)
    for (const r of ledger) expect(r.email_hash).toMatch(/^[0-9a-f]{64}$/)
    // Salted: not the plain SHA-256 of the address.
    const plain = (await db.query<{ h: string }>(`select encode(sha256(convert_to('again@example.test', 'UTF8')), 'hex') as h`)).rows[0]!.h
    expect(ledger.map((r) => r.email_hash)).not.toContain(plain)
  })
})

describe('R5: the test provider and unknown providers', () => {
  it('in production (test payments off) the test provider can neither order nor confirm, and unknown providers are refused', async () => {
    const prod = await freshDb({ preview: false })
    await prod.query(`update pass_prices set price_agorot = 4990 where age_group = '4-5' and months = 1`)
    const uid = await signUp(prod, 'prod@example.test', { terms_version: TERMS_VERSION })
    const q = (sql: string, p: unknown[] = []) => rows(prod, user(uid), sql, p)
    await expect(q(`select create_order('4-5', 1, 'test', $1, 4990)`, [TERMS_VERSION])).rejects.toThrow(/test_payments_off/)
    await expect(q(`select create_order('4-5', 1, 'zzz', $1, 4990)`, [TERMS_VERSION])).rejects.toThrow(/provider_not_connected/)
    await expect(q(`select create_order('4-5', 1, 'cardcom', $1, 4990)`, [TERMS_VERSION])).rejects.toThrow(/provider_not_connected/)
    // Even an order made while test payments were on cannot be confirmed through the test provider once they are off.
    await prod.query(`update private.settings set allow_test_payments = true`)
    const [o] = await q(`select * from create_order('4-5', 1, 'test', $1, 4990)`, [TERMS_VERSION]) as { id: string; amount_agorot: number }[]
    await prod.query(`update private.settings set allow_test_payments = false`)
    await expect(rows(prod, service, `select confirm_payment('test', 'e1', $1, 'p1', $2)`, [o!.id, o!.amount_agorot])).rejects.toThrow(/test_payments_off/)
    await expect(rows(prod, service, `select record_payment_failure('test', 'e2', $1, 'payment_failed')`, [o!.id])).rejects.toThrow(/test_payments_off/)
    // A connected real provider takes the database price.
    await prod.query(`update private.settings set payment_providers = '{cardcom}', seller_name = 'Test seller', seller_number = '000000000'`)
    const [real] = await q(`select * from create_order('4-5', 1, 'cardcom', $1, 4990)`, [TERMS_VERSION]) as { amount_agorot: number; price_was_placeholder: boolean }[]
    expect(real).toMatchObject({ amount_agorot: 4990, price_was_placeholder: false })
  })
})

describe('R6: the public cancellation form has a limit', () => {
  it('a fourth request for the same address within the hour is refused', async () => {
    for (let i = 0; i < 3; i++) await rows(db, anon, `select request_cancellation($1, 'ORDER-9', null)`, [i === 1 ? 'Flood@Example.test' : 'flood@example.test'])
    await expect(rows(db, anon, `select request_cancellation('flood@example.test ', 'ORDER-9', null)`)).rejects.toThrow(/rate_limited/)
    await rows(db, anon, `select request_cancellation('someone-else@example.test', 'ORDER-9', null)`)
  })
})

describe('W1: consents', () => {
  it('a user can add only a marketing choice from settings, never terms or adult', async () => {
    const uid = await signUp(db, 'w1@example.test')
    const add = (kind: string, source: string, version: string | null) =>
      rows(db, user(uid), `insert into consents (account_id, kind, granted, terms_version, source) values ($1, $2, true, $3, $4)`, [uid, kind, version, source])
    await expect(add('adult', 'settings', null)).rejects.toThrow(/row-level security/)
    await expect(add('terms', 'checkout', 'v99')).rejects.toThrow(/row-level security/)
    await expect(add('marketing', 'checkout', null)).rejects.toThrow(/row-level security/)
    await expect(add('marketing', 'settings', 'v99')).rejects.toThrow(/row-level security/)
    await add('marketing', 'settings', null)
  })
})

describe('W2, W3: provider events', () => {
  it('a failure event from another provider cannot fail the order', async () => {
    const uid = await signUp(db, 'w2@example.test')
    const o = await order(uid)
    await expect(rows(db, service, `select record_payment_failure('cardcom', 'w2', $1, 'payment_failed')`, [o.id])).rejects.toThrow(/provider_mismatch/)
    expect((await db.query<{ status: string }>(`select status from orders where id = $1`, [o.id])).rows[0]!.status).toBe('pending')
  })

  it('a repeated event id with another order is refused instead of answering with that order\'s pass', async () => {
    const a = await signUp(db, 'w3a@example.test')
    const b = await signUp(db, 'w3b@example.test')
    const oa = await order(a)
    const ob = await order(b)
    await pay(ob)
    const passA = await pay(oa, 'w3-evt')
    expect(await pay(oa, 'w3-evt')).toBe(passA)
    await expect(rows(db, service, `select confirm_payment('test', 'w3-evt', $1, 'x', 0)`, [ob.id])).rejects.toThrow(/event_order_mismatch/)
  })
})

describe('W4: cancelling a pass moves the queued one forward', () => {
  it('the next pass for the same group starts now instead of on the cancelled pass\'s old end date', async () => {
    const uid = await signUp(db, 'w4@example.test')
    const p1 = await pay(await order(uid, '6-8', 1))
    const p2 = await pay(await order(uid, '6-8', 3))
    const before = (await db.query<{ starts_at: Date; ends_at: Date }>(`select starts_at, ends_at from passes where id = $1`, [p2])).rows[0]!
    expect(before.starts_at.getTime()).toBeGreaterThan(Date.now() + 27 * 86_400_000)
    await rows(db, user(uid), `select cancel_purchase($1)`, [p1])
    const after = (await db.query<{ starts_at: Date; ends_at: Date }>(`select starts_at, ends_at from passes where id = $1`, [p2])).rows[0]!
    expect(Math.abs(after.starts_at.getTime() - Date.now())).toBeLessThan(60_000)
    expect(after.ends_at.getTime() - after.starts_at.getTime()).toBe(before.ends_at.getTime() - before.starts_at.getTime())
  })
})

describe('W6: "Download my data"', () => {
  it('includes the email address and the trial\'s stories, under the keys both backends share', async () => {
    const uid = await signUp(db, 'w6@example.test')
    await rows(db, user(uid), `select start_trial('4-5')`)
    const data = await as(db, user(uid, 'w6@example.test'), async (tx) => (await tx.query<{ d: Record<string, unknown> }>(`select export_my_data() as d`)).rows[0]!.d)
    expect(Object.keys(data).sort()).toEqual(EXPORT_KEYS)
    expect(data.email).toBe('w6@example.test')
    expect((data.trial as { story_ids: string[] }).story_ids.length).toBeGreaterThan(0)
  })
})

describe('W8: the cancellation fee cap', () => {
  it('a fee above the lower of 5% or 100 shekels is refused', async () => {
    await db.query(`update pass_prices set price_agorot = 30000 where age_group = '2-3' and months = 12`)
    const uid = await signUp(db, 'w8@example.test')
    const pass = await pay(await order(uid, '2-3', 12))
    await rows(db, user(uid), `select cancel_purchase($1)`, [pass])
    // Since the owner's area part 2 the fee is set only through owner_set_refund_fee() (direct updates were revoked).
    const [{ id: refund }] = await rows<{ id: string }>(db, user(owner), `select id from refunds where pass_id = $1`, [pass]) as [{ id: string }]
    await expect(rows(db, user(owner), `select owner_set_refund_fee($1, 1501)`, [refund])).rejects.toThrow(/fee_over_cap/)
    await rows(db, user(owner), `select owner_set_refund_fee($1, 1500)`, [refund])
    await db.query(`update pass_prices set price_agorot = null where age_group = '2-3' and months = 12`)
  })
})

describe('W9: unlocking the author\'s text', () => {
  it('needs a consent reference, a new one for each unlock', async () => {
    const id = await story('author-story', '4-5')
    await db.query(`update stories set text_locked = true where id = $1`, [id])
    await expect(rows(db, user(owner), `update stories set text_locked = false where id = $1`, [id])).rejects.toThrow(/unlock_needs_consent/)
    await rows(db, user(owner), `update stories set text_locked = false, text_unlock_consent_ref = 'consent-2026-12-01.pdf' where id = $1`, [id])
    await rows(db, user(owner), `update stories set text_locked = true where id = $1`, [id])
    await expect(rows(db, user(owner), `update stories set text_locked = false where id = $1`, [id])).rejects.toThrow(/unlock_needs_consent/)
  })
})

describe('W11: unpaid orders are limited', () => {
  it('a sixth unpaid order within the hour is refused', async () => {
    const uid = await signUp(db, 'w11@example.test')
    for (let i = 0; i < 5; i++) await order(uid)
    await expect(order(uid)).rejects.toThrow(/rate_limited/)
  })
})

describe('R8: one price list', () => {
  it('the static list the public plans page is built from matches the database\'s prices', async () => {
    const prod = await freshDb({ preview: false })
    const dbPrices = (await prod.query<{ age_group: string; months: number; price_agorot: number | null }>(`select age_group, months, price_agorot from pass_prices order by 1, 2`)).rows
      .map((r) => ({ ageGroup: r.age_group, months: r.months, priceAgorot: r.price_agorot }))
    const staticPrices = [...PRICES].sort((a, b) => a.ageGroup.localeCompare(b.ageGroup) || a.months - b.months)
    expect(staticPrices).toEqual(dbPrices)
  })
})
