# Stage 4 part A: fresh review (22 Nov 2026)

Reviewer: fresh context, no part in the build. Read: the three migrations, `supabase/functions/payment-callback/`,
`src/data/**`, the account and checkout routes, `tests/db/**`, `tests/local-data.test.ts`, `CLAUDE.md`,
`docs/PRODUCT-CHECKLIST.md`. Ran `npm test` (65 of 65 pass). Wrote two throwaway probes (outside the repo) that
load the same stand-in and migrations into PGlite and try the attacks below. Every "confirmed" below was run.
No code was changed.

**Headline.** Paid content is locked well: every table has row-level security, the paid tables are tied to one
access function, no user can make themselves owner or give themselves a trial, pass or order row directly, and
every `security definer` function has an empty search path and no dynamic SQL. The problems are around that core:
the payment edge function cannot be called from a browser, the owner account breaks the Supabase data layer, the
database accepts accounts that never accepted the terms, and a few payment-state and future-table gaps.

Count: **BROKEN 2 · RISK 8 · WEAK 14 · FINE 12**

---

## BROKEN

### B1. The payment callback cannot be called from the browser (test checkout dead on Supabase)
- File: `supabase/functions/payment-callback/index.ts:30-31`; caller `src/data/supabase/index.ts:307-308`.
- Evidence: `functions.invoke` from the browser sends `authorization`, `apikey`, `x-client-info` and
  `content-type: application/json`, so the browser first sends an `OPTIONS` preflight. The function answers every
  non-POST with `405` and never sends `Access-Control-Allow-*` headers, so the browser blocks the call. The test
  pay page in Supabase mode always fails; no pass can be bought on a preview project. (The local backend hides
  this because it never goes over the network.)
- Fix: at the top of the handler, `if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })`,
  and add the same `cors` headers (`Access-Control-Allow-Origin: <site origin>`,
  `Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type`,
  `Access-Control-Allow-Methods: POST, OPTIONS`) to every `json()` response. Allow only the site's own origin.

### B2. The owner account breaks `getAccess`, and sees every customer's passes and orders as its own
- File: `src/data/supabase/index.ts:270` (trials `.maybeSingle()`), `:271` (passes), `:302` (orders).
- Evidence: the policies `trials_read`, `passes_read`, `orders_read` (`20261122100100_access.sql:161-182`) let the
  owner read every account's rows (confirmed: owner reads 2 trials and 2 passes in the probe). With two or more
  trials in the database, `.maybeSingle()` returns an error for the owner, so `useAccess` fails and the library,
  plans and checkout screens show an error for the owner. Settings would list other customers' passes and orders
  as the owner's own (with "Cancel this purchase" buttons that then fail). The local backend filters by account
  and does not show this.
- Fix: add `.eq('account_id', uid)` to the trials, passes and orders reads (and to `getOrder`), in the data layer
  for "my" screens. The owner's area (part B) should use its own queries.

---

## RISK

### R1. The database accepts an account that never accepted the terms or confirmed being an adult
- File: `supabase/migrations/20261122100200_flows.sql:12-32` (`handle_new_user`).
- Evidence (confirmed): a sign-up with metadata `{ "role": "parent" }` only (anyone can call GoTrue's
  `/auth/v1/signup` directly with the public key) creates a profile with no `terms` and no `adult` consent; that
  account then started a trial and read paid story text. The sign-up screen and the local backend refuse this
  (`src/data/local/server.ts:151`), so the tests pass locally while the real database lets it through.
  Contradicts checklist section 3 MUSTs ("Accounts are for adults", agreement "recorded with the terms version").
- Fix: in `handle_new_user`, `raise exception 'terms_required'` unless `terms_accepted` and `adult` are true and
  `terms_version` is a non-empty known version; GoTrue then rejects the sign-up. Add a database test for it.

### R2. A "cancelled" or "failed" event that arrives before the success event loses a paid purchase
- File: `20261122100200_flows.sql:144` (`order_not_pending`) and `:179-181`.
- Evidence (confirmed): `record_payment_failure(... 'payment_cancelled')` then `confirm_payment(...)` for the same
  order raises `order_not_pending`; the whole call rolls back, so the success event is not even stored
  (`provider_events` has no row). With a real hosted page (a buyer cancels once, then pays on retry, or events
  arrive out of order) the customer is charged and gets no pass, and the provider retries forever.
- Fix: in `confirm_payment`, accept a verified success for an order in `failed` or `cancelled` state too (amount
  still checked), or store the event and flag the order for the owner instead of raising. Add a test.

### R3. A trial can be restarted by deleting the account and signing up again
- File: `20261122100200_flows.sql:64-85, 227-238`; `trials.account_id` cascades on delete.
- Evidence (confirmed): trial, `delete_my_account()`, sign up with the same email, `start_trial` succeeds again.
  Known (open decision 8), but the checklist MUST "Trial is one per account" and section 23 "without a second
  trial" are not met, and the screens do not warn about it.
- Fix (after the lawyer's answer): a `trial_ledger (email_hmac text primary key, used_at)` that account deletion
  does not remove, written by `start_trial` (read the email from `auth.users` inside the definer function) and
  checked before starting. Say it in the privacy policy.

### R4. Every future table and function is open to signed-out visitors by default
- File: `20261122100100_access.sql:19-20, 108` revoke only what exists at that moment.
- Evidence (confirmed in `pg_default_acl`): new tables get `arwdDxtm` and new functions get `EXECUTE` for `anon`
  and `authenticated` (this is Supabase's real default too). Part B adds favourites, storage helpers and owner
  functions: one table that forgets `enable row level security`, or one `security definer` function that forgets
  its revoke, is open to the whole internet.
- Fix: in migration 2 add `alter default privileges for role postgres in schema public revoke all on tables from
  anon, authenticated;` and the same for sequences and `on functions from public, anon, authenticated;`. Add a
  database test that lists every public table (must have RLS and at least one policy) and every function's
  `has_function_privilege` against an allow-list, so a new object fails the test until it is reviewed.

### R5. The database lets any order use the test provider, at real prices, in production
- File: `20261122100200_flows.sql:93-112` (`create_order`).
- Evidence (confirmed): with a real price set, `create_order('2-3', 1, 'test', ...)` and `create_order(..., 'zzz',
  ...)` both succeed. The only thing between that and a free pass is `ALLOW_TEST_PAYMENTS` in the edge function's
  environment; one wrong setting on the production project gives every pass away.
- Fix: refuse unknown providers in `create_order` (allow-list), and refuse `'test'` in both `create_order` and
  `confirm_payment` unless a database setting says test payments are on
  (`current_setting('app.allow_test_payments', true) = '1'`, set only on the preview project).

### R6. The public "Cancel a purchase" form has no limit
- File: `20261122100200_flows.sql:212-217`, granted to `anon` at `:329`.
- Evidence: any visitor can call `request_cancellation` in a loop with the public key: unlimited rows, a flooded
  owner list, and later (part B) a flood of emails. The handoff lists rate limiting as not built.
- Fix: send the form through an edge function with a CAPTCHA (for example Cloudflare Turnstile) and a per-IP
  limit, and revoke `anon` execute on the SQL function; at least cap rows per email per hour inside the function.

### R7. Account deletion is unproven where it matters
- File: `20261122100200_flows.sql:227-238`; tests `tests/db/access.test.ts:292-303`.
- Evidence: PGlite runs the migrations as a superuser, so the definer function deleting from `auth.users` proves
  nothing about Supabase, where the function's owner is the non-superuser `postgres` role. If the delete is
  refused, the "Delete account" button fails for everyone (a legal right, checklist section 13). Deletion also
  signs out only this device (`src/data/supabase/index.ts:234`); other devices keep a working access token until
  it expires (confirmed harmless: writes fail on the missing profile).
- Fix: do it in an edge function with `auth.admin.deleteUser(uid)` after reading the caller's JWT, keep the SQL
  part for the deletion record, and run it once against a local Supabase (`supabase start`) before launch.

### R8. The price shown before paying is not the price charged
- File: `src/routes/app/checkout.tsx:56`, `src/features/commerce/PlanCards.tsx:19` read the static
  `src/data/prices.ts`; `create_order` charges from `pass_prices`.
- Evidence: when the owner sets a price in the database, checkout still shows "Price not set yet" (or an old
  number) while the order charges the database price. Checklist section 15 MUST: the summary before paying shows
  the total with VAT.
- Fix: checkout and in-app plan cards use `api.listPrices()`; the pre-rendered public plans page is built from the
  same source, with a test that both lists match.

---

## WEAK

### W1. Users can write any consent row they like
- `20261122100100_access.sql:156-157`. Confirmed: a user inserted `adult = true` and `terms` for version `v99` with
  source `checkout`. The consent record stops being proof of what the person actually saw.
- Fix: the insert policy allows only `kind = 'marketing' and source = 'settings' and terms_version is null`; terms
  at checkout are written only by `create_order` (already done there).

### W2. A failure event from one provider can fail another provider's order
- `20261122100200_flows.sql:167-184`. Confirmed: `record_payment_failure('cardcom', ...)` marked a `test` order
  failed. `confirm_payment` checks the provider; this one does not (the local backend does).
- Fix: `if (select provider from orders where id = p_order_id) is distinct from p_provider then raise ...`.

### W3. A repeated event id answers with the wrong order's pass
- `20261122100200_flows.sql:132-135`. Confirmed: replaying event `e3` with another order's id returns that other
  order's pass. Service role only, but misleading in logs.
- Fix: on a repeat, return the pass of the order stored on the original `provider_events` row, and raise if the
  order ids differ.

### W4. Cancelling a pass leaves the next, queued pass waiting
- `20261122100200_flows.sql:192-209`. Confirmed: after cancelling pass 1, pass 2 still starts on pass 1's old end
  date, so a paying customer has no access until then.
- Fix: when a pass is cancelled, move later active passes of the same group earlier by the unused time (and show
  the new dates).

### W5. The 5-profile limit can be beaten by parallel requests
- `20261122100200_flows.sql:50-59`. One statement with 7 rows is refused (confirmed), but two concurrent
  transactions each count 4 and both insert.
- Fix: `perform 1 from public.profiles where id = new.account_id for update;` before counting.

### W6. "Download my data" is incomplete, and the two backends disagree on its shape
- `20261122100200_flows.sql:242-256`; `src/data/local/server.ts:328-345`.
- Missing in SQL: the email address, trial stories (`trial_items`), deletion and cancellation requests, emails
  sent (`email_log`). Local has `account`/`profiles` keys and no progress; SQL has `profile`/`children`/`progress`.
- Fix: one documented shape for both; add the missing parts (email from `auth.jwt() ->> 'email'`).

### W7. Personal data left behind after deletion
- Confirmed: `audit_log` keeps the deleted account's pass rows (with `account_id`) for ever. Also kept:
  `email_log.to_email`, `cancellation_requests.email`, and `provider_events.payload` (real providers send name,
  email and sometimes phone).
- Fix: `delete_my_account` scrubs the account id in `audit_log.detail` and nulls `email_log.to_email`; the callback
  strips personal fields before storing the payload; list what is kept, and why, in the privacy policy.

### W8. The legal cap on the cancellation fee is not enforced by the database
- `20261122100000_schema.sql:245-255` and the owner update policy `20261122100100_access.sql:186-190`.
- Fix: `check (fee_agorot is null or amount_agorot is null or fee_agorot <= least(floor(amount_agorot * 0.05), 10000))`.

### W9. The author's text lock is a switch the owner can flip
- `20261122100200_flows.sql:261-273`. Confirmed: owner sets `text_locked = false`, then edits the text. Rule 3
  says no edit without her written consent.
- Fix: unlocking requires a `text_unlock_consent_ref` (a recorded consent document); a trigger refuses
  `text_locked = false` without it. The audit log already records who unlocked.

### W10. Supabase settings that the security depends on are not in the repo
- No `supabase/config.toml`. Needed: email confirmation on, minimum password 8 (screens say 8, Supabase default
  is 6), secure password change (re-authentication), redirect allow-list limited to the site, auth rate limits,
  leaked-password check, and `verify_jwt = false` for `payment-callback` once a real provider calls it.
- Fix: commit a `config.toml` with these, and a launch checklist line to copy them to the hosted project.

### W11. Unbounded orders per user
- `create_order` can be called in a loop; each call writes an order and a consent row. Fix: refuse a new order
  while the same account has more than a few `pending` orders from the last hour.

### W12. The local backend is not the same rules as the SQL (each divergence)
| Divergence | Local | SQL / Supabase | Rank |
|---|---|---|---|
| Sign-up without terms/adult | refused | accepted | RISK (R1) |
| Owner's own trial, passes, orders | own only | everyone's | BROKEN (B2) |
| Consent writes by the user | marketing only | any kind (W1) | WEAK |
| Failure event from another provider | refused | accepted (W2) | WEAK |
| Test event for someone else's order | accepted (`local/index.ts:192-205`) | refused by edge function | WEAK |
| Test provider when a real price exists | prices are static, cannot happen | accepted (R5) | RISK |
| Prices | static `prices.ts` | `pass_prices` table (R8) | RISK |
| Export shape and contents | different keys, no progress | W6 | WEAK |
| Network path for test payments | in-process | edge function, CORS (B1) | BROKEN |
| Deletion | in memory | `auth.users` delete unproven (R7) | RISK |
| Sign-in rate limit, password length | in code (10 per 15 min, 8 chars) | Supabase config, not in repo (W10) | WEAK |
| Trial, pass, queue, 14-day rules | same | same | FINE |
- Fix: one shared scenario file run against both backends (the local server and PGlite through a thin SQL
  adapter), so a rule cannot pass in one and differ in the other.

### W13. What the tests prove versus what they claim
- `tests/db` does prove the row-level security of every paid table, the access function, trial, pass queue,
  idempotent callback, wrong amount, 14-day window, locked text, isolation between two accounts. Good tests.
- They do not prove: anything about privileges of the function owner on Supabase (PGlite runs as superuser, R7);
  the Supabase data layer (`src/data/supabase/index.ts` has no test at all, which is how B2 slipped through); the
  edge function (B1); auth error mapping.
- Missing cases: sign-up without consents (R1); failure-then-success (R2); delete and re-sign-up trial (R3); a
  catalogue of all tables and function grants (R4); test provider at a real price (R5); consent forging (W1);
  provider mismatch on failure (W2); cancel with a queued pass (W4); parallel profile inserts (W5); export
  contents (W6); data left after deletion (W7); fee cap (W8); owner unlocking text (W9); PostgREST embedding of
  paid tables through `progress` or `stories` (RLS applies, but one test would pin it).

### W14. Checklist MUSTs still open in part A (known, listed so they are not lost)
- Change of email with a link to the new address (section 13): not built.
- Confirmation email after deletion and after cancellation (sections 13, 19): no email service yet.
- "Trial is one per account" (section 3) and "no second trial after deletion" (section 23): see R3.
- Terms and adult box recorded with version and time (section 3): only by the screen, not the database (R1).
- Summary before paying with the real total (section 15): R8.

---

## FINE (checked, no change needed)
1. All 27 public tables have row-level security enabled and at least one policy (confirmed by catalogue query).
2. Story texts, pages, films, activities and activity steps are readable only through `has_access_to_story`;
   draft stories only by the owner; expired or cancelled trial or pass locks again (tests and probes agree).
3. No direct insert into trials, passes, orders, payments, refunds or provider events; no user path to the owner
   role (`role` column not granted; `set_my_role` refuses owner; sign-up metadata maps only parent or teacher).
4. Every `security definer` function has `search_path = ''`, uses no dynamic SQL from user input, and the payment
   functions are callable only by the service role (confirmed with `has_function_privilege`).
5. Accounts are isolated: children, progress, consents, trials, orders, payments, passes, refunds (confirmed,
   including progress on another account's child: refused).
6. Price comes from the database, never the browser; `confirm_payment` checks provider and amount, locks the
   order row, and stores each provider event once (`unique (provider, event_id)`).
7. A trial cannot be restarted on the same account; `trials.account_id` is unique.
8. A deleted account's still-valid token can no longer start a trial or create an order (foreign key refuses).
9. `?next=` and `?return=` go through `safeNext` (`src/features/account/parts.tsx:29-32`): only same-site paths.
10. No HTML injection: the one inline script (`src/routes/pick-language.tsx:20`) is built from constants.
11. No service key or secret in the client or the repo; the publishable key is the only key the browser uses.
12. Sign-in uses one message for wrong password and unknown email; reset and resend say nothing either way;
    sign-up says "email already used" as the checklist decided. The local seed holds only placeholder text, so no
    paid text ships in the bundle (rule 6).

---

## Fixes (22 Nov 2026)

By a builder, after this review. Database changes are in a new migration,
`supabase/migrations/20261122110000_review_fixes.sql` (earlier migrations untouched). New tests: 42 in
`tests/db/review-fixes.test.ts` (18), `tests/db/catalogue.test.ts` (5), `tests/db/supabase-data-layer.test.ts` (3),
`tests/payment-callback.test.ts` (6), `tests/local-review-fixes.test.ts` (10). Checked that they fail before the fix:
20 of the 23 database tests fail without the new migration (the other 3 are standing guards that were already true:
every table has RLS, the function allow-list, the price-list match); the 3 data-layer tests' 2 owner cases fail
without the account filters; all 10 local tests fail on the previous local backend. Three existing tests changed
because the rule they pinned changed: `access.test.ts` (a `cardcom` order now needs the provider to be connected
first; unlocking the author's text in the clean-up now needs a consent reference) and `local-data.test.ts` (a
`cardcom` order is refused as "not connected"; cancelling a pass now moves the queued pass forward, so access stays).

New in the database: a `private` schema that no API role can reach (`private.settings`: test payments switch,
connected providers, the trial-record salt; `private.terms_versions`; `private.trial_ledger`). On the preview
project run `update private.settings set allow_test_payments = true;`. Production leaves it off.

| # | Status | What was done | Proof |
|---|---|---|---|
| B1 | Fixed (needs a real project to run) | Request handling moved to `supabase/functions/payment-callback/handler.ts` (no Deno imports); `index.ts` only wires it. OPTIONS answered with 204 and allow headers; every response carries `Access-Control-Allow-*` and `Vary: Origin`, but only for origins listed in the `SITE_ORIGINS` function secret (exact origins; `*` and malformed entries are dropped); other origins get no allow headers (403 on preflight). | `payment-callback.test.ts`: preflight from the site, refused preflight from elsewhere, headers on 405/400/401/422/200, no headers without Origin |
| B2 | Fixed | `src/data/supabase/index.ts`: trials, passes, orders and `getOrder` filtered by the signed-in account. Better than changing the policies, which part B's owner area relies on. The class now takes an optional client, so it can be tested. | `supabase-data-layer.test.ts`: the data layer runs against the real policies through a small query-builder stand-in; the owner gets no trial, passes or orders of others, and another account's order is "not found" |
| R1 | Fixed | `handle_new_user` raises `terms_required` unless `terms_accepted` and `adult` are JSON `true` and `terms_version` is in `private.terms_versions` (seeded with `draft-2026-11-22`). `create_order` checks the version too. Local backend: sign-up and orders accept only `TERMS_VERSION`. Side effect: users added in the dashboard or by a future social sign-in are refused unless their metadata carries the same fields. | `review-fixes.test.ts` R1 (role-only metadata, no adult, no terms, `"true"` as text, unknown and null version; plus the site's `TERMS_VERSION` is published); `local-review-fixes.test.ts` R1 |
| R2 | Fixed | `confirm_payment` accepts a verified success for a `failed` or `cancelled` order (amount still checked); the same in the local backend. | `review-fixes.test.ts` R2 (cancelled then paid; failed, wrong amount refused, then paid); local R2 |
| R3 | Fixed | `start_trial` writes a salted SHA-256 of the lower-cased, trimmed email and the day into `private.trial_ledger`, kept after deletion, and refuses a trial for a hash already there. Local backend keeps the same record. Noted for the lawyer in `docs/LEGAL-CHECKLIST.md` question 10. Not caught: a different address (including `+tag` aliases). Reading `auth.users.email` from the function is not proven on Supabase. | `review-fixes.test.ts` R3 (delete, re-sign-up with `" Again@Example.test "`, refused; another address allowed; the record holds no email and is not the plain hash); local R3 |
| R4 | Fixed | Default privileges for `postgres` in `public`: nothing for anon/authenticated on new tables, sequences and functions; no EXECUTE for PUBLIC on new functions. Tables made earlier keep their grants, so anon's privileges on every public table except `age_groups` and `pass_prices` are revoked (this closed anon's default grant on part B's `email_suppressions`). | `catalogue.test.ts`: every table has RLS and a policy; anon touches only the two tables; anon and authenticated can call only the reviewed functions (a new one fails until listed); a table, function and sequence created afterwards are closed; the private schema is unreachable |
| R5 | Fixed | `create_order` refuses `test` unless `private.settings.allow_test_payments`, and any other provider not in `private.settings.payment_providers` (`provider_not_connected`); `confirm_payment` and `record_payment_failure` refuse `test` when the switch is off. Local backend (always test mode) refuses every provider but `test`. | `review-fixes.test.ts` R5 on a production-like database (test off: order and confirm refused; `zzz` and unconnected `cardcom` refused; connected `cardcom` takes the database price); local R5 |
| R6 | Partly fixed | `request_cancellation` (and the local backend) allow 3 requests an hour per email address. NOT fixed: the CAPTCHA and per-IP limit through an edge function, which needs a CAPTCHA account (for example Cloudflare Turnstile): an account needs the owner's yes. A flood with many different addresses is still possible until then. | `review-fixes.test.ts` R6; local R6 |
| R7 | Needs a real Supabase project | Not changed. Whether the function owner may delete from `auth.users` on Supabase can only be shown on a project (the same question applies to R3's read of `auth.users.email`). The code comment in `delete_my_account` already names the fallback (an edge function with `auth.admin.deleteUser`). Other devices: deleting the user removes its sessions and refresh tokens; an access token lives until it expires and can write nothing (reviewer confirmed). | none possible here |
| R8 | Fixed (screens checked by typecheck only) | New `src/features/commerce/usePrices.ts` loads `api.listPrices()`; checkout (`src/routes/app/checkout.tsx`) shows that price (the one `create_order` charges) and the in-app plans page passes it to `PlanCards`. The pre-rendered public plans page keeps the static list. | `review-fixes.test.ts` R8: the static list equals the database's prices. The e2e walk-through was not re-run |
| W1 | Fixed | Consent insert policy: only `kind = 'marketing'`, `source = 'settings'`, no terms version. | `review-fixes.test.ts` W1 |
| W2 | Fixed | `record_payment_failure` checks the order's provider (`provider_mismatch`). | `review-fixes.test.ts` W2 |
| W3 | Fixed | A repeated event id naming another order raises `event_order_mismatch`; same in the local backend. | `review-fixes.test.ts` W3; local W3 |
| W4 | Fixed | Cancelling a pass moves the same group's queued passes earlier by the time it had left (SQL and local). | `review-fixes.test.ts` W4; local W4 |
| W5 | Fixed, not testable here | `limit_children` locks the account's profile row before counting. PGlite has one connection, so two parallel transactions cannot be run. | none |
| W6 | Fixed | One shape for both backends (`tests/export-shape.ts`): `exported_at, email, profile, children, progress, consents, trial (with story_ids), orders, payments, passes, refunds`. SQL takes the email from the JWT. Not added: deletion and cancellation requests and email log (owner-only tables). | `review-fixes.test.ts` W6; local W6 |
| W7 | Partly fixed | The callback now stores only the six fields it understands in `provider_events.payload`. Not done: scrubbing `audit_log` and `email_log` on deletion (the audit rows keep a bare account id that no longer leads to a person; `email_log` belongs to part B's email work). The privacy-policy list of what is kept is for the lawyer. | `payment-callback.test.ts` (extra fields dropped) |
| W8 | Fixed | A trigger refuses a fee above the lower of 5% of the price paid or 100 shekels (`fee_over_cap`), measured on the order's amount rather than the refund's (which the owner may lower). | `review-fixes.test.ts` W8 |
| W9 | Fixed | New column `stories.text_unlock_consent_ref`; a trigger refuses `text_locked` true to false without a new, non-empty reference. | `review-fixes.test.ts` W9 |
| W10 | Fixed (not verified) | `supabase/config.toml`: only `public` exposed, email confirmation, 8-character passwords, secure password change, double-confirmed email change, redirect allow-list, auth rate limits, 24-hour links, `verify_jwt = false` for payment-callback; hosted-only settings listed at its end. The domain is a marked placeholder. The CLI is not installed here. | none |
| W11 | Fixed | At most 5 unpaid orders an hour per account (`rate_limited`), SQL and local. | `review-fixes.test.ts` W11; local W11 |
| W12 | Fixed except the shared scenario file | Each named divergence now has the same rule on both sides (R1, B2, W1, W2, test event for another account's order: local now refuses it, R5, R8, W6). Deletion and sign-in limits stay as they were (R7, W10). Not built: one scenario file run against both backends through a SQL adapter: a larger piece of work than a fix. | `local-review-fixes.test.ts` W12 and the rows above |
| W13 | Fixed in part | Added: the data layer test (B2), the edge function test (B1), and every missing case listed except parallel profile inserts (W5) and PostgREST embedding (needs a real project). | the files above |
| W14 | Not fixed here | Change of email and confirmation emails belong to part B's email work. Terms and adult (R1), one trial per person (R3) and the real total before paying (R8) are now covered. | n/a |

Test run after the fixes: `npm test` 153 tests, 151 pass. The 2 failures are in `tests/local-data.test.ts` and come
from another builder's half-written story folder `content/stories/b02/` ("no language file"), not from these fixes.
`npm run typecheck`: no errors in the files touched here; the only errors are in `src/studio/` (another builder's
work in progress).
