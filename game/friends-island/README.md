---
kind: game
engine: three.js
---

> **This folder is Friends Island (جزيرة الأصدقاء), the StoryTime game: a remix of Wigglewild.**
> A gentle adventure for ages 3 to 12: hatch and name a creature, eat fruit, say hello on a beat to make friends,
> find hidden stars, meet the gentle giant. Six missions are playable and four are shown as "coming soon".
> Touch, keyboard and gamepad; Arabic (default) and English (`?lang=en`). No fighting, no health, nothing to fail.
> Run it with `npm ci --ignore-scripts`, then `npm run dev` (http://localhost:5183) or `npm run build` (makes `dist/`,
> which is copied into the StoryTime site at `public/play/friends-island/`).
> Words: `src/i18n.ts`. Missions: `src/missions.ts`. Saved progress: `src/save.ts`. Everything about playing: `src/play/`.
> It is not on Patch and must not be published there under the original's name: `patch.json` is the original's.
> The text below is the original Wigglewild README, kept for reference; the modes and controls it lists
> (Editor, Lab, Meadow, bite, charge, strike, spit) are not in this remix.

# Wigglewild

Play as a creature you built. Roam a living island of five species and a roaming giant: sing, dance, charm and pose to make friends, or bite, charge and spit to fight. Every part you add gives an ability, and every creature walks on its own procedural legs.

On Patch as `blendi/wigglewild`.

## How it's built

A browser game in TypeScript on [three.js](https://threejs.org), bundled by Vite into a folder of static files. There are no model, rig or animation files: every body is built from parts, meshed from a signed distance field, and walks by placing its feet with ray tests and inverse kinematics. The island, the plants and the effects are generated in code too. The only art files are CC0 sounds in `public/audio/`.

## Run it

It takes Node 20 or newer.

```sh
npm ci
npm run dev        # http://localhost:5173
npm run build      # makes dist/, the game as Patch serves it
npm run preview    # serves dist/ with the game host's headers, at http://localhost:8080
```

Controls: WASD to move, mouse to look (click the view), Shift to sprint, C to sneak, Space to jump, click to bite, right click to charge, R to strike, T to spit, F to interact, 1-4 to sing, dance, charm and pose, Tab for the Dex, H for the controls, Esc to pause. Gamepads work too in Play, from the title on: A or Start begins, Start pauses, the D-pad picks in the pause menu, A presses and B goes back, and a right-stick click calls creatures over. The editor, the Lab and the Meadow sandbox need a mouse.

Modes: Play (the island), Editor (build a creature and play as it), Lab (measurements, stats, genes, family tree), Dex (everything you've met), Meadow (a sandbox: hatch, mutate and breed).

`AGENTS.md` says how to check and change it, and where things live.

## Licence

The code is MIT ([LICENSE](LICENSE)). The art is CC0 1.0 ([LICENSE-ART](LICENSE-ART)): everything drawn is generated in code, and the sounds are CC0 recordings listed in [CREDITS.md](CREDITS.md). The libraries it bundles keep their own licences, in [LICENSES/](LICENSES).
