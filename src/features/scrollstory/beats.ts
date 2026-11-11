import { BookOpen, Gamepad2, Play, type LucideIcon } from 'lucide-react'
import { t } from '@/i18n/copy'
import { useSiteStore } from '@/store/useSiteStore'

export interface Beat {
  word: string
  line: string
  /** Pill label (existing copy: the same verbs the hero and the game use). */
  cta: string
  Icon: LucideIcon
  /** The action stays on this page (scrolls down) instead of opening an overlay. */
  down?: boolean
  run: () => void
}

function toGame() {
  const el = document.querySelector('#game')
  if (!el) return
  const lenis = useSiteStore.getState().lenis
  if (lenis) lenis.scrollTo('#game', { offset: -80 })
  else el.scrollIntoView()
}

/** Read · watch · play — one story, three ways. */
export const beats: Beat[] = [
  { ...t.scroll.beats[0], cta: t.hero.read, Icon: BookOpen, run: () => useSiteStore.getState().openBook() },
  { ...t.scroll.beats[1], cta: t.hero.watch, Icon: Play, run: () => useSiteStore.getState().openFilm() },
  { ...t.scroll.beats[2], cta: t.game.start, Icon: Gamepad2, down: true, run: toGame },
]

/** Tiny blurred first frame (56×31 WebP, 506 bytes) shown under the canvas until the real frame has loaded. */
export const LQIP =
  'data:image/webp;base64,UklGRvIBAABXRUJQVlA4IOYBAACwCgCdASo4AB8APslMo0unpCMhs/maqPAZCWYAqScExnhW4arNL7Z1zu9+YREjEVBM/g68Ibd68/bfpRTVURrE7JIA5Jv8QxdopfUNWpyaqW27hT0SA0l2XGkuAm8AAP6IJ2fJeSzO8coWHN2KSWILDUr5WkQIGkvfr0PkzTTJoY7Klc5/EmqDrsBD+qePyOGDjCMzLWR/0Np/YvUP5hJwbtsAapf1+UMxxyax1WqXgTC6/0oQyi2Pd7kcgQnGHR66CxEI5XuZpP0jUjW2+cADbSkkBcoqm6fBNbM+itE/xJo/nPCrNJg2PYEP+vTAsp5PwmMjCmZtZOKyESdyeYtmtqS0W7Sv+egBDipwLaNzABEgWGxi7QpyxHHg1gregeh2s1gTanmlXTkB26/coGz/bxJfg9UA/WqSenU9UxJgmqf/LRQm2FU6qnBs31J9ThOJgn4iNUTtljD0C10dA9SRihfS50kCnoWXrDx/utmDxA7E18JaSmaH1eCoG/7k3Gc11qdxvOC+7R9CcVTX77gy5EUfX5gnDxiG2fig8QiCvMKowVUCSOCHe+JNdU5SR5mxV32pGJsobKikGpB5a2bSzHnVaXC0cLPdw8USYWBjd603cvvcUxA714kXFWXxny6IY7ygQAA='
