import { LANGS, type Lang } from '@/i18n/config'
import { AGE_GROUPS, type AgeGroup } from '@/data/types'
import { wordsOf } from '@/content/schema'
import type { ActivityText, LangContent, MediaKind, OwnerStory, UploadPurpose } from './types'

/**
 * The owner's rules, as pure functions shared by the local store, the Supabase store and the screens.
 * The database enforces the same publish rule itself (supabase/migrations/20261122100300_owner_emails.sql).
 */

export const TRIAL_PER_GROUP = 3

export const emptyActivityText = (): ActivityText => ({ title: '', goal: '', materials: [], steps: {}, safety: '', forAdult: '', inClass: '' })
export const emptyLangContent = (): LangContent => ({ title: '', teaser: '', pages: {}, activity: emptyActivityText() })

/** A gap that blocks sign-off and publishing, or one that is only shown (film and activity may come later). */
export type Gap =
  | { lang: Lang | null; kind: 'title' }
  | { lang: Lang | null; kind: 'pageText'; page: number }
  | { lang: Lang; kind: 'speechWords'; page: number }
  | { lang: null; kind: 'noPages' | 'noGroup' }
  | { lang: null; kind: 'picture'; page: number }
  | { lang: Lang; kind: 'film' | 'captions' }
  | { lang: Lang; kind: 'activity'; field: 'title' | 'goal' | 'materials' | 'safety' | 'forAdult' | 'inClass' }
  | { lang: Lang; kind: 'stepCaption'; step: number }

const blank = (s: string | undefined) => !s || !s.trim()

/** Languages a story can be offered in at all. The author's story exists only in Arabic. */
export const possibleLangs = (s: Pick<OwnerStory, 'credit'>): Lang[] => (s.credit === 'author' ? ['ar'] : [...LANGS])

export function hasActivity(s: OwnerStory): boolean {
  if (s.activity.steps.length) return true
  return LANGS.some((l) => {
    const a = s.texts[l].activity
    return !blank(a.title) || !blank(a.goal) || a.materials.length > 0 || !blank(a.safety) || !blank(a.forAdult) || !blank(a.inClass)
  })
}

/** Gaps in one language that block its sign-off. */
export function blockingGaps(s: OwnerStory, lang: Lang): Gap[] {
  const t = s.texts[lang]
  const out: Gap[] = []
  if (blank(t.title)) out.push({ lang, kind: 'title' })
  s.pages.forEach((p, i) => {
    const words = t.pages[p.key]
    if (blank(words?.text)) out.push({ lang, kind: 'pageText', page: i + 1 })
    // content/SCHEMA.md: the voice's form has the same words as the shown text, only the vowel marks differ.
    else if (!blank(words?.speech) && wordsOf(words!.speech).length !== wordsOf(words!.text).length) out.push({ lang, kind: 'speechWords', page: i + 1 })
  })
  return out
}

/** Gaps shown beside a language that do not block it: the film and the activity may come after the book. */
export function softGaps(s: OwnerStory, lang: Lang): Gap[] {
  const out: Gap[] = []
  if (!s.films[lang].videoId) out.push({ lang, kind: 'film' })
  else if (!s.films[lang].captionsId) out.push({ lang, kind: 'captions' })
  if (hasActivity(s)) {
    const a = s.texts[lang].activity
    for (const field of ['title', 'goal', 'safety', 'forAdult', 'inClass'] as const) if (blank(a[field])) out.push({ lang, kind: 'activity', field })
    if (!a.materials.some((m) => !blank(m))) out.push({ lang, kind: 'activity', field: 'materials' })
    s.activity.steps.forEach((st, i) => {
      if (blank(a.steps[st.key])) out.push({ lang, kind: 'stepCaption', step: i + 1 })
    })
  }
  return out
}

/** Gaps that belong to no language: pages, pictures, age groups. All block publishing. */
export function sharedGaps(s: OwnerStory): Gap[] {
  const out: Gap[] = []
  if (!s.groups.length) out.push({ lang: null, kind: 'noGroup' })
  if (!s.pages.length) out.push({ lang: null, kind: 'noPages' })
  s.pages.forEach((p, i) => {
    if (!p.pictureId) out.push({ lang: null, kind: 'picture', page: i + 1 })
  })
  return out
}

/**
 * A short, stable fingerprint of one language's content. A sign-off stores it; any later change to that
 * language's words, captions or film changes it, and the sign-off stops counting. (cyrb53, not a security hash:
 * it only detects edits.)
 */
export function fingerprint(s: OwnerStory, lang: Lang): string {
  const t = s.texts[lang]
  const parts = [
    t.title, t.teaser,
    ...s.pages.map((p) => `${t.pages[p.key]?.text ?? ''}\u0001${t.pages[p.key]?.speech ?? ''}`),
    s.films[lang].videoId ?? '', s.films[lang].captionsId ?? '',
    t.activity.title, t.activity.goal, t.activity.materials.join('\u0002'), t.activity.safety, t.activity.forAdult, t.activity.inClass,
    ...s.activity.steps.map((st) => t.activity.steps[st.key] ?? ''),
  ]
  return cyrb53(parts.join('\u0000'))
}

function cyrb53(str: string, seed = 0): string {
  let h1 = 0xdeadbeef ^ seed
  let h2 = 0x41c6ce57 ^ seed
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36)
}

export const signoffValid = (s: OwnerStory, lang: Lang) => s.signoffs[lang]?.fingerprint === fingerprint(s, lang)

/** The languages a publish would cover. */
export const targetLangs = (s: OwnerStory, only?: Lang[] | null): Lang[] => {
  const allowed = possibleLangs(s)
  const want = only && only.length ? only : allowed
  return LANGS.filter((l) => want.includes(l) && allowed.includes(l))
}

export type PublishProblem = Gap | { lang: Lang; kind: 'notSignedOff' } | { lang: null; kind: 'noLanguage' }

/**
 * May this story be published? Every target language must be complete and signed off on its current content;
 * pictures and an age group are needed. "only" is the owner's explicit "publish in these languages only".
 * The author's story can only ever be published in Arabic, so for her story "all" means Arabic.
 */
export function publishProblems(s: OwnerStory, only?: Lang[] | null): PublishProblem[] {
  const langs = targetLangs(s, only)
  if (!langs.length) return [{ lang: null, kind: 'noLanguage' }]
  const out: PublishProblem[] = [...sharedGaps(s)]
  for (const l of langs) {
    out.push(...blockingGaps(s, l))
    if (!signoffValid(s, l)) out.push({ lang: l, kind: 'notSignedOff' })
  }
  return out
}

/**
 * A published story must stay complete: a save may not leave a published language without its title or a page's
 * words, a page without a picture, or the story without an age group (the database refuses it too:
 * guard_published_complete in supabase/migrations/20261122120000_owner_emails_review.sql). Sign-offs may go stale.
 */
export function publishedGaps(s: OwnerStory): Gap[] {
  if (s.status !== 'published') return []
  const langs = targetLangs(s, s.publishLangs)
  return [...sharedGaps(s), ...langs.flatMap((l) => blockingGaps(s, l).filter((g) => g.kind !== 'speechWords'))]
}

/** At most three trial stories per age group (plan section 2). Returns the groups that would go over. */
export function trialOverflow(stories: Pick<OwnerStory, 'id' | 'groups'>[]): AgeGroup[] {
  return AGE_GROUPS.filter((g) => stories.filter((s) => s.groups.some((x) => x.group === g && x.trial)).length > TRIAL_PER_GROUP)
}

// ---- uploads ----------------------------------------------------------------------------------------------------

const MB = 1024 * 1024
/** Type and size limits per use. Films are large; the Supabase bucket limit must allow FILM_MAX (see migration). */
export const UPLOAD_LIMITS: Record<UploadPurpose, { kinds: MediaKind[]; mimes: string[]; maxBytes: number; ext: string[] }> = {
  page: { kinds: ['image'], mimes: ['image/jpeg', 'image/png', 'image/webp'], maxBytes: 10 * MB, ext: ['jpg', 'jpeg', 'png', 'webp'] },
  step: { kinds: ['image', 'video'], mimes: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'], maxBytes: 20 * MB, ext: ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'webm'] },
  film: { kinds: ['video'], mimes: ['video/mp4', 'video/webm'], maxBytes: 500 * MB, ext: ['mp4', 'webm'] },
  captions: { kinds: ['captions'], mimes: ['text/vtt'], maxBytes: 512 * 1024, ext: ['vtt'] },
}

export type UploadRefusal = 'type' | 'size' | 'empty' | 'content' | 'licence'

/** The type a file really is, from its first bytes (the name and the browser's guess can both be wrong). */
export function sniffMime(head: Uint8Array, name: string): string | null {
  const b = (i: number) => head[i] ?? -1
  if (b(0) === 0xff && b(1) === 0xd8 && b(2) === 0xff) return 'image/jpeg'
  if (b(0) === 0x89 && b(1) === 0x50 && b(2) === 0x4e && b(3) === 0x47) return 'image/png'
  if (b(0) === 0x52 && b(1) === 0x49 && b(2) === 0x46 && b(3) === 0x46 && b(8) === 0x57 && b(9) === 0x45 && b(10) === 0x42 && b(11) === 0x50) return 'image/webp'
  if (b(4) === 0x66 && b(5) === 0x74 && b(6) === 0x79 && b(7) === 0x70) {
    // The same box starts HEIC and AVIF pictures: only video brands count as a film.
    const brand = String.fromCharCode(b(8), b(9), b(10), b(11))
    return /^(hei[cmsx]|hev[cmsx]|mif1|msf1|avi[fs])$/.test(brand) ? null : 'video/mp4'
  }
  if (b(0) === 0x1a && b(1) === 0x45 && b(2) === 0xdf && b(3) === 0xa3) return 'video/webm'
  // WebVTT: optional byte-order mark, then "WEBVTT".
  const text = new TextDecoder().decode(head.slice(0, 16)).replace(/^﻿/, '')
  if (text.startsWith('WEBVTT') && /\.vtt$/i.test(name)) return 'text/vtt'
  return null
}

export const kindOfMime = (mime: string): MediaKind => (mime.startsWith('image/') ? 'image' : mime === 'text/vtt' ? 'captions' : 'video')

/** Checks a file before it is stored. Returns the real type, or why it is refused. */
export function checkUpload(purpose: UploadPurpose, file: { name: string; size: number; head: Uint8Array }, meta: { source: string; licence: string; credit: string | null }): { ok: true; mime: string } | { ok: false; reason: UploadRefusal } {
  const lim = UPLOAD_LIMITS[purpose]
  if (!file.size) return { ok: false, reason: 'empty' }
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!lim.ext.includes(ext)) return { ok: false, reason: 'type' }
  if (file.size > lim.maxBytes) return { ok: false, reason: 'size' }
  const mime = sniffMime(file.head, file.name)
  if (!mime || !lim.mimes.includes(mime)) return { ok: false, reason: 'content' }
  if (blank(meta.licence) || (meta.source === 'third_party' && blank(meta.credit ?? ''))) return { ok: false, reason: 'licence' }
  return { ok: true, mime }
}

/** A file name safe for a storage path. */
export const safeName = (name: string) => name.normalize('NFKD').replace(/[^\w.-]+/g, '-').replace(/-+/g, '-').slice(-80) || 'file'
