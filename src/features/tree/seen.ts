/**
 * Which leaves the child has already watched arrive (so each one celebrates once, the first time it is seen).
 * Kept beside the progress, in this browser only. Entries look like "autumn-leaves:read" and "autumn-leaves:all".
 */
const KEY = 'st:tree:seen:v1'

export function readSeen(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return new Set(JSON.parse(raw) as string[])
  } catch {
    /* private mode */
  }
  return new Set()
}

export function writeSeen(seen: Set<string>) {
  try {
    localStorage.setItem(KEY, JSON.stringify([...seen]))
  } catch {
    /* ignore */
  }
}

/** Progress was cleared: every leaf may celebrate again when it is earned again. */
export function forgetSeen() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
