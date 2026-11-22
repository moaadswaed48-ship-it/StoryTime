import type { Lang } from '@/i18n/config'
import type { Params, TemplateId } from './types'

/**
 * Example data for every email, for the gallery (/lab/emails), the screenshots and the tests. Obviously examples:
 * example.test addresses, sample titles, no real prices (amounts are null, so the price placeholder shows).
 */
const SITE = 'https://storytime.example.test'
const T0 = '2026-12-01T10:30:00.000Z' // 12:30 in Israel (winter time, UTC+2)
const day = (n: number) => new Date(new Date(T0).getTime() + n * 86_400_000).toISOString()

const TITLES: Record<Lang, string[]> = {
  ar: ['قصة تجريبية 1', 'قصة تجريبية 2', 'قصة تجريبية 3'],
  he: ['סיפור לדוגמה 1', 'סיפור לדוגמה 2', 'סיפור לדוגמה 3'],
  en: ['Sample story 1', 'Sample story 2', 'Sample story 3'],
  da: ['Eksempelhistorie 1', 'Eksempelhistorie 2', 'Eksempelhistorie 3'],
}
const REPLY: Record<Lang, { subject: string; reply: string }> = {
  ar: { subject: 'سؤال عن الحساب', reply: 'شكرًا على رسالتك. هذا رد تجريبي يظهر هنا كما سيظهر رد صاحب الموقع.\n\nفقرة ثانية من الرد.' },
  he: { subject: 'שאלה על החשבון', reply: 'תודה על ההודעה. זו תשובה לדוגמה, והיא מוצגת כאן כמו שתוצג תשובה אמיתית.\n\nפסקה שנייה בתשובה.' },
  en: { subject: 'A question about my account', reply: 'Thank you for your message. This is a sample answer, shown here the way a real answer will look.\n\nA second paragraph of the answer.' },
  da: { subject: 'Et spørgsmål om min konto', reply: 'Tak for din besked. Dette er et eksempel på et svar, vist sådan som et rigtigt svar vil se ud.\n\nEt andet afsnit af svaret.' },
}

export function sampleParams(lang: Lang): { [K in TemplateId]: Params[K] } {
  const app = `${SITE}/${lang}/app/`
  return {
    confirm_email: { link: `${SITE}/${lang}/auth/confirm/?token_hash=example&type=signup`, hours: 24 },
    welcome_parent: { link: app },
    welcome_teacher: { link: app },
    trial_started: { ageGroup: '4-5', endsAt: day(3), stories: TITLES[lang], link: `${app}library/` },
    trial_ends_tomorrow: { ageGroup: '4-5', endsAt: day(3), link: `${app}settings/#passes` },
    trial_ended: { ageGroup: '4-5', endedAt: day(3), link: `${app}settings/#passes` },
    purchase_confirmation: {
      orderRef: 'ST-EXAMPLE-0001', ageGroup: '4-5', months: 3, amountAgorot: null, paidAt: T0, startsAt: T0, endsAt: day(90),
      link: app, cancelLink: `${SITE}/${lang}/cancel-purchase/`,
    },
    pass_started: { ageGroup: '6-8', startsAt: T0, endsAt: day(30), link: app },
    pass_ends_7d: { ageGroup: '6-8', endsAt: day(7), link: `${app}settings/#passes` },
    pass_ends_1d: { ageGroup: '6-8', endsAt: day(1), link: `${app}settings/#passes` },
    pass_ended: { ageGroup: '6-8', endedAt: T0, link: `${app}settings/#passes` },
    password_reset: { link: `${SITE}/${lang}/auth/reset/?token_hash=example&type=recovery`, minutes: 60 },
    email_change_confirm: { link: `${SITE}/${lang}/auth/confirm/?token_hash=example&type=email_change`, newEmail: 'new.address@example.test', hours: 24 },
    email_changed: { newEmail: 'new.address@example.test' },
    account_deleted: { deletedAt: T0 },
    cancellation_received: { orderRef: 'ST-EXAMPLE-0001', ageGroup: '4-5', months: 3, cancelledAt: T0, paidAgorot: null, feeAgorot: null, refundBy: day(14) },
    refund_issued: { orderRef: 'ST-EXAMPLE-0001', amountAgorot: null, issuedAt: day(5), creditDocUrl: `${SITE}/example-credit-document` },
    contact_reply: REPLY[lang],
    new_story: { title: TITLES[lang][0]!, ageGroup: '2-3', link: `${app}library/`, unsubscribeUrl: `${SITE}/functions/v1/email-unsubscribe?a=example&l=${lang}&s=example` },
  }
}
