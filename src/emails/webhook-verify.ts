/**
 * Checks a signed webhook the way Svix documents it (Resend's webhooks use Svix): the signed content is
 * "<svix-id>.<svix-timestamp>.<raw body>", HMAC-SHA256 with the base64 secret after "whsec_", base64 result; the
 * svix-signature header holds one or more "v1,<signature>" separated by spaces. Old messages are refused.
 * WebCrypto only, so it runs in a Supabase edge function. Written from docs.svix.com "verifying payloads manually".
 */
const enc = new TextEncoder()
export const TOLERANCE_S = 5 * 60

function b64(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function svixSignature(secret: string, id: string, timestamp: string, body: string): Promise<string> {
  const raw = Uint8Array.from(atob(secret.replace(/^whsec_/, '')), (c) => c.charCodeAt(0))
  const key = await crypto.subtle.importKey('raw', raw, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return b64(await crypto.subtle.sign('HMAC', key, enc.encode(`${id}.${timestamp}.${body}`)))
}

export async function verifySvix(secret: string, headers: { id: string | null; timestamp: string | null; signature: string | null }, body: string, nowS = Math.floor(Date.now() / 1000)): Promise<boolean> {
  const { id, timestamp, signature } = headers
  if (!id || !timestamp || !signature) return false
  const ts = Number(timestamp)
  if (!Number.isFinite(ts) || Math.abs(nowS - ts) > TOLERANCE_S) return false
  const expected = await svixSignature(secret, id, timestamp, body)
  return signature.split(' ').some((part) => {
    const [version, sig] = part.split(',')
    return version === 'v1' && !!sig && constantTimeEqual(sig, expected)
  })
}
