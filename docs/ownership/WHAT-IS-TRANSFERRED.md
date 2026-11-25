# What is transferred when StoryTime is sold

**Draft for the lawyer. Not legal advice.** Written 25 Nov 2026 from the project's own files (listed at the end).
Anything not settled by those files is marked **Q (lawyer)** and gathered in the last section.

**In three lines:** StoryTime is a four-language story website for children aged 2 to 8. Almost all of it (the 45
stories, the code, the database design, the emails and the legal drafts) was made for the owner by AI writing and
coding sessions that he directed; one story belongs to its human author and is used only with her permission. The
buyer should receive a written assignment of everything the owner holds, a separate permission from the author for
her story, and the accounts once they exist; several items must be cleaned out of the code repository first.

**Words used here.** *Owner* = Moaad Swaed, who commissioned and directed the work. *Buyer* = the educator who buys
the site. *Author* = the human author of the first story. *AI sessions* = the Claude model sessions that wrote the
text and code under the owner's direction (project plan, section 7).

---

## 1. The inventory

Each row: what it is, where it lives in the project, who made it, who owns it today, what the buyer receives, and
what must be signed.

### 1.1 Content

| # | Item | Where | Who made it | Who owns it today | What the buyer receives | What must be signed |
|---|---|---|---|---|---|---|
| C1 | **45 StoryTime stories**, 15 per age group (2 to 3, 4 to 5, 6 to 8). Each has a book text (562 pages in all), a film script (891 spoken lines in all, plus a shot list), an activity (goal, materials, steps, safety line, note for the adult, class version) and character sheets. | `content/stories/a01` … `c15` | AI sessions under the owner's direction: a writer per batch and a separate reviewer per language (`docs/story-room/`) | The owner, as far as anyone does. **Q1 (lawyer):** whether text written by an AI model is protected by copyright in Israel, and what the AI provider's terms say about who owns the output. | All four languages of all 45 stories, the source files they are built from (`docs/story-room/pilots/src/`) and the build tool | Assignment from the owner to the buyer (section 3). |
| C2 | **The same 45 stories in four languages** (Arabic, Hebrew, English, Danish). Each language was written from a shared outline, not translated word for word. Arabic and Hebrew each have two layers of vowel marks (one for the screen, one for the future voice). | same folders, `ar.json`, `he.json`, `en.json`, `da.json` | AI sessions | The owner (same Q1) | All four language versions | Same assignment. **Native editors not yet hired:** when they are, their corrections need a written assignment to the owner (or the buyer) too (Q2). |
| C3 | **Pictures and films of the 45 stories** | not made yet | to be drawn and animated in code (project rule 1) | nobody yet | Whatever exists on the day of sale | Same assignment; the contract should say what "the films" means if they are not finished (Q3). |
| C4 | **Three short sample stories** (marked "Sample", made for testing, with test pictures and test audio that is ticks and silence, not a voice) | `content/stories/sample-a`, `-b`, `-c` | AI sessions | The owner | Included | Same assignment |
| C5 | **The author's story** «أوراق الخريف والطيور المهاجرة» (Autumn Leaves and the Migrating Birds): her Arabic text, carried over word for word | `content/author/autumn-story.ts` | **The author** | **The author.** StoryTime has no written permission yet (`docs/LEGAL-CHECKLIST.md` B; project rule 3). | **Nothing can be passed on by the owner.** The buyer needs her own permission from the author, or the owner's permission must say it can be passed to a buyer. | The author's permission letter (`AUTHOR-PERMISSION-LETTER.md`), signed **before** her story is published, voiced, marked, translated or drawn. |
| C6 | **Our English draft translation of her story, and our chapter titles, summary and captions for it** | same file (the `en` column and the "our own" fields) | AI sessions | A translation of her work cannot be used without her permission (Q4). | Only with her permission | Covered by the author's letter (translation clause). |
| C7 | **Character sheets and the cast** (13 people for books and films, a fixed cast for activity pictures, six figures for the 3D welcome scene) | `src/cast/`, `content/stories/*/cast.json`, `src/hero3d/` | AI sessions, drawn in code | The owner | Included, with the code that draws them | Same assignment |
| C8 | **Activity instruction pictures** (style tests) and **film style tests** | `studio/out/`, `docs/previews/` | AI sessions, drawn in code | The owner, **except** the items in 1.4 | Included | Same assignment |
| C9 | **Music and sound effects** | `studio/scripts/music.mjs`, `src/audio/` | Made in code: no samples, no downloads (file headers say so) | The owner | Included | Same assignment |
| C10 | **Recorded voices** | not recorded yet (stage 10, paid voice service) | — | — | Whatever exists on the day of sale | When voices are made: the voice service's terms for commercial use, and, if human voice actors are used, their written assignment and consent (Q5). |
| C11 | **Landing page words, site words in four languages** (menus, buttons, account pages, owner's area) | `src/i18n/<lang>/` | AI sessions | The owner | Included | Same assignment |
| C12 | **19 emails in four languages** (confirm address, welcome, trial, receipt, pass reminders, password reset and others) | `src/emails/copy/` | AI sessions | The owner | Included | Same assignment |
| C13 | **Legal page drafts** (terms, privacy, refunds and cancellation, accessibility, credits, cookies), four languages, all marked "draft, not reviewed by a lawyer" | `src/i18n/<lang>/legal.ts`, `docs/legal/` | AI sessions | The owner | Included **as drafts only** | Same assignment. The lawyer's final wording: whose is it, and may the buyer keep using it (Q6)? |
| C14 | **Research, plans and working notes** (age-group briefs, style guides, 45 outlines, reviews, legal research) | `docs/` | AI sessions | The owner | Included | Same assignment |
| C15 | **The name "StoryTime" and its look** | across the site | — | Not registered as a trade mark (nothing in the project says it is) | The right to use the name, as far as the owner has it | **Q7 (lawyer):** is the name free to use and to register in Israel; should the owner register it before the sale, or the buyer after? |

### 1.2 Code and data design

| # | Item | Where | Who made it | Who owns it today | What the buyer receives | What must be signed |
|---|---|---|---|---|---|---|
| K1 | **The website code** (public pages, sign-up, library, book reader with page curl, film player, activities, settings, owner's area) | `src/`, `scripts/`, config files | AI sessions under the owner's direction; some pieces carried over from the owner's earlier build (`docs/CARRY-OVER.md`) | The owner (Q1 applies to code too) | Full source code and the right to change it | Same assignment |
| K2 | **The drawing and film studio** (the art engine that draws books, films and pictures in code) | `src/studio/`, `studio/` | AI sessions | The owner | Included | Same assignment |
| K3 | **The database design**: 28 tables with access rules (accounts, children's profiles, stories, passes, orders, payments, refunds, consents, email log, deletion requests, audit log and others) | `supabase/migrations/` | AI sessions | The owner | The design (the empty structure). **No customer data exists yet**: there are no real customers. | Same assignment |
| K4 | **Server functions** (payment callback, email sending, reminders, unsubscribe, email events) | `supabase/functions/` | AI sessions | The owner | Included | Same assignment |
| K5 | **Tests** (unit and browser tests) | `tests/`, `e2e/`, `studio/tests/` | AI sessions | The owner | Included | Same assignment |
| K6 | **Outside code libraries** (229 production, 144 development) | `package.json`, `package-lock.json` | Their own authors | Their own authors, under licences | **A licence, not ownership.** Each licence passes to whoever uses the code. | Nothing to sign, but the licence conditions must be kept (`THIRD-PARTY-LICENCES.md`). GSAP's own licence must be read (Q8). |

### 1.3 Accounts, domain and services

None of these exists for StoryTime yet, except the code repository and the hidden test link
(`docs/LEGAL-CHECKLIST.md` C; `docs/HANDOFF.md`, Preview).

| # | Item | State today | What the buyer receives | What must be done |
|---|---|---|---|---|
| A1 | **Code repository** on GitHub (`moaadswaed48-ship-it/StoryTime`) | Exists, under the owner's personal GitHub account. Holds **10 branches**, including the old build and its AI-made pictures (see 1.4). | A clean copy or a transfer of the repository | See `SALE-CHECKLIST.md` step 3. |
| A2 | **Hidden test link** on GitHub Pages (`/StoryTime/next/`) | Exists, hidden from search, test mode only | Nothing: it is replaced by the real site | Take it down after the sale. |
| A3 | **Domain** (web address) | Not bought | The domain, moved to the buyer's registrar account | Buy in a name that can be transferred (Q9). |
| A4 | **Supabase** (database, sign-in, storage) | Not created. The owner's existing Supabase project belongs to another product and must never be touched (project rule 9). | The project, moved to the buyer's Supabase organisation | Create it in the EU region; transfer the organisation or the project. |
| A5 | **Cloudflare** (hosting, private film storage) | Not created | The account or the site moved to the buyer's account | Create; transfer. |
| A6 | **Resend** (sending emails) and the sending address | Not created | The account and the verified domain | Create; transfer; the buyer re-verifies the domain. |
| A7 | **Payment company** (Cardcom, Tranzila or Grow were compared) and receipts | Not chosen | **Cannot be transferred**: a payment terminal belongs to a registered business. The buyer opens her own. | Section 4 of the sale checklist. |
| A8 | **Voice service** (ElevenLabs, paid plan) | Not bought | The voice files made; the commercial licence depends on the plan that made them (Q5) | Check the plan's terms before stage 10. |
| A9 | **Business registration** (exempt or licensed dealer) | Not done | Nothing: the buyer sells under her own business | Her accountant decides. |

### 1.4 Things that must NOT pass to the buyer (or must be removed first)

| # | What | Where | Why |
|---|---|---|---|
| X1 | The old build: the AI-made 3D model of Sari, paintings, hero picture, film clips | branch `laptop/landing-v2` and older branches in the same repository | Made by AI image and video tools with no licence on record (project plan, section 3 and 6). Never part of the new site. |
| X2 | Old narration recorded on the free ElevenLabs plan | old branch | The free plan does not allow commercial use (project plan, section 6). |
| X3 | The owner's reference cartoon (frames from another creator's video) | `docs/film/ref/`, `docs/previews/reference/` | Belongs to another creator; kept only "for our eyes" (`docs/film/STYLE-BIBLE.md`). |
| X4 | Demo stills of the Lemo-Opuscar film library | `docs/previews/lemo/` | CC BY 4.0 (credit needed if shown); trial material, not our work. Keep only with the credit line, or remove. |
| X5 | Community "skills" (advice files for the AI sessions) | `.claude/skills/` | Not part of the product; other people's work under MIT or Apache-2.0. Remove, or keep with their licence notices (`THIRD-PARTY-LICENCES.md` section 4). |
| X6 | Any secret key | never stored in the project (none found in the files read) | Keys are handed over separately and then replaced (sale checklist step 2). |
| X7 | The owner's other Supabase project | outside StoryTime | Belongs to another product (project rule 9). |

---

## 2. Who made what, in one paragraph

The owner decided the product, the plan and every choice that the plan records (`docs/MASTER-PLAN.md`), and
directed AI sessions that wrote the stories, the four languages, the code, the database design, the emails and the
legal drafts. Of the 64 saved changes in the repository, 63 were saved by the AI sessions and one by the owner.
No human writer, translator, illustrator, voice actor or developer has worked on the new build yet; when native
editors, a lawyer, voice actors or a designer join, each needs a written agreement that gives their work to the
owner (or straight to the buyer) **before** they start (`docs/LEGAL-CHECKLIST.md` item 37).

---

## 3. What the owner signs at the sale (wording to ask the lawyer for)

1. **Assignment of rights** from the owner to the buyer for every item in 1.1 and 1.2 that the owner holds (C1 to
   C4, C6 only with the author's consent, C7 to C9, C11 to C15, K1 to K5), in writing, because Israeli law requires
   a written document to assign copyright or grant an exclusive licence (`docs/research/israel-law-raw.md` section 7;
   the section number is **not verified**, Q10).
2. **A promise about what is not included or not certain:** the author's story (hers), outside libraries (their
   licences), AI-made output (Q1), anything still unfinished on the day (C3, C10).
3. **The author's consent to pass on her permission**, if her letter allows it, or a new letter from her to the buyer.
4. **The handover of accounts** in section 1.3 and the list of keys, in the sale checklist.

---

## 4. Questions for the lawyer (gathered)

- **Q1.** Is text, code and art made by an AI model under a person's direction protected by copyright in Israel?
  Who is its author: the person who directed it, nobody, or someone else? What do the AI provider's terms say about
  ownership of output, and does that matter to a buyer?
- **Q2.** What should the native editors' agreement say so that their corrections belong to the owner or the buyer?
- **Q3.** How should the contract describe content that is planned but unfinished (pictures, films, voices)?
- **Q4.** May the owner keep or use the English draft translation of the author's story before she signs? (The
  project's rule is not to use it until she agrees.)
- **Q5.** What must the voice service's plan and any human voice actor's agreement say for the recordings to be sold
  with the site?
- **Q6.** Who owns the lawyer's final legal texts, and may the buyer go on using them after the sale?
- **Q7.** Is "StoryTime" free to use and register as a trade mark in Israel (and later in Denmark)?
- **Q8.** Does GSAP's "no charge" licence allow this use and allow the site to be sold with it?
- **Q9.** In whose name should the domain and the accounts be opened so that they can be transferred cleanly?
- **Q10.** The exact sections of the Copyright Law, 2007, on written assignment, works made in employment and
  commissioned works, and the moral rights (credit, integrity) that stay with the author after a sale.
- **Q11.** If the buyer is also connected to the author (for example, family), can the author's permission and the
  sale be signed together, or must they stay separate?
- **Q12.** Does the sale of a site that holds customer accounts need the customers' consent or notice
  (`docs/research/israel-law-raw.md` section 7 says privacy law applies to handing over the customer database)?

---

**Sources read:** `CLAUDE.md`; `docs/MASTER-PLAN.md`; `docs/HANDOFF.md`; `docs/LEGAL-CHECKLIST.md`;
`docs/legal/LAWYER-PACK.md`; `docs/research/israel-law-raw.md` section 7; `docs/SKILLS.md`; `docs/CARRY-OVER.md`
(by reference); `docs/film/STYLE-BIBLE.md`; `docs/previews/lemo/README.md`; `content/SCHEMA.md`;
`content/author/autumn-story.ts` (header); `package.json`; `package-lock.json`; `supabase/migrations/`; `git log`.
