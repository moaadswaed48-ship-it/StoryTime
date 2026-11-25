import { mkdtempSync, readdirSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { LANGS } from '@/i18n/config'
import { COPY, renderEmail } from '@/emails/render'
import { sampleParams } from '@/emails/samples'
import { memoryTransport, resendRequest, resendTransport, SendError } from '@/emails/send'
import { previewTransport } from '@/emails/preview-transport'
import { TEMPLATES, isMarketing, type TemplateId } from '@/emails/types'
import { unsubscribeUrl, verifyUnsubscribe } from '@/emails/unsubscribe'
import { emailDate } from '@/emails/format'

/** Every template in every language renders completely, in the right direction, with the legal markings. */
describe('every email in four languages', () => {
  for (const lang of LANGS) {
    for (const template of TEMPLATES) {
      it(`${template} (${lang})`, async () => {
        const params = sampleParams(lang)[template]
        const e = await renderEmail(template, lang, params as never)
        for (const [part, s] of Object.entries({ subject: e.subject, preview: e.preview, html: e.html, text: e.text })) {
          // A {placeholder} left in the output means a missing value or a misspelt key.
          expect(s, `${part} has an unfilled placeholder`).not.toMatch(/\{[a-zA-Z]+\}/)
          expect(s.trim().length, `${part} is empty`).toBeGreaterThan(0)
        }
        expect(e.html).toContain(`lang="${lang}"`)
        expect(e.html).toContain(`dir="${lang === 'ar' || lang === 'he' ? 'rtl' : 'ltr'}"`)
        expect(e.html).not.toMatch(/<img\b/i) // no images, so no tracking pixel
        expect(e.html.length).toBeLessThan(100_000) // Gmail clips at about 102 KB
        expect(e.text).toContain(COPY[lang].templates[template].heading.replace(/\{.*$/, '').trim().slice(0, 8))
        if (isMarketing(template)) {
          expect(e.subject.startsWith('פרסומת')).toBe(true)
          expect(e.html).toContain(COPY[lang].common.unsubscribe)
        } else {
          expect(e.subject).not.toContain('פרסומת')
          expect(e.html).toContain(COPY[lang].common.footerService.slice(0, 20))
        }
      })
    }
  }

  it('shows the price and business placeholders, never a made-up price', async () => {
    const e = await renderEmail('purchase_confirmation', 'en', sampleParams('en').purchase_confirmation)
    expect(e.html).toContain('Price not set yet')
    expect(e.html).toContain('Business name, ID number and address: to be added before sales open.')
    expect(e.html).not.toMatch(/₪\s?\d/)
    const real = await renderEmail('purchase_confirmation', 'he', { ...sampleParams('he').purchase_confirmation, amountAgorot: 4990 }, { business: 'Example business, 000000000, Example street 1', supportEmail: 'help@example.test' })
    expect(real.html).toContain('49.90')
    expect(real.html).toContain('Example business')
  })

  it('writes dates in Israel time, whatever the server clock', () => {
    // 21:30 UTC on 31 December is already 1 January in Israel (UTC+2 in winter).
    expect(emailDate('2026-12-31T22:30:00Z', 'en', true)).toContain('1 January 2027')
    expect(emailDate('2026-12-31T22:30:00Z', 'en', true)).toContain('00:30')
    // Summer time (UTC+3).
    expect(emailDate('2026-07-01T21:30:00Z', 'en', true)).toContain('00:30')
    expect(emailDate('2026-07-01T21:30:00Z', 'ar', false)).toMatch(/2026/) // Western digits in Arabic
  })

  it('keeps the four languages the same shape', () => {
    const keys = (o: object): string[] => Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' && !Array.isArray(v) ? keys(v).map((x) => `${k}.${x}`) : [k]))
    for (const lang of LANGS) expect(keys(COPY[lang]).sort()).toEqual(keys(COPY.en).sort())
    for (const t of TEMPLATES) for (const lang of LANGS) expect(COPY[lang].templates[t].body.length, `${t} ${lang}`).toBe(COPY.en.templates[t].body.length)
  })
})

describe('sending', () => {
  it('the preview transport writes the email to disk and sends nothing', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'st-mail-'))
    const tr = previewTransport(dir)
    const e = await renderEmail('trial_ends_tomorrow', 'ar', sampleParams('ar').trial_ends_tomorrow)
    await tr.send({ ...e, to: 'parent@example.test' })
    const files = readdirSync(dir).sort()
    expect(files).toEqual(['001-trial_ends_tomorrow-ar.html', '001-trial_ends_tomorrow-ar.json', '001-trial_ends_tomorrow-ar.txt'])
    expect(readFileSync(join(dir, files[0]!), 'utf8')).toContain('dir="rtl"')
  })

  it('builds the Resend request with reply-to, text and, for news, one-click unsubscribe headers', async () => {
    const news = await renderEmail('new_story', 'he', sampleParams('he').new_story)
    expect(() => resendRequest({ from: 'StoryTime <a@example.test>', replyTo: 'r@example.test' }, { ...news, to: 'x@example.test' })).toThrow(SendError)
    const req = resendRequest({ from: 'StoryTime <a@example.test>', replyTo: 'r@example.test' }, { ...news, to: 'x@example.test', unsubscribeUrl: 'https://u.example.test/x' })
    expect(req.headers).toEqual({ 'List-Unsubscribe': '<https://u.example.test/x>', 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' })
    expect(req.reply_to).toBe('r@example.test')
    expect(req.text.length).toBeGreaterThan(20)
    const service = resendRequest({ from: 'f', replyTo: 'r' }, { ...(await renderEmail('pass_ended', 'en', sampleParams('en').pass_ended)), to: 'x@example.test' })
    expect(service.headers).toEqual({})
  })

  it('posts to Resend with the key and an idempotency key, and reports a refusal', async () => {
    const calls: { url: string; init: RequestInit }[] = []
    const ok = resendTransport({ apiKey: 're_test', from: 'f', replyTo: 'r', fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init })
      return new Response(JSON.stringify({ id: 'abc' }), { status: 200 })
    }) as typeof fetch })
    const e = await renderEmail('pass_ended', 'da', sampleParams('da').pass_ended)
    expect(await ok.send({ ...e, to: 'x@example.test', idempotencyKey: 'pass_ended:p1' })).toEqual({ id: 'abc', transport: 'resend' })
    expect(calls[0]!.url).toBe('https://api.resend.com/emails')
    const h = calls[0]!.init.headers as Record<string, string>
    expect(h.Authorization).toBe('Bearer re_test')
    expect(h['Idempotency-Key']).toBe('pass_ended:p1')
    const bad = resendTransport({ apiKey: 'x', from: 'f', replyTo: 'r', fetch: (async () => new Response(JSON.stringify({ message: 'domain not verified' }), { status: 403 })) as unknown as typeof fetch })
    await expect(bad.send({ ...e, to: 'x@example.test' })).rejects.toMatchObject({ status: 403 })
    const mem = memoryTransport()
    await mem.send({ ...e, to: 'y@example.test' })
    expect(mem.sent).toHaveLength(1)
  })
})

describe('unsubscribe links', () => {
  it('verify their signature and refuse a changed account id', async () => {
    const secret = 'secret-1-a-long-random-test-value-0123456789'
    const url = await unsubscribeUrl('https://x.example.test/functions/v1/email-unsubscribe', secret, 'acc-1', 'he')
    expect(await verifyUnsubscribe(url, secret)).toEqual({ accountId: 'acc-1', lang: 'he' })
    expect(await verifyUnsubscribe(url, 'other-secret-also-long-enough-0123456789')).toBeNull()
    expect(await verifyUnsubscribe(url.replace('acc-1', 'acc-2'), secret)).toBeNull()
  })
})

// Keep the list of templates in step with the product checklist's MUST emails that this builder owns.
const MUST: TemplateId[] = ['confirm_email', 'welcome_parent', 'welcome_teacher', 'trial_started', 'trial_ends_tomorrow', 'trial_ended', 'purchase_confirmation', 'pass_started', 'pass_ends_7d', 'pass_ends_1d', 'pass_ended', 'password_reset', 'email_change_confirm', 'email_changed', 'account_deleted', 'cancellation_received', 'refund_issued', 'contact_reply', 'new_story']
it('has a template for every email in the checklist', () => expect([...TEMPLATES].sort()).toEqual([...MUST].sort()))

describe('webhook signatures (Resend via Svix)', () => {
  it('accept a correct signature and refuse a wrong, old or missing one', async () => {
    const { createHmac } = await import('node:crypto')
    const { verifySvix } = await import('@/emails/webhook-verify')
    const raw = Buffer.from('a test signing key 123').toString('base64')
    const secret = `whsec_${raw}`
    const body = '{"type":"email.bounced"}'
    const ts = '1700000000'
    const sig = createHmac('sha256', Buffer.from(raw, 'base64')).update(`msg_1.${ts}.${body}`).digest('base64')
    const h = { id: 'msg_1', timestamp: ts, signature: `v1,wrong v1,${sig}` }
    expect(await verifySvix(secret, h, body, 1700000010)).toBe(true)
    expect(await verifySvix(secret, h, `${body} `, 1700000010)).toBe(false)
    expect(await verifySvix(secret, h, body, 1700000000 + 3600)).toBe(false)
    expect(await verifySvix(secret, { ...h, signature: null }, body, 1700000010)).toBe(false)
  })
})
