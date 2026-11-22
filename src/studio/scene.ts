/**
 * A scene: one picture that is a pure function of time. A book picture is a scene at one moment, an instruction
 * loop is a short scene that repeats, a film is scenes on a timeline, cut into shots.
 */
import type { Cue } from '@/audio/sfx'
import { Painter, paperGrain } from './kit/core'
import { MOODS, PROFILES, type Mood, type StyleProfile } from './style/profile'

export type Lang = 'ar' | 'he' | 'en' | 'da'
export const RTL: Record<Lang, boolean> = { ar: true, he: true, en: false, da: false }
export type Words = Record<Lang, string>

export type SceneOpts = { lang: Lang; style: StyleProfile }

/** Real text laid over a book picture: where it sits (stage units, as for a left-to-right book) and what it says. */
export type PageText = { x: number; y: number; w: number; h: number; text: Words; /** Type size as a fraction of the picture's width. */ size?: number }
/**
 * One caption line of a film shot. `from` is when it is spoken. `to` may be left out: the line then stays up for
 * as long as it takes to read in each language (see `timedCaptions`).
 */
export type CaptionLine = { from: number; to?: number; text: Words }
export type TimedCaption = { from: number; to: number; text: string }

export type Scene = {
  id: string
  title: string
  /** Page size in stage units (1920×1080 for film; a book spread is 1920×1200). */
  W: number
  H: number
  /** Seconds. A still picture has 0. */
  duration: number
  /** Where each shot starts (the first is 0). A film is rendered shot by shot. */
  shots?: number[]
  /** true = the last frame leads into the first (instruction loops). */
  loop?: boolean
  mood?: Mood
  render: (P: Painter, t: number, o: SceneOpts) => void
  /** Book pages: the words, as real text over the picture (never painted in). */
  words?: PageText[]
  /** Films: caption lines (also written out as WebVTT). */
  captions?: CaptionLine[]
  /** Films: the sound effects on the timeline (made in code, mixed and muxed into the MP4 by the export script). */
  sound?: Cue[]
}

/** Draws frame `t` of a scene onto a canvas that is `pxWidth` pixels wide. */
export function renderScene(scene: Scene, ctx: CanvasRenderingContext2D, pxWidth: number, t: number, o: Partial<SceneOpts> = {}) {
  const P = new Painter(ctx, pxWidth, scene.W, scene.H)
  P.style = o.style ?? PROFILES.gouache
  P.mood = scene.mood ?? MOODS.day
  P.screen()
  ctx.fillStyle = P.style.palette.paper
  ctx.fillRect(0, 0, scene.W, scene.H)
  scene.render(P, t, { lang: o.lang ?? 'en', style: P.style })
  paperGrain(P)
}

/**
 * How long a line needs on screen to be read aloud to a small child, seconds: a slow reader's pace (about two
 * and a half words a second, counted by letters so that long and short words are fair in every language), never
 * less than a second and a half, never more than seven.
 */
export function readingTime(text: string): number {
  const letters = text.replace(/[\s.,;:!?…“”«»"'()\-–—؟،]/g, '').length
  const words = text.trim().split(/\s+/).length
  return Math.max(1.5, Math.min(7, 0.7 + letters / 13 + words * 0.08))
}

/**
 * The caption lines of a scene for one language, each with a start and an end: it stays up for its reading time
 * (or until the `to` its author gave, if that is later), but never into the next line (a short gap is left, so
 * the eye sees the change) and never past the end of the film.
 */
export function timedCaptions(scene: Scene, lang: Lang): TimedCaption[] {
  const lines = [...(scene.captions ?? [])].sort((a, b) => a.from - b.from)
  return lines.map((c, i) => {
    const text = c.text[lang]
    let to = Math.max(c.to ?? 0, c.from + readingTime(text))
    const next = lines[i + 1]
    if (next) to = Math.min(to, next.from - 0.12)
    if (scene.duration > 0) to = Math.min(to, scene.duration - 0.04)
    return { from: c.from, to: Math.max(to, c.from + 0.4), text }
  })
}

/** The caption on screen at `t` in one language, if any. */
export const captionAt = (scene: Scene, t: number, lang: Lang = 'en'): TimedCaption | null => timedCaptions(scene, lang).find((c) => t >= c.from && t < c.to) ?? null

/** WebVTT for one language: one cue per line, timed for reading, centred near the foot of the picture. */
export function toVtt(scene: Scene, lang: Lang): string {
  const ts = (s: number) => {
    const ms = Math.round(s * 1000)
    const p = (n: number, w = 2) => String(n).padStart(w, '0')
    return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)}.${p(ms % 1000, 3)}`
  }
  return `WEBVTT\n\n${timedCaptions(scene, lang).map((c, i) => `${i + 1}\n${ts(c.from)} --> ${ts(c.to)} line:88% align:center\n${c.text}\n`).join('\n')}`
}
