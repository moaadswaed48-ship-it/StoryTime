# StoryTime: project rules (rebuild started 22 Nov 2026)

A four-language (Arabic, Hebrew, English, Danish) story library for children aged 2 to 8, sold in Israel by
age-group pass. Each story has a book, read-along audio, a code-made film and an activity.
**Read first:** `docs/MASTER-PLAN.md` (the approved plan), then `docs/HANDOFF.md` (where the work stands).
`docs/REQUESTS-ORGANIZED.md` is the owner's request list, points A1 to T5.

## Hard rules
1. **All pictures, films and 3D figures are drawn and animated in code.** No AI image or video tools, and no
   AI-made assets from the old build (the old Sari model, paintings, film clips and hero picture stay behind).
2. **The site is a home for many stories.** No single story's season, look or character becomes the brand.
   Nothing from the old autumn look (maple, brown, leaves) is reused.
3. **The author's Arabic story text is hers.** Never edit, shorten, translate or add vowel marks to it without her
   written consent. Never contact her. Our own stories are labelled as StoryTime's.
4. **No invented facts.** No made-up prices, reviews, user counts or research results. Placeholders are visibly
   marked. A claim on the site must be true of the build as it is today.
5. **Four languages, same shape.** Every visible word lives in the typed dictionaries; the compiler must reject a
   missing key. Arabic and Hebrew are right-to-left: logical CSS only (`start`/`end`), never split or letter-space
   Arabic, mirror layout but not art. Arabic is Modern Standard Arabic. Address parents without assuming gender.
6. **Paid content never ships in the public bundle** or in prerendered pages. Story text, pictures and films are
   fetched only for accounts with an active trial or pass.
7. **Easy for children and parents.** Nothing hidden, no hover-only controls, large touch targets; screens for small
   children work by pictures, not words. Phone first; Safari on iPhone matters most.
8. **Motion has a rest state.** Everything is usable with reduced motion, slow devices or no WebGL.
9. **Money and accounts need the owner's yes:** paid plans, credits, new accounts, new Supabase projects, domains.
   The existing Supabase project belongs to another product: never touch it.
10. **Outside skills and packages:** read the code for hidden network calls, commands and secret reading before
    installing; pin the version; record the check in `docs/SKILLS.md`.

## Working method
- Branch: `claude/friendly-hamilton-dsakt5`. Old build: `origin/laptop/landing-v2` (copy files from it with
  `git show`, never merge it).
- Models: research reading on Sonnet 5.5; site building, writing and reviews on Opus 5.5 (high for building and
  writing); art engine, style and pilot films on Fable 5.2 high. Never `max` effort.
- Every stage ends with its check from the master plan and an update to `docs/HANDOFF.md`.
- Evidence before "done": screenshots at 390, 768 and 1440 px, tests, rendered frames. A fresh reviewer looks before
  any report to the owner.
- The owner is a physician, not a programmer, and reads on an iPhone: result first, plain words, a link or file he
  can open.
