import { useSiteStore } from '@/store/useSiteStore'
import { Player } from './Player'

/**
 * The cinema overlay (z 70): mounted only while `overlay === 'film'`, so every opening starts fresh
 * and the film is never downloaded by visitors who do not watch it. QA hooks: `window.__st.film`.
 */
export function FilmPlayer() {
  const open = useSiteStore((s) => s.overlay === 'film')
  return open ? <Player /> : null
}
