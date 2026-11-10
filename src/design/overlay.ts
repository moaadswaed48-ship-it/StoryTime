import { useEffect } from 'react'
import { useSiteStore } from '@/store/useSiteStore'

/** Fullscreen overlays: stop smooth scroll, lock the page, close on Escape. */
export function useOverlayLock(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return
    const lenis = useSiteStore.getState().lenis
    lenis?.stop()
    const prev = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.documentElement.style.overflow = prev
      lenis?.start()
    }
  }, [open, onClose])
}
