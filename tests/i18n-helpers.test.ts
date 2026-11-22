import { describe, expect, it } from 'vitest'
import { dirOf, pickLang } from '@/i18n/config'
import { dirSign, num } from '@/i18n/helpers'

describe('i18n helpers', () => {
  it('reading direction', () => {
    expect([dirOf('ar'), dirOf('he'), dirOf('en'), dirOf('da')]).toEqual(['rtl', 'rtl', 'ltr', 'ltr'])
    expect([dirSign('ar'), dirSign('he'), dirSign('en'), dirSign('da')]).toEqual([-1, -1, 1, 1])
  })
  it('numbers use Western digits without grouping, in every language', () => {
    expect(num(2026)).toBe('2026')
    expect(num(3.5)).toBe('3.5')
  })
  it('picks the browser language, understands the old Hebrew code, falls back to Arabic', () => {
    expect(pickLang(['da-DK', 'en'])).toBe('da')
    expect(pickLang(['iw-IL'])).toBe('he')
    expect(pickLang(['fr-FR', 'de'])).toBe('ar')
    expect(pickLang(undefined)).toBe('ar')
  })
})
