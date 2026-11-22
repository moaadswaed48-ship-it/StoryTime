// Resend webhook: records permanent bounces and spam complaints, so that address gets no further email
// (product checklist 24: "Bounces and unsubscribes recorded (email_log)").
//
// NOT DEPLOYED OR RUN. Resend signs webhooks with Svix (headers svix-id, svix-timestamp, svix-signature; secret
// "whsec_..." in RESEND_WEBHOOK_SECRET); checked by verifySvix() in src/emails/webhook-verify.ts (unit-tested).
// Event names from https://resend.com/docs/dashboard/webhooks/event-types: email.bounced, email.complained.
// In Resend: Webhooks > add this function's URL, events email.bounced and email.complained. Deploy with
// --no-verify-jwt. Run `npm run emails:bundle` first.
import { admin, env, json } from '../_shared/mail.ts'
import { verifySvix } from '../_shared/emails.mjs'

type ResendEvent = { type: string; data: { email_id?: string; to?: string[]; bounce?: { type?: string } } }

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' })
  const body = await req.text()
  const ok = await verifySvix(env('RESEND_WEBHOOK_SECRET'), {
    id: req.headers.get('svix-id'), timestamp: req.headers.get('svix-timestamp'), signature: req.headers.get('svix-signature'),
  }, body)
  if (!ok) return json(401, { error: 'invalid_signature' })

  const e = JSON.parse(body) as ResendEvent
  const db = admin()
  const to = (e.data.to ?? []).map((x) => x.toLowerCase())
  let reason: 'bounced' | 'complained' | null = null
  // A temporary bounce (mailbox full) is not a reason to stop writing.
  if (e.type === 'email.bounced' && (e.data.bounce?.type ?? 'Permanent') === 'Permanent') reason = 'bounced'
  if (e.type === 'email.complained') reason = 'complained'
  if (!reason) return json(200, { ignored: e.type })

  for (const email of to) await db.from('email_suppressions').upsert({ email, reason }, { onConflict: 'email' })
  if (e.data.email_id) await db.from('email_log').update({ status: reason }).eq('provider_message_id', e.data.email_id)
  return json(200, { recorded: reason, addresses: to.length })
})
