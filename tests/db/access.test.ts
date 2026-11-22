import type { PGlite } from '@electric-sql/pglite'
import { beforeAll, describe, expect, it } from 'vitest'
import { anon, as, freshDb, rows, service, signUp, user } from './harness'

/**
 * Proves the row-level security and the database functions in supabase/migrations against a real Postgres
 * (PGlite, Postgres 18) with a stand-in for Supabase's roles and auth.uid(). See supabase-stand-in.sql for what
 * the stand-in does and does not copy.
 */

let db: PGlite
const ids: Record<string, string> = {}

/** Content written as the database owner (superuser), the way a migration or the owner's area would. */
async function seedStory(slug: string, groups: { group: string; trial?: boolean }[], status: 'published' | 'draft' = 'published') {
  const cover = (await db.query<{ id: string }>(`insert into media (kind, storage_path, source, licence) values ('image', $1, 'studio', 'own') returning id`, [`covers/${slug}.png`])).rows[0]!.id
  const picture = (await db.query<{ id: string }>(`insert into media (kind, storage_path, source, licence) values ('image', $1, 'studio', 'own') returning id`, [`pages/${slug}-1.png`])).rows[0]!.id
  const id = (await db.query<{ id: string }>(
    `insert into stories (slug, status, cover_media_id, published_at) values ($1, $2::story_status, $3, case when $2::story_status = 'published' then now() end) returning id`,
    [slug, status, cover],
  )).rows[0]!.id
  await db.query(`insert into story_listings (story_id, lang, title) values ($1, 'en', $2)`, [id, `Title of ${slug}`])
  for (const g of groups) await db.query(`insert into story_age_groups (story_id, age_group, is_trial, trial_position) values ($1, $2, $3, 1)`, [id, g.group, !!g.trial])
  await db.query(`insert into pages (story_id, page_no, picture_media_id) values ($1, 1, $2)`, [id, picture])
  await db.query(`insert into story_texts (story_id, page_no, lang, display, speech) values ($1, 1, 'en', $2, $2)`, [id, `Paid text of ${slug}`])
  await db.query(`insert into films (story_id, lang) values ($1, 'en')`, [id])
  const act = (await db.query<{ id: string }>(`insert into activities (story_id, texts) values ($1, '{"en":{"goal":"x"}}') returning id`, [id])).rows[0]!.id
  await db.query(`insert into activity_steps (activity_id, position, captions) values ($1, 1, '{"en":"step"}')`, [act])
  ids[slug] = id
  ids[`${slug}:cover`] = cover
  ids[`${slug}:picture`] = picture
  return id
}

/** Everything paid a user can read for one story: one count per table. */
async function paidCounts(who: Parameters<typeof rows>[1], slug: string) {
  const id = ids[slug]!
  const q = async (sql: string) => Number((await rows<{ n: string }>(db, who, sql, [id]))[0]!.n)
  return {
    texts: await q(`select count(*) as n from story_texts where story_id = $1`),
    pages: await q(`select count(*) as n from pages where story_id = $1`),
    films: await q(`select count(*) as n from films where story_id = $1`),
    activities: await q(`select count(*) as n from activities where story_id = $1`),
    steps: await q(`select count(*) as n from activity_steps s join activities a on a.id = s.activity_id where a.story_id = $1`),
  }
}
const OPEN = { texts: 1, pages: 1, films: 1, activities: 1, steps: 1 }
const LOCKED = { texts: 0, pages: 0, films: 0, activities: 0, steps: 0 }

async function canRead(who: Parameters<typeof rows>[1], slug: string) {
  const c = await paidCounts(who, slug)
  const fn = (await rows<{ ok: boolean }>(db, who, `select has_access_to_story($1) as ok`, [ids[slug]]))[0]!.ok
  // The policy and the function must always agree.
  expect(c, `policy and has_access_to_story disagree for ${slug}`).toEqual(fn ? OPEN : LOCKED)
  return fn
}

/** Buys a pass through the real path: the user creates the order, the server confirms the payment. */
async function buyPass(uid: string, group: string, months = 1, eventId = `evt-${Math.random()}`) {
  const order = (await rows<{ id: string; amount_agorot: number }>(db, user(uid), `select * from create_order($1, $2, 'test', 'terms-1')`, [group, months]))[0]!
  const pass = (await rows<{ p: string }>(db, service, `select confirm_payment('test', $1, $2, $3, $4) as p`, [eventId, order.id, `pay-${eventId}`, order.amount_agorot]))[0]!.p
  return { orderId: order.id, passId: pass, eventId, amount: order.amount_agorot }
}

beforeAll(async () => {
  db = await freshDb()
  await seedStory('trial-45', [{ group: '4-5', trial: true }])
  await seedStory('other-45', [{ group: '4-5' }])
  await seedStory('only-68', [{ group: '6-8' }])
  await seedStory('shared-23-68', [{ group: '2-3' }, { group: '6-8' }])
  await seedStory('draft-45', [{ group: '4-5', trial: true }], 'draft')
  ids.owner = await signUp(db, 'owner@example.test')
  await db.query(`update profiles set role = 'owner' where id = $1`, [ids.owner])
}, 60_000)

describe('signed out (anon)', () => {
  it('reads age groups and prices, nothing else', async () => {
    expect(await rows(db, anon, 'select id from age_groups order by position')).toEqual([{ id: '2-3' }, { id: '4-5' }, { id: '6-8' }])
    expect(await rows(db, anon, 'select count(*)::int as n from pass_prices')).toEqual([{ n: 9 }])
    for (const t of ['stories', 'story_listings', 'story_texts', 'pages', 'films', 'activities', 'activity_steps', 'media', 'profiles', 'passes', 'orders']) {
      await expect(rows(db, anon, `select * from ${t}`), t).rejects.toThrow(/permission denied/)
    }
  })

  it('has no access to any story and cannot start a trial or create an order', async () => {
    expect((await rows<{ ok: boolean }>(db, anon, 'select has_access_to_story($1) as ok', [ids['trial-45']]))[0]!.ok).toBe(false)
    await expect(rows(db, anon, `select start_trial('4-5')`)).rejects.toThrow(/permission denied/)
    await expect(rows(db, anon, `select create_order('4-5', 1, 'test', 'v')`)).rejects.toThrow(/permission denied/)
  })

  it('can send the public "Cancel a purchase" form but cannot read what was sent', async () => {
    await rows(db, anon, `select request_cancellation('a@example.test', 'ORDER-1', 'please')`)
    await expect(rows(db, anon, 'select * from cancellation_requests')).rejects.toThrow(/permission denied/)
    expect(await rows(db, user(ids.owner!), 'select order_ref from cancellation_requests')).toEqual([{ order_ref: 'ORDER-1' }])
  })
})

describe('signed in, no trial or pass', () => {
  let uid: string
  beforeAll(async () => {
    uid = await signUp(db, 'nothing@example.test')
  })

  it('sees the catalogue (titles, age groups, covers) of published stories only', async () => {
    const stories = await rows<{ slug: string }>(db, user(uid), 'select slug from stories order by slug')
    expect(stories.map((s) => s.slug)).toEqual(['only-68', 'other-45', 'shared-23-68', 'trial-45'])
    expect((await rows(db, user(uid), 'select title from story_listings')).length).toBe(4)
    expect((await rows(db, user(uid), 'select * from story_age_groups')).length).toBe(5)
    const media = await rows<{ id: string }>(db, user(uid), 'select id from media')
    expect(media.map((m) => m.id)).toContain(ids['trial-45:cover'])
    expect(media.map((m) => m.id)).not.toContain(ids['trial-45:picture'])
    expect(media.map((m) => m.id)).not.toContain(ids['draft-45:cover'])
  })

  it('reads no paid content', async () => {
    for (const s of ['trial-45', 'other-45', 'only-68', 'shared-23-68', 'draft-45']) expect(await canRead(user(uid), s)).toBe(false)
  })

  it('cannot write content, give itself a trial or a pass, or make itself owner', async () => {
    await expect(rows(db, user(uid), `insert into stories (slug) values ('mine')`)).rejects.toThrow(/row-level security/)
    await expect(rows(db, user(uid), `insert into trials (account_id, age_group, ends_at) values ($1, '4-5', now() + interval '1 year')`, [uid])).rejects.toThrow(/permission denied/)
    await expect(rows(db, user(uid), `insert into passes (account_id, age_group, months, starts_at, ends_at) values ($1, '4-5', 12, now(), now() + interval '1 year')`, [uid])).rejects.toThrow(/permission denied/)
    await expect(rows(db, user(uid), `update profiles set role = 'owner' where id = $1`, [uid])).rejects.toThrow(/permission denied/)
    await expect(rows(db, user(uid), `select set_my_role('owner')`)).rejects.toThrow(/role_not_allowed/)
    await expect(rows(db, user(uid), `select confirm_payment('test', 'e', gen_random_uuid(), 'p', 0)`)).rejects.toThrow(/permission denied/)
  })
})

describe('trial', () => {
  let uid: string
  beforeAll(async () => {
    uid = await signUp(db, 'trial@example.test')
    await rows(db, user(uid), `select start_trial('4-5')`)
  })

  it('opens the trial story and nothing else', async () => {
    expect(await canRead(user(uid), 'trial-45')).toBe(true)
    expect(await canRead(user(uid), 'other-45')).toBe(false)
    expect(await canRead(user(uid), 'only-68')).toBe(false)
    expect(await canRead(user(uid), 'draft-45')).toBe(false) // a draft never counts, even if marked as a trial story
  })

  it('is one per account and lasts 3 days', async () => {
    await expect(rows(db, user(uid), `select start_trial('6-8')`)).rejects.toThrow(/trial_used/)
    const [t] = await rows<{ days: number }>(db, user(uid), `select extract(epoch from ends_at - started_at) / 86400 as days from trials`)
    expect(Number(t!.days)).toBe(3)
  })

  it('keeps its stories when the owner changes the trial list later', async () => {
    await db.query(`update story_age_groups set is_trial = false where story_id = $1`, [ids['trial-45']])
    expect(await canRead(user(uid), 'trial-45')).toBe(true)
    await db.query(`update story_age_groups set is_trial = true where story_id = $1`, [ids['trial-45']])
  })

  it('locks everything once expired, and keeps the account data', async () => {
    const other = await signUp(db, 'expired@example.test')
    await rows(db, user(other), `select start_trial('4-5')`)
    await rows(db, user(other), `insert into children (account_id, kind, name, age_group) values ($1, 'child', 'Noor', '4-5')`, [other])
    await db.query(`update trials set started_at = now() - interval '4 days', ends_at = now() - interval '1 day' where account_id = $1`, [other])
    expect(await canRead(user(other), 'trial-45')).toBe(false)
    expect(await rows(db, user(other), 'select name from children')).toEqual([{ name: 'Noor' }])
  })
})

describe('passes', () => {
  it('a pass opens every story of its age group, including one listed in two groups', async () => {
    const uid = await signUp(db, 'pass68@example.test')
    await buyPass(uid, '6-8')
    expect(await canRead(user(uid), 'only-68')).toBe(true)
    expect(await canRead(user(uid), 'shared-23-68')).toBe(true)
    // Wrong age group: stays locked.
    expect(await canRead(user(uid), 'trial-45')).toBe(false)
    expect(await canRead(user(uid), 'other-45')).toBe(false)
  })

  it('the other group of a shared story also opens it', async () => {
    const uid = await signUp(db, 'pass23@example.test')
    await buyPass(uid, '2-3')
    expect(await canRead(user(uid), 'shared-23-68')).toBe(true)
    expect(await canRead(user(uid), 'only-68')).toBe(false)
  })

  it('an expired or cancelled pass locks again', async () => {
    const uid = await signUp(db, 'expiredpass@example.test')
    const { passId } = await buyPass(uid, '4-5')
    expect(await canRead(user(uid), 'other-45')).toBe(true)
    await db.query(`update passes set starts_at = now() - interval '2 months', ends_at = now() - interval '1 day' where id = $1`, [passId])
    expect(await canRead(user(uid), 'other-45')).toBe(false)

    const uid2 = await signUp(db, 'cancelled@example.test')
    const b = await buyPass(uid2, '4-5')
    await rows(db, user(uid2), `select cancel_purchase($1)`, [b.passId])
    expect(await canRead(user(uid2), 'other-45')).toBe(false)
    const [r] = await rows<{ status: string; amount_agorot: number }>(db, user(uid2), 'select status, amount_agorot from refunds')
    expect(r).toEqual({ status: 'requested', amount_agorot: b.amount })
  })

  it('a repeated payment callback creates one pass, not two', async () => {
    const uid = await signUp(db, 'twice@example.test')
    const first = await buyPass(uid, '4-5', 3, 'evt-dup')
    const again = (await rows<{ p: string }>(db, service, `select confirm_payment('test', 'evt-dup', $1, 'pay-evt-dup', $2) as p`, [first.orderId, first.amount]))[0]!.p
    expect(again).toBe(first.passId)
    expect(await rows(db, user(uid), 'select count(*)::int as n from passes')).toEqual([{ n: 1 }])
    expect(await rows(db, user(uid), 'select count(*)::int as n from payments')).toEqual([{ n: 1 }])
  })

  it('a wrong amount is refused and unlocks nothing', async () => {
    const uid = await signUp(db, 'amount@example.test')
    const order = (await rows<{ id: string }>(db, user(uid), `select * from create_order('4-5', 1, 'test', 'terms-1')`))[0]!
    await expect(rows(db, service, `select confirm_payment('test', 'evt-amount', $1, 'pay', 999)`, [order.id])).rejects.toThrow(/amount_mismatch/)
    expect(await rows(db, user(uid), 'select count(*)::int as n from passes')).toEqual([{ n: 0 }])
  })

  it('a second pass for the same group starts when the first ends', async () => {
    const uid = await signUp(db, 'queue@example.test')
    const a = await buyPass(uid, '4-5', 1)
    const b = await buyPass(uid, '4-5', 3)
    const [pa] = await rows<{ ends_at: Date }>(db, user(uid), 'select ends_at from passes where id = $1', [a.passId])
    const [pb] = await rows<{ starts_at: Date }>(db, user(uid), 'select starts_at from passes where id = $1', [b.passId])
    expect(pb!.starts_at.getTime()).toBe(pa!.ends_at.getTime())
  })

  it('a placeholder price can be bought only through the test provider', async () => {
    const uid = await signUp(db, 'price@example.test')
    await expect(rows(db, user(uid), `select create_order('4-5', 1, 'cardcom', 'terms-1')`)).rejects.toThrow(/price_not_set/)
    const [o] = await rows<{ amount_agorot: number; price_was_placeholder: boolean }>(db, user(uid), `select * from create_order('4-5', 1, 'test', 'terms-1')`)
    expect(o).toMatchObject({ amount_agorot: 0, price_was_placeholder: true })
  })

  it('cancelling is refused after 14 days', async () => {
    const uid = await signUp(db, 'late@example.test')
    const { orderId, passId } = await buyPass(uid, '4-5', 12)
    await db.query(`update orders set paid_at = now() - interval '15 days' where id = $1`, [orderId])
    await expect(rows(db, user(uid), `select cancel_purchase($1)`, [passId])).rejects.toThrow(/cancel_window_closed/)
  })
})

describe('owner', () => {
  it('reads everything, drafts included, and writes content', async () => {
    for (const s of ['trial-45', 'other-45', 'only-68', 'draft-45']) expect(await canRead(user(ids.owner!), s)).toBe(true)
    await rows(db, user(ids.owner!), `insert into stories (slug) values ('new-by-owner')`)
    const [log] = await rows<{ action: string; actor_id: string }>(db, user(ids.owner!), `select action, actor_id from audit_log where target_table = 'stories' and detail ->> 'slug' = 'new-by-owner'`)
    expect(log).toEqual({ action: 'insert', actor_id: ids.owner })
  })

  it('does not see children\'s names or progress', async () => {
    expect(await rows(db, user(ids.owner!), 'select * from children')).toEqual([])
  })

  it('cannot change the author\'s locked text', async () => {
    await db.query(`update stories set text_locked = true where id = $1`, [ids['other-45']])
    await expect(rows(db, user(ids.owner!), `update story_texts set display = 'changed' where story_id = $1`, [ids['other-45']])).rejects.toThrow(/text_locked/)
    await db.query(`update stories set text_locked = false where id = $1`, [ids['other-45']])
  })
})

describe('own account data only', () => {
  it('two accounts never see each other', async () => {
    const a = await signUp(db, 'a@example.test')
    const b = await signUp(db, 'b@example.test')
    await rows(db, user(a), `insert into children (account_id, kind, name, age_group) values ($1, 'child', 'Sami', '2-3')`, [a])
    await buyPass(a, '2-3')
    for (const t of ['children', 'passes', 'orders', 'payments']) {
      expect(await rows(db, user(b), `select * from ${t}`), t).toEqual([])
    }
    expect(await rows(db, user(b), 'select * from consents where account_id = $1', [a])).toEqual([])
    expect((await rows<{ id: string }>(db, user(b), 'select id from profiles')).map((r) => r.id)).toEqual([b])
    await expect(rows(db, user(b), `insert into children (account_id, kind, name, age_group) values ($1, 'child', 'X', '2-3')`, [a])).rejects.toThrow(/row-level security/)
    expect(await rows(db, user(b), `update children set name = 'hacked' returning id`)).toEqual([])
  })

  it('a teacher keeps classes, a parent keeps children', async () => {
    const t = await signUp(db, 'teacher@example.test', { role: 'teacher' })
    await rows(db, user(t), `insert into children (account_id, kind, name, age_group) values ($1, 'class', 'Sunflowers', '4-5')`, [t])
    await expect(rows(db, user(t), `insert into children (account_id, kind, name, age_group) values ($1, 'child', 'Dana', '4-5')`, [t])).rejects.toThrow(/row-level security/)
    const p = await signUp(db, 'parent@example.test')
    await expect(rows(db, user(p), `insert into children (account_id, kind, name, age_group) values ($1, 'class', 'Room 1', '4-5')`, [p])).rejects.toThrow(/row-level security/)
  })

  it('records sign-up consents with the terms version, marketing off unless ticked', async () => {
    const u = await signUp(db, 'consent@example.test')
    const c = await rows<{ kind: string; granted: boolean; terms_version: string | null; source: string }>(db, user(u), 'select kind, granted, terms_version, source from consents order by kind')
    expect(c).toEqual([
      { kind: 'adult', granted: true, terms_version: null, source: 'sign-up' },
      { kind: 'marketing', granted: false, terms_version: null, source: 'sign-up' },
      { kind: 'terms', granted: true, terms_version: 'test-1', source: 'sign-up' },
    ])
    const u2 = await signUp(db, 'news@example.test', { marketing: true })
    expect(await rows(db, user(u2), `select granted from consents where kind = 'marketing'`)).toEqual([{ granted: true }])
  })

  it('exports its own data and deletes its account; orders stay without a name for tax records', async () => {
    const u = await signUp(db, 'leaving@example.test')
    const { orderId } = await buyPass(u, '4-5')
    const [{ data }] = (await rows<{ data: { profile: { id: string }; passes: unknown[] } }>(db, user(u), 'select export_my_data() as data')) as [{ data: { profile: { id: string }; passes: unknown[] } }]
    expect(data.profile.id).toBe(u)
    expect(data.passes).toHaveLength(1)
    await rows(db, user(u), 'select delete_my_account()')
    expect((await db.query('select * from profiles where id = $1', [u])).rows).toEqual([])
    expect((await db.query('select * from passes where account_id = $1', [u])).rows).toEqual([])
    expect((await db.query<{ account_id: string | null }>('select account_id from orders where id = $1', [orderId])).rows).toEqual([{ account_id: null }])
    expect((await db.query<{ n: number }>('select count(*)::int as n from deletion_requests where completed_at is not null')).rows[0]!.n).toBeGreaterThan(0)
  })
})
