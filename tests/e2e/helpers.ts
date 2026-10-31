import type { Page } from '@playwright/test'

export async function gotoShelf(page: Page, query = '?qa=1') {
  await page.goto('/' + query, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => !!window.__st?.lenis, null, { timeout: 30_000 })
  await page.waitForFunction(() => !!window.__st?.shelf, null, { timeout: 30_000 })
  await page.evaluate(() => {
    const el = document.querySelector('.shelf-view')!
    window.__st!.lenis!.scrollTo(el.getBoundingClientRect().top + window.scrollY - 110, { immediate: true, force: true })
  })
  await page.waitForTimeout(700)
  await page.evaluate(() => window.__st!.shelf!.settleNow())
  await page.waitForTimeout(300)
}

export const shelf = (page: Page) => ({
  phase: () => page.evaluate(() => window.__st!.shelf!.phase()),
  index: () => page.evaluate(() => window.__st!.shelf!.index()),
  gx: () => page.evaluate(() => window.__st!.shelf!.groupX()),
  waitRest: () => page.waitForFunction(() => window.__st!.shelf!.phase() === 'browsing', null, { timeout: 30_000 }),
})

declare global {
  interface Window {
    __st?: {
      lenis?: { scrollTo: (y: number, o: { immediate: boolean; force: boolean }) => void; stop: () => void; start: () => void }
      gl?: { info: { render: { calls: number }; memory: { textures: number }; programs: unknown[] } }
      shelf?: {
        phase: () => string
        index: () => number
        groupX: () => number
        settleNow: () => void
        open: (id: string) => void
        hidden: () => boolean[]
        positions: () => [number, number][]
        relaunch: (seed?: number) => void
        time: () => number
      }
    }
  }
}
