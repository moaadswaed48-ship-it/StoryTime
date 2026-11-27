import { beforeEach, describe, expect, it } from 'vitest'
import { LocalApi } from '@/data/local'
import { CLOCK_KEY, DB_KEY, memoryKv, type KeyValue } from '@/data/local/server'
import { testProvider } from '@/data/payments/test-provider'
import { DataError } from '@/data/errors'
import { TERMS_VERSION } from '@/data/terms'
import { EXPORT_KEYS } from './export-shape'

/**
 * The local backend keeps the same rules as the SQL after the review fixes (docs/reviews/stage4a-review.md):
 * one test per divergence the review named. The SQL side is proven in tests/db/review-fixes.test.ts.
 */
let kv: KeyValue
let api: LocalApi
const DAY = 86_400_000
const advance = (ms: number) => kv.set(CLOCK_KEY, String(Number(kv.get(CLOCK_KEY) ?? 0) + ms))
const codeOf = async (p: Promise<unknown>) => p.then(() => 'ok', (e) => (e instanceof DataError ? `${e.code}${e.message.includes(':') ? `:${e.message.split(': ')[1]}` : ''}` : String(e)))
const link = () => new URL(api.server.outbox().filter((m) => m.template === 'confirm').at(-1)!.link!).searchParams
const base = { password: 'correct horse', role: 'parent' as const, language: 'en' as const, termsVersion: TERMS_VERSION, adult: true, marketing: false }

async function newUser(email = 'parent@example.test') {
  await api.signUp({ ...base, email })
  await api.completeLink('signup', link())
}

async function buy(group: '2-3' | '4-5' | '6-8', months: 1 | 3 | 12 = 1) {
  const order = await api.createOrder({ ageGroup: group, months, provider: 'test', termsVersion: TERMS_VERSION, expectedAgorot: null })
  await testProvider.pay(api, order, 'succeeded')
  for (let i = 0; i < 20 && (await api.getOrder(order.id)).status === 'pending'; i++) await new Promise((r) => setTimeout(r, 10))
  return api.getOrder(order.id)
}

const event = (orderId: string, eventId: string, kind: 'payment_succeeded' | 'payment_failed' | 'payment_cancelled' = 'payment_succeeded') =>
  ({ provider: 'test', eventId, orderId, kind, providerPaymentId: `p-${eventId}`, amountAgorot: 0 })

beforeEach(() => {
  kv = memoryKv()
  api = new LocalApi(kv, 'http://test/', 0)
})

describe('local backend = SQL rules (review fixes)', () => {
  it('R1: sign-up and orders need the published terms version', async () => {
    expect(await codeOf(api.signUp({ ...base, email: 'v@example.test', termsVersion: 'v99' }))).toBe('terms_required')
    await newUser()
    expect(await codeOf(api.createOrder({ ageGroup: '4-5', months: 1, provider: 'test', termsVersion: 'v99', expectedAgorot: null }))).toBe('terms_required')
  })

  it('R2: a success after a cancelled event still makes the pass', async () => {
    await newUser()
    const o = await api.createOrder({ ageGroup: '4-5', months: 1, provider: 'test', termsVersion: TERMS_VERSION, expectedAgorot: null })
    api.server.handleProviderEvent(event(o.id, 'c', 'payment_cancelled'))
    expect((await api.getOrder(o.id)).status).toBe('cancelled')
    api.server.handleProviderEvent(event(o.id, 's'))
    expect((await api.getOrder(o.id)).status).toBe('paid')
    expect((await api.getAccess()).passes).toHaveLength(1)
  })

  it('R3: deleting the account and signing up again with the same email gives no second trial', async () => {
    await newUser('again@example.test')
    await api.startTrial('4-5')
    await api.deleteAccount()
    await newUser('Again@Example.test')
    expect(await codeOf(api.startTrial('4-5'))).toBe('trial_used')
    expect(kv.get(DB_KEY)).not.toMatch(/again@example\.test"[^}]*emailHash|emailHash[^}]*again@/i)
    const ledger = (JSON.parse(kv.get(DB_KEY)!) as { trialLedger: { emailHash: string }[] }).trialLedger
    expect(ledger).toHaveLength(1)
    expect(ledger[0]!.emailHash).toMatch(/^[0-9a-f]{64}$/)
    await api.signOut()
    await newUser('other@example.test')
    expect((await api.startTrial('4-5')).storyIds.length).toBeGreaterThan(0)
  })

  it('R5: only the test provider takes orders (no real provider is connected)', async () => {
    await newUser()
    expect(await codeOf(api.createOrder({ ageGroup: '4-5', months: 1, provider: 'zzz', termsVersion: TERMS_VERSION, expectedAgorot: null }))).toBe('unknown:provider_not_connected')
  })

  it('R6: a fourth cancellation request for one address within the hour is refused', async () => {
    for (let i = 0; i < 3; i++) await api.requestCancellation({ email: i ? 'a@example.test' : 'A@example.test', orderRef: 'ORDER-1' })
    expect(await codeOf(api.requestCancellation({ email: 'a@example.test', orderRef: 'ORDER-1' }))).toBe('rate_limited')
    advance(61 * 60_000)
    expect(await codeOf(api.requestCancellation({ email: 'a@example.test', orderRef: 'ORDER-1' }))).toBe('ok')
  })

  it('W3: a repeated event id naming another order is refused', async () => {
    await newUser()
    const a = await api.createOrder({ ageGroup: '4-5', months: 1, provider: 'test', termsVersion: TERMS_VERSION, expectedAgorot: null })
    const b = await api.createOrder({ ageGroup: '6-8', months: 1, provider: 'test', termsVersion: TERMS_VERSION, expectedAgorot: null })
    api.server.handleProviderEvent(event(a.id, 'same'))
    expect(() => api.server.handleProviderEvent(event(b.id, 'same'))).toThrow(/event_order_mismatch/)
    expect((await api.getOrder(b.id)).status).toBe('pending')
  })

  it('W4: cancelling a pass moves the queued pass forward', async () => {
    await newUser()
    await buy('4-5', 1)
    await buy('4-5', 3)
    const [a, b] = (await api.getAccess()).passes
    const length = new Date(b!.endsAt).getTime() - new Date(b!.startsAt).getTime()
    await api.cancelPurchase(a!.id)
    const moved = (await api.getAccess()).passes.find((p) => p.id === b!.id)!
    expect(Math.abs(new Date(moved.startsAt).getTime() - Date.now())).toBeLessThan(60_000)
    expect(new Date(moved.endsAt).getTime() - new Date(moved.startsAt).getTime()).toBe(length)
    expect((await api.getStoryContent('story-sample-45-1', 'en')).pages.length).toBeGreaterThan(0)
  })

  it('W6: "Download my data" has the same keys as the SQL export, with the email', async () => {
    await newUser()
    const data = (await api.exportMyData()) as Record<string, unknown>
    expect(Object.keys(data).filter((k) => k !== 'note').sort()).toEqual(EXPORT_KEYS)
    expect(data.email).toBe('parent@example.test')
  })

  it('W11: a sixth unpaid order within the hour is refused', async () => {
    await newUser()
    for (let i = 0; i < 5; i++) await api.createOrder({ ageGroup: '4-5', months: 1, provider: 'test', termsVersion: TERMS_VERSION, expectedAgorot: null })
    expect(await codeOf(api.createOrder({ ageGroup: '4-5', months: 1, provider: 'test', termsVersion: TERMS_VERSION, expectedAgorot: null }))).toBe('rate_limited')
  })

  it('W12: the test checkout cannot pay for another account\'s order', async () => {
    await newUser('a@example.test')
    const theirs = await api.createOrder({ ageGroup: '4-5', months: 1, provider: 'test', termsVersion: TERMS_VERSION, expectedAgorot: null })
    await api.signOut()
    await newUser('b@example.test')
    expect(await codeOf(api.sendTestProviderEvent(event(theirs.id, 'x')))).toBe('not_found')
    await new Promise((r) => setTimeout(r, 20))
    await api.signOut()
    await api.signIn('a@example.test', 'correct horse')
    expect((await api.getOrder(theirs.id)).status).toBe('pending')
  })
})
