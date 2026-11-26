import type { PGlite } from '@electric-sql/pglite'
import { beforeAll, describe, expect, it } from 'vitest'
import { freshDb, rows, signUp, user } from './harness'

/**
 * Teachers: classroom mode (supabase/migrations/20261126110000_classroom_mode.sql). profiles.prefs accepts the
 * `classroom` switch as a boolean, keeps refusing anything else, and only the account itself may change it.
 */
let db: PGlite
beforeAll(async () => {
  db = await freshDb()
}, 180_000)

const err = async (p: Promise<unknown>) => p.then(() => null, (e: Error) => e.message)

describe('classroom mode on the account', () => {
  it('a teacher account saves classroom mode next to the other settings', async () => {
    const uid = await signUp(db, 'teacher-class@example.test', { role: 'teacher' })
    await rows(db, user(uid), `update profiles set prefs = '{"classroom": true, "textScale": 1}' where id = $1`, [uid])
    const [p] = await rows<{ prefs: Record<string, unknown>; role: string }>(db, user(uid), `select prefs, role from profiles where id = $1`, [uid])
    expect(p).toEqual({ prefs: { classroom: true, textScale: 1 }, role: 'teacher' })
    await rows(db, user(uid), `update profiles set prefs = prefs || '{"classroom": false}' where id = $1`, [uid])
    const [q] = await rows<{ prefs: Record<string, unknown> }>(db, user(uid), `select prefs from profiles where id = $1`, [uid])
    expect(q!.prefs).toEqual({ classroom: false, textScale: 1 })
  })

  it('refuses a classroom value that is not true or false, and still refuses unknown keys', async () => {
    const uid = await signUp(db, 'teacher-bad@example.test', { role: 'teacher' })
    for (const bad of ['{"classroom": "yes"}', '{"classroom": 1}', '{"classroom": null}', '{"bigScreen": true}', '{"textScale": 9}']) {
      expect(await err(rows(db, user(uid), `update profiles set prefs = $2::jsonb where id = $1`, [uid, bad]))).toMatch(/profiles_prefs_check/)
    }
  })

  it("another account cannot switch a teacher's classroom mode", async () => {
    const a = await signUp(db, 'teacher-a@example.test', { role: 'teacher' })
    const b = await signUp(db, 'parent-b@example.test')
    await rows(db, user(b), `update profiles set prefs = '{"classroom": true}' where id = $1`, [a])
    const [p] = (await db.query<{ prefs: Record<string, unknown> }>(`select prefs from profiles where id = $1`, [a])).rows
    expect(p!.prefs).toEqual({})
    expect(await err(rows(db, { role: 'anon' }, `update profiles set prefs = '{"classroom": true}' where id = $1`, [a]))).toMatch(/permission denied/)
  })
})
