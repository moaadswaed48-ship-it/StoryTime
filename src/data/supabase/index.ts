import { AuthError, createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Lang } from '@/i18n/config'
import type { DataApi, LinkKind, ProviderEvent, SignUpInput } from '../api'
import { codeFromText, DataError, type ErrorCode } from '../errors'
import {
  cleanPrefs, learnerKindFor,
  type AccessSnapshot, type Account, type AccountPrefs, type AgeGroup, type Learner, type Order, type Pass, type PassMonths, type Price, type Role,
  type Progress, type ProgressPatch, type Session, type StoryContent, type StorySummary, type Trial,
} from '../types'

/**
 * The Supabase backend. Configured by VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or the older
 * VITE_SUPABASE_ANON_KEY name). The publishable key is public by design; row-level security protects the data.
 *
 * NOT TESTED against a real Supabase project: none is approved yet (CLAUDE.md rule 9). The SQL it calls is tested
 * in PGlite (tests/db); this file's mapping of supabase-js calls and auth error codes is written from the
 * supabase-js 2.119 types and documentation and still needs one run against a project.
 *
 * Email links: configure the Supabase email templates to link to
 *   {{ .SiteURL }}/<lang>/auth/confirm/?token_hash={{ .TokenHash }}&type=email   (and type=recovery for reset)
 * so a link opened on another device works (the default PKCE "code" link only works in the browser that asked).
 */

type Row = Record<string, unknown>

function authCode(e: AuthError): ErrorCode {
  switch (e.code) {
    case 'user_already_exists':
    case 'email_exists':
      return 'email_taken'
    case 'invalid_credentials':
      return 'wrong_credentials'
    case 'email_not_confirmed':
      return 'email_unconfirmed'
    case 'weak_password':
      return 'weak_password'
    case 'email_address_invalid':
    case 'validation_failed':
      return 'invalid_email'
    case 'otp_expired':
    case 'flow_state_expired':
    case 'flow_state_not_found':
    case 'bad_code_verifier':
      return 'link_expired'
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'rate_limited'
    case 'session_not_found':
    case 'refresh_token_not_found':
      return 'not_signed_in'
    default:
      return e.status === 0 ? 'network' : 'unknown'
  }
}

/** Turns any supabase-js error into a DataError. */
function fail(e: unknown): never {
  if (e instanceof DataError) throw e
  if (e instanceof AuthError) throw new DataError(authCode(e), e.message)
  const msg = (e as { message?: string })?.message ?? String(e)
  if (/fetch|network|Load failed/i.test(msg)) throw new DataError('network', msg)
  throw new DataError(codeFromText(msg) ?? 'unknown', msg)
}

/** The data of a successful supabase-js response (each response type is a union of success and failure). */
type Ok<R> = R extends { error: null; data: infer D } ? D : never

async function must<R extends { error: unknown }>(p: PromiseLike<R>): Promise<Ok<R>> {
  let r: R
  try {
    r = await p
  } catch (e) {
    fail(e)
  }
  if (r.error) fail(r.error)
  return (r as unknown as { data: Ok<R> }).data
}

const toPass = (r: Row): Pass => {
  const o = (r.orders ?? null) as Row | null
  return {
    id: r.id as string, orderId: (r.order_id as string) ?? null, ageGroup: r.age_group as AgeGroup, months: r.months as PassMonths,
    startsAt: r.starts_at as string, endsAt: r.ends_at as string, status: r.status as Pass['status'],
    paidAt: (o?.paid_at as string) ?? null, amountAgorot: (o?.amount_agorot as number) ?? 0,
  }
}
const toOrder = (r: Row): Order => ({
  id: r.id as string, ageGroup: r.age_group as AgeGroup, months: r.months as PassMonths, amountAgorot: r.amount_agorot as number,
  priceWasPlaceholder: !!r.price_was_placeholder, provider: r.provider as string, status: r.status as Order['status'],
  createdAt: r.created_at as string, paidAt: (r.paid_at as string) ?? null,
})
const toLearner = (r: Row): Learner => ({ id: r.id as string, kind: r.kind as Learner['kind'], name: r.name as string, ageGroup: r.age_group as AgeGroup })

const progressOut = (r: Row): Progress => ({
  storyId: r.story_id as string, lastPage: (r.last_page as number | null) ?? null, filmWatched: !!r.film_watched, activityDone: !!r.activity_done,
  filmPositionS: (r.film_position_s as number | null) ?? null, updatedAt: r.updated_at as string,
})
const PROGRESS_COLUMNS = 'story_id, last_page, film_watched, activity_done, film_position_s, updated_at'

export class SupabaseApi implements DataApi {
  readonly kind = 'supabase' as const
  /** Shared with the owner's area (src/features/owner/data/supabase.ts): one client, one session. */
  readonly sb: SupabaseClient

  /** `client` lets tests run this class against the real policies in PGlite (tests/db/supabase-data-layer.test.ts). */
  constructor(url: string, key: string, private readonly linkBase: string, client?: SupabaseClient) {
    this.sb = client ?? createClient(url, key, { auth: { flowType: 'pkce', detectSessionInUrl: false, persistSession: true, autoRefreshToken: true } })
  }

  private async uid(): Promise<string> {
    const s = await this.getSession()
    if (!s) throw new DataError('not_signed_in')
    return s.userId
  }

  private link(lang: Lang, page: string) {
    return `${this.linkBase}${lang}/${page}/`
  }

  async getSession(): Promise<Session | null> {
    const { data } = await this.sb.auth.getSession()
    const u = data.session?.user
    return u ? { userId: u.id, email: u.email ?? '' } : null
  }

  onSessionChange(listener: (s: Session | null) => void) {
    const { data } = this.sb.auth.onAuthStateChange((_event, session) => {
      listener(session?.user ? { userId: session.user.id, email: session.user.email ?? '' } : null)
    })
    return () => data.subscription.unsubscribe()
  }

  async signUp(i: SignUpInput) {
    const data = await must(this.sb.auth.signUp({
      email: i.email.trim(),
      password: i.password,
      options: {
        emailRedirectTo: this.link(i.language, 'auth/confirm'),
        // Read by public.handle_new_user() to write the profile and the consents.
        data: { role: i.role, language: i.language, terms_version: i.termsVersion, terms_accepted: true, adult: i.adult, marketing: i.marketing },
      },
    }))
    // With email confirmation on, Supabase answers an existing address with a user that has no identities.
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) throw new DataError('email_taken')
  }

  async resendConfirmation(email: string, language: Lang) {
    await must(this.sb.auth.resend({ type: 'signup', email: email.trim(), options: { emailRedirectTo: this.link(language, 'auth/confirm') } }))
  }

  async completeLink(kind: LinkKind, params: URLSearchParams): Promise<Session> {
    const hash = typeof location !== 'undefined' ? new URLSearchParams(location.hash.replace(/^#/, '')) : new URLSearchParams()
    const err = params.get('error_code') ?? hash.get('error_code') ?? params.get('error') ?? hash.get('error')
    if (err) throw new DataError('link_expired', err)
    const tokenHash = params.get('token_hash')
    const code = params.get('code')
    if (tokenHash) await must(this.sb.auth.verifyOtp({ token_hash: tokenHash, type: kind === 'signup' ? 'email' : kind === 'recovery' ? 'recovery' : 'email_change' }))
    else if (code) await must(this.sb.auth.exchangeCodeForSession(code))
    else throw new DataError('link_expired', 'no token in link')
    const s = await this.getSession()
    if (!s) throw new DataError('link_expired')
    return s
  }

  async signIn(email: string, password: string) {
    const data = await must(this.sb.auth.signInWithPassword({ email: email.trim(), password }))
    return { userId: data.user.id, email: data.user.email ?? '' }
  }

  async signOut() {
    await must(this.sb.auth.signOut())
  }

  async requestPasswordReset(email: string, language: Lang) {
    await must(this.sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: this.link(language, 'auth/reset') }))
  }

  async setPassword(password: string) {
    await must(this.sb.auth.updateUser({ password }))
  }

  async getAccount(): Promise<Account> {
    const s = await this.getSession()
    if (!s) throw new DataError('not_signed_in')
    const p = await must(this.sb.from('profiles').select('*').eq('id', s.userId).single())
    const m = await must(this.sb.from('consents').select('granted').eq('kind', 'marketing').order('created_at', { ascending: false }).limit(1))
    const r = p as Row
    return {
      id: s.userId, email: s.email, role: r.role as Role, language: r.language as Lang, storyLanguage: (r.story_language as Lang) ?? null,
      onboardedAt: (r.onboarded_at as string) ?? null, marketingOptIn: !!(m as Row[])[0]?.granted, createdAt: r.created_at as string,
      prefs: cleanPrefs(r.prefs),
    }
  }

  async updateAccount(patch: { language?: Lang; storyLanguage?: Lang; onboarded?: true; prefs?: AccountPrefs }) {
    const uid = await this.uid()
    const row: Row = {}
    if (patch.prefs) {
      // Read, merge, write: only the keys given change (the profiles_prefs_check constraint guards the shape).
      const cur = (await must(this.sb.from('profiles').select('prefs').eq('id', uid).single())) as Row
      row.prefs = cleanPrefs({ ...cleanPrefs(cur?.prefs), ...cleanPrefs(patch.prefs) })
    }
    if (patch.language) row.language = patch.language
    if (patch.storyLanguage) row.story_language = patch.storyLanguage
    if (patch.onboarded) row.onboarded_at = new Date().toISOString()
    if (Object.keys(row).length) await must(this.sb.from('profiles').update(row).eq('id', uid))
    return this.getAccount()
  }

  /**
   * Supabase Auth sends the confirmation (through the auth-email-hook, to the new address, and to the old one too
   * when "secure email change" is on) and changes the address only when the link is opened. NOT RUN against a real
   * project.
   */
  async requestEmailChange(newEmail: string, language: Lang) {
    await must(this.sb.auth.updateUser({ email: newEmail.trim() }, { emailRedirectTo: this.link(language, 'auth/confirm-email') }))
  }

  async setRole(role: 'parent' | 'teacher') {
    await must(this.sb.rpc('set_my_role', { p_role: role }))
  }

  async setMarketing(optIn: boolean) {
    const uid = await this.uid()
    await must(this.sb.from('consents').insert({ account_id: uid, kind: 'marketing', granted: optIn, source: 'settings' }))
  }

  async listLearners() {
    const rows = await must(this.sb.from('children').select('id, kind, name, age_group').order('created_at'))
    return (rows as Row[]).map(toLearner)
  }

  async addLearner(input: { name: string; ageGroup: AgeGroup }) {
    const a = await this.getAccount()
    const row = await must(this.sb.from('children').insert({ account_id: a.id, kind: learnerKindFor(a.role), name: input.name.trim(), age_group: input.ageGroup }).select('id, kind, name, age_group').single())
    return toLearner(row as Row)
  }

  async updateLearner(id: string, patch: { name?: string; ageGroup?: AgeGroup }) {
    const row: Row = {}
    if (patch.name !== undefined) row.name = patch.name.trim()
    if (patch.ageGroup) row.age_group = patch.ageGroup
    const r = await must(this.sb.from('children').update(row).eq('id', id).select('id, kind, name, age_group').single())
    return toLearner(r as Row)
  }

  async removeLearner(id: string) {
    await must(this.sb.from('children').delete().eq('id', id))
  }

  async exportMyData() {
    return must(this.sb.rpc('export_my_data'))
  }

  async deleteAccount() {
    await must(this.sb.rpc('delete_my_account'))
    await this.sb.auth.signOut({ scope: 'local' })
  }

  async listStories(lang: Lang, ageGroup?: AgeGroup): Promise<StorySummary[]> {
    const rows = (await must(this.sb.from('stories').select('id, slug, is_sample, credit, story_listings(lang, title, teaser), story_age_groups(age_group, is_trial, trial_position)'))) as Row[]
    return rows
      .map((r) => {
        const listing = ((r.story_listings as Row[]) ?? []).find((l) => l.lang === lang) ?? ((r.story_listings as Row[]) ?? [])[0]
        const groups = (r.story_age_groups as Row[]) ?? []
        return {
          id: r.id as string, slug: r.slug as string, title: (listing?.title as string) ?? (r.slug as string), teaser: (listing?.teaser as string) ?? '',
          ageGroups: groups.map((g) => g.age_group as AgeGroup), trialIn: groups.filter((g) => g.is_trial).map((g) => g.age_group as AgeGroup),
          isSample: !!r.is_sample, credit: r.credit as StorySummary['credit'], coverUrl: null,
          position: (groups.find((g) => g.age_group === ageGroup)?.trial_position as number) ?? 99,
        }
      })
      .filter((s) => !ageGroup || s.ageGroups.includes(ageGroup))
      .sort((a, b) => a.position - b.position)
      .map(({ position: _p, ...s }) => s)
  }

  async getStoryContent(id: string, lang: Lang): Promise<StoryContent> {
    const ok = await must(this.sb.rpc('has_access_to_story', { p_story: id }))
    if (!ok) throw new DataError('locked')
    const pages = (await must(this.sb.from('pages').select('page_no, picture_media_id, story_texts(lang, display, speech)').eq('story_id', id).order('page_no'))) as Row[]
    const listing = (await must(this.sb.from('story_listings').select('title').eq('story_id', id).eq('lang', lang).maybeSingle())) as Row | null
    const story = (await must(this.sb.from('stories').select('is_sample, credit').eq('id', id).maybeSingle())) as Row | null
    // NOT wired yet (part B1 keeps to the local backend): page zones from pages.layout, signed media links for
    // pictures, read-along audio, films and activity steps. Each comes back empty, and the screens say so.
    return {
      id, lang, title: (listing?.title as string) ?? '', credit: (story?.credit as StoryContent['credit']) ?? 'storytime', isSample: !!story?.is_sample,
      pages: pages.map((p) => {
        const text = ((p.story_texts as Row[]) ?? []).find((t) => t.lang === lang)
        return { pageNo: p.page_no as number, display: (text?.display as string) ?? '', speech: (text?.speech as string) ?? '', pictureUrl: null, zone: null, readAlong: null }
      }),
      film: null,
      activity: null,
    }
  }

  async listProgress(learnerId: string): Promise<Progress[]> {
    const rows = (await must(this.sb.from('progress').select(PROGRESS_COLUMNS).eq('child_id', learnerId))) as Row[]
    return rows.map(progressOut)
  }

  async saveProgress(learnerId: string, storyId: string, patch: ProgressPatch): Promise<Progress> {
    const row: Row = { child_id: learnerId, story_id: storyId, updated_at: new Date().toISOString() }
    if (patch.lastPage !== undefined) row.last_page = patch.lastPage
    if (patch.filmWatched) row.film_watched = true
    if (patch.activityDone !== undefined) row.activity_done = patch.activityDone
    if (patch.filmPositionS !== undefined) row.film_position_s = patch.filmPositionS === null ? null : Math.round(patch.filmPositionS)
    const r = await must(this.sb.from('progress').upsert(row, { onConflict: 'child_id,story_id' }).select(PROGRESS_COLUMNS).single())
    return progressOut(r as Row)
  }

  async listFavourites(learnerId: string): Promise<string[]> {
    const rows = (await must(this.sb.from('favourites').select('story_id, created_at').eq('child_id', learnerId).order('created_at', { ascending: false }))) as Row[]
    return rows.map((r) => r.story_id as string)
  }

  async setFavourite(learnerId: string, storyId: string, on: boolean) {
    if (on) await must(this.sb.from('favourites').upsert({ child_id: learnerId, story_id: storyId }, { onConflict: 'child_id,story_id', ignoreDuplicates: true }))
    else await must(this.sb.from('favourites').delete().eq('child_id', learnerId).eq('story_id', storyId))
  }

  async getAccess(): Promise<AccessSnapshot> {
    const a = await this.getAccount()
    // Always "mine": the owner's role may read every account's rows (review finding B2), so filter by account.
    const t = (await must(this.sb.from('trials').select('id, age_group, started_at, ends_at, trial_items(story_id)').eq('account_id', a.id).maybeSingle())) as Row | null
    const passes = (await must(this.sb.from('passes').select('*, orders(paid_at, amount_agorot)').eq('account_id', a.id))) as Row[]
    const trial: Trial | null = t
      ? { id: t.id as string, ageGroup: t.age_group as AgeGroup, startedAt: t.started_at as string, endsAt: t.ends_at as string, storyIds: ((t.trial_items as Row[]) ?? []).map((x) => x.story_id as string) }
      : null
    let trialOpened: string[] = []
    if (trial?.storyIds.length) {
      // Row-level security returns only this account's profiles' progress (the owner's role cannot read progress).
      const opened = (await must(this.sb.from('progress').select('story_id, last_page, film_watched, activity_done').in('story_id', trial.storyIds))) as Row[]
      const ids = new Set(opened.filter((p) => p.last_page !== null || p.film_watched || p.activity_done).map((p) => p.story_id as string))
      trialOpened = trial.storyIds.filter((id) => ids.has(id))
    }
    return { now: new Date().toISOString(), role: a.role, trial, passes: passes.map(toPass), trialOpened }
  }

  async startTrial(ageGroup: AgeGroup) {
    await must(this.sb.rpc('start_trial', { p_age_group: ageGroup }))
    const { trial } = await this.getAccess()
    if (!trial) throw new DataError('unknown', 'trial missing after start')
    return trial
  }

  async listPrices(): Promise<Price[]> {
    const rows = (await must(this.sb.from('pass_prices').select('age_group, months, price_agorot'))) as Row[]
    return rows.map((r) => ({ ageGroup: r.age_group as AgeGroup, months: r.months as PassMonths, priceAgorot: (r.price_agorot as number | null) ?? null }))
  }

  async createOrder(i: { ageGroup: AgeGroup; months: PassMonths; provider: string; termsVersion: string }) {
    const r = await must(this.sb.rpc('create_order', { p_age_group: i.ageGroup, p_months: i.months, p_provider: i.provider, p_terms_version: i.termsVersion }))
    return toOrder(r as Row)
  }

  async getOrder(id: string) {
    const r = await must(this.sb.from('orders').select('*').eq('id', id).eq('account_id', await this.uid()).maybeSingle())
    if (!r) throw new DataError('not_found')
    return toOrder(r as Row)
  }

  async listOrders() {
    const rows = (await must(this.sb.from('orders').select('*').eq('account_id', await this.uid()).order('created_at', { ascending: false }))) as Row[]
    return rows.map(toOrder)
  }

  /** Goes to the payment-callback edge function, which accepts test events only where ALLOW_TEST_PAYMENTS=1. */
  async sendTestProviderEvent(event: ProviderEvent) {
    await must(this.sb.functions.invoke('payment-callback', { body: event }))
  }

  async cancelPurchase(passId: string) {
    await must(this.sb.rpc('cancel_purchase', { p_pass: passId }))
  }

  async requestCancellation(i: { email: string; orderRef: string; message?: string }) {
    await must(this.sb.rpc('request_cancellation', { p_email: i.email, p_order_ref: i.orderRef, p_message: i.message ?? null }))
  }
}
