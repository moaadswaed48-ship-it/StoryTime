import { create } from 'zustand'
import { exposeQA } from '@/lib/qa'

/** Who is reading, and what they have finished. Kept only in this browser (localStorage); nothing is sent anywhere. */
export type Avatar = 'sari' | 'amir' | 'leaf' | 'bird'
export interface Profile {
  name: string
  avatar: Avatar
}
export type Activity = 'read' | 'watched' | 'played'
export interface StoryProgress {
  read: boolean
  watched: boolean
  played: boolean
  /** Last scene (0-based) opened in the book, for "continue". */
  scene: number
  /** First letters the child answered correctly in the game. */
  letters: string[]
}

const KEY = 'st:profile:v1'
const blank = (): StoryProgress => ({ read: false, watched: false, played: false, scene: 0, letters: [] })

interface Saved {
  profile: Profile | null
  progress: Record<string, StoryProgress>
  classroom: boolean
}
interface ProfileState extends Saved {
  setProfile: (profile: Profile | null) => void
  /** Marks an activity of a story as finished (earns a leaf on the child's tree). */
  mark: (storyId: string, what: Activity) => void
  setScene: (storyId: string, scene: number) => void
  addLetter: (storyId: string, letter: string) => void
  /** Classroom mode: bigger text, no rewards, for a teacher presenting to a group. */
  setClassroom: (on: boolean) => void
  reset: () => void
}

function load(): Saved {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const v = JSON.parse(raw) as Partial<Saved>
      return { profile: v.profile ?? null, progress: v.progress ?? {}, classroom: !!v.classroom }
    }
  } catch {
    /* private mode or blocked storage: start empty */
  }
  return { profile: null, progress: {}, classroom: false }
}
function save(s: Saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ profile: s.profile, progress: s.progress, classroom: s.classroom }))
  } catch {
    /* ignore */
  }
}

export const useProfileStore = create<ProfileState>()((set, get) => {
  const patch = (next: Partial<Saved>) => {
    set(next)
    save(get())
  }
  const edit = (storyId: string, fn: (p: StoryProgress) => StoryProgress) =>
    patch({ progress: { ...get().progress, [storyId]: fn(get().progress[storyId] ?? blank()) } })
  return {
    ...load(), // load() guards itself: Safari throws on the localStorage getter when cookies are blocked
    setProfile: (profile) => patch({ profile }),
    mark: (storyId, what) => edit(storyId, (p) => ({ ...p, [what]: true })),
    setScene: (storyId, scene) => edit(storyId, (p) => ({ ...p, scene })),
    addLetter: (storyId, letter) => edit(storyId, (p) => (p.letters.includes(letter) ? p : { ...p, letters: [...p.letters, letter] })),
    setClassroom: (classroom) => patch({ classroom }),
    reset: () => patch({ profile: null, progress: {}, classroom: false }),
  }
})

export const progressOf = (storyId: string) => useProfileStore.getState().progress[storyId] ?? blank()
/** Leaves earned for one story: one each for reading, watching and playing (0–3). */
export const leavesOf = (p?: StoryProgress) => (p ? Number(p.read) + Number(p.watched) + Number(p.played) : 0)

exposeQA({ profile: useProfileStore })
