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

/** Independent of the solver: real on-screen boxes of every text block, pill and card against the two face boxes. */
const coveredFaces = (page: Page) =>
  page.evaluate(() => {
    const top = document.querySelector('#top')!.getBoundingClientRect()
    const frame = window.__st!.hero.frame()
    const heads = frame.heads.map((h: { x: number; y: number; w: number; h: number }) => ({ l: top.left + h.x, t: top.top + h.y, r: top.left + h.x + h.w, b: top.top + h.y + h.h }))
    const hits = [...document.querySelectorAll<HTMLElement>('#top [data-hero-ui]:not([data-clash])')]
      .filter((el) => {
        const r = el.getBoundingClientRect()
        return r.width > 0 && heads.some((h: { l: number; t: number; r: number; b: number }) => r.left < h.r && r.right > h.l && r.top < h.b && r.bottom > h.t)
      })
      .map((el) => (el.textContent ?? '').trim().slice(0, 40))
    const inView = heads.every((h: { l: number; r: number; t: number }) => h.l >= 0 && h.r <= window.innerWidth && h.t >= 0)
    return { hits, inView, mode: frame.mode as string }
  })

test.describe('hero', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(pageUrl('hero'))
    await waitForHook(page, 'hero')
    await scrollToY(page, '#top')
  })

  test('fills the first screen, shows the title and plays the film', async ({ page }) => {
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
    await page.waitForFunction(() => { const f = window.__st!.hero.film(); return !!f && f.ready && f.playing && f.time > 0.15 }, null, { timeout: 45_000 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
    con.assertClean()
  })

  test('type, pills and scene cards never sit on the boys’ faces', async ({ page, isMobile }) => {
    const sizes = isMobile ? [page.viewportSize()!, { width: 390, height: 844 }] : [{ width: 1440, height: 900 }, { width: 820, height: 1180 }, { width: 390, height: 844 }, { width: 1280, height: 720 }]
    for (const size of sizes) {
      await page.setViewportSize(size)
      await settled(page)
      await page.waitForFunction(([w, h]) => { const f = window.__st!.hero.frame(); const el = document.querySelector('#top')!; return !!f && el.clientWidth === w && Math.abs(f.w / f.h - 16 / 9) < 0.01 && window.__st!.hero.clear() && h > 0 }, [size.width, size.height], { timeout: 30_000 })
      await page.waitForTimeout(250) // one more frame for the solver to settle after the resize
      const res = await coveredFaces(page)
      expect(res.hits, `${size.width}×${size.height} (${res.mode})`).toEqual([])
      expect(res.inView, `both boys in view at ${size.width}×${size.height}`).toBe(true)
    }
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
    await expect(hero.locator('.hero-card')).toHaveCount(3)
    await hero.locator('.hero-card').nth(1).click()
    expect(await store(page)).toEqual({ overlay: 'film', scene: 5 })
    await closeOverlay(page)
  })

  test('a scene card plays its clip while hovered', async ({ page, isMobile }) => {
    test.skip(isMobile, 'hover is a mouse behaviour; phones show posters')
    await settled(page)
    const card = page.locator('#top .hero-card').nth(1)
    await card.hover()
    await page.waitForFunction(() => window.__st!.hero.cardPlaying(1), null, { timeout: 45_000 })
    await expect(card).toHaveAttribute('data-playing', '')
    await page.mouse.move(5, 5)
    await page.waitForFunction(() => !window.__st!.hero.cardPlaying(1), null, { timeout: 15_000 })
  })

  test('reduced motion: everything is visible and the film rests on its first frame', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.reload()
    await waitForHook(page, 'hero')
    const hero = page.locator('#top')
    await expect(hero.locator('h1')).toBeVisible()
    await expect(hero.locator('.hero-sub')).toHaveCSS('opacity', '1')
    await expect(hero.locator('.hero-card').first()).toHaveCSS('opacity', '1')
    await page.waitForTimeout(800)
    expect(await page.evaluate(() => window.__st!.hero.film().playing)).toBe(false)
  })
})
