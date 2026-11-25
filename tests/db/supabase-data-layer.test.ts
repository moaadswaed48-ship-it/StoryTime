import type { PGlite } from '@electric-sql/pglite'
import type { SupabaseClient } from '@supabase/supabase-js'
import { beforeAll, describe, expect, it } from 'vitest'
import { DataError } from '@/data/errors'
import { SupabaseApi } from '@/data/supabase'
import { freshDb, rows, service, signUp, user } from './harness'

/**
 * The Supabase data layer (src/data/supabase/index.ts) run against the real policies in PGlite, through a small
 * stand-in for the supabase-js query builder: from().select().eq().order().limit().single()/maybeSingle() and rpc().
 * The stand-in runs `select * from <table> where <eq filters>` as the signed-in user, so row-level security decides
 * what comes back, exactly as PostgREST would. Embedded relations (for example `orders(paid_at)`) come back empty.
 *
 * Review finding B2: the owner's role may read every account's trials, passes and orders, so the "my account"
 * screens must filter by account. Before the fix the owner's getAccess() failed (two trials for maybeSingle) and
 * the owner saw other customers' passes and orders as their own.
 */

type Res = { data: unknown; error: { message: string; code?: string } | null }
const ident = (s: string) => {
  if (!/^[a-z_]+$/.test(s)) throw new Error(`unexpected identifier ${s}`)
  return s
}

class Query implements PromiseLike<Res> {
  private filters: [string, unknown][] = []
  private orderBy: [string, boolean] | null = null
  private max: number | null = null
  private one: 'single' | 'maybe' | null = null
  constructor(private db: PGlite, private uid: string, private table: string) {}
  select(_columns?: string) { return this }
  eq(column: string, value: unknown) { this.filters.push([column, value]); return this }
  in(column: string, values: unknown[]) { this.filters.push([column, { any: values }]); return this }
  order(column: string, o?: { ascending?: boolean }) { this.orderBy = [column, o?.ascending !== false]; return this }
  limit(n: number) { this.max = n; return this }
  single() { this.one = 'single'; return this }
  maybeSingle() { this.one = 'maybe'; return this }
  private async run(): Promise<Res> {
    const isAny = (v: unknown): v is { any: unknown[] } => !!v && typeof v === 'object' && 'any' in v
    const cond = ([c, v]: [string, unknown], i: number) => (isAny(v) ? `${ident(c)}::text = any($${i + 1}::text[])` : `${ident(c)} = $${i + 1}`)
    const where = this.filters.length ? ` where ${this.filters.map(cond).join(' and ')}` : ''
    const order = this.orderBy ? ` order by ${ident(this.orderBy[0])} ${this.orderBy[1] ? 'asc' : 'desc'}` : ''
    const limit = this.max === null ? '' : ` limit ${Number(this.max)}`
    try {
      const r = await rows(this.db, user(this.uid), `select * from public.${ident(this.table)}${where}${order}${limit}`, this.filters.map(([, v]) => (isAny(v) ? v.any : v)))
      if (!this.one) return { data: r, error: null }
      // PostgREST's answer when one row was asked for and several (or, for single(), none) came back.
      if (r.length > 1 || (this.one === 'single' && r.length === 0)) return { data: null, error: { message: 'JSON object requested, multiple (or no) rows returned', code: 'PGRST116' } }
      return { data: r[0] ?? null, error: null }
    } catch (e) {
      return { data: null, error: { message: (e as Error).message } }
    }
  }
  then<A = Res, B = never>(ok?: ((v: Res) => A | PromiseLike<A>) | null, bad?: ((e: unknown) => B | PromiseLike<B>) | null) {
    return this.run().then(ok, bad)
  }
}

function fakeClient(db: PGlite, uid: string, email: string): SupabaseClient {
  return {
    from: (table: string) => new Query(db, uid, table),
    rpc: async (fn: string, args: Record<string, unknown> = {}): Promise<Res> => {
      const names = Object.keys(args)
      try {
        const r = await rows(db, user(uid), `select * from public.${ident(fn)}(${names.map((n, i) => `${ident(n)} => $${i + 1}`).join(', ')})`, names.map((n) => args[n]))
        return { data: r[0] ?? null, error: null }
      } catch (e) {
        return { data: null, error: { message: (e as Error).message } }
      }
    },
    auth: { getSession: async () => ({ data: { session: { user: { id: uid, email } } } }) },
  } as unknown as SupabaseClient
}

let db: PGlite
const ids: Record<string, string> = {}
const api = (who: string) => new SupabaseApi('http://supabase.invalid', 'publishable-key', 'http://test/', fakeClient(db, ids[who]!, `${who}@example.test`))

beforeAll(async () => {
  db = await freshDb()
  const s = (await db.query<{ id: string }>(`insert into stories (slug, status, published_at) values ('t45', 'published', now()) returning id`)).rows[0]!.id
  await db.query(`insert into story_age_groups (story_id, age_group, is_trial) values ($1, '4-5', true)`, [s])
  for (const who of ['owner', 'ana', 'ben']) ids[who] = await signUp(db, `${who}@example.test`)
  await db.query(`update profiles set role = 'owner' where id = $1`, [ids.owner])
  // Two customers, each with a trial, a paid pass and its order.
  for (const who of ['ana', 'ben']) {
    await rows(db, user(ids[who]!), `select start_trial('4-5')`)
    const [o] = await rows<{ id: string }>(db, user(ids[who]!), `select * from create_order('6-8', 1, 'test', 'terms-1')`)
    await rows(db, service, `select confirm_payment('test', $1, $2, $3, 0)`, [`evt-${who}`, o!.id, `pay-${who}`])
    ids[`${who}:order`] = o!.id
  }
}, 60_000)

describe('Supabase data layer: "my" screens show only my rows, also for the owner (B2)', () => {
  it('the owner\'s access has no trial or pass of other accounts, and loads without an error', async () => {
    const a = await api('owner').getAccess()
    expect(a.role).toBe('owner')
    expect(a.trial).toBeNull()
    expect(a.passes).toEqual([])
  })

  it('the owner\'s orders list is empty, and another account\'s order is "not found"', async () => {
    expect(await api('owner').listOrders()).toEqual([])
    await expect(api('owner').getOrder(ids['ana:order']!)).rejects.toSatisfy((e) => e instanceof DataError && e.code === 'not_found')
  })

  it('a customer sees their own trial, pass and order', async () => {
    const a = await api('ana').getAccess()
    expect(a.trial?.ageGroup).toBe('4-5')
    expect(a.passes.map((p) => p.ageGroup)).toEqual(['6-8'])
    expect((await api('ana').listOrders()).map((o) => o.id)).toEqual([ids['ana:order']])
    expect((await api('ana').getOrder(ids['ana:order']!)).status).toBe('paid')
    await expect(api('ana').getOrder(ids['ben:order']!)).rejects.toSatisfy((e) => e instanceof DataError && e.code === 'not_found')
  })
})
