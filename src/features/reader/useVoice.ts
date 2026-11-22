import { useCallback, useEffect, useRef, useState } from 'react'
import { wordAt, wordsOf } from '@/content/schema'
import type { ReadAlong } from '@/data/types'

/**
 * Plays a page's recording and reports which word is being said. One <audio> element for the whole book, so a
 * phone that allowed it once (after the first tap) lets every later page play.
 *
 * A page with no recording: in development only, and only where the browser has speech, the browser's voice reads
 * it as a stand-in (clearly labelled on screen; never in a built site). Otherwise the page is passed over after a
 * short pause, with a note on screen.
 *
 * Test hook: `window.__storytimeListenRate` (a number) plays recordings faster, so browser tests can read a whole
 * book with the real audio path.
 */
export type VoiceEvents = {
  onEnded: (page: number) => void
  onError: () => void
  /** The browser refused to start sound without a tap. */
  onBlocked: () => void
}
export type ActiveWord = { page: number; word: number } | null

const DEV_SPEECH = import.meta.env.DEV

export function useVoice(events: VoiceEvents) {
  const ev = useRef(events)
  ev.current = events
  const audio = useRef<HTMLAudioElement | null>(null)
  const raf = useRef(0)
  const timer = useRef(0)
  const token = useRef(0)
  const [active, setActive] = useState<ActiveWord>(null)
  const [mode, setMode] = useState<'recording' | 'speech' | 'none' | null>(null)

  useEffect(() => {
    const a = new Audio()
    a.preload = 'auto'
    audio.current = a
    return () => {
      a.pause()
      a.removeAttribute('src')
      cancelAnimationFrame(raf.current)
      clearTimeout(timer.current)
      if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel()
    }
  }, [])

  const stop = useCallback(() => {
    token.current++
    cancelAnimationFrame(raf.current)
    clearTimeout(timer.current)
    audio.current?.pause()
    if (typeof speechSynthesis !== 'undefined' && DEV_SPEECH) speechSynthesis.cancel()
    setActive(null)
    setMode(null)
  }, [])

  const start = useCallback((page: number, readAlong: ReadAlong | null, text: string, lang: string) => {
    stop()
    const my = ++token.current
    const done = () => {
      if (my !== token.current) return
      cancelAnimationFrame(raf.current)
      setActive(null)
      ev.current.onEnded(page)
    }
    const a = audio.current
    if (readAlong && a) {
      setMode('recording')
      a.src = readAlong.audioUrl
      a.currentTime = 0
      const rate = Number((window as unknown as { __storytimeListenRate?: number }).__storytimeListenRate) || 1
      a.playbackRate = rate
      a.onended = done
      a.onerror = () => my === token.current && ev.current.onError()
      let last = -2
      const tick = () => {
        if (my !== token.current) return
        const w = wordAt(readAlong.timing, a.currentTime)
        if (w !== last) {
          last = w
          setActive(w >= 0 ? { page, word: w } : null)
        }
        raf.current = requestAnimationFrame(tick)
      }
      a.play().then(
        () => {
          if (my === token.current) raf.current = requestAnimationFrame(tick)
        },
        (e: Error) => {
          if (my !== token.current) return
          if (e?.name === 'NotAllowedError') ev.current.onBlocked()
          else ev.current.onError()
        },
      )
      return
    }
    if (DEV_SPEECH && typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined') {
      setMode('speech')
      const u = new SpeechSynthesisUtterance(text)
      u.lang = lang
      const starts: number[] = []
      let at = 0
      for (const w of wordsOf(text)) {
        const i = text.indexOf(w, at)
        starts.push(i)
        at = i + w.length
      }
      u.onboundary = (e) => {
        if (my !== token.current) return
        let k = 0
        while (k + 1 < starts.length && starts[k + 1]! <= e.charIndex) k++
        setActive({ page, word: k })
      }
      u.onend = done
      u.onerror = done
      speechSynthesis.speak(u)
      return
    }
    setMode('none')
    timer.current = window.setTimeout(done, 1400)
  }, [stop])

  return { start, stop, active, mode }
}
