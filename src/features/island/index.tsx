import { useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useOverlayLock } from '@/design/overlay'
import { story } from '@/content/story'
import { t } from '@/i18n/copy'
import { locale } from '@/i18n/locale'
import { asset } from '@/lib/asset'
import { exposeQA } from '@/lib/qa'
import { useProfileStore } from '@/store/useProfileStore'
import { useSiteStore } from '@/store/useSiteStore'

/**
 * "Friends Island" (جزيرة الأصدقاء): the service's own game, not tied to one story. It is a separate small app
 * (source in `game-src/`, a remix of the open-source Wigglewild; built to static files in `public/play/friends-island/`)
 * shown full-screen in a frame while `overlay === 'game'`, so every "play" door on the site opens it.
 *
 *  - The way back is this overlay's own close button, which works even if the game fails to load. The game's menu
 *    also has "leave the game", which asks this overlay to close (a message from the frame, same origin only).
 *  - Each child profile gets its own saved game (`?p=`); the game keeps its progress in this browser only.
 *  - Finishing the first three missions (hatch, eat, a first friend) earns the "played" leaf on the child's tree.
 */
const SRC = 'play/friends-island/index.html'

/** A short, stable id for the child who is playing (their name never leaves the page: only this number does). */
function profileId() {
  const p = useProfileStore.getState().profile
  if (!p) return 'guest'
  let h = 5381
  for (const ch of `${p.name}|${p.avatar}`) h = ((h * 33) ^ ch.codePointAt(0)!) >>> 0
  return `k${h.toString(36)}`
}

export function IslandOverlay() {
  const open = useSiteStore((s) => s.overlay === 'game')
  const frame = useRef<HTMLIFrameElement>(null)
  const close = useCallback(() => useSiteStore.getState().closeOverlay(), [])
  useOverlayLock(open, close)

  useEffect(() => {
    if (!open) return
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== location.origin || e.source !== frame.current?.contentWindow) return
      const d = e.data as { source?: string; type?: string; done?: number } | null
      if (!d || d.source !== 'friends-island') return
      if (d.type === 'exit') close()
      else if (d.type === 'progress' && (d.done ?? 0) >= 3) useProfileStore.getState().mark(story.id, 'played')
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [open, close])

  if (!open) return null
  const src = `${asset(SRC)}?embed=1&lang=${locale}&p=${profileId()}`
  return createPortal(
    <div className="fixed inset-0 z-[70] bg-[#9fd3f5]" role="dialog" aria-modal="true" aria-label={t.nav.game} data-island>
      <iframe
        ref={frame}
        src={src}
        title={t.nav.game}
        className="absolute inset-0 h-full w-full border-0"
        allow="autoplay; gamepad; fullscreen"
        onLoad={() => frame.current?.focus()}
      />
      <button
        type="button"
        onClick={close}
        aria-label={t.nav.close}
        title={t.nav.close}
        data-island-close
        className="absolute end-[calc(0.625rem+env(safe-area-inset-right,0px))] top-[calc(0.625rem+env(safe-area-inset-top,0px))] z-10 grid h-[52px] w-[52px] cursor-pointer place-items-center rounded-2xl border-[3px] border-[#23263a] bg-[#fffaf0] text-[#23263a] shadow-[0_4px_0_#23263a] transition-transform active:translate-y-[3px] active:shadow-[0_1px_0_#23263a]"
      >
        <X size={24} strokeWidth={2.6} aria-hidden />
      </button>
    </div>,
    document.body,
  )
}

// Tests and screenshot scripts: window.__st.island.open() / close()
exposeQA({
  island: {
    open: () => useSiteStore.getState().openGame(),
    close: () => useSiteStore.getState().closeOverlay(),
    src: () => `${asset(SRC)}?embed=1&lang=${locale}&p=${profileId()}`,
  },
})
