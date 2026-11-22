import { beforeEach, describe, expect, it } from 'vitest'
import { CLOCK_KEY, DB_KEY, memoryKv, type KeyValue } from '@/data/local/server'
import { OwnerError } from '@/features/owner/data/api'
import { memoryBlobs } from '@/features/owner/data/blobs'
import { LocalOwnerServer } from '@/features/owner/data/local'
import { toStoryContent } from '@/features/owner/data/preview'
import { checkUpload, fingerprint, publishProblems, signoffValid, UPLOAD_LIMITS } from '@/features/owner/data/rules'
import type { OwnerStory, StoryDraft } from '@/features/owner/data/types'

/** The owner's data operations on the local backend: the same rules the database enforces (tests/db/owner-emails). */
const LANGS = ['ar', 'he', 'en', 'da'] as const
const DAY = 86_400_000
let kv: KeyValue
let srv: LocalOwnerServer
const OWNER = 'owner-1'
const PARENT = 'parent-1'

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0])
const MP4 = new Uint8Array([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6d, 0x70, 0x34, 0x32])
const VTT = new TextEncoder().encode('WEBVTT\n\n00:00.000 --> 00:01.000\nHi\n')
const file = (bytes: Uint8Array, name: string, type = '') => new File([bytes as BlobPart], name, { type })
const own = { source: 'upload' as const, licence: 'own work', credit: null }

function draftOf(s: OwnerStory): StoryDraft {
  return JSON.parse(JSON.stringify({ groups: s.groups, pages: s.pages, texts: s.texts, films: s.films, activity: s.activity }))
}

async function complete(group: '2-3' | '4-5' | '6-8' = '4-5', trial = false): Promise<OwnerStory> {
  const s = srv.createStory(OWNER)
  const pic = await srv.upload(OWNER, file(PNG, 'page.png', 'image/png'), { purpose: 'page', ...own })
  const d = draftOf(s)
  d.groups = [{ group, trial }]
  d.pages[0]!.pictureId = pic.id
  for (const l of LANGS) {
    d.texts[l].title = `Title ${l}`
    d.texts[l].pages[d.pages[0]!.key] = { text: `Words ${l}`, speech: '' }
  }
  return srv.saveStory(OWNER, s.id, d)
}

const code = (fn: () => unknown) => {
  try {
    fn()
    return null
  } catch (e) {
    return (e as OwnerError).code
  }
}

beforeEach(() => {
  kv = memoryKv()
  const t = new Date().toISOString()
  kv.set(DB_KEY, JSON.stringify({
    version: 1,
    users: [{ id: OWNER, email: 'owner@x.test', createdAt: t }, { id: PARENT, email: 'p@x.test', createdAt: t }, { id: 'teacher-1', email: 't@x.test', createdAt: new Date(Date.now() - 10 * DAY).toISOString() }],
    profiles: { [OWNER]: { role: 'owner' }, [PARENT]: { role: 'parent' }, 'teacher-1': { role: 'teacher' } },
    trials: [{ id: 'tr', accountId: PARENT, ageGroup: '4-5', startedAt: new Date(Date.now() - DAY).toISOString(), endsAt: new Date(Date.now() + DAY).toISOString(), storyIds: [] }],
    passes: [
      { id: 'p1', accountId: PARENT, orderId: 'o1', ageGroup: '6-8', months: 1, startsAt: new Date(Date.now() - DAY).toISOString(), endsAt: new Date(Date.now() + 20 * DAY).toISOString(), status: 'active' },
      { id: 'p2', accountId: PARENT, orderId: 'o2', ageGroup: '6-8', months: 1, startsAt: new Date(Date.now() - 40 * DAY).toISOString(), endsAt: new Date(Date.now() - 10 * DAY).toISOString(), status: 'active' },
    ],
    orders: [
      { id: 'o1', accountId: PARENT, ageGroup: '6-8', months: 1, amountAgorot: 0, priceWasPlaceholder: true, provider: 'test', status: 'paid', createdAt: t, paidAt: t },
      { id: 'o3', accountId: PARENT, ageGroup: '2-3', months: 3, amountAgorot: 0, priceWasPlaceholder: true, provider: 'test', status: 'pending', createdAt: t, paidAt: null },
    ],
    learners: [{ id: 'c', accountId: PARENT, kind: 'child', name: 'Noor', ageGroup: '4-5' }],
  }))
  srv = new LocalOwnerServer(kv, memoryBlobs())
})

describe('who may use the owner store', () => {
  it('refuses a parent and a signed-out visitor', () => {
    expect(code(() => srv.listStories(PARENT))).toBe('not_owner')
    expect(code(() => srv.createStory(null))).toBe('not_signed_in')
    expect(code(() => srv.dashboard(PARENT))).toBe('not_owner')
  })
})

describe('stories', () => {
  it('creates a draft with one page and empty texts in four languages', () => {
    const s = srv.createStory(OWNER)
    expect(s.status).toBe('draft')
    expect(s.pages).toHaveLength(1)
    expect(Object.keys(s.texts).sort()).toEqual(['ar', 'da', 'en', 'he'])
    expect(srv.listStories(OWNER)[0]!.missing.en).toBe(4) // title, page 1 text, page 1 picture, age group
  })

  it('saves, drops captions of removed pages, and logs each real change once', async () => {
    const s = await complete()
    const d = draftOf(s)
    const gone = d.pages[0]!.key
    d.pages.push({ key: 'p2', pictureId: null, zone: { side: 'end', v: 'top', size: 'l' } })
    d.texts.en.pages.p2 = { text: 'Second', speech: '' }
    const saved = srv.saveStory(OWNER, s.id, d)
    expect(saved.pages[1]!.zone).toEqual({ side: 'end', v: 'top', size: 'l' })
    const before = srv.listAudit(OWNER, s.id).length
    srv.saveStory(OWNER, s.id, draftOf(saved)) // no change: no audit row
    expect(srv.listAudit(OWNER, s.id).length).toBe(before)
    const d2 = draftOf(saved)
    d2.pages = d2.pages.filter((p) => p.key !== gone)
    const after = srv.saveStory(OWNER, s.id, d2)
    expect(after.texts.en.pages[gone]).toBeUndefined()
    expect(srv.listAudit(OWNER, s.id)[0]).toMatchObject({ actor: OWNER, action: 'update' })
  })

  it('keeps at most three trial stories per age group', async () => {
    for (let i = 0; i < 3; i++) await complete('2-3', true)
    const s = srv.createStory(OWNER)
    const d = draftOf(s)
    d.groups = [{ group: '2-3', trial: true }]
    expect(code(() => srv.saveStory(OWNER, s.id, d))).toBe('trial_limit')
    d.groups = [{ group: '2-3', trial: false }, { group: '4-5', trial: true }]
    expect(srv.saveStory(OWNER, s.id, d).groups).toEqual([{ group: '2-3', trial: false }, { group: '4-5', trial: true }])
  })
})

describe('publish rules', () => {
  it('blocks until every language is signed off, then publishes', async () => {
    const s = await complete()
    const problems = publishProblems(s)
    expect(problems.filter((p) => p.kind === 'notSignedOff').map((p) => p.lang)).toEqual(['ar', 'he', 'en', 'da'])
    expect(code(() => srv.publish(OWNER, s.id, null))).toBe('publish_blocked')
    for (const l of LANGS) srv.signOff(OWNER, s.id, l)
    const p = srv.publish(OWNER, s.id, null)
    expect(p.status).toBe('published')
    expect(p.publishLangs).toBeNull()
    expect(srv.unpublish(OWNER, s.id).status).toBe('draft')
    expect(srv.listAudit(OWNER, s.id).map((a) => a.action)).toContain('publish')
  })

  it('a changed language loses its sign-off; "these languages only" publishes the rest', async () => {
    const s = await complete()
    for (const l of LANGS) srv.signOff(OWNER, s.id, l)
    const d = draftOf(srv.getStory(OWNER, s.id))
    d.texts.da.title = 'Ny titel'
    const changed = srv.saveStory(OWNER, s.id, d)
    expect(signoffValid(changed, 'da')).toBe(false)
    expect(signoffValid(changed, 'en')).toBe(true)
    expect(code(() => srv.publish(OWNER, s.id, null))).toBe('publish_blocked')
    expect(srv.publish(OWNER, s.id, ['en', 'ar', 'he']).publishLangs).toEqual(['ar', 'he', 'en'])
  })

  it('refuses a sign-off for an incomplete language and names pictures and groups as blocking', () => {
    const s = srv.createStory(OWNER)
    expect(code(() => srv.signOff(OWNER, s.id, 'en'))).toBe('signoff_blocked')
    const kinds = publishProblems(s, ['en']).map((p) => p.kind)
    expect(kinds).toEqual(expect.arrayContaining(['noGroup', 'picture', 'title', 'pageText', 'notSignedOff']))
  })

  it('checks that the voice form has the same words as the text', async () => {
    const s = await complete()
    const d = draftOf(s)
    d.texts.he.pages[d.pages[0]!.key] = { text: 'שלום ילדים', speech: 'שָׁלוֹם' }
    const saved = srv.saveStory(OWNER, s.id, d)
    expect(publishProblems(saved).some((p) => p.kind === 'speechWords' && p.lang === 'he')).toBe(true)
  })

  it('the fingerprint covers the film and captions too', async () => {
    const s = await complete()
    const before = fingerprint(s, 'en')
    const film = await srv.upload(OWNER, file(MP4, 'film.mp4'), { purpose: 'film', ...own })
    const d = draftOf(s)
    d.films.en.videoId = film.id
    expect(fingerprint(srv.saveStory(OWNER, s.id, d), 'en')).not.toBe(before)
  })
})

describe("the author's story", () => {
  it('her Arabic text cannot change; she is published in Arabic only', async () => {
    const base = await complete()
    const author: OwnerStory = { ...base, id: 'author-1', credit: 'author', textLocked: true, signoffs: {} }
    srv.importStory(author)
    const d = draftOf(author)
    d.texts.ar.pages[d.pages[0]!.key]!.text = 'changed'
    expect(code(() => srv.saveStory(OWNER, author.id, d))).toBe('text_locked')
    const d2 = draftOf(author)
    d2.pages.push({ key: 'new', pictureId: null, zone: author.pages[0]!.zone })
    expect(code(() => srv.saveStory(OWNER, author.id, d2))).toBe('text_locked')
    const d3 = draftOf(author)
    d3.pages[0]!.zone = { side: 'end', v: 'top', size: 's' }
    expect(srv.saveStory(OWNER, author.id, d3).pages[0]!.zone.side).toBe('end') // pictures and layout may change
    expect(srv.getStory(OWNER, author.id).texts.en.title).toBe('') // no other language for her story
    expect(code(() => srv.signOff(OWNER, author.id, 'en'))).toBe('signoff_blocked')
    srv.signOff(OWNER, author.id, 'ar')
    expect(srv.publish(OWNER, author.id, null).publishLangs).toEqual(['ar'])
  })
})

describe('uploads', () => {
  it('checks type, real content, size and licence, and records source and licence', async () => {
    const bad = async (f: File, purpose: 'page' | 'film' | 'captions', meta = own) => {
      try {
        await srv.upload(OWNER, f, { purpose, ...meta })
        return null
      } catch (e) {
        return (e as OwnerError).refusal
      }
    }
    expect(await bad(file(PNG, 'page.gif'), 'page')).toBe('type')
    expect(await bad(file(MP4, 'fake.png'), 'page')).toBe('content')
    expect(await bad(file(new Uint8Array(0), 'empty.png'), 'page')).toBe('empty')
    expect(await bad(file(PNG, 'page.png'), 'page', { source: 'third_party', licence: 'CC BY 4.0', credit: null } as never)).toBe('licence')
    expect(await bad(file(VTT, 'en.vtt'), 'film')).toBe('type')
    expect(checkUpload('page', { name: 'big.png', size: UPLOAD_LIMITS.page.maxBytes + 1, head: PNG }, own)).toEqual({ ok: false, reason: 'size' })
    const cap = await srv.upload(OWNER, file(VTT, 'en.vtt'), { purpose: 'captions', ...own })
    expect(cap).toMatchObject({ kind: 'captions', mimeType: 'text/vtt', source: 'upload', licence: 'own work' })
    expect(await (await srv.mediaBlob(OWNER, cap.id)).text()).toContain('WEBVTT')
    await expect(srv.upload(PARENT, file(PNG, 'p.png'), { purpose: 'page', ...own })).rejects.toMatchObject({ code: 'not_owner' })
  })
})

describe('dashboard', () => {
  it('counts sign-ups, active trials and passes, and lists paid orders without children', () => {
    const d = srv.dashboard(OWNER)
    expect(d.signUps).toEqual({ total: 2, last7Days: 1, parents: 1, teachers: 1 })
    expect(d.activeTrials).toEqual({ '2-3': 0, '4-5': 1, '6-8': 0 })
    expect(d.activePasses).toEqual({ '2-3': 0, '4-5': 0, '6-8': 1 })
    expect(d.recentPurchases.map((o) => o.orderId)).toEqual(['o1'])
    expect(JSON.stringify(d)).not.toContain('Noor')
    kv.set(CLOCK_KEY, String(2 * DAY))
    expect(srv.dashboard(OWNER).activeTrials['4-5']).toBe(0)
  })
})

describe('preview', () => {
  it('gives the preview the same StoryContent shape a family receives', async () => {
    const s = await complete()
    const c = toStoryContent(s, 'he', (id) => (id ? `blob:${id}` : null))
    expect(c.title).toBe('Title he')
    expect(c.pages[0]).toMatchObject({ pageNo: 1, display: 'Words he', speech: 'Words he', zone: s.pages[0]!.zone })
    expect(c.pages[0]!.pictureUrl).toMatch(/^blob:/)
    expect(c.film).toBeNull()
    expect(c.activity).toBeNull()
  })
})
