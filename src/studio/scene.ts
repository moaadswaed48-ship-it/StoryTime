/**
 * A scene: one picture that is a pure function of time. A book picture is a scene at one moment, an instruction
 * loop is a short scene that repeats, a film is scenes on a timeline, cut into shots.
 */
import { Painter, paperGrain } from './kit/core'
import { MOODS, PROFILES, type Mood, type StyleProfile } from './style/profile'

export type Lang = 'ar' | 'he' | 'en' | 'da'
export const RTL: Record<Lang, boolean> = { ar: true, he: true, en: false, da: false }
export type Words = Record<Lang, string>

export type SceneOpts = { lang: Lang; style: StyleProfile }

/** Real text laid over a book picture: where it sits (stage units, as for a left-to-right book) and what it says. */
export type PageText = { x: number; y: number; w: number; h: number; text: Words; /** Type size as a fraction of the picture's width. */ size?: number }
/** One caption line of a film shot. */
export type CaptionLine = { from: number; to: number; text: Words }

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

/** The caption on screen at `t`, if any. */
export const captionAt = (scene: Scene, t: number): CaptionLine | null => scene.captions?.find((c) => t >= c.from && t < c.to) ?? null

/** WebVTT for one language. */
export function toVtt(scene: Scene, lang: Lang): string {
  const ts = (s: number) => {
    const ms = Math.round(s * 1000)
    const p = (n: number, w = 2) => String(n).padStart(w, '0')
    return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)}.${p(ms % 1000, 3)}`
  }
  return `WEBVTT\n\n${(scene.captions ?? []).map((c, i) => `${i + 1}\n${ts(c.from)} --> ${ts(c.to)}\n${c.text[lang]}\n`).join('\n')}`
}
