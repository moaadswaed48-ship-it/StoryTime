import type { ReactElement } from 'react'
import { render, toPlainText } from 'react-email'
import type { Lang } from '@/i18n/config'
import { fmt } from '@/i18n/format'
import arCommerce from '@/i18n/ar/commerce'
import arCommon from '@/i18n/ar/common'
import daCommerce from '@/i18n/da/commerce'
import daCommon from '@/i18n/da/common'
import enCommerce from '@/i18n/en/commerce'
import enCommon from '@/i18n/en/common'
import heCommerce from '@/i18n/he/commerce'
import heCommon from '@/i18n/he/common'
import ar from './copy/ar'
import da from './copy/da'
import en from './copy/en'
import he from './copy/he'
import type { EmailCopy } from './copy/types'
import { emailDate, emailMoney } from './format'
import { EmailLayout, type Row } from './Layout'
import { isMarketing, type Params, type RenderedEmail, type SenderDetails, type TemplateId } from './types'

export const COPY: Record<Lang, EmailCopy> = { ar, he, en, da }
/** The site's own words for age groups, lengths and the visible placeholders, so emails and site match exactly. */
const SITE = {
  ar: { common: arCommon, commerce: arCommerce },
  he: { common: heCommon, commerce: heCommerce },
  en: { common: enCommon, commerce: enCommerce },
  da: { common: daCommon, commerce: daCommerce },
} as const

/** Until the owner gives the business details and support address, every email shows the site's placeholders. */
export const PLACEHOLDER_SENDER: SenderDetails = { business: null, supportEmail: null }

type Built = { subject: string; preview: string; element: ReactElement }

/** Builds one email: subject, preview line and the React Email element (rendered by renderEmail). */
export function buildEmail<T extends TemplateId>(template: T, lang: Lang, params: Params[T], sender: SenderDetails = PLACEHOLDER_SENDER): Built {
  const c = COPY[lang]
  const site = SITE[lang]
  const b = c.templates[template]
  const p = params as Record<string, unknown>
  const tag = site.commerce.plans.placeholderBadge
  const businessText = sender.business ?? site.common.footer.business
  const support = sender.supportEmail ?? c.common.supportPlaceholder
  const money = (a: number | null | undefined) => (a === null || a === undefined ? site.commerce.plans.priceNotSet : emailMoney(a, lang))
  const date = (k: string, time = false) => (typeof p[k] === 'string' ? emailDate(p[k] as string, lang, time) : '')

  const values: Record<string, string | number> = {
    tz: c.common.israelTime,
    support,
    contact: site.commerce.cancel.contactPlaceholder,
    mark: c.marketingMark,
  }
  for (const [k, v] of Object.entries(p)) if (typeof v === 'string' || typeof v === 'number') values[k] = v
  const groupLabel = typeof p.ageGroup === 'string' ? site.commerce.groups[p.ageGroup as keyof typeof site.commerce.groups] : ''
  // Inside a sentence English reads "for ages 4–5"; the label itself ("Ages 4–5") is kept for the details table.
  if (groupLabel) values.group = lang === 'en' ? groupLabel.charAt(0).toLowerCase() + groupLabel.slice(1) : groupLabel
  if (typeof p.months === 'number') values.length = site.commerce.months[p.months as keyof typeof site.commerce.months]
  // Dates: trial and pass ends with the time (a trial ends at an exact moment), other days without.
  for (const k of ['endsAt', 'endedAt']) if (p[k]) values[k] = date(k, template.startsWith('trial'))
  for (const k of ['startsAt', 'paidAt', 'deletedAt', 'cancelledAt', 'refundBy', 'issuedAt']) if (p[k]) values[k] = date(k)
  if ('amountAgorot' in p) values.amount = money(p.amountAgorot as number | null)
  if (sender.supportEmail === null && template === 'email_changed') values.support = c.common.supportPlaceholder

  // Addresses, links and order numbers read left to right even inside an Arabic or Hebrew sentence: isolate them,
  // or the sentence's punctuation jumps around them.
  if (lang === 'ar' || lang === 'he') {
    for (const k of ['cancelLink', 'newEmail', 'orderRef', 'support', 'link']) if (typeof values[k] === 'string') values[k] = `\u2066${values[k]}\u2069`
  }
  const f = (s: string) => fmt(s, values)
  const stories = Array.isArray(p.stories) ? (p.stories as string[]) : []
  const body = b.body.flatMap((line): (string | ReactElement)[] => {
    if (line === '{stories}') return [<ul key="stories" style={{ margin: '0 0 14px', paddingInlineStart: '22px' }}>{stories.map((s, i) => <li key={i} style={{ fontSize: '16px', lineHeight: '1.6' }}>{s}</li>)}</ul>]
    if (line === '{reply}') return String(p.reply ?? '').split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean)
    return [f(line)]
  })

  const L = c.labels
  let rows: Row[] | undefined
  if (template === 'purchase_confirmation') {
    const q = params as Params['purchase_confirmation']
    rows = [
      { label: L.order, value: q.orderRef },
      { label: L.pass, value: L.passName },
      { label: L.group, value: groupLabel },
      { label: L.length, value: String(values.length) },
      { label: L.starts, value: String(values.startsAt) },
      { label: L.ends, value: String(values.endsAt) },
      { label: L.paidOn, value: String(values.paidAt) },
      { label: L.total, value: money(q.amountAgorot), placeholder: q.amountAgorot === null },
      { label: L.seller, value: sender.business ?? site.commerce.plans.sellerPlaceholder, placeholder: sender.business === null },
    ]
  }
  if (template === 'cancellation_received') {
    const q = params as Params['cancellation_received']
    const refund = q.paidAgorot === null ? site.commerce.plans.priceNotSet : q.feeAgorot === null ? L.refundRule : emailMoney(q.paidAgorot - q.feeAgorot, lang)
    rows = [
      { label: L.order, value: q.orderRef },
      { label: L.cancelledOn, value: String(values.cancelledAt) },
      { label: L.refund, value: refund, placeholder: q.paidAgorot === null },
      { label: L.fee, value: q.feeAgorot === null ? L.feeUndecided : emailMoney(q.feeAgorot, lang) },
      { label: L.refundBy, value: String(values.refundBy) },
    ]
  }

  const marketing = isMarketing(template)
  const ctaHref = (template === 'refund_issued' ? (p.creditDocUrl as string | null) : (p.link as string | undefined)) ?? null
  const footer = [
    marketing ? c.common.footerMarketing : c.common.footerService,
    ...(marketing ? [f(c.common.refusalByEmail)] : []),
    sender.business ? sender.business : `${tag}: ${businessText}`,
  ]
  const element = (
    <EmailLayout
      lang={lang}
      preview={f(b.preview)}
      heading={f(b.heading)}
      greeting={c.common.greeting}
      body={body}
      rows={rows}
      cta={b.cta && ctaHref ? { label: f(b.cta), href: ctaHref } : undefined}
      linkFallback={template === 'confirm_email' || template === 'password_reset' || template === 'email_change_confirm' ? c.common.linkFallback : undefined}
      after={b.after?.map(f)}
      signoff={c.common.signoff}
      team={c.common.team}
      footer={footer}
      unsubscribe={marketing ? { label: c.common.unsubscribe, href: String(p.unsubscribeUrl) } : undefined}
      placeholderTag={tag}
    />
  )
  return { subject: f(b.subject), preview: f(b.preview), element }
}

/** The finished email: subject, preview, HTML and the plain-text version every email carries. */
export async function renderEmail<T extends TemplateId>(template: T, lang: Lang, params: Params[T], sender: SenderDetails = PLACEHOLDER_SENDER): Promise<RenderedEmail> {
  const { subject, preview, element } = buildEmail(template, lang, params, sender)
  const html = await render(element)
  // Headings keep their own case in the text version (the default shouts them in capitals).
  const text = toPlainText(html, { selectors: [{ selector: 'h1', options: { uppercase: false } }] })
  return { template, lang, subject, preview, html, text }
}
