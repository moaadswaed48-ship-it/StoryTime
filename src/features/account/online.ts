import { useSyncExternalStore } from 'react'

const subscribe = (cb: () => void) => {
  window.addEventListener('online', cb)
  window.addEventListener('offline', cb)
  return () => {
    window.removeEventListener('online', cb)
    window.removeEventListener('offline', cb)
  }
}

/** True unless the browser says it is offline. Pre-rendered pages assume online. */
export const useOnline = () => useSyncExternalStore(subscribe, () => navigator.onLine, () => true)
