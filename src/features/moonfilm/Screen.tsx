import { useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useOverlayLock } from '@/design/overlay'
import { t } from '@/i18n/copy'
import { useSiteStore } from '@/store/useSiteStore'
import './moonfilm.css'
import { PUBLISHED, makeFilm } from './film'
import { Player } from './Player'

const film = makeFilm(PUBLISHED)

/** The full-screen cinema for the Moon scene: the player, a line saying what this is, and the way back. */
export function Screen() {
  const close = useCallback(() => useSiteStore.getState().closeOverlay(), [])
  const closeBtn = useRef<HTMLButtonElement>(null)
  useOverlayLock(true, close)

  // focus comes in to the way back, and returns to the button that opened the film
  useEffect(() => {
    const from = document.activeElement as HTMLElement | null
    closeBtn.current?.focus({ preventScroll: true })
    return () => from?.focus?.({ preventScroll: true })
  }, [])

  const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  return createPortal(
    <div className="mf-screen" role="dialog" aria-modal="true" aria-label={t.ui.moon.watch} data-moon>
      <Player film={film} startAt={reduce ? film.duration - 0.3 : null} bare={false} lockQuality={false} note={t.ui.moon.note} autoPlay={!reduce} />
      <button type="button" ref={closeBtn} className="mf-close" aria-label={t.film.close} title={t.film.close} onClick={close} data-moon-close>
        <X size={22} strokeWidth={2.4} aria-hidden />
      </button>
    </div>,
    document.body,
  )
}
