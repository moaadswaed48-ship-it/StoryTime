import type { PGlite } from '@electric-sql/pglite'
import { beforeAll, describe, expect, it } from 'vitest'
import { corsHeaders, makeHandler, parseOrigins, type Admin } from '../supabase/functions/payment-callback/handler.ts'
import { freshDb, rows, service, signUp, user } from './db/harness'

/**
 * The payment-callback edge function's request handling (supabase/functions/payment-callback/handler.ts), with its
 * database calls going to PGlite as the service role. Review finding B1: the browser's preflight is answered, and
 * every response carries the cross-origin headers for the site's own origins only.
 */
const SITE = 'https://storytime.example'
const cfg = { allowedOrigins: parseOrigins(`${SITE}/, https://preview.storytime.example, *, http://evil.example, not a url`), allowTestPayments: true }

let db: PGlite
let uid: string
let orderId: string

const admin = (): Admin => ({
  userIdFromToken: async (token) => (token === 'good-token' ? uid : null),
  getOrder: async (id) => (await db.query<{ account_id: string | null; provider: string }>(`select account_id, provider from orders where id = $1`, [id])).rows[0] ?? null,
  rpc: async (fn, args) => {
    const names = Object.keys(args)
    try {
      await rows(db, service, `select public.${fn}(${names.map((n, i) => `${n} => $${i + 1}`).join(', ')})`, names.map((n) => args[n]))
      return { error: null }
    } catch (e) {
      return { error: { message: (e as Error).message } }
    }
  },
})
const handle = makeHandler(cfg, admin)

const post = (body: unknown, origin: string | null = SITE, token = 'good-token') =>
  handle(new Request('https://project.supabase.co/functions/v1/payment-callback', {
    method: 'POST',
    headers: { ...(origin ? { origin } : {}), authorization: `Bearer ${token}`, 'content-type': 'application/json', apikey: 'k', 'x-client-info': 'supabase-js' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  }))

beforeAll(async () => {
  db = await freshDb()
  uid = await signUp(db, 'cors@example.test')
  orderId = (await rows<{ id: string }>(db, user(uid), `select * from create_order('4-5', 1, 'test', 'terms-1', null)`))[0]!.id
}, 60_000)

describe('payment-callback cross-origin (B1)', () => {
  it('keeps only exact site origins from the setting, never "*"', () => {
    expect(cfg.allowedOrigins).toEqual([SITE, 'https://preview.storytime.example'])
    expect(corsHeaders('https://elsewhere.example', cfg.allowedOrigins)['Access-Control-Allow-Origin']).toBeUndefined()
  })

  it('answers the browser\'s preflight from the site with the allow headers', async () => {
    const r = await handle(new Request('https://x/functions/v1/payment-callback', {
      method: 'OPTIONS',
      headers: { origin: SITE, 'access-control-request-method': 'POST', 'access-control-request-headers': 'authorization, x-client-info, apikey, content-type' },
    }))
    expect(r.status).toBe(204)
    expect(r.headers.get('access-control-allow-origin')).toBe(SITE)
    expect(r.headers.get('access-control-allow-methods')).toBe('POST, OPTIONS')
    for (const h of ['authorization', 'x-client-info', 'apikey', 'content-type']) expect(r.headers.get('access-control-allow-headers')).toContain(h)
  })

  it('refuses a preflight from another origin, without allow headers', async () => {
    const r = await handle(new Request('https://x/', { method: 'OPTIONS', headers: { origin: 'https://evil.example' } }))
    expect(r.status).toBe(403)
    expect(r.headers.get('access-control-allow-origin')).toBeNull()
  })

  it('sends the headers on every response: errors included', async () => {
    const responses = [
      await handle(new Request('https://x/', { method: 'GET', headers: { origin: SITE } })),
      await post('{not json'),
      await post({ provider: 'test' }),
      await post({ provider: 'test', eventId: 'e0', orderId, kind: 'payment_succeeded', providerPaymentId: 'p', amountAgorot: 0 }, SITE, 'bad-token'),
      await post({ provider: 'cardcom', eventId: 'e0', orderId, kind: 'payment_succeeded', providerPaymentId: 'p', amountAgorot: 0 }),
      await post({ provider: 'test', eventId: 'e-wrong', orderId, kind: 'payment_succeeded', providerPaymentId: 'p', amountAgorot: 5 }),
    ]
    expect(responses.map((r) => r.status)).toEqual([405, 400, 400, 401, 400, 422])
    for (const r of responses) expect(r.headers.get('access-control-allow-origin')).toBe(SITE)
  })

  it('a test payment from the site makes the pass, and stores only the known fields of the event', async () => {
    const r = await post({ provider: 'test', eventId: 'e-ok', orderId, kind: 'payment_succeeded', providerPaymentId: 'p-ok', amountAgorot: 0, buyerName: 'Rania', phone: '050' })
    expect(r.status).toBe(200)
    expect(r.headers.get('access-control-allow-origin')).toBe(SITE)
    expect(await rows(db, user(uid), `select count(*)::int as n from passes`)).toEqual([{ n: 1 }])
    const [ev] = (await db.query<{ payload: Record<string, unknown> }>(`select payload from provider_events where event_id = 'e-ok'`)).rows
    expect(Object.keys(ev!.payload).sort()).toEqual(['amountAgorot', 'eventId', 'kind', 'orderId', 'provider', 'providerPaymentId'])
  })

  it('a server-to-server call (no Origin) gets no allow headers and still works', async () => {
    const r = await post({ provider: 'test', eventId: 'e-ok', orderId, kind: 'payment_succeeded', providerPaymentId: 'p-ok', amountAgorot: 0 }, null)
    expect(r.status).toBe(200)
    expect(r.headers.get('access-control-allow-origin')).toBeNull()
  })
})
