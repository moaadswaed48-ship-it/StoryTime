import type { PGlite } from '@electric-sql/pglite'
import { beforeAll, describe, expect, it } from 'vitest'
import { as, freshDb, rows, service, signUp, user } from './harness'

/**
 * Part B2: the owner's functions, the publish rule, sign-off fingerprints, the trial limit, the author's lock,
 * the dashboard and the email tables, in PGlite with the Supabase stand-in (see harness.ts for its limits).
 */
let db: PGlite
let owner: string
let parent: string
const LANGS = ['ar', 'he', 'en', 'da'] as const

const rpc = async <T = unknown>(uid: string, sql: string, params: unknown[] = []) => (await rows<{ r: T }>(db, user(uid), sql, params))[0]?.r as T
const err = async (p: Promise<unknown>) => {
  try {
    await p
    return null
  } catch (e) {
    return String((e as Error).message)
  }
}

async function media(uid: string, kind = 'image') {
  return (await rows<{ id: string }>(db, user(uid), `insert into media (kind, storage_path, source, licence) values ($1, $2, 'upload', 'own work') returning id`, [kind, `page/${Math.random()}.png`]))[0]!.id
}

type Draft = Record<string, unknown>
function draft(story: Record<string, unknown>, mutate?: (d: Draft) => void): Draft {
  const d = JSON.parse(JSON.stringify({ groups: story.groups, pages: story.pages, texts: story.texts, films: story.films, activity: story.activity }))
  mutate?.(d)
  return d
}

async function getStory(id: string) {
  return rpc<Record<string, any>>(owner, `select owner_story($1) as r`, [id])
}
async function save(id: string, d: Draft, uid = owner) {
  await rows(db, user(uid), `select owner_save_story($1, $2::jsonb)`, [id, JSON.stringify(d)])
}

/** A complete four-language story with a picture on each of its two pages, in the 4-5 group. */
async function completeStory(group = '4-5', trial = false) {
  const id = await rpc<string>(owner, `select owner_create_story() as r`)
  const s = await getStory(id)
  const p1 = s.pages[0].key as string
  const p2 = crypto.randomUUID()
  const pic1 = await media(owner)
  const pic2 = await media(owner)
  await save(id, draft(s, (d: any) => {
    d.groups = [{ group, trial }]
    d.pages = [{ key: p1, pictureId: pic1, zone: { side: 'start', v: 'top', size: 's' } }, { key: p2, pictureId: pic2, zone: { side: 'full', v: 'bottom', size: 'm' } }]
    for (const l of LANGS) d.texts[l] = { ...d.texts[l], title: `Title ${l}`, teaser: '', pages: { [p1]: { text: `One ${l}`, speech: '' }, [p2]: { text: `Two ${l}`, speech: '' } } }
  }))
  return id
}

beforeAll(async () => {
  db = await freshDb()
  owner = await signUp(db, 'owner@example.test')
  await db.query(`update profiles set role = 'owner' where id = $1`, [owner])
  parent = await signUp(db, 'parent@example.test', { marketing: true })
}, 60_000)

describe('owner functions', () => {
  it('refuse anyone but the owner', async () => {
    expect(await err(rows(db, user(parent), `select owner_create_story()`))).toMatch(/not_owner/)
    expect(await err(rows(db, user(parent), `select owner_dashboard()`))).toMatch(/not_owner/)
    expect(await err(rows(db, user(parent), `insert into stories (slug) values ('x')`))).toMatch(/row-level security/)
  })

  it('save and read back a whole story, writing only what changed', async () => {
    const id = await completeStory()
    const s = await getStory(id)
    expect(s.status).toBe('draft')
    expect(s.pages).toHaveLength(2)
    expect(s.pages[0].zone).toEqual({ side: 'start', v: 'top', size: 's' })
    expect(s.texts.da.title).toBe('Title da')
    expect(s.texts.en.pages[s.pages[1].key]).toEqual({ text: 'Two en', speech: '' })
    expect(s.groups).toEqual([{ group: '4-5', trial: false }])
    // Saving the same draft again writes nothing to the audit log.
    const before = Number((await db.query<{ n: string }>(`select count(*) as n from audit_log`)).rows[0]!.n)
    await save(id, draft(s))
    const after = Number((await db.query<{ n: string }>(`select count(*) as n from audit_log`)).rows[0]!.n)
    expect(after).toBe(before)
    // A real change is logged with who made it.
    await save(id, draft(s, (d: any) => (d.texts.en.teaser = 'A short line')))
    const last = (await db.query<{ actor_id: string; target_table: string }>(`select actor_id, target_table from audit_log order by id desc limit 2`)).rows
    expect(last.map((r) => r.target_table).sort()).toEqual(['stories', 'story_listings']) // the change, and the version bump
    expect(last.every((r) => r.actor_id === owner)).toBe(true)
  })

  it('keeps activity steps, their order and captions per language', async () => {
    const id = await completeStory('6-8')
    const s = await getStory(id)
    const a = crypto.randomUUID()
    const b = crypto.randomUUID()
    const loop = await media(owner, 'video')
    await save(id, draft(s, (d: any) => {
      d.activity = { steps: [{ key: a, mediaId: null, loop: false }, { key: b, mediaId: loop, loop: true }] }
      d.texts.en.activity = { title: 'Cups', goal: 'Count', materials: ['cups'], steps: { [a]: 'Line up', [b]: 'Count' }, safety: 'Plastic cups', forAdult: 'Why', inClass: 'Groups' }
    }))
    let r = await getStory(id)
    expect(r.activity.steps.map((x: any) => [x.key, x.loop])).toEqual([[a, false], [b, true]])
    expect(r.texts.en.activity.steps).toEqual({ [a]: 'Line up', [b]: 'Count' })
    expect(r.texts.en.activity.materials).toEqual(['cups'])
    // Swap the two steps: no collision on the unique position.
    await save(id, draft(r, (d: any) => (d.activity.steps = [d.activity.steps[1], d.activity.steps[0]])))
    r = await getStory(id)
    expect(r.activity.steps.map((x: any) => x.key)).toEqual([b, a])
  })
})

describe('publish rule', () => {
  it('needs every language signed off on its current content', async () => {
    const id = await completeStory()
    expect(await err(rows(db, user(owner), `select owner_publish($1, null)`, [id]))).toMatch(/publish_blocked/)
    for (const l of LANGS) await rows(db, user(owner), `select owner_sign_off($1, $2::site_lang)`, [id, l])
    await rows(db, user(owner), `select owner_publish($1, null)`, [id])
    const s = await getStory(id)
    expect(s.status).toBe('published')
    expect(s.publishLangs).toBeNull()
    expect(s.publishedAt).toBeTruthy()
  })

  it('a later change makes that sign-off stale; "these languages only" still works', async () => {
    const id = await completeStory()
    for (const l of LANGS) await rows(db, user(owner), `select owner_sign_off($1, $2::site_lang)`, [id, l])
    const s = await getStory(id)
    await save(id, draft(s, (d: any) => (d.texts.en.title = 'Changed')))
    const after = await getStory(id)
    expect(after.signoffs.en.valid).toBe(false)
    expect(after.signoffs.ar.valid).toBe(true)
    expect(await err(rows(db, user(owner), `select owner_publish($1, null)`, [id]))).toMatch(/publish_blocked/)
    expect(await err(rows(db, user(owner), `select owner_publish($1, array['en']::site_lang[])`, [id]))).toMatch(/publish_blocked/)
    await rows(db, user(owner), `select owner_publish($1, array['he','ar']::site_lang[])`, [id])
    expect((await getStory(id)).publishLangs).toEqual(['ar', 'he'])
  })

  it('refuses to sign off an incomplete language, and a story with a page without a picture', async () => {
    const id = await rpc<string>(owner, `select owner_create_story() as r`)
    expect(await err(rows(db, user(owner), `select owner_sign_off($1, 'en')`, [id]))).toMatch(/signoff_blocked/)
    const s = await getStory(id)
    await save(id, draft(s, (d: any) => {
      d.groups = [{ group: '2-3', trial: false }]
      d.texts.en = { ...d.texts.en, title: 'T', pages: { [s.pages[0].key]: { text: 'Words', speech: '' } } }
    }))
    await rows(db, user(owner), `select owner_sign_off($1, 'en')`, [id])
    expect(await err(rows(db, user(owner), `select owner_publish($1, array['en']::site_lang[])`, [id]))).toMatch(/publish_blocked/)
  })

  it('allows at most three trial stories per age group', async () => {
    for (let i = 0; i < 3; i++) await completeStory('2-3', true)
    expect(await err(completeStory('2-3', true))).toMatch(/trial_limit/)
  })
})

describe("the author's story", () => {
  it('her Arabic words cannot change; pictures can; it publishes in Arabic only', async () => {
    const id = await rpc<string>(owner, `select owner_create_story() as r`)
    const s = await getStory(id)
    const key = s.pages[0].key
    const pic = await media(owner)
    await db.query(`update stories set credit = 'author' where id = $1`, [id])
    await save(id, draft(s, (d: any) => {
      d.groups = [{ group: '4-5', trial: false }]
      d.texts.ar = { ...d.texts.ar, title: 'عنوان', pages: { [key]: { text: 'نص الكاتبة', speech: '' } } }
      d.texts.en = { ...d.texts.en, title: 'Ignored' }
    }))
    await db.query(`update stories set text_locked = true where id = $1`, [id])
    const locked = await getStory(id)
    expect(locked.texts.en.title).toBe('')
    expect(await err(save(id, draft(locked, (d: any) => (d.texts.ar.pages[key].text = 'نص آخر'))))).toMatch(/text_locked/)
    expect(await err(save(id, draft(locked, (d: any) => (d.texts.ar.title = 'آخر'))))).toMatch(/text_locked/)
    await save(id, draft(locked, (d: any) => (d.pages[0].pictureId = pic)))
    expect((await getStory(id)).pages[0].pictureId).toBe(pic)
    expect(await err(rows(db, user(owner), `select owner_sign_off($1, 'en')`, [id]))).toMatch(/signoff_blocked/)
    await rows(db, user(owner), `select owner_sign_off($1, 'ar')`, [id])
    await rows(db, user(owner), `select owner_publish($1, null)`, [id])
    expect((await getStory(id)).publishLangs).toEqual(['ar'])
  })
})

describe('dashboard and email tables', () => {
  it('counts sign-ups, trials and passes, and lists purchases with the email only', async () => {
    const id = await completeStory('4-5', true)
    for (const l of LANGS) await rows(db, user(owner), `select owner_sign_off($1, $2::site_lang)`, [id, l])
    await rows(db, user(owner), `select owner_publish($1, null)`, [id])
    await rows(db, user(parent), `select start_trial('4-5')`)
    const d = await rpc<Record<string, any>>(owner, `select owner_dashboard() as r`)
    expect(d.signUps.total).toBe(1)
    expect(d.signUps.parents).toBe(1)
    expect(d.activeTrials['4-5']).toBe(1)
    expect(d.activePasses['4-5']).toBe(0)
    expect(d.recentPurchases).toEqual([])
  })

  it('email_audience is for the server only and carries the news consent', async () => {
    expect(await err(rows(db, user(owner), `select email_audience()`))).toMatch(/permission denied/)
    const a = (await rows<{ r: any[] }>(db, service, `select email_audience() as r`))[0]!.r
    expect(a).toHaveLength(1)
    expect(a[0]).toMatchObject({ email: 'parent@example.test', lang: 'en', marketing: true, trial: { ageGroup: '4-5', stories: ['Title en'] }, orders: [], refunds: [] })
    expect(a[0].confirmedAt).toBeTruthy()
  })

  it('a dedupe key is claimed once; unsubscribing by link is a consent row', async () => {
    const ins = `insert into email_log (account_id, to_email, template, lang, status, dedupe_key) values ($1, 'parent@example.test', 'trial_ends_tomorrow', 'en', 'queued', 'trial_ends_tomorrow:x')`
    await as(db, service, (tx) => tx.query(ins, [parent]))
    expect(await err(as(db, service, (tx) => tx.query(ins, [parent])))).toMatch(/duplicate key/)
    await as(db, service, (tx) => tx.query(`insert into consents (account_id, kind, granted, source) values ($1, 'marketing', false, 'email-link')`, [parent]))
    const a = (await rows<{ r: any[] }>(db, service, `select email_audience() as r`))[0]!.r
    expect(a[0].marketing).toBe(false)
  })
})
