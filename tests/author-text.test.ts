import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { story } from '~content/author/autumn-story'

/**
 * The author's Arabic text is hers (project rule 3). This fingerprint was taken from the old build's
 * src/content/story.ts on 22 Nov 2026; if it changes, someone edited her words. Do not update it without
 * her written consent.
 */
const FINGERPRINT = 'fac7c6b36f6a730cd1d3c8c2dcc531657c835ea65fb444c6ab17d276cd49b295'

describe("the author's story", () => {
  it('Arabic paragraphs are byte-identical to the old build', () => {
    const ar = story.scenes.flatMap((s) => s.ar)
    expect(ar).toHaveLength(37)
    expect(createHash('sha256').update(ar.join('\n'), 'utf8').digest('hex')).toBe(FINGERPRINT)
  })
  it('carries no picture, film or cover references', () => {
    const src = readFileSync(new URL('../content/author/autumn-story.ts', import.meta.url), 'utf8')
    expect(src).not.toMatch(/\.(webp|jpe?g|png|mp4|webm|glb)\b/)
  })
})
