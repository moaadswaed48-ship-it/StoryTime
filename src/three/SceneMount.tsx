import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { useSiteStore } from '@/store/useSiteStore'

const Scene = lazy(() => import('./Scene'))

function webglSupported(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

class SceneErrorBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.props.onError()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

/**
 * Mounts the three.js chunk only after the hero image has painted (LCP first) and the browser is idle.
 * Without WebGL the page stays fully usable: `html.no-webgl` switches every 3D moment to its DOM fallback.
 */
export function SceneMount() {
  const [ready, setReady] = useState(false)
  const webgl = useSiteStore((s) => s.webgl)
  const setWebgl = useSiteStore((s) => s.setWebgl)
  const setSceneReady = useSiteStore((s) => s.setSceneReady)

  useEffect(() => {
    if (!webglSupported() || new URLSearchParams(location.search).has('nowebgl')) {
      setWebgl('failed')
      return
    }
    let cancelled = false
    const img = document.getElementById('hero-img') as HTMLImageElement | null
    const start = () => {
      if (cancelled) return
      const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback
      if (idle) idle(() => !cancelled && setReady(true), { timeout: 1500 })
      else setTimeout(() => !cancelled && setReady(true), 300)
    }
    const decoded = img && img.complete ? Promise.resolve() : img ? img.decode().catch(() => undefined) : Promise.resolve()
    const timeout = new Promise<void>((r) => setTimeout(r, 1500))
    Promise.race([decoded, timeout]).then(start)
    return () => {
      cancelled = true
    }
  }, [setWebgl])

  useEffect(() => {
    document.documentElement.classList.toggle('no-webgl', webgl === 'failed')
    setSceneReady(webgl === 'ok')
  }, [webgl, setSceneReady])

  if (!ready || webgl === 'failed') return null
  return (
    <SceneErrorBoundary onError={() => setWebgl('failed')}>
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </SceneErrorBoundary>
  )
}
