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

## Studio (2D): the flat-drawing art engine (Stage 3 art engine + first style test)

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

### Notes for the next Studio job
- Never leave a bare `cat >` without input in a shell command here: it hangs the session.
- The sample story lines in `spread-oranges` and `shot-tower` are StoryTime's own test text, not a story.
- The container has no Arabic or Hebrew book font (DejaVu Sans is used); the text is real HTML, so the Stage 2
  fonts drop in through `mount.ts` (`LATIN`, `ARABIC`, `HEBREW`).
- CDP screenshots ignore the device scale unless `clip.scale` is set: the export script sets it.
- This file is shared with other helpers: if this section goes missing, a copy of it is the comment block at the
  top of `studio/scripts/proofs.sh`'s neighbour `studio/README-HANDOFF.txt`.
