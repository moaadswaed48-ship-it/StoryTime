import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

export interface LeavesHandle {
  burst: (x: number, y: number, n?: number) => void
}
const COLORS = ['#e2711d', '#f4a72c', '#c8421f', '#f2c14e', '#a44a1b', '#d9902f']

interface P { x: number; y: number; vx: number; vy: number; r: number; a: number; va: number; c: string; life: number }

/** Falling autumn leaves on a 2D canvas that fills its parent. Pauses when off-screen or reduced motion. */
export const Leaves = forwardRef<LeavesHandle, { density?: number; className?: string }>(function Leaves({ density = 18, className }, ref) {
  const cv = useRef<HTMLCanvasElement>(null)
  const parts = useRef<P[]>([])
  useImperativeHandle(ref, () => ({
    burst: (x, y, n = 14) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2
        const s = 2 + Math.random() * 5
        parts.current.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 3, r: 7 + Math.random() * 8, a: Math.random() * 6, va: (Math.random() - 0.5) * 0.3, c: COLORS[i % COLORS.length], life: 1.6 })
      }
    },
  }))
  useEffect(() => {
    const c = cv.current!
    const ctx = c.getContext('2d')!
    const reduce = document.documentElement.hasAttribute('data-reduce-motion') || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0, h = 0, raf = 0, visible = true, last = performance.now()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const resize = () => {
      const r = c.getBoundingClientRect()
      w = r.width; h = r.height
      c.width = Math.max(1, w * dpr); c.height = Math.max(1, h * dpr)
    }
    resize()
    const ro = new ResizeObserver(resize); ro.observe(c)
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) { last = performance.now(); raf = requestAnimationFrame(tick) } })
    io.observe(c)
    const spawn = (anyY = false): P => ({ x: Math.random() * w, y: anyY ? Math.random() * h : -20, vx: -0.3 + Math.random() * 0.9, vy: 0.5 + Math.random() * 1.1, r: 6 + Math.random() * 9, a: Math.random() * 6, va: (Math.random() - 0.5) * 0.06, c: COLORS[Math.floor(Math.random() * COLORS.length)], life: Infinity })
    if (!reduce) for (let i = 0; i < density; i++) parts.current.push(spawn(true))
    function tick(now: number) {
      if (!visible) return
      const dt = Math.min(0.033, (now - last) / 1000) * 60
      last = now
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      const ps = parts.current
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i]
        p.x += (p.vx + Math.sin(now / 900 + p.r) * 0.5) * dt
        p.y += p.vy * dt
        p.a += p.va * dt
        if (p.life !== Infinity) { p.vy += 0.12 * dt; p.life -= dt / 60 }
        if (p.life <= 0) { ps.splice(i, 1); continue }
        if (p.y > h + 24) { if (p.life === Infinity) Object.assign(p, spawn()); else { ps.splice(i, 1); continue } }
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.a)
        ctx.globalAlpha = Math.min(1, p.life)
        ctx.fillStyle = p.c
        ctx.beginPath()
        ctx.moveTo(0, -p.r)
        ctx.bezierCurveTo(p.r * 0.9, -p.r * 0.5, p.r * 0.7, p.r * 0.6, 0, p.r)
        ctx.bezierCurveTo(-p.r * 0.7, p.r * 0.6, -p.r * 0.9, -p.r * 0.5, 0, -p.r)
        ctx.fill()
        ctx.strokeStyle = 'rgba(90,40,0,.35)'
        ctx.lineWidth = 1
        ctx.beginPath(); ctx.moveTo(0, -p.r * 0.8); ctx.lineTo(0, p.r * 1.25); ctx.stroke()
        ctx.restore()
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); parts.current = [] }
  }, [density])
  return <canvas ref={cv} className={className ?? 'pointer-events-none absolute inset-0 h-full w-full'} aria-hidden />
})
