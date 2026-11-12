import { BookOpen, Gamepad2, Play, type LucideIcon } from 'lucide-react'
import { t } from '@/i18n/copy'
import { useSiteStore } from '@/store/useSiteStore'

export interface Beat {
  word: string
  line: string
  /** Pill label (existing copy: the same verbs the hero and the game use). */
  cta: string
  Icon: LucideIcon
  run: () => void
}

/** Read · watch · play — one story, three ways. Each beat opens its full-screen experience (SPEC 5.0). */
export const beats: Beat[] = [
  { ...t.scroll.beats[0], cta: t.hero.read, Icon: BookOpen, run: () => useSiteStore.getState().openBook() },
  { ...t.scroll.beats[1], cta: t.hero.watch, Icon: Play, run: () => useSiteStore.getState().openFilm() },
  { ...t.scroll.beats[2], cta: t.game.start, Icon: Gamepad2, run: () => useSiteStore.getState().openGame() },
]
