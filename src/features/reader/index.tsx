import { useSiteStore } from '@/store/useSiteStore'
import { exposeQA } from '@/lib/qa'
import { ReaderView } from './Reader'
import { idleHooks } from './qa'
import { canCurl } from './support'
import './reader.css'

// Published at load so tests can wait for `window.__st.reader` before the book is opened.
exposeQA({ reader: idleHooks })

export { canCurl }

/**
 * The immersive reader: the book fills the screen and its pages curl under the finger.
 * Shown while `overlay === 'book'`, whenever `canCurl()` allows it; otherwise it renders nothing.
 */
export function Reader() {
  const open = useSiteStore((s) => s.overlay === 'book')
  const startScene = useSiteStore((s) => s.startScene)
  useSiteStore((s) => s.tier) // re-check when the motion tier resolves
  return open && canCurl() ? <ReaderView startScene={startScene} /> : null
}
