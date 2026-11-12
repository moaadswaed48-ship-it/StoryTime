import { describe, expect, it } from 'vitest'
import { cleanName, NAME_MAX } from '../src/features/enter/name'

describe('enter: the name a child writes on the paper', () => {
  it('keeps Arabic and Latin names as written', () => {
    expect(cleanName('لينا')).toBe('لينا')
    expect(cleanName('Lina')).toBe('Lina')
    expect(cleanName('عبد الله')).toBe('عبد الله')
  })
  it('collapses spaces, drops leading space and control characters', () => {
    expect(cleanName('   لينا   الصغيرة')).toBe('لينا الصغيرة')
    expect(cleanName('Li\u0000na\n')).toBe('Lina')
    expect(cleanName('<b>x</b>')).toBe('bx/b')
  })
  it('stops at 14 characters, counting letters and not bytes', () => {
    expect(NAME_MAX).toBe(14)
    expect(Array.from(cleanName('لينا الصغيرة جدًا جدًا'))).toHaveLength(14)
    expect(cleanName('abcdefghijklmnopqrstuvwxyz')).toBe('abcdefghijklmn')
  })
})
