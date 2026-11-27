import { readdirSync, readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it } from 'vitest'
import { checkStory, wordAt, wordsOf, type LangJson, type StoryJson } from '@/content/schema'
import { LocalApi } from '@/data/local'
import { CONTENT_STORIES } from '@/data/local/content'
import { memoryKv } from '@/data/local/server'
import { DataError } from '@/data/errors'
import { testProvider } from '@/data/payments/test-provider'
import { TERMS_VERSION } from '@/data/terms'
import { LANGS } from '@/i18n/config'

/** The story format (content/SCHEMA.md), the three sample stories, and the loader behind the access check. */
const ROOT = new URL('../content/stories/', import.meta.url).pathname
const SAMPLES = ['sample-a', 'sample-b', 'sample-c']
const read = <T>(path: string) => JSON.parse(readFileSync(path, 'utf8')) as T

describe('sample stories follow content/SCHEMA.md', () => {
  for (const id of SAMPLES) {
    it(`${id}: four languages, same pages, film lines and steps; a timing per page and language`, () => {
      const story = read<StoryJson>(`${ROOT}${id}/story.json`)
      const langs = Object.fromEntries(LANGS.map((l) => [l, read<LangJson>(`${ROOT}${id}/${l}.json`)]))
      expect(checkStory(story, langs)).toEqual([])
      expect(story.pages.length).toBeGreaterThanOrEqual(5)
      expect(story.activity?.steps).toHaveLength(3)
      for (const l of LANGS) {
        expect(langs[l]!.title).toMatch(/Sample|عيّنة|דוגמה|Eksempel/) // visibly marked as a sample
        for (const p of langs[l]!.pages) {
          const timing = read<{ duration: number; words: [number, number][] }>(`${ROOT}${id}/audio/${l}/${String(p.n).padStart(2, '0')}.json`)
          expect(timing.words).toHaveLength(wordsOf(p.text).length)
          expect(timing.words.at(-1)![1]).toBeLessThan(timing.duration)
        }
      }
      const files = readdirSync(`${ROOT}${id}/film`)
      expect(files).toEqual(expect.arrayContaining(['film.mp4', 'poster.webp', 'ar.vtt', 'he.vtt', 'en.vtt', 'da.vtt']))
    })
  }

  it('every story folder: each language file agrees with story.json (pages, film lines, activity steps and materials)', () => {
    const ids = readdirSync(ROOT, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
    const bad: string[] = []
    for (const id of ids) {
      let story: StoryJson
      try { story = read<StoryJson>(`${ROOT}${id}/story.json`) } catch { continue }
      const langs = Object.fromEntries(LANGS.flatMap((l) => {
        try { return [[l, read<LangJson>(`${ROOT}${id}/${l}.json`)]] } catch { return [] }
      }))
      for (const p of checkStory(story, langs)) bad.push(`${id}: ${p}`)
    }
    expect(bad).toEqual([])
  })

  it('checkStory names a missing page and a wrong word count', () => {
    const story = read<StoryJson>(`${ROOT}sample-a/story.json`)
    const en = read<LangJson>(`${ROOT}sample-a/en.json`)
    const broken = { ...en, pages: en.pages.slice(1).map((p, i) => (i === 0 ? { ...p, speech: 'one two' } : p)) }
    const problems = checkStory(story, { en: broken })
    expect(problems.some((p) => p.includes('differ'))).toBe(true)
    expect(problems.some((p) => p.includes('word counts'))).toBe(true)
  })

  it('wordAt finds the word being spoken', () => {
    const t = { duration: 3, words: [[0.4, 0.8], [0.9, 1.4], [1.5, 2.2]] as [number, number][] }
    expect([0, 0.4, 0.85, 1.0, 1.6, 2.9].map((s) => wordAt(t, s))).toEqual([-1, 0, 0, 1, 2, 2])
  })
})

describe('the loader serves content only through the access check', () => {
  let api: LocalApi
  beforeEach(async () => {
    const kv = memoryKv()
    api = new LocalApi(kv, 'http://test/', 0)
    await api.signUp({ email: 'p@example.test', password: 'correct horse', role: 'parent', language: 'en', termsVersion: TERMS_VERSION, adult: true, marketing: false })
    await api.completeLink('signup', new URL(api.server.outbox().at(-1)!.link!).searchParams)
  })

  it('finds the three samples, with their features, and lists them as catalogue facts only', async () => {
    expect(CONTENT_STORIES.filter((c) => c.isSample).map((c) => c.id)).toEqual(SAMPLES)
    const list = await api.listStories('he', '2-3')
    const a = list.find((s) => s.id === 'sample-a')!
    expect(a).toMatchObject({ title: 'דוגמה: הכדור האדום', isSample: true, features: { listen: true, film: true, activity: true } })
    expect(a.coverUrl).toMatch(/pages\/01\.svg|^data:image\/svg/) // small files are inlined by the bundler
    expect(JSON.stringify(a)).not.toContain('מתגלגל') // no page text in the catalogue
  })

  it('refuses content without access, and returns pages, read-along, film and activity with it', async () => {
    const refused = await api.getStoryContent('sample-b', 'ar').then(() => null, (e: DataError) => e.code)
    expect(refused).toBe('locked')
    await api.addLearner({ name: 'Noor', ageGroup: '4-5' })
    await api.startTrial('4-5')
    // The samples are never trial stories (the trial is three real stories: src/data/local/trial-picks.ts).
    expect(await api.getStoryContent('sample-b', 'ar').then(() => null, (e: DataError) => e.code)).toBe('locked')
    const order = await api.createOrder({ ageGroup: '4-5', months: 1, provider: 'test', termsVersion: TERMS_VERSION, expectedAgorot: null })
    await testProvider.pay(api, order, 'succeeded')
    for (let i = 0; i < 20 && (await api.getOrder(order.id)).status === 'pending'; i++) await new Promise((r) => setTimeout(r, 10))
    const c = await api.getStoryContent('sample-b', 'ar')
    expect(c).toMatchObject({ lang: 'ar', title: 'عيّنة: البذرة الصغيرة', isSample: true })
    expect(c.pages).toHaveLength(6)
    expect(c.pages[1]!.zone).toEqual({ side: 'start', v: 'top', size: 'm' })
    expect(c.pages[0]!.readAlong!.audioUrl).toMatch(/audio\/ar\/01\.mp3/)
    expect(c.pages[0]!.readAlong!.timing.words).toHaveLength(wordsOf(c.pages[0]!.display).length)
    expect(c.film).toMatchObject({ captionsLang: 'ar' })
    expect(c.film!.videoUrl).toMatch(/film\.mp4/)
    expect(c.film!.captionsUrl).toMatch(/ar\.vtt/)
    expect(c.activity!.steps.map((s) => !!s.loopUrl)).toEqual([false, false, true])
    expect(c.activity!.materials.map((m) => m.label)).toEqual(['كوب شفاف', 'قطن', 'حبة فاصولياء جافة', 'ماء'])
  })

  it('saves progress per profile, never for another account', async () => {
    const noor = await api.addLearner({ name: 'Noor', ageGroup: '4-5' })
    const sami = await api.addLearner({ name: 'Sami', ageGroup: '2-3' })
    await api.saveProgress(noor.id, 'sample-b', { lastPage: 3 })
    await api.saveProgress(noor.id, 'sample-b', { filmWatched: true })
    expect(await api.listProgress(noor.id)).toEqual([expect.objectContaining({ storyId: 'sample-b', lastPage: 3, filmWatched: true, activityDone: false })])
    expect(await api.listProgress(sami.id)).toEqual([])
    await api.signOut()
    expect(await api.listProgress(noor.id).then(() => 'ok', (e: DataError) => e.code)).toBe('not_signed_in')
  })
})
