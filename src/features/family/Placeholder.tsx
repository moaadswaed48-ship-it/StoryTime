import type { CSSProperties } from 'react'

/**
 * A clearly marked stand-in for a picture that is not drawn yet (pages, covers, activity steps and materials):
 * diagonal hatching, a plain "picture" sign and, where there is room, a dashed tag that says so in words. Neutral
 * colours only (the look is not decided). It is never mistaken for the real art, and it disappears on its own the
 * moment a picture file exists. The canvas version for the page curl is drawPlaceholder in features/reader/paint.ts.
 */
export const PLACEHOLDER_HATCH = 'repeating-linear-gradient(135deg, #e9e3d5 0 12px, #f3eee3 12px 24px)'

export function PictureSign({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 48 40" className={className} style={style} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
      <rect x="3" y="3" width="42" height="34" rx="4" />
      <circle cx="33" cy="13" r="4" />
      <path d="M5 33 L18 19 L27 28 L32 23 L43 34" />
    </svg>
  )
}

export function ArtPlaceholder({ label, tagAt = 'bottom', compact = false, className = '' }: {
  /** The words on the tag (from the dictionaries); omitted on small tiles where they would not fit. */
  label?: string
  /** Which edge the tag sits on: keep it away from the words of a page. */
  tagAt?: 'top' | 'bottom'
  compact?: boolean
  className?: string
}) {
  return (
    <span className={`absolute inset-0 grid place-items-center text-ink/35 ${className}`} style={{ background: PLACEHOLDER_HATCH }} data-testid="art-placeholder">
      <PictureSign className={compact ? 'w-[38%] max-w-14' : 'w-[22%] max-w-24 min-w-10'} />
      {label && (
        <span className={`absolute inset-x-3 ${tagAt === 'top' ? 'top-3' : 'bottom-3'} flex justify-center`}>
          <span className="max-w-full rounded-full border border-dashed border-ink/50 bg-paper/90 px-3 py-1 text-center text-xs font-medium text-ink/80">{label}</span>
        </span>
      )}
    </span>
  )
}
