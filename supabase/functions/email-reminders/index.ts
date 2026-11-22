// The email job. Event emails: welcome, trial started, purchase confirmation, cancellation received, refund issued.
// Reminders: trial ends tomorrow, trial ended, pass started (queued passes), pass ends in 7 days, pass ends tomorrow,
// pass ended. News: "new story" for accounts that opted in. The account-deleted email is NOT sent from here (the
// account is gone by then): see docs/HANDOFF.md, part B2. Who is due what is decided by
// dueEmails() in src/emails/schedule.ts (unit-tested, Israel time, quiet hours 21:00-08:00, never twice).
//
// NOT DEPLOYED OR RUN (no project, no sending account). Run `npm run emails:bundle` before deploying.
// Schedule it every 5 minutes with pg_cron (event emails should arrive quickly) and pg_net (Supabase docs, "Scheduling Edge Functions"), for example:
//   select cron.schedule('email-reminders', '*/5 * * * *', $$
//     select net.http_post(
//       url := 'https://<project-ref>.supabase.co/functions/v1/email-reminders',
//       headers := jsonb_build_object('Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret'))
//     ) $$);
// with the same value in the function secret CRON_SECRET. Deploy with --no-verify-jwt (the job checks CRON_SECRET).
import { admin, env, json, sendLogged } from '../_shared/mail.ts'
import { dueEmails, reminderParams, unsubscribeUrl, type AudienceMember, type NewStory } from '../_shared/emails.mjs'

const DAY = 86_400_000

Deno.serve(async (req) => {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? ''
  if (!env('CRON_SECRET') || token !== env('CRON_SECRET')) return json(401, { error: 'unauthorized' })
  const db = admin()
  const now = new Date()

  const [audience, stories, log, suppressed] = await Promise.all([
    db.rpc('email_audience'),
    db.rpc('email_new_stories', { p_since: new Date(now.getTime() - 7 * DAY).toISOString() }),
    db.from('email_log').select('dedupe_key').not('dedupe_key', 'is', null).gte('created_at', new Date(now.getTime() - 60 * DAY).toISOString()),
    db.from('email_suppressions').select('email'),
  ])
  const failed = [audience, stories, log, suppressed].find((r) => r.error)
  if (failed) return json(500, { error: failed.error!.message })

  const due = dueEmails({
    now: now.toISOString(),
    audience: audience.data as AudienceMember[],
    newStories: stories.data as NewStory[],
    sentKeys: new Set((log.data ?? []).map((r: { dedupe_key: string }) => r.dedupe_key)),
    suppressed: new Set((suppressed.data ?? []).map((r: { email: string }) => r.email)),
  })

  const counts = { due: due.length, sent: 0, skipped: 0, failed: 0 }
  for (const d of due) {
    const unsub = d.template === 'new_story'
      ? await unsubscribeUrl(`${env('SUPABASE_URL')}/functions/v1/email-unsubscribe`, env('UNSUBSCRIBE_SECRET'), d.accountId, d.lang)
      : undefined
    const r = await sendLogged(db, {
      template: d.template, lang: d.lang, to: d.to, accountId: d.accountId,
      params: reminderParams(d, env('SITE_URL'), unsub), dedupeKey: d.key, unsubscribeUrl: unsub,
    })
    counts[r] += 1
    // Stay under Resend's default rate limit (a few requests a second).
    await new Promise((res) => setTimeout(res, 600))
  }
  return json(200, counts)
})
