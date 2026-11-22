import { beforeEach, describe, expect, it } from 'vitest'
import { LocalApi } from '@/data/local'
import { CLOCK_KEY, memoryKv, type KeyValue } from '@/data/local/server'
import { testProvider } from '@/data/payments/test-provider'
import { DataError } from '@/data/errors'
import { TERMS_VERSION } from '@/data/terms'

/** The local backend end to end, in memory: the same flows the screens use. */
let kv: KeyValue
let api: LocalApi
const DAY = 86_400_000
const advance = (ms: number) => kv.set(CLOCK_KEY, String(Number(kv.get(CLOCK_KEY) ?? 0) + ms))
const codeOf = async (p: Promise<unknown>) => p.then(() => 'ok', (e) => (e instanceof DataError ? e.code : String(e)))
const link = (kind: 'confirm' | 'reset') => new URL(api.server.outbox().filter((m) => m.template === kind).at(-1)!.link!).searchParams

async function newConfirmedUser(email = 'parent@example.test', role: 'parent' | 'teacher' = 'parent') {
  await api.signUp({ email, password: 'correct horse', role, language: 'en', termsVersion: TERMS_VERSION, adult: true, marketing: false })
  await api.completeLink('signup', link('confirm'))
}

/** Pays for a pass through the test provider and waits for the server callback, as the return page does. */
async function buy(group: '2-3' | '4-5' | '6-8', months: 1 | 3 | 12 = 1) {
  const order = await api.createOrder({ ageGroup: group, months, provider: 'test', termsVersion: TERMS_VERSION })
  await testProvider.pay(api, order, 'succeeded')
  for (let i = 0; i < 20 && (await api.getOrder(order.id)).status === 'pending'; i++) await new Promise((r) => setTimeout(r, 10))
  return api.getOrder(order.id)
}

beforeEach(() => {
  kv = memoryKv()
  api = new LocalApi(kv, 'http://test/', 0)
})

describe('sign-up, confirmation and sign-in', () => {
  it('signs up unconfirmed, records consents, and confirms through the emailed link', async () => {
    await api.signUp({ email: 'A@Example.test', password: 'correct horse', role: 'teacher', language: 'ar', termsVersion: TERMS_VERSION, adult: true, marketing: false })
    expect(await api.getSession()).toBeNull()
    expect(await codeOf(api.signIn('a@example.test', 'correct horse'))).toBe('email_unconfirmed')
    const s = await api.completeLink('signup', link('confirm'))
    expect(s.email).toBe('a@example.test')
    const a = await api.getAccount()
    expect(a).toMatchObject({ role: 'teacher', language: 'ar', marketingOptIn: false, onboardedAt: null })
    const data = (await api.exportMyData()) as { consents: { kind: string; termsVersion: string | null; granted: boolean }[] }
    expect(data.consents.map((c) => [c.kind, c.granted, c.termsVersion])).toEqual([['terms', true, TERMS_VERSION], ['adult', true, null], ['marketing', false, null]])
  })

  it('explains every sign-up and sign-in failure', async () => {
    const base = { password: 'correct horse', role: 'parent' as const, language: 'en' as const, termsVersion: TERMS_VERSION, adult: true, marketing: false }
    expect(await codeOf(api.signUp({ ...base, email: 'not-an-email' }))).toBe('invalid_email')
    expect(await codeOf(api.signUp({ ...base, email: 'x@example.test', password: 'short' }))).toBe('weak_password')
    expect(await codeOf(api.signUp({ ...base, email: 'x@example.test', adult: false }))).toBe('terms_required')
    await newConfirmedUser('taken@example.test')
    await api.signOut()
    expect(await codeOf(api.signUp({ ...base, email: 'taken@example.test' }))).toBe('email_taken')
    expect(await codeOf(api.signIn('taken@example.test', 'wrong password'))).toBe('wrong_credentials')
    expect(await codeOf(api.signIn('nobody@example.test', 'correct horse'))).toBe('wrong_credentials')
    for (let i = 0; i < 9; i++) await codeOf(api.signIn('taken@example.test', 'wrong'))
    expect(await codeOf(api.signIn('taken@example.test', 'correct horse'))).toBe('rate_limited')
  })

  it('links work once and expire; resending waits a minute', async () => {
    await api.signUp({ email: 'l@example.test', password: 'correct horse', role: 'parent', language: 'en', termsVersion: TERMS_VERSION, adult: true, marketing: false })
    expect(await codeOf(api.resendConfirmation('l@example.test', 'en'))).toBe('rate_limited')
    const first = link('confirm')
    advance(25 * 3_600_000)
    expect(await codeOf(api.completeLink('signup', first))).toBe('link_expired')
    await api.resendConfirmation('l@example.test', 'en')
    const second = link('confirm')
    await api.completeLink('signup', second)
    expect(await codeOf(api.completeLink('signup', second))).toBe('link_expired')
    expect(await codeOf(api.completeLink('signup', new URLSearchParams('token=bogus')))).toBe('link_expired')
  })

  it('resets a forgotten password without saying whether the email exists', async () => {
    await newConfirmedUser()
    await api.signOut()
    await api.requestPasswordReset('nobody@example.test', 'en') // no error, no email
    await api.requestPasswordReset('parent@example.test', 'en')
    await api.completeLink('recovery', link('reset'))
    await api.setPassword('a new long password')
    await api.signOut()
    expect(await codeOf(api.signIn('parent@example.test', 'correct horse'))).toBe('wrong_credentials')
    expect((await api.signIn('parent@example.test', 'a new long password')).email).toBe('parent@example.test')
  })
})

describe('profiles', () => {
  it('a parent keeps child profiles, a teacher keeps classes, at most 5', async () => {
    await newConfirmedUser()
    expect((await api.addLearner({ name: ' Noor ', ageGroup: '4-5' })).kind).toBe('child')
    for (let i = 0; i < 4; i++) await api.addLearner({ name: `C${i}`, ageGroup: '2-3' })
    expect(await codeOf(api.addLearner({ name: 'Six', ageGroup: '2-3' }))).toBe('profile_limit')
    expect(await codeOf(api.setRole('teacher'))).toBe('role_locked')
    await api.signOut()
    await newConfirmedUser('t@example.test', 'teacher')
    expect((await api.addLearner({ name: 'Sunflowers', ageGroup: '4-5' })).kind).toBe('class')
  })
})

describe('trial and passes', () => {
  it('signed out sees nothing; signed in without trial sees covers but no content', async () => {
    expect(await codeOf(api.listStories('en'))).toBe('not_signed_in')
    await newConfirmedUser()
    const list = await api.listStories('en', '4-5')
    expect(list.map((s) => s.slug)).toEqual(['sample-45-1', 'sample-45-2', 'sample-45-3', 'sample-68-1'])
    expect(list.every((s) => s.isSample)).toBe(true)
    expect(await codeOf(api.getStoryContent(list[0]!.id, 'en'))).toBe('locked')
  })

  it('the trial opens 3 stories for 3 days, once per account, then locks; profiles stay', async () => {
    await newConfirmedUser()
    await api.addLearner({ name: 'Noor', ageGroup: '4-5' })
    const t = await api.startTrial('4-5')
    expect(t.storyIds).toEqual(['story-sample-45-1', 'story-sample-45-2', 'story-sample-45-3'])
    expect((await api.getStoryContent('story-sample-45-1', 'ar')).pages[0]!.display).toMatch(/صفحة تجريبية/)
    expect(await codeOf(api.getStoryContent('story-sample-68-1', 'en'))).toBe('locked') // listed in 4-5 but not a trial story
    expect(await codeOf(api.startTrial('6-8'))).toBe('trial_used')
    advance(3 * DAY)
    expect(await codeOf(api.getStoryContent('story-sample-45-1', 'en'))).toBe('locked')
    expect((await api.listLearners()).map((l) => l.name)).toEqual(['Noor'])
  })

  it('a pass is created only by the server callback, opens its group (and shared stories), and expires', async () => {
    await newConfirmedUser()
    const order = await api.createOrder({ ageGroup: '6-8', months: 1, provider: 'test', termsVersion: TERMS_VERSION })
    expect(order).toMatchObject({ status: 'pending', amountAgorot: 0, priceWasPlaceholder: true })
    expect((await api.getAccess()).passes).toEqual([]) // returning from the provider page alone unlocks nothing
    expect(await codeOf(api.createOrder({ ageGroup: '6-8', months: 1, provider: 'cardcom', termsVersion: TERMS_VERSION }))).toBe('price_not_set')
    const paid = await buy('6-8')
    expect(paid.status).toBe('paid')
    expect((await api.getStoryContent('story-sample-68-2', 'en')).pages).toHaveLength(2)
    expect((await api.getStoryContent('story-sample-45-3', 'en')).pages).toHaveLength(2) // 4-5 story also listed in 6-8
    expect(await codeOf(api.getStoryContent('story-sample-45-1', 'en'))).toBe('locked') // wrong age group
    advance(32 * DAY)
    expect(await codeOf(api.getStoryContent('story-sample-68-2', 'en'))).toBe('locked')
  })

  it('a repeated callback counts once; a failed payment unlocks nothing', async () => {
    await newConfirmedUser()
    const order = await api.createOrder({ ageGroup: '2-3', months: 3, provider: 'test', termsVersion: TERMS_VERSION })
    const event = { provider: 'test', eventId: 'same', orderId: order.id, kind: 'payment_succeeded' as const, providerPaymentId: 'p', amountAgorot: 0 }
    api.server.handleProviderEvent(event)
    api.server.handleProviderEvent(event)
    expect((await api.getAccess()).passes).toHaveLength(1)
    const failing = await api.createOrder({ ageGroup: '4-5', months: 1, provider: 'test', termsVersion: TERMS_VERSION })
    api.server.handleProviderEvent({ ...event, eventId: 'fail', orderId: failing.id, kind: 'payment_failed' })
    expect((await api.getOrder(failing.id)).status).toBe('failed')
    expect((await api.getAccess()).passes).toHaveLength(1)
  })

  it('a second pass for the same group queues; cancelling within 14 days ends access', async () => {
    await newConfirmedUser()
    await buy('4-5', 1)
    await buy('4-5', 3)
    const [a, b] = (await api.getAccess()).passes
    expect(b!.startsAt).toBe(a!.endsAt)
    await api.cancelPurchase(a!.id)
    expect(await codeOf(api.getStoryContent('story-sample-45-1', 'en'))).toBe('locked')
    advance(15 * DAY)
    expect(await codeOf(api.cancelPurchase(b!.id))).toBe('cancel_window_closed')
  })
})

describe('account rights', () => {
  it('deleting the account signs out and frees the email; orders stay without a name', async () => {
    await newConfirmedUser()
    await buy('4-5')
    await api.deleteAccount()
    expect(await api.getSession()).toBeNull()
    expect(await codeOf(api.signIn('parent@example.test', 'correct horse'))).toBe('wrong_credentials')
    await newConfirmedUser()
    expect((await api.getAccess()).passes).toEqual([])
  })

  it('the public cancellation form needs a valid email and order number', async () => {
    expect(await codeOf(api.requestCancellation({ email: 'bad', orderRef: 'X' }))).toBe('invalid_email')
    expect(await codeOf(api.requestCancellation({ email: 'a@example.test', orderRef: 'ORDER-1' }))).toBe('ok')
  })
})
