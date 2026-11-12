/**
 * Isolated feature harness for development and screenshots:
 *   /demo.html?f=library            → mounts only src/features/library (inside the real Providers)
 *   /demo.html?f=book&open=book     → also opens an overlay ('book' | 'film') on load
 *   /demo.html?f=hero,scrollstory   → several features in order
 *   /demo.html?f=appnav,story&view=story&profile=Lina → app screens (view + a signed-in child); &pick opens the profile picker
 * Add &lang=en for English and &qa=1 for test hooks. Not part of the production build.
 */
import { StrictMode, type ComponentType } from 'react'
import { createRoot } from 'react-dom/client'
import 'lenis/dist/lenis.css'
import '@fontsource-variable/rubik/wght.css'
import '@fontsource/ibm-plex-sans-arabic/arabic-400.css'
import '@fontsource/ibm-plex-sans-arabic/arabic-500.css'
import '@fontsource/ibm-plex-sans-arabic/arabic-600.css'
import '@fontsource/ibm-plex-sans-arabic/arabic-700.css'
import '@fontsource/ibm-plex-sans-arabic/latin-400.css'
import '@fontsource/ibm-plex-sans-arabic/latin-500.css'
import '@fontsource/ibm-plex-sans-arabic/latin-600.css'
import '@fontsource/ibm-plex-sans-arabic/latin-700.css'
import '@fontsource/noto-naskh-arabic/arabic-500.css'
import '@fontsource/noto-naskh-arabic/arabic-700.css'
import './i18n/locale'
import './index.css'
import { Providers } from '@/app/Providers'
import { useSiteStore, type View } from '@/store/useSiteStore'
import { useProfileStore } from '@/store/useProfileStore'

const modules = import.meta.glob<Record<string, ComponentType>>('./features/*/index.tsx')
const q = new URLSearchParams(location.search)
const names = (q.get('f') ?? 'hero').split(',')
const loaded = await Promise.all(
  names.map(async (n) => {
    const mod = await modules[`./features/${n}/index.tsx`]?.()
    return mod ? Object.values(mod).filter((v) => typeof v === 'function') : []
  }),
)
const open = q.get('open')
if (open === 'book') useSiteStore.getState().openBook(Number(q.get('scene') ?? 0))
if (open === 'film') useSiteStore.getState().openFilm(Number(q.get('scene') ?? 0))
if (q.has('login')) useSiteStore.getState().setLoggedIn(true)
// &view=story sets the app view (for features that read it); &profile=Name signs a child in; &pick opens "who is reading?"
if (q.get('view')) useSiteStore.getState().setView(q.get('view') as View)
if (q.has('profile')) useProfileStore.getState().setProfile({ name: q.get('profile') ?? '', avatar: 'sari' })
if (q.has('pick')) useSiteStore.getState().setPicking(true)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <div id="page" className="relative min-h-[100svh]">
        {loaded.flat().map((C, i) => (
          <C key={i} />
        ))}
      </div>
    </Providers>
  </StrictMode>,
)
