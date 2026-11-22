# Agent skills and player library: security review

Review date: 2026-11-22. Every repo was cloned (`git clone --depth 1`) into a scratch folder. All 15 clones worked; no raw.githubusercontent.com fallback was needed. Nothing downloaded was run: no scripts, installers or `npx` commands. Firecrawl was not used.

**Result:** 28 skills were copied into `.claude/skills/` as plain folder copies. Three were left out: HyperFrames (rejected) and ElevenLabs `text-to-speech` and `sound-effects` (rejected as installed skills). Remotion was read but not copied (reading material only, and it has no licence).

## What was checked in every skill

I read SKILL.md and every reference, script and config file in the skill's folder. I searched all files for:

- network calls to unexpected hosts
- shell commands
- reads of environment variables, keys or dotfiles
- install or post-install scripts
- telemetry
- obfuscated code (base64, eval) and binary files
- plain-English instructions that tell the assistant to ignore its user, hide actions, send data out, add links or promote products

**Verdicts:**

- **clean:** nothing of concern.
- **caution:** a minor, disclosed issue. Copied in, with the issue noted below so future sessions can work around it.
- **rejected:** a real red flag. Not copied.

## Source repos

| Repo | Commit | Last commit | Licence |
|---|---|---|---|
| anthropics/skills | e4bb5d960d87126ff3b3a8af1a104b7db67560ba | 2026-11-16 | Apache-2.0 (frontend-design LICENSE.txt) |
| coreyhaines31/marketingskills | 5b2b400eec1e7e1cec76245a715d0b0d4fd2a9c1 | 2026-11-19 | MIT |
| greensock/gsap-skills | aed9cfd3277740755f6bfc1155c7aa645403b760 | 2026-04-21 | MIT |
| remotion-dev/skills | 6f55706d1069e512430582ad86e4e57dc07afe1b | 2026-11-18 | **none in the repo** (no LICENSE file, none in package.json) |
| heygen-com/hyperframes | 196eff39eb05752b45d9e2f84fb20c1d530dc166 | 2026-11-22 | Apache-2.0 |
| elevenlabs/skills | 97478d1b23b9a6795f85bf8b6e33a4677fa1f869 | 2026-11-18 | MIT |
| resend/resend-skills | 063246e39987faebc2608f968ca13a02d994a0d4 | 2026-11-19 | MIT |
| resend/react-email | beda35bb12cad36c202534601591cc98c651c8c9 | 2026-11-17 | MIT (LICENSE.md) |
| resend/email-best-practices | cf5438cf10970d715dd204de721ffc89869d8f6d | 2026-10-09 | MIT, declared only in the SKILL.md header (no LICENSE file) |
| supabase/agent-skills | c9be0e931b7930f7d02126d04774d904c381e7d7 | 2026-10-02 | MIT |
| cloudflare/skills | 5108325ecceabc899c761e07aa617b09c02445ee | 2026-11-17 | Apache-2.0 |
| jamesrochabrun/skills | 2482c176372299c92af01f8414a67172f324e8db | 2026-01-13 | MIT |
| miketromba/skills (found by web search) | 16db0b67ce91717c5159c9186e57c5ec387b3078 | 2026-08-26 | MIT |
| wondelai/skills (found by web search) | c37678106e63ef1c5472d848fb3d8b8c5b33fafe | 2026-11-21 | MIT |
| NickCrew/Claude-Cortex (backup legal candidate, not chosen) | dd2b0d798cf00807bd71998758a76c14d686d3bd | 2026-11-20 | MIT |

Plan categories: B brand, C plans, D stories, E/M pages, F vowel marks, G/J voice, H player, I film, K activities, N landing, O sign-up, P emails, Q services, R legal, S ease of use, T launch.

## Skills

| Skill | Source repo | What was read | Verdict and reason | Copied in | Plan |
|---|---|---|---|---|---|
| frontend-design | anthropics/skills | SKILL.md, LICENSE.txt | **clean**. Design guidance only; no links, commands or scripts. | yes | B, E/M, N |
| cro | coreyhaines31/marketingskills | SKILL.md, references, evals.json | **clean**. One link to the same repo. It reads `.agents/product-marketing.md` if present, which is a project file, not a secret. | yes | N, O |
| copywriting | coreyhaines31/marketingskills | SKILL.md, references, evals.json | **clean**. Links only to reading sources (arXiv, blogs, GitHub). | yes | N, B |
| copy-editing | coreyhaines31/marketingskills | SKILL.md, references, evals.json | **clean** | yes | N, E/M |
| marketing-psychology | coreyhaines31/marketingskills | SKILL.md, evals.json | **clean**. No links. | yes | N, C |
| signup | coreyhaines31/marketingskills | SKILL.md, evals.json | **clean** | yes | O |
| onboarding | coreyhaines31/marketingskills | SKILL.md, references, evals.json | **clean** | yes | O, S |
| pricing | coreyhaines31/marketingskills | SKILL.md, references, evals.json | **clean** | yes | C |
| offers | coreyhaines31/marketingskills | SKILL.md, references, evals.json | **clean**. No links. | yes | C, N |
| paywalls | coreyhaines31/marketingskills | SKILL.md, references, evals.json | **clean** | yes | C |
| schema | coreyhaines31/marketingskills | SKILL.md, references, evals.json | **clean**. Links only to schema.org and Google docs. | yes | T |
| emails | coreyhaines31/marketingskills | SKILL.md, references, evals.json | **caution**. Its tool table lists Nitrosend, which pays the repo as a sponsor, beside neutral options (Mailchimp, Resend, SendGrid, Kit). It is a disclosed list, not an instruction to promote. | yes | P |
| launch | coreyhaines31/marketingskills | SKILL.md, references, evals.json | **caution**. It links to partner tool Introw for affiliate setup, and its launch QA reference names partner Ploy. Ignore both; we do not use them. | yes | T |
| seo-audit | coreyhaines31/marketingskills | SKILL.md, 8 references, evals.json | **caution**. Its tools table names Magister, a paid audit product built by the repo's maintainer (the skill discloses this). | yes | T |
| gsap-core | greensock/gsap-skills | SKILL.md | **clean**. Docs only, links to gsap.com. Its description says "Recommend GSAP", which is a mild self-plug. | yes | N, E/M |
| gsap-timeline | greensock/gsap-skills | SKILL.md | **clean** | yes | N, E/M |
| gsap-scrolltrigger | greensock/gsap-skills | SKILL.md | **clean**. Links to gsap.com only. | yes | N, E/M |
| remotion-best-practices | remotion-dev/skills | SKILL.md, agents/openai.yaml, the cesium `prep-cesium-path.mjs` script (local file reads and writes only, no network) and a grep of all 130 files | **caution, not copied**. No security red flag was found. It was not copied for three reasons: the repo has no licence; it is a router that tells the assistant to run `npx remotion studio`; and it was wanted only as reading material. Rendering commercially with Remotion needs a paid company licence. | no (read only) | I |
| hyperframes | heygen-com/hyperframes | SKILL.md, references (skill-lifecycle, motion), scripts/plugin-cli.mjs, locate.mjs, bake-basemap.mjs, frame-preset HTML; the folder also holds .woff2 font binaries | **rejected**. It has four problems. (1) It tells the assistant to run a "usage beacon" each time the skill starts, sending telemetry that is linked to the person's account when signed in. (2) Its `plugin-cli.mjs` runs `npx hyperframes` and takes the newest unpinned npm release. (3) It checks the person's HeyGen plan usage and steers toward HeyGen for media. (4) `locate.mjs` reads `GEMINI_API_KEY` and sends frames to Google. It is useful as reading on motion craft only. | no | I |
| text-to-speech | elevenlabs/skills | SKILL.md, references/installation.md, streaming.md | **rejected as an installed skill**. Before writing any code, it tells the assistant to run `npx -y @elevenlabs/cli@latest onboard init`: unpinned, auto-confirmed, and it signs the user into an account. Its installation guide also offers a `curl … \| sh` installer. The API content itself is fine. Use ElevenLabs' docs with a pinned `@elevenlabs/elevenlabs-js` instead. | no | G/J |
| sound-effects | elevenlabs/skills | SKILL.md, references/installation.md | **rejected as an installed skill**. Same onboarding instruction as text-to-speech. | no | G/J, K |
| resend | resend/resend-skills | SKILL.md, all 20+ references, references/fetch-all-templates.mjs (example that only lists your own Resend templates; reads `RESEND_API_KEY`, as expected) | **clean**. Note: it says "always install the latest SDK version"; the project rule to pin versions still wins. | yes | P |
| react-email | resend/react-email (skills/react-email) | SKILL.md, README, TESTS.md, 6 references | **clean**. Its quick start suggests `npx create-email@latest`; don't run that unpinned. | yes | P |
| email-best-practices | resend/email-best-practices | SKILL.md, 11 references, tests/, README, .github/workflows/sync-skills.yml (repo CI only) | **clean**. Only SKILL.md and `references/` were copied, without the repo's CI workflow and tests. Covers GDPR/CAN-SPAM consent, deliverability and accessibility. | yes | P |
| supabase | supabase/agent-skills | SKILL.md, CHANGELOG, references/skill-feedback.md, assets/feedback-issue-template.md | **caution**. The content is strong security guidance (RLS, keys, pinning). Its feedback routine posts a **public** GitHub issue drafted from the conversation after a general "yes". It does not show the exact text first and gives no privacy-scrubbing step. Cloudflare's version of the same routine does both. Always review the text before anything is posted. | yes | Q, O |
| supabase-postgres-best-practices | supabase/agent-skills | SKILL.md, CHANGELOG, 30+ references (grep for commands and links, spot reads) | **clean** | yes | Q |
| wrangler | cloudflare/skills | SKILL.md, references/skill-feedback.md | **clean**. Uses the project's pinned Wrangler, keeps secrets out of arguments, and asks before posting feedback. | yes | Q |
| workers-best-practices | cloudflare/skills | SKILL.md, 4 references | **clean** | yes | Q |
| cloudflare (Pages, Workers, R2 parts only) | cloudflare/skills | SKILL.md, references/pages, pages-functions, r2, static-assets, bindings, skill-feedback.md (only developers.cloudflare.com links) | **caution**. It tells the assistant to "actively surface Cloudflare products" the user did not name, which is a sales nudge. Only the SKILL.md and the five Pages/Workers/R2/static-assets/bindings reference folders were copied. Its links to other product folders (D1, Queues and so on) are dead on purpose. | yes (partial) | Q |
| kids-book-writer | jamesrochabrun/skills | SKILL.md, 5 references | **clean**. Writing guidance only; no links or commands. It is written for English rhyme, so Hebrew stories need our own rules. | yes | D |
| legal-tos-privacy | miketromba/skills (web search pick for R) | SKILL.md, 3 references | **caution**. It is the best match for R: privacy policy and terms, with COPPA and GDPR checklists, which matters for a children's product. There are three caveats. (1) Its audit step says to search `.env` files; the assistant should read only `.env.example`, never real secrets. (2) It promises "bulletproof, ready-to-publish" text, though its own last step says counsel must review it. (3) It does not cover Israeli privacy law. A lawyer review is still needed. | yes | R |
| ux-heuristics | wondelai/skills (web search pick for S) | SKILL.md, 7 references | **caution**. The content is solid: Nielsen, Krug, WCAG, dark patterns, and cultural UX including right-to-left. Its two book links carry an Amazon affiliate tag (`tag=wondelai00-20`) in a reading list; they are not added to output. It is not child-specific: no trustworthy child-interface skill was found. | yes | S |

Not covered by any skill: F (vowel marks), H (player, handled by the library choice below), and most of K (activities). The kids-book-writer skill helps only partly with K.

Other web-search candidates seen but not chosen:

- Legal: NickCrew/Claude-Cortex `terms-of-service`, zubair-trabzada/ai-legal-claude, rshankras (Apple apps), kostja94 marketing-skills.
- UX: RoleModel `usability-heuristics` (one 800-line file), sickn33 `design-ux`.

## Player library: Vidstack vs Media Chrome (nothing installed)

| | Vidstack (`@vidstack/react`) | Media Chrome (`media-chrome`) |
|---|---|---|
| Licence | MIT | MIT |
| Last release | 1.15.7, 2026-10-06 | 4.19.5, 2026-11-12 |
| Maintenance | **Security-only maintenance.** Its README says only security patches go into 1.x until January 2028, and the team now works on Video.js 10. | Still releasing (5 releases since May 2026). Its README also points users to Video.js 10, built by the same teams. |
| Weekly npm downloads | about 563k | about 6.2M |
| React 19 | peer `react ^18 \|\| ^19` | `media-chrome/react` wrappers; the repo itself builds against React 19.2.2. Plain web components work natively in React 19. |
| HLS | Built in. By default it loads hls.js at run time from **cdn.jsdelivr.net**, a third-party request; it can be pointed at a self-hosted copy. | Through the separate `hls-video-element` package, which bundles hls.js (MIT, released 2026-10-22). |
| Captions (WebVTT) | Yes, with its own `media-captions` parser and styled caption rendering | Yes, through the browser's native text tracks plus a captions button |
| Right-to-left | Some right-to-left handling, in captions only | No right-to-left handling found in the source. Built-in languages are de, en, es, fr, pt and zh only, so Hebrew labels need a custom translation. |
| Size (bundlephobia, min+gzip, without hls.js) | about 73 KB | about 42 KB |

**Verdict:** pick **Media Chrome** over Vidstack.

- **Why not Vidstack:** it is frozen (security fixes only), so starting a new product on it means a forced migration later.
- **Why Media Chrome:** it is maintained, smaller, MIT-licensed and plain HTML elements. Its right-to-left gap is manageable: the controls are styled with our own CSS, and Hebrew labels are added as a custom language file.
- **Look at before deciding:** Video.js 10 (`@videojs/react` 10.6.0, Apache-2.0, released 2026-11-20). It is the official successor to both players, but it is a bigger bundle (about 91 KB gzip) and only weeks old, so check its right-to-left support and stability before choosing it.

## Packages added in Stage 4 part A (read 22 Nov 2026)

| Package | Version (pinned) | Why | What was checked |
|---|---|---|---|
| `@supabase/supabase-js` (+ its `auth-js`, `postgrest-js`, `realtime-js`, `storage-js`, `functions-js`) | 2.119.0 (released 4 Nov 2026) | The Supabase data layer (`src/data/supabase/`) | No install scripts in any of the six packages. The only hosts written in the code are documentation examples (`xyzcompany.supabase.co`, `example.com`); requests go only to the project URL we configure. No reading of environment variables except in the admin API's own docs. |
| `@electric-sql/pglite` | 0.5.15 (dev only, released 3 Nov 2026) | Real Postgres (18.6, WebAssembly) inside Vitest, to test the migrations and row-level security | No install scripts, no dependencies, no hard-coded hosts. Runs in memory. |

Not the newest versions on purpose: each was out at least two weeks.

## Packages added in Stage 4 part B2 (read 22 Nov 2026)

| Package | Version (pinned) | Why | What was checked |
|---|---|---|---|
| `react-email` | 6.11.8 (released 6 Nov 2026) | Email components and rendering (`src/emails/`) | Packed and read before installing (6.11.16), then 6.11.8 installed and scanned the same way. The components (`dist/components`, `dist/index.mjs`) make no network calls, read no environment variables and run no commands; `sideEffects: false`, so only the used components reach a bundle. The package also carries the `email` command-line preview tool and its dependencies (esbuild, socket.io, babel, tailwindcss): installed but never run. The older `@react-email/components` and single-component packages are marked deprecated on npm, so the maintained package is used. Installed with `--ignore-scripts`; the only install script in the tree is esbuild's own binary check. |
| `@react-email/render` | 2.2.0 (released 28 Oct 2026) | HTML and plain-text rendering (also a dependency of `react-email`, pinned so the version is ours) | No install scripts. Depends on `html-to-text`, `prettier`, `entities`, `html5parser`; no hosts in the code, no environment reading. |

Not installed: the `resend` SDK. The Resend transport (`src/emails/send.ts`) calls Resend's documented HTTP API with `fetch`, so the same code runs in Node and in a Supabase edge function. Both are at least two weeks old (the newest, 6.11.16 and 2.3.1, were read first and are the same code line).

## Package added in Stage 4 part B1 (read 22 Nov 2026)

| Package | Version (pinned) | Why | What was checked |
|---|---|---|---|
| `media-chrome` (+ its one dependency `ce-la-react` 0.3.2, BSD-3-Clause) | 4.19.4 (released 23 Oct 2026; 4.19.5 is under two weeks old) | The film player (`src/features/film/`), the verdict above | No install scripts in either package. No hard-coded hosts in the code. The only `fetch` is in `media-theme-element`, which loads a theme template from an address the page gives it (not used here). No storage or cookie access. Loaded only inside the signed-in app (a lazy chunk). |
