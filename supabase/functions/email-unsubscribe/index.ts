// One-click unsubscribe from the news email (legal checklist item 34: a simple, free way to refuse, at any time).
// GET  from the link in the email: unsubscribes and answers with one plain line in the email's language.
// POST from the mail app's own "Unsubscribe" button (RFC 8058, List-Unsubscribe-Post header): same, empty answer.
// The refusal is recorded at once as a consent row (kind marketing, granted false, source email-link).
//
// NOT DEPLOYED OR RUN. Plain text, not a page: Supabase serves edge-function HTML as text on its own domain.
// Deploy with --no-verify-jwt (the link carries its own signature). Run `npm run emails:bundle` first.
import { admin, env } from '../_shared/mail.ts'
import { UNSUBSCRIBE_FAILED, UNSUBSCRIBED, verifyUnsubscribe } from '../_shared/emails.mjs'

const text = (status: number, body: string) => new Response(body, { status, headers: { 'content-type': 'text/plain; charset=utf-8' } })

Deno.serve(async (req) => {
  if (req.method !== 'GET' && req.method !== 'POST') return text(405, '')
  const who = await verifyUnsubscribe(req.url, env('UNSUBSCRIBE_SECRET'))
  const lang = (new URL(req.url).searchParams.get('l') ?? 'ar') as keyof typeof UNSUBSCRIBED
  if (!who) return text(400, UNSUBSCRIBE_FAILED[lang] ?? UNSUBSCRIBE_FAILED.ar)
  const { error } = await admin().from('consents').insert({ account_id: who.accountId, kind: 'marketing', granted: false, source: 'email-link' })
  // An account deleted since the email was sent has nothing left to unsubscribe: still a success for the reader.
  if (error && !/foreign key/i.test(error.message)) return text(500, UNSUBSCRIBE_FAILED[who.lang])
  return req.method === 'POST' ? text(200, '') : text(200, UNSUBSCRIBED[who.lang])
})
