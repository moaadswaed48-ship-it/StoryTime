# Friends Island — source

This is the full source of the game that the site opens from its "play" doors (`public/play/friends-island/` is its build).
It is a remix of **Wigglewild by Patch** (https://patch.gg/games/blendi/wigglewild): code MIT (`LICENSE`), art CC0
(`LICENSE-ART`), credits in `CREDITS.md`. Keep those files and the credit line in the game.

- Never publish this folder to Patch: `patch.json`, `AGENTS.md` and `BRIEF.md` are the original's files, kept for reference.
- Build: `npm ci --ignore-scripts && npm run build`, then copy `dist/` to `../../public/play/friends-island/`
  (check `vite.config.ts` for the relative base before copying).
