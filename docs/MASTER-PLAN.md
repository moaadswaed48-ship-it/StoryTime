# StoryTime master plan (22 Nov 2026)

**In three lines:** a new StoryTime site built from a fresh skeleton, in Arabic, Hebrew, English and Danish, with 45 new stories in three age groups. Each story gets a book, read-along, a code-made film and an activity; the site gets real accounts, plans, emails, legal pages and an owner's area. The recorded voice and the game are later stages, and the site opens to paying customers only after the voice is in.

Nothing starts until you write **GREEN**. After GREEN I work alone and write to you only at the four moments in Section 11.

---

## 1. Context: why this work
The preview shown to the customer on 12 Nov was built around one autumn story and turned that story into the brand. It has no real accounts, payment, emails or legal pages, three different art styles, two different-looking front doors, stale claims and untested parts. The demo stage is over; this plan builds the real product and makes it ready to ship.

## 2. What you decided (locked)
| Topic | Your decision |
|---|---|
| Skeleton | New website from scratch, more creative, with wow moments. Carry over only the expensive pieces, and polish each one. |
| Carry over | Page-curl book, the author's story, the bookshelf (redesigned in a new style), the 3D character idea, plus other costly pieces I identify. |
| Pictures and films | All drawn and animated in code by me. No AI picture or video tools. You will send reference cartoons. If my result fails to impress you, you will allow other tools. |
| Languages | Arabic, Hebrew, English, Danish, all complete. Writing is sensitive work and gets its own careful process. |
| Age groups | By child-development milestones from trusted sources, not the Ministry. You hope for three; I check and decide. Each group is its own deep piece of work. |
| Free trial | 3 stories for 3 days, every feature included. |
| Selling | Israel first. Other countries later. All four languages can read the site and use the trial. |
| Preview | A preview link, hidden from Google. |
| 3D hero | A few characters with a switcher, 7 to 10 shared gestures (dance and others, no running), the same for every character. Characters must be reusable in the future game without redoing them. |
| Game | Parked. You will send notes; it may be rebuilt from scratch. It gets its own plan later. |

## 3. What I decided for you (say so if you disagree)
1. **Age groups: 2 to 3, 3 to 5, 6 to 8.** These are the child-development stages of the US health agency CDC (toddlers, preschoolers, early school age). Stage 1 confirms the borders against CDC and the American Academy of Pediatrics and may shift them slightly. A fourth group (9 to 11) can be added later without rebuilding.
2. **45 unique stories**, 15 per group. A story can also appear in a second age group when its lesson fits both, on top of the 45. The lessons you named (respect for the elderly, for classmates, being good to one's mother, numbers) are guaranteed places.
3. **The author's story: her text is carried over untouched; its pictures and film are redrawn in the new art engine.** The old pictures and film clips were made by AI tools with no licence on record, and they would be a fourth art style on the site. Her book stays Arabic-only and without added vowel marks until she agrees in writing. The old paintings remain saved.
4. **Film length by age**, my suggestion in place of a flat 4 to 10 minutes: 2 to 3 minutes for ages 2 to 3, 4 to 5 minutes for ages 3 to 5, 6 to 8 minutes for ages 6 to 8. Small children do not hold attention longer, and total film time drops from about 5 hours to about 3.5.
5. **Plans are passes, not auto-renewing subscriptions**: 1, 3 or 12 months per age group. A pass simply ends; reminder emails go out before it does. No surprise charges. One account can hold passes for two age groups (a family with two children). Prices stay as marked placeholders until you give them.
6. **Teachers use the same account** with an "I am a kindergarten teacher" choice at sign-up and a big-screen classroom mode. Each activity has a short "in a class" note. A class licence can come later.
7. **Arabic is Modern Standard Arabic**, the norm for children's books. The site speaks to parents in Arabic and Hebrew without assuming they are a man or a woman. Stories stay culturally neutral so every family in Israel feels at home.
8. **"Ownership"** covers all three: who owns the stories, art and site at the sale; the licence of everything inside the site; the copyright notices on the site.
9. **The old 3D model of Sari is not carried over.** It was made by an AI tool with no licence on record. Its acting code is reused on new code-built figures.
10. **The impact graph** uses sample numbers, labelled as an illustration, until your papers arrive. It never goes public with invented results; the claims about children's futures need that evidence.
11. **Old game, reward tree, Moon story**: not carried over. They stay saved in the old branch.

## 4. Points I missed the first time, found on the recheck
- An **owner's area** where you or the buyer add and edit stories, upload a film, add an activity, choose the trial stories and publish. Your notes said "stories that I will send" and "the option to put the film to be uploaded".
- A **language setting per user**, which the voice, captions and activity captions follow.
- **Collections must work in place**: watch the film or do the activity right there, not only link to the book.
- **Three reference sites** besides ElevenLabs. I chose Epic (children's library with parent and teacher sign-up), Duolingo (first-time experience) and Netflix (plans, profiles, emails).
- **Small children cannot read menus**: children's screens are driven by pictures and large touch areas, not words.

---

## 5. Kickoff summary
**Goal:** a shippable, premium, four-language story library for children 2 to 8, sold in Israel by age-group pass.

**Everything you named, and where it is used**
| You named | Used in |
|---|---|
| ElevenLabs (voice; also its website as a sign-up checklist) | Stage 10 voice; Stage 1 walk-through |
| Supabase, Cloudflare, Israeli payment company | Stage 4 and Stage 9 |
| GitHub skills and plugins for every category | Section 8 |
| Landing-page and marketing psychology repository | marketingskills by Corey Haines (Stage 8) |
| Fable 5.2 for animation, design, 3D, video | Section 7 |
| A sub-session only for video and audio | "Studio" sub-session |
| ToranCCS as the "ready to ship" guide | Stage 1: I try to read that session's checklist; if I cannot open it, I use the playbook launch card and say so |
| Page curl, 3D character, author's story, bookshelf | Section 6 |
| Your cartoon reference (coming) | Stage 2 |
| Your research papers (coming) | Stage 8 graph |

**Approach:** one art engine drawn in code serves the books, the films and the activity pictures, so a character is designed once and used everywhere. One site skeleton serves all four languages. Stories are produced like a small studio: research, writing, book, activity, film, review.

**Model, effort, cost:** see Section 7. Rough total at list prices: **3,000 to 6,000 US dollars of model use**, most of it the 45 books and films. This is a wide guess; the three pilot stories measure the real cost per story and I report it once, with a firm number for the rest. Roughly 30 to 45 long working runs.

---

## 6. From the old build
**Carried over and polished** (source: branch `laptop/landing-v2`)
| Piece | State | Work needed |
|---|---|---|
| Page-curl engine (`src/features/reader/curl`, `layout.ts`) | Works with any story; right-to-left ready | New page design with words woven into the art; separate auto-flip switch |
| Code-drawing and animation kit (`src/features/moonfilm/kit`) | Paper-cut puppets with joints, lighting, camera | Turn three fixed characters into a character builder; restyle to your reference |
| Film render studio (`video/`) | Draws every frame, then encodes | Point it at the flat-drawing kit (much faster than its old 3D route); captions; four languages |
| Film player know-how (`src/features/film`) | Scenes, captions, full screen, iPhone fixes | Rebuilt on a well-known player kit, keeping those fixes |
| Bookshelf maths and code-drawn covers (`src/features/library`) | 3D shelf, 18 cover emblems | New, more creative presentation |
| 3D acting code (`src/features/sari/Acting.tsx`) | Wave, look, stand | New code-built figures, shared skeleton, 7 to 10 gestures |
| Author's story text (`src/content/story.ts`) | Complete, hers | New pictures and film in the art engine |
| Music and sound made in code (`src/audio/synth.ts`, `video/scripts/music.mjs`) | Works | Reused for film sound |
| Arabic text helpers, testing scripts | Work | Reused |

**Left behind:** the old app shell and landing, the fake sign-in and checkout, the autumn look, the AI-made Sari model, hero picture, paintings and film clips, the game, the reward tree, the Moon story, and all narration recorded on the free ElevenLabs plan (not allowed for commercial use).

---

## 7. Sub-sessions, models and effort
You talk only to this main session. It launches specialist helpers and checks their work.
| Sub-session | Does | Model and effort |
|---|---|---|
| Conductor (this session) | Plans, assigns, reviews, reports | Fable 5.2, high |
| Research desk | Milestones, learning goals, safety, reference sites, law | Sonnet 5.5 readers; Opus 5.5 medium writes the findings |
| Story room | Story plans, writing in four languages, vowel marks | Opus 5.5 high writes; a separate fresh Opus reviewer per language; Fable 5.2 final read on the pilots |
| Studio (video, and later audio) | Art engine, characters, books, films, activity pictures, 3D hero | Fable 5.2 high for the engine, style and pilots; later batches on Opus 5.5 high with Fable as reviewer, only if a side-by-side test shows no visible drop |
| Builder | Site skeleton, accounts, plans, owner's area, emails | Opus 5.5 high; Fable 5.2 reviews the structure |
| Launch desk | Testing on phone and desktop, speed, accessibility, security, legal drafts, search engines | Opus 5.5 high; Sonnet 5.5 for screenshots and crawls; a fresh-eyes reviewer before each report |

## 8. A skill or resource for every category
"Have" = installed or connected. "Add" = I read its code for hidden network calls, commands or secret reading before installing, pin its version, and install only that one skill in this project.
| Category | Skills and resources |
|---|---|
| A Working method | playbook (have); workflow tools (have) |
| B Brand | frontend-design by Anthropic (add); impeccable (have); design-system, design-critique (have) |
| C Ages, plans, trial | marketingskills: pricing, offers, paywalls (add); deep-research (have) |
| D Stories | deep-research (have); kids-book-writer by jamesrochabrun (add); a custom "story rules" skill made with skill-creator (have) holding age limits and the list of lessons already used |
| E Storybook page | frontend-design (add); gsap-skills, official (add) |
| F Book and vowel marks | rtl-typesetting (have); open Arabic vowel-mark models CATT and Sadeed as a second opinion; a Hebrew vowel-mark tool chosen in Stage 1 |
| G Read-along | ElevenLabs official skills: text-to-speech (add) |
| H Film on the site | Vidstack player kit (add); frontend-design |
| I Film making | Remotion official skills and HyperFrames, read for craft rules (add); playbook video card (have); the carried-over kit does the drawing |
| J Voice | ElevenLabs official skills: text-to-speech, sound-effects (add) |
| K Activities | deep-research (have); a custom "activity rules" skill (safety first, free materials, no repeats) |
| L Instruction pictures | canvas-design (have); the Studio's art engine |
| M Collections | frontend-design (add); design-critique (have) |
| N Landing page | marketingskills: cro, copywriting, marketing-psychology, copy-editing (add); dataviz (have) for the graph |
| O Sign-up and onboarding | marketingskills: signup, onboarding (add); ux-copy (have) |
| P Emails | Resend official skills: resend, react-email, email-best-practices (add); marketingskills: emails (add) |
| Q Payment and services | Supabase skills (add); Cloudflare skills (add); Supabase connection (have) |
| R Legal and ownership | A custom "Israel launch law" skill I build in Stage 1 from the official Israeli sources, after a last search for a trustworthy community one. Drafts are marked "needs lawyer review" either way. |
| S Ease of use | accessibility-review, design-critique (have); impeccable (have); a usability-rules skill from the Stage 1 search |
| T Ready to ship | playbook launch card (have); security-audit by Cloudflare (have); code-review (have); marketingskills: launch, schema, seo-audit (add); real-browser and speed checks (have) |

## 9. Deep searches (Stage 1)
1. What children learn and can follow at 2 to 3, 3 to 5 and 6 to 8: language, attention, feelings, social skills, numbers. One file per age group.
2. Story length, sentence length and vocabulary per age, in each of the four languages.
3. Safe activities per age: choking, cutting, allergy and supervision rules; materials found at home or in nature.
4. Arabic and Hebrew vowel marks for children's books: how much is standard at each age.
5. First-time experience on ElevenLabs, Epic, Duolingo and Netflix, turned into one checklist of what our site must have.
6. Israeli rules for selling online to families, each checked at its official source: business details and prices with tax on the site, cancellation and refunds, receipts, privacy and children's data, the accessibility standard and statement, rules for marketing emails. European rules noted for later.
7. Israeli payment companies compared (including receipts and local ways to pay), so you can choose quickly.
8. Community skills for legal pages and child-friendly ease of use.

---

## 10. The stages
Each stage ends with a check I run myself and a short note saved in the project, so work can resume after any interruption.

**Stage 0. Setup.** New project rules file replacing the old autumn-era rules. Vetted skills installed. Carry-over pieces copied in.
*Check:* the carried pieces run on their own test pages.

**Stage 1. Research** (Research desk). The eight searches above. Result: three age-group files, a product checklist, a legal checklist, style guides for four languages, and 45 one-paragraph story outlines with their lessons.
*Check:* every claim has a source link; anything unverified is tagged.

**Stage 2. Style test, then brand** (Studio + Conductor). First a small test in your reference's direction: one book page, one 10-second film shot, one 3D figure. Then the brand: name treatment, logo, colors and lettering that work in Arabic, Hebrew and Latin scripts; one look for landing and app; a gentle variation per age group; the map of the whole site. I explore three directions, choose one and record the rules.
*Check:* the test set side by side with your reference; screens at phone and desktop size; nothing from the autumn look remains.

**Stage 3. The art engine** (Studio). This is where I try to earn your trust.
- A character builder: each character is one sheet (shape, colors, hair, clothes) that produces the flat puppet for books and films and the 3D figure for the hero and the future game. The 3D figures are shaded flat with outlines so they match the drawings, use the standard skeleton that game tools expect, and are saved as standard 3D files.
- A library of places, objects, weather and light, plus about 40 reusable shots (camera moves and acting) so each film is assembled, not started from zero.
- The fixed cast for activity instructions: a teacher, a mother, a father, a grandparent, four children.
- 3D hero: 7 to 10 gestures written once and working on every character; character switcher.
*Check:* a moving test of every gesture on three characters; flat and 3D versions of the same character side by side.
*You:* choose one of three instruction-picture styles.

**Stage 4. The site skeleton** (Builder).
- Public: landing, plans, sign-up, sign-in, legal pages, contact, in four languages, right-to-left for Arabic and Hebrew.
- Sign-up: email confirmation, parent or teacher, age group, child profiles, language.
- The library: redesigned bookshelf; collections of all stories, all films, all activities, each usable in place and linking to its book.
- The storybook page: Read, Listen, Watch, Do, all visible, nothing hidden.
- The book: page curl; words set on soft paper areas inside the picture, as real text a screen reader can read; space sized for the longest language; the layout mirrors for right-to-left; text size; listen button; a separate, obvious auto-flip switch.
- The film player: one elegant player, captions in the voice's language, smooth on phones.
- Activities: goal, what you need, illustrated steps with very short captions, safety note, the full idea explained for the adult, the class note.
- Settings: language, auto-flip, captions, profiles, passes, delete account.
- Plans and access: trial of 3 stories for 3 days; passes per age group; a test checkout until your payment company is connected.
- Owner's area: add or edit a story in four languages, upload pictures and film, add an activity, set age groups and trial stories, publish, see sign-ups and passes.
- Emails in four languages, exact wording: confirm address, welcome, trial started, trial ends tomorrow, trial ended, receipt, pass started, pass ends in 7 days and in 1 day, pass ended, password reset, address changed, account deleted, contact reply, new story (only for those who opted in, marked as required by law).
*Check:* full walk-through as a parent and as a teacher on an iPhone-size screen in each language; automated tests; no dead ends; read-along and auto-flip proven with a test recording.

**Stage 5. Three pilot stories**, one per age group, complete: text in four languages, book, activity with instruction pictures, film with captions and sound effects (no voice yet). Placed on the preview link.
*Check:* each book read page by page in four languages; each film watched as contact sheets and at phone size; a fresh reviewer lists faults; I fix them.
*You:* judge the art. If it does not win you over, this is the moment to allow other tools, before 42 more are made. I also report the real cost per story here.

**Stage 6. Writing the other 42 stories** (Story room; the three pilot stories are written first, in Stage 5, to fix the format). For each story: the lesson and why it fits the age; the story plan; the text written naturally in each language rather than translated word for word; a separate book script and film script; vowel marks in two layers (light for the eye, full for the future voice); the activity. A separate reviewer per language, then a cross-check that all four say the same thing.
*Check:* length and vocabulary limits per age; no lesson and no activity goal used twice; vowel-mark rule applied; safety list passed.

**Stage 7. Production**, age group by age group, in batches of five stories: books, activity pictures, films. Films are flat drawings only, with no words inside the picture, so one picture serves all four languages. Every shot has quiet stretches (breathing, blinking, background life) that can lengthen or shorten to fit the voice later without redrawing.
*Check:* the same checks as the pilots for every story; a look-alike test so no two stories share a look.

**Stage 8. Landing page and onboarding polish.** Written with the marketing skills: what you get in each story shown by opening a real book; the values message; the animated impact graph (sample numbers until the papers arrive); plans; questions and answers; shorter than the old 15 screens.
*Check:* phone and desktop screens; speed score 90 or more; every claim true of the build.

**Stage 9. Ready to ship, except the recorded voice.** Testing in Safari's engine and Chrome; speed, accessibility and search-engine checks in four languages; security audit; share pictures, icons, site map, not-found page; legal drafts (terms, privacy, refunds and cancellation, accessibility statement, credits and licences); the ownership pack for the sale (what is transferred, every outside licence, the author's permission letter to sign); a launch checklist of what only you can do.
*Check:* a fresh reviewer attacks the whole site; all findings closed or listed as yours.

**Stage 10. Voice, then the public opening (on your word).** Paid ElevenLabs plan. A pronunciation test of one page per language first. One narrator per language, the characters' own voices for their lines, emotion by scene. Book recording and film recording made separately. Films are fitted to the voice and finished. The site opens to paying customers only after this stage; until then nobody sees a Listen button that does nothing.

**Stage 11. The game (later, after your notes).** Own plan. The characters are already built for it.

---

## 11. When I need you (four moments; I keep working meanwhile)
1. **Your cartoon reference**, before the style test in Stage 2.
2. **Choose the instruction-picture style** from three examples (Stage 3).
3. **Judge the three pilot stories** (Stage 5).
4. **Things only you can do or pay for.** None blocks the build; all are needed before real customers. The ones marked "start early" take weeks:
   - Yes or no to a new free Supabase project for StoryTime, in Europe. Your one existing project belongs to another product and sits in Korea; I will not touch it. Before opening to customers it needs the paid level, about 25 dollars a month.
   - A web address (about 10 to 15 dollars a year) and a free Cloudflare account.
   - A free email-sending account, for the confirmation emails.
   - Start early: the Israeli payment company, a registered business to sell under, and a way to issue legal receipts.
   - Start early: a native reader for each language. I write carefully and review twice, but a children's book deserves one human read per language.
   - A lawyer's read of the legal drafts.
   - The author's written permission for her story.
   - Prices. The research papers.
   - Optional and early: one month of the smallest ElevenLabs paid plan, so I can test Arabic and Hebrew pronunciation while the stories are being written. The ElevenLabs connection in this session currently refuses requests; I will recheck it then.
   - Later: the full ElevenLabs plan for Stage 10, and your game notes.

## 12. Honest risks
1. **Code-drawn art has a ceiling.** It will look like a well-made paper-cut or toy-style cartoon, not like the painted 3D of the big film studios. If your reference is that kind of film, I will tell you the same day what I can and cannot match.
2. **Films are the giant:** about 3.5 hours of animation. If the pilots show the cost is too high, the fallback is shorter films of 2 to 4 minutes for every age.
3. **Four languages** multiply every text. Danish and Hebrew children's writing is where a native reader matters most.
4. **Legal drafts are not legal advice.**
5. **Voice in Hebrew and Arabic** may mispronounce even with vowel marks; that is why a test comes first.

---

## 13. Technical appendix (for the build; you can skip this)
**Branches.** Work on `claude/friendly-hamilton-dsakt5`. Carry pieces from `origin/laptop/landing-v2` by copying files, not merging. Preview: publish the built site to a `/next/` folder on `gh-pages` (old preview left intact), `noindex`, labelled preview. GitHub Pages is for preview only; launch is on Cloudflare. Films beyond the pilots are not stored in git.

**Stack.** Vite, React 19, TypeScript, Tailwind 4, GSAP, three with React-Three-Fiber, zustand: the same tools as the old build, so the carried pieces move with least rework. React Router in framework mode with prerendered public pages, one URL per language (`/ar`, `/he`, `/en`, `/da`), `lang` and `dir` per page, reciprocal hreflang. Static output plus Supabase plus one small Cloudflare Worker; no server framework. Versions confirmed against official docs when scaffolding.

**Backend.** Supabase: auth (email confirmation, reset; the auth email hook sends through Resend so emails arrive in the user's language), Postgres with row-level security, edge functions for payment callbacks, emails and access checks. Tables: `profiles` (role parent, teacher, owner; language), `children`, `classes`, `age_groups`, `stories` (draft or published, version, sign-off per language), `story_texts` (per language; `display` and `speech` forms), `pages`, `films` (per language: video, captions), `activities`, `activity_steps`, `media` (source and licence of every file, for the ownership pack), `passes`, `orders`, `payments`, `refunds`, `provider_events` (each saved once so none counts twice), `trials` (one per account and device check), `consents` (terms version, marketing opt-in, time, source), `progress`, `email_log` (bounces, unsubscribes), `deletion_requests`, `audit_log`. Payment behind one adapter interface with a test provider.

**Protecting paid content.** The public site ships only the landing page. Story data (texts, page settings, activity steps) is fetched from Supabase and returned only to accounts with an active trial or pass; it is never bundled or prerendered. Book pictures and films sit in private storage (Supabase storage on the preview, Cloudflare R2 at launch); a Worker checks the login and pass and hands out short-lived links. Uploaded films use the same path.

**Content model.** Two picture sources per story: Studio output (ours) or uploaded images (future owner uploads). A story may list more than one age group.

**Art engine.** Generalise `kit/people.ts` into a `Build` table per character; keep `kit/core.ts` (`Painter`, `track`, easing, `hopArc`) and `kit/stage.ts` (`SceneDef`, captions, `smoothBends`). A scene is a pure function of time: a book picture is a scene at one moment, an instruction loop is a short cycle, a film is scenes on a timeline. The engine runs in the Studio, not in the visitor's browser: it exports sharp images (book), small looping clips (instruction steps) and video (films). Only the 3D hero is drawn live. 3D figures: procedural three.js geometry on a standard humanoid skeleton, toon shading with outlines, exported as GLB; gestures written once against the skeleton, reusing `Acting.tsx` techniques.

**Films.** Canvas 2D frames through headless Chromium, ffmpeg encode, rendered shot by shot and joined, so a retime re-renders only changed shots. Character motion at 12 drawings a second; camera at full rate. Mouth movement only in short close-ups. Timeline generated from line durations (`video/scripts/timeline.mjs` pattern): estimated from reading speed now, replaced by real voice timings in Stage 10; idle loops absorb the difference per language. Captions as WebVTT per language. Sound: code synthesis plus CC0 libraries with a credits file. Player: Vidstack, with the old player's iPhone full-screen handling.

**Reader.** Keep `curl/engine.ts` and `layout.ts`; rewrite `paint.ts` and `Reader.tsx` to take story data as input, remove store and paywall coupling. Text is DOM text at rest and painted into the page texture only during a turn. Quiet zones sized for the longest language, with a test that fails when text drops below its minimum size; layout flips for right-to-left, the art does not. Separate auto-flip switch persisted in settings; listen button also in the reduced-motion book.

**i18n.** Typed dictionaries per language and feature (the old `copy.ts` pattern, where the compiler rejects a missing key), loaded per language.

**Verification, end to end.** Type check and unit tests; Playwright walk-throughs at 390, 768 and 1440 px in Chromium and WebKit for all four languages; Lighthouse mobile 90+ (performance, accessibility, SEO); `impeccable detect`; security audit of the code and Supabase advisors; a test that a signed-out or expired account cannot fetch any paid text, picture or film; curl check that public pages carry real text, title, canonical and hreflang; film checks: contact sheets, no frozen or black stretches, loudness, caption reading time; text checks: length and vocabulary limits, vowel-mark rule, duplicate-lesson and duplicate-activity detector; a fresh-context reviewer before every report.
