import { createHash } from 'node:crypto'
import { beforeEach, describe, expect, it } from 'vitest'
import { LocalApi } from '@/data/local'
import { DB_KEY, memoryKv, type KeyValue, type LocalDb } from '@/data/local/server'
import { DataError } from '@/data/errors'
import { TERMS_VERSION } from '@/data/terms'
import { testProvider } from '@/data/payments/test-provider'

/** Stage 4, part C in the local (test-mode) data layer. */
let kv: KeyValue
let api: LocalApi
const codeOf = async (p: Promise<unknown>) => p.then(() => 'ok', (e) => (e instanceof DataError ? e.code : String(e)))
const link = (kind: 'confirm' | 'reset' | 'email_change') => new URL(api.server.outbox().filter((m) => m.template === kind).at(-1)!.link!).searchParams
const raw = () => JSON.parse(kv.get(DB_KEY)!) as LocalDb

async function newConfirmedUser(email = 'parent@example.test') {
  await api.signUp({ email, password: 'correct horse', role: 'parent', language: 'en', termsVersion: TERMS_VERSION, adult: true, marketing: false })
  await api.completeLink('signup', link('confirm'))
}

beforeEach(() => {
  kv = memoryKv()
  api = new LocalApi(kv, 'http://test/', 0)
})

describe('deleting an account leaves no email address in the email log', () => {
  it('earlier emails and the account-deleted email keep only the salted hash of the address', async () => {
    await newConfirmedUser('Leaving@Example.test')
    await api.addLearner({ name: 'Noor', ageGroup: '4-5' })
    const order = await api.createOrder({ ageGroup: '4-5', months: 1, provider: 'test', termsVersion: TERMS_VERSION, expectedAgorot: null })
    await testProvider.pay(api, order, 'succeeded')
    for (let i = 0; i < 20 && (await api.getOrder(order.id)).status === 'pending'; i++) await new Promise((r) => setTimeout(r, 10))
    expect(api.server.outbox().some((m) => m.to === 'leaving@example.test')).toBe(true)

    await api.deleteAccount()
    const db = raw()
    const hash = createHash('sha256').update(`${db.ledgerSalt}:leaving@example.test`).digest('hex')
    expect(kv.get(DB_KEY)).not.toMatch(/leaving@example\.test/i) // nowhere in the stored data
    const mine = db.outbox.filter((m) => m.toHash === hash)
    expect(mine.map((m) => m.template)).toEqual(expect.arrayContaining(['confirm', 'purchase', 'deleted']))
    for (const m of mine) expect(m).toMatchObject({ to: null, link: null })
    // The record of each email stays: which one, in which language, when.
    expect(mine.find((m) => m.template === 'deleted')).toMatchObject({ lang: 'en' })
  })

  it("another account's address is kept", async () => {
    await newConfirmedUser('stays@example.test')
    await api.signOut()
    await newConfirmedUser('goes@example.test')
    await api.deleteAccount()
    expect(api.server.outbox().filter((m) => m.to === 'stays@example.test')).toHaveLength(1)
    expect(api.server.outbox().some((m) => m.to === 'goes@example.test')).toBe(false)
  })
})

describe('all 45 stories are in the app', () => {
  const REAL = [...'abc'].flatMap((g) => Array.from({ length: 15 }, (_, i) => `${g}${String(i + 1).padStart(2, '0')}`))
  const GROUP = { a: '2-3', b: '4-5', c: '6-8' } as const

  it('the loader finds every story folder a01..c15, each in its own age group', async () => {
    const { CONTENT_STORIES } = await import('@/data/local/content')
    const real = CONTENT_STORIES.filter((c) => !c.isSample)
    expect(real.map((c) => c.id)).toEqual(REAL)
    for (const c of real) expect(c.story.ageGroups).toEqual([GROUP[c.id[0] as 'a' | 'b' | 'c']])
  })

  it('every story opens in all four languages, every page with its own text, in that language', async () => {
    const { CONTENT_STORIES, loadContent } = await import('@/data/local/content')
    for (const c of CONTENT_STORIES.filter((x) => !x.isSample)) {
      for (const lang of ['ar', 'he', 'en', 'da'] as const) {
        const s = await loadContent(c, lang)
        const where = `${c.id} ${lang}`
        expect(s.lang, where).toBe(lang)
        expect(s.title.trim(), where).not.toBe('')
        expect(s.pages.map((p) => p.pageNo), where).toEqual(c.story.pages.map((p) => p.n))
        for (const p of s.pages) expect(p.display.trim().length, `${where} p${p.pageNo}`).toBeGreaterThan(0)
        // No art, recording or film file exists yet: the screens show marked placeholders and "coming soon".
        expect(s.pages.every((p) => p.pictureUrl === null && p.readAlong === null), where).toBe(true)
        expect(s.film, where).toMatchObject({ videoUrl: null })
        expect(s.activity, where).not.toBeNull()
        expect(s.activity!.steps.length, where).toBeGreaterThan(0)
        for (const st of s.activity!.steps) expect(st.caption.trim(), `${where} step ${st.n}`).not.toBe('')
        expect(s.activity!.materials.every((m) => m.label.trim()), where).toBe(true)
        expect(s.credit).toBe('storytime')
      }
    }
  }, 60_000)

  it('the trial of each age group is its three picked stories, listed first; samples and seeds are never trial stories', async () => {
    await newConfirmedUser()
    for (const [group, ids] of [['2-3', ['a04', 'a01', 'a07']], ['4-5', ['b02', 'b01', 'b09']], ['6-8', ['c01', 'c03', 'c10']]] as const) {
      const list = await api.listStories('en', group)
      expect(list.filter((s) => s.trialIn.includes(group)).map((s) => s.id)).toEqual(ids)
      expect(list.slice(0, 3).map((s) => s.id)).toEqual(ids)
      expect(list.filter((s) => !s.isSample)).toHaveLength(15)
      expect(list.filter((s) => s.isSample).every((s) => !s.trialIn.length)).toBe(true)
      // Catalogue facts only: no page text, a title in the asked language, features honest.
      const b = list.find((s) => s.id === ids[0])!
      expect(b.features).toEqual({ listen: false, film: false, activity: true, filmSoon: true })
      expect(b.coverUrl).toBeNull()
    }
  })

  it('a trial opens exactly its three stories; the other twelve of the group stay locked', async () => {
    await newConfirmedUser()
    await api.addLearner({ name: 'Noor', ageGroup: '4-5' })
    const t = await api.startTrial('4-5')
    expect(t.storyIds).toEqual(['b02', 'b01', 'b09'])
    expect((await api.getStoryContent('b02', 'ar')).pages).toHaveLength(14)
    expect(await codeOf(api.getStoryContent('b03', 'en'))).toBe('locked')
    expect(await codeOf(api.getStoryContent('a04', 'en'))).toBe('locked')
  })
})

describe('things kept with the account or the profile (they follow the account to another device)', () => {
  it('reading and film settings are stored with the account, only the known ones', async () => {
    await newConfirmedUser()
    expect((await api.getAccount()).prefs).toEqual({})
    await api.updateAccount({ prefs: { autoFlip: false, textScale: 2 } })
    await api.updateAccount({ prefs: { captions: false, ...({ junk: 1 } as object) } })
    // A second device: a new client on the same stored data, signed in again.
    const other = new LocalApi(kv, 'http://test/', 0)
    await other.signOut()
    await other.signIn('parent@example.test', 'correct horse')
    expect((await other.getAccount()).prefs).toEqual({ autoFlip: false, textScale: 2, captions: false })
  })

  it('favourites belong to one profile, survive sign-out, and go with the profile', async () => {
    await newConfirmedUser()
    const noor = await api.addLearner({ name: 'Noor', ageGroup: '4-5' })
    const sami = await api.addLearner({ name: 'Sami', ageGroup: '2-3' })
    await api.setFavourite(noor.id, 'b02', true)
    await api.setFavourite(noor.id, 'b05', true)
    await api.setFavourite(noor.id, 'b02', true) // twice is still once
    expect((await api.listFavourites(noor.id)).sort()).toEqual(['b02', 'b05'])
    expect(await api.listFavourites(sami.id)).toEqual([])
    await api.setFavourite(noor.id, 'b05', false)
    expect(await api.listFavourites(noor.id)).toEqual(['b02'])
    expect(await codeOf(api.setFavourite(noor.id, 'no-such-story', true))).toBe('not_found')
    await api.signOut()
    expect(await codeOf(api.listFavourites(noor.id))).toBe('not_signed_in')
    await api.signIn('parent@example.test', 'correct horse')
    expect(await api.listFavourites(noor.id)).toEqual(['b02'])
    await api.removeLearner(noor.id)
    expect(raw().favourites).toEqual([])
  })

  it("another account cannot read or change a profile's favourites", async () => {
    await newConfirmedUser('a@example.test')
    const noor = await api.addLearner({ name: 'Noor', ageGroup: '4-5' })
    await api.signOut()
    await newConfirmedUser('b@example.test')
    expect(await codeOf(api.listFavourites(noor.id))).toBe('not_found')
    expect(await codeOf(api.setFavourite(noor.id, 'b02', true))).toBe('not_found')
  })

  it('the film position is saved per profile and story', async () => {
    await newConfirmedUser()
    const noor = await api.addLearner({ name: 'Noor', ageGroup: '4-5' })
    await api.saveProgress(noor.id, 'b02', { filmPositionS: 83.4 })
    expect((await api.listProgress(noor.id))[0]).toMatchObject({ storyId: 'b02', filmPositionS: 83, lastPage: null })
    await api.saveProgress(noor.id, 'b02', { lastPage: 4 })
    expect((await api.listProgress(noor.id))[0]).toMatchObject({ filmPositionS: 83, lastPage: 4 })
    expect(await codeOf(api.saveProgress(noor.id, 'b02', { filmPositionS: -5 }))).toBe('unknown')
  })

  it('counts the trial stories opened by any profile of the account ("1 of 3 opened")', async () => {
    await newConfirmedUser()
    const noor = await api.addLearner({ name: 'Noor', ageGroup: '4-5' })
    const sami = await api.addLearner({ name: 'Sami', ageGroup: '4-5' })
    await api.startTrial('4-5')
    expect((await api.getAccess()).trialOpened).toEqual([])
    await api.saveProgress(noor.id, 'b02', { lastPage: 1 })
    expect((await api.getAccess()).trialOpened).toEqual(['b02'])
    await api.saveProgress(sami.id, 'b09', { activityDone: true })
    await api.saveProgress(sami.id, 'b02', { lastPage: 3 })
    expect((await api.getAccess()).trialOpened).toEqual(['b02', 'b09'])
  })
})

describe('changing the sign-in email address (test mode)', () => {
  it('sends a link to the new address; the address changes only when it is opened; the old address is told', async () => {
    await newConfirmedUser('old@example.test')
    await api.requestEmailChange('New@Example.test', 'he')
    expect((await api.getAccount()).email).toBe('old@example.test') // not yet
    const mail = api.server.outbox().filter((m) => m.template === 'email_change').at(-1)!
    expect(mail).toMatchObject({ to: 'new@example.test', lang: 'he' })
    expect(mail.link).toMatch(/^http:\/\/test\/he\/auth\/confirm-email\/\?token=/)
    const s = await api.completeLink('email_change', link('email_change'))
    expect(s.email).toBe('new@example.test')
    expect((await api.getAccount()).email).toBe('new@example.test')
    expect(api.server.outbox().at(-1)).toMatchObject({ to: 'old@example.test', template: 'email_changed' })
    // The link works once; signing in uses the new address.
    expect(await codeOf(api.completeLink('email_change', link('email_change')))).toBe('link_expired')
    await api.signOut()
    expect(await codeOf(api.signIn('old@example.test', 'correct horse'))).toBe('wrong_credentials')
    expect(await codeOf(api.signIn('new@example.test', 'correct horse'))).toBe('ok')
  })

  it('refuses a bad address, an address with an account, and a second request within a minute', async () => {
    await newConfirmedUser('taken@example.test')
    await api.signOut()
    await newConfirmedUser('me@example.test')
    expect(await codeOf(api.requestEmailChange('not-an-email', 'en'))).toBe('invalid_email')
    expect(await codeOf(api.requestEmailChange('taken@example.test', 'en'))).toBe('email_taken')
    expect(await codeOf(api.requestEmailChange('fresh@example.test', 'en'))).toBe('ok')
    expect(await codeOf(api.requestEmailChange('fresh2@example.test', 'en'))).toBe('rate_limited')
  })

  it('an expired link does nothing', async () => {
    await newConfirmedUser('old@example.test')
    await api.requestEmailChange('new@example.test', 'en')
    kv.set('storytime.dev.clockOffsetMs', String(25 * 3_600_000))
    expect(await codeOf(api.completeLink('email_change', link('email_change')))).toBe('link_expired')
  })
})

describe('the contact form (site review, second pass)', () => {
  it('records the message signed out, refuses a bad address or an empty message, and limits one address to 3 an hour', async () => {
    expect(await codeOf(api.sendContactMessage({ email: 'bad', message: 'Hi', lang: 'ar' }))).toBe('invalid_email')
    expect(await codeOf(api.sendContactMessage({ email: 'a@example.test', message: '   ', lang: 'ar' }))).toBe('unknown')
    expect(await codeOf(api.sendContactMessage({ name: ' Dana ', email: 'a@example.test', message: ' A question. ', lang: 'he' }))).toBe('ok')
    expect(raw().contactMessages).toEqual([expect.objectContaining({ name: 'Dana', email: 'a@example.test', lang: 'he', message: 'A question.' })])
    for (let i = 0; i < 2; i++) await api.sendContactMessage({ email: 'A@example.test', message: 'Again', lang: 'en' })
    expect(await codeOf(api.sendContactMessage({ email: 'a@example.test', message: 'Once more', lang: 'en' }))).toBe('rate_limited')
    expect(await codeOf(api.sendContactMessage({ email: 'other@example.test', message: 'x'.repeat(2001), lang: 'en' }))).toBe('unknown')
  })
})
