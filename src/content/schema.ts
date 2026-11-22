/**
 * Types for the story content format in content/SCHEMA.md (the contract between the Story Room, the Studio and the
 * site), plus the few media files the site looks for next to it. The site reads exactly these files.
 *
 * Media conventions (inside content/stories/<id>/; every file is optional, a missing one is shown honestly):
 *   pages      story.json pages[].image (a path relative to the story folder), else pages/<nn>.(webp|png|jpg|svg)
 *   cover      cover.(webp|png|jpg|svg), else the first page's picture
 *   read-along audio/<lang>/<nn>.(mp3|m4a) + audio/<lang>/<nn>.json (a WordTiming, see below)
 *   film       film/<lang>.mp4, else film/film.mp4 (one picture for every language until the voice exists);
 *              film/poster.(webp|jpg|png|svg); captions film/<lang>.vtt (WebVTT, the language of the voice)
 *   activity   activity/step-<n>.(webp|png|jpg|svg) (the still), activity/step-<n>.(mp4|webm) (the loop, when
 *              steps[].loop is true), activity/material-<id>.(webp|png|jpg|svg) (one per materials[] id)
 * <nn> is the page number with two digits (01, 02, ...).
 */
import type { AgeGroup } from '@/data/types'
import { LANGS, type Lang } from '@/i18n/config'

export type ZoneSide = 'start' | 'end' | 'full'
export type ZoneV = 'top' | 'middle' | 'bottom'
export type ZoneSize = 's' | 'm' | 'l'
/** Where the calm area for words sits. "start" is the reading side: right in Arabic and Hebrew, left otherwise. */
export type Zone = { side: ZoneSide; v: ZoneV; size: ZoneSize }

export type StoryJson = {
  id: string
  ageGroups: AgeGroup[]
  owner: 'storytime' | 'author'
  lesson: string
  cast: string[]
  pages: { n: number; art: string; zone: Zone; image: string | null }[]
  film?: {
    targetSeconds: number
    shots: { n: number; page: number | null; action: string; sound: string[]; lines: string[] }[]
  } | null
  activity?: {
    minutes: number
    materials: string[]
    steps: { n: number; picture: string; loop: boolean }[]
    checkedAgainst: string
  } | null
}

export type LangJson = {
  title: string
  /** Optional one line for the locked view and the shelf (not in SCHEMA.md yet: proposed in docs/HANDOFF.md). */
  teaser?: string
  names: Record<string, string>
  pages: { n: number; text: string; speech: string }[]
  film?: { id: string; speaker: string; text: string; speech: string; emotion: string }[]
  activity?: {
    title: string
    goal: string
    materials: string[]
    steps: { n: number; caption: string }[]
    safety: string
    forAdult: string
    inClass: string
  } | null
}

/**
 * Read-along timing for one page in one language: the length of the recording and, for every word of the page's
 * `text` (split at white space, in order), when the voice says it, in seconds. Word i of `text` and word i of
 * `speech` are the same word (only the vowel marks differ), so timings made from `speech` fit `text`.
 */
export type WordTiming = { duration: number; words: [start: number, end: number][] }

/** The words of a page as the reader shows them and the timing counts them. */
export const wordsOf = (text: string): string[] => text.split(/\s+/).filter(Boolean)

const ZONE_SIDES: readonly string[] = ['start', 'end', 'full']
const ZONE_VS: readonly string[] = ['top', 'middle', 'bottom']
const ZONE_SIZES: readonly string[] = ['s', 'm', 'l']
export const isZone = (z: unknown): z is Zone => {
  const o = z as Zone | null
  return !!o && ZONE_SIDES.includes(o.side) && ZONE_VS.includes(o.v) && ZONE_SIZES.includes(o.size)
}
export const DEFAULT_ZONE: Zone = { side: 'full', v: 'bottom', size: 'm' }

/**
 * Checks one story against the rules of content/SCHEMA.md. Returns the problems found (empty when the story is
 * well formed). The loader skips a story with problems rather than showing half of it.
 */
export function checkStory(story: StoryJson, langs: Partial<Record<Lang, LangJson>>): string[] {
  const out: string[] = []
  if (!story.id) out.push('story.json: no id')
  if (!story.ageGroups?.length) out.push('story.json: no ageGroups')
  if (!story.pages?.length) out.push('story.json: no pages')
  const ns = (story.pages ?? []).map((p) => p.n)
  story.pages?.forEach((p, i) => {
    if (p.n !== i + 1) out.push(`story.json: page ${i + 1} is numbered ${p.n}`)
    if (!isZone(p.zone)) out.push(`story.json: page ${p.n} has no valid zone`)
  })
  const filmIds = new Set((story.film?.shots ?? []).flatMap((s) => s.lines))
  const stepNs = (story.activity?.steps ?? []).map((s) => s.n)
  for (const lang of LANGS) {
    const l = langs[lang]
    if (!l) continue
    if (!l.title) out.push(`${lang}.json: no title`)
    const pn = (l.pages ?? []).map((p) => p.n)
    if (pn.join() !== ns.join()) out.push(`${lang}.json: pages ${pn.join()} differ from story.json ${ns.join()}`)
    for (const p of l.pages ?? []) {
      if (!p.text?.trim()) out.push(`${lang}.json: page ${p.n} has no text`)
      if (p.speech && wordsOf(p.speech).length !== wordsOf(p.text).length) out.push(`${lang}.json: page ${p.n} speech and text have different word counts`)
    }
    for (const id of filmIds) if (l.film && !l.film.some((f) => f.id === id)) out.push(`${lang}.json: film line ${id} missing`)
    if (story.activity && l.activity) {
      const sn = l.activity.steps.map((s) => s.n)
      if (sn.join() !== stepNs.join()) out.push(`${lang}.json: activity steps ${sn.join()} differ from story.json ${stepNs.join()}`)
      if (l.activity.materials.length !== story.activity.materials.length) out.push(`${lang}.json: activity materials count differs from story.json`)
    }
  }
  return out
}

/** Index of the word being spoken at time `t` (seconds), or -1 before the first word. Binary search. */
export function wordAt(timing: WordTiming, t: number): number {
  const w = timing.words
  if (!w.length || t < w[0]![0]) return -1
  let lo = 0
  let hi = w.length - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (w[mid]![0] <= t) lo = mid
    else hi = mid - 1
  }
  return lo
}
