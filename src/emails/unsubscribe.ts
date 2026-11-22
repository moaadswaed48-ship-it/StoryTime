import { isLang, type Lang } from '@/i18n/config'

/**
 * One-click unsubscribe links for the news email. The link carries the account id, the email's language and an
 * HMAC-SHA256 signature made with a server secret (UNSUBSCRIBE_SECRET in the edge function), so nobody can
 * unsubscribe someone else by guessing. WebCrypto only: runs in Node, Deno and browsers.
 */
const enc = new TextEncoder()

async function key(secret: string) {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}

const b64url = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const fromB64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4)), (c) => c.charCodeAt(0))

export async function unsubscribeUrl(base: string, secret: string, accountId: string, lang: Lang): Promise<string> {
  const sig = b64url(await crypto.subtle.sign('HMAC', await key(secret), enc.encode(`unsubscribe:${accountId}`)))
  const u = new URL(base)
  u.searchParams.set('a', accountId)
  u.searchParams.set('l', lang)
  u.searchParams.set('s', sig)
  return u.toString()
}

/** The account id and language a link is for, or null when the signature does not match. */
export async function verifyUnsubscribe(url: string | URL, secret: string): Promise<{ accountId: string; lang: Lang } | null> {
  const u = new URL(url)
  const a = u.searchParams.get('a')
  const s = u.searchParams.get('s')
  const l = u.searchParams.get('l')
  if (!a || !s) return null
  let sig: Uint8Array
  try {
    sig = fromB64url(s)
  } catch {
    return null
  }
  const ok = await crypto.subtle.verify('HMAC', await key(secret), sig as BufferSource, enc.encode(`unsubscribe:${a}`))
  return ok ? { accountId: a, lang: isLang(l) ? l : 'ar' } : null
}
