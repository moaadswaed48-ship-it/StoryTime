import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it } from 'vitest'
import type { LangJson, StoryJson } from '@/content/schema'
import { LocalApi } from '@/data/local'
import { memoryKv } from '@/data/local/server'
import { TERMS_VERSION } from '@/data/terms'
import { cleanPrefs, type AgeGroup } from '@/data/types'
import { canFullscreen, classroomOn, isClassroomPage, isFullscreen, moveCard } from '@/features/classroom/classroom'
import { LANGS, isRtl } from '@/i18n/config'
import { CLASSROOM_BOOST, layoutZone, MIN_FONT, scriptOf, type MeasureAt } from '@/reader/zone'

/** Teachers: classroom mode (src/features/classroom/, src/reader/zone.ts, profiles.prefs.classroom). */

describe('who gets classroom mode', () => {
  it('only a teacher account that switched it on', () => {
    expect(classroomOn('teacher', true)).toBe(true)
    expect(classroomOn('teacher', false)).toBe(false)
    expect(classroomOn('teacher', undefined)).toBe(false)
    expect(classroomOn('parent', true)).toBe(false)
    expect(classroomOn('owner', true)).toBe(false)
    expect(classroomOn(null, true)).toBe(false)
  })

  it('takes the story pages only, never settings, plans or checkout', () => {
    for (const p of ['/en/app/library/', '/ar/app/story/b02/', '/ar/app/story/b02/read', '/en/app/story/c01/do/', '/en/app/story/x/watch', '/he/app/collections/films/', '/da/app/collections'])
      expect(isClassroomPage(p, p.slice(1, 3) as 'en'), p).toBe(true)
    for (const p of ['/en/app/settings/', '/en/app/plans/', '/en/app/checkout/', '/en/app/welcome/', '/en/app/owner/', '/en/', '/en/app/libraryx/'])
      expect(isClassroomPage(p, 'en'), p).toBe(false)
    expect(isClassroomPage('/en/app/library/', 'ar')).toBe(false)
    expect(isClassroomPage('/StoryTime/next/en/app/library/', 'en', '/StoryTime/next/')).toBe(true)
  })
})

describe('the big-screen activity cards', () => {
  it('card 0 is "Get ready", then one per step; moves stay inside the range', () => {
    expect(moveCard(0, 1, 5)).toBe(1)
    expect(moveCard(5, 1, 5)).toBe(5)
    expect(moveCard(0, -1, 5)).toBe(0)
    expect(moveCard(3, -1, 5)).toBe(2)
    expect(moveCard(0, 1, 0)).toBe(0)
  })
})

describe('full screen', () => {
  it('is offered only where the browser allows it (an iPhone does not)', () => {
    expect(canFullscreen({ fullscreenEnabled: true })).toBe(true)
    expect(canFullscreen({ webkitFullscreenEnabled: true })).toBe(true)
    expect(canFullscreen({ fullscreenEnabled: false })).toBe(false)
    expect(canFullscreen({})).toBe(false)
    expect(canFullscreen(undefined)).toBe(false)
    expect(isFullscreen({ fullscreenElement: {} as Element })).toBe(true)
    expect(isFullscreen({ fullscreenElement: null })).toBe(false)
  })
})

describe('the classroom setting on the account', () => {
  it('keeps a true or false classroom value and drops anything else', () => {
    expect(cleanPrefs({ classroom: true, textScale: 1 })).toEqual({ classroom: true, textScale: 1 })
    expect(cleanPrefs({ classroom: false })).toEqual({ classroom: false })
    expect(cleanPrefs({ classroom: 'yes' })).toEqual({})
    expect(cleanPrefs({ classroom: 1 })).toEqual({})
  })

  let api: LocalApi
  beforeEach(() => {
    api = new LocalApi(memoryKv(), 'http://test/', 0)
  })
  it('follows a teacher account to another device (local test-mode backend)', async () => {
    await api.signUp({ email: 'teacher@example.test', password: 'correct horse', role: 'teacher', language: 'ar', termsVersion: TERMS_VERSION, adult: true, marketing: false })
    const link = new URL(api.server.outbox().filter((m) => m.template === 'confirm').at(-1)!.link!).searchParams
    await api.completeLink('signup', link)
    await api.updateAccount({ prefs: { classroom: true } })
    await api.updateAccount({ prefs: { textScale: 1 } })
    const account = await api.getAccount()
    expect(account.role).toBe('teacher')
    expect(account.prefs).toEqual({ classroom: true, textScale: 1 })
  })
})

// ---- the words on a big screen ---------------------------------------------------------------------------------
const WIDTH = { arabic: 0.52, hebrew: 0.56, latin: 0.54 }
const measureFor = (lang: string): MeasureAt => (s, px) => s.replace(/\p{M}/gu, '').length * px * WIDTH[scriptOf(lang)]
const ROOT = new URL('../content/stories/', import.meta.url).pathname
const read = <T>(p: string) => JSON.parse(readFileSync(p, 'utf8')) as T
/** Page sizes: a teacher's phone, a tablet, a laptop spread page, and a projector or big screen spread page. */
const SIZES = { phone: [390, 700], 'phone-small': [320, 560], tablet: [576, 860], laptop: [560, 700], projector: [680, 850] } as const

describe('words in classroom mode', () => {
  const base = { rtl: false, scale: 0, script: 'latin' as const, measure: measureFor('en'), zone: { side: 'full' as const, v: 'bottom' as const, size: 'm' as const } }
  it('are much larger than normal on a big page, and never below the classroom floor there', () => {
    for (const group of ['2-3', '4-5', '6-8'] as AgeGroup[]) {
      const text = 'The ball rolls down the hill. Roll, roll, roll!'
      const normal = layoutZone({ ...base, group, pageW: 680, pageH: 850, text })
      const room = layoutZone({ ...base, group, pageW: 680, pageH: 850, text, classroom: true })
      expect(room.fontSize).toBeGreaterThanOrEqual(normal.fontSize * 1.4)
      expect(room.fontSize).toBeGreaterThanOrEqual(MIN_FONT[group] * CLASSROOM_BOOST.min)
      expect(room.overflow).toBe(false)
    }
  })

  it('leave the normal layout exactly as it was', () => {
    const a = layoutZone({ ...base, group: '4-5', pageW: 390, pageH: 700, text: 'Short words here.' })
    const b = layoutZone({ ...base, group: '4-5', pageW: 390, pageH: 700, text: 'Short words here.', classroom: false })
    expect(b).toEqual(a)
  })

  // Every page of every story, in its longest language: classroom mode never makes a page scroll that fits at the
  // normal size, never shows smaller words than the normal layout, and keeps every word whole and inside the box.
  const folders = readdirSync(ROOT).filter((id) => ['story.json', ...LANGS.map((l) => `${l}.json`)].every((f) => existsSync(`${ROOT}${id}/${f}`)))
  it('reads every story folder', () => expect(folders.length).toBeGreaterThanOrEqual(45))
  it('every page of every story fits on phone, tablet, laptop and projector pages, larger than normal', () => {
    let grew = 0
    let pages = 0
    for (const id of folders) {
      const story = read<StoryJson>(`${ROOT}${id}/story.json`)
      const texts = Object.fromEntries(LANGS.map((l) => [l, read<LangJson>(`${ROOT}${id}/${l}.json`)]))
      const group = story.ageGroups[0]!
      for (const page of story.pages) {
        const longest = [...LANGS].sort((a, b) => measureFor(b)(texts[b]!.pages[page.n - 1]!.text, 20) - measureFor(a)(texts[a]!.pages[page.n - 1]!.text, 20))[0]!
        const text = texts[longest]!.pages[page.n - 1]!.text
        for (const [name, [w, h]] of Object.entries(SIZES)) {
          const input = { pageW: w, pageH: h, zone: page.zone, rtl: isRtl(longest), group, scale: 0, script: scriptOf(longest), text, measure: measureFor(longest) }
          const normal = layoutZone(input)
          const room = layoutZone({ ...input, classroom: true })
          const where = `${id} p${page.n} ${longest} ${name}`
          pages++
          if (room.fontSize > normal.fontSize) grew++
          expect(room.fontSize, where).toBeGreaterThanOrEqual(normal.fontSize - 0.01)
          if (!normal.overflow) expect(room.overflow, where).toBe(false)
          const inner = room.box.w - 2 * room.padX
          for (const line of room.lines) expect(measureFor(longest)(line, room.fontSize), where).toBeLessThanOrEqual(inner + 0.5)
          expect(room.lines.join(' '), where).toBe(text.split(/\s+/).join(' '))
          if (name === 'projector') expect(room.fontSize, where).toBeGreaterThanOrEqual(MIN_FONT[group] * CLASSROOM_BOOST.min - 0.01)
        }
      }
    }
    // Nearly every page is larger in classroom mode (a long page on the smallest phone may stay at its normal size).
    expect(grew / pages).toBeGreaterThan(0.9)
  })
})
