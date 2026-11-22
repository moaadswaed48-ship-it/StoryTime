// Supabase edge function (Deno): the ONE server path that turns a payment into a pass.
//
// Every provider's server callback ends in public.confirm_payment() (or record_payment_failure()), which stores
// each provider event once and creates the pass. The browser's return to a "success" page never unlocks anything.
//
// Providers:
//   test     The test checkout (src/data/payments/test-provider.ts). Accepted only where the environment variable
//            ALLOW_TEST_PAYMENTS=1 is set (the preview project, never production), and only from the signed-in
//            owner of the order.
//   others   Not connected yet. When the owner's payment company is chosen (docs/LEGAL-CHECKLIST.md section 3),
//            add its branch here: verify the callback's signature, then confirm the transaction with the
//            provider's own lookup API (for Cardcom: a lookup, not the success page) before calling confirm_payment.
//
// NOT DEPLOYED OR RUN: no Supabase project is approved yet. Written against the documented Deno.serve and
// supabase-js APIs.
import { createClient } from 'npm:@supabase/supabase-js@2.119.0'

type Event = {
  provider: string
  eventId: string
  orderId: string
  kind: 'payment_succeeded' | 'payment_failed' | 'payment_cancelled'
  providerPaymentId: string
  amountAgorot: number
}

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' })
  const url = Deno.env.get('SUPABASE_URL')!
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })

  let e: Event
  try {
    e = await req.json()
  } catch {
    return json(400, { error: 'bad_json' })
  }
  if (!e || typeof e.eventId !== 'string' || typeof e.orderId !== 'string') return json(400, { error: 'bad_event' })

  if (e.provider === 'test') {
    if (Deno.env.get('ALLOW_TEST_PAYMENTS') !== '1') return json(403, { error: 'test_payments_off' })
    // The caller must be the signed-in owner of the order.
    const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? ''
    const { data: who } = await admin.auth.getUser(token)
    if (!who?.user) return json(401, { error: 'not_signed_in' })
    const { data: order } = await admin.from('orders').select('account_id, provider').eq('id', e.orderId).maybeSingle()
    if (!order || order.account_id !== who.user.id || order.provider !== 'test') return json(403, { error: 'not_your_order' })
  } else {
    return json(400, { error: 'provider_not_connected' })
  }

  const { error } = e.kind === 'payment_succeeded'
    ? await admin.rpc('confirm_payment', {
        p_provider: e.provider, p_event_id: e.eventId, p_order_id: e.orderId,
        p_provider_payment_id: e.providerPaymentId, p_amount_agorot: e.amountAgorot, p_payload: e,
      })
    : await admin.rpc('record_payment_failure', { p_provider: e.provider, p_event_id: e.eventId, p_order_id: e.orderId, p_kind: e.kind, p_payload: e })
  if (error) return json(422, { error: error.message })
  return json(200, { ok: true })
})
