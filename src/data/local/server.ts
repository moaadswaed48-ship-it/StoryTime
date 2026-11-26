import { isLang, type Lang } from '@/i18n/config'
import { CONTACT_MESSAGE_MAX, type ProviderEvent } from '../api'
import { DataError } from '../errors'
import { addDays, canCancel, hasAccessToStory, isPassCurrent, passDates, TRIAL_DAYS, TRIAL_STORIES } from '../rules'
import { TERMS_VERSION } from '../terms'
import {
  isAgeGroup, isPassMonths, learnerKindFor,
  cleanPrefs, MAX_FILM_POSITION_S,
  type AccessSnapshot, type Account, type AccountPrefs, type AgeGroup, type Iso, type Learner, type LearnerKind, type Order, type OrderStatus,
  type OrderRefund, type Pass, type PassMonths, type PassStatus, type Price, type Progress, type ProgressPatch, type Role, type StoryContent, type StorySummary, type Trial,
} from '../types'
import { PRICES } from '../prices'
import { isEmail, MIN_PASSWORD } from '../validate'
import { CONTENT_STORIES, loadContent, summaryFacts, type ContentStory } from './content'
import { TRIAL_PICKS } from './trial-picks'
import { SEED_STORIES, seedPages, seedTeaser, seedTitle } from './seed'

/**
 * The local backend's "server": the only code that reads and writes the local database, and the place every rule
 * is enforced, exactly where the real database enforces it (row-level security and the functions in
 * supabase/migrations). The browser-side client (./index.ts) only passes the signed-in user's id.
 *
 * TEST MODE ONLY. Everything lives in this browser's storage. Passwords are stored salted and hashed (SHA-256),
 * never in plain text, but this is not a production auth system.
 */

export interface KeyValue {
  get(key: string): string | null
  set(key: string, value: string): void
  remove(key: string): void
}

export function memoryKv(): KeyValue {
  const m = new Map<string, string>()
  return { get: (k) => m.get(k) ?? null, set: (k, v) => void m.set(k, v), remove: (k) => void m.delete(k) }
}

/** localStorage, failing soft (private mode, blocked storage) to memory. */
export function browserKv(): KeyValue {
  const mem = memoryKv()
  const ls = (): Storage | null => {
    try {
      return typeof localStorage === 'undefined' ? null : localStorage
    } catch {
      return null
    }
  }
  return {
    get: (k) => { try { return ls()?.getItem(k) ?? mem.get(k) } catch { return mem.get(k) } },
    set: (k, v) => { try { const s = ls(); if (s) s.setItem(k, v); else mem.set(k, v) } catch { mem.set(k, v) } },
    remove: (k) => { try { ls()?.removeItem(k) } catch { /* ignore */ } mem.remove(k) },
  }
}

export const DB_KEY = 'storytime.local.v1'
/** Test hook: milliseconds added to the clock, so tests can jump past a trial or pass end. */
export const CLOCK_KEY = 'storytime.dev.clockOffsetMs'
/** How long links from emails work. */
export const CONFIRM_LINK_HOURS = 24
export const RESET_LINK_HOURS = 1
export const RESEND_COOLDOWN_S = 60
const MAX_FAILED_SIGN_INS = 10

type UserRow = { id: string; email: string; salt: string; hash: string; confirmedAt: Iso | null; createdAt: Iso }
type ProfileRow = { role: Role; language: Lang; storyLanguage: Lang | null; onboardedAt: Iso | null; createdAt: Iso; prefs?: AccountPrefs }
type LearnerRow = Learner & { accountId: string; createdAt: Iso }
type ConsentRow = { id: string; accountId: string; kind: 'terms' | 'adult' | 'marketing'; granted: boolean; termsVersion: string | null; source: 'sign-up' | 'settings' | 'checkout'; createdAt: Iso }
type TrialRow = Trial & { accountId: string }
type OrderRow = Order & { accountId: string | null; termsVersion: string }
type PaymentRow = { id: string; orderId: string; provider: string; providerPaymentId: string; amountAgorot: number; createdAt: Iso }
export type PassRow = { id: string; accountId: string; orderId: string | null; ageGroup: AgeGroup; months: PassMonths; startsAt: Iso; endsAt: Iso; status: PassStatus; cancelledAt: Iso | null }
export type RefundRow = {
  id: string; orderId: string; passId: string; amountAgorot: number; feeAgorot: number | null; status: 'requested' | 'issued' | 'declined'; requestedAt: Iso
  /** Set by the owner's area (part 2) when the owner marks the money as returned, with her note. */
  issuedAt?: Iso | null; note?: string | null
}
type EventRow = { provider: string; eventId: string; orderId: string; kind: string; receivedAt: Iso }
type ProgressRow = Progress & { learnerId: string; accountId: string }
type TokenRow = { token: string; userId: string; kind: 'signup' | 'recovery' | 'email_change'; createdAt: Iso; expiresAt: Iso; usedAt: Iso | null; newEmail?: string }
export type OutboxRow = {
  id: string
  /** The address; null once the account is deleted and the email has gone out (then only `toHash` is kept). */
  to: string | null
  /** As email_log.to_email_hash: the salted SHA-256 of the address, the same formula as the trial ledger. */
  toHash?: string
  template: OutboxTemplate
  lang: Lang
  link: string | null
  createdAt: Iso
}
export type OutboxTemplate = 'confirm' | 'reset' | 'purchase' | 'cancellation' | 'deleted' | 'email_change' | 'email_changed'

export type LocalDb = {
  version: 1
  users: UserRow[]
  profiles: Record<string, ProfileRow>
  learners: LearnerRow[]
  consents: ConsentRow[]
  trials: TrialRow[]
  orders: OrderRow[]
  payments: PaymentRow[]
  passes: PassRow[]
  refunds: RefundRow[]
  providerEvents: EventRow[]
  cancellationRequests: { id: string; email: string; orderRef: string; message: string | null; createdAt: Iso; handledAt?: Iso | null }[]
  outbox: OutboxRow[]
  tokens: TokenRow[]
  deletionRequests: { id: string; requestedAt: Iso; completedAt: Iso | null }[]
  failedSignIns: Record<string, Iso[]>
  /** Added in part B1; older saved databases simply have none yet. */
  progress: ProgressRow[]
  /** start_trial()'s private.trial_ledger: a salted hash of each email that started a trial, kept after deletion. */
  trialLedger?: { emailHash: string; usedOn: string }[]
  ledgerSalt?: string
  /** Added in part C: "my shelf", per profile (the favourites table). */
  favourites?: { learnerId: string; accountId: string; storyId: string; createdAt: Iso }[]
  /** The contact form (table contact_messages), added after the site review. */
  contactMessages?: { id: string; name: string | null; email: string; lang: string; message: string; createdAt: Iso; handledAt?: Iso | null }[]
  /** Pass prices the owner set in the owner's area (table pass_prices); a pass missing here has no price yet. */
  prices?: Price[]
}

/**
 * The cancellation itself (private.cancel_pass() in SQL), shared by the family's own cancellation and the owner's
 * cancellation for a request from the public form (src/features/owner/data/local.ts): an active pass, within 14
 * days of payment; passes queued behind it move earlier by the time it had left (W4); a refund request for the price
 * paid; the cancellation email. Throws pass_not_active or cancel_window_closed. Returns the refund's id.
 */
export function cancelPass(db: LocalDb, row: PassRow, now: Iso, lang: Lang): string {
  if (row.status !== 'active') throw new DataError('pass_not_active')
  const o = db.orders.find((x) => x.id === row.orderId)
  const pass: Pass = { ...row, paidAt: o?.paidAt ?? null, amountAgorot: o?.amountAgorot ?? 0 }
  if (!canCancel(pass, now)) throw new DataError('cancel_window_closed')
  row.status = 'cancelled'
  row.cancelledAt = now
  const unused = new Date(row.endsAt).getTime() - Math.max(new Date(now).getTime(), new Date(row.startsAt).getTime())
  if (unused > 0) {
    for (const q of db.passes) {
      if (q.id === row.id || q.accountId !== row.accountId || q.ageGroup !== row.ageGroup || q.status !== 'active' || q.startsAt < row.endsAt) continue
      q.startsAt = new Date(new Date(q.startsAt).getTime() - unused).toISOString()
      q.endsAt = new Date(new Date(q.endsAt).getTime() - unused).toISOString()
    }
  }
  const id = uuid()
  db.refunds.push({ id, orderId: row.orderId!, passId: row.id, amountAgorot: pass.amountAgorot, feeAgorot: null, status: 'requested', requestedAt: now })
  const u = db.users.find((x) => x.id === row.accountId)
  if (u) db.outbox.push({ id: uuid(), to: u.email, template: 'cancellation', lang, link: null, createdAt: now })
  return id
}

/**
 * One catalogue row: a story from content/stories/ (the real format) or one of the text-only seed samples that
 * exercise the access rules. Real stories come first, in folder order (a01..c15), then the content samples, then the
 * seeds. Each age group's trial stories are its TRIAL_PICKS (./trial-picks.ts), placed first on the shelf; a group
 * without its picks (a test build with other content) falls back to its first TRIAL_STORIES stories.
 */
type CatalogueRow = {
  id: string
  slug: string
  status: 'published' | 'draft'
  groups: { group: AgeGroup; trial: boolean; position: number }[]
  source: 'content' | 'seed'
}

export function buildCatalogue(stories: ContentStory[] = CONTENT_STORIES, picks: Record<AgeGroup, readonly string[]> = TRIAL_PICKS): CatalogueRow[] {
  const rows: (CatalogueRow & { eligible: Set<AgeGroup> })[] = []
  stories.forEach((c, i) => {
    const position = (c.isSample ? -50 : -100) + i
    rows.push({ id: c.id, slug: c.id, status: 'published', source: 'content', groups: c.story.ageGroups.map((group) => ({ group, trial: false, position })), eligible: new Set(c.story.ageGroups) })
  })
  for (const s of SEED_STORIES) {
    rows.push({ id: s.id, slug: s.slug, status: s.status, source: 'seed', groups: s.groups.map((g) => ({ ...g, trial: false })), eligible: new Set(s.groups.filter((g) => g.trial).map((g) => g.group)) })
  }
  for (const group of ['2-3', '4-5', '6-8'] as const) {
    const listed = rows.filter((r) => r.status === 'published' && r.groups.some((g) => g.group === group))
    const picked = picks[group].map((id) => listed.find((r) => r.id === id)).filter((r): r is (typeof rows)[number] => !!r)
    if (picked.length === TRIAL_STORIES) {
      picked.forEach((r, i) => {
        const g = r.groups.find((x) => x.group === group)!
        g.trial = true
        g.position = -200 + i // the open books lead the shelf
      })
      continue
    }
    listed
      .filter((r) => r.eligible.has(group))
      .map((r) => ({ r, g: r.groups.find((g) => g.group === group)! }))
      .sort((a, b) => a.g.position - b.g.position)
      .slice(0, TRIAL_STORIES)
      .forEach(({ g }) => (g.trial = true))
  }
  return rows.map(({ eligible: _e, ...r }) => r)
}
export const CATALOGUE: CatalogueRow[] = buildCatalogue()

const emptyDb = (): LocalDb => ({
  version: 1, users: [], profiles: {}, learners: [], consents: [], trials: [], orders: [], payments: [], passes: [], refunds: [],
  providerEvents: [], cancellationRequests: [], outbox: [], tokens: [], deletionRequests: [], failedSignIns: {}, progress: [],
})

const uuid = () => (globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`)
const norm = (email: string) => email.trim().toLowerCase()

async function hashPassword(password: string, salt: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${salt}:${password}`)
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

export class LocalServer {
  constructor(private readonly kv: KeyValue) {}

  // ---- storage and clock -------------------------------------------------------------------------------------

  now(): Iso {
    const offset = Number(this.kv.get(CLOCK_KEY) ?? 0) || 0
    return new Date(Date.now() + offset).toISOString()
  }

  private read(): LocalDb {
    const raw = this.kv.get(DB_KEY)
    if (!raw) return emptyDb()
    try {
      const db = JSON.parse(raw) as LocalDb
      return db?.version === 1 ? { ...emptyDb(), ...db } : emptyDb()
    } catch {
      return emptyDb()
    }
  }

  private write(db: LocalDb) {
    this.kv.set(DB_KEY, JSON.stringify(db))
  }

  /** Read, change and save in one step. */
  private tx<T>(fn: (db: LocalDb) => T): T {
    const db = this.read()
    const out = fn(db)
    this.write(db)
    return out
  }

  /** For tests and the test-mode notice: the emails that would have been sent. */
  outbox(): OutboxRow[] {
    return this.read().outbox
  }

  // ---- auth ----------------------------------------------------------------------------------------------------

  async signUp(input: { email: string; password: string; role: 'parent' | 'teacher'; language: Lang; termsVersion: string; adult: boolean; marketing: boolean }, linkBase: string) {
    const email = norm(input.email)
    if (!isEmail(email)) throw new DataError('invalid_email')
    if (input.password.length < MIN_PASSWORD) throw new DataError('weak_password')
    if (input.termsVersion !== TERMS_VERSION || !input.adult) throw new DataError('terms_required')
    const salt = uuid()
    const hash = await hashPassword(input.password, salt)
    return this.tx((db) => {
      const existing = db.users.find((u) => u.email === email)
      // Decision 15 in the product checklist: sign-up says when an email already has an account.
      if (existing) throw new DataError('email_taken')
      const now = this.now()
      const id = uuid()
      db.users.push({ id, email, salt, hash, confirmedAt: null, createdAt: now })
      db.profiles[id] = { role: input.role, language: input.language, storyLanguage: null, onboardedAt: null, createdAt: now }
      db.consents.push(
        { id: uuid(), accountId: id, kind: 'terms', granted: true, termsVersion: input.termsVersion, source: 'sign-up', createdAt: now },
        { id: uuid(), accountId: id, kind: 'adult', granted: true, termsVersion: null, source: 'sign-up', createdAt: now },
        { id: uuid(), accountId: id, kind: 'marketing', granted: input.marketing, termsVersion: null, source: 'sign-up', createdAt: now },
      )
      this.sendLink(db, id, email, 'signup', input.language, linkBase)
    })
  }

  private sendLink(db: LocalDb, userId: string, email: string, kind: 'signup' | 'recovery', lang: Lang, linkBase: string) {
    const now = this.now()
    // One link a minute per account and kind.
    const recent = db.tokens.filter((t) => t.userId === userId && t.kind === kind).at(-1)
    if (recent && new Date(now).getTime() - new Date(recent.createdAt).getTime() < RESEND_COOLDOWN_S * 1000) throw new DataError('rate_limited')
    const token = uuid().replace(/-/g, '')
    const hours = kind === 'signup' ? CONFIRM_LINK_HOURS : RESET_LINK_HOURS
    db.tokens.push({ token, userId, kind, createdAt: now, expiresAt: new Date(new Date(now).getTime() + hours * 3_600_000).toISOString(), usedAt: null })
    const page = kind === 'signup' ? 'auth/confirm' : 'auth/reset'
    db.outbox.push({ id: uuid(), to: email, template: kind === 'signup' ? 'confirm' : 'reset', lang, link: `${linkBase}${lang}/${page}/?token=${token}`, createdAt: now })
  }

  resendConfirmation(email: string, lang: Lang, linkBase: string) {
    this.tx((db) => {
      const u = db.users.find((x) => x.email === norm(email))
      if (!u || u.confirmedAt) return // says nothing either way
      this.sendLink(db, u.id, u.email, 'signup', lang, linkBase)
    })
  }

  requestPasswordReset(email: string, lang: Lang, linkBase: string) {
    if (!isEmail(email)) throw new DataError('invalid_email')
    this.tx((db) => {
      const u = db.users.find((x) => x.email === norm(email))
      if (!u) return // never reveals whether an account exists
      this.sendLink(db, u.id, u.email, 'recovery', lang, linkBase)
    })
  }

  /** Uses a link's token once. Returns the user it belongs to. */
  completeLink(kind: 'signup' | 'recovery' | 'email_change', token: string | null): { userId: string; email: string } {
    return this.tx((db) => {
      const row = db.tokens.find((t) => t.token === token && t.kind === kind)
      const user = row && db.users.find((u) => u.id === row.userId)
      if (!row || !user || row.usedAt || new Date(this.now()) >= new Date(row.expiresAt)) throw new DataError('link_expired')
      row.usedAt = this.now()
      if (kind === 'email_change') {
        const next = norm(row.newEmail ?? '')
        if (!isEmail(next)) throw new DataError('link_expired')
        if (db.users.some((u) => u.id !== user.id && u.email === next)) throw new DataError('email_taken')
        const old = user.email
        user.email = next
        // Older links for the old address stop working; a notice goes to the old address (the real owner hears).
        for (const t of db.tokens) if (t.userId === user.id && t.kind === 'email_change' && !t.usedAt) t.usedAt = this.now()
        db.outbox.push({ id: uuid(), to: old, template: 'email_changed', lang: db.profiles[user.id]?.language ?? 'en', link: null, createdAt: this.now() })
        return { userId: user.id, email: user.email }
      }
      if (kind === 'signup' || !user.confirmedAt) user.confirmedAt = user.confirmedAt ?? this.now()
      return { userId: user.id, email: user.email }
    })
  }

  async signIn(email: string, password: string): Promise<{ userId: string; email: string }> {
    const key = norm(email)
    const db = this.read()
    const since = new Date(this.now()).getTime() - 15 * 60_000
    const fails = (db.failedSignIns[key] ?? []).filter((t) => new Date(t).getTime() > since)
    if (fails.length >= MAX_FAILED_SIGN_INS) throw new DataError('rate_limited')
    const u = db.users.find((x) => x.email === key)
    const ok = !!u && (await hashPassword(password, u.salt)) === u.hash
    if (!ok || !u) {
      this.tx((d) => void (d.failedSignIns[key] = [...fails, this.now()]))
      // One message for a wrong password and for no account (product checklist 23).
      throw new DataError('wrong_credentials')
    }
    if (!u.confirmedAt) throw new DataError('email_unconfirmed')
    this.tx((d) => void delete d.failedSignIns[key])
    return { userId: u.id, email: u.email }
  }

  async setPassword(uid: string | null, password: string) {
    const id = this.requireUser(uid)
    if (password.length < MIN_PASSWORD) throw new DataError('weak_password')
    const salt = uuid()
    const hash = await hashPassword(password, salt)
    this.tx((db) => {
      const u = db.users.find((x) => x.id === id)
      if (!u) throw new DataError('not_signed_in')
      u.salt = salt
      u.hash = hash
    })
  }

  /**
   * As supabase.auth.updateUser({ email }): a link to the new address; nothing changes until it is opened.
   * One link a minute; an address that already has an account is refused.
   */
  requestEmailChange(uid: string | null, newEmail: string, lang: Lang, linkBase: string) {
    const id = this.requireUser(uid)
    const next = norm(newEmail)
    if (!isEmail(next)) throw new DataError('invalid_email')
    this.tx((db) => {
      const u = db.users.find((x) => x.id === id)!
      if (next === u.email) throw new DataError('unknown', 'same_email')
      if (db.users.some((x) => x.email === next)) throw new DataError('email_taken')
      const now = this.now()
      const recent = db.tokens.filter((t) => t.userId === id && t.kind === 'email_change').at(-1)
      if (recent && new Date(now).getTime() - new Date(recent.createdAt).getTime() < RESEND_COOLDOWN_S * 1000) throw new DataError('rate_limited')
      const token = uuid().replace(/-/g, '')
      db.tokens.push({ token, userId: id, kind: 'email_change', newEmail: next, createdAt: now, expiresAt: new Date(new Date(now).getTime() + CONFIRM_LINK_HOURS * 3_600_000).toISOString(), usedAt: null })
      db.outbox.push({ id: uuid(), to: next, template: 'email_change', lang, link: `${linkBase}${lang}/auth/confirm-email/?token=${token}`, createdAt: now })
    })
  }

  /** The user still exists (a deleted account's session is dead). */
  userExists(uid: string): boolean {
    return this.read().users.some((u) => u.id === uid)
  }

  private requireUser(uid: string | null): string {
    if (!uid || !this.userExists(uid)) throw new DataError('not_signed_in')
    return uid
  }

  // ---- account -------------------------------------------------------------------------------------------------

  getAccount(uid: string | null): Account {
    const id = this.requireUser(uid)
    const db = this.read()
    const u = db.users.find((x) => x.id === id)!
    const p = db.profiles[id]!
    const marketing = db.consents.filter((c) => c.accountId === id && c.kind === 'marketing').at(-1)
    return { id, email: u.email, role: p.role, language: p.language, storyLanguage: p.storyLanguage, onboardedAt: p.onboardedAt, marketingOptIn: !!marketing?.granted, createdAt: p.createdAt, prefs: cleanPrefs(p.prefs) }
  }

  updateAccount(uid: string | null, patch: { language?: Lang; storyLanguage?: Lang; onboarded?: true; prefs?: AccountPrefs }): Account {
    const id = this.requireUser(uid)
    this.tx((db) => {
      const p = db.profiles[id]!
      // As the profiles_prefs_check constraint: only the known settings, with their types.
      if (patch.prefs) p.prefs = cleanPrefs({ ...cleanPrefs(p.prefs), ...cleanPrefs(patch.prefs) })
      if (patch.language && isLang(patch.language)) p.language = patch.language
      if (patch.storyLanguage && isLang(patch.storyLanguage)) p.storyLanguage = patch.storyLanguage
      if (patch.onboarded) p.onboardedAt = p.onboardedAt ?? this.now()
    })
    return this.getAccount(id)
  }

  setRole(uid: string | null, role: 'parent' | 'teacher') {
    const id = this.requireUser(uid)
    this.tx((db) => {
      const p = db.profiles[id]!
      if (p.role === 'owner') throw new DataError('unknown', 'role_not_allowed')
      if (db.learners.some((l) => l.accountId === id)) throw new DataError('role_locked')
      p.role = role
    })
  }

  setMarketing(uid: string | null, optIn: boolean) {
    const id = this.requireUser(uid)
    this.tx((db) => void db.consents.push({ id: uuid(), accountId: id, kind: 'marketing', granted: optIn, termsVersion: null, source: 'settings', createdAt: this.now() }))
  }

  listLearners(uid: string | null): Learner[] {
    const id = this.requireUser(uid)
    return this.read().learners.filter((l) => l.accountId === id).map(({ id: lid, kind, name, ageGroup }) => ({ id: lid, kind, name, ageGroup }))
  }

  addLearner(uid: string | null, input: { name: string; ageGroup: AgeGroup }): Learner {
    const id = this.requireUser(uid)
    const name = input.name.trim()
    if (!name || name.length > 40 || !isAgeGroup(input.ageGroup)) throw new DataError('unknown', 'bad_learner')
    return this.tx((db) => {
      if (db.learners.filter((l) => l.accountId === id).length >= 5) throw new DataError('profile_limit')
      const kind: LearnerKind = learnerKindFor(db.profiles[id]!.role)
      const row: LearnerRow = { id: uuid(), accountId: id, kind, name, ageGroup: input.ageGroup, createdAt: this.now() }
      db.learners.push(row)
      return { id: row.id, kind, name, ageGroup: row.ageGroup }
    })
  }

  updateLearner(uid: string | null, learnerId: string, patch: { name?: string; ageGroup?: AgeGroup }): Learner {
    const id = this.requireUser(uid)
    return this.tx((db) => {
      const l = db.learners.find((x) => x.id === learnerId && x.accountId === id)
      if (!l) throw new DataError('not_found')
      if (patch.name !== undefined) {
        const n = patch.name.trim()
        if (!n || n.length > 40) throw new DataError('unknown', 'bad_learner')
        l.name = n
      }
      if (patch.ageGroup && isAgeGroup(patch.ageGroup)) l.ageGroup = patch.ageGroup
      return { id: l.id, kind: l.kind, name: l.name, ageGroup: l.ageGroup }
    })
  }

  removeLearner(uid: string | null, learnerId: string) {
    const id = this.requireUser(uid)
    this.tx((db) => {
      if (!db.learners.some((l) => l.id === learnerId && l.accountId === id)) return
      db.learners = db.learners.filter((l) => l.id !== learnerId)
      // As the foreign keys (on delete cascade): the profile's progress and shelf go with it.
      db.progress = db.progress.filter((p) => p.learnerId !== learnerId)
      db.favourites = (db.favourites ?? []).filter((f) => f.learnerId !== learnerId)
    })
  }

  exportMyData(uid: string | null): unknown {
    const id = this.requireUser(uid)
    const db = this.read()
    const orders = db.orders.filter((o) => o.accountId === id)
    const orderIds = new Set(orders.map((o) => o.id))
    return {
      // The same keys as export_my_data() in SQL (review finding W6; tests/export-shape.ts).
      exported_at: this.now(),
      email: db.users.find((u) => u.id === id)!.email,
      profile: (({ email: _e, ...p }) => p)(this.getAccount(id)),
      children: this.listLearners(id),
      consents: db.consents.filter((c) => c.accountId === id),
      trial: db.trials.find((t) => t.accountId === id) ?? null,
      orders,
      payments: db.payments.filter((p) => orderIds.has(p.orderId)),
      passes: db.passes.filter((p) => p.accountId === id),
      refunds: db.refunds.filter((r) => orderIds.has(r.orderId)),
      progress: db.progress.filter((p) => p.accountId === id).map(({ accountId: _a, ...p }) => p),
      favourites: (db.favourites ?? []).filter((f) => f.accountId === id).map(({ accountId: _a, ...f }) => f),
      note: 'Test mode: this data lives only in this browser.',
    }
  }

  /** The salted hash of an address (private.email_hash() in SQL; the trial ledger uses the same salt and formula). */
  private async emailHash(email: string): Promise<string> {
    const salt = this.tx((db) => (db.ledgerSalt ??= uuid()))
    return hashPassword(norm(email), salt)
  }

  /**
   * Same effect as delete_my_account(): everything goes except orders and payments, which lose the name. The
   * outbox (this backend's email log) keeps no address of the account: earlier emails keep only the hash, and the
   * account-deleted email, which in test mode counts as sent the moment it is written, too
   * (supabase/migrations/20261125120000_email_log_privacy.sql).
   */
  async deleteAccount(uid: string | null, lang: Lang) {
    const id = this.requireUser(uid)
    const toHash = await this.emailHash(this.read().users.find((x) => x.id === id)!.email)
    this.tx((db) => {
      const u = db.users.find((x) => x.id === id)!
      db.deletionRequests.push({ id: uuid(), requestedAt: this.now(), completedAt: this.now() })
      for (const m of db.outbox) {
        if (m.to !== null && norm(m.to) === norm(u.email)) {
          m.to = null
          m.toHash = toHash
          m.link = null
        }
      }
      db.outbox.push({ id: uuid(), to: null, toHash, template: 'deleted', lang, link: null, createdAt: this.now() })
      db.users = db.users.filter((x) => x.id !== id)
      delete db.profiles[id]
      db.learners = db.learners.filter((l) => l.accountId !== id)
      db.consents = db.consents.filter((c) => c.accountId !== id)
      db.trials = db.trials.filter((t) => t.accountId !== id)
      db.passes = db.passes.filter((p) => p.accountId !== id)
      db.progress = db.progress.filter((p) => p.accountId !== id)
      db.favourites = (db.favourites ?? []).filter((f) => f.accountId !== id)
      db.tokens = db.tokens.filter((t) => t.userId !== id)
      for (const o of db.orders) if (o.accountId === id) o.accountId = null
    })
  }

  // ---- catalogue and access ------------------------------------------------------------------------------------

  access(uid: string | null): AccessSnapshot {
    const id = this.requireUser(uid)
    const db = this.read()
    const t = db.trials.find((x) => x.accountId === id)
    const opened = new Set(db.progress.filter((p) => p.accountId === id && (p.lastPage !== null || p.filmWatched || p.activityDone)).map((p) => p.storyId))
    return {
      now: this.now(),
      role: db.profiles[id]!.role,
      trial: t ? { id: t.id, ageGroup: t.ageGroup, startedAt: t.startedAt, endsAt: t.endsAt, storyIds: t.storyIds } : null,
      passes: db.passes.filter((p) => p.accountId === id).map((p) => this.passOut(db, p)),
      trialOpened: t ? t.storyIds.filter((s) => opened.has(s)) : [],
    }
  }

  private passOut(db: LocalDb, p: PassRow): Pass {
    const o = db.orders.find((x) => x.id === p.orderId)
    return { id: p.id, orderId: p.orderId, ageGroup: p.ageGroup, months: p.months, startsAt: p.startsAt, endsAt: p.endsAt, status: p.status, paidAt: o?.paidAt ?? null, amountAgorot: o?.amountAgorot ?? 0 }
  }

  /** Catalogue facts for signed-in users: published stories only (the owner sees drafts too). Never story text. */
  async listStories(uid: string | null, lang: Lang, group?: AgeGroup): Promise<StorySummary[]> {
    const id = this.requireUser(uid)
    const owner = this.read().profiles[id]!.role === 'owner'
    const rows = CATALOGUE.filter((s) => (s.status === 'published' || owner) && (!group || s.groups.some((g) => g.group === group)))
      .sort((a, b) => {
        const pa = a.groups.find((g) => g.group === group)?.position ?? Math.min(...a.groups.map((g) => g.position))
        const pb = b.groups.find((g) => g.group === group)?.position ?? Math.min(...b.groups.map((g) => g.position))
        return pa - pb
      })
    return Promise.all(rows.map(async (s): Promise<StorySummary> => {
      const base = { id: s.id, slug: s.slug, ageGroups: s.groups.map((g) => g.group), trialIn: s.groups.filter((g) => g.trial).map((g) => g.group) }
      const c = s.source === 'content' ? CONTENT_STORIES.find((x) => x.id === s.id) : undefined
      if (c) return { ...base, ...(await summaryFacts(c, lang)), isSample: c.isSample, credit: c.story.owner === 'author' ? 'author' : 'storytime', features: c.features }
      const seed = SEED_STORIES.find((x) => x.id === s.id)!
      return { ...base, title: seedTitle(seed, lang), teaser: seedTeaser(lang), isSample: true, credit: 'storytime', coverUrl: null, features: { listen: false, film: false, activity: false } }
    }))
  }

  /** Paid content, only past the same check as has_access_to_story(). The content is loaded after the check. */
  async getStoryContent(uid: string | null, storyId: string, lang: Lang): Promise<StoryContent> {
    const id = this.requireUser(uid)
    const s = CATALOGUE.find((x) => x.id === storyId)
    if (!s) throw new DataError('not_found')
    const facts = { id: s.id, published: s.status === 'published', ageGroups: s.groups.map((g) => g.group) }
    if (!hasAccessToStory(this.access(id), facts)) throw new DataError('locked')
    const c = s.source === 'content' ? CONTENT_STORIES.find((x) => x.id === s.id) : undefined
    if (c) return loadContent(c, lang)
    const seed = SEED_STORIES.find((x) => x.id === s.id)!
    return { id: s.id, lang, title: seedTitle(seed, lang), credit: 'storytime', isSample: true, pages: seedPages(lang), film: null, activity: null }
  }

  // ---- progress (the progress table: one row per profile and story) --------------------------------------------

  private ownLearner(db: LocalDb, accountId: string, learnerId: string) {
    if (!db.learners.some((l) => l.id === learnerId && l.accountId === accountId)) throw new DataError('not_found')
  }

  listProgress(uid: string | null, learnerId: string): Progress[] {
    const id = this.requireUser(uid)
    const db = this.read()
    this.ownLearner(db, id, learnerId)
    // Rows saved before part C have no film position.
    return db.progress.filter((p) => p.learnerId === learnerId).map(({ learnerId: _l, accountId: _a, ...p }) => ({ ...p, filmPositionS: p.filmPositionS ?? null }))
  }

  saveProgress(uid: string | null, learnerId: string, storyId: string, patch: ProgressPatch): Progress {
    const id = this.requireUser(uid)
    if (!CATALOGUE.some((s) => s.id === storyId)) throw new DataError('not_found')
    return this.tx((db) => {
      this.ownLearner(db, id, learnerId)
      let row = db.progress.find((p) => p.learnerId === learnerId && p.storyId === storyId)
      if (!row) {
        row = { learnerId, accountId: id, storyId, lastPage: null, filmWatched: false, activityDone: false, filmPositionS: null, updatedAt: this.now() }
        db.progress.push(row)
      }
      if (patch.lastPage !== undefined) row.lastPage = patch.lastPage === null ? null : Math.max(1, Math.round(patch.lastPage))
      if (patch.filmWatched !== undefined) row.filmWatched = row.filmWatched || patch.filmWatched
      if (patch.activityDone !== undefined) row.activityDone = patch.activityDone
      if (patch.filmPositionS !== undefined) {
        const v = patch.filmPositionS === null ? null : Math.round(patch.filmPositionS)
        if (v !== null && !(v >= 0 && v <= MAX_FILM_POSITION_S)) throw new DataError('unknown', 'bad_film_position')
        row.filmPositionS = v
      }
      row.updatedAt = this.now()
      const { learnerId: _l, accountId: _a, ...out } = row
      return { ...out, filmPositionS: out.filmPositionS ?? null }
    })
  }

  // ---- favourites ("my shelf", per profile) --------------------------------------------------------------------

  listFavourites(uid: string | null, learnerId: string): string[] {
    const id = this.requireUser(uid)
    const db = this.read()
    this.ownLearner(db, id, learnerId)
    return (db.favourites ?? []).filter((f) => f.learnerId === learnerId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((f) => f.storyId)
  }

  setFavourite(uid: string | null, learnerId: string, storyId: string, on: boolean) {
    const id = this.requireUser(uid)
    if (!CATALOGUE.some((s) => s.id === storyId)) throw new DataError('not_found')
    this.tx((db) => {
      this.ownLearner(db, id, learnerId)
      const list = (db.favourites ??= [])
      const i = list.findIndex((f) => f.learnerId === learnerId && f.storyId === storyId)
      if (on && i < 0) list.push({ learnerId, accountId: id, storyId, createdAt: this.now() })
      if (!on && i >= 0) list.splice(i, 1)
    })
  }

  /** start_trial(): one per account and one per email address (also after deletion), 3 days, the stories copied at start. */
  async startTrial(uid: string | null, group: AgeGroup): Promise<Trial> {
    const id = this.requireUser(uid)
    if (!isAgeGroup(group)) throw new DataError('unknown', 'bad_age_group')
    const salt = this.tx((db) => (db.ledgerSalt ??= uuid()))
    const emailHash = await hashPassword(norm(this.read().users.find((u) => u.id === id)!.email), salt)
    return this.tx((db) => {
      if (db.trials.some((t) => t.accountId === id)) throw new DataError('trial_used')
      if (db.trialLedger?.some((x) => x.emailHash === emailHash)) throw new DataError('trial_used')
      const storyIds = CATALOGUE.filter((s) => s.status === 'published')
        .flatMap((s) => s.groups.filter((g) => g.group === group && g.trial).map((g) => ({ id: s.id, pos: g.position })))
        .sort((a, b) => a.pos - b.pos)
        .slice(0, TRIAL_STORIES)
        .map((x) => x.id)
      if (!storyIds.length) throw new DataError('no_trial_stories')
      const now = this.now()
      const trial: TrialRow = { id: uuid(), accountId: id, ageGroup: group, startedAt: now, endsAt: addDays(now, TRIAL_DAYS), storyIds }
      db.trials.push(trial)
      ;(db.trialLedger ??= []).push({ emailHash, usedOn: now.slice(0, 10) })
      return { id: trial.id, ageGroup: group, startedAt: trial.startedAt, endsAt: trial.endsAt, storyIds }
    })
  }

  // ---- money ---------------------------------------------------------------------------------------------------

  /** As the pass_prices table: null (a visibly marked placeholder) until the owner sets a price in the owner's area. */
  listPrices(): Price[] {
    const set = this.read().prices ?? []
    return PRICES.map((p) => ({ ...p, priceAgorot: set.find((x) => x.ageGroup === p.ageGroup && x.months === p.months)?.priceAgorot ?? null }))
  }

  createOrder(uid: string | null, input: { ageGroup: AgeGroup; months: PassMonths; provider: string; termsVersion: string; expectedAgorot: number | null }): Order {
    const id = this.requireUser(uid)
    if (!isAgeGroup(input.ageGroup) || !isPassMonths(input.months)) throw new DataError('unknown', 'bad_plan')
    if (input.termsVersion !== TERMS_VERSION) throw new DataError('terms_required')
    // As create_order(): test mode always allows the test provider; no real provider is connected (R5).
    if (input.provider !== 'test') throw new DataError('unknown', 'provider_not_connected')
    const price = this.listPrices().find((p) => p.ageGroup === input.ageGroup && p.months === input.months)!.priceAgorot
    // As create_order(): the price the family was shown must still be the price (review 26 Nov, finding 7).
    if ((input.expectedAgorot ?? null) !== price) throw new DataError('price_changed')
    return this.tx((db) => {
      const now = this.now()
      const hourAgo = new Date(now).getTime() - 3_600_000
      if (db.orders.filter((o) => o.accountId === id && o.status === 'pending' && new Date(o.createdAt).getTime() > hourAgo).length >= 5) throw new DataError('rate_limited')
      const o: OrderRow = {
        id: uuid(), accountId: id, ageGroup: input.ageGroup, months: input.months, amountAgorot: price ?? 0, priceWasPlaceholder: price === null,
        provider: input.provider, status: 'pending', createdAt: now, paidAt: null, termsVersion: input.termsVersion,
      }
      db.orders.push(o)
      db.consents.push({ id: uuid(), accountId: id, kind: 'terms', granted: true, termsVersion: input.termsVersion, source: 'checkout', createdAt: now })
      return this.orderOut(o)
    })
  }

  private orderOut(o: OrderRow): Order {
    const { accountId: _a, termsVersion: _t, ...rest } = o
    return rest
  }

  getOrder(uid: string | null, orderId: string): Order {
    const id = this.requireUser(uid)
    const o = this.read().orders.find((x) => x.id === orderId && x.accountId === id)
    if (!o) throw new DataError('not_found')
    return this.orderOut(o)
  }

  listOrders(uid: string | null): Order[] {
    const id = this.requireUser(uid)
    const db = this.read()
    return db.orders.filter((o) => o.accountId === id).map((o) => {
      // The latest refund of the order, as the family may read it (refunds_read policy): amount returned, fee, note.
      const r = db.refunds.filter((x) => x.orderId === o.id).sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))[0]
      const refund: OrderRefund | null = r
        ? { status: r.status, amountAgorot: r.amountAgorot, feeAgorot: r.feeAgorot, requestedAt: r.requestedAt, issuedAt: r.issuedAt ?? null, note: r.note ?? null }
        : null
      return { ...this.orderOut(o), refund }
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  /**
   * The server side of a payment callback: confirm_payment() / record_payment_failure() in SQL. A real provider's
   * verified callback ends here; so does the test provider's. Each event is stored once.
   */
  handleProviderEvent(e: ProviderEvent, lang: Lang = 'en') {
    this.tx((db) => {
      const seen = db.providerEvents.find((x) => x.provider === e.provider && x.eventId === e.eventId)
      if (seen && seen.orderId !== e.orderId) throw new DataError('unknown', 'event_order_mismatch')
      if (seen) return
      db.providerEvents.push({ provider: e.provider, eventId: e.eventId, orderId: e.orderId, kind: e.kind, receivedAt: this.now() })
      const o = db.orders.find((x) => x.id === e.orderId)
      if (!o) throw new DataError('not_found', 'order')
      if (o.provider !== e.provider) throw new DataError('unknown', 'provider_mismatch')
      if (e.kind !== 'payment_succeeded') {
        if (o.status === 'pending') o.status = (e.kind === 'payment_failed' ? 'failed' : 'cancelled') satisfies OrderStatus
        return
      }
      if (o.status === 'paid') return
      // As confirm_payment(): a verified success after a "failed" or "cancelled" event still makes the pass (R2).
      if (o.status !== 'pending' && o.status !== 'failed' && o.status !== 'cancelled') throw new DataError('unknown', 'order_not_pending')
      if (e.amountAgorot !== o.amountAgorot) throw new DataError('unknown', 'amount_mismatch')
      if (!o.accountId) throw new DataError('unknown', 'account_gone')
      const now = this.now()
      db.payments.push({ id: uuid(), orderId: o.id, provider: e.provider, providerPaymentId: e.providerPaymentId, amountAgorot: e.amountAgorot, createdAt: now })
      o.status = 'paid'
      o.paidAt = now
      const mine = db.passes.filter((p) => p.accountId === o.accountId).map((p) => this.passOut(db, p))
      const { startsAt, endsAt } = passDates(mine, o.ageGroup, o.months, now)
      db.passes.push({ id: uuid(), accountId: o.accountId, orderId: o.id, ageGroup: o.ageGroup, months: o.months, startsAt, endsAt, status: 'active', cancelledAt: null })
      const u = db.users.find((x) => x.id === o.accountId)
      if (u) db.outbox.push({ id: uuid(), to: u.email, template: 'purchase', lang, link: null, createdAt: now })
    })
  }

  cancelPurchase(uid: string | null, passId: string, lang: Lang) {
    const id = this.requireUser(uid)
    this.tx((db) => {
      const row = db.passes.find((p) => p.id === passId && p.accountId === id)
      if (!row) throw new DataError('not_found')
      cancelPass(db, row, this.now(), lang)
    })
  }

  requestCancellation(input: { email: string; orderRef: string; message?: string }) {
    if (!isEmail(input.email)) throw new DataError('invalid_email')
    if (!input.orderRef.trim()) throw new DataError('unknown', 'order_ref_required')
    this.tx((db) => {
      // As request_cancellation(): at most 3 an hour for one address (R6).
      const hourAgo = new Date(this.now()).getTime() - 3_600_000
      if (db.cancellationRequests.filter((r) => norm(r.email) === norm(input.email) && new Date(r.createdAt).getTime() > hourAgo).length >= 3) throw new DataError('rate_limited')
      db.cancellationRequests.push({ id: uuid(), email: input.email.trim(), orderRef: input.orderRef.trim(), message: input.message?.trim() || null, createdAt: this.now() })
    })
  }

  sendContactMessage(input: { name?: string; email: string; message: string; lang: string }) {
    if (!isEmail(input.email)) throw new DataError('invalid_email')
    const message = input.message.trim()
    if (!message || message.length > CONTACT_MESSAGE_MAX) throw new DataError('unknown', 'message_length')
    this.tx((db) => {
      // As send_contact_message(): at most 3 an hour for one address.
      const list = (db.contactMessages ??= [])
      const hourAgo = new Date(this.now()).getTime() - 3_600_000
      if (list.filter((r) => norm(r.email) === norm(input.email) && new Date(r.createdAt).getTime() > hourAgo).length >= 3) throw new DataError('rate_limited')
      list.push({ id: uuid(), name: input.name?.trim().slice(0, 100) || null, email: input.email.trim(), lang: input.lang, message, createdAt: this.now() })
    })
  }

  /** Whether any pass of this account opens content right now (used by tests). */
  hasCurrentPass(uid: string): boolean {
    return this.access(uid).passes.some((p) => isPassCurrent(p, this.now()))
  }
}

export { TERMS_VERSION }
