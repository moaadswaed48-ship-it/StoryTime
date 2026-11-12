/**
 * Page layout for the reader: pure functions, no DOM. Given the size of the screen and a way to measure
 * a run of text, they decide where the page sits, how big the type is, how the author's paragraphs break
 * into lines and pages, and which page a scene starts on. The text itself is never altered: it is only
 * split at the spaces that are already there.
 */

export type Measure = (text: string) => number

export interface Stage {
  /** Two pages side by side, or one. */
  spread: boolean
  pageW: number
  pageH: number
  /** Top-left corner of the first (or only) page's box on the stage; the spread is `2 × pageW` wide. */
  left: number
  top: number
  /** True when the page covers the whole screen (phones): no stage shows around it. */
  full: boolean
}

/** Where the book sits on a screen of `w × h` CSS px. */
export function stageFor(w: number, h: number): Stage {
  const spread = w >= 600 && w / h >= 1.15
  if (spread) {
    const padX = Math.round(Math.min(88, Math.max(56, w * 0.05)))
    // Air above and below: a lifted corner has somewhere to go without leaving the window.
    const padY = Math.round(Math.min(38, Math.max(12, h * 0.036)))
    let pageH = Math.min(940, h - 2 * padY)
    // A phone on its side is short: its pages may be as wide as they are tall, so the text keeps some room.
    let pageW = Math.floor(Math.min((w - 2 * padX) / 2, pageH * (pageH < 520 ? 1 : 0.8)))
    // A very wide, short window: keep the page from becoming a letterbox.
    pageH = Math.round(Math.min(pageH, pageW / 0.6))
    pageW = Math.round(pageW)
    return { spread, pageW, pageH, left: Math.round(w / 2 - pageW), top: Math.round((h - pageH) / 2), full: false }
  }
  // One page. On a phone it is the screen; on a wide, short window it keeps a page's proportions.
  if (w <= h * 0.9) return { spread, pageW: w, pageH: h, left: 0, top: 0, full: true }
  const padY = Math.round(Math.min(26, Math.max(10, h * 0.025)))
  const pageH = h - 2 * padY
  const pageW = Math.round(Math.min(w - 24, pageH * 0.8))
  return { spread, pageW, pageH, left: Math.round((w - pageW) / 2), top: padY, full: false }
}

export interface PageGeometry {
  pageW: number
  pageH: number
  /** Side margins of the text column. */
  marginX: number
  /** Height of the painting at the top of a scene's first page (full width). */
  pictureH: number
  /** Top of the text on a page with a painting, and on a page without. */
  textTop: number
  plainTop: number
  /** Bottom edge of the text area (the page number sits below it). */
  textBottom: number
  fontSize: number
  lineHeight: number
  paraGap: number
  /** Baseline and size of the page number. */
  folioY: number
  folioSize: number
}

/** Text sizes the reader offers, as multiples of the page's natural size. */
export const SIZE_STEPS = [0.84, 1, 1.18, 1.38, 1.6] as const
export const DEFAULT_SIZE = 1

export interface TypeOptions {
  /** Index into SIZE_STEPS. */
  size: number
  /** Latin text sets smaller and tighter than Arabic. */
  arabic: boolean
  /** Classroom mode: the page is read from across a room. */
  classroom?: boolean
  insetTop?: number
  insetBottom?: number
}

/** Margins, type size and text areas for a page of `pageW × pageH`. */
export function geometryFor(pageW: number, pageH: number, o: TypeOptions): PageGeometry {
  const step = SIZE_STEPS[Math.min(SIZE_STEPS.length - 1, Math.max(0, o.size))]
  // The type follows the page's width, but a short page gets smaller type so a scene still fits beside its painting.
  const natural = o.arabic ? Math.min(25, Math.max(19.5, Math.min(pageW * 0.054, pageH / 35))) : Math.min(23, Math.max(17, Math.min(pageW * 0.046, pageH / 40)))
  const fontSize = Math.round(natural * step * (o.classroom ? 1.3 : 1) * 2) / 2
  // Arabic carries marks above and below the line and needs air; Latin serif is happy tighter.
  const lineHeight = Math.round(fontSize * (o.arabic ? 1.86 : 1.56))
  // Half a line between paragraphs: lines on facing pages stay level, or exactly half a line apart.
  const paraGap = Math.round(lineHeight / 2)
  // Comfortable margins, and never a line longer than about thirty times the type size.
  const marginX = Math.round(Math.max(Math.min(64, Math.max(24, pageW * 0.078)), (pageW - natural * 31) / 2))
  // The painting is 16:9 across the full page width, but never more than 46 % of a short page.
  const pictureH = Math.round(Math.min((pageW * 9) / 16, pageH * 0.46))
  const insetTop = o.insetTop ?? 0
  const insetBottom = o.insetBottom ?? 0
  const folio = Math.round(Math.max(40, pageH * 0.062)) + insetBottom
  const textTop = pictureH + Math.round(lineHeight * 0.62)
  // Pages without a painting start near the top, on the same grid of lines as the pages with one,
  // so the lines of two facing pages sit level with each other.
  const highest = Math.round(Math.max(54, pageH * 0.09)) + insetTop
  const plainTop = textTop - Math.max(0, Math.floor((textTop - highest) / lineHeight)) * lineHeight
  return {
    pageW,
    pageH,
    marginX,
    pictureH,
    textTop,
    plainTop,
    textBottom: pageH - folio,
    fontSize,
    lineHeight,
    paraGap,
    folioY: pageH - insetBottom - Math.round(folio - insetBottom) * 0.42,
    folioSize: Math.min(15, Math.max(12.5, pageW * 0.023)),
  }
}

/** A dash that opens a line of dialogue stays with the word it introduces (never alone at the end of a line). */
function units(text: string): string[] {
  const out: string[] = []
  let lead = ''
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (/^[-–—]$/.test(word)) lead += `${word} `
    else {
      out.push(lead + word)
      lead = ''
    }
  }
  if (lead) out.push(lead.trimEnd())
  return out
}

/** Breaks one paragraph into lines no wider than `maxW`. Words are kept whole; nothing is added or removed. */
export function wrap(text: string, maxW: number, measure: Measure): string[] {
  const words = units(text)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const tryLine = line ? `${line} ${word}` : word
    if (line && measure(tryLine) > maxW) {
      lines.push(line)
      line = word
    } else line = tryLine
  }
  if (line) lines.push(line)
  return lines
}

/**
 * Breaks a short heading into at most `maxLines` lines of similar length (so a title never leaves one
 * word alone on its last line).
 */
export function wrapBalanced(text: string, maxW: number, measure: Measure, maxLines = 3): string[] {
  const greedy = wrap(text, maxW, measure)
  if (greedy.length <= 1) return greedy
  const words = text.split(/\s+/).filter(Boolean)
  const n = Math.min(maxLines, greedy.length)
  let best = greedy
  let bestScore = Infinity
  // Try every way of cutting the words into n runs (titles are short, so this is cheap).
  const cut = (start: number, left: number, acc: string[]) => {
    if (left === 1) {
      const last = words.slice(start).join(' ')
      const all = [...acc, last]
      const widths = all.map(measure)
      if (widths.some((x) => x > maxW)) return
      const score = Math.max(...widths) - Math.min(...widths)
      if (score < bestScore) {
        bestScore = score
        best = all
      }
      return
    }
    for (let end = start + 1; end <= words.length - (left - 1); end++) cut(end, left - 1, [...acc, words.slice(start, end).join(' ')])
  }
  if (words.length <= 14) cut(0, n, [])
  return best
}

export interface PlacedLine {
  text: string
  /** Top of the line's box, measured from the top of the text area. */
  y: number
  /** Index of the paragraph it belongs to, and whether it opens that paragraph. */
  para: number
  opens: boolean
}

export interface TextPage {
  lines: PlacedLine[]
  /** Height the lines take up. */
  height: number
}

/**
 * Pours paragraphs into pages. The first page has `firstH` of room (it shares the page with the painting),
 * the following ones `restH`. A paragraph is not left with one line stranded at the foot or the head of a
 * page when that can be avoided.
 */
export function flow(paragraphs: string[], width: number, firstH: number, restH: number, lineHeight: number, paraGap: number, measure: Measure): TextPage[] {
  const pages: TextPage[] = [{ lines: [], height: 0 }]
  let y = 0
  const room = () => (pages.length === 1 ? firstH : restH)
  const fits = (from: number) => Math.max(0, Math.floor((room() - from + 0.5) / lineHeight))
  const newPage = () => {
    pages.push({ lines: [], height: 0 })
    y = 0
  }
  paragraphs.forEach((text, para) => {
    const lines = wrap(text, width, measure)
    if (!lines.length) return
    let i = 0
    while (i < lines.length) {
      const page = pages[pages.length - 1]
      const atTop = page.lines.length === 0
      const startY = i === 0 && !atTop ? y + paraGap : y
      const rest = lines.length - i
      let take = Math.min(rest, fits(startY))
      if (take < rest) {
        // The paragraph does not fit. If it fits whole on the next page, it goes there whole (pages break between
        // paragraphs when they can); otherwise it is split, never leaving one line stranded at a foot or a head.
        if (!atTop && i === 0 && rest * lineHeight <= restH + 0.5) take = 0
        else {
          if (rest - take === 1 && take >= 3) take -= 1
          if (!atTop && i === 0 && take === 1) take = 0
        }
      }
      if (take <= 0) {
        if (atTop) take = 1 // a page that cannot hold even one line still shows one, so the text never stalls
        else {
          newPage()
          continue
        }
      }
      let ly = startY
      for (let k = 0; k < take; k++) {
        page.lines.push({ text: lines[i + k], y: ly, para, opens: i + k === 0 })
        ly += lineHeight
      }
      y = ly
      page.height = y
      i += take
      if (i < lines.length) newPage()
    }
  })
  return pages
}

export type PageKind = 'title' | 'scene' | 'end' | 'blank'

export interface BookPage {
  kind: PageKind
  /** Scene the page belongs to (title page: 0; end and blank pages: the last scene). */
  scene: number
  /** For scene pages: which page of the scene this is, and how many the scene takes. */
  part: number
  parts: number
  /** The page carries the scene's painting. */
  picture: boolean
  lines: PlacedLine[]
  textHeight: number
  /** Printed page number (1-based). */
  number: number
}

/**
 * The whole book as a list of pages: a title page, the scenes (each starts on a new page with its painting;
 * long scenes continue on plain pages), and an end page. In a two-page book a blank page is added if needed
 * so the last spread is complete.
 */
export function buildBook(scenes: string[][], g: PageGeometry, measure: Measure, spread: boolean): BookPage[] {
  const pages: BookPage[] = [{ kind: 'title', scene: 0, part: 0, parts: 1, picture: true, lines: [], textHeight: 0, number: 1 }]
  const width = g.pageW - 2 * g.marginX
  const firstH = g.textBottom - g.textTop
  const restH = g.textBottom - g.plainTop
  scenes.forEach((paragraphs, scene) => {
    let parts = flow(paragraphs, width, firstH, restH, g.lineHeight, g.paraGap, measure)
    // A scene that runs over by a line or two is kept on its page by closing up the space between its
    // paragraphs a little, rather than left with a nearly empty page of its own.
    if (parts.length === 2 && parts[1].lines.length <= 2) {
      const tight = flow(paragraphs, width, firstH, restH, g.lineHeight, Math.round(g.paraGap * 0.4), measure)
      if (tight.length === 1) parts = tight
    }
    parts.forEach((p, part) => pages.push({ kind: 'scene', scene, part, parts: parts.length, picture: part === 0, lines: p.lines, textHeight: p.height, number: pages.length + 1 }))
  })
  const last = Math.max(0, scenes.length - 1)
  pages.push({ kind: 'end', scene: last, part: 0, parts: 1, picture: false, lines: [], textHeight: 0, number: pages.length + 1 })
  if (spread && pages.length % 2) pages.push({ kind: 'blank', scene: last, part: 0, parts: 1, picture: false, lines: [], textHeight: 0, number: pages.length + 1 })
  return pages
}

/** Index of the page a scene starts on. */
export function pageOfScene(pages: BookPage[], scene: number): number {
  const i = pages.findIndex((p) => p.kind === 'scene' && p.scene === scene && p.part === 0)
  return i < 0 ? 0 : i
}
export const endPage = (pages: BookPage[]) => pages.findIndex((p) => p.kind === 'end')

/** Reading position (page in a one-page book, spread in a two-page book) that shows page `index`. */
export const positionOf = (index: number, spread: boolean) => (spread ? Math.floor(index / 2) : index)
/** Pages shown at a position, in reading order. */
export const pagesAt = (position: number, count: number, spread: boolean): number[] => (spread ? [position * 2, position * 2 + 1].filter((i) => i < count) : [position])

/**
 * After the pages are re-flowed (text size, rotation), finds the page that continues the reading:
 * the same scene, as far through it as before.
 */
export function relocate(before: BookPage | undefined, after: BookPage[]): number {
  if (!before) return 0
  if (before.kind === 'title') return 0
  if (before.kind === 'end' || before.kind === 'blank') return Math.max(0, endPage(after))
  const first = pageOfScene(after, before.scene)
  const parts = after[first]?.parts ?? 1
  const through = before.parts > 1 ? before.part / (before.parts - 1) : 0
  return first + Math.round(through * (parts - 1))
}

/** First page that is locked while the visitor is not logged in: the first page of the first paid scene. */
export function lockedFrom(pages: BookPage[], freeScenes: number, loggedIn: boolean): number {
  if (loggedIn) return Infinity
  const i = pages.findIndex((p) => p.kind === 'scene' && p.scene === freeScenes && p.part === 0)
  return i < 0 ? Infinity : i
}
