import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const SCRIPT = resolve(__dirname, '../scripts/export.mjs')
const run = (...a: string[]) => execFileSync('node', [SCRIPT, ...a], { encoding: 'utf8', cwd: resolve(__dirname, '../..') })

describe('the export script', () => {
  const dir = mkdtempSync(join(tmpdir(), 'studio-export-'))
  it('lists the scenes', () => {
    const out = run('list')
    for (const id of ['spread-oranges', 'shot-tower', 'cast-sheet', 'gesture-sheet', 'face-sheet', 'places', 'loop-clap']) expect(out).toContain(id)
  })
  it('renders a still as PNG and as WebP', () => {
    const png = join(dir, 'a.png')
    run('still', 'face-sheet', '--scale=0.25', `--out=${png}`)
    expect(readFileSync(png).subarray(1, 4).toString()).toBe('PNG')
    expect(statSync(png).size).toBeGreaterThan(20000)
    const webp = join(dir, 'a.webp')
    run('still', 'spread-oranges', '--scale=0.25', '--format=webp', '--lang=ar', `--out=${webp}`)
    expect(readFileSync(webp).subarray(8, 12).toString()).toBe('WEBP')
  })
  it('renders a stretch of film to MP4 with captions beside it, and a loop', () => {
    const mp4 = join(dir, 'b.mp4')
    run('video', 'shot-tower', '--from=3', '--to=3.5', '--scale=0.25', `--out=${mp4}`)
    expect(statSync(mp4).size).toBeGreaterThan(3000)
    expect(readFileSync(join(dir, 'b.ar.vtt'), 'utf8')).toMatch(/^WEBVTT/)
    const loop = join(dir, 'c.mp4')
    run('loop', 'loop-clap', '--scale=0.25', '--fps=12', `--out=${loop}`)
    expect(existsSync(loop)).toBe(true)
  })
})
