import { useEffect, useRef } from 'react'
import { useSiteStore } from '@/store/useSiteStore'

// Overlays can stack (menu → sign-in, book → checkout). The page is locked from the first to the last, whatever
// order they close in, and Escape closes only the one on top.
const stack: symbol[] = []

/** True while a sheet (checkout or sign-in) is open above the readers. */
export const sheetOnTop = () => {
  const st = useSiteStore.getState()
  return !!st.checkout || st.loginOpen
}

/** Fullscreen overlays: stop smooth scroll, lock the page, close on Escape. */
export function useOverlayLock(open: boolean, onClose: () => void) {
  const id = useRef(Symbol('overlay'))
  useEffect(() => {
    if (!open) return
    const me = id.current
    if (stack.length === 0) {
      useSiteStore.getState().lenis?.stop()
      document.documentElement.style.overflow = 'hidden'
    }
    stack.push(me)
    // bubble phase on purpose: an overlay's own capture handler (a reader closing its panel first) still goes first
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && stack[stack.length - 1] === me) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      const i = stack.indexOf(me)
      if (i >= 0) stack.splice(i, 1)
      if (stack.length === 0) {
        document.documentElement.style.overflow = ''
        useSiteStore.getState().lenis?.start()
      }
    }
  }, [open, onClose])
}
