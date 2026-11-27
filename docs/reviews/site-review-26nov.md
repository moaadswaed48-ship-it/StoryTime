# Fresh review of the 26 Nov site work (owner's messages, refunds and prices; classroom mode; launch readiness)

Reviewer: fresh context, 26 Nov 2026. Scope: `git diff 61b2be6 -- src supabase e2e tests scripts` (without
`src/studio3d/`, `studio/`, `bakeoff/`, `docs/film/`). Nothing was fixed or committed.

How it was checked: read every new SQL function and the screens that call them; two private builds under the
scratchpad (`review/build`, test mode; `review/build-sb`, the same code built with a dummy Supabase address and key,
to see what a launch build ships); the test-mode build served with `scripts/serve.mjs` and driven with Playwright
(Chromium) at 390 and 1440 px, plus 844 x 390 (phone held sideways) and 1024 x 768 (tablet). Screenshots and a run
log: `qa/out/review-26nov/`. No real Supabase project was touched.

## Findings, most harmful first

### 1. UNSAFE (money, untrue to the family): the "refund issued" email states the full price even when a fee was kept
- Where: `supabase/migrations/20261126100000_owner_inbox_refunds_prices.sql:112-128` (`owner_mark_refunded`) never
  changes `refunds.amount_agorot`, which `cancel_purchase` set to the full price paid. The email job uses exactly
  that column: `src/emails/schedule.ts:192-194` (`amountAgorot: r.amountAgorot`) into "We issued your refund of
  {amount}" (`src/emails/copy/en.ts`, `refund_issued`). The test-mode server does the same
  (`src/features/owner/data/local.ts:353-373`). "Download my data" also carries the full amount as `amountAgorot`.
- Reproduce: test mode, a 100.00 shekel order cancelled; owner sets fee 5, writes a note, marks refunded. The owner's
  screen correctly says "Returned: 95.00" (`qa/out/review-26nov/owner-refunds-after-mark-he-1440.png`), but the
  stored refund row is `{"amountAgorot":10000,"feeAgorot":500,"status":"issued"}` (`run-log.txt`), so the email
  would tell the family 100.00 was refunded.
- Fix direction: set `amount_agorot = paid - fee` when marking refunded (both backends), and a test that the email
  amount equals paid minus fee.

### 2. UNSAFE (hard rule 6, launch blocker; older than today but stated wrongly in today's launch review): a launch build still publishes the story words of every StoryTime story
- Where: `src/data/index.ts` keeps `import('./local/index.ts')` in every build, and `src/features/owner/data/index.ts:13`
  imports `@/data/local/server`; that pulls in `src/data/local/content.ts`, whose `import.meta.glob` makes one public
  file per story language. The check `e2e/stage4b1.spec.ts:246` ("the built public pages carry no story text")
  reads only `.html` files, never the scripts.
- Reproduce: `VITE_SUPABASE_URL=https://example.invalid VITE_SUPABASE_PUBLISHABLE_KEY=x BUILD_DIR=... npm run build`,
  then search `build/client/assets`: 9,394 of 9,985 story strings longer than 30 characters (all `content/stories/*/
  {ar,he,en,da}.json`: pages, film words, activities) are in public files such as `ar-*.js`, and `local-*.js` is
  there too. The author's story (`content/author/`) is not (0 of 66 sampled lines).
- `docs/reviews/launch-readiness-26nov.md` section 5 says the test-mode chunk "is never loaded by a Supabase build".
  That is true, but the files are still published at addresses anyone can find from the other scripts, so the
  "safety read" passes when it should not. Fix direction: leave the local backend and content out of a Supabase
  build entirely (a build-time switch rather than a runtime ternary), and make the safety test scan every built file.

### 3. BROKEN (owner, legal flow): a request from the public "Cancel a purchase" form cannot be acted on
- Where: `src/routes/app/owner/refunds.tsx:215-245` and `src/i18n/*/owner.ts` `refunds.publicLead` ("Find the
  purchase by its order number, settle it with them by email, then mark the request as handled").
- What: no owner screen shows an order number. The refund cards and the dashboard show email, group and length only
  (`dashboard.tsx:59-70`). There is also no owner function to cancel that pass or open a refund for it, so access is
  never ended and no refund record or email exists. The owner can only press "Mark as handled".
- Reproduce: open Refunds with the seeded request "ORDER-2041" (`owner-refunds-da-390.png`); there is no way to find
  or cancel order ORDER-2041. (The family's settings show `o.id.slice(0, 8).toUpperCase()`, a value the owner never
  sees.)

### 4. UNTRUE (owner screen): "The family can see this note with their purchase"
- Where: `src/i18n/en/owner.ts:244` (`refunds.noteHint`; the same in he, ar, da).
- What: no family screen shows refunds or the note. `routes/app/settings.tsx:278-293` lists orders with amount and
  status only. The note appears only inside "Download my data" (JSON). Either show it in Settings, Passes and
  payments, or reword.
- Related, WEAK: after a refund with a fee, the family's payments list shows the full price with the status
  "Refunded", which reads as a full refund.

### 5. BROKEN (classroom, phone held sideways and other short screens): the film page collapses to a sliver
- Where: `src/routes/app/watch.tsx` in classroom mode: `max-w-[calc((100dvh-22rem)*16/9)]`.
- What: at 844 x 390 the page is 67 px wide. The back button wraps one word per line and the film or the "locked"
  notice is unreadable (`classroom-watch-b02-844x390.png`). Below about 352 px of height it reaches 0. A teacher
  holding a phone sideways to show a small group, or a laptop with a short browser window, hits this. At 1024 x 768
  it is fine (740 px).
- Fix direction: give it a minimum width (for example `max(20rem, ...)`) or drop the cap when the screen is short.

### 6. CONFUSING (classroom): with no trial or pass, the classroom library shows only locked books and no way forward
- Where: `src/routes/app/library.tsx:108` hides `AccessPanel` in classroom mode, which also hides "Start the free
  trial" and "Your trial has ended".
- Reproduce: a teacher account with classroom mode on and no trial: every book is locked and nothing explains why or
  offers the trial (`classroom-library-no-access-en-390.png`). The teacher must guess "Leave classroom mode".
  Suggestion: in classroom mode, show a short, non-personal notice with the trial button when nothing is open.
- Related, WEAK: a locked story page in classroom mode shows a big "See passes" button on the class screen
  (`classroom-story-locked-he-390.png`), which children will tap. Checkout is still behind the parent gate, so this
  is not a safety problem.

### 7. WEAK (money, later): the price shown at checkout is not checked against the price charged
- Where: `src/routes/app/checkout.tsx:66-68`; `create_order` takes no expected amount.
- What: now that the owner can change prices live, a family that opened the summary before a change is charged the
  new price, while the screen says "the price shown at the moment of purchase applies". No real payment company is
  connected, so nobody is harmed today. Fix direction: send the shown amount and refuse a mismatch (`price_changed`).

### 8. WEAK (launch settings): a normal build is open to search engines and points at the placeholder address
- Where: `site.config.ts` (`siteOrigin` defaults to the github.io address) and `scripts/postbuild.mjs`.
- What: without `NOINDEX=1` and `SITE_ORIGIN`, `robots.txt` allows crawling and names
  `https://moaadswaed48-ship-it.github.io/sitemap.xml` (seen in `review/build`). On the GitHub Pages preview,
  `robots.txt` lands under `/StoryTime/next/`, where crawlers never read it (the noindex meta still protects the
  preview). Suggestion: make the postbuild fail when `NOINDEX` is unset and `SITE_ORIGIN` is missing.

### 9. WEAK (honesty, small): the home page plan teaser and the price facts
- Once any single price is set, the home page teaser drops "Price not set yet" on all three lengths, so lengths with
  no price show nothing. The integrator already noted this.
- Once any price is set, the plans page switches to "The price shown at the moment of purchase applies", even if
  some passes still have no price. Those cards still say "Price not set yet", so this is acceptable, but not exact.
- A real payment could open as soon as a price is set, while the seller's name and business number are still
  placeholders (`PlanCards`, checkout list). `create_order` checks only the price. This belongs on the launch
  checklist, because the consumer law needs the seller's details before a sale.

### 10. WEAK (four languages): wording to check with native readers
- Classroom: Arabic `teacherNotes` is "لطاقم الروضة" (kindergarten staff) and Hebrew "לצוות הגן", but English is
  "For the teacher" and Danish "Til personalet". The meanings differ slightly, though all four are gender-neutral.
  Danish calls the mode "Storskærmstilstand" (big-screen mode), not classroom mode. This is fine, but it should be
  a deliberate choice.
- The new owner screens in Hebrew and Arabic use neutral forms or forms addressed to the owner. No gendered address
  to parents was found in the new family-facing words. No English words were left in he/ar/da screens
  (`owner-*-{he,da,ar}-{390,1440}.png`), and nothing scrolled sideways.

## Checked and found sound
- All seven new `owner_*` functions check the owner first, are SECURITY DEFINER with an empty search path, are
  revoked from `anon` and `public`, and the direct column grants from part 1 are taken back. A non-owner gets
  `not_owner`. None of them lets a family read another family's data (the buyer's email is read only inside an
  owner-only function).
- Fee cap: enforced by the existing trigger `guard_refund_fee` (0 to the lower of 5% or 100 shekels) on every write.
  The screen checks the same cap, and a fee can only be set while the refund is still "requested". It cannot exceed
  the cap.
- Prices: whole agorot only, 1 to 10,000 shekels, by both a constraint and the function. The public price read
  (`src/data/public-prices.ts`) never invents a price, so anything missing or odd stays "Price not set yet".
  `create_order` still refuses real providers while the price is null. Test payments on Supabase still need
  `allow_test_payments`.
- Classroom pref: only a boolean is accepted, the screens use it only for teachers, and the parent gate still covers
  settings, plans and checkout.
- Not-found pages in Hebrew and Danish render with the right titles (`not-found-{he,da}-390.png`).

## What I could not check
- Anything on a real Supabase project (the SQL was read, not run; the existing PGlite tests were not re-run).
- The real refund email as sent (finding 1 is from the code path, not from a sent email).
- Safari/WebKit and an iPhone (real full screen, the `dvh` behaviour), screen readers, a real projector.
- Hebrew and Danish signed-in family screens beyond the classroom library and story page; the classroom book and
  activity (already covered by the helper's tests at 390, 1440 and 1920 px). I did not re-run the full test suites.
- Native-speaker review of the new Arabic, Hebrew and Danish words.

## Fixes (27 Nov 2026, Builder)

Each finding was fixed at its cause with a test that fails on the 26 Nov code (commit `435c184`) and passes now.
Proof of "fails before": the new tests were run against a copy of `435c184` (unit and database: 20 of 20 failed;
browser: 18 of 20 failed, the 2 that passed are the 1024 x 768 film checks, a size the review already found fine;
the launch-build scan found 21,636 story lines in a `435c184` launch build). Details and commands:
`docs/HANDOFF.md`, "Fixes from the 26 Nov review".

| # | Finding | Status | Fix | Tests |
|---|---|---|---|---|
| 1 | Refund email states the full price | Fixed | New migration `20261126120000_review_26nov_fixes.sql`: trigger `refunds_amount_returned` keeps `refunds.amount_agorot` = paid minus fee (0 if declined) on every write, and brings old rows in line. Test backend: same on setting the fee and marking refunded. The refund email now shows Total paid, Cancellation fee and Refund, and its amount is paid minus fee. | `tests/db/review-26nov.test.ts` (row, "Download my data", `email_audience`), `tests/review-26nov.test.ts` (test backend, email text), `tests/db/supabase-data-layer.test.ts` |
| 2 | Launch build ships story text (rule 6) | Fixed | Build-time switch `__TEST_BACKEND__` (`vite.config.ts`): in a launch build every import of the test-mode backend and of `content/stories/` resolves to an empty module, so none of their files can be written; the owner's Supabase code no longer imports from the test-mode file (`summarise` moved to `rules.ts`). Test mode and the preview are unchanged. `launch-readiness-26nov.md` section 5 corrected. | `e2e/stage4b1.spec.ts`: builds a launch-mode copy and scans every file (scripts included) for every story line of 20+ characters and the author's story, plus the test backend's keys: 0 found; a second test proves the scan finds the stories in a test-mode build |
| 3 | Public-form cancellations cannot be acted on | Fixed | `owner_refunds()` lists, on each public request, the paid orders whose number (8+ hex characters, as in Settings or the purchase email) and buyer email match. New `owner_cancel_for_request()`: owner only, ends that pass through `private.cancel_pass()`, the same function `cancel_purchase()` now uses (14 days, active pass, queued passes moved), opens the refund (fee cap applies), marks the request handled, logged. Screen: matching order card with a two-step "End this pass and open a refund request"; order numbers also on refund cards. | `tests/db/review-26nov.test.ts` (PGlite), `tests/review-26nov.test.ts`, `e2e/review-26nov.spec.ts` |
| 4 | "The family can see this note" was untrue | Fixed (shown) | Settings, Payment history: each refunded order shows "Refunded on", the amount returned, the fee kept (or "no fee") and the owner's note; a requested one says when it was cancelled and the fee rule. | `tests/review-26nov.test.ts`, `tests/db/supabase-data-layer.test.ts`, `e2e/review-26nov.spec.ts` |
| 5 | Classroom film collapses on short screens | Fixed | Film page width `max(28rem, …)`: never under 448 px where the screen is wider; the page scrolls a little instead. | `e2e/review-26nov.spec.ts` at 844 x 390 (failed before: 67 px) and 1024 x 768 |
| 6 | Classroom with no access: wall of locked books | Fixed | Classroom library with nothing open: a short note for the grown-up and "Start the free trial" (when unused), no books; after a trial or pass ended, the note says so. No "See passes" button anywhere on class screens (storybook, book, film, activity, collections). | `e2e/review-26nov.spec.ts` |
| 7 | Price shown not checked against price charged | Fixed | `create_order(…, p_expected_agorot)` refuses `price_changed` when the current price differs (either way, including set or removed); checkout sends the price on screen, and on refusal shows "The price has changed" with the new total, and no order is made. | `tests/db/review-26nov.test.ts`, `tests/review-26nov.test.ts`, `tests/db/supabase-data-layer.test.ts`, `e2e/review-26nov.spec.ts` |
| 8 | Build open to crawlers at the placeholder address | Fixed (both) | Without a real `SITE_ORIGIN` a build is treated as `NOINDEX=1` (robots.txt disallows all, pages say noindex); a launch build (Supabase configured) with the placeholder and no `NOINDEX=1` is refused with a clear message. | `tests/review-26nov.test.ts` |
| 9 | Per-length price honesty; seller placeholders | Fixed | Home teaser decides per length ("Price not set yet", "Price not set yet for every age group", or nothing when all three groups are priced); "Before you buy" has a third line for some-priced. `create_order` refuses a real payment company (`seller_not_set`) until `private.settings.seller_name` and `seller_number` are both filled. | `tests/review-26nov.test.ts`, `tests/db/review-26nov.test.ts`, `e2e/review-26nov.spec.ts` |
| 10 | Wording for native readers | Listed, not changed | `docs/emails/REVIEW-NOTES.md`, new section "From the fresh review of 26 Nov". | none (words left to native readers) |
