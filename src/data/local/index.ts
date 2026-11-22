import type { Lang } from '@/i18n/config'
import type { DataApi, LinkKind, ProviderEvent, SignUpInput } from '../api'
import { DataError } from '../errors'
import type { Session } from '../types'
import { browserKv, LocalServer, type KeyValue } from './server'

export const SESSION_KEY = 'storytime.local.session'

/**
 * The local backend's client side: keeps the session and calls the local server with the signed-in user's id,
 * the way supabase-js sends the user's token. Rules are enforced in LocalServer, not here.
 */
export class LocalApi implements DataApi {
  readonly kind = 'local' as const
  readonly server: LocalServer
  private listeners = new Set<(s: Session | null) => void>()

  /** `linkBase` is where email links point: origin + base path, ending in "/". */
  /** `latencyMs` imitates a network round trip (so loading states are real); tests pass 0. */
  constructor(
    private readonly kv: KeyValue = browserKv(),
    private readonly linkBase = defaultLinkBase(),
    private readonly latencyMs = 120,
  ) {
    this.server = new LocalServer(kv)
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === SESSION_KEY) this.emit()
      })
    }
  }

  private session(): Session | null {
    const raw = this.kv.get(SESSION_KEY)
    if (!raw) return null
    try {
      const s = JSON.parse(raw) as Session
      // A session whose account was deleted (here or in another tab) is dead.
      return s && this.server.userExists(s.userId) ? s : null
    } catch {
      return null
    }
  }

  private setSession(s: Session | null) {
    if (s) this.kv.set(SESSION_KEY, JSON.stringify(s))
    else this.kv.remove(SESSION_KEY)
    this.emit()
  }

  private emit() {
    const s = this.session()
    for (const l of this.listeners) l(s)
  }

  private uid(): string {
    const s = this.session()
    if (!s) throw new DataError('not_signed_in')
    return s.userId
  }

  private tick = () => new Promise<void>((r) => setTimeout(r, this.latencyMs))

  private async run<T>(fn: () => T | Promise<T>): Promise<T> {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new DataError('network')
    await this.tick()
    return fn()
  }

  async getSession() {
    return this.session()
  }

  onSessionChange(listener: (s: Session | null) => void) {
    this.listeners.add(listener)
    return () => void this.listeners.delete(listener)
  }

  signUp(input: SignUpInput) {
    return this.run(() => this.server.signUp(input, this.linkBase))
  }

  resendConfirmation(email: string, language: Lang) {
    return this.run(() => this.server.resendConfirmation(email, language, this.linkBase))
  }

  completeLink(kind: LinkKind, params: URLSearchParams) {
    return this.run(() => {
      const s = this.server.completeLink(kind, params.get('token'))
      this.setSession(s)
      return s
    })
  }

  signIn(email: string, password: string) {
    return this.run(async () => {
      const s = await this.server.signIn(email, password)
      this.setSession(s)
      return s
    })
  }

  async signOut() {
    this.setSession(null)
  }

  requestPasswordReset(email: string, language: Lang) {
    return this.run(() => this.server.requestPasswordReset(email, language, this.linkBase))
  }

  setPassword(password: string) {
    return this.run(() => this.server.setPassword(this.uid(), password))
  }

  getAccount() {
    return this.run(() => this.server.getAccount(this.uid()))
  }

  updateAccount(patch: { language?: Lang; storyLanguage?: Lang; onboarded?: true }) {
    return this.run(() => this.server.updateAccount(this.uid(), patch))
  }

  setRole(role: 'parent' | 'teacher') {
    return this.run(() => this.server.setRole(this.uid(), role))
  }

  setMarketing(optIn: boolean) {
    return this.run(() => this.server.setMarketing(this.uid(), optIn))
  }

  listLearners() {
    return this.run(() => this.server.listLearners(this.uid()))
  }

  addLearner(input: Parameters<DataApi['addLearner']>[0]) {
    return this.run(() => this.server.addLearner(this.uid(), input))
  }

  updateLearner(id: string, patch: Parameters<DataApi['updateLearner']>[1]) {
    return this.run(() => this.server.updateLearner(this.uid(), id, patch))
  }

  removeLearner(id: string) {
    return this.run(() => this.server.removeLearner(this.uid(), id))
  }

  exportMyData() {
    return this.run(() => this.server.exportMyData(this.uid()))
  }

  deleteAccount() {
    return this.run(() => {
      const uid = this.uid()
      this.server.deleteAccount(uid, this.server.getAccount(uid).language)
      this.setSession(null)
    })
  }

  listStories(lang: Lang, ageGroup?: Parameters<DataApi['listStories']>[1]) {
    return this.run(() => this.server.listStories(this.uid(), lang, ageGroup))
  }

  getStoryContent(id: string, lang: Lang) {
    return this.run(() => this.server.getStoryContent(this.uid(), id, lang))
  }

  getAccess() {
    return this.run(() => this.server.access(this.uid()))
  }

  startTrial(ageGroup: Parameters<DataApi['startTrial']>[0]) {
    return this.run(() => this.server.startTrial(this.uid(), ageGroup))
  }

  listProgress(learnerId: string) {
    return this.run(() => this.server.listProgress(this.uid(), learnerId))
  }

  saveProgress(learnerId: string, storyId: string, patch: Parameters<DataApi['saveProgress']>[2]) {
    return this.run(() => this.server.saveProgress(this.uid(), learnerId, storyId, patch))
  }

  listPrices() {
    return this.run(() => this.server.listPrices())
  }

  createOrder(input: Parameters<DataApi['createOrder']>[0]) {
    return this.run(() => this.server.createOrder(this.uid(), input))
  }

  getOrder(id: string) {
    return this.run(() => this.server.getOrder(this.uid(), id))
  }

  listOrders() {
    return this.run(() => this.server.listOrders(this.uid()))
  }

  /** Stands in for the provider's server-to-server callback (in Supabase: the payment-callback edge function). */
  sendTestProviderEvent(event: ProviderEvent) {
    if (event.provider !== 'test') return Promise.reject(new DataError('unknown', 'only the test provider calls from the browser'))
    return this.run(() => {
      // A short delay, as with a real callback that arrives after the browser has returned.
      setTimeout(() => {
        try {
          const lang = this.session() ? this.server.getAccount(this.session()!.userId).language : 'en'
          this.server.handleProviderEvent(event, lang)
        } catch {
          /* the return page shows the order's state */
        }
      }, this.latencyMs * 3)
    })
  }

  cancelPurchase(passId: string) {
    return this.run(() => {
      const uid = this.uid()
      this.server.cancelPurchase(uid, passId, this.server.getAccount(uid).language)
    })
  }

  requestCancellation(input: Parameters<DataApi['requestCancellation']>[0]) {
    return this.run(() => this.server.requestCancellation(input))
  }
}

function defaultLinkBase(): string {
  if (typeof location === 'undefined') return 'http://localhost/'
  return `${location.origin}${import.meta.env.BASE_URL ?? '/'}`
}
