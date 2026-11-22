# StoryTime product checklist (definitive build list, 22 Nov 2026)

**In three lines:** every screen, state and email the site must have, sorted by where it appears. Each line is one
thing that must exist, a tag (MUST = needed before paying customers, SHOULD = build now unless time runs short,
LATER = after launch) and where it came from. Nothing here contradicts the owner's requests A1 to T5.

**Product in one breath:** four languages (Arabic, Hebrew, English, Danish; Arabic and Hebrew right-to-left); three
age groups 2-3, 4-5, 6-8 (Plan §14); a pass per age group for 1, 3 or 12 months, paid once, never renewing (Plan §3.5);
a free trial of 3 stories for 3 days with every feature (Plan §2, C6); accounts belong to adults (parents and
kindergarten teachers); a child is a profile with a first name or nickname and an age group.

**Source key**
- `A1`...`T5`: the owner's requests in `docs/REQUESTS-ORGANIZED.md`.
- `Plan §n` / `Plan S4`: `docs/MASTER-PLAN.md` section n, or Stage 4 of section 10.
- `Rule n`: hard rule n in `CLAUDE.md`.
- `Ref #n (Site)`: item n of the checklist in `docs/research/reference-sites-raw.md` and the site it was seen on
  (Netflix, Epic, Duolingo, ElevenLabs). "(inferred)" there stays inferred here.
- `Law x.y`: section x.y of `docs/research/israel-law-raw.md`. Details and confidence in `docs/LEGAL-CHECKLIST.md`.
- `Pay`: `docs/research/payment-companies-raw.md`.
- `Gap`: a state people forget, added from common practice (ux-heuristics, signup, paywalls, emails skills as advice).

---

## 0. Rules that apply to every screen
- **MUST** · Every visible word comes from the typed dictionaries in all four languages; a missing key fails the build. · Rule 5
- **MUST** · Arabic and Hebrew pages mirror the layout with logical CSS (start/end); art is not mirrored; Arabic is never letter-spaced or split. · Rule 5
- **MUST** · Phone first; Safari on iPhone is the main test browser; large touch targets; no hover-only controls; nothing hidden. · Rule 7, S1, S2
- **MUST** · Children's screens work by pictures and big touch areas, not menus of words. · Plan §4, Rule 7
- **MUST** · Every moving part has a still rest state (reduced motion, slow device, no WebGL). · Rule 8
- **MUST** · Paid story text, pictures and films are fetched only for accounts with an active trial or pass; never in the public bundle or prerendered pages. · Rule 6, Plan §13
- **MUST** · Built to WCAG 2.x level AA (Israeli standard 5568), whether or not the small-business exemption applies. · Law 4, S1
- **MUST** · No invented facts anywhere: prices, reviews, user counts and results are real or visibly marked placeholders. · Rule 4, Law 6
- **MUST** · Every page has a loading state, an error state that names the next step, and an offline message. · Gap, Ref #126, #136
- **MUST** · The preview is hidden from search engines (noindex) and labelled as a preview. · Plan §2, §13
- **MUST** · Footer on every public page: Terms, Privacy, Refunds and cancellation, Accessibility statement, Credits, Help, Contact, language picker, business details (name, ID number, address), and the "Cancel a purchase" link. · Ref #110 (all four), Law 1.1, 1.5
- **MUST** · Language choice remembered between visits and across devices once signed in. · Ref #7, #66, #122 (Netflix, Duolingo)
- **SHOULD** · Confirmation message after every action ("Pass cancelled. Refund on its way."), with the real date. · Ref #132, #137

## 1. Landing page (public, four languages)
- **MUST** · One main action above the fold ("Start free trial") plus a small "Sign in". · Ref #1 (Netflix, Duolingo)
- **MUST** · A creative showing of what each story contains: book, read-along, film, activity, shown by opening a real book. · N1, Plan S8
- **MUST** · The 3D hero: a few code-built characters, a switcher, 7 to 10 shared gestures (no running). · Plan §2
- **MUST** · The values message to parents and teachers (respect for the elderly, for classmates, being good to one's mother, numbers). · N2, D6
- **MUST** · Any claim about effects on behaviour, work or ability as an adult appears in public only with a real source; until the papers arrive it is not published. · N3, Rule 4, Law 6
- **MUST** · The impact graph uses sample numbers labelled "illustration" on the preview only; it goes public only with the owner's papers. · N4, N6, Plan §3.10
- **MUST** · "Who is it for" choice: parent or kindergarten teacher, each with its own benefit lines. · Ref #2, #9 (Epic)
- **MUST** · Age-group chips (2-3, 4-5, 6-8) with a teaser shelf of covers and titles; locked items marked; no paid text or pictures. · Ref #5, #6 (Epic), Rule 6
- **MUST** · Trial terms near the top in plain words: 3 stories, 3 days, every feature, no card needed, what happens after. · Ref #3, #39, C6
- **MUST** · Pass prices with VAT in shekels (or visibly marked placeholders); for 3 and 12 months the total and the per-month figure; the words "paid once, does not renew". · Ref #4, #44 (Epic), Law 1.2, Rule 4
- **MUST** · A clearly labelled "Cancel a purchase" link visible on the home page, with the cancellation methods and contact details beside it. · Law 1.5 (section 14ט)
- **MUST** · Language picker visible at the top and in the footer. · Ref #7 (Netflix, Duolingo)
- **MUST** · Questions and answers section. · Plan S8
- **MUST** · Shorter than the old 15 screens. · Plan S8
- **MUST** · No age, season or single story's look becomes the brand. · B1-B3, Rule 2
- **SHOULD** · Teacher section: classroom mode on a big screen, the "in a class" note on each activity. · Plan §3.6
- **LATER** · Gift pass and redeem-a-gift (strong for grandparents). · Ref #13, #64 (Epic, Netflix)
- **LATER** · App-store badges. · Ref #11

## 2. Plans page (public)
- **MUST** · Three pass cards per age group: 1, 3, 12 months; best-value mark on the longest; price with VAT in shekels; total and per-month. · C3, C4, Ref #43 (Epic), Law 1.2
- **MUST** · Every pass includes every feature; no feature table that suggests otherwise. · C5
- **MUST** · Plain statements: "paid once", "does not renew", "ends on [date]", "reminders by email before it ends", "one account can hold passes for two age groups". · Plan §3.5, Ref #44
- **MUST** · What is sold, how and when it is supplied (instant access online), how long the offer is valid, and the right to cancel within 14 days with the fee rule, all on this page before buying. · Law 1.1 (14ג(א)), Law 1.3, 1.4
- **MUST** · Short refund and cancellation summary with a link to the full page. · Ref #50, Law 1.4
- **MUST** · Business details (name, ID number, address) reachable from this page. · Law 1.1
- **SHOULD** · "Which age group?" helper: one line per group in plain words. · C3
- **LATER** · Teacher or school licence with a request form. · Plan §3.6, Ref #53 (Epic)
- **LATER** · Promo code field. · Ref #51 (Duolingo)

## 3. Sign-up
- **MUST** · Email and password; show/hide password; one plain strength hint. · Ref #16, #21
- **SHOULD** · Sign in with Google. If added, explain that the email of a Google account cannot be changed here. · Ref #16, #69 (ElevenLabs)
- **LATER** · Sign in with Apple (needed only if a native iPhone app ships). · Ref #17
- **MUST** · "Already have an account? Sign in" beside the form. · Ref #18 (ElevenLabs)
- **MUST** · Line "Accounts are for adults" and a tick box "I am 18 or older". · Ref #22, #23 (Epic)
- **MUST** · Agreement line with links to Terms and Privacy, recorded with the terms version and time (consents table). · Ref #19 (ElevenLabs), Law 3.1, Plan §13
- **MUST** · A separate, unticked box for news by email ("new stories"), recorded with time and source; sign-up works without it. · Law 5, Plan S4
- **MUST** · No phone number asked. (A mobile number would trigger an SMS end-date duty under section 13א if it applies; not needed.) · Law 1.6, Gap
- **MUST** · Step counter and a Back button if the flow has more than one step. · Ref #28, #131 (Netflix)
- **MUST** · Error states: email already used (offer "Sign in" and "Forgot password"); invalid email; weak password; network error; too many tries (wait message). · Ref #27, Gap
- **MUST** · Choosing the age group (the plan) is part of sign-up or the first onboarding step. · O1, C3
- **MUST** · Trial is one per account; the abuse check is described in the privacy policy if it uses any device data. · Plan §13, Law 3.1
- **SHOULD** · Field labels above fields, the right keyboard on phones (email keyboard), autofill allowed. · Skill: signup

## 4. Email confirmation
- **MUST** · "Check your inbox" screen naming the address, a resend button (with a short wait between sends) and "wrong address? change it". · Ref #20, Gap
- **MUST** · Confirmation link opens the site signed in and continues onboarding where it stopped. · Gap
- **MUST** · Expired or used link: a friendly page with "Send a new link". · Gap
- **MUST** · Unconfirmed account that tries to sign in: told to confirm, with resend. · Gap
- **MUST** · Confirmation email in the user's chosen language (sent through the auth email hook). · P1, Plan §13

## 5. Onboarding (after confirmation)
- **MUST** · Step 1: "I am a parent" or "I am a kindergarten teacher". · Plan §3.6, Ref #24, #32 (Epic)
- **MUST** · Step 2: age group (if not chosen at sign-up). · O1, Ref #29
- **MUST** · Step 3: child profile: first name or nickname and age group only; no surname, photo or birth date. Teacher: a class name instead (see open decision 9). · Ref #31, #77 (Epic), Law 3.1
- **MUST** · Step 4: language of stories, voice, captions and activity captions (defaults to the site language). · Plan §4, L5, H4
- **MUST** · A Skip on every question that is not needed for access; sensible defaults. · Ref #34
- **MUST** · A screen that states what the trial holds: which 3 stories, 3 days, the end date and time, what happens after. · Ref #36, #39
- **MUST** · Onboarding ends inside the first story within seconds. · Ref #35
- **LATER** · Reading preferences, reminder times. · Ref #37, #38

## 6. First story (the first success moment)
- **MUST** · Opens straight onto the storybook page of trial story 1 for that age group. · Ref #35
- **MUST** · A small, dismissable hint showing the four choices (Read, Listen, Watch, Do). · E2, S2
- **MUST** · Trial counter visible somewhere calm: "2 days left · 1 of 3 stories opened". · Ref #40

## 7. Profile picker, library and bookshelf
- **MUST** · After sign-in: profile picker with big avatars (one per child or class); skipped if only one profile. · Ref #84 (Netflix, Epic)
- **MUST** · Redesigned bookshelf in the new style showing the age group's stories; trial stories open, others marked locked during the trial. · Plan §2, Plan S4
- **MUST** · "Continue where you left off" per profile. · Ref #123
- **MUST** · Progress saved automatically per profile (pages read, film watched, activity done). · Ref #124
- **MUST** · Favourites ("my shelf") per profile. · Ref #128
- **MUST** · A story listed in two age groups opens under a pass for either. · Plan §3.2, §13
- **MUST** · Empty states: "No favourites yet", "Nothing started yet", "No stories in this group yet" (owner area not filled). · Ref #125
- **MUST** · Loading state for the shelf (cover skeletons) and a retry on failure. · Ref #126
- **SHOULD** · Up to 5 profiles per account. · Ref #83 (Netflix)
- **LATER** · Badges and rewards (no pressure on children). · Ref #130

## 8. Collections (all stories, all films, all activities)
- **MUST** · Three collections reachable from the main navigation: all stories, all films, all activities. · M1
- **MUST** · A film plays right there in the collection, in the same player as everywhere. · M2, Plan §4
- **MUST** · An activity opens right there in the collection, complete. · M2
- **MUST** · Every item has a clear link to its storybook page. · M3
- **MUST** · Filter by age group; locked items marked with what unlocks them. · C3, Gap
- **MUST** · Empty, loading and error states as in section 7. · Gap

## 9. Storybook page (one per story)
- **MUST** · Read, Listen, Watch, Do: four large buttons, all visible, none behind a menu. · E1, E2, S2, Plan S4
- **MUST** · Each story has text, pictures, read-along audio, film and activity; a story without an activity is allowed only rarely, and then the Do button is replaced by an honest note, not hidden. · E3, K8
- **MUST** · Until the voice exists (Stage 10), Listen is not shown to the public as a button that does nothing; the preview uses a test recording. · Plan S10 (see open decision 3)
- **MUST** · Owner's own stories labelled as StoryTime's; the author's story credited to her. · Rule 3
- **MUST** · Locked state (no pass for this group, trial over): cover, title and a short line visible; buttons open the pass offer behind the parent gate. · Ref #45, Rule 6

## 10. Book reader
- **MUST** · Page curl (carried-over engine), right-to-left page order for Arabic and Hebrew. · Plan §6, Plan S4
- **MUST** · Words woven into the picture on soft paper areas, as real text a screen reader can read; space sized for the longest language. · F1, F2, Plan S4
- **MUST** · Text-size control, with a test that fails if text drops below its minimum. · Plan S4, §13
- **MUST** · Listen button that reads the open page; also present in the reduced-motion book. · G1, Plan §13
- **MUST** · A separate, obvious auto-flip switch; when on, the page turns when that page's audio ends; the setting is remembered. · G2, G3, Plan S4
- **MUST** · Arabic vowel marks per the agreed rule (not on the author's story without her written consent). · F3, F4, Rule 3
- **MUST** · Loading state for page images; error on a failed page with retry; offline message. · Gap
- **MUST** · Session or pass ends mid-reading: the current page finishes, then a calm "your access ended" screen; progress kept. · Gap, Ref #46
- **SHOULD** · Hebrew vowel marks where they improve the voice. · F6

## 11. Film player
- **MUST** · One elegant player (Media Chrome), opens without lag, smooth on phones, iPhone full-screen fixes carried over. · H2, H3, Plan §14
- **MUST** · Captions in the same language as the voice; captions on/off remembered in settings. · H4, Plan S4
- **MUST** · Right-to-left control layout and Hebrew and Arabic labels. · Plan §14
- **MUST** · Short-lived film links handed out only to accounts with access; an expired link refreshes silently. · Plan §13, Gap
- **MUST** · Loading, buffering, error (with retry) and offline states. · Gap
- **MUST** · Owner can upload a film for each story. · H1

## 12. Activity page
- **MUST** · Goal, what you need (cheap or free, from home or nature), illustrated steps with very short captions, safety note, the full idea explained for the adult, the "in a class" note. · K1-K7, L1, L4, Plan S4
- **MUST** · Some steps as short looping moving pictures; one fixed cast of teacher, parents, grandparent, children (not the story characters). · L2, L3, Plan S3
- **MUST** · Captions in the user's chosen language. · L5
- **MUST** · Moving steps have a still version for reduced motion. · Rule 8
- **SHOULD** · Print-friendly view of the materials list. · Gap

## 13. Settings (behind the parent gate)
- **MUST** · Language; auto-flip; captions; profiles (add, rename, change age group, delete); passes; delete account. · Plan S4, Ref #65
- **MUST** · Name and email shown; change email with a confirmation link to the new address and a notice to the old one. · Ref #69, #104
- **MUST** · Change password; "forgot password" from the sign-in page. · Ref #67
- **MUST** · Child's age group can change as the child grows. · Ref #87
- **MUST** · Deleting a profile warns that its progress is removed; deleting the last profile is allowed with a plain warning. · Ref #81, #82
- **MUST** · Email preferences: news on/off (marketing); service emails explained as always sent. · Ref #73, Law 5
- **MUST** · Delete account: plain warning (what is removed, what is kept for tax records, that an active pass is lost and how a 14-day cancellation differs), type the email to confirm, confirmation email. · Ref #70 (ElevenLabs), Law 1.3, Law 2
- **MUST** · "Get a copy of my data" and "correct my data": at least a request form or email route at launch. · Ref #71, Law 3.5
- **MUST** · Payment history with links to receipts. · Ref #59 (Netflix)
- **SHOULD** · Self-serve data download. · Ref #71
- **LATER** · Sign out on all devices; profile PIN. · Ref #72, #80

## 14. Passes and trial (what the user sees)
- **MUST** · Trial: 3 owner-chosen stories for the chosen age group, every feature, 3 days from the trial start, no card. · Plan §2, C6, Ref #42
- **MUST** · Trial counter: days and hours left, stories used. · Ref #40
- **MUST** · Trial never turns into a paid pass; a pass starts only by a fresh, explicit purchase. · Law 1.6
- **MUST** · Trial ended: content locks; account, profiles, favourites and progress kept; one calm screen "Your trial has ended" with "See passes" (parent gate) and "Not now". · Ref #45 (ElevenLabs), Skill: paywalls
- **MUST** · Pass page: each pass with age group, start date, end date, days left, status (active, ending soon, ended, cancelled, refunded). · Ref #56, Plan §3.5
- **MUST** · Pass ended: that group's content locks; profiles and progress kept; "Buy a new pass" (parent gate). · Ref #46
- **MUST** · Two passes for two age groups at once; ending one leaves the other open. · Plan §3.5
- **MUST** · Buying a pass while one is active for the same group: the new one starts when the current one ends (state the dates before paying). · Gap
- **MUST** · Returning user signs in and buys a new pass; nothing is lost. · Ref #54 (Netflix)
- **MUST** · "Cancel this purchase" on each pass within the cancellation period, with the refund amount rule shown before confirming. · Law 1.3-1.5 (see section 19)
- **MUST** · Owner-side change of trial stories does not take stories away from a running trial. · Gap
- **LATER** · Pause; promo codes; gift passes. · Ref #49, #51, #64

## 15. Checkout (test first, then real payment)
- **MUST** · Test checkout behind the same adapter interface until the payment company is connected; marked "test" on screen. · Plan S4, §13
- **MUST** · Summary before paying: pass, age group, length, start and end date, total with VAT in shekels, "does not renew", link to cancellation rights, business details, terms tick box. · Ref #56, Law 1.1, 1.2
- **MUST** · Real payment on the payment company's hosted page (no card data on our servers). · Ref #57, Pay
- **MUST** · The pass is unlocked only by the payment company's server callback, checked once (provider_events), never by the success page alone. · Pay (Cardcom note), Plan §13
- **MUST** · States: processing (do not close), success (pass active, receipt on its way), failed (reason if given, "try again", nothing charged), cancelled by user, callback late ("we are confirming your payment"), duplicate click. · Ref #60, Gap
- **MUST** · Hosted page in the buyer's language where the company supports it (Hebrew, Arabic, English documented for some; Danish nowhere). · Pay
- **SHOULD** · Bit, Apple Pay and Google Pay on the hosted page. · Ref #58, Pay
- **SHOULD** · Optional "receipt in the name of" field (kindergarten or business name and number) for teachers. · Law 2
- **LATER** · Foreign buyers and other currencies (PayPal on top). · Pay, Ref #63

## 16. Receipts
- **MUST** · A legal receipt (osek patur) or tax invoice-receipt (osek murshe) for every payment and a credit document for every refund, issued by the payment company's invoicing. · Law 2, Pay
- **MUST** · A purchase confirmation (the "transaction document") in the buyer's language with: business name, ID number, address, what was bought, price with VAT, pass dates, how to cancel and the contact details. · Law 1.1 (14ג(ב)), Law 1.5 (14ט(ו))
- **MUST** · Receipts listed in Settings, payment history. · Ref #59
- **SHOULD** · Support for an Israel Invoice allocation number if a business buyer needs one (threshold in the legal checklist). · Law 2

## 17. Parent gate
- **MUST** · Before settings, passes, purchases, profile editing, sign-out and any outside link: a gate a small child cannot pass (the account password or an adult question). · Ref #78, #79 (Epic, Netflix)
- **MUST** · Children's screens have no route to account, payment or outside sites. · Ref #78
- **MUST** · Gate works in all four languages and by voice-free reading for adults; wrong answer shows calm retry. · Gap
- **LATER** · Optional profile PIN with "Forgot PIN?". · Ref #80, #135

## 18. Teacher and classroom mode
- **MUST** · Same account type with the teacher choice at sign-up. · Plan §3.6
- **MUST** · Classroom mode: full screen, big text, no profile picker, controls reachable from a distance; works on a projector or big screen. · Plan §3.6, Ref #93
- **MUST** · "In a class" note on every activity. · Plan §3.6
- **SHOULD** · Short "privacy promise for kindergartens" page. · Ref #94 (Epic)
- **LATER** · Class licence, assigning stories, class reports, moving between home and class accounts. · Plan §3.6, Ref #88-#91, #95

## 19. Cancelling a purchase (the law's route, adapted to passes)
Our passes never renew, so there is no "cancel subscription" button. The law still requires a cancellation route for
a distance sale (Law 1.3-1.5). The two are reconciled like this:
- **MUST** · A "Cancel a purchase" link on the home page (and every footer), clearly labelled, with the cancellation methods and contact details printed beside it. · Law 1.5 (14ט(ב), (ו))
- **MUST** · It opens a page explaining the 14-day right in plain words and offering: signed in, pick the pass and confirm; signed out, a form with email and order number; plus the email address and postal address for cancelling. · Law 1.5 (14ט(א))
- **MUST** · Confirming shows the refund rule before the final tap: refund within 14 days, fee at most the lower of 5% or 100 shekels, and any deduction for service already used only if the lawyer confirms it applies. · Law 1.4
- **MUST** · After confirming: access to that pass ends, profiles and progress stay, a written confirmation email goes out, the owner's area shows the request. · Law 1.4, Gap
- **MUST** · The trial needs no cancellation (nothing is charged); the page says so. · Law 1.6
- **SHOULD** · A way to cancel by phone if the lawyer confirms it is required (see open decision 2). · Law 1.5

## 20. Owner's area (role: owner)
- **MUST** · Sign-in as owner only; every change written to the audit log. · Plan §13
- **MUST** · Add or edit a story in four languages: title, text (book script), page layout, film script, with sign-off per language and draft or published state. · Plan §4, Plan S4
- **MUST** · The author's story is locked against edits without her written consent. · Rule 3
- **MUST** · Upload pictures (or use Studio output) per page; upload a film per language with its caption file. · H1, Plan §13
- **MUST** · Add an activity: goal, materials, steps with pictures or loops and captions, safety note, adult explanation, class note, in four languages. · K, L, Plan S4
- **MUST** · Set one or more age groups per story; choose the 3 trial stories per age group. · Plan S4, §3.2
- **MUST** · Publish and unpublish; preview a draft as a parent would see it. · Plan S4
- **MUST** · See sign-ups, trials, passes and orders (email, role, dates, status); children's names not shown here. · Plan S4, Law 3.1
- **MUST** · Process a cancellation and refund: mark it, trigger the refund through the payment company, record the credit document. · Law 1.4
- **MUST** · Record the source and licence of every uploaded file (ownership pack). · Plan §3.8, §13, Law 7
- **SHOULD** · Edit pass prices per age group and length (placeholders until set). · Plan §11
- **SHOULD** · Read contact messages and reply from one place. · Plan S4
- **SHOULD** · Two-step sign-in for the owner account. · Gap
- **LATER** · Export of sign-ups for the accountant. · Gap

## 21. Help and contact
- **MUST** · Help page with questions grouped: Using StoryTime, Account, Passes and payments, Privacy and children. · Ref #115 (Duolingo)
- **MUST** · "How to cancel a purchase" answer findable from the footer. · Ref #117, Law 1.5
- **MUST** · Contact form plus a support email address; confirmation on screen; reply sent by email. · Ref #116 (Epic), Plan S4
- **MUST** · Contact form errors: missing fields, send failed (keep the text, retry). · Gap
- **LATER** · Phishing warning article. · Ref #119

## 22. Legal pages (content in `docs/LEGAL-CHECKLIST.md`)
- **MUST** · Terms of use; Privacy policy with a children's section; Refunds and cancellation; Accessibility statement; Credits and licences; business details page. All in four languages, marked as drafts for a lawyer until reviewed. · R1, Plan S9, Law 1-7
- **MUST** · Cookie notice: in the privacy policy if only necessary cookies are used; a consent banner if analytics or other optional cookies are ever added. · Ref #109, Law 8
- **SHOULD** · Kindergarten privacy promise (short). · Ref #94

## 23. Errors and empty states (one list so none is missed)
- **MUST** · Wrong password: plain message, "Forgot password?" link, no hint whether the email exists beyond what sign-up already shows. · Ref #27, Gap
- **MUST** · Email already used (sign-up): offer sign-in and reset. · Ref #27
- **MUST** · Unconfirmed email: resend link. · Gap
- **MUST** · Expired or used link (confirmation, reset, email change): "This link has expired" with a button for a new one. · Ref #104, Gap
- **MUST** · Expired trial and expired pass: the calm lock screens in section 14. · Ref #45, #46
- **MUST** · Deleted account: signing in shows "no account with this email"; signing up again with the same email is allowed, without a second trial if the lawyer agrees records of past trials may be kept (open decision 8). · Gap
- **MUST** · Offline: a banner "You are offline" and a retry; nothing crashes. · Gap
- **MUST** · Not-found page with navigation kept and a contact link. · Ref #14 (Epic)
- **MUST** · Server error page with retry and contact. · Ref #136
- **MUST** · Payment failed, payment pending, payment cancelled (section 15). · Ref #60
- **MUST** · Content not yet published in a group: friendly empty shelf. · Ref #125
- **MUST** · Session expired: sign in again and return to the same page. · Gap
- **MUST** · Film or audio fails to load: message plus retry; the book still readable. · Gap
- **LATER** · Offline downloads. · Ref #127

## 24. Emails
All emails: in the user's chosen language, right-to-left where needed, plain-text version, sender name "StoryTime",
a real reply-to, the business name and address in the footer, no tracking pixels. Subject lines plain and specific
("Your trial ends tomorrow"). · Ref #106, #108, Plan S4, Skill: email-best-practices

"Service" = an account or purchase message; it must not contain an offer or a push to buy, or it may count as an
advertisement (Law 5; where the line falls is unverified). "Marketing" = needs prior opt-in, the word "פרסומת" at
the start of the subject, sender name, address and contact, and a simple refusal route with a valid email address (Law 5).

| # | Email | Trigger | Purpose | Type | Tag · Source |
|---|---|---|---|---|---|
| 1 | Confirm your email | Sign-up | Link to confirm; expiry stated; "not you? ignore" | Service | MUST · P1, Ref #96 |
| 2 | Welcome | Email confirmed | How to start; link to the first story; trial terms and end date | Service | MUST · Plan S4, Ref #97 |
| 3 | Trial started | First trial story opened (or merged into 2 if the same moment) | The 3 stories, end date and time | Service | MUST · Plan S4 |
| 4 | Trial ends tomorrow | 24 hours before trial end | Facts: end time, what locks, what is kept; link to the passes page; no offer | Service | MUST · Plan S4, Ref #41, #98 |
| 5 | Trial ended | Trial end | Content locked, profiles kept; link to passes page; no offer | Service | MUST · Plan S4, Ref #99 |
| 6 | Purchase confirmation (transaction document) | Payment callback success | Business name, ID number, address; what was bought; price with VAT; start and end dates; how to cancel and contacts | Service, legally required | MUST · Law 1.1, 1.5 |
| 7 | Receipt | Payment callback success | The legal receipt or tax invoice-receipt (from the payment company or attached) | Service, legally required | MUST · Plan S4, Law 2 |
| 8 | Pass started | Pass start (same moment as 6 for an immediate pass; separate for a queued pass) | Access open, end date | Service | MUST · Plan S4 |
| 9 | Pass ends in 7 days | 7 days before end (skip if pass shorter) | Facts and end date; no offer | Service | MUST · Plan S4, Ref #101, Law 1.6 |
| 10 | Pass ends tomorrow | 1 day before end | Facts and end date; no offer | Service | MUST · Plan S4, Ref #101 |
| 11 | Pass ended | Pass end | Content locked, profiles and progress kept | Service | MUST · Plan S4 |
| 12 | Cancellation received and refund confirmation | User cancels a purchase | Written confirmation, refund amount, fee if any, refund date within 14 days | Service, legally required | MUST · Law 1.4 |
| 13 | Refund issued | Refund done by payment company | Credit document, amount | Service | MUST · Law 2 |
| 14 | Password reset | Request | Link with expiry; "not you?" line | Service | MUST · Plan S4, Ref #104 |
| 15 | Email change: confirm new address | Change requested | Link to the new address | Service | MUST · Ref #69 |
| 16 | Email address changed | Change confirmed | Notice to the old address with "not you? contact us" | Service | MUST · Plan S4, Ref #104 |
| 17 | Password changed | Password changed | Notice with "not you?" | Service | SHOULD · Gap |
| 18 | Account deleted | Deletion done | What was removed and what is kept for tax records | Service | MUST · Plan S4 |
| 19 | Contact reply | Owner replies | The answer | Service | MUST · Plan S4 |
| 20 | Contact received | Form sent | "We got your message" | Service | SHOULD · Gap |
| 21 | Data request received | Copy, correction or deletion requested | Acknowledgement and next step | Service | SHOULD · Law 3.5 |
| 22 | New story | Story published in a group the user has | News of the story | Marketing (opt-in only, "פרסומת" in subject, unsubscribe) | MUST · Plan S4, Law 5 |
| 23 | Owner alerts | New purchase, cancellation, contact message | Tell the owner | Internal | SHOULD · Gap |
| 24 | Payment problem | Callback reports a problem after the buyer left | What happened, nothing charged or how it is fixed | Service | SHOULD · Ref #60 |
| 25 | Come back (win-back) | Some time after a pass ends | Invitation and offer | Marketing (opt-in only) | LATER · Ref #103 |
| 26 | New sign-in alert | Sign-in from a new device | Security notice | Service | LATER · Ref #105 |

- **MUST** · Every marketing email has a working one-click unsubscribe and a valid reply address for refusals; the opt-out is recorded at once. · Law 5, Ref #106
- **MUST** · Bounces and unsubscribes recorded (email_log). · Plan §13
- **MUST** · Exact wording of every email written in four languages. · P2, A12

---

## Conflicts and open decisions
1. **No subscription, but a cancellation link is required.** The references put "cancel" inside a subscription (Netflix, ElevenLabs); we have none. The law (14ט(ב)) still wants a prominent cancellation link on the home page for a distance sale. Decision taken: a "Cancel a purchase" link and page (section 19), not a "cancel subscription" button.
2. **Cancelling by phone and post.** Section 14ט(א) lists phone or oral notice and registered mail among the ways a trader must accept cancellation (secondary copy of the law). The reference checklist said a phone line "does not fit". The site needs a postal address in any case (14ג(א)); whether a phone line is also needed is for the lawyer.
3. **Listen visible versus no voice yet.** The owner wants Read, Listen, Watch, Do all visible (E2, G1); the plan holds the recorded voice until Stage 10 and forbids a Listen button that does nothing. Resolution: the site opens to paying customers only after the voice; the preview uses a test recording. If the owner wants to sell earlier, Listen must be hidden, which breaks E2.
4. **The impact graph and the "adult life" message** (N3, N4, N6) versus the ban on misleading claims about a service's benefit (Law 6) and Rule 4. Sample numbers stay on the preview only; public use waits for the owner's papers and a lawyer's look at the wording.
5. **Refunds on a pass already used.** Epic is "mostly non-refundable"; Israeli law gives 14 days to cancel a service with a capped fee, and may allow charging for service already received (14ה(ב1), paraphrase, unverified). No digital-content exception was found. The refund page cannot say "non-refundable"; the exact deduction is for the lawyer.
6. **Reminder emails versus the spam law.** The owner's plan has trial and pass reminders; they stay service messages only if they carry no offer. Whether a plain "see passes" link is acceptable is unverified. Until the lawyer answers, reminders carry facts and a link to the account's passes page, no discount.
7. **Legal documents in four languages.** The transaction document must be in Hebrew or the language of the marketing (14ג(ב)); the site markets in four. Purchase confirmations and terms therefore exist in all four. Which language version prevails, and whether the payment company's tax receipt (documented in Hebrew and English only) is enough for Arabic and Danish buyers, is for the lawyer and accountant.
8. **Deleting an account versus keeping records.** Deletion must remove personal data (privacy rights, unverified detail), but tax records must be kept (period not in the research) and a trial record helps stop repeat trials. Decision needed on what minimal record stays.
9. **Teachers and other people's children.** Onboarding asks for child profiles (Plan S4), but a teacher would type names of children who are not hers, whose parents have not agreed. Recommendation: a teacher's profile is a class (class name and age group), with no child names. Owner to confirm.
10. **Accessibility exemption.** A small exempt dealer is likely exempt from the website accessibility rules (Law 4), but the owner wants everything easy for everyone (S1) and the plan sets WCAG AA. We build to AA and publish an accessibility statement anyway.
11. **Danish site, Israeli sales.** All four languages can use the trial (Plan §2), but selling is Israel only. A Danish visitor who buys brings EU rules (VAT, GDPR, withdrawal right). Decision: checkout limited to Israeli buyers at launch (say so on the plans page), or accept the EU duties.
12. **Cookies.** Epic shows a consent banner first; the Israeli research did not cover cookies. Plan: no optional cookies or analytics at launch, so no banner; revisit before adding any analytics.
13. **Business details on the site.** The law asks for name, ID number and address of the trader (14ג(א)). For a sole trader that may be a personal ID number and home address. Who is the trader (the owner, or the buyer after the sale) and which address is shown is the owner's decision with the lawyer.
14. **Age groups.** C1 asked for an official Israeli source; the owner later accepted child-development groups (Plan §2, §14: 2-3, 4-5, 6-8). Not open; listed so nobody reverts it.
15. **Email already used versus revealing accounts.** Telling a visitor "this email has an account" helps parents but reveals who is a customer. Chosen: show it on sign-up (helpfulness wins for a family product); never on the reset screen.

## Things only the owner can supply
- Prices per age group and length (placeholders until then).
- The business: registration type (exempt or licensed dealer), business name, ID or company number, address to show, support email; whether a phone line is offered.
- The payment company account and its invoicing set-up; an accountant's yes on receipts and refunds.
- A lawyer's review of the legal pages and the answers to open decisions 2, 4, 5, 6, 7, 8, 11, 13.
- Yes to a new Supabase project, a web address, a Cloudflare account and an email-sending account.
- The author's written permission for her story (and for any vowel marks).
- The research papers behind the impact graph and the "adult life" message.
- The cartoon reference and the choice of instruction-picture style.
- A native reader per language for stories, emails and legal pages.
- The paid voice plan before opening to customers.
- Confirmation of the teacher model (class profile without child names) and of Israel-only checkout.
