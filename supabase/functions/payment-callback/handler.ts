// The payment callback's request handling, with no Deno or npm imports, so tests/payment-callback.test.ts runs
// exactly this code in Node. index.ts wires it to Deno.serve, the environment and supabase-js.
//
// Cross-origin (review finding B1): the browser's test checkout calls this function from the site, so it sends a
// preflight (OPTIONS) first. Only the site's own origins, from the SITE_ORIGINS setting, are answered with
// Access-Control-Allow-* headers, on the preflight and on every response. Never "*". A provider's server callback
// has no Origin header and needs none of this.

export type ProviderEvent = {
  provider: string
  eventId: string
  orderId: string
  kind: 'payment_succeeded' | 'payment_failed' | 'payment_cancelled'
  providerPaymentId: string
  amountAgorot: number
}

/** What the handler needs from the database, through the service role. */
export interface Admin {
  /** The user a bearer token belongs to, or null. */
  userIdFromToken(token: string): Promise<string | null>
  getOrder(id: string): Promise<{ account_id: string | null; provider: string } | null>
  rpc(fn: 'confirm_payment' | 'record_payment_failure', args: Record<string, unknown>): Promise<{ error: { message: string } | null }>
}

export type Config = {
  /** The site's own origins, for example ["https://storytime.example", "https://preview.storytime.example"]. */
  allowedOrigins: readonly string[]
  /** ALLOW_TEST_PAYMENTS=1: only on the preview project. The database has its own switch too (private.settings). */
  allowTestPayments: boolean
}

/** Reads SITE_ORIGINS ("https://a.example, https://b.example"): exact origins only; "*" and malformed entries are dropped. */
export function parseOrigins(raw: string | undefined | null): string[] {
  return (raw ?? '')
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, ''))
    .filter((s) => {
      try {
        const u = new URL(s)
        return u.origin === s && (u.protocol === 'https:' || u.hostname === 'localhost' || u.hostname === '127.0.0.1')
      } catch {
        return false
      }
    })
}

const ALLOW_HEADERS = 'authorization, x-client-info, apikey, content-type'

/** The cross-origin headers for one request: the allow headers only when its Origin is one of the site's own. */
export function corsHeaders(origin: string | null, allowed: readonly string[]): Record<string, string> {
  const h: Record<string, string> = { Vary: 'Origin' }
  if (origin && allowed.includes(origin)) {
    h['Access-Control-Allow-Origin'] = origin
    h['Access-Control-Allow-Headers'] = ALLOW_HEADERS
    h['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
    h['Access-Control-Max-Age'] = '600'
  }
  return h
}

const KINDS = new Set(['payment_succeeded', 'payment_failed', 'payment_cancelled'])

/** A well-formed event, or null. */
function readEvent(e: unknown): ProviderEvent | null {
  if (!e || typeof e !== 'object') return null
  const x = e as Record<string, unknown>
  if (typeof x.provider !== 'string' || typeof x.eventId !== 'string' || !x.eventId || typeof x.orderId !== 'string' || !KINDS.has(x.kind as string)) return null
  if (x.kind === 'payment_succeeded' && (typeof x.providerPaymentId !== 'string' || !Number.isInteger(x.amountAgorot))) return null
  return {
    provider: x.provider, eventId: x.eventId, orderId: x.orderId, kind: x.kind as ProviderEvent['kind'],
    providerPaymentId: typeof x.providerPaymentId === 'string' ? x.providerPaymentId : '', amountAgorot: Number(x.amountAgorot ?? 0),
  }
}

export function makeHandler(cfg: Config, admin: () => Admin): (req: Request) => Promise<Response> {
  return async (req) => {
    const cors = corsHeaders(req.headers.get('origin'), cfg.allowedOrigins)
    const json = (status: number, body: unknown) =>
      new Response(JSON.stringify(body), { status, headers: { ...cors, 'content-type': 'application/json' } })

    if (req.method === 'OPTIONS') {
      // A preflight from anywhere but the site is refused (no allow headers: the browser blocks the call).
      return new Response(null, { status: cors['Access-Control-Allow-Origin'] ? 204 : 403, headers: cors })
    }
    if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' })

    let e: ProviderEvent | null
    try {
      e = readEvent(await req.json())
    } catch {
      return json(400, { error: 'bad_json' })
    }
    if (!e) return json(400, { error: 'bad_event' })
    const db = admin()

    if (e.provider === 'test') {
      if (!cfg.allowTestPayments) return json(403, { error: 'test_payments_off' })
      // The caller must be the signed-in owner of the order.
      const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? ''
      const uid = token ? await db.userIdFromToken(token) : null
      if (!uid) return json(401, { error: 'not_signed_in' })
      const order = await db.getOrder(e.orderId)
      if (!order || order.account_id !== uid || order.provider !== 'test') return json(403, { error: 'not_your_order' })
    } else {
      return json(400, { error: 'provider_not_connected' })
    }

    // Only the fields this function understands are stored (review finding W7): a real provider's message can
    // carry the buyer's name, email or phone, which have no place in provider_events.
    const payload = {
      provider: e.provider, eventId: e.eventId, orderId: e.orderId, kind: e.kind, providerPaymentId: e.providerPaymentId, amountAgorot: e.amountAgorot,
    }
    const { error } = e.kind === 'payment_succeeded'
      ? await db.rpc('confirm_payment', {
          p_provider: e.provider, p_event_id: e.eventId, p_order_id: e.orderId,
          p_provider_payment_id: e.providerPaymentId, p_amount_agorot: e.amountAgorot, p_payload: payload,
        })
      : await db.rpc('record_payment_failure', { p_provider: e.provider, p_event_id: e.eventId, p_order_id: e.orderId, p_kind: e.kind, p_payload: payload })
    if (error) return json(422, { error: error.message })
    return json(200, { ok: true })
  }
}
