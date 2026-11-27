# Launch readiness, 26 Nov 2026 (accessibility, speed, search, safety)

The work of Stage 9 that needs neither the visual look nor an outside account. Checked on private copies of the build
(never the shared `build/` folder), in Chromium only. The look is unchanged: neutral tokens, no artwork.

**In short:** every public page type, the not-found pages and 19 signed-in screens pass axe (WCAG 2.2 A and AA plus best practice) with
no violations in English and Arabic at 390 and 1440 px; keyboard walks pass; Lighthouse (mobile, median of 3) now gives
99 to 100 for performance and 100 for accessibility, best practices and SEO on all 56 public pages (before: one page
at 87); 12 of the 14 public page types now download about 55% less. A sitemap, a launch-mode robots.txt, a
real not-found page in four languages, share-preview words and honest structured data are in. No secrets, no paid
story text beyond the one known A04 page, and none of the author's story in any built file.

## 1. Tools (vetted per hard rule 10, recorded in `docs/SKILLS.md`)
- `axe-core` 4.14.0, `@axe-core/playwright` 4.14.0, `lighthouse` 13.6.0: exact pins, each over two weeks old, dev
  dependencies only, installed with `--ignore-scripts`. Lighthouse's error reporting is switched off in our script.
- Chromium from `/opt/pw-browsers/chromium` (headless, no sandbox). `playwright install` was not run.
- New option `BUILD_DIR` (react-router.config.ts, scripts/postbuild.mjs, scripts/serve.mjs): builds and serves a
  private copy; default unchanged (`build`). Outside the project the folder above it needs a link to `node_modules`.

## 2. Accessibility

### What was checked
- `e2e/a11y.spec.ts` (new, stays in the suite): axe with tags `wcag2a wcag2aa wcag21a wcag21aa wcag22aa best-practice`
  plus our own 44 px touch-target check, on 70 screens at 390 and 1440 px (140 audits), English and Arabic:
  - public: home, plans, sign-in, sign-up, forgot password, cancel a purchase, help, contact, the six legal pages,
    the not-found page, and an address under no language;
  - signed in: sign-up with its error messages, "check your email", the three onboarding steps, storybook page,
    library (shelf and list), reader in flat mode (cover, a page, and a page with the Listen controls), film page
    ("coming soon" and the real player with a test film), activity, collections, the parent gate, settings, plans
    inside the app, checkout.
  - every screen also checks `<html lang>` and `dir`.
- Keyboard walks (same spec): on home, plans, sign-up, contact, privacy and the not-found page, Tab first reaches
  "Skip to content", Enter moves to the main content, and every Tab stop afterwards has a visible focus ring (3 px
  outline, or the ring on the whole label for radio choices), is visible, and no element uses a positive tabindex.
  Sign-up, onboarding, starting the trial and turning reader pages were done by keyboard alone.
- Contrast of the neutral tokens (computed): ink on paper 17:1, muted ink on paper 6.8:1 (text, both pass AA);
  the focus ring blue on paper passes 3:1. Field borders: see the fix below.

### Faults found and fixed
1. **Content outside landmarks on every page (axe "region", 132 hits).** The test-mode notice sat between the
   header and the main content. It now closes the site header (`src/ui/SiteHeader.tsx`, `Shell.tsx`, `Page.tsx`);
   the home page shows it too now, as the earlier handoff intended ("on every page").
2. **Film player, captions button (critical, "aria-allowed-attr").** Media Chrome marks it as a button but reports
   on/off with `aria-checked`, which only a switch may carry. It is now a switch (`FilmPlayer.tsx`).
3. **Film player, time display (serious, "label-content-name-mismatch").** Its name "playback time" hid the digits
   it shows. It is now a plain timer (no tap-to-show-time-remaining toggle, which small children do not need).
4. **Not-found page.** Was a "placeholder page" notice and a heading; an unknown legal page or a bad language code
   showed only "404" with no title (axe "document-title"). Now a real page in four languages (one calm line, "Go to
   the home page", Help), titled and noindex; with no language in the address: 404 and the four home pages by their
   own names (`src/ui/NotFound.tsx`, `routes/missing.tsx`, error boundaries in `routes/lang.tsx` and `root.tsx`).
5. **Text-field borders too faint (WCAG 1.4.11, not an axe rule).** 40% ink on white is about 2.5:1; a field's
   outline needs 3:1. Now 60% (about 4:1): text fields, password field and its show button, the contact message box.
6. **Legal contents links (review item 15).** Each link now fills its row (44 px tall, full width) and is underlined
   like the page's other links.
7. **Latin names inside Arabic and Hebrew legal pages (review item 16).** Each Latin run (StoryTime, MIT, Supabase,
   three.js, storage key names) is isolated left-to-right and marked `lang="en"`, so dots and full stops stay in
   place and screen readers switch voice. Not a word was changed (`isolateLatin` in `src/legal/LegalText.tsx`).

### Left open
- **Classroom screen** (another helper's new code, `src/features/classroom/Classroom.tsx`) renders its own
  test-mode notice outside any landmark; it should drop it (the header now carries it) or wrap it. Not audited here.
- **axe "needs review" on colour contrast (21 of 140 audits):** axe could not work out the background behind the
  home page graph's labels (SVG text) and behind text near the hatched placeholder pictures (reader, library,
  storybook). Checked by hand: the graph labels sit on the plain page (ink 17:1, muted ink 6.8:1); the reader's words
  sit on a near-white band, the placeholder tag has its own background, and the greyed "A−" is a disabled control
  (exempt). No fault. Re-check when the real pictures arrive: words over art will need their own check.
- **Safari and VoiceOver were not tested** (WebKit is not installed here). Nor were TalkBack, NVDA or JAWS: axe and
  the keyboard walks are not a screen-reader test.

## 3. Speed (Lighthouse, mobile profile)

Measured on a launch-mode build (base `/`, indexable) served locally without compression, Lighthouse's default
mobile profile (simulated slow 4G and a 4x slower CPU), each page three times, the median reported. **The machine
was busy** (a film is being drawn and other helpers run tests: load average 5 to 6 on 4 cores), so blocking time and
the performance score move between runs; page weight, LCP, layout shift and the three other scores are stable.
Script: `node scripts/qa/lighthouse.mjs --url=http://localhost:4391/ --runs=3` (see its header).

### Changes
1. **Public pages no longer download the data backend for a visitor who was never signed in.** The header asked the
   backend whether someone is signed in, so every public page fetched it; in test mode that is a 665 KB chunk (the
   test backend with every story's `story.json`). Now, when the browser holds nothing that could be a session (no
   test-mode store, no Supabase sign-in token), the page settles as signed out at once, and the backend arrives only
   when a page needs it (sending a form); the header then follows a sign-in on that page
   (`src/data/index.ts` `mayHaveSession` and `whenApiLoaded`, `src/features/account/session.tsx`).
2. **"Cancel a purchase" no longer jumps** (layout shift 0.02 to 0.04): it pre-rendered a spinner and swapped in the
   form; now the form is pre-rendered and only a signed-in parent sees it replaced by their passes.
3. **No more console error on a first visit:** browsers asked for `/favicon.ico`, which does not exist yet. An empty
   inline icon stops the request until the brand's icons exist (`src/root.tsx`, marked to replace).

### Before and after (median of 3 runs per page)
Summary over the 56 public pages (14 page types in four languages), 168 runs each side:

| | Before | After |
|---|---|---|
| Performance (median per page) | 87 to 100; 1 page under 90 (Hebrew accessibility statement, 87) | 99 to 100; none under 90 |
| Single runs under 90 | 9 of 168 | 0 of 168 |
| Accessibility, best practices, SEO | 100 on every page | 100 on every page |
| Page weight, uncompressed | 1,162 to 1,230 KB | 514 to 582 KB on 12 page types; home and plans 1,179 to 1,229 KB |
| Largest contentful paint | 1.05 to 1.66 s | 1.05 to 1.67 s (unchanged) |
| Layout shift | 0 except cancel a purchase (0.022 Arabic, 0.039 Hebrew) | 0 everywhere |

The "before" runs met a busier machine than the "after" runs (load average 5 to 6.7 against 3.9 to 5.5), so part
of the drop in blocking time is the machine, not the site; the weight and layout-shift changes are not noise.
Lighthouse scores SEO 100 here because this is the launch build; the preview build is noindex on purpose.

Per page (before → after):

| Page | Performance | Accessibility | Best practices | SEO | Page weight (KB) | LCP (ms) | TBT (ms) | CLS |
|---|---|---|---|---|---|---|---|---|
| ar/ | 99 → 99 | 100 → 100 | 100 → 100 | 100 → 100 | 1216 → 1229 | 1654 → 1654 | 36 → 22 | 0 → 0 |
| ar/plans | 100 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1178 → 1190 | 1208 → 1204 | 59 → 31 | 0 → 0 |
| ar/sign-in | 100 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1173 → 524 | 1207 → 1206 | 22 → 0 | 0 → 0 |
| ar/sign-up | 100 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1178 → 530 | 1206 → 1205 | 41 → 0 | 0 → 0 |
| ar/forgot-password | 100 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1172 → 524 | 1207 → 1203 | 23 → 0 | 0 → 0 |
| ar/cancel-purchase | 100 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1181 → 536 | 1204 → 1204 | 15 → 0 | 0.022 → 0 |
| ar/help | 100 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1180 → 531 | 1204 → 1204 | 37 → 0 | 0 → 0 |
| ar/contact | 100 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1172 → 524 | 1205 → 1205 | 37 → 0 | 0 → 0 |
| ar/legal/terms | 100 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1201 → 553 | 1355 → 1352 | 17 → 0 | 0 → 0 |
| ar/legal/privacy | 98 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1230 → 582 | 1507 → 1503 | 139 → 0 | 0 → 0 |
| ar/legal/refunds | 100 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1187 → 538 | 1210 → 1201 | 19 → 0 | 0 → 0 |
| ar/legal/accessibility | 100 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1180 → 532 | 1204 → 1202 | 23 → 0 | 0 → 0 |
| ar/legal/credits | 100 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1185 → 540 | 1204 → 1352 | 59 → 0 | 0 → 0 |
| ar/legal/cookies | 100 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1185 → 538 | 1202 → 1203 | 17 → 0 | 0 → 0 |
| he/ | 99 → 99 | 100 → 100 | 100 → 100 | 100 → 100 | 1212 → 1225 | 1652 → 1654 | 14 → 11 | 0 → 0 |
| he/plans | 100 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1175 → 1187 | 1205 → 1203 | 12 → 10 | 0 → 0 |
| he/sign-in | 100 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1170 → 522 | 1202 → 1202 | 16 → 0 | 0 → 0 |
| he/sign-up | 100 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1175 → 527 | 1202 → 1206 | 40 → 9 | 0 → 0 |
| he/forgot-password | 100 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1170 → 522 | 1203 → 1203 | 39 → 0 | 0 → 0 |
| he/cancel-purchase | 100 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1178 → 533 | 1204 → 1213 | 32 → 0 | 0.039 → 0 |
| he/help | 100 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1177 → 528 | 1202 → 1216 | 29 → 0 | 0 → 0 |
| he/contact | 99 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1169 → 521 | 1207 → 1208 | 117 → 10 | 0 → 0 |
| he/legal/terms | 99 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1196 → 548 | 1359 → 1356 | 53 → 1 | 0 → 0 |
| he/legal/privacy | 91 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1223 → 575 | 1510 → 1506 | 369 → 0 | 0 → 0 |
| he/legal/refunds | 93 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1183 → 534 | 1217 → 1207 | 315 → 0 | 0 → 0 |
| he/legal/accessibility | 87 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1177 → 529 | 1205 → 1205 | 494 → 0 | 0 → 0 |
| he/legal/credits | 99 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1182 → 537 | 1210 → 1211 | 126 → 7 | 0 → 0 |
| he/legal/cookies | 99 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1181 → 534 | 1215 → 1205 | 112 → 1 | 0 → 0 |
| en/ | 99 → 99 | 100 → 100 | 100 → 100 | 100 → 100 | 1200 → 1213 | 1659 → 1656 | 24 → 14 | 0 → 0 |
| en/plans | 96 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1167 → 1179 | 1211 → 1208 | 233 → 20 | 0 → 0 |
| en/sign-in | 100 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1163 → 515 | 1056 → 1207 | 26 → 0 | 0 → 0 |
| en/sign-up | 100 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1168 → 520 | 1203 → 1208 | 33 → 0 | 0 → 0 |
| en/forgot-password | 100 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1163 → 515 | 1052 → 1057 | 34 → 33 | 0 → 0 |
| en/cancel-purchase | 100 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1171 → 526 | 1055 → 1211 | 27 → 0 | 0 → 0 |
| en/help | 100 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1169 → 519 | 1202 → 1205 | 29 → 3 | 0 → 0 |
| en/contact | 100 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1162 → 514 | 1056 → 1204 | 18 → 0 | 0 → 0 |
| en/legal/terms | 100 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1183 → 535 | 1203 → 1211 | 13 → 0 | 0 → 0 |
| en/legal/privacy | 100 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1207 → 558 | 1352 → 1354 | 14 → 1 | 0 → 0 |
| en/legal/refunds | 100 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1173 → 525 | 1202 → 1206 | 33 → 0 | 0 → 0 |
| en/legal/accessibility | 100 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1168 → 520 | 1202 → 1204 | 13 → 0 | 0 → 0 |
| en/legal/credits | 100 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1174 → 525 | 1203 → 1205 | 21 → 11 | 0 → 0 |
| en/legal/cookies | 100 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1172 → 524 | 1203 → 1203 | 30 → 0 | 0 → 0 |
| da/ | 99 → 99 | 100 → 100 | 100 → 100 | 100 → 100 | 1202 → 1215 | 1654 → 1666 | 15 → 30 | 0 → 0 |
| da/plans | 100 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1168 → 1180 | 1208 → 1205 | 20 → 27 | 0 → 0 |
| da/sign-in | 100 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1164 → 515 | 1059 → 1205 | 52 → 0 | 0 → 0 |
| da/sign-up | 100 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1169 → 521 | 1205 → 1215 | 46 → 0 | 0 → 0 |
| da/forgot-password | 100 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1164 → 515 | 1054 → 1201 | 26 → 0 | 0 → 0 |
| da/cancel-purchase | 95 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1172 → 527 | 1209 → 1204 | 260 → 0 | 0 → 0 |
| da/help | 94 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1170 → 520 | 1213 → 1207 | 286 → 10 | 0 → 0 |
| da/contact | 100 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1163 → 515 | 1217 → 1205 | 35 → 0 | 0 → 0 |
| da/legal/terms | 100 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1185 → 537 | 1210 → 1205 | 80 → 18 | 0 → 0 |
| da/legal/privacy | 100 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1209 → 561 | 1357 → 1352 | 47 → 0 | 0 → 0 |
| da/legal/refunds | 100 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1175 → 526 | 1209 → 1204 | 63 → 0 | 0 → 0 |
| da/legal/accessibility | 100 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1169 → 521 | 1207 → 1202 | 32 → 0 | 0 → 0 |
| da/legal/credits | 100 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1175 → 526 | 1211 → 1200 | 42 → 0 | 0 → 0 |
| da/legal/cookies | 95 → 100 | 100 → 100 | 100 → 100 | 100 → 100 | 1173 → 525 | 1208 → 1206 | 265 → 0 | 0 → 0 |

### What was not changed, and why
- **Home and plans still weigh about 1.2 MB in test mode:** they now read live prices (`usePrices`, the owner's-area
  helper's new work), which loads the whole backend for every visitor. Suggestion for that helper: keep the static
  price list on the public pages, or fetch prices without the backend. On Supabase the cost is the Supabase client
  plus one request, not the 665 KB test chunk.
- React and the router (about 350 KB before compression) are most of the remaining weight; Lighthouse marks about
  180 KB of it unused on first load. Splitting React itself is not cheap.
- The 55 KB stylesheet blocks rendering (about 10 KB compressed). Inlining critical CSS waits for the real design.
- The local test server does not compress; GitHub Pages and Cloudflare do, so real transfer sizes are about a third.

## 4. Search and sharing basics
- **sitemap.xml**, written at build time from `src/seo/paths.ts` (`src/seo/sitemap.ts`, `scripts/postbuild.mjs`):
  every public page in every language (56 addresses), each with the same five reciprocal hreflang links as the page
  (four languages and x-default). No dates (the build has no honest per-page date). The language picker at `/` is
  not listed (it only redirects; it is the home pages' x-default).
- **robots.txt:** preview builds (`NOINDEX=1`) disallow everything (as before; the preview script writes the same);
  launch builds allow the public pages, keep `/<lang>/app/` and `/<lang>/auth/` out, and name the sitemap.
- **Canonical and hreflang verified on every pre-rendered page** (57 pages, `e2e/launch.spec.ts`): one canonical
  pointing at itself, exactly the five expected alternates, `lang` and `dir` on `<html>`, a title and a description,
  and the preview's noindex.
- **Share previews:** each public page carries its own title, description, address and locale as Open Graph tags and
  a text-only card. **No share picture** (that is brand artwork).
- **Structured data:** a plain `WebSite` (name, address, language) on the four home pages only. No organisation
  (business details are not set), no prices, offers, ratings or reviews. FAQ markup was not added (Google no longer
  shows it for sites like this one).
- **Not-found page:** see section 2, item 4. Hosting note for launch: Cloudflare must serve `404.html` (it is the
  app's fallback page) for unknown addresses, so the not-found page renders in the right language.

### Left open (design stage or owner)
- Icons (favicon, Apple touch icon), a web app manifest and the share picture: wait for the brand.
- The real domain: `SITE_ORIGIN` must be set for the launch build (canonical, hreflang, sitemap, robots all use it).
- Search Console and Bing verification need the owner's accounts and domain.

## 5. Safety read of the public bundle
- **Secrets:** none. Every pre-rendered page and every script it loads was searched for server keys, tokens and
  private keys (`e2e/launch.spec.ts`). The only settings read in the browser bundle are the Supabase address and
  publishable key, which are meant to be public.
- **Paid story text:** the existing check "the built public pages carry no story text" passes on this build: only
  the known A04 page on the home page. The author's story (`content/author/`) is imported by nothing; none of 51
  sampled sentences from it appears in any file of either build.
- **Test-only tools:** the lab pages are not in production builds (the build refuses them). The test email link
  shows only with the test backend. The test payment page (`/app/test-pay`) is a route in every build, but on a real
  backend it can grant nothing unless the payment function runs with `ALLOW_TEST_PAYMENTS=1`: **the launch
  checklist must keep that off**, and `activeProvider` is still the test provider until a payment company is
  connected (owner).
- **Corrected 27 Nov 2026 (fresh review of 26 Nov, finding 2).** The line that stood here said the test-mode
  backend chunk "is never loaded by a Supabase build". That was true but beside the point, and the safety read above
  was wrong to pass: a Supabase (launch) build still **published** the test-mode backend and the story files it reads
  as public script files (`local-*.js`, `server-*.js` and one file per story language), because the owner's Supabase
  code imported a helper from the test-mode file. Measured on the 26 Nov code: 21,636 story lines found in a launch
  build's files. The check that passed read only `.html` files. Fixed: a launch build now leaves the test-mode
  backend and every story file out at build time (`vite.config.ts`, `__TEST_BACKEND__`), and
  `e2e/stage4b1.spec.ts` builds a launch-mode copy and scans **every** file it writes, scripts included, for every
  story line of 20 characters or more (and for the test-mode backend's own keys): 0 found. In **test mode** (the
  GitHub Pages preview) the backend and the sample and pilot story words are still in the preview's files, by
  design, so: never publish the preview with the author's story in `content/stories/`.

## 6. Looked at by eye
Screenshots in `qa/out/launch/` (phone 390 px and desktop 1440 px): the not-found page in English and Arabic and
with no language; the library's trial box in English and Arabic ("Free trial: 3 days left", "المتبقي من التجربة
المجانية: 3 أيام"); the Arabic credits and Hebrew cookies pages (contents links, isolated Latin names); cancel a
purchase; sign-up with the darker field borders. Raw axe results: `qa/out/a11y/`.

## 7. Small open review items
- **Item 8, trial box wording: done.** "Free trial: 3 days left" (rounded up, then hours in the last day), with each
  language's own plural forms from the browser (Arabic "يومان", Hebrew "יומיים"). Words in four languages
  (`commerce.access.trialActive`); unit test in `tests/launch.test.ts`.
- **Item 15 and 16: done** (section 2, items 6 and 7). No legal wording changed; still drafts for a lawyer.

## 8. Checks run (on the final code)
All on private copies of the build (preview mode: base `/StoryTime/next/`, `NOINDEX=1`; launch mode: base `/`,
`SITE_ORIGIN=https://storytime.example`), built from a snapshot of the working tree, served by `scripts/serve.mjs`.
- `npm run typecheck`: 0 errors.
- `npx vitest run tests/launch.test.ts tests/legal.test.ts tests/rules.test.ts tests/landing.test.ts
  tests/local-data.test.ts`: 46 passed (new `tests/launch.test.ts`: 10: sitemap, robots, time-left wording, Latin
  isolation).
- `E2E_PORT=<port> npx playwright test e2e/a11y.spec.ts e2e/launch.spec.ts e2e/public.spec.ts`: 43 passed, 9 skipped
  (the size-independent launch checks run once, in the phone project). 140 axe audits: 0 violations, 0 touch targets
  under 44 px.
- Existing public specs (`public`, `legal`, `support`, `landing`, `states`, and the public parts of `stage4b1`):
  75 passed, 3 skipped (WebKit-only and once-only).
- `e2e/stage4b1.spec.ts` "the built public pages carry no story text", run against this build: passed.
- `node scripts/qa/lighthouse.mjs --runs=3` on the launch build, before and after: the tables above.
- Not run: the whole e2e suite (other helpers' screens are changing under it), and the database tests.

## 9. Not proven
- Safari and iPhone: WebKit is not installed here; nothing in this report was seen in Safari.
- Screen readers: no VoiceOver, TalkBack or NVDA run; axe and keyboard walks only.
- Hebrew and Danish signed-in screens were not audited with axe (same components as English and Arabic; the public
  pages were measured by Lighthouse in all four languages).
- Speed on a real phone and real network; the numbers are Lighthouse's simulation on a busy machine.
- Nothing ran against a real Supabase project; the Supabase sign-in token check (`sb-…-auth-token`) follows the
  documented storage key and is not proven against a live project.
- New words (not-found lines, trial line) have not been read by a native Arabic, Hebrew or Danish reader.
