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
