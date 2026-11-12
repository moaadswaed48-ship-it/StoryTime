import { useId } from 'react'
import type { Avatar } from '@/store/useProfileStore'
import { asset } from '@/lib/asset'
import { cn } from '@/lib/cn'

/** The maple-leaf outline used across the app (same silhouette as the wordmark), in a 24×24 box. */
export const MAPLE =
  'M12 1.8c1.1 2.1 2.6 3 4.6 2.7-.5 1.7-.1 3.1 1.2 4.1 1.2-.6 2.4-.6 3.5 0-1 2-2.5 3.6-4.5 4.9.9.5 1.5 1.3 1.8 2.3-2 .4-3.8.2-5.5-.7l.3 6.8h-2.8l.3-6.8c-1.7.9-3.5 1.1-5.5.7.3-1 .9-1.8 1.8-2.3-2-1.3-3.5-2.9-4.5-4.9 1.1-.6 2.3-.6 3.5 0 1.3-1 1.7-2.4 1.2-4.1 2 .3 3.5-.6 4.6-2.7z'

export const AVATARS: Avatar[] = ['sari', 'amir', 'leaf', 'bird']

/** A maple leaf on the film's golden light. Drawn, so it stays sharp at any size. */
function LeafArt() {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
      <defs>
        <radialGradient id={`av-leaf-sky-${id}`} cx="50%" cy="34%" r="78%">
          <stop offset="0" stopColor="#fff1cf" />
          <stop offset="0.55" stopColor="#f9cd84" />
          <stop offset="1" stopColor="#e99443" />
        </radialGradient>
        <linearGradient id={`av-leaf-fill-${id}`} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor="#f6a338" />
          <stop offset="0.5" stopColor="#de5a1f" />
          <stop offset="1" stopColor="#a83a16" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill={`url(#av-leaf-sky-${id})`} />
      <ellipse cx="52" cy="84" rx="26" ry="5" fill="#b4541a" opacity="0.22" />
      <g transform="translate(50 51) rotate(-14) scale(3.3) translate(-12 -12)">
        <path d={MAPLE} fill="#7a2c0c" opacity="0.25" transform="translate(0.6 0.9)" />
        <path d={MAPLE} fill={`url(#av-leaf-fill-${id})`} />
        {/* light from the upper left, as in the film */}
        <path d="M12 1.8c1.1 2.1 2.6 3 4.6 2.7-.5 1.7-.1 3.1 1.2 4.1L12 13z" fill="#fff0c2" opacity="0.2" />
        <path d="M12 16V4.4M12 13 7.2 6.4M12 13l4.8-6.6M12 14.4 4.4 9.6M12 14.4l7.6-4.8M12 15.4l-5.2.5M12 15.4l5.2.5" fill="none" stroke="#fff3d6" strokeOpacity="0.5" strokeWidth="0.34" strokeLinecap="round" />
      </g>
    </svg>
  )
}

/** One of the migrating birds against the sunset of the last scene. */
function BirdArt() {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id={`av-bird-sky-${id}`} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor="#f3a9a0" />
          <stop offset="0.55" stopColor="#f8c489" />
          <stop offset="1" stopColor="#fde2a6" />
        </linearGradient>
        <linearGradient id={`av-bird-body-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fffaf0" />
          <stop offset="1" stopColor="#f1d3ac" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill={`url(#av-bird-sky-${id})`} />
      <circle cx="74" cy="80" r="15" fill="#fff3cf" opacity="0.7" />
      {/* two friends far behind, keeping the line */}
      <path d="M13 31q4-4 7 0q3-4 7 0" fill="none" stroke="#7a4a3a" strokeWidth="1.8" strokeLinecap="round" opacity="0.55" />
      <path d="M26 20q3-3 5.5 0q2.5-3 5.5 0" fill="none" stroke="#7a4a3a" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <g transform="translate(2 4)">
        {/* far wing */}
        <path d="M48 50C44 36 49 24 62 17c1 10-1 21-7 32z" fill="#e7c49b" />
        {/* tail */}
        <path d="M27 60 12 57l4 7-3 6 16-5z" fill="#5b3a2c" />
        {/* body and neck */}
        <path d="M24 61c6-11 20-15 33-11 6 2 11 1 16-3 3-2 6-3 9-2 4 1 6 5 4 9-1 3-5 5-9 5-5 0-8 3-12 7-7 6-18 8-28 5-6-2-11-5-13-10z" fill={`url(#av-bird-body-${id})`} />
        {/* near wing */}
        <path d="M40 56C33 40 36 25 50 14c5 12 5 26-1 39 6 1 10 4 13 9-9 2-17 0-22-6z" fill="#fffaf0" />
        <path d="M50 14c-9 7-13 16-13 26l5-5-1 8 6-6v9l5-7c2-8 1-17-2-25z" fill="#5b3a2c" />
        {/* beak, eye, cheek */}
        <path d="M85 52l11 3-11 4z" fill="#d9541e" />
        <circle cx="80.5" cy="51.5" r="2.1" fill="#2a1a12" />
        <circle cx="81.2" cy="50.8" r="0.7" fill="#fff" />
        <circle cx="77" cy="56" r="2.6" fill="#f4a35e" opacity="0.55" />
      </g>
    </svg>
  )
}

/**
 * The picture of whoever is reading: Sari or Amir (cut from scene 5, so it is the same face as in the book and the film),
 * a maple leaf or a migrating bird. Round; size comes from the parent (`className` sets width/height).
 */
export function ReaderAvatar({ avatar, className, eager }: { avatar: Avatar; className?: string; eager?: boolean }) {
  return (
    <span className={cn('reader-avatar relative block shrink-0 overflow-hidden rounded-full bg-paper-2', className)} data-avatar={avatar}>
      {avatar === 'leaf' ? (
        <LeafArt />
      ) : avatar === 'bird' ? (
        <BirdArt />
      ) : (
        <img src={asset(`app/avatars/${avatar}.webp`)} alt="" width={384} height={384} loading={eager ? 'eager' : 'lazy'} decoding="async" draggable={false} className="h-full w-full object-cover" />
      )}
    </span>
  )
}
