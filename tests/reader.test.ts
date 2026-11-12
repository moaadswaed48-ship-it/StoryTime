import { describe, expect, it } from 'vitest'
import { story } from '@/content/story'
import {
  SIZE_STEPS,
  buildBook,
  endPage,
  flow,
  geometryFor,
  lockedFrom,
  pageOfScene,
  pagesAt,
  positionOf,
  relocate,
  stageFor,
  wrap,
  wrapBalanced,
  type Measure,
} from '@/features/reader/layout'
import { baseRadius, carry, constrain, edgeAngle, follow, gripY, progressOf, solve } from '@/features/reader/curl/geometry'

/** A stand-in for the browser's text measurement: every character is `em` wide. */
const mono =
  (em = 10): Measure =>
  (text) =>
    [...text].length * em
const norm = (s: string) => s.split(/\s+/).filter(Boolean).join(' ')
const arabic = story.scenes.map((s) => s.ar)
const english = story.scenes.map((s) => s.en)

describe('wrap', () => {
  it('keeps every word whole and in order', () => {
    const text = arabic[0][0]
    const lines = wrap(text, 300, mono())
    expect(lines.join(' ')).toBe(norm(text))
    for (const l of lines) expect(mono()(l)).toBeLessThanOrEqual(300)
  })
  it('gives an over-long word its own line instead of splitting it', () => {
    const lines = wrap('aa bbbbbbbbbbbbbbbbbbbbbbbb cc', 100, mono())
    expect(lines).toEqual(['aa', 'bbbbbbbbbbbbbbbbbbbbbbbb', 'cc'])
  })
  it('keeps the dash of a line of dialogue with the words it introduces', () => {
    const text = 'ابتسمت المعلّمة وقالت: - "شكرًا لكما'
    for (let w = 60; w <= 400; w += 10) {
      const lines = wrap(text, w, mono())
      expect(lines.join(' ')).toBe(text)
      for (const l of lines) expect(l.endsWith('-')).toBe(false)
    }
    expect(wrap('- واو', 1000, mono())).toEqual(['- واو'])
  })
  it('balances a title so no word is left alone', () => {
    const title = story.title.ar
    const lines = wrapBalanced(title, 200, mono(), 2)
    expect(lines.join(' ')).toBe(title)
    expect(lines).toHaveLength(2)
    const widths = lines.map(mono())
    expect(Math.abs(widths[0] - widths[1])).toBeLessThanOrEqual(60)
  })
})

describe('flow', () => {
  const lh = 40
  const gap = 16
  it('never puts more on a page than it holds, and loses nothing', () => {
    for (const paragraphs of arabic) {
      const pages = flow(paragraphs, 320, 300, 640, lh, gap, mono())
      pages.forEach((p, i) => expect(p.height).toBeLessThanOrEqual((i === 0 ? 300 : 640) + 0.5))
      const lines = pages.flatMap((p) => p.lines)
      paragraphs.forEach((text, para) =>
        expect(
          lines
            .filter((l) => l.para === para)
            .map((l) => l.text)
            .join(' '),
        ).toBe(norm(text)),
      )
      // paragraphs stay in order across pages
      expect(lines.map((l) => l.para)).toEqual([...lines.map((l) => l.para)].sort((a, b) => a - b))
    }
  })
  it('sends a paragraph that does not fit to the next page whole', () => {
    const a = 'one two three four five six seven eight nine ten'
    const b = 'alpha beta gamma delta epsilon zeta eta theta iota kappa'
    // 100px wide, 10px per character: paragraph a takes 5 lines, b takes 6.
    const pages = flow([a, b], 100, 7 * lh, 10 * lh, lh, gap, mono())
    expect(pages).toHaveLength(2)
    expect(pages[0].lines.every((l) => l.para === 0)).toBe(true)
    expect(pages[1].lines.every((l) => l.para === 1)).toBe(true)
    expect(pages[1].lines[0].y).toBe(0)
  })
  it('does not strand a single line when a paragraph must be split', () => {
    const long = Array.from({ length: 60 }, (_, i) => `w${i}`).join(' ')
    const pages = flow([long], 100, 4 * lh, 4 * lh, lh, gap, mono())
    expect(pages.length).toBeGreaterThan(1)
    expect(pages[pages.length - 1].lines.length).toBeGreaterThan(1)
  })
  it('still moves on when a page cannot hold a line', () => {
    const pages = flow(['a b c'], 10, 5, 5, lh, gap, mono())
    expect(pages.flatMap((p) => p.lines.map((l) => l.text))).toEqual(['a', 'b', 'c'])
  })
})

describe('page geometry', () => {
  it('grows the type with each size step and in classroom mode', () => {
    const sizes = SIZE_STEPS.map((_, size) => geometryFor(390, 844, { size, arabic: true }).fontSize)
    for (let i = 1; i < sizes.length; i++) expect(sizes[i]).toBeGreaterThan(sizes[i - 1])
    expect(geometryFor(390, 844, { size: 1, arabic: true, classroom: true }).fontSize).toBeGreaterThan(sizes[1])
  })
  it('gives Arabic generous line height and keeps the text inside the page', () => {
    for (const [w, h] of [
      [390, 844],
      [320, 568],
      [648, 846],
      [768, 1024],
    ]) {
      const g = geometryFor(w, h, { size: 1, arabic: true })
      expect(g.lineHeight / g.fontSize).toBeGreaterThanOrEqual(1.8)
      expect(g.marginX).toBeGreaterThanOrEqual(24)
      expect(g.textTop).toBeGreaterThan(g.pictureH)
      expect(g.textBottom).toBeGreaterThan(g.textTop + g.lineHeight * 2)
      expect(g.folioY).toBeGreaterThan(g.textBottom)
      expect(g.folioY).toBeLessThan(h)
    }
  })
  it('makes room for a notch and a home indicator', () => {
    const plain = geometryFor(390, 844, { size: 1, arabic: true })
    const safe = geometryFor(390, 844, { size: 1, arabic: true, insetTop: 47, insetBottom: 34 })
    expect(safe.plainTop).toBeGreaterThanOrEqual(Math.round(844 * 0.09) + 47)
    expect(plain.plainTop).toBeLessThan(safe.plainTop)
    expect(safe.textBottom).toBe(plain.textBottom - 34)
  })
  it('sets pages with and without a painting on one grid of lines', () => {
    for (const size of [0, 1, 2, 3, 4]) {
      const g = geometryFor(648, 846, { size, arabic: true })
      expect((g.textTop - g.plainTop) % g.lineHeight).toBe(0)
      expect(g.plainTop).toBeGreaterThanOrEqual(54)
      expect(g.plainTop).toBeLessThan(54 + 846 * 0.09 + g.lineHeight)
    }
  })
})

describe('stage', () => {
  it('shows one page that fills an upright phone', () => {
    expect(stageFor(390, 844)).toMatchObject({ spread: false, full: true, pageW: 390, pageH: 844, left: 0, top: 0 })
  })
  it('shows an open book on a wide screen, inside the screen', () => {
    for (const [w, h] of [
      [1440, 900],
      [1280, 720],
      [1920, 1080],
      [1024, 768],
    ]) {
      const s = stageFor(w, h)
      expect(s.spread).toBe(true)
      expect(s.left).toBeGreaterThanOrEqual(40)
      expect(s.left + 2 * s.pageW).toBeLessThanOrEqual(w - 40)
      expect(s.top).toBeGreaterThanOrEqual(0)
      expect(s.top + s.pageH).toBeLessThanOrEqual(h)
    }
  })
  it('shows one page on an upright tablet', () => {
    expect(stageFor(768, 1024).spread).toBe(false)
  })
})

describe('the book', () => {
  const build = (w: number, h: number, size: number, spread: boolean, texts = arabic) => {
    const g = geometryFor(w, h, { size, arabic: texts === arabic })
    return buildBook(texts, g, mono(g.fontSize * 0.5), spread)
  }
  it('opens on a title page and closes on an end page', () => {
    const pages = build(390, 844, 1, false)
    expect(pages[0].kind).toBe('title')
    expect(pages[pages.length - 1].kind).toBe('end')
    expect(pages.map((p) => p.number)).toEqual(pages.map((_, i) => i + 1))
  })
  it('prints every scene, word for word, starting each on a page with its painting', () => {
    for (const [texts, size] of [
      [arabic, 0],
      [arabic, 4],
      [english, 2],
    ] as const) {
      const pages = build(390, 844, size, false, texts)
      texts.forEach((paragraphs, scene) => {
        const mine = pages.filter((p) => p.kind === 'scene' && p.scene === scene)
        expect(mine.length).toBeGreaterThan(0)
        expect(mine[0].picture).toBe(true)
        expect(mine.slice(1).every((p) => !p.picture)).toBe(true)
        expect(mine.map((p) => p.part)).toEqual(mine.map((_, i) => i))
        const lines = mine.flatMap((p) => p.lines)
        paragraphs.forEach((text, para) =>
          expect(
            lines
              .filter((l) => l.para === para)
              .map((l) => l.text)
              .join(' '),
          ).toBe(norm(text)),
        )
      })
    }
  })
  it('takes more pages when the type is larger', () => {
    expect(build(390, 844, 4, false).length).toBeGreaterThan(build(390, 844, 0, false).length)
  })
  it('completes the last spread of a two-page book', () => {
    for (const size of [0, 1, 2, 3, 4]) expect(build(648, 846, size, true).length % 2).toBe(0)
  })
  it('finds scenes, the end, and the pages of a position', () => {
    const pages = build(648, 846, 1, true)
    story.scenes.forEach((_, scene) => expect(pages[pageOfScene(pages, scene)]).toMatchObject({ kind: 'scene', scene, part: 0 }))
    expect(pages[endPage(pages)].kind).toBe('end')
    expect(positionOf(5, true)).toBe(2)
    expect(positionOf(5, false)).toBe(5)
    expect(pagesAt(2, pages.length, true)).toEqual([4, 5])
    expect(pagesAt(2, 5, true)).toEqual([4])
    expect(pagesAt(3, pages.length, false)).toEqual([3])
  })
  it('locks everything from the fifth scene on until the visitor logs in', () => {
    const pages = build(390, 844, 1, false)
    const from = lockedFrom(pages, 4, false)
    expect(pages[from]).toMatchObject({ kind: 'scene', scene: 4, part: 0 })
    expect(pages.slice(0, from).every((p) => p.kind === 'title' || p.scene < 4)).toBe(true)
    expect(lockedFrom(pages, 4, true)).toBe(Infinity)
  })
  it('keeps the reader in the same scene when the pages are re-flowed', () => {
    const small = build(390, 844, 0, false)
    const large = build(390, 844, 4, false)
    for (const page of small) {
      const to = large[relocate(page, large)]
      if (page.kind === 'scene') expect(to).toMatchObject({ kind: 'scene', scene: page.scene })
      else expect(to.kind).toBe(page.kind === 'blank' ? 'end' : page.kind)
    }
    expect(relocate(undefined, large)).toBe(0)
  })
})

describe('curl geometry', () => {
  const w = 400
  const h = 800
  const R = baseRadius(w)
  const poses: [number, number, number][] = [
    [390, 400, 400],
    [300, 380, 400],
    [150, 300, 400],
    [0, 400, 400],
    [-200, 420, 400],
    [-395, 400, 400],
    [250, 500, 760],
    [100, 200, 60],
  ]
  it('finds how far round the roll the edge has climbed', () => {
    for (const k of [0.001, 0.1, 1, 2, 3, Math.PI]) {
      const phi = edgeAngle(k)
      expect(phi - Math.sin(phi)).toBeCloseTo(k, 4)
    }
    expect(edgeAngle(0)).toBe(0)
    expect(edgeAngle(9)).toBe(Math.PI)
  })
  it('is flat when the edge has not moved', () => {
    const c = solve({ x: w, y: 300 }, 300, w, h)
    expect(carry({ x: w, y: 300 }, c)).toMatchObject({ x: w, y: 300, z: 0 })
  })
  it('puts the carried point of the edge where it was asked to be', () => {
    for (const [x, y, ay] of poses) {
      const p = constrain({ x, y }, ay, w, h, R)
      const c = solve(p, ay, w, h, R)
      const at = carry({ x: w, y: ay }, c)
      expect(at.x).toBeCloseTo(p.x, 1)
      expect(at.y).toBeCloseTo(p.y, 1)
    }
  })
  it('never lifts the binding', () => {
    for (const [x, y, ay] of poses) {
      const p = constrain({ x, y }, ay, w, h, R)
      const c = solve(p, ay, w, h, R)
      for (const sy of [0, h / 2, h]) expect(carry({ x: 0, y: sy }, c).z).toBe(0)
    }
  })
  it('keeps the roll round in the middle of a turn, however the corner is pulled', () => {
    for (const [x, y, ay] of [
      [200, -300, 760],
      [100, 1200, 60],
      [0, 0, 700],
      [150, 900, 400],
    ]) {
      const p = constrain({ x, y }, ay, w, h, R)
      expect(solve(p, ay, w, h, R).r).toBeGreaterThan(R * 0.4)
    }
  })
  it('lands flat: the roll closes as the leaf reaches the other side', () => {
    const c = solve({ x: -w, y: 400 }, 400, w, h, R)
    expect(c.r).toBeLessThan(0.5)
    const edge = carry({ x: w, y: 400 }, c)
    expect(edge.x).toBeCloseTo(-w, 0)
    expect(edge.flipped).toBe(true)
  })
  it('keeps the paper within reach of the spine', () => {
    for (const [x, y, ay] of [
      [-900, 100, 400],
      [500, -400, 700],
      [0, 2000, 100],
    ]) {
      const p = constrain({ x, y }, ay, w, h)
      expect(Math.hypot(p.x, p.y)).toBeLessThanOrEqual(Math.hypot(w, ay) + 0.01)
      expect(Math.hypot(p.x, p.y - h)).toBeLessThanOrEqual(Math.hypot(w, h - ay) + 0.01)
    }
  })
  it('follows the finger: edge under it on a spread, roll under it on one page', () => {
    const finger = { x: 120, y: 400 }
    const two = follow(finger, 400, w, h, false, R)
    expect(two.x).toBeCloseTo(120, 3)
    const one = follow(finger, 400, w, h, true, R)
    const c = solve(one, 400, w, h, R)
    // the finger is on the roll: between its axis and its rim
    expect(finger.x).toBeGreaterThan(c.ox - c.r * 0.5)
    expect(finger.x).toBeLessThan(c.ox + c.r * 1.2)
    // and a finger at the bound edge has rolled the page up against the binding
    const end = solve(follow({ x: 0, y: 400 }, 400, w, h, true, R), 400, w, h, R)
    expect(end.ox + end.r).toBeLessThan(w * 0.3)
    expect(progressOf(follow({ x: 0, y: 400 }, 400, w, h, true, R), w)).toBeGreaterThan(0.65)
  })
  it('takes the page by its corner when it is held low or high, and straight in the middle', () => {
    expect(gripY(400, h)).toBe(400)
    expect(gripY(760, h)).toBeGreaterThan(760)
    expect(gripY(40, h)).toBeLessThan(40)
    expect(gripY(790, h)).toBeLessThanOrEqual(h)
  })
})
