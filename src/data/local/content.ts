import { checkStory, isZone, type LangJson, type StoryJson, type WordTiming } from '@/content/schema'
import { LANGS, type Lang } from '@/i18n/config'
import { DataError } from '../errors'
import { isAgeGroup, type ActivityContent, type FilmContent, type StoryContent, type StoryPage, type StorySummary } from '../types'

/**
 * The local backend's story loader: reads content/stories/<id>/ (the format in content/SCHEMA.md) for the test-mode
 * backend. Only LocalServer calls it, and `loadContent` only after the access check has passed.
 *
 * Files are read as text and parsed here, so a story that another helper is still writing (half a file, a stray
 * comment) is skipped with a warning instead of breaking the build. Language files, timings and media are separate
 * lazy chunks: nothing of a story's text is fetched before it is asked for.
 *
 * Test mode only: in this mode the built files are reachable by anyone who knows their hashed address. The real
 * backend serves content from Supabase and media through short-lived links (docs/HANDOFF.md, part A notes).
 */
const ROOT = '/content/stories/'
const storyRaw = import.meta.glob<string>('/content/stories/*/story.json', { eager: true, query: '?raw', import: 'default' })
const langRaw = import.meta.glob<string>('/content/stories/*/{ar,he,en,da}.json', { query: '?raw', import: 'default' })
const timingRaw = import.meta.glob<string>('/content/stories/*/audio/*/*.json', { query: '?raw', import: 'default' })
const mediaUrl = import.meta.glob<string>('/content/stories/*/**/*.{webp,png,jpg,jpeg,svg,mp4,webm,mp3,m4a,vtt}', { query: '?url', import: 'default' })

const PICTURE = ['webp', 'png', 'jpg', 'jpeg', 'svg']
const AUDIO = ['mp3', 'm4a']
const LOOP = ['mp4', 'webm']
const two = (n: number) => String(n).padStart(2, '0')

export type ContentStory = {
  id: string
  folder: string
  story: StoryJson
  /** Folders named sample-* hold StoryTime's test stories, marked as samples on screen. */
  isSample: boolean
  /** film: a film file exists; filmSoon: the story has a film plan (story.json "film") but no file yet. */
  features: { listen: boolean; film: boolean; activity: boolean; filmSoon: boolean }
}

function parse<T>(raw: string, where: string): T | null {
  try {
    return JSON.parse(raw) as T
  } catch {
    if (typeof console !== 'undefined') console.warn(`[content] ${where}: not valid JSON, skipped`)
    return null
  }
}

const has = (path: string) => path in mediaUrl
const firstExisting = (base: string, exts: string[]) => exts.map((e) => `${base}.${e}`).find(has) ?? null
const url = async (path: string | null) => (path && mediaUrl[path] ? await mediaUrl[path]() : null)

function readStories(): ContentStory[] {
  const out: ContentStory[] = []
  for (const [path, raw] of Object.entries(storyRaw)) {
    const folder = path.slice(ROOT.length).split('/')[0]!
    const story = parse<StoryJson>(raw, path)
    if (!story) continue
    const problems: string[] = []
    if (story.id !== folder) problems.push(`id "${story.id}" differs from its folder`)
    if (!Array.isArray(story.ageGroups) || !story.ageGroups.length || !story.ageGroups.every(isAgeGroup)) problems.push('bad ageGroups')
    if (!Array.isArray(story.pages) || !story.pages.length) problems.push('no pages')
    if (problems.length) {
      console.warn(`[content] ${folder}: ${problems.join('; ')}; skipped`)
      continue
    }
    const dir = `${ROOT}${folder}/`
    const keys = Object.keys(mediaUrl)
    out.push({
      id: story.id,
      folder,
      story,
      isSample: folder.startsWith('sample-'),
      features: {
        listen: keys.some((k) => k.startsWith(`${dir}audio/`)),
        film: keys.some((k) => k.startsWith(`${dir}film/`) && k.endsWith('.mp4')),
        activity: !!story.activity,
        filmSoon: !!story.film && !keys.some((k) => k.startsWith(`${dir}film/`) && k.endsWith('.mp4')),
      },
    })
  }
  return out.sort((a, b) => Number(a.isSample) - Number(b.isSample) || a.id.localeCompare(b.id))
}

/** Every well-formed story folder, real stories first, then the samples. */
export const CONTENT_STORIES: ContentStory[] = readStories()

const langCache = new Map<string, Promise<LangJson | null>>()
function loadLang(folder: string, lang: Lang): Promise<LangJson | null> {
  const key = `${ROOT}${folder}/${lang}.json`
  let p = langCache.get(key)
  if (!p) {
    const load = langRaw[key]
    p = load ? load().then((raw) => parse<LangJson>(raw, key)) : Promise.resolve(null)
    langCache.set(key, p)
  }
  return p
}

/** The language asked for, else the nearest one the story has (Arabic first: the site's fallback language). */
async function pickLang(folder: string, want: Lang): Promise<{ lang: Lang; json: LangJson } | null> {
  for (const lang of [want, ...LANGS.filter((l) => l !== want)]) {
    const json = await loadLang(folder, lang)
    if (json) return { lang, json }
  }
  return null
}

/** Catalogue facts for a content story (title, teaser, cover): no story text. */
export async function summaryFacts(c: ContentStory, want: Lang): Promise<Pick<StorySummary, 'title' | 'teaser' | 'coverUrl'>> {
  const picked = await pickLang(c.folder, want)
  const dir = `${ROOT}${c.folder}/`
  const first = c.story.pages[0]
  const coverPath = firstExisting(`${dir}cover`, PICTURE) ?? (first ? pagePicturePath(dir, first.n, first.image) : null)
  return { title: picked?.json.title ?? c.id, teaser: picked?.json.teaser ?? '', coverUrl: await url(coverPath) }
}

function pagePicturePath(dir: string, n: number, image: string | null): string | null {
  if (image) {
    const p = `${dir}${image.replace(/^\.?\//, '')}`
    if (has(p)) return p
  }
  return firstExisting(`${dir}pages/${two(n)}`, PICTURE)
}

async function readAlongFor(dir: string, lang: Lang, n: number): Promise<StoryPage['readAlong']> {
  const audio = firstExisting(`${dir}audio/${lang}/${two(n)}`, AUDIO)
  const timingKey = `${dir}audio/${lang}/${two(n)}.json`
  if (!audio || !timingRaw[timingKey]) return null
  const timing = parse<WordTiming>(await timingRaw[timingKey](), timingKey)
  if (!timing || !Array.isArray(timing.words) || !(timing.duration > 0)) return null
  return { audioUrl: (await url(audio))!, timing }
}

/** The whole story in one language. Call only after hasAccessToStory() has passed. */
export async function loadContent(c: ContentStory, want: Lang): Promise<StoryContent> {
  const picked = await pickLang(c.folder, want)
  if (!picked) throw new DataError('not_found', `${c.id}: no language file`)
  const { lang, json } = picked
  const problems = checkStory(c.story, { [lang]: json })
  if (problems.length) console.warn(`[content] ${c.id}: ${problems.join('; ')}`)
  // Only a problem with the book itself stops it opening. A mismatch in the activity's list is shown as the language
  // file has it (tests/content.test.ts checks that every story folder agrees).
  const fatal = problems.filter((p) => !p.includes('activity') && !p.includes('film line'))
  if (fatal.length) throw new DataError('not_found', `${c.id}: ${fatal[0]}`)
  const dir = `${ROOT}${c.folder}/`
  const pages: StoryPage[] = await Promise.all(
    c.story.pages.map(async (p) => {
      const t = json.pages.find((x) => x.n === p.n)!
      return {
        pageNo: p.n,
        display: t.text,
        speech: t.speech || t.text,
        pictureUrl: await url(pagePicturePath(dir, p.n, p.image)),
        zone: isZone(p.zone) ? p.zone : null,
        readAlong: await readAlongFor(dir, lang, p.n),
      }
    }),
  )

  let film: FilmContent | null = null
  const video = `${dir}film/${lang}.mp4`
  const videoPath = has(video) ? video : has(`${dir}film/film.mp4`) ? `${dir}film/film.mp4` : null
  if (videoPath || c.story.film) {
    const vtt = `${dir}film/${lang}.vtt`
    film = {
      videoUrl: await url(videoPath),
      posterUrl: await url(firstExisting(`${dir}film/poster`, PICTURE)),
      captionsUrl: await url(has(vtt) ? vtt : null),
      captionsLang: lang,
    }
  }

  let activity: ActivityContent | null = null
  const a = c.story.activity
  if (a && json.activity) {
    const t = json.activity
    activity = {
      title: t.title,
      goal: t.goal,
      minutes: a.minutes ?? null,
      // The language file's lines are what the family reads; story.json's ids (same order) name the pictures.
      materials: await Promise.all(t.materials.map(async (label, i) => {
        const id = a.materials[i] ?? `m${i + 1}`
        return { id, label, pictureUrl: await url(firstExisting(`${dir}activity/material-${id}`, PICTURE)) }
      })),
      steps: await Promise.all(
        a.steps.map(async (s) => ({
          n: s.n,
          caption: t.steps.find((x) => x.n === s.n)?.caption ?? '',
          pictureUrl: await url(firstExisting(`${dir}activity/step-${s.n}`, PICTURE)),
          loopUrl: s.loop ? await url(firstExisting(`${dir}activity/step-${s.n}`, LOOP)) : null,
        })),
      ),
      safety: t.safety,
      forAdult: t.forAdult,
      inClass: t.inClass,
    }
  }

  return { id: c.id, lang, title: json.title, credit: c.story.owner === 'author' ? 'author' : 'storytime', isSample: c.isSample, pages, film, activity }
}

