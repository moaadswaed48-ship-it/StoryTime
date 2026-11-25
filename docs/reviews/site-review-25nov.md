# Site review, 25 Nov 2026 (fresh reviewer, live preview)

Live preview: https://moaadswaed48-ship-it.github.io/StoryTime/next/ (test mode, noindex). The look was not reviewed
(deliberately plain, pictures are placeholders). Reviewed: does it work, is it honest, is it easy, is it safe.

## How it was checked
- **Public pages:** all 12 public pages in all four languages at 390 px, plus home, plans, "Cancel a purchase" and
  terms at 1440 px (60 page loads). Each was checked for: HTTP status, console errors, sideways scroll, words in the
  wrong language, a "Cancel a purchase" link and the legal links, noindex, visible keyboard focus after Tab, touch
  targets under 44 px, images without alt text, unlabelled fields, heading order, and shekel amounts.
  Script: `qa/out/review/walk/` (not part of the test suite). Raw results: `qa/out/review/public-audit.json`.
- **Story text in public HTML:** every sentence of 25 characters or more from all 45+ stories in four languages
  (6,242 sentences) was searched for in the raw HTML of all 48 public pages (curl, not the browser).
- **Walk-throughs on the live site:** a parent in Arabic, Hebrew, English and Danish, and a kindergarten teacher in
  English and Hebrew, at 390 px and 1440 px (12 runs). Each run went: sign up, confirm (test link), onboarding, first
  story, library, read to the end, Listen and auto-flip, the storybook page, favourite, Watch, Do and its print view,
  "My shelf" and the trial counter, collections, the trial ending (test clock), the locked story, buying a 3-month
  pass in the test checkout, the purchase in Settings, the "Cancel a purchase" page, switching language, deleting the
  account. Notes: `qa/out/review/walk-notes-all.txt`, `walk-notes-en-phone.txt`, `walk-notes-teacher-rerun.txt`; screenshots
  `qa/out/review/walk-<role>-<lang>-<size>-<step>.png`.
- **A two-year-old's hands:** a script tapped only large picture areas: shelf cover, storybook doors, reader arrows,
  close. Also a run with reduced motion turned on.
- **Not available here:** axe-core and Lighthouse are not installed (nothing was installed); the accessibility scan
  above is a hand-written check, not axe. Safari/WebKit is not installed, so iPhone Safari was not tested.

## What works (evidence)
- Every public page answers 200, is noindex, and has no console errors in any language or size.
- "Cancel a purchase" and all six legal pages are linked from the footer of every page, public and signed-in.
- No story text in public HTML, except one deliberate page from StoryTime's own story A04 on the home page ("A page
  from the book", the same words as the book in all four languages). The author's story is not on the preview.
- Prices appear only as "Price not set yet" with a Placeholder tag. The only shekel amount is the legal fee cap
  ("100 shekels").
- The full parent and teacher journey worked in all four languages at both sizes (12 of 12; see item 14). Arabic and Hebrew pages are right-to-left, the reader's arrows and the shelf's arrows point
  the right way, and switching language keeps the page.
- The research cards on the home page name real, correctly described sources (WHO 2019 under-5 guideline, Durlak
  et al. 2011, Jones, Greenberg and Crowley 2015) and say plainly that they did not study StoryTime. The impact graph
  is labelled "Illustration with sample numbers. Not study results."
- Keyboard focus is visible on every page checked. Reduced motion: the reader opens as a flat book with no page curl,
  and no animations run on the home page or library.
- A small child can get from the library to a story and back with large taps only: tapping the front cover opens the
  storybook page; the Read and Do doors are about 173 x 216-236 px; the reader arrows are full-width 56 px bars.

## Findings, ranked

### BROKEN
1. **Story activities: the list of things to fetch did not match its pictures (A14 and five others).** A14's
   `story.json` listed three materials while every language lists two (both boxes are one line), so the second line
   ("safe things from home") would have been given the picture of the little box. The same mismatch was in B12, B15,
   C05, C06 and C08 (the language files group several things on one line). **Fixed** (see below). C03 still lists a
   chopping board that no language file names: **left for the Story Room** (needs a new line in four languages).
2. **Danish accessibility statement scrolls sideways on a phone.** The one-word title "Tilgængelighedserklæring" is
   wider than a 390 px screen (page 398 px wide). Evidence: `pub-phone-da-legal-accessibility` in
   `public-audit.json`. **Fixed.**

### UNTRUE
3. **The reader showed a Listen button that does nothing**, greyed out, plus a "Turn pages by itself" switch that is
   on by default and only works with a voice. No story has a voice yet. The product checklist says Listen must not be
   shown as a button that does nothing. All languages, both sizes. Evidence:
   `walk-parent-en-phone-05b-reader-page.png`, `walk-parent-ar-phone-05b-reader-page.png`. **Fixed:** without a
   recording the reader shows a calm "Voice coming soon" note instead of both controls.
4. **The home page headline promises what does not exist yet.** "Stories ... each with a picture book, a short film
   and an activity" and "A narrator reads each page aloud" are present tense, while no film, picture or voice exists;
   a note further down says they are "still in production". Rule 4 says a claim must be true of the build today.
   All four languages. Evidence: `pub-phone-en-home-fold.png`. **Not changed** (marketing words in four languages;
   suggestion: "will have" in the hero, or move the "Being made now" note up beside it).
5. **Storybook hint says "All four are always here"** while Listen and Watch say "coming soon". Small, but a parent
   reads it as a promise. Evidence: `walk-parent-en-phone-03-first-story.png`. Not changed.

### CONFUSING
6. **Two menus on every signed-in page.** The header shows "Plans, Library, Settings" and right below it a second
   bar "Library, Collections, Settings". Evidence: `walk-parent-en-phone-04-library.png`.
7. **For a small child the library is mostly words.** On a phone the shelf starts about 940 px down, below the trial
   box, "Continue", "My shelf", age group and view choice; "Open this book" is a word button (tapping the cover does
   work). The way back from a storybook page is the text link "Back to the library"; there is no picture-only way back.
8. **Trial box wording:** "Free trial, time left: days 3, hours 0" reads like a form; "3 days left" would be
   plainer. All languages.
9. **Age-group chips on the phone library were cramped**: "Ages 2-3" touched its box edge at 390 px
   (`crop-chips-en.png`). **Fixed** (less padding on the small three-in-a-row choices).
10. **Plans page heading order** jumped from the page title to the pass cards' sub-headings (h1 to h3), which screen
    readers announce as a missing level. **Fixed** (the pass cards are now second-level headings).

### WEAK
11. **Footer is missing checklist items:** Help, Contact, a language picker (only in the header) and the business
    details (still a placeholder). The checklist marks them MUST for the footer.
12. **The site name link at the top was 28 px tall**, under the 44 px touch target. **Fixed.**
13. **Quick page flipping is not saved.** A page counts as read after half a second on screen; a child who flips
    fast to the end and closes the book is saved at page 1 (`crop-he-desk-storybook.png`: "Read up to page 1" after
    a fast read-through), and the trial counter then shows "0 of 3". Suggestion: also save the last page when the
    reader closes.
14. **(Withdrawn) "Forward arrow stopped answering":** seen in 2 of 14 first runs; the screenshot shows the reader had
    reached "The end" with the forward arrow correctly greyed out. My script kept pressing it. Not a site fault.
15. **Some legal-page contents links are narrower than 44 px** (short words such as "Fonts", "ילדים"); they are 44 px
    tall and above the WCAG AA minimum of 24 px.
16. **Latin words inside Arabic and Hebrew legal pages** (library names on Credits, storage key names on Cookies,
    "hash", "Child Development", "Safari", the terms version "draft-2026-11-25"). These are names and are acceptable;
    a native reader should still look at the legal drafts (they are marked as not reviewed by a lawyer).
17. **Not on the home page:** the 3D hero (checklist MUST) is not shown on the public landing yet.

## What was fixed in this review
- `content/stories/{a14,b12,b15,c05,c06,c08}/story.json`: activity material ids grouped to match the language lines
  (ids only; no story or activity words changed). `storytool.py check` reports no errors for all six.
- `tests/content.test.ts`: new test, every story folder's language files agree with its `story.json` (pages, film
  lines, activity steps and materials); C03 is the one known exception, named in the test.
- `src/data/local/content.ts`: comment updated (no longer names A14 as broken).
- `src/features/reader/Reader.tsx`: no recording means a "Voice coming soon" note instead of a dead Listen button and
  auto-flip switch; `e2e/stage4c.spec.ts` checks it on every story it reads.
- `src/app.css`: long English and Danish headings may hyphenate or wrap instead of pushing the page sideways (Arabic
  and Hebrew untouched).
- `src/ui/SiteHeader.tsx`: site name link 44 px tall. `src/ui/controls.tsx`: compact choices fit at 390 px.
  `src/features/commerce/PlanCards.tsx`: pass card headings are level 2.

## Live recheck after republishing (25 Nov 2026)
- `npm run typecheck` 0 errors; `npm test` 354 passed (28 files); `npm run e2e` 90 passed, 4 skipped (WebKit-only and
  once-only), 0 failed, 15.6 min.
- Republished with `node scripts/deploy/preview.mjs` (1059 pages, all noindex). Live: the public audit re-run on all
  64 page loads shows no sideways scroll (Danish accessibility page now 390 px wide), no console errors, no heading
  skip, the site-name link at 44 px, Cancel and legal links everywhere. The walk-through re-run (18 runs) shows the
  reader's "Voice coming soon" note in every language with no Listen button or auto-flip switch
  (`qa/out/review/after/walk-*-05b-reader-page.png`, notes in `qa/out/review/after/walk-notes.txt`).

## Left open
- C03 chopping board (Story Room, four languages). Items 4, 5, 6, 7, 8, 11, 13, 17 above.
- axe-core and Lighthouse runs (not installed here), Safari on iPhone (WebKit not installed).

## Fixes (25 Nov, second pass)
In short: the landing page and the app no longer claim that pictures, films or a voice exist; signed-in pages have
one menu; every footer has Help, Contact and a language picker; fast page flips are saved; C03 lists the chopping
board. The look is unchanged (neutral tokens). Republished and rechecked live at 390 px in Arabic and English.

- **Item 4 and 5 (UNTRUE), four languages.** Hero: "Each one will have a picture book, a short film and an
  activity", with a line beside it: "Ready today: the words and the activity of every story, in all four languages.
  Still being made: the pictures, the films and the narrator's voice." A04's Read, Listen and Watch cards say what
  is not made yet; "Every part of each story is open" became "Each story is fully open"; the FAQ answers on screen
  time and languages speak of films "once they are ready" and no longer say a child can "hear" a story; the trial
  answer says "fully open". Same claim also fixed in: the landing meta description (`pages.ts`), the storybook hint
  "All four are always here" (now: all four are always shown, and one not ready yet is clearly marked), the onboarding
  language line ("voice and captions follow this choice"). The plans, sign-in and sign-up meta descriptions still
  said "placeholder page, not active yet": rewritten. Checked and clean: emails (`src/emails/copy/*`), the plans and
  checkout words (`commerce.ts`: "every feature" means access, which is true).
- **Item 6 (two menus).** One menu, in the header: Library, Collections, Settings, Plans (and the owner's area for
  the owner); the page you are on is marked. The app's second bar is removed. Nothing is hover-only.
- **Item 11 (footer).** Every page: Cancel a purchase, Help, Contact, Plans, the six legal pages, a language picker
  that keeps the page, and the business-details placeholder. New public pages in four languages: Help (the nine
  landing questions, the contact form, the support email as a visible placeholder, how to cancel) and Contact (name,
  email, message; recorded through the data layer: in test mode in this browser, which the page says; on Supabase in
  a new owner-only table `contact_messages` through `send_contact_message()`, 3 messages an hour per address).
- **Item 13 (fast flips).** The reader also saves the latest page when it closes, when the tab is hidden and when the
  page is left; the storybook page waits for that save before reading progress. New test: flip to the end with no
  pause and close at once; the storybook page must say "Read up to page 14". It fails on the old code and passes now.
- **Item 1, C03.** The activity needs the board (step 3: the grown-up slices the cucumber on it), so all four
  languages have a new material line, "A chopping board and a sharp knife, for the grown-up only" (Arabic and Hebrew
  through their sources and `storytool.py build`); `story.json` material ids now match the lines one to one.
  `storytool.py check c03`: no errors; the C03 exception is removed from `tests/content.test.ts`.
- **Item 7 (library mostly words)** is left for the design stage; what it needs is written in `docs/HANDOFF.md`.

Checks: `npm run typecheck` 0 errors; `npm test` 358 passed in 29 files (new: `tests/db/contact.test.ts` 3, a local
contact test, the C03 exception removed); `npm run e2e` 104 passed, 4 skipped (WebKit-only and once-only), 0 failed,
22 minutes (new: `e2e/support.spec.ts` footer, Help and Contact in English and Arabic; the hero line in
`e2e/landing.spec.ts`; one menu and fast flips in `e2e/stage4c.spec.ts`). Republished with
`node scripts/deploy/preview.mjs` (1067 pages, all noindex). Live at 390 px in Arabic and English
(`qa/out/review/second-pass/live.spec.ts`, 4 of 4 passed, no page errors, no sideways scroll): the hero line, footer,
Help, Contact (message sent), sign-up and onboarding, one menu in the library, fast read of B02 saved at page 14,
C03's new material line. Screenshots: `qa/out/review/second-pass/live-*.png`.
Not done: no fresh reviewer has read these changes; the Arabic, Hebrew and Danish wording is not checked by a native
reader; nothing ran against a real Supabase project; Safari not tested.
