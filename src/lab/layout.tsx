import { NavLink, Outlet } from 'react-router'
import { privateMeta } from '@/seo/meta'

/**
 * Lab: test pages that prove the carried-over engines run on their own. Dev builds only (see src/routes.ts);
 * never shipped, so their few English labels are not in the dictionaries.
 */
export const meta = () => privateMeta('Lab · StoryTime')

const PAGES = [
  ['curl', 'Page curl'],
  ['kit', 'Character builder'],
  ['studio', 'Studio scenes'],
  ['shelf', 'Shelf'],
] as const

export default function LabLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <nav className="flex flex-wrap items-center gap-1 border-b border-line bg-surface px-3 py-2 text-sm">
        <span className="me-2 font-semibold">Lab</span>
        {PAGES.map(([to, label]) => (
          <NavLink key={to} to={`/lab/${to}`} className="inline-flex min-h-11 items-center rounded-control px-3 aria-[current=page]:bg-ink aria-[current=page]:text-paper">
            {label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  )
}
