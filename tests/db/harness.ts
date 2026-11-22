import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PGlite, type Transaction } from '@electric-sql/pglite'

const root = resolve(import.meta.dirname, '../..')
const migrationsDir = resolve(root, 'supabase/migrations')

/** The terms versions the tests sign up and order with (besides the real one the migrations publish). */
export const TEST_TERMS = ['test-1', 'terms-1']

/**
 * A new embedded Postgres with the Supabase stand-in and every migration applied in order.
 * `preview` (the default) sets it up like the preview project: test payments on and the tests' terms versions
 * published. `preview: false` is the database exactly as the migrations leave it, as in production.
 */
export async function freshDb({ preview = true }: { preview?: boolean } = {}): Promise<PGlite> {
  const db = new PGlite()
  await db.exec(readFileSync(resolve(import.meta.dirname, 'supabase-stand-in.sql'), 'utf8'))
  for (const f of readdirSync(migrationsDir).filter((n) => n.endsWith('.sql')).sort()) {
    await db.exec(readFileSync(resolve(migrationsDir, f), 'utf8'))
  }
  if (preview && (await db.query<{ t: string | null }>(`select to_regclass('private.settings')::text as t`)).rows[0]!.t) {
    await db.exec(`update private.settings set allow_test_payments = true`)
    for (const v of TEST_TERMS) await db.query(`insert into private.terms_versions (version) values ($1)`, [v])
  }
  return db
}

export type Who = { role: 'anon' } | { role: 'authenticated'; uid: string; email?: string } | { role: 'service_role' }
export const anon: Who = { role: 'anon' }
export const service: Who = { role: 'service_role' }
export const user = (uid: string, email?: string): Who => ({ role: 'authenticated', uid, email })

/**
 * Runs `fn` as a Supabase request would: inside a transaction, with the database role switched (so row-level
 * security applies) and the JWT subject set for auth.uid() (and the claims for auth.jwt()). Rolled back when `fn`
 * throws.
 */
export async function as<T>(db: PGlite, who: Who, fn: (tx: Transaction) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.exec(`set local role ${who.role}`)
    await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [who.role === 'authenticated' ? who.uid : ''])
    const claims = who.role === 'authenticated' ? { sub: who.uid, email: who.email, role: who.role } : { role: who.role }
    await tx.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify(claims)])
    return fn(tx)
  })
}

/** Rows a role can see from a query, or the error it gets. */
export async function rows<T = Record<string, unknown>>(db: PGlite, who: Who, sql: string, params: unknown[] = []): Promise<T[]> {
  return as(db, who, async (tx) => (await tx.query<T>(sql, params)).rows)
}

/** Creates a confirmed user through the auth.users trigger, as sign-up does. Returns its id. */
export async function signUp(db: PGlite, email: string, meta: Record<string, unknown> = {}): Promise<string> {
  const r = await db.query<{ id: string }>(
    `insert into auth.users (email, raw_user_meta_data, email_confirmed_at) values ($1, $2, now()) returning id`,
    [email, JSON.stringify({ role: 'parent', language: 'en', terms_accepted: true, terms_version: 'test-1', adult: true, ...meta })],
  )
  return r.rows[0]!.id
}
