# Emails: what a native editor should check (22 Nov 2026)

**In three lines:** all 19 emails exist in Arabic, Hebrew, English and Danish (`src/emails/copy/<lang>.ts`), and the
owner's area words in `src/i18n/<lang>/owner.ts`. They were written by the Builder, not by native editors. The lines
below are the ones most likely to need a native touch; everything else should still be read once before launch.

How to look: run `npm run dev` and open `/lab/emails` (every email, every language, with sample data), or open the
phone-width pictures in `qa/out/stage4b2/emails/` (Arabic and English).

## All languages
- Subject lines must stay short and plain. The marketing subject starts with the marking the spam law asks for:
  `פרסומת` in every language, then the word in the email's language (legal checklist item 34; lawyer question 5 asks
  whether the translation alone would be enough). Check the order reads naturally: `פרסומת | إعلان: …`, `פרסומת: …`,
  `פרסומת | Advertisement: …`, `פרסומת | Reklame: …`.
- Placeholders are visible on purpose (`[support email address: to be added before sales open]`, the site's
  "Business details" line and "Price not set yet"). They disappear when the owner's details are set
  (BUSINESS_DETAILS, SUPPORT_EMAIL in the edge-function settings) and real prices exist.
- The cancellation text in the purchase confirmation repeats the legal checklist (14 days, fee at most 5% or 100
  shekels). It is secondary research awaiting a lawyer; the wording must match the final Terms.

## Arabic (`src/emails/copy/ar.ts`)
- Gender-neutral address: unvocalised pronouns (حسابك، لك) and verbal nouns instead of commands. Check that nothing
  reads as addressing only a man.
- `بتوقيت إسرائيل` after times ("Israel time"): confirm this is the wording Arab families in Israel expect.
- Terms follow the site: `باقة` for a pass, `حكاية` for a story, `التجربة المجانية` for the trial. In
  `trial_started` the sample titles say قصة (they come from the test data, not from the copy).
- `لـ{group}` produces `لـعمر 4–5` (for ages 4–5). Check this joining reads well, or prefer `للفئة العمرية 4–5`.
- `welcome_parent`: «باسم دلع» for a nickname. Check it is the natural word.
- Signature `مع أطيب التمنيات، فريق StoryTime`.

## Hebrew (`src/emails/copy/he.ts`)
- Gender-neutral address: unvocalised forms (נרשמת, שלך), infinitives and "אפשר". Check the welcome lists
  (בוחרים, מוסיפים, מתחילים) read as friendly rather than as orders.
- `ל{group}` produces `לגילאי 4–5`. Fine as written; check.
- `מתחיל ב־` / `מסתיים ב־` labels in the purchase table are followed by a date on the next line: check they read
  well without the date on the same line.
- Quotation marks „ביטול רכישה” in the purchase confirmation: check the house style for quotes.

## Danish (`src/emails/copy/da.ts`)
- `israelsk tid` after times; `pakke` for a pass (as on the site); "Kærlig hilsen" / "StoryTime" as the signature.
- The cancellation paragraph uses "fortryde/fortrydelse" (the Danish term for the right to cancel). Check it fits an
  Israeli law context.

## English (`src/emails/copy/en.ts`)
- Age groups inside sentences are lower-cased ("for ages 4–5"); the table keeps "Ages 4–5".

## Owner's area words (`src/i18n/<lang>/owner.ts`)
- Arabic `منطقة إدارة الموقع` and Hebrew `אזור ניהול האתר` ("site management area") were chosen to avoid a gendered
  "owner"; English says "Owner's area".
- Hebrew uses `הסופרת` (feminine) for the author, who is a woman.
