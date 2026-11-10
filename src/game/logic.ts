/** Pure rules of the names game: letters must be collected in order; a wrong letter is simply ignored. */
export interface Round { name: string; letters: string[]; got: number }

export const lettersOf = (name: string) => Array.from(name)
export const newRound = (name: string): Round => ({ name, letters: lettersOf(name), got: 0 })
export const wanted = (r: Round) => r.letters[r.got] ?? null
export const isDone = (r: Round) => r.got >= r.letters.length

/** Returns true when the caught letter was the wanted one (and advances the round). */
export function catchLetter(r: Round, ch: string): boolean {
  if (isDone(r) || ch !== wanted(r)) return false
  r.got++
  return true
}

/** Which letter a newly spawned leaf should carry: the wanted one about every other time, otherwise a decoy. */
export function pickLetter(r: Round, rand: () => number, pool: string[]): string {
  const w = wanted(r)
  if (w && rand() < 0.5) return w
  const others = pool.filter((c) => c !== w)
  return others[Math.floor(rand() * others.length)] ?? w ?? ''
}
