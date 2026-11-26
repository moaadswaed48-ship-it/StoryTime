import { useCallback, useEffect, useState } from 'react'
import { useSession } from '@/features/account/session'
import { usePrefs } from '@/features/family/prefs'
import { canFullscreen, classroomOn, enterFullscreen, isFullscreen, leaveFullscreen } from './classroom'

/**
 * Classroom mode for the signed-in account: `available` for a teacher account, `on` when that account switched it
 * on (remembered with the account, so it follows it to the classroom computer). Switching it on also asks for full
 * screen, in the same tap; switching it off leaves full screen.
 */
export function useClassroom() {
  const session = useSession()
  const role = session.status === 'signed-in' ? session.account?.role : null
  const [prefs, setPrefs] = usePrefs()
  const available = role === 'teacher'
  const on = classroomOn(role, prefs.classroom)
  const set = useCallback((next: boolean, fullscreen = true) => {
    setPrefs({ classroom: next })
    if (next && fullscreen) void enterFullscreen()
    else if (!next) void leaveFullscreen()
  }, [setPrefs])
  return { available, on, set }
}

/** Whether full screen is possible here and whether the page is in it now (follows Esc and the browser's own exit). */
export function useFullscreen() {
  const [state, setState] = useState({ can: false, active: false })
  useEffect(() => {
    const sync = () => setState({ can: canFullscreen(document), active: isFullscreen(document) })
    sync()
    document.addEventListener('fullscreenchange', sync)
    document.addEventListener('webkitfullscreenchange', sync)
    return () => {
      document.removeEventListener('fullscreenchange', sync)
      document.removeEventListener('webkitfullscreenchange', sync)
    }
  }, [])
  const toggle = useCallback(() => void (isFullscreen(document) ? leaveFullscreen() : enterFullscreen()), [])
  return { ...state, toggle }
}
