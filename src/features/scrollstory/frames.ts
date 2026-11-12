import { asset } from '@/lib/asset'

/**
 * The wind scene as an image sequence (see public/film/scrub/meta.json).
 * Frames are kept as HTMLImageElements so the browser owns (and can drop) the decoded pixels.
 */
export type FrameSet = 'd' | 'm'
export interface ScrubMeta {
  frames: number
  fps: number
  sets: Record<string, number>
  pattern: string
}

/** Used only if meta.json cannot be read; mirrors what scripts/assets/build-media.mjs writes. */
const FALLBACK: ScrubMeta = { frames: 121, fps: 24, sets: { d: 1280, m: 720 }, pattern: 'film/scrub/{set}/{0000}.webp' }

let metaPromise: Promise<ScrubMeta> | null = null
export const loadMeta = (): Promise<ScrubMeta> =>
  (metaPromise ??= fetch(asset('film/scrub/meta.json'))
    .then((r) => (r.ok ? (r.json() as Promise<ScrubMeta>) : FALLBACK))
    .then((m) => (m && m.frames > 0 && m.pattern ? m : FALLBACK))
    .catch(() => FALLBACK))

/** Loading passes: the first frame, then every 8th, every 4th, then all the rest. */
export function loadPasses(count: number): number[][] {
  const seen = new Set<number>()
  const take = (list: number[]) => list.filter((i) => i >= 0 && i < count && !seen.has(i) && (seen.add(i), true))
  const every = (step: number) => Array.from({ length: Math.ceil(count / step) }, (_, k) => k * step)
  return [take([0]), take([...every(8), count - 1]), take(every(4)), take(every(1))]
}

/** Four at a time: over HTTP/1.1 this leaves connections free for the hero film and the pictures around it. */
const PARALLEL = 4

/**
 * Frame numbers (1-based, inclusive) where fast motion smears a face in the source film. They are fine in
 * passing — that is what motion blur is for — but nobody should be left looking at one, so the playhead
 * never comes to rest inside these ranges. Checked by eye against the 121-frame build of the wind scene.
 */
const SMEARED: ReadonlyArray<readonly [number, number]> = [
  [10, 15],
  [27, 31],
  [45, 48],
  [61, 68],
  [83, 86],
  [93, 94],
  [101, 103],
  [117, 119],
]

/** The clean frame nearest to `index` (0-based in and out) for a film of `count` frames. */
export function restFrame(index: number, count: number): number {
  if (count !== 121) return index // the list above describes this build only
  const n = index + 1
  for (const [from, to] of SMEARED) {
    if (n < from || n > to) continue
    const back = from - 1
    const ahead = to + 1
    const pick = ahead > count ? back : back < 1 ? ahead : n - back < ahead - n ? back : ahead
    return pick - 1
  }
  return index
}

export class FrameStore {
  readonly count: number
  readonly images: (HTMLImageElement | undefined)[]
  loaded = 0
  /** Frame the visitor is looking at; later passes load outward from here. */
  playhead = 0
  /** Called whenever a new frame becomes drawable. */
  onFrame: ((index: number) => void) | null = null
  private ready: Uint8Array
  private passes: number[][]
  private flying = 0
  private started = false

  constructor(
    readonly set: FrameSet,
    private meta: ScrubMeta,
  ) {
    this.count = meta.frames
    this.images = new Array(meta.frames)
    this.ready = new Uint8Array(meta.frames)
    this.passes = loadPasses(meta.frames)
  }

  url(index: number) {
    return asset(this.meta.pattern.replace('{set}', this.set).replace('{0000}', String(index + 1).padStart(4, '0')))
  }

  start() {
    if (this.started) return
    this.started = true
    this.pump()
  }

  has(index: number) {
    return this.ready[index] === 1
  }

  /** Nearest drawable frame at or below `index` (−1 when none). */
  below(index: number) {
    for (let i = Math.min(this.count - 1, index); i >= 0; i--) if (this.ready[i]) return i
    return -1
  }

  /** Nearest drawable frame at or above `index` (−1 when none). */
  above(index: number) {
    for (let i = Math.max(0, index); i < this.count; i++) if (this.ready[i]) return i
    return -1
  }

  /** Nearest drawable frame to `index` in either direction (−1 when none). */
  nearest(index: number) {
    const lo = this.below(index)
    const hi = this.above(index)
    if (lo < 0) return hi
    if (hi < 0) return lo
    return index - lo <= hi - index ? lo : hi
  }

  /** Ask the browser to decode a frame off the main thread just before the playhead reaches it. */
  warm(index: number) {
    const img = this.images[index]
    if (img && this.ready[index] && typeof img.decode === 'function') img.decode().catch(() => {})
  }

  private next(): { index: number; first: boolean } | undefined {
    for (let p = 0; p < this.passes.length; p++) {
      const pass = this.passes[p]
      if (!pass.length) continue
      // The coarse passes keep their order's coverage but start near the playhead; so does the fill pass.
      let best = 0
      if (p > 0) {
        let bestDist = Infinity
        for (let k = 0; k < pass.length; k++) {
          const d = Math.abs(pass[k] - this.playhead)
          if (d < bestDist) {
            bestDist = d
            best = k
          }
        }
      }
      return { index: pass.splice(best, 1)[0], first: p === 0 }
    }
    return undefined
  }

  private pump() {
    while (this.flying < PARALLEL) {
      const job = this.next()
      if (!job) return
      const { index } = job
      this.flying++
      const img = new Image()
      img.decoding = 'async'
      img.fetchPriority = job.first ? 'high' : 'low'
      const done = (ok: boolean) => {
        img.onload = img.onerror = null
        this.flying--
        if (ok && img.naturalWidth > 0) {
          this.ready[index] = 1
          this.loaded++
          this.onFrame?.(index)
        }
        this.pump()
      }
      img.onload = () => done(true)
      img.onerror = () => done(false)
      this.images[index] = img
      img.src = this.url(index)
    }
  }
}

/** One store per frame set, kept for the life of the page (remounts and language-free re-renders reuse it). */
const stores = new Map<FrameSet, FrameStore>()
export function frameStore(set: FrameSet, meta: ScrubMeta): FrameStore {
  let store = stores.get(set)
  if (!store) {
    store = new FrameStore(set, meta)
    stores.set(set, store)
  }
  return store
}
