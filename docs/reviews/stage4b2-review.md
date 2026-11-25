# Fresh review: Stage 4, part B2 (the owner's area and the emails)

Reviewer: a fresh-context helper, 25 Nov 2026. Read: `src/features/owner/`, `src/routes/app/owner/`, `src/emails/`,
`supabase/functions/` (email functions), `supabase/migrations/20261122100300_owner_emails.sql` together with the
earlier migrations it depends on, `docs/emails/REVIEW-NOTES.md`, the B2 section of `docs/HANDOFF.md`, and the B2 tests.
Nothing was deployed or run against a real Supabase project or Resend (none is approved); SQL is proven in PGlite.

**Result:** three things were broken (a draft language of a published story was readable by families; a published
story could be edited until a language was empty; the account-deleted email was never sent). All three are fixed,
with five risks and six cheap weak points, each with a test that failed before and passes after.

Ranks: **BROKEN** = does the wrong thing today. **RISK** = safe only while nobody makes a mistake or a setting is
missing. **WEAK** = works, could be better.

## Findings

### 1. Owner-only access and the author's text
- **OK.** Every owner screen sits behind `routes/app/owner/layout.tsx` (a courtesy check); the real guards are
  `LocalOwnerServer.owner()` on every local call and, on Supabase, `is_owner()` inside every `owner_*` function plus
  the owner-only write policies of part 2. A parent cannot make itself owner (`set_my_role` refuses, `profiles.role`
  is not an updatable column). `email_audience`, `email_new_stories` are service-role only. Storage writes need
  `is_owner()`. Tests: `tests/owner-data.test.ts`, `tests/db/owner-emails.test.ts`, `tests/db/access.test.ts`.
- **RISK R2: the author's Arabic title and page list were locked only inside `owner_save_story()`**
  (`20261122100300_owner_emails.sql` lines 251-265). Her page words were also locked by a table trigger
  (`guard_locked_text`, part 3), but her title in `story_listings` and her page list in `pages` could be changed by a
  direct table write (the owner's API rights allow it). Fix: table triggers `story_listings_locked` and
  `pages_locked` (new migration). Pictures and layout of existing pages can still change.
- **WEAK (not fixed): `story_lang_complete()` and `story_lang_fingerprint()` are SECURITY DEFINER and callable by any
  signed-in user** (lines 36-69, 532). They reveal only "complete or not" and an MD5 of a language's content; nothing
  readable. Restricting them needs `owner_story()` restructured (it runs as the caller and calls them).

### 2. Publishing rules
- **BROKEN B1: a language that is not published was readable by families.** "Publish in these languages only" stored
  `published_langs`, but the read policies on `story_listings`, `story_texts` and `films` checked only that the story
  is published (`20261122100100_access.sql` lines 231-283). A family with access could read the draft Hebrew words of
  a story published in Arabic only. Fix: `story_lang_visible()` and language-aware read policies.
- **BROKEN B2: a published story could be edited until a published language was empty.** `guard_publish()` runs only
  when a story becomes published (line 95), and editing a published story is live at once, so a save could remove a
  page's Danish words, a picture or the age group while the story stayed published. Fix: the trigger
  `stories_published_complete` refuses such a save (it runs on the version bump that ends every real save), the same
  rule in the local store (`publishedGaps()` in `rules.ts`), and a plain error in four languages
  (`errors.publishedIncomplete`). Sign-offs may still go stale on edit, as the builder decided; the editor shows it.
- **RISK R1: a story could be inserted already published.** `guard_publish()` is a BEFORE UPDATE trigger only (line
  124). Fix: `stories_publish_guard_insert` refuses a published insert from a signed-in caller (server imports, which
  have no signed-in user, are unchanged).
- **OK:** at most 3 trial stories per group (trigger + local); drafts are invisible (`stories_read` and
  `story_is_published`); every content table has an audit trigger with the actor, and the local store logs every
  real change, publish and unpublish.
- **WEAK (not fixed):** two saves at the very same moment could both pass the trial count (read-committed); there is
  one owner, so this is theoretical. Deleting a `media` row empties a page picture through `on delete set null`,
  which the completeness rule does not see; the owner's area offers no file deletion.
- **WEAK (not fixed):** `activities.texts` holds every language in one JSON value, so a family with access can read
  the activity words of an unpublished language. Low value; needs a per-language column or a view.

### 3. Uploads
- **OK:** type by first bytes, extension, size per purpose, empty files and missing licence refused in the data layer
  (`checkUpload`, used by both stores, not only the form); `media` records source, licence, credit, name, type,
  size; storage paths are `<purpose>/<random uuid>-<name>` in a private bucket whose read policy requires a `media`
  row the caller may read (`can_read_media`), so a guessed path gives nothing.
- **WEAK W1 (fixed): a HEIC or AVIF picture renamed `.mp4` passed as a film** (`sniffMime`, the `ftyp` box is shared).
  Now only video brands count.
- **WEAK (not fixed):** the bucket has one 500 MB limit for every purpose; the per-purpose limits live in the data
  layer. Only the owner can write, so this is acceptable. Storage policies are skipped in PGlite: unproven.

### 4. Emails
- **OK:** 19 templates x 4 languages render with no unfilled value, the right `lang`/`dir`, right-aligned blocks in
  Arabic and Hebrew, isolated addresses and links, no images. Purchase confirmation goes in the buyer's language with
  the cancellation page link and the 14-day rule. "New story" goes only to accounts whose latest choice is yes, starts
  with `פרסומת` in every language, carries a signed one-click link and RFC 8058 headers. Service reminders carry no
  offer. The scheduler claims a unique key before sending, skips suppressed addresses, and uses Israel time with quiet
  hours. Links use `<site><lang>/app/...` paths that exist.
- **BROKEN B3: the account-deleted email was never sent** (reported by the builder). Fix: `delete_my_account()` now
  captures the address and language, then queues the email in `email_log` before deleting the account;
  `email_claim_queued()` (service role only, `for update skip locked`) hands each row to one run; the email job sends
  it with an idempotency key from the row id, skips a suppressed address, retries for 7 days.
- **RISK R5: an invented business detail.** The purchase confirmation said in every language that the tax receipt
  comes "in a separate email from the payment company". No payment company or receipt process is chosen (master
  plan section 6-7). Now a visible placeholder in square brackets in all four languages.
- **WEAK W2 (fixed):** once the owner sets the support address and business details, the "how to cancel by email or
  post" line still showed the placeholder. It now shows both.
- **WEAK W3 (fixed):** reminder links point to `settings/#passes`, but the passes section had no `id`. Added
  (`src/routes/app/settings.tsx`; not covered by a test).
- **WEAK (not fixed):** the unsubscribe link acts on GET; a mail scanner that opens links could switch news off. This
  errs on the side the law prefers. A confirm page would need a site page (edge functions cannot serve HTML).
- **WEAK (not fixed):** `email_audience()` falls back to another language's trial-story title, which could be a draft
  language's title.

### 5. Edge functions
- **OK:** the auth hook verifies the Standard Webhooks signature (an empty secret makes the library throw: 401); the
  bounce webhook verifies Svix with a 5-minute window; the job needs `CRON_SECRET`; no secret is in code or logs
  (only error messages and template names are logged); no CORS headers at all, which is right for server-to-server
  calls (a browser on another site cannot read the answers).
- **RISK R3: an empty `UNSUBSCRIBE_SECRET` would sign links with an empty key**, so anyone could unsubscribe anyone.
  Now a secret shorter than 32 characters signs nothing and verifies nothing, and the job skips news without one.
- **RISK R4: an empty `RESEND_WEBHOOK_SECRET`** gave an empty HMAC key. Now refused outright.
- **WEAK W4 (fixed):** the bounce webhook trusted the JSON shape after the signature (a crash = 500); now checked (400).
  The unsubscribe function's language lookup used any query value as a key; now only the four languages.
- **WEAK W5 (fixed):** `listAudit(storyId)` put the id into a PostgREST filter string; now only a real id is accepted.
- **WEAK (not fixed):** `CRON_SECRET` is compared with `!==`, not in constant time; over HTTPS with a long random
  secret this is not practically exploitable.

### 6. Usability for the owner
- The editor is a long form with sections, plain labels, per-language gap lists and a fixed save bar; errors are
  plain sentences in the owner's language (checked in the dictionary files, not in a browser by this reviewer).
- **WEAK (not fixed):** the preview shows the family's content in a plain view, not the family reader itself (the
  builder reported this). The owner cannot yet see a page exactly as a family does.

### 7. Tests: what they prove versus claim
- Proven: owner rules in both stores, the SQL in PGlite (functions, triggers, policies), every template renders in
  four languages, the scheduler's timing rules, Resend request shape, signatures.
- Not proven anywhere: the four edge functions in Deno, the storage bucket and its policies (skipped in PGlite),
  signed links, the auth hook's link format, pg_cron, Resend itself. The new `sendQueued()` path is also Deno-only:
  its pure part (`queuedEmail()`) is unit-tested and the SQL queue is tested in PGlite.
- Missing before this review (now added): published-language visibility, editing a published story, direct writes
  to the author's title, the deletion email, empty secrets.

## Fixes

| Finding | Fix | Test (failed before, passes after) |
|---|---|---|
| B1 draft languages visible | `story_lang_visible()`, new read policies | `tests/db/owner-emails-review.test.ts` "B1" |
| B2 published story loses a language | trigger `stories_published_complete`; `publishedGaps()` in local store; error `published_incomplete` + 4-language message | db "B2"; `tests/owner-emails-review.test.ts` "B2" |
| B3 account-deleted email | `delete_my_account()` queues it; `email_claim_queued()`; `queuedEmail()`; `sendQueued()` in the job | db "B3" (2 tests); unit "B3" (new code, 2 tests) |
| R1 published insert | trigger `stories_publish_guard_insert` | db "R1" |
| R2 author's title and pages | triggers `story_listings_locked`, `pages_locked` | db "R2" |
| R3 empty unsubscribe secret | `MIN_SECRET_LENGTH` in `unsubscribe.ts`; job skips news | unit "unsubscribe links need a real secret" |
| R4 empty webhook secret | refuse in `verifySvix` | unit "bounce webhook needs its secret" |
| R5 receipt claim | visible placeholder, 4 languages | unit "purchase confirmation" |
| W1 HEIC as film | brand check in `sniffMime` | unit "a picture is not a film" |
| W2 cancel contact | real address once set | unit "purchase confirmation" |
| W5 audit filter | id check in `listAudit` | unit "Supabase owner data layer" |
| W3, W4 | `id="passes"`; payload and language checks in edge functions | none (one-line UI attribute; Deno-only code) |

Files: new `supabase/migrations/20261122120000_owner_emails_review.sql`, `tests/db/owner-emails-review.test.ts`,
`tests/owner-emails-review.test.ts`; edited `src/features/owner/data/{rules,local,supabase,api}.ts`,
`src/features/owner/context.tsx`, `src/i18n/owner-schema.ts`, `src/i18n/{ar,he,en,da}/owner.ts`,
`src/emails/{unsubscribe.ts,webhook-verify.ts,render.tsx,schedule.ts,server.ts}`, `src/emails/copy/{ar,he,en,da}.ts`,
`supabase/functions/{_shared/mail.ts,email-reminders/index.ts,email-events/index.ts,email-unsubscribe/index.ts}`,
`src/routes/app/settings.tsx`, `tests/db/catalogue.test.ts` (new function listed), `tests/emails.test.ts` (longer test
secret), `docs/emails/REVIEW-NOTES.md`, `docs/HANDOFF.md` (one line).

Checks run (25 Nov 2026): of the 15 new tests, 12 fail on the code before the fixes, 2 test new code (the queue
helper) and 1 guards against over-blocking (an unpublished language may still be emptied); after the fixes
`npm test` 272 of 273 pass, the one failure is `tests/local-data.test.ts` "the trial opens 3 stories" (story content
language, from another helper's work in progress on `content/stories/`). `npm run typecheck`: 3 errors, all in
`src/legal/load.ts` (missing legal dictionaries, another helper's work in progress); none in the files above.
`npm run emails:bundle` builds. Not run: e2e (other helpers rebuild `build/`), anything in Deno or on Supabase.
