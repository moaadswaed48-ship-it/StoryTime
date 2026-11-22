# StoryTime legal checklist (22 Nov 2026)

**Draft checklist from secondary research. Not legal advice. Needs a lawyer's review before launch.**

**In three lines:** what Israeli law asks of the site and the business, in plain words, with the source and how
sure we are. The researcher could not open gov.il web pages, Nevo or Kol Zchut (blocked), so most statute text was
read from a secondary copy (Hebrew Wikisource). Nothing below is invented: where the research lacks a section,
rate or deadline, this file says so.

**Confidence tags** (copied from `docs/research/israel-law-raw.md`, which uses PRIMARY / SECONDARY / SNIPPET):
- **OFFICIAL SOURCE READ**: the researcher read the official text (a gov.il PDF, the Knesset gazette).
- **SECONDARY SOURCE**: a copy of the statute (Wikisource), a law firm, news or a commercial guide.
- **UNVERIFIED**: seen only in a search summary, or not found at all.

Product consequences are listed per duty and collected in `docs/PRODUCT-CHECKLIST.md`.

---

## 1. Duties, one by one

### Consumer Protection Law, 1981 (online "distance" sale)
1. **Say who you are.** Show the trader's name, ID number and address (in Israel and abroad); the law also asks for name and ID number on offers, contracts and receipts.
   - Law: section 14ג(א)(1); section 4(ב) (wording to confirm on Nevo).
   - Confidence: SECONDARY SOURCE.
   - Product: business details in every footer, on the plans page, at checkout, in the purchase confirmation and on receipts.
2. **Disclose the offer before the sale.** Main features of the service, price and payment terms, time and manner of supply, how long the offer is valid, warranty details, and the right to cancel. Enforcement reports say cancellation terms must be shown at the marketing stage too.
   - Law: section 14ג(א)(2)-(7). Enforcement: Consumer Authority annual reports 2018, 2020, 2024.
   - Confidence: SECONDARY SOURCE (statute); UNVERIFIED (enforcement reports, search summaries only).
   - Product: plans page and checkout summary state what a pass is, that access is instant, the pass length, the price, that it does not renew, and the 14-day right.
3. **Give a written transaction document** no later than supply, with the 14ג(א) details, how to cancel and any other terms, **in Hebrew or in the language the marketing was done in**.
   - Law: section 14ג(ב).
   - Confidence: SECONDARY SOURCE.
   - Product: a purchase-confirmation email in the buyer's language (four versions), separate from the tax receipt.
4. **Show the total price, with all taxes, in shekels, clearly.**
   - Law: sections 17א-17ד. Courts and the Consumer Authority required VAT-inclusive prices for Israeli buyers (Agoda, Booking.com matters).
   - VAT rate: **18% since 1 January 2025**. Confidence: SECONDARY SOURCE (Bizportal guides); the official Tax Authority page was not opened.
   - Confidence for the price rules: SECONDARY SOURCE. Whether foreign buyers may see prices without VAT: UNVERIFIED.
   - Product: every price on landing, plans, checkout and emails is the final price with VAT in shekels. (An exempt dealer charges no VAT, so the price shown is simply the full price.)
5. **14-day right to cancel a service.** The consumer may cancel within 14 days from the deal or from receiving the transaction document, whichever is later; for an ongoing service this holds even if the service has started.
   - Law: section 14ג(ג)(2).
   - Confidence: SECONDARY SOURCE. **No exception for digital content was found**; the 2010 Cancellation Regulations were not opened, so whether any exception covers online access is UNVERIFIED. Treat the right as applying to every pass.
   - Product: a "Cancel this purchase" action on each pass while the right lasts; the refunds page explains it.
6. **Refund within 14 days; cancellation fee capped.** For a cancellation not caused by the trader: refund within 14 days of the notice, cancel the charge, confirm in writing; the trader may keep at most **the lower of 5% of the price or 100 shekels**. For an ongoing service already provided, the consumer pays for the service received (paraphrase; exact wording not checked). If the cause is the trader's fault (defect, breach, delay): full refund within 14 days, no fee.
   - Law: section 14ה(ב), 14ה(ב1), 14ה(א).
   - Confidence: SECONDARY SOURCE (14ה(ב1) wording UNVERIFIED).
   - Product: refund rule shown before the cancel button; written confirmation email; owner's area can issue the refund and the credit document.
7. **Longer right for some buyers.** People with disabilities, people aged 65 or older and new immigrants (within 5 years) may cancel within **4 months**, if the deal included a conversation between trader and consumer.
   - Law: section 14ג1(ג).
   - Confidence: SECONDARY SOURCE.
   - Product: keep sales purely online (no sales by phone or chat). If support ever helps a buyer complete a purchase, this right applies.
8. **Accept cancellation in several ways.** By phone or oral notice (unless the law requires writing), registered mail, email, fax if the trader has one, the internet where the deal was made online, or another way set by the minister.
   - Law: section 14ט(א).
   - Confidence: SECONDARY SOURCE.
   - Product: an online cancel form, an email address and a postal address. Whether a phone line is required for a web-only seller: lawyer.
9. **Prominent cancellation link on the home page.**
   - Law: section 14ט(ב). Enforcement: fines for a missing home-page cancellation link (2020 report).
   - Confidence: SECONDARY SOURCE (statute); UNVERIFIED (enforcement report).
   - Product: a clearly labelled "Cancel a purchase" link on the home page (and every footer). Our passes never renew, so this link is for the 14-day cancellation of a purchase, not for a subscription.
10. **Write the cancellation methods down.** Cancellation methods and contact details in writing no later than supply; the same on invoices, receipts and payment notices, and on the home page next to the cancellation link, in clear, emphasised lettering.
    - Law: section 14ט(ד)-(ו).
    - Confidence: SECONDARY SOURCE.
    - Product: the cancellation methods block appears beside the home-page link, in the purchase confirmation and on receipts.
11. **Fixed-term deals do not renew by themselves.** A clause that continues the deal automatically after its end is void; renewal needs the consumer's agreement; the trader must notify the end date in invoices or receipts sent in the last three months, and by SMS 21 days before the end if a mobile number was given; the trader carries the burden of proof.
    - Law: section 13א(ב), (ג), (ה).
    - Confidence: SECONDARY SOURCE. Whether 13א applies to a 1, 3 or 12-month pass: UNVERIFIED (lawyer).
    - Product: passes never renew; a new pass needs a fresh purchase; end date on every receipt and pass email; reminder emails 7 days and 1 day before the end (owner's plan); we do not collect phone numbers.
12. **Free trial.** No specific rule on free trials was found.
    - Confidence: UNVERIFIED.
    - Product: trial needs no card and never turns into a payment; its terms are stated in plain words before it starts (general duties 2, 4 and section 2 of the law still apply).
13. **No misleading claims.** Deceiving on a material matter is forbidden, including about the benefit of a service, endorsement, conformity to a standard and test results.
    - Law: section 2(א), items (4), (10), (11), (14).
    - Confidence: SECONDARY SOURCE. No Israeli rule specific to "educational" claims was found (UNVERIFIED).
    - Product: no "proven", "improves" or impact numbers in public without evidence on file; the impact graph stays an illustration on the preview until the owner's papers arrive; no invented reviews or user counts.
14. **Marketing aimed at minors.** It must not mislead a minor, exploit age, naivety or inexperience, or encourage activity harmful to health. Offences aimed at minors are aggravated.
    - Law: section 7א; aggravation sections 22ד, 23(א)(4), 23א(ב)(4).
    - Confidence: SECONDARY SOURCE. Regulations under 7א(ב): UNVERIFIED (not found).
    - Product: no selling or offers on children's screens; purchases only behind the parent gate; marketing speaks to adults.
15. **Penalties** (for the lawyer's sense of risk): monetary sanctions under section 22ג, with amounts adjusted yearly (the 2026 figures in the research run from 8,260 to 75,620 shekels depending on the breach and whether the trader is a person or a company); offences aimed at minors multiplied by 1.5 (22ד).
    - Confidence: SECONDARY SOURCE.

### Tax and receipts (not an accountant's advice)
16. **A receipt for every payment.** An exempt dealer (osek patur) issues receipts, not tax invoices; a licensed dealer (osek murshe) charges 18% VAT and issues tax invoices and tax invoice-receipts. The exact legal section requiring a receipt on every online payment was not found.
    - Confidence: SECONDARY SOURCE (document types); UNVERIFIED (the section; the usual references, Income Tax book-keeping rules and VAT Law section 47, were not checked).
    - Product: the payment company's invoicing issues the document automatically on each payment and a credit document on each refund.
17. **Exempt-dealer ceiling.** Turnover ceiling for an osek patur: **122,833 shekels in 2026** (120,000 in 2025).
    - Confidence: UNVERIFIED (search summary of the gov.il service page; not opened).
    - Product: none directly; it decides whether prices include VAT and whether the accessibility exemption applies.
18. **Israel Invoice allocation number.** A tax invoice above a threshold needs an allocation number from the Tax Authority, or the business buyer cannot deduct the VAT. Threshold **5,000 shekels before VAT from 1 June 2026** (earlier 25,000, 20,000, 10,000). Exempt dealers are said to be outside this regime.
    - Confidence: SECONDARY SOURCE.
    - Product: only matters if a kindergarten buys as a business at a high price; the invoicing tool should support it. Approved-software rules: UNVERIFIED.

### Protection of Privacy Law, 1981, as amended by Amendment 13 (in force 14 August 2025)
19. **Informed, specific consent.** List **every** type of data collected and **every** purpose (no "etc."); describe recipients by type; avoid blanket consent; get separate, highlighted consent for any use beyond what the service normally needs; adapt how consent is presented when a service is aimed at minors.
    - Law: section 1 and section 11, as explained in the Privacy Protection Authority's consent opinion of 25 Feb 2026.
    - Confidence: OFFICIAL SOURCE READ (the opinion PDF).
    - Product: a complete data table in the privacy policy; terms agreement and marketing consent are separate boxes; nothing pre-ticked.
20. **Duty to inform when asking for data.** Say whether giving the data is required or voluntary, the purpose, and who receives it and why.
    - Law: section 11.
    - Confidence: UNVERIFIED (the post-Amendment-13 wording was not read; only pointed to by the official opinion).
    - Product: a one-line note under each sign-up and onboarding field group ("Needed to ..." / "Optional").
21. **Children's data.** Collecting data from minors needs a parent's or guardian's consent, also online; no statutory age for a child's own consent was found.
    - Confidence: UNVERIFIED (Justice Ministry item seen in a search summary only).
    - Product: adults hold the account; a child is only a first name or nickname plus age group; no photos, surnames, birth dates, ads or tracking on children's screens; the parent can edit and delete profiles.
22. **Database definitions document.** Every database needs a written document describing collection and use, purposes, data types, **transfers abroad with country and recipient**, and processors.
    - Law: Protection of Privacy Regulations (Data Security), 2017, regulation 2.
    - Confidence: OFFICIAL SOURCE READ (official English translation).
    - Product: an internal document (not a page) listing Supabase (EU region), Cloudflare, the email sender and the payment company.
23. **Security level and breaches.** A database with none of the listed sensitive categories, not a data broker and not a public body, is at the **basic** level. "Severe incident" reporting to the Authority is defined only for medium and high levels; the general duty to secure data still applies.
    - Law: Data Security Regulations, levels and regulation 11(d).
    - Confidence: OFFICIAL SOURCE READ. Whether a child's nickname plus age group could count as sensitive: UNVERIFIED (not in the schedule's list; lawyer to confirm).
    - Product: row-level security, owner two-step sign-in, short-lived media links, audit log, a written breach plan.
24. **Registration and notification.** Database registration was abolished for most businesses; a 30-day notification duty applies to large databases with especially sensitive data. The "large" threshold is not settled (sources say 100,000 or 10,000).
    - Law: section 8A(b).
    - Confidence: SECONDARY SOURCE, conflicting.
    - Product: none expected; lawyer to confirm.
25. **Privacy officer.** Required only for public bodies, data brokers with data on over 10,000 people, and bodies whose main activity is large-scale monitoring or large-scale sensitive data. A small business outside these has no duty.
    - Law: section 17ב1.
    - Confidence: SECONDARY SOURCE.
    - Product: none; the privacy policy names a contact person instead.
26. **Rights of access and correction or deletion.**
    - Law: sections 13 and 14. Content and response deadlines after Amendment 13: UNVERIFIED.
    - Product: a request route in Settings and in the privacy policy; account deletion in Settings.
27. **Data stored abroad.** Transfer is allowed to a country with protection no lower than Israel's; EU member states are treated as adequate; the transfer must be written in the definitions document.
    - Law: Protection of Privacy Regulations (Transfer of Data to Databases Abroad), 2001; Data Security Regulations regulation 2.
    - Confidence: SECONDARY SOURCE.
    - Product: Supabase in an EU region; named in the privacy policy.
28. **Sanctions** (for risk only): statutory damages without proof of harm up to 10,000 shekels per claimant (section 29א); administrative fines from a 150,000-shekel base with per-person formulas, capped at 5% of turnover; the Authority began inspecting online retail and popular apps in Dec 2025.
    - Confidence: SECONDARY SOURCE, figures UNVERIFIED.

### Accessibility: Equal Rights for Persons with Disabilities (Service Accessibility) Regulations, 2013
29. **Standard.** Websites follow Israeli Standard 5568 (based on WCAG) at **level AA**; documents such as PDFs too.
    - Law: regulation 35א(א), (ג).
    - Confidence: OFFICIAL SOURCE READ (gov.il consolidated PDF; text layer garbled some digits; check for amendments after 2020).
    - Product: WCAG AA build, tested; any downloadable PDF accessible.
30. **Accessibility statement** in a prominent place: the adjustments made, the accessibility coordinator's details if one must be appointed, and contact details to report a problem or ask for an adjustment.
    - Law: regulation 35ה.
    - Confidence: OFFICIAL SOURCE READ (regulation number confirmed by search).
    - Product: an "Accessibility" link in every footer and the statement page in four languages.
31. **Exemptions.** An osek patur, or a provider whose average yearly turnover is **at most 100,000 shekels**, is exempt from the website adjustments. Content open only to pre-registered users with at most 500 people at once may be exempt unless a person with a disability asks. A complaint is not a breach until the provider fails to fix within a reasonable time, at most 60 days.
    - Law: regulation 35ו (ז) and (ה); 35א(ד).
    - Confidence: OFFICIAL SOURCE READ, but the digits were garbled in the PDF: the 100,000 figure was cross-checked by search; **the 500 and 60-day figures are UNVERIFIED**.
    - Product: none; we build to AA and publish a statement anyway (the owner's "easy for everyone" rule).
32. **Accessibility coordinator** only for a provider with at least 25 employees; captions duty for recorded video only above 5 million shekels average turnover.
    - Law: section 19מב of the Equal Rights law (number garbled in extraction); regulation 35ד.
    - Confidence: OFFICIAL SOURCE READ (numbers garbled; verify).
    - Product: no coordinator; the statement gives a contact. Films have captions anyway (owner's request H4).

### Communications Law (Bezeq and Broadcasting), 1982, section 30א ("spam law")
33. **Prior written consent for advertising by email or SMS.** An advertisement is a commercial message meant to encourage buying or spending money. Exception for existing customers only if, at purchase, they were told their details would be used for ads, were given a chance to refuse, and the ad is for a similar product.
    - Law: section 30א(א)-(ג).
    - Confidence: OFFICIAL SOURCE READ (2008 enactment in the Knesset gazette; later amendments not checked).
    - Product: an unticked news box at sign-up, recorded with time and source; marketing emails only to those who ticked it.
34. **Marking and refusal.** Each advertisement starts with the word **"פרסומת"**, for email **in the subject line**; gives the advertiser's name, address and contact details; states the right to refuse and a simple way to do it, with a valid email address for refusals. Refusal is free and possible at any time.
    - Law: section 30א(ד), (ה).
    - Confidence: OFFICIAL SOURCE READ (2008 text). Whether a translated word is enough in Arabic, English and Danish emails: UNVERIFIED, so use "פרסומת" plus the word in the email's language.
    - Product: marketing email template with "פרסומת" first in the subject, business details and one-click unsubscribe.
35. **Compensation without proof of damage** up to 1,000 shekels per advertisement, claimed per message.
    - Law: section 30א(ט)-(י).
    - Confidence: OFFICIAL SOURCE READ (text) with SECONDARY SOURCE confirmation.
36. **Service message or advertisement?** A receipt, password reset or "your pass ends on X" is not an advertisement in itself; adding an offer ("renew with 20% off") can make it one. Where a renewal reminder falls is not settled.
    - Confidence: UNVERIFIED (from the definition only).
    - Product: trial and pass reminders carry facts and a link to the account only, never an offer, until the lawyer says otherwise.

### Copyright Law, 2007
37. **Written rights from every creator.** The author owns her work first; an employer owns only an employee's work made in employment. Assignments and exclusive licences need a written document. Moral rights (credit, integrity) stay with the author even after a sale. Term generally life plus 70 years.
    - Confidence: UNVERIFIED (section numbers not verified; search summaries only).
    - Product: the author's story untouched and credited; a credits and licences page; the owner's area records the source and licence of every file; the ownership pack for the sale lists every outside licence (fonts, sound libraries, code packages).

### Gaps the research did not cover
38. **Cookies under Israeli law**: not researched. Plan: no optional cookies or analytics at launch. Confidence: UNVERIFIED.
39. **Terms-of-use rules** (for example unfair terms in standard contracts): not researched. Lawyer to check the terms page. Confidence: UNVERIFIED.

---

## 2. Legal pages to draft (all in four languages, each marked "draft for lawyer review")

### Terms of use
- Who we are: business name, ID number, address, support email (and phone if required).
- What is sold: access passes per age group for 1, 3 or 12 months; paid once; no automatic renewal; start and end rules; one account may hold passes for two age groups; a queued pass starts when the current one ends.
- Free trial: 3 stories, 3 days, every feature, no card, one per account, never becomes a paid pass.
- Accounts: adults only; the account holder is responsible for children's profiles; teachers use the same account type.
- Prices: in shekels with VAT; the price at purchase applies.
- Cancellation and refunds: summary with a link to the full page.
- Allowed use: personal or classroom use; no copying, sharing of accounts or redistribution of stories, pictures and films.
- Ownership: stories, art and films belong to their owners; the author's story belongs to her and is used with her permission.
- Service changes, availability and content updates; what happens when a story is withdrawn.
- Limits of liability (lawyer to set; consumer law limits what can be excluded).
- Ending an account: by the user (delete) and by us (breach), and what happens to an active pass.
- Governing law (Israel) and courts; which language version prevails.
- Contact; date and version of the terms.

### Privacy policy (with a children's section)
- Who is responsible and how to reach them.
- Data table: account email and name; role (parent or teacher); password (stored only as a hash by the sign-in service); child's first name or nickname and age group; class name; language and settings; reading progress and favourites; purchase records and payment reference (no card numbers); trial records and any abuse check; contact messages; email delivery records; technical logs.
- For each: purpose, whether it is required or optional, legal basis or consent, how long it is kept.
- Recipients by type and name: database and sign-in host (Supabase, EU region), content delivery (Cloudflare), email sender, payment company and its invoicing; where each stores data; transfer abroad.
- Children's section in plain words: adults create accounts; we ask only a first name or nickname and age group; no ads, no selling of data, no tracking on children's screens; the parent can view, edit and delete; a teacher enters a class, not children's names.
- Marketing: only with a separate opt-in; how to withdraw.
- Cookies: which are used and why (only necessary ones at launch).
- Rights: access, correction, deletion; how to ask; response time (to fill from the law; not in the research).
- Security measures in plain words; what we do after a breach.
- Complaints: to us and to the Privacy Protection Authority.
- Changes to the policy and the date.

### Refunds and cancellation
- The right to cancel within 14 days of purchase or of receiving the confirmation, whichever is later.
- How to cancel: the online button on the pass, the form for signed-out users, email, postal address (and phone if required).
- The refund: within 14 days of the notice; fee at most the lower of 5% or 100 shekels; any deduction for service used only as the lawyer confirms.
- Full refund without fee when the fault is ours.
- The 4-month right for people with disabilities, people 65 and older and new immigrants, where it applies.
- What happens to access after a cancellation; profiles and progress kept.
- The trial needs no cancellation; passes never renew, so there is nothing to stop.
- Credit document issued for each refund.

### Accessibility statement
- The standard followed (Israeli Standard 5568, WCAG AA) and the date of the last check.
- What was adjusted: keyboard use, screen-reader text in the books, captions on films, text size, reduced motion, contrast, right-to-left layout.
- Known gaps and their planned fix.
- Contact for reporting a problem or asking for an adjustment (name, email, phone if any).
- Date of the statement.

### Credits and licences
- Story authors (the author's story credited as hers; the rest labelled StoryTime's).
- Art and films: made in code by StoryTime; voices and their service once recorded.
- Fonts, music and sound libraries, code packages and their licences.
- Copyright notice for the site.

### Cookies
- Only if optional cookies are ever added; at launch a short section inside the privacy policy is enough.

### Business details (short page or footer block)
- Name, ID or company number, address, support email, the cancellation methods.

---

## 3. What the owner must set up as a business
- **Registration type.** Exempt dealer (osek patur: no VAT, receipts, 2026 ceiling reported as 122,833 shekels, UNVERIFIED) or licensed dealer (osek murshe: 18% VAT, tax invoices, VAT reports). An accountant decides; the choice changes the prices shown and may decide the accessibility exemption.
- **Receipts.** Automatic legal documents on every payment and refund, through the payment company's invoicing or a linked invoicing service.
- **Payment company.** A hosted payment page, a server callback that tells the site a payment succeeded (needed to unlock a pass automatically), automatic receipts, and an Arabic payment page if possible. Stripe does not list Israel as supported; do not plan on it.
- **Ask each company in writing:** whether an osek patur can open a card terminal, the card fee, which payment-page languages exist (Danish is documented nowhere), and the documents needed.

### Three best fits for a very small business
| | Cardcom | Tranzila | Grow (formerly Meshulam) |
|---|---|---|---|
| Hosted payment page | Yes ("Low Profile", redirect or iframe) | Yes (hosted page, hosted fields; old iframe support ends 1 Jan 2027, use the newer route) | Yes (payment process URL; calls from our server) |
| Server callback to unlock the pass | Yes, with 7 retries; verify with a lookup, not the success page | Yes (notify URL) | Yes (notify URL, then our server approves the transaction) |
| Automatic receipt or invoice | Yes, through the same call (receipt, tax invoice, both); "receipt without VAT" for osek patur | Yes ("Digital Invoice", stated as Tax Authority approved) | Yes, at no extra cost |
| Bit, Apple Pay, Google Pay | Bit, Google Pay; Apple Pay listed | Bit, Google Pay; Apple Pay after domain check | All three, per the FAQ |
| Payment-page languages | Hebrew, English, Russian, Arabic | Hebrew, Arabic and others; English not in the list read | Not stated |
| Published fee | "From 1.2%"; Bit 1.6% (starting price, not a quote) | Not published (mobile payments "from 29 shekels a month") | 0.75% plus 59 shekels a month (annual plan) or 69 (monthly), up to 100 transactions; another page says "from 0.9%" (conflict) |
| Why it fits | Best-documented developer route with Arabic and English pages | Arabic page and a clear callback; fee needs a quote | Lowest published fee and free receipts; languages to confirm |

All fees exclude VAT and come from the providers' own pages as read on 22 Nov 2026; confirm in writing before signing.
If the owner wants the least work and keeps his books in Morning (formerly Green Invoice), Morning's payment add-on
runs on Grow with published fees (1.6% or 1.4% plus 1.2 shekels a payment) and automatic documents; its API and
callbacks on lower plans are reported only by a third party (UNVERIFIED).

---

## 4. Later: selling in Europe
- **GDPR** applies once we offer the service to people in the EU: an EU representative for a non-EU business, a lawful basis, records, breach notice within 72 hours (general knowledge, not re-verified).
- **Children's consent age** under GDPR is 16 by default, which member states may lower to 13; Denmark is reported as 13, but sources conflict (one says 15; a 2025 report says Denmark planned to raise it). UNVERIFIED. Our accounts are adult-held, but a child's nickname is still data about a child.
- **Cookies**: consent needed for non-essential cookies under the ePrivacy rules as applied in Denmark (UNVERIFIED).
- **VAT**: a non-EU seller of digital services to EU consumers can register in the Non-Union One Stop Shop in one member state, with no threshold, charging the buyer's country's rate and keeping proof of location (SECONDARY SOURCE). Danish VAT 25% (general knowledge, not re-verified).
- **Right of withdrawal**: 14 days under the EU Consumer Rights Directive, which can be lost for digital content once the buyer asks for immediate supply and accepts losing the right (general knowledge, UNVERIFIED).
- **Payments**: PayPal on top of an Israeli provider for foreign currency (3.40% plus 1.20 shekels domestic, plus 1-2% for foreign senders, per PayPal Israel's page).
- Until then: limit checkout to Israeli buyers and say so on the plans page.

---

## 5. Questions for the lawyer (in one list)
1. Does any exception in the 2010 Cancellation Regulations cover online access passes? How much may be deducted for a pass already used (14ה(ב1))?
2. Does a web-only seller have to accept cancellation by phone and by registered mail (14ט(א))?
3. Does section 13א apply to 1, 3 and 12-month passes that never renew?
4. Is a trial or pass reminder with a plain link to the passes page a service message or an advertisement?
5. Is "פרסומת" required in Hebrew in Arabic, English and Danish emails, or is a translation enough?
6. Which language version of the terms prevails; is the tax receipt in Hebrew or English enough for Arabic and Danish buyers?
7. What ID number and address must a sole trader show, and can a business address replace a home address?
8. The current wording of Privacy Law sections 11, 13 and 14 and the deadlines for answering requests.
9. Is a child's nickname plus age group outside the sensitive categories, and is a parent's consent for it enough?
10. What may be kept after an account is deleted (tax records, a trial record to stop repeat trials)?
    - **Built, waiting for this answer (22 Nov 2026):** a trial record now exists so that deleting an account and
      signing up again with the same email does not give a second free trial (product checklist: "trial is one per
      account", "no second trial after deletion"). It holds no email and no name: only a salted SHA-256 of the
      address (lower case, trimmed; the salt is secret and never leaves the database) and the day the trial started.
      It is kept when the account is deleted, is reachable by no user or by the owner's screens, and is used only to
      refuse a second trial. Where: `private.trial_ledger` (migration `20261122110000_review_fixes.sql`). For the
      lawyer: is this personal data (a hash of an email is still linkable by someone who knows the address), how
      long may it be kept (proposal: 2 years, not yet enforced), and what must the privacy policy say about it?
11. Are the accessibility exemption figures (100,000 shekels, 500 participants, 60 days) current, and is there an amendment after 2020?
12. Cookie rules and unfair-terms rules for the terms of use.
13. Copyright: the sections on written assignment and employee works; what the sale of the site must include.
