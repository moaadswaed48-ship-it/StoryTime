/**
 * Where a page's words sit over its picture: pure maths, no DOM, so it is unit-tested (tests/zone.test.ts).
 *
 * The page's `zone` (content/SCHEMA.md) names the calm area of the picture: a side ("start" = the reading side, so
 * right in Arabic and Hebrew, left otherwise; or "full" width), a height (top, middle, bottom) and a size. The words
 * are laid out there on a soft paper wash that fades into the art. Rules, in order:
 *   1. the type never drops below the age group's minimum size (times the reader's chosen text size);
 *   2. it starts at the age group's natural size for the page and shrinks toward that minimum only to keep the
 *      words inside the calm area;
 *   3. if the words still do not fit, the wash grows over more of the picture (a side column first becomes a
 *      full-width band), up to the whole page; only past that does the box scroll (`overflow`).
 * A side column narrower than about eleven characters becomes a full-width band (phones in portrait).
 */
import type { AgeGroup, PageZone } from '@/data/types'
import { wrap } from './layout'

/** Width of a run of text at a type size (CSS px), in the reader's font. */
export type MeasureAt = (text: string, fontPx: number) => number
export type Script = 'arabic' | 'hebrew' | 'latin'

/** The smallest type each age group may see (CSS px, before the reader's own text-size choice). */
export const MIN_FONT: Record<AgeGroup, number> = { '2-3': 24, '4-5': 22, '6-8': 19 }
/** Natural size as a share of the page width, and its ceiling. */
const NATURAL: Record<AgeGroup, [number, number]> = { '2-3': [0.07, 36], '4-5': [0.06, 32], '6-8': [0.05, 27] }
/** The reader's text-size steps (multipliers). Step 0 is the normal size. */
export const TEXT_SCALES = [1, 1.15, 1.3, 1.5] as const

const LINE: Record<Script, number> = { arabic: 1.8, hebrew: 1.55, latin: 1.45 }
const COLUMN: Record<PageZone['size'], number> = { s: 0.42, m: 0.52, l: 0.62 }
const BAND_MAX: Record<PageZone['size'], number> = { s: 0.3, m: 0.42, l: 0.56 }
const COLUMN_MAX: Record<PageZone['size'], number> = { s: 0.5, m: 0.66, l: 0.82 }
export const FALLBACK_ZONE: PageZone = { side: 'full', v: 'bottom', size: 'm' }

export const scriptOf = (lang: string): Script => (lang === 'ar' ? 'arabic' : lang === 'he' ? 'hebrew' : 'latin')

export type ZoneInput = {
  pageW: number
  pageH: number
  zone: PageZone | null
  rtl: boolean
  group: AgeGroup
  /** Index into TEXT_SCALES. */
  scale: number
  script: Script
  text: string
  measure: MeasureAt
  /** Room kept free at the top and bottom of the page (CSS px), e.g. for a page number. */
  insetTop?: number
  insetBottom?: number
}

export type Rect = { x: number; y: number; w: number; h: number }

export type ZoneLayout = {
  /** The text box (its padding included), in page CSS px. */
  box: Rect
  padX: number
  padY: number
  fontSize: number
  lineHeight: number
  lines: string[]
  /** "band": full page width; "column": a side column. */
  kind: 'band' | 'column'
  /** The physical side of a column (after mirroring); "full" for a band. */
  side: 'left' | 'right' | 'full'
  v: PageZone['v']
  /** The paper wash: the box grown by `fade` on every side, where it fades to nothing. */
  wash: Rect
  fade: number
  /** True only when even the whole page at the minimum size cannot hold the words: the box then scrolls. */
  overflow: boolean
  /** The smallest size this page was allowed to use. */
  minFont: number
}

const round = (v: number) => Math.round(v)

export function layoutZone(i: ZoneInput): ZoneLayout {
  const zone = i.zone ?? FALLBACK_ZONE
  const scale = TEXT_SCALES[Math.min(TEXT_SCALES.length - 1, Math.max(0, i.scale))]!
  const min = MIN_FONT[i.group]
  const [share, cap] = NATURAL[i.group]
  const natural = Math.max(min, Math.min(cap, i.pageW * share))
  const start = natural * scale
  const floor = min * scale
  const margin = round(Math.min(40, Math.max(12, i.pageW * 0.045)))
  const top = margin + (i.insetTop ?? 0)
  const bottom = margin + (i.insetBottom ?? 0)
  const hardMax = i.pageH - top - bottom
  const physLeft = zone.side === 'start' ? !i.rtl : zone.side === 'end' ? i.rtl : false

  const fit = (kind: 'band' | 'column', font: number) => {
    const lineHeight = round(font * LINE[i.script])
    const padY = round(font * 0.55)
    const w = kind === 'band' ? i.pageW - 2 * margin : round(i.pageW * COLUMN[zone.size] - margin)
    // Words are never split. One long word (b11's "Boom-boom-boom-boom." on a 320 px phone at the larger text size)
    // takes the room it needs from the side padding, down to a third of it, instead of running past the wash.
    let padX = round(font * 0.8)
    const longest = Math.max(0, ...i.text.split(/\s+/).filter(Boolean).map((word) => i.measure(word, font)))
    if (longest > w - 2 * padX) padX = Math.max(round(font * 0.25), Math.floor((w - longest) / 2))
    const inner = w - 2 * padX
    const lines = wrap(i.text, inner, (s) => i.measure(s, font))
    const h = lines.length * lineHeight + 2 * padY
    return { kind, font, lineHeight, padX, padY, w, inner, lines, h }
  }
  const columnOk = (font: number) => i.pageW * COLUMN[zone.size] - margin - 2 * round(font * 0.8) >= font * 11
  const kinds: ('band' | 'column')[] = zone.side !== 'full' ? ['column', 'band'] : ['band']

  // Try the calm area first (shrinking toward the floor), then let it grow up to the whole page.
  let chosen: ReturnType<typeof fit> | null = null
  for (const limit of ['zone', 'page'] as const) {
    for (const kind of kinds) {
      const maxH = limit === 'page' ? hardMax : Math.min(hardMax, i.pageH * (kind === 'band' ? BAND_MAX : COLUMN_MAX)[zone.size])
      for (let font = start; font >= floor - 0.01; font -= 0.5) {
        if (kind === 'column' && !columnOk(font)) break
        const f = fit(kind, Math.max(floor, font))
        if (f.h <= maxH) {
          chosen = f
          break
        }
      }
      if (chosen) break
    }
    if (chosen) break
  }
  const overflow = !chosen
  if (!chosen) chosen = fit('band', floor)
  const h = Math.min(chosen.h, hardMax)

  const kind = chosen.kind
  const x = kind === 'band' ? margin : physLeft ? margin : i.pageW - margin - chosen.w
  const y = zone.v === 'top' ? top : zone.v === 'bottom' ? i.pageH - bottom - h : Math.max(top, round((i.pageH - h) / 2))
  const box = { x, y, w: chosen.w, h }
  const fade = round(chosen.font * 1.6)
  // A band reaches past the page's sides (and past the edge it sits on), so only the side toward the art fades.
  const wash = kind === 'band'
    ? {
        x: -fade,
        w: i.pageW + 2 * fade,
        y: zone.v === 'top' ? -fade : y - fade,
        h: zone.v === 'top' ? y + h + 2 * fade : zone.v === 'bottom' ? i.pageH - y + 2 * fade : h + 2 * fade,
      }
    : { x: x - fade, y: y - fade, w: chosen.w + 2 * fade, h: h + 2 * fade }
  return {
    box,
    padX: chosen.padX,
    padY: chosen.padY,
    fontSize: chosen.font,
    lineHeight: chosen.lineHeight,
    lines: chosen.lines,
    kind,
    side: kind === 'band' ? 'full' : physLeft ? 'left' : 'right',
    v: zone.v,
    wash,
    fade,
    overflow,
    minFont: floor,
  }
}
