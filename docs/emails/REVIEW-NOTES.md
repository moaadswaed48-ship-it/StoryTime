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

## Added by the fresh review (docs/reviews/stage4b2-review.md)
- Purchase confirmation, every language: the line about the tax receipt is now a visible placeholder in square
  brackets until the payment company is chosen (the old line said it comes from the payment company, which is not
  decided). Replace it with the real sentence then.
- Owner's area, every language: new error `errors.publishedIncomplete` (a save that would leave a published story
  incomplete). Check the Arabic `يلزم إكمال ما ينقص` and Hebrew `יש להשלים` read naturally.

## From the fresh review of 26 Nov (finding 10), and the words added by its fixes (27 Nov 2026)
Not changed by the Builder: these are choices for native readers. All four are gender-neutral as written.
- **Classroom notes heading** (`src/i18n/<lang>/stories.ts`, `classroom.teacherNotes`): Arabic `لطاقم الروضة`
  ("for the kindergarten staff") and Hebrew `לצוות הגן` ("for the kindergarten team"), but English `For the teacher`
  and Danish `Til personalet` ("for the staff"). Decide one meaning for all four (staff, or teacher), or keep the
  difference on purpose.
- **Name of the mode**: Danish `Storskærmstilstand` ("big-screen mode") where the others say "classroom mode"
  (`وضع الصف`, `מצב כיתה`, `Classroom mode`). Fine if deliberate; Danish kindergartens may prefer a word with
  "gruppe" or "klasse".
- **New words in this fix, every language** (written by the Builder, not by native editors):
  - Classroom library with nothing open (`classroom.nothingOpenTitle`, `nothingOpenLead`, `trialEndedLead`,
    `lockedLead`): addressed to "the grown-up" (`للبالغين`, `למבוגרים`, `Til den voksne`). Check this reads well on a
    class screen, or whether "for the staff" fits better.
  - Payment history refunds (`src/i18n/<lang>/account.ts`, `settings.refund*`): Arabic `المبلغ الذي أُعيد إليكم`
    and Hebrew `הוחזר אליכם` use the plural "you" (neutral); Danish uses `dig`, as elsewhere on the site.
  - Checkout `priceChangedTitle` / `priceChangedLead` (`commerce.ts`): Arabic `يُرجى مراجعة الملخّص`, Hebrew `כדאי
    לבדוק את הסיכום` (impersonal forms).
  - Plans `factValidityPartial` and home teaser `priceSetSome`: check the quotation marks around "Price not set yet"
    in each language (Hebrew uses „…”, Arabic «…», Danish “…”).
  - Owner's area, public cancellation requests (`owner.ts`, `refunds.matchesTitle` … `cancelDone`, new errors
    `orderNotMatching`, `passNotActive`, `cancelWindowClosed`, and the rewritten `publicLead`).
- **Refund email** (`refund_issued`): now has a details table (Total paid, Cancellation fee, Refund) built from the
  existing labels; no new email words. Seen while checking it: the Arabic footer `تصلك هذه الرسالة` addresses the
  reader in the singular (masculine/unmarked) form; a native reader may prefer a plural or impersonal form.
