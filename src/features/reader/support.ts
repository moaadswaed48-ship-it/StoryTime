import { useSiteStore } from '@/store/useSiteStore'
import { prefersReducedNow } from '@/app/useMotionTier'

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

/** The curl could not start after all (the context was refused): from now on `canCurl()` says no. */
export function noCurl() {
  webgl = false
}

/**
 * True when this device can run the curling reader: WebGL is there and motion is not reduced.
 * When it is false the DOM book in `src/features/book` is the reader.
 */
export function canCurl(): boolean {
  if (typeof window === 'undefined') return false
  return hasWebGL() && !(useSiteStore.getState().tier === 'reduced' || prefersReducedNow())
}
