import { expect, test, type Page } from '@playwright/test'
import { pageUrl } from './_url'
import { scrollToY, waitForHook, watchConsole } from './helpers'

const store = (page: Page) => page.evaluate(() => {
  const s = window.__st!.store.getState()
  return { overlay: s.overlay as string | null, scene: s.startScene as number }
})
const closeOverlay = (page: Page) => page.evaluate(() => window.__st!.store.getState().closeOverlay())

/** The entrance moves things with transforms; wait until it has finished and released them. */
const settled = (page: Page) => expect(page.locator('#top')).not.toHaveAttribute('data-phase', /.+/, { timeout: 30_000 })

/** After a resize: the solver has framed the film for the size the hero has now. */
const framed = (page: Page) =>
  page.waitForFunction(() => {
    const f = window.__st!.hero.frame()
    const el = document.querySelector<HTMLElement>('#top')!
    return !!f && f.for.w === el.clientWidth && f.for.h === el.clientHeight && el.dataset.layout === f.mode && window.__st!.hero.clear()
  }, null, { timeout: 30_000 })

/**
 * The two faces, measured by hand on the film (1920 × 1080, hair to chin, over the whole loop) — on purpose NOT the
 * solver's own boxes. They are projected through the rectangle the <video> really occupies on screen (zoom and
 * parallax included) and compared with the real boxes of every text block, pill and card of the hero.
 */
const FACES = [
  { name: 'Amir', x0: 985, y0: 495, x1: 1160, y1: 640 },
  { name: 'Sari', x0: 1370, y0: 422, x1: 1585, y1: 598 },
]
/** The same two faces on the cover painting (880 × 1168) that portrait phones get instead of the film — measured by hand as well. */
const COVER_FACES = [
  { name: 'Amir', x0: 168, y0: 606, x1: 318, y1: 742 },
  { name: 'Sari', x0: 444, y0: 634, x1: 588, y1: 750 },
]
/** Portrait phones (≤ 760px wide) show the cover painting; everything else shows the film. */
const wantsCover = (size: { width: number; height: number }) => size.width <= 760 && size.height >= size.width
const coveredFaces = (page: Page) =>
  page.evaluate(({ film, cover }) => {
    const hero = document.querySelector<HTMLElement>('#top')!
    const still = hero.querySelector('.hero-still')
    const faces = still ? cover : film
    const [pw, ph] = still ? [880, 1168] : [1920, 1080]
    const v = (still ?? hero.querySelector('.hero-plate video')!).getBoundingClientRect()
    const h = hero.getBoundingClientRect()
    const boxes = faces.map((f) => ({ name: f.name, l: v.left + (f.x0 / pw) * v.width, r: v.left + (f.x1 / pw) * v.width, t: v.top + (f.y0 / ph) * v.height, b: v.top + (f.y1 / ph) * v.height }))
    const hits: string[] = []
    for (const el of hero.querySelectorAll<HTMLElement>('[data-hero-ui]')) {
      const r = el.getBoundingClientRect()
      if (!r.width || getComputedStyle(el).visibility === 'hidden') continue
      for (const f of boxes) if (r.left < f.r && r.right > f.l && r.top < f.b && r.bottom > f.t) hits.push(`${(el.textContent ?? '').trim().slice(0, 30)} on ${f.name}`)
    }
    const inView = boxes.every((f) => f.l >= h.left && f.r <= h.right && f.t >= h.top && f.b <= h.bottom)
    return { hits, inView, cover: !!still, video: !!hero.querySelector('video'), layout: hero.dataset.layout ?? '', cards: [...hero.querySelectorAll('.hero-card')].filter((c) => getComputedStyle(c).visibility !== 'hidden').length }
  }, { film: FACES, cover: COVER_FACES })

/** Runs the face check at each size. */
async function checkSizes(page: Page, sizes: Array<{ width: number; height: number }>) {
  for (const size of sizes) {
    await page.setViewportSize(size)
    await settled(page)
    await framed(page)
    await page.waitForTimeout(300) // the frame is applied on the next paint
    const res = await coveredFaces(page)
    const at = `${size.width}×${size.height} (${res.layout})`
    expect(res.hits, at).toEqual([])
    expect(res.inView, `both faces in view at ${at}`).toBe(true)
    // portrait phones: the cover painting, no film element and no scene strip; everything else: the film and three cards
    expect(res.cover, `cover painting at ${at}`).toBe(wantsCover(size))
    expect(res.video, `film element at ${at}`).toBe(!wantsCover(size))
    expect(res.cards, `scene cards shown at ${at}`).toBe(wantsCover(size) ? 0 : 3)
  }
}

test.describe('hero', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(pageUrl('hero'))
    await waitForHook(page, 'hero')
    await scrollToY(page, '#top')
  })

  test('fills the first screen, shows the title and plays the film (portrait phones: the sharp cover, no film)', async ({ page }) => {
    const con = watchConsole(page)
    const hero = page.locator('#top')
    await settled(page)
    await expect(hero.locator('h1 .hero-title__a')).toBeVisible()
    await expect(hero.locator('h1 .hero-title__b')).toBeVisible()
    expect(((await hero.locator('h1').textContent()) ?? '').trim().length).toBeGreaterThan(8)
    const size = page.viewportSize()!
    const box = (await hero.boundingBox())!
    expect(box.width).toBeCloseTo(size.width, 0)
    expect(box.height).toBeGreaterThanOrEqual(Math.min(size.height, 640) - 1)
    expect(box.height).toBeLessThanOrEqual(Math.max(size.height, 640) + 1)
    if (wantsCover(size)) {
      // a still, not the film: one picture with twice the pixels it is drawn at, fetched first, and no film download
      await page.waitForFunction(() => window.__st!.hero.picture().loaded === true, null, { timeout: 45_000 })
      const pic = await page.evaluate(() => window.__st!.hero.picture())
      expect(pic.kind).toBe('cover')
      expect(pic.natural).toBe(pic.expect)
      expect(pic.natural / pic.width).toBeGreaterThanOrEqual(2)
      const img = hero.locator('.hero-still')
      await expect(img).toHaveAttribute('fetchpriority', 'high')
      await expect(img).toHaveAttribute('width', /\d+/)
      await expect(img).toHaveAttribute('height', /\d+/)
      await expect(hero.locator('video')).toHaveCount(0)
      await page.waitForTimeout(1200)
      expect(await page.evaluate(() => performance.getEntriesByType('resource').map((r) => r.name).filter((n) => /hero-(720|1080)\.mp4/.test(n)))).toEqual([])
    } else {
      await page.waitForFunction(() => { const f = window.__st!.hero.film(); return !!f && f.ready && f.playing && f.time > 0.15 }, null, { timeout: 45_000 })
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
    con.assertClean()
  })

  test('type, pills and scene cards never sit on the boys’ faces', async ({ page, isMobile }) => {
    // laptops, the three sizes the brief names, and landscape tablets (4:3 and wider), which get the tall layout
    await checkSizes(page, isMobile ? [page.viewportSize()!, { width: 390, height: 844 }] : [{ width: 1440, height: 900 }, { width: 820, height: 1180 }, { width: 390, height: 844 }, { width: 1280, height: 720 }, { width: 1024, height: 768 }, { width: 1112, height: 834 }, { width: 1180, height: 820 }])
  })

  test('the faces stay clear in English too', async ({ page, isMobile }) => {
    await page.goto(pageUrl('hero', '&lang=en'))
    await waitForHook(page, 'hero')
    await scrollToY(page, '#top')
    await checkSizes(page, isMobile ? [page.viewportSize()!] : [{ width: 1440, height: 900 }, { width: 1112, height: 834 }, { width: 390, height: 844 }])
  })

  test('pills and scene cards open the book and the film', async ({ page }) => {
    await settled(page)
    const hero = page.locator('#top')
    await hero.locator('.hero-actions button').nth(0).click()
    expect(await store(page)).toEqual({ overlay: 'book', scene: 0 })
    await closeOverlay(page)
    await hero.locator('.hero-actions button').nth(1).click()
    expect(await store(page)).toEqual({ overlay: 'film', scene: 0 })
    await closeOverlay(page)
    const scenes: number[] = await page.evaluate(() => window.__st!.hero.scenes)
    expect(scenes).toEqual([3, 5, 10])
    if (wantsCover(page.viewportSize()!)) return void (await expect(hero.locator('.hero-card')).toHaveCount(0)) // phones: no strip
    await expect(hero.locator('.hero-card')).toHaveCount(3)
    await hero.locator('.hero-card').nth(1).click()
    expect(await store(page)).toEqual({ overlay: 'film', scene: 5 })
    await closeOverlay(page)
  })

  test('a scene card plays its clip while hovered and rests when the film opens', async ({ page, isMobile }) => {
    test.skip(isMobile, 'hover is a mouse behaviour; phones show posters')
    await settled(page)
    const card = page.locator('#top .hero-card').nth(1)
    await card.hover()
    await page.waitForFunction(() => window.__st!.hero.cardPlaying(1), null, { timeout: 45_000 })
    await expect(card).toHaveAttribute('data-playing', '')
    await page.mouse.move(5, 5)
    await page.waitForFunction(() => !window.__st!.hero.cardPlaying(1), null, { timeout: 15_000 })
    // clicking a playing card opens the film: the card's clip must not keep running underneath
    await card.hover()
    await page.waitForFunction(() => window.__st!.hero.cardPlaying(1), null, { timeout: 45_000 })
    await card.click()
    expect((await store(page)).overlay).toBe('film')
    await page.waitForFunction(() => !window.__st!.hero.cardPlaying(1) && !window.__st!.hero.film().playing, null, { timeout: 15_000 })
    await expect(card).not.toHaveAttribute('data-playing', '')
    await closeOverlay(page)
  })

  test('the leaves answer a touch, and the type keeps its glass while the hero scrolls away', async ({ page }) => {
    await settled(page)
    // the wind: a press on the film scatters leaves from that point
    await page.waitForFunction(() => window.__st!.hero.wind()?.running === true, null, { timeout: 30_000 })
    const before: number = await page.evaluate(() => window.__st!.hero.wind().leaves)
    const size = page.viewportSize()!
    await page.locator('#top').dispatchEvent('pointerdown', { clientX: size.width * 0.5, clientY: size.height * 0.62, pointerType: 'mouse', bubbles: true })
    await page.waitForFunction((n) => window.__st!.hero.wind().leaves > n, before, { timeout: 15_000 })
    expect(await store(page)).toEqual({ overlay: null, scene: 0 })

    // leaving: every item of the stack fades by itself; the wrapper stays opaque, so the glass pill keeps its backdrop
    await page.evaluate(() => {
      const page = document.getElementById('page')
      if (page && document.documentElement.scrollHeight < window.innerHeight * 2) {
        const pad = document.createElement('div')
        pad.style.height = '150vh'
        page.appendChild(pad)
        window.__st?.lenis?.resize()
      }
    })
    await scrollToY(page, 120)
    await page.waitForFunction(() => parseFloat(getComputedStyle(document.querySelector('#top .hero-pill--watch')!).opacity) < 0.95, null, { timeout: 15_000 })
    const fade = await page.evaluate(() => {
      const css = (sel: string) => getComputedStyle(document.querySelector(sel)!)
      return { wrapper: css('#top .hero-stack').opacity, pill: parseFloat(css('#top .hero-pill--watch').opacity), blur: css('#top .hero-pill--watch').backdropFilter || css('#top .hero-pill--watch').getPropertyValue('-webkit-backdrop-filter') }
    })
    expect(fade.wrapper).toBe('1')
    expect(fade.pill).toBeGreaterThan(0)
    expect(fade.blur).toContain('blur')
    await scrollToY(page, 0)
  })

  test('reduced motion: everything is visible and the film rests on its first frame', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.reload()
    await waitForHook(page, 'hero')
    const hero = page.locator('#top')
    await expect(hero.locator('h1')).toBeVisible()
    await expect(hero.locator('.hero-sub')).toHaveCSS('opacity', '1')
    const cover = wantsCover(page.viewportSize()!)
    if (cover) await expect(hero.locator('.hero-still')).toBeVisible()
    else await expect(hero.locator('.hero-card').first()).toHaveCSS('opacity', '1')
    await page.waitForTimeout(800)
    expect(await page.evaluate(() => window.__st!.hero.film()?.playing ?? false)).toBe(false)
    expect(await page.evaluate(() => window.__st!.hero.wind())).toBeNull() // no leaf layer at all
  })
})
