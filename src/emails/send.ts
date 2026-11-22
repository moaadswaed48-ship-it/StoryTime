import type { RenderedEmail, TemplateId } from './types'
import { isMarketing } from './types'

/**
 * Sending, behind one small interface. Two transports:
 *   preview  writes each email to disk and sends nothing (./preview-transport.ts, Node only); the gallery at
 *            /lab/emails shows the same templates. Used until a sending account exists.
 *   resend   Resend's HTTP API (POST https://api.resend.com/emails), with fetch only, so the same code runs in
 *            Node and in a Supabase edge function (Deno). NOT RUN: no sending account or verified domain yet.
 * Rules every email follows (product checklist 24): sender name "StoryTime", a real reply-to, an HTML and a
 * plain-text version, no tracking. Marketing adds the one-click unsubscribe headers (RFC 8058).
 */
export type OutgoingEmail = RenderedEmail & {
  to: string
  /** Marketing only: the one-click unsubscribe link (also shown in the email itself). */
  unsubscribeUrl?: string
  /** Makes a retry of the same email safe: the sending service drops a repeat with the same key. */
  idempotencyKey?: string
}

export type SendResult = { id: string; transport: string }

export interface EmailTransport {
  readonly name: string
  send(email: OutgoingEmail): Promise<SendResult>
}

export type ResendConfig = {
  apiKey: string
  /** e.g. 'StoryTime <hello@your-domain>' on a domain verified in Resend. */
  from: string
  replyTo: string
  fetch?: typeof fetch
}

export class SendError extends Error {
  constructor(readonly status: number, message: string) {
    super(message)
    this.name = 'SendError'
  }
}

/** The request Resend receives. Exported so the tests can check it without sending anything. */
export function resendRequest(cfg: Pick<ResendConfig, 'from' | 'replyTo'>, e: OutgoingEmail) {
  const headers: Record<string, string> = {}
  if (isMarketing(e.template)) {
    if (!e.unsubscribeUrl) throw new SendError(0, 'marketing email without an unsubscribe link')
    headers['List-Unsubscribe'] = `<${e.unsubscribeUrl}>`
    headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click'
  }
  return {
    from: cfg.from,
    to: [e.to],
    reply_to: cfg.replyTo,
    subject: e.subject,
    html: e.html,
    text: e.text,
    headers,
    // Letters, digits, _ and - only (Resend's rule for tags).
    tags: [{ name: 'template', value: e.template }, { name: 'lang', value: e.lang }],
  }
}

export function resendTransport(cfg: ResendConfig): EmailTransport {
  const f = cfg.fetch ?? fetch
  return {
    name: 'resend',
    async send(e) {
      const res = await f('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cfg.apiKey}`,
          'Content-Type': 'application/json',
          ...(e.idempotencyKey ? { 'Idempotency-Key': e.idempotencyKey.slice(0, 256) } : {}),
        },
        body: JSON.stringify(resendRequest(cfg, e)),
      })
      const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string }
      if (!res.ok || !body.id) throw new SendError(res.status, body.message ?? `resend responded ${res.status}`)
      return { id: body.id, transport: 'resend' }
    },
  }
}

/** A transport that keeps what it was given, for tests. */
export function memoryTransport(): EmailTransport & { sent: OutgoingEmail[] } {
  const sent: OutgoingEmail[] = []
  return {
    name: 'memory',
    sent,
    async send(e) {
      sent.push(e)
      return { id: `memory-${sent.length}`, transport: 'memory' }
    },
  }
}

export type { TemplateId }
