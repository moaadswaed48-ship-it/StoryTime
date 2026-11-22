# Reference sites: raw research (Netflix, Epic, Duolingo, ElevenLabs)

Method: public pages only, no accounts, no forms. Sources are beside each point. "(inferred)" = not seen directly. Research date: 2026-11-22. Many sign-up pages are JavaScript-rendered and cannot be read without interaction, so some sign-up details are marked inferred or unverified.

## 1. Netflix

### Path of a new visitor
- Home page asks for one thing only: an email address and a "Get Started" button; headline "Ready to watch? Enter your email to create or restart your membership." The same form repeats at the bottom of the page. Source: https://www.netflix.com/
- Price anchor on the home page: "Starts at $8.99. Cancel anytime." plus a separate block for an ad-supported plan with "Learn More". Plans range $8.99 to $26.99 a month before tax (FAQ on home page). Source: https://www.netflix.com/
- "Questions? Call 1-844-569-7700" above the footer (a phone number, not only email). Source: https://www.netflix.com/
- Sign-up flow after the email (plan choice, account creation, payment) is behind the form: (inferred, not opened; no forms were submitted).

### Plans and trial
- Free trial is not universal: help pages differ by country; one says "Netflix does not offer free trials", a regional one says a limited trial exists for eligible new members in certain countries; where it exists the option appears automatically during sign-up. A payment method is required to start a trial but no charge until it ends. Sources: https://help.netflix.com/node/16282 and https://help.netflix.com/en/node/16282/au
- Cancel: go to "Manage your membership", click Cancel, finish the Cancel section; a confirmation email is sent to the account email; deleting the app or signing out does not cancel. No cancellation fees. A "pause membership" option is offered as an alternative to cancelling. Source: https://help.netflix.com/en/node/407
- Third-party claims (24-hour cutoff, emailing help@) were not confirmed on official pages; do not copy. Source: search result summary of intercom.help third-party page.

### Account basics
- Language switcher: "Select Language" (English, Español) both near the top and in the footer. Source: https://www.netflix.com/
- Profiles, PINs, password reset, email change, account deletion, data download: not opened in this pass; see section "Added later" if filled.

### Trust and legal footer (home page)
- Footer: FAQ, Help Center, Account, Media Center, Investor Relations, Jobs, Netflix Shop, gift cards, Ways to Watch, Terms of Use, Privacy, Cookie Preferences, Corporate Information, Contact Us, Speed Test, Legal Notices, Only on Netflix, Do Not Sell or Share My Personal Information, Ad Choices. Source: https://www.netflix.com/

## 2. Epic (getepic.com)

### Path of a new visitor
- Home headline "World's leading digital library for kids", 40,000+ books and videos. Three audience selectors at the top: "I'm a Parent", "I'm a Kid", "I'm an Educator"; nav items Families (/parents) and Educators (/educators); header "Sign Up" and "Log In"; buttons "Free Trial for Families", "Free for Educators", "Sign Up To See All Books", "Get Started". No prices on the home page. Source: https://www.getepic.com/
- Parent and teacher are separate paths. A teacher who signed up as a parent first has a help article explaining how to move to an educator account. Source: https://support.getepic.com/hc/en-us/articles/204930405
- Sign-up form fields: not readable without a rendered page (see Playwright section if filled).

### Plans, trial, cancel, refunds
- Trial length: the official page was not found in search; users in reviews mention a 7-day trial (unverified). Source: https://www.trustpilot.com/review/getepic.com?page=4
- Cancel on the web: log in, open Parent Dashboard (asks for the parent password), Account Settings, Manage Subscription, confirm. Source: https://support.getepic.com/hc/en-us/articles/45702023058701
- Cancel via Apple: Settings, name, Subscriptions, Epic, Cancel; no Cancel button or red expiry text means already cancelled. Source: https://support.getepic.com/hc/en-us/articles/45702499496589
- "How to cancel depends on how you originally subscribed" (web, Apple, Google). Source: https://support.getepic.com/hc/en-us/articles/204930315
- Refunds: in most cases non-refundable (per help centre summary). Source: https://support.getepic.com/hc/en-us/categories/200390025
- Complaint pattern worth avoiding: people report being charged after trial and not getting an answer. Source: https://www.trustpilot.com/review/getepic.com?page=4

### Account basics
- Parent Dashboard protected by parent password; help centre sections: Account Settings, Epic Family, Subscription and Billing. Sources: https://support.getepic.com/hc/en-us/sections/360004451092 , https://support.getepic.com/hc/en-us/categories/360001715911
- Support contact: support@getepic.com and a request form. Source: https://support.getepic.com/

## 3. Duolingo

- Trial reminder: users say the app promises a reminder 2 days before the trial ends; several say it never arrived and they were charged. No official page confirmed. Sources: https://www.sikayetvar.com/en/duolingo-us/duolingo-never-sent-the-promised-free-trial-reminder , https://recurdash.com/guides/how-to-cancel-duolingo-plus
- Cancel path quoted from help steps: profile settings, Super Duolingo, cancel subscription, confirm; app-store subscriptions must be cancelled in Apple or Google. Source: https://recurdash.com/guides/how-to-cancel-duolingo-plus
- Refund complaints are common for trials that turned into an annual charge. Source: https://www.sikayetvar.com/en/duolingo-us/duolingos-2-week-free-trial-auto-charged-me-the-annual-fee-without-notice-how-can-i-get-a-full-refund-q-12082

## 4. ElevenLabs

- Plans (pricing page): Free $0, 10,000 credits a month; Starter $1 first month then $6; Creator $11 first month then $22; Pro $99; Scale $299; Business $990; Enterprise custom. Annual billing = 10 months price (two months free). Black Friday offer banner. Source: https://elevenlabs.io/pricing
- Credits roll over up to two months on paid plans; cancelling or downgrading keeps the plan until cycle end, then Free and unused paid credits expire. Source: https://elevenlabs.io/pricing
- Cancel: account menu, Subscription, Billing, Cancel Plan; confirmation says cancellation is scheduled for end of cycle; "Resume subscription" undoes it until then. Source: https://elevenlabs.io/docs/help-center/account/cancellation-refunds/how-do-i-cancel-my-subscription
- Delete account: Settings, red Delete Account, type account email to confirm; blocked while payment outstanding; permanent; email cannot be reused. Source: https://elevenlabs.io/docs/help-center/account/general/how-can-i-delete-my-account
- Google-sign-in accounts cannot change email (tied to Google). Source: search summary of https://elevenlabs.io/docs/help-center/account
- Mobile app refund/cancel has its own article. Source: https://elevenlabs.io/docs/help-center/product/mobile-apps/eleven-labs-for-ios-and-android/how-do-i-request-a-refund-or-cancel-my-subscription-in-the-eleven-labs-ios-or-android-app

---
## ADDED: rendered-page findings (Playwright headless, public pages, nothing submitted)

### Epic home page (https://www.getepic.com/ and /parents)
- Cookie banner at the very top on first load: "This website utilizes technologies such as cookies to enable essential site functionality, as well as for analytics, personalization, and targeted advertising..." with links Privacy Policy and "Manage Preferences". Source: https://www.getepic.com/
- Welcome gate: "Welcome to a world of reading!" with three buttons I'm a Parent / I'm a Kid / I'm an Educator before the content. Source: https://www.getepic.com/
- Hero: "Free Trial for Families, As low as $7.25/month" and "Free for Educators, Available weekdays 7am-4pm". Source: https://www.getepic.com/
- Browse before sign-up: category chips (Popular, 5 & Under, Ages 6-8, Ages 9-12, Audio, Award winners, Nonfiction, Cats & Dogs, STEAM) then "Sign Up To See All Books" (a teaser library). Source: https://www.getepic.com/
- Pricing shown on the home page with two cards: BEST VALUE $7.25/month billed as $84.99/year, and $13.99/month billed monthly, both "Start 7-Day Free Trial". So the real price per period and the billing frequency are shown together. Source: https://www.getepic.com/
- Value statements per audience: "Fall in love with reading", "Grow through exploration", "Succeed in the classroom and beyond". Source: https://www.getepic.com/
- Footer: Epic Originals, Books, Gifts, Redeem Gift; For educators: Epic School, Admin Portal, Educator Resources, School Privacy Promise; About, Careers, Press, Blog; Help & Support, press and publisher mail links; app download badges (Apple, Google); copyright line; Terms & Conditions; Privacy Policy; social links. Source: https://www.getepic.com/sign-up (renders a "Something's gone haywire. That page can't be found" 404 with nav kept and a contact-us link)
- Gift and redeem-gift flow exist in the footer. Source: https://www.getepic.com/gift , https://www.getepic.com/redeem-gift

### Epic educators page (https://www.getepic.com/educators)
- Two plans: Epic School = free, about 20,000 books, weekdays 7am-4pm, "Sign Up for Free"; Epic School Plus = 24/7 year-round, 40,000+ books, offline downloads, "Request Pricing" (sales form). Comparison table rows: Books & Videos, Downloadable Books, Book Filtering, Class reports, Admin Portal, Clever/ClassLink SSO + auto-rostering, COPPA/FERPA compliant, Price. Source: https://www.getepic.com/educators
- Teacher tools named: Reading Badges, "Daily 20" assigned reading habit, assign and share books, class reports. Source: https://www.getepic.com/educators
- Multilingual note: Spanish, French, Chinese, Gaelic titles. Source: https://www.getepic.com/educators
- A separate School Privacy Promise page and an Epic School Privacy Policy exist. Sources: https://www.getepic.com/school-privacy-promise , https://www.getepic.com/privacy

### Epic privacy policy (https://www.getepic.com/privacy), children's section
- Under-13s cannot create an account; a parent creates the account and child profiles; child profile needs only name or nickname, age or grade and reading level; no targeted ads to children; no sale of child data; parent can view, edit or delete child data; third-party ad tools are disabled once a user is signed in; Children's Privacy Policy is a named section. Source: https://www.getepic.com/privacy
- A parent must sign in and select the child profile before the child can use the service. Source: https://www.getepic.com/privacy
- A teacher/school can authorize collection for under-13s; schools have a separate policy. Source: https://www.getepic.com/privacy

### Epic help-centre articles (support.getepic.com sits behind a Cloudflare bot check, so only search-result summaries were readable)
- Child profile delete: parent avatar then parent password, then Profile Options next to the child, delete, confirm; cannot delete the only child profile (create another first). Source: https://support.getepic.com/hc/en-us/articles/115000888063
- Profile PIN: parent password, Profile Options, add or edit PIN. Source: https://support.getepic.com/hc/en-us/articles/360027225131
- Unlink child from old teacher and connect to new teacher. Source: https://support.getepic.com/hc/en-us/articles/115001982363
- Help sections: Account Settings, Child Profile Management, Epic Family, Subscription and Billing. Sources: https://support.getepic.com/hc/en-us/sections/360004451112 , https://support.getepic.com/hc/en-us/sections/360001647072
- Trial: 7-day free trial confirmed on the home page; complaint reviews mention charges after trial. Sources: https://www.getepic.com/ , https://www.trustpilot.com/review/getepic.com?page=3

## Netflix, extra pages

- Sign-up page is a 3-step flow: "Step 1 of 3 Choose your plan. No commitments, cancel anytime. Endless entertainment for one low price. Enjoy Netflix on all your devices." with a Next button; header has Sign In; footer has FAQ, Help Center, Terms, Privacy, Cookie Preferences, Corporate info, Do not sell, Ad Choices, phone line, language select. Source: https://www.netflix.com/signup
- So the plan is chosen first (step 1 of 3), with a visible step counter. Source: https://www.netflix.com/signup
- US help page now says "Netflix does not offer free trials, but you can change your plan or cancel online at any time." (conflicts with the older regional page seen in search; the US page was rendered directly). Source: https://help.netflix.com/en/node/16282
- Cancel article sections: When membership charges stop; If you don't see an option to cancel; Canceling before end of billing period; On hold; Gift card or promo balance; Pausing; Rejoining; Preventing others from restarting your account. Source: https://help.netflix.com/en/node/407
- Restart: sign in (not "Get Started") to rejoin; reset password link; warning if restarted without permission. Source: https://help.netflix.com/en/node/2070
- Profiles: up to 5 profiles per account; each profile has its own profile lock, language preference, maturity level, subtitle look, playback and notification settings, viewing activity, My List, ratings, recommendations. Source: https://help.netflix.com/en/node/10421
- Kids profile: created by choosing "For Kids"; icon has a logo; simplified look; no direct access to account settings; no email can be added so kids cannot sign in; only kid-selected content; main profile cannot be a kids profile; changing maturity rating needs the account password. Source: https://help.netflix.com/en/node/114275
- Profile Lock PIN: 4 digits; identity check by account password (app) or emailed code / text / password (web); option "Require PIN to add new profiles"; "Forgot PIN?" recovery; device may need refresh. Source: https://help.netflix.com/en/node/114277
- Parental controls hub: kids profile, maturity ratings/title blocks, profile lock, PIN to add profiles, autoplay on/off, viewing history per profile. Source: https://help.netflix.com/en/node/264
- Privacy and security hub lists: manage email from Netflix, manage text messages, customer surveys, what personal info Netflix holds and how to request a copy (data download), deletion and retention, deleting your account, removing payment methods, changing email, change language, password reset required email, phishing warning, GDPR. Source: https://help.netflix.com/en/node/100628
- Help links for email change https://help.netflix.com/node/134335 and language change https://help.netflix.com/en/node/13245 (titles only read; bodies not opened).
- Help centre itself has a language selector of about 36 languages and a country notice "Currently viewing information for: United States". Source: https://help.netflix.com/en/node/264

## Duolingo, extra pages

- Home page: headline "The most fun way to learn languages, chess, and more!"; two buttons only: GET STARTED and I ALREADY HAVE AN ACCOUNT; a language picker row for the course; "TRY 1 WEEK FREE" for Super; selling points "free. fun. effective.", "backed by science", "stay motivated" (reminders from mascot), "personalized learning", app store badges; "Site language" picker with about 40 languages (includes Arabic, Hebrew). Source: https://www.duolingo.com/
- Course landing pages: "Learn English in just 5 minutes a day. For free." Same two buttons. Source: https://www.duolingo.com/enroll/en/
- Footer: About, Courses, Mission, Approach, Efficacy, Handbook, Research, Careers, Store, Press, Investors, Contact; products incl. Duolingo for Schools; Help and support (FAQs, Schools FAQs, Status); Privacy and terms (Community guidelines, Terms, Privacy, Do Not Sell or Share My Personal Information); social links. Source: https://www.duolingo.com/
- Duolingo "start learning first" pattern: new visitors can begin a lesson before creating an account, then are asked to create a profile to save progress (from general knowledge; the rendered home page only shows GET STARTED, so this is (inferred) here).
- Help centre structure: Using Duolingo; Account Management (change username or email; account access trouble; delete account and access data; data compromised); Subscription & Payments (what is Super, Family Plan, cancel, refund, promo code). Source: https://www.duolingo.com/help
- Trial: "TRY 1 WEEK FREE" on home page; reminder 2 days before end is claimed by users, not confirmed. Sources: https://www.duolingo.com/ , https://www.sikayetvar.com/en/duolingo-us/duolingo-never-sent-the-promised-free-trial-reminder
- Cancel on web needs the cancel option in Settings, only for web purchases; store purchases are cancelled in Apple or Google. Source: https://recurdash.com/guides/how-to-cancel-duolingo-plus (third party)
- Privacy page is long (30k characters), includes children's section. Source: https://www.duolingo.com/privacy (not read in full)

## ElevenLabs, extra pages

- Sign-up page (https://elevenlabs.io/app/sign-up): title "Create an account"; options: Sign up with SSO, Sign up with Google, Email, Password, Sign up; link "Already registered? Sign in"; line "By continuing, you agree to our Terms of Service and Privacy Policy." No Apple button seen. Email verification step not opened (inferred: confirmation email).
- Home page rendered (https://elevenlabs.io/) is a long marketing page; pricing page gives the Free plan with no card: "Build for free". Source: https://elevenlabs.io/pricing
- First-month price hooks: Starter $1 first month, Creator $11 first month. Source: https://elevenlabs.io/pricing
- Credits shared across products; generation charges per request not download. Source: https://elevenlabs.io/pricing
- Help centre has separate articles for cancellation/refunds on mobile apps vs web, payment/billing, account. Sources: https://elevenlabs.io/docs/help-center/account , https://elevenlabs.io/docs/help-center/account/payment-billing
- Delete-account rules: see section 4 above.

## Emails (limited evidence)
Searched for reallygoodemails.com entries; the site loads but returned only a shell page and no brand pages for these four. No official subject lines were verified except those below.
- Netflix: "New sign-in to your account" (third-party list, unverified wording). Source: https://www.optimonk.com/best-email-subject-lines
- Netflix: cancellation confirmation email goes to the account email; "password reset required" email exists; users can "manage email from Netflix". Sources: https://help.netflix.com/en/node/407 , https://help.netflix.com/en/node/100628
- Duolingo: "Learn a language with only 5 minutes per day" (third-party list, unverified). Source: https://webcf.waybackmachine.org/web/20230320122706/https://optinmonster.com/101-email-subject-lines-your-subscribers-cant-resist
- Duolingo trial-ending reminder promised 2 days before end (user reports). Source: https://www.sikayetvar.com/en/duolingo-us/duolingo-never-sent-the-promised-free-trial-reminder
- Patterns for welcome, receipt, renewal, win-back emails are (inferred) from general practice, not verified for these brands.

## Not verified (honest gaps)
- Actual sign-up fields for Epic and Duolingo, and Netflix after step 1 (need interaction; no forms were opened).
- Epic and Duolingo help article bodies (Epic is behind a bot check; Duolingo help is a JS app).
- Netflix: change email and data download article bodies were not opened, only listed.
- ElevenLabs email verification and onboarding questions.

---
# Checklist for StoryTime
Tags: FITS = build it now; LATER = good but not for launch; DOES NOT FIT = skip. "(inferred)" = not directly seen. Our product: parents and kindergarten teachers, age group chosen, 3-day free trial of 3 stories, then 1/3/12 month pass, four languages.

## Landing
1. One main action above the fold (Netflix email box; Duolingo two buttons "Get started" / "I already have an account"). FITS: one big "Start free" button plus a small "Log in".
2. "Who are you" choice at the top: parent / kid / educator (Epic). FITS as parent / teacher (kids do not browse alone).
3. Price anchor and "cancel anytime" line on the home page (Netflix, Epic). FITS: show the 3-day trial and pass prices near the top.
4. Show price per month AND the real billed amount (Epic $7.25/mo billed $84.99/yr). FITS: for 3 and 12 month passes show total and per-month.
5. Teaser library before sign-up (Epic age chips, "Sign up to see all books"). FITS: show story covers by age group, locked ones marked.
6. Age-group chips (Epic: 5 & under, 6-8, 9-12). FITS: our age group choice shown on landing.
7. Language picker visible on landing and in footer (Netflix, Duolingo). FITS: four languages; remember the choice.
8. Right-to-left layout for Arabic/Hebrew if offered (Duolingo has Arabic, Hebrew). FITS if any of our four is RTL (owner to confirm the four).
9. Benefit statements per audience (Epic). FITS: parent benefit vs teacher benefit.
10. Proof / "backed by science" claims (Duolingo). LATER: only with real, verified sources; never invent.
11. App download badges (Epic, Duolingo). DOES NOT FIT for launch (website only). LATER.
12. Phone number to call (Netflix). DOES NOT FIT; email support is enough.
13. Gift / redeem gift (Epic). LATER: strong for grandparents.
14. A friendly 404 page with navigation kept and contact link (Epic "Something's gone haywire"). FITS.
15. Free-for-educators offer (Epic School). LATER: decide teacher pricing.

## Sign-up
16. Email + password plus Google (ElevenLabs shows SSO, Google, email, password). FITS: email and Google at launch.
17. Apple sign-in. LATER (needed if a native iOS app ships; the owner uses iPhone/iPad so tell him) (inferred rule: Apple requires it when other social logins exist in apps).
18. "Already registered? Sign in" link next to the form (ElevenLabs). FITS.
19. Consent line "By continuing you agree to Terms and Privacy" with links (ElevenLabs). FITS.
20. Email verification step with clear "check your inbox" screen and resend button (inferred, standard). FITS.
21. Show/hide password, strength hint (inferred). FITS.
22. Parent must create the account; under-13 cannot (Epic privacy). FITS: state "accounts are for adults".
23. Adult confirmation checkbox / birth-year gate for the adult (inferred). FITS.
24. Separate teacher sign-up path (Epic). FITS as a choice in the same form.
25. Switching from parent to teacher later (Epic article 204930405). LATER.
26. Start before signing up (Duolingo lets learners try first, inferred). DOES NOT FIT: our trial needs an account to prevent repeated trials.
27. Clear error messages for wrong password, existing email, weak password (inferred). FITS.
28. Step counter "Step 1 of 3" (Netflix signup). FITS if flow has several steps.

## Onboarding
29. Ask age group first (our requirement). FITS.
30. Ask language(s) for the stories. FITS.
31. Ask child's first name or nickname only (Epic: name/nickname, age or grade). FITS; no photo, no surname.
32. Ask parent or teacher role early (Epic). FITS.
33. Teacher: ask class name and number of children. LATER.
34. Skip button on every onboarding question (inferred). FITS.
35. First success moment: first story opens within seconds of finishing sign-up. FITS (key).
36. Tell the user what the trial includes: 3 stories, 3 days, what happens after. FITS.
37. Reading preferences (topics, bedtime vs daytime). LATER.
38. Daily-habit setup / reminder time (Duolingo streak reminders). LATER; careful with children's pressure.

## Trial and plans
39. Trial terms stated in plain words before starting: length, what is included, whether a card is needed, what happens at the end. FITS (Netflix, Epic, ElevenLabs all state it; complaints show what happens if unclear).
40. Visible countdown: "2 days left, 1 of 3 stories read". FITS.
41. Reminder email before the trial ends (Duolingo claims 2 days before; users complain when missing). FITS: send on day 2 (inferred timing for a 3-day trial).
42. Trial without a card (ElevenLabs free tier needs none). FITS recommended; owner decides. Cards at trial start raise charge-after-trial complaints (Epic, Duolingo reviews).
43. Pass plans: 1, 3, 12 months shown as cards, best-value badge on the longest (Epic "BEST VALUE"). FITS.
44. Say whether passes renew automatically or end on their own. FITS: prepaid passes that end cleanly are friendlier; owner to decide (inferred need).
45. What happens when trial ends: stories locked, account and child profiles kept, one-tap "buy a pass". FITS (ElevenLabs falls back to Free and keeps the account).
46. What happens when a pass ends: same as 45, plus saved progress kept. FITS.
47. Cancel in the account in 2 clicks, with confirmation email (Netflix, ElevenLabs). FITS if renewal exists.
48. "Resume" option before the end date (ElevenLabs Resume subscription). FITS.
49. Pause instead of cancel (Netflix). LATER.
50. Refund policy stated on the pricing page (Epic: mostly non-refundable; ElevenLabs separate refund pages). FITS: write a short clear policy; owner decides.
51. Coupon / promo code field (Duolingo promo code article). LATER.
52. Family plan (Duolingo). DOES NOT FIT now; LATER for siblings.
53. Teacher/school plan with quote form (Epic School Plus "Request Pricing"). LATER.
54. Rejoin path: returning user signs in and picks a pass (Netflix restart). FITS.
55. Limited-time offers (Black Friday banner at ElevenLabs). LATER.

## Payment
56. Payment page shows plan, total, currency, tax note, end date. FITS.
57. Secure card form from a payment provider; no card data on our server (inferred standard). FITS.
58. Apple Pay / Google Pay. LATER (nice on phones).
59. Receipt email and a payment history page (Netflix Payment History). FITS.
60. Failed payment message with next step (Netflix "account on hold" topic). FITS.
61. Remove payment method (Netflix). FITS if we store any.
62. Purchases through App Store need a separate cancel route (Epic, Duolingo). DOES NOT FIT for web-only launch; LATER if apps are built.
63. Tax / VAT and local currencies for four language markets (inferred). LATER; flag to owner.
64. Gift card / gift pass (Netflix, Epic). LATER.

## Account and settings
65. Settings page: name, email, password, language, plan and end date, children, delete account. FITS.
66. Change language anywhere and remember it (Netflix, Duolingo). FITS.
67. Password reset by emailed link (Netflix LoginHelp). FITS.
68. "Password reset required" security email (Netflix). LATER.
69. Change email with verification (Duolingo, Netflix; ElevenLabs blocks it for Google accounts). FITS; explain Google limits.
70. Delete account with typed-email confirmation, clear warning, blocked while payment issue (ElevenLabs). FITS (also a privacy duty).
71. Download my data (Duolingo "delete account and access my data"; Netflix "request a copy"). FITS (privacy law) but can be by email request at first.
72. Sign out everywhere / secure account tips (Netflix). LATER.
73. Marketing email opt-out toggles (Netflix "manage email from Netflix"). FITS.
74. Account email notification settings per profile (Netflix). LATER.
75. Restart or reset a course (Duolingo). LATER: "restart story progress".

## Child profiles
76. Parent creates child profiles; child needs no email or password (Epic, Netflix Kids). FITS.
77. Only a first name or nickname and age (Epic). FITS.
78. Child profile cannot reach account settings or payment (Netflix Kids). FITS.
79. Parent gate (password or simple sum) before settings or purchase (Epic Parent Dashboard asks for parent password). FITS.
80. Optional profile PIN (Epic, Netflix 4-digit Profile Lock). LATER.
81. Cannot delete the only child profile (Epic). FITS decision: allow, but explain.
82. Delete profile removes history; say so (Netflix). FITS.
83. Max profiles (Netflix 5). FITS: pick a cap (5).
84. Profile picker screen with big avatars after login (Netflix, Epic). FITS.
85. Per-child progress, favourites, language and age group (Netflix profile features). FITS.
86. No ads or targeted tracking for children (Epic privacy). FITS.
87. Per-child age group changes as they grow. FITS.

## Teacher mode
88. Free or low-cost teacher access path (Epic School). LATER; owner decides.
89. Class list / groups instead of single children (Epic reports, rostering). LATER.
90. Assign a story to the class (Epic Daily 20, assign books). LATER.
91. Class reports (stories read). LATER.
92. Clever/ClassLink sign-in. DOES NOT FIT (US school systems).
93. Projector/story-time mode: full-screen, large text, no profile picker (inferred). FITS.
94. School privacy promise page (Epic). FITS for teacher trust, short version.
95. Teacher can move between home and class accounts. LATER.

## Emails
96. Confirm your email (inferred; all four). FITS.
97. Welcome email with first story link, written in the user's language. FITS.
98. Trial ending soon (day 2). FITS.
99. Trial ended / access paused, with offer. FITS.
100. Receipt after payment. FITS.
101. Pass ending soon (7 days and 1 day). FITS.
102. Cancellation confirmation (Netflix). FITS.
103. Win-back after lapse (inferred). LATER.
104. Password reset and email-change emails with expiry and "not you?" line. FITS.
105. Security notice for new sign-in (Netflix "New sign-in to your account", third-party). LATER.
106. Sender name, reply-to, and unsubscribe link on marketing. FITS.
107. Daily habit nudge (Duolingo). DOES NOT FIT / LATER; keep calm for children.
108. Subject-line pattern: plain and specific, e.g. "Your trial ends tomorrow". FITS (inferred; not verified for the four brands).

## Help and trust
109. Cookie banner with Manage Preferences, shown first (Epic, Netflix Cookie Preferences link). FITS.
110. Footer: Terms, Privacy, Contact, Help, Cookie settings, language. FITS (all four).
111. Dedicated "Children's privacy" section or page (Epic). FITS.
112. Plain-language list: no ads to children, no sale of data, parent control, what we collect (Epic). FITS.
113. "Do Not Sell or Share" link (Netflix, Duolingo, US). LATER/depends on markets.
114. Accessibility statement (none of the four footers showed one). FITS as a plus; owner to confirm.
115. FAQ grouped: Using, Account, Subscription and payments (Duolingo). FITS.
116. Contact form plus email (Epic form and support@). FITS.
117. Help article "How to cancel" findable from footer (Netflix, Epic, ElevenLabs). FITS.
118. Status page (Duolingo). DOES NOT FIT now.
119. Phishing warning article (Netflix). LATER.
120. Corporate/company info and legal entity (Netflix). FITS: legal name and address (required in many EU countries) (inferred).
121. Data protection (GDPR) rights wording for EU users (Netflix GDPR article). FITS if users in EU.

## Small details
122. Cookie, language, and theme remembered between visits (inferred). FITS.
123. Continue where you left off on the story list (inferred; Netflix/Epic have it, not directly seen). FITS.
124. Progress saved automatically per child (Epic privacy mentions books read and time). FITS.
125. Empty states with friendly text: "No favourites yet" (inferred). FITS.
126. Loading states: skeletons / spinner for story pages (inferred). FITS.
127. Offline downloads (Epic School Plus, Netflix). LATER.
128. Favourites / My List (Netflix My List, Epic collections). FITS.
129. Read-to-me / audio (Epic). LATER depending on product.
130. Badges and rewards (Epic Reading Badges, Duolingo streaks). LATER; avoid pressure.
131. Step counter and Back button in multi-step flows (Netflix). FITS.
132. Confirmation screens after each action ("Plan cancelled, access until X date"). FITS.
133. Device refresh note after changing settings (Netflix). DOES NOT FIT.
134. Autoplay preview setting (Netflix). DOES NOT FIT.
135. "Forgot PIN?" always visible (Netflix). FITS if we add a parent PIN.
136. Error pages and messages that name the next step, not only "error" (inferred). FITS.
137. Notification when access ends set to the real date and timezone. FITS (inferred).
