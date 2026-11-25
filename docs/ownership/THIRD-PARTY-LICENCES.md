# Outside work inside StoryTime, and what each licence asks

**Draft for the lawyer. Not legal advice.** Written 25 Nov 2026 from the project's files. The full library list is
generated, not typed: `docs/ownership/LIBRARY-LIST.md`, made by `node docs/ownership/make-licence-list.mjs` from
`package-lock.json`. Run it again after any library changes.

**In three lines:** the site uses 229 outside code libraries to run and 144 more only to build and test it. All but
two of the running ones are under plain permissive licences that allow commercial use and resale and ask only that
the copyright notice be kept. The two exceptions are **GSAP** and its React helper (animation; their own "no
charge" licence, not open source, to be read by the lawyer). No fonts, pictures, music or sound from outside are in the product: all art and
sound is made in code.

---

## 1. Code libraries (from the lockfile)

### 1.1 Totals

| | Production (the site needs it to run) | Development only (build and test tools) |
|---|---|---|
| Libraries | **229** | **144** |
| Permissive licences (MIT, ISC, BSD, Apache-2.0, BlueOak, 0BSD, Unlicense, CC0) | 227 | 142 |
| **Flagged** | **2: GSAP and @gsap/react** (GSAP Standard "no charge" licence) | **2: lightningcss (MPL-2.0) and caniuse-lite (CC BY 4.0)** |

"Production" in the lockfile also counts tools that run on our side and never reach a visitor, for example the
email preview tool inside `react-email` (with its own esbuild, babel and prettier). Those are still listed, to be safe.

### 1.2 Grouped by licence, with what each asks

| Licence | Production | Dev | Commercial use and resale? | What it asks of StoryTime |
|---|---|---|---|---|
| MIT | 191 | 95 | Yes | Keep the copyright notice and licence text "in all copies or substantial portions". The site's code bundle contains these libraries in compressed form, so a notices file shipped with the site (or a link to it from the credits page) is the safe way to comply. |
| Apache-2.0 | 6 | 27 | Yes | Keep the licence and copyright notices; pass on any NOTICE file the library has; say if we changed its files. Gives a patent licence. |
| BSD-2-Clause, BSD-3-Clause | 11 | 0 | Yes | Keep the copyright notice. BSD-3 also forbids using the authors' names to promote StoryTime. (`ce-la-react`, used by the film player, is BSD-3.) |
| ISC | 5 | 6 | Yes | Same as MIT. |
| BlueOak-1.0.0 | 6 | 1 | Yes | Keep the licence text or a link to it. |
| 0BSD, Unlicense, CC0-1.0, (MIT or CC0) | 8 | 2 | Yes | Nothing. |
| **GSAP Standard "no charge" licence** | **2** (`gsap` 3.15.1, `@gsap/react` 2.1.2) | 0 | **Q (lawyer)** | Not an open-source licence. The library only points to https://gsap.com/standard-license; the text is **not in the project** and was not read for this pack. Ask the lawyer to read it and confirm: commercial use, use by a site that is sold, and any kind of product it excludes. GSAP drives the landing-page animation, so if the answer is no it can be replaced, at a cost in build time. |
| **MPL-2.0** | 0 | **12** (`lightningcss` 1.33.0 and its one-per-computer-type copies) | Yes | A file-level "share-alike": only if we **changed and handed out** lightningcss's own files would we have to publish those changes. We use it unchanged as a build tool, and it is not sent to visitors. Nothing to do. |
| **CC BY 4.0** | 0 | **1** (`caniuse-lite`, browser-support data) | Yes | Credit when the data itself is shared. It is used only while building and is not in the site. Nothing to do. |

No library is under a "copyleft" licence that would force StoryTime's own code to be published (no GPL, LGPL or
AGPL in the lockfile), and none carries a non-commercial limit.

Libraries we chose directly (`package.json`), all pinned to an exact version: `@gsap/react`, `@react-email/render`,
`@react-router/node`, `@react-three/drei`, `@react-three/fiber`, `@supabase/supabase-js`, `gsap`, `isbot`,
`media-chrome`, `react`, `react-dom`, `react-email`, `react-router`, `three`, `zustand`; and for building and testing
`@electric-sql/pglite`, `@playwright/test`, `@react-router/dev`, `@tailwindcss/vite`, `@types/*`, `tailwindcss`,
`typescript`, `vite`, `vitest`. Each added library was read for hidden network calls, commands and secret reading
before it was installed (`docs/SKILLS.md`, "Packages added").

One library has no licence in the lockfile: `webgl-constants` 1.1.1 (brought in by the 3D library). Its own
`LICENSE` file, read by hand, is MIT.

### 1.3 To do before launch (suggestion, not done)

- Ship a **third-party notices file** with the site (the MIT, BSD, ISC, BlueOak and Apache texts with each library's
  copyright line) and link it from the credits page. The credits page draft already plans "code packages and their
  licences" (`docs/LEGAL-CHECKLIST.md`, Credits and licences).
- Get the lawyer's answer on GSAP.

---

## 2. Fonts

**None.** No font file is in the project; the site uses each device's own fonts (`src/app.css`; `docs/HANDOFF.md`
Stage 0: "No fonts are bundled"). Brand fonts are a later decision. When they come: check that the licence allows
web embedding, commercial use and a sale of the site (for example the SIL Open Font Licence, which also asks that the
font is not sold on its own), and add them here and to the credits page.

---

## 3. Pictures, films, music, sound and voices

| What | Source | Licence | What it asks |
|---|---|---|---|
| Book pictures, films, characters, 3D figures, activity pictures | Drawn and animated in code by the project's own studio (project rule 1) | Ours (see `WHAT-IS-TRANSFERRED.md` Q1 on AI-made work) | Nothing |
| Film music | Made in code, "no samples, no downloads" (`studio/scripts/music.mjs`) | Ours | Nothing |
| Sound effects | Made in code, "no audio files, no downloads" (`src/audio/sfx.ts`) | Ours | Nothing |
| Test audio in the samples | Ticks and silence made by our script, "NOT a voice" (`src/content/make-samples.mjs`) | Ours | Nothing |
| Recorded voices | Not made yet; planned on a paid ElevenLabs plan (stage 10) | The plan's terms | **Q (lawyer):** check commercial use and transfer to a buyer before recording. The old free-plan narration is not allowed for commercial use and stays out (project plan, section 6). |
| Lemo-Opuscar film-style library | Tried on 25 Nov 2026 for film looks; **not installed** in the project | Code MIT; its guides CC BY-NC 4.0 with a permission to follow them for commercial films; its demo films CC BY 4.0 | "Films you make with the library are yours, commercial films included, and need no credit" (its licence, quoted in `docs/SKILLS.md`). Its guides must not be shipped inside the product. Its demo stills in `docs/previews/lemo/` need the credit line "Lemo-Opuscar by Lemomo (LemoLab), CC BY 4.0" if ever shown. If a later film uses its sampled instruments, some need a credit line (for example a piano under CC BY 3.0). None used so far. |
| Owner's reference cartoon | Another creator's video, frames kept in `docs/film/ref/` and `docs/previews/reference/` | Not licensed to us | Look only; never in the product; remove before the repository is handed over. |
| A plan to use AI picture and video tools (Higgsfield) | `docs/film/STYLE-BIBLE.md`, paperwork only | — | Blocked by project rule 1 until the owner changes it in writing; if ever used, that service's terms for commercial use and transfer apply. |

---

## 4. Tools used to make the content (not part of the product)

| Tool | Used for | Licence or terms | Effect on StoryTime |
|---|---|---|---|
| Claude models (AI sessions) | Writing the stories, the four languages, the code, the emails, the legal drafts | The AI provider's terms of use | **Q (lawyer):** ownership of output (see `WHAT-IS-TRANSFERRED.md` Q1). |
| Community skills in `.claude/skills/` (28 folders) | **Advice only** for the AI sessions: writing, design, email, database, legal-page and ease-of-use guidance | MIT (most) or Apache-2.0 (`frontend-design`, the Cloudflare skills); `email-best-practices` declares MIT only in its own header; full table in `docs/SKILLS.md` | **Not part of the product** and nothing from them runs in the site. If the repository is handed over with this folder, MIT and Apache ask that each copy keeps its licence notice; only `frontend-design` carries its `LICENSE.txt` in the folder today. Simplest: remove `.claude/skills/` from the copy given to the buyer. Remotion's skill was read only (its repository has no licence); HyperFrames and the ElevenLabs skills were rejected and never installed. |
| Node.js, Vite, TypeScript and the build tools | Building the site | Listed in `LIBRARY-LIST.md` (development) | None beyond section 1. |
| Headless Chromium (through Playwright) | Rendering pictures and films, browser tests | Playwright: Apache-2.0 (lockfile) | Output is ours. |
| ffmpeg | Encoding films and test audio | Installed on the build computer, not in the project | Output is ours. The tool's own licence matters only if we handed out ffmpeg itself, which we do not. |
| `storytool.py` | Checking and building the Arabic and Hebrew text layers | Ours (`docs/story-room/pilots/tools/`) | None. |
| Vowel-mark tools (CATT, Sadeed, Mishkal for Arabic; Dicta Nakdan, Phonikud, UNIKUD for Hebrew) | Named in the style guides as "second opinion only" | Some research-only or non-commercial (style guides §2.4 and §2.3) | Nothing in the files read says one was run on the stories; the Hebrew voice layer follows Phonikud's **marking convention** (a published method), not its software or data. **Before any of them is used on paid text, check its licence.** |

---

## 5. Services (accounts to be created)

Supabase, Cloudflare, Resend, a payment company and ElevenLabs are services, not licences inside the product. Their
terms decide whether an account can be transferred to a buyer. See `SALE-CHECKLIST.md`.

---

## 6. Questions for the lawyer

1. Read GSAP's standard licence: may a site that is sold keep using it?
2. Is a notices file linked from the credits page enough to meet the MIT, BSD, ISC and Apache conditions for code
   sent to visitors' browsers?
3. The voice service's terms (commercial use, transfer of recordings to a buyer) before stage 10.
4. Ownership of AI-made output (shared with `WHAT-IS-TRANSFERRED.md` Q1).
