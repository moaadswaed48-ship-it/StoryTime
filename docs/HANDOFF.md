# Handoff

## Stage 0 (Builder): app skeleton and carry-over

Status: DONE (22 Nov 2026), not committed by the Builder. Checks below were run on the final code.

- [x] Versions checked with `npm view` on 22 Nov 2026; exact pins in package.json
- [x] Stack: Vite 8.3.8, React 19.3.1, TypeScript 7.0.2 (strict), Tailwind 4.3.5, React Router 8.5.2 framework
      mode (`ssr: false` + `prerender`), GSAP 3.15.1, three 0.187.0, @react-three/fiber 9.8.2, drei 10.7.9,
      zustand 5.1.0, Vitest 5.1.1, @playwright/test 1.63.0
- [x] Routes, pre-rendering, lang/dir/canonical/hreflang (25 pages pre-rendered: `/` + 6 pages × 4 languages)
- [x] Typed dictionaries in `src/i18n/<lang>/<feature>.ts`; a missing key fails `tsc` (tested by deleting one)
- [x] Carry-over copied and adapted: every file in `docs/CARRY-OVER.md`
- [x] Lab pages `/lab/curl`, `/lab/kit`, `/lab/shelf` run (dev server only)
- [x] Scripts `dev`, `build`, `preview`, `typecheck`, `test`, `e2e`
- [x] Checks: typecheck clean; 17 unit tests pass; build passes; 18 e2e tests pass (phone 390 and desktop 1440,
      Chromium); screenshots in `qa/out/` looked at

### How it fits together
- `site.config.ts` reads `BASE_PATH` (preview `/StoryTime/next/`, launch `/`), `SITE_ORIGIN` (canonical host;
  placeholder default is the GitHub Pages host, set it for launch), `NOINDEX=1` (preview), `LAB=1`.
- `src/routes.ts` is the URL map. `src/seo/paths.ts` lists the pre-rendered paths and builds hreflang.
  Public URLs always end in `/`. `/` is a language picker whose inline script redirects by browser language
  (fallback Arabic) before paint.
- `/:lang` layout (`src/routes/lang.tsx`) loads that language's dictionary chunk: `loader` at build time,
  `clientLoader` in the browser. Pages read it with `useLang()`.
- `/:lang/app/*` is client-only (SPA fallback), `noindex`, with no sign-in check yet.
- `scripts/postbuild.mjs` lays `build/client` out exactly like the URL space (React Router puts pages under the
  base path but assets at the root; this fixes it) and writes `__spa-fallback.html`, `404.html`, `.nojekyll`.
  Deploy = copy `build/client/<BASE_PATH>/`. `npm run preview` serves it (run with the same `BASE_PATH`).

### Notes for the next builder
- WebKit is NOT installed under /opt/pw-browsers (only Chromium): the Safari/iPhone e2e project switches itself on
  only where a WebKit build exists. Do not run `playwright install` here.
- Global Playwright is 1.63.0; `@playwright/test` is pinned to 1.63.0 to match the installed Chromium.
- GitHub Pages only honours the `404.html` at the site root (`/StoryTime/404.html`, the old site). For the preview,
  client-only app URLs opened directly will 404 unless that root file is also the new SPA fallback; links inside
  the app work. Cloudflare at launch: serve `__spa-fallback.html` for unknown paths.
- React writes `hrefLang` in camel case in the HTML. Valid (HTML attribute names are case-insensitive) and read
  correctly by browsers and Google; grep with `-i`.
- The curl engine kills its WebGL context on `destroy()`: always give a new engine a new `<canvas>` (see
  `src/lab/curl.tsx`); React's development double-mount otherwise breaks it.
- Kit puppets still default to the Moon bubble helmet: pass `{ helmet: false }`.
- `studio/scripts/render.mjs` and `sheet.sh` need the Stage 3 studio page (`window.__film`); `music.mjs` and
  `qa.mjs` were run and work.
- No fonts are bundled (system fonts); the container renders Arabic and Hebrew with DejaVu. Fonts are a Stage 2
  brand decision.
- Lab pages carry a few English-only labels on purpose: they never ship.

## Stage 4, part A (Builder): data layer, accounts, onboarding, plans and access

Status: DONE for part A (22 Nov 2026). Not committed by the Builder.
Final checks on the final code: `npm run typecheck` 0 errors (whole project); `npm test` 65 pass (25 database,
13 rules, 12 local backend, 15 from Stage 0); `npm run e2e` 40 pass (20 tests x phone 390 px and desktop 1440 px,
Chromium; the build runs first and passes); 20 phone screenshots in `qa/out/stage4a/` looked at, faults fixed
(stale error messages, Arabic punctuation around an example address, the seller line, email alignment in Arabic).
No fresh-context reviewer has looked yet: none could be started from this helper.

- [x] Migrations `supabase/migrations/` (3 files: tables; access rules and row-level security; flows) and the
      payment-callback edge function `supabase/functions/payment-callback/`
- [x] 25 database tests in `tests/db/` run the same SQL in PGlite (Postgres 18.6) with a Supabase stand-in
- [x] Data layer `src/data/` (types, pure rules, local backend, Supabase backend, payment adapter + test provider)
- [x] Dictionaries `src/i18n/*/account.ts`, `commerce.ts` (four languages, typed)
- [x] UI kit `src/ui/controls.tsx`, `Shell.tsx`, `SiteFooter.tsx`, `Banners.tsx` (plain, token-based)
- [x] Screens: sign-up, check email, confirm, sign-in, forgot/reset, onboarding, plans, checkout, test-pay, settings,
      parent gate, cancel a purchase, lock states, account deleted
- [x] Unit tests (rules, local backend), Playwright walk-throughs (parent + teacher, en + ar, 390 + 1440), states
      spec; screenshots in `qa/out/stage4a/`

### How it fits together
- `src/data/index.ts` `getApi()` picks the backend: Supabase when `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_PUBLISHABLE_KEY` are set at build time, otherwise the local test-mode backend (a banner says so).
  Each backend is its own lazily loaded chunk; sample story text lives only in the local chunk.
- `src/data/rules.ts` is the access logic in TypeScript, mirroring the SQL (`has_access_to_story`, trial, queued
  pass start, 14-day cancellation, fee cap). The local backend (`src/data/local/server.ts`) enforces it the way the
  database does. `src/data/local/seed.ts`: 9 published sample stories (3 trial per group) plus one cross-listed
  sample per group (locked during a trial) and one draft.
- Payments: `src/data/payments/`. The browser only creates an order (`create_order`, price from the database) and
  goes to the provider page (`/:lang/app/test-pay/` for the test provider). A pass is created only by
  `confirm_payment()` from the server callback (edge function; in local mode `LocalServer.handleProviderEvent`).
  The return page `/:lang/app/checkout/done/` polls the order. Each provider event is stored once.
- Session: `src/features/account/session.tsx` (provider in `routes/lang.tsx`). `routes/app/layout.tsx` guards the
  app: signed out goes to sign-in with `?next=`; not onboarded goes to `/app/welcome/`.
- Parent gate: `src/features/account/ParentGate.tsx` (6-9 x 11-19, typed digits; holds 10 minutes per tab) on
  settings, in-app plans, checkout and the signed-in part of "Cancel a purchase".
- Test clock (local backend only): localStorage `storytime.dev.clockOffsetMs` adds milliseconds to "now"; the
  e2e tests use it to jump past a trial or pass end.
- New public, pre-rendered pages: `forgot-password`, `cancel-purchase` (added to `src/seo/paths.ts`). Client-only:
  `auth/check-email`, `auth/confirm`, `auth/reset`, `auth/deleted`, `app/welcome`, `app/plans`, `app/checkout`,
  `app/checkout/done`, `app/test-pay`.

### Decisions taken (say if you disagree)
- Prices: none invented. Every price is null ("Price not set yet" + Placeholder tag); the test provider sells for 0
  and marks the order `price_was_placeholder`; a real provider is refused (`price_not_set`) until prices exist.
  No "best value" mark until there are real prices.
- One `children` table holds both a parent's child profiles (kind `child`) and a teacher's class (kind `class`,
  no children's names); the database enforces which kind each role may create. Up to 5 per account.
- Trial = the group's 3 `is_trial` stories, copied into `trial_items` at start, so later owner changes never take a
  story away from a running trial. One per account (no device check yet).
- Wrong password and "no such account" share one message (also after deletion); sign-up does say "email already
  used" (product checklist decision 15).
- Consents: written by the sign-up trigger from the form's metadata (terms version, adult, marketing ticked or
  not); later changes append rows (source settings / checkout).
- Deleting an account removes profile, children, progress, consents, trial and passes; orders and payments stay
  without a name (tax records). Open decision 8 (keeping a trial record) is NOT implemented: a deleted email can
  sign up again and get a new trial.
- Cancelling a pass ends access at once and records a refund request with the full amount; the fee (capped at the
  lower of 5% or 100 shekels) is left for the owner to set.

### Proven, and not proven
- Proven in PGlite (real Postgres): every row-level security rule and function named in the task (signed out, no
  trial, active trial on trial and non-trial story, expired trial, pass for right and wrong group, shared story,
  expired and cancelled pass, owner, isolation between accounts, roles, consents, duplicate callback, wrong amount,
  queued pass, 14-day window, locked author text, audit log, export, deletion).
- NOT proven: anything against a real Supabase project (none approved): GoTrue sign-up, email confirmation and
  reset links, its error codes as mapped in `src/data/supabase/index.ts`, PostgREST embedding, the edge function,
  and whether `delete_my_account()` may delete from `auth.users` there (if not, move it to an edge function).
- NOT built: emails (no sending service yet; test mode shows the link on screen), receipts, change of email address,
  owner area, storage and short-lived media links, the real payment provider, rate limiting of the public
  cancellation form, Safari/WebKit runs (not installed here).

### Notes for part B
- The library list (`routes/app/library.tsx`) and story view (`routes/app/story.tsx`) are interim, marked on
  screen. Replace them; keep `AccessPanel`, `useAccess` and `getStoryContent` (it throws `locked`).
- `progress` and favourites: the `progress` table exists (per child, per story); no favourites table yet.
- Covers: `StorySummary.coverUrl` is always null; part B wires storage and signed links (`can_read_media()` exists).
- Owner writes go straight to tables under RLS (owner role); every content change lands in `audit_log`. Make an
  owner with SQL only: `update profiles set role = 'owner' where id = ...`.

### Review fixes (22 Nov 2026): what changed for everyone
- Fresh review and its fixes: `docs/reviews/stage4a-review.md` (section "Fixes"). New migration
  `20261122110000_review_fixes.sql`.
- **New tables, sequences and functions in `public` are closed by default.** Grant what each needs in your
  migration, and add each new callable function to the list in `tests/db/catalogue.test.ts` after checking it.
- Preview project setup: `update private.settings set allow_test_payments = true;` in SQL, and the payment-callback
  secrets `SITE_ORIGINS` (the site's origins) and `ALLOW_TEST_PAYMENTS=1`. Production leaves both off.
- A new terms version needs a row in `private.terms_versions` (a migration) or sign-ups and orders are refused.
- DB tests: `freshDb()` is set up like the preview project; `freshDb({ preview: false })` is production-like.

## Studio (2D): the flat-drawing art engine (Stage 3 art engine + first style test)

> **IN PROGRESS (second Studio job, 22 Nov 2026, evening): "figures with weight, views, light, animals, sound".**
> Done so far (not committed): `kit/core.ts` has `Pen` (a canvas path that remembers its points, so outlines get a
> stable hand wobble), layered shading, per-scene light direction, standing lamps (`Painter.lamps`), cast shadows
> that follow the light; `style/profile.ts` has `hand`, `shade.half`, `texture.follow` (all optional) and richer
> `MOODS`; `figure/rig.ts` solves the skeleton in depth (`Pose.spin` = which way the figure faces: front, three-
> quarter, side, back); `figure/draw.ts` and `figure/face.ts` draw every sheet from any side; `figure/walk.ts`
> has the walk cycles. Still to do when this note was written: actions sheet, animals, light sheet and bedroom,
> market street, sound and captions, the film shot, proofs, tests. If this note is still here, the job was cut
> short: run `npx tsc --noEmit`, then `node studio/scripts/export.mjs list` and carry on from the scenes.


Status: BUILT, proofs rendered and looked at (22 Nov 2026). Not committed. Provisional look, waiting for the
owner's reference cartoon. All drawing is code: no AI image tools.

### What exists
- **The look as data:** `src/studio/style/profile.ts`. A `StyleProfile` holds line weight and colour, the shading
  model, texture, exaggeration (head, eyes, hands) and palette rules; `MOODS` hold the light of a scene. `GOUACHE`
  is the provisional house look. `INK` exists only to prove that the look swaps without touching a figure
  (`--style=ink`). Tune the look here when the reference arrives.
- **The Painter:** `src/studio/kit/core.ts`. `shape()` is the one way a solid thing is drawn (contour, fill, paint
  texture, form shadow, lit edge, all from the profile). `castShadow`, `groundShadow`, `far(depth)` for air,
  `parallax`, `layer`, `held(t)` for drawings on twos, plus `track`, easing, `hopArc`, `limbPath`.
- **Character builder:** `src/studio/figure/`. `drawFigure(P, sheet, pose, opts)` draws any `Sheet`: five life
  stages, every hair style, top, bottom, shoe and extra of the contract. `pose.ts` (the `Pose`, in the figure's
  own proportions; `FACES`: 14 expressions), `rig.ts` (proportions and joints, pure maths), `face.ts`, `draw.ts`
  (hands: relaxed, point, count 2 to 4, open, grip with a held thing), `gestures.ts` (all 11 `GESTURES`).
- **Animals:** `src/studio/animals.ts` (cat, dog, bird, sheep, fish; re-colourable coats).
- **Places and props:** `src/studio/places/nature.ts` (sky, sun, moon, stars, clouds, rain, hills, ground, grass,
  path, sea, surf, tree, bush, flower, leaf spray, pot plant), `things.ts` (house, fence, stone wall, stall,
  bunting, room, window, sun patch, rug, table, chair, bench, shelf, bed, lamp, fruit, bread, melon, bowl, cup,
  basket, crate, ball, block, teddy, kite, toy car, bucket, book, open book, watering can, umbrella, clock,
  pinned drawing), `places.ts` (garden, kindergarten corner, bedroom at night, market street, sea shore, hills).
- **Cast:** `src/cast/cast.ts`, 13 sheets (teacher, mother, father, two grandparents, four children, two
  toddlers, two teenagers). `src/cast/sheet.ts` gained one optional field, `extraColors`.
- **Scenes:** `src/studio/scene.ts` (a scene is a pure function of time; `words` = real text over a book page,
  `captions` = film captions, also written as WebVTT), `src/studio/mount.ts` (canvas + HTML text; mirrors the
  layout for Arabic and Hebrew, never the art; `page: 1|2` shows one page of a spread as a phone does),
  `src/studio/scenes/` (`spread-oranges`, `shot-tower`, `cast-sheet`, `gesture-sheet`, `face-sheet`, `places`,
  `loop-clap`).
- **Export:** `studio/scripts/export.mjs` (`list`, `still`, `sheet`, `video` shot by shot, `loop`), through the
  Studio's own page (`studio/index.html`, `studio/main.ts`, `studio/vite.config.ts`), so a render never depends
  on the app's routes. `studio/scripts/proofs.sh` renders the whole style test.
- **Lab pages:** `/lab/kit` (character builder: any sheet, any gesture, either profile) and `/lab/studio`
  (every scene with its text and captions, four languages). Route added in `src/routes.ts` (`lab/studio.tsx`).
- **Tests:** `npx vitest run --config studio/vitest.config.ts` (12 tests: rigs, every gesture on every sheet at
  every drawing, pose blending, the export script end to end).
- **Removed:** `kit/people.ts` (three hard-coded puppets), `kit/world.ts` (Moon set leftovers), the old palette.
  `kit/stage.ts` was rewritten for the builder (`blinkAt`, `addHops`, `addWalk`, `smoothBends`, caption phrases).

### The proofs (qa/out/studio/)
- (a) `spread-oranges.png`, `spread-oranges-ar.png`, `.webp` in four languages, `spread-oranges-page1-390.png`,
  `spread-oranges-ar-page1-390.png`, `spread-oranges-he-844.png`
- (b) `shot-tower.mp4` (10 s, 24 frames a second, characters on twos), `shot-tower-ar.mp4`, `shot-tower-sheet.jpg`,
  `shot-tower-390.jpg`, captions `shot-tower.<lang>.vtt`
- (c) `cast-sheet.png` (and `cast-sheet-ink-profile.png`: the same sheet under the second profile)
- (d) `gesture-sheet.png`; extra: `face-sheet.png`, `places-sheet.jpg`, `loop-clap-loop.mp4`

### How to run
- `node studio/scripts/export.mjs list` · `… still spread-oranges --lang=ar` · `… video shot-tower`
- `bash studio/scripts/proofs.sh` (about five minutes) · `npm run dev` then `/lab/studio`

### Checks run (22 Nov 2026)
- `npx tsc --noEmit`: 0 errors in the whole project. `npx vitest run --config studio/vitest.config.ts`: 12 pass.
- Every proof was rendered and looked at as an image, the film as a 12-frame contact sheet and at 390 px, the
  book page at 390 px in English and Arabic, the cast sheet at 390 px. `ffmpeg` found no black or frozen stretch.
- Three rounds of faults found and fixed (hair covering faces, hands hiding faces, elbow loops, tree drawn as
  discs, sitting pose, caption over a face, text wash larger than the words, export ignoring the 2x scale).
- `/lab/studio` and `/lab/kit` opened in the dev server at 390 and 1440 px with no page errors.

### What is still weak (honest list)
- It reads as a well-made digital paper-cut, not as a hand-painted book: edges are too even, there is one form
  shadow per shape and no brushwork that follows form. This is the ceiling the master plan names (risk 1).
- Figures face the viewer (front, three-quarter by sliding the face, and back). There is no true side view, so
  walking across the picture, kneeling and bending down to a child are faked or missing. `addWalk` is written
  but not yet judged in motion.
- A bow and a seated figure are foreshortened by rule of thumb; hands at rest are mittens; fingers cannot curl
  round anything except through the grip shape.
- Night and lamp light only tint the picture: a lamp does not light what is near it (the bedroom is the weakest
  place). Rain, moon and stars exist but are not proven in a scene.
- Animals have one view each and little acting (no walk cycle judged, no turned heads).
- Street houses are plain; the market needs people and goods to feel alive.
- Arabic and Hebrew are set in the container's fallback font (DejaVu Sans): correct, mirrored, but not beautiful.
- The film has no sound yet; the wobble is physics by formula, not by feel.

### What the next Studio job should do first
1. Tune `GOUACHE` against the owner's reference cartoon (line, shading, head size, palette) and re-render
   `bash studio/scripts/proofs.sh`: nothing else needs to change for a new look.
2. Add the side view (profile head, walking legs) to `figure/`, then the walk, run, sit-down and pick-up shots.
3. Start the shot library (about 40 reusable shots): each is a small function like `scenes/shot.ts`.
4. Local light: a lamp or window pool that re-draws what stands inside it under a warmer mood.
5. Three instruction-picture styles for the owner to choose from (Stage 3), using `loop-clap` as the base.

### Notes for the next Studio job
- Never leave a bare `cat >` without input in a shell command here: it hangs the session.
- The sample story lines in `spread-oranges` and `shot-tower` are StoryTime's own test text, not a story.
- The container has no Arabic or Hebrew book font (DejaVu Sans is used); the text is real HTML, so the Stage 2
  fonts drop in through `mount.ts` (`LATIN`, `ARABIC`, `HEBREW`).
- CDP screenshots ignore the device scale unless `clip.scale` is set: the export script sets it.
- This file is shared with other helpers: if this section goes missing, a copy of it is the comment block at the
  top of `studio/scripts/proofs.sh`'s neighbour `studio/README-HANDOFF.txt`.

## Stage 4, part B2 (Builder): the owner's area and the emails

Status: DONE for what can be proven here (22 Nov 2026). Not committed by the Builder.
Final checks on the final code: `npm run typecheck` 0 errors (whole project); `npm test` 258 pass in 21 files (mine:
`tests/owner-data.test.ts` 13, `tests/emails.test.ts` 85, `tests/email-schedule.test.ts` 15,
`tests/email-preview-files.test.ts` 1, `tests/db/owner-emails.test.ts` 11); `npm run e2e` 56 pass, 2 skipped (build
included; mine: `e2e/owner.spec.ts` 8 at 390 and 1440 px, `e2e/emails.spec.ts` 1). Screenshots in `qa/out/stage4b2/`
(owner screens phone + desktop, `emails/` 38 phone-width emails in Arabic and English) were looked at; faults fixed:
emails laid out at 980 px on phones (viewport tag added), links and file sizes scrambled inside Arabic sentences
(direction isolates), cramped "where the words sit" chooser on phones, a heavy repeated "where is this file from"
question (now folded), language codes in the change history, preview labels not in the previewed language.
No fresh-context reviewer has looked yet (none can be started from this helper).

- [x] Packages: `react-email` 6.11.8 and `@react-email/render` 2.2.0 (pinned, at least two weeks old, read first,
      installed with `--ignore-scripts`; recorded in `docs/SKILLS.md`). No Resend SDK: its HTTP API is called with fetch.
- [x] Owner data layer `src/features/owner/data/`: `api.ts` (interface), `rules.ts` (gaps, sign-off fingerprints,
      publish rule, trial limit, upload limits and content sniffing), `local.ts` (localStorage + IndexedDB files),
      `supabase.ts` (owner_* SQL functions, private `content` bucket, signed links), `preview.ts` (owner story ->
      the family `StoryContent`).
- [x] Migration `supabase/migrations/20261122100300_owner_emails.sql` (new file; earlier ones untouched): publish
      languages, sign-off fingerprint, publish guard and trial-limit triggers in the database, owner_story /
      owner_save_story (one transaction, writes only real changes) / sign-off / publish / dashboard, email_log dedupe
      key, email_suppressions, consent source "email-link", email_audience / email_new_stories (service role only),
      storage bucket + policies (guarded: skipped where storage does not exist, as in PGlite).
- [x] Screens `src/routes/app/owner/` (layout, stories, editor, preview, dashboard, changes), words in
      `src/i18n/<lang>/owner.ts` (type `src/i18n/owner-schema.ts`, loaded only in the owner's area). "Owner's area" tab
      in the app nav for the owner only; the owner skips family onboarding (two small edits in `routes/app/layout.tsx`).
- [x] Emails `src/emails/`: 19 templates x 4 languages (`copy/<lang>.ts`), one layout, `render.tsx` (HTML + text),
      `send.ts` (interface, Resend transport, memory), `preview-transport.ts` (writes to disk), `schedule.ts`
      (who is due what), `unsubscribe.ts`, `webhook-verify.ts`, gallery `/lab/emails` (dev only).
- [x] Edge functions (NOT DEPLOYED OR RUN): `auth-email-hook`, `email-reminders` (event emails + reminders + news,
      every 5 minutes by pg_cron), `email-events` (Resend bounces/complaints), `email-unsubscribe`; shared code in
      `_shared/mail.ts`; `npm run emails:bundle` builds `_shared/emails.mjs` (git-ignored) from `src/emails/server.ts`.
      The bundle was built and rendered an email, scheduled and verified links in Node; never run in Deno.
- [x] `docs/emails/REVIEW-NOTES.md`: the lines a native editor should check.

### How it fits together
- Owner role: checked by `LocalOwnerServer` on every call (local) and by `is_owner()` in every owner_* function and
  row-level security (Supabase). The screen check in `layout.tsx` is a courtesy. Make an owner: local, set
  `profiles[id].role = 'owner'` in localStorage `storytime.local.v1` (see `e2e/owner.spec.ts` signInAs); Supabase, SQL.
- Publishing: every target language complete (title + every page's words) and signed off on its current content; a
  picture on every page; an age group. "Only these languages" stores `published_langs`. The author's story is
  Arabic-only, its Arabic words and page list cannot change (`text_locked`), pictures and layout can. Editing a
  published story is live at once (the editor says so). Film and activity gaps are shown but do not block.
- Page layout is stored as `pages.layout = { key, zone }`; `zone` is the content/SCHEMA.md zone. The family reader on
  Supabase (part B1) does not read it yet.
- Emails: service emails never carry an offer; news only with consent, `פרסומת` first in the subject in every
  language (lawyer question 5), one-click unsubscribe (link + RFC 8058 headers). Quiet hours 21:00-08:00 Israel time
  for reminders and news; event emails go at once. Each email has a dedupe key claimed in email_log before sending.
  Business details, support address and prices show the site's visible placeholders until set.

### Decisions taken (say if you disagree)
- One film file and one caption file per language (the voice differs per language).
- Sign-off is per language and expires when that language's words, film or captions change.
- Uploaded files are checked by their first bytes, not their name; limits: pictures 10 MB, step pictures or loops
  20 MB, films 500 MB (the Supabase free plan allows 50 MB per file), captions 512 KB (.vtt only).
- Every file asks "where is it from" (made by us / made in the Studio / someone else + who + permission), stored in
  `media` for the ownership pack.
- Event emails (welcome, trial started, purchase confirmation, cancellation, refund) are sent by the same job as the
  reminders, so the payment callback (part A) did not need changing.

### Not built, not proven
- NOT RUN anywhere real: Supabase owner functions over PostgREST, storage uploads and signed links, every edge function,
  Resend sending, the auth hook's link format, pg_cron. The SQL itself is proven in PGlite.
- Account-deleted email: FIXED by the fresh review (docs/reviews/stage4b2-review.md): `delete_my_account()` now
  queues it in email_log with the address and language captured first; the email job sends it. Not run in Deno.
- Contact-reply email: template exists; the contact form and the owner's inbox are not built.
- Owner's area: processing cancellations and refunds, editing prices, reading contact messages (product checklist 20)
  were not part of this task. Story deletion is not offered. Two-step sign-in for the owner not built.
- Test mode: stories made in the owner's area are seen in its preview but not in the family library (that reads
  `content/stories/` and the samples); on Supabase, publishing makes them visible through the database.
- The preview shows the family's content in a plain view; it should embed the family reader once part B1 exports it.
- Email change confirmation link uses Supabase's own verify page (the site has no email-change page yet).
- Owner must supply: business details and support address (edge-function settings), a Resend account with a verified
  domain, a sending address and a read reply-to inbox, a native reader per language for `REVIEW-NOTES.md`, a lawyer's
  answer on the `פרסומת` marking and on reminders with a link to the passes page.

## Stage 4, part B1 (Builder): the family side after sign-in

Status: DONE for B1 (22 Nov 2026), not committed. Checks on the final code: `npm run typecheck` 0 errors (whole
project); `npm test` 258 pass (21 files; mine: `tests/zone.test.ts`, `listen.test.ts`, `content.test.ts`, updated
`local-data.test.ts`); build passes; full Playwright suite 57 pass, 3 skipped (my `e2e/stage4b1.spec.ts`: 8 tests,
phone 390 + desktop 1440, English + Arabic; part A's `account.spec.ts` updated for the new library). Run against a
private copy of the build because other helpers rebuild `build/` while tests run. 50 screenshots in
`qa/out/stage4b1/` looked at; faults fixed. No fresh-context reviewer yet (none could be started from this helper).

- [x] Content: types `src/content/schema.ts`; loader `src/data/local/content.ts` (only LocalServer calls it, content
      only after `hasAccessToStory`); samples `content/stories/sample-a|b|c` (one per group, 5-6 pages, four
      languages, marked "Sample"); their media made by `node src/content/make-samples.mjs` (painted SVG pages,
      tick "test recordings" with word timings, 18-21 s code-drawn films + VTT in 4 languages, step pictures and loops)
- [x] Progress API: `listProgress` / `saveProgress` in `DataApi` (local + Supabase `progress` table)
- [x] Library `routes/app/library.tsx`: profile picker (more than one profile), age group, access panel, continue,
      shelf (`features/family/Shelf.tsx` on `src/library/engine.ts`, transforms written outside React) or list
      (default with reduced motion or no 3D; choice remembered)
- [x] Storybook page `routes/app/story.tsx`: Read, Listen, Watch, Do doors, always visible; unavailable doors say why
- [x] Reader `features/reader/` + `routes/app/read.tsx`: curl engine (fresh canvas per mount) with DOM text at rest;
      flat book for reduced motion / no WebGL / `?book=flat`; zone layout `src/reader/zone.ts`; text size; Listen +
      word marking + auto-flip switch (`src/reader/listen.ts`); hand turn pauses; progress; access-ended screen
- [x] Film `features/film/` (Media Chrome 4.19.4, lazy): poster, metadata preload, captions on + remembered, position
      remembered, controls under the picture (never hidden), RTL, four-language labels, iPhone video full screen fallback
- [x] Activity `features/family/ActivityView.tsx` + `routes/app/do.tsx`; "We did it!" saved
- [x] Collections `routes/app/collections.tsx` (`/collections/stories|films|activities`): film plays and activity opens
      in place; link to storybook; age filter; locked items say what opens them
- [x] Settings: "Reading and films" (auto-flip, captions)

### How it fits together
- Media conventions the loader looks for (not yet in `content/SCHEMA.md`; please add): `pages/NN.*` (or
  `pages[].image`), `cover.*`, `audio/<lang>/NN.mp3|m4a` + `NN.json` (`{duration, words:[[start,end]...]}`, one per
  white-space word of `text`), `film/<lang>.mp4` else `film/film.mp4`, `film/poster.*`, `film/<lang>.vtt`,
  `activity/step-N.*` (+ `.mp4` loop when `loop:true`), `activity/material-<id>.*`. Optional `teaser` in `<lang>.json`.
- Catalogue: real stories first, then samples, then part A's text-only seeds; each group's first 3 are its trial.
- Prefs (auto-flip, captions, text size, shelf/list, hint) are per account in localStorage (`storytime.prefs.<id>`);
  the active profile in `storytime.activeLearner.<id>`; film position in `storytime.film.<learner>.<story>`.
- Test hook: `window.__storytimeListenRate` speeds recordings in browser tests.

### Not done or not proven
- Supabase backend returns no zones, pictures, audio, film or activity yet (signed media links not built); the
  local backend serves media from the build (hashed addresses, test mode only).
- Prefs and film position do not follow the account to another device (needs a `profiles.prefs` column).
- Favourites ("my shelf"), first-story trial counter "1 of 3 opened", print view: not built.
- Real voice: none. Listen uses tick recordings; dev server only: browser speech stand-in for pages without one.
  On phones the browser asks for a tap on Listen after opening from the door (tested; the reader says so).
- Safari/WebKit not run (not installed); iPhone full screen and audio unlock unproven on a real iPhone.
- Film seek bar is not mirrored in Arabic/Hebrew (time runs left to right); decide in the design pass.
- Real story b02 pages are ~25 words: at the larger text size they scroll on a 320 px phone (normal size fits).

### For the design pass and the Studio
- Neutral look only: paper `#fbf8f1`, door pictures and icons in `features/family/icons.tsx`, film CSS
  `features/film/film.css`, reader colours in `features/reader/paint.ts`. Shelf covers use the first page picture
  until a `cover.*` exists.
- The words sit on a soft paper wash over the picture's `zone`; side zones become full-width bands on phones, so
  keep the top or bottom band calm in every picture, and both sides calm for side zones (art never flips).
## 3D hero (Stage 3 helper): code-built characters and gestures

Status: BUILT AND CHECKED (22 Nov 2026), not committed by this helper. Checks on the final code: 10 tests pass
(`npx vitest run --config scripts/hero/vitest.config.ts`), `npx tsc --noEmit` clean, screenshots looked at.

What exists (all in `src/hero3d/`, nothing downloaded, nothing AI-made):
- `buildFigure(sheet)` (`figure.ts`): a character from any `Sheet`. `rig.ts` proportions and the 19 standard bones
  (T-pose, unrotated); `mesh.ts` rounded-form builder; `body.ts` body, clothes, hair and extras as ONE skinned mesh
  with vertex colours (no textures; 3,700 to 9,900 vertices); `head.ts` the head surface shared by skull, hair and
  face; `face.ts` eyes, lids, brows, mouth (morph targets); `materials.ts` flat toon shading, soft outline
  (inverted hull), contact shadow, key light. Every hair style, top, bottom, shoe and extra in the contract is built.
- Gestures (`pose.ts`, `solver.ts`, `gestures.ts`): each of the ten is written once as a pose over time in
  body-relative units (hands by two-bone IK relative to the shoulder, the chest midline or the head; feet planted
  by IK; squash and stretch from the ground up), so it plays unchanged on every sheet. `idle` breathes, shifts
  weight, blinks and glances at the pointer. A change of gesture is an inertial blend (old pose and speed die away).
- `<HeroStage sheets lang labels mode>` (`HeroStage.tsx`, `stage.ts`, `icons.tsx`): one character at a time,
  arrows and face chips to switch, ten picture buttons (pictograms are drawn from the gestures themselves), drag
  to turn, tap the stage to wave, arrow keys along the button rows. Reduced motion: the same canvas shows still
  poses. No WebGL (or a lost context): pictures from `src/hero3d/stills/`. The canvas draws only while on screen.
- Game export (`bake.ts`, `glb.ts`): `node scripts/hero/export-glb.mjs` (or the GLB buttons on the lab page)
  writes a figure with skeleton, face morphs and the 11 clips to GLB (about 1 MB each) and reads it back.
- `src/cast/samples.ts`: the six hero characters, picked from the first cast (`cast.ts`) so 2D and 3D share sheets.
- Lab page `/lab/hero` (`src/lab/hero.tsx`; `?cast=all` shows all thirteen sheets). Stand-alone copy that does
  not need the rest of the app to compile: `node scripts/hero/serve.mjs`.

How to re-check
- `node scripts/hero/shots.mjs frames` → `qa/out/hero/sheet-<id>.png` (every gesture, five moments each) and
  `qa/out/hero/frames/`; `... pages` → `qa/out/hero/pages/<width>-<n>-<gesture>.png` (live page, 390 and 1440);
  `... stills` → rewrites `src/hero3d/stills/*.webp`. RUN `stills` AGAIN whenever a sample sheet or a gesture changes.
- `qa/out/` is git-ignored: the screenshots are on this machine only.

Decisions to know about
- Colours a sheet does not name (hat, scarf, bag, trim, blush, brows) follow the flat puppet in
  `src/studio/figure/` (`palette()` in `body.ts`), so both pictures agree. `sheet.ts` was not changed by this helper.
- The 3D head is 9% larger than `build.heads` says (`rig.ts`), to keep faces readable at hero size.
- The hero tests live in `src/hero3d/__tests__` with their own config (`scripts/hero/vitest.config.ts`) because the
  main vitest config only looks in `tests/`. Adding `src/hero3d/**/*.test.ts` to its `include` puts them in `npm test`.
- Screen-reader labels in `HeroStage` are English placeholders: pass `labels` from the dictionaries when the
  landing page uses it. The stage disc and buttons use the neutral tokens; brand colours are Stage 2.

Known weak points (honest list)
- Hands are mittens with a thumb, no fingers. Faces are flat features on the head: fine from the front, flat in
  profile (seen for a moment in the spin); the head cover looks boxy in profile.
- Cloth and hair do not swing: skirts, coats and long hair are skinned, not simulated. In the jump the knees show
  under a skirt; long hair can cut into the shoulders when the head tilts far.
- The walking stick hangs upright from the hand instead of being leaned on.
- Adults are drawn at the sheet's realistic 6 heads, so their faces are small on a phone.
- Speed on a real phone is NOT measured (only a software renderer here), and Safari on iPhone is not tested
  (no WebKit build in this container). Draw calls per figure: 2 skinned + about 9 small face meshes + shadow.
- Pictograms for clap, think and peek read less clearly than wave, jump and spin.

Next steps
1. Test on a real iPhone and a mid-range Android (frame rate, touch, context loss).
2. Put `<HeroStage sheets={HERO_SAMPLES} lang={lang} labels={...}/>` on the landing page; add the labels to the dictionaries.
3. A fresh reviewer and the owner pick which characters and which 7 to 10 gestures stay.
4. If wanted: fingers for counting and pointing, a little follow-through on hair and skirts, a leaned-on cane.

## Instruction pictures (Studio helper): three directions for the activity pictures

Status: IN PROGRESS (started 22 Nov 2026). Not committed. All three directions draw both activities (first
drafts); polishing rounds and the final renders are still to do.
- Brief: a fixed instruction cast, three different visual directions, both example activities rendered in each
  ("Here You Are, Thank You", ages 2-3, and "The Talking Stick", ages 4-5), a comparison page for the owner.
- Note: the brief called the first activity "A04's"; in `outlines.md` today it belongs to A03 (A04 now has
  "The Looking Frame"). The named activity, as written under A03 today, is the one drawn.
- The cast: `src/cast/instruction-cast.ts` (teacher Mona, Mum, Dad, Grandpa, Lia 2½, Tom 4, Sara 6, Jonah 8).
- The three looks as data: `src/studio/style/instruction-profiles.ts` (`above`, `hands`, `stage`).
- The drawing: `src/studio/instructions/` (`above.ts`, `hands.ts`, `stage.ts` side by side; `kit.ts` shared things
  and signs; `actors.ts` posing with the builder; `activities.ts` cards and captions; `mount.ts` canvas + real
  caption text; `cast-sheet.ts`).
- Export: `node studio/scripts/instructions-export.mjs check|card|strip|stills|loops|contact|cast|all`
  (its own page in `studio/scripts/instructions/`). Working files go to `studio/out/instructions/` (ignored).
- Still to do if this is interrupted: polish each direction at phone size, lab page `src/lab/instructions.tsx`
  + one route line, final renders into `docs/previews/instructions/`, the comparison `README.md` there.
- The figure builder was being rewritten by another helper while this was made (side views, kneeling, palm
  hand arrived mid-way): if a render fails with a missing export in `src/studio/figure/`, wait and run again.

## Preview (25 Nov 2026): hidden test link on GitHub Pages

Live: https://moaadswaed48-ship-it.github.io/StoryTime/next/ (the old site at `/StoryTime/` is untouched).

- Publish again with one command: `node scripts/deploy/preview.mjs` (`--no-push` to lay it out and check first).
  It builds with `BASE_PATH=/StoryTime/next/`, `SITE_ORIGIN=https://moaadswaed48-ship-it.github.io`, `NOINDEX=1`
  and the local test-mode data layer (any `VITE_SUPABASE_*` is dropped), then replaces only `next/` on `gh-pages`
  in a separate worktree (`$PAGES_WORKTREE`, default `/tmp/storytime-gh-pages`), commits and pushes. It refuses
  to commit anything outside `next/`. It builds the working tree as it is, uncommitted files included.
- Hidden from search: `NOINDEX=1` makes the root layout put `<meta name="robots" content="noindex, nofollow">` on
  every page, the SPA fallback included (the script fails if one page lacks it); `next/robots.txt` disallows all
  (advisory: the root robots.txt belongs to the old site). The test-mode banner now shows on every page.
- Direct links into the app: GitHub Pages serves only the root `404.html` (old site), so the script writes the SPA
  fallback as `index.html` into every client-only folder (`/:lang/app/...`, `/:lang/auth/...`) for all four
  languages and every known story id (folders in `content/stories/` + the seed samples). A story id that did not
  exist at build time still 404s when opened directly; it works from inside the app. Republish after adding stories.
- Test mode caveat: the local backend bundles the sample and pilot story text in hashed JS chunks, so on the
  preview it is reachable by anyone who digs into the files (the pilot stories are StoryTime's, none is the author's).
  Never publish the preview with the author's story in `content/stories/`.
- Fixed while publishing: `/:lang/legal/*` threw "loader is not defined" in the browser (`clientLoader = loader`;
  the client build strips `loader`).

## Landing words (Stage 8 copy, helper, 25 Nov 2026)

Status: words and plain structure DONE; visual design not started (by design). Not committed by the helper.
- Words in four languages: `src/i18n/<lang>/landing.ts`, typed by `src/i18n/landing-schema.ts` (`satisfies`, so a
  missing key fails `tsc`). They load only with the landing route (`src/i18n/landing.ts`, route `loader` and
  `clientLoader`): the shared `Dict` is serialised into every page's HTML, so landing words there would put the story
  excerpt on every page.
- Page `src/routes/landing.tsx`: hero, what is inside a story (A04), values, evidence with the illustration graph
  (`src/features/landing/ImpactChart.tsx`, draw-in only when not reduced motion), how it works, age groups, plans
  teaser with the law's "Cancel a purchase" box, questions and answers. Footer unchanged.
- Copy decisions, sources, lines to update and lines for a native editor: `docs/landing/COPY-NOTES.md`.
- Checks: `tsc` clean for these files; `tests/landing.test.ts` (keys, scripts, excerpt equals A04 page 5, headline
  length, illustration label); `e2e/landing.spec.ts` 14 tests pass at 390 and 1440 (sections, graph name and
  description, reduced motion static, draw-in, excerpt only on the landing pages); `e2e/public.spec.ts` and the
  "no story text" test in `e2e/stage4b1.spec.ts` pass (it now allows exactly A04 page 5, with a comment). Run on a
  private copy of the build. Phone screenshots in `qa/out/landing/` looked at.
- Not done: no fresh-context review; the 3D hero, teaser shelf and parent/teacher chooser from the product
  checklist are not on the page; the graph should go public only with the owner's papers (checklist open decision 4).

## Legal pages (Stage 9 helper, 25 Nov 2026): drafts in four languages, wired into the site

Status: DRAFTED AND WIRED, not reviewed by a lawyer or a native reader, not committed.
Checks on the final code: `npm run typecheck` 0 errors; `tests/legal.test.ts` 8 pass (all pages and sections in four
languages, same shape and same placeholders and links per section, links resolve, Arabic/Hebrew script, fee cap
matches `maxCancellationFee`, terms version published); `e2e/legal.spec.ts` + `public.spec.ts` + `account.spec.ts`
41 pass at 390 and 1440 px (run on a private copy of the build). Screenshots looked at: `qa/out/legal/` (privacy and
refunds, Arabic and Hebrew, 390 px; faults fixed: version name broken inside Arabic text, placeholder boxes touching
the line above). Unrelated failure seen: `tests/content.test.ts` "refuses content without access" fails because new
stories in `content/stories/` (a12, c03, another helper) push `sample-b` out of the 4-5 trial.

- Pages `/:lang/legal/{terms,privacy,refunds,accessibility,credits,cookies}/`, public and pre-rendered (`LEGAL_DOCS` in
  `src/seo/paths.ts`). Words: `src/i18n/<lang>/legal.ts`, type `src/i18n/legal-schema.ts` (English is the master; a
  missing key fails the compiler), loaded only on these pages by `src/legal/load.ts`; renderer `src/legal/LegalText.tsx`
  (`[[...]]` = visible placeholder, `{path|label}` = site link; tables become cards on phones).
- Every page opens with the "draft, not reviewed by a lawyer" banner. Open questions and placeholders:
  `docs/legal/LAWYER-PACK.md`; `// LAWYER Qn` comments in `src/i18n/en/legal.ts`.
- Footer links all six pages; "Cancel a purchase" page links to the refunds page; checkout "Your right to cancel" now
  opens the refunds page in a new tab; sign-up links unchanged (terms, privacy).
- Terms version bumped to `draft-2026-11-25` (`src/data/terms.ts`, with `TERMS_HISTORY` recording that the old
  `draft-2026-11-22` had no text); new migration `20261125100000_terms_draft_2026_11_25.sql` keeps the old version.
- Found while checking: account deletion keeps the address in `email_log` (the privacy page says so; lawyer Q10).

## Stage 4, part C (Builder, 25 Nov 2026): gaps that do not depend on the look

Status: BUILT AND CHECKED (25 Nov 2026), not committed. Neutral tokens only. Final check numbers are at the end of
this section.

- [x] **Privacy: no address left in the email log after deletion.** Migration
      `20261125120000_email_log_privacy.sql`: `email_log.to_email` may be null, new `to_email_hash` (salted SHA-256,
      same salt and formula as `private.trial_ledger`, function `private.email_hash()`, no client may call it).
      `delete_my_account()` replaces the address in every earlier row of the account at once; trigger
      `email_log_forget_deleted` replaces the address of the account-deleted email as soon as it leaves
      queued/sending (sent, skipped, failed for good, bounced). Rows of accounts deleted earlier are hashed by the
      migration. Kept per row: template, language, status, times, message id, dedupe key. Local backend: the outbox
      does the same (`toHash`, `to: null`; the goodbye email counts as sent at once in test mode). Tests that failed
      before and pass after: `tests/db/email-log-privacy.test.ts` (6), `tests/stage4c-local.test.ts` (2).
      `queuedEmail()` skips a row with no address. Privacy page "How long we keep it" updated in four languages
      (draft banner kept); `docs/legal/LAWYER-PACK.md` section C updated. Still kept with the address: the
      do-not-send list (`email_suppressions`) for bounces and complaints, as the page says.
- [x] **All 45 stories in the app** (`content/stories/a01..c15`, each in its own age group; the samples and the
      text-only seeds stay after them, marked "Sample", never trial stories). The author's story is NOT wired
      (it is not in `content/stories/`, and the preview must never carry it).
      - Trial stories (`src/data/local/trial-picks.ts`, first on the shelf): 2-3 **A04** Slow, Slow, Together, **A01**
        One, Two, Three, Wheee! (counting), **A07** Boom, Says the Sky (a scared feeling); 4-5 **B02** The Shell That
        Sings, **B01** Ten Goats Home (counting to ten), **B09** The Kite That Kept Falling (keep trying); 6-8 **C01**
        Ten Pomegranates, Two Baskets, **C03** The Quiet Morning (helping Mother), **C10** Long-Legs Flies South
        (science). One values, one numbers, one feelings or science story per group. On Supabase the owner sets
        them in the owner's area.
      - Placeholders, clearly marked, gone the moment a file exists: `src/features/family/Placeholder.tsx` (hatching,
        a picture sign, a dashed tag "Placeholder: this picture is not drawn yet") on every page without a picture
        (DOM page and the curl's canvas, `drawPlaceholder` in `features/reader/paint.ts`), activity steps and
        materials; covers without a picture get a dashed frame and "No cover yet".
      - Films: no player without a file. Watch page and films collection say "Film coming soon" (the films
        collection lists planned films, `features.filmSoon`). Listen door: "Voice coming soon"; the reader's Listen
        button is disabled. Words changed in four languages (`doors.noRecording`, `doors.noFilm`, `film.notReady`).
      - Loader fix: a14's `story.json` lists 3 activity materials, every language file 2 (the two boxes are one
        line). The loader now shows the language file's lines and only refuses a story for a problem with the book
        itself. **Story Room: merge `big-box` and `little-box` in `a14/story.json`** (no text changed here).
      - Unit test opens every story in all four languages (`tests/stage4c-local.test.ts`); e2e reads A04, B02 and C01
        to the end in Arabic and English at 390 and 1440 px (`e2e/stage4c.spec.ts`). The "no story text in public
        HTML" test in `e2e/stage4b1.spec.ts` still passes with all 45 stories.
- [x] **Favourites ("My shelf")** per profile: heart button on the storybook page, "My shelf" row in the library
      with its empty state. Table `favourites` (RLS per account, cascades with the profile, in "Download my data").
- [x] **Print view for activities**: Print button on the activity page; print CSS in `src/app.css` prints only the
      activity (`data-print-root`), moving steps as stills, no buttons or navigation.
- [x] **Trial counter** "1 of 3 trial stories opened" in the access panel (`AccessSnapshot.trialOpened`: trial
      stories that any profile has read, watched or done).
- [x] **Settings and film position with the account**: `profiles.prefs` (only autoFlip, captions, textScale, view,
      hintSeen; a database check refuses anything else) and `progress.film_position_s` (migration
      `20261125130000_family_prefs_favourites.sql`). `usePrefs` copies the account's settings into the device cache
      once when the account loads and sends each change to the account. The film saves its place about every 10 s,
      on pause, and clears it at the end; another device starts there.
- [x] **Email change (test mode)**: Settings, Account, "Change email address": a link to the new address
      (`requestEmailChange`), the address changes only when the link is opened (new page `auth/confirm-email`), then a
      notice to the old address. Refuses a bad address, an address with an account, and a second request within a
      minute; the link works once for 24 hours. Supabase: `auth.updateUser({ email })` + `verifyOtp(type
      'email_change')`; the auth-email-hook now links to the site page. NOT run against Supabase.
- [x] Old tests fixed: `tests/content.test.ts` (sample-b is no longer a trial story: it now buys a test pass);
      `tests/zone.test.ts` b11 (one long hyphenated word on a 320 px phone at the larger size: the side padding gives
      way, words are never split, `src/reader/zone.ts`); database tests get longer timeouts in `vitest.config.ts`
      (each file builds a Postgres with every migration). `e2e/stage4b1.spec.ts` gives its family a 4-5 pass so the
      sample with test recordings stays open. The Supabase stand-in in `tests/db/supabase-data-layer.test.ts`
      learned `.in()`.

### Not done here: needs the owner's accounts or a decision
- Real voice, films and art (Studio work); the author's story (her written consent, and never on the preview).
- Supabase project (prefs, favourites, film position, email change and the trial counter are written for it and
  the SQL is proven in PGlite, but nothing ran against a real project), Resend (real emails, including the
  email-change emails), the payment company (receipts, payment history links, refunds).
- Supabase content import: real stories, trial flags and media links reach the Supabase backend only through the
  owner's area; `getStoryContent` there still returns no pictures, zones, film or activity.
- Classroom mode, "privacy promise for kindergartens", contact form and owner inbox, owner refund processing.

### Checks (25 Nov 2026, on the final code)
- `npm run typecheck`: 0 errors. `npm test`: 353 pass in 28 files (new: `tests/db/email-log-privacy.test.ts` 6,
  `tests/db/family-prefs.test.ts` 5, `tests/stage4c-local.test.ts` 14).
- `npm run e2e` (build included, so `npm run build` passed): 90 passed, 4 skipped (WebKit-only and once-only
  checks), 0 failed, in 18 minutes; new `e2e/stage4c.spec.ts` 6 tests at 390 and 1440 px. Screenshots in
  `qa/out/stage4c/` looked at (reader pages with placeholders in Arabic and English, library per group, storybook
  doors, activity and its print view, my shelf, email change).
- Preview republished (`node scripts/deploy/preview.mjs`: 1059 pages, 58 story ids, all noindex). Live check at
  390 px in Chromium on https://moaadswaed48-ship-it.github.io/StoryTime/next/: test-mode sign-up lands on B02; each
  group lists its 15 stories (4-5: 3 open); A04, B02 and C01 read to the end in Arabic (Arabic text checked) and in
  English, a marked placeholder on every page; C01's activity (5 steps, Print); the six legal pages in Arabic and
  English (200, titled; the new privacy sentence is live); robots noindex; no page errors.
- Not done: no fresh-context reviewer (none can be started from this helper); Safari/WebKit not run here.

## Site review (fresh reviewer, 25 Nov 2026)

Status: review written, small fixes made, not committed. Full report: `docs/reviews/site-review-25nov.md`
(findings ranked BROKEN / UNTRUE / CONFUSING / WEAK, screenshots in `qa/out/review/`).
- Fixed: activity material ids in A14, B12, B15, C05, C06, C08 now match the language lines (ids only, no words);
  new test that every story folder agrees with its `story.json` (C03's chopping board is the one known gap, for the
  Story Room); the reader shows "Voice coming soon" instead of a dead Listen button and auto-flip switch; the Danish
  accessibility title no longer scrolls the phone sideways; 44 px site-name link; compact age chips fit at 390 px;
  pass-card heading level.
- Open (owner or Story Room): home-page hero promises films, pictures and a voice in the present tense; two menus on
  signed-in pages; footer lacks Help, Contact, language picker and business details; library is word-heavy for small
  children; fast page flips are not saved; axe, Lighthouse and Safari not run (not installed).

## Site review fixes, second pass (helper, 25 Nov 2026)

Status: FIXED AND CHECKED, not committed. Neutral tokens only; the look is not decided. Details and evidence:
`docs/reviews/site-review-25nov.md`, section "Fixes (25 Nov, second pass)".
- [x] **Honest landing words (rule 4), four languages.** The hero now says each story *will have* a book, a film and
      an activity, and a new line beside it (`hero.note`, `data-testid="hero-note"`) says what is ready today (the
      words and the activity of every story) and what is still being made (pictures, films, the narrator's voice).
      A04's Read, Listen and Watch cards, "Try 3 stories" step, the FAQ answers on screen time, languages and the
      trial, the landing meta description, the storybook hint ("All four are always here") and the onboarding
      language line no longer speak of films, pictures or a voice as if they existed. The plans, sign-in and sign-up
      meta descriptions said "placeholder page, not active yet", which is no longer true: rewritten. Emails and the
      plans page had no such claim. Lines to revert when production lands: `docs/landing/COPY-NOTES.md` section 3.
- [x] **One menu on signed-in pages.** The header's menu is the only one: Library, Collections, Settings, Plans (and
      the owner's area for the owner), the current page marked; the app's second bar is gone (`routes/app/layout.tsx`,
      `ui/SiteHeader.tsx`, `ui/Shell.tsx` lost its `nav` prop). The owner's area keeps its own sub-menu inside it.
- [x] **Footer on every page:** Cancel a purchase, Help, Contact, Plans, the six legal pages, a language picker
      (`LanguageLinks`, shared with the header) and the business-details placeholder.
      - Help `/:lang/help/` (`routes/help.tsx`, public, pre-rendered): the landing FAQ (only `faq.items` is loaded
        from the landing words, never the A04 excerpt; shared component `features/landing/Faq.tsx`), the contact
        form link, the support email as a visible placeholder, and the cancellation page.
      - Contact `/:lang/contact/` (`routes/contact.tsx`, public, pre-rendered): name (optional), email, message (up
        to 2,000 characters). Recorded through the data layer: `DataApi.sendContactMessage`; local test mode keeps it
        in this browser (`contactMessages`) and says so; Supabase: new migration
        `20261125140000_contact_messages.sql` (table `contact_messages`, owner-only read, `send_contact_message()`
        for anon and signed-in, 3 an hour per address; on the reviewed function list in `tests/db/catalogue.test.ts`).
        NOT run against a real Supabase project. No email is sent; the owner's inbox to read the messages is not built.
      - Words: `src/i18n/<lang>/support.ts` (`SupportDict`), footer and page titles in `common.ts` and `pages.ts`.
- [x] **Reader saves the last page on fast flips.** `features/reader/Reader.tsx` still saves a page after half a
      second at rest, and now also saves the latest page when the reader closes, the tab is hidden or the page is
      left; `useProgress` makes a progress read wait for saves on their way, so the storybook page shows the new
      page at once. Test: `e2e/stage4c.spec.ts` "fast page flips" (fails without the fix, passes with it).
- [x] **C03 chopping board.** The activity needs it (the adult slices the cucumber on a board, step 3 and the safety
      note), so it is a new material line in four languages, the adult doing the cutting: "A chopping board and a
      sharp knife, for the grown-up only" (Arabic and Hebrew through `docs/story-room/pilots/src/c03.*.json` and
      `storytool.py build`). `story.json` material ids now follow the language lines one to one (the plate, cup and
      napkin share one line, as A14 and others). `storytool.py check c03`: no errors. The known C03 exception is
      gone from `tests/content.test.ts`.
- [ ] **Left for the design stage: the library is mostly words for small children** (review item 7). What it needs:
      the shelf (covers) as the first thing on a phone, above the trial box, "Continue", "My shelf" and the age and
      view choices (fold those into one small grown-up row or behind the parent gate); the cover itself as the way
      in (no "Open this book" word button needed); a picture-only way back from the storybook page and the reader
      (a large home or shelf icon, 56 px or more); door pictures that read without words; and a check with the
      "two-year-old's hands" script (`qa/out/review/walk/child.spec.ts`) that every step works by pictures alone.
- Checks: `npm run typecheck` 0 errors; `npm test` 358 passed; `npm run e2e` 104 passed, 4 skipped, 0 failed;
  republished (1067 pages, noindex); live at 390 px in Arabic and English 4 of 4 passed
  (`qa/out/review/second-pass/`). No fresh reviewer and no native reader has looked at these changes yet.
- Still open from the review: trial box wording (item 8), short legal contents links (15), Latin names in legal
  pages (16), the 3D hero (17), axe, Lighthouse and Safari (not installed).

## Code-built 3D test shot (26 Nov 2026)
- 11-second A04 shot (Sami and Grandpa on a spring hill) built entirely in code with Blender Cycles on the CPU: `docs/previews/studio3d/a04-hill-test.mp4`, side by side with the owner's reference in `comparison-sheet.jpg`, verdict in `README.md`.
- Helper's verdict: about 4 out of 10 against the reference's 9. Light, lens and shallow focus come close; characters, cloth, fur and acting fall well short.
- Speed: 47 s per frame. A 2.5-minute film takes about 2 days of rendering; 3 hours of films about 4.6 months on this machine. A graphics-card machine is the precondition for a film library (owner's money decision).
- Waiting for the owner: judge the demo; if not good, rerun on Fable 5.2 high as he said.
