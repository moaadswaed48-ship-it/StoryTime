/**
 * Teachers: classroom mode, the pure parts (unit-tested in tests/classroom.test.ts).
 *
 * Classroom mode is a choice of a teacher account, remembered with the account (profiles.prefs.classroom), that makes
 * the story screens fit a room of children looking at one large screen or projector: much larger words, large
 * controls at the edges, no account details, the activity one step at a time, full screen where the browser allows.
 */
import type { Role } from '@/data/types'
import type { Lang } from '@/i18n/config'

/** Classroom mode applies only to a teacher account that switched it on. */
export const classroomOn = (role: Role | null | undefined, pref: boolean | undefined): boolean => role === 'teacher' && pref === true

/**
 * The app pages that take the classroom frame (no menu, no footer, no account details): the library, a story's own
 * pages (storybook, book, film, activity) and the collections. Settings, plans and checkout keep the normal frame:
 * they are the grown-up's pages, behind the parent gate.
 */
export function isClassroomPage(pathname: string, lang: Lang, basePath = '/'): boolean {
  const base = basePath.replace(/\/+$/, '')
  const rest = pathname.startsWith(`${base}/`) ? pathname.slice(base.length) : pathname
  const m = rest.match(/^\/([a-z]{2})\/app\/(library|story|collections)(\/|$)/)
  return !!m && m[1] === lang
}

/**
 * The cards of an activity on the big screen: card 0 is "Get ready" (the title, what it teaches, what the group
 * needs), then one card per step. Returns the card to show after a move, kept inside the range.
 */
export function moveCard(current: number, by: number, steps: number): number {
  const last = Math.max(0, steps)
  return Math.min(last, Math.max(0, current + by))
}

type FullscreenDoc = {
  fullscreenEnabled?: boolean
  webkitFullscreenEnabled?: boolean
  fullscreenElement?: Element | null
  webkitFullscreenElement?: Element | null
}

/** Whether this browser can put the page in full screen (an iPhone cannot: only its video player can). */
export const canFullscreen = (doc: FullscreenDoc | undefined): boolean => !!doc && !!(doc.fullscreenEnabled || doc.webkitFullscreenEnabled)

export const isFullscreen = (doc: FullscreenDoc | undefined): boolean => !!doc && !!(doc.fullscreenElement || doc.webkitFullscreenElement)

/** Asks for full screen (needs a tap or key press); a refusal is quiet, the page works the same without it. */
export async function enterFullscreen(): Promise<void> {
  const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void }
  try {
    if (el.requestFullscreen) await el.requestFullscreen({ navigationUI: 'hide' })
    else await el.webkitRequestFullscreen?.()
  } catch {
    /* refused or not allowed here: the page stays as it is */
  }
}

export async function leaveFullscreen(): Promise<void> {
  const doc = document as Document & { webkitExitFullscreen?: () => Promise<void> | void; webkitFullscreenElement?: Element | null }
  if (!isFullscreen(doc)) return
  try {
    if (doc.exitFullscreen) await doc.exitFullscreen()
    else await doc.webkitExitFullscreen?.()
  } catch {
    /* already left */
  }
}
