import { lazy, Suspense } from 'react'
import type { FilmContent } from '@/data/types'
import type { Lang } from '@/i18n/config'
import { useLang } from '@/i18n/use-dict'

/**
 * The film player, loaded on demand: Media Chrome and the player arrive only when a film is about to show (never in
 * a public page's bundle). Until then the poster stands in its place, at the same size, so nothing jumps.
 */
const Player = lazy(() => import('./FilmPlayer'))

export function Film(props: { film: FilmContent; title: string; lang: Lang; memoryKey: string; captions: boolean; onCaptions: (on: boolean) => void; onWatched: () => void; autoStart?: boolean }) {
  const { dict } = useLang()
  const poster = (
    <div className="relative aspect-video w-full overflow-hidden rounded-[1rem] bg-[#111]" role="status" aria-label={dict.account.states.loading}>
      {props.film.posterUrl && <img src={props.film.posterUrl} alt="" className="size-full object-cover opacity-80" />}
    </div>
  )
  return (
    <Suspense fallback={poster}>
      <Player {...props} />
    </Suspense>
  )
}
