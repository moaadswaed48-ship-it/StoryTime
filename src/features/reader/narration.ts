/**
 * The story read aloud. A recorded voice reads the page that is showing and the book turns its own pages to
 * keep up: one file per scene (`public/audio/story/<lang>/sNN.mp3`), with a table of where each paragraph
 * starts and ends (`index.json`). Where a scene's file is missing from the table, its paragraphs' own files
 * (`sNN-pMM.mp3`) are read one after another instead.
 *
 * Three parts, each usable alone:
 *  - `Voice`: ONE <audio> element, reused by changing its `src` (iOS only lets the element that was started
 *    by a tap keep playing new sources);
 *  - the timing helpers (`clipsFor`, `pageMarks`): pure, no DOM;
 *  - `Narration`: follows a paged book through a small `NarrationHost`, and `useNarration` for React.
 */
import { useEffect, useRef, useState } from 'react'
import { asset } from '@/lib/asset'
import { pagesAt, positionOf, type BookPage } from './layout'

export type Lang = 'ar' | 'en'

interface SceneTrack {
  file: string
  dur: number
  paras: { start: number; end: number }[]
}
export interface NarrationIndex {
  ar?: Record<string, number>
  en?: Record<string, number>
  scenes?: { ar?: SceneTrack[]; en?: SceneTrack[] }
}

/** One audio file and the paragraphs of a scene it reads (seconds into the file). */
export interface Clip {
  scene: number
  url: string
  paras: { para: number; start: number; end: number }[]
}

const two = (n: number) => String(n).padStart(2, '0')
const BASE = 'audio/story'
export const sceneFile = (lang: Lang, scene: number) => asset(`${BASE}/${lang}/s${two(scene + 1)}.mp3`)
export const paraFile = (lang: Lang, scene: number, para: number) => asset(`${BASE}/${lang}/s${two(scene + 1)}-p${two(para + 1)}.mp3`)

let indexPromise: Promise<NarrationIndex | null> | null = null
let indexNow: NarrationIndex | null = null
/** Fetches the table of durations once. Resolves with `null` when there is no narration to play. */
export function loadIndex(): Promise<NarrationIndex | null> {
  indexPromise ??= fetch(asset(`${BASE}/index.json`))
    .then((r) => (r.ok ? (r.json() as Promise<NarrationIndex>) : null))
    .then((j) => (indexNow = j && typeof j === 'object' ? j : null))
    .catch(() => {
      indexPromise = null // not there yet: ask again the next time the button is pressed
      return null
    })
  return indexPromise
}

const ok = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n)

/** The files that read scene `scene` (which has `paragraphs` paragraphs), in order. Empty when there are none. */
export function clipsFor(index: NarrationIndex | null, lang: Lang, scene: number, paragraphs: number): Clip[] {
  if (!index) return []
  const track = index.scenes?.[lang]?.[scene]
  if (track && typeof track.file === 'string' && Array.isArray(track.paras) && track.paras.length === paragraphs && track.paras.every((p) => p && ok(p.start) && ok(p.end) && p.end > p.start)) {
    return [{ scene, url: asset(`${BASE}/${track.file}`), paras: track.paras.map((p, para) => ({ para, start: p.start, end: p.end })) }]
  }
  const each = index[lang]
  if (!each) return []
  const out: Clip[] = []
  for (let para = 0; para < paragraphs; para++) {
    const dur = each[`s${two(scene + 1)}-p${two(para + 1)}`]
    if (ok(dur) && dur > 0) out.push({ scene, url: paraFile(lang, scene, para), paras: [{ para, start: 0, end: dur }] })
  }
  return out
}

/** When the voice reaches the first of a clip's words on each page of its scene (book order). */
export interface PageMark {
  page: number
  t: number
}
/**
 * A line's time inside its paragraph is taken as proportional to the characters before it (lines are the
 * paragraph split at its own spaces, so they add up to it exactly).
 */
export function pageMarks(pages: BookPage[], clip: Clip): PageMark[] {
  const marks: PageMark[] = []
  const total = new Map<number, number>()
  const span = new Map(clip.paras.map((p) => [p.para, p]))
  pages.forEach((p) => {
    if (p.kind !== 'scene' || p.scene !== clip.scene) return
    for (const l of p.lines) if (span.has(l.para)) total.set(l.para, (total.get(l.para) ?? 0) + l.text.length + 1)
  })
  const before = new Map<number, number>()
  pages.forEach((p, page) => {
    if (p.kind !== 'scene' || p.scene !== clip.scene) return
    let first = true
    for (const l of p.lines) {
      const s = span.get(l.para)
      if (!s) continue
      const done = before.get(l.para) ?? 0
      if (first) {
        marks.push({ page, t: s.start + ((s.end - s.start) * done) / Math.max(1, total.get(l.para) ?? 1) })
        first = false
      }
      before.set(l.para, done + l.text.length + 1)
    }
  })
  return marks
}

/* ── The voice ────────────────────────────────────────────────────────────────────────────────────── */

export class Voice {
  readonly el: HTMLAudioElement
  private url = ''
  private seek: number | null = null
  private ahead: HTMLAudioElement | null = null
  /** False while the element has only been opened by a tap and nothing is meant to be heard yet. */
  private armed = false
  onEnded: () => void = () => {}
  /** The file could not be played (missing, blocked): the caller stops quietly. */
  onFail: () => void = () => {}

  constructor() {
    const el = new Audio()
    el.preload = 'auto'
    el.setAttribute('playsinline', '')
    el.addEventListener('ended', () => this.onEnded())
    el.addEventListener('error', () => {
      if (this.url && this.armed) this.onFail()
    })
    el.addEventListener('loadedmetadata', () => this.applySeek())
    this.el = el
  }

  private applySeek() {
    if (this.seek === null) return
    try {
      this.el.currentTime = this.seek
    } catch {
      /* not seekable: read from the start */
    }
    this.seek = null
    this.el.muted = false
  }

  /** Starts `url` at `at` seconds. Call it inside the tap the first time, so the element is allowed to speak. */
  play(url: string, at = 0) {
    const el = this.el
    if (this.url !== url) {
      this.url = url
      el.src = url
    }
    this.armed = true
    this.seek = null
    el.muted = false
    if (at > 0.05) {
      this.seek = at
      // Nothing is heard from the wrong place while the file's length is still unknown.
      if (el.readyState >= 1) this.applySeek()
      else el.muted = true
    } else if (el.currentTime > 0.05) {
      try {
        el.currentTime = 0
      } catch {
        /* fresh source */
      }
    }
    this.start()
  }

  private start() {
    const p = this.el.play()
    p?.catch((err: unknown) => {
      // A source that was replaced or paused before it started is not a failure.
      if ((err as { name?: string } | null)?.name !== 'AbortError' && this.armed) this.onFail()
    })
  }

  /** Inside a tap: lets the element speak later (after a page has turned) without another tap. */
  prime(url: string) {
    const el = this.el
    if (this.url !== url) {
      this.url = url
      el.src = url
    }
    this.armed = false
    el.muted = false
    el.play()?.catch(() => undefined)
    el.pause()
  }

  /** Has the browser fetch the next file while this one is read. */
  prefetch(url: string) {
    if (url === this.url || this.ahead?.src === url) return
    try {
      const a = this.ahead ?? new Audio()
      a.preload = 'auto'
      a.src = url
      this.ahead = a
    } catch {
      /* only a cache warm-up */
    }
  }

  pause() {
    this.seek = null
    this.el.pause()
  }
  get time() {
    return this.el.currentTime
  }
  get playing() {
    return !this.el.paused && !this.el.ended
  }
  state() {
    return { src: this.url, paused: this.el.paused, time: this.el.currentTime, muted: this.el.muted }
  }

  destroy() {
    this.url = ''
    this.el.pause()
    this.el.removeAttribute('src')
    this.el.load()
    if (this.ahead) {
      this.ahead.removeAttribute('src')
      this.ahead.load()
      this.ahead = null
    }
  }
}

/* ── Following the book ───────────────────────────────────────────────────────────────────────────── */

export interface NarrationHost {
  pages(): BookPage[] | null
  /** Reading position (page, or spread in a two-page book) and whether two pages show. */
  position(): number
  spread(): boolean
  /** Index of the first page behind the paywall (`Infinity`: none). */
  locked(): number
  turning(): boolean
  /** Turns one position forward, animated. False when the book would not turn. */
  turn(): boolean
  /** How many scenes the story has, and how many paragraphs a scene has. */
  scenes(): number
  paragraphs(scene: number): number
}

const GAP_PARA = 350
const GAP_SCENE = 600
/** The page starts to turn this long before the voice reaches the next page's first word. */
const LEAD = 0.2

export class Narration {
  on = false
  readonly voice = new Voice()
  private clip: Clip | null = null
  private marks: PageMark[] = []
  private marksFor: BookPage[] | null = null
  /** What to do once the paper is flat again. */
  private pending: (() => void) | null = null
  private timer = 0
  private raf = 0
  private run = 0

  constructor(
    private host: NarrationHost,
    private lang: Lang,
    private onChange: (on: boolean) => void,
  ) {
    this.voice.onEnded = () => this.ended()
    this.voice.onFail = () => this.stop()
    void loadIndex()
  }

  /** Must be called from the tap itself. Returns false when there is nothing to read where the book is open. */
  start(): boolean {
    if (this.on) return true
    const h = this.host
    const pages = h.pages()
    if (!pages) return false
    const locked = h.locked()
    const visible = pagesAt(h.position(), pages.length, h.spread()).filter((i) => i < locked)
    // The first page showing that has words on it; on the title page, the first scene (after turning to it).
    let from: number | null = visible.find((i) => pages[i].kind === 'scene' && pages[i].lines.length > 0) ?? null
    let scene: number
    if (from !== null) scene = pages[from].scene
    else if (visible.some((i) => pages[i].kind === 'title')) scene = 0
    else return false

    this.on = true
    const run = ++this.run
    this.onChange(true)
    const begin = (index: NarrationIndex | null) => {
      if (run !== this.run || !this.on) return
      const clips = clipsFor(index, this.lang, scene, h.paragraphs(scene))
      // The clip that reads the page's first line.
      const para = from !== null ? h.pages()?.[from]?.lines[0]?.para ?? 0 : 0
      const clip = clips.find((c) => c.paras.some((p) => p.para === para)) ?? clips.find((c) => c.paras[0].para > para)
      if (!clip) return this.stop()
      this.enter(clip, from)
    }
    if (indexNow && from !== null) begin(indexNow)
    else {
      // Not ready to speak in this very tap (the table is still on its way, or a page turns first): the element
      // is opened now, so it may speak a moment later.
      this.voice.prime(sceneFile(this.lang, scene))
      if (indexNow) begin(indexNow)
      else void loadIndex().then(begin)
    }
    return this.on
  }

  stop() {
    if (!this.on) return
    this.on = false
    this.run++
    this.pending = null
    this.clip = null
    window.clearTimeout(this.timer)
    cancelAnimationFrame(this.raf)
    this.voice.pause()
    this.onChange(false)
  }

  toggle() {
    if (this.on) this.stop()
    else this.start()
  }

  /** The host says the paper is flat again. */
  rested() {
    const p = this.pending
    this.pending = null
    if (this.on && p) p()
  }

  destroy() {
    this.stop()
    this.voice.destroy()
  }

  private marksOf(clip: Clip): PageMark[] {
    const pages = this.host.pages()
    if (!pages) return []
    if (this.marksFor !== pages || this.clip !== clip) this.marks = pageMarks(pages, clip)
    this.marksFor = pages
    return this.marks
  }

  /** Brings the book to where `clip` starts (or to `fromPage` inside it), then reads. */
  private enter(clip: Clip, fromPage: number | null = null) {
    const h = this.host
    this.clip = null
    const marks = pageMarks(h.pages() ?? [], clip)
    if (!marks.length) return this.after(clip)
    const first = (fromPage !== null && marks.find((m) => m.page === fromPage)) || marks[0]
    const need = positionOf(first.page, h.spread())
    const gate = first.page >= h.locked()
    if (need > h.position()) {
      // The paywall page is shown, and that is where the reading ends.
      this.pending = gate ? () => this.stop() : () => this.enter(clip, fromPage)
      if (!h.turn() && !h.turning()) this.stop()
      return
    }
    if (gate) return this.stop()
    this.clip = clip
    this.marksFor = null
    this.voice.play(clip.url, first.t)
    const next = clipsFor(indexNow, this.lang, clip.scene + 1, clip.scene + 1 < h.scenes() ? h.paragraphs(clip.scene + 1) : 0)[0]
    if (next && next.url !== clip.url) this.voice.prefetch(next.url)
    cancelAnimationFrame(this.raf)
    this.raf = requestAnimationFrame(this.tick)
  }

  /** While the voice reads: when it comes to the words of the next page, the page turns. */
  private tick = () => {
    if (!this.on || !this.clip) return
    this.raf = requestAnimationFrame(this.tick)
    const h = this.host
    if (h.turning() || !this.voice.playing) return
    const pos = h.position()
    const spread = h.spread()
    const next = this.marksOf(this.clip).find((m) => positionOf(m.page, spread) > pos)
    if (next && this.voice.time >= next.t - LEAD) h.turn()
  }

  private ended() {
    if (!this.on || !this.clip) return
    cancelAnimationFrame(this.raf)
    this.after(this.clip)
  }

  /** What follows `clip`: the scene's next file, the next scene, or the end of the book. */
  private after(clip: Clip) {
    const h = this.host
    this.clip = null
    const run = this.run
    const later = (ms: number, fn: () => void) => {
      window.clearTimeout(this.timer)
      this.timer = window.setTimeout(() => run === this.run && this.on && fn(), ms)
    }
    const same = clipsFor(indexNow, this.lang, clip.scene, h.paragraphs(clip.scene))
    const last = clip.paras[clip.paras.length - 1].para
    const nextHere = same.find((c) => c.paras[0].para > last)
    if (nextHere) return later(GAP_PARA, () => this.enter(nextHere))
    const scene = clip.scene + 1
    if (scene >= h.scenes()) {
      // The last words are read: the book turns to its end page and the voice rests.
      const close = () => {
        this.pending = () => this.stop()
        if (h.turn()) return
        if (h.turning()) this.pending = close // the paper is in the air: once it has landed
        else this.stop()
      }
      return later(GAP_SCENE, close)
    }
    const nextScene = clipsFor(indexNow, this.lang, scene, h.paragraphs(scene))[0]
    if (!nextScene) return this.stop()
    later(GAP_SCENE, () => this.enter(nextScene))
  }
}

/* ── React ────────────────────────────────────────────────────────────────────────────────────────── */

/**
 * One narrator for the life of the component. `host` is read through a ref, so it may be a new object on every
 * render; `onChange` is told when the voice starts and stops (to quieten other sound, for instance).
 */
export function useNarration(host: NarrationHost, lang: Lang, onChange?: (on: boolean) => void) {
  const [on, setOn] = useState(false)
  const hostRef = useRef(host)
  hostRef.current = host
  const changed = useRef(onChange)
  changed.current = onChange
  const ctl = useRef<Narration | null>(null)
  if (!ctl.current && typeof window !== 'undefined') {
    const live: NarrationHost = {
      pages: () => hostRef.current.pages(),
      position: () => hostRef.current.position(),
      spread: () => hostRef.current.spread(),
      locked: () => hostRef.current.locked(),
      turning: () => hostRef.current.turning(),
      turn: () => hostRef.current.turn(),
      scenes: () => hostRef.current.scenes(),
      paragraphs: (s) => hostRef.current.paragraphs(s),
    }
    ctl.current = new Narration(live, lang, (v) => {
      setOn(v)
      changed.current?.(v)
    })
  }
  useEffect(() => {
    const c = ctl.current
    // A book put in a pocket stops reading.
    const hidden = () => document.hidden && c?.stop()
    document.addEventListener('visibilitychange', hidden)
    return () => {
      document.removeEventListener('visibilitychange', hidden)
      c?.destroy()
    }
  }, [])
  return { on, narration: ctl.current! }
}
