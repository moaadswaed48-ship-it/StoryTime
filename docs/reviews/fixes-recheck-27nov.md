# Fresh recheck of the fixes to the 26 Nov review (27 Nov 2026)

Reviewer: fresh context. Scope: `git diff 435c184 HEAD -- src supabase e2e tests vite.config.ts scripts` (HEAD
`bed306e`), read in full for the money paths, the build switch and the changed screens. Nothing was fixed or
committed; no real Supabase project was touched; no `.env` read.

**Result: all nine fixes hold up. Findings 1, 2, 3, 4, 6, 7, 8 and 9 are fixed. Finding 5 is fixed as described,
but the film still does not fit on a phone held sideways. Finding 10 was listed for native readers, as planned.
I found no money or safety problem. There are four small new points (below), none of them blocking.**

## How it was checked
- Private builds under the scratchpad `recheck/` folder:
  - `launch`: fake Supabase address and key, plus `SITE_ORIGIN=https://storytime.example`.
  - `test`: test mode with `NOINDEX=1`.
  - `plain`: test mode with nothing set.
  - The same launch build without `SITE_ORIGIN`, to see whether it is refused.
- Environment note: a build placed outside the repository cannot find its packages, so prerendering fails with a 500
  error. This is not a code fault. It is fixed by linking `node_modules` into the build folder.
- The story-text scan was my own script (`scratchpad/tools/scan.mjs`), not the project's test. It collects every
  string of 20 or more characters from every `content/stories/**/*.json` file and the author's story (12,672
  strings). It then searches every built file for them, both as written and in JSON-escaped form.
- Browser checks used Chromium, driven by my own script (`scratchpad/tools/check.mjs`) against the served test build:
  - Hebrew and Danish at 390 px.
  - The classroom film at 844 x 390, 667 x 375 and 568 x 320.
  - Screenshots are in the scratchpad `recheck/shots/` folder.
- The new and changed unit and database tests were run again: `tests/review-26nov.test.ts`,
  `tests/db/review-26nov.test.ts` and `tests/db/supabase-data-layer.test.ts`. All 24 passed.

## Each finding

| # | Verdict | Evidence |
|---|---|---|
| 1 Refund amount | **Fixed** | The SQL trigger `refunds_amount_returned` stores price paid minus fee (0 if declined) on every insert and update. It sits beside `guard_refund_fee`, and the two do not depend on each other. The test backend does the same in `setRefundFee` and `markRefunded`. In the browser (he, da): cancel → stored refund 10000, fee null; fee 5.01 on 100.00 → refused, row unchanged; fee 5.00 + note → stored `{amount 9500, fee 500, issued}`, order and pass "refunded". The email uses `refundReturned(paid, fee)` and shows paid, fee and refund on separate lines. |
| 2 Rule 6 | **Fixed** | Launch build, all 231 files: no test-mode backend chunk, and no `storytime.local.v1` outside the cookie-policy wording. The only story text is in landing files and in HTML/`.data` prerenders. It is A04's documented single public excerpt (title, page 5, refrain) and the Danish title of C01 used in the age-range blurb (`da/landing.ts:31`), which is a title, not paid text. The author's story: 0. Control: the test build has hits in 205 files, so the scan works. The fake-address launch build without `SITE_ORIGIN` is refused with the intended message. |
| 3 Public-form cancellation | **Fixed** | The owner sees the matching order (number and email both required). A request with the right number but another email shows no match. An order paid 20 days ago is shown with "more than 14 days" and no button. Two steps, then the pass is cancelled, a refund is opened, the request is marked handled, and the cancellation email goes to the family in their language. In SQL, `owner_cancel_for_request` checks the owner first and uses the same `private.cancel_pass` as the family. `cancel_pass` cannot be called from outside. |
| 4 Note visible to family | **Fixed** | Settings, Payment history (he, da) shows: refunded on, amount returned 95.00, fee kept 5.00, and the owner's note. The note label sits on its own line, and a mixed Hebrew/English note reads correctly. The family can already read the table (`grant select` + `refunds_read` policy). |
| 5 Classroom film on short screens | **Fixed as described, still weak** | The page is 448 px wide at 844 x 390, 667 x 375 and 568 x 320 (it was 67 px). The back button is on one line and nothing scrolls sideways. However, the video starts about 200 px down and its bottom edge sits below the 390 px screen. The whole film, with its controls, is only seen by scrolling or by pressing "Full screen". See point N1. |
| 6 Classroom with no access | **Fixed** (see N2) | Library (he, da): one note "for the grown-up" plus the trial button, no locked wall, and no links to passes. The locked story page and the film page have no "See passes" button. |
| 7 Checkout price check | **Fixed** | The SQL `create_order(..., p_expected_agorot)` refuses `price_changed` with `is distinct from`, so setting or removing a price is caught as well. The old 4-argument version was dropped, and no other caller exists. In the browser (he, da): price 49.90 → 59.90 while open → notice with the new total, and no order was made. The price removed while open → refused as well, no order. The new price was then accepted. |
| 8 Search engines | **Fixed** | The `plain` build has `robots.txt` set to `Disallow: /` and a noindex meta tag. The launch build with a real `SITE_ORIGIN` allows crawling and has no noindex. A launch build with the placeholder address is refused. |
| 9 Per-pass price honesty; seller | **Fixed** | The home teaser shows "not set for every age group" for 1 month, nothing for 3 months (all priced) and "not set yet" for 12 months, in he and da. In SQL, `create_order` refuses a real provider with `seller_not_set`. |
| 10 Wording | Listed, not changed | As planned, in `docs/emails/REVIEW-NOTES.md`. |

## New points (none blocking)
- **N1. WEAK, classroom film on a phone held sideways** (`src/routes/app/watch.tsx:46`). At 844 x 390 the film
  is 448 px wide, but it starts below the header, the test-mode banner and the back button. Its picture runs past
  the bottom of the screen and the controls end near y = 600. To reproduce: classroom teacher with a pass, open
  `/he/app/story/sample-b/watch` at 844 x 390. On a launch build the test banner is gone, so it improves a
  little. A teacher can still press Full screen. Possible later step: when the screen is short and wide, hide the
  site header or put the back button beside the film.
- **N2. WEAK, the classroom story page still leads to the passes** (`src/routes/app/story.tsx:113-118`). When a
  story is locked, the four big door pictures (Read, Listen, Watch, Do) still link to `app/plans`, even in classroom
  mode. Children will tap them. The "See passes" button itself is gone. The plans page and checkout sit behind the
  parent gate, so this is not a safety problem, but the fix note "no class screen leads to the passes" is not quite
  true. To reproduce: teacher with an ended trial, `/he/app/story/b02/`, tap a door.
- **N3. LOW, the order number is missed when glued to a word ending in a-f** (`src/data/rules.ts:96` and the same
  regex in SQL `private.order_ref_matches`). "Ref-3F2A1B9C", "Code-…" or Danish "Ordre-…" are not matched, because
  the regex swallows the letter and hyphen in front. "ORDER-…", "#…" and "Order …" do match. In the browser
  ("Ref-3F2A1B9C", correct email) the owner sees "no matching order" and must reply by email. Harmless, but easy to
  widen: try every start position, or strip a leading word.
- **N4. LOW, wording and an unmapped error.**
  - When the price is *removed* while checkout is open, the notice reads "The total is now ‹Price not set yet›".
    This is awkward grammar in he and da.
  - `seller_not_set` is not in `ERROR_CODES` (`src/data/errors.ts`), so a refusal will show the generic error. This
    only matters once a real payment company is connected.

## Could not check
- A real Supabase project. The SQL was read and the PGlite tests were re-run, but nothing ran on Postgres/PostgREST
  itself.
- A sent email. The email code path was read, and its unit test passes.
- Safari/WebKit, a real iPhone held sideways (`dvh`), and screen readers.
- Arabic and English screens (the builder covered them) and the owner screens at 1440 px.
- The full Playwright and unit suites. Only the three fix test files were re-run.
- A native reading of the Hebrew and Danish wording.
