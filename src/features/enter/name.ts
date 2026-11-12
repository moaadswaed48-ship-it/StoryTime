export const NAME_MAX = 14

/** A name as a child would write it on a paper: Arabic or Latin, no control characters, single spaces, at most 14 characters. */
export function cleanName(raw: string): string {
  const s = raw.replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').replace(/^ /, '')
  return Array.from(s).slice(0, NAME_MAX).join('')
}
