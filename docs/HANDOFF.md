# StoryTime: hand-off (13 Nov 2026)

Read this, then `CLAUDE.md` (rules) and `docs/AUDIT-2.md` (what is wrong, ranked, and the owner's open decisions).
`docs/SPEC.md` and `docs/PLAN-current.md` describe the first version and the 12 Nov morning plan: history only.

## Who and why
- **Owner:** Moaad. Not a developer. Wants the conclusion first, short plain answers, one question at a time, to be told
  when he is wrong. He shows the site on an iPhone.
- **The site:** a preview of a story service for **Sari's mother**, an educator who writes Arabic children's stories.
  The meeting with her was on 12 Nov; the live link was sent to her. Never contact her, never edit her text.

## Where things are
- **Repo:** `moaadswaed48-ship-it/StoryTime`, working branch **`laptop/landing-v2`** (`main` is only a README).
- **Live:** https://moaadswaed48-ship-it.github.io/StoryTime/ (branch `gh-pages`, published from `../storytime-pages`).
- **Outside the repo, on the laptop:** `..\keys.txt` (ElevenLabs key), `..\REQUIREMENTS.md` (the owner's ledger, R1–R32),
  `..\game-src\wigglewild` (the game's working copy; the source of record is now `game/friends-island/` in the repo).

## State of each part
| Part | State | Not done / not verified |
|---|---|---|
| Landing (`src/features/landing`) | New light/green look around the book-mountain hero; sign-in/up, parents' questions, how it works, plans, FAQ. | ~15 phone screens (owner once asked for shorter). Arabic copy not proofread by a native speaker. |
| App (home, story, tree, grown-ups, desk) | Works; still the first story's autumn look. Shelf has her story + 6 story ideas of ours. | Shelf covers blank in Safari's engine (AUDIT-2 B1, fix in progress 13 Nov). |
| Her story: book + listen | Narration = ElevenLabs Alice (`eleven_v4`); listen plays and turns pages (checked on the live site, WebKit + Chromium). | Free-plan audio: not licensed for commercial use. |
| Her story: film | `public/film/story.mp4`, 85 s, re-timed to the new voice (`video/scripts/timeline.mjs`). | Nobody has listened to it. |
| Moon story («نزهة على القمر») | Arabic text `src/content/stories/moon.ts` (our draft), shot list `docs/stories/moon-art.md`; code-drawn film `src/features/moonfilm`, scenes 4–9 and 11 (3:04), opened from the Moon book on the shelf. | Scenes 1, 2, 3, 10, 12 not made; no narration (no voice credits); not readable as a book; score unheard. |
| Game: Friends Island | Remix of Wigglewild (MIT/CC0), 6 missions + 4 locked, Arabic, touch controls; opened from every "play" door. | Has none of the story's characters (owner decision pending). Not tried on a real phone. |
| Tests | Type check + 61 unit tests pass. Playwright now has an `iphone-webkit` project. | The browser suite has not run since the landing rebuild; landing specs no longer match the page. |

## Owner decisions pending (see AUDIT-2)
1. Game: re-skin with Sari/Amir/Layla and story missions, or keep it standalone (the site's wording now says a "calm game" beside the story, not "the same heroes").
2. One art style for future stories (code-drawn) vs. her AI-painted book.
3. Keep or redraw the AI-made landing hero; the dedication «إلى كل طفل يحبّ أن يسأل» in her book (ours, not hers).
4. ElevenLabs: pay (Starter) and re-record, or remove the voice before any paid launch.

## Working on this laptop
- `npm install`, `npx playwright install chromium webkit`, `npm run dev` (http://localhost:5173).
- ffmpeg is installed via winget but not on the shell PATH: add
  `%LOCALAPPDATA%\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build\bin`.
- 8 GB of memory: one headless browser at a time; Windows killed the dev server once for low memory.
