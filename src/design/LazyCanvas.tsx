import { Component, useEffect, useRef, useState, type ReactNode } from 'react'
import { Canvas, type CanvasProps } from '@react-three/fiber'
import { useOnScreen } from './ui'

function webglSupported(): boolean {
  try {
    if (new URLSearchParams(location.search).has('nowebgl')) return false
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

class Boundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

const coarse = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

/**
 * A WebGL canvas that only exists while its block is near the viewport, pauses when off-screen,
 * caps pixel ratio on phones and falls back to plain DOM when WebGL is missing or the context is lost.
 * Fill a positioned parent: the wrapper is `absolute inset-0`.
 */
export function LazyCanvas({ children, fallback = null, className, ...props }: CanvasProps & { fallback?: ReactNode; className?: string }) {
  const holder = useRef<HTMLDivElement>(null)
  const near = useOnScreen(holder, '600px 0px')
  const visible = useOnScreen(holder, '40px 0px')
  const [ok, setOk] = useState(true)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setOk(webglSupported()), [])
  useEffect(() => {
    if (near) setMounted(true)
  }, [near])
  return (
    <div ref={holder} className={className ?? 'absolute inset-0'}>
      {!ok ? (
        fallback
      ) : mounted ? (
        <Boundary fallback={fallback}>
          <Canvas
            dpr={[1, coarse ? 1.5 : 1.75]}
            frameloop={visible ? 'always' : 'never'}
            gl={{ antialias: !coarse, powerPreference: 'high-performance', alpha: true }}
            onCreated={({ gl }) => gl.domElement.addEventListener('webglcontextlost', (e) => (e.preventDefault(), setOk(false)))}
            {...props}
          >
            {children}
          </Canvas>
        </Boundary>
      ) : null}
    </div>
  )
}
