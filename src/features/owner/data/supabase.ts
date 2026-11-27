import type { SupabaseClient } from '@supabase/supabase-js'
import { LANGS, type Lang } from '@/i18n/config'
import type { AgeGroup, Iso, PassMonths, Price } from '@/data/types'
import { OwnerError, type OwnerApi, type OwnerErrorCode } from './api'
import { checkUpload, fingerprint, kindOfMime, publishProblems, safeName, summarise } from './rules'
import type { AuditRow, ContactMessage, Dashboard, Inbox, MediaRecord, OwnerStory, RefundsView, Signoff, StoryDraft, UploadMeta } from './types'

/**
 * The owner's area on Supabase. Reads and saves go through the owner_* functions of
 * supabase/migrations/20261122100300_owner_emails.sql (one transaction per save; tested in PGlite by
 * tests/db/owner-emails.test.ts). Files go to the private "content" bucket and get a row in `media`.
 *
 * NOT RUN against a real Supabase project (none is approved). Unproven here: the storage upload and signed links,
 * the bucket's 500 MB limit against the project's own upload limit (on the free plan 50 MB, so a film may need
 * the paid plan or a smaller file), and resumable uploads for large films (standard upload used for now).
 */
const BUCKET = 'content'
const SIGNED_LINK_SECONDS = 60 * 60
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type Row = Record<string, unknown>
type DbSignoff = { valid: boolean; at: Iso; by: string | null }
const KNOWN: OwnerErrorCode[] = [
  'not_owner', 'not_found', 'text_locked', 'trial_limit', 'publish_blocked', 'published_incomplete', 'signoff_blocked',
  'fee_over_cap', 'fee_not_set', 'note_required', 'refund_closed', 'bad_price', 'order_not_matching', 'pass_not_active',
  'cancel_window_closed',
]

function fail(e: unknown): never {
  if (e instanceof OwnerError) throw e
  const msg = String((e as { message?: string })?.message ?? e)
  const code = KNOWN.find((c) => new RegExp(`\\b${c}\\b`).test(msg))
  if (code) throw new OwnerError(code)
  if (/JWT|not authenticated|session/i.test(msg)) throw new OwnerError('not_signed_in')
  if (/fetch|network|Load failed/i.test(msg)) throw new OwnerError('network')
  throw new OwnerError('unknown', { detail: msg })
}

async function must<T>(p: PromiseLike<{ data: T; error: unknown }>): Promise<T> {
  let r: { data: T; error: unknown }
  try {
    r = await p
  } catch (e) {
    fail(e)
  }
  if (r.error) fail(r.error)
  return r.data
}

/** The database's sign-off says only "still valid or not"; turn it into the fingerprint form the rules compare. */
function fromDb(raw: Row): OwnerStory {
  const s = raw as unknown as OwnerStory & { signoffs: Partial<Record<Lang, DbSignoff>> }
  const signoffs: Partial<Record<Lang, Signoff>> = {}
  for (const l of LANGS) {
    const so = s.signoffs[l]
    if (so) signoffs[l] = { fingerprint: so.valid ? fingerprint(s, l) : 'stale', at: so.at, by: so.by ?? '' }
  }
  return { ...s, signoffs }
}

export class SupabaseOwnerApi implements OwnerApi {
  readonly kind = 'supabase' as const
  constructor(private readonly sb: SupabaseClient) {}

  async getStory(id: string) {
    return fromDb(await must(this.sb.rpc('owner_story', { p_story: id })) as Row)
  }

  async listStories() {
    const ids = (await must(this.sb.rpc('owner_story_ids'))) as string[]
    const stories = await Promise.all(ids.map((id) => this.getStory(id)))
    return stories.map(summarise)
  }

  async createStory() {
    const id = (await must(this.sb.rpc('owner_create_story'))) as string
    return this.getStory(id)
  }

  async saveStory(id: string, draft: StoryDraft) {
    await must(this.sb.rpc('owner_save_story', { p_story: id, p_draft: draft }))
    return this.getStory(id)
  }

  async upload(file: File, meta: UploadMeta): Promise<MediaRecord> {
    const head = new Uint8Array(await file.slice(0, 32).arrayBuffer())
    const check = checkUpload(meta.purpose, { name: file.name, size: file.size, head }, meta)
    if (!check.ok) throw new OwnerError('upload_refused', { refusal: check.reason })
    const id = crypto.randomUUID()
    const path = `${meta.purpose}/${id}-${safeName(file.name)}`
    await must(this.sb.storage.from(BUCKET).upload(path, file, { contentType: check.mime, upsert: false }))
    const { data: auth } = await this.sb.auth.getUser()
    const row = (await must(
      this.sb.from('media').insert({
        id, kind: kindOfMime(check.mime), storage_path: path, source: meta.source, licence: meta.licence.trim(), credit: meta.credit?.trim() || null,
        file_name: file.name, mime_type: check.mime, bytes: file.size, created_by: auth?.user?.id ?? null,
      }).select('*').single(),
    )) as Row
    return toMedia(row)
  }

  async getMedia(ids: string[]) {
    if (!ids.length) return []
    return ((await must(this.sb.from('media').select('*').in('id', ids))) as Row[]).map(toMedia)
  }

  async mediaUrl(id: string) {
    const [m] = await this.getMedia([id])
    if (!m) throw new OwnerError('not_found')
    const data = (await must(this.sb.storage.from(BUCKET).createSignedUrl(m.storagePath, SIGNED_LINK_SECONDS))) as { signedUrl: string }
    return data.signedUrl
  }

  async signOff(id: string, lang: Lang) {
    await must(this.sb.rpc('owner_sign_off', { p_story: id, p_lang: lang }))
    return this.getStory(id)
  }

  async withdrawSignOff(id: string, lang: Lang) {
    await must(this.sb.from('story_signoffs').delete().eq('story_id', id).eq('lang', lang))
    return this.getStory(id)
  }

  async publish(id: string, only: Lang[] | null) {
    // Check first so the owner sees what is missing; the database checks again and has the last word.
    const problems = publishProblems(await this.getStory(id), only)
    if (problems.length) throw new OwnerError('publish_blocked', { problems })
    await must(this.sb.rpc('owner_publish', { p_story: id, p_langs: only }))
    return this.getStory(id)
  }

  async unpublish(id: string) {
    await must(this.sb.rpc('owner_unpublish', { p_story: id }))
    return this.getStory(id)
  }

  async listAudit(storyId?: string): Promise<AuditRow[]> {
    // The id goes into a PostgREST filter string: only a plain id may, so nothing else can be slipped into the filter.
    if (storyId !== undefined && !UUID.test(storyId)) throw new OwnerError('not_found')
    let q = this.sb.from('audit_log').select('id, actor_id, action, target_table, target_id, detail, created_at').order('id', { ascending: false }).limit(200)
    if (storyId) q = q.or(`target_id.eq.${storyId},detail->>story_id.eq.${storyId}`)
    const rows = (await must(q)) as Row[]
    return rows.map((r) => ({
      id: String(r.id), at: r.created_at as string, actor: (r.actor_id as string) ?? '', action: r.action as string, target: r.target_table as string,
      storyId: ((r.detail as Row)?.story_id as string) ?? (r.target_table === 'stories' ? (r.target_id as string) : null), detail: '',
    }))
  }

  async dashboard() {
    return (await must(this.sb.rpc('owner_dashboard'))) as Dashboard
  }

  // ---- part 2: supabase/migrations/20261126100000_owner_inbox_refunds_prices.sql (tests/db/owner-part2.test.ts) ----

  async listMessages() {
    return (await must(this.sb.rpc('owner_inbox'))) as Inbox
  }

  async setMessageHandled(id: string, handled: boolean): Promise<ContactMessage> {
    await must(this.sb.rpc('owner_set_message_handled', { p_message: id, p_handled: handled }))
    const m = (await this.listMessages()).messages.find((x) => x.id === id)
    if (!m) throw new OwnerError('not_found')
    return m
  }

  async listRefunds() {
    return (await must(this.sb.rpc('owner_refunds'))) as RefundsView
  }

  async setRefundFee(id: string, feeAgorot: number | null) {
    await must(this.sb.rpc('owner_set_refund_fee', { p_refund: id, p_fee_agorot: feeAgorot }))
  }

  async markRefunded(id: string, note: string) {
    await must(this.sb.rpc('owner_mark_refunded', { p_refund: id, p_note: note }))
  }

  async cancelForRequest(requestId: string, orderId: string) {
    await must(this.sb.rpc('owner_cancel_for_request', { p_request: requestId, p_order: orderId }))
  }

  async setCancellationHandled(id: string, handled: boolean) {
    await must(this.sb.rpc('owner_set_cancellation_handled', { p_request: id, p_handled: handled }))
  }

  async listPrices(): Promise<Price[]> {
    const rows = (await must(this.sb.from('pass_prices').select('age_group, months, price_agorot').order('age_group').order('months'))) as Row[]
    return rows.map((r) => ({ ageGroup: r.age_group as AgeGroup, months: Number(r.months) as PassMonths, priceAgorot: (r.price_agorot as number | null) ?? null }))
  }

  async setPrice(ageGroup: AgeGroup, months: PassMonths, priceAgorot: number | null) {
    await must(this.sb.rpc('owner_set_price', { p_age_group: ageGroup, p_months: months, p_price_agorot: priceAgorot }))
    return this.listPrices()
  }
}

const toMedia = (r: Row): MediaRecord => ({
  id: r.id as string, kind: r.kind as MediaRecord['kind'], fileName: (r.file_name as string) ?? '', mimeType: (r.mime_type as string) ?? '',
  bytes: Number(r.bytes ?? 0), source: r.source as MediaRecord['source'], licence: r.licence as string, credit: (r.credit as string) ?? null,
  storagePath: r.storage_path as string, createdAt: r.created_at as string,
})
