import type { PGlite } from '@electric-sql/pglite'
import { beforeAll, describe, expect, it } from 'vitest'
import { freshDb, rows, signUp, user } from './harness'

/**
 * Stage 4, part C (supabase/migrations/20261125130000_family_prefs_favourites.sql): settings that follow the account
 * to another device, the film position per profile, and "my shelf" per profile, each only for its own account.
 */
let db: PGlite
let story: string
beforeAll(async () => {
  db = await freshDb()
  story = (await db.query<{ id: string }>(`insert into stories (slug) values ('fav-test') returning id`)).rows[0]!.id
}, 180_000)

const err = async (p: Promise<unknown>) => p.then(() => null, (e: Error) => e.message)
async function family(email: string) {
  const uid = await signUp(db, email)
  const [child] = await rows<{ id: string }>(db, user(uid), `insert into children (account_id, kind, name, age_group) values ($1, 'child', 'Noor', '4-5') returning id`, [uid])
  return { uid, child: child!.id }
}

describe('reading and film settings on the account', () => {
  it('the account may save its own settings, and only the known ones', async () => {
    const { uid } = await family('prefs@example.test')
    await rows(db, user(uid), `update profiles set prefs = '{"autoFlip": false, "textScale": 2, "view": "list"}' where id = $1`, [uid])
    const [p] = await rows<{ prefs: Record<string, unknown> }>(db, user(uid), `select prefs from profiles where id = $1`, [uid])
    expect(p!.prefs).toEqual({ autoFlip: false, textScale: 2, view: 'list' })
    expect(await err(rows(db, user(uid), `update profiles set prefs = '{"anything": "else"}' where id = $1`, [uid]))).toMatch(/profiles_prefs_check/)
    expect(await err(rows(db, user(uid), `update profiles set prefs = '{"textScale": 9}' where id = $1`, [uid]))).toMatch(/profiles_prefs_check/)
    expect(await err(rows(db, user(uid), `update profiles set prefs = '{"captions": "yes"}' where id = $1`, [uid]))).toMatch(/profiles_prefs_check/)
  })

  it("another account's settings cannot be changed", async () => {
    const a = await family('prefs-a@example.test')
    const b = await family('prefs-b@example.test')
    await rows(db, user(b.uid), `update profiles set prefs = '{"captions": false}' where id = $1`, [a.uid])
    const [p] = (await db.query<{ prefs: Record<string, unknown> }>(`select prefs from profiles where id = $1`, [a.uid])).rows
    expect(p!.prefs).toEqual({})
  })
})

describe('film position per profile', () => {
  it('is kept with the progress row, within a sane range', async () => {
    const { uid, child } = await family('film@example.test')
    await rows(db, user(uid), `insert into progress (child_id, story_id, film_position_s) values ($1, $2, 75)`, [child, story])
    const [r] = await rows<{ film_position_s: number }>(db, user(uid), `select film_position_s from progress where child_id = $1`, [child])
    expect(r!.film_position_s).toBe(75)
    expect(await err(rows(db, user(uid), `update progress set film_position_s = -1 where child_id = $1`, [child]))).toMatch(/check/)
  })
})

describe('favourites ("my shelf")', () => {
  it('a profile keeps its favourites; another account cannot see or add to them', async () => {
    const a = await family('fav-a@example.test')
    const b = await family('fav-b@example.test')
    await rows(db, user(a.uid), `insert into favourites (child_id, story_id) values ($1, $2)`, [a.child, story])
    expect(await rows(db, user(a.uid), `select story_id from favourites where child_id = $1`, [a.child])).toEqual([{ story_id: story }])
    expect(await rows(db, user(b.uid), `select * from favourites`)).toEqual([])
    expect(await err(rows(db, user(b.uid), `insert into favourites (child_id, story_id) values ($1, $2)`, [a.child, story]))).toMatch(/row-level security/)
    expect(await err(rows(db, { role: 'anon' }, `select * from favourites`))).toMatch(/permission denied/)
  })

  it('goes with the profile, and is in "Download my data"', async () => {
    const a = await family('fav-export@example.test')
    await rows(db, user(a.uid), `insert into favourites (child_id, story_id) values ($1, $2)`, [a.child, story])
    const [x] = await rows<{ d: { favourites: { story_id: string }[] } }>(db, user(a.uid, 'fav-export@example.test'), `select export_my_data() as d`)
    expect(x!.d.favourites.map((f) => f.story_id)).toEqual([story])
    await rows(db, user(a.uid), `delete from children where id = $1`, [a.child])
    expect((await db.query(`select 1 from favourites where child_id = $1`, [a.child])).rows).toHaveLength(0)
  })
})
