import { asset } from '@/lib/asset'
import { num } from '@/i18n/locale'

/** One film scene: `scene` is the 0-based index into `story.scenes`; `start`/`end` are the middles of the dissolves. */
export interface FilmScene {
  scene: number
  start: number
  end: number
}
/** `public/film/watch.json`, written by `scripts/film/build-film.mjs`. */
export interface Timeline {
  duration: number
  /** Length of the cover opening: the first scene is fully on screen from here. */
  opening: number
  /** Length of each dissolve. */
  xfade: number
  /** Length of the final fade to black. */
  fadeOut: number
  scenes: FilmScene[]
}

let cache: Promise<Timeline | null> | null = null

/** Loads the scene timings once. Resolves to `null` if they are missing: the film still plays, without chips or captions. */
export function loadTimeline(): Promise<Timeline | null> {
  cache ??= fetch(asset('film/watch.json'))
    .then((r) => (r.ok ? r.json() : null))
    .then((j: Partial<Timeline> | null) => {
      if (!j || typeof j.duration !== 'number' || !Array.isArray(j.scenes) || !j.scenes.length) return null
      const xfade = j.xfade ?? 0.5
      return { duration: j.duration, opening: j.opening ?? j.scenes[0].start + xfade / 2, xfade, fadeOut: j.fadeOut ?? 2.5, scenes: j.scenes }
    })
    .catch(() => null)
  return cache
}

/** Index (into `timeline.scenes`) of the scene playing at `time`; −1 during the cover opening. */
export function sceneIndexAt(tl: Timeline, time: number): number {
  let i = -1
  for (let k = 0; k < tl.scenes.length; k++) if (time >= tl.scenes[k].start) i = k
  return i
}

/** First moment a scene is fully on screen (its dissolve is over): where the chips seek to. */
export const clearStart = (tl: Timeline, i: number) => tl.scenes[i].start + tl.xfade / 2 + 0.02

/** The film only has some of the story's scenes: pick the nearest one (the earlier one on a tie). */
export function nearestFilmScene(tl: Timeline, storyScene: number): number {
  let best = 0
  for (let k = 1; k < tl.scenes.length; k++) {
    if (Math.abs(tl.scenes[k].scene - storyScene) < Math.abs(tl.scenes[best].scene - storyScene)) best = k
  }
  return best
}

/** 75 → "1:15" in the reader's own digits. */
export function clock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const ss = s % 60
  return `${num(Math.floor(s / 60))}:${ss < 10 ? num(0) : ''}${num(ss)}`
}
