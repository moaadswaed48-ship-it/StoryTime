// Shared by the email edge functions. NOT DEPLOYED OR RUN: no Supabase project and no sending account are
// approved yet. Written against the documented Deno.serve, supabase-js and Resend HTTP APIs.
//
// Settings (Supabase dashboard > Edge Functions > Secrets):
//   SITE_URL              the site, origin + base path, ending in "/" (e.g. https://storytime.example/)
//   RESEND_API_KEY        Resend key with "sending access" only
//   EMAIL_FROM            'StoryTime <hello@your-verified-domain>'
//   EMAIL_REPLY_TO        a real, read inbox (product checklist 24)
//   BUSINESS_DETAILS      business name, ID number and address, one line (until set, emails show the placeholder)
//   SUPPORT_EMAIL         support and refusal address (until set, the placeholder)
//   UNSUBSCRIBE_SECRET    long random string, signs unsubscribe links
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.119.0'
import { renderEmail, resendTransport, type OutgoingEmail, type Params, type SenderDetails, type TemplateId, type Lang } from './emails.mjs'

export const env = (k: string) => Deno.env.get(k) ?? ''

export const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

export function admin(): SupabaseClient {
  return createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } })
}

export function sender(): SenderDetails {
  return { business: env('BUSINESS_DETAILS') || null, supportEmail: env('SUPPORT_EMAIL') || null }
}

export function transport() {
  if (!env('RESEND_API_KEY') || !env('EMAIL_FROM') || !env('EMAIL_REPLY_TO')) return null
  return resendTransport({ apiKey: env('RESEND_API_KEY'), from: env('EMAIL_FROM'), replyTo: env('EMAIL_REPLY_TO') })
}

/**
 * Renders and sends one email and records it in email_log. With a dedupe key the row is claimed first (the key is
 * unique), so two overlapping runs never send the same reminder; a failed send gives the claim back for a retry.
 */
export async function sendLogged<T extends TemplateId>(db: SupabaseClient, o: {
  template: T
  lang: Lang
  to: string
  accountId: string | null
  params: Params[T]
  dedupeKey?: string
  unsubscribeUrl?: string
}): Promise<'sent' | 'skipped' | 'failed'> {
  const tr = transport()
  if (!tr) throw new Error('no_sending_account')
  let logId: string | null = null
  const { data: claimed, error: claimError } = await db
    .from('email_log')
    .insert({ account_id: o.accountId, to_email: o.to, template: o.template, lang: o.lang, status: 'queued', dedupe_key: o.dedupeKey ?? null })
    .select('id')
    .maybeSingle()
  if (claimError) {
    if (o.dedupeKey && /duplicate key/i.test(claimError.message)) return 'skipped'
    throw claimError
  }
  logId = claimed?.id ?? null
  try {
    const rendered = await renderEmail(o.template, o.lang, o.params, sender())
    const email: OutgoingEmail = { ...rendered, to: o.to, unsubscribeUrl: o.unsubscribeUrl, idempotencyKey: o.dedupeKey }
    const r = await tr.send(email)
    await db.from('email_log').update({ status: 'sent', provider_message_id: r.id, sent_at: new Date().toISOString() }).eq('id', logId)
    return 'sent'
  } catch (e) {
    console.error('send failed', o.template, String((e as Error)?.message ?? e))
    // Give the claim back so the next run can try again (the Idempotency-Key stops a double send at Resend).
    if (o.dedupeKey) await db.from('email_log').delete().eq('id', logId)
    else await db.from('email_log').update({ status: 'failed', error: String((e as Error)?.message ?? e).slice(0, 500) }).eq('id', logId)
    return 'failed'
  }
}
