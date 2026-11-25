import type { PGlite } from '@electric-sql/pglite'
import { beforeAll, describe, expect, it } from 'vitest'
import { freshDb, rows, service, signUp, user } from './harness'

/**
 * Fixes from the fresh review of Stage 4 part B2 (docs/reviews/stage4b2-review.md, "Fixes";
 * supabase/migrations/20261122120000_owner_emails_review.sql). Each test failed before that migration.
 */
let db: PGlite
let owner: string
let parent: string
const LANGS = ['ar', 'he', 'en', 'da'] as const

const err = async (p: Promise<unknown>) => {
  try {
    await p
    return null
  } catch (e) {
    return String((e as Error).message)
  }
}
const asOwner = (sql: string, params: unknown[] = []) => rows<{ r: any }>(db, user(owner), sql, params)
const getStory = async (id: string) => (await asOwner(`select owner_story($1) as r`, [id]))[0]!.r
const save = (id: string, d: unknown) => asOwner(`select owner_save_story($1, $2::jsonb)`, [id, JSON.stringify(d)])
const draftOf = (s: any) => JSON.parse(JSON.stringify({ groups: s.groups, pages: s.pages, texts: s.texts, films: s.films, activity: s.activity }))
const media = async () => (await asOwner(`insert into media (kind, storage_path, source, licence) values ('image', $1, 'upload', 'own work') returning id as r`, [`page/${crypto.randomUUID()}.png`]))[0]!.r as string

/** A complete four-language story with one page and a picture, in the 4-5 group, signed off in `signed`. */
async function story(signed: readonly string[] = LANGS, trial = false) {
  const id = (await asOwner(`select owner_create_story() as r`))[0]!.r as string
  const s = await getStory(id)
  const d = draftOf(s)
  d.groups = [{ group: '4-5', trial }]
  d.pages[0].pictureId = await media()
  for (const l of LANGS) d.texts[l] = { ...d.texts[l], title: `Title ${l}`, pages: { [d.pages[0].key]: { text: `Words ${l}`, speech: '' } } }
  await save(id, d)
  for (const l of signed) await asOwner(`select owner_sign_off($1, $2::site_lang)`, [id, l])
  return id
}

beforeAll(async () => {
  db = await freshDb()
  owner = await signUp(db, 'owner@example.test')
  await db.query(`update profiles set role = 'owner' where id = $1`, [owner])
  parent = await signUp(db, 'Parent@Example.test', { language: 'he' })
}, 60_000)

describe('B1: languages that are not published stay invisible to families', () => {
  it('a story published in Arabic only shows families no Hebrew title, words or film', async () => {
    const id = await story(['ar'], true)
    await asOwner(`select owner_publish($1, array['ar']::site_lang[])`, [id])
    await rows(db, user(parent), `select start_trial('4-5')`)
    const titles = await rows<{ lang: string }>(db, user(parent), `select lang from story_listings where story_id = $1 order by lang`, [id])
    expect(titles.map((r) => r.lang)).toEqual(['ar'])
    const words = await rows<{ lang: string }>(db, user(parent), `select lang from story_texts where story_id = $1 order by lang`, [id])
    expect(words.map((r) => r.lang)).toEqual(['ar'])
    // The owner still sees every language.
    expect((await asOwner(`select count(*)::int as r from story_texts where story_id = $1`, [id]))[0]!.r).toBe(4)
  })
})

describe('B2: a published story stays complete', () => {
  it('refuses a save that empties a published language or removes a picture; allows ordinary edits', async () => {
    const id = await story()
    await asOwner(`select owner_publish($1, null)`, [id])
    const s = await getStory(id)
    const key = s.pages[0].key
    expect(await err(save(id, { ...draftOf(s), texts: { ...s.texts, da: { ...s.texts.da, pages: { [key]: { text: '', speech: '' } } } } }))).toMatch(/published_incomplete/)
    expect(await err(save(id, { ...draftOf(s), pages: [{ ...s.pages[0], pictureId: null }] }))).toMatch(/published_incomplete/)
    expect(await err(save(id, { ...draftOf(s), groups: [] }))).toMatch(/published_incomplete/)
    expect((await getStory(id)).texts.da.pages[key].text).toBe('Words da')
    await save(id, { ...draftOf(s), texts: { ...s.texts, en: { ...s.texts.en, teaser: 'A short line' } } })
    expect((await getStory(id)).texts.en.teaser).toBe('A short line')
  })

  it('only the published languages must stay complete', async () => {
    const id = await story(['ar', 'he'])
    await asOwner(`select owner_publish($1, array['ar','he']::site_lang[])`, [id])
    const s = await getStory(id)
    await save(id, { ...draftOf(s), texts: { ...s.texts, da: { ...s.texts.da, title: '' } } })
    expect((await getStory(id)).texts.da.title).toBe('')
  })
})

describe('R1: no published story by a direct insert', () => {
  it('the owner cannot insert a story that is already published', async () => {
    expect(await err(asOwner(`insert into stories (slug, status) values ('sneaky', 'published')`))).toMatch(/publish_blocked/)
  })
})

describe("R2: the author's Arabic title and page list are locked in the tables", () => {
  it('direct writes to her title or pages are refused; her pictures can still change', async () => {
    const id = await story([])
    const s = await getStory(id)
    await db.query(`update stories set credit = 'author', text_locked = true where id = $1`, [id])
    expect(await err(asOwner(`update story_listings set title = 'آخر' where story_id = $1 and lang = 'ar'`, [id]))).toMatch(/text_locked/)
    expect(await err(asOwner(`delete from story_listings where story_id = $1 and lang = 'ar'`, [id]))).toMatch(/text_locked/)
    expect(await err(asOwner(`insert into pages (story_id, page_no) values ($1, 2)`, [id]))).toMatch(/text_locked/)
    expect(await err(asOwner(`delete from pages where story_id = $1`, [id]))).toMatch(/text_locked/)
    const pic = await media()
    await save(id, { ...draftOf(s), pages: [{ ...s.pages[0], pictureId: pic }] })
    expect((await getStory(id)).pages[0].pictureId).toBe(pic)
  })
})

describe('B3: the account-deleted email', () => {
  it('is queued with the address and language captured before the account goes, and handed to one run only', async () => {
    const gone = await signUp(db, 'Leaving@Example.test', { language: 'da' })
    await rows(db, user(gone), `select delete_my_account()`)
    expect((await db.query(`select 1 from auth.users where id = $1`, [gone])).rows).toHaveLength(0)
    const claimed = await rows<{ to_email: string; lang: string; template: string; status: string; created_at: string }>(db, service, `select * from email_claim_queued()`)
    expect(claimed).toHaveLength(1)
    expect(claimed[0]).toMatchObject({ to_email: 'leaving@example.test', lang: 'da', template: 'account_deleted', status: 'sending' })
    // A second, overlapping run gets nothing.
    expect(await rows(db, service, `select * from email_claim_queued()`)).toHaveLength(0)
  })

  it('cannot be claimed by a signed-in user', async () => {
    expect(await err(rows(db, user(parent), `select * from email_claim_queued()`))).toMatch(/permission denied/)
  })
})
