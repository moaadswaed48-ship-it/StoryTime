/** Test hooks exposed on window.__st in dev or when the URL has ?qa=1 (used by scripts/qa/*). */
export const QA = typeof location !== 'undefined' && (import.meta.env.DEV || new URLSearchParams(location.search).has('qa'))

type Hooks = Record<string, unknown>
declare global {
  interface Window {
    __st?: Hooks
  }
}
export function exposeQA(patch: Hooks) {
  if (!QA) return
  window.__st = Object.assign(window.__st ?? {}, patch)
}
