// Supabase edge function (Deno): the ONE server path that turns a payment into a pass.
//
// Every provider's server callback ends in public.confirm_payment() (or record_payment_failure()), which stores
// each provider event once and creates the pass. The browser's return to a "success" page never unlocks anything.
// The request handling itself is in handler.ts (tested in Node by tests/payment-callback.test.ts).
//
// Settings (function secrets):
//   SITE_ORIGINS         The site's own origins, comma-separated, e.g. "https://storytime.example". Only these get
//                        cross-origin headers; the browser's test checkout needs its origin listed here.
//   ALLOW_TEST_PAYMENTS  "1" only on the preview project. The database must allow it too:
//                        update private.settings set allow_test_payments = true;
//
// Providers:
//   test     The test checkout (src/data/payments/test-provider.ts). Accepted only where ALLOW_TEST_PAYMENTS=1, and
//            only from the signed-in owner of the order.
//   others   Not connected yet. When the owner's payment company is chosen (docs/LEGAL-CHECKLIST.md section 3),
//            add its branch in handler.ts: verify the callback's signature, then confirm the transaction with the
//            provider's own lookup API (for Cardcom: a lookup, not the success page) before calling confirm_payment;
//            and list it in the database: update private.settings set payment_providers = '{cardcom}';
//
// NOT DEPLOYED OR RUN on Supabase: no Supabase project is approved yet. Written against the documented Deno.serve
// and supabase-js APIs.
import { createClient } from 'npm:@supabase/supabase-js@2.119.0'
import { makeHandler, parseOrigins, type Admin } from './handler.ts'

const admin = (): Admin => {
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })
  return {
    userIdFromToken: async (token) => (await sb.auth.getUser(token)).data?.user?.id ?? null,
    getOrder: async (id) => (await sb.from('orders').select('account_id, provider').eq('id', id).maybeSingle()).data,
    rpc: async (fn, args) => ({ error: (await sb.rpc(fn, args)).error }),
  }
}

Deno.serve(makeHandler({ allowedOrigins: parseOrigins(Deno.env.get('SITE_ORIGINS')), allowTestPayments: Deno.env.get('ALLOW_TEST_PAYMENTS') === '1' }, admin))
