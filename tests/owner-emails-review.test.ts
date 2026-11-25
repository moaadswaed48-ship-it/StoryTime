import { beforeEach, describe, expect, it } from 'vitest'
import { DB_KEY, memoryKv } from '@/data/local/server'
import { OwnerError } from '@/features/owner/data/api'
import { memoryBlobs } from '@/features/owner/data/blobs'
import { LocalOwnerServer } from '@/features/owner/data/local'
import { checkUpload, sniffMime } from '@/features/owner/data/rules'
import { SupabaseOwnerApi } from '@/features/owner/data/supabase'
import type { OwnerStory, StoryDraft } from '@/features/owner/data/types'
import { renderEmail } from '@/emails/render'
import { sampleParams } from '@/emails/samples'
import { queuedEmail } from '@/emails/schedule'
import { unsubscribeUrl, verifyUnsubscribe } from '@/emails/unsubscribe'
import { verifySvix } from '@/emails/webhook-verify'
import { LANGS } from '@/i18n/config'

/**
 * Fixes from the fresh review of Stage 4 part B2 (docs/reviews/stage4b2-review.md, "Fixes"): the browser-side and
 * email halves. The database halves are in tests/db/owner-emails-review.test.ts. Each test failed before its fix.
 */
const OWNER = 'owner-1'
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0])
const own = { source: 'upload' as const, licence: 'own work', credit: null }
const draftOf = (s: OwnerStory): StoryDraft => JSON.parse(JSON.stringify({ groups: s.groups, pages: s.pages, texts: s.texts, films: s.films, activity: s.activity }))
const codeOf = (fn: () => unknown) => {
  try {
    fn()
    return null
  } catch (e) {
    return (e as OwnerError).code
  }
}

let srv: LocalOwnerServer
beforeEach(() => {
  const kv = memoryKv()
  kv.set(DB_KEY, JSON.stringify({ version: 1, users: [{ id: OWNER, email: 'o@x.test', createdAt: new Date().toISOString() }], profiles: { [OWNER]: { role: 'owner' } } }))
  srv = new LocalOwnerServer(kv, memoryBlobs())
})

async function published(): Promise<OwnerStory> {
  const s = srv.createStory(OWNER)
  const pic = await srv.upload(OWNER, new File([PNG as BlobPart], 'p.png'), { purpose: 'page', ...own })
  const d = draftOf(s)
  d.groups = [{ group: '4-5', trial: false }]
  d.pages[0]!.pictureId = pic.id
  for (const l of LANGS) {
    d.texts[l].title = `Title ${l}`
    d.texts[l].pages[d.pages[0]!.key] = { text: `Words ${l}`, speech: '' }
  }
  srv.saveStory(OWNER, s.id, d)
  for (const l of LANGS) srv.signOff(OWNER, s.id, l)
  return srv.publish(OWNER, s.id, null)
}

describe('B2: a published story stays complete (local store)', () => {
  it('refuses a save that empties a published language, removes a picture or the age group', async () => {
    const s = await published()
    const key = s.pages[0]!.key
    const noDanish = draftOf(s)
    noDanish.texts.da.pages[key] = { text: '', speech: '' }
    expect(codeOf(() => srv.saveStory(OWNER, s.id, noDanish))).toBe('published_incomplete')
    const noPicture = draftOf(s)
    noPicture.pages[0]!.pictureId = null
    expect(codeOf(() => srv.saveStory(OWNER, s.id, noPicture))).toBe('published_incomplete')
    expect(codeOf(() => srv.saveStory(OWNER, s.id, { ...draftOf(s), groups: [] }))).toBe('published_incomplete')
    expect(srv.getStory(OWNER, s.id).texts.da.pages[key]!.text).toBe('Words da')
    const teaser = draftOf(s)
    teaser.texts.en.teaser = 'A short line'
    expect(srv.saveStory(OWNER, s.id, teaser).texts.en.teaser).toBe('A short line')
  })
})

describe('uploads: a picture is not a film', () => {
  it('refuses HEIC and AVIF pictures renamed .mp4 (same ftyp box as MP4)', () => {
    const box = (brand: string) => new Uint8Array([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, ...[...brand].map((c) => c.charCodeAt(0))])
    expect(sniffMime(box('heic'), 'x.mp4')).toBeNull()
    expect(sniffMime(box('avif'), 'x.mp4')).toBeNull()
    expect(sniffMime(box('mif1'), 'x.mp4')).toBeNull()
    expect(sniffMime(box('isom'), 'x.mp4')).toBe('video/mp4')
    expect(checkUpload('film', { name: 'photo.mp4', size: 1000, head: box('heic') }, own)).toEqual({ ok: false, reason: 'content' })
  })
})

describe('Supabase owner data layer', () => {
  it('refuses a story id that is not an id before it reaches the audit filter', async () => {
    const api = new SupabaseOwnerApi({ from: () => { throw new Error('must not query') } } as never)
    await expect(api.listAudit('x,target_table.neq.none')).rejects.toMatchObject({ code: 'not_found' })
  })
})

describe('unsubscribe links need a real secret', () => {
  it('an empty or short secret signs nothing and verifies nothing', async () => {
    const base = 'https://x.example.test/functions/v1/email-unsubscribe'
    await expect(unsubscribeUrl(base, '', 'acc-1', 'en')).rejects.toThrow(/unsubscribe_secret_missing/)
    await expect(unsubscribeUrl(base, 'short', 'acc-1', 'en')).rejects.toThrow(/unsubscribe_secret_missing/)
    // A link someone signed with an empty key is refused, not accepted.
    const { createHmac } = await import('node:crypto')
    const forged = createHmac('sha256', 'x').update('unsubscribe:acc-1').digest('base64url')
    expect(await verifyUnsubscribe(`${base}?a=acc-1&l=en&s=${forged}`, '')).toBeNull()
  })
})

describe('bounce webhook needs its secret', () => {
  it('refuses every message while RESEND_WEBHOOK_SECRET is empty', async () => {
    const ts = '1700000000'
    const h = { id: 'msg_1', timestamp: ts, signature: 'v1,AAAA' }
    await expect(verifySvix('', h, '{}', 1700000001)).resolves.toBe(false)
    await expect(verifySvix('whsec_', h, '{}', 1700000001)).resolves.toBe(false)
  })
})

describe('purchase confirmation', () => {
  it('names no unconfirmed receipt process, and shows the real cancellation contact once the owner gives it', async () => {
    for (const lang of LANGS) {
      const e = await renderEmail('purchase_confirmation', lang, sampleParams(lang).purchase_confirmation)
      expect(e.text).not.toMatch(/separate email from the payment company|رسالة منفصلة من شركة الدفع|בהודעה נפרדת מחברת התשלומים|separat e-mail fra betalingsfirmaet/)
    }
    const real = await renderEmail('purchase_confirmation', 'en', sampleParams('en').purchase_confirmation, { business: 'Example business, 000000000, Example street 1', supportEmail: 'help@example.test' })
    const how = real.text.split('\n').find((l) => l.startsWith('How to cancel'))!
    expect(how).toContain('help@example.test')
    expect(how).toContain('Example street 1')
  })
})

describe('B3: the account-deleted email from the queue', () => {
  const row = { id: 'r1', to_email: 'Leaving@Example.test', template: 'account_deleted', lang: 'he', created_at: '2026-11-22T10:00:00Z' }
  it('is built in the account language with the deletion time, and renders', async () => {
    const q = queuedEmail(row, new Set())!
    expect(q).toEqual({ template: 'account_deleted', lang: 'he', to: 'leaving@example.test', params: { deletedAt: '2026-11-22T10:00:00Z' }, idempotencyKey: 'queued:r1' })
    const e = await renderEmail(q.template, q.lang, q.params)
    expect(e.html).toContain('dir="rtl"')
    expect(e.text).toContain('2026')
  })
  it('is not sent to a suppressed address or for an unknown template', () => {
    expect(queuedEmail(row, new Set(['leaving@example.test']))).toBeNull()
    expect(queuedEmail({ ...row, template: 'new_story' }, new Set())).toBeNull()
  })
})
