import { useSiteStore } from '@/store/useSiteStore'
import { exposeQA } from '@/lib/qa'
import { Reader } from './Reader'
import { idleHooks } from './qa'
import './book.css'

// Published at load so tests can wait for `window.__st.book` before the overlay is opened.
exposeQA({ book: idleHooks })

/**
 * The book reader overlay: a picture book that floats closed, flies open into wide living spreads
 * and turns real paper leaves. Mounted only while `overlay === 'book'`.
 */
export function BookReader() {
  const open = useSiteStore((s) => s.overlay === 'book')
  const startScene = useSiteStore((s) => s.startScene)
  return open ? <Reader startScene={startScene} /> : null
}
