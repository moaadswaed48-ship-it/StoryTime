import type { PGlite } from '@electric-sql/pglite'
import { beforeAll, describe, expect, it } from 'vitest'
import { anon, freshDb, rows, signUp, user } from './harness'

/**
 * The public contact form (supabase/migrations/20261125140000_contact_messages.sql): anyone may send through
 * send_contact_message(), only the owner may read, and one address may send at most 3 messages an hour.
 */
let db: PGlite
let owner: string
let parent: string
beforeAll(async () => {
  db = await freshDb()
  owner = await signUp(db, 'owner-contact@example.test')
  await db.query(`update profiles set role = 'owner' where id = $1`, [owner])
  parent = await signUp(db, 'parent-contact@example.test')
}, 180_000)

const send = (who: typeof anon, email: string, message = 'Hello') =>
  rows(db, who, `select send_contact_message($1, $2, $3, 'he')`, ['Dana', email, message])

describe('contact messages', () => {
  it('a signed-out visitor and a signed-in parent can send; only the owner reads them', async () => {
    await send(anon, 'visitor@example.test', '  A question about the trial.  ')
    await send(user(parent), 'parent-contact@example.test')
    await expect(rows(db, anon, `select * from contact_messages`)).rejects.toThrow(/permission denied/)
    expect(await rows(db, user(parent), `select * from contact_messages`)).toEqual([])
    const seen = await rows<{ email: string; message: string; lang: string; name: string }>(db, user(owner), `select email, message, lang, name from contact_messages order by created_at, email`)
    expect(seen).toHaveLength(2)
    expect(seen.find((r) => r.email === 'visitor@example.test')).toMatchObject({ message: 'A question about the trial.', lang: 'he', name: 'Dana' })
  })

  it('nobody writes to the table directly', async () => {
    await expect(rows(db, anon, `insert into contact_messages (email, lang, message) values ('x@example.test', 'en', 'x')`)).rejects.toThrow(/permission denied/)
    await expect(rows(db, user(parent), `insert into contact_messages (email, lang, message) values ('x@example.test', 'en', 'x')`)).rejects.toThrow(/permission denied/)
  })

  it('refuses a bad address, an empty or too long message, and a fourth message within the hour', async () => {
    await expect(send(anon, 'not-an-address')).rejects.toThrow(/invalid_email/)
    await expect(send(anon, 'empty@example.test', '   ')).rejects.toThrow(/contact_messages_message_check/)
    await expect(send(anon, 'long@example.test', 'x'.repeat(2001))).rejects.toThrow(/contact_messages_message_check/)
    for (let i = 0; i < 3; i++) await send(anon, i === 1 ? 'Flood@Example.test' : 'flood@example.test')
    await expect(send(anon, 'flood@example.test ')).rejects.toThrow(/rate_limited/)
    await send(anon, 'someone-else@example.test')
  })
})
