import type { PGlite } from '@electric-sql/pglite'
import { beforeAll, describe, expect, it } from 'vitest'
import { freshDb, rows, service, signUp, user } from './harness'

/**
 * Stage 4, part C (supabase/migrations/20261125120000_email_log_privacy.sql): after an account is deleted, its
 * email address does not stay in email_log. The address becomes the same salted hash the trial ledger uses; the
 * rest of each row (which email, language, status, times, message id) stays for audit. Failed before the migration.
 */
let db: PGlite
beforeAll(async () => {
  db = await freshDb()
}, 120_000)

type LogRow = { to_email: string | null; to_email_hash: string | null; template: string; status: string; provider_message_id: string | null; sent_at: string | null }
const logFor = async (hash: string | null, email: string) =>
  (await db.query<LogRow>(`select * from email_log where lower(to_email) = $1 or to_email_hash = $2 order by created_at, template`, [email, hash])).rows
const hashOf = async (email: string) =>
  (await db.query<{ h: string }>(`select encode(sha256(convert_to(ledger_salt || ':' || $1, 'UTF8')), 'hex') as h from private.settings`, [email])).rows[0]!.h

describe('email log after an account is deleted', () => {
  it('replaces the address of every earlier email with the salted hash at once, keeping the record', async () => {
    const uid = await signUp(db, 'Forget.Me@Example.test')
    await db.query(
      `insert into email_log (account_id, to_email, template, lang, status, provider_message_id, sent_at, dedupe_key)
       values ($1::uuid, 'forget.me@example.test', 'welcome', 'en', 'sent', 'msg-1', now(), 'welcome:' || $1::text),
              ($1::uuid, 'forget.me@example.test', 'trial_ends_tomorrow', 'en', 'sent', 'msg-2', now(), 'trial:' || $1::text)`,
      [uid],
    )
    await rows(db, user(uid), `select delete_my_account()`)
    const h = await hashOf('forget.me@example.test')
    const log = await logFor(h, 'forget.me@example.test')
    const earlier = log.filter((r) => r.template !== 'account_deleted')
    expect(earlier).toHaveLength(2)
    for (const r of earlier) expect(r).toMatchObject({ to_email: null, to_email_hash: h, status: 'sent' })
    expect(earlier.map((r) => r.provider_message_id).sort()).toEqual(['msg-1', 'msg-2'])
    // The goodbye email still has its address: it has not been sent yet.
    expect(log.find((r) => r.template === 'account_deleted')).toMatchObject({ to_email: 'forget.me@example.test', status: 'queued' })
  })

  it('forgets the address of the account-deleted email once it has been sent', async () => {
    const uid = await signUp(db, 'bye@example.test')
    await rows(db, user(uid), `select delete_my_account()`)
    const claimed = (await rows<{ id: string; to_email: string }>(db, service, `select * from email_claim_queued()`)).find((r) => r.to_email === 'bye@example.test')
    expect(claimed).toBeTruthy() // the job still gets the address to send to
    await rows(db, service, `update email_log set status = 'sent', provider_message_id = 'msg-bye', sent_at = now() where id = $1`, [claimed!.id])
    const [row] = (await db.query<LogRow>(`select * from email_log where id = $1`, [claimed!.id])).rows
    expect(row).toMatchObject({ to_email: null, to_email_hash: await hashOf('bye@example.test'), status: 'sent', provider_message_id: 'msg-bye', template: 'account_deleted' })
    expect(row!.sent_at).not.toBeNull()
  })

  it('also forgets it when the email is skipped or fails for good, but not while it may be retried', async () => {
    const uid = await signUp(db, 'retry@example.test')
    await rows(db, user(uid), `select delete_my_account()`)
    const claimed = (await rows<{ id: string; to_email: string }>(db, service, `select * from email_claim_queued()`)).find((r) => r.to_email === 'retry@example.test')
    await rows(db, service, `update email_log set status = 'queued', error = 'timeout' where id = $1`, [claimed!.id])
    expect((await db.query<LogRow>(`select * from email_log where id = $1`, [claimed!.id])).rows[0]!.to_email).toBe('retry@example.test')
    await rows(db, service, `update email_log set status = 'failed' where id = $1`, [claimed!.id])
    expect((await db.query<LogRow>(`select * from email_log where id = $1`, [claimed!.id])).rows[0]).toMatchObject({ to_email: null, to_email_hash: await hashOf('retry@example.test') })
  })

  it('leaves no copy of a deleted address anywhere in the log', async () => {
    const uid = await signUp(db, 'nothing.left@example.test')
    await db.query(`insert into email_log (account_id, to_email, template, lang, status) values ($1, 'nothing.left@example.test', 'welcome', 'he', 'sent')`, [uid])
    await rows(db, user(uid), `select delete_my_account()`)
    const c = (await rows<{ id: string; to_email: string }>(db, service, `select * from email_claim_queued()`)).find((r) => r.to_email === 'nothing.left@example.test')
    await rows(db, service, `update email_log set status = 'sent' where id = $1`, [c!.id])
    const left = await db.query(`select 1 from email_log where to_email ilike '%nothing.left%'`)
    expect(left.rows).toHaveLength(0)
  })

  it('keeps the address of accounts that still exist', async () => {
    const stays = await signUp(db, 'stays@example.test')
    await db.query(`insert into email_log (account_id, to_email, template, lang, status) values ($1, 'stays@example.test', 'welcome', 'en', 'sent')`, [stays])
    const other = await signUp(db, 'leaves@example.test')
    await rows(db, user(other), `select delete_my_account()`)
    expect((await logFor(null, 'stays@example.test'))[0]).toMatchObject({ to_email: 'stays@example.test', to_email_hash: null })
  })

  it('the hash function cannot be called by signed-in users or visitors', async () => {
    const uid = await signUp(db, 'curious@example.test')
    await expect(rows(db, user(uid), `select private.email_hash('x@example.test')`)).rejects.toThrow(/permission denied/)
  })
})
