# Game remix: findings from patch.gg (12 Nov 2026)

Owner's direction: not necessarily open-world; a remix of my choice from patch.gg, for ages 3–12.

## What patch.gg allows (its terms, read 12 Nov 2026)
- A game under the default "Patch licence" may be remixed **only on Patch**. Taking it, or a remix of it, to another
  site needs its maker's OK. StoryTime is another site, so those games are out.
- A game whose page states an open licence (MIT, CC BY, CC0) may be taken anywhere on that licence's terms.
- Mods/mashups of commercial games (the "…craft" ones, kart racers that imitate known brands) must stay free and on
  Patch, and copy other companies' characters. Not usable for a paid children's service.
- An account needs the owner to be 18+ and to sign in himself (Google/Discord/GitHub/email link).
- The asset library (50,000 models, textures, sounds) carries a licence and credit line per asset.

## Child-friendly games seen on Discover
| Game | What it is | Licence shown on its page | Usable off Patch? |
|---|---|---|---|
| **Wigglewild** (@blendi) | Build a creature, roam an island, make friends by singing/dancing/posing on a beat; creatures walk on procedural legs | **Code MIT, art CC0**, three.js | **Yes** |
| Terrarium (@blendi) | A tiny living world under glass: rain, seasons, animals with life stories, photo mode | not stated on the page | Not without checking / asking |
| Patchwork, Tidewater, Tiny Voxel, SuperTux | toy town, sea, voxel builder, platformer | not checked yet | unknown |
| Turbo Kart Rally | kart racer imitating a famous brand | — | No |

## Recommendation
Base: **Wigglewild** (MIT + CC0, same engine as StoryTime: three.js). Keep only the friendly half (greet, sing, dance,
make friends, feed, explore, collect); drop bite/charge/spit. Re-skin as an island the story characters visit; a few
missions open, the rest "coming soon"; progress saved in the child's profile. Borrow *ideas only* (no code) from
Terrarium: tending nature, weather, a field guide of creatures met.

## Needed before starting
1. Owner's yes to this choice.
2. Owner's yes to download Wigglewild's source from Patch (it is code from an outside source; I read it before running it).
3. Possibly the owner signed in to patch.gg, if the source is not downloadable without an account.

## Built (12 Nov 2026): Friends Island / جزيرة الأصدقاء
The remix exists. Source: `../game-src/wigglewild` (the downloaded Wigglewild, changed in place; `git diff` there shows
every change). Built files: `public/play/friends-island/`. Shown by `src/features/island` in a full-screen frame while
`overlay === 'game'`, so every "play" door opens it; the older yard game is still in `src/features/game` and opens
with `?game=yard`.

- Kept: the island, the procedural creatures, saying hello on a beat (sing, dance, smile, pose), fruit, friends that
  walk with you, a book of creatures met.
- Removed: bite, charge, strike, spit, the stomping giant, health, hunger, fainting, hunters, night, the Editor, the
  Lab, the Meadow sandbox, Patch's credits button.
- Added: six missions and four locked "coming soon" ones, saved progress per child profile, touch controls (a thumb
  stick, tap-to-go, big round buttons), Arabic first with English behind `?lang=en`, a simple "make your creature"
  sheet, credits ("built on Wigglewild by Patch, MIT/CC0") on the title card, in the menu and in About.
- To rebuild after a change: in `game-src/wigglewild` run `npm run build`, then copy `dist/` over
  `StoryTime/public/play/friends-island/`.
- Words: `game-src/wigglewild/src/i18n.ts` (the game is its own small app, so its words are not in `copy.ts`).
