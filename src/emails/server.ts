/**
 * Everything the Supabase edge functions need from the emails, as one entry. `npm run emails:bundle` turns it into
 * supabase/functions/_shared/emails.mjs (React, React Email and the four languages included), because an edge
 * function can only import files inside supabase/functions.
 */
export { renderEmail, PLACEHOLDER_SENDER } from './render'
export { dueEmails, reminderParams, isQuietHour, type AudienceMember, type DueEmail, type NewStory } from './schedule'
export { resendTransport, SendError, type EmailTransport, type OutgoingEmail } from './send'
export { unsubscribeUrl, verifyUnsubscribe } from './unsubscribe'
export { verifySvix } from './webhook-verify'
export { TEMPLATES, isMarketing, type Params, type SenderDetails, type TemplateId } from './types'
export { emailDate } from './format'
export { LANGS, isLang, type Lang } from '@/i18n/config'

/** The one line shown after unsubscribing (a plain-text page, served by the email-unsubscribe function). */
export const UNSUBSCRIBED: Record<'ar' | 'he' | 'en' | 'da', string> = {
  ar: 'تم إيقاف رسائل الأخبار من StoryTime. رسائل الخدمة المتعلقة بحسابك تبقى كما هي. يمكن تشغيل الأخبار من جديد في الإعدادات.',
  he: 'הודעות החדשות מ־StoryTime הופסקו. הודעות השירות על החשבון שלך ממשיכות כרגיל. אפשר להפעיל שוב את החדשות בהגדרות.',
  en: 'News emails from StoryTime are switched off. Service emails about your account continue as before. You can switch news on again in Settings.',
  da: 'Nyhedsmails fra StoryTime er slået fra. Servicebeskeder om din konto fortsætter som før. Du kan slå nyheder til igen under Indstillinger.',
}
export const UNSUBSCRIBE_FAILED: Record<'ar' | 'he' | 'en' | 'da', string> = {
  ar: 'هذا الرابط غير صالح. يمكن إيقاف الأخبار من الإعدادات في الحساب، أو الكتابة إلينا.',
  he: 'הקישור הזה לא תקין. אפשר להפסיק את החדשות בהגדרות החשבון, או לכתוב לנו.',
  en: 'This link is not valid. You can switch news off in your account settings, or write to us.',
  da: 'Dette link er ikke gyldigt. Du kan slå nyheder fra under kontoens indstillinger eller skrive til os.',
}
