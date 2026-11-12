import { describe, expect, it } from 'vitest'
import { story } from '@/content/story'
import { words } from '@/content/learning'

describe('companion words', () => {
  it('quote the author verbatim from the scene they point to', () => {
    for (const w of words) {
      const text = story.scenes[w.scene].ar.join('\n')
      expect(text, `"${w.quote.ar}" must appear exactly in scene ${w.scene + 1}`).toContain(w.quote.ar)
    }
  })
  it('point to real scenes and have unique ids', () => {
    expect(new Set(words.map((w) => w.id)).size).toBe(words.length)
    for (const w of words) expect(story.scenes[w.scene]).toBeDefined()
  })
})
