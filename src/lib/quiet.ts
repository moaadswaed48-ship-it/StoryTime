/**
 * Ambient films (muted, inline). An iPhone in Low Power Mode refuses to start them on its own; the request is
 * remembered and tried again on the visitor's first touch, if the film is still meant to be playing.
 */
export function playQuietly(v: HTMLVideoElement) {
  v.dataset.want = '1'
  v.play().catch(() => {
    const retry = () => {
      if (v.isConnected && v.dataset.want === '1' && v.paused) v.play().catch(() => {})
    }
    document.addEventListener('touchend', retry, { once: true, passive: true })
    document.addEventListener('click', retry, { once: true })
  })
}
export function pauseQuietly(v: HTMLVideoElement) {
  v.dataset.want = ''
  v.pause()
}
