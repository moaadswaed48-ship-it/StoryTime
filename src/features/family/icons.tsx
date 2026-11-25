import type { SVGProps } from 'react'

/**
 * Code-drawn pictures for the family screens: the four doors of a storybook (large pictures a small child can read
 * without words) and the control icons. Neutral line drawings on the current tokens; the design pass restyles them.
 * All are decorative (aria-hidden): every control that uses one also has a visible word or an accessible name.
 */
type P = SVGProps<SVGSVGElement>
const base = (p: P) => ({ 'aria-hidden': true as const, focusable: false as const, fill: 'none', stroke: 'currentColor', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, ...p })

export const DoorRead = (p: P) => (
  <svg viewBox="0 0 96 96" strokeWidth={3.5} {...base(p)}>
    <path d="M48 28c-8-6-20-8-32-6v46c12-2 24 0 32 6 8-6 20-8 32-6V22c-12-2-24 0-32 6Z" fill="var(--door-tint, #f3ead8)" />
    <path d="M48 28v46" />
    <path d="M24 36c6-1 11 0 16 2M24 46c6-1 11 0 16 2M56 38c5-2 10-3 16-2M56 48c5-2 10-3 16-2" strokeWidth={2.5} opacity={0.7} />
  </svg>
)
export const DoorListen = (p: P) => (
  <svg viewBox="0 0 96 96" strokeWidth={3.5} {...base(p)}>
    <path d="M22 58v-8a26 26 0 0 1 52 0v8" />
    <rect x="16" y="54" width="16" height="24" rx="7" fill="var(--door-tint, #dfe9f3)" />
    <rect x="64" y="54" width="16" height="24" rx="7" fill="var(--door-tint, #dfe9f3)" />
    <path d="M42 62c3 2 3 6 0 8M50 58c6 4 6 12 0 16" strokeWidth={3} />
  </svg>
)
export const DoorWatch = (p: P) => (
  <svg viewBox="0 0 96 96" strokeWidth={3.5} {...base(p)}>
    <rect x="12" y="22" width="72" height="50" rx="9" fill="var(--door-tint, #e8e1f0)" />
    <path d="M42 36v22l18-11-18-11Z" fill="currentColor" stroke="none" />
    <path d="M34 82h28" />
  </svg>
)
export const DoorDo = (p: P) => (
  <svg viewBox="0 0 96 96" strokeWidth={3.5} {...base(p)}>
    <path d="M28 70c-6-4-10-12-8-20l4-14a4 4 0 0 1 8 2l-2 10 12-22a4 4 0 0 1 7 4L42 46l16-18a4 4 0 0 1 6 5L50 50l14-10a4 4 0 0 1 5 6L52 60c-6 6-14 14-24 10Z" fill="var(--door-tint, #e4efdc)" />
    <path d="M66 18l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z" fill="currentColor" stroke="none" opacity={0.75} />
  </svg>
)

export const IconClose = (p: P) => <svg viewBox="0 0 24 24" strokeWidth={2.2} {...base(p)}><path d="M6 6l12 12M18 6 6 18" /></svg>
/** Points forward in reading order: flip it with `rtl:-scale-x-100` where needed. */
export const IconArrow = (p: P) => <svg viewBox="0 0 24 24" strokeWidth={2.2} {...base(p)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
export const IconPlay = (p: P) => <svg viewBox="0 0 24 24" {...base(p)} stroke="none"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 8 5.5Z" fill="currentColor" /></svg>
export const IconPause = (p: P) => <svg viewBox="0 0 24 24" {...base(p)} stroke="none"><rect x="6" y="5" width="4.5" height="14" rx="1.5" fill="currentColor" /><rect x="13.5" y="5" width="4.5" height="14" rx="1.5" fill="currentColor" /></svg>
export const IconLock = (p: P) => <svg viewBox="0 0 24 24" strokeWidth={2} {...base(p)}><rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="currentColor" stroke="none" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></svg>
export const IconTextSmaller = (p: P) => <svg viewBox="0 0 24 24" strokeWidth={2} {...base(p)}><path d="M4 18 9 6l5 12M5.8 14h6.4M16 12h5" /></svg>
export const IconTextLarger = (p: P) => <svg viewBox="0 0 24 24" strokeWidth={2} {...base(p)}><path d="M3 19 9 5l6 14M5 14.5h8M18.5 9.5v6M15.5 12.5h6" /></svg>
export const IconAutoFlip = (p: P) => (
  <svg viewBox="0 0 24 24" strokeWidth={2} {...base(p)}>
    <path d="M4 5.5c3-1 5.5-.8 8 .8v13c-2.5-1.6-5-1.8-8-.8v-13Z" />
    <path d="M12 6.3c2.5-1.6 5-1.8 8-.8" />
    <path d="M15.5 13.5c1.5-1.8 3.4-2.3 5.3-1.6M20.8 9.8v2.4h-2.4" />
  </svg>
)
export const IconHeart = ({ filled, ...p }: P & { filled?: boolean }) => (
  <svg viewBox="0 0 24 24" strokeWidth={2} {...base(p)}>
    <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20Z" fill={filled ? 'currentColor' : 'none'} />
  </svg>
)
export const IconCheck = (p: P) => <svg viewBox="0 0 24 24" strokeWidth={2.6} {...base(p)}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
export const IconShelf = (p: P) => <svg viewBox="0 0 24 24" strokeWidth={2} {...base(p)}><path d="M3 20h18M6 19V7M10 19V5M14 19V8l4-1 2 12" /></svg>
export const IconList = (p: P) => <svg viewBox="0 0 24 24" strokeWidth={2} {...base(p)}><path d="M9 6h11M9 12h11M9 18h11M4 6h1M4 12h1M4 18h1" /></svg>
