import type { ReactNode, SVGProps } from 'react'
import { Link } from 'react-router'
import { useLang } from '@/i18n/use-dict'
import { localPath } from '@/seo/paths'
import { OfflineBanner, TestModeBanner } from '@/ui/Banners'
import { useClassroom, useFullscreen } from './useClassroom'

/**
 * Teachers: classroom mode, the pieces on screen. Neutral tokens only (the look is not decided). Every control is
 * at least 56 px and never appears only on hover.
 */

/** A screen with a group in front of it: the classroom mode switch. */
export function IconClassroom(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="3" y="3" width="18" height="11" rx="1.5" />
      <path d="M12 14v2" />
      <circle cx="6" cy="19" r="1.6" />
      <circle cx="12" cy="19.5" r="1.6" />
      <circle cx="18" cy="19" r="1.6" />
    </svg>
  )
}

export function IconFullscreen({ exit, ...props }: SVGProps<SVGSVGElement> & { exit?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {exit
        ? <path d="M9 3v6H3M15 3v6h6M9 21v-6H3M15 21v-6h6" />
        : <path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6" />}
    </svg>
  )
}

/**
 * The classroom mode switch, for a teacher account (renders nothing for any other account). Turning it on also asks
 * the browser for full screen in the same tap (not from the settings page: `fullscreen={false}`).
 */
export function ClassroomSwitch({ className = '', fullscreen = true }: { className?: string; fullscreen?: boolean }) {
  const { dict } = useLang()
  const t = dict.stories.classroom
  const { available, on, set } = useClassroom()
  if (!available) return null
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => set(!on, fullscreen)} data-testid="classroom-switch"
      className={`inline-flex min-h-14 items-center gap-3 rounded-control border border-ink/30 bg-surface px-4 py-2 text-start ${className}`}>
      <IconClassroom className="size-7 shrink-0" />
      <span className="flex min-w-0 flex-1 flex-col leading-snug">
        <span className="font-semibold">{t.mode}</span>
        <span className="text-sm text-ink-muted">{t.modeHint}</span>
      </span>
      <span aria-hidden="true" className={`relative h-7 w-12 shrink-0 rounded-full transition-colors motion-reduce:transition-none ${on ? 'bg-green-800' : 'bg-ink/25'}`}>
        <span className={`absolute top-0.5 size-6 rounded-full bg-white shadow transition-[inset-inline-start] motion-reduce:transition-none ${on ? 'start-[1.375rem]' : 'start-0.5'}`} />
      </span>
      <span className="sr-only">{on ? dict.stories.reader.on : dict.stories.reader.off}</span>
    </button>
  )
}

/** Full screen on and off, shown only where the browser allows it (not on an iPhone). */
export function FullscreenButton({ className = '', compact = false }: { className?: string; compact?: boolean }) {
  const { dict } = useLang()
  const t = dict.stories.classroom
  const fs = useFullscreen()
  if (!fs.can) return null
  const label = fs.active ? t.exitFullscreen : t.fullscreen
  return (
    <button type="button" onClick={fs.toggle} aria-pressed={fs.active} data-testid="classroom-fullscreen" aria-label={compact ? label : undefined}
      className={`inline-flex min-h-14 min-w-14 items-center justify-center gap-2 rounded-control border border-ink/30 bg-surface px-3 font-semibold ${className}`}>
      <IconFullscreen exit={fs.active} className="size-7" />
      <span className={compact ? 'sr-only' : 'max-sm:sr-only'}>{label}</span>
    </button>
  )
}

/**
 * The frame of the story pages in classroom mode, in place of the site's header and footer: no menu, no account
 * details, only the site name (back to the library), full screen and a way out of classroom mode. Leaving needs no
 * parent gate: it only brings back the normal menu, whose settings and passes stay behind the gate.
 */
export function ClassroomShell({ children }: { children: ReactNode }) {
  const { lang, dict } = useLang()
  const t = dict.stories.classroom
  const { set } = useClassroom()
  return (
    <>
      <OfflineBanner />
      <div role="region" aria-label={t.bar} data-testid="classroom-bar" className="border-b border-line bg-surface">
        <div className="flex flex-wrap items-center gap-2 px-3 py-2 sm:px-6">
          <Link to={localPath(lang, 'app/library')} className="me-auto inline-flex min-h-14 items-center gap-2 rounded-control px-2 text-xl font-semibold">
            <IconClassroom className="size-7" />
            <bdi>{dict.common.siteName}</bdi>
          </Link>
          <FullscreenButton />
          <button type="button" onClick={() => set(false)} data-testid="classroom-leave"
            className="inline-flex min-h-14 items-center gap-2 rounded-control bg-ink px-4 font-semibold text-paper">
            {t.leave}
          </button>
        </div>
        {/* The classroom frame replaces the site header, so it carries the test-mode notice; inside the bar's region
            so it sits in a landmark (axe "region"), as in SiteHeader. */}
        <TestModeBanner />
      </div>
      <main id="main" className="mx-auto w-full max-w-[120rem] px-3 py-5 sm:px-6 sm:py-6" data-classroom="on">
        {children}
      </main>
    </>
  )
}
