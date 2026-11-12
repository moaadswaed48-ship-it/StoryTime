import { useEffect } from 'react'
import { useSiteStore } from '@/store/useSiteStore'

// Overlays can stack (menu → sign-in, book → film). Count them: the page is locked from the first to the last,
// whatever order they close in.
let locks = 0

/** Fullscreen overlays: stop smooth scroll, lock the page, close on Escape. */
export function useOverlayLock(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return
    const lenis = useSiteStore.getState().lenis
    if (locks++ === 0) {
      lenis?.stop()
      document.documentElement.style.overflow = 'hidden'
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      if (--locks === 0) {
        document.documentElement.style.overflow = ''
        useSiteStore.getState().lenis?.start()
      }
    }
  }, [open, onClose])
}
