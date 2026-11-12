import { useEffect } from 'react'
import { useSiteStore } from '@/store/useSiteStore'
import { useProfileStore } from '@/store/useProfileStore'
import { go } from '@/app/router'

/** Placeholder for the "enter" feature (who is reading today? + the way into the app). Replace this file; keep the named export. */
export function Enter() {
  const picking = useSiteStore((s) => s.picking)
  useEffect(() => {
    if (!picking) return
    useProfileStore.getState().setProfile({ name: '', avatar: 'sari' })
    go('home')
  }, [picking])
  return null
}
