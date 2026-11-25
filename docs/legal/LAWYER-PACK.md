# StoryTime legal pages: brief for the lawyer (25 Nov 2026)

**What to review.** Six draft pages, each in Arabic, Hebrew, English and Danish, at `/<lang>/legal/<page>/`: `terms`,
`privacy`, `refunds` (refunds and cancellation), `accessibility`, `credits`, `cookies`. English is the master
(`src/i18n/en/legal.ts`); the other three were written from it, not translated word for word. Every page opens
with a "Draft: not yet reviewed by a lawyer" banner. A gap is shown on the page as a dashed box, never as an
invented clause, section number, fee or deadline. Sources: `docs/LEGAL-CHECKLIST.md` (secondary research, not
legal advice) and the build itself. Business: a children's story library (ages 2-8), adult accounts only, one-time
passes of 1, 3 or 12 months that never renew, a free 3-day trial with no card, sales in Israel only at launch.
Terms version recorded at sign-up and checkout: `draft-2026-11-25` (earlier test accounts: `draft-2026-11-22`,
when no text existed).

## A. Questions for you (Q1-Q13 are numbered as in the checklist)

| Q | Question | Where it shows |
|---|---|---|
| 1 | Do the 2010 Cancellation Regulations exclude online access passes? May anything be deducted for days already used (14ה(ב1))? Draft deducts nothing for use. | refunds: Your right to cancel, Your refund |
| 2 | Must a web-only seller accept cancellation by phone and by registered mail (14ט(א))? | refunds: How to cancel |
| 3 | Does 13א (fixed-term deals) apply to passes that never renew? | terms: Passes |
| 4 | Is a "your pass ends on X" email with a link to the account a service message or an advertisement? | terms: Passes; privacy: News emails |
| 5 | Is "פרסומת" needed in Hebrew in Arabic, English and Danish emails? Draft uses Hebrew plus the email's language. | privacy: News emails |
| 6 | Which language version prevails? Is Hebrew required as the binding text? | banner line on every page |
| 7 | Which ID number and address must a sole trader show; may a business address replace a home address? | terms: Who we are; privacy: Who is responsible; refunds: Seller |
| 8 | Wording of Privacy Law sections 11, 13, 14 after Amendment 13, and deadlines for answering requests. | privacy: On what basis; Your rights |
| 9 | Is a child's nickname plus age group outside the sensitive categories; is the parent's consent enough? | privacy: Children |
| 10 | What may be kept after deletion, and for how long: tax records; the trial record (salted hash of the email, proposed 2 years); the email log; cancellation-form requests. Is the hash personal data? | privacy: What we collect, How long we keep it |
| 11 | Are the accessibility exemption figures current (100,000 shekels, 500 users, 60 days)? Which version of IS 5568 applies? | accessibility: Our aim |
| 12 | Israeli rules on cookies/local storage; unfair-terms rules for the terms of use. | cookies: In short; terms (all) |
| 13 | Copyright: written assignments, the author's permission and how she is credited. | terms: Who owns the stories; credits: Stories |
| 14 | Limitation-of-liability wording that consumer law allows. | terms: Our responsibility |
| 15 | When may we close an account for breach, with what notice, and what happens to a running pass? | terms: Closing an account |
| 16 | How and how far ahead to announce changes to the terms and privacy policy; do changes bind running passes? | terms: Changes to these terms; privacy: Changes |
| 17 | Governing law (draft: Israel) and which courts. | terms: Law and courts |
| 18 | Processing agreements with Supabase, Resend, Cloudflare and the payment company; legal basis for transfers outside the EU (Resend and Cloudflare locations not yet confirmed). | privacy: Who helps us; Data stored outside Israel |
| 19 | What may a teacher do with the content in class (show a film to the group, print an activity)? | terms: Using StoryTime fairly |
| 20 | What is the customer owed if a story is withdrawn during a pass? | terms: Changes to the library |
| 21 | Breach duties at the basic security level, and what we tell users. | privacy: How we protect it |
| 22 | The 4-month cancellation right (disability, 65+, new immigrants): does it apply to a purely online sale, and on what proof? | refunds: A longer period |

## B. Facts the owner fills in (placeholders, same spot in all four languages)

- **Business details** (name, ID or company number, postal address in Israel, support email, phone if Q2/Q7 require
  it): terms (Who we are, Contact), privacy (Who is responsible), refunds (How to cancel, Seller), credits (Copyright).
- **Privacy contact** name and email: privacy (Who is responsible, Your rights, Questions and complaints).
- **Cancellation email address**: refunds (How to cancel, Seller).
- **Accessibility contact** (name, email, phone, post), answer time, date of the full accessibility check:
  accessibility (Tell us about a problem, Date).
- **Prices** and **tax status** (exempt or licensed dealer, VAT): terms (Prices and payment); accountant.
- **Payment company** (not chosen), how refunds reach the buyer, its cookie policy: terms (Prices), privacy (Who
  helps us), refunds (Your refund), cookies (Other companies).
- **Whether to charge a cancellation fee at all** (cap: the lower of 5% or 100 shekels): refunds (Your refund).
- **Retention periods** for tax records, email log, cancellation requests, sign-in logs, backups: privacy (What we
  collect, How long we keep it).
- **Data locations**: Supabase EU region, Resend, Cloudflare: privacy (Who helps us).
- **The Privacy Protection Authority's contact details**: privacy (Questions and complaints).
- **Author's name and date of her written permission**; voices once recorded; brand fonts if added; full licence
  list before launch: credits.
- **Hosting cookie check at launch**: cookies (In short).

## C. Build facts you should know (true of the code today)

- No name and no phone number are collected; a child is a first name or nickname plus an age group; a teacher's
  class has no children's names. No ads, analytics or tracking cookies.
- Account deletion removes the account, profiles, progress, consents, trial and passes. Kept: orders and payments
  without the account link; the trial hash; **the email log still holds the address**; cancellation-form requests;
  a deletion record. The privacy page says so; set periods (Q10) or ask us to anonymise the email log.
- The in-app "Cancel this purchase" button closes 14 days after payment. A later start date (receipt of the
  confirmation) is served by the form, email and post routes.
- Cancelling ends access at once and records a refund request for the full amount; the database refuses any fee
  above the legal cap.
- Not yet true, and the pages say so: no recorded voices; Safari/iPhone not tested; no full accessibility audit;
  real payment company, Resend and Cloudflare not connected; Supabase project not created.
