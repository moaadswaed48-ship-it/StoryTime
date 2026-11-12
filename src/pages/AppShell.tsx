import { lazy, Suspense } from 'react'
import { ErrorBoundary } from '@/design/ErrorBoundary'
import type { View } from '@/store/useSiteStore'
import { AppNav } from '@/features/appnav'

const AppHome = lazy(() => import('@/features/home').then((m) => ({ default: m.AppHome })))
const StoryPage = lazy(() => import('@/features/story').then((m) => ({ default: m.StoryPage })))
const MyTree = lazy(() => import('@/features/tree').then((m) => ({ default: m.MyTree })))
const GrownUps = lazy(() => import('@/features/grownups').then((m) => ({ default: m.GrownUps })))
const Studio = lazy(() => import('@/features/studio').then((m) => ({ default: m.Studio })))

/** The app itself: the child's library, a story's page, the reward tree, the grown-ups' area and the author's desk. */
export function AppShell({ view }: { view: Exclude<View, 'landing'> }) {
  return (
    <div className="app-shell relative min-h-[100svh]" data-view={view}>
      <AppNav />
      <main id="main" key={view} className="view-in">
        <ErrorBoundary>
        <Suspense fallback={<div className="min-h-[100svh]" />}>
          {view === 'home' && <AppHome />}
          {view === 'story' && <StoryPage />}
          {view === 'tree' && <MyTree />}
          {view === 'grownups' && <GrownUps />}
          {view === 'studio' && <Studio />}
        </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  )
}
