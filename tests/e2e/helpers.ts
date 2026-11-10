import type { Page } from '@playwright/test'

/** QA hooks exposed by `exposeQA()` in dev or with `?qa=1` — see docs/SPEC.md. */
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    __st?: Record<string, any>
  }
}

/** Waits until a feature has published its QA hooks (`window.__st.<name>`). */
export const waitForHook = (page: Page, name: string, timeout = 45_000) =>
  page.waitForFunction((n) => !!window.__st?.[n], name, { timeout })

/** Jumps the smooth scroller to an element (or to a y position). */
export const scrollToY = (page: Page, target: string | number) =>
  page.evaluate((t) => {
    const y = typeof t === 'number' ? t : (document.querySelector(t)?.getBoundingClientRect().top ?? 0) + window.scrollY
    const lenis = window.__st?.lenis
    if (lenis) lenis.scrollTo(y, { immediate: true, force: true })
    else window.scrollTo(0, y)
  }, target)

/** Collects console errors and page errors; call `.assertClean()` at the end of a test. */
export function watchConsole(page: Page) {
  const errors: string[] = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(e.message))
  return { errors, assertClean: () => { if (errors.length) throw new Error('console errors:\n' + errors.join('\n')) } }
}
