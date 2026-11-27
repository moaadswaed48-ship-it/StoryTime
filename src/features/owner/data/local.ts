import { LANGS, type Lang } from '@/i18n/config'
import { cancelPass, CLOCK_KEY, DB_KEY, type KeyValue, type LocalDb } from '@/data/local/server'
import { DataError } from '@/data/errors'
import { canCancel, orderRefMatches, refundReturned } from '@/data/rules'
import { AGE_GROUPS, isAgeGroup, isPassMonths, PASS_MONTHS, type AgeGroup, type Iso, type PassMonths, type Price } from '@/data/types'
import { isLang } from '@/i18n/config'
import { OwnerError, type OwnerApi } from './api'
import type { BlobStore } from './blobs'
import {
  blockingGaps, checkUpload, emptyLangContent, fingerprint, hasActivity, kindOfMime, possibleLangs, publishedGaps, publishProblems,
  safeName, sharedGaps, signoffValid, summarise, targetLangs, trialOverflow,
} from './rules'
import { maxCancellationFee, priceProblem, REFUND_NOTE_MAX } from './money'
import {
  DEFAULT_ZONE, ZONE_SIDES, ZONE_SIZES, ZONE_VS,
  type AuditRow, type ContactMessage, type Dashboard, type Inbox, type MediaRecord, type OwnerStory, type OwnerStorySummary, type RefundsView, type RequestMatch,
  type StoryDraft, type UploadMeta,
} from './types'

/**
 * The owner's content store for the local (test-mode) backend: stories in localStorage under CONTENT_KEY, files
 * in a BlobStore (IndexedDB in the browser). Like src/data/local/server.ts it is the only code that writes this
 * data, and it enforces the rules the database enforces: owner role only, the author's text locked, at most three
 * trial stories per group, publish only when signed off, and an audit row for every change.
 */
export const CONTENT_KEY = 'storytime.local.content.v1'

export type ContentDb = { version: 1; stories: OwnerStory[]; media: MediaRecord[]; audit: AuditRow[] }
const emptyContent = (): ContentDb => ({ version: 1, stories: [], media: [], audit: [] })

const uuid = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T

export class LocalOwnerServer {
  constructor(
    private readonly kv: KeyValue,
    private readonly blobs: BlobStore,
  ) {}

  now(): Iso {
    const offset = Number(this.kv.get(CLOCK_KEY) ?? 0) || 0
    return new Date(Date.now() + offset).toISOString()
  }

  // ---- storage -------------------------------------------------------------------------------------------------

  private accounts(): LocalDb {
    try {
      return JSON.parse(this.kv.get(DB_KEY) ?? 'null') ?? ({ users: [], profiles: {} } as unknown as LocalDb)
    } catch {
      return { users: [], profiles: {} } as unknown as LocalDb
    }
  }

  read(): ContentDb {
    try {
      const db = JSON.parse(this.kv.get(CONTENT_KEY) ?? 'null') as ContentDb | null
      return db?.version === 1 ? { ...emptyContent(), ...db } : emptyContent()
    } catch {
      return emptyContent()
    }
  }

  private tx<T>(fn: (db: ContentDb) => T): T {
    const db = this.read()
    const out = fn(db)
    this.kv.set(CONTENT_KEY, JSON.stringify(db))
    return out
  }

  /** The owner role, checked on every call (row-level security does this in Supabase). */
  private owner(uid: string | null): string {
    if (!uid) throw new OwnerError('not_signed_in')
    const acc = this.accounts()
    if (!acc.users?.some((u) => u.id === uid)) throw new OwnerError('not_signed_in')
    if (acc.profiles?.[uid]?.role !== 'owner') throw new OwnerError('not_owner')
    return uid
  }

  /** Read, change and save the accounts store (src/data/local/server.ts), where messages, refunds and prices live. */
  private accountsTx<T>(fn: (db: LocalDb) => T): T {
    const db = this.accounts()
    const out = fn(db)
    this.kv.set(DB_KEY, JSON.stringify(db))
    return out
  }

  /** An audit row for a change outside the stories (prices, refunds, messages), in the same log the owner reads. */
  private auditOnly(actor: string, action: string, target: string, id: string, detail = '') {
    this.tx((db) => this.audit(db, actor, action, target, null, detail || id))
  }

  private audit(db: ContentDb, actor: string, action: string, target: string, storyId: string | null, detail = '') {
    db.audit.push({ id: uuid(), at: this.now(), actor, action, target, storyId, detail })
  }

  private find(db: ContentDb, id: string): OwnerStory {
    const s = db.stories.find((x) => x.id === id)
    if (!s) throw new OwnerError('not_found')
    return s
  }

  // ---- stories -------------------------------------------------------------------------------------------------

  listStories(uid: string | null): OwnerStorySummary[] {
    this.owner(uid)
    return this.read()
      .stories.map((s) => summarise(s))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  getStory(uid: string | null, id: string): OwnerStory {
    this.owner(uid)
    return clone(this.find(this.read(), id))
  }

  createStory(uid: string | null): OwnerStory {
    const actor = this.owner(uid)
    return this.tx((db) => {
      const now = this.now()
      const id = uuid()
      const s: OwnerStory = {
        id, slug: `story-${id.slice(0, 8)}`, status: 'draft', credit: 'storytime', textLocked: false, groups: [], publishLangs: null,
        pages: [{ key: uuid(), pictureId: null, zone: { ...DEFAULT_ZONE } }],
        texts: Object.fromEntries(LANGS.map((l) => [l, emptyLangContent()])) as OwnerStory['texts'],
        films: Object.fromEntries(LANGS.map((l) => [l, { videoId: null, captionsId: null }])) as OwnerStory['films'],
        activity: { steps: [] }, signoffs: {}, createdAt: now, updatedAt: now, publishedAt: null,
      }
      db.stories.push(s)
      this.audit(db, actor, 'insert', 'stories', id)
      return clone(s)
    })
  }

  /** For tests and imports only (not on the API): puts a whole story in place, e.g. the author's story. */
  importStory(s: OwnerStory) {
    this.tx((db) => {
      db.stories = db.stories.filter((x) => x.id !== s.id)
      db.stories.push(clone(s))
      this.audit(db, 'import', 'insert', 'stories', s.id, s.credit)
    })
  }

  saveStory(uid: string | null, id: string, draft: StoryDraft): OwnerStory {
    const actor = this.owner(uid)
    return this.tx((db) => {
      const s = this.find(db, id)
      const next = normalise(s, draft)
      if (s.textLocked && lockedTextChanged(s, next)) throw new OwnerError('text_locked')
      const others = db.stories.filter((x) => x.id !== id)
      if (trialOverflow([...others, { id, groups: next.groups }]).length) throw new OwnerError('trial_limit')
      const gaps = publishedGaps({ ...s, ...next })
      if (gaps.length) throw new OwnerError('published_incomplete', { problems: gaps })
      const changed: string[] = []
      if (JSON.stringify(s.groups) !== JSON.stringify(next.groups)) changed.push('story_age_groups')
      if (JSON.stringify(s.pages) !== JSON.stringify(next.pages)) changed.push('pages')
      if (JSON.stringify(s.activity) !== JSON.stringify(next.activity)) changed.push('activity_steps')
      for (const l of LANGS) {
        if (JSON.stringify(s.texts[l]) !== JSON.stringify(next.texts[l])) changed.push(`texts:${l}`)
        if (JSON.stringify(s.films[l]) !== JSON.stringify(next.films[l])) changed.push(`films:${l}`)
      }
      if (!changed.length) return clone(s)
      Object.assign(s, next, { updatedAt: this.now() })
      for (const c of changed) {
        const [target, lang] = c.split(':')
        this.audit(db, actor, 'update', target === 'texts' ? 'story_texts' : target!, id, lang ?? '')
      }
      return clone(s)
    })
  }

  signOff(uid: string | null, id: string, lang: Lang): OwnerStory {
    const actor = this.owner(uid)
    return this.tx((db) => {
      const s = this.find(db, id)
      if (!possibleLangs(s).includes(lang) || blockingGaps(s, lang).length) throw new OwnerError('signoff_blocked')
      s.signoffs[lang] = { fingerprint: fingerprint(s, lang), at: this.now(), by: actor }
      this.audit(db, actor, 'insert', 'story_signoffs', id, lang)
      return clone(s)
    })
  }

  withdrawSignOff(uid: string | null, id: string, lang: Lang): OwnerStory {
    const actor = this.owner(uid)
    return this.tx((db) => {
      const s = this.find(db, id)
      delete s.signoffs[lang]
      this.audit(db, actor, 'delete', 'story_signoffs', id, lang)
      return clone(s)
    })
  }

  publish(uid: string | null, id: string, only: Lang[] | null): OwnerStory {
    const actor = this.owner(uid)
    return this.tx((db) => {
      const s = this.find(db, id)
      const problems = publishProblems(s, only)
      if (problems.length) throw new OwnerError('publish_blocked', { problems })
      const langs = targetLangs(s, only)
      s.publishLangs = langs.length === possibleLangs(s).length && s.credit !== 'author' ? null : langs
      s.status = 'published'
      s.publishedAt = this.now()
      s.updatedAt = this.now()
      this.audit(db, actor, 'publish', 'stories', id, langs.join(','))
      return clone(s)
    })
  }

  unpublish(uid: string | null, id: string): OwnerStory {
    const actor = this.owner(uid)
    return this.tx((db) => {
      const s = this.find(db, id)
      s.status = 'draft'
      s.updatedAt = this.now()
      this.audit(db, actor, 'unpublish', 'stories', id)
      return clone(s)
    })
  }

  listAudit(uid: string | null, storyId?: string): AuditRow[] {
    this.owner(uid)
    return this.read().audit.filter((a) => !storyId || a.storyId === storyId).reverse()
  }

  // ---- files ---------------------------------------------------------------------------------------------------

  async upload(uid: string | null, file: File, meta: UploadMeta): Promise<MediaRecord> {
    const actor = this.owner(uid)
    const head = new Uint8Array(await file.slice(0, 32).arrayBuffer())
    const check = checkUpload(meta.purpose, { name: file.name, size: file.size, head }, meta)
    if (!check.ok) throw new OwnerError('upload_refused', { refusal: check.reason })
    const id = uuid()
    const rec: MediaRecord = {
      id, kind: kindOfMime(check.mime), fileName: file.name, mimeType: check.mime, bytes: file.size, source: meta.source,
      licence: meta.licence.trim(), credit: meta.credit?.trim() || null, storagePath: `${meta.purpose}/${id}-${safeName(file.name)}`, createdAt: this.now(),
    }
    await this.blobs.put(rec.storagePath, new Blob([await file.arrayBuffer()], { type: check.mime }))
    this.tx((db) => {
      db.media.push(rec)
      this.audit(db, actor, 'insert', 'media', id, `${rec.source}; ${rec.licence}`)
    })
    return rec
  }

  getMedia(uid: string | null, ids: string[]): MediaRecord[] {
    this.owner(uid)
    return this.read().media.filter((m) => ids.includes(m.id))
  }

  async mediaBlob(uid: string | null, id: string): Promise<Blob> {
    this.owner(uid)
    const rec = this.read().media.find((m) => m.id === id)
    const blob = rec && (await this.blobs.get(rec.storagePath))
    if (!blob) throw new OwnerError('not_found')
    return blob
  }

  // ---- dashboard -----------------------------------------------------------------------------------------------

  dashboard(uid: string | null): Dashboard {
    this.owner(uid)
    const db = this.accounts()
    const now = this.now()
    const t = new Date(now).getTime()
    const zero = () => Object.fromEntries(AGE_GROUPS.map((g) => [g, 0])) as Record<AgeGroup, number>
    const users = (db.users ?? []).filter((u) => db.profiles?.[u.id]?.role !== 'owner')
    const activeTrials = zero()
    for (const tr of db.trials ?? []) if (new Date(tr.startedAt).getTime() <= t && t < new Date(tr.endsAt).getTime() && isAgeGroup(tr.ageGroup)) activeTrials[tr.ageGroup]++
    const activePasses = zero()
    for (const p of db.passes ?? []) if (p.status === 'active' && new Date(p.startsAt).getTime() <= t && t < new Date(p.endsAt).getTime()) activePasses[p.ageGroup]++
    const email = (accountId: string | null) => (db.users ?? []).find((u) => u.id === accountId)?.email ?? null
    return {
      now,
      signUps: {
        total: users.length,
        last7Days: users.filter((u) => t - new Date(u.createdAt).getTime() < 7 * 86_400_000).length,
        parents: users.filter((u) => db.profiles[u.id]?.role === 'parent').length,
        teachers: users.filter((u) => db.profiles[u.id]?.role === 'teacher').length,
      },
      activeTrials,
      activePasses,
      recentPurchases: (db.orders ?? [])
        .filter((o) => o.status !== 'pending')
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 20)
        .map((o) => ({
          orderId: o.id, email: email(o.accountId), ageGroup: o.ageGroup, months: o.months, amountAgorot: o.amountAgorot,
          priceWasPlaceholder: o.priceWasPlaceholder, status: o.status, paidAt: o.paidAt, createdAt: o.createdAt,
        })),
    }
  }

  // ---- part 2: messages, cancellations and refunds, prices ----------------------------------------------------------

  listMessages(uid: string | null): Inbox {
    this.owner(uid)
    const list = this.accounts().contactMessages ?? []
    const messages: ContactMessage[] = list
      .map((m) => ({ id: m.id, name: m.name, email: m.email, lang: isLang(m.lang) ? m.lang : 'en', message: m.message, createdAt: m.createdAt, handledAt: m.handledAt ?? null }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return { messages, unhandled: messages.filter((m) => !m.handledAt).length }
  }

  setMessageHandled(uid: string | null, id: string, handled: boolean): ContactMessage {
    const actor = this.owner(uid)
    const { changed } = this.accountsTx((db) => {
      const m = (db.contactMessages ?? []).find((x) => x.id === id)
      if (!m) throw new OwnerError('not_found')
      const changed = !!m.handledAt !== handled
      if (changed) m.handledAt = handled ? this.now() : null
      return { changed }
    })
    if (changed) this.auditOnly(actor, 'update', 'contact_messages', id, handled ? 'handled' : 'not handled')
    return this.listMessages(uid).messages.find((m) => m.id === id)!
  }

  listRefunds(uid: string | null): RefundsView {
    this.owner(uid)
    const db = this.accounts()
    const refunds = (db.refunds ?? [])
      .map((r) => {
        const o = (db.orders ?? []).find((x) => x.id === r.orderId)
        const email = (db.users ?? []).find((u) => u.id === o?.accountId)?.email ?? null
        const paid = o?.amountAgorot ?? r.amountAgorot
        return {
          id: r.id, orderId: r.orderId, passId: r.passId ?? null, email, ageGroup: o?.ageGroup ?? '4-5', months: o?.months ?? 1, paidAgorot: paid,
          priceWasPlaceholder: o?.priceWasPlaceholder ?? false, paidAt: o?.paidAt ?? null, requestedAt: r.requestedAt, feeAgorot: r.feeAgorot,
          maxFeeAgorot: maxCancellationFee(paid), status: r.status, issuedAt: r.issuedAt ?? null, note: r.note ?? null,
        } satisfies RefundsView['refunds'][number]
      })
      .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
    const publicRequests = (db.cancellationRequests ?? [])
      .map((c) => ({ id: c.id, email: c.email, orderRef: c.orderRef, message: c.message, createdAt: c.createdAt, handledAt: c.handledAt ?? null, matches: this.matches(db, c) }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return { refunds, open: refunds.filter((r) => r.status === 'requested').length, publicRequests }
  }

  /** The paid orders a public request names: the order number matches and the buyer's email is the request's. */
  private matches(db: LocalDb, c: { email: string; orderRef: string }): RequestMatch[] {
    const now = this.now()
    return (db.orders ?? [])
      .filter((o) => o.paidAt && orderRefMatches(c.orderRef, o.id))
      .filter((o) => (db.users ?? []).find((u) => u.id === o.accountId)?.email.toLowerCase() === c.email.trim().toLowerCase())
      .sort((a, b) => (b.paidAt ?? '').localeCompare(a.paidAt ?? ''))
      .map((o) => {
        const pass = (db.passes ?? []).find((p) => p.orderId === o.id) ?? null
        const refund = (db.refunds ?? []).filter((r) => r.orderId === o.id).sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))[0]
        return {
          orderId: o.id, ageGroup: o.ageGroup, months: o.months, paidAgorot: o.amountAgorot, priceWasPlaceholder: o.priceWasPlaceholder, paidAt: o.paidAt!,
          passId: pass?.id ?? null, passStatus: pass?.status ?? null,
          canCancel: !!pass && canCancel({ ...pass, paidAt: o.paidAt, amountAgorot: o.amountAgorot }, now), refundId: refund?.id ?? null,
        }
      })
  }

  /**
   * Ends the pass of an order that matches a public request and opens its refund request, through the same
   * cancellation as the family's own (cancelPass: 14 days, an active pass, queued passes moved), and marks the
   * request handled. As owner_cancel_for_request() in SQL. Returns the refund's id.
   */
  cancelForRequest(uid: string | null, requestId: string, orderId: string): string {
    const actor = this.owner(uid)
    const { refundId, passId } = this.accountsTx((db) => {
      const c = (db.cancellationRequests ?? []).find((x) => x.id === requestId)
      if (!c) throw new OwnerError('not_found')
      const m = this.matches(db, c).find((x) => x.orderId === orderId)
      const row = m?.passId ? db.passes.find((p) => p.id === m.passId) : undefined
      if (!m || !row) throw new OwnerError('order_not_matching')
      const lang = db.profiles?.[row.accountId]?.language ?? 'en'
      let refundId: string
      try {
        refundId = cancelPass(db, row, this.now(), lang)
      } catch (e) {
        if (e instanceof DataError && (e.code === 'pass_not_active' || e.code === 'cancel_window_closed')) throw new OwnerError(e.code)
        throw e
      }
      c.handledAt ??= this.now()
      return { refundId, passId: row.id }
    })
    this.auditOnly(actor, 'update', 'passes', passId)
    this.auditOnly(actor, 'insert', 'refunds', refundId)
    this.auditOnly(actor, 'update', 'cancellation_requests', requestId, `handled; cancelled order ${orderId}`)
    return refundId
  }

  setRefundFee(uid: string | null, id: string, feeAgorot: number | null) {
    const actor = this.owner(uid)
    if (feeAgorot !== null && (!Number.isInteger(feeAgorot) || feeAgorot < 0)) throw new OwnerError('fee_over_cap')
    const changed = this.accountsTx((db) => {
      const r = (db.refunds ?? []).find((x) => x.id === id)
      if (!r) throw new OwnerError('not_found')
      if (r.status !== 'requested') throw new OwnerError('refund_closed')
      // As guard_refund_fee(): the lower of 5% of what was paid or 100 shekels.
      const paid = (db.orders ?? []).find((o) => o.id === r.orderId)?.amountAgorot ?? r.amountAgorot
      if (feeAgorot !== null && feeAgorot > maxCancellationFee(paid)) throw new OwnerError('fee_over_cap')
      const changed = r.feeAgorot !== feeAgorot
      r.feeAgorot = feeAgorot
      // As refunds_amount_returned in SQL: the stored amount is what goes back to the family.
      r.amountAgorot = refundReturned(paid, feeAgorot)
      return changed
    })
    if (changed) this.auditOnly(actor, 'update', 'refunds', id)
  }

  markRefunded(uid: string | null, id: string, note: string) {
    const actor = this.owner(uid)
    const text = note.trim()
    if (!text || text.length > REFUND_NOTE_MAX) throw new OwnerError('note_required')
    const passId = this.accountsTx((db) => {
      const r = (db.refunds ?? []).find((x) => x.id === id)
      if (!r) throw new OwnerError('not_found')
      if (r.status !== 'requested') throw new OwnerError('refund_closed')
      if (r.feeAgorot === null) throw new OwnerError('fee_not_set')
      r.status = 'issued'
      r.issuedAt = this.now()
      r.note = text
      // The amount actually returned: what was paid minus the fee kept (review 26 Nov, finding 1).
      r.amountAgorot = refundReturned((db.orders ?? []).find((o) => o.id === r.orderId)?.amountAgorot ?? r.amountAgorot, r.feeAgorot)
      const pass = (db.passes ?? []).find((p) => p.id === r.passId)
      if (pass && pass.status === 'cancelled') pass.status = 'refunded'
      const o = (db.orders ?? []).find((x) => x.id === r.orderId)
      if (o) o.status = 'refunded'
      return pass ? pass.id : null
    })
    this.auditOnly(actor, 'update', 'refunds', id)
    if (passId) this.auditOnly(actor, 'update', 'passes', passId)
  }

  setCancellationHandled(uid: string | null, id: string, handled: boolean) {
    const actor = this.owner(uid)
    const changed = this.accountsTx((db) => {
      const c = (db.cancellationRequests ?? []).find((x) => x.id === id)
      if (!c) throw new OwnerError('not_found')
      const changed = !!c.handledAt !== handled
      if (changed) c.handledAt = handled ? this.now() : null
      return changed
    })
    if (changed) this.auditOnly(actor, 'update', 'cancellation_requests', id, handled ? 'handled' : 'not handled')
  }

  listPrices(uid: string | null): Price[] {
    this.owner(uid)
    const set = this.accounts().prices ?? []
    return AGE_GROUPS.flatMap((ageGroup) => PASS_MONTHS.map((months) => ({
      ageGroup, months, priceAgorot: set.find((p) => p.ageGroup === ageGroup && p.months === months)?.priceAgorot ?? null,
    })))
  }

  setPrice(uid: string | null, ageGroup: AgeGroup, months: PassMonths, priceAgorot: number | null): Price[] {
    const actor = this.owner(uid)
    if (!isAgeGroup(ageGroup) || !isPassMonths(months)) throw new OwnerError('not_found')
    if (priceAgorot !== null && !Number.isInteger(priceAgorot)) throw new OwnerError('bad_price')
    if (priceProblem(priceAgorot)) throw new OwnerError('bad_price')
    const changed = this.accountsTx((db) => {
      const list = (db.prices ??= [])
      const i = list.findIndex((p) => p.ageGroup === ageGroup && p.months === months)
      const before = i >= 0 ? list[i]!.priceAgorot : null
      if (i >= 0) list.splice(i, 1)
      if (priceAgorot !== null) list.push({ ageGroup, months, priceAgorot })
      return before !== priceAgorot
    })
    if (changed) this.auditOnly(actor, 'update', 'pass_prices', `${ageGroup}/${months}`)
    return this.listPrices(uid)
  }
}

/** The list row (shared with the Supabase owner backend, so a launch build never needs this test-mode file). */
export { summarise }

/** Cleans a draft from the editor: known values only, texts for every language, no captions for removed parts. */
export function normalise(s: OwnerStory, d: StoryDraft): Pick<OwnerStory, 'groups' | 'pages' | 'texts' | 'films' | 'activity'> {
  const seen = new Set<string>()
  const groups = d.groups.filter((g) => isAgeGroup(g.group) && !seen.has(g.group) && seen.add(g.group)).map((g) => ({ group: g.group, trial: !!g.trial }))
  groups.sort((a, b) => AGE_GROUPS.indexOf(a.group) - AGE_GROUPS.indexOf(b.group))
  const pages = d.pages.map((p) => ({
    key: p.key, pictureId: p.pictureId ?? null,
    zone: {
      side: ZONE_SIDES.includes(p.zone?.side) ? p.zone.side : DEFAULT_ZONE.side,
      v: ZONE_VS.includes(p.zone?.v) ? p.zone.v : DEFAULT_ZONE.v,
      size: ZONE_SIZES.includes(p.zone?.size) ? p.zone.size : DEFAULT_ZONE.size,
    },
  }))
  const steps = d.activity.steps.map((st) => ({ key: st.key, mediaId: st.mediaId ?? null, loop: !!st.loop }))
  const pageKeys = new Set(pages.map((p) => p.key))
  const stepKeys = new Set(steps.map((st) => st.key))
  const allowed = possibleLangs(s)
  const texts = Object.fromEntries(
    LANGS.map((l) => {
      const src = allowed.includes(l) ? (d.texts[l] ?? emptyLangContent()) : emptyLangContent()
      const a = src.activity ?? emptyLangContent().activity
      return [l, {
        title: src.title ?? '', teaser: src.teaser ?? '',
        pages: Object.fromEntries(Object.entries(src.pages ?? {}).filter(([k]) => pageKeys.has(k)).map(([k, v]) => [k, { text: v.text ?? '', speech: v.speech ?? '' }])),
        activity: {
          title: a.title ?? '', goal: a.goal ?? '', materials: (a.materials ?? []).map((m) => m.trim()).filter(Boolean),
          steps: Object.fromEntries(Object.entries(a.steps ?? {}).filter(([k]) => stepKeys.has(k))),
          safety: a.safety ?? '', forAdult: a.forAdult ?? '', inClass: a.inClass ?? '',
        },
      }]
    }),
  ) as OwnerStory['texts']
  const films = Object.fromEntries(LANGS.map((l) => [l, { videoId: d.films[l]?.videoId ?? null, captionsId: d.films[l]?.captionsId ?? null }])) as OwnerStory['films']
  return { groups, pages, texts, films, activity: { steps } }
}

/** The author's words: her Arabic title and every page's text and speech, and the pages themselves. */
export function lockedTextChanged(before: OwnerStory, after: Pick<OwnerStory, 'pages' | 'texts'>): boolean {
  const a = before.texts.ar
  const b = after.texts.ar
  if (a.title !== b.title) return true
  if (before.pages.map((p) => p.key).join() !== after.pages.map((p) => p.key).join()) return true
  return before.pages.some((p) => (a.pages[p.key]?.text ?? '') !== (b.pages[p.key]?.text ?? '') || (a.pages[p.key]?.speech ?? '') !== (b.pages[p.key]?.speech ?? ''))
}

export { hasActivity }

/** The browser-side client: passes the signed-in user's id, like supabase-js passes the user's token. */
export class LocalOwnerApi implements OwnerApi {
  readonly kind = 'local' as const
  private urls = new Map<string, string>()
  constructor(
    readonly server: LocalOwnerServer,
    private readonly uid: () => Promise<string | null>,
    private readonly latencyMs = 80,
  ) {}

  private async run<T>(fn: (uid: string | null) => T | Promise<T>): Promise<T> {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new OwnerError('network')
    if (this.latencyMs) await new Promise((r) => setTimeout(r, this.latencyMs))
    try {
      return await fn(await this.uid())
    } catch (e) {
      if (e instanceof OwnerError) throw e
      if (/quota/i.test(String((e as Error)?.name ?? '') + String((e as Error)?.message ?? ''))) throw new OwnerError('storage_full')
      throw e
    }
  }

  listStories() { return this.run((u) => this.server.listStories(u)) }
  getStory(id: string) { return this.run((u) => this.server.getStory(u, id)) }
  createStory() { return this.run((u) => this.server.createStory(u)) }
  saveStory(id: string, draft: StoryDraft) { return this.run((u) => this.server.saveStory(u, id, draft)) }
  upload(file: File, meta: UploadMeta) { return this.run((u) => this.server.upload(u, file, meta)) }
  getMedia(ids: string[]) { return this.run((u) => this.server.getMedia(u, ids)) }
  signOff(id: string, lang: Lang) { return this.run((u) => this.server.signOff(u, id, lang)) }
  withdrawSignOff(id: string, lang: Lang) { return this.run((u) => this.server.withdrawSignOff(u, id, lang)) }
  publish(id: string, only: Lang[] | null) { return this.run((u) => this.server.publish(u, id, only)) }
  unpublish(id: string) { return this.run((u) => this.server.unpublish(u, id)) }
  listAudit(storyId?: string) { return this.run((u) => this.server.listAudit(u, storyId)) }
  dashboard() { return this.run((u) => this.server.dashboard(u)) }
  listMessages() { return this.run((u) => this.server.listMessages(u)) }
  setMessageHandled(id: string, handled: boolean) { return this.run((u) => this.server.setMessageHandled(u, id, handled)) }
  listRefunds() { return this.run((u) => this.server.listRefunds(u)) }
  setRefundFee(id: string, feeAgorot: number | null) { return this.run((u) => this.server.setRefundFee(u, id, feeAgorot)) }
  markRefunded(id: string, note: string) { return this.run((u) => this.server.markRefunded(u, id, note)) }
  setCancellationHandled(id: string, handled: boolean) { return this.run((u) => this.server.setCancellationHandled(u, id, handled)) }
  async cancelForRequest(requestId: string, orderId: string) { await this.run((u) => this.server.cancelForRequest(u, requestId, orderId)) }
  listPrices() { return this.run((u) => this.server.listPrices(u)) }
  setPrice(ageGroup: AgeGroup, months: PassMonths, priceAgorot: number | null) { return this.run((u) => this.server.setPrice(u, ageGroup, months, priceAgorot)) }

  async mediaUrl(id: string) {
    const hit = this.urls.get(id)
    if (hit) return hit
    const blob = await this.run((u) => this.server.mediaBlob(u, id))
    const url = URL.createObjectURL(blob)
    this.urls.set(id, url)
    return url
  }
}
