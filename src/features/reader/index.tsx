import { useSiteStore } from '@/store/useSiteStore'
import { prefersReducedNow } from '@/app/useMotionTier'
import { exposeQA } from '@/lib/qa'
import { ReaderView } from './Reader'
import { idleHooks } from './qa'
import './reader.css'

// Published at load so tests can wait for `window.__st.reader` before the book is opened.
exposeQA({ reader: idleHooks })

let webgl: boolean | null = null
function hasWebGL(): boolean {
  if (webgl !== null) return webgl
  try {
    if (new URLSearchParams(location.search).has('nowebgl')) return (webgl = false)
    const c = document.createElement('canvas')
    const gl = (c.getContext('webgl2') ?? c.getContext('webgl')) as WebGLRenderingContext | null
    webgl = !!gl
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    webgl = false
  }
  return webgl
}

/**
 * True when this device can run the curling reader: WebGL is there and motion is not reduced.
 * When it is false the DOM book in `src/features/book` is the reader.
 */
export function canCurl(): boolean {
  if (typeof window === 'undefined') return false
  return hasWebGL() && !(useSiteStore.getState().tier === 'reduced' || prefersReducedNow())
}

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
