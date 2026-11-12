import { useEffect, useRef, useState, type ButtonHTMLAttributes, type CSSProperties, type ElementType, type ReactNode, type RefObject } from 'react'
import { cn } from '@/lib/cn'

/* ── Layout ─────────────────────────────────────────────────────────────────── */
export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('mx-auto w-full max-w-[1320px] px-5 sm:px-8 lg:px-14', className)}>{children}</div>
}

/* ── Buttons are pills ──────────────────────────────────────────────────────── */
const PILL = {
  solid: 'bg-paper text-ink hover:bg-white', // primary on film / dark
  ink: 'bg-ink text-paper hover:bg-ink-2', // primary on paper
  maple: 'bg-maple text-white hover:brightness-110',
  glass: 'glass text-white hover:bg-white/10', // secondary on film / dark
  outline: 'border border-ink/20 text-ink hover:bg-ink/5', // secondary on paper
}
const SIZE = { sm: 'h-11 px-4 text-[13.5px]', md: 'h-12 px-6 text-[15px]', lg: 'h-14 px-8 text-[16px]' }
export type PillVariant = keyof typeof PILL

export function Pill({ variant = 'solid', size = 'md', className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: PillVariant; size?: keyof typeof SIZE; children: ReactNode }) {
  return (
    <button
      type="button"
      className={cn('inline-flex shrink-0 items-center justify-center gap-2.5 rounded-full font-semibold transition-[transform,background-color,filter] duration-200 ease-out active:scale-[0.97] disabled:opacity-40', PILL[variant], SIZE[size], className)}
      {...rest}
    >
      {children}
    </button>
  )
}

/** Small label above a heading: a dot (or hairline) plus tracked text. */
export function Eyebrow({ children, className, tone = 'dark' }: { children: ReactNode; className?: string; tone?: 'dark' | 'light' }) {
  return (
    <p className={cn('t-label inline-flex items-center gap-3', tone === 'dark' ? 'text-maple-soft' : 'text-maple-ink', className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {children}
    </p>
  )
}

/* ── In-view + motion helpers ───────────────────────────────────────────────── */
const reducedNow = () => typeof window !== 'undefined' && (window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.hasAttribute('data-reduce-motion'))

/** True once the element has entered the viewport (fires once). */
export function useInView<T extends HTMLElement>(ref: RefObject<T | null>, rootMargin = '0px 0px -12% 0px'): boolean {
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || seen) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setSeen(true), io.disconnect()), { rootMargin, threshold: 0.12 })
    io.observe(el)
    return () => io.disconnect()
  }, [ref, rootMargin, seen])
  return seen
}

/** True while the element is on (or near) screen — use it to pause loops, videos and canvases off-screen. */
export function useOnScreen<T extends HTMLElement>(ref: RefObject<T | null>, rootMargin = '200px 0px'): boolean {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { rootMargin })
    io.observe(el)
    return () => io.disconnect()
  }, [ref, rootMargin])
  return on
}

/**
 * Headline that resolves word by word from a blur. Whole words only — Arabic letters are never split.
 * The rest state is fully visible, so nothing stays hidden if scripts fail or motion is reduced.
 */
export function BlurWords({ text, as: Tag = 'span', className, delay = 0, immediate = false }: { text: string; as?: ElementType; className?: string; delay?: number; immediate?: boolean }) {
  const ref = useRef<HTMLElement>(null)
  const seen = useInView(ref)
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!reducedNow()) setArmed(true)
  }, [])
  const on = armed && (seen || immediate)
  return (
    <Tag ref={ref} className={cn('blur-words', armed && 'is-armed', on && 'is-in', className)} style={{ '--d': `${delay}ms` } as CSSProperties}>
      {text.split(' ').map((w, i) => (
        <span key={i}>
          <span className="w" style={{ '--i': i } as CSSProperties}>
            {w}
          </span>{' '}
        </span>
      ))}
    </Tag>
  )
}

/** Fade-up when scrolled into view. */
export function Reveal({ children, className, delay = 0, as: Tag = 'div' }: { children: ReactNode; className?: string; delay?: number; as?: ElementType }) {
  const ref = useRef<HTMLElement>(null)
  const seen = useInView(ref)
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!reducedNow()) setArmed(true)
  }, [])
  return (
    <Tag ref={ref} className={cn('reveal', armed && 'is-armed', armed && seen && 'is-in', className)} style={{ '--d': `${delay}ms` } as CSSProperties}>
      {children}
    </Tag>
  )
}

/** Section heading block: eyebrow, big title (blur-in), optional lede. */
export function SectionHead({ eyebrow, title, lede, tone = 'dark', className, align = 'start' }: { eyebrow: string; title: string; lede?: string; tone?: 'dark' | 'light'; className?: string; align?: 'start' | 'center' }) {
  return (
    <div className={cn('max-w-[46rem]', align === 'center' && 'mx-auto text-center', className)}>
      <Reveal>
        <Eyebrow tone={tone}>{eyebrow}</Eyebrow>
      </Reveal>
      <BlurWords as="h2" text={title} className={cn('t-h2 mt-4 block', tone === 'dark' ? 'text-paper' : 'text-ink')} />
      {lede && (
        <Reveal delay={150}>
          <p className={cn('t-lede mt-5 max-w-[36rem]', align === 'center' && 'mx-auto', tone === 'dark' ? 'text-paper/70' : 'text-ink-2/80')}>{lede}</p>
        </Reveal>
      )}
    </div>
  )
}
