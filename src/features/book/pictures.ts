import { story, SCENES } from '@/content/story'
import { asset } from '@/lib/asset'

/** Scene pictures, loaded ahead of the reader so a leaf never turns onto an empty page. */
const cache = new Map<number, HTMLImageElement>()

export function preloadScene(i: number): HTMLImageElement | null {
  if (i < 0 || i >= SCENES) return null
  let im = cache.get(i)
  if (!im) {
    im = new Image()
    im.decoding = 'async'
    im.src = asset(story.scenes[i].img)
    cache.set(i, im)
    im.decode?.().catch(() => {})
  }
  return im
}
export const cachedScene = (i: number) => cache.get(i) ?? null
/** The picture if it is loaded and decodable right now, otherwise null. */
export const ready = (im: HTMLImageElement | null | undefined): HTMLImageElement | null => (im && im.complete && im.naturalWidth > 0 ? im : null)
/** Canvas pixels per CSS pixel for painted pages (kept modest on wide spreads). */
export const pageScale = (W: number) => Math.min(window.devicePixelRatio || 1, W > 900 ? 1.5 : 2)
