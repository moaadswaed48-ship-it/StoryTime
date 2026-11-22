// Supabase "Send Email" auth hook: Supabase Auth calls this instead of sending its own English emails, so the
// confirmation, password-reset and email-change emails go out in the user's language through Resend.
//
// NOT DEPLOYED OR RUN (no project, no sending account). Written against
// https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook (read 22 Nov 2026):
//   - payload { user, email_data: { token, token_hash, redirect_to, email_action_type, site_url, token_new,
//     token_hash_new, old_email, ... } }, signed with Standard Webhooks; secret SEND_EMAIL_HOOK_SECRET "v1,whsec_...".
//   - Secure email change sends two emails, and the token hash names are reversed for backward compatibility:
//     the CURRENT address gets token_hash_new, the NEW address gets token_hash.
//   - Answer 200 with {} on success; an error answer makes Auth report the failure to the user.
// Setup: Dashboard > Authentication > Hooks > Send Email hook > this function's URL; deploy with --no-verify-jwt
// (the hook signs its own requests). Run `npm run emails:bundle` first.
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'
import { admin, env, json, sendLogged } from '../_shared/mail.ts'
import { isLang, type Lang } from '../_shared/emails.mjs'

type HookUser = { id: string; email: string; new_email?: string; user_metadata?: Record<string, unknown> }
type EmailData = {
  token: string
  token_hash: string
  redirect_to: string
  email_action_type: string
  site_url: string
  token_new: string
  token_hash_new: string
  old_email?: string
}

const CONFIRM_HOURS = 24 // must match Auth > Email > "Email OTP expiration" in the dashboard
const RESET_MINUTES = 60

/** The user's language: their saved setting, else the page they came from, else the sign-up form, else Arabic. */
async function languageOf(user: HookUser, redirectTo: string): Promise<Lang> {
  const { data } = await admin().from('profiles').select('language').eq('id', user.id).maybeSingle()
  if (isLang(data?.language)) return data.language
  const fromUrl = redirectTo.match(/\/(ar|he|en|da)\//)?.[1]
  if (isLang(fromUrl)) return fromUrl
  const meta = user.user_metadata?.language
  return isLang(meta) ? meta : 'ar'
}

/** The site's own pages open the confirmation and reset links (src/routes/auth/*), with token_hash. */
function siteLink(redirectTo: string, lang: Lang, page: string, tokenHash: string, type: string) {
  const fallback = `${env('SITE_URL')}${lang}/${page}/`
  const base = redirectTo && redirectTo.startsWith(env('SITE_URL')) ? redirectTo : fallback
  const u = new URL(base)
  u.searchParams.set('token_hash', tokenHash)
  u.searchParams.set('type', type)
  return u.toString()
}

/** Email change has no page of its own on the site yet, so Auth's own verify endpoint checks it and redirects. */
function verifyLink(tokenHash: string, type: string, redirectTo: string) {
  const u = new URL(`${env('SUPABASE_URL')}/auth/v1/verify`)
  u.searchParams.set('token', tokenHash)
  u.searchParams.set('type', type)
  if (redirectTo) u.searchParams.set('redirect_to', redirectTo)
  return u.toString()
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json(405, { error: { http_code: 405, message: 'method_not_allowed' } })
  const payload = await req.text()
  let user: HookUser
  let d: EmailData
  try {
    const wh = new Webhook(env('SEND_EMAIL_HOOK_SECRET').replace('v1,whsec_', ''))
    ;({ user, email_data: d } = wh.verify(payload, Object.fromEntries(req.headers)) as { user: HookUser; email_data: EmailData })
  } catch {
    return json(401, { error: { http_code: 401, message: 'invalid_signature' } })
  }

  const db = admin()
  const lang = await languageOf(user, d.redirect_to)
  const send = (o: Parameters<typeof sendLogged>[1]) => sendLogged(db, o)
  let results: string[] = []
  try {
    switch (d.email_action_type) {
      case 'signup':
        results = [await send({ template: 'confirm_email', lang, to: user.email, accountId: user.id, params: { link: siteLink(d.redirect_to, lang, 'auth/confirm', d.token_hash, 'email'), hours: CONFIRM_HOURS } })]
        break
      case 'recovery':
        results = [await send({ template: 'password_reset', lang, to: user.email, accountId: user.id, params: { link: siteLink(d.redirect_to, lang, 'auth/reset', d.token_hash, 'recovery'), minutes: RESET_MINUTES } })]
        break
      case 'email_change': {
        const newEmail = user.new_email ?? ''
        if (d.token_hash_new) {
          // Secure email change: confirm on both addresses (hash names reversed, see the header).
          results = [
            await send({ template: 'email_change_confirm', lang, to: user.email, accountId: user.id, params: { link: verifyLink(d.token_hash_new, 'email_change', d.redirect_to), newEmail, hours: CONFIRM_HOURS } }),
            await send({ template: 'email_change_confirm', lang, to: newEmail, accountId: user.id, params: { link: verifyLink(d.token_hash, 'email_change', d.redirect_to), newEmail, hours: CONFIRM_HOURS } }),
          ]
        } else {
          results = [await send({ template: 'email_change_confirm', lang, to: newEmail, accountId: user.id, params: { link: verifyLink(d.token_hash, 'email_change', d.redirect_to), newEmail, hours: CONFIRM_HOURS } })]
        }
        break
      }
      case 'email_changed_notification':
        // To the address the account had before, so the real owner hears about it.
        results = [await send({ template: 'email_changed', lang, to: d.old_email ?? user.email, accountId: user.id, params: { newEmail: user.email } })]
        break
      default:
        // magiclink, invite, reauthentication and the other notifications are not used by StoryTime yet.
        console.warn('auth-email-hook: no template for', d.email_action_type)
        return json(200, {})
    }
  } catch (e) {
    return json(500, { error: { http_code: 500, message: String((e as Error)?.message ?? e) } })
  }
  if (results.includes('failed')) return json(500, { error: { http_code: 500, message: 'send_failed' } })
  return json(200, {})
})
